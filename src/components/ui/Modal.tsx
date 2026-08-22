import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md'
}: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
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
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              "relative w-full bg-surface rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]",
              sizes[size]
            )}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="space-y-1">
                {title && <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">{title}</h3>}
                {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
              </div>
              <Button variant="text" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto">
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 p-6 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
