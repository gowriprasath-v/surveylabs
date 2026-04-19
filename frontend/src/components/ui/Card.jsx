import { motion } from 'framer-motion';

export default function Card({ children, className = '', padding = 'p-6', animate = false, glass = false, ...props }) {
  const CardComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  } : {};

  const baseStyle = glass
    ? 'glass-panel rounded-[var(--radius-xl)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
    : 'bg-surface rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-300';

  return (
    <CardComponent className={`${baseStyle} ${padding} ${className}`} {...animationProps} {...props}>
      {children}
    </CardComponent>
  );
}

Card.Header = function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-5 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-semibold text-text-1 leading-tight tracking-tight">{title}</h3>}
        {subtitle && <p className="text-sm text-text-2 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`relative ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-5 pt-4 border-t border-white/5 ${className}`}>
      {children}
    </div>
  );
};
