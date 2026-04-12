import { describe, it, expect } from 'vitest';
import { evaluateFormula, generateId } from './db';

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId('test');
    const id2 = generateId('test');
    expect(id1).not.toBe(id2);
  });

  it('uses prefix', () => {
    const id = generateId('plan');
    expect(id.startsWith('plan-')).toBe(true);
  });

  it('defaults prefix to id', () => {
    const id = generateId();
    expect(id.startsWith('id-')).toBe(true);
  });
});

describe('evaluateFormula', () => {
  it('evaluates simple multiplication', () => {
    expect(evaluateFormula('Plot_Area * 0.50', { Plot_Area: 1000 })).toBe(500);
  });

  it('evaluates addition', () => {
    expect(evaluateFormula('Plot_Area + 100', { Plot_Area: 500 })).toBe(600);
  });

  it('evaluates complex formulas', () => {
    const result = evaluateFormula('(Plot_Area / 1000) * 12', {
      Plot_Area: 2000,
    });
    expect(result).toBe(24);
  });

  it('substitutes multiple variables', () => {
    const result = evaluateFormula('Num_Units * 25', {
      Plot_Area: 1000,
      Num_Units: 10,
    });
    expect(result).toBe(250);
  });

  it('returns 0 for invalid expressions', () => {
    expect(evaluateFormula('alert("xss")', {})).toBe(0);
  });

  it('returns 0 for division by zero (Infinity)', () => {
    expect(evaluateFormula('1 / 0', {})).toBe(0);
  });

  it('handles plain numbers', () => {
    expect(evaluateFormula('8', {})).toBe(8);
  });

  it('handles decimal results with rounding', () => {
    const result = evaluateFormula('Plot_Area * 0.333', { Plot_Area: 100 });
    expect(result).toBe(33.3);
  });

  it('handles variable names with underscores correctly', () => {
    const result = evaluateFormula('Plot_Area * Num_Floors', {
      Plot_Area: 100,
      Num_Floors: 5,
    });
    expect(result).toBe(500);
  });
});
