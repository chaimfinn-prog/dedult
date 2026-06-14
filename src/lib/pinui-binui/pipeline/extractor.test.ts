import { describe, it, expect } from 'vitest';
import { extractFields } from './extractor';

describe('Field Extractor', () => {
  describe('contract extraction', () => {
    it('extracts contract date', () => {
      const text = 'חוזה זה נחתם ביום 15/03/2025 בין הצדדים';
      const result = extractFields(text, 'contract');
      expect(result.fields.contractDate).toBe('15/03/2025');
    });

    it('extracts unit count', () => {
      const text = 'הפרויקט כולל 48 דירות קיימות';
      const result = extractFields(text, 'contract');
      expect(result.fields.existingUnits).toBe(48);
    });

    it('extracts tenant upgrade size', () => {
      const text = 'כל דייר יקבל תוספת של 12 מ"ר';
      const result = extractFields(text, 'contract');
      expect(result.fields.tenantUpgradeSqm).toBe(12);
    });

    it('extracts developer name', () => {
      const text = 'היזם: חברת אזורים בניה והשקעות';
      const result = extractFields(text, 'contract');
      expect(result.fields.developerName).toBe('חברת אזורים בניה והשקעות');
    });

    it('extracts approval percentage', () => {
      const text = 'הושגו 80% מהדיירים חתימות';
      const result = extractFields(text, 'contract');
      expect(result.fields.tenantApprovalPct).toBe(80);
    });
  });

  describe('building permit extraction', () => {
    it('extracts permit number', () => {
      const text = 'היתר מספר 2025/1234 ניתן';
      const result = extractFields(text, 'building_permit');
      expect(result.fields.permitNumber).toBe('2025/1234');
    });

    it('extracts approved floors', () => {
      const text = 'אושרו 16 קומות מעל הקרקע';
      const result = extractFields(text, 'building_permit');
      expect(result.fields.approvedFloors).toBe(16);
    });

    it('extracts approved units', () => {
      const text = 'הפרויקט יכלול 120 דירות';
      const result = extractFields(text, 'building_permit');
      expect(result.fields.approvedUnits).toBe(120);
    });
  });

  describe('committee decision extraction', () => {
    it('detects approval', () => {
      const text = 'הוחלט לאשר את התוכנית';
      const result = extractFields(text, 'committee_decision');
      expect(result.fields.approved).toBe(true);
    });

    it('detects rejection', () => {
      const text = 'הוחלט לדחות את הבקשה';
      const result = extractFields(text, 'committee_decision');
      expect(result.fields.approved).toBe(false);
    });

    it('detects conditions', () => {
      const text = 'אושרה בתנאים הבאים: 1. ...';
      const result = extractFields(text, 'committee_decision');
      expect(result.fields.hasConditions).toBe(true);
    });
  });

  describe('city plan extraction', () => {
    it('extracts coverage percentage', () => {
      const text = 'כיסוי: 40%';
      const result = extractFields(text, 'city_plan');
      expect(result.fields.coveragePct).toBe(40);
    });

    it('extracts max floors', () => {
      const text = 'הבניין יכלול 20 קומות';
      const result = extractFields(text, 'city_plan');
      expect(result.fields.maxFloors).toBe(20);
    });
  });

  describe('engineering report extraction', () => {
    it('extracts year built', () => {
      const text = 'המבנה נבנה ב-1968';
      const result = extractFields(text, 'engineering_report');
      expect(result.fields.yearBuilt).toBe(1968);
    });

    it('detects earthquake resistance', () => {
      const text = 'המבנה אינו עמיד לרעידות אדמה';
      const result = extractFields(text, 'engineering_report');
      expect(result.fields.earthquakeResistant).toBe(false);
    });
  });

  describe('other category', () => {
    it('returns empty fields', () => {
      const result = extractFields('some text', 'other');
      expect(Object.keys(result.fields)).toHaveLength(0);
    });
  });
});
