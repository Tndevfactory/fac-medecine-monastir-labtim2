// components/ui/Toast.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, TriangleAlert } from 'lucide-react'; // Icons for different types of toasts

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number; // Duration in milliseconds before auto-closing
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Give a small delay for the exit animation to complete before calling onClose
      setTimeout(onClose, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColorsAndIcon = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          icon: <CheckCircle className="h-5 w-5" />,
          title: 'Succès!'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          icon: <XCircle className="h-5 w-5" />,
          title: 'Erreur!'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          icon: <Info className="h-5 w-5" />,
          title: 'Information!'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
          icon: <TriangleAlert className="h-5 w-5" />,
          title: 'Attention!'
        };
      default:
        return {
          bgColor: 'bg-gray-700',
          textColor: 'text-white',
          icon: <Info className="h-5 w-5" />,
          title: 'Notification'
        };
    }
  };

  const { bgColor, textColor, icon, title } = getColorsAndIcon();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${bgColor} ${textColor} max-w-sm w-full`}
          role="alert"
        >
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300); // Wait for exit animation
            }}
            className={`flex-shrink-0 ml-auto p-1 rounded-full ${textColor} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
            aria-label="Fermer la notification"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
