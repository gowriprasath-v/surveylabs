export default function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <textarea
        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none transition-colors"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        {...props}
      />
    </div>
  );
}
