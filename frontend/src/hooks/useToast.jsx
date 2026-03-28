import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, closing: true } : t));
    
    // Completely remove from DOM after fade-out animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, closing: false }]);
    
    // Auto dismiss after 3 seconds as required
    setTimeout(() => removeToast(id), 3000);
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      {createPortal(<ToastContainer toasts={toasts} onRemove={removeToast} />, document.body)}
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-[var(--success)] shrink-0" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-[var(--danger)] shrink-0" />,
    info: <InformationCircleIcon className="h-5 w-5 text-[var(--brand)] shrink-0" />,
  };

  const borders = {
    success: 'border-l-[var(--success)]',
    error: 'border-l-[var(--danger)]',
    info: 'border-l-[var(--brand)]',
  };

  return (
    <div className="fixed bottom-[16px] right-[16px] z-[9999] flex flex-col gap-[8px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[var(--border)] border-l-[4px] ${borders[t.type]} px-4 py-3.5 flex items-start gap-3 w-[320px] transition-all transform ${
            t.closing ? 'animate-slide-down-fade' : 'animate-slide-up'
          }`}
        >
          <div className="mt-0.5">{icons[t.type]}</div>
          <p className="flex-1 text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{t.message}</p>
          <button
            onClick={() => onRemove(t.id)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 transition-colors mt-0.5"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
