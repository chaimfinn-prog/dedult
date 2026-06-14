import type { DocumentCategory, ExtractedDocumentData } from './types';

type FieldExtractor = (text: string) => Record<string, string | number | boolean>;

const EXTRACTORS: Record<DocumentCategory, FieldExtractor> = {
  contract: extractContractFields,
  building_permit: extractPermitFields,
  committee_decision: extractCommitteeFields,
  city_plan: extractCityPlanFields,
  appraisal: extractAppraisalFields,
  tenant_list: extractTenantListFields,
  engineering_report: extractEngineeringFields,
  other: () => ({}),
};

export function extractFields(
  text: string,
  category: DocumentCategory,
  pageCount?: number,
): ExtractedDocumentData {
  const extractor = EXTRACTORS[category];
  const fields = extractor(text);

  return {
    category,
    confidence: Object.keys(fields).length > 0 ? 0.6 : 0.2,
    fields,
    rawText: text.slice(0, 10_000),
    pageCount,
  };
}

function extractContractFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const dateMatch = text.match(/נחתם\s*ביום\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
  if (dateMatch) fields.contractDate = dateMatch[1];

  const unitsMatch = text.match(/(\d+)\s*(?:דירות|יחידות\s*דיור)/);
  if (unitsMatch) fields.existingUnits = parseInt(unitsMatch[1]);

  const upgradeMatch = text.match(/תוספת?\s*(?:של\s*)?(\d+)\s*(?:מ"ר|מטר)/);
  if (upgradeMatch) fields.tenantUpgradeSqm = parseInt(upgradeMatch[1]);

  const developerMatch = text.match(/(?:היזם|החברה|הקבלן)[:\s]+["']?([^"'\n,]{3,40})["']?/);
  if (developerMatch) fields.developerName = developerMatch[1].trim();

  const tempHousingMatch = text.match(/דיור\s*חלופי.*?(\d[\d,]+)\s*₪/);
  if (tempHousingMatch) fields.tempHousingAmount = parseInt(tempHousingMatch[1].replace(',', ''));

  const periodMatch = text.match(/(\d+)\s*(?:חודשים|חודש)/);
  if (periodMatch) fields.constructionMonths = parseInt(periodMatch[1]);

  const approvalMatch = text.match(/(\d+)\s*%\s*(?:מהדיירים|חתימות|הסכמ)/);
  if (approvalMatch) fields.tenantApprovalPct = parseInt(approvalMatch[1]);

  return fields;
}

function extractPermitFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const permitMatch = text.match(/היתר\s*(?:מס['׳]?|מספר)\s*[:.]?\s*(\d[\d/-]+)/);
  if (permitMatch) fields.permitNumber = permitMatch[1];

  const dateMatch = text.match(/תאריך\s*[:.]?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
  if (dateMatch) fields.permitDate = dateMatch[1];

  const floorsMatch = text.match(/(\d+)\s*קומות/);
  if (floorsMatch) fields.approvedFloors = parseInt(floorsMatch[1]);

  const unitsMatch = text.match(/(\d+)\s*(?:דירות|יח"?ד)/);
  if (unitsMatch) fields.approvedUnits = parseInt(unitsMatch[1]);

  const areaMatch = text.match(/(\d[\d,]+)\s*מ"ר\s*(?:עיקרי|בניה)/);
  if (areaMatch) fields.approvedAreaSqm = parseInt(areaMatch[1].replace(',', ''));

  return fields;
}

function extractCommitteeFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const dateMatch = text.match(/(?:מיום|מתאריך|ב-?)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
  if (dateMatch) fields.decisionDate = dateMatch[1];

  const approved = /אושר[הו]?\s/.test(text) || /הוחלט\s*לאשר/.test(text);
  const rejected = /נדח[הו]?\s/.test(text) || /הוחלט\s*לדחות/.test(text);
  fields.approved = approved && !rejected;

  const conditionsMatch = text.match(/בתנאי[םם]\s*(?:הבאים|:)/);
  fields.hasConditions = !!conditionsMatch;

  return fields;
}

function extractCityPlanFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const planMatch = text.match(/(?:תוכנית|תב"ע)\s*(?:מס['׳]?|מספר)?\s*[:.]?\s*([\dא-ת/-]+)/);
  if (planMatch) fields.planNumber = planMatch[1];

  const coeffMatch = text.match(/(?:מקדם|coefficient)\s*[:.]?\s*([\d.]+)/);
  if (coeffMatch) fields.coefficient = parseFloat(coeffMatch[1]);

  const coverageMatch = text.match(/(?:כיסוי|coverage)\s*[:.]?\s*(\d+)\s*%/);
  if (coverageMatch) fields.coveragePct = parseInt(coverageMatch[1]);

  const floorsMatch = text.match(/(\d+)\s*קומות/);
  if (floorsMatch) fields.maxFloors = parseInt(floorsMatch[1]);

  return fields;
}

function extractAppraisalFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const valueMatch = text.match(/שווי\s*[:.]?\s*(\d[\d,]+)\s*₪/);
  if (valueMatch) fields.estimatedValue = parseInt(valueMatch[1].replace(/,/g, ''));

  const pricePerSqmMatch = text.match(/(\d[\d,]+)\s*₪\s*(?:למ"ר|\/מ"ר)/);
  if (pricePerSqmMatch) fields.pricePerSqm = parseInt(pricePerSqmMatch[1].replace(/,/g, ''));

  return fields;
}

function extractTenantListFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const lines = text.split('\n').filter(l => l.trim());
  let tenantCount = 0;
  for (const line of lines) {
    if (/\d+\s*[.)]/.test(line) || /דירה\s*\d+/.test(line)) {
      tenantCount++;
    }
  }
  if (tenantCount > 0) fields.tenantCount = tenantCount;

  return fields;
}

function extractEngineeringFields(text: string): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {};

  const yearMatch = text.match(/(?:שנת?\s*בני[יה]|נבנה\s*ב-?)\s*(\d{4})/);
  if (yearMatch) fields.yearBuilt = parseInt(yearMatch[1]);

  const floorsMatch = text.match(/(\d+)\s*קומות/);
  if (floorsMatch) fields.existingFloors = parseInt(floorsMatch[1]);

  const conditionMatch = text.match(/מצב\s*(?:המבנה|הבניין)\s*[:.]?\s*(גרוע|בינוני|טוב|סביר)/);
  if (conditionMatch) fields.buildingCondition = conditionMatch[1];

  const hasResistance = /עמיד[הו]?\s*(?:ברעידות|לרעידות)/.test(text);
  const negated = /(?:אינ[וה]|לא)\s*עמיד/.test(text);
  fields.earthquakeResistant = hasResistance && !negated;

  return fields;
}
