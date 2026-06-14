import { NextRequest, NextResponse } from 'next/server';
import { getBucket } from '@/lib/firebase';
import {
  addDocumentToProject,
  getProject,
  updateDocumentInProject,
  classifyDocument,
  classifyByKeywords,
  extractFields,
} from '@/lib/pinui-binui/pipeline';
import type { ProjectDocument, DocumentCategory } from '@/lib/pinui-binui/pipeline';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File | null;
    const categoryOverride = formData.get('category') as DocumentCategory | null;

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

    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── 1. Upload to Firebase Storage ──
    let storagePath: string | undefined;
    const bucket = getBucket();
    if (bucket) {
      storagePath = `pinui-binui/${projectId}/${docId}/${file.name}`;
      const fileRef = bucket.file(storagePath);
      await fileRef.save(buffer, {
        contentType: file.type || 'application/octet-stream',
        metadata: {
          projectId,
          documentId: docId,
          originalName: file.name,
        },
      });
    }

    // ── 2. Extract text from PDF ──
    let extractedText: string | undefined;
    let pageCount: number | undefined;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const { extractPdfTextFromBuffer } = await import('./pdf-extract');
        const result = await extractPdfTextFromBuffer(buffer);
        extractedText = result.text;
        pageCount = result.pageCount;
      } catch (err) {
        console.error('PDF extraction failed:', err);
      }
    }

    // ── 3. Classify document ──
    let classification = classifyDocument(file.name, extractedText);
    if (categoryOverride) {
      classification = { category: categoryOverride, confidence: 1.0, reasoning: 'Manual override' };
    } else if (extractedText && classification.confidence < 0.5) {
      const textClassification = classifyByKeywords(extractedText);
      if (textClassification.confidence > classification.confidence) {
        classification = textClassification;
      }
    }

    // ── 4. Extract structured fields ──
    let extractedData;
    if (extractedText) {
      extractedData = extractFields(extractedText, classification.category, pageCount);
    }

    // ── 5. Save document record ──
    const document: ProjectDocument = {
      id: docId,
      projectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      category: classification.category,
      status: extractedData ? 'extracted' : 'classified',
      uploadedAt: new Date().toISOString(),
      extractedData,
    };

    await addDocumentToProject(projectId, document);

    return NextResponse.json({
      document,
      classification,
      storagePath,
      extractedFields: extractedData?.fields ?? {},
      message: 'Document uploaded, classified, and analyzed',
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Upload failed', detail: String(err) },
      { status: 500 },
    );
  }
}
