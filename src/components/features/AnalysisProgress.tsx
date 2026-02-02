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
  Radar,
} from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import type { AnalysisLogEntry } from '@/types';
import { RadarScanner } from './RadarScanner';

const iconMap: Record<AnalysisLogEntry['type'], React.ReactNode> = {
  info: <Info className="w-4 h-4 text-accent-light" />,
  search: <Search className="w-4 h-4 text-accent" />,
  extract: <FileText className="w-4 h-4 text-gold" />,
  calculate: <Calculator className="w-4 h-4 text-success" />,
  complete: <CheckCircle2 className="w-4 h-4 text-success" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  radar: <Radar className="w-4 h-4 text-accent" />,
};

const colorMap: Record<AnalysisLogEntry['type'], string> = {
  info: 'border-accent/15 bg-accent/5',
  search: 'border-accent/20 bg-accent/5',
  extract: 'border-gold/20 bg-gold/5',
  calculate: 'border-success/20 bg-success/5',
  complete: 'border-success/30 bg-success/8',
  warning: 'border-warning/20 bg-warning/5',
  radar: 'border-accent/25 bg-accent/8',
};

export function AnalysisProgress() {
  const { logs, isAnalyzing } = useZoning();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Radar scanner */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <RadarScanner />
        </motion.div>
      )}

      {/* Terminal-style log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {isAnalyzing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-accent" />
            </motion.div>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-success" />
          )}
          <h2 className="font-bold text-base">
            {isAnalyzing ? 'מנתח זכויות בנייה...' : 'ניתוח הושלם'}
          </h2>
          <div className="flex-1" />
          <span className="badge badge-accent font-mono text-[10px]">
            ZCHUT.AI ENGINE v2.0
          </span>
        </div>

        {/* Progress bar */}
        {isAnalyzing && (
          <div className="w-full h-1 rounded-full bg-border mb-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-accent to-gold"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 12, ease: 'linear' }}
            />
          </div>
        )}

        {/* Log entries */}
        <div className="space-y-1.5 max-h-[350px] overflow-y-auto pl-2">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${colorMap[log.type]}`}
              >
                <div className="flex-shrink-0 mt-0.5">{iconMap[log.type]}</div>
                <span
                  className={`text-sm leading-relaxed ${
                    log.type === 'complete'
                      ? 'font-semibold text-success'
                      : log.type === 'radar'
                        ? 'font-mono text-accent-light text-xs'
                        : 'text-foreground-secondary'
                  }`}
                >
                  {log.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Processing indicator */}
        {isAnalyzing && (
          <motion.div
            className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground-muted font-mono"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>{'>'} AI PROCESSING</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              _
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
