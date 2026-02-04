'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, LogOut, Plus, Trash2, Edit3, Save, X,
  FileText, MapPin, Upload, Building2, ChevronDown, ChevronUp,
  AlertTriangle, Search, Cpu, CheckCircle2,
  Loader2, Sparkles, RefreshCw, Database, BookOpen,
} from 'lucide-react';
import { ZoningPlan, ZoningType } from '@/types';
import { AddressMapping } from '@/data/zoning-plans';
import {
  verifyAdminPassword,
  isAdminAuthenticated,
  setAdminAuthenticated,
  getCustomPlans,
  saveCustomPlan,
  deleteCustomPlan,
  getAllPlans,
  getCustomAddresses,
  saveCustomAddress,
  deleteCustomAddress,
  getAllAddresses,
  getDocuments,
  saveDocument,
  DocumentEntry,
  ExtractedPlanData,
  generateId,
  createPlanFromExtractedData,
} from '@/services/admin-storage';
import { parseDocument, type ParsedDocument, type ParsedField } from '@/services/document-parser';

type AdminTab = 'learn' | 'plans' | 'addresses';

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

// ── Learn Document (Upload + Manual Entry) ───────────────────

type LearnStep = 'upload' | 'parsing' | 'review' | 'saved';

function LearnDocument({
  onDone,
}: {
  onDone: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<LearnStep>('upload');
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState<ParsedDocument | null>(null);
  const [parseError, setParseError] = useState('');
  const [savedPlanName, setSavedPlanName] = useState('');
  const [saving, setSaving] = useState(false);

  // Editable extracted data
  const [data, setData] = useState<ExtractedPlanData>({});

  const updateField = (key: keyof ExtractedPlanData, value: string | number) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  // Handle PDF upload
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

      // Pre-fill data from extraction
      if (result.extractedData) {
        setData(prev => ({ ...prev, ...result.extractedData }));
      }

      // Auto-fill plan name from file name if not extracted
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
      setStep('review'); // Still go to review so user can fill manually
    }
  };

  // Skip upload - go straight to manual entry
  const handleManualEntry = () => {
    setStep('review');
  };

  // Save to knowledge base
  const handleSave = async () => {
    setSaving(true);

    try {
      // Create document entry
      const docId = generateId('doc');
      const doc: DocumentEntry = {
        id: docId,
        name: data.planName || data.planNumber || fileName || 'מסמך חדש',
        planNumber: data.planNumber || '',
        type: 'takkanon',
        description: '',
        uploadDate: new Date().toISOString().split('T')[0],
        extractedData: data,
      };

      // Save document
      saveDocument(doc);

      // Create and save plan
      const plan = createPlanFromExtractedData(data, docId) as ZoningPlan;
      saveCustomPlan(plan);

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
        {/* Step 1: Upload */}
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

            {/* Upload area */}
            <div
              className="db-card p-10 border-2 border-dashed border-[rgba(255,255,255,0.1)] text-center cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-secondary mb-1">{'לחץ להעלאת קובץ תב"ע (PDF)'}</p>
              <p className="text-xs text-foreground-muted">{'המערכת תחלץ אוטומטית: אחוזי בנייה, קומות, תכסית, קווי בניין'}</p>
            </div>

            {/* Or manual */}
            <div className="text-center mt-4">
              <button onClick={handleManualEntry} className="text-sm text-accent hover:underline">
                {'או הזן נתונים ידנית ללא קובץ'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Parsing */}
        {step === 'parsing' && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="db-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">מנתח מסמך...</h3>
              <p className="text-sm text-foreground-muted mb-4">{fileName}</p>
              <div className="w-48 h-2 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)] mx-auto">
                <div className="h-full parser-progress rounded-full" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-foreground-muted mt-3">{'מחלץ טקסט ומזהה פרמטרי בנייה...'}</p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Edit */}
        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Parse result banner */}
            {parseResult && parseResult.matchedFields.length > 0 && (
              <div className="db-card-green p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green" />
                    <span className="text-sm font-semibold text-green">{'נתונים זוהו אוטומטית!'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success">{parseResult.confidence}% ודאות</span>
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
              <p className="text-xs text-foreground-muted">
                {'נתונים אלו יוזנו למערכת. כשמישהו יחפש כתובת בעיר/שכונה הזו, המערכת תשתמש בהם.'}
              </p>

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
                    <label className="text-xs text-foreground-muted">אחוזי בנייה עיקריים %</label>
                    <input type="number" className="input-field w-full mt-1" value={data.mainBuildingPercent || ''} onChange={(e) => updateField('mainBuildingPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">שטחי שירות %</label>
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
                    <label className="text-xs text-foreground-muted">{'יח"ד מרבי'}</label>
                    <input type="number" className="input-field w-full mt-1" value={data.maxUnits || ''} onChange={(e) => updateField('maxUnits', parseInt(e.target.value) || 0)} />
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

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-green w-full flex items-center justify-center gap-2 text-base py-3"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {'שומר...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {'שמור והזן למערכת'}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Step 4: Saved */}
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
                {'עכשיו כשמישהו יחפש כתובת ב' + (data.city || 'העיר') + ', המערכת תשתמש בנתונים שהזנת.'}
              </p>

              <div className="flex gap-3">
                <button onClick={() => { setStep('upload'); setData({}); setParseResult(null); setFileName(''); setParseError(''); setSavedPlanName(''); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {'העלה מסמך נוסף'}
                </button>
                <button onClick={onDone} className="btn-secondary flex-1">
                  {'סיום'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Plan Form ────────────────────────────────────────────────

function PlanForm({
  plan,
  onSave,
  onCancel,
}: {
  plan?: ZoningPlan;
  onSave: (plan: ZoningPlan) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<ZoningPlan>>(
    plan || {
      id: generateId('plan'),
      planNumber: '',
      name: '',
      city: '',
      neighborhood: '',
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
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      if (path.startsWith('buildingRights.main') || path.startsWith('buildingRights.service')) {
        copy.buildingRights.totalBuildingPercent =
          (copy.buildingRights.mainBuildingPercent || 0) + (copy.buildingRights.serviceBuildingPercent || 0);
      }
      return copy;
    });
  };

  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = () => {
    if (!form.planNumber && !form.name) {
      setSaveMsg('יש למלא מספר תכנית או שם');
      return;
    }
    onSave(form as ZoningPlan);
    setSaveMsg('');
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
          <div><label className="text-xs text-foreground-muted">מספר תכנית</label><input className="input-field w-full mt-1" value={form.planNumber || ''} onChange={(e) => updateField('planNumber', e.target.value)} placeholder='רע/3000' /></div>
          <div><label className="text-xs text-foreground-muted">שם התכנית</label><input className="input-field w-full mt-1" value={form.name || ''} onChange={(e) => updateField('name', e.target.value)} placeholder='תכנית מתאר...' /></div>
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
          <div><label className="text-xs text-foreground-muted">אחוזי בנייה עיקריים %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.mainBuildingPercent || ''} onChange={(e) => updateField('buildingRights.mainBuildingPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">שטחי שירות %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.serviceBuildingPercent || ''} onChange={(e) => updateField('buildingRights.serviceBuildingPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'סה"כ %'}</label><input type="number" className="input-field w-full mt-1 opacity-60" value={form.buildingRights?.totalBuildingPercent || ''} readOnly /></div>
          <div><label className="text-xs text-foreground-muted">קומות מרבי</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.maxFloors || ''} onChange={(e) => updateField('buildingRights.maxFloors', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{"גובה מרבי (מ')"}</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.maxHeight || ''} onChange={(e) => updateField('buildingRights.maxHeight', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'יח"ד מרבי'}</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.maxUnits || ''} onChange={(e) => updateField('buildingRights.maxUnits', parseInt(e.target.value) || 0)} /></div>
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

      {saveMsg && <p className="text-sm text-red-400 text-center">{saveMsg}</p>}

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2"><Save className="w-4 h-4" />שמור תכנית</button>
        <button onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </div>
  );
}

// ── Address Form ─────────────────────────────────────────────

function AddressForm({
  addr, plans, onSave, onCancel,
}: {
  addr?: AddressMapping; plans: ZoningPlan[]; onSave: (addr: AddressMapping) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<AddressMapping>>(
    addr || {
      address: '', block: '', parcel: '', planId: plans[0]?.id || '', neighborhood: '',
      avgPricePerSqm: 0, constructionCostPerSqm: 8000,
      plotSize: 0, plotWidth: 0, plotDepth: 0, existingFloors: 0, existingArea: 0, existingUnits: 0,
    }
  );
  const update = (key: keyof AddressMapping, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleSave = () => { if (!form.address) return; onSave(form as AddressMapping); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{addr ? 'עריכת כתובת' : 'הוספת כתובת חדשה'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg"><X className="w-5 h-5" /></button>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">מיקום</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-foreground-muted">כתובת מלאה *</label><input className="input-field w-full mt-1" value={form.address || ''} onChange={(e) => update('address', e.target.value)} placeholder="רחוב הרצל 15, רעננה" /></div>
          <div><label className="text-xs text-foreground-muted">גוש</label><input className="input-field w-full mt-1" value={form.block || ''} onChange={(e) => update('block', e.target.value)} placeholder="6573" /></div>
          <div><label className="text-xs text-foreground-muted">חלקה</label><input className="input-field w-full mt-1" value={form.parcel || ''} onChange={(e) => update('parcel', e.target.value)} placeholder="45" /></div>
          <div><label className="text-xs text-foreground-muted">שכונה</label><input className="input-field w-full mt-1" value={form.neighborhood || ''} onChange={(e) => update('neighborhood', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">תכנית חלה</label>
            <select className="input-field w-full mt-1" value={form.planId || ''} onChange={(e) => update('planId', e.target.value)}>
              {plans.length === 0 && <option value="">{'אין תכניות — הזן תב"ע קודם'}</option>}
              {plans.map((p) => (<option key={p.id} value={p.id}>{p.planNumber} - {p.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">נתוני מגרש</h4>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-foreground-muted">{'שטח מגרש (מ"ר)'}</label><input type="number" className="input-field w-full mt-1" value={form.plotSize || ''} onChange={(e) => update('plotSize', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{"רוחב (מ')"}</label><input type="number" className="input-field w-full mt-1" value={form.plotWidth || ''} onChange={(e) => update('plotWidth', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{"עומק (מ')"}</label><input type="number" className="input-field w-full mt-1" value={form.plotDepth || ''} onChange={(e) => update('plotDepth', parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">מצב קיים ומחירים</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-foreground-muted">קומות קיימות</label><input type="number" className="input-field w-full mt-1" value={form.existingFloors || ''} onChange={(e) => update('existingFloors', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'שטח בנוי (מ"ר)'}</label><input type="number" className="input-field w-full mt-1" value={form.existingArea || ''} onChange={(e) => update('existingArea', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'מחיר ממוצע למ"ר'}</label><input type="number" className="input-field w-full mt-1" value={form.avgPricePerSqm || ''} onChange={(e) => update('avgPricePerSqm', parseInt(e.target.value) || 0)} placeholder="40000" /></div>
          <div><label className="text-xs text-foreground-muted">{'עלות בנייה למ"ר'}</label><input type="number" className="input-field w-full mt-1" value={form.constructionCostPerSqm || ''} onChange={(e) => update('constructionCostPerSqm', parseInt(e.target.value) || 0)} placeholder="8000" /></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2"><Save className="w-4 h-4" />שמור כתובת</button>
        <button onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => isAdminAuthenticated());
  const [tab, setTab] = useState<AdminTab>('learn');
  const [plans, setPlans] = useState<ZoningPlan[]>(() => (isAdminAuthenticated() ? getAllPlans() : []));
  const [addresses, setAddresses] = useState<AddressMapping[]>(() => (isAdminAuthenticated() ? getAllAddresses() : []));
  const [documents, setDocuments] = useState<DocumentEntry[]>(() => (isAdminAuthenticated() ? getDocuments() : []));
  const [customPlanIds, setCustomPlanIds] = useState<Set<string>>(() => new Set(isAdminAuthenticated() ? getCustomPlans().map((p) => p.id) : []));
  const [customAddrs, setCustomAddrs] = useState<Set<string>>(() => new Set(isAdminAuthenticated() ? getCustomAddresses().map((a) => a.address) : []));
  const [editingPlan, setEditingPlan] = useState<ZoningPlan | null>(null);
  const [editingAddr, setEditingAddr] = useState<AddressMapping | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const addressImportRef = useRef<HTMLInputElement>(null);
  const [isImportingAddresses, setIsImportingAddresses] = useState(false);
  const [verifyingAddress, setVerifyingAddress] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setPlans(getAllPlans());
    setAddresses(getAllAddresses());
    setDocuments(getDocuments());
    setCustomPlanIds(new Set(getCustomPlans().map((p) => p.id)));
    setCustomAddrs(new Set(getCustomAddresses().map((a) => a.address)));
  }, []);

  if (!authenticated) return <LoginScreen onLogin={() => { setAuthenticated(true); refreshData(); }} />;

  const handleSavePlan = (plan: ZoningPlan) => { saveCustomPlan(plan); setShowForm(false); setEditingPlan(null); refreshData(); };
  const handleDeletePlan = (planId: string) => { if (!customPlanIds.has(planId)) return; deleteCustomPlan(planId); refreshData(); };
  const handleSaveAddr = (addr: AddressMapping) => { saveCustomAddress(addr); setShowForm(false); setEditingAddr(null); refreshData(); };
  const handleDeleteAddr = (address: string) => { if (!customAddrs.has(address)) return; deleteCustomAddress(address); refreshData(); };
  const handleLogout = () => { setAdminAuthenticated(false); setAuthenticated(false); };
  const handleImportAddresses = async (file: File) => {
    setIsImportingAddresses(true);
    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (rows.length === 0) return;

      const header = rows[0].split(',').map((c) => c.trim().toLowerCase());
      const dataRows = rows.slice(1);
      const findIndex = (key: string) => header.indexOf(key);

      const addressIdx = findIndex('address');
      const blockIdx = findIndex('block');
      const parcelIdx = findIndex('parcel');
      const plotSizeIdx = findIndex('plotsize');
      const existingAreaIdx = findIndex('existingarea');
      const existingFloorsIdx = findIndex('existingfloors');
      const existingUnitsIdx = findIndex('existingunits');
      const neighborhoodIdx = findIndex('neighborhood');

      dataRows.forEach((row) => {
        const cols = row.split(',').map((c) => c.trim());
        const address = cols[addressIdx] || '';
        if (!address) return;
        const mapping: AddressMapping = {
          address,
          block: cols[blockIdx] || '',
          parcel: cols[parcelIdx] || '',
          planId: plans[0]?.id || '',
          neighborhood: cols[neighborhoodIdx] || '',
          avgPricePerSqm: 0,
          constructionCostPerSqm: 0,
          plotSize: Number(cols[plotSizeIdx] || 0),
          plotWidth: 0,
          plotDepth: 0,
          existingArea: Number(cols[existingAreaIdx] || 0),
          existingFloors: Number(cols[existingFloorsIdx] || 0),
          existingUnits: Number(cols[existingUnitsIdx] || 0),
        };
        saveCustomAddress(mapping);
      });
      refreshData();
    } finally {
      setIsImportingAddresses(false);
      if (addressImportRef.current) addressImportRef.current.value = '';
    }
  };
  const handleVerifyAddress = async (addr: AddressMapping) => {
    setVerifyingAddress(addr.address);
    try {
      let nextMapping: AddressMapping = { ...addr };
      const parcelRes = await fetch(`/api/parcel?address=${encodeURIComponent(addr.address)}`);
      if (parcelRes.ok) {
        const parcelData = await parcelRes.json();
        if (parcelData.success && parcelData.data) {
          nextMapping = {
            ...nextMapping,
            block: String(parcelData.data.block || nextMapping.block),
            parcel: String(parcelData.data.parcel || nextMapping.parcel),
            plotSize: Number(parcelData.data.area || nextMapping.plotSize),
          };
        }
      }

      const permitsRes = await fetch(`/api/permits?block=${nextMapping.block}&parcel=${nextMapping.parcel}`);
      let verifiedSource: AddressMapping['verifiedSource'] | undefined;
      if (permitsRes.ok) {
        const permitData = await permitsRes.json();
        if (permitData.success && permitData.data) {
          nextMapping = {
            ...nextMapping,
            existingArea: Number(permitData.data.totalBuiltArea || nextMapping.existingArea),
            existingFloors: Number(permitData.data.floors || nextMapping.existingFloors),
            existingUnits: Number(permitData.data.units || nextMapping.existingUnits),
          };
          verifiedSource = permitData.source === 'rishui_zamin' ? 'rishui_zamin' : 'local_db';
        }
      }

      const gisRes = await fetch(`/api/building-file?block=${nextMapping.block}&parcel=${nextMapping.parcel}`);
      if (gisRes.ok) {
        const gisData = await gisRes.json();
        if (gisData.success && gisData.data && !verifiedSource) {
          nextMapping = {
            ...nextMapping,
            existingArea: Number(gisData.data.builtArea || nextMapping.existingArea),
            existingFloors: Number(gisData.data.floors || nextMapping.existingFloors),
            existingUnits: Number(gisData.data.units || nextMapping.existingUnits),
          };
          verifiedSource = gisData.source === 'raanana_gis' ? 'raanana_gis' : 'local_db';
        }
      }

      const verifiedAt = new Date().toISOString();
      const mappingToSave: AddressMapping = {
        ...nextMapping,
        verifiedAt,
        verifiedSource: verifiedSource ?? 'local_db',
      };
      saveCustomAddress(mappingToSave);
      refreshData();
    } finally {
      setVerifyingAddress(null);
    }
  };

  const learnedPlans = getCustomPlans();
  const filteredPlans = plans.filter((p) => !searchTerm || p.planNumber.includes(searchTerm) || p.name.includes(searchTerm) || (p.city && p.city.includes(searchTerm)));
  const filteredAddresses = addresses.filter((a) => !searchTerm || a.address.includes(searchTerm) || a.block.includes(searchTerm) || a.neighborhood.includes(searchTerm));

  const tabs: { key: AdminTab; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'learn', label: 'הזנת תב"ע', icon: BookOpen, count: learnedPlans.length },
    { key: 'plans', label: 'תכניות במערכת', icon: Building2, count: plans.length },
    { key: 'addresses', label: 'כתובות', icon: MapPin, count: addresses.length },
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
          <Link href="/" className="text-xs text-foreground-muted hover:text-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)]">חזרה לאתר</Link>
          <button onClick={handleLogout} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Knowledge base stats */}
      {learnedPlans.length > 0 && (
        <div className="db-card-green p-3 mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green" />
            <span className="text-sm text-green font-medium">
              {'המערכת למדה ' + learnedPlans.length + ' תכניות'}
            </span>
            <span className="text-xs text-foreground-muted">
              {' | ערים: ' + [...new Set(learnedPlans.map(p => p.city).filter(Boolean))].join(', ')}
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
        {/* ── Learn Tab ── */}
        {tab === 'learn' && (
          <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {showLearn ? (
              <LearnDocument onDone={() => { setShowLearn(false); refreshData(); }} />
            ) : (
              <>
                {/* Big upload button */}
                <button onClick={() => setShowLearn(true)} className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-base">
                  <Upload className="w-5 h-5" />
                  {'העלה תב"ע חדשה למערכת'}
                </button>

                {/* Learned documents list */}
                {documents.length === 0 && learnedPlans.length === 0 && (
                  <div className="db-card p-10 text-center">
                    <BookOpen className="w-12 h-12 text-foreground-muted mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-semibold mb-1">{'המערכת עדיין לא למדה תב"ע'}</h3>
                    <p className="text-sm text-foreground-muted mb-4">
                      {'לחץ "העלה תב"ע חדשה" כדי להזין מסמך. המערכת תנתח אותו ותשתמש בנתונים לניתוח כתובות.'}
                    </p>
                  </div>
                )}

                {/* List of learned plans */}
                {learnedPlans.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {'תכניות שהמערכת למדה (' + learnedPlans.length + ')'}
                    </h3>
                    {learnedPlans.map((plan) => (
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
                                {plan.buildingRights.mainBuildingPercent === 0 && plan.buildingRights.maxFloors === 0 && 'נתונים ידניים'}
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

        {/* ── Plans Tab ── */}
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

                {filteredPlans.length === 0 && <div className="db-card p-8 text-center text-foreground-muted">אין תכניות</div>}
                {filteredPlans.map((plan) => {
                  const isCustom = customPlanIds.has(plan.id);
                  const isExpanded = expandedPlan === plan.id;
                  return (
                    <div key={plan.id} className="db-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${isCustom ? 'bg-green' : 'bg-foreground-muted/30'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{plan.planNumber}</span>
                              {isCustom && <span className="badge badge-success text-[9px]">למד</span>}
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
                          {isCustom && (
                            <div className="flex gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                              <button onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); setShowForm(true); }} className="flex items-center gap-1 text-xs text-accent hover:underline"><Edit3 className="w-3 h-3" /> עריכה</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className="flex items-center gap-1 text-xs text-red-400 hover:underline"><Trash2 className="w-3 h-3" /> מחיקה</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}

        {/* ── Addresses Tab ── */}
        {tab === 'addresses' && (
          <motion.div key="addresses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {showForm ? (
              <AddressForm addr={editingAddr || undefined} plans={plans} onSave={handleSaveAddr} onCancel={() => { setShowForm(false); setEditingAddr(null); }} />
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input className="input-field w-full pr-10" placeholder="חיפוש..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => { setShowForm(true); setEditingAddr(null); }} className="btn-primary flex items-center gap-2 px-4">
                    <Plus className="w-4 h-4" />הוסף
                  </button>
                  <input
                    ref={addressImportRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImportAddresses(file);
                    }}
                  />
                  <button
                    onClick={() => addressImportRef.current?.click()}
                    className="btn-secondary flex items-center gap-2 px-4"
                    disabled={isImportingAddresses}
                  >
                    <Upload className="w-4 h-4" />
                    {isImportingAddresses ? 'מייבא כתובות...' : 'ייבוא CSV כתובות'}
                  </button>
                </div>
                <div className="text-[10px] text-foreground-muted mb-3">
                  פורמט CSV: address,block,parcel,plotSize,existingArea,existingFloors,existingUnits,neighborhood
                </div>

                {filteredAddresses.length === 0 && <div className="db-card p-8 text-center text-foreground-muted">אין כתובות תואמות</div>}
                {filteredAddresses.map((addr) => {
                  const isCustom = customAddrs.has(addr.address);
                  return (
                    <div key={addr.address} className="db-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <MapPin className={`w-4 h-4 flex-shrink-0 ${isCustom ? 'text-accent' : 'text-foreground-muted'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{addr.address}</span>
                              {isCustom && <span className="badge badge-accent text-[9px]">מותאם אישית</span>}
                              {addr.verifiedSource && (
                                <span className="badge badge-success text-[9px]">
                                  אומת ({addr.verifiedSource})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted">
                              גוש {addr.block} חלקה {addr.parcel} | {addr.neighborhood} | {addr.plotSize} {"מ\"ר"}
                            </p>
                            {addr.verifiedAt && (
                              <p className="text-[10px] text-foreground-muted">
                                עודכן: {new Date(addr.verifiedAt).toLocaleDateString('he-IL')}
                              </p>
                            )}
                          </div>
                        </div>
                        {isCustom && (
                          <div className="flex items-center gap-1 mr-2">
                            <button onClick={() => { setEditingAddr(addr); setShowForm(true); }} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteAddr(addr.address)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleVerifyAddress(addr)}
                          className="btn-secondary text-xs"
                          disabled={verifyingAddress === addr.address}
                        >
                          {verifyingAddress === addr.address ? 'מאמת נתונים...' : 'אמת נתונים'}
                        </button>
                      </div>
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
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">סטטיסטיקה</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-bold font-mono">{learnedPlans.length}</div>
            <div className="text-foreground-muted">{'תכניות שנלמדו'}</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono">{plans.length}</div>
            <div className="text-foreground-muted">{'סה"כ תכניות'}</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono">{addresses.length}</div>
            <div className="text-foreground-muted">כתובות</div>
          </div>
        </div>
      </div>
    </div>
  );
}
