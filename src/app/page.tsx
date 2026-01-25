'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/features/SearchBar';
import { BasketList } from '@/components/features/BasketList';
import { CompareButton } from '@/components/features/CompareButton';
import { OptimizationModal } from '@/components/features/OptimizationModal';
import { QuickCategories } from '@/components/features/QuickCategories';
import { Dashboard } from '@/components/features/Dashboard';
import { WarRoom } from '@/components/features/WarRoom';
import { Sparkles, ShieldCheck, Zap, TrendingDown } from 'lucide-react';

export default function Home() {
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  return (
    <div className="container-app pb-8">
      <Header />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-gradient-to-l from-accent to-accent-light bg-clip-text text-transparent">
            סלי AI
          </span>
        </h1>
        <p className="text-foreground-secondary text-lg mb-6">
          השוואת מחירים חכמה בין 5 רשתות מזון בישראל
        </p>

        {/* Value Props */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <ValueProp icon={<TrendingDown className="w-4 h-4" />} text="חיסכון ממוצע ₪85" />
          <ValueProp icon={<Zap className="w-4 h-4" />} text="תוצאות בשניות" />
          <ValueProp icon={<ShieldCheck className="w-4 h-4" />} text="מחירים אמיתיים" />
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Search & Categories */}
        <div className="space-y-6">
          <SearchBar />
          <QuickCategories />
        </div>

        {/* Right Column - Basket */}
        <div className="space-y-4">
          <BasketList />
          <CompareButton onOptimize={() => setShowOptimizationModal(true)} />
        </div>
      </div>

      {/* Store Logos */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-8"
      >
        <p className="text-center text-sm text-foreground-secondary mb-4">
          משווים מחירים ב-5 הרשתות המובילות
        </p>
        <div className="flex justify-center items-center gap-6 flex-wrap opacity-60">
          <StoreLogo name="שופרסל" color="#e31e24" />
          <StoreLogo name="רמי לוי" color="#0066cc" />
          <StoreLogo name="ויקטורי" color="#ff6600" />
          <StoreLogo name="קרפור" color="#004e9f" />
          <StoreLogo name="יוחננוף" color="#00a651" />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-8"
      >
        <h2 className="text-xl font-bold text-center mb-6">איך זה עובד?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            step={1}
            title="בנה את הסל"
            description="חפש והוסף מוצרים לרשימת הקניות שלך"
            icon="🛒"
          />
          <FeatureCard
            step={2}
            title="השווה מחירים"
            description="ה-AI שלנו משווה את המחירים ב-5 רשתות שונות"
            icon="🔍"
          />
          <FeatureCard
            step={3}
            title="חסוך כסף"
            description="קבל המלצה חכמה לאיפה לקנות ותחסוך עשרות שקלים"
            icon="💰"
          />
        </div>
      </motion.section>

      {/* Dashboard Section */}
      <Dashboard />

      {/* War Room Section */}
      <WarRoom />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-8 text-center text-sm text-foreground-secondary"
      >
        <p>סלי AI - השוואת מחירים חכמה</p>
        <p className="mt-1">
          המחירים מתעדכנים מקבצי השקיפות של משרד הכלכלה
        </p>
        <p className="mt-2 text-xs opacity-70">
          © {new Date().getFullYear()} Sali AI. כל הזכויות שמורות.
        </p>
      </motion.footer>

      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={showOptimizationModal}
        onClose={() => setShowOptimizationModal(false)}
      />
    </div>
  );
}

function ValueProp({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm"
      whileHover={{ scale: 1.05 }}
    >
      {icon}
      <span>{text}</span>
    </motion.div>
  );
}

function StoreLogo({ name, color }: { name: string; color: string }) {
  return (
    <motion.div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: color }}
      whileHover={{ scale: 1.1, opacity: 1 }}
    >
      {name.charAt(0)}
    </motion.div>
  );
}

function FeatureCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <motion.div
      className="glass-card p-6 text-center"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative inline-block mb-4">
        <span className="text-4xl">{icon}</span>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-foreground-secondary">{description}</p>
    </motion.div>
  );
}
