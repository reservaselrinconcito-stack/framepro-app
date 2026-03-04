/**
 * AIContentGenerator.tsx — FramePro AI Content
 *
 * Panel que permite generar contenido automático para cada bloque
 * usando Claude vía la API de Anthropic.
 *
 * El usuario describe su negocio → la IA genera textos, CTAs, features,
 * testimonials, stats, etc. listos para usar en el bloque seleccionado.
 */

import React, { useState, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { BlockInstance } from '../../../modules/webBuilder/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedContent {
    [key: string]: any;
}

// ─── Prompts por tipo de bloque ────────────────────────────────────────────────

function buildPrompt(block: BlockInstance, businessContext: string, tone: string): string {
    const toneInstr = {
        professional: 'Usa un tono profesional, claro y orientado a resultados.',
        friendly: 'Usa un tono cercano, cálido y conversacional.',
        bold: 'Usa un tono audaz, directo y con impacto. Frases cortas y poderosas.',
        luxury: 'Usa un tono exclusivo, sofisticado y aspiracional. Palabras premium.',
        minimal: 'Usa un tono minimalista. Muy pocas palabras, máximo impacto.',
    }[tone] ?? 'Usa un tono profesional.';

    const base = `Eres un experto copywriter. ${toneInstr}
Negocio: ${businessContext}
Idioma: español.
Responde SOLO con un objeto JSON válido, sin backticks, sin texto adicional.`;

    const prompts: Record<string, string> = {
        Hero: `${base}
Genera contenido para una sección Hero de una web. JSON con exactamente estas claves:
{
  "headline": "Título principal impactante (máx 8 palabras)",
  "subheadline": "Subtítulo que explica la propuesta de valor (máx 20 palabras)",
  "ctaLabel": "Texto del botón principal (máx 4 palabras)",
  "secondaryCtaLabel": "Texto del botón secundario (máx 4 palabras)"
}`,

        Features: `${base}
Genera contenido para una sección de características/ventajas. JSON:
{
  "headline": "Título de la sección (máx 6 palabras)",
  "subheadline": "Subtítulo descriptivo (máx 15 palabras)",
  "features": [
    {"title": "Característica 1 (máx 4 palabras)", "description": "Descripción breve (máx 15 palabras)", "icon": "Star"},
    {"title": "Característica 2 (máx 4 palabras)", "description": "Descripción breve (máx 15 palabras)", "icon": "Shield"},
    {"title": "Característica 3 (máx 4 palabras)", "description": "Descripción breve (máx 15 palabras)", "icon": "Zap"},
    {"title": "Característica 4 (máx 4 palabras)", "description": "Descripción breve (máx 15 palabras)", "icon": "Award"}
  ]
}`,

        Testimonials: `${base}
Genera testimonios realistas y creíbles. JSON:
{
  "headline": "Título de la sección testimonios (máx 6 palabras)",
  "subheadline": "Subtítulo (máx 12 palabras)",
  "testimonials": [
    {"name": "Nombre Apellido", "role": "Cargo, Empresa", "text": "Testimonio realista (30-50 palabras)", "rating": 5},
    {"name": "Nombre Apellido", "role": "Cargo, Empresa", "text": "Testimonio realista (30-50 palabras)", "rating": 5},
    {"name": "Nombre Apellido", "role": "Cargo, Empresa", "text": "Testimonio realista (30-50 palabras)", "rating": 5}
  ]
}`,

        Stats: `${base}
Genera estadísticas impactantes y creíbles para este negocio. JSON:
{
  "headline": "Título de la sección (máx 5 palabras)",
  "subheadline": "Subtítulo (máx 12 palabras)",
  "stats": [
    {"value": "número o %" , "label": "Etiqueta descriptiva"},
    {"value": "número o %" , "label": "Etiqueta descriptiva"},
    {"value": "número o %" , "label": "Etiqueta descriptiva"},
    {"value": "número o %" , "label": "Etiqueta descriptiva"}
  ]
}`,

        CTA: `${base}
Genera una sección call-to-action que convierta. JSON:
{
  "headline": "Título CTA impactante (máx 8 palabras)",
  "subheadline": "Razón para actuar ahora (máx 20 palabras)",
  "ctaLabel": "Botón principal (máx 5 palabras)",
  "secondaryCtaLabel": "Botón secundario o enlace (máx 5 palabras)",
  "badge": "Texto de garantía o confianza (máx 8 palabras, ej: Sin contrato · Cancela cuando quieras)"
}`,

        Pricing: `${base}
Genera 3 planes de precios. JSON:
{
  "headline": "Título de precios (máx 5 palabras)",
  "subheadline": "Subtítulo (máx 15 palabras)",
  "plans": [
    {"name": "Nombre plan básico", "price": "X€", "period": "/mes", "description": "Para quién es (máx 10 palabras)", "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"], "ctaLabel": "Empezar gratis", "highlighted": false},
    {"name": "Nombre plan pro", "price": "XX€", "period": "/mes", "description": "Para quién es (máx 10 palabras)", "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"], "ctaLabel": "Empezar ahora", "highlighted": true},
    {"name": "Nombre plan enterprise", "price": "Personalizado", "period": "", "description": "Para quién es (máx 10 palabras)", "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"], "ctaLabel": "Contactar", "highlighted": false}
  ]
}`,

        FAQ: `${base}
Genera preguntas frecuentes realistas. JSON:
{
  "headline": "Título FAQ (máx 5 palabras)",
  "subheadline": "Subtítulo (máx 12 palabras)",
  "faqs": [
    {"question": "Pregunta frecuente 1?", "answer": "Respuesta clara y útil (30-60 palabras)"},
    {"question": "Pregunta frecuente 2?", "answer": "Respuesta clara y útil (30-60 palabras)"},
    {"question": "Pregunta frecuente 3?", "answer": "Respuesta clara y útil (30-60 palabras)"},
    {"question": "Pregunta frecuente 4?", "answer": "Respuesta clara y útil (30-60 palabras)"},
    {"question": "Pregunta frecuente 5?", "answer": "Respuesta clara y útil (30-60 palabras)"}
  ]
}`,

        Team: `${base}
Genera perfiles de equipo creíbles. JSON:
{
  "headline": "Título equipo (máx 5 palabras)",
  "subheadline": "Subtítulo (máx 12 palabras)",
  "members": [
    {"name": "Nombre completo", "role": "Cargo", "bio": "Bio breve (20-30 palabras)"},
    {"name": "Nombre completo", "role": "Cargo", "bio": "Bio breve (20-30 palabras)"},
    {"name": "Nombre completo", "role": "Cargo", "bio": "Bio breve (20-30 palabras)"}
  ]
}`,

        NewsletterSignup: `${base}
Genera contenido para captación de email. JSON:
{
  "headline": "Título que motive a suscribirse (máx 7 palabras)",
  "subheadline": "Beneficio de suscribirse (máx 15 palabras)",
  "placeholder": "Placeholder del campo email (máx 5 palabras)",
  "ctaLabel": "Texto del botón (máx 4 palabras)",
  "disclaimer": "Texto pequeño de privacidad (máx 10 palabras)"
}`,

        ContactForm: `${base}
Genera contenido para sección de contacto. JSON:
{
  "headline": "Título contacto (máx 5 palabras)",
  "subheadline": "Texto invitando al contacto (máx 20 palabras)",
  "ctaLabel": "Texto del botón enviar (máx 4 palabras)",
  "successMessage": "Mensaje de éxito tras envío (máx 15 palabras)"
}`,

        Navigation: `${base}
Genera contenido de navegación. JSON:
{
  "brandName": "Nombre de marca (máx 2 palabras)",
  "ctaLabel": "Texto del botón CTA en nav (máx 4 palabras)",
  "links": ["Inicio", "Servicios", "Nosotros", "Contacto"]
}`,
    };

    return prompts[block.type] ?? `${base}
Genera contenido relevante para un bloque de tipo "${block.type}". 
JSON con los campos más importantes para este tipo de bloque.`;
}

// ─── API call ──────────────────────────────────────────────────────────────────

async function generateWithClaude(prompt: string): Promise<GeneratedContent> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message ?? `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('');

    // Strip markdown fences if present
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    try {
        return JSON.parse(clean);
    } catch {
        throw new Error('La IA devolvió un JSON inválido. Vuelve a intentarlo.');
    }
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface AIContentGeneratorProps {
    block: BlockInstance;
    businessContext: string;
    onApply: (id: string, data: Record<string, any>) => void;
    onClose: () => void;
}

const TONES = [
    { id: 'professional', label: '💼 Profesional' },
    { id: 'friendly', label: '😊 Cercano' },
    { id: 'bold', label: '🔥 Audaz' },
    { id: 'luxury', label: '✨ Premium' },
    { id: 'minimal', label: '○ Minimalista' },
];

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
    block, businessContext: initialContext, onApply, onClose
}) => {
    const [context, setContext] = useState(initialContext);
    const [tone, setTone] = useState('professional');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generated, setGenerated] = useState<GeneratedContent | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!context.trim()) return;
        setLoading(true);
        setError(null);
        setGenerated(null);

        try {
            const prompt = buildPrompt(block, context, tone);
            const result = await generateWithClaude(prompt);
            setGenerated(result);
            setShowPreview(true);
        } catch (e: any) {
            setError(e?.message ?? 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [block, context, tone]);

    const handleApply = useCallback(() => {
        if (!generated) return;
        onApply(block.id, { ...block.data, ...generated });
        onClose();
    }, [block, generated, onApply, onClose]);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-[301] bg-white rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h2 className="font-black text-base">IA · Generar contenido</h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{block.type}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Business context */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Describe tu negocio
                        </label>
                        <textarea
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            rows={3}
                            placeholder="Ej: Somos una agencia de diseño web especializada en startups. Ayudamos a lanzar productos digitales en tiempo récord..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-violet-400 resize-none"
                        />
                    </div>

                    {/* Tone selector */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Tono de comunicación
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TONES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTone(t.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                                        tone === t.id
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-100'
                                            : 'border-slate-200 text-slate-600 hover:border-violet-300'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                            <X size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Generated preview */}
                    {generated && showPreview && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowPreview(v => !v)}
                                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                            >
                                {showPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                Contenido generado
                            </button>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 overflow-auto max-h-56">
                                <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(generated, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
                    {generated ? (
                        <>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                Regenerar
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-sm hover:opacity-90 transition-opacity shadow-lg"
                            >
                                <Check size={16} /> Aplicar al bloque
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !context.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-sm hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generando con IA…
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generar contenido
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
