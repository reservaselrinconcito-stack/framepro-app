import { SiteConfigV1 } from './types';

export const DEFAULT_SITE_CONFIG_V1: SiteConfigV1 = {
    version: '1.0',
    slug: 'mi-sitio-nuevo',
    globalData: {
        brandName: 'Mi Marca',
        tagline: 'Lo que hacemos es increíble',
    },
    design: {
        colors: { primary: '#4f46e5', secondary: '#1e293b', accent: '#06b6d4', background: '#f8fafc', surface: '#ffffff', text: '#1e293b', textMuted: '#64748b', border: '#e2e8f0' },
        typography: { headingFont: 'Inter', bodyFont: 'Inter', baseSize: '16px' },
        spacing: { scale: '1.25' },
        radius: { global: '12px' }
    },
    pages: {
        '/': {
            slug: '/',
            label: 'Inicio',
            blocks: [],
        },
    },
};
