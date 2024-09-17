import DHT from 'bittorrent-dht';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

class Node {
    constructor(id, port = 6881) {
        this.id = id;
        this.port = port; // Default DHT port
        this.socket = io('http://localhost:3000'); // Socket server URL
        this.peers = {}; // Store peer connections

        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
                // Add TURN server here if needed
            ]
        };

        this.dht = new DHT({
            bootstrap: [
                'router.bittorrent.com:6881',
                'dht.transmissionbt.com:6881'
            ]
        });

        // Start listening on the DHT port
        this.dht.listen(this.port, () => {
            console.log(`Node ${this.id} listening on DHT port ${this.port}`);
        });

        // Handle errors separately
        this.dht.on('error', (err) => {
            console.error(`Error with DHT instance:`, err);
        });

        // Announce node on DHT
        this.dht.on('ready', () => {
            console.log(`Node ${this.id} DHT ready`);
            this.dht.announce(this.id, this.port, (err) => {
                if (err) console.error('Error announcing node:', err);
                else console.log(`Node ${this.id} announced on DHT`);
            });
        });

        // Listen for peers on DHT
        this.dht.on('peer', (peer, _infoHash, from) => {
            console.log(`Found peer ${peer.host}:${peer.port} from ${from.address}:${from.port}`);
            this.connectToPeer(peer.host); // Connect via WebRTC
        });

        // Look up peers in the DHT
        this.dht.lookup(this.id, (err) => {
            if (err) console.error('Error looking up node:', err);
            else console.log(`Node ${this.id} lookup complete`);
        });

        // Handle new nodes from socket signaling
        this.socket.on('new-node', (peerId) => {
            console.log(`Detected new node ${peerId}`);
            this.connectToPeer(peerId);
        });

        // Handle signaling data from peers
        this.socket.on('signal', (data) => {
            console.log(`Received signal from ${data.from}`);
            if (!this.peers[data.from]) {
                this.createPeerConnection(data.from, false); // Create peer connection if it doesn't exist
            }
            this.peers[data.from].signal(data.signal); // Send signaling data
        });

        // Handle peer disconnection
        this.socket.on('node-disconnected', (peerId) => {
            console.log(`Peer ${peerId} disconnected`);
            if (this.peers[peerId]) {
                this.peers[peerId].destroy();
                delete this.peers[peerId];
            }
        });
    }

    // Connect to a peer using WebRTC
    connectToPeer(peerId) {
        this.createPeerConnection(peerId, true); // Initiate the connection
    }

    // Create a WebRTC connection to a peer
    createPeerConnection(peerId, initiator) {
        const peer = new SimplePeer({
            initiator,
            config: this.rtcConfig, // Use ICE servers for WebRTC
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
            console.log(`Connected to peer ${peerId}`);
        });

        peer.on('data', (data) => {
            console.log(`Received data from ${peerId}:`, data.toString());
        });

        peer.on('close', () => {
            console.log(`Disconnected from ${peerId}`);
            delete this.peers[peerId];
        });

        peer.on('error', (err) => {
            console.error(`Error with peer ${peerId}:`, err);
        });

        this.peers[peerId] = peer;
    }

    // Broadcast data to all connected peers
    broadcast(data) {
        Object.keys(this.peers).forEach(peerId => {
            this.peers[peerId].send(data);
        });
    }
}

export default Node;
