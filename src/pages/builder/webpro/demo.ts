/**
 * src/pages/builder/webpro/demo.ts
 *
 * Modo Demo WebPro.
 * Permite usar el editor completamente SIN backend.
 * Persiste en localStorage con TTL de 7 días.
 *
 * API pública:
 *  demoMode.isActive() → boolean
 *  demoMode.enable() → void
 *  demoMode.disable() → void
 *  demoMode.loadProject(id) → SiteConfigV1 | null
 *  demoMode.saveProject(config) → void
 *  demoMode.listProjects() → DemoProject[]
 *  demoMode.deleteProject(id) → void
 *  demoMode.exportProject(config) → string (JSON)
 */

import { SiteConfigV1 } from '@/modules/webBuilder/types';
import { WEBPRO_TEMPLATES, cloneTemplateConfig } from './templates';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEMO_KEY = 'webpro_demo_v1';
const DEMO_ACTIVE_KEY = 'webpro_demo_active';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DemoProject {
    id: string;
    slug: string;
    brandName: string;
    templateId: string;
    savedAt: number;
    config: SiteConfigV1;
}

export interface VersionSnapshot {
    id: string;
    savedAt: number;
    label: string;
    config: SiteConfigV1;
}

interface DemoStore {
    projects: DemoProject[];
    version: string;
}

import { getActiveAdapter } from '@/modules/webBuilder/storage';

const adapter = getActiveAdapter();

async function readStore(): Promise<DemoStore> {
    try {
        const slugs = await adapter.list();
        const projects = await Promise.all(slugs.map(async s => {
            const config = await adapter.load<SiteConfigV1>(s);
            if (!config) return null;
            return {
                id: s, slug: s, brandName: config.globalData.brandName,
                templateId: (config as any).templateId || 'custom',
                savedAt: Date.now(), // Fallback
                config
            } as DemoProject;
        }));
        return { projects: projects.filter(Boolean) as DemoProject[], version: '1.0' };
    } catch {
        return { projects: [], version: '1.0' };
    }
}
async function writeStore(store: DemoStore): Promise<void> {
    // Adapter handles individual saves.
    // For bulk saves or manifest, we could implement more, but let's keep it simple.
}

// ─── Demo Mode API ─────────────────────────────────────────────────────────────

export const demoMode = {
    /** Is demo mode currently active? */
    isActive(): boolean {
        try {
            return localStorage.getItem(DEMO_ACTIVE_KEY) === 'true';
        } catch {
            return false;
        }
    },

    /** Enable demo mode */
    enable(): void {
        try {
            localStorage.setItem(DEMO_ACTIVE_KEY, 'true');
        } catch { /* noop */ }
    },

    /** Disable demo mode */
    disable(): void {
        try {
            localStorage.removeItem(DEMO_ACTIVE_KEY);
        } catch { /* noop */ }
    },

    /** List all saved demo projects */
    async listProjects(): Promise<DemoProject[]> {
        const store = await readStore();
        const now = Date.now();
        // Filter expired (only if in web demo mode, for Tauri keep them)
        if (this.isActive()) {
            return store.projects.filter(p => now - p.savedAt < TTL_MS);
        }
        return store.projects;
    },

    /** Load a project by id */
    async loadProject(id: string): Promise<SiteConfigV1 | null> {
        const projects = await this.listProjects();
        return projects.find(p => p.id === id)?.config ?? null;
    },

    /** Save / update a project */
    async saveProject(config: SiteConfigV1, templateId: string = 'custom'): Promise<void> {
        const now = Date.now();
        const slug = config.slug || `demo-${now}`;

        await adapter.save(slug, config);

        // Auto-push to version history
        this.pushVersion(slug, config);
    },

    /** Delete a project */
    async deleteProject(id: string): Promise<void> {
        await adapter.remove(id);
    },

    /** Create a new demo project from a template */
    async createFromTemplate(templateId: string, brandName: string): Promise<SiteConfigV1> {
        const template = WEBPRO_TEMPLATES.find(t => t.id === templateId);
        if (!template) {
            // Fallback: SaaS landing
            const saas = WEBPRO_TEMPLATES[0];
            return cloneTemplateConfig(saas, `demo-${Date.now()}`, brandName || 'Mi Sitio');
        }
        const slug = `${templateId}-${Date.now()}`;
        const config = cloneTemplateConfig(template, slug, brandName || template.config.globalData.brandName);
        await this.saveProject(config, templateId);
        return config;
    },

    /** Export project as JSON string */
    exportProjectJson(config: SiteConfigV1): string {
        return JSON.stringify({ webpro: '1.0', exportedAt: new Date().toISOString(), config }, null, 2);
    },

    /** Import a previously exported JSON */
    importProjectJson(json: string): SiteConfigV1 | null {
        try {
            const parsed = JSON.parse(json);
            const config = parsed.config ?? parsed;
            if (!config.version || !config.pages) return null;
            return config as SiteConfigV1;
        } catch {
            return null;
        }
    },

    /** Total storage used (bytes) */
    storageUsed(): number {
        try {
            const raw = localStorage.getItem(DEMO_KEY) ?? '';
            return new Blob([raw]).size;
        } catch {
            return 0;
        }
    },

    /** Clear all demo data */
    clearAll(): void {
        try {
            localStorage.removeItem(DEMO_KEY);
            localStorage.removeItem(DEMO_ACTIVE_KEY);
        } catch { /* noop */ }
    },

    // ─── Version History ──────────────────────────────────────────────────────

    /**
     * Saves a version snapshot for a project (max 10 kept).
     * Called automatically by saveProject if versioning is enabled.
     */
    pushVersion(projectId: string, config: SiteConfigV1, label?: string): void {
        const key = `webpro_history_${projectId}`;
        try {
            const raw = localStorage.getItem(key);
            const history: VersionSnapshot[] = raw ? JSON.parse(raw) : [];
            const snapshot: VersionSnapshot = {
                id: `v-${Date.now()}`,
                savedAt: Date.now(),
                label: label ?? new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                config,
            };
            history.unshift(snapshot);            // newest first
            const trimmed = history.slice(0, 10); // keep last 10
            localStorage.setItem(key, JSON.stringify(trimmed));
        } catch { /* noop */ }
    },

    /** Get version history for a project */
    getHistory(projectId: string): VersionSnapshot[] {
        const key = `webpro_history_${projectId}`;
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as VersionSnapshot[]) : [];
        } catch { return []; }
    },

    /** Restore a specific version snapshot */
    restoreVersion(projectId: string, versionId: string): SiteConfigV1 | null {
        const history = this.getHistory(projectId);
        return history.find(v => v.id === versionId)?.config ?? null;
    },

    /** Clear history for a project */
    clearHistory(projectId: string): void {
        try {
            localStorage.removeItem(`webpro_history_${projectId}`);
        } catch { /* noop */ }
    },

    // ─── Duplicate ────────────────────────────────────────────────────────────

    /** Duplicate a project with a new id/slug */
    async duplicateProject(projectId: string): Promise<SiteConfigV1 | null> {
        const source = await this.loadProject(projectId);
        if (!source) return null;

        const newSlug = `${source.slug}-copy-${Date.now()}`;
        const newConfig: SiteConfigV1 = {
            ...source,
            slug: newSlug,
            globalData: {
                ...source.globalData,
                brandName: `${source.globalData.brandName} (copia)`,
            },
        };

        const projects = await this.listProjects();
        const template = projects.find(p => p.id === projectId)?.templateId ?? 'custom';
        await this.saveProject(newConfig, template);
        return newConfig;
    },
};
