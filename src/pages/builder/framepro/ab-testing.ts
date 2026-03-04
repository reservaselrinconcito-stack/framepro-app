/**
 * ab-testing.ts — FramePro A/B Testing
 *
 * Permite probar variantes de bloques individuales (Hero A vs Hero B,
 * CTA rojo vs CTA verde, etc.) y medir cuál convierte mejor.
 *
 * Cómo funciona:
 *   1. El editor marca un bloque como "en test" y define variante B
 *   2. El script exportado asigna cada visitante a variante A o B (50/50)
 *   3. Los clics en CTAs se registran por variante
 *   4. El dashboard muestra la variante ganadora con significancia estadística
 *
 * API:
 *   abTesting.createTest(siteSlug, blockId, blockA, blockB) → ABTest
 *   abTesting.getTests(siteSlug) → ABTest[]
 *   abTesting.getResults(testId) → ABTestResult
 *   abTesting.archiveTest(testId)
 *   abTesting.injectScript(siteSlug) → string (HTML para export)
 */

import { BlockInstance } from '@/modules/webBuilder/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ABTest {
    id: string;
    siteSlug: string;
    blockId: string;
    name: string;
    status: 'running' | 'paused' | 'archived' | 'winner_declared';
    variantA: BlockInstance;
    variantB: BlockInstance;
    trafficSplit: number;   // 0-100: % sent to A (rest to B)
    createdAt: number;
    winner?: 'A' | 'B';
}

export interface ABVariantStats {
    variant: 'A' | 'B';
    visitors: number;
    conversions: number;
    conversionRate: number;     // 0-100
    confidenceInterval: [number, number]; // 95% CI
}

export interface ABTestResult {
    testId: string;
    variantA: ABVariantStats;
    variantB: ABVariantStats;
    winner: 'A' | 'B' | 'inconclusive';
    confidence: number;         // 0-100%
    significantAt95: boolean;
    totalVisitors: number;
    runningDays: number;
}

// ─── Storage ───────────────────────────────────────────────────────────────────

const TESTS_KEY = (slug: string) => `fp_abtests_${slug}`;
const EVENTS_KEY = (testId: string) => `fp_abevents_${testId}`;

function readTests(siteSlug: string): ABTest[] {
    try { return JSON.parse(localStorage.getItem(TESTS_KEY(siteSlug)) ?? '[]'); }
    catch { return []; }
}

function writeTests(siteSlug: string, tests: ABTest[]): void {
    try { localStorage.setItem(TESTS_KEY(siteSlug), JSON.stringify(tests)); } catch { /* noop */ }
}

function readEvents(testId: string): Array<{ variant: 'A' | 'B'; type: 'view' | 'conversion'; ts: number }> {
    try { return JSON.parse(localStorage.getItem(EVENTS_KEY(testId)) ?? '[]'); }
    catch { return []; }
}

function writeEvent(testId: string, variant: 'A' | 'B', type: 'view' | 'conversion'): void {
    try {
        const events = readEvents(testId);
        events.push({ variant, type, ts: Date.now() });
        localStorage.setItem(EVENTS_KEY(testId), JSON.stringify(events.slice(-50_000)));
    } catch { /* noop */ }
}

// ─── Statistics helpers ────────────────────────────────────────────────────────

/** Two-proportion z-test for A/B significance */
function zTest(convA: number, visA: number, convB: number, visB: number): number {
    if (visA === 0 || visB === 0) return 0;
    const pA = convA / visA;
    const pB = convB / visB;
    const pPool = (convA + convB) / (visA + visB);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / visA + 1 / visB));
    if (se === 0) return 0;
    const z = Math.abs(pA - pB) / se;
    // Approximate normal CDF for confidence
    const confidence = 1 - 2 * (1 / (1 + Math.exp(1.7 * z)));
    return Math.min(99.9, Math.round(confidence * 1000) / 10);
}

function confidenceInterval(conversions: number, visitors: number): [number, number] {
    if (visitors === 0) return [0, 0];
    const p = conversions / visitors;
    const z = 1.96; // 95% CI
    const margin = z * Math.sqrt((p * (1 - p)) / visitors);
    return [
        Math.round(Math.max(0, (p - margin) * 1000) / 10),
        Math.round(Math.min(100, (p + margin) * 1000) / 10),
    ];
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const abTesting = {
    createTest(
        siteSlug: string,
        blockId: string,
        variantA: BlockInstance,
        variantB: BlockInstance,
        name?: string
    ): ABTest {
        const test: ABTest = {
            id: `ab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            siteSlug,
            blockId,
            name: name ?? `Test · ${variantA.type} · ${new Date().toLocaleDateString('es')}`,
            status: 'running',
            variantA,
            variantB,
            trafficSplit: 50,
            createdAt: Date.now(),
        };
        const tests = readTests(siteSlug);
        tests.push(test);
        writeTests(siteSlug, tests);
        return test;
    },

    getTests(siteSlug: string): ABTest[] {
        return readTests(siteSlug).filter(t => t.status !== 'archived');
    },

    updateTest(siteSlug: string, testId: string, updates: Partial<ABTest>): void {
        const tests = readTests(siteSlug);
        const idx = tests.findIndex(t => t.id === testId);
        if (idx >= 0) { tests[idx] = { ...tests[idx], ...updates }; writeTests(siteSlug, tests); }
    },

    archiveTest(siteSlug: string, testId: string): void {
        this.updateTest(siteSlug, testId, { status: 'archived' });
    },

    declareWinner(siteSlug: string, testId: string, winner: 'A' | 'B'): void {
        this.updateTest(siteSlug, testId, { status: 'winner_declared', winner });
    },

    getResults(testId: string, createdAt: number): ABTestResult {
        const events = readEvents(testId);
        const views = { A: 0, B: 0 };
        const convs = { A: 0, B: 0 };

        events.forEach(e => {
            if (e.type === 'view') views[e.variant]++;
            else convs[e.variant]++;
        });

        const crA = views.A > 0 ? (convs.A / views.A) * 100 : 0;
        const crB = views.B > 0 ? (convs.B / views.B) * 100 : 0;
        const confidence = zTest(convs.A, views.A, convs.B, views.B);
        const significantAt95 = confidence >= 95;

        let winner: 'A' | 'B' | 'inconclusive' = 'inconclusive';
        if (significantAt95) winner = crA >= crB ? 'A' : 'B';

        return {
            testId,
            variantA: { variant: 'A', visitors: views.A, conversions: convs.A, conversionRate: Math.round(crA * 10) / 10, confidenceInterval: confidenceInterval(convs.A, views.A) },
            variantB: { variant: 'B', visitors: views.B, conversions: convs.B, conversionRate: Math.round(crB * 10) / 10, confidenceInterval: confidenceInterval(convs.B, views.B) },
            winner,
            confidence,
            significantAt95,
            totalVisitors: views.A + views.B,
            runningDays: Math.max(1, Math.round((Date.now() - createdAt) / 86400000)),
        };
    },

    /** Script to inject in exported HTML — handles assignment + tracking */
    injectScript(tests: ABTest[]): string {
        const running = tests.filter(t => t.status === 'running');
        if (running.length === 0) return '';

        const testDefs = running.map(t => ({
            id: t.id,
            blockId: t.blockId,
            split: t.trafficSplit,
        }));

        return `<script>
(function() {
  var TESTS = ${JSON.stringify(testDefs)};
  var ASSIGN_KEY = 'fp_ab_assign';
  var assignments = {};
  try { assignments = JSON.parse(sessionStorage.getItem(ASSIGN_KEY) || '{}'); } catch(e){}

  TESTS.forEach(function(test) {
    if (!assignments[test.id]) {
      assignments[test.id] = Math.random() * 100 < test.split ? 'A' : 'B';
    }
    var variant = assignments[test.id];

    // Show/hide blocks
    var blocks = document.querySelectorAll('[data-ab-test="' + test.id + '"]');
    blocks.forEach(function(el) {
      if (el.dataset.abVariant !== variant) el.style.display = 'none';
    });

    // Track view
    trackAB(test.id, variant, 'view');

    // Track conversions (CTA clicks)
    document.addEventListener('click', function(e) {
      var cta = e.target.closest('[data-fp-cta],[data-fp-track]');
      if (cta) trackAB(test.id, variant, 'conversion');
    });
  });

  try { sessionStorage.setItem(ASSIGN_KEY, JSON.stringify(assignments)); } catch(e){}

  function trackAB(testId, variant, type) {
    try {
      var key = 'fp_abevents_' + testId;
      var events = JSON.parse(localStorage.getItem(key) || '[]');
      events.push({ variant: variant, type: type, ts: Date.now() });
      if (events.length > 50000) events = events.slice(-50000);
      localStorage.setItem(key, JSON.stringify(events));
    } catch(e) {}
  }
})();
</script>`;
    },
};
