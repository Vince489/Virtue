import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { rtcConfig } from './rtcConfig.js'; // Import the STUN server configuration

const socket = io('http://localhost:3000');

// Create a WebRTC peer connection
let peer = null;

// Handle signaling data from the server
socket.on('signal', (data) => {
  if (!peer) {
    // Initialize a new SimplePeer instance
    peer = new SimplePeer({
      initiator: false,
      config: rtcConfig,
      trickle: false
    });

    // Send signaling data to the server
    peer.on('signal', (signal) => {
      socket.emit('signal', { signal });
    });

    // Handle successful connection
    peer.on('connect', () => {
      console.log('Connected to peer');
    });

    // Handle incoming data
    peer.on('data', (data) => {
      console.log('Received data:', data.toString());
    });

    // Handle disconnection
    peer.on('close', () => {
      console.log('Connection closed');
    });
  }

  // Pass signaling data to the peer
  peer.signal(data.signal);
});

// Function to initiate connection to a peer
function connectToPeer() {
  if (!peer) {
    peer = new SimplePeer({
      initiator: true,
      config: rtcConfig,
      trickle: false
    });

    // Send signaling data to the server
    peer.on('signal', (signal) => {
      socket.emit('signal', { signal });
    });

    // Handle successful connection
    peer.on('connect', () => {
      console.log('Connected to peer');
    });

    // Handle incoming data
    peer.on('data', (data) => {
      console.log('Received data:', data.toString());
    });

    // Handle disconnection
    peer.on('close', () => {
      console.log('Connection closed');
    });
  }
}
