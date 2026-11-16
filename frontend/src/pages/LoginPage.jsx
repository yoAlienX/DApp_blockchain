import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Landmark, LogIn, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { InlineError, Spinner } from '../components';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const matched = await auth.login({ email, password });
      const redirectFrom = location.state?.from;
      const target = matched.lastSeenAt && matched.lastPath
        ? matched.lastPath
        : redirectFrom || (matched.role === 'admin' ? '/admin' : '/verify');
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const created = await auth.register({ name, email, password, organization });
      navigate(created.role === 'admin' ? '/admin' : '/verify', { replace: true });
    } catch (err) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setTab('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Account Access</p>
        <h1 className="mt-2">Sign in to SealMark</h1>
        <p className="lead">
          Sign in as a Standard User to verify records and manage your profile, or as an Authority Admin to issue and revoke document fingerprints on Sepolia.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="card">
          <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold dark:bg-slate-800" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              onClick={() => { setTab('login'); setError(''); }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 transition-colors ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LogIn size={14} aria-hidden="true" />
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'register'}
              onClick={() => { setTab('register'); setError(''); }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 transition-colors ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserPlus size={14} aria-hidden="true" />
              Create Account
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="label block">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.org"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="label block">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <InlineError>{error}</InlineError>

              <button type="submit" disabled={loading} className="button-primary w-full">
                {loading ? <><Spinner />Signing in…</> : 'Sign in & resume session'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="label block">Full name</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="label block">Email address</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="reg-org" className="label block">Organization (optional)</label>
                <input
                  id="reg-org"
                  type="text"
                  maxLength={100}
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="label block">Password (min 8 characters)</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Public sign-up creates a <strong>Standard User</strong> account (document verification &amp; activity access). Authority Admin accounts are provisioned separately.
              </p>

              <InlineError>{error}</InlineError>

              <button type="submit" disabled={loading} className="button-primary w-full">
                {loading ? <><Spinner />Creating account…</> : 'Create account'}
              </button>
            </form>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <h2>Demo Accounts</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
              Use either pre-configured account to test User vs. Authority Admin permissions and session resume after logout.
            </p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => fillDemo('user@sealmark.org', 'User@123')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-indigo-700"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
                    <UserCheck size={14} aria-hidden="true" />
                    Standard User
                  </span>
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Click to fill</span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">user@sealmark.org / User@123</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Verify documents, view activity, customize profile.</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('admin@sealmark.org', 'Admin@123')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-indigo-700"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    <Landmark size={14} aria-hidden="true" />
                    Authority Admin
                  </span>
                  <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Click to fill</span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">admin@sealmark.org / Admin@123</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Issue, revoke, and manage authorized issuers on Sepolia.</p>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
