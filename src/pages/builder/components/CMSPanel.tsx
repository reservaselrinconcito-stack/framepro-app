/**
 * CMSPanel.tsx — WebPro Headless CMS UI
 *
 * Panel completo para gestionar colecciones y entradas del CMS.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Database, FileText, Trash2, Edit3, Eye, EyeOff, Download, Search, ChevronRight, Check, ArrowLeft, Save } from 'lucide-react';
import { cms, CMSCollection, CMSEntry, CMSField, COLLECTION_PRESETS } from '../webpro/headless-cms';

// ─── Field Editor ─────────────────────────────────────────────────────────────

const FieldInput: React.FC<{ field: CMSField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
    const base = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white';

    switch (field.type) {
        case 'textarea':
        case 'richtext':
            return <textarea className={base} rows={4} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />;
        case 'boolean':
            return (
                <button
                    onClick={() => onChange(!value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        {value && <Check size={10} className="text-white" />}
                    </div>
                    {value ? 'Sí' : 'No'}
                </button>
            );
        case 'select':
            return (
                <select className={base} value={value ?? ''} onChange={e => onChange(e.target.value)}>
                    <option value="">Selecciona…</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            );
        case 'tags':
            return (
                <div className="space-y-2">
                    <input
                        className={base}
                        value={Array.isArray(value) ? value.join(', ') : (value ?? '')}
                        onChange={e => onChange(e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
                        placeholder="Tag1, Tag2, Tag3…"
                    />
                    {Array.isArray(value) && value.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {value.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            );
        case 'image':
            return (
                <div className="space-y-2">
                    <input className={base} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="URL de imagen o pega base64…" />
                    {value && <img src={value} alt="" className="w-full h-24 object-cover rounded-xl border border-slate-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                </div>
            );
        case 'number':
            return <input type="number" className={base} value={value ?? ''} onChange={e => onChange(Number(e.target.value))} placeholder={field.placeholder} />;
        case 'date':
            return <input type="date" className={base} value={value ?? ''} onChange={e => onChange(e.target.value)} />;
        default:
            return <input type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'} className={base} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />;
    }
};

// ─── Entry Editor ─────────────────────────────────────────────────────────────

const EntryEditor: React.FC<{
    collection: CMSCollection;
    entry?: CMSEntry;
    onSave: (data: Record<string, any>, status: CMSEntry['status']) => void;
    onCancel: () => void;
}> = ({ collection, entry, onSave, onCancel }) => {
    const [data, setData] = useState<Record<string, any>>(entry?.data ?? {});
    const [status, setStatus] = useState<CMSEntry['status']>(entry?.status ?? 'draft');

    const setField = (key: string, value: any) => setData(d => ({ ...d, [key]: value }));

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
                <button onClick={onCancel} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><ArrowLeft size={16} /></button>
                <div>
                    <h3 className="font-black text-slate-900 text-sm">{entry ? 'Editar entrada' : 'Nueva entrada'}</h3>
                    <p className="text-[9px] text-slate-400">{collection.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value as CMSEntry['status'])}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white focus:outline-none"
                    >
                        <option value="draft">📝 Borrador</option>
                        <option value="published">✅ Publicado</option>
                        <option value="archived">📦 Archivado</option>
                    </select>
                    <button
                        onClick={() => onSave(data, status)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700"
                    >
                        <Save size={12} /> Guardar
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {collection.fields.map(field => (
                    <div key={field.name}>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <FieldInput field={field} value={data[field.name]} onChange={v => setField(field.name, v)} />
                        {field.helpText && <p className="text-[9px] text-slate-400 mt-1">{field.helpText}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Entries List ─────────────────────────────────────────────────────────────

const EntriesList: React.FC<{
    collection: CMSCollection;
    onEdit: (entry: CMSEntry) => void;
    onBack: () => void;
    siteSlug: string;
}> = ({ collection, onEdit, onBack, siteSlug }) => {
    const [entries, setEntries] = useState<CMSEntry[]>([]);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [editingEntry, setEditingEntry] = useState<CMSEntry | undefined>();

    const refresh = useCallback(() => {
        setEntries(cms.getEntries(collection.id, search ? { search } : {}));
    }, [collection.id, search]);

    useEffect(() => { refresh(); }, [refresh]);

    function handleSave(data: Record<string, any>, status: CMSEntry['status']) {
        if (editingEntry) {
            cms.updateEntry(collection.id, editingEntry.id, data, status);
        } else {
            cms.createEntry(collection.id, data, status);
        }
        setCreating(false);
        setEditingEntry(undefined);
        refresh();
    }

    function toggleStatus(entry: CMSEntry) {
        const next = entry.status === 'published' ? 'draft' : 'published';
        cms.updateEntry(collection.id, entry.id, entry.data, next);
        refresh();
    }

    function handleDelete(id: string) {
        if (!window.confirm('¿Eliminar esta entrada?')) return;
        cms.deleteEntry(collection.id, id);
        refresh();
    }

    if (creating || editingEntry) {
        return (
            <EntryEditor
                collection={collection}
                entry={editingEntry}
                onSave={handleSave}
                onCancel={() => { setCreating(false); setEditingEntry(undefined); }}
            />
        );
    }

    const titleField = collection.fields.find(f => f.name === 'title' || f.name === 'name' || f.name === 'question');

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
                <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><ArrowLeft size={16} /></button>
                <div>
                    <h3 className="font-black text-slate-900 text-sm">{collection.icon} {collection.name}</h3>
                    <p className="text-[9px] text-slate-400">{entries.length} entradas</p>
                </div>
                <button onClick={() => setCreating(true)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700">
                    <Plus size={12} /> Nueva
                </button>
            </div>

            <div className="p-3 border-b border-slate-100 shrink-0">
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar entradas…"
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <FileText size={28} className="mb-2 opacity-30" />
                        <p className="text-xs font-bold">Sin entradas todavía</p>
                        <button onClick={() => setCreating(true)} className="mt-2 text-indigo-500 text-xs font-bold hover:underline">Crear primera entrada →</button>
                    </div>
                ) : (
                    entries.map(entry => {
                        const title = titleField ? entry.data[titleField.name] : entry.id;
                        return (
                            <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{title || '(sin título)'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                                            entry.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                            entry.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {entry.status === 'published' ? '● Publicado' : entry.status === 'draft' ? '○ Borrador' : '▫ Archivado'}
                                        </span>
                                        <span className="text-[8px] text-slate-400">{new Date(entry.updatedAt).toLocaleDateString('es')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleStatus(entry)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400" title={entry.status === 'published' ? 'Despublicar' : 'Publicar'}>
                                        {entry.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button onClick={() => setEditingEntry(entry)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-500">
                                        <Edit3 size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// ─── Main CMS Panel ────────────────────────────────────────────────────────────

interface CMSPanelProps {
    siteSlug: string;
    onClose: () => void;
}

export const CMSPanel: React.FC<CMSPanelProps> = ({ siteSlug, onClose }) => {
    const [collections, setCollections] = useState<CMSCollection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<CMSCollection | null>(null);
    const [showAddPreset, setShowAddPreset] = useState(false);

    const refresh = () => setCollections(cms.getCollections(siteSlug));
    useEffect(() => { refresh(); }, [siteSlug]);

    function addFromPreset(preset: typeof COLLECTION_PRESETS[0]) {
        cms.createCollection(siteSlug, { ...preset });
        refresh();
        setShowAddPreset(false);
    }

    function handleDelete(col: CMSCollection) {
        if (!window.confirm(`¿Eliminar la colección "${col.name}" y todas sus entradas?`)) return;
        cms.deleteCollection(siteSlug, col.id);
        refresh();
    }

    function handleExportJson() {
        const json = cms.exportJson(siteSlug);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        a.download = `${siteSlug}-cms.json`;
        a.click();
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[201] bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">

                {/* Header */}
                {!selectedCollection && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center">
                                <Database size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900">CMS Headless</h2>
                                <p className="text-[10px] text-slate-400">{collections.length} colecciones · {siteSlug}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExportJson} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">
                                <Download size={13} /> Exportar JSON
                            </button>
                            <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {selectedCollection ? (
                    <EntriesList
                        collection={selectedCollection}
                        onEdit={() => {}}
                        onBack={() => { setSelectedCollection(null); refresh(); }}
                        siteSlug={siteSlug}
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {/* Add preset */}
                        <button
                            onClick={() => setShowAddPreset(v => !v)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-black text-xs hover:bg-indigo-50 transition-colors"
                        >
                            <Plus size={14} /> {showAddPreset ? 'Cancelar' : 'Añadir colección'}
                        </button>

                        {showAddPreset && (
                            <div className="grid grid-cols-2 gap-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <p className="col-span-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Plantillas de colección</p>
                                {COLLECTION_PRESETS.filter(p => !collections.some(c => c.slug === p.slug)).map(preset => (
                                    <button
                                        key={preset.slug}
                                        onClick={() => addFromPreset(preset)}
                                        className="flex items-center gap-2 p-3 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition-all text-left"
                                    >
                                        <span className="text-xl">{preset.icon}</span>
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{preset.name}</p>
                                            <p className="text-[9px] text-slate-400">{preset.fields.length} campos</p>
                                        </div>
                                    </button>
                                ))}
                                {COLLECTION_PRESETS.filter(p => !collections.some(c => c.slug === p.slug)).length === 0 && (
                                    <p className="col-span-2 text-xs text-slate-400 text-center py-2">Todas las plantillas ya están añadidas</p>
                                )}
                            </div>
                        )}

                        {/* Collections list */}
                        {collections.length === 0 && !showAddPreset ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Database size={40} className="mb-3 opacity-20" />
                                <p className="font-bold">Sin colecciones todavía</p>
                                <p className="text-xs mt-1">Añade una colección para empezar a gestionar contenido</p>
                            </div>
                        ) : (
                            collections.map(col => {
                                const entryCount = cms.getEntries(col.id).length;
                                const published = cms.getEntries(col.id, { status: 'published' }).length;
                                return (
                                    <button
                                        key={col.id}
                                        onClick={() => setSelectedCollection(col)}
                                        className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all group text-left"
                                    >
                                        <span className="text-2xl shrink-0">{col.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800">{col.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[9px] text-slate-400">{entryCount} entradas</span>
                                                <span className="text-[9px] text-emerald-600 font-bold">{published} publicadas</span>
                                                <span className="text-[9px] text-slate-300 font-mono">/{col.slug}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDelete(col); }}
                                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 shrink-0" />
                                    </button>
                                );
                            })
                        )}

                        {/* API endpoint info */}
                        {collections.length > 0 && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoints API</p>
                                <div className="space-y-1">
                                    {collections.map(col => (
                                        <p key={col.id} className="text-xs font-mono text-slate-600">
                                            <span className="text-emerald-600 font-bold">GET</span>{' '}
                                            <span className="text-slate-400">/api/cms/</span>{col.slug}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
