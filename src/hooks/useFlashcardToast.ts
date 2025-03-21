import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export default function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToast({
      id,
      message,
      type,
      isVisible: true
    });
    return id;
  }, []);

  const hideToast = useCallback(() => {
    if (toast) {
      setToast(prev => prev ? { ...prev, isVisible: false } : null);
      setTimeout(() => {
        setToast(null);
      }, 300);
    }
  }, [toast]);

  return { toast, showToast, hideToast };
} 