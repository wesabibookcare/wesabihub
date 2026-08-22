import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type SuccessAnimationStyle = 'confetti' | 'checkmark' | 'fireworks' | 'coins' | 'ripple' | 'stars';

interface SuccessAnimationProps {
  isOpen: boolean;
  style?: SuccessAnimationStyle;
  title?: string;
  subtitle?: string;
  onComplete: () => void;
  autoDismissMs?: number;
}

const CONFETTI_COLORS = ['#0284C7', '#7C3AED', '#059669', '#DB2777', '#F59E0B', '#EF4444'];

const Confetti: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 60 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.4;
      const duration = 1.6 + Math.random() * 1.2;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const rotate = Math.random() * 360;
      const isCircle = i % 3 === 0;
      return (
        <motion.div
          key={i}
          initial={{ y: -40, x: `${left}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', rotate: rotate + 360, opacity: [1, 1, 0] }}
          transition={{ duration, delay, ease: 'easeIn' }}
          className="absolute top-0"
          style={{
            width: 10,
            height: isCircle ? 10 : 14,
            backgroundColor: color,
            borderRadius: isCircle ? '50%' : '2px',
          }}
        />
      );
    })}
  </div>
);

const Fireworks: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 3 }).map((_, burstIdx) => {
      const cx = 30 + burstIdx * 20;
      const cy = 30 + (burstIdx % 2) * 20;
      const delay = burstIdx * 0.35;
      return (
        <div key={burstIdx} className="absolute" style={{ left: `${cx}%`, top: `${cy}%` }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const dist = 90 + Math.random() * 40;
            const color = CONFETTI_COLORS[(burstIdx + i) % CONFETTI_COLORS.length];
            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                transition={{ duration: 1, delay, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      );
    })}
  </div>
);

const Coins: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 24 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 1.8 + Math.random() * 1;
      return (
        <motion.div
          key={i}
          initial={{ y: -40, x: `${left}vw`, opacity: 1, rotateY: 0 }}
          animate={{ y: '110vh', rotateY: 720, opacity: [1, 1, 0] }}
          transition={{ duration, delay, ease: 'easeIn' }}
          className="absolute top-0 w-7 h-7 rounded-full bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-[11px] font-black text-amber-800 shadow"
        >
          ₦
        </motion.div>
      );
    })}
  </div>
);

const Ripple: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[0, 0.3, 0.6].map((delay, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1.6, delay, repeat: 1, ease: 'easeOut' }}
        className="absolute w-24 h-24 rounded-full border-4 border-emerald-400"
      />
    ))}
  </div>
);

const Stars: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 30 }).map((_, i) => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 1.2;
      const size = 6 + Math.random() * 10;
      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
          transition={{ duration: 1.2, delay, repeat: 1 }}
          className="absolute rounded-full bg-amber-300"
          style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
        />
      );
    })}
  </div>
);

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  isOpen,
  style = 'confetti',
  title = 'Success!',
  subtitle,
  onComplete,
  autoDismissMs = 2600,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onComplete, autoDismissMs);
    return () => clearTimeout(timer);
  }, [isOpen, autoDismissMs, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center cursor-pointer"
        >
          {style === 'confetti' && <Confetti />}
          {style === 'fireworks' && <Fireworks />}
          {style === 'coins' && <Coins />}
          {style === 'ripple' && <Ripple />}
          {style === 'stars' && <Stars />}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative z-10 flex flex-col items-center text-center px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl",
                style === 'coins' ? "bg-amber-400 shadow-amber-500/40" : "bg-emerald-500 shadow-emerald-500/40"
              )}
            >
              <CheckCircle2 size={56} className="text-white" strokeWidth={2.5} />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-black text-white font-display mb-2">{title}</h2>
            {subtitle && <p className="text-slate-300 text-sm max-w-sm">{subtitle}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
