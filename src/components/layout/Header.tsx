'use client';

import { motion } from 'framer-motion';
import { Building2, FileSearch, BookOpen } from 'lucide-react';
import { useView } from '@/context/ViewContext';

export function Header() {
  const { viewMode, setViewMode, selectedAnalysis, showAuditTrail, setShowAuditTrail } = useView();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-4"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-blue-500 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-background" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-neon-cyan">Zchut</span>
            <span className="text-foreground-secondary">.AI</span>
          </h1>
          <p className="text-[10px] text-foreground-secondary -mt-1">
            מנוע זכויות בנייה
          </p>
        </div>
      </div>

      {/* View Toggle + Audit Trail */}
      <div className="flex items-center gap-3">
        {selectedAnalysis && (
          <>
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('homeowner')}
                className={`view-toggle-btn ${viewMode === 'homeowner' ? 'active-homeowner' : ''}`}
              >
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">בעל בית</span>
                </span>
              </button>
              <button
                onClick={() => setViewMode('developer')}
                className={`view-toggle-btn ${viewMode === 'developer' ? 'active-developer' : ''}`}
              >
                <span className="flex items-center gap-1.5">
                  <FileSearch className="w-4 h-4" />
                  <span className="hidden sm:inline">יזם</span>
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className={`p-2.5 rounded-xl border transition-all ${
                showAuditTrail
                  ? 'border-cyan bg-cyan-dim text-cyan'
                  : 'border-border bg-surface text-foreground-secondary hover:text-cyan hover:border-cyan'
              }`}
              title="מסמכי מקור"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.header>
  );
}
