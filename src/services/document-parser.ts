/**
 * Deep Document Parser — Auto-Ingest Zoning Engine
 *
 * Extracts zoning rules as FORMULAS from uploaded PDF documents.
 * Supports three document types: Takanon, Rights Table, Annexes.
 * Uses Hebrew regex patterns + table structure detection.
 * Returns ZoningRule[] with source citations for verification.
 */

import type {
  ZoningRule, ZoningRuleCategory, RuleUnit,
  DocumentType, RuleSource,
} from '@/types';
import { generateId } from './db';

// ── Types ─────────────────────────────────────────────────────

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocumentResult {
  pages: PdfPage[];
  fullText: string;
  rules: ZoningRule[];
  metadata: ExtractedMetadata;
  confidence: number;
}

export interface ExtractedMetadata {
  planNumber?: string;
  planName?: string;
  city?: string;
  neighborhood?: string;
  approvalDate?: string;
  zoningType?: string;
}

// ── PDF Text Extraction ───────────────────────────────────────

export async function extractTextFromPdf(file: File): Promise<PdfPage[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    }).promise;

    const pages: PdfPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = content.items
          .map((item: any) => (item.str || ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        pages.push({ pageNumber: i, text });
      } catch (pageErr) {
        console.warn(`Failed to extract page ${i}:`, pageErr);
        pages.push({ pageNumber: i, text: '' });
      }
    }

    return pages;
  } catch (err) {
    console.error('PDF extraction failed:', err);
    throw new Error(`שגיאה בקריאת PDF: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
  }
}

// ── Rule Extraction Pattern Definitions ──────────────────────

interface RulePattern {
  category: ZoningRuleCategory;
  label: string;
  patterns: RegExp[];
  unit: RuleUnit;
  formulaTemplate: (value: number) => string;
  displayTemplate: (value: number) => string;
}

const RULE_PATTERNS: RulePattern[] = [
  // ── Main Building Rights ──
  {
    category: 'main_rights',
    label: 'זכויות בנייה עיקריות',
    patterns: [
      /(?:אחוזי|שטחי?)\s*בני(?:י|ה)\s*עיקרי(?:ים|ת)?[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /שטח\s*עיקרי[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /בנייה\s*עיקרית[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /עיקרי[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /(\d{2,3}(?:\.\d+)?)\s*%\s*(?:שטח\s*)?עיקרי/,
      /זכויות\s*בנייה[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /סה"כ\s*(?:אחוזי\s*)?בנייה[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /(?:שטח\s*)?בנייה\s*(?:מותרת|מרבית)[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── Service Area ──
  {
    category: 'service_area',
    label: 'שטחי שירות',
    patterns: [
      /(?:אחוזי|שטחי?)\s*(?:בני(?:י|ה)\s*)?שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:שטח\s*)?שירות/,
      /שטחי?\s*שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── Balcony ──
  {
    category: 'balcony',
    label: 'מרפסות',
    patterns: [
      /מרפס(?:ו|ו)ת[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*מרפס/,
      /מרפס(?:ו|ו)ת\s*(?:פתוחות|מקורות)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /שטח\s*מרפסות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── TMA 38 / Renewal ──
  {
    category: 'tma38',
    label: 'תמ"א 38 / התחדשות',
    patterns: [
      /תמ"?א\s*38[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /תמ"?א\s*38.*?(\d{2,3}(?:\.\d+)?)\s*%/,
      /התחדשות\s*עירונית.*?(\d{2,3}(?:\.\d+)?)\s*%/,
      /(?:תוספת|הגדלה)\s*(?:לפי\s*)?תמ"?א\s*38[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── Coverage (Tachsit) ──
  {
    category: 'coverage',
    label: 'תכסית',
    patterns: [
      /תכסית[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(?:כיסוי|תכסית)\s*(?:קרקע|מגרש)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*תכסית/,
      /שטח\s*(?:תכסית|כיסוי)[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── Max Floors ──
  {
    category: 'max_floors',
    label: 'קומות מרביות',
    patterns: [
      /(?:מספר|מס'?)\s*קומות\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי)[:\s]*(\d{1,3})/,
      /(?:עד|מרבי|מקסימום)\s*(\d{1,2})\s*קומות/,
      /קומות[:\s]*(?:עד\s*)?(\d{1,2})/,
      /(\d{1,2})\s*קומות\s*(?:מעל\s*ה?קרקע|על\s*קרקעיות)/,
      /גובה[:\s]*(\d{1,2})\s*קומות/,
      /מותר\s*(?:עד\s*)?(\d{1,2})\s*קומות/,
    ],
    unit: 'floors',
    formulaTemplate: (v) => `${v}`,
    displayTemplate: (v) => `${v} קומות`,
  },

  // ── Max Height ──
  {
    category: 'max_height',
    label: 'גובה מרבי',
    patterns: [
      /גובה\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי|בניין)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /(?:עד|מרבי)\s*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')\s*(?:גובה)?/,
      /(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')\s*גובה/,
      /גובה\s*(?:בניין|מבנה)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*מ/,
    ],
    unit: 'meters',
    formulaTemplate: (v) => `${v}`,
    displayTemplate: (v) => `${v} מ'`,
  },

  // ── Max Units ──
  {
    category: 'max_units',
    label: 'יחידות דיור מרביות',
    patterns: [
      /(?:מספר|מס'?)\s*יח(?:ידות)?\s*(?:ד(?:יור)?|דירות)\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי)?[:\s]*(\d{1,4})/,
      /צפיפות[:\s]*(?:עד\s*)?(\d{1,4})\s*(?:יח(?:ידות)?|דירות)/,
      /(?:עד|מרבי)\s*(\d{1,4})\s*יח(?:ידות)?\s*(?:ד(?:יור)?)?/,
      /(\d{1,4})\s*(?:יחידות\s*דיור|יח"ד|דירות)/,
    ],
    unit: 'units',
    formulaTemplate: (v) => `${v}`,
    displayTemplate: (v) => `${v} יח"ד`,
  },

  // ── Units per Dunam ──
  {
    category: 'units_per_dunam',
    label: 'צפיפות (יח"ד לדונם)',
    patterns: [
      /(\d{1,3}(?:\.\d+)?)\s*(?:יח(?:ידות)?|יח"ד)\s*(?:ל|\/)\s*(?:דונם|דנם)/,
      /צפיפות[:\s]*(\d{1,3}(?:\.\d+)?)\s*(?:ל|\/)\s*(?:דונם|דנם)/,
      /(?:דונם|דנם)[:\s]*(\d{1,3}(?:\.\d+)?)\s*(?:יח(?:ידות)?|יח"ד)/,
    ],
    unit: 'ratio',
    formulaTemplate: (v) => `(Plot_Area / 1000) * ${v}`,
    displayTemplate: (v) => `${v} יח"ד/דונם`,
  },

  // ── Setbacks ──
  {
    category: 'front_setback',
    label: 'קו בניין קדמי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ'|מטר)/,
      /(?:קו\s*בניין|נסיגה)\s*קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)/,
    ],
    unit: 'meters',
    formulaTemplate: (v) => `${v}`,
    displayTemplate: (v) => `${v} מ'`,
  },
  {
    category: 'rear_setback',
    label: 'קו בניין אחורי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ'|מטר)/,
      /(?:קו\s*בניין|נסיגה)\s*אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)/,
    ],
    unit: 'meters',
    formulaTemplate: (v) => `${v}`,
    displayTemplate: (v) => `${v} מ'`,
  },
  {
    category: 'side_setback',
    label: 'קו בניין צידי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ'|מטר)/,
      /(?:קו\s*בניין|נסיגה)\s*צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)/,
    ],
    unit: 'meters',
    formulaTemplate: (v) => `${v}`,
    displayTemplate: (v) => `${v} מ'`,
  },

  // ── Basement ──
  {
    category: 'basement',
    label: 'מרתף',
    patterns: [
      /מרתף[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(?:קומת\s*)?מרתף.*?(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*מרתף/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── Rooftop ──
  {
    category: 'rooftop',
    label: 'גג',
    patterns: [
      /גג[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(?:קומת\s*)?גג.*?(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*גג/,
    ],
    unit: 'percent',
    formulaTemplate: (v) => `Plot_Area * ${(v / 100).toFixed(2)}`,
    displayTemplate: (v) => `${v}%`,
  },

  // ── Parking ──
  {
    category: 'parking',
    label: 'חניה',
    patterns: [
      /(?:חנייה|חניה|חניון)[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מקומות|חניות)\s*(?:ל|\/)\s*(?:יח(?:ידה)?|דירה)/,
      /(\d{1,2}(?:\.\d+)?)\s*(?:מקומות?\s*)?(?:חנייה|חניה)\s*(?:ל|\/)\s*(?:יח|דירה)/,
      /(?:חנייה|חניה)[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:ל|\/)\s*(?:יח|דירה)/,
    ],
    unit: 'spaces',
    formulaTemplate: (v) => `Num_Units * ${v}`,
    displayTemplate: (v) => `${v} חניות ליח'`,
  },
];

// ── Service area per-unit detection (special case) ──

const SERVICE_PER_UNIT_PATTERNS: RegExp[] = [
  /שירות[:\s]*(\d{1,3})\s*(?:מ"ר|מ"ר|מטר)\s*(?:ל|\/)\s*(?:יח(?:ידה)?|דירה|יח"ד)/,
  /(\d{1,3})\s*(?:מ"ר|מ"ר)\s*(?:שירות\s*)?(?:ל|\/)\s*(?:יח(?:ידה)?|דירה)/,
  /שטח(?:י)?\s*שירות[:\s]*(\d{1,3})\s*(?:מ"ר|מ"ר)\s*(?:ל|\/|לכל)\s*(?:יח|דירה)/,
];

// ── Metadata Extraction Patterns ─────────────────────────────

interface MetaPattern {
  field: keyof ExtractedMetadata;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray) => string;
}

const META_PATTERNS: MetaPattern[] = [
  {
    field: 'planNumber',
    patterns: [
      /תכנית\s+(?:מס(?:פר)?[.'"]?\s*)?([א-ת]{1,3}[\/\-]\d{2,5}[a-zA-Zא-ת]*)/,
      /([א-ת]{1,3}[\/\-]\d{2,5}[a-zA-Zא-ת]*)\s*[-–]\s*תכנית/,
      /מספר\s+תכנית[:\s]+([א-ת]{1,3}[\/\-]\d{2,5})/,
      /תב"ע\s+([א-ת]{1,3}[\/\-]\d{2,5})/,
      /([א-ת]{1,4}[\/\-]\d+(?:[\/\-]\d+)?)/,
    ],
    extract: (m) => m[1],
  },
  {
    field: 'planName',
    patterns: [
      /שם\s+(?:ה)?תכנית[:\s]+([\u0590-\u05FF\s,\-().0-9]{3,60})/,
      /תכנית\s+(?:ל|ה)([\u0590-\u05FF\s,\-]{3,60}?)(?:\.|$)/,
    ],
    extract: (m) => m[1].trim(),
  },
  {
    field: 'city',
    patterns: [
      /(?:עיר|יישוב|רשות\s*מקומית)[:\s]+([\u0590-\u05FF]+)/,
      /(?:בתחום|באזור)\s+([\u0590-\u05FF]+)/,
    ],
    extract: (m) => m[1].trim(),
  },
  {
    field: 'neighborhood',
    patterns: [
      /שכונ(?:ה|ת)\s+([\u0590-\u05FF\s]+?)(?:\.|,|$)/,
    ],
    extract: (m) => m[1].trim(),
  },
];

// ── Table Structure Detection ────────────────────────────────

interface TableRow {
  text: string;
  numbers: number[];
  pageNumber: number;
}

/**
 * Detect table-like structures in text.
 * Looks for lines with multiple numbers that might be rights tables.
 */
function detectTableRows(pages: PdfPage[]): TableRow[] {
  const rows: TableRow[] = [];

  for (const page of pages) {
    // Split by potential row delimiters
    const segments = page.text.split(/[|│║]/);

    for (const segment of segments) {
      const numbers = segment.match(/\d{1,3}(?:\.\d+)?/g);
      if (numbers && numbers.length >= 2) {
        rows.push({
          text: segment.trim(),
          numbers: numbers.map(Number),
          pageNumber: page.pageNumber,
        });
      }
    }
  }

  return rows;
}

/**
 * Try to extract rules from detected table rows.
 * Looks for common patterns like "percentage + floor count" combinations.
 */
function extractRulesFromTables(
  tableRows: TableRow[],
  docType: DocumentType,
  docName: string,
  existingCategories: Set<string>
): ZoningRule[] {
  const rules: ZoningRule[] = [];

  for (const row of tableRows) {
    const text = row.text;

    // Check if this row contains rights-related Hebrew keywords
    if (/עיקרי/.test(text) && !existingCategories.has('main_rights')) {
      for (const num of row.numbers) {
        if (num >= 20 && num <= 400) {
          rules.push(createRule('main_rights', 'זכויות בנייה עיקריות (מטבלה)', num, 'percent',
            `Plot_Area * ${(num / 100).toFixed(2)}`, `${num}%`,
            docType, docName, row.pageNumber, 'שורת טבלה', text, 70));
          existingCategories.add('main_rights');
          break;
        }
      }
    }

    if (/שירות/.test(text) && !existingCategories.has('service_area')) {
      for (const num of row.numbers) {
        if (num >= 5 && num <= 100) {
          rules.push(createRule('service_area', 'שטחי שירות (מטבלה)', num, 'percent',
            `Plot_Area * ${(num / 100).toFixed(2)}`, `${num}%`,
            docType, docName, row.pageNumber, 'שורת טבלה', text, 70));
          existingCategories.add('service_area');
          break;
        }
      }
    }

    if (/תכסית|כיסוי/.test(text) && !existingCategories.has('coverage')) {
      for (const num of row.numbers) {
        if (num >= 10 && num <= 100) {
          rules.push(createRule('coverage', 'תכסית (מטבלה)', num, 'percent',
            `Plot_Area * ${(num / 100).toFixed(2)}`, `${num}%`,
            docType, docName, row.pageNumber, 'שורת טבלה', text, 70));
          existingCategories.add('coverage');
          break;
        }
      }
    }

    if (/קומות/.test(text) && !existingCategories.has('max_floors')) {
      for (const num of row.numbers) {
        if (num >= 1 && num <= 50) {
          rules.push(createRule('max_floors', 'קומות מרביות (מטבלה)', num, 'floors',
            `${num}`, `${num} קומות`,
            docType, docName, row.pageNumber, 'שורת טבלה', text, 70));
          existingCategories.add('max_floors');
          break;
        }
      }
    }
  }

  return rules;
}

// ── Rule Creation Helper ─────────────────────────────────────

function createRule(
  category: ZoningRuleCategory,
  label: string,
  rawNumber: number,
  unit: RuleUnit,
  formula: string,
  displayValue: string,
  documentType: DocumentType,
  documentName: string,
  pageNumber: number | undefined,
  tableRef: string | undefined,
  rawText: string,
  confidence: number,
): ZoningRule {
  return {
    id: generateId('rule'),
    category,
    label,
    formula,
    displayValue,
    rawNumber,
    unit,
    source: {
      documentType,
      documentName,
      pageNumber,
      tableRef,
      rawText: rawText.substring(0, 200),
      confidence,
    },
    confirmed: false,
  };
}

// ── Core Parsing Engine ──────────────────────────────────────

/**
 * Extract rules from a single document using pattern matching.
 */
function extractRulesFromPatterns(
  pages: PdfPage[],
  docType: DocumentType,
  docName: string,
): ZoningRule[] {
  const fullText = pages.map(p => p.text).join('\n');
  const rules: ZoningRule[] = [];
  const foundCategories = new Set<string>();

  // Phase 1: Pattern-based extraction
  for (const rulePattern of RULE_PATTERNS) {
    if (foundCategories.has(rulePattern.category)) continue;

    let found = false;

    // Search page by page
    for (const pattern of rulePattern.patterns) {
      if (found) break;
      for (const page of pages) {
        if (!page.text) continue;
        const match = page.text.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (!isNaN(value) && value > 0) {
            rules.push(createRule(
              rulePattern.category,
              rulePattern.label,
              value,
              rulePattern.unit,
              rulePattern.formulaTemplate(value),
              rulePattern.displayTemplate(value),
              docType,
              docName,
              page.pageNumber,
              undefined,
              match[0],
              85,
            ));
            foundCategories.add(rulePattern.category);
            found = true;
            break;
          }
        }
      }
    }

    // Fallback: search in full concatenated text
    if (!found && fullText.length > 0) {
      for (const pattern of rulePattern.patterns) {
        const match = fullText.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (!isNaN(value) && value > 0) {
            rules.push(createRule(
              rulePattern.category,
              rulePattern.label,
              value,
              rulePattern.unit,
              rulePattern.formulaTemplate(value),
              rulePattern.displayTemplate(value),
              docType,
              docName,
              undefined,
              undefined,
              match[0],
              70,
            ));
            foundCategories.add(rulePattern.category);
            break;
          }
        }
      }
    }
  }

  // Phase 2: Service area per-unit detection (special formula)
  if (!foundCategories.has('service_area')) {
    for (const pattern of SERVICE_PER_UNIT_PATTERNS) {
      for (const page of pages) {
        if (!page.text) continue;
        const match = page.text.match(pattern);
        if (match) {
          const value = parseInt(match[1]);
          if (value > 0 && value <= 200) {
            rules.push(createRule(
              'service_area',
              'שטחי שירות (ליחידה)',
              value,
              'sqm_per_unit',
              `Num_Units * ${value}`,
              `${value} מ"ר ליח'`,
              docType,
              docName,
              page.pageNumber,
              undefined,
              match[0],
              80,
            ));
            foundCategories.add('service_area');
            break;
          }
        }
      }
      if (foundCategories.has('service_area')) break;
    }
  }

  // Phase 3: Table detection
  const tableRows = detectTableRows(pages);
  if (tableRows.length > 0) {
    const tableRules = extractRulesFromTables(tableRows, docType, docName, foundCategories);
    rules.push(...tableRules);
  }

  return rules;
}

/**
 * Extract plan metadata from document text.
 */
function extractMetadata(pages: PdfPage[]): ExtractedMetadata {
  const fullText = pages.map(p => p.text).join('\n');
  const metadata: ExtractedMetadata = {};

  for (const meta of META_PATTERNS) {
    let found = false;

    // Page-by-page search
    for (const pattern of meta.patterns) {
      if (found) break;
      for (const page of pages) {
        if (!page.text) continue;
        const match = page.text.match(pattern);
        if (match) {
          (metadata as Record<string, string>)[meta.field] = meta.extract(match);
          found = true;
          break;
        }
      }
    }

    // Fallback: full text
    if (!found && fullText.length > 0) {
      for (const pattern of meta.patterns) {
        const match = fullText.match(pattern);
        if (match) {
          (metadata as Record<string, string>)[meta.field] = meta.extract(match);
          break;
        }
      }
    }
  }

  // Detect zoning type from keywords
  if (!metadata.zoningType) {
    if (/מגורים\s*[אa]/i.test(fullText)) metadata.zoningType = 'residential_a';
    else if (/מגורים\s*[בb]/i.test(fullText)) metadata.zoningType = 'residential_b';
    else if (/מגורים\s*[גc]/i.test(fullText)) metadata.zoningType = 'residential_c';
    else if (/מסחר|מסחרי/.test(fullText)) metadata.zoningType = 'commercial';
    else if (/שימוש\s*מעורב/.test(fullText)) metadata.zoningType = 'mixed_use';
    else if (/תעשי/.test(fullText)) metadata.zoningType = 'industrial';
  }

  return metadata;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Parse a single document: extract text -> find rules -> extract metadata.
 */
export async function parseDocument(
  file: File,
  docType: DocumentType,
): Promise<ParsedDocumentResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext !== 'pdf') {
    return {
      pages: [{ pageNumber: 1, text: '' }],
      fullText: '',
      rules: [],
      metadata: {},
      confidence: 0,
    };
  }

  const pages = await extractTextFromPdf(file);
  const rules = extractRulesFromPatterns(pages, docType, file.name);
  const metadata = extractMetadata(pages);

  const totalPossible = RULE_PATTERNS.length;
  const found = rules.length;
  const avgConf = rules.length > 0
    ? rules.reduce((sum, r) => sum + r.source.confidence, 0) / rules.length
    : 0;
  const coverage = (found / totalPossible) * 100;
  const confidence = Math.round((avgConf * 0.6) + (coverage * 0.4));

  return {
    pages,
    fullText: pages.map(p => p.text).join('\n'),
    rules,
    metadata,
    confidence,
  };
}

/**
 * Merge rules from multiple documents.
 * Deduplicates by category, preferring higher confidence.
 */
export function mergeDocumentRules(
  results: ParsedDocumentResult[]
): { rules: ZoningRule[]; metadata: ExtractedMetadata } {
  const mergedRules: ZoningRule[] = [];
  const categoryBest = new Map<string, ZoningRule>();

  // Collect all rules, keeping highest confidence per category
  for (const result of results) {
    for (const rule of result.rules) {
      const existing = categoryBest.get(rule.category);
      if (!existing || rule.source.confidence > existing.source.confidence) {
        categoryBest.set(rule.category, rule);
      }
    }
  }

  mergedRules.push(...categoryBest.values());

  // Merge metadata - first non-empty value wins
  const metadata: ExtractedMetadata = {};
  for (const result of results) {
    const m = result.metadata;
    if (!metadata.planNumber && m.planNumber) metadata.planNumber = m.planNumber;
    if (!metadata.planName && m.planName) metadata.planName = m.planName;
    if (!metadata.city && m.city) metadata.city = m.city;
    if (!metadata.neighborhood && m.neighborhood) metadata.neighborhood = m.neighborhood;
    if (!metadata.approvalDate && m.approvalDate) metadata.approvalDate = m.approvalDate;
    if (!metadata.zoningType && m.zoningType) metadata.zoningType = m.zoningType;
  }

  return { rules: mergedRules, metadata };
}
