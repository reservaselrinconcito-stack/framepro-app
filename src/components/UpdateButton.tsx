import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowDownCircle, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';
import { updateService, UpdateStatus } from '../services/updateService';
import { isTauriApp } from '../utils/runtime';

export const UpdateButton: React.FC = () => {
    const [status, setStatus] = useState<UpdateStatus>(updateService.getStatus());

    useEffect(() => {
        if (!isTauriApp()) return;
        return updateService.subscribe(setStatus);
    }, []);

    if (!isTauriApp()) return null;

    const handleCheck = async () => {
        await updateService.checkForUpdates();
    };

    const handleInstall = async () => {
        await updateService.downloadAndInstall();
    };

    const handleRelaunch = async () => {
        await updateService.relaunch();
    };

    const { state, availableVersion, downloadedBytes, totalBytes, error } = status;
    const pct = totalBytes && downloadedBytes ? Math.round((downloadedBytes / totalBytes) * 100) : null;

    if (state === 'ready') {
        return (
            <button
                onClick={handleRelaunch}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                title="Reiniciar para aplicar la actualizacion"
            >
                <RotateCcw size={14} /> Reiniciar
            </button>
        );
    }

    if (state === 'available') {
        return (
            <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                title={`Actualizar a ${availableVersion}`}
            >
                <ArrowDownCircle size={14} /> Actualizar
            </button>
        );
    }

    if (state === 'downloading') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                <RefreshCw size={14} className="animate-spin" />
                {pct !== null ? `Descargando ${pct}%` : 'Descargando'}
            </div>
        );
    }

    if (state === 'error') {
        return (
            <button
                onClick={handleCheck}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 border border-rose-100 transition-all"
                title={error || 'Reintentar actualizacion'}
            >
                <AlertCircle size={14} /> Reintentar update
            </button>
        );
    }

    return (
        <button
            onClick={handleCheck}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 border border-slate-100 transition-all"
            title="Buscar actualizaciones"
        >
            {state === 'checking' ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {state === 'checking' ? 'Buscando...' : 'Actualizar'}
        </button>
    );
};
