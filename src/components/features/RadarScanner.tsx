'use client';

import { motion } from 'framer-motion';

export function RadarScanner() {
  return (
    <div className="radar-container">
      {/* Rings */}
      <div className="radar-ring" />
      <div className="radar-ring-2" />
      <div className="radar-ring-3" />

      {/* Sweep */}
      <div className="radar-sweep" />

      {/* Cross lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-accent/10" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-accent/10" />
      </div>

      {/* Dots */}
      <motion.div
        className="radar-dot"
        style={{ top: '30%', right: '25%' }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="radar-dot"
        style={{ top: '60%', right: '65%' }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
      />
      <motion.div
        className="radar-dot"
        style={{ top: '45%', right: '45%' }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
      />

      {/* Center glow */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 12px var(--accent-glow)',
        }}
      />
    </div>
  );
}
