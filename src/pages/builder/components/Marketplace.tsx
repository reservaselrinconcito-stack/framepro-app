/**
 * Marketplace.tsx — FramePro Template Marketplace
 *
 * Galería completa de plantillas con filtros, búsqueda, preview en detalle
 * y aplicación directa al editor o creación de nuevo sitio.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
    Search, Star, Download, Tag, Zap, X, ChevronLeft,
    Check, Eye, Lock, Gift, Filter, ArrowRight, Sparkles
} from 'lucide-react';
import { FRAMEPRO_TEMPLATES, FrameProTemplate, cloneTemplateConfig } from '../framepro/templates';
import { SiteConfigV1 } from '@/modules/webBuilder/types';
import { demoMode } from '../framepro/demo';
import { stripeClient } from '../framepro/stripe';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MarketplaceProps {
    onUseTemplate: (config: SiteConfigV1, templateId: string) => Promise<void>;
    onClose: () => void;
}

// ─── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: 'all', label: 'Todos', emoji: '✨' },
    { id: 'saas', label: 'SaaS', emoji: '🚀' },
    { id: 'business', label: 'Empresa', emoji: '🏢' },
    { id: 'agency', label: 'Agencia', emoji: '🎯' },
    { id: 'commerce', label: 'Comercio', emoji: '🛍️' },
    { id: 'hospitality', label: 'Hostelería', emoji: '🍽️' },
    { id: 'food', label: 'Food', emoji: '🍕' },
    { id: 'portfolio', label: 'Portfolio', emoji: '🎨' },
    { id: 'event', label: 'Eventos', emoji: '🎪' },
    { id: 'marketing', label: 'App', emoji: '📱' },
    { id: 'health', label: 'Salud', emoji: '💪' },
];

const SORT_OPTIONS = [
    { id: 'popular', label: '🔥 Más populares' },
    { id: 'rating', label: '⭐ Mejor valorados' },
    { id: 'newest', label: '🆕 Más recientes' },
    { id: 'free', label: '🎁 Gratuitos primero' },
];

// ─── Star rating ───────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                size={size}
                className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
            />
        ))}
    </div>
);

// ─── Template Card ─────────────────────────────────────────────────────────────

const TemplateCard: React.FC<{
    template: FrameProTemplate;
    onPreview: () => void;
    onUse: () => void;
}> = ({ template, onPreview, onUse }) => {
    const [imgError, setImgError] = useState(false);
    const previewImg = template.previewImages?.[0];

    return (
        <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
            {/* Thumbnail */}
            <div
                className="relative h-40 overflow-hidden cursor-pointer flex-shrink-0"
                onClick={onPreview}
                style={{ backgroundColor: template.previewColor + '22' }}
            >
                {previewImg && !imgError ? (
                    <img
                        src={previewImg}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center text-5xl"
                        style={{ backgroundColor: template.previewColor + '33' }}
                    >
                        {template.emoji}
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-800 rounded-xl font-black text-xs shadow-lg">
                        <Eye size={14} /> Vista previa
                    </button>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                    {template.isFree ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                            <Gift size={9} /> Gratis
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 text-white text-[9px] font-black rounded-full">
                            {template.isPro ? <Lock size={9} /> : null} {template.price}€
                        </span>
                    )}
                    {template.isPro && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                            Pro
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <h3 className="font-black text-slate-800 text-sm leading-tight">{template.emoji} {template.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{template.category}</p>
                    </div>
                    <StarRating rating={template.rating ?? 5} />
                </div>

                <p className="text-xs text-slate-500 leading-relaxed flex-1 line-clamp-2">{template.description}</p>

                {/* Tags */}
                {template.tags && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                        {template.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-400 text-[9px] font-bold rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                        <Download size={10} /> {(template.downloads ?? 0).toLocaleString('es')}
                    </span>
                    <button
                        onClick={onUse}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${template.isFree
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                    >
                        {template.isFree ? (
                            <><Check size={10} /> Usar gratis</>
                        ) : (
                            <><Lock size={10} /> Obtener · {template.price}€</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Template Detail Modal ─────────────────────────────────────────────────────

const TemplateDetail: React.FC<{
    template: FrameProTemplate;
    onClose: () => void;
    onUse: () => void;
}> = ({ template, onClose, onUse }) => {
    const [activeImg, setActiveImg] = useState(0);
    const images = template.previewImages ?? [];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[201] bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: template.previewColor + '22' }}
                        >
                            {template.emoji}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">{template.name}</h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <StarRating rating={template.rating ?? 5} size={11} />
                                <span className="text-[10px] text-slate-400 font-bold">
                                    {template.rating} · {(template.downloads ?? 0).toLocaleString('es')} descargas
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-[1fr_280px] h-full">
                        {/* Left: images */}
                        <div className="p-8 border-r border-slate-100">
                            {/* Main image */}
                            <div
                                className="w-full h-56 rounded-2xl overflow-hidden flex items-center justify-center mb-3"
                                style={{ backgroundColor: template.previewColor + '22' }}
                            >
                                {images[activeImg] ? (
                                    <img src={images[activeImg]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-7xl">{template.emoji}</span>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-2">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImg(i)}
                                            className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-indigo-500' : 'border-slate-200'
                                                }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            <p className="text-sm text-slate-600 leading-relaxed mt-4">{template.description}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {template.tags?.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right: info + CTA */}
                        <div className="p-6 flex flex-col">
                            {/* Price */}
                            <div className="mb-6">
                                {template.isFree ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-black text-emerald-600">Gratis</span>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full uppercase tracking-widest">
                                            Sin coste
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-3xl font-black text-slate-900">{template.price}€</span>
                                        <span className="text-slate-400 text-sm ml-1">pago único</span>
                                        {template.isPro && (
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <Lock size={12} className="text-violet-500" />
                                                <span className="text-xs text-violet-600 font-bold">Incluido en FramePro Pro</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* What's included */}
                            {template.features && (
                                <div className="mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Qué incluye</h4>
                                    <ul className="space-y-2">
                                        {template.features.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-slate-700">
                                                <Check size={12} className="text-emerald-500 shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Author */}
                            <div className="flex items-center gap-2 mb-6 p-3 bg-slate-50 rounded-xl">
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center">
                                    <Zap size={12} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-700">{template.author ?? 'FramePro Team'}</p>
                                    <p className="text-[9px] text-slate-400">Plantilla oficial</p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-2">
                                <button
                                    onClick={onUse}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    {template.isFree ? (
                                        <><Check size={16} /> Usar esta plantilla</>
                                    ) : (
                                        <><ArrowRight size={16} /> Obtener plantilla</>
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 border border-slate-200 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Volver al marketplace
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Marketplace Component ────────────────────────────────────────────────

export const Marketplace: React.FC<MarketplaceProps> = ({ onUseTemplate, onClose }) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('popular');
    const [showFreeOnly, setShowFreeOnly] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<FrameProTemplate | null>(null);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let list = [...FRAMEPRO_TEMPLATES];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.tags?.some(tag => tag.includes(q)) ||
                t.category.includes(q)
            );
        }

        if (category !== 'all') {
            list = list.filter(t => t.category === category);
        }

        if (showFreeOnly) {
            list = list.filter(t => t.isFree);
        }

        switch (sort) {
            case 'popular': list.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0)); break;
            case 'rating': list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
            case 'free': list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
        }

        return list;
    }, [search, category, sort, showFreeOnly]);

    const handleUseTemplate = useCallback(async (template: FrameProTemplate) => {
        // Free templates: use immediately
        if (template.isFree || template.price === 0) {
            const config = await demoMode.createFromTemplate(template.id, template.config.globalData.brandName);
            await onUseTemplate(config, template.id);
            setSelectedTemplate(null);
            return;
        }

        // Check if already purchased
        if (stripeClient.isPurchased(template.id)) {
            const config = await demoMode.createFromTemplate(template.id, template.config.globalData.brandName);
            await onUseTemplate(config, template.id);
            setSelectedTemplate(null);
            return;
        }

        // DEV mode: mock purchase for testing
        const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
        if (isDev) {
            stripeClient.mockPurchase(template.id);
            const config = await demoMode.createFromTemplate(template.id, template.config.globalData.brandName);
            await onUseTemplate(config, template.id);
            setSelectedTemplate(null);
            return;
        }

        // Production: redirect to Stripe Checkout
        setPurchasing(template.id);
        try {
            const apiUrl = (import.meta as any).env?.VITE_API_URL ?? '';
            const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ?? '';

            if (!apiUrl || !publishableKey) {
                // Fallback in demo: unlock for free
                stripeClient.mockPurchase(template.id);
                const config = await demoMode.createFromTemplate(template.id, template.config.globalData.brandName);
                await onUseTemplate(config, template.id);
                setSelectedTemplate(null);
                return;
            }

            await stripeClient.startCheckout(template, { publishableKey, apiUrl });
        } finally {
            setPurchasing(null);
        }
    }, [onUseTemplate]);

    const freeCount = FRAMEPRO_TEMPLATES.filter(t => t.isFree).length;

    return (
        <div className="fixed inset-0 z-[150] bg-slate-50 flex flex-col">

            {/* Top bar */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-6 shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-bold">Volver</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-900">Marketplace de Plantillas</h1>
                        <p className="text-[10px] text-slate-400 font-bold">{FRAMEPRO_TEMPLATES.length} plantillas · {freeCount} gratuitas</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar plantillas…"
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-slate-50"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white focus:outline-none focus:border-indigo-400"
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowFreeOnly(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${showFreeOnly
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'
                            }`}
                    >
                        <Gift size={12} /> Solo gratis
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: categories */}
                <aside className="w-48 bg-white border-r border-slate-200 p-4 shrink-0 overflow-y-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Categorías</p>
                    <div className="space-y-0.5">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${category === cat.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <span>{cat.emoji}</span>
                                {cat.label}
                                {cat.id === 'all' && (
                                    <span className={`ml-auto text-[9px] font-black ${category === cat.id ? 'text-white/60' : 'text-slate-400'}`}>
                                        {FRAMEPRO_TEMPLATES.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main grid */}
                <main className="flex-1 overflow-y-auto p-8">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Search size={40} className="mb-4 opacity-30" />
                            <p className="font-bold">Sin resultados para "{search}"</p>
                            <button onClick={() => { setSearch(''); setCategory('all'); }} className="mt-3 text-indigo-500 text-sm font-bold hover:underline">
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-slate-500">
                                    <span className="font-black text-slate-800">{filtered.length}</span> plantillas
                                    {category !== 'all' && <span> en {CATEGORIES.find(c => c.id === category)?.label}</span>}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filtered.map(template => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onPreview={() => setSelectedTemplate(template)}
                                        onUse={() => handleUseTemplate(template)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Template detail modal */}
            {selectedTemplate && (
                <TemplateDetail
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                    onUse={() => handleUseTemplate(selectedTemplate)}
                />
            )}
        </div>
    );
};
