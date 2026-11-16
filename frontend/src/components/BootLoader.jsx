import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { at: 0, label: 'Initializing Web Crypto SHA-256 engine…' },
  { at: 38, label: 'Connecting Sepolia registry client…' },
  { at: 74, label: 'Preparing SealMark workspace…' },
  { at: 100, label: 'Ready' }
];

export default function BootLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  // Random fluid duration between 1.2s and 2.8s on every load
  const durationRef = useRef(Math.round(1200 + Math.random() * 1600));

  useEffect(() => {
    const duration = durationRef.current;
    const start = performance.now();
    let frameId;
    let doneTimer;
    let windowLoaded = document.readyState === 'complete';

    const onWindowLoad = () => { windowLoaded = true; };
    if (!windowLoaded) {
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    const tick = now => {
      const elapsed = now - start;
      const rawRatio = Math.min(1, elapsed / duration);
      // Wait smoothly near 96% if the page resources are still loading
      const cappedRatio = !windowLoaded && rawRatio > 0.96 ? 0.96 : rawRatio;
      const eased = 1 - Math.pow(1 - cappedRatio, 2);
      const next = Math.round(eased * 100);
      setProgress(next);

      if (cappedRatio < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        doneTimer = setTimeout(() => onComplete?.(), 280);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(doneTimer);
      window.removeEventListener('load', onWindowLoad);
    };
  }, [onComplete]);

  const activeStep = [...STEPS].reverse().find(step => progress >= step.at)?.label || STEPS[0].label;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading SealMark"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8fafc] px-6 text-slate-900 transition-opacity duration-300 dark:bg-slate-950 dark:text-slate-100 ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <svg className="animate-orbit absolute inset-0 h-full w-full" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-slate-200 dark:text-slate-800"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="72 160"
              strokeLinecap="round"
              className="text-blue-600 dark:text-indigo-400"
            />
          </svg>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 dark:bg-indigo-500">
            {progress >= 100 ? (
              <CheckCircle2 size={24} className="animate-bounce" aria-hidden="true" />
            ) : (
              <ShieldCheck size={24} className="animate-pulse" aria-hidden="true" />
            )}
          </div>
        </div>

        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SealMark</p>
        <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{activeStep}</p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Loading workspace</span>
            <span className="font-mono text-blue-600 dark:text-indigo-400">{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-[width] duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
