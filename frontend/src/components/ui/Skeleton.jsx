import { motion } from 'framer-motion';

export default function Skeleton({ className = '', variant = 'rect', ...props }) {
  const base = "animate-pulse bg-white/10 overflow-hidden relative";
  
  const variants = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded-sm h-4 w-3/4",
    card: "rounded-[var(--radius-xl)] bg-surface-2 border border-white/5",
  };

  return (
    <div 
      className={`${base} ${variants[variant]} ${className}`} 
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent border-t border-white/5" />
    </div>
  );
}
