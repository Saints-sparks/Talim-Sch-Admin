import { useEffect, useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const Toast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setToasts([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          style={{
            backgroundColor: toast.type === 'success' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            marginBottom: '8px',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export const toast = {
  success: (message: string) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message,
      type: 'success',
    };
    if (window) {
      (window as any).toasts = [...(window as any).toasts || [], newToast];
    }
  },
  error: (message: string) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message,
      type: 'error',
    };
    if (window) {
      (window as any).toasts = [...(window as any).toasts || [], newToast];
    }
  },
};

export default Toast;
