import { SiteConfigV1 } from './types';
import { DEFAULT_SITE_CONFIG_V1 } from './defaults';

export function migrateToV1(json: any): SiteConfigV1 {
    if (!json) return DEFAULT_SITE_CONFIG_V1;
    // Simple migration logic
    return {
        ...DEFAULT_SITE_CONFIG_V1,
        ...json,
    };
}

export function hydrateConfig(config: SiteConfigV1): SiteConfigV1 {
    return config;
}
