'use client';

import { useState } from 'react';
import { Building2, ChevronLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [address, setAddress] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (address.trim()) {
      router.push(`/checkup?address=${encodeURIComponent(address)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden">

        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80')`,
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(13,17,23,0.82)', backdropFilter: 'blur(2px)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.1)] mb-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
            <span className="w-2 h-2 rounded-full bg-green pulse" />
            <span className="text-xs font-medium tracking-wide text-foreground-muted uppercase">Urban Renewal Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gradient-blue">
            {'הצ\u05F3ק-אפ של חיים'}
          </h1>

          <p className="text-lg md:text-xl text-foreground-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            {'בלי אנשי מכירות, בלי סיפורים. קבל ניתוח אנליטי קר של פרויקט ההתחדשות העירונית שלך: '}
            <span className="text-foreground font-semibold">{'זמנים אמיתיים, רמת סיכון וציון וודאות.'}</span>
          </p>

          {/* Search Box */}
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
            <span>{'בדיקת תב"ע'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{'היסטוריית יזם'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
            <span>{'ניתוח חוזי'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
