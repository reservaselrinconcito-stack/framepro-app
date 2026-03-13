import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownCircle, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';
import { updateService, UpdateStatus } from '../services/updateService';
import { isTauriApp } from '../utils/runtime';

export const AutoUpdater: React.FC = () => {
    const [status, setStatus] = useState<UpdateStatus>(updateService.getStatus());

    useEffect(() => {
        if (!isTauriApp()) return;
        const unsubscribe = updateService.subscribe(setStatus);
        void updateService.autoCheckAndInstall();
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!isTauriApp()) return;

        if (status.state === 'available' && status.availableVersion) {
            toast.message(`Actualizacion encontrada: ${status.availableVersion}`, {
                description: 'WebPro va a descargarla y dejarla lista automaticamente.',
                icon: <ArrowDownCircle size={16} />,
            });
        }

        if (status.state === 'ready') {
            toast.success('Actualizacion lista para aplicar', {
                description: 'Reinicia WebPro para entrar con la ultima version.',
                action: {
                    label: 'Reiniciar',
                    onClick: () => void updateService.relaunch(),
                },
                icon: <CheckCircle2 size={16} />,
                duration: 12000,
            });
        }

        if (status.state === 'error' && status.error) {
            toast.error('Error al actualizar WebPro', {
                description: status.error,
                icon: <RefreshCw size={16} />,
                duration: 7000,
            });
        }
    }, [status]);

    if (!isTauriApp()) return null;
    return null;
};
