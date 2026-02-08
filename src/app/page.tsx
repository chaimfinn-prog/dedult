'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, ChevronLeft, Search,
} from 'lucide-react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=2000&q=80';

export default function Home() {
  const [heroAddress, setHeroAddress] = useState('');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="relative flex-1 flex items-center justify-center text-white min-h-[620px]"
        style={{
          backgroundImage: `linear-gradient(rgba(10,12,18,0.65), rgba(10,12,18,0.65)), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)]" />
        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80 uppercase tracking-wider">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <Building2 className="w-5 h-5 text-green-300" />
                <span>הצ׳ק-אפ של חיים</span>
              </div>
              <div className="flex items-center gap-6">
                <span>בדיקה</span>
                <span>תהליך</span>
                <span>שאלות</span>
                <a href="/checkup" className="text-white font-semibold">
                  קבע ייעוץ
                </a>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 text-center mt-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-semibold tracking-tight"
            >
              {'בדיקת היתכנות שמורידה אותך לקרקע'}
            </motion.h1>
            <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto mt-4">
              {'חיים היועץ מנתח סטטוס סטטוטורי, חתימות וניהול יזמי, ומחזיר לך לו״ז אמיתי למפתח + מדד וודאות.'}
            </p>

            <div className="bg-white/95 text-gray-900 rounded-xl shadow-2xl max-w-3xl mx-auto mt-10">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 py-3 border-b border-gray-200">
                <span className="px-3 py-1 bg-gray-900 text-white rounded-md">בדיקה</span>
                <span className="px-3 py-1 rounded-md">וודאות</span>
                <span className="px-3 py-1 rounded-md">לו״ז</span>
              </div>
              <div className="flex flex-col md:flex-row items-stretch gap-3 p-4">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center px-4 py-3 text-sm text-gray-600">
                  <Search className="w-4 h-4 text-gray-400 ml-2" />
                  <input
                    type="text"
                    placeholder="כתובת הפרויקט (עיר/רחוב)"
                    className="w-full bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                    value={heroAddress}
                    onChange={(event) => setHeroAddress(event.target.value)}
                  />
                </div>
                <a
                  href={heroAddress ? `/checkup?address=${encodeURIComponent(heroAddress.trim())}` : '#'}
                  className={`bg-blue-600 text-white rounded-lg px-5 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 ${heroAddress ? '' : 'opacity-60 pointer-events-none'}`}
                >
                  {'התחל בדיקה'}
                  <ChevronLeft className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8 text-sm text-white/80">
              {'הכנס כתובת → מעבר למסך בדיקה מלא'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-4 text-center text-xs text-foreground-muted">
        <span>{'הצ׳ק-אפ של חיים'} </span>
        <span className="opacity-50">|</span>
        <span> {'מחשבון היתכנות להתחדשות עירונית'}</span>
      </div>
    </div>
  );
}
