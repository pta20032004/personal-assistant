import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import {
  deleteProject,
  getProjectDetail,
  updateProject,
} from '@/lib/services/projectService';

interface Ctx {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Ctx) {
  const detail = await getProjectDetail(params.id);
  if (!detail) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const project = await updateProject(params.id, body);
    return NextResponse.json({ project });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'validation', issues: err.flatten() }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('[projects PATCH]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await deleteProject(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('[projects DELETE]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
