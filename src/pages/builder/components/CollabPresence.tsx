/**
 * CollabPresence.tsx — FramePro Collaboration UI
 *
 * Muestra quién está editando en tiempo real:
 *   - Avatares apilados en el toolbar
 *   - Indicador de conexión (verde/rojo)
 *   - Panel de sesión con usuarios activos y link para invitar
 *   - Cursores coloreados sobre bloques que otro usuario está editando
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Users, Wifi, WifiOff, Copy, Check,
    Link, X, Circle, UserPlus
} from 'lucide-react';
import { CollabSession, CollabUser, createCollabSession } from '../framepro/collaboration';
import { SiteConfigV1 } from '@/modules/webBuilder/types';

// ─── Avatar ────────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ user: CollabUser; size?: number; showName?: boolean }> = ({
    user, size = 28, showName = false
}) => {
    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="relative group" title={user.name}>
            {user.avatarUrl ? (
                <img
                    src={user.avatarUrl}
                    alt={user.name}
                    style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${user.color}` }}
                />
            ) : (
                <div
                    style={{
                        width: size, height: size, borderRadius: '50%',
                        background: user.color, border: '2px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: size * 0.35, fontWeight: 900,
                    }}
                >
                    {initials}
                </div>
            )}
            {showName && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {user.name}
                </div>
            )}
        </div>
    );
};

// ─── Block Cursor Overlay ──────────────────────────────────────────────────────

export const BlockCursorOverlay: React.FC<{
    users: CollabUser[];
    blockId: string;
    currentPage: string;
}> = ({ users, blockId, currentPage }) => {
    const active = users.filter(u =>
        u.cursor?.blockId === blockId && u.cursor?.page === currentPage
    );
    if (active.length === 0) return null;

    return (
        <div className="absolute top-2 right-2 z-40 flex items-center gap-1 pointer-events-none">
            {active.map(u => (
                <div
                    key={u.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                    style={{ backgroundColor: u.color }}
                >
                    <Circle size={6} className="fill-white" />
                    {u.name.split(' ')[0]}
                </div>
            ))}
        </div>
    );
};

// ─── Collab Panel ──────────────────────────────────────────────────────────────

interface CollabPanelProps {
    session: CollabSession;
    users: CollabUser[];
    connected: boolean;
    onClose: () => void;
}

const CollabPanel: React.FC<CollabPanelProps> = ({ session, users, connected, onClose }) => {
    const [copied, setCopied] = useState(false);
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(session.roomId)}`;

    function copyInviteLink() {
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="absolute top-full right-0 mt-2 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl w-72 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span className="text-xs font-black">Sesión colaborativa</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-[9px] font-bold ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        {connected ? 'Online' : 'Reconectando…'}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* Users */}
            <div className="p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    {users.length} {users.length === 1 ? 'persona' : 'personas'} editando
                </p>
                <div className="space-y-2">
                    {users.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar user={u} size={32} />
                                {i === 0 && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">
                                    {u.name} {i === 0 ? <span className="text-slate-400 font-normal">(tú)</span> : ''}
                                </p>
                                {u.cursor?.blockId && (
                                    <p className="text-[9px] text-slate-400 truncate">
                                        ✏️ Editando en {u.cursor.page === '/' ? 'Inicio' : u.cursor.page}
                                    </p>
                                )}
                            </div>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: u.color }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite link */}
            <div className="px-4 pb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Invitar colaboradores</p>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Link size={12} className="text-slate-400 shrink-0" />
                    <p className="flex-1 text-[9px] text-slate-500 font-mono truncate">{inviteUrl}</p>
                    <button
                        onClick={copyInviteLink}
                        className={`shrink-0 p-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'}`}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-2">
                    Room: <code className="font-mono bg-slate-100 px-1 rounded">{session.roomId}</code>
                </p>
            </div>
        </div>
    );
};

// ─── CollabPresence (toolbar widget) ──────────────────────────────────────────

interface CollabPresenceProps {
    /** Room ID — typically the site slug */
    roomId: string;
    localUser: { id: string; name: string; avatarUrl?: string };
    config: SiteConfigV1;
    currentPage: string;
    selectedBlockId: string | null;
    wsUrl?: string;
    onRemoteUpdate: (config: SiteConfigV1, userId: string) => void;
}

export const CollabPresence: React.FC<CollabPresenceProps> = ({
    roomId, localUser, config, currentPage, selectedBlockId, wsUrl, onRemoteUpdate,
}) => {
    const sessionRef = useRef<CollabSession | null>(null);
    const [users, setUsers] = useState<CollabUser[]>([]);
    const [connected, setConnected] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    // Create session on mount
    useEffect(() => {
        const session = createCollabSession(roomId, localUser, wsUrl);
        sessionRef.current = session;

        const unsub1 = session.onUpdate((cfg, uid) => onRemoteUpdate(cfg, uid));
        const unsub2 = session.onAwareness(setUsers);
        const unsub3 = session.onConnectionChange(setConnected);

        return () => {
            unsub1(); unsub2(); unsub3();
            session.destroy();
            sessionRef.current = null;
        };
    }, [roomId]);

    // Push config changes to peers (debounced)
    const pushTimer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(() => {
            sessionRef.current?.pushConfig(config);
        }, 500);
        return () => clearTimeout(pushTimer.current);
    }, [config]);

    // Update cursor position
    useEffect(() => {
        sessionRef.current?.updateCursor(selectedBlockId, currentPage);
    }, [selectedBlockId, currentPage]);

    const peers = users.filter(u => u.id !== localUser.id);
    const MAX_AVATARS = 3;

    return (
        <div className="relative flex items-center gap-2">
            {/* Connection indicator */}
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} title={connected ? 'Conectado' : 'Reconectando…'} />

            {/* Stacked avatars */}
            <button
                onClick={() => setShowPanel(v => !v)}
                className="flex items-center"
            >
                <div className="flex -space-x-2">
                    {/* Local user */}
                    {users.find(u => u.id === localUser.id) && (
                        <Avatar user={users.find(u => u.id === localUser.id)!} size={26} showName />
                    )}
                    {/* Peers */}
                    {peers.slice(0, MAX_AVATARS).map(u => (
                        <Avatar key={u.id} user={u} size={26} showName />
                    ))}
                    {peers.length > MAX_AVATARS && (
                        <div className="w-[26px] h-[26px] rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-600">
                            +{peers.length - MAX_AVATARS}
                        </div>
                    )}
                </div>
                {peers.length === 0 && (
                    <div className="ml-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <UserPlus size={11} />
                        Invitar
                    </div>
                )}
            </button>

            {/* Panel */}
            {showPanel && sessionRef.current && (
                <>
                    <div className="fixed inset-0 z-[99]" onClick={() => setShowPanel(false)} />
                    <CollabPanel
                        session={sessionRef.current}
                        users={users}
                        connected={connected}
                        onClose={() => setShowPanel(false)}
                    />
                </>
            )}
        </div>
    );
};

// ─── useCollab hook ────────────────────────────────────────────────────────────

/**
 * Convenience hook — use this in WebsiteBuilder instead of CollabPresence
 * if you want more control.
 */
export function useCollab(options: {
    roomId: string;
    localUser: { id: string; name: string };
    enabled?: boolean;
    wsUrl?: string;
}) {
    const { roomId, localUser, enabled = true, wsUrl } = options;
    const sessionRef = useRef<CollabSession | null>(null);
    const [users, setUsers] = useState<CollabUser[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        const session = createCollabSession(roomId, localUser, wsUrl);
        sessionRef.current = session;
        const u1 = session.onAwareness(setUsers);
        const u2 = session.onConnectionChange(setConnected);
        return () => { u1(); u2(); session.destroy(); };
    }, [roomId, enabled]);

    return {
        session: sessionRef.current,
        users,
        connected,
        peers: users.filter(u => u.id !== localUser.id),
    };
}
