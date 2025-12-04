import React, { useEffect, useState } from "react";
import "../styles/toast.css";

interface Toast {
  title: string;
  message: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: any) => {
      const toast: Toast = event.detail;
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 4000);
    };

    window.addEventListener("toast", handler);

    return () => window.removeEventListener("toast", handler);
  }, []);

  return (
    <div className="app-toast-container">
      {toasts.map((t, i) => (
        <div key={i} className="app-toast">
          <h4>{t.title}</h4>
          <p>{t.message}</p>
        </div>
      ))}
    </div>
  );
}

