import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';
import { motion } from 'framer-motion';

export default function AnimatedNumber({ value, duration = 1.5, className = '' }) {
  const nodeRef = useRef(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const animation = animate(count, value, { duration, ease: "easeOut" });
    return animation.stop;
  }, [value, duration, count]);

  return <motion.span ref={nodeRef} className={className}>{rounded}</motion.span>;
}
