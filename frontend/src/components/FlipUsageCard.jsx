import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock, RotateCw, ShieldCheck, TrendingUp } from 'lucide-react';
import { buildCumulativeSeries, fetchOnChainOps, loadVerificationOps } from '../lib/usageStats';

const SAMPLE_HASH = '0xf72095cad18c96031c79d73900811886b4857547f4c08a1cb85695215e70ea04';
const SPECIAL_GLYPHS = '!@#$%^&*?~+=§<>';

function createMaskedHash(length) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += SPECIAL_GLYPHS[(i * 7 + 3) % SPECIAL_GLYPHS.length];
  }
  return out;
}

function shuffledIndices(length) {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(2);
    d += ` C ${cx} ${p0.y.toFixed(2)}, ${cx} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return d;
}

export default function FlipUsageCard() {
  const [flipped, setFlipped] = useState(false);
  const [drawProgress, setDrawProgress] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [onChainEvents, setOnChainEvents] = useState([]);
  const [verificationOps, setVerificationOps] = useState(() => loadVerificationOps());
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hashRevealed, setHashRevealed] = useState(false);
  const hasToggledHash = useRef(false);
  const maskedBaseline = useMemo(() => createMaskedHash(SAMPLE_HASH.length), []);
  const [displayedHash, setDisplayedHash] = useState(maskedBaseline);
  const gradId = useId();
  const clipId = useId();

  useEffect(() => {
    if (!hasToggledHash.current) {
      setDisplayedHash(maskedBaseline);
      return undefined;
    }

    const order = shuffledIndices(SAMPLE_HASH.length);
    const totalChars = order.length;
    const duration = 850;
    const start = performance.now();
    let rafId;

    const tick = now => {
      const ratio = Math.min(1, (now - start) / duration);
      const settledCount = Math.floor(ratio * totalChars);
      const settledSet = new Set(order.slice(0, settledCount));

      let next = '';
      for (let i = 0; i < SAMPLE_HASH.length; i += 1) {
        if (settledSet.has(i)) {
          next += hashRevealed ? SAMPLE_HASH[i] : maskedBaseline[i];
        } else {
          next += SPECIAL_GLYPHS[Math.floor(Math.random() * SPECIAL_GLYPHS.length)];
        }
      }
      setDisplayedHash(next);

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayedHash(hashRevealed ? SAMPLE_HASH : maskedBaseline);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hashRevealed, maskedBaseline]);

  useEffect(() => {
    const controller = new AbortController();
    setVerificationOps(loadVerificationOps());
    fetchOnChainOps({ signal: controller.signal })
      .then(events => {
        if (!controller.signal.aborted) setOnChainEvents(events);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStats(false);
      });
    return () => controller.abort();
  }, [flipped, playCount]);

  const { series, totalOps, issuedCount, revokedCount, verifiedCount } = useMemo(
    () => buildCumulativeSeries(onChainEvents, verificationOps),
    [onChainEvents, verificationOps]
  );

  const width = 340;
  const height = 148;
  const padX = 22;
  const padTop = 18;
  const padBottom = 24;

  const { points, linePath, areaPath, maxIndex } = useMemo(() => {
    const displaySeries = series.length === 1
      ? [series[0], { label: 'Now', value: 0, note: 'No operations recorded yet' }]
      : series;
    const maxVal = Math.max(...displaySeries.map(d => d.value), 1);
    const maxIdx = displaySeries.length - 1;
    const usableW = width - padX * 2;
    const usableH = height - padTop - padBottom;

    const pts = displaySeries.map((item, idx) => ({
      ...item,
      index: idx,
      x: padX + (idx / Math.max(displaySeries.length - 1, 1)) * usableW,
      y: item.value === 0 && maxVal === 1 && totalOps === 0
        ? padTop + usableH
        : padTop + usableH - (item.value / maxVal) * usableH
    }));

    const line = buildSmoothPath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = `${line} L ${last.x.toFixed(2)} ${(height - padBottom).toFixed(2)} L ${first.x.toFixed(2)} ${(height - padBottom).toFixed(2)} Z`;

    return { points: pts, linePath: line, areaPath: area, maxIndex: maxIdx };
  }, [series, totalOps]);

  useEffect(() => {
    if (!flipped) {
      setDrawProgress(0);
      return undefined;
    }
    let rafId;
    const start = performance.now();
    const duration = 1100;

    const tick = now => {
      const ratio = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      setDrawProgress(eased);
      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [flipped, playCount, totalOps]);

  const activePoint = points[selectedIndex ?? maxIndex] || points[maxIndex];
  const currentAnimatedTotal = Math.round(drawProgress * totalOps);
  const clipWidth = padX + drawProgress * (width - padX * 2) + 8;

  // Show up to 4 evenly-spaced time/date ticks along the X axis so labels never overlap
  const visibleLabelIndices = useMemo(() => {
    if (points.length <= 4) return new Set(points.map((_, i) => i));
    const step = (points.length - 1) / 3;
    return new Set([0, Math.round(step), Math.round(step * 2), points.length - 1]);
  }, [points]);

  return (
    <div
      className="relative mx-auto w-full max-w-md"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative grid transition-transform duration-700 [transform-style:preserve-3d]"
        style={{
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {/* Front Face: Record Verification */}
        <div
          aria-hidden={flipped}
          className={`col-start-1 row-start-1 rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-lg backdrop-blur [backface-visibility:hidden] dark:border-slate-700 dark:bg-slate-900/95 ${
            flipped ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Record Verification</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Sepolia Chain ID 11155111</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-800">
                <CheckCircle2 size={12} aria-hidden="true" />
                Verified
              </span>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                aria-label="Flip to usage chart"
                title="View live system operations chart"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
              >
                <TrendingUp size={12} aria-hidden="true" />
                Chart
                <RotateCw size={11} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/70">
            <span className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-indigo-500/70" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Document Fingerprint (SHA-256)
              </p>
              <button
                type="button"
                onClick={() => {
                  hasToggledHash.current = true;
                  setHashRevealed(prev => !prev);
                }}
                aria-label={hashRevealed ? 'Hide fingerprint' : 'Reveal fingerprint'}
                title={hashRevealed ? 'Hide checksum' : 'Reveal checksum'}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                {hashRevealed ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              </button>
            </div>
            <p className="mt-1.5 break-all font-mono text-xs text-slate-800 dark:text-slate-200">
              {displayedHash}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-slate-500 dark:text-slate-400">Issued By</p>
              <p className="mt-0.5 font-mono font-semibold text-slate-800 dark:text-slate-200">0xd48e…7a53</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-slate-500 dark:text-slate-400">File Privacy</p>
              <p className="mt-0.5 flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <Lock size={12} aria-hidden="true" />
                Zero uploads
              </p>
            </div>
          </div>
        </div>

        {/* Back Face: Real Combined Operations Line Chart (0 -> Total) */}
        <div
          aria-hidden={!flipped}
          className={`col-start-1 row-start-1 rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-lg backdrop-blur [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-slate-700 dark:bg-slate-900/95 ${
            !flipped ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <TrendingUp size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">System Usage Trend</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {loadingStats ? 'Syncing Sepolia count…' : `0 → ${currentAnimatedTotal} total operations`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPlayCount(c => c + 1)}
                title="Replay chart animation"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Replay
              </button>
              <button
                type="button"
                onClick={() => setFlipped(false)}
                aria-label="Flip to record preview"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
              >
                Record
                <RotateCw size={11} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full overflow-visible" role="img" aria-label="Live system operations line chart from 0 to current total">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
                </linearGradient>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={Math.max(0, clipWidth)} height={height} />
                </clipPath>
              </defs>

              {[0.25, 0.5, 0.75, 1].map(ratio => {
                const y = padTop + (height - padTop - padBottom) * ratio;
                return (
                  <line
                    key={ratio}
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-slate-200 dark:text-slate-800"
                  />
                );
              })}

              <g clipPath={`url(#${clipId})`}>
                <path d={areaPath} fill={`url(#${gradId})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {points.map(pt => {
                  const isPeak = pt.index === maxIndex && totalOps > 0;
                  const isActive = pt.index === (selectedIndex ?? maxIndex);
                  return (
                    <g key={`${pt.index}-${pt.label}`}>
                      {isPeak && drawProgress > 0.92 && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="8"
                          fill="#10b981"
                          fillOpacity="0.22"
                          className="animate-ping"
                        />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isActive || isPeak ? 4.5 : 3}
                        fill={isPeak ? '#10b981' : '#4f46e5'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="cursor-pointer"
                        onMouseEnter={() => setSelectedIndex(pt.index)}
                        onClick={() => setSelectedIndex(pt.index)}
                      />
                    </g>
                  );
                })}
              </g>

              {points.map((pt, idx) => {
                if (!visibleLabelIndices.has(idx)) return null;
                const threshold = idx / Math.max(points.length - 1, 1);
                const visible = drawProgress >= threshold * 0.9;
                return (
                  <text
                    key={`lbl-${pt.index}-${pt.label}`}
                    x={pt.x}
                    y={height - 5}
                    textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0px)' : 'translateY(4px)',
                      transition: 'opacity 280ms ease-out, transform 280ms ease-out'
                    }}
                    className="fill-slate-500 text-[9px] font-medium dark:fill-slate-400"
                  >
                    {pt.label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-600 dark:text-slate-300">
              {totalOps === 0
                ? 'No file additions or verifications recorded yet.'
                : `${activePoint.label}: ${activePoint.note} · Added: ${issuedCount + revokedCount} · Verified: ${verifiedCount}`}
            </span>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              Total {totalOps}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
