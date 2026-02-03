'use client';

import { motion } from 'framer-motion';
import { MapPin, Calendar, Layers, Ruler, Building2 } from 'lucide-react';
import type { Property, ZoningPlan } from '@/types';

interface Props {
  property: Property;
  zoningPlan: ZoningPlan;
}

export function PropertyOverview({ property, zoningPlan }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-dim flex items-center justify-center">
          <MapPin className="w-4 h-4 text-cyan" />
        </div>
        <div>
          <h3 className="font-bold text-base">{property.address}, {property.city}</h3>
          <p className="text-xs text-foreground-secondary">{property.neighborhoodName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCell
          icon={<Layers className="w-3.5 h-3.5" />}
          label="גוש / חלקה"
          value={`${property.gush} / ${property.chelka}`}
        />
        <InfoCell
          icon={<Ruler className="w-3.5 h-3.5" />}
          label="שטח מגרש"
          value={`${property.plotArea} מ"ר`}
        />
        <InfoCell
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="שטח בנוי"
          value={`${property.builtArea} מ"ר`}
        />
        <InfoCell
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="שנת בנייה"
          value={`${property.yearBuilt}`}
        />
      </div>

      {/* Zoning Info Bar */}
      <div className="mt-4 p-3 rounded-xl bg-surface border border-border flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <span>
          <span className="text-foreground-secondary">תב&quot;ע: </span>
          <span className="text-cyan font-semibold">{zoningPlan.planNumber}</span>
        </span>
        <span>
          <span className="text-foreground-secondary">ייעוד: </span>
          <span className="font-semibold">{property.landUse}</span>
        </span>
        <span>
          <span className="text-foreground-secondary">סטטוס: </span>
          <span className={`font-semibold ${zoningPlan.status === 'approved' ? 'text-success' : 'text-warning'}`}>
            {zoningPlan.status === 'approved' ? 'מאושרת' : 'בהפקדה'}
          </span>
        </span>
        <span>
          <span className="text-foreground-secondary">אישור: </span>
          <span className="font-semibold">{new Date(zoningPlan.approvalDate).toLocaleDateString('he-IL')}</span>
        </span>
      </div>
    </motion.div>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-surface border border-border">
      <div className="flex items-center gap-1.5 text-foreground-secondary mb-1">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="font-bold text-sm metric-value">{value}</p>
    </div>
  );
}
