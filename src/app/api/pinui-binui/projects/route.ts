import { NextRequest, NextResponse } from 'next/server';
import { createProject, listProjects } from '@/lib/pinui-binui/pipeline';
import type { ProjectStatus } from '@/lib/pinui-binui/pipeline';

export async function GET(req: NextRequest) {
  try {
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
