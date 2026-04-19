import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[95vh]'
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      <div className="fixed inset-0 bg-slate-900/60" onClick={onClose} />
      <div className={`relative bg-surface rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] flex flex-col w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden z-10 border border-[var(--color-border)] ${sizes[size]}`}>
        <div className="sm:hidden w-12 h-1.5 bg-text-muted rounded-full mx-auto mt-3 mb-1" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-2">
          <h2 className="text-lg font-semibold text-text-1">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-2 hover:text-text-1 rounded-full p-2 hover:bg-white/5 transition-colors outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto bg-base flex-1">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/10 bg-surface-2 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
