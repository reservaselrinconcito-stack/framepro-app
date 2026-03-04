/**
 * collab-server.js — FramePro Collaboration Server
 *
 * Servidor WebSocket mínimo para colaboración en tiempo real.
 * Sin base de datos — todo en memoria.
 *
 * Instalación:
 *   npm install ws
 *
 * Arrancar:
 *   node collab-server.js
 *   # Corre en ws://localhost:1234
 *
 * Deploy en Railway (gratis):
 *   railway login && railway init && railway up
 *
 * Deploy en Fly.io:
 *   fly launch --name framepro-collab
 *   fly deploy
 *
 * Variables de entorno:
 *   PORT=1234          (default)
 *   MAX_ROOM_SIZE=20   (max users per room, default 20)
 *   CORS_ORIGIN=*      (allowed origins, default *)
 */

const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const PORT = parseInt(process.env.PORT || '1234');
const MAX_ROOM_SIZE = parseInt(process.env.MAX_ROOM_SIZE || '20');

// ── Room state ─────────────────────────────────────────────────────────────────

/** @type {Map<string, Set<WebSocket>>} */
const rooms = new Map();

/** @type {Map<WebSocket, { roomId: string, userId: string, joinedAt: number }>} */
const clients = new Map();

// ── Stats ──────────────────────────────────────────────────────────────────────

const stats = {
    totalConnections: 0,
    totalMessages: 0,
    startedAt: Date.now(),
};

// ── HTTP server (health check) ─────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        const roomStats = Array.from(rooms.entries()).map(([id, set]) => ({
            id,
            peers: set.size,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            uptime: Math.round((Date.now() - stats.startedAt) / 1000),
            totalConnections: stats.totalConnections,
            totalMessages: stats.totalMessages,
            activeRooms: rooms.size,
            rooms: roomStats,
        }));
    } else {
        res.writeHead(404);
        res.end('FramePro Collab Server — visit /health for stats');
    }
});

// ── WebSocket server ───────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    stats.totalConnections++;

    // Extract room from URL path: ws://host/roomId
    const roomId = decodeURIComponent((req.url || '/default').slice(1)) || 'default';

    // Room capacity check
    const room = rooms.get(roomId) ?? new Set();
    if (room.size >= MAX_ROOM_SIZE) {
        ws.close(1008, 'Room is full');
        return;
    }

    rooms.set(roomId, room);
    room.add(ws);
    clients.set(ws, { roomId, userId: null, joinedAt: Date.now() });

    console.log(`[+] Client connected to room "${roomId}" (peers: ${room.size})`);

    ws.on('message', (data) => {
        stats.totalMessages++;

        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            return;
        }

        // Handle ping locally
        if (msg.type === 'ping') {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'pong' }));
            return;
        }

        // Track userId on join
        if (msg.type === 'join' && msg.user?.id) {
            const meta = clients.get(ws);
            if (meta) meta.userId = msg.user.id;
        }

        // Broadcast to all peers in room (including sender for awareness sync)
        const payload = data.toString();
        let delivered = 0;
        room.forEach(peer => {
            if (peer.readyState === WebSocket.OPEN) {
                peer.send(payload);
                delivered++;
            }
        });

        // Debug large payloads (config updates)
        if (msg.type === 'update' && payload.length > 10_000) {
            console.log(`[~] Large config update in "${roomId}": ${payload.length} bytes → ${delivered} peers`);
        }
    });

    ws.on('close', () => {
        const meta = clients.get(ws);
        clients.delete(ws);

        if (meta) {
            const { roomId, userId } = meta;
            const room = rooms.get(roomId);
            if (room) {
                room.delete(ws);
                if (room.size === 0) {
                    rooms.delete(roomId);
                    console.log(`[x] Room "${roomId}" closed (empty)`);
                } else {
                    // Broadcast leave to remaining peers
                    if (userId) {
                        const leaveMsg = JSON.stringify({ type: 'leave', userId });
                        room.forEach(peer => {
                            if (peer.readyState === WebSocket.OPEN) peer.send(leaveMsg);
                        });
                    }
                    console.log(`[-] Client left room "${roomId}" (peers: ${room.size})`);
                }
            }
        }
    });

    ws.on('error', (err) => {
        console.error(`[!] WebSocket error:`, err.message);
    });
});

// ── Start ──────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║     FramePro Collaboration Server             ║
╠═══════════════════════════════════════════════╣
║  WebSocket : ws://localhost:${PORT.toString().padEnd(17)}║
║  Health    : http://localhost:${PORT}/health${' '.repeat(Math.max(0, 13 - PORT.toString().length))}║
║  Max users : ${MAX_ROOM_SIZE.toString().padEnd(31)}║
╚═══════════════════════════════════════════════╝
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    wss.close();
    server.close();
    process.exit(0);
});
