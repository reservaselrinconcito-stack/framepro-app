import { SiteConfigV1 } from './types';

export async function saveSiteConfig(_site: any, config: SiteConfigV1): Promise<boolean> {
    console.log('[API] Saving site config:', config);
    return true;
}
