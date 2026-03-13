/**
 * src/pages/WebsiteBuilder.tsx — WebPro Editor v1
 *
 * Evolución del editor Ferrari al producto WebPro.
 *
 * Nuevo en v1:
 *  ─ Demo mode: funciona sin backend (localStorage)
 *  ─ 10 plantillas completas con bloques reales
 *  ─ ThemePicker visual con 10 paletas
 *  ─ HTML Export (descarga HTML estático)
 *  ─ Template picker en SidebarLeft
 *  ─ 4 nuevos bloques: Stats, Team, LogoCloud, NewsletterSignup
 *  ─ SidebarLeft con grid 2 cols + categoria pills
 *  ─ "Crear desde plantilla" en dashboard
 *  ─ Modo WebPro independiente (sin RentikPro)
 *
 * Mantiene:
 *  ─ ErrorBoundary
 *  ─ VersionChecker corregido
 *  ─ Autosave 900ms
 *  ─ Undo/Redo
 *  ─ Drag & drop imágenes en canvas
 *  ─ Publish real via publishAdapter (cuando hay backend)
 *  ─ Inline text editing
 */

import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import {
    Monitor, Tablet as TabletIcon, Smartphone,
    Undo2, Redo2, Save, CloudIcon,
    AlertTriangle, RefreshCw, CheckCircle2,
    Loader2, ChevronLeft, Download, Eye,
    Palette, X, Play, Globe,
    Plus, FolderOpen, Trash2, ExternalLink,
    Sparkles, Users, BarChart2, FlaskConical, Database,
    Mail, Zap
} from 'lucide-react';

import { APP_VERSION } from '../version';

// Core modules
import { SiteConfigV1 } from '../modules/webBuilder/types';
import { saveSiteConfig } from '../modules/webBuilder/api';
import { migrateToV1, hydrateConfig } from '../modules/webBuilder/adapters';
import { generateSlug } from '../modules/webBuilder/slug';
import { DEFAULT_SITE_CONFIG_V1 } from '../modules/webBuilder/defaults';
import { useBuilder } from './builder/hooks/useBuilder';
import { Canvas } from './builder/components/Canvas';
import { SidebarLeft } from './builder/components/SidebarLeft';
import { SidebarRight } from './builder/components/SidebarRight';
import { ThemePicker } from './builder/components/ThemePicker';
import { PageBar } from './builder/components/PageBar';
// ─── Import sub-components ──────────────────────────────────────────────────
import { Marketplace } from './builder/components/Marketplace'; // Corregir import si se movió o renombró
import { CollabPresence } from './builder/components/CollabPresence';
import { stripeClient } from './builder/webpro/stripe';
import { AnalyticsDashboard } from './builder/components/AnalyticsDashboard';
import { ABTestManager } from './builder/components/ABTestManager';
import { CustomDomain } from './builder/components/CustomDomain';
import { CMSPanel } from './builder/components/CMSPanel';
import { EmailBuilderPanel } from './builder/components/EmailBuilderPanel';
import { IntegrationsHub } from './builder/components/IntegrationsHub';
import { analytics } from './builder/webpro/analytics';
import { MobilePanel } from './builder/components/MobilePanel';
import { UpdateButton } from '../components/UpdateButton';
import { toast } from 'sonner';

// WebPro modules
import { WEBPRO_TEMPLATES, cloneTemplateConfig, WebProTemplate } from './builder/webpro/templates';
import { demoMode, DemoProject, VersionSnapshot } from './builder/webpro/demo';
import { checkAndSeed } from '../modules/webBuilder/seed';
import { downloadHtml, downloadProjectJson, downloadAllPages } from './builder/webpro/export';
import { openPreviewWindow, PreviewHandle } from './builder/webpro/preview';

// Standalone WebPro mode placeholders
const projectManager: any = null;
const publishAdapter: any = null;
const generateV0Config: any = null;

import { getActiveAdapter } from '../modules/webBuilder/storage';

// ─── Constants ───────────────────────────────────────────────────────────────
const storage = getActiveAdapter();

// ─── Error Boundary ────────────────────────────────────────────────────────────

class BuilderErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(e: Error) { return { hasError: true, error: e }; }
    componentDidCatch(e: Error, info: React.ErrorInfo) { console.error('[WebPro]', e, info); }
    render() {
        if (this.state.hasError) return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-6 p-12">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle size={36} className="text-red-500" />
                </div>
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Error en el Editor</h2>
                    <p className="text-slate-500 text-sm mb-1">{this.state.error?.message}</p>
                    <p className="text-slate-400 text-xs">Tu trabajo guardado está seguro.</p>
                </div>
                <button
                    onClick={() => this.setState({ hasError: false })}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-colors"
                >
                    <RefreshCw size={16} /> Reintentar
                </button>
            </div>
        );
        return this.props.children;
    }
}

// ─── Version Checker ───────────────────────────────────────────────────────────

function parseSemver(v: string) { return (v ?? '0.0.0').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0); }
function isSemverGreater(r: string, c: string): boolean {
    const rv = parseSemver(r); const cv = parseSemver(c);
    for (let i = 0; i < 3; i++) { if (rv[i] > cv[i]) return true; if (rv[i] < cv[i]) return false; }
    return false;
}
function useVersionChecker(isDemoActive: boolean) {
    useEffect(() => {
        if (import.meta.env.DEV || isDemoActive) return;
        const url = import.meta.env.VITE_VERSION_CHECK_URL;
        if (!url) return;
        fetch(url, { cache: 'no-store' }).then(r => r.json()).then(({ version: remote }) => {
            if (remote && isSemverGreater(remote, APP_VERSION)) {
                toast('Nueva versión disponible', {
                    description: `v${remote} (actual: v${APP_VERSION})`,
                    action: { label: 'Actualizar', onClick: () => window.location.reload() },
                    duration: 10000,
                });
            }
        }).catch(() => { });
    }, []);
}

// ─── Save Status Badge ─────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const SaveStatusBadge: React.FC<{ status: SaveStatus; lastSavedAt: Date | null }> = ({ status, lastSavedAt }) => {
    const map: Record<SaveStatus, { icon: React.ReactNode; label: string; cls: string }> = {
        idle: { icon: null, label: '', cls: 'opacity-0' },
        dirty: { icon: <div className="w-2 h-2 rounded-full bg-amber-400" />, label: 'Sin guardar', cls: 'text-amber-600 bg-amber-50 border-amber-100' },
        saving: { icon: <Loader2 size={12} className="animate-spin" />, label: 'Guardando…', cls: 'text-slate-500 bg-slate-50' },
        saved: { icon: <CheckCircle2 size={12} className="text-emerald-500" />, label: `Guardado ${lastSavedAt ? lastSavedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''}`, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
        error: { icon: <AlertTriangle size={12} className="text-red-500" />, label: 'Error al guardar', cls: 'text-red-600 bg-red-50 border-red-100' },
    };
    const { icon, label, cls } = map[status];
    if (!label) return null;
    return (
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${cls}`}>
            {icon}{label}
        </span>
    );
};

// ─── Site list item type ───────────────────────────────────────────────────────

interface SiteItem {
    id: string;
    name: string;
    slug: string;
    templateId?: string;
    source: 'rentikpro' | 'demo';
    config?: SiteConfigV1;
}

// ─── Main Inner Component ──────────────────────────────────────────────────────

const WebProEditorInner: React.FC = () => {
    const isDemoActive = demoMode.isActive();
    useVersionChecker(isDemoActive);

    // ── Dashboard state ──
    const [sites, setSites] = useState<SiteItem[]>([]);
    const [selectedSite, setSelectedSite] = useState<SiteItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Editor state ──
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showNewSiteModal, setShowNewSiteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [businessContext, setBusinessContext] = useState('');
    const [showMarketplace, setShowMarketplace] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showABTests, setShowABTests] = useState(false);
    const [showDomain, setShowDomain] = useState(false);
    const [showCMS, setShowCMS] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [showIntegrations, setShowIntegrations] = useState(false);
    const [showMobile, setShowMobile] = useState(false);

    // ── Collab state ──
    const [collabEnabled, setCollabEnabled] = useState(false);
    const collabRoomId = selectedSite?.id ?? 'default';
    const localCollabUser = {
        id: `user-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Editor',
    };

    // Verify Stripe purchase on redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        const templateId = params.get('template');
        if (sessionId && templateId) {
            const apiUrl = (import.meta as any).env?.VITE_API_URL ?? '';
            const key = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ?? '';
            if (apiUrl && key) {
                stripeClient.verifyPurchase(sessionId, { publishableKey: key, apiUrl })
                    .then(result => {
                        if (result.success) toast.success('¡Compra completada! Template desbloqueado 🎉');
                        else toast.error('No se pudo verificar el pago');
                    });
            }
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // ── Preview handle ref ──
    const previewHandleRef = useRef<PreviewHandle | null>(null);

    // ── Builder hook ──
    const {
        config, device, selectedBlockId, inspectorTab,
        currentPage, inlineEditBlockId,
        dispatch, addBlock, updateBlock, removeBlock, moveBlock,
        undo, redo, canUndo, canRedo,
        addPage, removePage, renamePage, setCurrentPage,
        startInlineEdit, stopInlineEdit,
    } = useBuilder(DEFAULT_SITE_CONFIG_V1);

    const prevConfigRef = useRef<string>('');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // ─── Load Sites ────────────────────────────────────────────────────────────

    useEffect(() => {
        const init = async () => {
            await checkAndSeed();
            await loadSites();
        };
        init();
    }, []);

    async function loadSites() {
        setIsLoading(true);
        const result: SiteItem[] = [];

        // Check RentikPro
        if (projectManager) {
            try {
                const store = projectManager.getStore?.();
                const websites = store?.getWebsites?.() ?? [];
                websites.forEach((w: any) => result.push({
                    id: w.id, name: w.name, slug: w.slug,
                    source: 'rentikpro',
                }));
            } catch { /* noop */ }
        }

        // Demo sites
        const isDemoActive = demoMode.isActive();
        let demoProjects = await demoMode.listProjects();
        // Rare race condition: if empty, wait 500ms and try once more
        if (demoProjects.length === 0 && isDemoActive) {
            await new Promise(r => setTimeout(r, 600));
            demoProjects = await demoMode.listProjects();
        }

        demoProjects.forEach(p => result.push({
            id: p.id, name: p.brandName, slug: p.slug,
            templateId: p.templateId, source: 'demo', config: p.config,
        }));

        setSites(result);
        setIsLoading(false);

        // AUTO-OPEN: Si solo hay un sitio (el demo-saas) y estamos en modo demo, abrirlo directamente
        if (result.length === 1 && isDemoActive && !selectedSite) {
            openSite(result[0]);
        }
    }

    // ─── Duplicate site ────────────────────────────────────────────────────────

    async function handleDuplicate(site: SiteItem) {
        const newConfig = await demoMode.duplicateProject(site.id);
        if (!newConfig) { toast.error('No se pudo duplicar el sitio'); return; }
        const newSite: SiteItem = {
            id: newConfig.slug,
            name: newConfig.globalData.brandName,
            slug: newConfig.slug,
            templateId: site.templateId,
            source: 'demo',
            config: newConfig,
        };
        setSites(s => [...s, newSite]);
        toast.success('Sitio duplicado', { description: newConfig.globalData.brandName });
    }

    // ─── Import JSON ───────────────────────────────────────────────────────────

    async function handleImportJson(json: string): Promise<boolean> {
        const config = demoMode.importProjectJson(json);
        if (!config) { toast.error('JSON inválido o incompatible'); return false; }

        // Ensure unique slug
        const now = Date.now();
        if (!config.slug) config.slug = `imported-${now}`;
        else config.slug = `${config.slug}-${now}`;

        await demoMode.saveProject(config, 'custom');
        const site: SiteItem = {
            id: config.slug,
            name: config.globalData.brandName,
            slug: config.slug,
            templateId: 'custom',
            source: 'demo',
            config,
        };
        setSites(s => [...s, site]);
        toast.success('Proyecto importado', { description: config.globalData.brandName });
        return true;
    }

    // ─── Load a site into the editor ───────────────────────────────────────────

    async function openSite(site: SiteItem) {
        let config: SiteConfigV1;
        if (site.source === 'demo' && site.config) {
            config = site.config;
        } else if (projectManager) {
            try {
                const store = projectManager.getStore?.();
                const website = store?.getWebsites?.().find((w: any) => w.id === site.id);
                config = website ? migrateToV1(website.sections_json) : DEFAULT_SITE_CONFIG_V1;
            } catch {
                config = DEFAULT_SITE_CONFIG_V1;
            }
        } else {
            config = DEFAULT_SITE_CONFIG_V1;
        }
        dispatch({ type: 'SET_CONFIG', payload: config });
        prevConfigRef.current = JSON.stringify(config);
        setSaveStatus('idle');
        setSelectedSite(site);
        // Auto-populate business context from brand name
        setBusinessContext(config.globalData?.brandName ? `${config.globalData.brandName} — ${config.globalData?.tagline ?? ''}` : '');
        if (typeof window !== 'undefined') (window as any).__RP_EDITOR_MODE__ = true;
    }

    // ─── Autosave ──────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!selectedSite) return;
        const serialized = JSON.stringify(config);
        if (serialized === prevConfigRef.current) return;

        setSaveStatus('dirty');
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => handleSave(true), 900);

        return () => clearTimeout(saveTimeoutRef.current);
    }, [config, selectedSite]);

    // ─── Save ──────────────────────────────────────────────────────────────────

    const handleSave = useCallback(async (isAuto = false) => {
        if (!selectedSite) return;
        setSaveStatus('saving');
        try {
            if (selectedSite.source === 'demo' || isDemoActive) {
                await demoMode.saveProject(config, selectedSite.templateId ?? 'custom');
            } else if (projectManager) {
                // await saveSiteConfig(website, config) — real backend
                // Simplified: just save to demo as backup
                await demoMode.saveProject(config, selectedSite.templateId ?? 'custom');
            }
            prevConfigRef.current = JSON.stringify(config);
            setSaveStatus('saved');
            setLastSavedAt(new Date());
        } catch {
            setSaveStatus('error');
            if (!isAuto) toast.error('Error al guardar');
        }
    }, [config, selectedSite]);

    // ─── Preview en tiempo real ────────────────────────────────────────────────

    const handleOpenPreview = useCallback(() => {
        const existing = previewHandleRef.current;
        if (existing && existing.isAlive()) {
            // Ya hay una ventana abierta: enfocamos y actualizamos
            existing.focus();
            existing.update(config);
            return;
        }
        // Abrir nueva ventana de preview
        const handle = openPreviewWindow(config);
        if (!handle.isAlive() && !handle) {
            toast.error('No se pudo abrir el preview', {
                description: 'Permite ventanas emergentes para esta página y vuelve a intentarlo.',
            });
            return;
        }
        previewHandleRef.current = handle;
        setPreviewOpen(true);
        toast.success('Preview abierto ⚡', {
            description: 'Los cambios se reflejan automáticamente en la otra pestaña.',
        });

        // Detectar cuando la ventana se cierra
        const checkClosed = setInterval(() => {
            if (!handle.isAlive()) {
                setPreviewOpen(false);
                previewHandleRef.current = null;
                clearInterval(checkClosed);
            }
        }, 1000);
    }, [config]);

    // Sincronizar cambios al preview en tiempo real
    useEffect(() => {
        const handle = previewHandleRef.current;
        if (!handle || !handle.isAlive()) return;
        handle.update(config);
    }, [config]);

    // Limpiar al desmontar o salir del editor
    useEffect(() => {
        return () => {
            previewHandleRef.current?.close();
        };
    }, []);

    // ─── Publish ───────────────────────────────────────────────────────────────

    const handlePublish = useCallback(async () => {
        if (!selectedSite) return;
        await handleSave();

        if (isDemoActive || !publishAdapter) {
            // Demo mode: just download the HTML
            downloadHtml(config);
            toast.success('HTML exportado', { description: 'Tu sitio se ha descargado como HTML estático.' });
            return;
        }

        setIsPublishing(true);
        try {
            const result = await publishAdapter.publish(selectedSite.id, config);
            if (result.success && result.liveUrl) {
                setLiveUrl(result.liveUrl);
                toast.success('¡Publicado!', { description: result.liveUrl, action: { label: 'Ver', onClick: () => window.open(result.liveUrl, '_blank') } });
            } else {
                toast.error('Error al publicar', { description: result.error });
            }
        } catch (e: any) {
            toast.error('Error al publicar', { description: e?.message });
        } finally {
            setIsPublishing(false);
        }
    }, [config, selectedSite, handleSave]);

    // ─── Apply template to current site ────────────────────────────────────────

    const handleApplyTemplate = useCallback((templateConfig: SiteConfigV1) => {
        dispatch({ type: 'SET_CONFIG', payload: templateConfig });
        toast.success('Plantilla aplicada', { description: 'El contenido se ha cargado. Personaliza a tu gusto.' });
    }, [dispatch]);

    // ─── Keyboard shortcuts ────────────────────────────────────────────────────

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
            if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo, handleSave]);

    // ─── Selected block ────────────────────────────────────────────────────────

    const blocks = config.pages[currentPage]?.blocks ?? [];
    const selectedBlock = blocks.find(b => b.id === selectedBlockId) ?? null;
    const blockIndex = blocks.findIndex(b => b.id === selectedBlockId);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Dashboard
    // ─────────────────────────────────────────────────────────────────────────

    if (!selectedSite) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                {/* Dashboard header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/brand/icon.svg" alt="" className="w-10 h-10" />
                        <div>
                            <img src="/brand/wordmark.png" alt="WebPro" className="h-6 w-auto" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Editor Web Visual
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMarketplace(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all"
                        >
                            <Sparkles size={16} /> Marketplace
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 transition-colors"
                        >
                            <FolderOpen size={16} /> Importar JSON
                        </button>
                        <button
                            onClick={() => setShowNewSiteModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                        >
                            <Plus size={18} /> Nuevo sitio
                        </button>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto p-8">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-6 mb-10">
                        {[
                            { label: 'Sitios', value: sites.length, icon: '🌐' },
                            { label: 'Bloques disponibles', value: '17', icon: '🧩' },
                            { label: 'Plantillas', value: '10', icon: '✨' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200">
                                <div className="text-2xl mb-2">{s.icon}</div>
                                <div className="text-3xl font-black text-slate-900">{s.value}</div>
                                <div className="text-sm text-slate-400 font-bold mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Sites grid */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-black text-slate-900">Tus sitios</h2>

                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 size={32} className="animate-spin text-indigo-400" />
                        </div>
                    ) : sites.length === 0 ? (
                        <EmptyState onNew={() => setShowNewSiteModal(true)} />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {sites.map(site => (
                                <SiteCard
                                    key={site.id}
                                    site={site}
                                    onOpen={() => openSite(site)}
                                    onDelete={async () => {
                                        if (site.source === 'demo') {
                                            await demoMode.deleteProject(site.id);
                                            setSites(s => s.filter(x => x.id !== site.id));
                                        }
                                    }}
                                    onDuplicate={() => handleDuplicate(site)}
                                />
                            ))}
                            {/* Add new card */}
                            <button
                                onClick={() => setShowNewSiteModal(true)}
                                className="group flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-slate-400 hover:text-indigo-500"
                            >
                                <Plus size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold">Nuevo sitio</span>
                            </button>
                        </div>
                    )}

                    {/* Templates showcase */}
                    <div className="mt-12">
                        <h2 className="text-xl font-black text-slate-900 mb-5">Plantillas disponibles</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {WEBPRO_TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={async () => {
                                        const config = await demoMode.createFromTemplate(t.id, t.config.globalData.brandName);
                                        const site: SiteItem = {
                                            id: config.slug, name: config.globalData.brandName,
                                            slug: config.slug, templateId: t.id, source: 'demo', config,
                                        };
                                        setSites(s => [...s, site]);
                                        openSite(site);
                                    }}
                                    className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                                >
                                    <div className="h-8 w-full" style={{ backgroundColor: t.previewColor }} />
                                    <div className="p-3 text-left">
                                        <span className="text-lg">{t.emoji}</span>
                                        <p className="text-xs font-black text-slate-800 mt-1">{t.name}</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">{t.category}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* New site modal */}
                {showNewSiteModal && (
                    <NewSiteModal
                        onClose={() => setShowNewSiteModal(false)}
                        onCreate={async (config, templateId) => {
                            const site: SiteItem = {
                                id: config.slug, name: config.globalData.brandName,
                                slug: config.slug, templateId, source: 'demo', config,
                            };
                            await demoMode.saveProject(config, templateId);
                            setSites(s => [...s, site]);
                            setShowNewSiteModal(false);
                            openSite(site);
                        }}
                    />
                )}

                {/* Import JSON modal */}
                {showImportModal && (
                    <ImportModal
                        onImport={async (json) => {
                            const ok = await handleImportJson(json);
                            if (ok) setShowImportModal(false);
                        }}
                        onClose={() => setShowImportModal(false)}
                    />
                )}

                {/* Marketplace (también accesible desde dashboard) */}
                {showMarketplace && (
                    <Marketplace
                        onUseTemplate={async (config, templateId) => {
                            const site: SiteItem = {
                                id: config.slug, name: config.globalData.brandName,
                                slug: config.slug, templateId, source: 'demo', config,
                            };
                            await demoMode.saveProject(config, templateId);
                            setSites(s => [...s, site]);
                            setShowMarketplace(false);
                            openSite(site);
                        }}
                        onClose={() => setShowMarketplace(false)}
                    />
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER: Editor
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">

            {/* TOP BAR */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 shrink-0">

                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => { (window as any).__RP_EDITOR_MODE__ = false; setSelectedSite(null); loadSites(); }}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors group shrink-0 px-2 py-1.5 rounded-xl hover:bg-slate-50"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
                    </button>
                    <div className="h-6 w-px bg-slate-100 shrink-0" />
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img src="/brand/icon.svg" alt="" className="w-7 h-7 shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-sm font-black text-slate-800 leading-none truncate max-w-[150px]">{selectedSite.name}</h1>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                                WebPro
                            </p>
                        </div>
                    </div>
                    <SaveStatusBadge status={saveStatus} lastSavedAt={lastSavedAt} />
                </div>

                {/* Center: device + undo/redo */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        {[
                            { id: 'desktop', icon: Monitor },
                            { id: 'tablet', icon: TabletIcon },
                            { id: 'mobile', icon: Smartphone },
                        ].map(d => (
                            <button
                                key={d.id}
                                onClick={() => dispatch({ type: 'SET_DEVICE', payload: d.id as any })}
                                className={`p-2 rounded-lg transition-all ${device === d.id ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <d.icon size={16} />
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-0.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        <button onClick={undo} disabled={!canUndo} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 transition-all disabled:opacity-20" title="Deshacer (⌘Z)">
                            <Undo2 size={16} />
                        </button>
                        <button onClick={redo} disabled={!canRedo} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 transition-all disabled:opacity-20" title="Rehacer (⌘Y)">
                            <Redo2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">

                    {/* COLLAB */}
                    {selectedSite && (
                        <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
                            {collabEnabled ? (
                                <CollabPresence
                                    roomId={collabRoomId}
                                    localUser={localCollabUser}
                                    config={config}
                                    currentPage={currentPage}
                                    selectedBlockId={selectedBlockId}
                                    onRemoteUpdate={(remoteConfig) => {
                                        dispatch({ type: 'SET_CONFIG', payload: remoteConfig });
                                    }}
                                />
                            ) : (
                                <button
                                    onClick={() => setCollabEnabled(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-50 hover:text-violet-700 border border-slate-100 hover:border-violet-200 transition-all"
                                    title="Activar edición colaborativa en tiempo real"
                                >
                                    <Users size={13} /> Colaborar
                                </button>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setShowThemePicker(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border border-slate-100 transition-all"
                    >
                        <Palette size={14} /> Tema
                    </button>

                    {/* MARKETPLACE BUTTON */}
                    <button
                        onClick={() => setShowMarketplace(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 border border-slate-100 transition-all"
                        title="Explorar marketplace de plantillas"
                    >
                        <Sparkles size={14} /> Plantillas
                    </button>

                    <button onClick={() => setShowAnalytics(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-700 border border-slate-100 transition-all" title="Analytics">
                        <BarChart2 size={14} /> Analytics
                    </button>

                    <button onClick={() => setShowABTests(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-50 hover:text-violet-700 border border-slate-100 transition-all" title="A/B Testing">
                        <FlaskConical size={14} /> A/B
                    </button>

                    <button onClick={() => setShowCMS(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border border-slate-100 transition-all" title="CMS">
                        <Database size={14} /> CMS
                    </button>

                    <button onClick={() => setShowDomain(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 hover:text-cyan-700 border border-slate-100 transition-all" title="Dominio personalizado">
                        <Globe size={14} /> Dominio
                    </button>

                    <button onClick={() => setShowEmail(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-700 border border-slate-100 transition-all" title="Email Builder">
                        <Mail size={14} /> Email
                    </button>

                    <button onClick={() => setShowIntegrations(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-700 border border-slate-100 transition-all" title="Zapier, Make, Webhooks">
                        <Zap size={14} /> Zapier
                    </button>

                    <button onClick={() => setShowMobile(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 border border-slate-100 transition-all" title="App móvil + Push">
                        <Smartphone size={14} /> Mobile App
                    </button>

                    {/* PREVIEW BUTTON */}
                    <button
                        onClick={handleOpenPreview}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${previewOpen
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200'
                            }`}
                        title={previewOpen ? 'Preview abierto — click para enfocar' : 'Abrir preview en tiempo real'}
                    >
                        <Eye size={14} />
                        {previewOpen ? (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                        ) : 'Preview'}
                    </button>

                    {/* HISTORY BUTTON */}
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-slate-100 transition-all"
                        title="Historial de versiones"
                    >
                        <RefreshCw size={14} /> Historial
                    </button>

                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border border-slate-100 transition-all"
                    >
                        <Download size={14} /> Exportar
                    </button>

                    {liveUrl && (
                        <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 border border-emerald-100 transition-all"
                        >
                            <Eye size={14} /> Ver web
                        </a>
                    )}

                    <button
                        onClick={() => handleSave()}
                        disabled={saveStatus === 'saving'}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 disabled:opacity-50 transition-all"
                    >
                        <Save size={14} /> Guardar
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                        {isPublishing ? <Loader2 size={14} className="animate-spin" /> : isDemoActive ? <Download size={14} /> : <Globe size={14} />}
                        {isPublishing ? 'Publicando…' : isDemoActive ? 'Exportar HTML' : 'Publicar'}
                    </button>

                    <UpdateButton />
                </div>
            </header>

            {/* PAGE BAR */}
            <PageBar
                config={config}
                currentPage={currentPage}
                onSetPage={setCurrentPage}
                onAddPage={addPage}
                onRemovePage={removePage}
                onRenamePage={renamePage}
            />

            {/* 3-COLUMN LAYOUT */}
            <div className="grid grid-cols-[248px_1fr_304px] flex-1 overflow-hidden">

                {/* Left: block library + templates */}
                <div className="min-w-0 overflow-hidden border-r border-slate-200 bg-white">
                    <SidebarLeft
                        onAddBlock={addBlock}
                        onApplyTemplate={handleApplyTemplate}
                    />
                </div>

                {/* Center: canvas */}
                <div className="min-w-0 overflow-hidden">
                    <Canvas
                        config={config}
                        device={device}
                        currentPage={currentPage}
                        selectedBlockId={selectedBlockId}
                        inlineEditBlockId={inlineEditBlockId}
                        onSelectBlock={(id) => dispatch({ type: 'SELECT_BLOCK', payload: id })}
                        onStartInlineEdit={startInlineEdit}
                        onStopInlineEdit={stopInlineEdit}
                        onUpdateBlock={updateBlock}
                    />
                </div>

                {/* Right: inspector */}
                <div className="min-w-0 overflow-hidden border-l border-slate-200 bg-white">
                    <SidebarRight
                        selectedBlock={selectedBlock}
                        tab={inspectorTab}
                        setTab={(t) => dispatch({ type: 'SET_INSPECTOR_TAB', payload: t })}
                        device={device}
                        onUpdateBlock={updateBlock}
                        onRemoveBlock={removeBlock}
                        onMoveBlock={moveBlock}
                        blockIndex={blockIndex}
                        businessContext={businessContext}
                    />
                </div>
            </div>

            {/* MARKETPLACE */}
            {showMarketplace && (
                <Marketplace
                    onUseTemplate={async (config, templateId) => {
                        dispatch({ type: 'SET_CONFIG', payload: config });
                        setShowMarketplace(false);
                        toast.success('Plantilla aplicada ✨', { description: config.globalData.brandName });
                    }}
                    onClose={() => setShowMarketplace(false)}
                />
            )}

            {/* EMAIL BUILDER */}
            {showEmail && selectedSite && (
                <EmailBuilderPanel siteSlug={selectedSite.id} onClose={() => setShowEmail(false)} />
            )}

            {/* INTEGRATIONS HUB */}
            {showIntegrations && selectedSite && (
                <IntegrationsHub siteSlug={selectedSite.id} onClose={() => setShowIntegrations(false)} />
            )}

            {/* MOBILE APP + PUSH */}
            {showMobile && selectedSite && (
                <MobilePanel siteSlug={selectedSite.id} siteConfig={config} onClose={() => setShowMobile(false)} />
            )}

            {/* ANALYTICS */}
            {showAnalytics && selectedSite && (
                <AnalyticsDashboard
                    siteSlug={selectedSite.id}
                    siteName={selectedSite.name}
                    onClose={() => setShowAnalytics(false)}
                />
            )}

            {/* A/B TESTING */}
            {showABTests && selectedSite && (
                <ABTestManager
                    siteSlug={selectedSite.id}
                    selectedBlock={selectedBlock}
                    onClose={() => setShowABTests(false)}
                    onApplyBlock={(block) => updateBlock(block.id, block)}
                />
            )}

            {/* CUSTOM DOMAIN */}
            {showDomain && selectedSite && (
                <CustomDomain
                    siteSlug={selectedSite.id}
                    siteName={selectedSite.name}
                    onClose={() => setShowDomain(false)}
                />
            )}

            {/* CMS */}
            {showCMS && selectedSite && (
                <CMSPanel
                    siteSlug={selectedSite.id}
                    onClose={() => setShowCMS(false)}
                />
            )}

            {/* THEME PICKER */}
            {showThemePicker && (
                <ThemePicker
                    currentTheme={config.theme}
                    onApply={(tokens) => dispatch({ type: 'SET_THEME', payload: tokens })}
                    onClose={() => setShowThemePicker(false)}
                />
            )}

            {/* EXPORT MODAL */}
            {showExportModal && (
                <ExportModal
                    config={config}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            {/* HISTORY MODAL */}
            {showHistoryModal && selectedSite && (
                <HistoryModal
                    projectId={selectedSite.id}
                    onRestore={(restoredConfig) => {
                        dispatch({ type: 'SET_CONFIG', payload: restoredConfig });
                        setShowHistoryModal(false);
                        toast.success('Versión restaurada');
                    }}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}
        </div>
    );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onNew: () => void }> = ({ onNew }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Sin sitios todavía</h3>
        <p className="text-slate-400 mb-6 max-w-sm">Crea tu primer sitio desde una plantilla y lo tendrás listo en segundos.</p>
        <button onClick={onNew} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors">
            <Plus size={18} /> Crear mi primer sitio
        </button>
    </div>
);

const SiteCard: React.FC<{ site: SiteItem; onOpen: () => void; onDelete: () => void; onDuplicate: () => void }> = ({ site, onOpen, onDelete, onDuplicate }) => {
    const template = WEBPRO_TEMPLATES.find(t => t.id === site.templateId);
    return (
        <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="h-24 flex items-center justify-center text-4xl cursor-pointer" style={{ backgroundColor: template?.previewColor ?? '#4f46e5', opacity: 0.85 }} onClick={onOpen}>
                <span>{template?.emoji ?? '🌐'}</span>
            </div>
            <div className="p-4">
                <h3 className="font-black text-slate-800 text-sm truncate mb-0.5">{site.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold truncate">/{site.slug}</p>
                <div className="flex gap-1.5 mt-3">
                    <button onClick={onOpen} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-colors">
                        <FolderOpen size={12} /> Editar
                    </button>
                    {site.source === 'demo' && (<>
                        <button onClick={onDuplicate} className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors" title="Duplicar">
                            <ExternalLink size={14} />
                        </button>
                        <button onClick={onDelete} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                        </button>
                    </>)}
                </div>
            </div>
        </div>
    );
};

const NewSiteModal: React.FC<{
    onClose: () => void;
    onCreate: (config: SiteConfigV1, templateId: string) => Promise<void>;
}> = ({ onClose, onCreate }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<WebProTemplate>(WEBPRO_TEMPLATES[0]);
    const [brandName, setBrandName] = useState('');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[101] bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Nuevo sitio web</h2>
                        <p className="text-slate-400 text-sm mt-1">Elige una plantilla y personaliza el nombre</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* Brand name */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre de tu marca / proyecto</label>
                        <input
                            value={brandName}
                            onChange={e => setBrandName(e.target.value)}
                            placeholder={selectedTemplate.config.globalData.brandName}
                            className="w-full px-5 py-3.5 border-2 border-slate-200 rounded-2xl text-lg font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Template grid */}
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Plantilla base</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {WEBPRO_TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedTemplate.id === t.id
                                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="h-12 w-full flex items-center justify-center text-2xl" style={{ backgroundColor: t.previewColor }}>
                                    {t.emoji}
                                </div>
                                <div className="p-2 bg-white text-left">
                                    <p className="text-[10px] font-black text-slate-800">{t.name}</p>
                                    <p className="text-[9px] text-slate-400">{t.config.pages['/']?.blocks.length} bloques</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            const config = await demoMode.createFromTemplate(
                                selectedTemplate.id,
                                brandName.trim() || selectedTemplate.config.globalData.brandName
                            );
                            await onCreate(config, selectedTemplate.id);
                        }}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                        <Play size={18} /> Crear y abrir editor
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExportModal: React.FC<{ config: SiteConfigV1; onClose: () => void }> = ({ config, onClose }) => {
    const pageCount = Object.keys(config.pages).length;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[101] bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900">Exportar sitio</h2>
                    <button onClick={onClose} className="p-3 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-3">
                    <button
                        onClick={() => { downloadHtml(config); onClose(); }}
                        className="w-full flex items-center gap-4 p-5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all group text-left"
                    >
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center text-2xl shrink-0">🌐</div>
                        <div>
                            <h3 className="font-black text-slate-800">Página de inicio</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Exporta solo la página principal como un .html</p>
                        </div>
                        <Download size={16} className="ml-auto text-slate-300 group-hover:text-indigo-500" />
                    </button>

                    {pageCount > 1 && (
                        <button
                            onClick={() => { downloadAllPages(config); onClose(); }}
                            className="w-full flex items-center gap-4 p-5 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-2xl transition-all group text-left"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 group-hover:border-violet-200 flex items-center justify-center text-2xl shrink-0">📂</div>
                            <div>
                                <h3 className="font-black text-slate-800">Todas las páginas</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">{pageCount} archivos HTML, uno por página</p>
                            </div>
                            <Download size={16} className="ml-auto text-slate-300 group-hover:text-violet-500" />
                        </button>
                    )}

                    <button
                        onClick={() => { downloadProjectJson(config); onClose(); }}
                        className="w-full flex items-center gap-4 p-5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl transition-all group text-left"
                    >
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 group-hover:border-emerald-200 flex items-center justify-center text-2xl shrink-0">📦</div>
                        <div>
                            <h3 className="font-black text-slate-800">Proyecto JSON</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Guarda todas las páginas para importar después</p>
                        </div>
                        <Download size={16} className="ml-auto text-slate-300 group-hover:text-emerald-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── History Modal ─────────────────────────────────────────────────────────────

const HistoryModal: React.FC<{
    projectId: string;
    onRestore: (config: SiteConfigV1) => void;
    onClose: () => void;
}> = ({ projectId, onRestore, onClose }) => {
    const history = demoMode.getHistory(projectId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[101] bg-white rounded-[2rem] shadow-2xl w-full max-w-md flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Historial de versiones</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Últimas {history.length} versiones guardadas</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <RefreshCw size={32} className="mb-3 opacity-30" />
                            <p className="font-bold text-sm">Sin versiones guardadas</p>
                            <p className="text-xs mt-1">Las versiones se guardan automáticamente al editar</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((v, i) => (
                                <div key={v.id} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-sm font-black text-slate-500">
                                        {i === 0 ? '✦' : `v${history.length - i}`}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-800 truncate">
                                            {i === 0 ? 'Versión actual' : v.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(v.savedAt).toLocaleDateString('es', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    {i > 0 && (
                                        <button
                                            onClick={() => onRestore(v.config)}
                                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all"
                                        >
                                            Restaurar
                                        </button>
                                    )}
                                    {i === 0 && (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            Actual
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 shrink-0">
                    <p className="text-[10px] text-slate-400 text-center">
                        Las versiones se guardan automáticamente cada vez que guardas el proyecto. Se mantienen las últimas 10.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Import Modal ──────────────────────────────────────────────────────────────

const ImportModal: React.FC<{
    onImport: (json: string) => void;
    onClose: () => void;
}> = ({ onImport, onClose }) => {
    const [json, setJson] = useState('');
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    function handleFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setJson(text);
        };
        reader.readAsText(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.json')) handleFile(file);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[101] bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Importar proyecto</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Carga un archivo .json exportado desde WebPro</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all mb-4 ${dragging
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                >
                    <div className="text-3xl">📦</div>
                    <div className="text-center">
                        <p className="font-black text-slate-700 text-sm">Arrastra tu .json aquí</p>
                        <p className="text-slate-400 text-xs mt-1">o haz clic para seleccionar archivo</p>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                </div>

                {/* Or paste JSON */}
                <div className="mb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">O pega el JSON directamente</label>
                    <textarea
                        value={json}
                        onChange={e => setJson(e.target.value)}
                        placeholder='{"webpro": "1.0", "config": {...}}'
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 resize-none"
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-colors text-sm">
                        Cancelar
                    </button>
                    <button
                        onClick={async () => { if (json.trim()) await onImport(json.trim()); }}
                        disabled={!json.trim()}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Importar proyecto
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Exported component with ErrorBoundary ─────────────────────────────────────

export const WebsiteBuilder: React.FC = () => (
    <BuilderErrorBoundary>
        <WebProEditorInner />
    </BuilderErrorBoundary>
);
