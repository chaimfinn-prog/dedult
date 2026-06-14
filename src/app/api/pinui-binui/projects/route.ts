import { NextRequest, NextResponse } from 'next/server';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  addNote,
} from '@/lib/pinui-binui/pipeline';
import type { ProjectStatus } from '@/lib/pinui-binui/pipeline';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      const project = await getProject(id);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ project });
    }

    const status = req.nextUrl.searchParams.get('status') as ProjectStatus | null;
    const projects = await listProjects(status ?? undefined);
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to list projects', detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, city, neighborhood, address, contactName, contactPhone, contactEmail, source } = body;

    if (!name || !city || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, address' },
        { status: 400 },
      );
    }

    const project = await createProject({
      name,
      city,
      neighborhood: neighborhood || undefined,
      address,
      status: 'intake',
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      source: source || undefined,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create project', detail: String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, note, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
    }

    if (note) {
      await addNote(id, note);
    }

    if (Object.keys(updates).length > 0) {
      await updateProject(id, updates);
    }

    const project = await getProject(id);
    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update project', detail: String(err) },
      { status: 500 },
    );
  }
}
