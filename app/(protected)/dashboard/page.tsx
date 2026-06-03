import { listTodos } from '@/lib/services/todoService';
import { listProjects } from '@/lib/services/projectService';
import { listUpcomingMeetings } from '@/lib/services/meetingService';
import { TodoSection } from '@/components/TodoSection';
import { MeetingSection } from '@/components/MeetingSection';
import { ProjectSection } from '@/components/ProjectSection';
import { HpgWidget } from '@/components/HpgWidget';
import { NewsWidget } from '@/components/NewsWidget';
import { WeatherWidget } from '@/components/WeatherWidget';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [todos, projects, meetings] = await Promise.all([
    listTodos(),
    listProjects(),
    listUpcomingMeetings(),
  ]);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Left side: FIXED 2/3 width - Projects and Todos */}
      <div style={{ width: 'calc(66.666% - 8px)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ProjectSection
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            description: p.description,
          }))}
          todos={todos.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            projectId: t.projectId,
          }))}
        />
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
      </div>

      {/* Right side: FIXED 1/3 width - Other widgets stacked */}
      <div style={{ width: 'calc(33.333% - 8px)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <HpgWidget />
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
        <NewsWidget />
        <WeatherWidget />
      </div>
    </div>
  );
}
