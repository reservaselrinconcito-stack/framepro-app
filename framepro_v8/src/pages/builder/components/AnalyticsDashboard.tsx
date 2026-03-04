/**
 * AnalyticsDashboard.tsx — FramePro Analytics UI
 *
 * Panel completo de métricas del sitio.
 * Muestra: vistas, sesiones, CTAs, dispositivos, referrers, páginas top.
 */

import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Users, MousePointer, Clock, Smartphone, Monitor, Tablet, Globe, RefreshCw, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import { analytics, AnalyticsReport } from '../framepro/analytics';

// ─── Mini bar chart ────────────────────────────────────────────────────────────

const MiniBarChart: React.FC<{ data: Array<{ date: string; views: number }> }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.views), 1);
    return (
        <div className="flex items-end gap-0.5 h-16 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group" title={`${d.date}: ${d.views} vistas`}>
                    <div
                        className="w-full bg-indigo-500 rounded-sm group-hover:bg-indigo-400 transition-colors min-h-[2px]"
                        style={{ height: `${(d.views / max) * 100}%` }}
                    />
                </div>
            ))}
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    sub?: string;
}> = ({ label, value, icon, color, sub }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        </div>
        <p className="text-3xl font-black text-slate-900">{typeof value === 'number' ? value.toLocaleString('es') : value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
);

// ─── Device Donut ─────────────────────────────────────────────────────────────

const DeviceBreakdown: React.FC<{ breakdown: { mobile: number; tablet: number; desktop: number } }> = ({ breakdown }) => {
    const total = breakdown.mobile + breakdown.tablet + breakdown.desktop || 1;
    const pct = (n: number) => Math.round((n / total) * 100);
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dispositivos</p>
            <div className="space-y-3">
                {[
                    { label: 'Desktop', count: breakdown.desktop, icon: <Monitor size={14} />, color: 'bg-indigo-500' },
                    { label: 'Mobile', count: breakdown.mobile, icon: <Smartphone size={14} />, color: 'bg-violet-500' },
                    { label: 'Tablet', count: breakdown.tablet, icon: <Tablet size={14} />, color: 'bg-cyan-500' },
                ].map(d => (
                    <div key={d.label} className="flex items-center gap-3">
                        <div className="text-slate-400">{d.icon}</div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-700">{d.label}</span>
                                <span className="text-xs font-black text-slate-500">{pct(d.count)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${d.color}`} style={{ width: `${pct(d.count)}%` }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────

interface AnalyticsDashboardProps {
    siteSlug: string;
    siteName: string;
    onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ siteSlug, siteName, onClose }) => {
    const [report, setReport] = useState<AnalyticsReport>(() => analytics.getReport(siteSlug));
    const [clearing, setClearing] = useState(false);

    const refresh = () => setReport(analytics.getReport(siteSlug));

    const handleClear = () => {
        if (!window.confirm('¿Eliminar todos los datos de analytics de este sitio?')) return;
        analytics.clearData(siteSlug);
        setReport(analytics.getReport(siteSlug));
    };

    const noData = report.totalViews === 0;

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center">
                        <BarChart2 size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-900">Analytics · {siteName}</h1>
                        <p className="text-[10px] text-slate-400">Privacy-first · Sin cookies · Datos locales</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">
                        <RefreshCw size={13} /> Actualizar
                    </button>
                    <button onClick={handleClear} className="px-3 py-2 border border-red-200 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50">
                        Borrar datos
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {noData ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <BarChart2 size={48} className="mb-4 opacity-20" />
                        <p className="font-black text-lg text-slate-600 mb-2">Sin datos todavía</p>
                        <p className="text-sm text-center max-w-sm">Los datos aparecerán cuando exporte el sitio con el script de analytics incluido y los visitantes lo abran en su navegador.</p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-6xl mx-auto">
                        {/* KPI row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Vistas totales" value={report.totalViews} icon={<TrendingUp size={16} className="text-indigo-600" />} color="bg-indigo-50" />
                            <StatCard label="Sesiones únicas" value={report.uniqueSessions} icon={<Users size={16} className="text-violet-600" />} color="bg-violet-50" />
                            <StatCard label="Tiempo medio" value={`${report.avgSessionDuration}s`} icon={<Clock size={16} className="text-emerald-600" />} color="bg-emerald-50" sub="por sesión" />
                            <StatCard label="Conversiones CTA" value={report.ctaConversions.reduce((s, c) => s + c.clicks, 0)} icon={<MousePointer size={16} className="text-rose-600" />} color="bg-rose-50" />
                        </div>

                        {/* Chart + devices */}
                        <div className="grid grid-cols-[1fr_240px] gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vistas por día (últimos 30 días)</p>
                                <MiniBarChart data={report.dailyViews} />
                                <div className="flex items-center justify-between mt-2 text-[9px] text-slate-400 font-bold">
                                    <span>{report.dailyViews[0]?.date}</span>
                                    <span>{report.dailyViews[report.dailyViews.length - 1]?.date}</span>
                                </div>
                            </div>
                            <DeviceBreakdown breakdown={report.deviceBreakdown} />
                        </div>

                        {/* Pages + CTAs */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Top pages */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Páginas más visitadas</p>
                                <div className="space-y-3">
                                    {report.topPages.slice(0, 8).map(page => (
                                        <div key={page.path} className="flex items-center gap-3">
                                            <Globe size={12} className="text-slate-300 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-700 truncate">{page.path === '/' ? '🏠 Inicio' : page.path}</span>
                                                    <span className="text-xs font-black text-slate-900 ml-2 shrink-0">{page.views.toLocaleString('es')}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[9px] text-slate-400">{page.uniqueSessions} sesiones</span>
                                                    <span className="text-[9px] text-slate-400">⌛ {page.avgTimeSeconds}s</span>
                                                    <span className="text-[9px] text-slate-400">📜 {page.scrollDepth}%</span>
                                                    <span className={`text-[9px] font-bold ${page.bounceRate > 60 ? 'text-red-400' : 'text-emerald-500'}`}>
                                                        {page.bounceRate}% bounce
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA conversions */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Conversiones CTA</p>
                                {report.ctaConversions.length === 0 ? (
                                    <p className="text-sm text-slate-400">Sin clics registrados todavía.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {report.ctaConversions.slice(0, 10).map((cta, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                                                <MousePointer size={12} className="text-indigo-400 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-slate-700 truncate">"{cta.label}"</p>
                                                    <p className="text-[9px] text-slate-400">{cta.page}</p>
                                                </div>
                                                <span className="text-sm font-black text-indigo-600">{cta.clicks}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Referrers + UTM */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Fuentes de tráfico</p>
                                {report.topReferrers.length === 0 ? (
                                    <p className="text-sm text-slate-400">Sin referrers registrados.</p>
                                ) : report.topReferrers.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                                        <span className="text-xs text-slate-600 font-mono truncate">{r.referrer}</span>
                                        <span className="text-xs font-black text-slate-800">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Campañas UTM</p>
                                {report.topUtmSources.length === 0 ? (
                                    <p className="text-sm text-slate-400">Sin parámetros UTM detectados.</p>
                                ) : report.topUtmSources.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                                        <span className="text-xs text-slate-600 font-bold">{u.source}</span>
                                        <span className="text-xs font-black text-slate-800">{u.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
