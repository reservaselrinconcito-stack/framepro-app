import React from 'react';

interface BlockProps {
    data: any;
    styles?: any;
    variant?: string;
}

const PlaceholderBlock: React.FC<BlockProps & { name: string }> = ({ name, data, variant }) => {
    return (
        <section className="p-12 bg-white border border-slate-50 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest">{name}</span>
                {variant && <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-black uppercase tracking-widest">Variant {variant}</span>}
            </div>
            {data.title && <h2 className="text-3xl font-black text-slate-800">{data.title}</h2>}
            {data.subtitle && <p className="text-slate-500 max-w-md text-center">{data.subtitle}</p>}
            {data.ctaLabel && (
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 transition-transform">
                    {data.ctaLabel}
                </button>
            )}
            {data.imageUrl && (
                <div className="mt-4 w-full aspect-video rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner">
                    <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
                </div>
            )}
        </section>
    );
};

export const Hero = (props: BlockProps) => <PlaceholderBlock name="Hero" {...props} />;
export const Features = (props: BlockProps) => <PlaceholderBlock name="Features" {...props} />;
export const Navigation = (props: BlockProps) => <PlaceholderBlock name="Navigation" {...props} />;
export const CTA = (props: BlockProps) => <PlaceholderBlock name="CTA" {...props} />;
export const Pricing = (props: BlockProps) => <PlaceholderBlock name="Pricing" {...props} />;
export const FAQ = (props: BlockProps) => <PlaceholderBlock name="FAQ" {...props} />;
export const Testimonials = (props: BlockProps) => <PlaceholderBlock name="Testimonials" {...props} />;
export const ContactForm = (props: BlockProps) => <PlaceholderBlock name="ContactForm" {...props} />;
export const ContactFooter = (props: BlockProps) => <PlaceholderBlock name="ContactFooter" {...props} />;
export const Gallery = (props: BlockProps) => <PlaceholderBlock name="Gallery" {...props} />;
export const Location = (props: BlockProps) => <PlaceholderBlock name="Location" {...props} />;
export const TrustBadges = (props: BlockProps) => <PlaceholderBlock name="TrustBadges" {...props} />;
export const ApartmentsGrid = (props: BlockProps) => <PlaceholderBlock name="ApartmentsGrid" {...props} />;
export const AvailabilityCalendar = (props: BlockProps) => <PlaceholderBlock name="AvailabilityCalendar" {...props} />;
