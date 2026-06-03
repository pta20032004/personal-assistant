import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectDetail } from '@/lib/services/projectService';
import { TodoSection } from '@/components/TodoSection';
import { ProjectStatusEditor } from '@/components/ProjectStatusEditor';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: Props) {
  const detail = await getProjectDetail(params.id);
  if (!detail) notFound();
  const { project, todos } = detail;

  return (
    <div>
      <p className="muted">
        <Link href="/projects">← Tất cả dự án</Link>
      </p>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 18 }}>{project.name}</h3>
        {project.description && <p>{project.description}</p>}
        <ProjectStatusEditor id={project.id} status={project.status} />
      </div>

      <TodoSection
        todos={todos.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          projectId: t.projectId,
          project: null,
        }))}
        defaultProjectId={project.id}
        hideProjectSelect
      />
    </div>
  );
}
