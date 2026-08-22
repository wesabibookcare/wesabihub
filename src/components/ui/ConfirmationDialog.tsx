import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const variantColors = {
    danger: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
    info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
  };

  const buttonVariants = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl border ${variantColors[variant]}`}>
                  <AlertTriangle size={24} />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl h-12 font-bold text-slate-600"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 rounded-xl h-12 font-black uppercase tracking-widest text-xs shadow-lg ${buttonVariants[variant]}`}
                >
                  {confirmText}
                </Button>
              </div>
            </div>

            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 0.3 }}
                 className={`h-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}
               />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
