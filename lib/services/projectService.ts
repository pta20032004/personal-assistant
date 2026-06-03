import { z } from 'zod';
import { prisma } from '@/lib/db';

export const PROJECT_STATUSES = ['planned', 'in_progress', 'paused', 'completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Tên dự án bắt buộc').max(200),
  status: z.enum(PROJECT_STATUSES).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export async function listProjects() {
  return prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
}

export async function listInProgressProjects() {
  return prisma.project.findMany({
    where: { status: 'in_progress' },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProjectDetail(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  const todos = await prisma.todo.findMany({
    where: { projectId: id },
    orderBy: { updatedAt: 'desc' },
  });
  return { project, todos };
}

export async function createProject(input: CreateProjectInput) {
  const data = createProjectSchema.parse(input);
  return prisma.project.create({
    data: {
      name: data.name.trim(),
      status: data.status ?? 'planned',
      description: data.description ?? null,
    },
  });
}

export async function updateProject(id: string, patch: UpdateProjectInput) {
  const data = updateProjectSchema.parse(patch);
  return prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });
}

/**
 * Xóa project. Foreign key onDelete: SetNull đảm bảo todos liên kết
 * vẫn còn và projectId trở về null.
 */
export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
}
