interface Stat {
  value: string | number;
  label: string;
}

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats">
      {stats.map((s) => (
        <div key={s.label} className="stat">
          <strong>{s.value}</strong>
          <span className="muted">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HeatLegend() {
  return (
    <div className="legend">
      <span className="muted small">Less</span>
      {[0, 1, 2, 3, 4].map((level) => (
        <div key={level} className={`cell l${level}`} />
      ))}
      <span className="muted small">More</span>
    </div>
  );
}
