/**
 * src/modules/webBuilder/components/blocks/index.ts
 *
 * BlockRegistry — mapa de tipo → componente React.
 * Para añadir un bloque:
 *  1. Crear el componente en este directorio
 *  2. Importarlo y registrarlo aquí
 */

import { Hero } from './Hero';
import { Navigation } from './Navigation';
import { Features } from './Features';
import { Gallery } from './Gallery';
import { CTA } from './CTA';
import { Pricing } from './Pricing';
import { Testimonials } from './Testimonials';
import { ContactForm } from './ContactForm';
import { ContactFooter } from './ContactFooter';
import { Location } from './Location';
import { FAQ } from './FAQ';
import { TrustBadges } from './TrustBadges';
import { ApartmentsGrid } from './ApartmentsGrid';
import { AvailabilityCalendar } from './AvailabilityCalendar';
// ── FramePro new blocks ────────────────────────────────────────────────────────
import { Stats } from './Stats';
import { Team } from './Team';
import { LogoCloud } from './LogoCloud';
import { NewsletterSignup } from './NewsletterSignup';

export type BlockComponent = React.ComponentType<{
    data: any;
    styles?: any;
    variant?: string;
    theme?: any;
}>;

export const BlockRegistry: Record<string, BlockComponent> = {
    // Core blocks
    Hero,
    Navigation,
    Features,
    Gallery,
    CTA,
    Pricing,
    Testimonials,
    ContactForm,
    ContactFooter,
    Location,
    FAQ,
    TrustBadges,

    // Rental-specific
    ApartmentsGrid,
    AvailabilityCalendar,

    // FramePro blocks (all verticals)
    Stats,
    Team,
    LogoCloud,
    NewsletterSignup,
};

export type BlockType = keyof typeof BlockRegistry;
