import React from 'react';

export const LogoCloud: React.FC<{ data: any; styles?: any; theme?: any }> = ({ data, theme }) => {
    const logos: string[] = data.logos ?? ['Airbnb', 'Spotify', 'Notion', 'Figma', 'Linear', 'Vercel'];
    const surface = theme?.colors?.surface ?? '#ffffff';
    const textMuted = theme?.colors?.textMuted ?? '#94a3b8';
    const border = theme?.colors?.border ?? '#e2e8f0';

    return (
        <div style={{
            backgroundColor: surface,
            borderTop: `1px solid ${border}`,
            borderBottom: `1px solid ${border}`,
            padding: '3rem 2rem',
        }}>
            {data.title && (
                <p style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: textMuted,
                    marginBottom: '2rem',
                }}>
                    {data.title}
                </p>
            )}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '3rem',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: '900px',
                margin: '0 auto',
            }}>
                {logos.map((logo, i) => (
                    <span key={i} style={{
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: textMuted,
                        opacity: 0.55,
                        letterSpacing: '0.02em',
                    }}>
                        {logo}
                    </span>
                ))}
            </div>
        </div>
    );
};
