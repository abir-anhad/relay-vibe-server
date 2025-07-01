const dg = require('dgram');

// Create UDP server
const server = dg.createSocket('udp4');
const PORT = 3030;

// Simple session store
const sessions = {};

// Listen to incoming messages (UDP only uses "message" event)
server.on("message", (msg, rinfo) => {

    console.log(`Received message: ${msg} from ${rinfo.address}:${rinfo.port}`);
    if (msg.length < 8) return;

    const sessionID = msg.readUInt32BE(4); // assuming 4-7 bytes represent sessionID
    const senderKey = `${rinfo.address}:${rinfo.port}`;

    if (!sessions[sessionID]) {
        sessions[sessionID] = new Set();
    }

    sessions[sessionID].add(senderKey);

    for (const peer of sessions[sessionID]) {
        if (peer === senderKey) continue;

        const [host, port] = peer.split(":");

        server.send(msg, 0, msg.length, Number(port), host, (err) => {
            if (err) console.error("Error forwarding message:", err);
        });
    }
});

// Optional: Log errors
server.on("error", (err) => {
    console.error("UDP Server Error:", err);
    server.close();
});

server.on("listening", () => {
    const address = server.address();
    console.log(`UDP relay listening on ${address.address}:${address.port}`);
});

server.bind(PORT, '0.0.0.0');
