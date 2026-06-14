import { describe, it, expect } from 'vitest';
import { classifyDocument, classifyByKeywords, classifyByFileName } from './classifier';

describe('Document Classifier', () => {
  describe('classifyByKeywords', () => {
    it('identifies contract documents', () => {
      const text = 'חוזה פינוי בינוי בין בעלי הדירות לבין היזם...';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('contract');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('identifies building permits', () => {
      const text = 'היתר בניה מספר 12345 ניתן בתאריך...';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('building_permit');
    });

    it('identifies committee decisions', () => {
      const text = 'פרוטוקול ועדה מקומית לתכנון ובניה מיום 15.3.2025';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('committee_decision');
    });

    it('identifies city plans', () => {
      const text = 'תב"ע מספר רע/2025 תוכנית מפורטת לפינוי בינוי...';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('city_plan');
    });

    it('identifies appraisals', () => {
      const text = 'חוות דעת שמאית - הערכת שווי הנכס...';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('appraisal');
    });

    it('identifies tenant lists', () => {
      const text = 'רשימת דיירים - רחוב הרצל 10...';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('tenant_list');
    });

    it('identifies engineering reports', () => {
      const text = 'דו"ח הנדסי - סקר מבנים ובדיקת מבנה...';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('engineering_report');
    });

    it('returns other for unrecognized text', () => {
      const text = 'some random english text without any relevant keywords';
      const result = classifyByKeywords(text);
      expect(result.category).toBe('other');
      expect(result.confidence).toBe(0);
    });
  });

  describe('classifyByFileName', () => {
    it('classifies contract files', () => {
      expect(classifyByFileName('חוזה_פינוי_בינוי.pdf').category).toBe('contract');
    });

    it('classifies permit files', () => {
      expect(classifyByFileName('building_permit_2025.pdf').category).toBe('building_permit');
    });

    it('classifies plan files', () => {
      expect(classifyByFileName('תבע_רע_2025.pdf').category).toBe('city_plan');
    });
  });

  describe('classifyDocument', () => {
    it('prefers content over filename when confident', () => {
      const result = classifyDocument(
        'document.pdf',
        'חוזה פינוי בינוי בין הצדדים...',
      );
      expect(result.category).toBe('contract');
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('falls back to filename when no text', () => {
      const result = classifyDocument('חוזה_הסכם.pdf');
      expect(result.category).toBe('contract');
    });

    it('returns other for unknown documents', () => {
      const result = classifyDocument('IMG_1234.jpg');
      expect(result.category).toBe('other');
    });
  });
});
