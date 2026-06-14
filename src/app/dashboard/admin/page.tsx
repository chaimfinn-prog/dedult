'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useLang } from '@/lib/i18n';
import type { ProjectRecord, ProjectStatus, DocumentCategory } from '@/lib/pinui-binui/pipeline/types';

type View = 'list' | 'detail';

const STATUS_LABELS: Record<ProjectStatus, { he: string; en: string; color: string }> = {
  intake: { he: 'קליטה', en: 'Intake', color: 'bg-gray-700 text-gray-300' },
  documents_received: { he: 'מסמכים התקבלו', en: 'Docs Received', color: 'bg-blue-900/50 text-blue-300' },
  under_analysis: { he: 'בבדיקה', en: 'Analyzing', color: 'bg-amber-900/50 text-amber-300' },
  business_plan_ready: { he: 'תוכנית מוכנה', en: 'Plan Ready', color: 'bg-emerald-900/50 text-emerald-300' },
  offer_sent: { he: 'הצעה נשלחה', en: 'Offer Sent', color: 'bg-purple-900/50 text-purple-300' },
  rejected: { he: 'נדחה', en: 'Rejected', color: 'bg-red-900/50 text-red-300' },
  archived: { he: 'ארכיון', en: 'Archived', color: 'bg-gray-800 text-gray-500' },
};

const CATEGORY_LABELS: Record<DocumentCategory, { he: string; en: string }> = {
  contract: { he: 'חוזה', en: 'Contract' },
  building_permit: { he: 'היתר בניה', en: 'Permit' },
  committee_decision: { he: 'החלטת ועדה', en: 'Committee' },
  city_plan: { he: 'תב"ע', en: 'City Plan' },
  appraisal: { he: 'שומה', en: 'Appraisal' },
  tenant_list: { he: 'רשימת דיירים', en: 'Tenant List' },
  engineering_report: { he: 'דו"ח הנדסי', en: 'Engineering' },
  other: { he: 'אחר', en: 'Other' },
};

function AdminContent() {
  const { lang } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  const [view, setView] = useState<View>('list');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selected, setSelected] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProject, setNewProject] = useState({
    name: '', city: '', address: '', neighborhood: '',
    contactName: '', contactPhone: '', contactEmail: '',
  });
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/pinui-binui/projects${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(String(err));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filteredProjects = projects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.contactName?.toLowerCase().includes(q))
    );
  });

  const createNewProject = async () => {
    if (!newProject.name || !newProject.city || !newProject.address) return;
    try {
      const res = await fetch('/api/pinui-binui/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowNewForm(false);
      setNewProject({ name: '', city: '', address: '', neighborhood: '', contactName: '', contactPhone: '', contactEmail: '' });
      await fetchProjects();
    } catch (err) {
      setError(String(err));
    }
  };

  const updateStatus = async (id: string, status: ProjectStatus) => {
    try {
      await fetch('/api/pinui-binui/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await fetchProjects();
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  const addNote = async (id: string, note: string) => {
    try {
      await fetch('/api/pinui-binui/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, note }),
      });
      const res = await fetch(`/api/pinui-binui/projects?id=${id}`);
      const data = await res.json();
      if (data.project) setSelected(data.project);
    } catch (err) {
      setError(String(err));
    }
  };

  const uploadFile = async (projectId: string, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('file', file);
      const res = await fetch('/api/pinui-binui/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const refreshRes = await fetch(`/api/pinui-binui/projects?id=${projectId}`);
      const refreshData = await refreshRes.json();
      if (refreshData.project) setSelected(refreshData.project);
      return data;
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  const openProject = (p: ProjectRecord) => {
    setSelected(p);
    setView('detail');
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm">A</div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">
                {t('ניהול פרויקטים', 'Project Management')}
              </h1>
              <p className="text-[11px] text-gray-500 leading-none mt-0.5">
                {t('דשבורד פינוי-בינוי', 'Pinui-Binui Dashboard')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'detail' && (
              <button onClick={() => setView('list')} className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-3 py-1.5 transition">
                {t('חזרה לרשימה', 'Back to List')}
              </button>
            )}
            <button onClick={() => setShowNewForm(true)} className="text-xs bg-blue-600 hover:bg-blue-500 rounded px-3 py-1.5 transition font-medium">
              + {t('פרויקט חדש', 'New Project')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-900/20 border border-red-800/40 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">x</button>
          </div>
        )}

        {/* New Project Modal */}
        {showNewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewForm(false)}>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 space-y-3" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">{t('פרויקט חדש', 'New Project')}</h2>
              {[
                { key: 'name', label: t('שם פרויקט', 'Project Name'), required: true },
                { key: 'city', label: t('עיר', 'City'), required: true },
                { key: 'address', label: t('כתובת', 'Address'), required: true },
                { key: 'neighborhood', label: t('שכונה', 'Neighborhood') },
                { key: 'contactName', label: t('שם איש קשר', 'Contact Name') },
                { key: 'contactPhone', label: t('טלפון', 'Phone') },
                { key: 'contactEmail', label: t('אימייל', 'Email') },
              ].map(f => (
                <label key={f.key} className="block">
                  <span className="text-[11px] text-gray-500">{f.label}{f.required && ' *'}</span>
                  <input
                    type="text"
                    value={newProject[f.key as keyof typeof newProject]}
                    onChange={e => setNewProject(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mt-1 focus:border-blue-500 focus:outline-none"
                  />
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                  {t('ביטול', 'Cancel')}
                </button>
                <button onClick={createNewProject} disabled={!newProject.name || !newProject.city || !newProject.address}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg transition font-medium">
                  {t('צור', 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('חיפוש...', 'Search...')}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white w-60 focus:border-blue-500 focus:outline-none"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="all">{t('כל הסטטוסים', 'All Statuses')}</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{isHe ? v.he : v.en}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                {filteredProjects.length} {t('פרויקטים', 'projects')}
              </span>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                const count = projects.filter(p => p.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status as ProjectStatus)}
                    className={`rounded-lg p-2 text-center transition border ${
                      statusFilter === status ? 'border-blue-500 bg-blue-900/20' : 'border-gray-800/50 bg-gray-900/40 hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-[10px] text-gray-500">{isHe ? label.he : label.en}</div>
                  </button>
                );
              })}
            </div>

            {/* Project List */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">{t('טוען...', 'Loading...')}</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('אין פרויקטים', 'No projects')}</p>
                <button onClick={() => setShowNewForm(true)} className="mt-3 text-sm text-blue-400 hover:text-blue-300">
                  + {t('צור פרויקט ראשון', 'Create first project')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p)}
                    className="w-full text-start bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 hover:bg-gray-800/40 transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate group-hover:text-blue-300 transition">{p.name}</h3>
                          <StatusBadge status={p.status} isHe={isHe} />
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{p.city} — {p.address}</p>
                        {p.contactName && (
                          <p className="text-xs text-gray-500 mt-1">{p.contactName} {p.contactPhone && `| ${p.contactPhone}`}</p>
                        )}
                      </div>
                      <div className="text-end shrink-0">
                        <div className="text-xs text-gray-600">{new Date(p.createdAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US')}</div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                          {p.documents.length} {t('מסמכים', 'docs')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && selected && (
          <div className="space-y-5">
            {/* Project Header */}
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <StatusBadge status={selected.status} isHe={isHe} />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{selected.city} — {selected.address}</p>
                  {selected.contactName && (
                    <p className="text-sm text-gray-500 mt-1">
                      {selected.contactName}
                      {selected.contactPhone && ` | ${selected.contactPhone}`}
                      {selected.contactEmail && ` | ${selected.contactEmail}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`text-[10px] px-2 py-1 rounded transition ${
                        selected.status === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {isHe ? STATUS_LABELS[s].he : STATUS_LABELS[s].en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extracted Info */}
            {selected.extractedInfo && Object.keys(selected.extractedInfo).some(k => (selected.extractedInfo as Record<string, unknown>)[k] != null) && (
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-cyan-400/90 mb-2">{t('מידע שחולץ', 'Extracted Info')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {selected.extractedInfo.existingUnits && <InfoItem label={t('דירות קיימות', 'Existing Units')} value={String(selected.extractedInfo.existingUnits)} />}
                  {selected.extractedInfo.existingFloors && <InfoItem label={t('קומות', 'Floors')} value={String(selected.extractedInfo.existingFloors)} />}
                  {selected.extractedInfo.plotArea && <InfoItem label={t('שטח מגרש', 'Plot Area')} value={`${selected.extractedInfo.plotArea} ${t('מ"ר', 'sqm')}`} />}
                  {selected.extractedInfo.currentDeveloper && <InfoItem label={t('יזם נוכחי', 'Current Developer')} value={selected.extractedInfo.currentDeveloper} />}
                  {selected.extractedInfo.tenantApprovalPct != null && <InfoItem label={t('אחוז חתימות', 'Approval %')} value={`${selected.extractedInfo.tenantApprovalPct}%`} />}
                  {selected.extractedInfo.contractDate && <InfoItem label={t('תאריך חוזה', 'Contract Date')} value={selected.extractedInfo.contractDate} />}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-400/90">
                  {t('מסמכים', 'Documents')} ({selected.documents.length})
                </h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;
                      for (const file of Array.from(files)) {
                        await uploadFile(selected.id, file);
                      }
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded px-3 py-1.5 transition"
                  >
                    {uploading ? t('מעלה...', 'Uploading...') : t('העלה מסמך', 'Upload Document')}
                  </button>
                </div>
              </div>

              {selected.documents.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>{t('אין מסמכים', 'No documents yet')}</p>
                  <p className="text-xs mt-1">{t('העלה חוזה, היתר בניה, החלטת ועדה...', 'Upload contracts, permits, committee decisions...')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.documents.map(doc => (
                    <div key={doc.id} className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{doc.fileName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              doc.status === 'extracted' ? 'bg-emerald-900/40 text-emerald-400' :
                              doc.status === 'classified' ? 'bg-blue-900/40 text-blue-400' :
                              doc.status === 'error' ? 'bg-red-900/40 text-red-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{isHe ? CATEGORY_LABELS[doc.category].he : CATEGORY_LABELS[doc.category].en}</span>
                            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString(isHe ? 'he-IL' : 'en-US')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Extracted Fields */}
                      {doc.extractedData && Object.keys(doc.extractedData.fields).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700/30">
                          <div className="text-[10px] text-gray-500 mb-1">{t('שדות שחולצו:', 'Extracted fields:')}</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(doc.extractedData.fields).map(([k, v]) => (
                              <span key={k} className="text-[11px] bg-gray-900/60 rounded px-2 py-0.5">
                                <span className="text-gray-500">{k}:</span> <span className="text-gray-300">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-400/90 mb-2">{t('הערות', 'Notes')}</h3>
              {selected.notes.length > 0 && (
                <div className="space-y-1 mb-3">
                  {selected.notes.map((note, i) => (
                    <div key={i} className="text-xs text-gray-400 bg-gray-800/30 rounded px-3 py-1.5">
                      {note}
                    </div>
                  ))}
                </div>
              )}
              <NoteInput onSubmit={(note) => addNote(selected.id, note)} isHe={isHe} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status, isHe }: { status: ProjectStatus; isHe: boolean }) {
  const label = STATUS_LABELS[status];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${label.color}`}>
      {isHe ? label.he : label.en}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}: </span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

function NoteInput({ onSubmit, isHe }: { onSubmit: (note: string) => void; isHe: boolean }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={isHe ? 'הוסף הערה...' : 'Add note...'}
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onSubmit(text.trim()); setText(''); } }}
        className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
      />
      <button
        onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText(''); } }}
        disabled={!text.trim()}
        className="text-xs bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700 rounded px-3 py-1.5 transition"
      >
        +
      </button>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}
