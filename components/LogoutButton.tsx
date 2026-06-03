'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn ghost small"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.replace('/login');
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      Đăng xuất
    </button>
  );
}
