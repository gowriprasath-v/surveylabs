const variantClasses = {
  emerald: 'bg-success/10 text-success border-success/30',
  gray: 'bg-surface-2 text-text-2 border-[var(--color-border)]',
  indigo: 'bg-primary/10 text-primary border-primary/30',
  amber: 'bg-accent/10 text-accent border-accent/30',
  red: 'bg-danger/10 text-danger border-danger/30',
  glass: 'bg-surface text-text-1 border-[var(--color-border)]'
};

export default function Badge({ variant = 'gray', children, className = '', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${variantClasses[variant] || variantClasses.gray} ${className}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'currentColor' }} />
      )}
      {children}
    </span>
  );
}
