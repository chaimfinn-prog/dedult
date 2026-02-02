'use client';

import { motion } from 'framer-motion';
import type { FloorBreakdownItem } from '@/types';

interface Building3DProps {
  floors: FloorBreakdownItem[];
  currentBuiltArea: number;
  maxBuildableArea: number;
  maxFloors: number;
}

const floorColors: Record<string, { existing: string; additional: string; border: string }> = {
  basement: { existing: '#1e293b', additional: '#1e3a5f', border: '#334155' },
  ground: { existing: '#374151', additional: '#1e40af', border: '#4b5563' },
  typical: { existing: '#4b5563', additional: '#2563eb', border: '#6b7280' },
  top: { existing: '#6b7280', additional: '#3b82f6', border: '#9ca3af' },
  rooftop: { existing: '#9ca3af', additional: '#60a5fa', border: '#d1d5db' },
  tma: { existing: '#d4a843', additional: '#d4a843', border: '#e8c66a' },
};

export function Building3D({ floors, currentBuiltArea, maxBuildableArea, maxFloors }: Building3DProps) {
  const floorHeight = 28;
  const buildingWidth = 120;
  const buildingDepth = 80;
  const totalHeight = Math.max(floors.length, 3) * floorHeight;
  const existingRatio = currentBuiltArea / (maxBuildableArea || 1);
  const existingFloorCount = Math.round(existingRatio * floors.length);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#4b5563] border border-[#6b7280]" />
          <span className="text-foreground-secondary">מצב קיים</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#2563eb] border border-[#3b82f6]" />
          <span className="text-foreground-secondary">פוטנציאל נוסף</span>
        </div>
        {floors.some(f => f.floor === 'tma') && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#d4a843] border border-[#e8c66a]" />
            <span className="text-foreground-secondary">{"תמ\"א 38"}</span>
          </div>
        )}
      </div>

      {/* 3D Building */}
      <div className="building-3d-scene" style={{ height: totalHeight + 80, width: buildingWidth + 100 }}>
        <div className="building-3d" style={{ width: buildingWidth, margin: '40px auto 0' }}>
          {/* Ground plane */}
          <div
            className="absolute"
            style={{
              width: buildingWidth + 40,
              height: buildingDepth + 40,
              bottom: -buildingDepth / 2 - 20,
              left: -20,
              background: 'rgba(34, 211, 167, 0.06)',
              border: '1px dashed rgba(34, 211, 167, 0.2)',
              borderRadius: 4,
            }}
          />

          {/* Floors */}
          {floors.map((floor, index) => {
            const isExisting = index < existingFloorCount;
            const isTma = floor.floor === 'tma';
            const colorKey = isTma ? 'tma' : (floor.floor in floorColors ? floor.floor : 'typical');
            const colors = floorColors[colorKey];
            const bgColor = isExisting ? colors.existing : colors.additional;

            return (
              <motion.div
                key={floor.floor + index}
                initial={{ opacity: 0, y: 20, scaleY: 0 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                transition={{
                  delay: 0.3 + index * 0.15,
                  duration: 0.5,
                  type: 'spring',
                  stiffness: 200,
                }}
                className="absolute w-full"
                style={{
                  height: floorHeight - 2,
                  bottom: index * floorHeight,
                  transformOrigin: 'bottom',
                }}
              >
                {/* Floor face */}
                <div
                  className="w-full h-full rounded-sm relative overflow-hidden"
                  style={{
                    background: bgColor,
                    border: `1px solid ${colors.border}`,
                    boxShadow: isTma
                      ? '0 0 15px rgba(212, 168, 67, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : !isExisting
                        ? '0 0 10px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Floor label */}
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-[10px] text-white/70 truncate max-w-[60%]">
                      {floor.label}
                    </span>
                    <span className="text-[10px] font-mono text-white/50">
                      {floor.totalArea}m²
                    </span>
                  </div>

                  {/* Scan line for additional floors */}
                  {!isExisting && !isTma && (
                    <motion.div
                      className="absolute inset-x-0 h-px"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)' }}
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  {/* Gold shimmer for TMA */}
                  {isTma && (
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, transparent 30%, rgba(232,198,106,0.15) 50%, transparent 70%)',
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  {/* Window dots for typical floors */}
                  {(floor.floor === 'typical' || floor.floor === 'top') && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-30">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-1.5 h-2.5 bg-yellow-300/50 rounded-[1px]" />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Height indicator line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute"
            style={{
              right: -35,
              bottom: 0,
              height: floors.length * floorHeight,
              width: 1,
              background: 'rgba(59, 130, 246, 0.3)',
            }}
          >
            <div className="absolute -top-1 -right-1 w-3 h-px bg-accent" />
            <div className="absolute -bottom-1 -right-1 w-3 h-px bg-accent" />
            <div
              className="absolute -right-10 top-1/2 -translate-y-1/2 text-[9px] text-accent font-mono whitespace-nowrap"
              style={{ direction: 'ltr' }}
            >
              {maxFloors}F
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
