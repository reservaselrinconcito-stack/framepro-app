import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauriApp } from '../utils/runtime';

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'ready'
  | 'error';

export interface UpdateStatus {
  state: UpdateState;
  availableVersion?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  error?: string;
}

type Listener = (status: UpdateStatus) => void;

class UpdateService {
  private status: UpdateStatus = { state: 'idle' };
  private listeners = new Set<Listener>();
  private updateHandle: any = null;
  private checkedOnce = false;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  getStatus(): UpdateStatus {
    return this.status;
  }

  private emit(patch: Partial<UpdateStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((listener) => listener(this.status));
  }

  async checkForUpdates(): Promise<void> {
    if (!isTauriApp()) return;
    if (this.status.state === 'checking' || this.status.state === 'downloading') return;

    this.emit({ state: 'checking', error: undefined, availableVersion: undefined });

    try {
      const update = await check();
      this.checkedOnce = true;

      if (update?.available) {
        this.updateHandle = update;
        this.emit({ state: 'available', availableVersion: update.version });
      } else {
        this.updateHandle = null;
        this.emit({ state: 'up-to-date' });
      }
    } catch (error) {
      this.updateHandle = null;
      this.emit({ state: 'error', error: this.humanizeError(error) });
    }
  }

  async autoCheckAndInstall(): Promise<void> {
    if (!isTauriApp() || this.checkedOnce) return;
    await this.checkForUpdates();
    if (this.status.state === 'available') {
      await this.downloadAndInstall();
    }
  }

  async downloadAndInstall(): Promise<void> {
    if (!this.updateHandle) return;

    let downloadedBytes = 0;
    this.emit({ state: 'downloading', downloadedBytes: 0, totalBytes: undefined });

    try {
      await this.updateHandle.downloadAndInstall((progress: any) => {
        if (progress.event === 'Progress') {
          downloadedBytes += progress.data.chunkLength ?? 0;
          this.emit({
            state: 'downloading',
            downloadedBytes,
            totalBytes: progress.data.contentLength ?? undefined,
          });
        } else if (progress.event === 'Finished') {
          this.emit({ state: 'ready' });
        }
      });

      if (this.status.state === 'downloading') {
        this.emit({ state: 'ready' });
      }
    } catch (error) {
      this.emit({ state: 'error', error: this.humanizeError(error) });
    }
  }

  async relaunch(): Promise<void> {
    if (!isTauriApp()) return;
    await relaunch();
  }

  private humanizeError(error: unknown): string {
    const msg = String((error as any)?.message || error || '');
    if (msg.includes('up to date') || msg.includes('no update')) return 'Ya tienes la ultima version instalada.';
    if (msg.includes('signature') || msg.includes('sig')) return 'Error de firma: no se pudo verificar la actualizacion.';
    if (msg.includes('404') || msg.includes('release JSON')) return 'No se encuentra el servidor de actualizaciones.';
    if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('fetch')) {
      return 'No hay conexion con el servidor de actualizaciones.';
    }
    return msg || 'Error desconocido al actualizar WebPro.';
  }
}

export const updateService = new UpdateService();
