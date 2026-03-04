/**
 * analytics.ts — FramePro Analytics
 *
 * Analytics privacyfirst sin cookies ni terceros.
 * Almacena eventos en localStorage + opcionalmente envía a tu backend.
 *
 * Métricas recogidas (en el HTML exportado):
 *   - Page views por página
 *   - Tiempo en página
 *   - Clics en CTAs (botones con data-fp-cta)
 *   - Scroll depth (25/50/75/100%)
 *   - Dispositivo (mobile/tablet/desktop)
 *   - Referrer y UTM params
 *
 * API pública:
 *   analytics.track(event, props?)
 *   analytics.getReport(siteSlug) → AnalyticsReport
 *   analytics.injectScript(config) → string (HTML snippet para el export)
 *   analytics.clearData(siteSlug)
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
    id: string;
    siteSlug: string;
    event: string;          // 'pageview' | 'cta_click' | 'scroll_depth' | 'time_on_page'
    page: string;           // URL path
    props: Record<string, string | number | boolean>;
    device: 'mobile' | 'tablet' | 'desktop';
    referrer: string;
    utm: Record<string, string>;
    ts: number;
    sessionId: string;
}

export interface PageStats {
    path: string;
    views: number;
    uniqueSessions: number;
    avgTimeSeconds: number;
    scrollDepth: number;     // 0-100%
    ctaClicks: Record<string, number>;  // label → count
    bounceRate: number;      // 0-100%
}

export interface AnalyticsReport {
    siteSlug: string;
    generatedAt: number;
    totalViews: number;
    uniqueSessions: number;
    avgSessionDuration: number;
    topPages: PageStats[];
    deviceBreakdown: { mobile: number; tablet: number; desktop: number };
    topReferrers: Array<{ referrer: string; count: number }>;
    topUtmSources: Array<{ source: string; count: number }>;
    ctaConversions: Array<{ label: string; clicks: number; page: string }>;
    dailyViews: Array<{ date: string; views: number }>;
}

// ─── Storage ───────────────────────────────────────────────────────────────────

function storageKey(siteSlug: string) { return `fp_analytics_${siteSlug}`; }

function readEvents(siteSlug: string): AnalyticsEvent[] {
    try { return JSON.parse(localStorage.getItem(storageKey(siteSlug)) ?? '[]'); }
    catch { return []; }
}

function writeEvents(siteSlug: string, events: AnalyticsEvent[]): void {
    try {
        // Keep max 10k events per site
        const trimmed = events.slice(-10_000);
        localStorage.setItem(storageKey(siteSlug), JSON.stringify(trimmed));
    } catch { /* storage full */ }
}

// ─── Session ID ────────────────────────────────────────────────────────────────

function getSessionId(): string {
    const key = 'fp_session';
    let id = sessionStorage.getItem(key);
    if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem(key, id); }
    return id;
}

function getDevice(): 'mobile' | 'tablet' | 'desktop' {
    const w = window.innerWidth;
    return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

function getUtmParams(): Record<string, string> {
    const p = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const result: Record<string, string> = {};
    keys.forEach(k => { const v = p.get(k); if (v) result[k] = v; });
    return result;
}

// ─── Analytics API ─────────────────────────────────────────────────────────────

export const analytics = {
    /** Track an event for a site */
    track(siteSlug: string, event: string, props: Record<string, string | number | boolean> = {}): void {
        const ev: AnalyticsEvent = {
            id: Math.random().toString(36).slice(2),
            siteSlug,
            event,
            page: window.location.pathname,
            props,
            device: getDevice(),
            referrer: document.referrer,
            utm: getUtmParams(),
            ts: Date.now(),
            sessionId: getSessionId(),
        };
        const events = readEvents(siteSlug);
        events.push(ev);
        writeEvents(siteSlug, events);
    },

    /** Generate a full analytics report */
    getReport(siteSlug: string): AnalyticsReport {
        const events = readEvents(siteSlug);
        const now = Date.now();

        const sessions = new Set(events.map(e => e.sessionId));
        const pageViews = events.filter(e => e.event === 'pageview');

        // Group by page
        const pageMap = new Map<string, AnalyticsEvent[]>();
        pageViews.forEach(e => {
            const list = pageMap.get(e.page) ?? [];
            list.push(e);
            pageMap.set(e.page, list);
        });

        const topPages: PageStats[] = Array.from(pageMap.entries()).map(([path, evs]) => {
            const pageSessions = new Set(evs.map(e => e.sessionId));
            const timeEvents = events.filter(e => e.event === 'time_on_page' && e.page === path);
            const avgTime = timeEvents.length
                ? timeEvents.reduce((s, e) => s + (e.props.seconds as number || 0), 0) / timeEvents.length
                : 0;
            const scrollEvents = events.filter(e => e.event === 'scroll_depth' && e.page === path);
            const avgScroll = scrollEvents.length
                ? scrollEvents.reduce((s, e) => s + (e.props.depth as number || 0), 0) / scrollEvents.length
                : 0;
            const ctaEvents = events.filter(e => e.event === 'cta_click' && e.page === path);
            const ctaClicks: Record<string, number> = {};
            ctaEvents.forEach(e => {
                const label = e.props.label as string || 'unknown';
                ctaClicks[label] = (ctaClicks[label] ?? 0) + 1;
            });
            const bounced = Array.from(pageSessions).filter(sid => {
                const sessionEvs = events.filter(e => e.sessionId === sid);
                return new Set(sessionEvs.map(e => e.page)).size === 1;
            });

            return {
                path,
                views: evs.length,
                uniqueSessions: pageSessions.size,
                avgTimeSeconds: Math.round(avgTime),
                scrollDepth: Math.round(avgScroll),
                ctaClicks,
                bounceRate: pageSessions.size > 0 ? Math.round((bounced.length / pageSessions.size) * 100) : 0,
            };
        }).sort((a, b) => b.views - a.views);

        // Device breakdown
        const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 };
        events.forEach(e => { deviceBreakdown[e.device]++; });

        // Top referrers
        const refMap = new Map<string, number>();
        events.filter(e => e.referrer).forEach(e => {
            try {
                const host = new URL(e.referrer).hostname;
                refMap.set(host, (refMap.get(host) ?? 0) + 1);
            } catch { /* noop */ }
        });
        const topReferrers = Array.from(refMap.entries())
            .map(([referrer, count]) => ({ referrer, count }))
            .sort((a, b) => b.count - a.count).slice(0, 10);

        // UTM sources
        const utmMap = new Map<string, number>();
        events.forEach(e => {
            const src = e.utm['utm_source'];
            if (src) utmMap.set(src, (utmMap.get(src) ?? 0) + 1);
        });
        const topUtmSources = Array.from(utmMap.entries())
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count).slice(0, 10);

        // CTA conversions
        const ctaMap = new Map<string, number>();
        events.filter(e => e.event === 'cta_click').forEach(e => {
            const key = `${e.props.label}::${e.page}`;
            ctaMap.set(key, (ctaMap.get(key) ?? 0) + 1);
        });
        const ctaConversions = Array.from(ctaMap.entries())
            .map(([key, clicks]) => {
                const [label, page] = key.split('::');
                return { label, clicks, page };
            })
            .sort((a, b) => b.clicks - a.clicks).slice(0, 20);

        // Daily views (last 30 days)
        const dailyMap = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
            dailyMap.set(d, 0);
        }
        pageViews.forEach(e => {
            const d = new Date(e.ts).toISOString().slice(0, 10);
            if (dailyMap.has(d)) dailyMap.set(d, (dailyMap.get(d) ?? 0) + 1);
        });
        const dailyViews = Array.from(dailyMap.entries()).map(([date, views]) => ({ date, views }));

        const timeEventsAll = events.filter(e => e.event === 'time_on_page');
        const avgSessionDuration = timeEventsAll.length
            ? timeEventsAll.reduce((s, e) => s + (e.props.seconds as number || 0), 0) / timeEventsAll.length
            : 0;

        return {
            siteSlug,
            generatedAt: now,
            totalViews: pageViews.length,
            uniqueSessions: sessions.size,
            avgSessionDuration: Math.round(avgSessionDuration),
            topPages,
            deviceBreakdown,
            topReferrers,
            topUtmSources,
            ctaConversions,
            dailyViews,
        };
    },

    clearData(siteSlug: string): void {
        try { localStorage.removeItem(storageKey(siteSlug)); } catch { /* noop */ }
    },

    /**
     * Returns the analytics tracking script to inject in exported HTML.
     * Paste this in the <head> of each exported page.
     */
    injectScript(siteSlug: string, beaconUrl?: string): string {
        return `<script>
(function() {
  var SLUG = ${JSON.stringify(siteSlug)};
  var BEACON = ${JSON.stringify(beaconUrl ?? '')};
  var sid = sessionStorage.getItem('fp_sid') || Math.random().toString(36).slice(2);
  sessionStorage.setItem('fp_sid', sid);
  var device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
  var startTs = Date.now();

  function send(event, props) {
    var ev = { id: Math.random().toString(36).slice(2), siteSlug: SLUG, event: event,
      page: location.pathname, props: props || {}, device: device,
      referrer: document.referrer, sessionId: sid, ts: Date.now() };
    try {
      var stored = JSON.parse(localStorage.getItem('fp_analytics_' + SLUG) || '[]');
      stored.push(ev);
      if (stored.length > 10000) stored = stored.slice(-10000);
      localStorage.setItem('fp_analytics_' + SLUG, JSON.stringify(stored));
    } catch(e) {}
    if (BEACON) {
      navigator.sendBeacon ? navigator.sendBeacon(BEACON, JSON.stringify(ev))
        : fetch(BEACON, { method: 'POST', body: JSON.stringify(ev), keepalive: true }).catch(function(){});
    }
  }

  // Page view
  send('pageview', { title: document.title });

  // Scroll depth
  var depths = [25,50,75,100]; var fired = {};
  window.addEventListener('scroll', function() {
    var pct = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
    depths.forEach(function(d) {
      if (pct >= d && !fired[d]) { fired[d] = 1; send('scroll_depth', { depth: d }); }
    });
  }, { passive: true });

  // CTA clicks
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-fp-cta],[data-fp-track]');
    if (btn) send('cta_click', { label: btn.getAttribute('data-fp-cta') || btn.textContent.trim().slice(0,50) });
  });

  // Time on page
  window.addEventListener('beforeunload', function() {
    send('time_on_page', { seconds: Math.round((Date.now() - startTs) / 1000) });
  });
})();
</script>`;
    },
};
