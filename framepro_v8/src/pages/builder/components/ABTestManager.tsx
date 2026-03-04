/**
 * ABTestManager.tsx — FramePro A/B Testing UI
 *
 * Panel para crear, monitorizar y resolver tests A/B de bloques.
 * Accesible desde el inspector cuando un bloque está seleccionado.
 */

import React, { useState, useEffect } from 'react';
import { X, FlaskConical, TrendingUp, Trophy, PauseCircle, PlayCircle, Trash2, Plus, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ABTest, ABTestResult, abTesting } from '../framepro/ab-testing';
import { BlockInstance } from '../../../modules/webBuilder/types';

// ─── Confidence badge ──────────────────────────────────────────────────────────

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
    const color = confidence >= 95 ? 'bg-emerald-100 text-emerald-700' :
                  confidence >= 80 ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-500';
    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${color}`}>
            {confidence.toFixed(1)}% confianza
        </span>
    );
};

// ─── Result bar ───────────────────────────────────────────────────────────────

const ResultBar: React.FC<{ stats: ABTestResult['variantA']; isWinner: boolean; label: string }> = ({ stats, isWinner, label }) => {
    const barColor = isWinner ? 'bg-emerald-500' : 'bg-slate-300';
    return (
        <div className={`p-3 rounded-xl border-2 ${isWinner ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white ${isWinner ? 'bg-emerald-500' : 'bg-slate-400'}`}>{label}</span>
                    {isWinner && <Trophy size={11} className="text-emerald-500" />}
                </div>
                <span className={`text-lg font-black ${isWinner ? 'text-emerald-700' : 'text-slate-600'}`}>{stats.conversionRate}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, stats.conversionRate * 3)}%` }} />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
                <span>{stats.visitors} visitantes</span>
                <span>{stats.conversions} conversiones</span>
            </div>
            <div className="text-[8px] text-slate-400 mt-1">
                IC 95%: [{stats.confidenceInterval[0]}% – {stats.confidenceInterval[1]}%]
            </div>
        </div>
    );
};

// ─── Single test card ─────────────────────────────────────────────────────────

const TestCard: React.FC<{
    test: ABTest;
    onPause: () => void;
    onResume: () => void;
    onArchive: () => void;
    onDeclareWinner: (w: 'A' | 'B') => void;
    onApplyWinner: (block: BlockInstance) => void;
}> = ({ test, onPause, onResume, onArchive, onDeclareWinner, onApplyWinner }) => {
    const [expanded, setExpanded] = useState(false);
    const result = abTesting.getResults(test.id, test.createdAt);

    const statusColor = test.status === 'running' ? 'text-emerald-600 bg-emerald-50' :
                        test.status === 'winner_declared' ? 'text-indigo-600 bg-indigo-50' :
                        'text-slate-500 bg-slate-50';

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {/* Header */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                <FlaskConical size={16} className="text-violet-500 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{test.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${statusColor}`}>
                            {test.status === 'running' ? '● Activo' :
                             test.status === 'paused' ? '‖ Pausado' :
                             test.status === 'winner_declared' ? `🏆 Ganador: ${test.winner}` : 'Archivado'}
                        </span>
                        <ConfidenceBadge confidence={result.confidence} />
                        <span className="text-[9px] text-slate-400">{result.totalVisitors} visitantes</span>
                    </div>
                </div>
                {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </div>

            {/* Expanded */}
            {expanded && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Results */}
                    <div className="grid grid-cols-2 gap-2">
                        <ResultBar stats={result.variantA} isWinner={result.winner === 'A'} label="A" />
                        <ResultBar stats={result.variantB} isWinner={result.winner === 'B'} label="B" />
                    </div>

                    {/* Verdict */}
                    {result.significantAt95 ? (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <p className="text-xs text-emerald-700 font-bold">
                                La variante <strong>{result.winner}</strong> gana con {result.confidence}% de confianza
                                ({result.runningDays} días de test)
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertCircle size={14} className="text-amber-500" />
                            <p className="text-xs text-amber-700 font-bold">
                                Todavía no hay significancia estadística ({result.confidence}%). Necesitas más datos.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    {test.status === 'running' && (
                        <div className="flex gap-2 flex-wrap">
                            {result.significantAt95 && result.winner !== 'inconclusive' && (
                                <button
                                    onClick={() => {
                                        onDeclareWinner(result.winner as 'A'|'B');
                                        onApplyWinner(result.winner === 'A' ? test.variantA : test.variantB);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-colors"
                                >
                                    <Trophy size={11} /> Aplicar variante {result.winner}
                                </button>
                            )}
                            <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black hover:bg-slate-50">
                                <PauseCircle size={11} /> Pausar
                            </button>
                            <button onClick={onArchive} className="flex items-center gap-1.5 px-3 py-2 border border-red-100 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-50">
                                <Trash2 size={11} /> Archivar
                            </button>
                        </div>
                    )}
                    {test.status === 'paused' && (
                        <div className="flex gap-2">
                            <button onClick={onResume} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700">
                                <PlayCircle size={11} /> Reanudar
                            </button>
                            <button onClick={onArchive} className="flex items-center gap-1.5 px-3 py-2 border border-red-100 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-50">
                                <Trash2 size={11} /> Archivar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Manager ─────────────────────────────────────────────────────────────

interface ABTestManagerProps {
    siteSlug: string;
    selectedBlock: BlockInstance | null;
    onClose: () => void;
    onApplyBlock: (block: BlockInstance) => void;
}

export const ABTestManager: React.FC<ABTestManagerProps> = ({ siteSlug, selectedBlock, onClose, onApplyBlock }) => {
    const [tests, setTests] = useState<ABTest[]>(() => abTesting.getTests(siteSlug));
    const [creating, setCreating] = useState(false);
    const [testName, setTestName] = useState('');

    const refresh = () => setTests(abTesting.getTests(siteSlug));

    function handleCreate() {
        if (!selectedBlock) return;

        // Variant B is the block with its current variant letter toggled (A→B or B→A)
        const nextVariant = selectedBlock.variant === 'A' ? 'B' : 'A';
        const variantB: BlockInstance = { ...selectedBlock, id: selectedBlock.id + '-b', variant: nextVariant };

        abTesting.createTest(siteSlug, selectedBlock.id, selectedBlock, variantB, testName || undefined);
        setCreating(false);
        setTestName('');
        refresh();
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-end p-4 pt-16 pointer-events-none">
            <div className="pointer-events-auto w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <FlaskConical size={18} className="text-violet-600" />
                        <div>
                            <h2 className="font-black text-slate-900 text-sm">A/B Testing</h2>
                            <p className="text-[9px] text-slate-400">{tests.length} tests activos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Create new test */}
                    {selectedBlock && !creating && (
                        <button
                            onClick={() => setCreating(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-violet-200 text-violet-600 rounded-2xl font-black text-xs hover:bg-violet-50 transition-colors"
                        >
                            <Plus size={14} /> Crear test para "{selectedBlock.type}"
                        </button>
                    )}

                    {!selectedBlock && (
                        <div className="p-4 bg-slate-50 rounded-xl text-center">
                            <FlaskConical size={24} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-bold">Selecciona un bloque en el canvas para crear un test A/B sobre él</p>
                        </div>
                    )}

                    {/* Create form */}
                    {creating && selectedBlock && (
                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl space-y-3">
                            <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Nuevo test · {selectedBlock.type}</p>
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">Nombre del test</label>
                                <input
                                    value={testName}
                                    onChange={e => setTestName(e.target.value)}
                                    placeholder={`Test · ${selectedBlock.type} · variante ${selectedBlock.variant ?? 'A'} vs ${selectedBlock.variant === 'A' ? 'B' : 'A'}`}
                                    className="w-full px-3 py-2 border border-violet-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 bg-white"
                                />
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-violet-100">
                                <p className="text-[9px] font-black text-slate-400 mb-1">Qué se testea</p>
                                <p className="text-xs text-slate-700">
                                    <strong>Variante A</strong>: bloque actual ({selectedBlock.variant ?? 'A'})<br/>
                                    <strong>Variante B</strong>: mismo bloque con variante alternativa ({selectedBlock.variant === 'A' ? 'B' : 'A'})
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCreate} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-xs font-black hover:bg-violet-700">
                                    Iniciar test
                                </button>
                                <button onClick={() => setCreating(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-50">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tests list */}
                    {tests.length === 0 && !creating && (
                        <div className="text-center py-8 text-slate-400">
                            <FlaskConical size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold">Sin tests todavía</p>
                            <p className="text-xs mt-1">Selecciona un bloque y crea tu primer A/B test</p>
                        </div>
                    )}

                    {tests.map(test => (
                        <TestCard
                            key={test.id}
                            test={test}
                            onPause={() => { abTesting.updateTest(siteSlug, test.id, { status: 'paused' }); refresh(); }}
                            onResume={() => { abTesting.updateTest(siteSlug, test.id, { status: 'running' }); refresh(); }}
                            onArchive={() => { abTesting.archiveTest(siteSlug, test.id); refresh(); }}
                            onDeclareWinner={(w) => { abTesting.declareWinner(siteSlug, test.id, w); refresh(); }}
                            onApplyWinner={onApplyBlock}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
