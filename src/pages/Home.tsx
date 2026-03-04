import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Settings, Play, Zap } from 'lucide-react';

export const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 font-sans">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 text-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
                    <Zap size={40} className="text-white fill-white" />
                </div>

                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">FramePro</h1>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-10">Editor Visual v1.0.0</p>

                <div className="space-y-4">
                    <Link to="/demo/?demo=1" className="flex items-center justify-between p-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-3xl transition-all group border border-indigo-100">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Play size={24} />
                            </div>
                            <div>
                                <div className="font-black text-lg">Abrir Editor</div>
                                <div className="text-xs font-bold opacity-60">Empezar nuevo proyecto</div>
                            </div>
                        </div>
                        <Layout className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <button className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-3xl transition-all group border border-slate-100">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Settings size={24} />
                            </div>
                            <div>
                                <div className="font-black text-lg">Ajustes</div>
                                <div className="text-xs font-bold opacity-60">Configuración de la app</div>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by Potencore Ecosystem</p>
                </div>
            </div>
        </div>
    );
};
