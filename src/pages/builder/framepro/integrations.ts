/**
 * integrations.ts — FramePro Integrations Hub
 *
 * Conecta eventos del sitio con servicios externos:
 *   - Zapier (via webhook)
 *   - Make / Integromat (via webhook)
 *   - n8n (via webhook)
 *   - Slack
 *   - Notion
 *   - Airtable
 *   - HubSpot (contactos)
 *   - Mailchimp (suscriptores)
 *   - Google Sheets (via Apps Script)
 *   - Webhooks genéricos
 *
 * Eventos disparables:
 *   form_submit, cta_click, page_view, new_subscriber,
 *   contact_request, order_placed, custom
 *
 * API:
 *   integrations.create(siteSlug, config) → Integration
 *   integrations.getAll(siteSlug) → Integration[]
 *   integrations.trigger(siteSlug, event, payload) → TriggerResult[]
 *   integrations.test(integration, payload) → TriggerResult
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type IntegrationService =
    | 'zapier' | 'make' | 'n8n' | 'slack' | 'notion'
    | 'airtable' | 'hubspot' | 'mailchimp' | 'google_sheets'
    | 'webhook';

export type SiteEvent =
    | 'form_submit' | 'cta_click' | 'page_view'
    | 'new_subscriber' | 'contact_request'
    | 'order_placed' | 'custom';

export interface Integration {
    id: string;
    siteSlug: string;
    name: string;
    service: IntegrationService;
    enabled: boolean;
    webhookUrl: string;
    triggerEvents: SiteEvent[];
    headers?: Record<string, string>;   // extra HTTP headers
    bodyTemplate?: string;              // optional JSON template (uses {{field}} placeholders)
    createdAt: number;
    lastTriggered?: number;
    lastStatus?: 'success' | 'error';
    lastError?: string;
}

export interface TriggerResult {
    integrationId: string;
    integrationName: string;
    success: boolean;
    statusCode?: number;
    error?: string;
    triggeredAt: number;
}

// ─── Service config ────────────────────────────────────────────────────────────

export const SERVICE_CONFIG: Record<IntegrationService, {
    label: string; emoji: string; color: string;
    description: string; webhookPlaceholder: string;
    docsUrl: string; method: 'POST' | 'GET';
}> = {
    zapier: {
        label: 'Zapier', emoji: '⚡', color: '#FF4A00',
        description: 'Conecta con +6.000 apps via Zaps automáticos',
        webhookPlaceholder: 'https://hooks.zapier.com/hooks/catch/…',
        docsUrl: 'https://zapier.com/apps/webhook/integrations',
        method: 'POST',
    },
    make: {
        label: 'Make', emoji: '🔧', color: '#6D00CC',
        description: 'Automatizaciones visuales con Make (antes Integromat)',
        webhookPlaceholder: 'https://hook.eu1.make.com/…',
        docsUrl: 'https://www.make.com/en/help/tools/webhooks',
        method: 'POST',
    },
    n8n: {
        label: 'n8n', emoji: '🔀', color: '#EA4B71',
        description: 'Automatización open-source self-hosteable',
        webhookPlaceholder: 'https://tu-n8n.com/webhook/…',
        docsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
        method: 'POST',
    },
    slack: {
        label: 'Slack', emoji: '💬', color: '#4A154B',
        description: 'Recibe notificaciones en cualquier canal de Slack',
        webhookPlaceholder: 'https://hooks.slack.com/services/…',
        docsUrl: 'https://api.slack.com/messaging/webhooks',
        method: 'POST',
    },
    notion: {
        label: 'Notion', emoji: '📋', color: '#000000',
        description: 'Crea páginas en Notion con cada evento',
        webhookPlaceholder: 'https://api.notion.com/v1/pages (vía proxy)',
        docsUrl: 'https://developers.notion.com/',
        method: 'POST',
    },
    airtable: {
        label: 'Airtable', emoji: '🗄️', color: '#18BFFF',
        description: 'Añade filas a una base de Airtable automáticamente',
        webhookPlaceholder: 'https://api.airtable.com/v0/…/… (vía proxy)',
        docsUrl: 'https://airtable.com/developers/web/api/introduction',
        method: 'POST',
    },
    hubspot: {
        label: 'HubSpot', emoji: '🧲', color: '#FF7A59',
        description: 'Crea contactos y deals en HubSpot CRM',
        webhookPlaceholder: 'https://api.hsforms.com/submissions/v3/integration/…',
        docsUrl: 'https://developers.hubspot.com/docs/api/marketing/forms',
        method: 'POST',
    },
    mailchimp: {
        label: 'Mailchimp', emoji: '🐒', color: '#FFE01B',
        description: 'Añade suscriptores a listas de Mailchimp',
        webhookPlaceholder: 'https://us1.api.mailchimp.com/3.0/lists/…/members',
        docsUrl: 'https://mailchimp.com/developer/marketing/api/list-members/',
        method: 'POST',
    },
    google_sheets: {
        label: 'Google Sheets', emoji: '📊', color: '#34A853',
        description: 'Escribe datos en Google Sheets via Apps Script',
        webhookPlaceholder: 'https://script.google.com/macros/s/…/exec',
        docsUrl: 'https://developers.google.com/apps-script/guides/web',
        method: 'POST',
    },
    webhook: {
        label: 'Webhook genérico', emoji: '🔗', color: '#64748b',
        description: 'Envía datos a cualquier endpoint HTTP',
        webhookPlaceholder: 'https://tu-servidor.com/webhook',
        docsUrl: 'https://en.wikipedia.org/wiki/Webhook',
        method: 'POST',
    },
};

export const EVENT_LABELS: Record<SiteEvent, string> = {
    form_submit: '📋 Formulario enviado',
    cta_click: '🎯 CTA clicado',
    page_view: '👁 Vista de página',
    new_subscriber: '📧 Nuevo suscriptor',
    contact_request: '📞 Solicitud de contacto',
    order_placed: '🛍️ Pedido realizado',
    custom: '⚙️ Evento personalizado',
};

// ─── Body template resolver ────────────────────────────────────────────────────

function resolveTemplate(template: string, payload: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
        payload[key] !== undefined ? String(payload[key]) : ''
    );
}

function buildSlackBody(integration: Integration, payload: Record<string, any>): object {
    return {
        text: `🔔 *${integration.name}*`,
        blocks: [
            { type: 'header', text: { type: 'plain_text', text: `FramePro · ${integration.name}` } },
            {
                type: 'section',
                fields: Object.entries(payload).slice(0, 10).map(([k, v]) => ({
                    type: 'mrkdwn',
                    text: `*${k}*\n${String(v).slice(0, 100)}`,
                })),
            },
        ],
    };
}

function buildBody(integration: Integration, payload: Record<string, any>): string {
    if (integration.bodyTemplate) {
        return resolveTemplate(integration.bodyTemplate, payload);
    }
    if (integration.service === 'slack') {
        return JSON.stringify(buildSlackBody(integration, payload));
    }
    return JSON.stringify({
        source: 'framepro',
        site: integration.siteSlug,
        integration: integration.name,
        event: payload._event ?? 'unknown',
        timestamp: new Date().toISOString(),
        data: payload,
    });
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const KEY = (slug: string) => `fp_integrations_${slug}`;

function readAll(siteSlug: string): Integration[] {
    try { return JSON.parse(localStorage.getItem(KEY(siteSlug)) ?? '[]'); } catch { return []; }
}
function writeAll(siteSlug: string, list: Integration[]): void {
    try { localStorage.setItem(KEY(siteSlug), JSON.stringify(list)); } catch { /* noop */ }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const integrations = {
    create(siteSlug: string, cfg: Omit<Integration, 'id' | 'siteSlug' | 'createdAt' | 'enabled'>): Integration {
        const item: Integration = {
            ...cfg, id: `int-${Date.now()}`, siteSlug, createdAt: Date.now(), enabled: true,
        };
        const all = readAll(siteSlug);
        all.push(item);
        writeAll(siteSlug, all);
        return item;
    },

    getAll(siteSlug: string): Integration[] { return readAll(siteSlug); },

    update(siteSlug: string, id: string, patch: Partial<Integration>): void {
        const all = readAll(siteSlug).map(i => i.id === id ? { ...i, ...patch } : i);
        writeAll(siteSlug, all);
    },

    delete(siteSlug: string, id: string): void {
        writeAll(siteSlug, readAll(siteSlug).filter(i => i.id !== id));
    },

    async test(integration: Integration, payload: Record<string, any> = { _event: 'test', message: 'Test desde FramePro' }): Promise<TriggerResult> {
        return this._send(integration, payload);
    },

    async trigger(siteSlug: string, event: SiteEvent, payload: Record<string, any>): Promise<TriggerResult[]> {
        const all = readAll(siteSlug).filter(i => i.enabled && i.triggerEvents.includes(event));
        const results = await Promise.allSettled(
            all.map(i => this._send(i, { ...payload, _event: event }))
        );
        return results.map((r, idx) => {
            const result = r.status === 'fulfilled' ? r.value : {
                integrationId: all[idx].id, integrationName: all[idx].name,
                success: false, error: String((r as PromiseRejectedResult).reason),
                triggeredAt: Date.now(),
            };
            // Persist status
            this.update(siteSlug, all[idx].id, {
                lastTriggered: Date.now(),
                lastStatus: result.success ? 'success' : 'error',
                lastError: result.success ? undefined : result.error,
            });
            return result;
        });
    },

    async _send(integration: Integration, payload: Record<string, any>): Promise<TriggerResult> {
        const triggered = Date.now();
        try {
            const body = buildBody(integration, payload);
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...integration.headers,
            };
            const res = await fetch(integration.webhookUrl, {
                method: SERVICE_CONFIG[integration.service].method,
                headers, body,
                signal: AbortSignal.timeout?.(10_000),
            });
            return {
                integrationId: integration.id, integrationName: integration.name,
                success: res.ok, statusCode: res.status, triggeredAt: triggered,
                error: res.ok ? undefined : `HTTP ${res.status}`,
            };
        } catch (e: any) {
            return {
                integrationId: integration.id, integrationName: integration.name,
                success: false, error: e?.message ?? 'Network error', triggeredAt: triggered,
            };
        }
    },

    /** Call this from the exported HTML to trigger integrations via beacon */
    injectScript(siteSlug: string, beaconUrl: string): string {
        return `<script>
window.__fpTrigger = function(event, data) {
  if (!navigator.sendBeacon) return;
  navigator.sendBeacon(${JSON.stringify(beaconUrl)}, JSON.stringify({
    siteSlug: ${JSON.stringify(siteSlug)}, event: event, data: data, ts: Date.now()
  }));
};
document.addEventListener('submit', function(e) {
  var form = e.target;
  var data = {};
  new FormData(form).forEach(function(v,k){ data[k] = v; });
  window.__fpTrigger('form_submit', data);
});
document.addEventListener('click', function(e) {
  var btn = e.target.closest('[data-fp-cta]');
  if (btn) window.__fpTrigger('cta_click', { label: btn.getAttribute('data-fp-cta') });
});
</script>`;
    },
};

// ─── Google Apps Script template ──────────────────────────────────────────────

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
// Pega esto en script.google.com como nuevo proyecto Web App
// Deploy > New deployment > Web App > Execute as: Me > Anyone

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Primera fila: headers (solo si está vacía)
  if (sheet.getLastRow() === 0) {
    var headers = ['Timestamp', 'Event', 'Site'].concat(
      Object.keys(data.data || {})
    );
    sheet.appendRow(headers);
  }
  
  var row = [
    new Date(data.timestamp || Date.now()),
    data.event || 'unknown',
    data.site || '',
  ].concat(Object.values(data.data || {}));
  
  sheet.appendRow(row);
  
  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  ).setMimeType(ContentService.MimeType.JSON);
}
`;
