'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
};

const TODO_STATUS: Record<string, string> = {
  pending: '⚪ Pending',
  in_progress: '🔵 In Progress',
  completed: '✅ Done',
  not_started: '⚪ Not Started',
  done: '✅ Done',
};

export interface ProjectRow {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

export interface TodoRow {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
}

export function ProjectSection({ 
  projects,
  todos = []
}: { 
  projects: ProjectRow[];
  todos?: TodoRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setName('');
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  function toggleProject(projectId: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  function getProjectTodos(projectId: string) {
    return todos.filter((t) => t.projectId === projectId);
  }

  return (
    <div className="card">
      <h2>Projects</h2>
      <form onSubmit={add} className="form-row">
        <input
          placeholder="New project name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" disabled={busy} style={{ flex: '0 0 auto' }}>
          Add
        </button>
      </form>
      {projects.length === 0 ? (
        <p className="muted">No projects yet.</p>
      ) : (
        <ul className="list">
          {projects.map((p) => {
            const projectTodos = getProjectTodos(p.id);
            const isExpanded = expandedProjects.has(p.id);
            const hasTodos = projectTodos.length > 0;

            return (
              <li key={p.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {hasTodos && (
                    <button
                      onClick={() => toggleProject(p.id)}
                      className="btn ghost small"
                      style={{ padding: '2px 6px', minWidth: 24 }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/projects/${p.id}`}>{p.name}</Link>
                    {p.description && (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.description}
                      </div>
                    )}
                    {hasTodos && (
                      <div className="muted" style={{ fontSize: 11 }}>
                        {projectTodos.length} task{projectTodos.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <select
                    value={p.status}
                    onChange={(e) => setStatus(p.id, e.target.value)}
                    style={{ width: 150, flex: '0 0 auto' }}
                  >
                    {Object.entries(STATUS_LABEL).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {isExpanded && hasTodos && (
                  <div style={{ 
                    marginTop: 8, 
                    marginLeft: hasTodos ? 32 : 0,
                    paddingLeft: 12,
                    borderLeft: '2px solid var(--border)'
                  }}>
                    {projectTodos.map((todo) => (
                      <div 
                        key={todo.id}
                        style={{
                          padding: '6px 0',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <span style={{ fontSize: 11 }}>
                          {TODO_STATUS[todo.status] || todo.status}
                        </span>
                        <span style={{ flex: 1 }}>{todo.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
