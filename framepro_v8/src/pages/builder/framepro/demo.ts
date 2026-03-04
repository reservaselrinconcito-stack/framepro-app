/**
 * src/pages/builder/framepro/demo.ts
 *
 * Modo Demo FramePro.
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

import { SiteConfigV1 } from '../../../modules/webBuilder/types';
import { FRAMEPRO_TEMPLATES, cloneTemplateConfig } from './templates';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEMO_KEY = 'framepro_demo_v1';
const DEMO_ACTIVE_KEY = 'framepro_demo_active';
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

// ─── Storage helpers ───────────────────────────────────────────────────────────

function readStore(): DemoStore {
    try {
        const raw = localStorage.getItem(DEMO_KEY);
        if (!raw) return { projects: [], version: '1.0' };
        const parsed = JSON.parse(raw) as DemoStore;
        return parsed;
    } catch {
        return { projects: [], version: '1.0' };
    }
}

function writeStore(store: DemoStore): void {
    try {
        localStorage.setItem(DEMO_KEY, JSON.stringify(store));
    } catch (e) {
        console.warn('[FramePro Demo] localStorage write failed:', e);
    }
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
    listProjects(): DemoProject[] {
        const store = readStore();
        const now = Date.now();
        // Filter expired
        return store.projects.filter(p => now - p.savedAt < TTL_MS);
    },

    /** Load a project by id */
    loadProject(id: string): SiteConfigV1 | null {
        const projects = this.listProjects();
        return projects.find(p => p.id === id)?.config ?? null;
    },

    /** Save / update a project */
    saveProject(config: SiteConfigV1, templateId: string = 'custom'): void {
        const store = readStore();
        const now = Date.now();
        const existing = store.projects.findIndex(p => p.id === config.slug);

        const project: DemoProject = {
            id: config.slug || `demo-${now}`,
            slug: config.slug || `demo-${now}`,
            brandName: config.globalData.brandName,
            templateId,
            savedAt: now,
            config,
        };

        if (existing >= 0) {
            store.projects[existing] = project;
        } else {
            store.projects.push(project);
        }

        writeStore(store);

        // Auto-push to version history
        this.pushVersion(project.id, config);
    },

    /** Delete a project */
    deleteProject(id: string): void {
        const store = readStore();
        store.projects = store.projects.filter(p => p.id !== id);
        writeStore(store);
    },

    /** Create a new demo project from a template */
    createFromTemplate(templateId: string, brandName: string): SiteConfigV1 {
        const template = FRAMEPRO_TEMPLATES.find(t => t.id === templateId);
        if (!template) {
            // Fallback: SaaS landing
            const saas = FRAMEPRO_TEMPLATES[0];
            return cloneTemplateConfig(saas, `demo-${Date.now()}`, brandName || 'Mi Sitio');
        }
        const slug = `${templateId}-${Date.now()}`;
        const config = cloneTemplateConfig(template, slug, brandName || template.config.globalData.brandName);
        this.saveProject(config, templateId);
        return config;
    },

    /** Export project as JSON string */
    exportProjectJson(config: SiteConfigV1): string {
        return JSON.stringify({ framepro: '1.0', exportedAt: new Date().toISOString(), config }, null, 2);
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
        const key = `framepro_history_${projectId}`;
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
        const key = `framepro_history_${projectId}`;
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
            localStorage.removeItem(`framepro_history_${projectId}`);
        } catch { /* noop */ }
    },

    // ─── Duplicate ────────────────────────────────────────────────────────────

    /** Duplicate a project with a new id/slug */
    duplicateProject(projectId: string): SiteConfigV1 | null {
        const source = this.loadProject(projectId);
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

        const template = this.listProjects().find(p => p.id === projectId)?.templateId ?? 'custom';
        this.saveProject(newConfig, template);
        return newConfig;
    },
};
