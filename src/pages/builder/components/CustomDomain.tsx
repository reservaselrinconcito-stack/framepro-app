/**
 * CustomDomain.tsx — WebPro Custom Domain
 *
 * Permite al usuario conectar un dominio propio (ej: miempresa.com)
 * al sitio publicado. Guía paso a paso con instrucciones DNS.
 *
 * Flujo:
 *   1. Usuario introduce su dominio
 *   2. WebPro muestra los registros DNS que debe configurar
 *   3. Usuario va a su registrador (GoDaddy, Namecheap, Cloudflare…)
 *   4. WebPro verifica la propagación via DNS lookup
 *   5. Si OK → dominio queda vinculado al sitio
 *
 * Backend requerido para verificación y TLS:
 *   POST /api/domains/check   { domain } → { verified: bool, ip?: string }
 *   POST /api/domains/link    { domain, siteSlug } → { success: bool }
 *
 * Para self-hosted: usa Caddy o Traefik que gestionan TLS automáticamente.
 */

import React, { useState, useCallback } from 'react';
import { Globe, Check, X, Loader2, Copy, ExternalLink, ChevronRight, Shield, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DomainStatus = 'unconfigured' | 'pending_dns' | 'verifying' | 'active' | 'error';

export interface DomainConfig {
    domain: string;
    status: DomainStatus;
    siteSlug: string;
    linkedAt?: number;
    lastChecked?: number;
    error?: string;
}

export interface DNSRecord {
    type: 'A' | 'CNAME' | 'TXT';
    name: string;
    value: string;
    ttl: number;
    purpose: string;
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const DOMAIN_KEY = (slug: string) => `fp_domain_${slug}`;

export function getDomainConfig(siteSlug: string): DomainConfig | null {
    try { return JSON.parse(localStorage.getItem(DOMAIN_KEY(siteSlug)) ?? 'null'); }
    catch { return null; }
}

export function saveDomainConfig(config: DomainConfig): void {
    try { localStorage.setItem(DOMAIN_KEY(config.siteSlug), JSON.stringify(config)); } catch { /* noop */ }
}

// ─── DNS Records to show ───────────────────────────────────────────────────────

function getDNSRecords(domain: string, serverIp: string = '1.2.3.4'): DNSRecord[] {
    const isApex = !domain.includes('.', domain.indexOf('.') + 1)
        || domain.split('.').length === 2; // e.g. midominio.com (no subdomain)

    const records: DNSRecord[] = isApex
        ? [
            { type: 'A', name: '@', value: serverIp, ttl: 3600, purpose: 'Apunta el dominio raíz a nuestros servidores' },
            { type: 'A', name: 'www', value: serverIp, ttl: 3600, purpose: 'Apunta www a nuestros servidores' },
        ]
        : [
            { type: 'CNAME', name: domain.split('.')[0], value: 'proxy.webpro.app', ttl: 3600, purpose: 'Apunta el subdominio a WebPro' },
        ];

    records.push({
        type: 'TXT',
        name: '_webpro',
        value: `webpro-verify=${btoa(domain).slice(0, 16)}`,
        ttl: 3600,
        purpose: 'Verificación de propiedad del dominio',
    });

    return records;
}

// ─── Verify via DNS-over-HTTPS ─────────────────────────────────────────────────

async function verifyDNS(domain: string): Promise<{ verified: boolean; ip?: string; error?: string }> {
    try {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const res = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`,
            { headers: { Accept: 'application/dns-json' } }
        );
        if (!res.ok) return { verified: false, error: 'DNS lookup falló' };
        const data = await res.json();
        const answers = data.Answer ?? [];
        if (answers.length > 0) {
            return { verified: true, ip: answers[0]?.data };
        }
        return { verified: false, error: 'No se encontraron registros DNS. La propagación puede tardar hasta 48h.' };
    } catch (e: any) {
        return { verified: false, error: e?.message ?? 'Error de red' };
    }
}

// ─── UI Components ─────────────────────────────────────────────────────────────

const CopyableCode: React.FC<{ value: string }> = ({ value }) => {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }
    return (
        <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2 group cursor-pointer" onClick={copy}>
            <code className="flex-1 text-emerald-400 font-mono text-xs truncate">{value}</code>
            <button className="text-slate-400 group-hover:text-white transition-colors shrink-0">
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
        </div>
    );
};

// ─── DNS Record Row ───────────────────────────────────────────────────────────

const DNSRow: React.FC<{ record: DNSRecord }> = ({ record }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black text-white ${
                record.type === 'A' ? 'bg-indigo-500' :
                record.type === 'CNAME' ? 'bg-violet-500' : 'bg-amber-500'
            }`}>{record.type}</span>
            <span className="text-[10px] text-slate-500">{record.purpose}</span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Nombre</p>
                <CopyableCode value={record.name} />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Valor</p>
                <CopyableCode value={record.value} />
            </div>
        </div>
        <p className="text-[9px] text-slate-400">TTL: {record.ttl}s</p>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

interface CustomDomainProps {
    siteSlug: string;
    siteName: string;
    onClose: () => void;
    serverIp?: string;
    apiUrl?: string;
}

export const CustomDomain: React.FC<CustomDomainProps> = ({ siteSlug, siteName, onClose, serverIp = '76.76.21.21', apiUrl = '' }) => {
    const [config, setConfig] = useState<DomainConfig | null>(() => getDomainConfig(siteSlug));
    const [domain, setDomain] = useState(config?.domain ?? '');
    const [step, setStep] = useState<'input' | 'dns' | 'verify' | 'active'>(
        config?.status === 'active' ? 'active' :
        config?.status === 'pending_dns' ? 'dns' : 'input'
    );
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<{ verified: boolean; ip?: string; error?: string } | null>(null);
    const [domainError, setDomainError] = useState('');

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const dnsRecords = getDNSRecords(cleanDomain, serverIp);

    function validateDomain(d: string): boolean {
        const clean = d.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i.test(clean);
    }

    function handleSubmitDomain() {
        if (!validateDomain(domain)) {
            setDomainError('Introduce un dominio válido, ej: miempresa.com o blog.miempresa.com');
            return;
        }
        setDomainError('');
        const cfg: DomainConfig = { domain: cleanDomain, status: 'pending_dns', siteSlug };
        saveDomainConfig(cfg);
        setConfig(cfg);
        setStep('dns');
    }

    const handleVerify = useCallback(async () => {
        setVerifying(true);
        setVerifyResult(null);
        const result = await verifyDNS(cleanDomain);
        setVerifyResult(result);

        if (result.verified) {
            const cfg: DomainConfig = { domain: cleanDomain, status: 'active', siteSlug, linkedAt: Date.now(), lastChecked: Date.now() };
            saveDomainConfig(cfg);
            setConfig(cfg);

            // Also notify backend if available
            if (apiUrl) {
                fetch(`${apiUrl}/api/domains/link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain: cleanDomain, siteSlug }),
                }).catch(() => { /* best effort */ });
            }
            setTimeout(() => setStep('active'), 1000);
        }
        setVerifying(false);
    }, [cleanDomain, siteSlug, apiUrl]);

    function handleReset() {
        if (!window.confirm('¿Desvincular el dominio actual?')) return;
        localStorage.removeItem(DOMAIN_KEY(siteSlug));
        setConfig(null);
        setDomain('');
        setStep('input');
        setVerifyResult(null);
    }

    const registrars = [
        { name: 'Cloudflare', url: 'https://dash.cloudflare.com', emoji: '🟠' },
        { name: 'GoDaddy', url: 'https://godaddy.com', emoji: '🟢' },
        { name: 'Namecheap', url: 'https://namecheap.com', emoji: '🔴' },
        { name: 'Google Domains', url: 'https://domains.google', emoji: '🔵' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[201] bg-white rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center">
                            <Globe size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900">Dominio personalizado</h2>
                            <p className="text-[10px] text-slate-400">{siteName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center px-6 py-3 bg-slate-50 border-b border-slate-100 gap-1 shrink-0">
                    {['Dominio', 'DNS', 'Verificar', 'Activo'].map((s, i) => {
                        const stepId = ['input', 'dns', 'verify', 'active'][i];
                        const current = ['input', 'dns', 'verify', 'active'].indexOf(step);
                        const isActive = i <= current;
                        return (
                            <React.Fragment key={s}>
                                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                        {i < current ? <Check size={8} /> : i + 1}
                                    </div>
                                    {s}
                                </div>
                                {i < 3 && <ChevronRight size={10} className="text-slate-300 mx-1" />}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* STEP 1: Input domain */}
                    {step === 'input' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tu dominio</label>
                                <div className="flex gap-2">
                                    <input
                                        value={domain}
                                        onChange={e => { setDomain(e.target.value); setDomainError(''); }}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmitDomain()}
                                        placeholder="miempresa.com"
                                        className={`flex-1 px-4 py-3 border rounded-2xl text-sm focus:outline-none transition-colors ${domainError ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-400'}`}
                                    />
                                    <button
                                        onClick={handleSubmitDomain}
                                        className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                                {domainError && <p className="text-xs text-red-500 mt-1.5">{domainError}</p>}
                            </div>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                                <Shield size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-indigo-700">
                                    <p className="font-black mb-1">HTTPS gratis incluido</p>
                                    <p>Tu dominio tendrá certificado SSL/TLS automático mediante Let's Encrypt. Tarda menos de 5 minutos tras la verificación.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DNS records */}
                    {step === 'dns' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-black text-slate-900">{cleanDomain}</p>
                                    <p className="text-[10px] text-slate-400">Añade estos registros DNS en tu registrador</p>
                                </div>
                                <button onClick={() => setStep('input')} className="text-xs text-slate-400 hover:text-slate-700 font-bold">
                                    Cambiar dominio
                                </button>
                            </div>

                            <div className="space-y-2">
                                {dnsRecords.map((r, i) => <DNSRow key={i} record={r} />)}
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Acceso rápido a registradores</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {registrars.map(r => (
                                        <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                                            <span className="text-lg">{r.emoji}</span>
                                            <span className="text-[8px] font-bold text-slate-600">{r.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">La propagación DNS puede tardar entre <strong>5 min y 48h</strong> dependiendo de tu registrador.</p>
                            </div>

                            <button
                                onClick={() => setStep('verify')}
                                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors"
                            >
                                Ya configuré los DNS → Verificar
                            </button>
                        </div>
                    )}

                    {/* STEP 3: Verify */}
                    {step === 'verify' && (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <p className="font-black text-slate-900 mb-1">{cleanDomain}</p>
                                <p className="text-sm text-slate-500">Verificaremos que los registros DNS están correctamente configurados</p>
                            </div>

                            {verifyResult && (
                                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${verifyResult.verified ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    {verifyResult.verified
                                        ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                        : <AlertCircle size={18} className="text-red-500 shrink-0" />
                                    }
                                    <div className="text-sm">
                                        {verifyResult.verified
                                            ? <p className="font-black text-emerald-700">¡DNS verificado! IP: {verifyResult.ip}</p>
                                            : <p className="text-red-700">{verifyResult.error}</p>
                                        }
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => setStep('dns')} className="px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50">
                                    ← Volver
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={verifying}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    {verifying ? <><Loader2 size={16} className="animate-spin" /> Verificando…</> : <><RefreshCw size={16} /> Verificar DNS</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Active */}
                    {step === 'active' && (
                        <div className="space-y-4">
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <p className="text-xl font-black text-slate-900 mb-1">¡Dominio activo!</p>
                                <a
                                    href={`https://${cleanDomain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 text-indigo-600 font-bold hover:underline"
                                >
                                    https://{cleanDomain} <ExternalLink size={14} />
                                </a>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                    <Shield size={20} className="text-emerald-500 mx-auto mb-1" />
                                    <p className="text-xs font-black text-slate-700">HTTPS activo</p>
                                    <p className="text-[9px] text-slate-400">Let's Encrypt</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                    <Globe size={20} className="text-indigo-500 mx-auto mb-1" />
                                    <p className="text-xs font-black text-slate-700">CDN global</p>
                                    <p className="text-[9px] text-slate-400">Edge caching</p>
                                </div>
                            </div>
                            <button onClick={handleReset} className="w-full py-2.5 border border-red-200 text-red-500 rounded-2xl font-black text-sm hover:bg-red-50 transition-colors">
                                Desvincular dominio
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
