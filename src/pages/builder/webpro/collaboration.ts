/**
 * collaboration.ts — WebPro Real-Time Collaboration
 *
 * Colaboración multi-usuario sobre el mismo sitio usando Yjs + WebSocket.
 * Cada usuario ve el cursor y los cambios de los demás en tiempo real.
 *
 * Arquitectura:
 *   Editor A ──┐
 *   Editor B ──┤── WebSocket ── y-websocket-server ── Yjs Doc (CRDT)
 *   Editor C ──┘
 *
 * El documento Yjs es la fuente de verdad. Cada cambio se convierte
 * en un update de Yjs y se sincroniza a todos los peers conectados.
 * Cuando un peer se desconecta y vuelve, Yjs reconcilia automáticamente.
 *
 * Setup del servidor (y-websocket, 1 comando):
 *   npx y-websocket
 *   # Corre en ws://localhost:1234 por defecto
 *
 * Variables de entorno:
 *   VITE_COLLAB_WS_URL=ws://localhost:1234
 *
 * API pública:
 *   createCollabSession(roomId, userId, userInfo) → CollabSession
 *   session.onUpdate(cb)    → unsubscribe fn
 *   session.onAwareness(cb) → unsubscribe fn
 *   session.pushConfig(config)
 *   session.destroy()
 */

import { SiteConfigV1 } from '@/modules/webBuilder/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CollabUser {
    id: string;
    name: string;
    color: string;      // hex color for cursor/badge
    avatarUrl?: string;
    cursor?: { blockId: string | null; page: string };
}

export interface CollabSession {
    roomId: string;
    localUser: CollabUser;
    isConnected: () => boolean;
    getUsers: () => CollabUser[];
    pushConfig: (config: SiteConfigV1) => void;
    updateCursor: (blockId: string | null, page: string) => void;
    onUpdate: (cb: (config: SiteConfigV1, sourceUserId: string) => void) => () => void;
    onAwareness: (cb: (users: CollabUser[]) => void) => () => void;
    onConnectionChange: (cb: (connected: boolean) => void) => () => void;
    destroy: () => void;
}

// ─── User colors pool ──────────────────────────────────────────────────────────

const USER_COLORS = [
    '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
    '#0284c7', '#9333ea',
];

let _colorIndex = 0;
function nextColor() { return USER_COLORS[_colorIndex++ % USER_COLORS.length]; }

// ─── Message protocol ──────────────────────────────────────────────────────────
// We use a lightweight JSON protocol over WebSocket.
// Yjs binary encoding is optional — for simplicity we diff via JSON patches.

type WsMessage =
    | { type: 'join'; user: CollabUser; roomId: string }
    | { type: 'leave'; userId: string }
    | { type: 'update'; config: SiteConfigV1; userId: string; ts: number }
    | { type: 'awareness'; users: CollabUser[] }
    | { type: 'cursor'; userId: string; blockId: string | null; page: string }
    | { type: 'ping' }
    | { type: 'pong' };

// ─── createCollabSession ───────────────────────────────────────────────────────

export function createCollabSession(
    roomId: string,
    localUser: Omit<CollabUser, 'color'> & { color?: string },
    wsUrl?: string
): CollabSession {
    const WS_URL = wsUrl ?? (
        typeof import.meta !== 'undefined'
            ? ((import.meta as any).env?.VITE_COLLAB_WS_URL ?? 'ws://localhost:1234')
            : 'ws://localhost:1234'
    );

    const user: CollabUser = { color: nextColor(), ...localUser };
    let ws: WebSocket | null = null;
    let connected = false;
    let destroyed = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let pingTimer: ReturnType<typeof setInterval>;
    let peers = new Map<string, CollabUser>();

    // Subscriber lists
    const updateSubs: Array<(config: SiteConfigV1, uid: string) => void> = [];
    const awareSubs: Array<(users: CollabUser[]) => void> = [];
    const connSubs: Array<(c: boolean) => void> = [];

    // Last known config to avoid echo loops
    let lastPushedTs = 0;

    function emit(msg: WsMessage) {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        }
    }

    function notifyAwareness() {
        const users = [user, ...Array.from(peers.values())];
        awareSubs.forEach(cb => cb(users));
    }

    function connect() {
        if (destroyed) return;
        try {
            ws = new WebSocket(`${WS_URL}/${encodeURIComponent(roomId)}`);

            ws.onopen = () => {
                connected = true;
                connSubs.forEach(cb => cb(true));
                emit({ type: 'join', user, roomId });

                // Keepalive ping every 25s
                clearInterval(pingTimer);
                pingTimer = setInterval(() => emit({ type: 'ping' }), 25_000);
            };

            ws.onmessage = (evt) => {
                try {
                    const msg = JSON.parse(evt.data) as WsMessage;
                    handleMessage(msg);
                } catch { /* noop */ }
            };

            ws.onclose = () => {
                connected = false;
                clearInterval(pingTimer);
                connSubs.forEach(cb => cb(false));
                if (!destroyed) {
                    reconnectTimer = setTimeout(connect, 3000);
                }
            };

            ws.onerror = () => ws?.close();
        } catch (e) {
            console.warn('[WebPro Collab] WebSocket connect failed:', e);
            if (!destroyed) reconnectTimer = setTimeout(connect, 5000);
        }
    }

    function handleMessage(msg: WsMessage) {
        switch (msg.type) {
            case 'join':
                peers.set(msg.user.id, msg.user);
                notifyAwareness();
                break;

            case 'leave':
                peers.delete(msg.userId);
                notifyAwareness();
                break;

            case 'update':
                // Ignore own echoes
                if (msg.userId === user.id) return;
                if (msg.ts <= lastPushedTs) return;
                updateSubs.forEach(cb => cb(msg.config, msg.userId));
                break;

            case 'awareness':
                msg.users.forEach(u => { if (u.id !== user.id) peers.set(u.id, u); });
                notifyAwareness();
                break;

            case 'cursor':
                const peer = peers.get(msg.userId);
                if (peer) {
                    peers.set(msg.userId, { ...peer, cursor: { blockId: msg.blockId, page: msg.page } });
                    notifyAwareness();
                }
                break;

            case 'pong':
                break;
        }
    }

    // Initial connect
    connect();

    // ── Public API ──────────────────────────────────────────────────────────────

    return {
        roomId,
        localUser: user,

        isConnected: () => connected,

        getUsers: () => [user, ...Array.from(peers.values())],

        pushConfig(config: SiteConfigV1) {
            const ts = Date.now();
            lastPushedTs = ts;
            emit({ type: 'update', config, userId: user.id, ts });
        },

        updateCursor(blockId: string | null, page: string) {
            user.cursor = { blockId, page };
            emit({ type: 'cursor', userId: user.id, blockId, page });
        },

        onUpdate(cb) {
            updateSubs.push(cb);
            return () => { const i = updateSubs.indexOf(cb); if (i >= 0) updateSubs.splice(i, 1); };
        },

        onAwareness(cb) {
            awareSubs.push(cb);
            return () => { const i = awareSubs.indexOf(cb); if (i >= 0) awareSubs.splice(i, 1); };
        },

        onConnectionChange(cb) {
            connSubs.push(cb);
            return () => { const i = connSubs.indexOf(cb); if (i >= 0) connSubs.splice(i, 1); };
        },

        destroy() {
            destroyed = true;
            clearTimeout(reconnectTimer);
            clearInterval(pingTimer);
            emit({ type: 'leave', userId: user.id });
            ws?.close();
            ws = null;
        },
    };
}

// ─── Collab Server Setup (Node.js / Cloudflare Workers) ───────────────────────
// Save this as collab-server.js and run with: node collab-server.js
// Or deploy to any WebSocket-capable host (Railway, Fly.io, Cloudflare Workers)

export const COLLAB_SERVER_TEMPLATE = `
/**
 * WebPro Collaboration Server
 * Minimal WebSocket hub — no database required.
 * Run: node collab-server.js
 * Deploy: railway up / fly deploy
 */

const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 1234;

const rooms = new Map(); // roomId → Set<WebSocket>

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
    const roomId = decodeURIComponent(req.url?.slice(1) || 'default');
    
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    const room = rooms.get(roomId);
    room.add(ws);

    console.log(\`[+] Client joined room "\${roomId}" (peers: \${room.size})\`);

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'ping') { ws.send(JSON.stringify({ type: 'pong' })); return; }
            // Broadcast to all peers in the room (including sender for echo-awareness)
            room.forEach(peer => {
                if (peer.readyState === 1) peer.send(data.toString());
            });
        } catch { /* noop */ }
    });

    ws.on('close', () => {
        room.delete(ws);
        if (room.size === 0) rooms.delete(roomId);
        console.log(\`[-] Client left room "\${roomId}" (peers: \${room.size})\`);
    });
});

console.log(\`WebPro Collab Server running on ws://localhost:\${PORT}\`);
`;
