import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ReportStatus } from '@creatorconnect/shared';
import { listReports, resolveReport, type ReportWithCreator } from '../lib/api';
import { formatDate, reportReasonLabel } from '../lib/format';
import { Spinner, StateView } from './ui';

const TABS: { key: string; label: string; statuses: ReportStatus[] }[] = [
  { key: 'open', label: 'Open', statuses: ['open', 'reviewing'] },
  { key: 'closed', label: 'Resolved', statuses: ['resolved', 'dismissed'] },
];

export function ReportsQueue() {
  const [tab, setTab] = useState(TABS[0]);
  const [rows, setRows] = useState<ReportWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listReports(tab.statuses)
      .then(setRows)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, status: ReportStatus) {
    setBusyId(id);
    setError(null);
    try {
      await resolveReport(id, status);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1>Reports</h1>
      <div className="tabs" role="tablist" aria-label="Report queues">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === tab.key}
            className={t.key === tab.key ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading reports…" />
      ) : rows.length === 0 ? (
        <StateView icon="🛡️" title="No reports" message={`Nothing in “${tab.label}”.`} />
      ) : (
        <ul className="queue-list">
          {rows.map((r) => (
            <li key={r.id} className="queue-item" style={{ alignItems: 'flex-start' }}>
              <div className="main">
                <div className="row" style={{ gap: '0.5rem' }}>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                  <strong>{reportReasonLabel(r.reason)}</strong>
                </div>
                <div className="sub" style={{ marginTop: '0.3rem' }}>
                  Against{' '}
                  <Link to={`/moderation/${r.creator_id}`}>{r.channelName ?? 'creator'}</Link>
                  {r.creatorStatus ? ` (${r.creatorStatus})` : ''}
                </div>
                {r.details && <p style={{ margin: '0.4rem 0' }}>{r.details}</p>}
                <div className="sub subtle">Reported {formatDate(r.created_at)}</div>
              </div>
              {(r.status === 'open' || r.status === 'reviewing') && (
                <div className="actions-stack" style={{ minWidth: 150 }}>
                  {r.status === 'open' && (
                    <button className="btn btn-secondary btn-sm" disabled={busyId === r.id} onClick={() => act(r.id, 'reviewing')} style={{ width: '100%' }}>
                      Mark reviewing
                    </button>
                  )}
                  <button className="btn btn-success btn-sm" disabled={busyId === r.id} onClick={() => act(r.id, 'resolved')} style={{ width: '100%' }}>
                    Resolve
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => act(r.id, 'dismissed')} style={{ width: '100%' }}>
                    Dismiss
                  </button>
                  <Link className="btn btn-danger btn-sm" to={`/moderation/${r.creator_id}`} style={{ width: '100%' }}>
                    Review creator
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
