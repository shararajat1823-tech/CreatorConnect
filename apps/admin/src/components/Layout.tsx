import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { brand } from '@creatorconnect/shared';
import { useAuth } from '../auth';

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <>
      <header className="app-header">
        <div className="bar">
          <span className="app-brand">
            <span className="mark" aria-hidden="true">
              ◆
            </span>
            {brand.name}
            <span className="tag">Admin</span>
          </span>
          <nav className="app-nav" aria-label="Admin sections">
            <NavLink to="/moderation" className={({ isActive }) => (isActive ? 'active' : '')}>
              Moderation
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
              Reports
            </NavLink>
          </nav>
          <span className="subtle" style={{ fontSize: 'var(--cc-text-sm)' }}>
            {user?.email}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
