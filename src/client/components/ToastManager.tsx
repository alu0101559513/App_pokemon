import { useState } from 'react';
import '../styles/toast.css';

export interface ToastPayload {
  title: string;
  message: string;
}

let pushToastExternal: (t: ToastPayload) => void;

export const toast = {
  push: (toast: ToastPayload) => {
    pushToastExternal?.(toast);
  },
};

const ToastManager = () => {
  const [toasts, setToasts] = useState<any[]>([]);

  pushToastExternal = (toast) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { ...toast, id }]);

    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  };

  return (
    <div className="app-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="app-toast">
          <h4>{t.title}</h4>
          <p>{t.message}</p>
        </div>
      ))}
    </div>
  );
};

export default ToastManager;
