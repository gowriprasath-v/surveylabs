export default function Input({ label, type = 'text', ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <input
        type={type}
        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        {...props}
      />
    </div>
  );
}
