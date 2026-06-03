import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/LogoutButton';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="row-flex">
          <h1>Personal Assistant</h1>
          <nav style={{ marginLeft: 16 }}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/projects">Dự án</Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="container">{children}</main>
    </>
  );
}
