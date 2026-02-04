/**
 * Document Parser Service
 * Extracts zoning data from uploaded PDF documents using pdfjs-dist.
 * Uses Hebrew regex patterns to identify building rights parameters.
 */

import type { ExtractedPlanData } from './admin-storage';

// ── Types ─────────────────────────────────────────────────────

interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  pages: PdfPage[];
  fullText: string;
  extractedData: ExtractedPlanData;
  confidence: number;
  matchedFields: ParsedField[];
}

export interface ParsedField {
  field: string;
  label: string;
  value: string | number;
  rawMatch: string;
  confidence: number;
  pageNumber?: number;
}

// ── PDF Text Extraction ───────────────────────────────────────

export async function extractTextFromPdf(file: File): Promise<PdfPage[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    // Use the worker file we copied to public/
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
        const text = content.items
          .map((item) => {
            if (typeof item === 'object' && item && 'str' in item) {
              const candidate = item as { str?: unknown };
              return typeof candidate.str === 'string' ? candidate.str : '';
            }
            return '';
          })
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

// ── Hebrew Zoning Pattern Matching ────────────────────────────

interface PatternRule {
  field: keyof ExtractedPlanData;
  label: string;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray) => string | number;
}

const PATTERN_RULES: PatternRule[] = [
  {
    field: 'planNumber',
    label: 'מספר תכנית',
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
    label: 'שם תכנית',
    patterns: [
      /שם\s+(?:ה)?תכנית[:\s]+([\u0590-\u05FF\s,\-().0-9]{3,60})/,
      /תכנית\s+(?:ל|ה)([\u0590-\u05FF\s,\-]{3,60}?)(?:\.|$)/,
    ],
    extract: (m) => m[1].trim(),
  },
  {
    field: 'mainBuildingPercent',
    label: 'אחוזי בנייה עיקריים',
    patterns: [
      /(?:אחוזי|שטחי?)\s*בני(?:י|ה)\s*עיקרי(?:ים|ת)?[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /שטח\s*עיקרי[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /בנייה\s*עיקרית[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /עיקרי[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /(\d{2,3}(?:\.\d+)?)\s*%\s*(?:שטח\s*)?עיקרי/,
      /זכויות\s*בנייה[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'serviceBuildingPercent',
    label: 'שטחי שירות',
    patterns: [
      /(?:אחוזי|שטחי?)\s*(?:בני(?:י|ה)\s*)?שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:שטח\s*)?שירות/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'maxFloors',
    label: 'קומות מרביות',
    patterns: [
      /(?:מספר|מס'?)\s*קומות\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי)[:\s]*(\d{1,3})/,
      /(?:עד|מרבי|מקסימום)\s*(\d{1,2})\s*קומות/,
      /קומות[:\s]*(?:עד\s*)?(\d{1,2})/,
      /(\d{1,2})\s*קומות\s*(?:מעל\s*ה?קרקע|על\s*קרקעיות)/,
      /גובה[:\s]*(\d{1,2})\s*קומות/,
    ],
    extract: (m) => parseInt(m[1]),
  },
  {
    field: 'maxHeight',
    label: 'גובה מרבי',
    patterns: [
      /גובה\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי|בניין)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /(?:עד|מרבי)\s*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')\s*(?:גובה)?/,
      /(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')\s*גובה/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'maxUnits',
    label: 'יחידות דיור מרביות',
    patterns: [
      /(?:מספר|מס'?)\s*יח(?:ידות)?\s*(?:ד(?:יור)?|דירות)\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי)?[:\s]*(\d{1,4})/,
      /צפיפות[:\s]*(?:עד\s*)?(\d{1,4})\s*(?:יח(?:ידות)?|דירות)/,
      /(?:עד|מרבי)\s*(\d{1,4})\s*יח(?:ידות)?\s*(?:ד(?:יור)?)?/,
      /(\d{1,4})\s*(?:יחידות\s*דיור|יח"ד|דירות)/,
    ],
    extract: (m) => parseInt(m[1]),
  },
  {
    field: 'landCoveragePercent',
    label: 'תכסית',
    patterns: [
      /תכסית[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(?:כיסוי|תכסית)\s*(?:קרקע|מגרש)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*תכסית/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'frontSetback',
    label: 'קו בניין קדמי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'rearSetback',
    label: 'קו בניין אחורי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'sideSetback',
    label: 'קו בניין צידי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
    ],
    extract: (m) => parseFloat(m[1]),
  },
  {
    field: 'city',
    label: 'עיר',
    patterns: [
      /(?:עיר|יישוב|רשות\s*מקומית)[:\s]+([\u0590-\u05FF]+)/,
      /(?:בתחום|באזור)\s+([\u0590-\u05FF]+)/,
    ],
    extract: (m) => m[1].trim(),
  },
  {
    field: 'neighborhood',
    label: 'שכונה',
    patterns: [
      /שכונ(?:ה|ת)\s+([\u0590-\u05FF\s]+?)(?:\.|,|$)/,
    ],
    extract: (m) => m[1].trim(),
  },
];

/**
 * Parse extracted text against Hebrew zoning patterns
 */
export function parseZoningText(pages: PdfPage[]): ParsedDocument {
  const fullText = pages.map(p => p.text).join('\n');
  const matchedFields: ParsedField[] = [];
  const extractedData: ExtractedPlanData = {};

  for (const rule of PATTERN_RULES) {
    let found = false;

    // Search page by page first
    for (const pattern of rule.patterns) {
      if (found) break;
      for (const page of pages) {
        if (!page.text) continue;
        const match = page.text.match(pattern);
        if (match) {
          const value = rule.extract(match);
          matchedFields.push({
            field: rule.field,
            label: rule.label,
            value,
            rawMatch: match[0],
            confidence: 85,
            pageNumber: page.pageNumber,
          });
          (extractedData as Record<string, string | number>)[rule.field] = value;
          found = true;
          break;
        }
      }
    }

    // Fallback: search in full concatenated text
    if (!found && fullText.length > 0) {
      for (const pattern of rule.patterns) {
        const match = fullText.match(pattern);
        if (match) {
          const value = rule.extract(match);
          matchedFields.push({
            field: rule.field,
            label: rule.label,
            value,
            rawMatch: match[0],
            confidence: 70,
          });
          (extractedData as Record<string, string | number>)[rule.field] = value;
          break;
        }
      }
    }
  }

  const totalFields = PATTERN_RULES.length;
  const foundFields = matchedFields.length;
  const avgConfidence = matchedFields.length > 0
    ? matchedFields.reduce((sum, f) => sum + f.confidence, 0) / matchedFields.length
    : 0;
  const coverage = (foundFields / totalFields) * 100;
  const confidence = Math.round((avgConfidence * 0.6) + (coverage * 0.4));

  return { pages, fullText, extractedData, confidence, matchedFields };
}

/**
 * Full pipeline: file -> text extraction -> pattern parsing
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    const pages = await extractTextFromPdf(file);
    return parseZoningText(pages);
  }

  // Non-PDF files: return empty result, user fills manually
  return parseZoningText([{ pageNumber: 1, text: '' }]);
}
