import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function Toast({
  message,
  type,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000
}: ToastProps) {
  const [isTablet, setIsTablet] = useState(false);

  // Check if we're on a tablet device
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width <= 1024);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);
  
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [isVisible, onClose, autoClose, duration]);

  if (!isVisible) return null;

  // Define styles based on toast type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Use simpler animation for tablets to prevent flashing
  const animationClass = isTablet 
    ? 'fixed opacity-100' // No animation for tablets
    : 'fixed animate-slideInUp';

  return (
    <div 
      className={`${animationClass} bottom-5 right-5 left-5 md:left-auto md:w-96 rounded-lg shadow-lg z-50 ${getToastStyles()} transition-opacity duration-200`}
      style={{ opacity: isVisible ? 1 : 0 }}
      role="alert"
    >
      <div className="flex items-center justify-between p-4">
        <p className="font-medium">{message}</p>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
} 