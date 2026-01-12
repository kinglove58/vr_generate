"use client";

import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  duration?: number;
};

type ToastState = ToastProps & { id: number; open: boolean };

type ToastContextValue = {
  toasts: ToastState[];
  toast: (props: ToastProps) => void;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProviderRoot({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, open: true, ...props }]);
    if (props.duration !== 0) {
      const timeout = props.duration ?? 4000;
      setTimeout(() => {
        setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));
      }, timeout);
    }
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProviderRoot");
  }
  return context;
}
