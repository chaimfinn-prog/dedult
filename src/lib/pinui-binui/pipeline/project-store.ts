import { getDb } from '@/lib/firebase';
import type { ProjectRecord, ProjectDocument, ProjectStatus } from './types';

const COLLECTION = 'pinui_binui_projects';

let memoryStore: ProjectRecord[] = [];

function useMemory(): boolean {
  return !getDb();
}

export async function createProject(
  data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'notes' | 'extractedInfo'>,
): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const project: ProjectRecord = {
    ...data,
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    documents: [],
    extractedInfo: {},
    notes: [],
  };

  if (useMemory()) {
    memoryStore.push(project);
    return project;
  }

  const db = getDb()!;
  const ref = await db.collection(COLLECTION).add({
    ...project,
    id: undefined,
  });
  project.id = ref.id;
  return project;
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  if (useMemory()) {
    return memoryStore.find(p => p.id === id) ?? null;
  }

  const db = getDb()!;
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ProjectRecord;
}

export async function listProjects(
  status?: ProjectStatus,
): Promise<ProjectRecord[]> {
  if (useMemory()) {
    let result = [...memoryStore];
    if (status) result = result.filter(p => p.status === status);
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const db = getDb()!;
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
  if (useMemory()) {
    const idx = memoryStore.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Project not found');
    memoryStore[idx] = { ...memoryStore[idx], ...updates, updatedAt: new Date().toISOString() };
    return;
  }

  const db = getDb()!;
  await db.collection(COLLECTION).doc(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function addDocumentToProject(
  projectId: string,
  document: ProjectDocument,
): Promise<void> {
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
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  const timestamp = new Date().toISOString();
  const notes = [...project.notes, `[${timestamp}] ${note}`];
  await updateProject(projectId, { notes });
}
