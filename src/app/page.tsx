'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { PropertySearch } from '@/components/features/PropertySearch';
import { RadarScan } from '@/components/features/RadarScan';
import { PropertyOverview } from '@/components/features/PropertyOverview';
import { BuildingRightsView } from '@/components/features/BuildingRightsView';
import { DuchEfesReport } from '@/components/features/DuchEfesReport';
import { AuditTrail } from '@/components/features/AuditTrail';
import { useView } from '@/context/ViewContext';
import {
  Building2,
  FileSearch,
  Brain,
  ShieldCheck,
  Zap,
  Database,
} from 'lucide-react';

export default function Home() {
  const { viewMode, selectedAnalysis, isAnalyzing } = useView();

  return (
    <div className="container-app pb-8">
      <Header />

      {/* Hero Section - only when no analysis */}
      {!selectedAnalysis && !isAnalyzing && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 text-center"
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan to-blue-500 flex items-center justify-center"
          >
            <Building2 className="w-12 h-12 text-background" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black mb-3">
            <span className="text-neon-cyan">Zchut</span>
            <span className="text-foreground">.AI</span>
          </h1>
          <p className="text-foreground-secondary text-lg mb-2">
            מנוע בינה מלאכותית לזכויות בנייה
          </p>
          <p className="text-foreground-secondary text-sm mb-8 max-w-lg mx-auto">
            הזן כתובת או גוש/חלקה וקבל ניתוח מלא של זכויות הבנייה,
            פוטנציאל השבחה ודו&quot;ח אפס - הכל מגובה במסמכי מקור
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <ValueProp
              icon={<Brain className="w-4 h-4" />}
              text="AI + תב״ע"
            />
            <ValueProp
              icon={<Zap className="w-4 h-4" />}
              text="תוצאות בשניות"
            />
            <ValueProp
              icon={<ShieldCheck className="w-4 h-4" />}
              text="מגובה במקור"
            />
          </div>

          {/* Search */}
          <PropertySearch />

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h2 className="text-xl font-bold mb-6">איך Zchut.AI עובד?</h2>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <FeatureCard
                step={1}
                title="הזנת נכס"
                description='חפש לפי כתובת, גוש/חלקה או שם שכונה'
                icon={<Database className="w-6 h-6 text-cyan" />}
              />
              <FeatureCard
                step={2}
                title="סריקת תב״ע"
                description='ה-AI קורא את מסמכי התב"ע ומחלץ את הנתונים הרלוונטיים'
                icon={<Brain className="w-6 h-6 text-cyan" />}
              />
              <FeatureCard
                step={3}
                title="דו״ח מלא"
                description="קבל ניתוח זכויות, הזדמנויות השבחה ודו״ח כדאיות"
                icon={<FileSearch className="w-6 h-6 text-gold" />}
              />
            </div>
          </motion.div>

          {/* Dual Path Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid md:grid-cols-2 gap-4 max-w-3xl mx-auto"
          >
            <PathCard
              title="בעל בית"
              description="גלה את הפוטנציאל של הנכס שלך: הרחבות, בריכה, מרתף, תוספת שווי"
              icon={<Building2 className="w-6 h-6" />}
              color="cyan"
            />
            <PathCard
              title="יזם נדל״ן"
              description='דו"ח אפס אוטומטי: שטח מכירה, היטל השבחה, מקדם רווחיות'
              icon={<FileSearch className="w-6 h-6" />}
              color="gold"
            />
          </motion.div>
        </motion.section>
      )}

      {/* Radar Scan Animation */}
      {isAnalyzing && <RadarScan />}

      {/* Analysis Results */}
      {selectedAnalysis && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 py-4"
        >
          {/* Search bar at top for new search */}
          <PropertySearch />

          {/* Property Overview - always visible */}
          <PropertyOverview
            property={selectedAnalysis.property}
            zoningPlan={selectedAnalysis.zoningPlan}
          />

          {/* View-specific content */}
          {viewMode === 'homeowner' ? (
            <BuildingRightsView
              buildingRights={selectedAnalysis.buildingRights}
              enhancements={selectedAnalysis.enhancements}
            />
          ) : (
            <DuchEfesReport
              duchEfes={selectedAnalysis.duchEfes}
              zoningPlan={selectedAnalysis.zoningPlan}
              plotArea={selectedAnalysis.property.plotArea}
            />
          )}

          {/* Audit Trail Side Panel */}
          <AuditTrail sources={selectedAnalysis.allSources} />
        </motion.div>
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 text-center text-sm text-foreground-secondary"
      >
        <p className="text-neon-cyan font-bold text-lg mb-1">Zchut.AI</p>
        <p>מנוע בינה מלאכותית לזכויות בנייה בישראל</p>
        <p className="mt-2 text-xs opacity-50">
          הנתונים מבוססים על מסמכי תב&quot;ע רשמיים. יש לבדוק מול גורם מקצועי לפני ביצוע.
        </p>
        <p className="mt-1 text-xs opacity-30">
          &copy; {new Date().getFullYear()} Zchut.AI
        </p>
      </motion.footer>
    </div>
  );
}

function ValueProp({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-dim text-cyan text-sm border border-cyan/20"
      whileHover={{ scale: 1.05 }}
    >
      {icon}
      <span>{text}</span>
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
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      className="glass-card p-6 text-center"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative inline-block mb-4">
        {icon}
        <span className="absolute -top-2 -right-4 w-5 h-5 rounded-full bg-cyan text-background text-xs font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-foreground-secondary">{description}</p>
    </motion.div>
  );
}

function PathCard({
  title,
  description,
  icon,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'cyan' | 'gold';
}) {
  const borderColor = color === 'cyan' ? 'border-cyan/20' : 'border-gold/20';
  const iconBg = color === 'cyan' ? 'bg-cyan-dim text-cyan' : 'bg-gold-dim text-gold';
  const cardClass = color === 'cyan' ? 'glass-card-cyan' : 'glass-card-gold';

  return (
    <motion.div
      className={`${cardClass} p-6 text-right ${borderColor}`}
      whileHover={{ scale: 1.02, y: -3 }}
    >
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-foreground-secondary">{description}</p>
    </motion.div>
  );
}
