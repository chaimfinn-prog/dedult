'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ChevronLeft } from 'lucide-react';
import type { SourceReference } from '@/types';
import { useView } from '@/context/ViewContext';

interface Props {
  sources: SourceReference[];
}

export function AuditTrail({ sources }: Props) {
  const { showAuditTrail, setShowAuditTrail, activeSourceId, setActiveSourceId } =
    useView();

  return (
    <AnimatePresence>
      {showAuditTrail && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowAuditTrail(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background-secondary border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan" />
                מסמכי מקור
              </h3>
              <button
                onClick={() => setShowAuditTrail(false)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sources.map((source) => (
                <motion.div
                  key={source.id}
                  layout
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeSourceId === source.id
                      ? 'border-cyan bg-cyan-dim audit-highlight active'
                      : 'border-border bg-surface hover:border-cyan/50'
                  }`}
                  onClick={() =>
                    setActiveSourceId(
                      activeSourceId === source.id ? null : source.id
                    )
                  }
                >
                  {/* Source Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan" />
                      <span className="text-xs font-semibold text-cyan">
                        תכנית {source.planNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground-secondary">
                        עמ׳ {source.pageNumber}
                      </span>
                      <ConfidenceBadge confidence={source.confidence} />
                    </div>
                  </div>

                  {/* Section Title */}
                  <p className="text-sm font-semibold mb-2">{source.sectionTitle}</p>

                  {/* Quote */}
                  <AnimatePresence>
                    {activeSourceId === source.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 rounded-lg bg-background border border-border mt-2 scan-line">
                          <p className="text-sm leading-relaxed text-foreground-secondary">
                            &ldquo;{source.quote}&rdquo;
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-foreground-secondary">
                          <ChevronLeft className="w-3 h-3" />
                          <span>{source.documentName}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-xs text-foreground-secondary text-center">
                כל הנתונים מבוססים על מסמכי תב&quot;ע רשמיים.
                <br />
                הציונים מציינים רמת ודאות של חילוץ המידע.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color = 'text-success bg-success-dim';
  if (confidence < 90) color = 'text-warning bg-warning-dim';
  if (confidence < 80) color = 'text-danger bg-danger-dim';

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {confidence}%
    </span>
  );
}
