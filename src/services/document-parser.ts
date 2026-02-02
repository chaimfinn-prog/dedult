/**
 * Document Parser Service
 * Extracts zoning data from uploaded PDF documents using pdfjs-dist
 * Parses Hebrew text with regex pattern matching to find building rights,
 * setbacks, height limits, coverage, and other zoning parameters.
 */

import type { ExtractedPlanData } from './admin-storage';

// ── PDF Text Extraction ────────────────────────────────────

interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  pages: PdfPage[];
  fullText: string;
  extractedData: ExtractedPlanData;
  confidence: number; // 0-100
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

/**
 * Extract text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<PdfPage[]> {
  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: PdfPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = content.items
      .map((item: any) => (item.str || ''))
      .join(' ');
    pages.push({ pageNumber: i, text });
  }

  return pages;
}

/**
 * Extract text from an image file using basic OCR-like patterns
 * (For actual production, you'd use Tesseract.js or a cloud OCR service)
 */
export async function extractTextFromImage(_file: File): Promise<string> {
  // Images require OCR - return empty for now, user fills manually
  return '';
}

// ── Hebrew Zoning Pattern Matching ─────────────────────────

interface PatternRule {
  field: keyof ExtractedPlanData;
  label: string;
  patterns: RegExp[];
  extract: (match: RegExpMatchArray) => string | number;
  type: 'number' | 'string';
}

const PATTERN_RULES: PatternRule[] = [
  // Plan Number
  {
    field: 'planNumber',
    label: 'מספר תכנית',
    patterns: [
      /תכנית\s+(?:מס(?:פר)?[.'"]?\s*)?([א-ת]{1,3}[\/\-]\d{3,5}[a-zA-Zא-ת]*)/,
      /([א-ת]{1,3}[\/\-]\d{3,5}[a-zA-Zא-ת]*)\s*[-–]\s*תכנית/,
      /מספר\s+תכנית[:\s]+([א-ת]{1,3}[\/\-]\d{3,5})/,
      /תב"ע\s+([א-ת]{1,3}[\/\-]\d{3,5})/,
    ],
    extract: (m) => m[1],
    type: 'string',
  },
  // Plan Name
  {
    field: 'planName',
    label: 'שם תכנית',
    patterns: [
      /שם\s+(?:ה)?תכנית[:\s]+([\u0590-\u05FF\s,\-().0-9]+)/,
      /תכנית\s+(?:ל|ה)([\u0590-\u05FF\s,\-]+?)(?:\.|$)/,
    ],
    extract: (m) => m[1].trim(),
    type: 'string',
  },
  // Main Building Percentage
  {
    field: 'mainBuildingPercent',
    label: 'אחוזי בנייה עיקריים',
    patterns: [
      /(?:אחוזי|שטחי?)\s*בני(?:י|ה)\s*עיקרי(?:ים|ת)?[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /שטח\s*עיקרי[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /בנייה\s*עיקרית[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /עיקרי[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/,
      /(\d{2,3}(?:\.\d+)?)\s*%\s*(?:שטח\s*)?עיקרי/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // Service Building Percentage
  {
    field: 'serviceBuildingPercent',
    label: 'שטחי שירות',
    patterns: [
      /(?:אחוזי|שטחי?)\s*(?:בני(?:י|ה)\s*)?שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:שטח\s*)?שירות/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // Max Floors
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
    type: 'number',
  },
  // Max Height
  {
    field: 'maxHeight',
    label: 'גובה מרבי',
    patterns: [
      /גובה\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי|בניין)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /(?:עד|מרבי)\s*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')\s*(?:גובה)?/,
      /(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')\s*גובה/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // Max Units (density)
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
    type: 'number',
  },
  // Land Coverage
  {
    field: 'landCoveragePercent',
    label: 'תכסית',
    patterns: [
      /תכסית[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(?:כיסוי|תכסית)\s*(?:קרקע|מגרש)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/,
      /(\d{1,3}(?:\.\d+)?)\s*%\s*תכסית/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // Front Setback
  {
    field: 'frontSetback',
    label: 'קו בניין קדמי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /קדמי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // Rear Setback
  {
    field: 'rearSetback',
    label: 'קו בניין אחורי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /אחורי(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // Side Setback
  {
    field: 'sideSetback',
    label: 'קו בניין צידי',
    patterns: [
      /(?:קו\s*בניין|נסיגה)\s*צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
      /צ(?:י|ד)(?:ד)?י(?:ת)?[:\s]*(\d{1,2}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/,
    ],
    extract: (m) => parseFloat(m[1]),
    type: 'number',
  },
  // City
  {
    field: 'city',
    label: 'עיר',
    patterns: [
      /(?:עיר|יישוב|רשות\s*מקומית)[:\s]+([\u0590-\u05FF]+)/,
    ],
    extract: (m) => m[1].trim(),
    type: 'string',
  },
  // Neighborhood
  {
    field: 'neighborhood',
    label: 'שכונה',
    patterns: [
      /שכונ(?:ה|ת)\s+([\u0590-\u05FF\s]+?)(?:\.|,|$)/,
    ],
    extract: (m) => m[1].trim(),
    type: 'string',
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
    for (const pattern of rule.patterns) {
      // Search across all pages
      for (const page of pages) {
        const match = page.text.match(pattern);
        if (match) {
          const value = rule.extract(match);
          matchedFields.push({
            field: rule.field,
            label: rule.label,
            value,
            rawMatch: match[0],
            confidence: 85, // Base confidence for regex match
            pageNumber: page.pageNumber,
          });

          // Set the extracted data (first match wins per field)
          if (extractedData[rule.field] === undefined) {
            (extractedData as Record<string, string | number>)[rule.field] = value;
          }
          break; // Move to next pattern set
        }
      }

      // If already found, skip remaining patterns
      if (extractedData[rule.field] !== undefined) break;
    }

    // Also search in full text if not found in individual pages
    if (extractedData[rule.field] === undefined) {
      for (const pattern of rule.patterns) {
        const match = fullText.match(pattern);
        if (match) {
          const value = rule.extract(match);
          matchedFields.push({
            field: rule.field,
            label: rule.label,
            value,
            rawMatch: match[0],
            confidence: 70, // Lower confidence for full-text match
          });
          (extractedData as Record<string, string | number>)[rule.field] = value;
          break;
        }
      }
    }
  }

  // Calculate overall confidence
  const totalFields = PATTERN_RULES.length;
  const foundFields = matchedFields.length;
  const avgFieldConfidence = matchedFields.length > 0
    ? matchedFields.reduce((sum, f) => sum + f.confidence, 0) / matchedFields.length
    : 0;
  const coverageScore = (foundFields / totalFields) * 100;
  const confidence = Math.round((avgFieldConfidence * 0.6) + (coverageScore * 0.4));

  return {
    pages,
    fullText,
    extractedData,
    confidence,
    matchedFields,
  };
}

/**
 * Full pipeline: file → text extraction → pattern parsing → structured data
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  let pages: PdfPage[] = [];

  if (ext === 'pdf') {
    pages = await extractTextFromPdf(file);
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    const text = await extractTextFromImage(file);
    pages = [{ pageNumber: 1, text }];
  } else if (['doc', 'docx'].includes(ext || '')) {
    // DOC files - basic text extraction not available client-side
    // User will fill in data manually
    pages = [{ pageNumber: 1, text: '' }];
  }

  return parseZoningText(pages);
}
