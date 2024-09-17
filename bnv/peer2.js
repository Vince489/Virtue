import dgram from 'dgram';
import crypto from 'crypto';

const PORT = 5002;
const BOOTSTRAP_PORT = 5000;
const BOOTSTRAP_IP = '127.0.0.1';

const socket = dgram.createSocket('udp4');
const id = crypto.randomBytes(16).toString('hex');
const routingTable = new Map();

socket.on('message', (msg, rinfo) => {
  console.log(`Received message from ${rinfo.address}:${rinfo.port}`);
  
  let data;
  try {
    data = JSON.parse(msg.toString());
  } catch (e) {
    console.error('Failed to parse message:', e);
    return;
  }
  
  if (data.type === 'ping') {
    socket.send(JSON.stringify({ type: 'pong', id }), rinfo.port, rinfo.address);
  } else if (data.type === 'pong') {
    routingTable.set(data.id, { address: rinfo.address, port: rinfo.port });
  } else if (data.type === 'peers') {
    data.peers.forEach(peer => routingTable.set(peer.id, { address: peer.address, port: peer.port }));
    console.log('Updated routing table with peers:', routingTable);
  }
});

socket.bind(PORT, () => {
  console.log(`Peer ${id} listening on port ${PORT}`);
  socket.send(JSON.stringify({ type: 'register', id }), BOOTSTRAP_PORT, BOOTSTRAP_IP);
});

