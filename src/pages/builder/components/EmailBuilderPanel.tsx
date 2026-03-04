/**
 * EmailBuilder.tsx — FramePro Email Builder UI
 *
 * Editor visual de emails con:
 *   - Lista de emails del sitio
 *   - Canvas con bloques arrastrables
 *   - Inspector de propiedades
 *   - Preview en iframe responsive
 *   - Export HTML + descarga
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    X, Plus, Download, Eye, Mail, Trash2, Edit3,
    Move, ChevronUp, ChevronDown, Copy, Save,
    Smartphone, Monitor, ArrowLeft, Layers
} from 'lucide-react';
import {
    EmailTemplate, EmailBlock, EmailBlockType,
    createEmailTemplate, createEmailBlock,
    EMAIL_PRESETS, buildEmail, downloadEmail, previewEmail,
    emailStore
} from '../framepro/email-builder';

// ─── Block type config ─────────────────────────────────────────────────────────

const BLOCK_TYPES: Array<{ type: EmailBlockType; label: string; emoji: string }> = [
    { type: 'header',  label: 'Cabecera',  emoji: '🏷️' },
    { type: 'hero',    label: 'Hero',      emoji: '🖼️' },
    { type: 'text',    label: 'Texto',     emoji: '📝' },
    { type: 'button',  label: 'Botón CTA', emoji: '🎯' },
    { type: 'image',   label: 'Imagen',    emoji: '🌄' },
    { type: 'columns', label: '2 Columnas',emoji: '⊞' },
    { type: 'divider', label: 'Divisor',   emoji: '─' },
    { type: 'spacer',  label: 'Espacio',   emoji: '↕️' },
    { type: 'footer',  label: 'Pie',       emoji: '📫' },
];

// ─── Simple field renderer ─────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {children}
    </div>
);

const Input: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ value, onChange, placeholder, type = 'text' }) => (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 bg-white" />
);

const Textarea: React.FC<{ value: string; onChange: (v: string) => void; rows?: number }> = ({ value, onChange, rows = 3 }) => (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 bg-white resize-none" />
);

// ─── Block inspector ──────────────────────────────────────────────────────────

const BlockInspector: React.FC<{ block: EmailBlock; onChange: (data: Record<string, any>) => void }> = ({ block, onChange }) => {
    const d = block.data;
    const set = (key: string, val: any) => onChange({ ...d, [key]: val });

    switch (block.type) {
        case 'header':
            return <div className="space-y-3">
                <Field label="URL del logo"><Input value={d.logoUrl} onChange={v => set('logoUrl', v)} placeholder="https://…/logo.png" /></Field>
                <Field label="Texto alternativo"><Input value={d.logoAlt} onChange={v => set('logoAlt', v)} /></Field>
                <Field label="Ancho logo (px)"><Input type="number" value={d.logoWidth} onChange={v => set('logoWidth', parseInt(v))} /></Field>
                <Field label="Color fondo"><input type="color" value={d.backgroundColor} onChange={e => set('backgroundColor', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
            </div>;

        case 'hero':
            return <div className="space-y-3">
                <Field label="Título"><Input value={d.headline} onChange={v => set('headline', v)} /></Field>
                <Field label="Subtítulo"><Textarea value={d.subheadline} onChange={v => set('subheadline', v)} rows={2} /></Field>
                <Field label="Texto CTA"><Input value={d.ctaLabel} onChange={v => set('ctaLabel', v)} /></Field>
                <Field label="URL CTA"><Input value={d.ctaUrl} onChange={v => set('ctaUrl', v)} type="url" /></Field>
                <Field label="Color CTA"><input type="color" value={d.ctaColor} onChange={e => set('ctaColor', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
                <Field label="URL imagen"><Input value={d.imageUrl} onChange={v => set('imageUrl', v)} /></Field>
                <Field label="Alineación">
                    <select value={d.textAlign} onChange={e => set('textAlign', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-white">
                        {['left','center','right'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </Field>
            </div>;

        case 'text':
            return <div className="space-y-3">
                <Field label="Contenido HTML"><Textarea value={d.content} onChange={v => set('content', v)} rows={5} /></Field>
                <Field label="Tamaño fuente"><Input value={d.fontSize} onChange={v => set('fontSize', v)} placeholder="16px" /></Field>
                <Field label="Color texto"><input type="color" value={d.color} onChange={e => set('color', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
            </div>;

        case 'button':
            return <div className="space-y-3">
                <Field label="Texto"><Input value={d.label} onChange={v => set('label', v)} /></Field>
                <Field label="URL"><Input value={d.url} onChange={v => set('url', v)} type="url" /></Field>
                <Field label="Color fondo"><input type="color" value={d.backgroundColor} onChange={e => set('backgroundColor', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
                <Field label="Color texto"><input type="color" value={d.textColor} onChange={e => set('textColor', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
                <Field label="Alineación">
                    <select value={d.align} onChange={e => set('align', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-white">
                        {['left','center','right'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </Field>
            </div>;

        case 'image':
            return <div className="space-y-3">
                <Field label="URL imagen"><Input value={d.url} onChange={v => set('url', v)} /></Field>
                {d.url && <img src={d.url} alt="" className="w-full h-20 object-cover rounded-xl border border-slate-200" onError={() => {}} />}
                <Field label="URL enlace"><Input value={d.link} onChange={v => set('link', v)} /></Field>
                <Field label="Caption"><Input value={d.caption} onChange={v => set('caption', v)} /></Field>
            </div>;

        case 'divider':
            return <div className="space-y-3">
                <Field label="Color"><input type="color" value={d.color} onChange={e => set('color', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
                <Field label="Grosor"><Input value={d.thickness} onChange={v => set('thickness', v)} placeholder="1px" /></Field>
            </div>;

        case 'spacer':
            return <div className="space-y-3">
                <Field label="Alto"><Input value={d.height} onChange={v => set('height', v)} placeholder="40px" /></Field>
            </div>;

        case 'footer':
            return <div className="space-y-3">
                <Field label="Nombre empresa"><Input value={d.companyName} onChange={v => set('companyName', v)} /></Field>
                <Field label="Dirección"><Input value={d.address} onChange={v => set('address', v)} /></Field>
                <Field label="URL cancelar suscripción"><Input value={d.unsubscribeUrl} onChange={v => set('unsubscribeUrl', v)} /></Field>
                <Field label="Color fondo"><input type="color" value={d.backgroundColor} onChange={e => set('backgroundColor', e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" /></Field>
            </div>;

        case 'columns':
            return <div className="space-y-3">
                {d.columns?.map((col: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Columna {i+1}</p>
                        <Field label="URL imagen"><Input value={col.imageUrl} onChange={v => set('columns', d.columns.map((c: any, ci: number) => ci === i ? {...c, imageUrl: v} : c))} /></Field>
                        <Field label="Contenido HTML"><Textarea value={col.content} onChange={v => set('columns', d.columns.map((c: any, ci: number) => ci === i ? {...c, content: v} : c))} /></Field>
                    </div>
                ))}
            </div>;

        default:
            return <p className="text-xs text-slate-400">Sin propiedades editables.</p>;
    }
};

// ─── Email canvas block row ────────────────────────────────────────────────────

const BlockRow: React.FC<{
    block: EmailBlock;
    selected: boolean;
    index: number;
    total: number;
    onSelect: () => void;
    onMove: (dir: 'up'|'down') => void;
    onDelete: () => void;
    onDuplicate: () => void;
}> = ({ block, selected, index, total, onSelect, onMove, onDelete, onDuplicate }) => {
    const cfg = BLOCK_TYPES.find(b => b.type === block.type);
    return (
        <div
            onClick={onSelect}
            className={`relative group cursor-pointer border-2 rounded-xl transition-all ${selected ? 'border-indigo-500 shadow-md shadow-indigo-100' : 'border-transparent hover:border-indigo-200'}`}
        >
            <div className={`absolute -top-5 left-0 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 ${selected ? 'opacity-100' : ''} transition-opacity`}>
                <span className="bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-t-lg">
                    {cfg?.emoji} {cfg?.label}
                </span>
            </div>
            <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 ${selected ? 'opacity-100' : ''} transition-opacity`}>
                <button onClick={e => { e.stopPropagation(); onMove('up'); }} disabled={index === 0} className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30"><ChevronUp size={11} /></button>
                <button onClick={e => { e.stopPropagation(); onMove('down'); }} disabled={index === total-1} className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30"><ChevronDown size={11} /></button>
                <button onClick={e => { e.stopPropagation(); onDuplicate(); }} className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"><Copy size={11} /></button>
                <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 bg-white border border-red-200 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={11} /></button>
            </div>
            <div className="pointer-events-none p-2">
                <BlockPreview block={block} />
            </div>
        </div>
    );
};

// ─── Block preview (simplified) ───────────────────────────────────────────────

const BlockPreview: React.FC<{ block: EmailBlock }> = ({ block: { type, data: d } }) => {
    const base = 'font-sans text-slate-800';
    switch (type) {
        case 'header':
            return <div className={`${base} py-3 px-5 text-center bg-white border border-slate-100 rounded-lg`} style={{ backgroundColor: d.backgroundColor }}>
                {d.logoUrl ? <img src={d.logoUrl} alt={d.logoAlt} className="h-8 mx-auto object-contain" /> : <span className="font-black text-lg">{d.logoAlt}</span>}
            </div>;
        case 'hero':
            return <div className={`${base} rounded-lg overflow-hidden`} style={{ backgroundColor: d.backgroundColor }}>
                {d.imageUrl && <img src={d.imageUrl} alt="" className="w-full h-24 object-cover" />}
                <div className="p-4 text-center">
                    <p className="font-black text-sm">{d.headline}</p>
                    <p className="text-xs text-slate-500 mt-1">{d.subheadline}</p>
                    <span className="mt-3 inline-block px-4 py-1.5 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: d.ctaColor }}>{d.ctaLabel}</span>
                </div>
            </div>;
        case 'text':
            return <div className={`${base} px-4 py-3 text-xs leading-relaxed`} style={{ color: d.color, fontSize: d.fontSize }} dangerouslySetInnerHTML={{ __html: d.content.slice(0, 200) }} />;
        case 'button':
            return <div className={`${base} py-3 text-${d.align}`}>
                <span className="inline-block px-5 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: d.backgroundColor, color: d.textColor }}>{d.label}</span>
            </div>;
        case 'image':
            return d.url ? <img src={d.url} alt={d.alt} className="w-full h-28 object-cover rounded-lg" /> : <div className="h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">Imagen</div>;
        case 'divider':
            return <div className="py-3"><div style={{ borderTop: `${d.thickness} solid ${d.color}` }} /></div>;
        case 'spacer':
            return <div className="flex items-center justify-center text-slate-300 text-xs py-2">↕ {d.height}</div>;
        case 'footer':
            return <div className={`${base} py-3 px-5 text-center rounded-lg`} style={{ backgroundColor: d.backgroundColor }}>
                <p className="text-xs font-bold" style={{ color: d.textColor }}>{d.companyName}</p>
                <p className="text-[10px]" style={{ color: d.textColor }}>{d.address}</p>
            </div>;
        case 'columns':
            return <div className="grid grid-cols-2 gap-2 p-3">
                {(d.columns ?? []).map((col: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded p-2 text-xs text-slate-500 truncate">{col.content?.replace(/<[^>]+>/g,'').slice(0,40)}…</div>
                ))}
            </div>;
        default:
            return null;
    }
};

// ─── Email List screen ────────────────────────────────────────────────────────

const EmailList: React.FC<{
    siteSlug: string;
    onEdit: (t: EmailTemplate) => void;
    onClose: () => void;
}> = ({ siteSlug, onEdit, onClose }) => {
    const [emails, setEmails] = useState<EmailTemplate[]>(() => emailStore.getAll(siteSlug));
    const [showPresets, setShowPresets] = useState(false);

    function refresh() { setEmails(emailStore.getAll(siteSlug)); }

    function handleNew(preset?: typeof EMAIL_PRESETS[0]) {
        const t = createEmailTemplate(preset);
        emailStore.save(siteSlug, t);
        refresh();
        onEdit(t);
    }

    function handleDelete(id: string) {
        if (!window.confirm('¿Eliminar este email?')) return;
        emailStore.delete(siteSlug, id);
        refresh();
    }

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <Mail size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-900">Email Builder</h1>
                        <p className="text-[10px] text-slate-400">{emails.length} emails · compatible Gmail, Outlook, Apple Mail</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowPresets(v => !v)} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-black text-sm hover:bg-rose-700 transition-colors shadow-sm">
                        <Plus size={16} /> Nuevo email
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                </div>
            </header>

            {showPresets && (
                <div className="bg-rose-50 border-b border-rose-200 px-8 py-5">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Plantillas de email</p>
                    <div className="flex gap-3 flex-wrap">
                        {EMAIL_PRESETS.map(p => (
                            <button key={p.id} onClick={() => { handleNew(p); setShowPresets(false); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 hover:border-rose-400 transition-all text-left shadow-sm">
                                <span className="text-xl">{p.emoji}</span>
                                <div>
                                    <p className="text-xs font-black text-slate-800">{p.name}</p>
                                    <p className="text-[9px] text-slate-400">{p.description}</p>
                                </div>
                            </button>
                        ))}
                        <button onClick={() => { handleNew(); setShowPresets(false); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-400 transition-all text-slate-500 text-xs font-bold">
                            ✏️ En blanco
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-8">
                {emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Mail size={48} className="mb-4 opacity-20" />
                        <p className="font-black text-lg text-slate-600 mb-2">Sin emails todavía</p>
                        <p className="text-sm">Crea tu primer email con una de las plantillas</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                        {emails.map(email => (
                            <div key={email.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                                <div className="h-32 bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center text-4xl">📧</div>
                                <div className="p-4">
                                    <h3 className="font-black text-slate-800 text-sm">{email.name}</h3>
                                    <p className="text-[11px] text-slate-500 mt-1 truncate">{email.subject}</p>
                                    <p className="text-[9px] text-slate-400 mt-1">{email.blocks.length} bloques · {new Date(email.updatedAt).toLocaleDateString('es')}</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => onEdit(email)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700">
                                            <Edit3 size={11} /> Editar
                                        </button>
                                        <button onClick={() => downloadEmail(email)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"><Download size={13} /></button>
                                        <button onClick={() => handleDelete(email.id)} className="p-2 border border-red-100 rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Email Editor screen ──────────────────────────────────────────────────────

const EmailEditor: React.FC<{
    siteSlug: string;
    template: EmailTemplate;
    onBack: () => void;
}> = ({ siteSlug, template: initTemplate, onBack }) => {
    const [template, setTemplate] = useState<EmailTemplate>(initTemplate);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [preview, setPreview] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'desktop'|'mobile'>('desktop');
    const previewRef = useRef<HTMLIFrameElement>(null);

    const selectedBlock = template.blocks.find(b => b.id === selectedId) ?? null;

    const updateBlock = useCallback((id: string, data: Record<string, any>) => {
        setTemplate(t => ({ ...t, blocks: t.blocks.map(b => b.id === id ? { ...b, data } : b), updatedAt: Date.now() }));
    }, []);

    const addBlock = useCallback((type: EmailBlockType) => {
        const block = createEmailBlock(type);
        setTemplate(t => ({ ...t, blocks: [...t.blocks, block], updatedAt: Date.now() }));
        setSelectedId(block.id);
    }, []);

    const deleteBlock = useCallback((id: string) => {
        setTemplate(t => ({ ...t, blocks: t.blocks.filter(b => b.id !== id), updatedAt: Date.now() }));
        setSelectedId(null);
    }, []);

    const duplicateBlock = useCallback((id: string) => {
        setTemplate(t => {
            const idx = t.blocks.findIndex(b => b.id === id);
            if (idx < 0) return t;
            const copy = { ...t.blocks[idx], id: `${t.blocks[idx].id}-copy-${Date.now()}` };
            const blocks = [...t.blocks.slice(0, idx+1), copy, ...t.blocks.slice(idx+1)];
            return { ...t, blocks, updatedAt: Date.now() };
        });
    }, []);

    const moveBlock = useCallback((id: string, dir: 'up'|'down') => {
        setTemplate(t => {
            const idx = t.blocks.findIndex(b => b.id === id);
            const to = dir === 'up' ? idx - 1 : idx + 1;
            if (to < 0 || to >= t.blocks.length) return t;
            const blocks = [...t.blocks];
            [blocks[idx], blocks[to]] = [blocks[to], blocks[idx]];
            return { ...t, blocks, updatedAt: Date.now() };
        });
    }, []);

    function handleSave() {
        emailStore.save(siteSlug, template);
    }

    const html = buildEmail(template);

    return (
        <div className="fixed inset-0 z-[200] bg-slate-100 flex flex-col">
            {/* Toolbar */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><ArrowLeft size={16} /></button>
                <div className="flex-1">
                    <input value={template.name} onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))}
                        className="font-black text-slate-900 text-sm bg-transparent focus:outline-none border-b border-transparent focus:border-indigo-400 px-1" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPreview(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${preview ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        <Eye size={13} /> Preview
                    </button>
                    <button onClick={() => previewEmail(template)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200">
                        <Eye size={13} /> Abrir
                    </button>
                    <button onClick={() => downloadEmail(template)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200">
                        <Download size={13} /> HTML
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700">
                        <Save size={13} /> Guardar
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: block library */}
                {!preview && (
                    <aside className="w-48 bg-white border-r border-slate-200 p-3 overflow-y-auto shrink-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Añadir bloque</p>
                        <div className="space-y-1">
                            {BLOCK_TYPES.map(bt => (
                                <button key={bt.type} onClick={() => addBlock(bt.type)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left">
                                    <span>{bt.emoji}</span> {bt.label}
                                </button>
                            ))}
                        </div>

                        {/* Email settings */}
                        <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                            <Field label="Asunto">
                                <Input value={template.subject} onChange={v => setTemplate(t => ({...t, subject: v}))} />
                            </Field>
                            <Field label="Preheader">
                                <Input value={template.preheader} onChange={v => setTemplate(t => ({...t, preheader: v}))} />
                            </Field>
                            <Field label="Color fondo">
                                <input type="color" value={template.backgroundColor} onChange={e => setTemplate(t => ({...t, backgroundColor: e.target.value}))} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" />
                            </Field>
                            <Field label="Color primario">
                                <input type="color" value={template.primaryColor} onChange={e => setTemplate(t => ({...t, primaryColor: e.target.value}))} className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer" />
                            </Field>
                        </div>
                    </aside>
                )}

                {/* Center: canvas */}
                <main className="flex-1 overflow-y-auto p-8">
                    {preview ? (
                        <div>
                            <div className="flex items-center justify-center gap-3 mb-5">
                                <button onClick={() => setPreviewDevice('desktop')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black ${previewDevice === 'desktop' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                    <Monitor size={13} /> Desktop
                                </button>
                                <button onClick={() => setPreviewDevice('mobile')} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black ${previewDevice === 'mobile' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                    <Smartphone size={13} /> Mobile
                                </button>
                            </div>
                            <div className={`mx-auto bg-white shadow-xl rounded-2xl overflow-hidden transition-all ${previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
                                <iframe
                                    ref={previewRef}
                                    srcDoc={html}
                                    className="w-full border-0"
                                    style={{ height: '600px' }}
                                    title="Email preview"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto space-y-5">
                            {template.blocks.map((block, idx) => (
                                <BlockRow
                                    key={block.id}
                                    block={block}
                                    selected={selectedId === block.id}
                                    index={idx}
                                    total={template.blocks.length}
                                    onSelect={() => setSelectedId(block.id)}
                                    onMove={dir => moveBlock(block.id, dir)}
                                    onDelete={() => deleteBlock(block.id)}
                                    onDuplicate={() => duplicateBlock(block.id)}
                                />
                            ))}
                            {template.blocks.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <Layers size={32} className="mb-2 opacity-30" />
                                    <p className="text-sm font-bold">Añade bloques desde la izquierda</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Right: inspector */}
                {!preview && selectedBlock && (
                    <aside className="w-64 bg-white border-l border-slate-200 overflow-y-auto shrink-0">
                        <div className="p-4 border-b border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {BLOCK_TYPES.find(b => b.type === selectedBlock.type)?.emoji}{' '}
                                {BLOCK_TYPES.find(b => b.type === selectedBlock.type)?.label}
                            </p>
                        </div>
                        <div className="p-4">
                            <BlockInspector block={selectedBlock} onChange={data => updateBlock(selectedBlock.id, data)} />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

// ─── Main EmailBuilderPanel ────────────────────────────────────────────────────

export const EmailBuilderPanel: React.FC<{ siteSlug: string; onClose: () => void }> = ({ siteSlug, onClose }) => {
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    if (editingTemplate) {
        return <EmailEditor siteSlug={siteSlug} template={editingTemplate} onBack={() => setEditingTemplate(null)} />;
    }
    return <EmailList siteSlug={siteSlug} onEdit={setEditingTemplate} onClose={onClose} />;
};
