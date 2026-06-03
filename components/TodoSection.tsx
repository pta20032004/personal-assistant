'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Chưa làm',
  in_progress: 'Đang làm',
  done: 'Xong',
};

interface Project {
  id: string;
  name: string;
}
export interface TodoRow {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
  project?: { id: string; name: string } | null;
}

interface Props {
  todos: TodoRow[];
  projects?: Project[];
  defaultProjectId?: string | null;
  hideProjectSelect?: boolean;
}

export function TodoSection({ todos, projects = [], defaultProjectId = null, hideProjectSelect = false }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          projectId: projectId || null,
        }),
      });
      if (res.ok) {
        setTitle('');
        if (!defaultProjectId) setProjectId('');
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Xóa việc này?')) return;
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="card">
      <h2>Việc cần làm</h2>
      <form onSubmit={add} className="form-row">
        <input
          placeholder="Việc mới…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {!hideProjectSelect && projects.length > 0 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ flex: '0 0 160px' }}
          >
            <option value="">— Không thuộc dự án —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <button className="btn" disabled={busy} style={{ flex: '0 0 auto' }}>
          Thêm
        </button>
      </form>
      {todos.length === 0 ? (
        <p className="muted">Chưa có việc nào.</p>
      ) : (
        <ul className="list">
          {todos.map((t) => (
            <li key={t.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    color: t.status === 'done' ? 'var(--text-dim)' : 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.title}
                </div>
                {t.project && (
                  <div className="muted" style={{ fontSize: 11 }}>
                    {t.project.name}
                  </div>
                )}
              </div>
              <select
                value={t.status}
                onChange={(e) => setStatus(t.id, e.target.value)}
                style={{ width: 130, flex: '0 0 auto' }}
              >
                {Object.entries(STATUS_LABEL).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
              <button className="btn ghost small" onClick={() => remove(t.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
