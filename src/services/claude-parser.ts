/**
 * Claude AI-Powered Document Parser
 * Uses Anthropic Claude to intelligently extract zoning data from תב"ע PDFs
 *
 * This is the "brain" that turns complex legal documents into structured data
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedPlanData } from './admin-storage';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─────────────────────────────────────────────────────────────
// AI-Powered Extraction
// ─────────────────────────────────────────────────────────────

const ZONING_EXTRACTION_PROMPT = `
אתה מומחה בקריאת תקנוני תב"ע (תוכניות בניין עיר) ישראליים.
המשימה שלך: לחלץ את כל פרמטרי זכויות הבנייה מהתקנון בצורה מדויקת ומאומתת.

**חשוב מאוד:**
1. חלץ רק נתונים שאתה רואה במפורש בטקסט
2. אל תנחש ואל תשלים מידע חסר
3. צטט את המקור המדויק (סעיף + עמוד) לכל נתון
4. אם משהו לא ברור - ציין confidence נמוך

**פורמט הפלט (JSON):**
{
  "planNumber": "מספר התכנית (למשל: רע/3000)",
  "planName": "שם התכנית",
  "city": "עיר",
  "neighborhood": "שכונה (אם קיים)",
  "approvalDate": "תאריך אישור (YYYY-MM-DD)",
  "mainBuildingPercent": 105.0,
  "serviceBuildingPercent": 35.0,
  "maxFloors": 4,
  "maxHeight": 15.5,
  "maxUnits": 6,
  "frontSetback": 5.0,
  "rearSetback": 4.0,
  "sideSetback": 3.0,
  "landCoveragePercent": 45.0,
  "citations": [
    {
      "field": "mainBuildingPercent",
      "value": "105%",
      "section": "סעיף 5.1.1 - שטחים עיקריים",
      "quote": "סך השטחים העיקריים המותרים לבנייה לא יעלה על 105% משטח המגרש",
      "page": 12,
      "confidence": 96
    }
  ],
  "overallConfidence": 92,
  "notes": "הערות נוספות אם יש"
}

**כללי חילוץ:**
- אחוזי בנייה: חפש "אחוזי בנייה עיקריים", "שטחי שירות"
- קומות: חפש "מספר קומות מרבי", "גובה מרבי"
- קווי בניין: חפש "נסיגות", "קו בניין קדמי/אחורי/צידי"
- תכסית: חפש "תכסית מרבית", "כיסוי קרקע"

התחל!
`;

/**
 * Extract zoning data using Claude AI
 * This provides much higher accuracy than regex patterns
 */
export async function extractWithClaude(
  pdfText: string,
  pageTexts: Array<{ pageNumber: number; text: string }>
): Promise<{
  data: ExtractedPlanData;
  confidence: number;
  citations: Array<{
    field: string;
    value: string;
    section: string;
    quote: string;
    page?: number;
    confidence: number;
  }>;
  rawResponse: string;
}> {
  if (!anthropic) {
    throw new Error('Claude API key not configured. Set ANTHROPIC_API_KEY in environment.');
  }

  // Prepare context: include page numbers for citations
  const contextText = pageTexts
    .map((p) => `=== עמוד ${p.pageNumber} ===\n${p.text}`)
    .join('\n\n');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for factual extraction
      messages: [
        {
          role: 'user',
          content: `${ZONING_EXTRACTION_PROMPT}\n\n=== טקסט התקנון ===\n${contextText}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse Claude's JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const extractedData: ExtractedPlanData = {
      planNumber: parsed.planNumber || undefined,
      planName: parsed.planName || undefined,
      city: parsed.city || undefined,
      neighborhood: parsed.neighborhood || undefined,
      approvalDate: parsed.approvalDate || undefined,
      mainBuildingPercent: parsed.mainBuildingPercent || undefined,
      serviceBuildingPercent: parsed.serviceBuildingPercent || undefined,
      maxFloors: parsed.maxFloors || undefined,
      maxHeight: parsed.maxHeight || undefined,
      maxUnits: parsed.maxUnits || undefined,
      frontSetback: parsed.frontSetback || undefined,
      rearSetback: parsed.rearSetback || undefined,
      sideSetback: parsed.sideSetback || undefined,
      landCoveragePercent: parsed.landCoveragePercent || undefined,
      notes: parsed.notes || undefined,
    };

    return {
      data: extractedData,
      confidence: parsed.overallConfidence || 0,
      citations: parsed.citations || [],
      rawResponse: responseText,
    };
  } catch (error) {
    console.error('[Claude Parser] Extraction failed:', error);
    throw error;
  }
}

/**
 * Validate extracted data against original PDF text
 * Cross-checks that all cited values actually appear in the document
 */
export async function validateExtraction(
  extractedData: ExtractedPlanData,
  citations: Array<{ field: string; quote: string; page?: number }>,
  pageTexts: Array<{ pageNumber: number; text: string }>
): Promise<{
  isValid: boolean;
  confidence: number;
  issues: Array<{ field: string; issue: string }>;
}> {
  const issues: Array<{ field: string; issue: string }> = [];
  let validCitations = 0;

  for (const citation of citations) {
    // Find the page text
    const page = citation.page
      ? pageTexts.find((p) => p.pageNumber === citation.page)
      : null;

    if (!page && citation.page) {
      issues.push({
        field: citation.field,
        issue: `Page ${citation.page} not found in document`,
      });
      continue;
    }

    // Check if quote exists in page text
    const textToSearch = page ? page.text : pageTexts.map((p) => p.text).join(' ');
    const normalizedQuote = citation.quote.replace(/\s+/g, ' ').trim();
    const normalizedText = textToSearch.replace(/\s+/g, ' ');

    if (!normalizedText.includes(normalizedQuote)) {
      issues.push({
        field: citation.field,
        issue: `Citation not found in document: "${citation.quote.substring(0, 50)}..."`,
      });
    } else {
      validCitations++;
    }
  }

  const confidence = citations.length > 0
    ? Math.round((validCitations / citations.length) * 100)
    : 0;

  return {
    isValid: issues.length === 0,
    confidence,
    issues,
  };
}

/**
 * Fallback: if Claude API is not available, use regex-based extraction
 */
export function extractWithFallback(pdfText: string): ExtractedPlanData {
  const data: ExtractedPlanData = {};

  // Plan number
  const planNumMatch = pdfText.match(/תכנית\s+(?:מס(?:פר)?[.'"]?\s*)?([א-ת]{1,3}[\/\-]\d{2,5}[a-zA-Zא-ת]*)/);
  if (planNumMatch) data.planNumber = planNumMatch[1];

  // Building percentages
  const mainPercentMatch = pdfText.match(/(?:אחוזי|שטחי?)\s*בני(?:י|ה)\s*עיקרי(?:ים|ת)?[:\s]*(\d{2,3}(?:\.\d+)?)\s*%/);
  if (mainPercentMatch) data.mainBuildingPercent = parseFloat(mainPercentMatch[1]);

  const servicePercentMatch = pdfText.match(/(?:אחוזי|שטחי?)\s*(?:בני(?:י|ה)\s*)?שירות[:\s]*(\d{1,3}(?:\.\d+)?)\s*%/);
  if (servicePercentMatch) data.serviceBuildingPercent = parseFloat(servicePercentMatch[1]);

  // Floors
  const floorsMatch = pdfText.match(/(?:מספר|מס'?)\s*קומות\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי)[:\s]*(\d{1,3})/);
  if (floorsMatch) data.maxFloors = parseInt(floorsMatch[1]);

  // Height
  const heightMatch = pdfText.match(/גובה\s*(?:מ(?:ר|ק)סימ(?:ל|א)י?|מרבי|בניין)?[:\s]*(\d{1,3}(?:\.\d+)?)\s*(?:מ(?:'|טר)|מ')/);
  if (heightMatch) data.maxHeight = parseFloat(heightMatch[1]);

  return data;
}
