export default function Button({ children, onClick, type = 'button', variant = 'primary', size = 'md', loading, disabled, className = '' }) {
  const base = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-light)]';
  
  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[14px]',
    lg: 'px-6 py-3 text-[16px]',
  };

  const variants = {
    primary: { background: 'var(--brand)', color: 'white', border: 'none' },
    secondary: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
    danger: { background: 'var(--bad-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' },
  };

  const style = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;

  const bgHoverColors = {
    primary: 'var(--brand-hover)',
    secondary: 'var(--bg-muted)',
    ghost: 'var(--bg-muted)',
    danger: 'var(--danger)',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${sizes[size]} ${isDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:shadow-[var(--shadow-sm)]'} ${className}`}
      style={style}
      onMouseEnter={(e) => { 
        if (!isDisabled) {
          e.currentTarget.style.background = bgHoverColors[variant];
          if (variant === 'danger') e.currentTarget.style.color = 'white';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.background = style.background;
          if (variant === 'danger') e.currentTarget.style.color = 'var(--danger)';
        }
      }}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-[currentColor] border-t-transparent animate-custom-spin opacity-80" />
      ) : (
        children
      )}
    </button>
  );
}
