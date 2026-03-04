/**
 * stripe.ts — FramePro Stripe Integration
 *
 * Flujo de pago para templates de pago en el Marketplace.
 * Usa Stripe Checkout (hosted) — el más simple y seguro.
 *
 * Flujo completo:
 *   1. Usuario hace clic en "Obtener template · 29€"
 *   2. Cliente llama createCheckoutSession() → redirige a Stripe Checkout
 *   3. Stripe redirige a /success?session_id=xxx tras pago exitoso
 *   4. Cliente verifica la sesión con verifyPurchase()
 *   5. Template se desbloquea y se guarda en purchasedTemplates
 *
 * Backend requerido (Edge Function / Cloudflare Worker / Express):
 *   POST /api/stripe/create-session  → { url: string }
 *   GET  /api/stripe/verify?session_id=xxx → { success: bool, templateId: string }
 *
 * Variables de entorno:
 *   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
 *   VITE_API_URL=https://api.tudominio.com   (para el backend)
 *
 * Variables de entorno del servidor:
 *   STRIPE_SECRET_KEY=sk_live_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 */

import { FrameProTemplate } from './templates';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StripeConfig {
    publishableKey: string;
    apiUrl: string;
}

export interface PurchaseRecord {
    templateId: string;
    sessionId: string;
    purchasedAt: number;
    receiptUrl?: string;
}

export interface CheckoutResult {
    success: boolean;
    error?: string;
    checkoutUrl?: string;
}

export interface VerifyResult {
    success: boolean;
    templateId?: string;
    receiptUrl?: string;
    error?: string;
}

// ─── Local purchase store ──────────────────────────────────────────────────────

const PURCHASE_KEY = 'framepro_purchases_v1';

function readPurchases(): PurchaseRecord[] {
    try {
        return JSON.parse(localStorage.getItem(PURCHASE_KEY) ?? '[]');
    } catch { return []; }
}

function writePurchases(records: PurchaseRecord[]): void {
    try {
        localStorage.setItem(PURCHASE_KEY, JSON.stringify(records));
    } catch { /* noop */ }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const stripeClient = {
    /**
     * Check if a template has been purchased.
     */
    isPurchased(templateId: string): boolean {
        if (!templateId) return false;
        return readPurchases().some(p => p.templateId === templateId);
    },

    /**
     * Get all purchased template IDs.
     */
    getPurchasedIds(): string[] {
        return readPurchases().map(p => p.templateId);
    },

    /**
     * Initiate Stripe Checkout for a template.
     * Redirects the browser to the Stripe-hosted checkout page.
     */
    async startCheckout(
        template: FrameProTemplate,
        config: StripeConfig,
        options?: { successUrl?: string; cancelUrl?: string }
    ): Promise<CheckoutResult> {
        const successUrl = options?.successUrl ??
            `${window.location.origin}/payment-success?template=${template.id}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = options?.cancelUrl ??
            `${window.location.href}`;

        try {
            const res = await fetch(`${config.apiUrl}/api/stripe/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: template.id,
                    templateName: template.name,
                    price: Math.round((template.price ?? 0) * 100), // cents
                    currency: 'eur',
                    successUrl,
                    cancelUrl,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return { success: false, error: (err as any).error ?? `Error ${res.status}` };
            }

            const { url } = await res.json();
            if (!url) return { success: false, error: 'No checkout URL returned' };

            // Redirect to Stripe Checkout
            window.location.href = url;
            return { success: true, checkoutUrl: url };

        } catch (e: any) {
            return { success: false, error: e?.message ?? 'Network error' };
        }
    },

    /**
     * Verify a completed Stripe session and record the purchase.
     * Call this on the success page after redirect.
     */
    async verifyPurchase(
        sessionId: string,
        config: StripeConfig
    ): Promise<VerifyResult> {
        try {
            const res = await fetch(
                `${config.apiUrl}/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`
            );

            if (!res.ok) {
                return { success: false, error: `Verification failed: ${res.status}` };
            }

            const data = await res.json();

            if (data.success && data.templateId) {
                // Record purchase locally
                const purchases = readPurchases();
                if (!purchases.some(p => p.templateId === data.templateId)) {
                    purchases.push({
                        templateId: data.templateId,
                        sessionId,
                        purchasedAt: Date.now(),
                        receiptUrl: data.receiptUrl,
                    });
                    writePurchases(purchases);
                }
                return { success: true, templateId: data.templateId, receiptUrl: data.receiptUrl };
            }

            return { success: false, error: data.error ?? 'Payment not verified' };
        } catch (e: any) {
            return { success: false, error: e?.message ?? 'Network error' };
        }
    },

    /**
     * Mock a purchase for testing (dev mode only).
     */
    mockPurchase(templateId: string): void {
        const purchases = readPurchases();
        if (!purchases.some(p => p.templateId === templateId)) {
            purchases.push({ templateId, sessionId: `mock-${Date.now()}`, purchasedAt: Date.now() });
            writePurchases(purchases);
        }
        console.info(`[FramePro Stripe] 🧪 Mock purchase recorded for "${templateId}"`);
    },
};

// ─── Backend template (Express / Cloudflare Worker) ──────────────────────────

export const STRIPE_BACKEND_TEMPLATE = `
/**
 * FramePro Stripe Backend — Express.js
 * Deploy to: Railway, Render, Fly.io, Vercel Serverless, etc.
 *
 * npm install express stripe cors dotenv
 */

require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

// Parse raw body for webhooks BEFORE json middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Create Checkout Session ───────────────────────────────────────────────────

app.post('/api/stripe/create-session', async (req, res) => {
    try {
        const { templateId, templateName, price, currency, successUrl, cancelUrl } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency || 'eur',
                    product_data: {
                        name: \`FramePro Template: \${templateName}\`,
                        description: \`Plantilla profesional para tu sitio web\`,
                        metadata: { templateId },
                    },
                    unit_amount: price, // already in cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { templateId },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ── Verify Purchase ───────────────────────────────────────────────────────────

app.get('/api/stripe/verify', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        
        if (session.payment_status === 'paid') {
            res.json({
                success: true,
                templateId: session.metadata.templateId,
                receiptUrl: session.receipt_email, // or use charge receipt URL
            });
        } else {
            res.json({ success: false, error: 'Payment not completed' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Webhook (optional but recommended for reliability) ────────────────────────

app.post('/api/stripe/webhook', (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(\`Webhook Error: \${err.message}\`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('✅ Payment received for template:', session.metadata.templateId);
        // Here you can: send email, update DB, grant access in your backend, etc.
    }

    res.json({ received: true });
});

app.listen(process.env.PORT || 3001, () =>
    console.log('FramePro Stripe server running on port', process.env.PORT || 3001)
);
`;
