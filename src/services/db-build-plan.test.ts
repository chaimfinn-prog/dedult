import { describe, it, expect } from 'vitest';
import { buildPlanFromExtraction } from './db';
import type { ExtractedPlanData } from './db';
import type { ZoningRule } from '@/types';

function makeRule(
  category: string,
  rawNumber: number,
  confirmed = true,
): ZoningRule {
  return {
    id: `rule-${category}`,
    category: category as ZoningRule['category'],
    label: category,
    formula: `Plot_Area * ${rawNumber / 100}`,
    displayValue: `${rawNumber}%`,
    rawNumber,
    unit: 'percent',
    source: {
      documentType: 'takanon',
      documentName: 'test.pdf',
      rawText: 'test',
      confidence: 90,
    },
    confirmed,
  };
}

function makeData(overrides: Partial<ExtractedPlanData> = {}): ExtractedPlanData {
  return {
    planNumber: 'TA-001',
    planName: 'תכנית מגורים א',
    city: 'תל אביב',
    neighborhood: 'פלורנטין',
    approvalDate: '2024-01-01',
    zoningType: 'residential_a',
    rules: [],
    documents: [],
    ...overrides,
  };
}

describe('buildPlanFromExtraction', () => {
  it('builds a plan with correct metadata', () => {
    const plan = buildPlanFromExtraction(makeData(), ['doc1.pdf']);
    expect(plan.planNumber).toBe('TA-001');
    expect(plan.name).toBe('תכנית מגורים א');
    expect(plan.city).toBe('תל אביב');
    expect(plan.neighborhood).toBe('פלורנטין');
    expect(plan.status).toBe('active');
    expect(plan.zoningType).toBe('residential_a');
  });

  it('generates a unique ID', () => {
    const plan1 = buildPlanFromExtraction(makeData(), []);
    const plan2 = buildPlanFromExtraction(makeData(), []);
    expect(plan1.id).not.toBe(plan2.id);
    expect(plan1.id).toMatch(/^plan-/);
  });

  it('defaults missing fields', () => {
    const plan = buildPlanFromExtraction({
      rules: [],
      documents: [],
    }, []);
    expect(plan.planNumber).toBe('');
    expect(plan.name).toBe('');
    expect(plan.city).toBe('');
    expect(plan.zoningType).toBe('residential_a');
    expect(plan.sourceDocument.name).toBe('Uploaded Documents');
  });

  it('joins document names in sourceDocument', () => {
    const plan = buildPlanFromExtraction(makeData(), ['takanon.pdf', 'rights.pdf']);
    expect(plan.sourceDocument.name).toBe('takanon.pdf, rights.pdf');
  });

  it('populates buildingRights from confirmed rules', () => {
    const rules = [
      makeRule('main_rights', 120),
      makeRule('service_area', 25),
      makeRule('max_floors', 8),
      makeRule('max_height', 27),
      makeRule('max_units', 48),
      makeRule('coverage', 50),
      makeRule('basement', 100),
      makeRule('rooftop', 40),
    ];
    const plan = buildPlanFromExtraction(makeData({ rules }), []);
    expect(plan.buildingRights.mainBuildingPercent).toBe(120);
    expect(plan.buildingRights.serviceBuildingPercent).toBe(25);
    expect(plan.buildingRights.totalBuildingPercent).toBe(145);
    expect(plan.buildingRights.maxFloors).toBe(8);
    expect(plan.buildingRights.maxHeight).toBe(27);
    expect(plan.buildingRights.maxUnits).toBe(48);
    expect(plan.buildingRights.landCoveragePercent).toBe(50);
    expect(plan.buildingRights.basementAllowed).toBe(true);
    expect(plan.buildingRights.basementPercent).toBe(100);
    expect(plan.buildingRights.rooftopPercent).toBe(40);
  });

  it('ignores unconfirmed rules', () => {
    const rules = [
      makeRule('main_rights', 120, false),
    ];
    const plan = buildPlanFromExtraction(makeData({ rules }), []);
    expect(plan.buildingRights.mainBuildingPercent).toBe(0); // fallback
  });

  it('populates restrictions from setback rules', () => {
    const rules = [
      makeRule('front_setback', 5),
      makeRule('rear_setback', 4),
      makeRule('side_setback', 3),
      makeRule('parking', 2),
      makeRule('coverage', 60),
    ];
    const plan = buildPlanFromExtraction(makeData({ rules }), []);
    expect(plan.restrictions.frontSetback).toBe(5);
    expect(plan.restrictions.rearSetback).toBe(4);
    expect(plan.restrictions.sideSetback).toBe(3);
    expect(plan.restrictions.minParkingSpaces).toBe(2);
    expect(plan.restrictions.maxLandCoverage).toBe(60);
    expect(plan.restrictions.minGreenAreaPercent).toBe(30);
  });

  it('defaults parking to 1.5 when no rule', () => {
    const plan = buildPlanFromExtraction(makeData(), []);
    expect(plan.restrictions.minParkingSpaces).toBe(1.5);
  });

  it('detects basement from rules', () => {
    const withBasement = buildPlanFromExtraction(
      makeData({ rules: [makeRule('basement', 80)] }),
      [],
    );
    const withoutBasement = buildPlanFromExtraction(makeData(), []);
    expect(withBasement.buildingRights.basementAllowed).toBe(true);
    expect(withoutBasement.buildingRights.basementAllowed).toBe(false);
  });

  it('preserves the rules array on the plan', () => {
    const rules = [makeRule('main_rights', 100)];
    const plan = buildPlanFromExtraction(makeData({ rules }), []);
    expect(plan.rules).toHaveLength(1);
    expect(plan.rules[0].category).toBe('main_rights');
  });

  it('produces a valid ZoningPlan shape', () => {
    const plan = buildPlanFromExtraction(makeData(), []);
    // Verify all required fields exist
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('planNumber');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('city');
    expect(plan).toHaveProperty('neighborhood');
    expect(plan).toHaveProperty('approvalDate');
    expect(plan).toHaveProperty('status');
    expect(plan).toHaveProperty('zoningType');
    expect(plan).toHaveProperty('sourceDocument');
    expect(plan).toHaveProperty('rules');
    expect(plan).toHaveProperty('buildingRights');
    expect(plan).toHaveProperty('restrictions');
    // Verify buildingRights sub-fields
    expect(plan.buildingRights).toHaveProperty('mainBuildingPercent');
    expect(plan.buildingRights).toHaveProperty('serviceBuildingPercent');
    expect(plan.buildingRights).toHaveProperty('totalBuildingPercent');
    expect(plan.buildingRights).toHaveProperty('floorAllocations');
    expect(plan.buildingRights).toHaveProperty('citations');
    // Verify restrictions sub-fields
    expect(plan.restrictions).toHaveProperty('frontSetback');
    expect(plan.restrictions).toHaveProperty('rearSetback');
    expect(plan.restrictions).toHaveProperty('sideSetback');
    expect(plan.restrictions).toHaveProperty('minParkingSpaces');
    expect(plan.restrictions).toHaveProperty('minGreenAreaPercent');
    expect(plan.restrictions).toHaveProperty('maxLandCoverage');
  });
});
