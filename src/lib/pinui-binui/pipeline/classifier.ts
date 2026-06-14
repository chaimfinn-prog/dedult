import type { ClassificationResult, DocumentCategory } from './types';

const KEYWORD_PATTERNS: {
  category: DocumentCategory;
  patterns: RegExp[];
  weight: number;
}[] = [
  {
    category: 'contract',
    patterns: [
      /חוזה\s*(פינוי|התחדשות)/,
      /הסכם\s*(מסגרת|פינוי)/,
      /עסקת?\s*קומבינציה/,
      /בעלי\s*דירות/,
      /תמורת?\s*הדייר/,
      /דירת?\s*תמורה/,
    ],
    weight: 0.85,
  },
  {
    category: 'building_permit',
    patterns: [
      /היתר\s*בני[יה]/,
      /רישיון\s*בני[יה]/,
      /תנאי\s*היתר/,
      /מסמך?\s*היתר/,
    ],
    weight: 0.80,
  },
  {
    category: 'committee_decision',
    patterns: [
      /החלטת?\s*ועד[הת]/,
      /פרוטוקול\s*ועד[הת]/,
      /ועדה\s*(מקומית|מחוזית|ארצית)/,
      /החלטה\s*מספר/,
      /ישיבת?\s*ועד/,
    ],
    weight: 0.80,
  },
  {
    category: 'city_plan',
    patterns: [
      /תב"ע/,
      /תוכנית?\s*(בניין|בנין)\s*עיר/,
      /תוכנית?\s*מתאר/,
      /תוכנית?\s*מפורטת/,
      /שינוי\s*ייעוד/,
      /זכויות?\s*בני[יה]/,
    ],
    weight: 0.85,
  },
  {
    category: 'appraisal',
    patterns: [
      /שומ[הת]/,
      /הערכת?\s*שווי/,
      /שמאי/,
      /חוות?\s*דעת\s*שמאית/,
    ],
    weight: 0.75,
  },
  {
    category: 'tenant_list',
    patterns: [
      /רשימת?\s*דיירים/,
      /בעלי\s*הדירות/,
      /טבלת?\s*דיירים/,
      /רשימת?\s*בעלים/,
    ],
    weight: 0.80,
  },
  {
    category: 'engineering_report',
    patterns: [
      /דו"?ח\s*הנדסי/,
      /חוות?\s*דעת\s*הנדסית/,
      /בדיקת?\s*מבנה/,
      /סקר\s*(מבנים|רעידות)/,
    ],
    weight: 0.75,
  },
];

export function classifyByKeywords(text: string): ClassificationResult {
  const normalizedText = text.slice(0, 5000);

  let bestCategory: DocumentCategory = 'other';
  let bestScore = 0;
  let bestPatternStr = '';

  for (const entry of KEYWORD_PATTERNS) {
    let matchCount = 0;
    let matchedPattern = '';
    for (const pattern of entry.patterns) {
      if (pattern.test(normalizedText)) {
        matchCount++;
        if (!matchedPattern) matchedPattern = pattern.source;
      }
    }

    if (matchCount > 0) {
      const score = entry.weight * Math.min(1, (matchCount + 1) / 3);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = entry.category;
        bestPatternStr = matchedPattern;
      }
    }
  }

  return {
    category: bestCategory,
    confidence: bestScore,
    reasoning: bestScore > 0
      ? `Matched ${bestCategory} keywords (pattern: ${bestPatternStr})`
      : 'No matching keywords found, classified as other',
  };
}

export function classifyByFileName(fileName: string): ClassificationResult {
  const lower = fileName.toLowerCase();

  const filePatterns: { pattern: RegExp; category: DocumentCategory }[] = [
    { pattern: /חוזה|הסכם|contract/, category: 'contract' },
    { pattern: /היתר|permit/, category: 'building_permit' },
    { pattern: /ועד|committee|protocol/, category: 'committee_decision' },
    { pattern: /תבע|plan|תוכנית/, category: 'city_plan' },
    { pattern: /שומ|apprais/, category: 'appraisal' },
    { pattern: /דיירים|tenant/, category: 'tenant_list' },
    { pattern: /הנדס|engineer/, category: 'engineering_report' },
  ];

  for (const { pattern, category } of filePatterns) {
    if (pattern.test(lower)) {
      return {
        category,
        confidence: 0.5,
        reasoning: `Filename matches ${category} pattern`,
      };
    }
  }

  return {
    category: 'other',
    confidence: 0.1,
    reasoning: 'No filename pattern matched',
  };
}

export function classifyDocument(
  fileName: string,
  textContent?: string,
): ClassificationResult {
  if (textContent) {
    const contentResult = classifyByKeywords(textContent);
    if (contentResult.confidence >= 0.5) {
      return contentResult;
    }

    const fileResult = classifyByFileName(fileName);
    if (fileResult.confidence > contentResult.confidence) {
      return fileResult;
    }

    return contentResult;
  }

  return classifyByFileName(fileName);
}
