import Node from './node.js'; // Import the Node class

// Initialize and start Node A
const nodeA = new Node('A', 6881);

// Example Usage: Broadcast data from nodeA after connections are established
setTimeout(() => {
    nodeA.broadcast('Hello from Node A to all peers');
}, 5000);
