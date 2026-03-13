import React from 'react';
import {
    ArrowRight,
    Blocks,
    Bot,
    Eye,
    Globe,
    Layers3,
    LineChart,
    Monitor,
    Sparkles,
    Wand2,
} from 'lucide-react';
import { isTauriApp } from '../utils/runtime';

const features = [
    {
        icon: Wand2,
        title: 'Editor visual con criterio',
        description: 'Construye landing, servicios, galerias y CTAs con bloques reales, sin pelearte con layouts rotos.',
    },
    {
        icon: Layers3,
        title: 'Plantillas y temas listos',
        description: 'Arranca desde presets completos y cambia la direccion visual del proyecto en segundos.',
    },
    {
        icon: Eye,
        title: 'Preview live',
        description: 'Abre una vista paralela y revisa los cambios en desktop, tablet o mobile mientras editas.',
    },
    {
        icon: LineChart,
        title: 'Capas de growth',
        description: 'Analytics, A/B testing, CMS y exportacion conviven dentro del mismo flujo del editor.',
    },
    {
        icon: Globe,
        title: 'Listo para publicar',
        description: 'Genera HTML, prepara dominios y pasa del concepto a una web lista para salir.',
    },
    {
        icon: Bot,
        title: 'Pensado para Potencore',
        description: 'La experiencia conecta con el ecosistema y conserva la logica de producto que ya estas usando.',
    },
];

const workflow = [
    'Elige una plantilla base o empieza un lienzo nuevo.',
    'Edita bloques, copy, branding e imagenes desde el mismo canvas.',
    'Valida en preview y exporta cuando el sitio este listo.',
];

export const Home: React.FC = () => {
    const demoPath = '/demo/';
    const downloadPath = '/download/';
    const potenCoreUrl = isTauriApp() ? 'https://potencore.pages.dev' : 'https://potencore.pages.dev';

    return (
        <div className="min-h-screen bg-[#f7f5ef] text-[#201c18] selection:bg-[#f3c979] selection:text-[#201c18]">
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(240,129,64,0.18),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(26,124,120,0.14),_transparent_26%),linear-gradient(180deg,_#f7f5ef_0%,_#f2ede3_45%,_#f7f5ef_100%)]" />
                <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-[#f08140]/10 blur-3xl" />
                <div className="absolute bottom-10 right-[-5rem] h-80 w-80 rounded-full bg-[#1a7c78]/10 blur-3xl" />
            </div>

            <nav className="sticky top-0 z-50 border-b border-[#201c18]/10 bg-[#f7f5ef]/85 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
                    <a href="#top" className="flex items-center gap-3">
                        <img src="/brand/icon.svg" alt="" className="h-11 w-11" />
                        <div>
                            <img src="/brand/wordmark.png" alt="WebPro" className="h-7 w-auto" />
                            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7f7166]">Visual Web Builder</div>
                        </div>
                    </a>

                    <div className="hidden items-center gap-8 text-sm font-bold text-[#6c6158] md:flex">
                        <a href="#demo" className="transition-colors hover:text-[#d4582f]">Demo</a>
                        <a href="#features" className="transition-colors hover:text-[#d4582f]">Funciones</a>
                        <a href="#workflow" className="transition-colors hover:text-[#d4582f]">Flujo</a>
                        <a href={potenCoreUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#d4582f]">Potencore</a>
                    </div>

                    <a
                        href={downloadPath}
                        className="inline-flex items-center gap-2 rounded-full bg-[#201c18] px-5 py-3 text-sm font-extrabold text-[#f7f5ef] transition-all hover:-translate-y-0.5 hover:bg-[#d4582f]"
                    >
                        Descargar app
                        <ArrowRight size={16} />
                    </a>
                </div>
            </nav>

            <main id="top">
                <section className="px-6 pb-20 pt-14 lg:px-10 lg:pb-24 lg:pt-20">
                    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4582f]/20 bg-[#fff8ef] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#d4582f]">
                                <Sparkles size={14} />
                                Nuevo WebPro integrado
                            </div>

                            <h1 className="max-w-4xl font-['Syne'] text-5xl font-extrabold leading-[0.94] tracking-[-0.04em] text-[#201c18] md:text-7xl">
                                El editor visual para lanzar webs con una demo real embebida.
                            </h1>

                            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5c524b] md:text-xl">
                                WebPro aterriza con una landing nueva, mas clara y mas vendible: enseña el producto en vivo, deja tocar el editor desde el primer scroll y mantiene la energia de un builder serio dentro del ecosistema Potencore.
                            </p>

                            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                                <a
                                    href={demoPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d4582f] px-7 py-4 text-base font-extrabold text-white shadow-[0_20px_50px_rgba(212,88,47,0.24)] transition-all hover:-translate-y-1 hover:bg-[#bd4a25]"
                                >
                                    Probar demo
                                    <Monitor size={18} />
                                </a>
                                <a
                                    href="#features"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#201c18]/12 bg-white/70 px-7 py-4 text-base font-extrabold text-[#201c18] transition-all hover:-translate-y-1 hover:border-[#1a7c78]/30 hover:bg-white"
                                >
                                    Ver producto
                                    <Blocks size={18} />
                                </a>
                                <a
                                    href={downloadPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#201c18]/12 bg-white/70 px-7 py-4 text-base font-extrabold text-[#201c18] transition-all hover:-translate-y-1 hover:border-[#1a7c78]/30 hover:bg-white"
                                >
                                    Descargar app
                                    <ArrowRight size={18} />
                                </a>
                            </div>

                            <div className="mt-10 grid gap-4 text-sm font-bold text-[#5c524b] sm:grid-cols-3">
                                <Stat value="17+" label="bloques editables" />
                                <Stat value="10" label="plantillas listas" />
                                <Stat value="Live" label="preview y export" />
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-4 top-10 hidden rounded-[2rem] border border-[#201c18]/8 bg-white/70 px-4 py-3 text-xs font-bold text-[#6c6158] shadow-[0_18px_50px_rgba(32,28,24,0.08)] md:block">
                                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#d4582f]">Canvas</div>
                                Edita bloques, tema y contenido desde la misma vista.
                            </div>
                            <div className="absolute -bottom-4 right-4 hidden rounded-[2rem] border border-[#201c18]/8 bg-[#201c18] px-4 py-3 text-xs font-bold text-[#efe6d8] shadow-[0_18px_50px_rgba(32,28,24,0.18)] md:block">
                                <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#f3c979]">Growth stack</div>
                                Analytics, CMS, dominios y exportacion desde el editor.
                            </div>

                            <div className="overflow-hidden rounded-[2.25rem] border border-[#201c18]/10 bg-[#201c18] p-3 shadow-[0_35px_80px_rgba(32,28,24,0.16)]">
                                <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,#25201b,#161310)] p-5 text-[#efe6d8]">
                                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-2">
                                                <span className="h-3 w-3 rounded-full bg-[#ff6b57]" />
                                                <span className="h-3 w-3 rounded-full bg-[#f3c979]" />
                                                <span className="h-3 w-3 rounded-full bg-[#64d2a3]" />
                                            </div>
                                            <div className="rounded-full bg-white/6 px-4 py-2 font-mono text-[11px] text-[#b7aca1]">
                                        webpro-app.pages.dev/demo/
                                            </div>
                                        </div>
                                        <div className="hidden items-center gap-2 rounded-full border border-[#f3c979]/20 bg-[#f3c979]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f3c979] sm:flex">
                                            <Blocks size={12} />
                                            Demo real
                                        </div>
                                    </div>

                                    <div className="grid gap-4 pt-5 sm:grid-cols-[1.1fr_0.9fr]">
                                        <div className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
                                            <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f3c979]">Direcion de producto</div>
                                            <h2 className="font-['Syne'] text-3xl font-extrabold leading-tight text-white">
                                                Web builder modular con look mas premium y enfoque demo-first.
                                            </h2>
                                            <p className="mt-4 text-sm leading-7 text-[#b7aca1]">
                                                Reinterpretado desde el nuevo import, pero aterrizado para vender mejor el producto: hero fuerte, demo visible y mensaje mas cercano a lo que ya funciona en ViralPro.
                                            </p>
                                        </div>

                                        <div className="grid gap-3">
                                            <MiniCard title="Templates" text="Crea rapido desde presets completos." accent="bg-[#f08140]" />
                                            <MiniCard title="Preview" text="Valida cada cambio antes de exportar." accent="bg-[#1a7c78]" />
                                            <MiniCard title="Export" text="Pasa a HTML listo para publicar." accent="bg-[#f3c979]" dark />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="demo" className="px-6 py-20 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-8 max-w-3xl">
                            <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.24em] text-[#1a7c78]">Demo embebida</div>
                            <h2 className="font-['Syne'] text-4xl font-extrabold tracking-[-0.03em] text-[#201c18] md:text-5xl">
                                Toca el producto antes de tomar ninguna decision.
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-[#5c524b]">
                                Igual que en ViralPro, la landing deja claro el valor y luego te mete dentro de la experiencia. Aqui la demo carga el editor real en modo demo, sin cambiar de pagina.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-[2rem] border border-[#201c18]/10 bg-[#120f0d] p-3 shadow-[0_40px_100px_rgba(32,28,24,0.18)]">
                            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#1c1714]">
                                <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-4 text-[#d6c8bb]">
                                    <div className="flex gap-2">
                                        <span className="h-3 w-3 rounded-full bg-[#ff6b57]" />
                                        <span className="h-3 w-3 rounded-full bg-[#f3c979]" />
                                        <span className="h-3 w-3 rounded-full bg-[#64d2a3]" />
                                    </div>
                                    <div className="min-w-0 flex-1 rounded-full bg-white/6 px-4 py-2 font-mono text-xs text-[#a8998d]">
                                        {demoPath}
                                    </div>
                                    <a
                                    href={demoPath}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-[#f3c979] transition-colors hover:text-white"
                                >
                                        Abrir en nueva pestaña
                                        <ArrowRight size={14} />
                                    </a>
                                </div>

                                <iframe
                                    src={demoPath}
                                    title="WebPro Demo"
                                    loading="lazy"
                                    className="block h-[680px] w-full border-0 bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="px-6 py-20 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.24em] text-[#d4582f]">Funciones</div>
                                <h2 className="font-['Syne'] text-4xl font-extrabold tracking-[-0.03em] text-[#201c18] md:text-5xl">
                                    Rehecha para enseñar por que WebPro importa.
                                </h2>
                            </div>
                            <p className="max-w-2xl text-base leading-8 text-[#5c524b]">
                                La nueva landing toma la energia del import y la ordena alrededor de beneficios claros, captura visual y acceso directo al builder.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {features.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <article
                                        key={feature.title}
                                        className="group rounded-[2rem] border border-[#201c18]/10 bg-white/80 p-7 shadow-[0_18px_40px_rgba(32,28,24,0.05)] transition-all hover:-translate-y-1 hover:border-[#d4582f]/20 hover:shadow-[0_28px_60px_rgba(32,28,24,0.09)]"
                                    >
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(240,129,64,0.12),rgba(26,124,120,0.14))] text-[#d4582f] transition-transform group-hover:scale-110">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="font-['Syne'] text-2xl font-bold tracking-tight text-[#201c18]">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-4 text-sm leading-7 text-[#5c524b]">
                                            {feature.description}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="workflow" className="px-6 py-20 lg:px-10">
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-[2.5rem] bg-[#201c18] p-8 text-[#efe6d8] shadow-[0_30px_80px_rgba(32,28,24,0.18)] lg:p-10">
                            <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.24em] text-[#f3c979]">Flujo WebPro</div>
                            <h2 className="font-['Syne'] text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white">
                                De idea a web publicada sin salir del sistema.
                            </h2>
                            <p className="mt-5 text-base leading-8 text-[#c8b9aa]">
                                El producto ya tenia potencia. Lo que faltaba era una narrativa de entrada a la altura. Ahora la homepage empuja a probar, entender y convertir.
                            </p>
                            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f3c979]">Por que esta version</div>
                                <p className="mt-3 text-sm leading-7 text-[#d8cdc3]">
                                    Se inspira en el nuevo import y en la estructura demo-first de ViralPro, pero aterriza el mensaje al caso real de WebPro: construir, revisar y exportar webs desde un editor modular.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5">
                            {workflow.map((step, index) => (
                                <div
                                    key={step}
                                    className="flex gap-5 rounded-[2rem] border border-[#201c18]/10 bg-white/80 p-6 shadow-[0_16px_34px_rgba(32,28,24,0.05)]"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff3df] font-['Syne'] text-lg font-extrabold text-[#d4582f]">
                                        0{index + 1}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#8a7d71]">
                                            Paso {index + 1}
                                        </div>
                                        <p className="mt-2 text-lg font-bold leading-8 text-[#201c18]">
                                            {step}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div className="rounded-[2rem] border border-[#1a7c78]/14 bg-[linear-gradient(135deg,rgba(26,124,120,0.1),rgba(243,201,121,0.18))] p-6">
                                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1a7c78]">Resultado</div>
                                <p className="mt-2 text-lg font-bold leading-8 text-[#201c18]">
                                    Una landing mas comercial, una demo visible y una entrada a WebPro mucho mas consistente con el resto del portfolio.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-6 pb-24 pt-6 lg:px-10">
                    <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-[#201c18]/10 bg-[linear-gradient(135deg,#f08140,#d4582f)] px-8 py-10 text-white shadow-[0_35px_90px_rgba(212,88,47,0.24)] lg:px-10 lg:py-12">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.24em] text-white/75">Listo para entrar</div>
                                <h2 className="font-['Syne'] text-4xl font-extrabold tracking-[-0.03em]">
                                    Abre el builder y valida el nuevo posicionamiento en producto real.
                                </h2>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <a
                                    href={demoPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-extrabold text-[#201c18] transition-all hover:-translate-y-1"
                                >
                                    Probar demo
                                    <Monitor size={18} />
                                </a>
                                <a
                                    href={downloadPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-extrabold text-white transition-all hover:-translate-y-1 hover:bg-white/16"
                                >
                                    Descargar app
                                    <ArrowRight size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
    <div className="rounded-[1.6rem] border border-[#201c18]/10 bg-white/70 p-5 shadow-[0_12px_26px_rgba(32,28,24,0.04)]">
        <div className="font-['Syne'] text-3xl font-extrabold tracking-tight text-[#201c18]">{value}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#8a7d71]">{label}</div>
    </div>
);

const MiniCard = ({
    title,
    text,
    accent,
    dark = false,
}: {
    title: string;
    text: string;
    accent: string;
    dark?: boolean;
}) => (
    <div className={`rounded-[1.35rem] border border-white/8 p-4 ${dark ? 'bg-white/10 text-white' : 'bg-white/6 text-[#efe6d8]'}`}>
        <div className={`mb-3 h-2.5 w-16 rounded-full ${accent}`} />
        <div className="font-['Syne'] text-lg font-bold tracking-tight">{title}</div>
        <p className="mt-2 text-sm leading-6 text-inherit opacity-75">{text}</p>
    </div>
);
