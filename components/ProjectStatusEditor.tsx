'use client';
import { useRouter } from 'next/navigation';

const STATUS_LABEL: Record<string, string> = {
  planned: 'Lên kế hoạch',
  in_progress: 'Đang làm',
  paused: 'Tạm dừng',
  completed: 'Hoàn thành',
};

export function ProjectStatusEditor({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  return (
    <div className="row-flex" style={{ marginTop: 8 }}>
      <span className="muted">Trạng thái:</span>
      <select
        value={status}
        onChange={async (e) => {
          await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: e.target.value }),
          });
          router.refresh();
        }}
        style={{ width: 180 }}
      >
        {Object.entries(STATUS_LABEL).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      <button
        className="btn danger small"
        onClick={async () => {
          if (!confirm('Delete this project? Todos in this project will be kept and unlinked.')) return;
          const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if (res.ok) {
            router.replace('/projects');
            router.refresh();
          }
        }}
        style={{ marginLeft: 'auto' }}
      >
        Delete Project
      </button>
    </div>
  );
}
