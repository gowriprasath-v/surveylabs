export default function EmptyState({ icon = '📋', title, description }) {
  return (
    <div className="text-center py-20 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>}
    </div>
  );
}
