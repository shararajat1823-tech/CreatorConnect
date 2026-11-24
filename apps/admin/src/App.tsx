import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout } from './components/Layout';
import { SignIn } from './components/SignIn';
import { ModerationQueue } from './components/ModerationQueue';
import { CreatorDetail } from './components/CreatorDetail';
import { ReportsQueue } from './components/ReportsQueue';
import { Spinner, StateView } from './components/ui';

export function App() {
  const { configured, loading, user, isAdmin, signOut } = useAuth();

  if (!configured) {
    return (
      <div className="container">
        <StateView
          icon="⚙️"
          title="Admin is not configured"
          message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/admin/.env, then restart."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  if (!user) return <SignIn />;

  if (!isAdmin) {
    return (
      <div className="container">
        <StateView
          icon="🔒"
          title="Not authorized"
          message="This account doesn't have the admin role. Ask an existing admin to grant access."
        >
          <button className="btn btn-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </StateView>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/moderation" replace />} />
        <Route path="/moderation" element={<ModerationQueue />} />
        <Route path="/moderation/:id" element={<CreatorDetail />} />
        <Route path="/reports" element={<ReportsQueue />} />
        <Route path="*" element={<Navigate to="/moderation" replace />} />
      </Routes>
    </Layout>
  );
}
