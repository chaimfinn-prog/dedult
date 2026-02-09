'use client';

import { useState } from 'react';
import { Building2, ChevronLeft, Search, CalendarDays, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

export default function Home() {
  const [address, setAddress] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (address.trim()) {
      router.push(`/checkup?address=${encodeURIComponent(address)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden">

        {/* Video / Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay muted loop playsInline
            className="bg-video bg-cinematic"
            poster={FALLBACK_IMG}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0 bg-cinematic bg-cover bg-center"
            style={{ backgroundImage: `url('${FALLBACK_IMG}')` }}
          />
          <div className="absolute inset-0 bg-overlay-dark" />
          <div className="absolute inset-0 bg-grid" />
        </div>

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green" />
              <span className="font-bold text-sm">THE REALITY CHECK</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/prices" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                {'השוואת מחירים'}
              </a>
              <a href="/booking" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {'קביעת ייעוץ'}
              </a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] mb-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
            <span className="w-2 h-2 rounded-full bg-green pulse" />
            <span className="text-xs font-medium tracking-wide text-foreground-muted uppercase">Urban Renewal Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient-blue">
            THE REALITY CHECK
          </h1>

          <p className="text-lg md:text-xl text-foreground-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            {'בלי אנשי מכירות, בלי סיפורים. קבל ניתוח אנליטי קר של פרויקט ההתחדשות העירונית שלך: '}
            <span className="text-foreground font-semibold">{'זמנים אמיתיים, רמת סיכון וציון וודאות.'}</span>
          </p>

          <div className="max-w-xl mx-auto db-card p-2 flex flex-col md:flex-row gap-2 transition-all focus-within:border-green/50 focus-within:shadow-[0_0_20px_var(--green-glow)]">
            <div className="flex-1 flex items-center px-4 h-14">
              <Search className="w-5 h-5 text-foreground-muted ml-3" />
              <input
                type="text"
                placeholder="...הזן כתובת פרויקט מלאה"
                className="w-full bg-transparent border-none outline-none text-foreground placeholder-[var(--fg-dim)] text-right"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <button
              onClick={handleStart}
              disabled={!address.trim()}
              className="btn-green h-14 px-8 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{'התחל בדיקה'}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-xs text-foreground-muted font-medium tracking-widest uppercase">
            <span>{'אימות סטטוס תכנוני'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{'פרופיל יזם'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{'ניתוח סיכונים'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{'ניתוח כלכלי'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
