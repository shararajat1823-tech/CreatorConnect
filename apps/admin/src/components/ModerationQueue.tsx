import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CreatorRow, CreatorStatus } from '@creatorconnect/shared';
import { listCreatorsByStatus } from '../lib/api';
import { avatarUrl } from '../lib/supabase';
import { countryLabel, formatDate, nicheLabel, subscribersText } from '../lib/format';
import { Spinner, StateView, StatusBadge } from './ui';

const TABS: { key: string; label: string; statuses: CreatorStatus[] }[] = [
  { key: 'review', label: 'Needs review', statuses: ['under_review'] },
  { key: 'changes', label: 'Changes requested', statuses: ['changes_requested'] },
  { key: 'published', label: 'Published', statuses: ['published'] },
  { key: 'suspended', label: 'Suspended', statuses: ['suspended'] },
];

export function ModerationQueue() {
  const [tab, setTab] = useState(TABS[0]);
  const [rows, setRows] = useState<CreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listCreatorsByStatus(tab.statuses)
      .then((data) => active && setRows(data))
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tab]);

  return (
    <div>
      <h1>Moderation</h1>
      <div className="tabs" role="tablist" aria-label="Moderation queues">
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

      {loading ? (
        <Spinner label="Loading queue…" />
      ) : error ? (
        <StateView icon="⚠" title="Could not load the queue" message={error} />
      ) : rows.length === 0 ? (
        <StateView icon="✅" title="Nothing here" message={`No creators in “${tab.label}”.`} />
      ) : (
        <ul className="queue-list">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                to={`/moderation/${c.id}`}
                className="queue-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <img
                  className="avatar"
                  src={avatarUrl(c.avatar_path) ?? placeholder}
                  alt=""
                  width={48}
                  height={48}
                />
                <div className="main">
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <span className="name">{c.channel_name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="sub">
                    {c.niches.map(nicheLabel).join(', ') || 'No niches'}
                    {' · '}
                    {subscribersText(c.subscriber_count)} subs
                    {c.country ? ` · ${countryLabel(c.country)}` : ''}
                  </div>
                  <div className="sub subtle">
                    {c.submitted_at ? `Submitted ${formatDate(c.submitted_at)}` : `Updated ${formatDate(c.updated_at)}`}
                  </div>
                </div>
                <span aria-hidden="true" style={{ fontSize: '1.4rem', color: 'var(--cc-text-subtle)' }}>
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const placeholder =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23f3f1ec"/></svg>';
