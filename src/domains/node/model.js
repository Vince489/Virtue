const io = require('socket.io-client');
const SimplePeer = require('simple-peer');
const DHT = require('bittorrent-dht');

class Node {
    constructor(id, port) {
        this.id = id;
        this.port = port || 6881; // Default DHT port
        this.socket = io('http://localhost:3000');
        this.peers = {}; // Active peer connections
        this.dht = new DHT();

        // STUN/TURN servers for NAT traversal
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server
                // Add a TURN server here if necessary
            ]
        };

        // Start the DHT and listen for new nodes
        this.dht.listen(this.port, () => {
            console.log(`Node ${this.id} listening on DHT port ${this.port}`);
        });

        // Find and announce self on the DHT
        this.dht.on('ready', () => {
            console.log(`Node ${this.id} DHT ready`);
            this.dht.announce(this.id, this.port, (err) => {
                if (err) console.error(err);
                console.log(`Node ${this.id} announced in DHT`);
            });
        });

        // Listen for DHT lookup responses (find other peers)
        this.dht.on('peer', (peer, infoHash, from) => {
            console.log(`Found peer ${peer.host}:${peer.port} from ${from.address}:${from.port}`);
            this.connectToPeer(peer.host); // Connect to the peer
        });

        // Manually lookup peers by ID
        this.dht.lookup(this.id);

        // Listen for new nodes joining
        this.socket.on('new-node', (peerId) => {
            console.log(`Node ${this.id} detected new node: ${peerId}`);
            this.connectToPeer(peerId); // Connect to the new node
        });

        // Handle signaling data
        this.socket.on('signal', (data) => {
            console.log(`Node ${this.id} received signal from ${data.from}`);
            if (!this.peers[data.from]) {
                this.createPeerConnection(data.from, false);
            }
            this.peers[data.from].signal(data.signal);
        });

        // Handle peer disconnections
        this.socket.on('node-disconnected', (peerId) => {
            console.log(`Node ${peerId} disconnected`);
            if (this.peers[peerId]) {
                this.peers[peerId].destroy();
                delete this.peers[peerId];
            }
        });
    }

    // Connect to a peer using WebRTC
    connectToPeer(peerId) {
        this.createPeerConnection(peerId, true);
    }

    // Create a WebRTC connection to a peer
    createPeerConnection(peerId, initiator) {
        const peer = new SimplePeer({
            initiator,
            config: this.rtcConfig,
            trickle: false // Disable trickle ICE
        });

        peer.on('signal', (signal) => {
            this.socket.emit('signal', {
                from: this.id,
                to: peerId,
                signal
            });
        });

        peer.on('connect', () => {
            console.log(`Node ${this.id} connected to ${peerId}`);
        });

        peer.on('data', (data) => {
            console.log(`Node ${this.id} received data from ${peerId}:`, data.toString());
        });

        peer.on('close', () => {
            console.log(`Node ${this.id} disconnected from ${peerId}`);
            delete this.peers[peerId];
        });

        this.peers[peerId] = peer;
    }

    // Send data to all connected peers
    broadcast(data) {
        Object.keys(this.peers).forEach(peerId => {
            this.peers[peerId].send(data);
        });
    }
}

// Example Usage:
const nodeA = new Node('A', 6881);
const nodeB = new Node('B', 6882);
const nodeC = new Node('C', 6883);

// Simulate sending broadcast data from Node A after connections are established
setTimeout(() => {
    nodeA.broadcast('Hello from Node A to all peers');
}, 5000);
