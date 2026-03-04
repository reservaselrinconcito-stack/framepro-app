import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Monitor, Palmtree, Sparkles, Layout, Download } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white selection:bg-violet-100 font-sans">
            {/* Nav */}
            <nav className="fixed top-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
                        <Zap size={20} className="text-white fill-white" />
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">FramePro</span>
                </div>
                <div className="flex items-center gap-8 text-sm font-bold text-slate-500">
                    <a href="#features" className="hover:text-indigo-600 transition-colors">Funciones</a>
                    <a href="#workflow" className="hover:text-indigo-600 transition-colors">Flujo</a>
                    <Link to="/demo/" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                        Abrir Demo <Sparkles size={16} />
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-40 pb-20 px-8 text-center bg-radial-at-tr from-indigo-50/50 to-transparent">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1] tracking-tight mb-8">
                        Editor web <br />
                        <span className="text-indigo-600">profesional</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Crea, edita y exporta estructuras web con un flujo rápido. Diseñado para integrarse perfectamente en el ecosistema Potencore.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/demo/?demo=1" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                            Ver demo en vivo <Monitor size={20} />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-lg hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                            Contactar ventas <Layout size={20} />
                        </button>
                    </div>

                    {/* Hero Mockup */}
                    <div className="mt-20 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
                        <div className="bg-slate-50 h-10 border-b border-slate-200 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <img src="/assets/hero.png" alt="FramePro Dashboard" className="w-full aspect-video object-cover" />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-32 px-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-slate-900 text-center mb-20 tracking-tight">Diseñado para la velocidad</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Zap />, title: 'Edición Real-Time', desc: 'Mira los cambios instantáneamente mientras arrastras y sueltas componentes.' },
                            { icon: <Palmtree />, title: 'Tematización Inteligente', desc: 'Cambia el estilo visual de todo tu proyecto con un solo clic.' },
                            { icon: <Download />, title: 'Exportación Limpia', desc: 'Genera código HTML/CSS optimizado y listo para desplegar.' }
                        ].map((f, i) => (
                            <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-indigo-200 hover:bg-white transition-all group">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-8 group-hover:scale-110 transition-transform">
                                    {React.cloneElement(f.icon as any, { size: 28 })}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-4">{f.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-slate-100 text-center text-slate-400 text-sm font-bold tracking-tight">
                <p>© 2026 FramePro by Potencore. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
