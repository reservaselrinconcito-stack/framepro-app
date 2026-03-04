import React from 'react';

interface StatItem { value: string; label: string; }

export const Stats: React.FC<{ data: any; styles?: any; theme?: any }> = ({ data, theme }) => {
    const items: StatItem[] = data.items ?? [
        { value: '2,400+', label: 'Clientes activos' },
        { value: '98%', label: 'Satisfacción' },
        { value: '40h', label: 'Ahorradas/mes' },
        { value: '< 2min', label: 'Setup inicial' },
    ];

    const primary = theme?.colors?.primary ?? '#4f46e5';

    return (
        <section style={{ backgroundColor: primary, padding: '4rem 2rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '2rem' }}>
                {items.map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', color: '#fff' }}>
                        <div style={{
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: 900,
                            lineHeight: 1,
                            marginBottom: '0.5rem',
                            letterSpacing: '-0.02em',
                        }}>
                            {item.value}
                        </div>
                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            opacity: 0.8,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
