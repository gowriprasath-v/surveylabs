import { motion } from 'framer-motion';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center p-12 bg-white/5 backdrop-blur-sm border border-white/10 border-dashed rounded-[var(--radius-xl)] shadow-sm max-w-2xl mx-auto"
    >
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-glow border border-primary/20">
        {icon || (
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
      </div>
      <h3 className="text-2xl font-display font-semibold text-text-1 mb-3">
        {title || 'Nothing to see here'}
      </h3>
      {description && (
        <p className="text-sm text-text-2 max-w-[360px] leading-relaxed mb-8">
          {description}
        </p>
      )}
      {action && (
         <div className="mt-2 text-primary font-medium">
           {action}
         </div>
      )}
    </motion.div>
  );
}
