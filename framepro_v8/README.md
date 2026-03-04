# FramePro — Editor Web Visual v1.1 — Preview en Tiempo Real

## 🆕 Nuevo en v1.1: Preview en tiempo real

### ¿Cómo funciona?

1. Abre cualquier sitio en el editor
2. Haz clic en el botón **Preview** (barra superior derecha)
3. Se abre una nueva pestaña con tu sitio renderizado
4. **Cada cambio que hagas en el editor se refleja al instante** en esa pestaña — sin recargar

### Detalles técnicos

- La pestaña de preview usa `postMessage` para recibir actualizaciones del editor
- El HTML se regenera con `exportHtml()` y se inyecta en un `<iframe>` sandboxed
- La posición de scroll se preserva entre actualizaciones
- Una barra verde "Live ●" indica que el preview está activo y sincronizado
- Si cierras la pestaña de preview y vuelves a hacer clic en Preview, se abre una nueva

### Archivos nuevos/modificados

```
src/pages/builder/framepro/preview.ts     ← NUEVO: lógica de preview en tiempo real
src/pages/WebsiteBuilder.tsx              ← ACTUALIZADO: botón Preview + integración
```

### Integración (si ya tienes v1)

```bash
# Copiar el nuevo módulo de preview
cp framepro_v1.1/src/pages/builder/framepro/preview.ts \
   src/pages/builder/framepro/

# Reemplazar WebsiteBuilder
cp framepro_v1.1/src/pages/WebsiteBuilder.tsx \
   src/pages/
```

No se añaden dependencias nuevas. Solo usa APIs nativas del browser (`Blob`, `URL.createObjectURL`, `postMessage`, `window.open`).

---

# FramePro — Editor Web Visual v1

## ¿Qué es FramePro?

FramePro es el Website Builder Ferrari evolucionado a producto independiente.

**Problema que resuelve:**
Un propietario de negocio sin conocimientos técnicos necesita una web funcional en minutos, no días. Las herramientas existentes (Webflow, Wix, Framer) son demasiado complejas o demasiado limitadas.

**Diferencia clave:**
- Tan simple que un niño de 5 años puede usar el editor (literalmente)
- Sin paneles intimidantes — el inspector solo muestra lo relevante
- Arquitectura modular: embebible en RentikPro u otras verticales
- Demo mode completo sin backend
- Export HTML estático en un clic

---

## Estructura del paquete

```
src/
├── pages/
│   ├── WebsiteBuilder.tsx          ← NUEVO: Editor FramePro completo
│   └── builder/
│       ├── framepro/
│       │   ├── templates.ts        ← NUEVO: 10 plantillas completas
│       │   ├── themes.ts           ← NUEVO: 10 paletas de tema
│       │   ├── demo.ts             ← NUEVO: Demo mode localStorage
│       │   └── export.ts           ← NUEVO: HTML export estático
│       ├── components/
│       │   ├── SidebarLeft.tsx     ← ACTUALIZADO: Grid visual + tab Plantillas
│       │   ├── ThemePicker.tsx     ← NUEVO: Selector visual de temas
│       │   ├── Canvas.tsx          ← de v3 (drag & drop imágenes)
│       │   └── SidebarRight.tsx    ← de v3 (inspector contextual)
│       └── blocks/
│           └── defaults.ts         ← ACTUALIZADO: +4 nuevos bloques
└── modules/webBuilder/
    └── components/blocks/
        ├── Stats.tsx               ← NUEVO: Fila de estadísticas
        ├── Team.tsx                ← NUEVO: Perfiles de equipo
        ├── LogoCloud.tsx           ← NUEVO: Logos de confianza
        ├── NewsletterSignup.tsx    ← NUEVO: Captación email
        └── index.ts                ← ACTUALIZADO: 17 bloques registrados
```

---

## Cómo integrar (en RentikPro existente)

### 1. Copiar archivos

```bash
# Bloques nuevos
cp framepro/src/modules/webBuilder/components/blocks/Stats.tsx \
   src/modules/webBuilder/components/blocks/
cp framepro/src/modules/webBuilder/components/blocks/Team.tsx \
   src/modules/webBuilder/components/blocks/
cp framepro/src/modules/webBuilder/components/blocks/LogoCloud.tsx \
   src/modules/webBuilder/components/blocks/
cp framepro/src/modules/webBuilder/components/blocks/NewsletterSignup.tsx \
   src/modules/webBuilder/components/blocks/

# Actualizar registros
cp framepro/src/modules/webBuilder/components/blocks/index.ts \
   src/modules/webBuilder/components/blocks/
cp framepro/src/pages/builder/blocks/defaults.ts \
   src/pages/builder/blocks/

# Módulo FramePro completo
cp -r framepro/src/pages/builder/framepro/ \
   src/pages/builder/

# Componentes UI actualizados
cp framepro/src/pages/builder/components/SidebarLeft.tsx \
   src/pages/builder/components/
cp framepro/src/pages/builder/components/ThemePicker.tsx \
   src/pages/builder/components/

# Editor principal
cp framepro/src/pages/WebsiteBuilder.tsx \
   src/pages/
```

### 2. Añadir ruta (ya existente de v3)

```tsx
// En tu router:
<Route path="/website-builder" element={<WebsiteBuilder />} />
```

### 3. Sin cambios en package.json

No se añaden dependencias nuevas. Todo usa React, lucide-react, sonner y tailwind (ya instalados).

---

## Modo Demo (sin backend)

FramePro funciona **completamente sin backend**. Actívalo con:

```typescript
import { demoMode } from './src/pages/builder/framepro/demo';
demoMode.enable();
```

O se activa automáticamente si los servicios de RentikPro no están disponibles.

**Qué persiste:**
- Proyectos en `localStorage` con TTL de 7 días
- Datos del editor (bloques, tema, contenido)
- Historial de proyectos

**Qué no persiste:**
- Imágenes en base64 > 5MB (límite localStorage)
- Publicación online (requiere backend)

---

## 10 Plantillas completas

| # | ID | Nombre | Vertical | Bloques |
|---|---|---|---|---|
| 1 | `saas-landing` | 🚀 SaaS Landing | Tech/SaaS | 9 |
| 2 | `corporate` | 🏢 Corporativa | B2B | 9 |
| 3 | `real-estate` | 🏠 Inmobiliaria | PropTech | 8 |
| 4 | `restaurant` | 🍽️ Restaurante | Food | 8 |
| 5 | `barbershop` | ✂️ Barbería | Beauty | 7 |
| 6 | `portfolio` | 🎨 Portfolio | Creativo | 8 |
| 7 | `event` | 🎪 Evento | Events | 8 |
| 8 | `agency` | 🎯 Agencia | Marketing | 9 |
| 9 | `ecommerce` | 🛍️ Ecommerce | Commerce | 8 |
| 10 | `app-marketing` | 📱 App Marketing | Mobile | 8 |

Cada plantilla tiene:
- Datos de ejemplo realistas (no lorem ipsum)
- Imágenes de Unsplash reales
- Bloques preconfigados específicos a su vertical
- Tema de colores + tipografías coherentes

---

## 17 Bloques disponibles

| Bloque | Descripción | Nuevo |
|---|---|---|
| `Navigation` | Navbar sticky con links y CTA | — |
| `Hero` | Portada con imagen, variantes A/B/C | — |
| `Stats` | Fila de estadísticas con números grandes | ✅ |
| `LogoCloud` | Grid de logos de clientes/partners | ✅ |
| `Features` | Grid de características con iconos | — |
| `Team` | Perfiles del equipo con foto y bio | ✅ |
| `ApartmentsGrid` | Tarjetas de propiedades/productos | — |
| `AvailabilityCalendar` | Calendario de disponibilidad | — |
| `FAQ` | Acordeón de preguntas frecuentes | — |
| `Location` | Dirección, teléfono y horarios | — |
| `Gallery` | Grid de imágenes (hover zoom) | — |
| `Testimonials` | Reseñas con rating de estrellas | — |
| `Pricing` | Planes de precios con CTA | — |
| `CTA` | Sección de conversión final | — |
| `ContactForm` | Formulario de contacto/leads | — |
| `NewsletterSignup` | Captación de email | ✅ |
| `TrustBadges` | Sellos de confianza | — |
| `ContactFooter` | Footer completo | — |

---

## 10 Temas de diseño

| Tema | Primario | Mood |
|---|---|---|
| 💎 Indigo Pro | `#4f46e5` | Profesional / Tech |
| 🌑 Midnight | `#a78bfa` | Dark mode / Lujo |
| 🔥 Ember | `#ea580c` | Energía / Conversión |
| 🌿 Forest | `#059669` | Natural / Sostenible |
| 🌹 Rose | `#e11d48` | Audaz / Femenino |
| ✨ Aurum | `#b4975a` | Exclusivo / Dorado |
| ☁️ Sky | `#0891b2` | Limpio / Fresco |
| 🪨 Slate | `#0f172a` | Corporativo / Serio |
| 🔮 Violet | `#7c3aed` | Creativo / Innovador |
| 🍂 Harvest | `#d97706` | Cálido / Natural |

---

## HTML Export

```typescript
import { downloadHtml, downloadProjectJson } from './src/pages/builder/framepro/export';

// Descargar HTML estático completo (un archivo)
downloadHtml(config);                // → mi-sitio.html

// Descargar proyecto FramePro (JSON)
downloadProjectJson(config);         // → mi-sitio-framepro.json

// Obtener HTML como string (para preview, publicar, etc.)
import { exportHtml } from './src/pages/builder/framepro/export';
const html = exportHtml(config);     // → string HTML completo
```

El HTML exportado es:
- Completamente autónomo (sin dependencias externas)
- CSS inline con variables CSS del tema activo
- JavaScript minimal (FAQ accordion, form submission)
- Responsive con media queries
- Listo para subir a cualquier hosting

---

## Roadmap

### Fase 1: MVP (estado actual v1)
- ✅ 10 plantillas completas
- ✅ 17 bloques modulares
- ✅ 10 paletas de tema
- ✅ Demo mode (localStorage)
- ✅ HTML export estático
- ✅ Autosave + Undo/Redo
- ✅ Drag & drop de imágenes
- ✅ Inspector contextual

### Fase 2: Producto vendible
- [ ] Preview en tiempo real en nueva pestaña
- [ ] Dominio personalizado en publicación
- [ ] Más variantes por bloque (actualmente A/B/C en Hero)
- [ ] Edición directa inline en canvas (contentEditable real)
- [ ] Importar JSON de proyecto
- [ ] Duplicar sitio
- [ ] Historial de versiones (últimas 10)
- [ ] Soporte multi-página (About, Contact, etc.)

### Fase 3: Escalable + Marketplace
- [ ] Marketplace de plantillas (subir/comprar)
- [ ] Bloques de terceros (iframes seguros)
- [ ] Integración Stripe para ecommerce real
- [ ] IA: generar contenido automático para bloques
- [ ] Colaboración en tiempo real (Yjs/WebSocket)
- [ ] White-label para otras verticales
- [ ] SDK de integración para terceros

---

## Arquitectura

```
FramePro
├── motor (engine)
│   ├── store.ts (useReducer + useHistory)
│   ├── types.ts (SiteConfigV1, BlockInstance, DesignTokens)
│   └── adapters.ts (migrateToV1, hydrateConfig)
│
├── UI
│   ├── WebsiteBuilder.tsx (orquestador principal)
│   ├── Canvas.tsx (canvas interactivo con drag & drop)
│   ├── SidebarLeft.tsx (biblioteca de bloques + plantillas)
│   ├── SidebarRight.tsx (inspector contextual)
│   └── ThemePicker.tsx (selector visual de temas)
│
├── bloques (modules/webBuilder/components/blocks/)
│   ├── index.ts (BlockRegistry: tipo → componente)
│   └── [17 bloques .tsx]
│
├── framepro/ (módulo nuevo)
│   ├── templates.ts (10 plantillas completas con datos)
│   ├── themes.ts (10 paletas color + tipografía)
│   ├── demo.ts (localStorage persistence)
│   └── export.ts (HTML export sin dependencias)
│
└── integración RentikPro
    ├── publishAdapter.ts (snapshot + KV Worker)
    └── projectManager (fuente de datos real)
```

**Principio de separación:**
- El motor no sabe nada de la UI
- Los bloques no saben nada del editor
- El módulo `framepro/` es independiente de RentikPro
- RentikPro es un adaptador opcional, no una dependencia

---

## Testing rápido

```bash
# 1. Aplicar patch
# (copiar archivos según "Cómo integrar")

# 2. Verificar TypeScript
npx tsc --noEmit

# 3. Dev server
npm run dev

# 4. Abrir editor
# → http://localhost:5173/website-builder
# → Click "Nuevo sitio" → elegir plantilla → Crear
# → Editar bloques → Guardar (autosave)
# → Exportar HTML → verificar en browser
```

---

© 2025 FramePro by Potencore. Construido sobre el editor Ferrari de RentikPro.
