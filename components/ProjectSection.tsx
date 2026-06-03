'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL: Record<string, string> = {
  planned: 'Lên kế hoạch',
  in_progress: 'Đang làm',
  paused: 'Tạm dừng',
  completed: 'Hoàn thành',
};

export interface ProjectRow {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

export function ProjectSection({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="card">
      <h2>Dự án</h2>
      <form onSubmit={add} className="form-row">
        <input
          placeholder="Tên dự án mới…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" disabled={busy} style={{ flex: '0 0 auto' }}>
          Thêm
        </button>
      </form>
      {projects.length === 0 ? (
        <p className="muted">Chưa có dự án nào.</p>
      ) : (
        <ul className="list">
          {projects.map((p) => (
            <li key={p.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/projects/${p.id}`}>{p.name}</Link>
                {p.description && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.description}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
