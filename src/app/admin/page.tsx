'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Trash2, Edit3, Save, X,
  Upload, Building2, ChevronDown, ChevronUp,
  Search, Cpu, CheckCircle2,
  Loader2, Database, BookOpen, AlertTriangle,
  FileText, Check, Pencil, ArrowLeft,
} from 'lucide-react';
import type { ZoningPlan, ZoningType, ZoningRule, DocumentType, ZoningRuleCategory, RuleUnit } from '@/types';
import { ruleCategoryLabels, documentTypeLabels, ruleUnitLabels } from '@/types';
import {
  getAllPlans, savePlan, deletePlan,
  saveDocument, generateId, buildPlanFromExtraction,
  type StoredDocument, type ExtractedPlanData,
} from '@/services/db';
import {
  parseDocument,
  mergeDocumentRules,
  type ParsedDocumentResult,
} from '@/services/document-parser';

// ── Document Upload Slot ────────────────────────────────────

interface DocSlot {
  type: DocumentType;
  label: string;
  description: string;
  file: File | null;
  result: ParsedDocumentResult | null;
  status: 'empty' | 'selected' | 'parsing' | 'done' | 'error';
  error?: string;
}

const INITIAL_SLOTS: DocSlot[] = [
  {
    type: 'takanon',
    label: 'תקנון',
    description: 'מסמך התקנון הראשי של התב"ע',
    file: null, result: null, status: 'empty',
  },
  {
    type: 'rights_table',
    label: 'טבלת זכויות',
    description: 'טבלת הזכויות (תבלת זכויות / נספח)',
    file: null, result: null, status: 'empty',
  },
  {
    type: 'annex',
    label: 'נספח בינוי',
    description: 'נספחי בינוי, תנאים מיוחדים',
    file: null, result: null, status: 'empty',
  },
];

// ── Auto-Ingest Upload + Verify Flow ────────────────────────

type IngestStep = 'upload' | 'parsing' | 'verify' | 'metadata' | 'saved';

function AutoIngestFlow({ onDone }: { onDone: () => void }) {
  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const [step, setStep] = useState<IngestStep>('upload');
  const [slots, setSlots] = useState<DocSlot[]>(INITIAL_SLOTS.map(s => ({ ...s })));
  const [mergedRules, setMergedRules] = useState<ZoningRule[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editFormula, setEditFormula] = useState('');

  // Metadata
  const [planNumber, setPlanNumber] = useState('');
  const [planName, setPlanName] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zoningType, setZoningType] = useState<ZoningType>('residential_a');
  const [planKind, setPlanKind] = useState<'detailed' | 'outline'>('detailed');
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState('');

  const hasFiles = slots.some(s => s.file !== null);

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlots(prev => {
      const next = [...prev];
      next[index] = { ...next[index], file, status: 'selected', result: null, error: undefined };
      return next;
    });
  };

  const removeFile = (index: number) => {
    setSlots(prev => {
      const next = [...prev];
      next[index] = { ...INITIAL_SLOTS[index] };
      return next;
    });
  };

  const handleAnalyze = async () => {
    setStep('parsing');
    const updatedSlots = [...slots];
    const results: ParsedDocumentResult[] = [];

    for (let i = 0; i < updatedSlots.length; i++) {
      const slot = updatedSlots[i];
      if (!slot.file) continue;

      updatedSlots[i] = { ...slot, status: 'parsing' };
      setSlots([...updatedSlots]);

      try {
        const result = await parseDocument(slot.file, slot.type);
        updatedSlots[i] = { ...updatedSlots[i], status: 'done', result };
        results.push(result);
      } catch (err) {
        updatedSlots[i] = {
          ...updatedSlots[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'שגיאה בניתוח',
        };
      }
      setSlots([...updatedSlots]);
    }

    // Merge rules from all documents
    if (results.length > 0) {
      const merged = mergeDocumentRules(results);
      setMergedRules(merged.rules);

      // Pre-fill metadata
      if (merged.metadata.planNumber) setPlanNumber(merged.metadata.planNumber);
      if (merged.metadata.planName) setPlanName(merged.metadata.planName);
      if (merged.metadata.city) setCity(merged.metadata.city);
      if (merged.metadata.neighborhood) setNeighborhood(merged.metadata.neighborhood);
      if (merged.metadata.zoningType) setZoningType(merged.metadata.zoningType as ZoningType);
    }

    setStep('verify');
  };

  const toggleConfirm = (ruleId: string) => {
    setMergedRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, confirmed: !r.confirmed } : r
    ));
  };

  const confirmAll = () => {
    setMergedRules(prev => prev.map(r => ({ ...r, confirmed: true })));
  };

  const startEdit = (rule: ZoningRule) => {
    setEditingRuleId(rule.id);
    setEditValue(String(rule.rawNumber));
    setEditFormula(rule.formula);
  };

  const saveEdit = (ruleId: string) => {
    const newVal = parseFloat(editValue);
    if (isNaN(newVal)) return;
    setMergedRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const updated = { ...r, rawNumber: newVal, formula: editFormula, confirmed: true };
      // Update display value based on unit
      if (r.unit === 'percent') updated.displayValue = `${newVal}%`;
      else if (r.unit === 'meters') updated.displayValue = `${newVal} מ'`;
      else if (r.unit === 'floors') updated.displayValue = `${newVal} קומות`;
      else if (r.unit === 'units') updated.displayValue = `${newVal} יח"ד`;
      else if (r.unit === 'sqm_per_unit') updated.displayValue = `${newVal} מ"ר ליח'`;
      else if (r.unit === 'spaces') updated.displayValue = `${newVal} חניות ליח'`;
      else if (r.unit === 'ratio') updated.displayValue = `${newVal}`;
      else updated.displayValue = `${newVal}`;
      return updated;
    }));
    setEditingRuleId(null);
  };

  const addManualRule = () => {
    const newRule: ZoningRule = {
      id: generateId('rule'),
      category: 'other',
      label: 'כלל חדש',
      formula: '0',
      displayValue: '0',
      rawNumber: 0,
      unit: 'percent',
      source: {
        documentType: 'takanon',
        documentName: 'הזנה ידנית',
        rawText: 'הוזן ידנית',
        confidence: 100,
      },
      confirmed: false,
    };
    setMergedRules(prev => [...prev, newRule]);
    startEdit(newRule);
  };

  const deleteRule = (ruleId: string) => {
    setMergedRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const proceedToMetadata = () => setStep('metadata');

  const handleSave = async () => {
    setSaving(true);
    try {
      const confirmedRules = mergedRules.filter(r => r.confirmed);
      const docNames = slots.filter(s => s.file).map(s => s.file!.name);

      // Save documents
      for (const slot of slots) {
        if (!slot.file || !slot.result) continue;
        const doc: StoredDocument = {
          id: generateId('doc'),
          name: slot.file.name,
          planNumber,
          type: slot.type,
          uploadDate: new Date().toISOString().split('T')[0],
          pageCount: slot.result.pages.length,
          extractedRules: slot.result.rules,
        };
        await saveDocument(doc);
      }

      // Build and save plan
      const data: ExtractedPlanData = {
        planNumber,
        planName,
        city,
        neighborhood,
        zoningType,
        planKind,
        rules: confirmedRules,
        documents: slots.filter(s => s.file).map(s => ({
          type: s.type,
          name: s.file!.name,
          uploadDate: new Date().toISOString().split('T')[0],
          pageCount: s.result?.pages.length || 0,
        })),
      };

      const plan = buildPlanFromExtraction(data, docNames);
      await savePlan(plan);

      setSavedName(planNumber || planName || 'תכנית חדשה');
      setStep('saved');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setSlots(INITIAL_SLOTS.map(s => ({ ...s })));
    setMergedRules([]);
    setPlanNumber('');
    setPlanName('');
    setCity('');
    setNeighborhood('');
    setZoningType('residential_a');
    setPlanKind('detailed');
    setSavedName('');
    setEditingRuleId(null);
  };

  const confirmedCount = mergedRules.filter(r => r.confirmed).length;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ── Step 1: Upload Documents ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="db-card-accent p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-accent mb-1">{'הזנת תב"ע אוטומטית'}</h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed">
                    {'העלה מסמכי PDF — המערכת תנתח ותחלץ כללי בנייה כנוסחאות. לפחות מסמך אחד נדרש.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div key={slot.type} className={`db-card p-4 transition-all ${slot.file ? 'border border-[rgba(34,197,94,0.3)]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${slot.file ? 'bg-[rgba(34,197,94,0.1)]' : 'bg-[rgba(255,255,255,0.04)]'}`}>
                        {slot.file ? (
                          <CheckCircle2 className="w-5 h-5 text-green" />
                        ) : (
                          <FileText className="w-5 h-5 text-foreground-muted" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{slot.label}</h4>
                        {slot.file ? (
                          <p className="text-xs text-green">{slot.file.name}</p>
                        ) : (
                          <p className="text-xs text-foreground-muted">{slot.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.file && (
                        <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        ref={el => { fileRefs.current[i] = el; }}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect(i, e)}
                      />
                      <button
                        onClick={() => fileRefs.current[i]?.click()}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${slot.file ? 'text-foreground-muted hover:text-accent hover:bg-[rgba(255,255,255,0.04)]' : 'btn-primary'}`}
                      >
                        {slot.file ? 'החלף' : 'בחר PDF'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!hasFiles}
              className="btn-green w-full py-4 flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Cpu className="w-5 h-5" />
              {'התחל ניתוח אוטומטי'}
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Parsing ── */}
        {step === 'parsing' && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="db-card p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">מנתח מסמכים...</h3>
              <p className="text-xs text-foreground-muted mb-4">{'מחלץ טקסט, מזהה טבלאות, וממפה נוסחאות'}</p>
            </div>

            <div className="space-y-2">
              {slots.map((slot) => {
                if (!slot.file) return null;
                return (
                  <div key={slot.type} className="db-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {slot.status === 'parsing' && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
                      {slot.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green" />}
                      {slot.status === 'error' && <AlertTriangle className="w-4 h-4 text-gold" />}
                      {slot.status === 'selected' && <FileText className="w-4 h-4 text-foreground-muted" />}
                      <span className="text-sm">{slot.label}: {slot.file.name}</span>
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {slot.status === 'done' && slot.result && `${slot.result.rules.length} כללים`}
                      {slot.status === 'error' && slot.error}
                      {slot.status === 'parsing' && 'מנתח...'}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Verification Checklist ── */}
        {step === 'verify' && (
          <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="db-card p-4 border border-[rgba(59,130,246,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-bold text-accent">{'כללים שזוהו — אשר או ערוך'}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">{confirmedCount}/{mergedRules.length} מאושרים</span>
                  <button onClick={confirmAll} className="text-xs text-accent hover:underline">אשר הכל</button>
                </div>
              </div>
              <p className="text-xs text-foreground-secondary">
                {'המערכת מצאה את הכללים הבאים. לחץ על ✓ לאישור או על עריכה לשינוי.'}
              </p>
            </div>

            {mergedRules.length === 0 && (
              <div className="db-card p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-gold mx-auto mb-3 opacity-60" />
                <h3 className="text-sm font-semibold mb-1">{'לא נמצאו כללים אוטומטית'}</h3>
                <p className="text-xs text-foreground-muted mb-3">{'ניתן להוסיף כללים ידנית'}</p>
              </div>
            )}

            <div className="space-y-2">
              {mergedRules.map((rule) => {
                const isEditing = editingRuleId === rule.id;
                return (
                  <div key={rule.id} className={`db-card p-3 transition-all ${rule.confirmed ? 'border border-[rgba(34,197,94,0.2)]' : ''}`}>
                    {!isEditing ? (
                      <div className="flex items-start gap-3">
                        {/* Confirm checkbox */}
                        <button
                          onClick={() => toggleConfirm(rule.id)}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${rule.confirmed ? 'bg-green text-white' : 'border border-[rgba(255,255,255,0.2)] hover:border-green'}`}
                        >
                          {rule.confirmed && <Check className="w-3 h-3" />}
                        </button>

                        {/* Rule content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-foreground-muted">
                              {ruleCategoryLabels[rule.category]}
                            </span>
                            <span className="font-bold text-sm font-mono">{rule.displayValue}</span>
                          </div>

                          {/* Formula */}
                          <div className="text-[10px] text-foreground-muted font-mono mb-1">
                            {'נוסחה: '}{rule.formula}
                          </div>

                          {/* Source citation */}
                          <div className="flex items-center gap-2 text-[10px] text-foreground-muted">
                            <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)]">
                              {documentTypeLabels[rule.source.documentType]}
                            </span>
                            {rule.source.pageNumber && <span>{'עמוד '}{rule.source.pageNumber}</span>}
                            <span className="truncate max-w-[200px] opacity-60" title={rule.source.rawText}>
                              {'"'}{rule.source.rawText}{'"'}
                            </span>
                            <span className="px-1 py-0.5 rounded bg-[rgba(255,255,255,0.04)]">{rule.source.confidence}%</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(rule)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteRule(rule.id)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Inline edit mode */
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-foreground-muted">קטגוריה</label>
                            <select
                              className="input-field w-full mt-0.5 text-xs"
                              value={rule.category}
                              onChange={(e) => {
                                const cat = e.target.value as ZoningRuleCategory;
                                setMergedRules(prev => prev.map(r =>
                                  r.id === rule.id ? { ...r, category: cat, label: ruleCategoryLabels[cat] } : r
                                ));
                              }}
                            >
                              {Object.entries(ruleCategoryLabels).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-foreground-muted">יחידה</label>
                            <select
                              className="input-field w-full mt-0.5 text-xs"
                              value={rule.unit}
                              onChange={(e) => {
                                setMergedRules(prev => prev.map(r =>
                                  r.id === rule.id ? { ...r, unit: e.target.value as RuleUnit } : r
                                ));
                              }}
                            >
                              {Object.entries(ruleUnitLabels).map(([k, v]) => (
                                <option key={k} value={k}>{v || k}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-foreground-muted">ערך</label>
                            <input
                              type="number"
                              className="input-field w-full mt-0.5 text-xs"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-foreground-muted">נוסחה</label>
                            <input
                              className="input-field w-full mt-0.5 text-xs font-mono"
                              value={editFormula}
                              onChange={(e) => setEditFormula(e.target.value)}
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(rule.id)} className="btn-green text-xs px-3 py-1.5 flex items-center gap-1">
                            <Save className="w-3 h-3" />שמור
                          </button>
                          <button onClick={() => setEditingRuleId(null)} className="btn-secondary text-xs px-3 py-1.5">ביטול</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={addManualRule} className="text-xs text-accent hover:underline flex items-center gap-1 mx-auto">
              <Plus className="w-3 h-3" />{'הוסף כלל ידני'}
            </button>

            <button
              onClick={proceedToMetadata}
              disabled={confirmedCount === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              {'המשך — פרטי תכנית (' + confirmedCount + ' כללים מאושרים)'}
            </button>
          </motion.div>
        )}

        {/* ── Step 4: Metadata ── */}
        {step === 'metadata' && (
          <motion.div key="metadata" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="db-card p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                {'פרטי התכנית'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted">מספר תכנית</label>
                  <input className="input-field w-full mt-1" value={planNumber} onChange={(e) => setPlanNumber(e.target.value)} placeholder="רע/3000" />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">שם תכנית</label>
                  <input className="input-field w-full mt-1" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder='תכנית מתאר...' />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">עיר</label>
                  <input className="input-field w-full mt-1" value={city} onChange={(e) => setCity(e.target.value)} placeholder="רעננה" />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">שכונה</label>
                  <input className="input-field w-full mt-1" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="נווה זמר" />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">סוג ייעוד</label>
                  <select className="input-field w-full mt-1" value={zoningType} onChange={(e) => setZoningType(e.target.value as ZoningType)}>
                    <option value="residential_a">{"מגורים א'"}</option>
                    <option value="residential_b">{"מגורים ב'"}</option>
                    <option value="residential_c">{"מגורים ג'"}</option>
                    <option value="mixed_use">שימוש מעורב</option>
                    <option value="commercial">מסחרי</option>
                    <option value="industrial">תעשייה</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">רמת תכנית</label>
                  <select className="input-field w-full mt-1" value={planKind} onChange={(e) => setPlanKind(e.target.value as 'detailed' | 'outline')}>
                    <option value="detailed">תב"ע מפורטת (להיתר)</option>
                    <option value="outline">תכנית מתאר (ללא היתר)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary of confirmed rules */}
            <div className="db-card p-4">
              <h4 className="font-semibold text-xs text-foreground-secondary mb-2">{confirmedCount} {'כללים מאושרים'}</h4>
              <div className="grid grid-cols-2 gap-1">
                {mergedRules.filter(r => r.confirmed).map(r => (
                  <div key={r.id} className="text-[10px] flex items-center gap-1 p-1 rounded bg-[rgba(0,0,0,0.2)]">
                    <CheckCircle2 className="w-2.5 h-2.5 text-green flex-shrink-0" />
                    <span className="text-foreground-muted truncate">{ruleCategoryLabels[r.category]}:</span>
                    <span className="font-mono font-bold">{r.displayValue}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('verify')} className="btn-secondary flex-1">
                {'חזרה לעריכה'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-green flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />{'שומר...'}</>
                ) : (
                  <><Save className="w-5 h-5" />{'שמור למערכת'}</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Saved ── */}
        {step === 'saved' && (
          <motion.div key="saved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="db-card p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.1)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green" />
              </div>
              <h3 className="text-xl font-bold text-green mb-2">{'התכנית נשמרה בהצלחה!'}</h3>
              <p className="text-sm text-foreground-secondary mb-1">
                {'תכנית "' + savedName + '" הוזנה עם ' + confirmedCount + ' כללי בנייה'}
              </p>
              <p className="text-xs text-foreground-muted mb-6">
                {'המערכת תשתמש בנוסחאות שאושרו בחישוב זכויות בנייה.'}
              </p>

              <div className="flex gap-3">
                <button onClick={reset} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />{'העלה תב"ע נוספת'}
                </button>
                <button onClick={onDone} className="btn-secondary flex-1">{'סיום'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Plan Editor Form ─────────────────────────────────────────

function PlanForm({
  plan, onSave, onCancel,
}: {
  plan?: ZoningPlan;
  onSave: (plan: ZoningPlan) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<ZoningPlan>>(
    plan || {
      id: generateId('plan'),
      planNumber: '', name: '', city: '', neighborhood: '',
      approvalDate: new Date().toISOString().split('T')[0],
      status: 'active',
      planKind: 'detailed',
      zoningType: 'residential_a' as ZoningType,
      buildingRights: {
        mainBuildingPercent: 0, serviceBuildingPercent: 0, totalBuildingPercent: 0,
        maxFloors: 0, maxHeight: 0, maxUnits: 0,
        basementAllowed: true, basementPercent: 0, rooftopPercent: 0, landCoveragePercent: 0,
        floorAllocations: [], citations: [],
      },
      restrictions: {
        frontSetback: 0, rearSetback: 0, sideSetback: 0,
        minParkingSpaces: 1.5, minGreenAreaPercent: 30, maxLandCoverage: 0,
      },
      sourceDocument: { name: '', url: '', lastUpdated: new Date().toISOString().split('T')[0] },
      rules: [],
    }
  );

  const updateField = (path: string, value: string | number | boolean) => {
    setForm((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      if (path.startsWith('buildingRights.main') || path.startsWith('buildingRights.service')) {
        copy.buildingRights.totalBuildingPercent =
          (copy.buildingRights.mainBuildingPercent || 0) + (copy.buildingRights.serviceBuildingPercent || 0);
      }
      return copy;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{plan ? 'עריכת תכנית' : 'הוספת תכנית חדשה'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg"><X className="w-5 h-5" /></button>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">פרטי התכנית</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-foreground-muted">מספר תכנית</label><input className="input-field w-full mt-1" value={form.planNumber || ''} onChange={(e) => updateField('planNumber', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">שם התכנית</label><input className="input-field w-full mt-1" value={form.name || ''} onChange={(e) => updateField('name', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">עיר</label><input className="input-field w-full mt-1" value={form.city || ''} onChange={(e) => updateField('city', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">שכונה</label><input className="input-field w-full mt-1" value={form.neighborhood || ''} onChange={(e) => updateField('neighborhood', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">סוג ייעוד</label><select className="input-field w-full mt-1" value={form.zoningType || 'residential_a'} onChange={(e) => updateField('zoningType', e.target.value)}>
            <option value="residential_a">{"מגורים א'"}</option><option value="residential_b">{"מגורים ב'"}</option><option value="residential_c">{"מגורים ג'"}</option>
            <option value="mixed_use">שימוש מעורב</option><option value="commercial">מסחרי</option>
          </select></div>
          <div><label className="text-xs text-foreground-muted">רמת תכנית</label><select className="input-field w-full mt-1" value={form.planKind || 'detailed'} onChange={(e) => updateField('planKind', e.target.value)}>
            <option value="detailed">תב"ע מפורטת (להיתר)</option><option value="outline">תכנית מתאר (ללא היתר)</option>
          </select></div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">זכויות בנייה</h4>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-foreground-muted">עיקרי %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.mainBuildingPercent || ''} onChange={(e) => updateField('buildingRights.mainBuildingPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">שירות %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.serviceBuildingPercent || ''} onChange={(e) => updateField('buildingRights.serviceBuildingPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'סה"כ %'}</label><input type="number" className="input-field w-full mt-1 opacity-60" value={form.buildingRights?.totalBuildingPercent || ''} readOnly /></div>
          <div><label className="text-xs text-foreground-muted">קומות מרבי</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.maxFloors || ''} onChange={(e) => updateField('buildingRights.maxFloors', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{"גובה מרבי (מ')"}</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.maxHeight || ''} onChange={(e) => updateField('buildingRights.maxHeight', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">תכסית %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.landCoveragePercent || ''} onChange={(e) => updateField('buildingRights.landCoveragePercent', parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">{'קווי בניין (מטרים)'}</h4>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-foreground-muted">קדמי</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.frontSetback || ''} onChange={(e) => updateField('restrictions.frontSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">אחורי</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.rearSetback || ''} onChange={(e) => updateField('restrictions.rearSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">צידי</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.sideSetback || ''} onChange={(e) => updateField('restrictions.sideSetback', parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => onSave(form as ZoningPlan)} className="btn-primary flex-1 flex items-center justify-center gap-2"><Save className="w-4 h-4" />שמור תכנית</button>
        <button onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────

type AdminTab = 'learn' | 'plans';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('learn');
  const [plans, setPlans] = useState<ZoningPlan[]>([]);
  const [showIngest, setShowIngest] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ZoningPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = async () => {
    const p = await getAllPlans();
    setPlans(p);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSavePlan = async (plan: ZoningPlan) => {
    await savePlan(plan);
    setShowForm(false);
    setEditingPlan(null);
    refreshData();
  };

  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId);
    refreshData();
  };

  const filteredPlans = plans.filter(
    (p) => !searchTerm || p.planNumber.includes(searchTerm) || p.name.includes(searchTerm) || (p.city && p.city.includes(searchTerm))
  );

  const tabs: { key: AdminTab; label: string; icon: typeof Building2; count: number }[] = [
    { key: 'learn', label: 'הזנת תב"ע', icon: BookOpen, count: plans.length },
    { key: 'plans', label: 'תכניות במערכת', icon: Building2, count: plans.length },
  ];

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ניהול מערכת</h1>
            <p className="text-xs text-foreground-muted">{'העלה תב"ע — המערכת מחלצת נוסחאות בנייה אוטומטית'}</p>
          </div>
        </div>
        <a href="/" className="text-xs text-foreground-muted hover:text-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)]">חזרה לאתר</a>
      </div>

      {/* Knowledge base stats */}
      {plans.length > 0 && (
        <div className="db-card p-3 mb-4 border border-[rgba(34,197,94,0.2)]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green" />
            <span className="text-sm text-green font-medium">
              {'המערכת למדה ' + plans.length + ' תכניות'}
            </span>
            <span className="text-xs text-foreground-muted">
              {' | ערים: ' + [...new Set(plans.map(p => p.city).filter(Boolean))].join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 db-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); setShowIngest(false); setSearchTerm(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-accent/10 text-accent' : 'text-foreground-muted hover:text-foreground hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-accent/20' : 'bg-[rgba(255,255,255,0.06)]'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'learn' && (
          <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {showIngest ? (
              <AutoIngestFlow onDone={() => { setShowIngest(false); refreshData(); }} />
            ) : (
              <>
                <button onClick={() => setShowIngest(true)} className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-base">
                  <Upload className="w-5 h-5" />{'העלה תב"ע חדשה למערכת'}
                </button>

                {plans.length === 0 && (
                  <div className="db-card p-10 text-center">
                    <BookOpen className="w-12 h-12 text-foreground-muted mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-semibold mb-1">{'המערכת עדיין לא למדה תב"ע'}</h3>
                    <p className="text-sm text-foreground-muted mb-4">
                      {'לחץ "העלה תב"ע חדשה" כדי להעלות מסמכים. המערכת תנתח אותם ותחלץ נוסחאות בנייה.'}
                    </p>
                  </div>
                )}

                {plans.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {'תכניות שהמערכת למדה (' + plans.length + ')'}
                    </h3>
                    {plans.map((plan) => (
                      <div key={plan.id} className="db-card p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[rgba(34,197,94,0.1)] flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-green" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{plan.planNumber || plan.name || 'ללא מספר'}</span>
                                {plan.city && <span className="text-xs text-foreground-muted">{plan.city}</span>}
                              </div>
                              <p className="text-xs text-foreground-muted truncate">
                                {plan.rules && plan.rules.length > 0
                                  ? `${plan.rules.length} כללים | `
                                  : ''}
                                {plan.buildingRights.mainBuildingPercent > 0 && `עיקרי: ${plan.buildingRights.mainBuildingPercent}% | `}
                                {plan.buildingRights.maxFloors > 0 && `${plan.buildingRights.maxFloors} קומות | `}
                                {plan.buildingRights.landCoveragePercent > 0 && `תכסית: ${plan.buildingRights.landCoveragePercent}%`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mr-2">
                            <button onClick={() => { setTab('plans'); setEditingPlan(plan); setShowForm(true); }} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {tab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {showForm ? (
              <PlanForm plan={editingPlan || undefined} onSave={handleSavePlan} onCancel={() => { setShowForm(false); setEditingPlan(null); }} />
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input className="input-field w-full pr-10" placeholder="חיפוש..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => { setShowForm(true); setEditingPlan(null); }} className="btn-primary flex items-center gap-2 px-4">
                    <Plus className="w-4 h-4" />הוסף
                  </button>
                </div>

                {filteredPlans.length === 0 && (
                  <div className="db-card p-8 text-center text-foreground-muted">
                    {plans.length === 0 ? 'אין תכניות במערכת. העלה תב"ע בלשונית "הזנת תב"ע".' : 'אין תכניות תואמות'}
                  </div>
                )}

                {filteredPlans.map((plan) => {
                  const isExpanded = expandedPlan === plan.id;
                  return (
                    <div key={plan.id} className="db-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-green" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{plan.planNumber}</span>
                              {plan.city && <span className="text-xs text-foreground-muted">{plan.city}</span>}
                            </div>
                            <p className="text-xs text-foreground-muted truncate">{plan.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-xs text-foreground-muted">
                            {plan.rules?.length > 0 ? `${plan.rules.length} כללים` : `${plan.buildingRights.totalBuildingPercent}% | ${plan.buildingRights.maxFloors} קומות`}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-[rgba(255,255,255,0.06)] p-4 space-y-3">
                          {/* Show rules if available */}
                          {plan.rules && plan.rules.length > 0 ? (
                            <div className="space-y-1">
                              <h5 className="text-xs font-semibold text-foreground-secondary mb-1">{'כללי בנייה (נוסחאות)'}</h5>
                              {plan.rules.map(r => (
                                <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded bg-[rgba(0,0,0,0.2)]">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-green flex-shrink-0" />
                                    <span className="text-foreground-muted">{ruleCategoryLabels[r.category]}:</span>
                                    <span className="font-bold font-mono">{r.displayValue}</span>
                                  </div>
                                  <span className="text-[10px] text-foreground-muted font-mono">{r.formula}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div><span className="text-foreground-muted">עיר:</span> <span>{plan.city}</span></div>
                              <div><span className="text-foreground-muted">שכונה:</span> <span>{plan.neighborhood}</span></div>
                              <div><span className="text-foreground-muted">סטטוס:</span> <span>{plan.status}</span></div>
                              <div><span className="text-foreground-muted">עיקרי:</span> <span>{plan.buildingRights.mainBuildingPercent}%</span></div>
                              <div><span className="text-foreground-muted">שירות:</span> <span>{plan.buildingRights.serviceBuildingPercent}%</span></div>
                              <div><span className="text-foreground-muted">גובה:</span> <span>{plan.buildingRights.maxHeight}{"מ'"}</span></div>
                              <div><span className="text-foreground-muted">תכסית:</span> <span>{plan.buildingRights.landCoveragePercent}%</span></div>
                              <div><span className="text-foreground-muted">קו קדמי:</span> <span>{plan.restrictions.frontSetback}{"מ'"}</span></div>
                              <div><span className="text-foreground-muted">קו אחורי:</span> <span>{plan.restrictions.rearSetback}{"מ'"}</span></div>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                            <button onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); setShowForm(true); }} className="flex items-center gap-1 text-xs text-accent hover:underline"><Edit3 className="w-3 h-3" /> עריכה</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="flex items-center gap-1 text-xs text-red-400 hover:underline"><Trash2 className="w-3 h-3" /> מחיקה</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Footer */}
      <div className="mt-8 db-card p-4">
        <div className="grid grid-cols-2 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-bold font-mono">{plans.length}</div>
            <div className="text-foreground-muted">{'תכניות במערכת'}</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono">{[...new Set(plans.map(p => p.city).filter(Boolean))].length}</div>
            <div className="text-foreground-muted">{'ערים'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
