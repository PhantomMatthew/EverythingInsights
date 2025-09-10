import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { 
  Card, 
  CardBody,
  Button
} from '@heroui/react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toastData: Omit<Toast, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = {
      id,
      duration: 5000,
      ...toastData,
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const getToastColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'primary';
      default: return 'default';
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <Card
            key={toast.id}
            className={`shadow-lg border-l-4 animate-in slide-in-from-right duration-300`}
            style={{
              borderLeftColor: `hsl(var(--heroui-${getToastColor(toast.type)}))`
            }}
          >
            <CardBody className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-xs text-default-600">{toast.message}</p>
                  )}
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={() => removeToast(toast.id)}
                  className="ml-2"
                >
                  ×
                </Button>
              </div>
              
              {toast.action && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    color={getToastColor(toast.type)}
                    variant="flat"
                    onClick={() => {
                      toast.action!.onClick();
                      removeToast(toast.id);
                    }}
                  >
                    {toast.action.label}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};