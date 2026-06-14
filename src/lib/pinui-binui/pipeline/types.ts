import type { ProjectStage } from '../types';

export type DocumentCategory =
  | 'contract'           // חוזה פינוי בינוי
  | 'building_permit'    // היתר בניה
  | 'committee_decision' // החלטת ועדה
  | 'city_plan'          // תב"ע
  | 'appraisal'          // שומה
  | 'tenant_list'        // רשימת דיירים
  | 'engineering_report'  // דו"ח הנדסי
  | 'other';

export type DocumentStatus =
  | 'pending'
  | 'classified'
  | 'extracted'
  | 'analyzed'
  | 'error';

export type ProjectStatus =
  | 'intake'
  | 'documents_received'
  | 'under_analysis'
  | 'business_plan_ready'
  | 'offer_sent'
  | 'rejected'
  | 'archived';

export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  status: DocumentStatus;
  uploadedAt: string;
  extractedData?: ExtractedDocumentData;
  errorMessage?: string;
}

export interface ExtractedDocumentData {
  category: DocumentCategory;
  confidence: number;
  fields: Record<string, string | number | boolean>;
  rawText?: string;
  pageCount?: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  city: string;
  neighborhood?: string;
  address: string;
  status: ProjectStatus;
  stage?: ProjectStage;
  createdAt: string;
  updatedAt: string;

  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  source?: string;

  documents: ProjectDocument[];

  extractedInfo: {
    existingUnits?: number;
    existingFloors?: number;
    existingAvgSize?: number;
    plotArea?: number;
    currentDeveloper?: string;
    contractDate?: string;
    tenantApprovalPct?: number;
    buildingPermitStatus?: string;
    estimatedMarketPrice?: number;
  };

  businessPlanId?: string;
  notes: string[];
}

export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;
  reasoning: string;
}
