import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { deleteTodo, updateTodo } from '@/lib/services/todoService';

interface Ctx {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const body = await req.json();
    const todo = await updateTodo(params.id, body);
    return NextResponse.json({ todo });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'validation', issues: err.flatten() }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('[todos PATCH]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await deleteTodo(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('[todos DELETE]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
