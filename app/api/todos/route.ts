import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createTodo, listTodos } from '@/lib/services/todoService';

export async function GET() {
  const todos = await listTodos();
  return NextResponse.json({ todos });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const todo = await createTodo(body);
    return NextResponse.json({ todo }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'validation', issues: err.flatten() }, { status: 400 });
    }
    console.error('[todos POST]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
