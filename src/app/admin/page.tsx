'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, LogOut, Plus, Trash2, Edit3, Save, X,
  FileText, MapPin, Upload, Building2, ChevronDown, ChevronUp,
  Eye, Download, Check, AlertTriangle, Search
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
  documentTypeLabels,
  generateId,
  fileToBase64,
} from '@/services/admin-storage';

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
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">ניהול מערכת</h1>
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
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full">
              כניסה
            </button>
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
        mainBuildingPercent: 0,
        serviceBuildingPercent: 0,
        totalBuildingPercent: 0,
        maxFloors: 0,
        maxHeight: 0,
        maxUnits: 0,
        basementAllowed: true,
        basementPercent: 0,
        rooftopPercent: 0,
        landCoveragePercent: 0,
        floorAllocations: [],
        citations: [],
      },
      restrictions: {
        frontSetback: 0,
        rearSetback: 0,
        sideSetback: 0,
        minParkingSpaces: 1.5,
        minGreenAreaPercent: 30,
        maxLandCoverage: 0,
      },
      sourceDocument: {
        name: '',
        url: '',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    }
  );

  const updateField = (path: string, value: string | number | boolean) => {
    setForm((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      // Auto-calculate total
      if (path.startsWith('buildingRights.main') || path.startsWith('buildingRights.service')) {
        copy.buildingRights.totalBuildingPercent =
          (copy.buildingRights.mainBuildingPercent || 0) +
          (copy.buildingRights.serviceBuildingPercent || 0);
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
        <h3 className="text-lg font-bold text-foreground">
          {plan ? 'עריכת תכנית' : 'הוספת תכנית חדשה'}
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-foreground/5 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">פרטי התכנית</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">מספר תכנית *</label>
            <input
              className="input-field w-full mt-1"
              value={form.planNumber || ''}
              onChange={(e) => updateField('planNumber', e.target.value)}
              placeholder='רע/3000'
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שם התכנית *</label>
            <input
              className="input-field w-full mt-1"
              value={form.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder='תכנית מתאר מקומית...'
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">עיר</label>
            <input
              className="input-field w-full mt-1"
              value={form.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שכונה</label>
            <input
              className="input-field w-full mt-1"
              value={form.neighborhood || ''}
              onChange={(e) => updateField('neighborhood', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">תאריך אישור</label>
            <input
              type="date"
              className="input-field w-full mt-1"
              value={form.approvalDate || ''}
              onChange={(e) => updateField('approvalDate', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">סוג ייעוד</label>
            <select
              className="input-field w-full mt-1"
              value={form.zoningType || 'residential_a'}
              onChange={(e) => updateField('zoningType', e.target.value)}
            >
              <option value="residential_a">{"מגורים א'"}</option>
              <option value="residential_b">{"מגורים ב'"}</option>
              <option value="residential_c">{"מגורים ג'"}</option>
              <option value="mixed_use">שימוש מעורב</option>
              <option value="commercial">מסחרי</option>
              <option value="industrial">תעשייה</option>
              <option value="public">ציבורי</option>
            </select>
          </div>
        </div>
      </div>

      {/* Building Rights */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">זכויות בנייה</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">אחוזי בנייה עיקריים %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.mainBuildingPercent || ''}
              onChange={(e) => updateField('buildingRights.mainBuildingPercent', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שטחי שירות %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.serviceBuildingPercent || ''}
              onChange={(e) => updateField('buildingRights.serviceBuildingPercent', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">סה"כ %</label>
            <input
              type="number"
              className="input-field w-full mt-1 opacity-60"
              value={form.buildingRights?.totalBuildingPercent || ''}
              readOnly
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">קומות מרבי</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.maxFloors || ''}
              onChange={(e) => updateField('buildingRights.maxFloors', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'גובה מרבי (מ\')'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.maxHeight || ''}
              onChange={(e) => updateField('buildingRights.maxHeight', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'יח"ד מרבי'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.maxUnits || ''}
              onChange={(e) => updateField('buildingRights.maxUnits', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">תכסית %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.landCoveragePercent || ''}
              onChange={(e) => updateField('buildingRights.landCoveragePercent', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">מרתף %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.basementPercent || ''}
              onChange={(e) => updateField('buildingRights.basementPercent', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">גג %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.buildingRights?.rooftopPercent || ''}
              onChange={(e) => updateField('buildingRights.rooftopPercent', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Restrictions / Setbacks */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">{'מגבלות וקווי בניין (מטרים)'}</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">קו בניין קדמי</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.restrictions?.frontSetback || ''}
              onChange={(e) => updateField('restrictions.frontSetback', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">קו בניין אחורי</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.restrictions?.rearSetback || ''}
              onChange={(e) => updateField('restrictions.rearSetback', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">קו בניין צידי</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.restrictions?.sideSetback || ''}
              onChange={(e) => updateField('restrictions.sideSetback', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">חניות מינימום</label>
            <input
              type="number"
              step="0.1"
              className="input-field w-full mt-1"
              value={form.restrictions?.minParkingSpaces || ''}
              onChange={(e) => updateField('restrictions.minParkingSpaces', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שטח ירוק מינימום %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.restrictions?.minGreenAreaPercent || ''}
              onChange={(e) => updateField('restrictions.minGreenAreaPercent', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">תכסית מקסימלית %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.restrictions?.maxLandCoverage || ''}
              onChange={(e) => updateField('restrictions.maxLandCoverage', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Source Document */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">מסמך מקור</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">שם המסמך</label>
            <input
              className="input-field w-full mt-1"
              value={form.sourceDocument?.name || ''}
              onChange={(e) => updateField('sourceDocument.name', e.target.value)}
              placeholder='תקנון תב"ע...'
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">קישור (URL)</label>
            <input
              className="input-field w-full mt-1"
              value={form.sourceDocument?.url || ''}
              onChange={(e) => updateField('sourceDocument.url', e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          שמור תכנית
        </button>
        <button onClick={onCancel} className="btn-secondary flex-1">
          ביטול
        </button>
      </div>
    </div>
  );
}

// ── Address Form ─────────────────────────────────────────────

function AddressForm({
  addr,
  plans,
  onSave,
  onCancel,
}: {
  addr?: AddressMapping;
  plans: ZoningPlan[];
  onSave: (addr: AddressMapping) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<AddressMapping>>(
    addr || {
      address: '',
      block: '',
      parcel: '',
      planId: plans[0]?.id || '',
      neighborhood: '',
      avgPricePerSqm: 0,
      constructionCostPerSqm: 8000,
      plotSize: 0,
      plotWidth: 0,
      plotDepth: 0,
      existingFloors: 0,
      existingArea: 0,
      existingUnits: 0,
    }
  );

  const update = (key: keyof AddressMapping, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!form.address || !form.planId) return;
    onSave(form as AddressMapping);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          {addr ? 'עריכת כתובת' : 'הוספת כתובת חדשה'}
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-foreground/5 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">מיקום</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-foreground-muted">כתובת מלאה *</label>
            <input
              className="input-field w-full mt-1"
              value={form.address || ''}
              onChange={(e) => update('address', e.target.value)}
              placeholder="רחוב הרצל 15, רעננה"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">גוש</label>
            <input
              className="input-field w-full mt-1"
              value={form.block || ''}
              onChange={(e) => update('block', e.target.value)}
              placeholder="6573"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">חלקה</label>
            <input
              className="input-field w-full mt-1"
              value={form.parcel || ''}
              onChange={(e) => update('parcel', e.target.value)}
              placeholder="45"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שכונה</label>
            <input
              className="input-field w-full mt-1"
              value={form.neighborhood || ''}
              onChange={(e) => update('neighborhood', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">תכנית חלה *</label>
            <select
              className="input-field w-full mt-1"
              value={form.planId || ''}
              onChange={(e) => update('planId', e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.planNumber} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">נתוני מגרש</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">{'שטח מגרש (מ"ר)'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.plotSize || ''}
              onChange={(e) => update('plotSize', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'רוחב (מ\')'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.plotWidth || ''}
              onChange={(e) => update('plotWidth', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'עומק (מ\')'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.plotDepth || ''}
              onChange={(e) => update('plotDepth', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">מצב קיים</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">קומות קיימות</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.existingFloors || ''}
              onChange={(e) => update('existingFloors', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'שטח בנוי (מ"ר)'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.existingArea || ''}
              onChange={(e) => update('existingArea', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'יח"ד קיימות'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.existingUnits || ''}
              onChange={(e) => update('existingUnits', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שנת בנייה</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.yearBuilt || ''}
              onChange={(e) => update('yearBuilt', parseInt(e.target.value) || 0)}
              placeholder="1975"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">{'נתוני שוק (₪ למ"ר)'}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">{'מחיר ממוצע למ"ר'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.avgPricePerSqm || ''}
              onChange={(e) => update('avgPricePerSqm', parseInt(e.target.value) || 0)}
              placeholder="40000"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'עלות בנייה למ"ר'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.constructionCostPerSqm || ''}
              onChange={(e) => update('constructionCostPerSqm', parseInt(e.target.value) || 0)}
              placeholder="8000"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          שמור כתובת
        </button>
        <button onClick={onCancel} className="btn-secondary flex-1">
          ביטול
        </button>
      </div>
    </div>
  );
}

// ── Document Upload ──────────────────────────────────────────

function DocumentUpload({
  doc,
  onSave,
  onCancel,
}: {
  doc?: DocumentEntry;
  onSave: (doc: DocumentEntry) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<DocumentEntry>>(
    doc || {
      id: generateId('doc'),
      name: '',
      planNumber: '',
      type: 'takkanon',
      description: '',
      uploadDate: new Date().toISOString().split('T')[0],
    }
  );
  const [fileName, setFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);

    try {
      // For files under 5MB, store as base64
      if (file.size < 5 * 1024 * 1024) {
        const dataUrl = await fileToBase64(file);
        setForm((prev) => ({
          ...prev,
          dataUrl,
          fileSize: file.size,
          name: prev?.name || file.name.replace(/\.[^.]+$/, ''),
        }));
      } else {
        // Large files - just store metadata
        setForm((prev) => ({
          ...prev,
          fileSize: file.size,
          name: prev?.name || file.name.replace(/\.[^.]+$/, ''),
        }));
      }
    } catch {
      console.error('File read failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.name || !form.planNumber) return;
    onSave(form as DocumentEntry);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          {doc ? 'עריכת מסמך' : 'העלאת מסמך חדש'}
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-foreground/5 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* File Upload */}
      <div
        className="glass-card p-8 rounded-xl border-2 border-dashed border-foreground/20 text-center cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileSelect}
        />
        {uploading ? (
          <div className="animate-pulse text-foreground-muted">מעלה...</div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 text-accent">
            <Check className="w-5 h-5" />
            <span className="text-sm">{fileName}</span>
            {form.fileSize && (
              <span className="text-xs text-foreground-muted">
                ({(form.fileSize / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm text-foreground-muted">
              לחץ להעלאת קובץ (PDF, DOC, תמונה)
            </p>
            <p className="text-xs text-foreground-muted mt-1">עד 5MB</p>
          </>
        )}
      </div>

      {/* Document Info */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-foreground text-sm">פרטי המסמך</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-foreground-muted">שם המסמך *</label>
            <input
              className="input-field w-full mt-1"
              value={form.name || ''}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder='תקנון תב"ע רע/3000'
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">מספר תכנית *</label>
            <input
              className="input-field w-full mt-1"
              value={form.planNumber || ''}
              onChange={(e) => setForm((p) => ({ ...p, planNumber: e.target.value }))}
              placeholder="רע/3000"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">סוג מסמך</label>
            <select
              className="input-field w-full mt-1"
              value={form.type || 'takkanon'}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as DocumentEntry['type'] }))}
            >
              {Object.entries(documentTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-foreground-muted">תיאור</label>
            <textarea
              className="input-field w-full mt-1 h-20 resize-none"
              value={form.description || ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="תיאור קצר של המסמך..."
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-foreground-muted">קישור חיצוני (אופציונלי)</label>
            <input
              className="input-field w-full mt-1"
              value={form.externalUrl || ''}
              onChange={(e) => setForm((p) => ({ ...p, externalUrl: e.target.value }))}
              placeholder="https://mavat.iplan.gov.il/..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">מספר עמודים</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.pageCount || ''}
              onChange={(e) => setForm((p) => ({ ...p, pageCount: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </div>

      {/* Extracted Data (Manual Entry) */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground text-sm">נתונים מהמסמך (מילוי ידני)</h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent">אופציונלי</span>
        </div>
        <p className="text-xs text-foreground-muted">
          מלא את הנתונים העיקריים מתוך המסמך. נתונים אלו ישמשו ליצירת תכנית אוטומטית.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-foreground-muted">אחוזי בנייה עיקריים %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.extractedData?.mainBuildingPercent || ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  extractedData: {
                    ...p?.extractedData,
                    mainBuildingPercent: parseFloat(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">שטחי שירות %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.extractedData?.serviceBuildingPercent || ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  extractedData: {
                    ...p?.extractedData,
                    serviceBuildingPercent: parseFloat(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">קומות מרבי</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.extractedData?.maxFloors || ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  extractedData: {
                    ...p?.extractedData,
                    maxFloors: parseInt(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">{'גובה מרבי (מ\')'}</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.extractedData?.maxHeight || ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  extractedData: {
                    ...p?.extractedData,
                    maxHeight: parseFloat(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted">תכסית %</label>
            <input
              type="number"
              className="input-field w-full mt-1"
              value={form.extractedData?.landCoveragePercent || ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  extractedData: {
                    ...p?.extractedData,
                    landCoveragePercent: parseFloat(e.target.value) || 0,
                  },
                }))
              }
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          שמור מסמך
        </button>
        <button onClick={onCancel} className="btn-secondary flex-1">
          ביטול
        </button>
      </div>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<AdminTab>('plans');
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
    if (isAdminAuthenticated()) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) refreshData();
  }, [authenticated, refreshData]);

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  const handleSavePlan = (plan: ZoningPlan) => {
    saveCustomPlan(plan);
    setShowForm(false);
    setEditingPlan(null);
    refreshData();
  };

  const handleDeletePlan = (planId: string) => {
    if (!customPlanIds.has(planId)) return;
    deleteCustomPlan(planId);
    refreshData();
  };

  const handleSaveAddr = (addr: AddressMapping) => {
    saveCustomAddress(addr);
    setShowForm(false);
    setEditingAddr(null);
    refreshData();
  };

  const handleDeleteAddr = (address: string) => {
    if (!customAddrs.has(address)) return;
    deleteCustomAddress(address);
    refreshData();
  };

  const handleSaveDoc = (doc: DocumentEntry) => {
    saveDocument(doc);
    setShowForm(false);
    setEditingDoc(null);
    refreshData();
  };

  const handleDeleteDoc = (docId: string) => {
    deleteDocument(docId);
    refreshData();
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setAuthenticated(false);
  };

  const filteredPlans = plans.filter(
    (p) =>
      !searchTerm ||
      p.planNumber.includes(searchTerm) ||
      p.name.includes(searchTerm) ||
      p.neighborhood.includes(searchTerm)
  );

  const filteredAddresses = addresses.filter(
    (a) =>
      !searchTerm ||
      a.address.includes(searchTerm) ||
      a.block.includes(searchTerm) ||
      a.neighborhood.includes(searchTerm)
  );

  const filteredDocs = documents.filter(
    (d) =>
      !searchTerm ||
      d.name.includes(searchTerm) ||
      d.planNumber.includes(searchTerm)
  );

  const tabs: { key: AdminTab; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'plans', label: 'תכניות', icon: Building2, count: plans.length },
    { key: 'addresses', label: 'כתובות', icon: MapPin, count: addresses.length },
    { key: 'documents', label: 'מסמכים', icon: FileText, count: documents.length },
  ];

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ניהול מערכת</h1>
            <p className="text-xs text-foreground-muted">{'הוספת תב"עות, כתובות ומסמכים'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="text-xs text-foreground-muted hover:text-accent transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/5"
          >
            חזרה לאתר
          </a>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 glass-card p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); setSearchTerm(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-accent/10 text-accent'
                : 'text-foreground-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-accent/20' : 'bg-foreground/10'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Add */}
      {!showForm && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              className="input-field w-full pr-10"
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {tab === 'plans' && (
              <PlanForm
                plan={editingPlan || undefined}
                onSave={handleSavePlan}
                onCancel={() => { setShowForm(false); setEditingPlan(null); }}
              />
            )}
            {tab === 'addresses' && (
              <AddressForm
                addr={editingAddr || undefined}
                plans={plans}
                onSave={handleSaveAddr}
                onCancel={() => { setShowForm(false); setEditingAddr(null); }}
              />
            )}
            {tab === 'documents' && (
              <DocumentUpload
                doc={editingDoc || undefined}
                onSave={handleSaveDoc}
                onCancel={() => { setShowForm(false); setEditingDoc(null); }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {/* Plans List */}
            {tab === 'plans' && (
              <>
                {filteredPlans.length === 0 && (
                  <div className="glass-card p-8 rounded-xl text-center text-foreground-muted">
                    אין תכניות תואמות
                  </div>
                )}
                {filteredPlans.map((plan) => {
                  const isCustom = customPlanIds.has(plan.id);
                  const isExpanded = expandedPlan === plan.id;
                  return (
                    <div key={plan.id} className="glass-card rounded-xl overflow-hidden">
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-foreground/5 transition-colors"
                        onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${isCustom ? 'bg-accent' : 'bg-foreground/30'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{plan.planNumber}</span>
                              {isCustom && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">מותאם אישית</span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted truncate">{plan.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-xs text-foreground-muted">
                            {plan.buildingRights.totalBuildingPercent}% | {plan.buildingRights.maxFloors} קומות
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-foreground/10 p-4 space-y-3">
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div><span className="text-foreground-muted">עיר:</span> <span className="text-foreground">{plan.city}</span></div>
                            <div><span className="text-foreground-muted">שכונה:</span> <span className="text-foreground">{plan.neighborhood}</span></div>
                            <div><span className="text-foreground-muted">סטטוס:</span> <span className="text-foreground">{plan.status}</span></div>
                            <div><span className="text-foreground-muted">עיקרי:</span> <span className="text-foreground">{plan.buildingRights.mainBuildingPercent}%</span></div>
                            <div><span className="text-foreground-muted">שירות:</span> <span className="text-foreground">{plan.buildingRights.serviceBuildingPercent}%</span></div>
                            <div><span className="text-foreground-muted">{'גובה:'}</span> <span className="text-foreground">{plan.buildingRights.maxHeight}{"מ'"}</span></div>
                            <div><span className="text-foreground-muted">תכסית:</span> <span className="text-foreground">{plan.buildingRights.landCoveragePercent}%</span></div>
                            <div><span className="text-foreground-muted">קו קדמי:</span> <span className="text-foreground">{plan.restrictions.frontSetback}{"מ'"}</span></div>
                            <div><span className="text-foreground-muted">קו אחורי:</span> <span className="text-foreground">{plan.restrictions.rearSetback}{"מ'"}</span></div>
                          </div>
                          {isCustom && (
                            <div className="flex gap-2 pt-2 border-t border-foreground/10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlan(plan);
                                  setShowForm(true);
                                }}
                                className="flex items-center gap-1 text-xs text-accent hover:underline"
                              >
                                <Edit3 className="w-3 h-3" /> עריכה
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlan(plan.id);
                                }}
                                className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                              >
                                <Trash2 className="w-3 h-3" /> מחיקה
                              </button>
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
                {filteredAddresses.length === 0 && (
                  <div className="glass-card p-8 rounded-xl text-center text-foreground-muted">
                    אין כתובות תואמות
                  </div>
                )}
                {filteredAddresses.map((addr) => {
                  const isCustom = customAddrs.has(addr.address);
                  return (
                    <div key={addr.address} className="glass-card p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <MapPin className={`w-4 h-4 flex-shrink-0 ${isCustom ? 'text-accent' : 'text-foreground-muted'}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{addr.address}</span>
                              {isCustom && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">מותאם אישית</span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted">
                              גוש {addr.block} חלקה {addr.parcel} | {addr.neighborhood} | {addr.plotSize} {"מ\"ר"}
                              {addr.yearBuilt ? ` | ${addr.yearBuilt}` : ''}
                            </p>
                          </div>
                        </div>
                        {isCustom && (
                          <div className="flex items-center gap-1 mr-2">
                            <button
                              onClick={() => { setEditingAddr(addr); setShowForm(true); }}
                              className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-accent"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddr(addr.address)}
                              className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                  <div className="glass-card p-8 rounded-xl text-center text-foreground-muted">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{'אין מסמכים. לחץ "הוסף" כדי להעלות תב"ע או מסמך.'}</p>
                  </div>
                )}
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-foreground text-sm block truncate">{doc.name}</span>
                          <p className="text-xs text-foreground-muted">
                            {doc.planNumber} | {documentTypeLabels[doc.type]}
                            {doc.pageCount ? ` | ${doc.pageCount} עמודים` : ''}
                            {doc.fileSize ? ` | ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-foreground-muted mt-0.5 truncate">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mr-2">
                        {doc.dataUrl && (
                          <a
                            href={doc.dataUrl}
                            download={`${doc.name}.pdf`}
                            className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {doc.externalUrl && (
                          <a
                            href={doc.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-accent"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => { setEditingDoc(doc); setShowForm(true); }}
                          className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-accent"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground-muted hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
      <div className="mt-8 glass-card p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-foreground">סטטיסטיקה</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-bold text-foreground">{plans.length}</div>
            <div className="text-foreground-muted">תכניות ({getCustomPlans().length} מותאמות)</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{addresses.length}</div>
            <div className="text-foreground-muted">כתובות ({getCustomAddresses().length} מותאמות)</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{documents.length}</div>
            <div className="text-foreground-muted">מסמכים</div>
          </div>
        </div>
      </div>
    </div>
  );
}
