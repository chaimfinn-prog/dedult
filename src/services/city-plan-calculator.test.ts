import { describe, it, expect } from 'vitest';
import { calculateCityPlan } from './city-plan-calculator';
import type { CityPlanConfig, CityPlanInput } from '@/data/plans/types';
import raananaConfig from '@/data/plans/raanana-416-1060052.json';

const config = raananaConfig as CityPlanConfig;

function makeInput(overrides: Partial<CityPlanInput> = {}): CityPlanInput {
  return {
    plotArea: 1000,
    plotWidth: 25,
    plotDepth: 40,
    existingFloors: 2,
    existingBuiltArea: 0,
    existingUnits: 0,
    existingAvgUnitSize: 0,
    smallApartmentPct: 40,
    hasRoofApartment: false,
    selectedBonusIds: [],
    ...overrides,
  };
}

describe('calculateCityPlan — Ra\'anana 416-1060052', () => {
  // ── Coverage ──
  describe('coverage', () => {
    it('uses 55% for area <= 2000', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 1000 }), config);
      expect(r.coveragePct).toBe(55);
      expect(r.coverageArea).toBe(550);
    });

    it('uses 55% for area = 2000 (boundary)', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 2000 }), config);
      expect(r.coveragePct).toBe(55);
    });

    it('uses 50% for area > 2000', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 2500 }), config);
      expect(r.coveragePct).toBe(50);
    });
  });

  // ── Coefficient ──
  describe('coefficient table', () => {
    it('uses 6.5 for 2 existing floors', () => {
      const r = calculateCityPlan(makeInput({ existingFloors: 2 }), config);
      expect(r.coefficient).toBe(6.5);
      expect(r.maxFloorsLabel).toBe("ק'+6+גג");
    });

    it('uses 8 for 3 existing floors', () => {
      const r = calculateCityPlan(makeInput({ existingFloors: 3 }), config);
      expect(r.coefficient).toBe(8);
      expect(r.maxFloorsLabel).toBe("ק'+7+גג");
    });

    it('uses 8.5 for 4 existing floors', () => {
      const r = calculateCityPlan(makeInput({ existingFloors: 4 }), config);
      expect(r.coefficient).toBe(8.5);
      expect(r.maxFloorsLabel).toBe("ק'+8+גג");
    });

    it('caps at max coefficient for floors > 4', () => {
      const r = calculateCityPlan(makeInput({ existingFloors: 6 }), config);
      expect(r.coefficient).toBe(8.5);
    });
  });

  // ── Base rights ──
  describe('base rights', () => {
    it('calculates area * coverage * coefficient', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 1000, existingFloors: 2 }), config);
      // 1000 * 0.55 * 6.5 = 3575
      expect(r.baseRights).toBe(3575);
    });

    it('calculates for large plot with different coverage', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 3000, existingFloors: 3 }), config);
      // 3000 * 0.50 * 8 = 12000
      expect(r.baseRights).toBe(12000);
    });
  });

  // ── Bonuses ──
  describe('bonuses', () => {
    it('adds no bonus when none selected', () => {
      const r = calculateCityPlan(makeInput(), config);
      expect(r.totalBonusPct).toBe(0);
      expect(r.bonusRights).toBe(0);
      expect(r.bonusBreakdown).toHaveLength(0);
    });

    it('adds single bonus correctly', () => {
      const r = calculateCityPlan(makeInput({ selectedBonusIds: ['park'] }), config);
      expect(r.totalBonusPct).toBe(5);
      expect(r.bonusBreakdown).toHaveLength(1);
      expect(r.bonusBreakdown[0].pct).toBe(5);
      // base = 3575, bonus = 3575 * 5% = 179 (rounded)
      expect(r.bonusRights).toBe(179);
    });

    it('stacks multiple bonuses', () => {
      const r = calculateCityPlan(makeInput({ selectedBonusIds: ['park', 'merge', 'setb'] }), config);
      expect(r.totalBonusPct).toBe(20); // 5 + 10 + 5
      expect(r.bonusBreakdown).toHaveLength(3);
    });

    it('stacks all bonuses', () => {
      const r = calculateCityPlan(makeInput({
        selectedBonusIds: ['park', 'merge', 'setb', 'mamak', 'roof'],
      }), config);
      expect(r.totalBonusPct).toBe(30); // 5+10+5+5+5
      // base = 3575, bonus = 3575 * 30% = 1073
      expect(r.bonusRights).toBe(1073);
      expect(r.residentialRights).toBe(3575 + 1073);
    });
  });

  // ── Total above ground ──
  describe('total above ground', () => {
    it('adds public use only above threshold', () => {
      const small = calculateCityPlan(makeInput({ plotArea: 1500 }), config);
      expect(small.publicUse).toBe(0);

      const large = calculateCityPlan(makeInput({ plotArea: 2500 }), config);
      expect(large.publicUse).toBe(450);
    });

    it('always adds shared areas', () => {
      const r = calculateCityPlan(makeInput(), config);
      expect(r.sharedAreas).toBe(50);
    });

    it('total = residential + public + shared', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 2500, existingFloors: 2 }), config);
      expect(r.totalAboveGround).toBe(r.residentialRights + r.publicUse + r.sharedAreas);
    });
  });

  // ── Units ──
  describe('unit calculation', () => {
    it('takes min of area-based and density-based units', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 1000 }), config);
      // density: floor(1000/1000 * 45) = 45
      expect(r.maxUnitsByDensity).toBe(45);
      expect(r.maxUnits).toBe(Math.min(r.maxUnitsByArea, r.maxUnitsByDensity));
    });

    it('splits small/large units by percentage', () => {
      const r = calculateCityPlan(makeInput({ smallApartmentPct: 40 }), config);
      expect(r.smallUnits).toBe(Math.round(r.maxUnits * 0.4));
      expect(r.largeUnits).toBe(r.maxUnits - r.smallUnits);
    });
  });

  // ── Setbacks ──
  describe('setbacks', () => {
    it('uses 2.5/3.0 for width <= 18', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 15 }), config);
      expect(r.setbacks!.side).toBe(2.5);
      expect(r.setbacks!.rear).toBe(3.0);
      expect(r.setbacks!.front).toBe(3.0);
    });

    it('uses 3.0/3.0 for width 18-20', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 19 }), config);
      expect(r.setbacks!.side).toBe(3.0);
      expect(r.setbacks!.rear).toBe(3.0);
    });

    it('uses 3.5/3.5 for width 20-40', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 25 }), config);
      expect(r.setbacks!.side).toBe(3.5);
      expect(r.setbacks!.rear).toBe(3.5);
    });

    it('uses 4.0/4.0 for width > 40', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 50 }), config);
      expect(r.setbacks!.side).toBe(4.0);
      expect(r.setbacks!.rear).toBe(4.0);
    });

    it('returns null setbacks when width is 0', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 0 }), config);
      expect(r.setbacks).toBeNull();
    });

    it('calculates buildable footprint', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 25, plotDepth: 40 }), config);
      // side=3.5, rear=3.5, front=3.0
      // netW = 25 - 2*3.5 = 18, netD = 40 - 3.0 - 3.5 = 33.5
      expect(r.buildableWidth).toBeCloseTo(18, 1);
      expect(r.buildableDepth).toBeCloseTo(33.5, 1);
      expect(r.buildableFootprint).toBeCloseTo(18 * 33.5, 0);
    });
  });

  // ── Extra areas ──
  describe('extra areas', () => {
    it('calculates balconies', () => {
      const r = calculateCityPlan(makeInput(), config);
      expect(r.balconies).toBe(r.maxUnits * 15);
    });

    it('calculates underground per level', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 1000 }), config);
      expect(r.undergroundPerLevel).toBe(850); // 1000 * 85%
    });

    it('calculates storage', () => {
      const r = calculateCityPlan(makeInput(), config);
      expect(r.storage).toBe(r.maxUnits * 6);
    });

    it('calculates max commercial', () => {
      const r = calculateCityPlan(makeInput(), config);
      expect(r.maxCommercial).toBe(Math.round(r.residentialRights * 0.15));
    });
  });

  // ── Existing vs proposed ──
  describe('existing vs proposed', () => {
    it('returns null when no existing units', () => {
      const r = calculateCityPlan(makeInput({ existingUnits: 0 }), config);
      expect(r.unitGain).toBeNull();
    });

    it('calculates unit gain', () => {
      const r = calculateCityPlan(makeInput({ existingUnits: 10 }), config);
      expect(r.unitGain).toBe(r.maxUnits - 10);
    });

    it('calculates area ratio', () => {
      const r = calculateCityPlan(makeInput({
        existingUnits: 10,
        existingAvgUnitSize: 80,
        existingFloors: 3,
      }), config);
      // existing total = 10 * 80 * 3 = 2400
      expect(r.areaRatio).toBeCloseTo(r.residentialRights / 2400, 2);
    });
  });

  // ── Audit trail ──
  describe('audit trail', () => {
    it('produces calculation steps', () => {
      const r = calculateCityPlan(makeInput(), config);
      expect(r.steps.length).toBeGreaterThanOrEqual(5);
      expect(r.steps[0].step).toBe(1);
    });

    it('includes setback step when width provided', () => {
      const r = calculateCityPlan(makeInput({ plotWidth: 25 }), config);
      const setbackStep = r.steps.find(s => s.title === 'קווי בניין');
      expect(setbackStep).toBeDefined();
    });
  });

  // ── Edge cases ──
  describe('edge cases', () => {
    it('handles zero plot area', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 0 }), config);
      expect(r.baseRights).toBe(0);
      expect(r.maxUnits).toBe(0);
      expect(r.totalAboveGround).toBe(50); // shared only
    });

    it('handles very small plot', () => {
      const r = calculateCityPlan(makeInput({ plotArea: 100 }), config);
      expect(r.baseRights).toBeGreaterThan(0);
      expect(r.coveragePct).toBe(55);
    });
  });
});
