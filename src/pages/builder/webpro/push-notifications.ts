/**
 * push-notifications.ts — WebPro Push Notifications
 *
 * Notificaciones push para los visitantes del sitio publicado.
 * Usa la Web Push API estándar del navegador (sin app nativa).
 *
 * Flujo:
 *   1. El visitante visita el sitio y acepta el permiso
 *   2. El navegador genera una PushSubscription única
 *   3. La suscripción se envía al servidor (VAPID)
 *   4. Desde el panel WebPro se envían notificaciones
 *
 * Setup VAPID (genera claves una vez):
 *   npx web-push generate-vapid-keys
 *
 * Variables de entorno:
 *   VITE_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=... (solo en servidor)
 *   VAPID_EMAIL=mailto:admin@tudominio.com
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PushCampaign {
  id: string;
  siteSlug: string;
  title: string;
  body: string;
  icon?: string;       // URL 192x192 PNG
  badge?: string;      // URL 96x96 PNG
  imageUrl?: string;   // Rich notification image
  actionUrl?: string;  // Where to go on click
  tag?: string;        // Collapses duplicate notifications
  sentAt?: number;
  subscriberCount?: number;
  status: 'draft' | 'sent';
}

export interface PushConfig {
  vapidPublicKey: string;
  subscriptionEndpoint: string;   // POST /api/push/subscribe
  sendEndpoint: string;            // POST /api/push/send
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const CAMPS_KEY = (slug: string) => `fp_push_campaigns_${slug}`;
const SUB_KEY = 'fp_push_subscription';

function readCampaigns(siteSlug: string): PushCampaign[] {
  try { return JSON.parse(localStorage.getItem(CAMPS_KEY(siteSlug)) ?? '[]'); } catch { return []; }
}
function saveCampaign(siteSlug: string, c: PushCampaign): void {
  const all = readCampaigns(siteSlug).filter(x => x.id !== c.id);
  try { localStorage.setItem(CAMPS_KEY(siteSlug), JSON.stringify([...all, c])); } catch { /* noop */ }
}

// ─── Service Worker script (inline string) ────────────────────────────────────

export const SERVICE_WORKER_JS = `
/* WebPro Push Service Worker — save as /sw.js at site root */
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'Notificación';
  var options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/badge.png',
    image: data.image,
    tag: data.tag || 'webpro',
    data: { url: data.actionUrl || '/' },
    actions: data.actionUrl
      ? [{ action: 'open', title: 'Ver ahora' }]
      : [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url
    ? event.notification.data.url : '/';
  event.waitUntil(clients.openWindow(url));
});
`;

// ─── Client subscription helpers ──────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export const pushNotifications = {
  // ── Check browser support ────────────────────────────────────────────────

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    return Notification.permission;
  },

  // ── Register SW + subscribe ──────────────────────────────────────────────

  async subscribe(config: PushConfig): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
    if (!this.isSupported()) return { success: false, error: 'Push no soportado en este navegador' };

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return { success: false, error: 'Permiso denegado por el usuario' };

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      if (existing) return { success: true, subscription: existing };

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey) as any,
      });

      // Send to server
      await fetch(config.subscriptionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      localStorage.setItem(SUB_KEY, JSON.stringify(subscription));
      return { success: true, subscription };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Error desconocido' };
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      localStorage.removeItem(SUB_KEY);
      return true;
    } catch { return false; }
  },

  // ── Send campaign (via backend) ──────────────────────────────────────────

  async sendCampaign(
    siteSlug: string,
    campaign: Omit<PushCampaign, 'id' | 'siteSlug' | 'status'>,
    config: PushConfig
  ): Promise<{ success: boolean; sent?: number; error?: string }> {
    try {
      const res = await fetch(config.sendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteSlug, ...campaign }),
      });
      const data = await res.json();
      if (res.ok) {
        const c: PushCampaign = {
          ...campaign,
          id: `push-${Date.now()}`,
          siteSlug,
          status: 'sent',
          sentAt: Date.now(),
          subscriberCount: data.sent ?? 0,
        };
        saveCampaign(siteSlug, c);
        return { success: true, sent: data.sent };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  },

  getCampaigns: readCampaigns,
  saveCampaign,

  deleteCampaign(siteSlug: string, id: string): void {
    const all = readCampaigns(siteSlug).filter(c => c.id !== id);
    try { localStorage.setItem(CAMPS_KEY(siteSlug), JSON.stringify(all)); } catch { /* noop */ }
  },

  // ── Inject prompt script in exported HTML ────────────────────────────────

  injectScript(config: Pick<PushConfig, 'vapidPublicKey' | 'subscriptionEndpoint'>): string {
    return `<script>
(function() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  function subscribe() {
    Notification.requestPermission().then(function(perm) {
      if (perm !== 'granted') return;
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: ${JSON.stringify(config.vapidPublicKey)},
        });
      }).then(function(sub) {
        return fetch(${JSON.stringify(config.subscriptionEndpoint)}, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        });
      }).catch(function(e) { console.warn('[Push]', e); });
    });
  }

  // Show prompt after 5s if not already subscribed
  setTimeout(function() {
    if (localStorage.getItem('fp_push_subscribed')) return;
    var banner = document.createElement('div');
    banner.innerHTML = '<div style="position:fixed;bottom:20px;right:20px;z-index:9999;background:#1e293b;color:#fff;padding:16px 20px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.2);max-width:300px;font-family:sans-serif;">' +
      '<p style="margin:0 0 8px;font-size:14px;font-weight:700;">🔔 ¿Activar notificaciones?</p>' +
      '<p style="margin:0 0 12px;font-size:12px;color:#94a3b8;">Te avisaremos de novedades importantes.</p>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="fp-push-ok" style="flex:1;padding:8px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Sí, activar</button>' +
      '<button id="fp-push-no" style="flex:1;padding:8px;background:#334155;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;">No gracias</button>' +
      '</div></div>';
    document.body.appendChild(banner);
    document.getElementById('fp-push-ok').onclick = function() {
      subscribe();
      localStorage.setItem('fp_push_subscribed', '1');
      banner.remove();
    };
    document.getElementById('fp-push-no').onclick = function() {
      localStorage.setItem('fp_push_subscribed', 'dismissed');
      banner.remove();
    };
  }, 5000);
})();
</script>`;
  },

  // ── Backend template ─────────────────────────────────────────────────────

  backendTemplate: `
/**
 * WebPro Push Notifications Backend — Express.js
 *
 * npm install web-push express cors
 *
 * Setup VAPID:
 *   const webpush = require('web-push');
 *   console.log(webpush.generateVAPIDKeys());
 *
 * Variables .env:
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_EMAIL=mailto:admin@tudominio.com
 */

require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// In-memory store (replace with DB in production)
const subscriptions = new Map(); // key = subscription.endpoint

app.post('/api/push/subscribe', (req, res) => {
  const sub = req.body;
  subscriptions.set(sub.endpoint, sub);
  console.log('New subscriber:', sub.endpoint.slice(-20));
  res.json({ success: true, total: subscriptions.size });
});

app.post('/api/push/send', async (req, res) => {
  const { title, body, icon, actionUrl, tag } = req.body;
  const payload = JSON.stringify({ title, body, icon, actionUrl, tag });
  let sent = 0, failed = 0;
  await Promise.allSettled(
    [...subscriptions.values()].map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        if (e.statusCode === 410) subscriptions.delete(sub.endpoint); // expired
        failed++;
      }
    })
  );
  res.json({ success: true, sent, failed });
});

app.get('/api/push/count', (req, res) => res.json({ count: subscriptions.size }));

app.listen(process.env.PORT || 3002, () =>
  console.log('WebPro Push server on port', process.env.PORT || 3002)
);
`,
};
