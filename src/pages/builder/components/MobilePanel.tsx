/**
 * MobilePanel.tsx — FramePro Mobile & Push UI
 * Generador de app móvil + gestión de campañas push.
 */

import React, { useState } from 'react';
import {
    X, Smartphone, Bell, Download, Plus, Trash2,
    Check, Send, Zap, Globe, Shield, ChevronRight,
    ToggleLeft, ToggleRight, PlayCircle
} from 'lucide-react';
import {
    AppConfig, generateMobileFiles, downloadMobileZip,
    getAppConfig, saveAppConfig
} from '../framepro/mobile-app';
import {
    PushCampaign, pushNotifications
} from '../framepro/push-notifications';
import { SiteConfigV1 } from '@/modules/webBuilder/types';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'app' | 'push';

// ─── Field helpers ────────────────────────────────────────────────────────────

const F: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {children}
    </div>
);
const I: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 bg-white" />
);

// ─── App Config Form ──────────────────────────────────────────────────────────

const AppConfigForm: React.FC<{
    siteSlug: string;
    siteConfig: SiteConfigV1;
    onDownload: () => void;
}> = ({ siteSlug, siteConfig, onDownload }) => {
    const defaultCfg: AppConfig = {
        appId: `com.${siteSlug.replace(/[^a-z0-9]/g, '')}.app`,
        appName: siteConfig.globalData.brandName || 'Mi App',
        appDescription: siteConfig.pages['/']?.description ?? '',
        appVersion: '1.0.0',
        buildNumber: 1,
        iconUrl: '',
        primaryColor: siteConfig.theme?.colors?.primary ?? '#4f46e5',
        backgroundColor: '#ffffff',
        siteUrl: `https://${siteSlug}.framepro.app`,
        platforms: ['pwa', 'android', 'ios'],
        enablePush: true,
        enableCamera: false,
        enableGeolocation: false,
        orientation: 'portrait',
    };

    const [cfg, setCfg] = useState<AppConfig>(() => getAppConfig(siteSlug) ?? defaultCfg);
    const [generated, setGenerated] = useState(false);

    const set = (key: keyof AppConfig, val: any) => setCfg(c => ({ ...c, [key]: val }));
    const togglePlat = (p: 'pwa' | 'android' | 'ios') =>
        set('platforms', cfg.platforms.includes(p) ? cfg.platforms.filter(x => x !== p) : [...cfg.platforms, p]);

    function handleGenerate() {
        saveAppConfig(siteSlug, cfg);
        downloadMobileZip(cfg, siteConfig);
        setGenerated(true);
        onDownload();
    }

    const files = generateMobileFiles(cfg, siteConfig);

    return (
        <div className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
                <F label="Nombre de la app"><I value={cfg.appName} onChange={v => set('appName', v)} /></F>
                <F label="App ID (bundle)"><I value={cfg.appId} onChange={v => set('appId', v)} placeholder="com.empresa.app" /></F>
                <F label="Versión"><I value={cfg.appVersion} onChange={v => set('appVersion', v)} placeholder="1.0.0" /></F>
                <F label="URL del sitio publicado"><I value={cfg.siteUrl} onChange={v => set('siteUrl', v)} placeholder="https://midominio.com" /></F>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
                <F label="Color primario">
                    <div className="flex items-center gap-2">
                        <input type="color" value={cfg.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                            className="h-9 w-14 rounded-xl border border-slate-200 cursor-pointer shrink-0" />
                        <code className="text-xs text-slate-600">{cfg.primaryColor}</code>
                    </div>
                </F>
                <F label="Color de fondo">
                    <div className="flex items-center gap-2">
                        <input type="color" value={cfg.backgroundColor} onChange={e => set('backgroundColor', e.target.value)}
                            className="h-9 w-14 rounded-xl border border-slate-200 cursor-pointer shrink-0" />
                        <code className="text-xs text-slate-600">{cfg.backgroundColor}</code>
                    </div>
                </F>
            </div>

            {/* Platforms */}
            <F label="Plataformas">
                <div className="flex gap-2">
                    {(['pwa', 'android', 'ios'] as const).map(p => (
                        <button key={p} onClick={() => togglePlat(p)}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${cfg.platforms.includes(p) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                            <span className="text-xl">{p === 'pwa' ? '🌐' : p === 'android' ? '🤖' : '🍎'}</span>
                            <span className="text-[10px] font-black text-slate-700 uppercase">{p}</span>
                            {cfg.platforms.includes(p) && <Check size={12} className="text-indigo-600" />}
                        </button>
                    ))}
                </div>
            </F>

            {/* Permissions */}
            <F label="Permisos nativos">
                <div className="space-y-2">
                    {[
                        { key: 'enablePush' as const, label: '🔔 Notificaciones push', desc: 'Envía mensajes aunque la app esté cerrada' },
                        { key: 'enableCamera' as const, label: '📷 Cámara', desc: 'Acceso a cámara del dispositivo' },
                        { key: 'enableGeolocation' as const, label: '📍 Geolocalización', desc: 'Ubicación del usuario' },
                    ].map(perm => (
                        <div key={perm.key} onClick={() => set(perm.key, !cfg[perm.key])}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${cfg[perm.key] ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-800">{perm.label}</p>
                                <p className="text-[9px] text-slate-500">{perm.desc}</p>
                            </div>
                            {cfg[perm.key]
                                ? <ToggleRight size={20} className="text-emerald-500 shrink-0" />
                                : <ToggleLeft size={20} className="text-slate-300 shrink-0" />}
                        </div>
                    ))}
                </div>
            </F>

            {/* Files preview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Archivos que se generan</p>
                <div className="space-y-1.5">
                    {files.map(f => (
                        <div key={f.path} className="flex items-center gap-2">
                            <code className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{f.path}</code>
                            <span className="text-[9px] text-slate-400">{f.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <button onClick={handleGenerate}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                <Download size={18} />
                {generated ? '✅ Descargado · Volver a descargar' : 'Generar y descargar archivos'}
            </button>

            {generated && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <p className="text-xs font-black text-emerald-700 mb-2">¿Qué hacer ahora?</p>
                    <ol className="text-xs text-emerald-700 space-y-1 list-decimal ml-4">
                        <li>Sube los archivos a la raíz de tu sitio publicado</li>
                        <li>Añade el <code className="bg-emerald-100 px-1 rounded">manifest.json</code> al HTML exportado</li>
                        <li>Registra el service worker <code className="bg-emerald-100 px-1 rounded">sw.js</code></li>
                        <li>Para app nativa: <code className="bg-emerald-100 px-1 rounded">npm install && npx cap sync</code></li>
                        <li>Lee el <code className="bg-emerald-100 px-1 rounded">README_MOBILE.md</code> para el resto</li>
                    </ol>
                </div>
            )}
        </div>
    );
};

// ─── Push Campaigns ───────────────────────────────────────────────────────────

const PushPanel: React.FC<{ siteSlug: string }> = ({ siteSlug }) => {
    const [campaigns, setCampaigns] = useState<PushCampaign[]>(() => pushNotifications.getCampaigns(siteSlug));
    const [composing, setComposing] = useState(false);
    const [draft, setDraft] = useState({ title: '', body: '', actionUrl: '', tag: '' });
    const [sending, setSending] = useState(false);

    const hasPushConfig = !!(
        (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY &&
        (import.meta as any).env?.VITE_PUSH_API_URL
    );

    const refresh = () => setCampaigns(pushNotifications.getCampaigns(siteSlug));

    async function handleSend() {
        if (!draft.title || !draft.body) return;
        setSending(true);
        if (!hasPushConfig) {
            // Demo mode
            const c: PushCampaign = {
                id: `push-${Date.now()}`,
                siteSlug, ...draft,
                status: 'sent', sentAt: Date.now(), subscriberCount: Math.floor(Math.random() * 200 + 50),
            };
            pushNotifications.saveCampaign(siteSlug, c);
            refresh();
            setComposing(false);
            setDraft({ title: '', body: '', actionUrl: '', tag: '' });
        } else {
            const apiUrl = (import.meta as any).env.VITE_PUSH_API_URL;
            const vapidKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;
            await pushNotifications.sendCampaign(siteSlug, draft, { vapidPublicKey: vapidKey, subscriptionEndpoint: `${apiUrl}/api/push/subscribe`, sendEndpoint: `${apiUrl}/api/push/send` });
            refresh();
            setComposing(false);
        }
        setSending(false);
    }

    return (
        <div className="space-y-4">
            {!hasPushConfig && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700">
                        <p className="font-black mb-1">Modo demo</p>
                        <p>Para enviar notificaciones reales configura <code className="bg-amber-100 px-1 rounded">VITE_VAPID_PUBLIC_KEY</code> y <code className="bg-amber-100 px-1 rounded">VITE_PUSH_API_URL</code> en tu <code className="bg-amber-100 px-1 rounded">.env</code>. En modo demo las campañas se guardan localmente.</p>
                    </div>
                </div>
            )}

            {!composing ? (
                <button onClick={() => setComposing(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-violet-200 text-violet-600 rounded-2xl font-black text-xs hover:bg-violet-50 transition-colors">
                    <Plus size={14} /> Nueva campaña push
                </button>
            ) : (
                <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-2xl space-y-3">
                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Nueva notificación</p>
                    <F label="Título"><I value={draft.title} onChange={v => setDraft(d => ({...d, title: v}))} placeholder="¡Novedad importante!" /></F>
                    <F label="Mensaje">
                        <textarea value={draft.body} onChange={e => setDraft(d => ({...d, body: e.target.value}))} rows={2} placeholder="El contenido de tu notificación…"
                            className="w-full px-3 py-2 border border-violet-200 rounded-xl text-xs focus:outline-none focus:border-violet-500 bg-white resize-none" />
                    </F>
                    <div className="grid grid-cols-2 gap-3">
                        <F label="URL destino"><I value={draft.actionUrl} onChange={v => setDraft(d => ({...d, actionUrl: v}))} placeholder="https://…" /></F>
                        <F label="Tag (agrup.)"><I value={draft.tag} onChange={v => setDraft(d => ({...d, tag: v}))} placeholder="promo-verano" /></F>
                    </div>
                    {/* Preview */}
                    {(draft.title || draft.body) && (
                        <div className="p-3 bg-slate-800 rounded-xl flex items-start gap-2.5">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg shrink-0" />
                            <div>
                                <p className="text-white text-xs font-bold">{draft.title || 'Título'}</p>
                                <p className="text-slate-400 text-[10px] mt-0.5">{draft.body || 'Mensaje…'}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={handleSend} disabled={sending || !draft.title || !draft.body}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black hover:bg-violet-700 disabled:opacity-40">
                            {sending ? <PlayCircle size={12} className="animate-spin" /> : <Send size={12} />}
                            {sending ? 'Enviando…' : hasPushConfig ? 'Enviar a suscriptores' : 'Guardar (demo)'}
                        </button>
                        <button onClick={() => setComposing(false)} className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-50">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Campaign history */}
            {campaigns.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Campañas enviadas</p>
                    {[...campaigns].reverse().map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                            <Bell size={14} className="text-violet-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">{c.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-slate-400">{c.sentAt ? new Date(c.sentAt).toLocaleDateString('es') : ''}</span>
                                    {c.subscriberCount !== undefined && (
                                        <span className="text-[9px] font-bold text-emerald-600">✓ {c.subscriberCount} enviados</span>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => { pushNotifications.deleteCampaign(siteSlug, c.id); refresh(); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const MobilePanel: React.FC<{
    siteSlug: string;
    siteConfig: SiteConfigV1;
    onClose: () => void;
}> = ({ siteSlug, siteConfig, onClose }) => {
    const [tab, setTab] = useState<Tab>('app');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[201] bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center">
                            <Smartphone size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900">Mobile</h2>
                            <p className="text-[10px] text-slate-400">App & notificaciones push</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500"><X size={18} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 shrink-0">
                    {([
                        { id: 'app' as Tab, label: '📱 App móvil' },
                        { id: 'push' as Tab, label: '🔔 Push' },
                    ]).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex-1 py-3 text-xs font-black transition-all ${tab === t.id ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {tab === 'app' && <AppConfigForm siteSlug={siteSlug} siteConfig={siteConfig} onDownload={() => {}} />}
                    {tab === 'push' && <PushPanel siteSlug={siteSlug} />}
                </div>
            </div>
        </div>
    );
};
