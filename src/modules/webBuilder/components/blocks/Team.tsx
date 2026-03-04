import React from 'react';

interface TeamMember {
    name: string;
    role: string;
    bio?: string;
    avatar?: string;
}

export const Team: React.FC<{ data: any; styles?: any; theme?: any }> = ({ data, theme }) => {
    const members: TeamMember[] = data.members ?? [
        { name: 'María García', role: 'CEO & Fundadora', bio: 'Líder visionaria con 15 años de experiencia.', avatar: 'https://i.pravatar.cc/200?img=47' },
        { name: 'Carlos Ruiz', role: 'CTO', bio: 'Ingeniero apasionado por los productos que cambian vidas.', avatar: 'https://i.pravatar.cc/200?img=53' },
        { name: 'Ana Torres', role: 'CMO', bio: 'Estratega de marca con foco en resultados.', avatar: 'https://i.pravatar.cc/200?img=44' },
    ];

    const primary = theme?.colors?.primary ?? '#4f46e5';
    const bg = theme?.colors?.background ?? '#f8fafc';
    const text = theme?.colors?.text ?? '#1e293b';
    const textMuted = theme?.colors?.textMuted ?? '#64748b';

    return (
        <section style={{ backgroundColor: bg, padding: '5rem 2rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {data.title && (
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: 'clamp(2rem, 3vw, 2.8rem)',
                        fontWeight: 900,
                        color: text,
                        marginBottom: '3rem',
                    }}>
                        {data.title}
                    </h2>
                )}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
                    gap: '2rem',
                }}>
                    {members.map((m, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <img
                                src={m.avatar ?? 'https://i.pravatar.cc/200'}
                                alt={m.name}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    margin: '0 auto 1rem',
                                    display: 'block',
                                    border: `3px solid ${primary}33`,
                                }}
                            />
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: text, marginBottom: '0.25rem' }}>
                                {m.name}
                            </h3>
                            <p style={{ color: primary, fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                {m.role}
                            </p>
                            {m.bio && (
                                <p style={{ color: textMuted, fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    {m.bio}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
