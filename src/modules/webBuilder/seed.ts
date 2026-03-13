import { WebDemoStorageAdapter } from './storage';
import { SiteConfigV1 } from './types';

const SEEDED_KEY = '__seeded__';

export const SEED_DATA: SiteConfigV1 = {
    version: '1.0',
    slug: 'demo-saas',
    globalData: {
        brandName: 'SaaS Pro',
        tagline: 'La plataforma definitiva para equipos modernos.',
    },
    design: {
        colors: { primary: '#6366f1', secondary: '#1e293b', accent: '#ec4899', background: '#f8fafc', surface: '#ffffff', text: '#1e293b', textMuted: '#64748b', border: '#e2e8f0' },
        typography: { headingFont: 'Inter', bodyFont: 'Inter', baseSize: '16px' },
        spacing: { scale: '1.25' },
        radius: { global: '16px' }
    },
    pages: {
        '/': {
            slug: '/',
            label: 'Home',
            blocks: [
                {
                    id: 'hero-1',
                    type: 'Hero',
                    variant: 'A',
                    data: {
                        title: 'Evoluciona tu flujo de trabajo',
                        subtitle: 'Construye sitios increíbles en minutos, no horas. WebPro te da el poder creativo que necesitas.',
                        ctaLabel: 'Empezar ahora free',
                        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
                    },
                    styles: { desktop: { padding: '120px 0' } }
                }
            ],
        },
    },
};

export async function checkAndSeed() {
    const isSeeded = localStorage.getItem(`webpro_demo__${SEEDED_KEY}`);
    if (!isSeeded) {
        console.log('[Seed] Seeding demo data...');
        // Seed some initial projects
        await WebDemoStorageAdapter.save('demo-saas', SEED_DATA);
        localStorage.setItem(`webpro_demo__${SEEDED_KEY}`, 'true');
    }
}
