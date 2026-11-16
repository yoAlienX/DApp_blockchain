import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  ExternalLink,
  FileCheck2,
  FilePlus2,
  HelpCircle,
  History,
  Home,
  LogIn,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  WalletCards,
  X
} from 'lucide-react';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { WalletProvider, useWallet } from './hooks/useWallet';
import { config, configErrors } from './config';
import { InlineError, PageLoader, Spinner } from './components';
import BootLoader from './components/BootLoader';
import UserAvatar from './components/UserAvatar';
import LandingPage from './pages/LandingPage';
import './index.css';

const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const IssuePage = lazy(() => import('./pages/IssuePage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const ROUTE_META = {
  '/': { title: 'SealMark — Document Verification on Sepolia', label: 'Landing Page' },
  '/verify': { title: 'Verify · SealMark', label: 'Document Verification' },
  '/activity': { title: 'Activity · SealMark', label: 'Registry Activity Log' },
  '/faq': { title: 'Guide & FAQ · SealMark', label: 'Guide & FAQ' },
  '/admin': { title: 'Authority Portal · SealMark', label: 'Authority Issuance Portal' },
  '/issue': { title: 'Authority Portal · SealMark', label: 'Authority Issuance Portal' },
  '/profile': { title: 'Profile · SealMark', label: 'Profile Settings' },
  '/login': { title: 'Sign In · SealMark', label: 'Sign In' }
};

function Navbar() {
  const wallet = useWallet();
  const auth = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const showConnect = !wallet.account || wallet.wrongNetwork;

  const navItems = [
    ['/', 'Home', Home],
    ['/verify', 'Verify', FileCheck2],
    ['/activity', 'Activity', History],
    ['/faq', 'FAQ', HelpCircle],
    ...(auth.isAdmin ? [['/admin', 'Admin', FilePlus2]] : [])
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-6">
        <div className="flex h-16 shrink-0 items-center">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <span>SealMark</span>
          </Link>
        </div>

        <nav aria-label="Main navigation" className="order-last flex w-full gap-1 overflow-x-auto border-t border-slate-100 py-2 text-sm dark:border-slate-800 lg:order-none lg:w-auto lg:border-0 lg:py-0">
          {navItems.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              }
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>

          {auth.isAdmin && (
            showConnect ? (
              <button
                onClick={wallet.connect}
                disabled={wallet.loading}
                className="button-primary px-3 py-2 text-xs"
                aria-busy={wallet.loading}
              >
                {wallet.loading ? <Spinner /> : <WalletCards size={14} aria-hidden="true" />}
                {wallet.loading ? 'Connecting…' : wallet.wrongNetwork ? 'Switch to Sepolia' : 'Connect wallet'}
              </button>
            ) : (
              <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900 sm:flex">
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 font-mono text-xs font-medium text-slate-800 shadow-xs dark:bg-slate-800 dark:text-slate-200"
                  title={wallet.account}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {wallet.account.slice(0, 6)}…{wallet.account.slice(-4)}
                </span>
                <button
                  onClick={wallet.disconnect}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            )
          )}

          {auth.isLoggedIn ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-2.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                title="Open profile settings"
              >
                <UserAvatar avatar={auth.user.avatar} name={auth.user.name} size="sm" />
                <span className="hidden max-w-[90px] truncate sm:inline">{auth.user.name}</span>
              </Link>
              <button
                type="button"
                onClick={auth.logout}
                aria-label="Log out"
                title="Log out (saves your progress)"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <LogOut size={15} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="button-secondary px-3 py-2 text-xs">
              <LogIn size={14} aria-hidden="true" />
              Sign in
            </Link>
          )}
        </div>
      </div>
      {wallet.error && (
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
          <InlineError>{wallet.error}</InlineError>
        </div>
      )}
    </header>
  );
}

function SetupNotice() {
  if (!configErrors.length) return null;
  return (
    <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200" aria-labelledby="setup-title">
      <h2 id="setup-title" className="text-base font-semibold">Registry setup required</h2>
      <p className="mt-2 leading-6">The interface is loaded, but blockchain actions remain disabled until a Sepolia registry deployment is configured.</p>
      <ul className="mt-3 list-inside list-disc space-y-1 break-words">{configErrors.map(error => <li key={error}>{error}</li>)}</ul>
      <p className="mt-3 leading-6">Copy <code>frontend/.env.example</code> to <code>frontend/.env</code>, configure the public values, and restart the app. Never store private keys in frontend configuration.</p>
    </section>
  );
}

function ResumeToast() {
  const auth = useAuth();
  if (!auth.resumeBanner) return null;
  return (
    <div role="status" className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
      <span>{auth.resumeBanner}</span>
      <button
        type="button"
        onClick={auth.clearResumeBanner}
        aria-label="Dismiss welcome message"
        className="rounded-lg p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function RouteFocus() {
  const { pathname } = useLocation();
  const auth = useAuth();

  useEffect(() => {
    const meta = ROUTE_META[pathname] || { title: 'SealMark', label: pathname };
    document.title = meta.title;
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (auth.ready) auth.recordProgress(pathname, meta.label);
  }, [pathname, auth.ready, auth.recordProgress]);

  return null;
}

function AppShell() {
  const [bootDone, setBootDone] = useState(false);
  const handleBootComplete = useCallback(() => setBootDone(true), []);

  return (
    <>
      {!bootDone && <BootLoader onComplete={handleBootComplete} />}
      <div className={bootDone ? 'opacity-100 transition-opacity duration-300' : 'pointer-events-none opacity-0'}>
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-indigo-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-2">
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="mx-auto min-h-[calc(100vh-11rem)] max-w-6xl px-4 py-6 outline-none sm:px-6 lg:py-7">
          <RouteFocus />
          <SetupNotice />
          <ResumeToast />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/admin" element={<IssuePage />} />
              <Route path="/issue" element={<IssuePage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <ShieldCheck size={15} aria-hidden="true" />
                  </span>
                  <span>SealMark</span>
                </div>
                <p className="mt-2.5 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Browser-local SHA-256 document fingerprinting with public verification and authority issuance on Ethereum Sepolia.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Workspace</p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link></li>
                  <li><Link to="/verify" className="hover:text-indigo-600 dark:hover:text-indigo-400">Verify Document</Link></li>
                  <li><Link to="/activity" className="hover:text-indigo-600 dark:hover:text-indigo-400">Registry Activity</Link></li>
                  <li><Link to="/faq" className="hover:text-indigo-600 dark:hover:text-indigo-400">How to Use &amp; FAQ</Link></li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Network &amp; Registry</p>
                <div className="mt-2.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Ethereum Sepolia (Chain ID {config.chainId.toString()})</span>
                  </div>
                  {!configErrors.length && (
                    <a
                      className="inline-flex max-w-full items-center gap-1 break-all font-mono text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-400 dark:decoration-indigo-700 dark:hover:text-indigo-300"
                      href={`${config.explorerUrl}/address/${config.contractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Contract: {config.contractAddress}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>© {new Date().getFullYear()} SealMark · Client-side SHA-256 · Zero file uploads</span>
              <span>Sepolia Testnet Registry</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <main className="mx-auto max-w-xl p-8">
          <h1>SealMark could not load</h1>
          <p className="lead">Refresh the page. If the issue persists, check your RPC configuration. No file has been uploaded.</p>
          <button className="button-primary mt-5" onClick={() => window.location.reload()}>Reload application</button>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
