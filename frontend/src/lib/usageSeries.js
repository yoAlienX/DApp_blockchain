function formatAxisLabel(timestamp, spanDays) {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Now';
  const date = new Date(timestamp * 1000);
  if (spanDays >= 1) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function buildCumulativeSeries(onChainEvents = [], verificationOps = []) {
  const issuedCount = onChainEvents.filter(e => e.type === 'Issued').length;
  const revokedCount = onChainEvents.filter(e => e.type === 'Revoked').length;
  const verifiedCount = verificationOps.length;

  const combined = [
    ...onChainEvents.map(e => ({ type: e.type, at: Number(e.timestamp) || 0 })),
    ...verificationOps.map(v => ({ type: 'Verified', at: Number(v.at) || 0 }))
  ].sort((a, b) => a.at - b.at);

  const totalOps = combined.length;
  const firstAt = combined[0]?.at || Math.floor(Date.now() / 1000);
  const lastAt = combined[combined.length - 1]?.at || firstAt;
  const spanDays = (lastAt - firstAt) / 86400;
  const baselineAt = combined.length ? Math.max(0, firstAt - 60) : firstAt;

  const series = [
    {
      label: formatAxisLabel(baselineAt, spanDays),
      at: baselineAt,
      value: 0,
      note: 'Initial baseline (0 ops)'
    }
  ];

  combined.forEach((op, idx) => {
    const count = idx + 1;
    series.push({
      label: formatAxisLabel(op.at, spanDays),
      at: op.at,
      value: count,
      note: `${op.type} · ${count} total`
    });
  });

  return { series, totalOps, issuedCount, revokedCount, verifiedCount };
}
