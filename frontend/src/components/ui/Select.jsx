export default function Select({ label, error, children, className = '', ...rest }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-2 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`block w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 appearance-none bg-surface-2 text-text-1 cursor-pointer ${
          error
            ? 'border-danger/50 focus:ring-danger focus:border-danger'
            : 'border-[var(--color-border)] focus:ring-primary focus:border-primary'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
