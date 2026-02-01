'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import type { AnalysisLogEntry } from '@/types';

const iconMap: Record<AnalysisLogEntry['type'], React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-400" />,
  search: <Search className="w-4 h-4 text-accent" />,
  extract: <FileText className="w-4 h-4 text-amber-400" />,
  calculate: <Calculator className="w-4 h-4 text-emerald-400" />,
  complete: <CheckCircle2 className="w-4 h-4 text-success" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
};

const colorMap: Record<AnalysisLogEntry['type'], string> = {
  info: 'border-blue-400/30',
  search: 'border-accent/30',
  extract: 'border-amber-400/30',
  calculate: 'border-emerald-400/30',
  complete: 'border-success/30',
  warning: 'border-warning/30',
};

export function AnalysisProgress() {
  const { logs, isAnalyzing } = useZoning();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-strong p-6 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {isAnalyzing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-6 h-6 text-accent" />
          </motion.div>
        ) : (
          <CheckCircle2 className="w-6 h-6 text-success" />
        )}
        <h2 className="text-xl font-bold">
          {isAnalyzing ? 'מנתח זכויות בנייה...' : 'הניתוח הושלם'}
        </h2>
      </div>

      {/* Progress bar */}
      {isAnalyzing && (
        <div className="w-full h-1.5 rounded-full bg-border/50 mb-6 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-accent to-accent-light"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 10, ease: 'linear' }}
          />
        </div>
      )}

      {/* Log entries */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pl-2">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${colorMap[log.type]} bg-background/30`}
            >
              <div className="flex-shrink-0 mt-0.5">{iconMap[log.type]}</div>
              <span
                className={`text-sm ${log.type === 'complete' ? 'font-semibold text-success' : 'text-foreground-secondary'}`}
              >
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Analyzing animation */}
      {isAnalyzing && (
        <motion.div
          className="mt-4 flex items-center justify-center gap-2 text-sm text-foreground-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>AI מעבד את הנתונים</span>
          <span className="flex gap-1">
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            >
              .
            </motion.span>
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
