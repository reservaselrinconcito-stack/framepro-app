/**
 * IntegrationsHub.tsx — FramePro Integrations UI
 */

import React, { useState, useCallback } from 'react';
import {
    X, Plus, Zap, CheckCircle2, XCircle, Clock,
    Play, Trash2, ChevronDown, ChevronUp, ExternalLink,
    ToggleLeft, ToggleRight, AlertCircle, Copy
} from 'lucide-react';
import {
    Integration, IntegrationService, SiteEvent,
    SERVICE_CONFIG, EVENT_LABELS,
    integrations as intAPI, GOOGLE_APPS_SCRIPT_TEMPLATE
} from '../framepro/integrations';

// ─── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status?: 'success' | 'error'; lastTriggered?: number }> = ({ status, lastTriggered }) => {
    if (!status) return <span className="text-[9px] text-slate-400 font-bold">Nunca disparado</span>;
    return (
        <div className="flex items-center gap-1.5">
            {status === 'success'
                ? <CheckCircle2 size={11} className="text-emerald-500" />
                : <XCircle size={11} className="text-red-400" />}
            <span className={`text-[9px] font-bold ${status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                {status === 'success' ? 'OK' : 'Error'}
            </span>
            {lastTriggered && (
                <span className="text-[9px] text-slate-400">
                    · {new Date(lastTriggered).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </span>
            )}
        </div>
    );
};

// ─── Integration Card ─────────────────────────────────────────────────────────

const IntegrationCard: React.FC<{
    integration: Integration;
    onUpdate: (patch: Partial<Integration>) => void;
    onDelete: () => void;
    onTest: () => Promise<void>;
    testing: boolean;
}> = ({ integration, onUpdate, onDelete, onTest, testing }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = SERVICE_CONFIG[integration.service];

    return (
        <div className={`border-2 rounded-2xl overflow-hidden transition-all ${integration.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-white cursor-pointer" onClick={() => setExpanded(v => !v)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-slate-100"
                    style={{ backgroundColor: cfg.color + '18' }}>
                    {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{integration.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-500">{cfg.label}</span>
                        <span className="text-slate-200">·</span>
                        <StatusBadge status={integration.lastStatus} lastTriggered={integration.lastTriggered} />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={e => { e.stopPropagation(); onUpdate({ enabled: !integration.enabled }); }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title={integration.enabled ? 'Desactivar' : 'Activar'}
                    >
                        {integration.enabled
                            ? <ToggleRight size={20} className="text-emerald-500" />
                            : <ToggleLeft size={20} />}
                    </button>
                    {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded */}
            {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                    {/* Events */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Eventos disparadores</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(EVENT_LABELS) as SiteEvent[]).map(ev => {
                                const active = integration.triggerEvents.includes(ev);
                                return (
                                    <button
                                        key={ev}
                                        onClick={() => onUpdate({
                                            triggerEvents: active
                                                ? integration.triggerEvents.filter(e => e !== ev)
                                                : [...integration.triggerEvents, ev]
                                        })}
                                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                                    >
                                        {EVENT_LABELS[ev]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Webhook URL */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Webhook URL</p>
                        <input
                            value={integration.webhookUrl}
                            onChange={e => onUpdate({ webhookUrl: e.target.value })}
                            placeholder={cfg.webhookPlaceholder}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-400 bg-white"
                        />
                    </div>

                    {/* Body template (optional) */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Body personalizado <span className="font-normal normal-case">(opcional, JSON con {'{{campo}}'} placeholders)</span>
                        </p>
                        <textarea
                            value={integration.bodyTemplate ?? ''}
                            onChange={e => onUpdate({ bodyTemplate: e.target.value || undefined })}
                            placeholder={'{\n  "email": "{{email}}",\n  "name": "{{name}}"\n}'}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-400 bg-white resize-none"
                        />
                    </div>

                    {/* Error info */}
                    {integration.lastStatus === 'error' && integration.lastError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-600 font-mono">{integration.lastError}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={onTest}
                            disabled={testing || !integration.webhookUrl}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {testing ? <Clock size={11} className="animate-spin" /> : <Play size={11} />}
                            {testing ? 'Enviando…' : 'Probar ahora'}
                        </button>
                        <a href={cfg.docsUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-50">
                            <ExternalLink size={11} /> Docs
                        </a>
                        <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-100 text-red-500 rounded-xl text-xs font-black hover:bg-red-50 ml-auto">
                            <Trash2 size={11} /> Eliminar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Add Integration form ─────────────────────────────────────────────────────

const AddIntegrationForm: React.FC<{
    siteSlug: string;
    onAdd: (i: Integration) => void;
    onCancel: () => void;
}> = ({ siteSlug, onAdd, onCancel }) => {
    const [service, setService] = useState<IntegrationService>('zapier');
    const [name, setName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [events, setEvents] = useState<SiteEvent[]>(['form_submit']);

    function handleAdd() {
        if (!webhookUrl) return;
        const item = intAPI.create(siteSlug, {
            name: name || `${SERVICE_CONFIG[service].label} · ${siteSlug}`,
            service, webhookUrl, triggerEvents: events,
        });
        onAdd(item);
    }

    const cfg = SERVICE_CONFIG[service];

    return (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-4">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Nueva integración</p>

            {/* Service grid */}
            <div className="grid grid-cols-5 gap-2">
                {(Object.keys(SERVICE_CONFIG) as IntegrationService[]).map(s => {
                    const c = SERVICE_CONFIG[s];
                    return (
                        <button
                            key={s}
                            onClick={() => { setService(s); setWebhookUrl(''); setName(''); }}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${service === s ? 'border-indigo-500 bg-white' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                        >
                            <span className="text-lg">{c.emoji}</span>
                            <span className="text-[8px] font-bold text-slate-600 text-center leading-tight">{c.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-bold">{cfg.label}:</span> {cfg.description}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre</p>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder={`${cfg.label} · contactos`}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 bg-white" />
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Webhook URL *</p>
                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder={cfg.webhookPlaceholder}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-400 bg-white" />
                </div>
            </div>

            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Eventos</p>
                <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(EVENT_LABELS) as SiteEvent[]).map(ev => {
                        const active = events.includes(ev);
                        return (
                            <button key={ev} onClick={() => setEvents(es => active ? es.filter(e => e !== ev) : [...es, ev])}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                {EVENT_LABELS[ev]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Google Sheets helper */}
            {service === 'google_sheets' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Apps Script necesario</p>
                    <p className="text-[10px] text-emerald-700 mb-2">Pega este código en script.google.com y despliégalo como Web App.</p>
                    <button onClick={() => navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black">
                        <Copy size={10} /> Copiar script
                    </button>
                </div>
            )}

            <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!webhookUrl}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 disabled:opacity-40">
                    Añadir integración
                </button>
                <button onClick={onCancel} className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-black text-xs hover:bg-slate-50">
                    Cancelar
                </button>
            </div>
        </div>
    );
};

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export const IntegrationsHub: React.FC<{ siteSlug: string; onClose: () => void }> = ({ siteSlug, onClose }) => {
    const [items, setItems] = useState<Integration[]>(() => intAPI.getAll(siteSlug));
    const [showAdd, setShowAdd] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);

    const refresh = () => setItems(intAPI.getAll(siteSlug));

    function handleAdd(item: Integration) { setItems(all => [...all, item]); setShowAdd(false); }

    function handleUpdate(id: string, patch: Partial<Integration>) {
        intAPI.update(siteSlug, id, patch); refresh();
    }

    function handleDelete(id: string) {
        if (!window.confirm('¿Eliminar esta integración?')) return;
        intAPI.delete(siteSlug, id); refresh();
    }

    async function handleTest(integration: Integration) {
        setTestingId(integration.id);
        await intAPI.test(integration);
        refresh();
        setTestingId(null);
    }

    const activeCount = items.filter(i => i.enabled).length;

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center">
                        <Zap size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-900">Integraciones</h1>
                        <p className="text-[10px] text-slate-400">{items.length} configuradas · {activeCount} activas</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700">
                        <Plus size={16} /> Conectar servicio
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500"><X size={18} /></button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-4">
                {showAdd && (
                    <AddIntegrationForm
                        siteSlug={siteSlug}
                        onAdd={handleAdd}
                        onCancel={() => setShowAdd(false)}
                    />
                )}

                {items.length === 0 && !showAdd ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Zap size={48} className="mb-4 opacity-20" />
                        <p className="font-black text-lg text-slate-600 mb-2">Sin integraciones</p>
                        <p className="text-sm">Conecta Zapier, Make, Slack y más para automatizar tu flujo de trabajo</p>
                    </div>
                ) : (
                    items.map(item => (
                        <IntegrationCard
                            key={item.id}
                            integration={item}
                            onUpdate={patch => handleUpdate(item.id, patch)}
                            onDelete={() => handleDelete(item.id)}
                            onTest={() => handleTest(item)}
                            testing={testingId === item.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
