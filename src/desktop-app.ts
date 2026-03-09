import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type UpdateState = 'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'ready' | 'error';

const isTauri = () => typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);

const formatError = (error: unknown) => {
  const message = String((error as any)?.message || error || '');
  if (message.includes('up to date') || message.includes('no update')) return 'Ya tienes la ultima version.';
  if (message.includes('signature')) return 'La firma de la actualizacion no es valida.';
  if (message.includes('404') || message.includes('latest.json')) return 'No se encuentra el servidor de actualizaciones.';
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) return 'No hay conexion con el servidor de actualizaciones.';
  return message || 'No se pudo completar la actualizacion.';
};

const showToast = (message: string, tone: 'ok' | 'warn' | 'error' = 'ok') => {
  const host = document.body;
  const toast = document.createElement('div');
  const colors = {
    ok: 'linear-gradient(135deg,#22c55e,#16a34a)',
    warn: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    error: 'linear-gradient(135deg,#ef4444,#dc2626)',
  };

  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    zIndex: '9999',
    padding: '12px 14px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.02em',
    background: colors[tone],
    boxShadow: '0 18px 50px rgba(15,23,42,.3)',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'all .22s ease',
    maxWidth: '320px',
  } as CSSStyleDeclaration);

  host.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 220);
  }, 3600);
};

const createUpdateButton = () => {
  const button = document.createElement('button');
  button.className = 'tb ghost';
  button.type = 'button';
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 3v6h-6"/></svg><span>Buscar actualización</span>';
  return button;
};

const mountUpdater = async () => {
  if (!isTauri()) return;

  const toolbar = document.querySelector('.topbar-right');
  if (!toolbar || toolbar.querySelector('[data-webpro-updater]')) return;

  const button = createUpdateButton();
  button.setAttribute('data-webpro-updater', 'true');
  toolbar.prepend(button);

  let state: UpdateState = 'idle';
  let updateHandle: any = null;

  const setButton = (next: UpdateState, detail?: string) => {
    state = next;
    if (next === 'checking') {
      button.className = 'tb ghost';
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 3v6h-6"/></svg><span>Buscando...</span>';
    } else if (next === 'available') {
      button.className = 'tb accent';
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Actualizar${detail ? ` ${detail}` : ''}</span>`;
    } else if (next === 'up-to-date') {
      button.className = 'tb ghost';
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 3v6h-6"/></svg><span>Buscar actualización</span>';
    } else if (next === 'downloading') {
      button.className = 'tb';
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 3v6h-6"/></svg><span>${detail || 'Descargando...'}</span>`;
    } else if (next === 'ready') {
      button.className = 'tb accent';
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.1-3.36L23 10"/><path d="M20.5 15a9 9 0 0 1-14.1 3.36L1 14"/></svg><span>Reiniciar</span>';
    } else if (next === 'error') {
      button.className = 'tb ghost';
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Buscar actualización</span>';
      if (detail) button.title = detail;
    } else {
      button.className = 'tb ghost';
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.2-6.9"/><path d="M21 3v6h-6"/></svg><span>Buscar actualización</span>';
    }
  };

  const runCheck = async (silent = false) => {
    if (state === 'checking' || state === 'downloading') return;
    setButton('checking');
    try {
      const update = await check();
      if (update?.available) {
        updateHandle = update;
        setButton('available', update.version ? `v${update.version}` : '');
        showToast(`Nueva version disponible${update.version ? `: ${update.version}` : ''}. Usa "Buscar actualización" para instalarla.`, 'warn');
      } else {
        updateHandle = null;
        setButton('up-to-date');
        if (!silent) showToast('Ya tienes la ultima version.', 'ok');
      }
    } catch (error) {
      updateHandle = null;
      const message = formatError(error);
      setButton('error', message);
      if (!silent) showToast(message, 'error');
    }
  };

  const installUpdate = async () => {
    if (!updateHandle) return;
    let downloaded = 0;
    setButton('downloading');
    try {
      await updateHandle.downloadAndInstall((event: any) => {
        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength ?? 0;
          const total = event.data.contentLength ?? 0;
          const percent = total > 0 ? Math.round((downloaded / total) * 100) : null;
          setButton('downloading', percent !== null ? `Descargando ${percent}%` : 'Descargando...');
        } else if (event.event === 'Finished') {
          setButton('ready');
        }
      });
      if (state !== 'ready') setButton('ready');
      showToast('Actualizacion lista. Reinicia WebPro.', 'ok');
    } catch (error) {
      const message = formatError(error);
      setButton('error', message);
      showToast(message, 'error');
    }
  };

  button.addEventListener('click', async () => {
    if (state === 'available') {
      await installUpdate();
      return;
    }
    if (state === 'ready') {
      await relaunch();
      return;
    }
    await runCheck(false);
  });

  setTimeout(() => {
    void runCheck(true);
  }, 3000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void mountUpdater();
  });
} else {
  void mountUpdater();
}
