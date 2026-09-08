export default function StatCard({ label, value, accent = 'blue', sub }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
