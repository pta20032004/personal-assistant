'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export interface MeetingRow {
  id: string;
  title: string;
  startTime: string; // ISO
  endTime: string; // ISO
  attendees: string[];
  notes: string | null;
}

const dtfDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh',
  dateStyle: 'short',
  timeStyle: 'short',
});

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dtfDate.format(d);
}

function toLocalInput(d: Date): string {
  // datetime-local cần "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function MeetingSection({ meetings }: { meetings: MeetingRow[] }) {
  const router = useRouter();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [start, setStart] = useState(toLocalInput(now));
  const [end, setEnd] = useState(toLocalInput(inOneHour));
  const [attendeesText, setAttendeesText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    try {
      const attendees = attendeesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          startTime: new Date(start).toISOString(),
          endTime: new Date(end).toISOString(),
          attendees,
        }),
      });
      if (res.ok) {
        setTitle('');
        setAttendeesText('');
        router.refresh();
      } else {
        setError('Failed to create meeting (check time)');
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this meeting?')) return;
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="card">
      <h2>Upcoming Meetings</h2>
      <form onSubmit={add} style={{ marginBottom: 8 }}>
        <div className="form-row">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="form-row">
          <input
            placeholder="Attendees (comma separated)"
            value={attendeesText}
            onChange={(e) => setAttendeesText(e.target.value)}
          />
          <button className="btn" disabled={busy} style={{ flex: '0 0 auto' }}>
            Add
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
      {meetings.length === 0 ? (
        <p className="muted">No meetings scheduled.</p>
      ) : (
        <ul className="list">
          {meetings.map((m) => (
            <li key={m.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="row-flex" style={{ width: '100%', justifyContent: 'space-between' }}>
                <strong>{m.title}</strong>
                <button className="btn ghost small" onClick={() => remove(m.id)}>
                  ×
                </button>
              </div>
              <div className="muted">
                {fmt(m.startTime)} → {fmt(m.endTime)}
              </div>
              {m.attendees.length > 0 && (
                <div className="muted" style={{ fontSize: 12 }}>
                  Attendees: {m.attendees.join(', ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
