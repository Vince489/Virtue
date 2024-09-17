import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Relay signaling messages between peers
  socket.on('signal', (data) => {
    console.log('Forwarding signal data:', data);
    socket.broadcast.emit('signal', data); // Broadcast to all other clients
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error('Socket.IO Error:', error);
  });
});

server.listen(3000, () => {
  console.log('Signaling server listening on port 3000');
});
