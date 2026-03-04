/**
 * headless-cms.ts — FramePro Headless CMS
 *
 * CMS integrado que permite gestionar contenido dinámico (blog, productos,
 * equipo, FAQs, etc.) y exponerlo via API REST embebida o JSON estático.
 *
 * Conceptos:
 *   Collection — tipo de contenido (Blog, Productos, FAQ, etc.)
 *   Field       — campo dentro de la collection (texto, imagen, richtext, etc.)
 *   Entry       — registro concreto dentro de una collection
 *
 * Para sitios estáticos: genera un JSON con todos los datos al exportar.
 * Para sitios dinámicos: expone GET /api/cms/:collection y GET /api/cms/:collection/:id
 *
 * API:
 *   cms.createCollection(siteSlug, schema) → Collection
 *   cms.getCollections(siteSlug) → Collection[]
 *   cms.createEntry(collectionId, data) → CMSEntry
 *   cms.getEntries(collectionId, query?) → CMSEntry[]
 *   cms.updateEntry(entryId, data)
 *   cms.deleteEntry(entryId)
 *   cms.exportJson(siteSlug) → string (JSON for static export)
 *   cms.generateApiHandler(siteSlug) → string (Node.js handler code)
 */

// ─── Field Types ───────────────────────────────────────────────────────────────

export type FieldType =
    | 'text'        // short text
    | 'textarea'    // long text
    | 'richtext'    // HTML/Markdown
    | 'number'
    | 'boolean'
    | 'date'
    | 'image'       // URL or base64
    | 'url'
    | 'email'
    | 'select'      // enum
    | 'tags'        // string[]
    | 'reference'   // reference to another collection entry
    | 'json';       // raw JSON blob

export interface CMSField {
    name: string;          // machine name (e.g. 'title')
    label: string;         // human label (e.g. 'Título')
    type: FieldType;
    required?: boolean;
    defaultValue?: any;
    options?: string[];    // for 'select' type
    referenceCollection?: string; // for 'reference' type
    placeholder?: string;
    helpText?: string;
}

export interface CMSCollection {
    id: string;
    siteSlug: string;
    name: string;           // e.g. 'Blog Posts'
    slug: string;           // e.g. 'blog-posts' (API route)
    icon: string;           // emoji
    description?: string;
    fields: CMSField[];
    createdAt: number;
    entryCount?: number;    // cached count
}

export interface CMSEntry {
    id: string;
    collectionId: string;
    data: Record<string, any>;
    status: 'draft' | 'published' | 'archived';
    createdAt: number;
    updatedAt: number;
    publishedAt?: number;
    slug?: string;         // auto-generated from title field if present
}

export interface CMSQuery {
    status?: CMSEntry['status'];
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    search?: string;
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const COL_KEY = (slug: string) => `fp_cms_collections_${slug}`;
const ENTRY_KEY = (colId: string) => `fp_cms_entries_${colId}`;

// ─── Built-in collection templates ────────────────────────────────────────────

export const COLLECTION_PRESETS: Array<Pick<CMSCollection, 'name' | 'slug' | 'icon' | 'description' | 'fields'>> = [
    {
        name: 'Blog',
        slug: 'blog',
        icon: '📝',
        description: 'Artículos y posts del blog',
        fields: [
            { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Título del artículo' },
            { name: 'excerpt', label: 'Resumen', type: 'textarea', placeholder: 'Resumen breve para listados y SEO' },
            { name: 'body', label: 'Contenido', type: 'richtext' },
            { name: 'coverImage', label: 'Imagen de portada', type: 'image' },
            { name: 'author', label: 'Autor', type: 'text' },
            { name: 'tags', label: 'Etiquetas', type: 'tags' },
            { name: 'category', label: 'Categoría', type: 'select', options: ['Noticias', 'Tutorial', 'Caso de éxito', 'Opinión'] },
            { name: 'publishDate', label: 'Fecha de publicación', type: 'date' },
        ],
    },
    {
        name: 'Productos',
        slug: 'productos',
        icon: '🛍️',
        description: 'Catálogo de productos',
        fields: [
            { name: 'name', label: 'Nombre', type: 'text', required: true },
            { name: 'description', label: 'Descripción', type: 'textarea' },
            { name: 'price', label: 'Precio (€)', type: 'number' },
            { name: 'image', label: 'Imagen', type: 'image' },
            { name: 'category', label: 'Categoría', type: 'select', options: ['Destacado', 'Nuevo', 'Oferta', 'Agotado'] },
            { name: 'stock', label: 'Stock', type: 'number' },
            { name: 'sku', label: 'SKU', type: 'text' },
            { name: 'featured', label: 'Destacado', type: 'boolean' },
        ],
    },
    {
        name: 'Equipo',
        slug: 'equipo',
        icon: '👥',
        description: 'Miembros del equipo',
        fields: [
            { name: 'name', label: 'Nombre completo', type: 'text', required: true },
            { name: 'role', label: 'Cargo', type: 'text' },
            { name: 'bio', label: 'Biografía', type: 'textarea' },
            { name: 'photo', label: 'Foto', type: 'image' },
            { name: 'linkedin', label: 'LinkedIn URL', type: 'url' },
            { name: 'twitter', label: 'Twitter/X URL', type: 'url' },
            { name: 'department', label: 'Departamento', type: 'select', options: ['Producto', 'Ingeniería', 'Marketing', 'Ventas', 'Operaciones'] },
        ],
    },
    {
        name: 'FAQs',
        slug: 'faqs',
        icon: '❓',
        description: 'Preguntas frecuentes',
        fields: [
            { name: 'question', label: 'Pregunta', type: 'text', required: true },
            { name: 'answer', label: 'Respuesta', type: 'richtext', required: true },
            { name: 'category', label: 'Categoría', type: 'text' },
            { name: 'order', label: 'Orden', type: 'number' },
        ],
    },
    {
        name: 'Testimonios',
        slug: 'testimonios',
        icon: '⭐',
        description: 'Reseñas y testimonios de clientes',
        fields: [
            { name: 'name', label: 'Nombre', type: 'text', required: true },
            { name: 'role', label: 'Cargo y empresa', type: 'text' },
            { name: 'text', label: 'Testimonio', type: 'textarea', required: true },
            { name: 'rating', label: 'Valoración (1-5)', type: 'number' },
            { name: 'avatar', label: 'Foto', type: 'image' },
            { name: 'featured', label: 'Destacado', type: 'boolean' },
        ],
    },
    {
        name: 'Eventos',
        slug: 'eventos',
        icon: '📅',
        description: 'Eventos, webinars y talleres',
        fields: [
            { name: 'title', label: 'Título', type: 'text', required: true },
            { name: 'description', label: 'Descripción', type: 'textarea' },
            { name: 'date', label: 'Fecha', type: 'date', required: true },
            { name: 'location', label: 'Lugar / URL online', type: 'text' },
            { name: 'image', label: 'Imagen', type: 'image' },
            { name: 'registrationUrl', label: 'URL de registro', type: 'url' },
            { name: 'capacity', label: 'Aforo', type: 'number' },
        ],
    },
];

// ─── CMS API ───────────────────────────────────────────────────────────────────

function uid(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 64);
}

export const cms = {
    // ── Collections ────────────────────────────────────────────────────────────

    createCollection(siteSlug: string, schema: Omit<CMSCollection, 'id' | 'siteSlug' | 'createdAt'>): CMSCollection {
        const col: CMSCollection = { ...schema, id: `col-${uid()}`, siteSlug, createdAt: Date.now() };
        const cols = this.getCollections(siteSlug);
        cols.push(col);
        try { localStorage.setItem(COL_KEY(siteSlug), JSON.stringify(cols)); } catch { /* noop */ }
        return col;
    },

    getCollections(siteSlug: string): CMSCollection[] {
        try { return JSON.parse(localStorage.getItem(COL_KEY(siteSlug)) ?? '[]'); } catch { return []; }
    },

    deleteCollection(siteSlug: string, collectionId: string): void {
        const cols = this.getCollections(siteSlug).filter(c => c.id !== collectionId);
        try {
            localStorage.setItem(COL_KEY(siteSlug), JSON.stringify(cols));
            localStorage.removeItem(ENTRY_KEY(collectionId));
        } catch { /* noop */ }
    },

    // ── Entries ────────────────────────────────────────────────────────────────

    createEntry(collectionId: string, data: Record<string, any>, status: CMSEntry['status'] = 'draft'): CMSEntry {
        const entry: CMSEntry = {
            id: `entry-${uid()}`,
            collectionId,
            data,
            status,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            publishedAt: status === 'published' ? Date.now() : undefined,
            slug: data.title ? slugify(data.title) : data.name ? slugify(data.name) : undefined,
        };
        const entries = this.getAllEntries(collectionId);
        entries.push(entry);
        try { localStorage.setItem(ENTRY_KEY(collectionId), JSON.stringify(entries)); } catch { /* noop */ }
        return entry;
    },

    getAllEntries(collectionId: string): CMSEntry[] {
        try { return JSON.parse(localStorage.getItem(ENTRY_KEY(collectionId)) ?? '[]'); } catch { return []; }
    },

    getEntries(collectionId: string, query: CMSQuery = {}): CMSEntry[] {
        let entries = this.getAllEntries(collectionId);

        if (query.status) entries = entries.filter(e => e.status === query.status);
        if (query.search) {
            const q = query.search.toLowerCase();
            entries = entries.filter(e => JSON.stringify(e.data).toLowerCase().includes(q));
        }

        const orderBy = query.orderBy ?? 'createdAt';
        const dir = query.orderDir ?? 'desc';
        entries.sort((a, b) => {
            const va = (a as any)[orderBy] ?? (a.data as any)[orderBy] ?? 0;
            const vb = (b as any)[orderBy] ?? (b.data as any)[orderBy] ?? 0;
            return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });

        if (query.offset) entries = entries.slice(query.offset);
        if (query.limit) entries = entries.slice(0, query.limit);
        return entries;
    },

    updateEntry(collectionId: string, entryId: string, data: Partial<CMSEntry['data']>, status?: CMSEntry['status']): void {
        const entries = this.getAllEntries(collectionId);
        const idx = entries.findIndex(e => e.id === entryId);
        if (idx < 0) return;
        const entry = entries[idx];
        entries[idx] = {
            ...entry,
            data: { ...entry.data, ...data },
            status: status ?? entry.status,
            updatedAt: Date.now(),
            publishedAt: status === 'published' ? (entry.publishedAt ?? Date.now()) : entry.publishedAt,
            slug: data.title ? slugify(data.title as string) : data.name ? slugify(data.name as string) : entry.slug,
        };
        try { localStorage.setItem(ENTRY_KEY(collectionId), JSON.stringify(entries)); } catch { /* noop */ }
    },

    deleteEntry(collectionId: string, entryId: string): void {
        const entries = this.getAllEntries(collectionId).filter(e => e.id !== entryId);
        try { localStorage.setItem(ENTRY_KEY(collectionId), JSON.stringify(entries)); } catch { /* noop */ }
    },

    // ── Export ─────────────────────────────────────────────────────────────────

    exportJson(siteSlug: string): string {
        const collections = this.getCollections(siteSlug);
        const result: Record<string, any[]> = {};
        collections.forEach(col => {
            result[col.slug] = this.getEntries(col.id, { status: 'published' }).map(e => ({
                id: e.id,
                slug: e.slug,
                publishedAt: e.publishedAt,
                ...e.data,
            }));
        });
        return JSON.stringify({ generated: new Date().toISOString(), collections: result }, null, 2);
    },

    generateApiHandler(siteSlug: string): string {
        const collections = this.getCollections(siteSlug);
        const data = this.exportJson(siteSlug);
        return `/**
 * FramePro CMS API Handler
 * Deploy as: Vercel Edge Function / Cloudflare Worker / Express route
 *
 * Routes:
 *   GET /api/cms                        → all collections index
 *   GET /api/cms/:collection            → list entries (supports ?limit=&offset=)
 *   GET /api/cms/:collection/:id        → single entry by id or slug
 */

const CMS_DATA = ${data};

export function handleCmsRequest(pathname, searchParams = new URLSearchParams()) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  const parts = pathname.replace(/^\\/api\\/cms\\/?/, '').split('/').filter(Boolean);

  // GET /api/cms — index
  if (parts.length === 0) {
    const index = Object.entries(CMS_DATA.collections).map(([slug, entries]) => ({
      slug, count: entries.length,
    }));
    return new Response(JSON.stringify({ collections: index }), { headers });
  }

  const collectionSlug = parts[0];
  const entries = CMS_DATA.collections[collectionSlug];
  if (!entries) return new Response(JSON.stringify({ error: 'Collection not found' }), { status: 404, headers });

  // GET /api/cms/:collection/:id
  if (parts[1]) {
    const entry = entries.find(e => e.id === parts[1] || e.slug === parts[1]);
    if (!entry) return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers });
    return new Response(JSON.stringify(entry), { headers });
  }

  // GET /api/cms/:collection
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const paginated = entries.slice(offset, offset + limit);
  return new Response(JSON.stringify({
    data: paginated,
    total: entries.length,
    limit, offset,
  }), { headers });
}
`;
    },
};
