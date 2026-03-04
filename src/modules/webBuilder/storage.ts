import { SiteConfigV1 } from './types';

export interface StorageAdapter {
    isAvailable(): boolean;
    save(key: string, data: any): Promise<void>;
    load<T>(key: string): Promise<T | null>;
    list(): Promise<string[]>;
    remove(key: string): Promise<void>;
}

export const WebDemoStorageAdapter: StorageAdapter = {
    isAvailable: () => true,
    save: async (key, data) => {
        localStorage.setItem(`framepro_demo__${key}`, JSON.stringify(data));
    },
    load: async (key) => {
        const raw = localStorage.getItem(`framepro_demo__${key}`);
        return raw ? JSON.parse(raw) : null;
    },
    list: async () => {
        return Object.keys(localStorage)
            .filter(k => k.startsWith('framepro_demo__'))
            .map(k => k.replace('framepro_demo__', ''));
    },
    remove: async (key) => {
        localStorage.removeItem(`framepro_demo__${key}`);
    }
};

export const TauriStorageAdapter: StorageAdapter = {
    isAvailable: () => !!(window as any).__TAURI__,
    save: async (key, data) => {
        try {
            const { writeTextFile, BaseDirectory } = await (0, eval)('import("@tauri-apps/api/fs")');
            await writeTextFile(`project_${key}.json`, JSON.stringify(data), { dir: BaseDirectory.AppConfig });
        } catch (e) {
            console.error('Tauri save failed', e);
        }
    },
    load: async (key) => {
        try {
            const { readTextFile, BaseDirectory } = await (0, eval)('import("@tauri-apps/api/fs")');
            const raw = await readTextFile(`project_${key}.json`, { dir: BaseDirectory.AppConfig });
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },
    list: async () => {
        try {
            const { readDir, BaseDirectory } = await (0, eval)('import("@tauri-apps/api/fs")');
            const files = await readDir('', { dir: BaseDirectory.AppConfig });
            return files
                .filter((f: any) => f.name?.startsWith('project_') && f.name.endsWith('.json'))
                .map((f: any) => f.name!.replace('project_', '').replace('.json', ''));
        } catch {
            return [];
        }
    },
    remove: async (key) => {
        try {
            const { removeFile, BaseDirectory } = await (0, eval)('import("@tauri-apps/api/fs")');
            await removeFile(`project_${key}.json`, { dir: BaseDirectory.AppConfig });
        } catch (e) {
            console.error('Tauri remove failed', e);
        }
    }
};

export function getActiveAdapter(): StorageAdapter {
    const params = new URLSearchParams(window.location.search);
    const isDemoMode = params.get('demo') === '1' || window.location.pathname.includes('/demo');

    if (isDemoMode) return WebDemoStorageAdapter;
    if (TauriStorageAdapter.isAvailable()) return TauriStorageAdapter;

    return WebDemoStorageAdapter;
}
