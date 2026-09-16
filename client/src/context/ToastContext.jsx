import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, title, text, duration = 4500) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, variant, title, text }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (title, text) => push('success', title, text),
      error: (title, text) => push('error', title, text, 6000),
      warning: (title, text) => push('warning', title, text, 5500),
      info: (title, text) => push('info', title, text),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] || Info;
          return (
            <div key={t.id} className={`toast toast--${t.variant}`} role="status">
              <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div className="toast__body">
                <div className="toast__title">{t.title}</div>
                {t.text && <div className="toast__text">{t.text}</div>}
              </div>
              <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
