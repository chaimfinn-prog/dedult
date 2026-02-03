'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const scanSteps = [
  'מאתר מגרש במאגר המידע...',
  'סורק תב"ע רלוונטית...',
  'מנתח אחוזי בנייה...',
  'מחשב זכויות בנייה...',
  'בודק קווי בניין...',
  'מכין דו"ח סופי...',
];

export function RadarScan() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % scanSteps.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-12"
    >
      {/* Radar Animation */}
      <div className="radar-container mb-8">
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-dot" />
      </div>

      {/* Scan Status */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center"
      >
        <p className="text-cyan font-semibold text-lg mb-2">
          {scanSteps[currentStep]}
        </p>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <p className="text-sm text-foreground-secondary">
            AI Scanning Document
          </p>
        </div>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex gap-1.5 mt-6">
        {scanSteps.map((_, i) => (
          <motion.div
            key={i}
            className={`w-8 h-1.5 rounded-full transition-colors ${
              i <= currentStep ? 'bg-cyan' : 'bg-border'
            }`}
            animate={i === currentStep ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}
