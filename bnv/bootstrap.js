import dgram from 'dgram';

console.log('Starting bootstrap server...');

const PORT = 5000; // Port for the bootstrap server
const socket = dgram.createSocket('udp4');

// Optional: Store known peers (if needed)
const knownPeers = new Map();

socket.on('message', (msg, rinfo) => {
  console.log(`Received message from ${rinfo.address}:${rinfo.port}`);
  
  let data;
  try {
    data = JSON.parse(msg.toString());
  } catch (e) {
    console.error('Failed to parse message:', e);
    return;
  }
  
  console.log('Parsed message:', data);
  
  if (data.type === 'ping') {
    // Respond with a pong message
    const response = JSON.stringify({ type: 'pong', id: data.id });
    socket.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('Error sending pong message:', err);
      } else {
        console.log('Pong message sent to', rinfo.address, rinfo.port);
      }
    });
  } else if (data.type === 'register') {
    // Register a new peer
    knownPeers.set(data.id, { address: rinfo.address, port: rinfo.port });
    console.log(`Registered new peer ${data.id}`);
    
    // Respond with a list of known peers
    const peers = Array.from(knownPeers.entries()).map(([id, info]) => ({ id, ...info }));
    const response = JSON.stringify({ type: 'peers', peers });
    socket.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error('Error sending peers message:', err);
      } else {
        console.log('Peers message sent to', rinfo.address, rinfo.port);
      }
    });
  } else {
    console.warn('Unknown message type:', data.type);
  }
});

socket.bind(PORT, () => {
  console.log(`Bootstrap server listening on port ${PORT}`);
});
