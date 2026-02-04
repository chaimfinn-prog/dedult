'use client';

import { motion } from 'framer-motion';
import type { FloorBreakdownItem } from '@/types';

interface Building3DProps {
  floors: FloorBreakdownItem[];
  currentBuiltArea: number;
  maxBuildableArea: number;
  maxFloors: number;
  plotWidth?: number;
  plotDepth?: number;
}

// Isometric helpers
const ISO_ANGLE = 30; // degrees
const COS30 = Math.cos((ISO_ANGLE * Math.PI) / 180);
const SIN30 = Math.sin((ISO_ANGLE * Math.PI) / 180);

// Colors
const GREEN_MAIN = '#4ade80';
const GREEN_DARK = '#22c55e';
const GREEN_DARKER = '#16a34a';
const GREEN_LIGHT = '#86efac';
const GOLD_MAIN = '#fbbf24';
const GOLD_DARK = '#f59e0b';
const GRAY_EXISTING = '#6b7280';
const GRAY_DARK = '#4b5563';

export function Building3D({ floors, currentBuiltArea, maxBuildableArea, maxFloors, plotWidth, plotDepth }: Building3DProps) {
  const floorH = 14;
  const bW = 100; // building face width
  const bD = 60; // building side depth
  const existingRatio = currentBuiltArea / (maxBuildableArea || 1);
  const existingFloorCount = Math.round(existingRatio * floors.filter(f => f.floor !== 'tma' && f.floor !== 'urban_renewal').length);

  // SVG dimensions
  const svgW = 420;
  const svgH = 380;
  const originX = svgW / 2;
  const originY = svgH - 60;

  // Isometric projection: x goes right-down, y goes left-down, z goes up
  function iso(x: number, y: number, z: number): [number, number] {
    return [
      originX + (x - y) * COS30,
      originY - z - (x + y) * SIN30,
    ];
  }

  // Draw a face (polygon) given 4 3D points
  function face(pts: [number, number, number][]) {
    const projected = pts.map(([x, y, z]) => iso(x, y, z));
    return `M ${projected.map(([px, py]) => `${px},${py}`).join(' L ')} Z`;
  }

  // Surrounding context buildings (smaller, gray)
  const contextBuildings: { x: number; y: number; w: number; d: number; h: number }[] = [
    { x: -120, y: -40, w: 35, d: 25, h: 40 },
    { x: -110, y: 50, w: 40, d: 30, h: 55 },
    { x: 80, y: -60, w: 30, d: 20, h: 35 },
    { x: 100, y: 30, w: 45, d: 25, h: 65 },
    { x: 60, y: -90, w: 25, d: 20, h: 25 },
    { x: -60, y: -90, w: 30, d: 25, h: 30 },
    { x: -50, y: 80, w: 35, d: 20, h: 45 },
    { x: 120, y: -30, w: 25, d: 20, h: 50 },
  ];

  // Grid lines for map
  const gridLines: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const spacing = 60;
    // Horizontal grid
    const [x1, y1] = iso(-180, i * spacing, 0);
    const [x2, y2] = iso(180, i * spacing, 0);
    gridLines.push(`M ${x1},${y1} L ${x2},${y2}`);
    // Vertical grid
    const [x3, y3] = iso(i * spacing, -180, 0);
    const [x4, y4] = iso(i * spacing, 180, 0);
    gridLines.push(`M ${x3},${y3} L ${x4},${y4}`);
  }

  // Road paths
  const roadW = 18;
  function roadPath(startX: number, startY: number, endX: number, endY: number) {
    const [sx1, sy1] = iso(startX, startY - roadW, 0);
    const [sx2, sy2] = iso(endX, endY - roadW, 0);
    const [sx3, sy3] = iso(endX, endY + roadW, 0);
    const [sx4, sy4] = iso(startX, startY + roadW, 0);
    return `M ${sx1},${sy1} L ${sx2},${sy2} L ${sx3},${sy3} L ${sx4},${sy4} Z`;
  }

  // Building total height in isometric units
  const totalFloors = floors.length;
  const buildingTotalH = totalFloors * floorH;

  // Plot boundary
  const plotW = plotWidth ? Math.min(plotWidth * 3, 140) : bW + 30;
  const plotD = plotDepth ? Math.min(plotDepth * 3, 100) : bD + 20;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: GRAY_EXISTING }} />
          <span className="text-foreground-muted">מצב קיים</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: GREEN_MAIN }} />
          <span className="text-foreground-muted">פוטנציאל בנייה</span>
        </div>
        {floors.some(f => f.floor === 'tma' || f.floor === 'urban_renewal') && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: GOLD_MAIN }} />
            <span className="text-foreground-muted">{'תמ"א / התחדשות'}</span>
          </div>
        )}
      </div>

      {/* Isometric Scene */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-md"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }}
      >
        <defs>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="greenTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={GREEN_LIGHT} />
            <stop offset="100%" stopColor={GREEN_MAIN} />
          </linearGradient>
          <linearGradient id="goldTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor={GOLD_MAIN} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground plane */}
        <path
          d={face(
            [[-180, -180, 0], [180, -180, 0], [180, 180, 0], [-180, 180, 0]]
          )}
          fill="url(#groundGrad)"
          stroke="none"
        />

        {/* Grid lines */}
        {gridLines.map((d, i) => (
          <path key={`grid-${i}`} d={d} stroke="rgba(100,116,139,0.15)" strokeWidth="0.5" fill="none" />
        ))}

        {/* Roads */}
        <path d={roadPath(-180, 0, 180, 0)} fill="rgba(51,65,85,0.6)" />
        <path d={roadPath(0, -180, 0, 180)} fill="rgba(51,65,85,0.6)" style={{ transform: 'rotate(90deg)', transformOrigin: `${originX}px ${originY}px` }} />

        {/* Context buildings (behind) */}
        {contextBuildings
          .filter(b => b.y < 0 || b.x < -50)
          .map((b, i) => {
            const topFace = face(
              [[b.x, b.y, b.h], [b.x + b.w, b.y, b.h], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]]
            );
            const rightFace = face(
              [[b.x + b.w, b.y, 0], [b.x + b.w, b.y, b.h], [b.x + b.w, b.y + b.d, b.h], [b.x + b.w, b.y + b.d, 0]]
            );
            const frontFace = face(
              [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]]
            );
            return (
              <g key={`ctx-b-${i}`} opacity="0.4">
                <path d={rightFace} fill="#475569" stroke="#334155" strokeWidth="0.5" />
                <path d={frontFace} fill="#64748b" stroke="#334155" strokeWidth="0.5" />
                <path d={topFace} fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
              </g>
            );
          })}

        {/* Plot boundary - green dashed */}
        <path
          d={face(
            [[-plotW/2, -plotD/2, 0], [plotW/2, -plotD/2, 0], [plotW/2, plotD/2, 0], [-plotW/2, plotD/2, 0]]
          )}
          fill="rgba(74,222,128,0.08)"
          stroke={GREEN_MAIN}
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.6"
        />

        {/* Main building - floor by floor */}
        {floors.map((floor, index) => {
          const isExisting = index < existingFloorCount;
          const isTma = floor.floor === 'tma';
          const isUrban = floor.floor === 'urban_renewal';
          const isBonus = isTma || isUrban;

          // Colors based on type
          let topColor = isExisting ? '#9ca3af' : GREEN_LIGHT;
          let rightColor = isExisting ? GRAY_DARK : GREEN_DARKER;
          let frontColor = isExisting ? GRAY_EXISTING : GREEN_DARK;
          let strokeColor = isExisting ? '#374151' : '#15803d';

          if (isBonus) {
            topColor = '#fde68a';
            rightColor = '#d97706';
            frontColor = GOLD_DARK;
            strokeColor = '#92400e';
          }

          const z0 = index * floorH;
          const z1 = z0 + floorH - 1;
          const hw = bW / 2;
          const hd = bD / 2;

          const topFace = face(
            [[-hw, -hd, z1], [hw, -hd, z1], [hw, hd, z1], [-hw, hd, z1]]
          );
          const rightFace = face(
            [[hw, -hd, z0], [hw, -hd, z1], [hw, hd, z1], [hw, hd, z0]]
          );
          const frontFace = face(
            [[-hw, hd, z0], [hw, hd, z0], [hw, hd, z1], [-hw, hd, z1]]
          );

          // Windows on front face
          const windowCount = floor.floor === 'basement' ? 0 : 5;
          const [fbl] = [iso(-hw, hd, z0)];
          const [ftl] = [iso(-hw, hd, z1)];
          const [fbr] = [iso(hw, hd, z0)];

          return (
            <motion.g
              key={`floor-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.4, type: 'spring', stiffness: 150 }}
            >
              <path d={rightFace} fill={rightColor} stroke={strokeColor} strokeWidth="0.5" />
              <path d={frontFace} fill={frontColor} stroke={strokeColor} strokeWidth="0.5" />
              <path d={topFace} fill={topColor} stroke={strokeColor} strokeWidth="0.5" />

              {/* Window grid on front face */}
              {windowCount > 0 && (
                <g opacity={isExisting ? 0.15 : 0.25}>
                  {Array.from({ length: windowCount }).map((_, wi) => {
                    const t = (wi + 0.5) / windowCount;
                    const wx = fbl[0] + (fbr[0] - fbl[0]) * t;
                    const wy = fbl[1] + (fbr[1] - fbl[1]) * t;
                    const wty = ftl[1] + (ftl[1] - fbl[1]) * 0.3;
                    return (
                      <rect
                        key={wi}
                        x={wx - 2}
                        y={wy + (wty - wy) * 0.3}
                        width={3}
                        height={Math.abs(wty - wy) * 0.4}
                        fill={isBonus ? '#fef3c7' : '#d1fae5'}
                        rx={0.5}
                      />
                    );
                  })}
                </g>
              )}

              {/* Floor label on right face */}
              {(index === 0 || isBonus || index === floors.length - 1) && (
                <text
                  x={iso(hw + 5, 0, z0 + floorH / 2)[0]}
                  y={iso(hw + 5, 0, z0 + floorH / 2)[1]}
                  fontSize="7"
                  fill={isBonus ? GOLD_MAIN : isExisting ? '#9ca3af' : GREEN_MAIN}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontFamily="monospace"
                >
                  {floor.label.length > 12 ? floor.label.slice(0, 12) + '..' : floor.label}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Context buildings (in front) */}
        {contextBuildings
          .filter(b => b.y >= 0 && b.x >= -50)
          .map((b, i) => {
            const topFace = face(
              [[b.x, b.y, b.h], [b.x + b.w, b.y, b.h], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]]
            );
            const rightFace = face(
              [[b.x + b.w, b.y, 0], [b.x + b.w, b.y, b.h], [b.x + b.w, b.y + b.d, b.h], [b.x + b.w, b.y + b.d, 0]]
            );
            const frontFace = face(
              [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]]
            );
            return (
              <g key={`ctx-f-${i}`} opacity="0.35">
                <path d={rightFace} fill="#475569" stroke="#334155" strokeWidth="0.5" />
                <path d={frontFace} fill="#64748b" stroke="#334155" strokeWidth="0.5" />
                <path d={topFace} fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
              </g>
            );
          })}

        {/* Height dimension line */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <line
            x1={iso(-bW/2 - 15, -bD/2, 0)[0]}
            y1={iso(-bW/2 - 15, -bD/2, 0)[1]}
            x2={iso(-bW/2 - 15, -bD/2, buildingTotalH)[0]}
            y2={iso(-bW/2 - 15, -bD/2, buildingTotalH)[1]}
            stroke={GREEN_MAIN}
            strokeWidth="0.8"
            opacity="0.6"
          />
          <text
            x={iso(-bW/2 - 25, -bD/2, buildingTotalH / 2)[0]}
            y={iso(-bW/2 - 25, -bD/2, buildingTotalH / 2)[1]}
            fontSize="9"
            fill={GREEN_MAIN}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {maxFloors}F
          </text>
        </motion.g>

        {/* Area badge */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <rect
            x={svgW / 2 - 45}
            y={10}
            width={90}
            height={24}
            rx={6}
            fill="rgba(0,0,0,0.6)"
            stroke={GREEN_MAIN}
            strokeWidth="0.5"
          />
          <text
            x={svgW / 2}
            y={26}
            fontSize="10"
            fill={GREEN_MAIN}
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {maxBuildableArea.toLocaleString()} {"מ\"ר"}
          </text>
        </motion.g>
      </svg>

      {/* Stats row */}
      <div className="flex items-center gap-6 text-xs">
        <div className="text-center">
          <div className="text-foreground font-bold text-sm">{maxFloors}</div>
          <div className="text-foreground-muted">קומות</div>
        </div>
        <div className="w-px h-6 bg-foreground/10" />
        <div className="text-center">
          <div className="font-bold text-sm" style={{ color: GREEN_MAIN }}>{maxBuildableArea.toLocaleString()}</div>
          <div className="text-foreground-muted">{'מ"ר מותר'}</div>
        </div>
        <div className="w-px h-6 bg-foreground/10" />
        <div className="text-center">
          <div className="text-foreground font-bold text-sm">{currentBuiltArea.toLocaleString()}</div>
          <div className="text-foreground-muted">{'מ"ר קיים'}</div>
        </div>
      </div>
    </div>
  );
}
