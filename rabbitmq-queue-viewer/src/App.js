import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [responseMessage, setResponseMessage] = useState(null);

  // Fetch queues and their message counts
  useEffect(() => {
    async function fetchQueues() {
      try {
        const res = await fetch("http://localhost:3000/api/queues"); // Full URL to the backend
        const data = await res.json();
        console.log(data);
        setQueues(data);
      } catch (error) {
        console.error("Error fetching queues:", error);
      }
    }
    fetchQueues();
  }, []);

  // Handle "Go" button click
  const fetchQueueMessage = async () => {
    if (!selectedQueue) {
      alert("Please select a queue!");
      return;
    }
    try {
      const res = await fetch(`/api/${selectedQueue}`);
      if (res.status === 204) {
        setResponseMessage("No messages in the queue!");
      } else {
        const data = await res.json();
        setResponseMessage(`Message: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Error fetching queue message:", error);
      setResponseMessage("An error occurred.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">RabbitMQ Queue Viewer</header>
      <div className="container">
        <h3>Available Queues</h3>
        <div className="queue-list">
          {/* {queues.map((queue) => (
            <div key={queue.name} className="queue-item">
              <span>{queue.name}</span>
              <span>{queue.messages} messages</span>
            </div>
          ))} */}
        </div>

        <div className="select-queue">
          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
          >
            <option value="">Select a queue</option>
            {/* {queues.map((queue) => (
              <option key={queue.queue} value={queue.queue}>
                {queue.queue}
              </option>
            ))} */}
          </select>
          <button onClick={fetchQueueMessage}>Go</button>
        </div>

        {responseMessage && <div className="response">{responseMessage}</div>}
      </div>
    </div>
  );
}

export default App;
