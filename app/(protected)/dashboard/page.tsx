import { listTodos } from '@/lib/services/todoService';
import { listProjects } from '@/lib/services/projectService';
import { listUpcomingMeetings } from '@/lib/services/meetingService';
import { TodoSection } from '@/components/TodoSection';
import { MeetingSection } from '@/components/MeetingSection';
import { ProjectSection } from '@/components/ProjectSection';
import { HpgWidget } from '@/components/HpgWidget';
import { NewsWidget } from '@/components/NewsWidget';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [todos, projects, meetings] = await Promise.all([
    listTodos(),
    listProjects(),
    listUpcomingMeetings(),
  ]);

  return (
    <div className="grid">
      <TodoSection
        todos={todos.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          projectId: t.projectId,
          project: t.project ?? null,
        }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
      <MeetingSection
        meetings={meetings.map((m) => ({
          id: m.id,
          title: m.title,
          startTime: m.startTime.toISOString(),
          endTime: m.endTime.toISOString(),
          attendees: m.attendees,
          notes: m.notes,
        }))}
      />
      <ProjectSection
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          description: p.description,
        }))}
      />
      <HpgWidget />
      <NewsWidget />
    </div>
  );
}
