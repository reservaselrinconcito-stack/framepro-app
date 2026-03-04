export interface BlockInstance {
    id: string;
    type: string;
    variant: string;
    data: any;
    styles: {
        desktop: any;
        tablet?: any;
        mobile?: any;
    };
    hidden?: boolean;
}

export interface PageMeta {
    id?: string;
    path?: string;
    slug?: string;
    label?: string;
    title?: string;
    description?: string;
    __label?: string;
    blocks: BlockInstance[];
    [key: string]: any;
}

export interface DesignTokens {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        border: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        baseSize: string;
    };
    spacing: {
        scale: string;
    };
    radius: {
        global: string;
    };
}

export interface GlobalData {
    brandName: string;
    tagline?: string;
    logoUrl?: string;
    faviconUrl?: string;
    theme?: any;
    contactEmail?: string;
    address?: string;
    phone?: string;
    [key: string]: any;
}

export interface SiteConfigV1 {
    version: string;
    slug: string;
    globalData: GlobalData;
    design?: DesignTokens;
    pages: Record<string, PageMeta>;
    theme?: any;
    themeId?: string;
    assets?: any[];
    [key: string]: any;
}
