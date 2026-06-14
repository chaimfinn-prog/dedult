import type { ProjectStage } from './types';

const STAGE_ORDER: ProjectStage[] = [
  'pre_declaration',
  'declared',
  'plan_submitted',
  'plan_approved',
  'permit_issued',
  'under_construction',
  'completed',
];

const STAGE_LABELS: Record<ProjectStage, { he: string; en: string }> = {
  pre_declaration: { he: 'לפני הכרזה', en: 'Pre-Declaration' },
  declared: { he: 'הוכרז', en: 'Declared' },
  plan_submitted: { he: 'תב"ע הוגשה', en: 'Plan Submitted' },
  plan_approved: { he: 'תב"ע אושרה', en: 'Plan Approved' },
  permit_issued: { he: 'היתר בניה', en: 'Permit Issued' },
  under_construction: { he: 'בביצוע', en: 'Under Construction' },
  completed: { he: 'הושלם', en: 'Completed' },
};

const STATUS_MAP: Record<string, ProjectStage> = {
  'הוכרז': 'declared',
  'הוגשה תב"ע': 'plan_submitted',
  'תב"ע הוגשה': 'plan_submitted',
  'אושרה תב"ע': 'plan_approved',
  'תב"ע אושרה': 'plan_approved',
  'היתר בניה': 'permit_issued',
  'היתר בנייה': 'permit_issued',
  'בביצוע': 'under_construction',
  'בבנייה': 'under_construction',
  'הושלם': 'completed',
  'אוכלס': 'completed',
};

export function parseProjectStage(statusText: string): ProjectStage {
  const normalized = statusText.trim();
  return STATUS_MAP[normalized] ?? 'pre_declaration';
}

export function getStageLabel(stage: ProjectStage, lang: 'he' | 'en'): string {
  return STAGE_LABELS[stage][lang];
}

export function getStageIndex(stage: ProjectStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isStageAtLeast(
  current: ProjectStage,
  minimum: ProjectStage,
): boolean {
  return getStageIndex(current) >= getStageIndex(minimum);
}

export function stageRiskMultiplier(stage: ProjectStage): number {
  switch (stage) {
    case 'pre_declaration': return 1.25;
    case 'declared': return 1.15;
    case 'plan_submitted': return 1.10;
    case 'plan_approved': return 1.05;
    case 'permit_issued': return 1.0;
    case 'under_construction': return 0.95;
    case 'completed': return 0.90;
  }
}

export function estimateTimeToCompletionMonths(stage: ProjectStage): number {
  switch (stage) {
    case 'pre_declaration': return 84;
    case 'declared': return 72;
    case 'plan_submitted': return 60;
    case 'plan_approved': return 42;
    case 'permit_issued': return 36;
    case 'under_construction': return 24;
    case 'completed': return 0;
  }
}
