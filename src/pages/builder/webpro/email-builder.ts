/**
 * email-builder.ts — WebPro Email Builder
 *
 * Genera emails HTML compatibles con Gmail, Outlook, Apple Mail, etc.
 * Usa tables como layout base (estándar de la industria para email).
 *
 * Bloques disponibles:
 *   header, hero, text, button, image, divider, columns, footer, spacer
 *
 * Export:
 *   buildEmail(template) → HTML string inline-styled
 *   downloadEmail(template, filename)
 *   previewEmail(template) → abre en nueva pestaña
 */

export type EmailBlockType =
    | 'header' | 'hero' | 'text' | 'button'
    | 'image' | 'divider' | 'columns' | 'footer' | 'spacer';

export interface EmailBlock {
    id: string;
    type: EmailBlockType;
    data: Record<string, any>;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    preheader: string;
    backgroundColor: string;
    contentWidth: number;
    fontFamily: string;
    primaryColor: string;
    blocks: EmailBlock[];
    createdAt: number;
    updatedAt: number;
}

// ─── Default blocks ────────────────────────────────────────────────────────────

export function createEmailBlock(type: EmailBlockType): EmailBlock {
    const id = `eb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const defaults: Record<EmailBlockType, any> = {
        header: { logoUrl: '', logoAlt: 'Logo', logoWidth: 140, backgroundColor: '#ffffff', padding: '20px 40px' },
        hero: { headline: 'Tu mensaje aquí', subheadline: 'Una línea de apoyo que refuerza el titular.', ctaLabel: 'Ver ahora', ctaUrl: '#', ctaColor: '#4f46e5', imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop', imageAlt: 'Hero image', textAlign: 'center', backgroundColor: '#f8fafc' },
        text: { content: '<p>Escribe tu contenido aquí. Puedes usar <strong>negritas</strong>, <em>cursivas</em> y <a href="#">enlaces</a>.</p>', fontSize: '16px', color: '#374151', padding: '20px 40px' },
        button: { label: 'Llámame a la acción', url: '#', backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: '8px', fontSize: '16px', padding: '14px 32px', align: 'center' },
        image: { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop', alt: '', width: '100%', link: '', caption: '' },
        divider: { color: '#e5e7eb', thickness: '1px', margin: '20px 40px' },
        columns: {
            columns: [
                { content: '<p><strong>Columna 1</strong></p><p>Contenido de la primera columna.</p>', imageUrl: '' },
                { content: '<p><strong>Columna 2</strong></p><p>Contenido de la segunda columna.</p>', imageUrl: '' },
            ],
            backgroundColor: '#ffffff', gap: '20px'
        },
        footer: { companyName: 'Mi Empresa', address: 'Calle Principal 1, Madrid, España', unsubscribeUrl: '#', privacyUrl: '#', socialLinks: [], backgroundColor: '#f9fafb', textColor: '#6b7280', fontSize: '12px' },
        spacer: { height: '40px' },
    };
    return { id, type, data: defaults[type] };
}

// ─── Default templates ─────────────────────────────────────────────────────────

export const EMAIL_PRESETS: Array<{ id: string; name: string; emoji: string; description: string; blocks: EmailBlockType[] }> = [
    { id: 'newsletter', name: 'Newsletter', emoji: '📰', description: 'Email informativo con contenido editorial', blocks: ['header', 'hero', 'divider', 'text', 'button', 'divider', 'footer'] },
    { id: 'promotional', name: 'Promocional', emoji: '🎯', description: 'Email de oferta o lanzamiento de producto', blocks: ['header', 'hero', 'text', 'button', 'image', 'columns', 'footer'] },
    { id: 'transactional', name: 'Transaccional', emoji: '✅', description: 'Confirmación de pedido, bienvenida, etc.', blocks: ['header', 'text', 'divider', 'text', 'button', 'footer'] },
    { id: 'welcome', name: 'Bienvenida', emoji: '👋', description: 'Email de onboarding para nuevos usuarios', blocks: ['header', 'hero', 'text', 'columns', 'button', 'footer'] },
    { id: 'event', name: 'Evento', emoji: '📅', description: 'Invitación a evento o webinar', blocks: ['header', 'hero', 'text', 'image', 'button', 'footer'] },
];

export function createEmailTemplate(preset?: typeof EMAIL_PRESETS[0]): EmailTemplate {
    const now = Date.now();
    const blocks = (preset?.blocks ?? ['header', 'hero', 'text', 'button', 'footer'])
        .map(t => createEmailBlock(t as EmailBlockType));

    return {
        id: `email-${now}`,
        name: preset?.name ?? 'Nuevo email',
        subject: '¡Novedad importante para ti!',
        preheader: 'Abre este email para descubrir…',
        backgroundColor: '#f3f4f6',
        contentWidth: 600,
        fontFamily: 'Arial, Helvetica, sans-serif',
        primaryColor: '#4f46e5',
        blocks,
        createdAt: now,
        updatedAt: now,
    };
}

// ─── HTML Email Builder ────────────────────────────────────────────────────────

function renderBlock(block: EmailBlock, template: EmailTemplate): string {
    const cw = template.contentWidth;
    const ff = template.fontFamily;
    const d = block.data;

    switch (block.type) {
        case 'header':
            return `
<tr><td style="background:${d.backgroundColor};padding:${d.padding};text-align:center;">
  ${d.logoUrl ? `<img src="${d.logoUrl}" alt="${d.logoAlt}" width="${d.logoWidth}" style="display:block;margin:0 auto;max-width:${d.logoWidth}px;height:auto;" />` : `<span style="font-family:${ff};font-size:22px;font-weight:900;color:#1e293b;">${d.logoAlt}</span>`}
</td></tr>`;

        case 'hero':
            return `
<tr><td style="background:${d.backgroundColor};text-align:${d.textAlign};padding:0;">
  ${d.imageUrl ? `<img src="${d.imageUrl}" alt="${d.imageAlt}" width="${cw}" style="display:block;width:100%;max-width:${cw}px;height:auto;" />` : ''}
  <div style="padding:40px 40px 30px;">
    <h1 style="font-family:${ff};font-size:32px;font-weight:900;color:#111827;margin:0 0 16px;line-height:1.2;">${d.headline}</h1>
    <p style="font-family:${ff};font-size:18px;color:#6b7280;margin:0 0 28px;line-height:1.6;">${d.subheadline}</p>
    <a href="${d.ctaUrl}" style="display:inline-block;background:${d.ctaColor};color:#ffffff;font-family:${ff};font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">${d.ctaLabel}</a>
  </div>
</td></tr>`;

        case 'text':
            return `
<tr><td style="padding:${d.padding};font-family:${ff};font-size:${d.fontSize};color:${d.color};line-height:1.7;">
  ${d.content}
</td></tr>`;

        case 'button':
            const align = d.align === 'left' ? 'left' : d.align === 'right' ? 'right' : 'center';
            return `
<tr><td style="padding:20px 40px;text-align:${align};">
  <a href="${d.url}" style="display:inline-block;background:${d.backgroundColor};color:${d.textColor};font-family:${ff};font-size:${d.fontSize};font-weight:700;text-decoration:none;padding:${d.padding};border-radius:${d.borderRadius};">${d.label}</a>
</td></tr>`;

        case 'image':
            return `
<tr><td style="padding:20px 0;text-align:center;">
  ${d.link ? `<a href="${d.link}">` : ''}
  <img src="${d.url}" alt="${d.alt}" width="${cw}" style="display:block;width:${d.width};max-width:${cw}px;height:auto;margin:0 auto;" />
  ${d.link ? `</a>` : ''}
  ${d.caption ? `<p style="font-family:${ff};font-size:12px;color:#9ca3af;margin:8px 40px 0;text-align:center;">${d.caption}</p>` : ''}
</td></tr>`;

        case 'divider':
            return `
<tr><td style="padding:0;margin:${d.margin};">
  <div style="margin:${d.margin};border-top:${d.thickness} solid ${d.color};"></div>
</td></tr>`;

        case 'columns':
            const cols = d.columns ?? [];
            const colWidth = Math.floor(100 / cols.length);
            return `
<tr><td style="padding:20px 40px;background:${d.backgroundColor};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>${cols.map((col: any) => `
      <td width="${colWidth}%" valign="top" style="padding:0 ${parseInt(d.gap)/2}px;font-family:${ff};font-size:15px;color:#374151;line-height:1.6;">
        ${col.imageUrl ? `<img src="${col.imageUrl}" alt="" style="width:100%;height:auto;margin-bottom:12px;" />` : ''}
        ${col.content}
      </td>`).join('')}
    </tr>
  </table>
</td></tr>`;

        case 'footer':
            const socials = (d.socialLinks ?? []).map((s: any) =>
                `<a href="${s.url}" style="display:inline-block;margin:0 6px;color:${d.textColor};text-decoration:none;">${s.label}</a>`
            ).join('');
            return `
<tr><td style="background:${d.backgroundColor};padding:30px 40px;text-align:center;">
  ${socials ? `<div style="margin-bottom:12px;">${socials}</div>` : ''}
  <p style="font-family:${ff};font-size:${d.fontSize};color:${d.textColor};margin:0 0 8px;">${d.companyName}</p>
  <p style="font-family:${ff};font-size:${d.fontSize};color:${d.textColor};margin:0 0 8px;">${d.address}</p>
  <p style="font-family:${ff};font-size:${d.fontSize};color:${d.textColor};margin:0;">
    <a href="${d.unsubscribeUrl}" style="color:${d.textColor};">Cancelar suscripción</a>
    &nbsp;·&nbsp;
    <a href="${d.privacyUrl}" style="color:${d.textColor};">Privacidad</a>
  </p>
</td></tr>`;

        case 'spacer':
            return `<tr><td style="height:${d.height};font-size:0;line-height:0;">&nbsp;</td></tr>`;

        default:
            return '';
    }
}

export function buildEmail(template: EmailTemplate): string {
    const blocks = template.blocks.map(b => renderBlock(b, template)).join('\n');

    return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${template.subject}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td { margin:0;padding:0;border:0; }
    img { border:0;outline:0;text-decoration:none;-ms-interpolation-mode:bicubic; }
    body { width:100% !important;min-width:100%;background:${template.backgroundColor}; }
    a { color:${template.primaryColor}; }
    @media only screen and (max-width:600px) {
      .email-container { width:100% !important;max-width:100% !important; }
      .stack-column { display:block !important;width:100% !important;max-width:100% !important; }
      h1 { font-size:24px !important; }
      .hero-cta { display:block !important;width:80% !important;text-align:center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${template.backgroundColor};">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${template.backgroundColor};">
    ${template.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${template.backgroundColor};">
    <tr><td align="center" style="padding:20px 0;">

      <!-- Email container -->
      <table class="email-container" cellpadding="0" cellspacing="0" border="0"
             width="${template.contentWidth}" style="max-width:${template.contentWidth}px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        ${blocks}
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

export function downloadEmail(template: EmailTemplate, filename?: string): void {
    const html = buildEmail(template);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    a.download = filename ?? `${template.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function previewEmail(template: EmailTemplate): void {
    const html = buildEmail(template);
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const EMAILS_KEY = (siteSlug: string) => `fp_emails_${siteSlug}`;

export const emailStore = {
    getAll(siteSlug: string): EmailTemplate[] {
        try { return JSON.parse(localStorage.getItem(EMAILS_KEY(siteSlug)) ?? '[]'); } catch { return []; }
    },
    save(siteSlug: string, template: EmailTemplate): void {
        const all = this.getAll(siteSlug).filter(e => e.id !== template.id);
        all.push({ ...template, updatedAt: Date.now() });
        try { localStorage.setItem(EMAILS_KEY(siteSlug), JSON.stringify(all)); } catch { /* noop */ }
    },
    delete(siteSlug: string, id: string): void {
        const all = this.getAll(siteSlug).filter(e => e.id !== id);
        try { localStorage.setItem(EMAILS_KEY(siteSlug), JSON.stringify(all)); } catch { /* noop */ }
    },
};
