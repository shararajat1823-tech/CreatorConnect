import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth';

export function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className="signin-wrap">
      <div className="card signin-card">
        <h1 style={{ marginTop: 0 }}>Admin sign in</h1>
        <p className="muted">Sign in with an admin account to moderate listings.</p>
        {error && (
          <div className="alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
