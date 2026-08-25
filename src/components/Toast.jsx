import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, ...toast }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, toast.duration ?? 5000);
  }, []);

  const value = {
    success: (title, detail) => push({ title, detail }),
    error: (title, detail) => push({ title, detail, variant: 'error' }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast${toast.variant === 'error' ? ' is-error' : ''}`}
          >
            <div>
              <b>{toast.title}</b>
              {toast.detail && <span>{toast.detail}</span>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
