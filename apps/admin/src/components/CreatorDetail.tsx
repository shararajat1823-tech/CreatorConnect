import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  type CreatorRow,
  type ModerationActionRow,
  type PricingItem,
  youTubeThumbnailUrl,
  youTubeWatchUrl,
} from '@creatorconnect/shared';
import {
  approveCreator,
  getCreator,
  getModerationHistory,
  reinstateCreator,
  requestChanges,
  suspendCreator,
} from '../lib/api';
import { avatarUrl, marketplaceUrl } from '../lib/supabase';
import {
  countryLabel,
  formatDate,
  formatLabel,
  languageLabel,
  nicheLabel,
  subscribersText,
} from '../lib/format';
import { Spinner, StateView, StatusBadge } from './ui';

export function CreatorDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<CreatorRow | null>(null);
  const [history, setHistory] = useState<ModerationActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'changes' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getCreator(id);
      if (!c) {
        setNotFound(true);
        return;
      }
      setCreator(c);
      setHistory(await getModerationHistory(id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setMode(null);
      setReason('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function submitReason() {
    if (!reason.trim()) {
      setError('A reason is required.');
      return;
    }
    if (mode === 'changes') void run(() => requestChanges(id, reason.trim()));
    if (mode === 'suspend') void run(() => suspendCreator(id, reason.trim()));
  }

  if (loading) return <Spinner label="Loading profile…" />;
  if (notFound)
    return (
      <StateView icon="🔎" title="Creator not found">
        <Link className="btn btn-secondary" to="/moderation">
          Back to queue
        </Link>
      </StateView>
    );
  if (!creator) return <StateView icon="⚠" title="Error" message={error ?? 'Unknown error'} />;

  const c = creator;
  const pricing = (c.pricing as PricingItem[] | null) ?? null;

  return (
    <div>
      <p>
        <Link to="/moderation" style={{ fontWeight: 600, textDecoration: 'none' }}>
          ‹ Back to queue
        </Link>
      </p>

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="detail-grid">
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="row" style={{ gap: '1rem' }}>
              <img
                className="avatar"
                style={{ width: 72, height: 72 }}
                src={avatarUrl(c.avatar_path) ?? placeholder}
                alt=""
              />
              <div>
                <div className="row" style={{ gap: '0.5rem' }}>
                  <h1 style={{ margin: 0 }}>{c.channel_name}</h1>
                  <StatusBadge status={c.status} />
                  {c.ownership_verified && <span className="chip">✓ Verified</span>}
                </div>
                <a href={c.youtube_url} target="_blank" rel="noopener noreferrer">
                  {c.youtube_url}
                </a>
              </div>
            </div>

            {c.review_note && (
              <p className="muted" style={{ marginTop: '1rem' }}>
                <strong>Last review note:</strong> {c.review_note}
              </p>
            )}

            <dl className="kv" style={{ marginTop: '1rem' }}>
              <dt>Subscribers</dt>
              <dd>{subscribersText(c.subscriber_count)} (self-reported)</dd>
              <dt>Country</dt>
              <dd>{countryLabel(c.country) || '—'}</dd>
              <dt>Niches</dt>
              <dd>{c.niches.map(nicheLabel).join(', ') || '—'}</dd>
              <dt>Languages</dt>
              <dd>{c.languages.map(languageLabel).join(', ') || '—'}</dd>
              <dt>Formats</dt>
              <dd>{c.formats.map(formatLabel).join(', ') || '—'}</dd>
            </dl>
          </div>

          {c.bio && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h2>Bio</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{c.bio}</p>
            </div>
          )}

          {c.videos.length > 0 && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h2>Selected videos</h2>
              <div className="videos">
                {c.videos.map((v) => (
                  <a key={v.video_id} href={youTubeWatchUrl(v.video_id)} target="_blank" rel="noopener noreferrer">
                    <img src={youTubeThumbnailUrl(v.video_id)} alt={v.title ?? 'Video'} />
                    <div className="sub" style={{ marginTop: '0.3rem' }}>
                      {v.title ?? 'Watch on YouTube'}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {pricing && pricing.length > 0 && (
            <div className="card">
              <h2>Indicative pricing</h2>
              <dl className="kv">
                {pricing.map((p) => (
                  <PriceRow key={p.format} item={p} />
                ))}
              </dl>
            </div>
          )}
        </div>

        <aside>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ marginTop: 0 }}>Decision</h2>
            {mode ? (
              <div className="actions-stack">
                <div className="field">
                  <label className="label" htmlFor="reason">
                    Reason {mode === 'changes' ? '(shown to the creator)' : '(recorded)'}
                  </label>
                  <textarea
                    id="reason"
                    className="textarea"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="row">
                  <button
                    className={mode === 'suspend' ? 'btn btn-danger' : 'btn btn-primary'}
                    disabled={busy}
                    onClick={submitReason}
                  >
                    {busy ? 'Working…' : mode === 'changes' ? 'Request changes' : 'Suspend listing'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setMode(null)} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="actions-stack">
                {(c.status === 'under_review' || c.status === 'changes_requested') && (
                  <>
                    <button
                      className="btn btn-success"
                      style={{ width: '100%' }}
                      disabled={busy}
                      onClick={() => void run(() => approveCreator(id))}
                    >
                      Approve &amp; publish
                    </button>
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setMode('changes')}>
                      Request changes
                    </button>
                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setMode('suspend')}>
                      Suspend
                    </button>
                  </>
                )}
                {c.status === 'published' && (
                  <>
                    <a
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                      href={`${marketplaceUrl}/creators/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View live profile ↗
                    </a>
                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setMode('suspend')}>
                      Suspend
                    </button>
                  </>
                )}
                {c.status === 'suspended' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={busy}
                    onClick={() => void run(() => reinstateCreator(id))}
                  >
                    Reinstate (publish)
                  </button>
                )}
                {c.status === 'draft' && <p className="muted">This profile is a draft and has not been submitted.</p>}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>History</h2>
            {history.length === 0 ? (
              <p className="muted">No moderation actions yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {history.map((h) => (
                  <li key={h.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--cc-border)' }}>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {h.action.replace(/_/g, ' ')}
                    </div>
                    {h.reason && <div className="sub">{h.reason}</div>}
                    <div className="sub subtle">{formatDate(h.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <p style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/moderation')}>
          Done
        </button>
      </p>
    </div>
  );
}

function PriceRow({ item }: { item: PricingItem }) {
  const cur = item.currency ?? 'USD';
  let value = item.note ?? '—';
  if (item.price_min != null && item.price_max != null) value = `${cur} ${item.price_min}–${item.price_max}`;
  else if (item.price_min != null) value = `From ${cur} ${item.price_min}`;
  else if (item.price_max != null) value = `Up to ${cur} ${item.price_max}`;
  return (
    <>
      <dt>{formatLabel(item.format)}</dt>
      <dd>{value}</dd>
    </>
  );
}

const placeholder =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="%23f3f1ec"/></svg>';
