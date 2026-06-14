import { getDb } from '@/lib/firebase';
import type { ProjectRecord, ProjectDocument, ProjectStatus } from './types';

const COLLECTION = 'pinui_binui_projects';

export async function createProject(
  data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'notes' | 'extractedInfo'>,
): Promise<ProjectRecord> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');

  const now = new Date().toISOString();
  const project: Omit<ProjectRecord, 'id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
    documents: [],
    extractedInfo: {},
    notes: [],
  };

  const ref = await db.collection(COLLECTION).add(project);
  return { ...project, id: ref.id };
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  const db = getDb();
  if (!db) return null;

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ProjectRecord;
}

export async function listProjects(
  status?: ProjectStatus,
): Promise<ProjectRecord[]> {
  const db = getDb();
  if (!db) return [];

  let query = db.collection(COLLECTION).orderBy('updatedAt', 'desc');
  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.limit(100).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ProjectRecord);
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<ProjectRecord, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');

  await db.collection(COLLECTION).doc(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function addDocumentToProject(
  projectId: string,
  document: ProjectDocument,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');

  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  const documents = [...project.documents, document];
  await updateProject(projectId, {
    documents,
    status: project.status === 'intake' ? 'documents_received' : project.status,
  });
}

export async function updateDocumentInProject(
  projectId: string,
  documentId: string,
  updates: Partial<ProjectDocument>,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');

  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  const documents = project.documents.map(d =>
    d.id === documentId ? { ...d, ...updates } : d,
  );
  await updateProject(projectId, { documents });
}

export async function addNote(
  projectId: string,
  note: string,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');

  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  const timestamp = new Date().toISOString();
  const notes = [...project.notes, `[${timestamp}] ${note}`];
  await updateProject(projectId, { notes });
}
