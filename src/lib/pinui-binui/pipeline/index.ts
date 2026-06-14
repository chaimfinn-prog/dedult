export type {
  DocumentCategory,
  DocumentStatus,
  ProjectStatus,
  ProjectDocument,
  ProjectRecord,
  ExtractedDocumentData,
  ClassificationResult,
} from './types';

export { classifyDocument, classifyByKeywords, classifyByFileName } from './classifier';
export { extractFields } from './extractor';

export {
  createProject,
  getProject,
  listProjects,
  updateProject,
  addDocumentToProject,
  updateDocumentInProject,
  addNote,
} from './project-store';
