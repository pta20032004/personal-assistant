import { z } from 'zod';
import { prisma } from '@/lib/db';

export const TODO_STATUSES = ['not_started', 'in_progress', 'done'] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(200, 'Tối đa 200 ký tự'),
  status: z.enum(TODO_STATUSES).optional(),
  projectId: z.string().min(1).nullable().optional(),
});

export const updateTodoSchema = createTodoSchema.partial();

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

export async function listTodos() {
  return prisma.todo.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
}

export async function listTodosByProject(projectId: string) {
  return prisma.todo.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createTodo(input: CreateTodoInput) {
  const data = createTodoSchema.parse(input);
  return prisma.todo.create({
    data: {
      title: data.title.trim(),
      status: data.status ?? 'not_started',
      projectId: data.projectId ?? null,
    },
  });
}

export async function updateTodo(id: string, patch: UpdateTodoInput) {
  const data = updateTodoSchema.parse(patch);
  return prisma.todo.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
    },
  });
}

export async function deleteTodo(id: string) {
  await prisma.todo.delete({ where: { id } });
}
