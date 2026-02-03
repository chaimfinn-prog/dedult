'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, LogOut, Plus, Trash2, Edit3, Save, X,
  FileText, MapPin, Upload, Building2, ChevronDown, ChevronUp,
  Eye, Download, Check, AlertTriangle, Search, Cpu, CheckCircle2,
  XCircle, Loader2, Sparkles, RefreshCw,
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
  deleteDocument,
  DocumentEntry,
  ExtractedPlanData,
  documentTypeLabels,
  generateId,
  fileToBase64,
  createPlanFromExtractedData,
  autoSavePlanFromDocument,
} from '@/services/admin-storage';
import { parseDocument, type ParsedDocument, type ParsedField } from '@/services/document-parser';

type AdminTab = 'plans' | 'addresses' | 'documents';

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
      city: 'רעננה',
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

  const handleSave = () => {
    if (!form.planNumber || !form.name) return;
    onSave(form as ZoningPlan);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{plan ? 'עריכת תכנית' : 'הוספת תכנית חדשה'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg"><X className="w-5 h-5" /></button>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">פרטי התכנית</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-foreground-muted">מספר תכנית *</label><input className="input-field w-full mt-1" value={form.planNumber || ''} onChange={(e) => updateField('planNumber', e.target.value)} placeholder='רע/3000' /></div>
          <div><label className="text-xs text-foreground-muted">שם התכנית *</label><input className="input-field w-full mt-1" value={form.name || ''} onChange={(e) => updateField('name', e.target.value)} placeholder='תכנית מתאר...' /></div>
          <div><label className="text-xs text-foreground-muted">עיר</label><input className="input-field w-full mt-1" value={form.city || ''} onChange={(e) => updateField('city', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">שכונה</label><input className="input-field w-full mt-1" value={form.neighborhood || ''} onChange={(e) => updateField('neighborhood', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">תאריך אישור</label><input type="date" className="input-field w-full mt-1" value={form.approvalDate || ''} onChange={(e) => updateField('approvalDate', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">סוג ייעוד</label><select className="input-field w-full mt-1" value={form.zoningType || 'residential_a'} onChange={(e) => updateField('zoningType', e.target.value)}>
            <option value="residential_a">{"מגורים א'"}</option><option value="residential_b">{"מגורים ב'"}</option><option value="residential_c">{"מגורים ג'"}</option>
            <option value="mixed_use">שימוש מעורב</option><option value="commercial">מסחרי</option><option value="industrial">תעשייה</option><option value="public">ציבורי</option>
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
          <div><label className="text-xs text-foreground-muted">מרתף %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.basementPercent || ''} onChange={(e) => updateField('buildingRights.basementPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">גג %</label><input type="number" className="input-field w-full mt-1" value={form.buildingRights?.rooftopPercent || ''} onChange={(e) => updateField('buildingRights.rooftopPercent', parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">{'מגבלות וקווי בניין (מטרים)'}</h4>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-foreground-muted">קו בניין קדמי</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.frontSetback || ''} onChange={(e) => updateField('restrictions.frontSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">קו בניין אחורי</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.rearSetback || ''} onChange={(e) => updateField('restrictions.rearSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">קו בניין צידי</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.sideSetback || ''} onChange={(e) => updateField('restrictions.sideSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">חניות מינימום</label><input type="number" step="0.1" className="input-field w-full mt-1" value={form.restrictions?.minParkingSpaces || ''} onChange={(e) => updateField('restrictions.minParkingSpaces', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">שטח ירוק מינימום %</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.minGreenAreaPercent || ''} onChange={(e) => updateField('restrictions.minGreenAreaPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">תכסית מקסימלית %</label><input type="number" className="input-field w-full mt-1" value={form.restrictions?.maxLandCoverage || ''} onChange={(e) => updateField('restrictions.maxLandCoverage', parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">מסמך מקור</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-foreground-muted">שם המסמך</label><input className="input-field w-full mt-1" value={form.sourceDocument?.name || ''} onChange={(e) => updateField('sourceDocument.name', e.target.value)} placeholder='תקנון תב"ע...' /></div>
          <div><label className="text-xs text-foreground-muted">קישור (URL)</label><input className="input-field w-full mt-1" value={form.sourceDocument?.url || ''} onChange={(e) => updateField('sourceDocument.url', e.target.value)} placeholder="https://..." dir="ltr" /></div>
        </div>
      </div>

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
  const handleSave = () => { if (!form.address || !form.planId) return; onSave(form as AddressMapping); };

  return (
    <div className="space-y-6">
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
          <div><label className="text-xs text-foreground-muted">תכנית חלה *</label>
            <select className="input-field w-full mt-1" value={form.planId || ''} onChange={(e) => update('planId', e.target.value)}>
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
        <h4 className="font-semibold text-sm">מצב קיים</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-foreground-muted">קומות קיימות</label><input type="number" className="input-field w-full mt-1" value={form.existingFloors || ''} onChange={(e) => update('existingFloors', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'שטח בנוי (מ"ר)'}</label><input type="number" className="input-field w-full mt-1" value={form.existingArea || ''} onChange={(e) => update('existingArea', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'יח"ד קיימות'}</label><input type="number" className="input-field w-full mt-1" value={form.existingUnits || ''} onChange={(e) => update('existingUnits', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">שנת בנייה</label><input type="number" className="input-field w-full mt-1" value={form.yearBuilt || ''} onChange={(e) => update('yearBuilt', parseInt(e.target.value) || 0)} placeholder="1975" /></div>
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">{'נתוני שוק (₪ למ"ר)'}</h4>
        <div className="grid grid-cols-2 gap-3">
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

// ── Document Upload with Auto-Parsing ────────────────────────

function DocumentUpload({
  doc, onSave, onCancel, onCreatePlan, onAutoSaved,
}: {
  doc?: DocumentEntry;
  onSave: (doc: DocumentEntry) => void;
  onCancel: () => void;
  onCreatePlan: (data: ExtractedPlanData, docId: string) => void;
  onAutoSaved?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<DocumentEntry>>(
    doc || {
      id: generateId('doc'), name: '', planNumber: '', type: 'takkanon',
      description: '', uploadDate: new Date().toISOString().split('T')[0],
    }
  );
  const [fileName, setFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedDocument | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [autoSavedPlan, setAutoSavedPlan] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setParseError('');
    setParseResult(null);
    setAutoSavedPlan('');

    try {
      // Store file
      let dataUrl: string | undefined;
      if (file.size < 5 * 1024 * 1024) {
        dataUrl = await fileToBase64(file);
        setForm((prev) => ({
          ...prev, dataUrl, fileSize: file.size,
          name: prev?.name || file.name.replace(/\.[^.]+$/, ''),
        }));
      } else {
        setForm((prev) => ({
          ...prev, fileSize: file.size,
          name: prev?.name || file.name.replace(/\.[^.]+$/, ''),
        }));
      }

      setUploading(false);

      // Auto-parse the document
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setParsing(true);
        try {
          const result = await parseDocument(file);
          setParseResult(result);

          // Auto-fill extracted data into form
          if (result.extractedData) {
            const updatedForm: Partial<DocumentEntry> = {
              ...form,
              extractedData: result.extractedData,
              planNumber: result.extractedData.planNumber || form?.planNumber || '',
              pageCount: result.pages.length,
              name: form?.name || file.name.replace(/\.[^.]+$/, ''),
              uploadDate: new Date().toISOString().split('T')[0],
              fileSize: file.size,
              dataUrl,
            };

            setForm(updatedForm);

            // Auto-save: save the document and create a plan automatically
            if (result.matchedFields.length > 0) {
              const docToSave: DocumentEntry = {
                id: updatedForm.id || generateId('doc'),
                name: updatedForm.name || file.name,
                planNumber: updatedForm.planNumber || '',
                type: updatedForm.type || 'takkanon',
                description: updatedForm.description || '',
                uploadDate: updatedForm.uploadDate || new Date().toISOString().split('T')[0],
                fileSize: file.size,
                pageCount: result.pages.length,
                dataUrl,
                extractedData: result.extractedData,
              };

              // Save document
              saveDocument(docToSave);

              // Auto-create plan from extracted data
              const savedPlan = autoSavePlanFromDocument(docToSave);
              if (savedPlan) {
                setAutoSavedPlan(savedPlan.planNumber || savedPlan.name || 'תכנית חדשה');
                onAutoSaved?.();
              }
            }
          }
        } catch (err) {
          console.error('Parse error:', err);
          setParseError('שגיאה בניתוח המסמך — ניתן למלא נתונים ידנית');
        } finally {
          setParsing(false);
        }
      }
    } catch {
      console.error('File read failed');
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.name || !form.planNumber) return;
    onSave(form as DocumentEntry);
  };

  const handleCreatePlanFromData = () => {
    if (form.extractedData && form.id) {
      onCreatePlan(form.extractedData, form.id!);
    }
  };

  const updateExtracted = (key: keyof ExtractedPlanData, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      extractedData: { ...prev?.extractedData, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{doc ? 'עריכת מסמך' : 'העלאת מסמך חדש'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg"><X className="w-5 h-5" /></button>
      </div>

      {/* File Upload Area */}
      <div
        className="db-card p-8 border-2 border-dashed border-[rgba(255,255,255,0.1)] text-center cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-foreground-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>מעלה...</span>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 text-green">
            <Check className="w-5 h-5" />
            <span className="text-sm">{fileName}</span>
            {form.fileSize && <span className="text-xs text-foreground-muted">({(form.fileSize / 1024).toFixed(0)} KB)</span>}
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm text-foreground-muted">{'לחץ להעלאת קובץ תב"ע (PDF, DOC, תמונה)'}</p>
            <p className="text-xs text-foreground-muted mt-1">{'המערכת תנתח את המסמך ותחלץ נתונים אוטומטית'}</p>
          </>
        )}
      </div>

      {/* Parsing Status */}
      {parsing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="db-card-accent p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-accent animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-accent">מנתח מסמך...</div>
              <div className="text-xs text-foreground-muted">מחלץ טקסט ומזהה פרמטרי בנייה</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)]">
            <div className="h-full parser-progress rounded-full" style={{ width: '70%' }} />
          </div>
        </motion.div>
      )}

      {parseError && (
        <div className="db-card p-3 border border-[rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-2 text-sm text-gold">
            <AlertTriangle className="w-4 h-4" />
            <span>{parseError}</span>
          </div>
        </div>
      )}

      {/* Parse Results */}
      {parseResult && !parsing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="db-card-green p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green" />
              <span className="text-sm font-semibold text-green">נתונים זוהו אוטומטית</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-success">{parseResult.confidence}% ודאות</span>
              <span className="text-xs text-foreground-muted">{parseResult.matchedFields.length} שדות</span>
            </div>
          </div>

          {parseResult.matchedFields.length > 0 ? (
            <div className="space-y-1.5">
              {parseResult.matchedFields.map((field: ParsedField, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green flex-shrink-0" />
                    <span className="text-foreground-secondary">{field.label}:</span>
                    <span className="font-semibold font-mono">{String(field.value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {field.pageNumber && <span className="text-foreground-muted">עמוד {field.pageNumber}</span>}
                    <span className="badge badge-success text-[9px]">{field.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-foreground-muted text-center py-2">
              <XCircle className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
              {'לא נמצאו נתונים אוטומטית — ניתן למלא ידנית למטה'}
            </div>
          )}

          {autoSavedPlan ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">
              <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" />
              <span className="text-xs text-green font-medium">
                {'תכנית "' + autoSavedPlan + '" נוצרה והוזנה למערכת אוטומטית'}
              </span>
            </div>
          ) : parseResult.matchedFields.length > 0 ? (
            <button onClick={handleCreatePlanFromData} className="btn-green w-full flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              {'צור תכנית אוטומטית מהנתונים שזוהו'}
            </button>
          ) : null}
        </motion.div>
      )}

      {/* Document Info */}
      <div className="db-card p-4 space-y-3">
        <h4 className="font-semibold text-sm">פרטי המסמך</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-foreground-muted">שם המסמך *</label><input className="input-field w-full mt-1" value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder='תקנון תב"ע רע/3000' /></div>
          <div><label className="text-xs text-foreground-muted">מספר תכנית *</label><input className="input-field w-full mt-1" value={form.planNumber || ''} onChange={(e) => setForm((p) => ({ ...p, planNumber: e.target.value }))} placeholder="רע/3000" /></div>
          <div><label className="text-xs text-foreground-muted">סוג מסמך</label>
            <select className="input-field w-full mt-1" value={form.type || 'takkanon'} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as DocumentEntry['type'] }))}>
              {Object.entries(documentTypeLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
          </div>
          <div className="col-span-2"><label className="text-xs text-foreground-muted">תיאור</label><textarea className="input-field w-full mt-1 h-20 resize-none" value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="תיאור קצר של המסמך..." /></div>
          <div className="col-span-2"><label className="text-xs text-foreground-muted">קישור חיצוני (אופציונלי)</label><input className="input-field w-full mt-1" value={form.externalUrl || ''} onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))} placeholder="https://mavat.iplan.gov.il/..." dir="ltr" /></div>
        </div>
      </div>

      {/* Extracted Data (Editable) */}
      <div className="db-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm">{'נתוני תב"ע מהמסמך'}</h4>
          {parseResult && parseResult.matchedFields.length > 0 ? (
            <span className="badge badge-success text-[9px]">מולא אוטומטית</span>
          ) : (
            <span className="badge badge-accent text-[9px]">מילוי ידני</span>
          )}
        </div>
        <p className="text-xs text-foreground-muted">
          {'נתונים אלה מוזנים למערכת ומשמשים לניתוח זכויות הבנייה. ערוך לפי הצורך.'}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-foreground-muted">מספר תכנית</label><input className="input-field w-full mt-1" value={form.extractedData?.planNumber || ''} onChange={(e) => updateExtracted('planNumber', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">שם תכנית</label><input className="input-field w-full mt-1" value={form.extractedData?.planName || ''} onChange={(e) => updateExtracted('planName', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">עיר</label><input className="input-field w-full mt-1" value={form.extractedData?.city || ''} onChange={(e) => updateExtracted('city', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">שכונה</label><input className="input-field w-full mt-1" value={form.extractedData?.neighborhood || ''} onChange={(e) => updateExtracted('neighborhood', e.target.value)} /></div>
          <div><label className="text-xs text-foreground-muted">אחוזי בנייה עיקריים %</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.mainBuildingPercent || ''} onChange={(e) => updateExtracted('mainBuildingPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">שטחי שירות %</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.serviceBuildingPercent || ''} onChange={(e) => updateExtracted('serviceBuildingPercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">קומות מרבי</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.maxFloors || ''} onChange={(e) => updateExtracted('maxFloors', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{"גובה מרבי (מ')"}</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.maxHeight || ''} onChange={(e) => updateExtracted('maxHeight', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">{'יח"ד מרבי'}</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.maxUnits || ''} onChange={(e) => updateExtracted('maxUnits', parseInt(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">תכסית %</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.landCoveragePercent || ''} onChange={(e) => updateExtracted('landCoveragePercent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">קו בניין קדמי</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.frontSetback || ''} onChange={(e) => updateExtracted('frontSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">קו בניין אחורי</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.rearSetback || ''} onChange={(e) => updateExtracted('rearSetback', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="text-xs text-foreground-muted">קו בניין צידי</label><input type="number" className="input-field w-full mt-1" value={form.extractedData?.sideSetback || ''} onChange={(e) => updateExtracted('sideSetback', parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2"><Save className="w-4 h-4" />שמור מסמך</button>
        <button onClick={onCancel} className="btn-secondary flex-1">ביטול</button>
      </div>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<AdminTab>('documents');
  const [plans, setPlans] = useState<ZoningPlan[]>([]);
  const [addresses, setAddresses] = useState<AddressMapping[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [customPlanIds, setCustomPlanIds] = useState<Set<string>>(new Set());
  const [customAddrs, setCustomAddrs] = useState<Set<string>>(new Set());
  const [editingPlan, setEditingPlan] = useState<ZoningPlan | null>(null);
  const [editingAddr, setEditingAddr] = useState<AddressMapping | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = useCallback(() => {
    setPlans(getAllPlans());
    setAddresses(getAllAddresses());
    setDocuments(getDocuments());
    setCustomPlanIds(new Set(getCustomPlans().map((p) => p.id)));
    setCustomAddrs(new Set(getCustomAddresses().map((a) => a.address)));
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated()) setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (authenticated) refreshData();
  }, [authenticated, refreshData]);

  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;

  const handleSavePlan = (plan: ZoningPlan) => { saveCustomPlan(plan); setShowForm(false); setEditingPlan(null); refreshData(); };
  const handleDeletePlan = (planId: string) => { if (!customPlanIds.has(planId)) return; deleteCustomPlan(planId); refreshData(); };
  const handleSaveAddr = (addr: AddressMapping) => { saveCustomAddress(addr); setShowForm(false); setEditingAddr(null); refreshData(); };
  const handleDeleteAddr = (address: string) => { if (!customAddrs.has(address)) return; deleteCustomAddress(address); refreshData(); };
  const handleSaveDoc = (doc: DocumentEntry) => { saveDocument(doc); setShowForm(false); setEditingDoc(null); refreshData(); };
  const handleAutoSaveNotify = () => { refreshData(); };
  const handleDeleteDoc = (docId: string) => { deleteDocument(docId); refreshData(); };
  const handleLogout = () => { setAdminAuthenticated(false); setAuthenticated(false); };

  const handleCreatePlanFromDoc = (data: ExtractedPlanData, docId: string) => {
    const planData = createPlanFromExtractedData(data, docId);
    saveCustomPlan(planData as ZoningPlan);
    refreshData();
    setTab('plans');
    setShowForm(false);
  };

  const filteredPlans = plans.filter((p) => !searchTerm || p.planNumber.includes(searchTerm) || p.name.includes(searchTerm) || p.neighborhood.includes(searchTerm));
  const filteredAddresses = addresses.filter((a) => !searchTerm || a.address.includes(searchTerm) || a.block.includes(searchTerm) || a.neighborhood.includes(searchTerm));
  const filteredDocs = documents.filter((d) => !searchTerm || d.name.includes(searchTerm) || d.planNumber.includes(searchTerm));

  const tabs: { key: AdminTab; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'documents', label: 'מסמכים', icon: FileText, count: documents.length },
    { key: 'plans', label: 'תכניות', icon: Building2, count: plans.length },
    { key: 'addresses', label: 'כתובות', icon: MapPin, count: addresses.length },
  ];

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ניהול מערכת</h1>
            <p className="text-xs text-foreground-muted">{'העלאת מסמכי תב"ע — המערכת מנתחת ולומדת אוטומטית'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className="text-xs text-foreground-muted hover:text-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)]">חזרה לאתר</a>
          <button onClick={handleLogout} className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* How it works banner */}
      <div className="db-card-accent p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-accent mb-1">איך זה עובד?</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              {'1. העלה קובץ תב"ע (PDF) בלשונית "מסמכים" → '}
              {'2. המערכת מנתחת את המסמך ומחלצת נתונים (אחוזי בנייה, קומות, תכסית, קווי בניין) → '}
              {'3. לחץ "צור תכנית אוטומטית" או ערוך ידנית → '}
              {'4. הנתונים מוזנים למערכת ומשמשים לניתוח כתובות'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 db-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); setSearchTerm(''); }}
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

      {/* Search + Add */}
      {!showForm && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input className="input-field w-full pr-10" placeholder="חיפוש..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingPlan(null); setEditingAddr(null); setEditingDoc(null); }}
            className="btn-primary flex items-center gap-2 px-4"
          >
            <Plus className="w-4 h-4" />
            הוסף
          </button>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {tab === 'plans' && <PlanForm plan={editingPlan || undefined} onSave={handleSavePlan} onCancel={() => { setShowForm(false); setEditingPlan(null); }} />}
            {tab === 'addresses' && <AddressForm addr={editingAddr || undefined} plans={plans} onSave={handleSaveAddr} onCancel={() => { setShowForm(false); setEditingAddr(null); }} />}
            {tab === 'documents' && <DocumentUpload doc={editingDoc || undefined} onSave={handleSaveDoc} onCancel={() => { setShowForm(false); setEditingDoc(null); }} onCreatePlan={handleCreatePlanFromDoc} onAutoSaved={handleAutoSaveNotify} />}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {/* Plans List */}
            {tab === 'plans' && (
              <>
                {filteredPlans.length === 0 && <div className="db-card p-8 text-center text-foreground-muted">אין תכניות תואמות</div>}
                {filteredPlans.map((plan) => {
                  const isCustom = customPlanIds.has(plan.id);
                  const isExpanded = expandedPlan === plan.id;
                  return (
                    <div key={plan.id} className="db-card overflow-hidden">
                      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${isCustom ? 'bg-accent' : 'bg-foreground-muted/30'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{plan.planNumber}</span>
                              {isCustom && <span className="badge badge-accent text-[9px]">מותאם אישית</span>}
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

            {/* Addresses List */}
            {tab === 'addresses' && (
              <>
                {filteredAddresses.length === 0 && <div className="db-card p-8 text-center text-foreground-muted">אין כתובות תואמות</div>}
                {filteredAddresses.map((addr) => {
                  const isCustom = customAddrs.has(addr.address);
                  return (
                    <div key={addr.address} className="db-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <MapPin className={`w-4 h-4 flex-shrink-0 ${isCustom ? 'text-accent' : 'text-foreground-muted'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{addr.address}</span>
                              {isCustom && <span className="badge badge-accent text-[9px]">מותאם אישית</span>}
                            </div>
                            <p className="text-xs text-foreground-muted">
                              גוש {addr.block} חלקה {addr.parcel} | {addr.neighborhood} | {addr.plotSize} {"מ\"ר"}
                              {addr.yearBuilt ? ` | ${addr.yearBuilt}` : ''}
                            </p>
                          </div>
                        </div>
                        {isCustom && (
                          <div className="flex items-center gap-1 mr-2">
                            <button onClick={() => { setEditingAddr(addr); setShowForm(true); }} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteAddr(addr.address)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Documents List */}
            {tab === 'documents' && (
              <>
                {filteredDocs.length === 0 && (
                  <div className="db-card p-8 text-center text-foreground-muted">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{'אין מסמכים. לחץ "הוסף" כדי להעלות תב"ע.'}</p>
                    <p className="text-xs mt-1 text-foreground-muted">{'המערכת תנתח את המסמך ותחלץ נתונים אוטומטית'}</p>
                  </div>
                )}
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="db-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-sm block truncate">{doc.name}</span>
                          <p className="text-xs text-foreground-muted">
                            {doc.planNumber} | {documentTypeLabels[doc.type]}
                            {doc.pageCount ? ` | ${doc.pageCount} עמודים` : ''}
                            {doc.fileSize ? ` | ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                          </p>
                          {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-green" />
                              <span className="text-[10px] text-green">נתונים מנותחים</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mr-2">
                        {doc.dataUrl && (
                          <a href={doc.dataUrl} download={`${doc.name}.pdf`} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent" onClick={(e) => e.stopPropagation()}>
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {doc.externalUrl && (
                          <a href={doc.externalUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => { setEditingDoc(doc); setShowForm(true); }} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-accent"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 hover:bg-[rgba(255,255,255,0.04)] rounded-lg text-foreground-muted hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="text-lg font-bold font-mono">{documents.length}</div>
            <div className="text-foreground-muted">מסמכים</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono">{plans.length}</div>
            <div className="text-foreground-muted">תכניות ({getCustomPlans().length} מותאמות)</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono">{addresses.length}</div>
            <div className="text-foreground-muted">כתובות ({getCustomAddresses().length} מותאמות)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
