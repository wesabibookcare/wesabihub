import { toast } from 'sonner';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/Button';

interface RequestDeliveryModalProps {
  parcelId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestDeliveryModal: React.FC<RequestDeliveryModalProps> = ({ parcelId, isOpen, onClose, onSuccess }) => {
  const [address, setAddress] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('/api/request-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelId, deliveryAddress: address }),
    });

    if (response.ok) {
      onSuccess();
      onClose();
    } else {
      toast.error('Failed to request delivery');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-xl"
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">Request WeSabiDelivery</h2>
            <input
              type="text"
              placeholder="Enter your doorstep address..."
              className="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 mb-4 dark:text-white"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="flex gap-4">
              <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1">Confirm Delivery</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
