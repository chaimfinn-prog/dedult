'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, LogOut, Plus, Trash2, Edit3, Save, X,
  Upload, Building2, ChevronDown, ChevronUp,
  Search, Cpu, CheckCircle2,
  Loader2, Sparkles, Database, BookOpen, AlertTriangle,
} from 'lucide-react';
import type { ZoningPlan, ZoningType } from '@/types';
import {
  getAllPlans, savePlan, deletePlan,
  getAllDocuments, saveDocument,
  generateId, buildPlanFromExtraction, verifyAdminPassword,
  isAdminAuthenticated, setAdminAuthenticated,
  type StoredDocument, type ExtractedPlanData,
} from '@/services/db';
import { parseDocument, type ParsedDocument, type ParsedField } from '@/services/document-parser';

// ── Login Screen ─────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      setAdminAuthenticated(true);
      onLogin();
    } else {
      setError('סיסמה שגויה');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="db-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-xl font-bold mb-1">ניהול מערכת</h1>
          <p className="text-sm text-foreground-muted mb-6">Zchut.AI Admin Panel</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="הזן סיסמה"
                className="input-field w-full pr-10 text-center"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full">כניסה</button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Upload & Parse Step ──────────────────────────────────────

type LearnStep = 'upload' | 'parsing' | 'review' | 'saved';

function LearnDocument({ onDone }: { onDone: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<LearnStep>('upload');
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState<ParsedDocument | null>(null);
  const [parseError, setParseError] = useState('');
  const [savedPlanName, setSavedPlanName] = useState('');
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ExtractedPlanData>({});

  const updateField = (key: keyof ExtractedPlanData, value: string | number) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStep('parsing');
    setParseError('');
    setParseResult(null);

    try {
      const result = await parseDocument(file);
      setParseResult(result);

      if (result.extractedData) {
        setData(prev => ({ ...prev, ...result.extractedData }));
      }
      if (!result.extractedData?.planName) {
        setData(prev => ({
          ...prev,
          planName: prev.planName || file.name.replace(/\.[^.]+$/, ''),
        }));
      }
      setStep('review');
    } catch (err) {
      console.error('Parse error:', err);
      setParseError(err instanceof Error ? err.message : 'שגיאה בניתוח המסמך');
      setStep('review');
    }
  };

  const handleManualEntry = () => setStep('review');

  const handleSave = async () => {
    setSaving(true);
    try {
      const docId = generateId('doc');
      const doc: StoredDocument = {
        id: docId,
        name: data.planName || data.planNumber || fileName || 'מסמך חדש',
        planNumber: data.planNumber || '',
        type: 'takkanon',
        uploadDate: new Date().toISOString().split('T')[0],
        extractedData: data,
      };
      await saveDocument(doc);

      const plan = buildPlanFromExtraction(data, docId);
      await savePlan(plan);

      setSavedPlanName(plan.planNumber || plan.name || 'תכנית חדשה');
      setStep('saved');
    } catch (err) {
      console.error('Save error:', err);
      setParseError('שגיאה בשמירה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="db-card-accent p-4 mb-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-accent mb-1">{'הזנת תב"ע למערכת'}</h3>
                  <p className="text-xs text-foreground-secondary leading-relaxed">
                    {'העלה קובץ PDF של תב"ע — המערכת תנתח את המסמך ותחלץ נתונים אוטומטית.'}
                    <br />
                    {'לחילופין, ניתן להזין נתונים ידנית ללא העלאת קובץ.'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="db-card p-10 border-2 border-dashed border-[rgba(255,255,255,0.1)] text-center cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
              <Upload className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-secondary mb-1">{'לחץ להעלאת קובץ תב"ע (PDF)'}</p>
              <p className="text-xs text-foreground-muted">{'המערכת תחלץ אוטומטית: אחוזי בנייה, קומות, תכסית, קווי בניין'}</p>
            </div>

            <div className="text-center mt-4">
              <button onClick={handleManualEntry} className="text-sm text-accent hover:underline">
                {'או הזן נתונים ידנית ללא קובץ'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'parsing' && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="db-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">מנתח מסמך...</h3>
              <p className="text-sm text-foreground-muted mb-4">{fileName}</p>
              <div className="w-48 h-2 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)] mx-auto">
                <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-foreground-muted mt-3">{'מחלץ טקסט ומזהה פרמטרי בנייה...'}</p>
            </div>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {parseResult && parseResult.matchedFields.length > 0 && (
              <div className="db-card p-4 border border-[rgba(34,197,94,0.2)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green" />
                    <span className="text-sm font-semibold text-green">{'נתונים זוהו אוטומטית!'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green/10 text-green">{parseResult.confidence}% ודאות</span>
                    <span className="text-xs text-foreground-muted">{parseResult.matchedFields.length} שדות</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {parseResult.matchedFields.map((field: ParsedField, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-[rgba(0,0,0,0.2)]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green flex-shrink-0" />
                        <span className="text-foreground-secondary">{field.label}:</span>
                        <span className="font-semibold font-mono">{String(field.value)}</span>
                      </div>
                      {field.pageNumber && <span className="text-foreground-muted">עמוד {field.pageNumber}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parseResult && parseResult.matchedFields.length === 0 && !parseError && (
              <div className="db-card p-3 border border-[rgba(245,158,11,0.2)]">
                <div className="flex items-center gap-2 text-sm text-gold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{'לא נמצאו נתונים אוטומטית — מלא ידנית למטה'}</span>
                </div>
              </div>
            )}

            {parseError && (
              <div className="db-card p-3 border border-[rgba(245,158,11,0.2)]">
                <div className="flex items-center gap-2 text-sm text-gold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{parseError} — {'ניתן למלא ידנית'}</span>
                </div>
              </div>
            )}

            {/* Editable form */}
            <div className="db-card p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                {'נתוני תב"ע — ערוך ושמור'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted">מספר תכנית</label>
                  <input className="input-field w-full mt-1" value={data.planNumber || ''} onChange={(e) => updateField('planNumber', e.target.value)} placeholder="רע/3000" />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">שם תכנית</label>
                  <input className="input-field w-full mt-1" value={data.planName || ''} onChange={(e) => updateField('planName', e.target.value)} placeholder='תכנית מתאר...' />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">עיר</label>
                  <input className="input-field w-full mt-1" value={data.city || ''} onChange={(e) => updateField('city', e.target.value)} placeholder="רעננה" />
                </div>
                <div>
                  <label className="text-xs text-foreground-muted">שכונה</label>
                  <input className="input-field w-full mt-1" value={data.neighborhood || ''} onChange={(e) => updateField('neighborhood', e.target.value)} placeholder="נווה זמר" />
                </div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
                <h5 className="text-xs text-foreground-muted mb-2">זכויות בנייה</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">עיקרי %</label>
                    <input type="number" className="input-field w-full mt-1" value={data.mainBuildingPercent || ''} onChange={(e) => updateField('mainBuildingPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">שירות %</label>
                    <input type="number" className="input-field w-full mt-1" value={data.serviceBuildingPercent || ''} onChange={(e) => updateField('serviceBuildingPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">תכסית %</label>
                    <input type="number" className="input-field w-full mt-1" value={data.landCoveragePercent || ''} onChange={(e) => updateField('landCoveragePercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">קומות מרבי</label>
                    <input type="number" className="input-field w-full mt-1" value={data.maxFloors || ''} onChange={(e) => updateField('maxFloors', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">{"גובה מרבי (מ')"}</label>
                    <input type="number" className="input-field w-full mt-1" value={data.maxHeight || ''} onChange={(e) => updateField('maxHeight', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">{'יח"ד לדונם'}</label>
                    <input type="number" className="input-field w-full mt-1" value={data.unitsPerDunam || ''} onChange={(e) => updateField('unitsPerDunam', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
                <h5 className="text-xs text-foreground-muted mb-2">{'קווי בניין (מטרים)'}</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-foreground-muted">קדמי</label>
                    <input type="number" className="input-field w-full mt-1" value={data.frontSetback || ''} onChange={(e) => updateField('frontSetback', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">אחורי</label>
                    <input type="number" className="input-field w-full mt-1" value={data.rearSetback || ''} onChange={(e) => updateField('rearSetback', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">צידי</label>
                    <input type="number" className="input-field w-full mt-1" value={data.sideSetback || ''} onChange={(e) => updateField('sideSetback', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-green w-full flex items-center justify-center gap-2 text-base py-3"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" />{'שומר...'}</>
              ) : (
                <><Save className="w-5 h-5" />{'שמור והזן למערכת'}</>
              )}
            </button>
          </motion.div>
        )}

        {step === 'saved' && (
          <motion.div key="saved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="db-card p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.1)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green" />
              </div>
              <h3 className="text-xl font-bold text-green mb-2">{'הנתונים נשמרו בהצלחה!'}</h3>
              <p className="text-sm text-foreground-secondary mb-1">
                {'תכנית "' + savedPlanName + '" הוזנה למערכת'}
              </p>
              <p className="text-xs text-foreground-muted mb-6">
                {'המערכת תשתמש בנתונים שהזנת בחישוב זכויות בנייה.'}
              </p>

              <div className="flex gap-3">
                <button onClick={() => { setStep('upload'); setData({}); setParseResult(null); setFileName(''); setParseError(''); setSavedPlanName(''); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />{'העלה מסמך נוסף'}
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
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<AdminTab>('learn');
  const [plans, setPlans] = useState<ZoningPlan[]>([]);
  const [showLearn, setShowLearn] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ZoningPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = async () => {
    const p = await getAllPlans();
    setPlans(p);
  };

  useEffect(() => {
    if (isAdminAuthenticated()) setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (authenticated) refreshData();
  }, [authenticated]);

  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;

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

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setAuthenticated(false);
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
            <p className="text-xs text-foreground-muted">{'העלה תב"ע — המערכת לומדת ומשתמשת בנתונים'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className="text-xs text-foreground-muted hover:text-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)]">חזרה לאתר</a>
          <button onClick={handleLogout} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
            onClick={() => { setTab(t.key); setShowForm(false); setShowLearn(false); setSearchTerm(''); }}
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
            {showLearn ? (
              <LearnDocument onDone={() => { setShowLearn(false); refreshData(); }} />
            ) : (
              <>
                <button onClick={() => setShowLearn(true)} className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-base">
                  <Upload className="w-5 h-5" />{'העלה תב"ע חדשה למערכת'}
                </button>

                {plans.length === 0 && (
                  <div className="db-card p-10 text-center">
                    <BookOpen className="w-12 h-12 text-foreground-muted mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-semibold mb-1">{'המערכת עדיין לא למדה תב"ע'}</h3>
                    <p className="text-sm text-foreground-muted mb-4">
                      {'לחץ "העלה תב"ע חדשה" כדי להזין מסמך. המערכת תנתח אותו ותשתמש בנתונים לניתוח.'}
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
                          <span className="text-xs text-foreground-muted">{plan.buildingRights.totalBuildingPercent}% | {plan.buildingRights.maxFloors} קומות</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-[rgba(255,255,255,0.06)] p-4 space-y-3">
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
