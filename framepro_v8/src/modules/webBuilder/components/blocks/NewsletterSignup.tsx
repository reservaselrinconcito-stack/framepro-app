import React, { useState } from 'react';

export const NewsletterSignup: React.FC<{ data: any; styles?: any; theme?: any }> = ({ data, theme }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'success'>('idle');
    const primary = theme?.colors?.primary ?? '#4f46e5';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('success');
    };

    return (
        <section style={{
            backgroundColor: primary,
            padding: '5rem 2rem',
            textAlign: 'center',
        }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {data.title && (
                    <h2 style={{
                        fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                        fontWeight: 900,
                        color: '#fff',
                        marginBottom: '1rem',
                    }}>
                        {data.title}
                    </h2>
                )}
                {data.subtitle && (
                    <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        {data.subtitle}
                    </p>
                )}

                {status === 'success' ? (
                    <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>✅</span>
                        ¡Suscrito! Gracias por unirte.
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={data.placeholder ?? 'tu@email.com'}
                            required
                            style={{
                                flex: '1',
                                minWidth: '220px',
                                padding: '1rem 1.5rem',
                                borderRadius: '100px',
                                border: 'none',
                                fontSize: '1rem',
                                outline: 'none',
                                color: '#1e293b',
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                backgroundColor: '#fff',
                                color: primary,
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '100px',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {data.ctaLabel ?? 'Suscribirme'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
};
