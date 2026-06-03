import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createProject, listProjects } from '@/lib/services/projectService';

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = await createProject(body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'validation', issues: err.flatten() }, { status: 400 });
    }
    console.error('[projects POST]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
