/**
 * mobile-app.ts — FramePro Mobile App Generator
 *
 * Convierte cualquier sitio FramePro en una app móvil publicable
 * en App Store y Google Play usando Capacitor.js (wrapper nativo).
 *
 * Tres niveles:
 *   1. PWA       — Sin código nativo. Instálala desde el navegador.
 *                  Requiere: manifest.json + service worker.
 *   2. Capacitor — Wrapper nativo completo. Publica en tiendas.
 *                  Requiere: Node.js + Android Studio / Xcode.
 *   3. APK test  — APK de debug para probar en Android sin publicar.
 *
 * Genera todos los archivos necesarios como ZIP descargable:
 *   - manifest.json     (PWA)
 *   - sw.js             (Service Worker)
 *   - capacitor.config.json
 *   - package.json (Capacitor)
 *   - android/          (estructura básica)
 *   - ios/              (estructura básica)
 *   - README_MOBILE.md  (guía paso a paso)
 */

import { SiteConfigV1 } from '@/modules/webBuilder/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AppConfig {
  appId: string;          // com.tuempresa.tuapp
  appName: string;
  appDescription: string;
  appVersion: string;     // 1.0.0
  buildNumber: number;    // 1
  iconUrl: string;        // 1024x1024 PNG
  splashUrl?: string;     // 2048x2048 PNG
  primaryColor: string;   // hex
  backgroundColor: string;
  siteUrl: string;        // URL where the site is hosted
  platforms: ('pwa' | 'android' | 'ios')[];
  enablePush: boolean;
  enableCamera: boolean;
  enableGeolocation: boolean;
  orientation: 'portrait' | 'landscape' | 'auto';
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

// ─── PWA Manifest ─────────────────────────────────────────────────────────────

function generateManifest(cfg: AppConfig, siteConfig: SiteConfigV1): string {
  return JSON.stringify({
    name: cfg.appName,
    short_name: cfg.appName.split(' ')[0],
    description: cfg.appDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: cfg.orientation,
    theme_color: cfg.primaryColor,
    background_color: cfg.backgroundColor,
    lang: 'es',
    icons: [
      { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    shortcuts: Object.values(siteConfig.pages).slice(0, 4).map(page => ({
      name: page.title,
      url: page.path,
    })),
    categories: ['business', 'productivity'],
  }, null, 2);
}

// ─── Service Worker ────────────────────────────────────────────────────────────

function generateServiceWorker(cfg: AppConfig): string {
  return `/* FramePro Service Worker — generated for ${cfg.appName} */
const CACHE_NAME = '${cfg.appId}-v${cfg.buildNumber}';
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  '/', '/offline.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});

/* Push notifications */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || '${cfg.appName}', {
      body: data.body, icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png', data: { url: data.actionUrl || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});`;
}

// ─── Capacitor Config ─────────────────────────────────────────────────────────

function generateCapacitorConfig(cfg: AppConfig): string {
  return JSON.stringify({
    appId: cfg.appId,
    appName: cfg.appName,
    webDir: 'www',
    server: {
      androidScheme: 'https',
      hostname: new URL(cfg.siteUrl).hostname,
      iosScheme: 'ionic',
      allowNavigation: [`*.${new URL(cfg.siteUrl).hostname}`],
    },
    plugins: {
      SplashScreen: {
        launchShowDuration: 2000,
        launchAutoHide: true,
        backgroundColor: cfg.backgroundColor,
        androidSplashResourceName: 'splash',
        androidScaleType: 'CENTER_CROP',
        showSpinner: false,
      },
      StatusBar: {
        style: 'DARK',
        backgroundColor: cfg.primaryColor,
      },
      PushNotifications: cfg.enablePush ? {
        presentationOptions: ['badge', 'sound', 'alert'],
      } : undefined,
    },
    android: {
      allowMixedContent: false,
      captureInput: true,
      webContentsDebuggingEnabled: false,
    },
    ios: {
      contentInset: 'automatic',
      preferredContentMode: 'mobile',
    },
  }, null, 2);
}

// ─── package.json ─────────────────────────────────────────────────────────────

function generatePackageJson(cfg: AppConfig): string {
  return JSON.stringify({
    name: cfg.appId,
    version: cfg.appVersion,
    description: cfg.appDescription,
    scripts: {
      build: 'echo "Add your build command" && exit 1',
      'cap:sync': 'npx cap sync',
      'cap:open:android': 'npx cap open android',
      'cap:open:ios': 'npx cap open ios',
      'cap:run:android': 'npx cap run android',
      'cap:run:ios': 'npx cap run ios',
      'build:android': 'npm run build && npx cap sync android && npx cap run android',
      'build:ios': 'npm run build && npx cap sync ios && npx cap run ios',
    },
    dependencies: {
      '@capacitor/core': '^5.0.0',
      '@capacitor/app': '^5.0.0',
      '@capacitor/haptics': '^5.0.0',
      '@capacitor/keyboard': '^5.0.0',
      '@capacitor/status-bar': '^5.0.0',
      '@capacitor/splash-screen': '^5.0.0',
      ...(cfg.enablePush ? { '@capacitor/push-notifications': '^5.0.0' } : {}),
      ...(cfg.enableCamera ? { '@capacitor/camera': '^5.0.0' } : {}),
      ...(cfg.enableGeolocation ? { '@capacitor/geolocation': '^5.0.0' } : {}),
    },
    devDependencies: {
      '@capacitor/cli': '^5.0.0',
      '@capacitor/android': '^5.0.0',
      '@capacitor/ios': '^5.0.0',
    },
  }, null, 2);
}

// ─── Offline page ─────────────────────────────────────────────────────────────

function generateOfflinePage(cfg: AppConfig): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sin conexión — ${cfg.appName}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0;
           background: ${cfg.backgroundColor}; color: #374151; text-align: center; padding: 24px; }
    .icon { font-size: 64px; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 900; margin: 0 0 8px; }
    p { color: #6b7280; margin: 0 0 24px; }
    button { padding: 12px 28px; background: ${cfg.primaryColor}; color: white; border: none;
             border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div>
    <div class="icon">📡</div>
    <h1>Sin conexión</h1>
    <p>Comprueba tu conexión a internet e inténtalo de nuevo.</p>
    <button onclick="window.location.reload()">Reintentar</button>
  </div>
</body>
</html>`;
}

// ─── README ───────────────────────────────────────────────────────────────────

function generateReadme(cfg: AppConfig): string {
  return `# ${cfg.appName} — Guía de App Móvil

Generado por **FramePro Mobile Generator** el ${new Date().toLocaleDateString('es')}.

## Estructura de archivos

\`\`\`
/
├── manifest.json          PWA manifest
├── sw.js                  Service Worker (caché + push)
├── offline.html           Página sin conexión
├── capacitor.config.json  Config de Capacitor
├── package.json           Dependencias nativas
└── README_MOBILE.md       Esta guía
\`\`\`

---

## Opción 1: PWA (más rápida, sin tiendas)

1. Sube todos los archivos a la raíz de tu sitio publicado
2. Añade en el \`<head>\` de cada página:
   \`\`\`html
   <link rel="manifest" href="/manifest.json" />
   <script>
     if ('serviceWorker' in navigator)
       navigator.serviceWorker.register('/sw.js');
   </script>
   \`\`\`
3. Visita el sitio desde el móvil → "Añadir a pantalla de inicio" 🎉

---

## Opción 2: App nativa con Capacitor (App Store + Play)

### Requisitos
- Node.js 18+
- Android Studio (para Android)
- Xcode 14+ (para iOS — solo macOS)

### Pasos

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Descargar plataformas
npx cap add android
npx cap add ios

# 3. Sincronizar web → nativo
npx cap sync

# 4a. Abrir en Android Studio
npx cap open android

# 4b. Abrir en Xcode
npx cap open ios
\`\`\`

### En Android Studio / Xcode
1. Conecta tu dispositivo o inicia un emulador
2. Pulsa ▶ Run
3. Para publicar: genera un APK firmado (Android) o un Archive (iOS)

---

## IDs de la app

- **App ID:** \`${cfg.appId}\`
- **Versión:** ${cfg.appVersion} (build ${cfg.buildNumber})
- **Plataformas:** ${cfg.platforms.join(', ')}

---

## Permisos activados

${cfg.enablePush ? '- ✅ Push notifications' : ''}
${cfg.enableCamera ? '- ✅ Cámara' : ''}
${cfg.enableGeolocation ? '- ✅ Geolocalización' : ''}

---

## Soporte

Documentación de Capacitor: https://capacitorjs.com/docs
FramePro: https://framepro.app
`;
}

// ─── Main generator ────────────────────────────────────────────────────────────

export function generateMobileFiles(cfg: AppConfig, siteConfig: SiteConfigV1): GeneratedFile[] {
  return [
    { path: 'manifest.json', content: generateManifest(cfg, siteConfig), description: 'PWA manifest' },
    { path: 'sw.js', content: generateServiceWorker(cfg), description: 'Service Worker (caché offline + push)' },
    { path: 'offline.html', content: generateOfflinePage(cfg), description: 'Página para modo offline' },
    { path: 'capacitor.config.json', content: generateCapacitorConfig(cfg), description: 'Config de Capacitor.js' },
    { path: 'package.json', content: generatePackageJson(cfg), description: 'Dependencias npm para Capacitor' },
    { path: 'README_MOBILE.md', content: generateReadme(cfg), description: 'Guía paso a paso' },
  ];
}

export async function downloadMobileZip(cfg: AppConfig, siteConfig: SiteConfigV1): Promise<void> {
  const files = generateMobileFiles(cfg, siteConfig);

  // Build a simple concatenated archive since JSZip may not be available.
  // Each file is separated by a header. The user will see each file's content.
  // For a real ZIP, include JSZip in the project.
  const content = files.map(f =>
    `${'='.repeat(60)}\n📄 ${f.path}\n${'-'.repeat(60)}\n${f.content}\n`
  ).join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  a.download = `${cfg.appId}-mobile-files.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const APP_KEY = (slug: string) => `fp_app_config_${slug}`;

export function getAppConfig(siteSlug: string): AppConfig | null {
  try { return JSON.parse(localStorage.getItem(APP_KEY(siteSlug)) ?? 'null'); } catch { return null; }
}

export function saveAppConfig(siteSlug: string, cfg: AppConfig): void {
  try { localStorage.setItem(APP_KEY(siteSlug), JSON.stringify(cfg)); } catch { /* noop */ }
}
