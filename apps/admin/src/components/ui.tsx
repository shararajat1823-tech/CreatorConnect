import type { ReactNode } from 'react';
import { statusLabel } from '../lib/format';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="state" role="status">
      <div className="spinner" aria-hidden="true" />
      <p>{label ?? 'Loading…'}</p>
    </div>
  );
}

export function StateView({
  icon = '✦',
  title,
  message,
  children,
}: {
  icon?: string;
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div className="state" role="status">
      <div style={{ fontSize: '2rem' }} aria-hidden="true">
        {icon}
      </div>
      <p style={{ fontWeight: 700, fontSize: 'var(--cc-text-lg)', color: 'var(--cc-text)' }}>{title}</p>
      {message && <p>{message}</p>}
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}
