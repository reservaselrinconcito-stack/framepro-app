/**
 * src/modules/webBuilder/components/blocks/index.ts
 *
 * BlockRegistry — mapa de tipo → componente React.
 */

import {
    Hero, Navigation, Features, Gallery, CTA, Pricing,
    Testimonials, ContactForm, ContactFooter, Location,
    FAQ, TrustBadges, ApartmentsGrid, AvailabilityCalendar
} from './PlaceholderBlocks';

// Real blocks
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
    // Core blocks (placeholders for now)
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
    ApartmentsGrid,
    AvailabilityCalendar,

    // Real FramePro blocks
    Stats,
    Team,
    LogoCloud,
    NewsletterSignup,
};

export type BlockType = keyof typeof BlockRegistry;
