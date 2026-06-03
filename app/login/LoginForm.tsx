'use client';
import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/dashboard';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (body.error === 'invalid_credentials') {
        setError('Mật khẩu không đúng');
      } else if (res.status === 503) {
        setError('Server chưa cấu hình OWNER_PASSWORD');
      } else {
        setError('Đăng nhập thất bại');
      }
    } catch {
      setError('Không kết nối được server');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Personal Assistant</h1>
        <p>Nhập mật khẩu để tiếp tục.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
        />
        {error && <div className="error">{error}</div>}
        <div style={{ marginTop: 14 }}>
          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </div>
  );
}
