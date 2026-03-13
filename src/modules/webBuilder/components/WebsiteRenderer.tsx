import React from 'react';
import { SiteConfigV1 } from '../types';
import { BlockRegistry } from './blocks';

interface WebsiteRendererProps {
    config: SiteConfigV1;
    device?: 'mobile' | 'tablet' | 'desktop';
}

export const WebsiteRenderer: React.FC<WebsiteRendererProps> = ({ config, device = 'desktop' }) => {
    const design = config.design || (config.theme as any);
    const { pages } = config;

    if (!design) return <div>No design configuration found</div>;

    // For now, we always render the first page or home page
    const currentPageSlug = Object.keys(pages)[0] || '/';
    const currentPage = pages[currentPageSlug];

    if (!currentPage) return <div>No page found</div>;

    const style: React.CSSProperties = {
        fontFamily: design.typography?.bodyFont,
        color: design.colors?.text,
        backgroundColor: design.colors?.background,
    };

    return (
        <div style={style} className="webpro-renderer min-h-full">
            {currentPage.blocks.map((block) => {
                const Component = BlockRegistry[block.type];
                if (!Component) {
                    return (
                        <div key={block.id} className="p-12 border-2 border-dashed border-slate-200 text-slate-400 text-center m-4 rounded-3xl">
                            Unregistered block: <span className="font-black text-indigo-500">{block.type}</span>
                        </div>
                    );
                }
                return (
                    <div key={block.id} style={block.styles?.[device] || block.styles?.desktop}>
                        <Component
                            data={block.data}
                            styles={block.styles}
                            variant={block.variant}
                        />
                    </div>
                );
            })}
        </div>
    );
};
