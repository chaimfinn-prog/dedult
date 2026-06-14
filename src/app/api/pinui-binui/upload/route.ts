import { NextRequest, NextResponse } from 'next/server';
import {
  addDocumentToProject,
  getProject,
  classifyByFileName,
} from '@/lib/pinui-binui/pipeline';
import type { ProjectDocument } from '@/lib/pinui-binui/pipeline';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File | null;

    if (!projectId || !file) {
      return NextResponse.json(
        { error: 'Missing projectId or file' },
        { status: 400 },
      );
    }

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      );
    }

    const classification = classifyByFileName(file.name);

    const document: ProjectDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      category: classification.category,
      status: 'classified',
      uploadedAt: new Date().toISOString(),
    };

    await addDocumentToProject(projectId, document);

    return NextResponse.json({
      document,
      classification,
      message: 'Document uploaded and classified',
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Upload failed', detail: String(err) },
      { status: 500 },
    );
  }
}
