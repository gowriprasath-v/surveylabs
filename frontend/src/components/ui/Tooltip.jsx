import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, position = 'top', delay = 0.2 }) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const popVariants = {
    hidden: { opacity: 0, scale: 0.9, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div 
      className="relative flex items-center justify-center w-max"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={popVariants}
            transition={{ duration: 0.15, delay }}
            className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-[var(--text-primary)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] w-max max-w-xs text-center pointer-events-none ${positions[position]}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
