import { describe, it, expect } from 'vitest';
import { evaluateFormula } from './db';

describe('evaluateFormula — security', () => {
  // ── Injection attacks ──
  it('blocks alert() injection', () => {
    expect(evaluateFormula('alert("xss")', {})).toBe(0);
  });

  it('blocks require() injection', () => {
    expect(evaluateFormula('require("fs").readFileSync("/etc/passwd")', {})).toBe(0);
  });

  it('blocks process.exit injection', () => {
    expect(evaluateFormula('process.exit(1)', {})).toBe(0);
  });

  it('blocks eval() injection', () => {
    expect(evaluateFormula('eval("1+1")', {})).toBe(0);
  });

  it('blocks Function constructor injection', () => {
    expect(evaluateFormula('Function("return 1")()', {})).toBe(0);
  });

  it('blocks import() injection', () => {
    expect(evaluateFormula('import("fs")', {})).toBe(0);
  });

  it('blocks globalThis access', () => {
    expect(evaluateFormula('globalThis.process', {})).toBe(0);
  });

  it('blocks this access', () => {
    expect(evaluateFormula('this.constructor', {})).toBe(0);
  });

  it('blocks constructor access', () => {
    expect(evaluateFormula('constructor.constructor("return 1")()', {})).toBe(0);
  });

  it('blocks __proto__ access', () => {
    expect(evaluateFormula('({}).__proto__', {})).toBe(0);
  });

  it('blocks fetch() call', () => {
    expect(evaluateFormula('fetch("https://evil.com")', {})).toBe(0);
  });

  it('blocks template literal injection', () => {
    expect(evaluateFormula('`${process.env}`', {})).toBe(0);
  });

  it('blocks semicolon command chaining', () => {
    expect(evaluateFormula('1; process.exit()', {})).toBe(0);
  });

  it('blocks assignment operators', () => {
    expect(evaluateFormula('x = 1', {})).toBe(0);
  });

  it('blocks comma operator tricks', () => {
    expect(evaluateFormula('1, process.exit()', {})).toBe(0);
  });

  it('blocks array access', () => {
    expect(evaluateFormula('[1][0]', {})).toBe(0);
  });

  it('blocks curly braces (object/block)', () => {
    expect(evaluateFormula('{a: 1}', {})).toBe(0);
  });

  // ── Valid formulas still work ──
  it('allows basic arithmetic', () => {
    expect(evaluateFormula('100 + 200', {})).toBe(300);
    expect(evaluateFormula('500 - 100', {})).toBe(400);
    expect(evaluateFormula('10 * 5', {})).toBe(50);
    expect(evaluateFormula('100 / 4', {})).toBe(25);
  });

  it('allows parenthesized expressions', () => {
    expect(evaluateFormula('(100 + 200) * 0.5', {})).toBe(150);
  });

  it('allows decimal numbers', () => {
    expect(evaluateFormula('1000 * 0.35', {})).toBe(350);
  });

  it('allows variable substitution then safe evaluation', () => {
    expect(evaluateFormula('Plot_Area * 1.2', { Plot_Area: 500 })).toBe(600);
  });

  // ── Edge cases ──
  it('returns 0 for division by zero', () => {
    expect(evaluateFormula('1 / 0', {})).toBe(0);
  });

  it('returns 0 for NaN results', () => {
    expect(evaluateFormula('0 / 0', {})).toBe(0);
  });

  it('returns 0 for empty formula after substitution', () => {
    expect(evaluateFormula('', {})).toBe(0);
  });

  it('handles variable names that are substrings of each other', () => {
    // "Num" is a substring of "Num_Floors" — longest-first substitution prevents partial match
    const result = evaluateFormula('Num_Floors * Num_Units', {
      Num_Floors: 8,
      Num_Units: 10,
    });
    expect(result).toBe(80);
  });

  it('handles negative results', () => {
    expect(evaluateFormula('100 - 200', {})).toBe(-100);
  });
});
