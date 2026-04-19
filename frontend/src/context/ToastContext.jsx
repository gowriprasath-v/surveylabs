import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  // We map the existing API to react-hot-toast
  const toastApi = {
    success: (msg) => toast.success(msg, { duration: 4000 }),
    error: (msg) => toast.error(msg, { duration: 4000 }),
    info: (msg) => toast(msg, { duration: 4000, icon: 'ℹ️' }),
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-1)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(12px)',
            fontSize: '13px',
            fontWeight: '600'
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: '#fff',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
