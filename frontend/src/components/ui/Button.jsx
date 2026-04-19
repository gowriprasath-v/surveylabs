import { forwardRef } from 'react';

const Button = forwardRef(({ children, onClick, type = 'button', variant = 'primary', size = 'md', loading, disabled, className = '', ...props }, ref) => {
  const base = 'relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';
  
  const sizes = {
    sm: 'px-3.5 py-2 text-[12px] rounded-[var(--radius-sm)]',
    md: 'px-4.5 py-2.5 text-[14px] rounded-[var(--radius-md)]',
    lg: 'px-6 py-3.5 text-[15px] rounded-[var(--radius-lg)]',
  };

  const variants = {
    primary: 'bg-primary text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_2px_8px_rgba(99,102,241,0.25)] hover:bg-primary-hover hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),_0_4px_12px_rgba(99,102,241,0.4)] focus-visible:ring-primary',
    secondary: 'bg-surface-2 text-text-1 border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:bg-surface-3 hover:border-white/20 focus-visible:ring-text-2',
    glass: 'bg-white/5 text-text-1 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-white/10 hover:border-white/20 backdrop-blur-md focus-visible:ring-primary',
    ghost: 'bg-transparent text-text-2 hover:text-text-1 hover:bg-white/5 focus-visible:ring-text-2 active:scale-100',
    danger: 'bg-danger text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-red-500 focus-visible:ring-danger',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-custom-spin shrink-0" />
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
