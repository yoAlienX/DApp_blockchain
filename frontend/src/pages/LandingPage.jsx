import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  Landmark,
  UserCheck
} from 'lucide-react';
import DocumentParticles from '../components/DocumentParticles';
import FlipUsageCard from '../components/FlipUsageCard';
import { useAuth } from '../hooks/useAuth';

function RevealOnScroll({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -36px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const auth = useAuth();

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Full-viewport desktop Hero with animated particles */}
      <section className="hero-fullscreen relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-10 sm:py-10">
        <DocumentParticles />

        <div aria-hidden="true" className="hidden lg:block" />

        <div className="relative z-10 my-auto grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-10">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/90 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ethereum Sepolia Document Registry
            </div>

            <h1 className="mt-5 text-slate-900 dark:text-white">
              Verify official documents in seconds, without sharing the file.
            </h1>

            <p className="lead">
              SealMark lets issuing authorities anchor cryptographic SHA-256 document fingerprints on Sepolia so citizens, employers, and institutions can verify authenticity directly in their browser.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/verify" className="button-primary px-5 py-3">
                <FileCheck2 size={17} aria-hidden="true" />
                Verify a Document
                <ArrowRight size={15} aria-hidden="true" />
              </Link>

              <Link
                to={auth.isAdmin ? '/admin' : auth.isLoggedIn ? '/profile' : '/login'}
                className="button-secondary px-5 py-3"
              >
                <Landmark size={16} aria-hidden="true" />
                {auth.isAdmin ? 'Authority Portal' : auth.isLoggedIn ? 'My Profile' : 'Account Sign In'}
              </Link>

              <Link
                to="/faq"
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <HelpCircle size={16} aria-hidden="true" />
                How to Use &amp; FAQ
              </Link>
            </div>

            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
              100% local SHA-256 · Wallet-free verification · Immutable Sepolia audit log
            </p>
          </div>

          {/* Flippable Record Verification & Animated Usage Line Chart Card */}
          <FlipUsageCard />
        </div>

        <div className="relative z-10 mt-6 flex justify-center pt-2 lg:mt-4">
          <a
            href="#roles-section"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-xs backdrop-blur transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <span>Scroll to explore</span>
            <ChevronDown size={14} className="animate-bounce" aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* Role-based Access Comparison (Revealed on scroll) */}
      <RevealOnScroll>
        <section id="roles-section" className="grid gap-6 md:grid-cols-2" aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="sr-only">User and Admin Access Rights</h2>
          <div className="card transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <UserCheck size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">For Citizens &amp; Verifiers</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Standard User Access</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Verify government permits, certificates, and contracts on Sepolia without MetaMask.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Inspect the public on-chain issuance &amp; revocation audit log.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Customize your profile avatar, reset your password, and resume where you left off.
              </li>
            </ul>
            <div className="mt-5">
              <Link to="/verify" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                Open Document Verifier →
              </Link>
            </div>
          </div>

          <div className="card transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Landmark size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">For Issuing Authorities</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Authority Admin Access</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                Sign and anchor official document SHA-256 fingerprints onto Sepolia via MetaMask.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                Permanently revoke compromised or superseded documents issued by your authority.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                Manage authorized issuing wallet addresses directly from the Owner Admin panel.
              </li>
            </ul>
            <div className="mt-5">
              <Link to={auth.isAdmin ? '/admin' : '/login'} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                {auth.isAdmin ? 'Go to Authority Portal →' : 'Sign in as Authority Admin →'}
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Real-world Use Cases (Revealed on scroll) */}
      <RevealOnScroll delay={90}>
        <section className="card" aria-labelledby="use-cases-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Applications</p>
              <h2 id="use-cases-heading" className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                Built for verifiable official records
              </h2>
            </div>
            <Link to="/faq" className="button-secondary text-xs">
              Read Guide &amp; FAQ
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              [Landmark, 'Government & Civic Records', 'Verify birth certificates, land deeds, tax clearances, and municipal permits issued by public authorities.'],
              [GraduationCap, 'Academic Credentials', 'Confirm university degrees, mark sheets, and training certificates against tampering before hiring.'],
              [Building2, 'Enterprise & Legal Files', 'Anchor signed contracts, audit reports, and compliance filings with permanent revocation support.']
            ].map(([Icon, title, desc]) => (
              <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <Icon size={20} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}
