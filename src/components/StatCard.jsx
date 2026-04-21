export default function StatCard({ title, value, tone = "default", note }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__title">{title}</div>
      <div className="stat-card__value">{value}</div>
      {note ? <div className="stat-card__note">{note}</div> : null}
    </article>
  );
}
