import { listProjects } from '@/lib/services/projectService';
import { ProjectSection } from '@/components/ProjectSection';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <div className="grid">
      <ProjectSection
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          description: p.description,
        }))}
      />
    </div>
  );
}
