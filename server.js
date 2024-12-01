require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const amqplib = require("amqplib");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const DEFAULT_TIMEOUT = 10000;

let connection, channel;

async function initializeRabbitMQ() {
  connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
}

app.post("/api/:queue_name", async (req, res) => {
  const { queue_name } = req.params;
  const message = req.body;

  try {
    await channel.assertQueue(queue_name);
    channel.sendToQueue(queue_name, Buffer.from(JSON.stringify(message)));
    res.status(200).json({ message: "Message added to queue" });
  } catch (error) {
    console.error("Error adding message to queue:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/:queue_name", async (req, res) => {
  const { queue_name } = req.params;
  const timeout = parseInt(req.query.timeout, 10) || DEFAULT_TIMEOUT;

  try {
    await channel.assertQueue(queue_name);
    const message = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeout);

      channel.consume(
        queue_name,
        (msg) => {
          clearTimeout(timer);
          resolve(msg);
          channel.ack(msg);
        },
        { noAck: false }
      );
    });

    if (message) {
      res.status(200).json(JSON.parse(message.content.toString()));
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error retrieving message from queue:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, async () => {
  try {
    await initializeRabbitMQ();
    console.log(`Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error("Failed to initialize RabbitMQ:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("Closing RabbitMQ connection...");
  await connection.close();
  process.exit(0);
});