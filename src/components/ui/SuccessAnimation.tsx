import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trophy, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type SuccessAnimationStyle =
  | 'confetti'
  | 'checkmark'
  | 'fireworks'
  | 'coins'
  | 'ripple'
  | 'stars'
  | 'burst'
  | 'sparkle'
  | 'pulse'
  | 'badge'
  | 'glow'
  | 'particles'
  | 'celebration'
  | 'trophy'
  | 'balloons'
  | 'ribbon'
  | 'laser'
  | 'snowfall'
  | 'cosmic'
  | 'heartbeat'
  | 'diamonds'
  | 'sunburst'
  | 'neon'
  | 'quantum'
  | 'swirl'
  | 'fireflies'
  | 'shimmer'
  | 'comet'
  | 'supernova'
  | 'shield';

export const ALL_SUCCESS_ANIMATION_STYLES: { id: SuccessAnimationStyle; label: string; description: string }[] = [
  { id: 'confetti', label: 'Confetti Rain', description: 'Classic multi-color falling confetti shower' },
  { id: 'checkmark', label: 'Clean Checkmark', description: 'Minimalist smooth animated checkmark' },
  { id: 'fireworks', label: 'Fireworks Burst', description: 'Festive radial fireworks particle explosion' },
  { id: 'coins', label: 'Currency Rain', description: 'Golden Naira coins falling from above' },
  { id: 'ripple', label: 'Concentric Ripple', description: 'Expanding emerald wave ripples' },
  { id: 'stars', label: 'Twinkling Stars', description: 'Golden twinkling star field' },
  { id: 'burst', label: 'Radial Starburst', description: 'High energy radial starburst particles' },
  { id: 'sparkle', label: 'Diamond Sparkle', description: 'Floating diamond sparkles floating upward' },
  { id: 'pulse', label: 'Glowing Pulse', description: 'Soft rhythmic pulsing aura' },
  { id: 'badge', label: 'Golden Badge', description: 'Rotating golden verification seal' },
  { id: 'glow', label: 'Emerald Glow', description: 'Radiant emerald halo background light' },
  { id: 'particles', label: 'Ambient Orbs', description: 'Floating ambient light orb particles' },
  { id: 'celebration', label: 'Grand Celebration', description: 'Streamers and celebratory festive blast' },
  { id: 'trophy', label: 'Victory Trophy', description: 'Golden victory trophy with sparkle ring' },
  { id: 'balloons', label: 'Party Balloons', description: 'Ascending colorful party balloons' },
  { id: 'ribbon', label: 'Swirling Ribbons', description: 'Graceful swirling festive ribbons' },
  { id: 'laser', label: 'Neon Laser Grid', description: 'Futuristic glowing laser beams' },
  { id: 'snowfall', label: 'Crystal Snowfall', description: 'Gentle crystalline snow sparkles' },
  { id: 'cosmic', label: 'Cosmic Orbit', description: 'Galactic orbital rings movement' },
  { id: 'heartbeat', label: 'Rhythmic Pulse', description: 'Double-ring pulse heartbeat wave' },
  { id: 'diamonds', label: 'Diamond Shower', description: 'Shimmering crystal diamonds stream' },
  { id: 'sunburst', label: 'Solar Rays', description: 'Rotating golden sunburst rays' },
  { id: 'neon', label: 'Neon Glow Ring', description: 'Electric cyan-magenta neon glow' },
  { id: 'quantum', label: 'Quantum Spin', description: 'Atom-like swirling electron orbits' },
  { id: 'swirl', label: 'Vortex Swirl', description: 'Spiral vortex converging inward' },
  { id: 'fireflies', label: 'Golden Fireflies', description: 'Drifting warm ambient fireflies' },
  { id: 'shimmer', label: 'Light Shimmer', description: 'Diagonal high-speed shimmer beam' },
  { id: 'comet', label: 'Cosmic Comets', description: 'Streaking comet tails across display' },
  { id: 'supernova', label: 'Supernova Blast', description: 'High-energy cosmic explosion' },
  { id: 'shield', label: 'Security Shield', description: 'Lock-in security validation seal' },
];

interface SuccessAnimationProps {
  isOpen: boolean;
  style?: SuccessAnimationStyle;
  title?: string;
  subtitle?: string;
  onComplete: () => void;
  autoDismissMs?: number;
}

const CONFETTI_COLORS = ['#0284C7', '#7C3AED', '#059669', '#DB2777', '#F59E0B', '#EF4444', '#10B981', '#6366F1'];

/* Renderers for individual animation styles */
const Confetti: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 60 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -40, x: `${Math.random() * 100}vw`, opacity: 1, rotate: 0 }}
        animate={{ y: '110vh', rotate: Math.random() * 360 + 360, opacity: [1, 1, 0] }}
        transition={{ duration: 1.6 + Math.random() * 1.2, delay: Math.random() * 0.4, ease: 'easeIn' }}
        className="absolute top-0"
        style={{
          width: 10,
          height: i % 3 === 0 ? 10 : 14,
          backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          borderRadius: i % 3 === 0 ? '50%' : '2px',
        }}
      />
    ))}
  </div>
);

const Fireworks: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[30, 50, 70].map((cx, burstIdx) => (
      <div key={burstIdx} className="absolute" style={{ left: `${cx}%`, top: `${35 + (burstIdx % 2) * 20}%` }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const dist = 80 + Math.random() * 50;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.2 }}
              transition={{ duration: 1.2, delay: burstIdx * 0.3, ease: 'easeOut' }}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CONFETTI_COLORS[(burstIdx + i) % CONFETTI_COLORS.length] }}
            />
          );
        })}
      </div>
    ))}
  </div>
);

const Coins: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 24 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -40, x: `${Math.random() * 100}vw`, opacity: 1, rotateY: 0 }}
        animate={{ y: '110vh', rotateY: 720, opacity: [1, 1, 0] }}
        transition={{ duration: 1.8 + Math.random() * 1, delay: Math.random() * 0.5, ease: 'easeIn' }}
        className="absolute top-0 w-8 h-8 rounded-full bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-xs font-black text-amber-900 shadow-lg"
      >
        ₦
      </motion.div>
    ))}
  </div>
);

const Ripple: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[0, 0.3, 0.6].map((delay, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4.5, opacity: 0 }}
        transition={{ duration: 1.8, delay, repeat: 1, ease: 'easeOut' }}
        className="absolute w-28 h-28 rounded-full border-4 border-emerald-400"
      />
    ))}
  </div>
);

const Stars: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 32 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
        transition={{ duration: 1.3, delay: Math.random() * 1.2, repeat: 1 }}
        className="absolute rounded-full bg-amber-300 shadow-md shadow-amber-300/50"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: 8 + Math.random() * 8, height: 8 + Math.random() * 8 }}
      />
    ))}
  </div>
);

const Burst: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i / 24) * Math.PI * 2;
      return (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: Math.cos(angle) * 220, y: Math.sin(angle) * 220, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute w-2 h-8 rounded-full bg-emerald-400 origin-center"
          style={{ transform: `rotate(${angle}rad)` }}
        />
      );
    })}
  </div>
);

const Sparkle: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 30 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: '100vh', x: `${Math.random() * 100}vw`, opacity: 0, scale: 0.5 }}
        animate={{ y: '-10vh', opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: 'easeOut' }}
        className="absolute flex items-center justify-center text-emerald-300"
      >
        <Sparkles size={16 + Math.random() * 16} />
      </motion.div>
    ))}
  </div>
);

const Pulse: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <motion.div
      initial={{ scale: 0.8, opacity: 0.2 }}
      animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      className="w-96 h-96 rounded-full bg-emerald-500/30 blur-3xl"
    />
  </div>
);

const Particles: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 40 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: `${Math.random() * 100}vh`, x: `${Math.random() * 100}vw`, scale: 0.5, opacity: 0.3 }}
        animate={{ y: [null, '-=100px'], opacity: [0.3, 0.9, 0] }}
        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        className="absolute w-3 h-3 rounded-full bg-sky-400 blur-[1px]"
      />
    ))}
  </div>
);

const Celebration: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <Confetti />
    <Fireworks />
  </div>
);

const Balloons: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: '110vh', x: `${10 + (i * 6)}vw`, opacity: 0.9 }}
        animate={{ y: '-20vh', x: `calc(${10 + (i * 6)}vw + ${Math.sin(i) * 40}px)` }}
        transition={{ duration: 3 + Math.random() * 2, delay: i * 0.15, ease: 'easeInOut' }}
        className="absolute w-10 h-14 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
        style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length], borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }}
      >
        🎈
      </motion.div>
    ))}
  </div>
);

const Laser: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 0], opacity: [0, 0.8, 0] }}
        transition={{ duration: 1.4, delay: i * 0.15, repeat: 1 }}
        className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        style={{ transform: `rotate(${i * 22.5}deg)` }}
      />
    ))}
  </div>
);

const Snowfall: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 45 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 0.8 }}
        animate={{ y: '105vh', x: `calc(${Math.random() * 100}vw + ${Math.sin(i) * 30}px)` }}
        transition={{ duration: 2.5 + Math.random() * 2, delay: Math.random() * 1, ease: 'linear' }}
        className="absolute w-2 h-2 rounded-full bg-white shadow-sm shadow-white"
      />
    ))}
  </div>
);

const Cosmic: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[160, 240, 320].map((size, i) => (
      <motion.div
        key={i}
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3 + i * 2, repeat: Infinity, ease: 'linear' }}
        className="absolute rounded-full border border-dashed border-indigo-400/40"
        style={{ width: size, height: size }}
      >
        <div className="w-3 h-3 rounded-full bg-indigo-400 -top-1.5 left-1/2 absolute" />
      </motion.div>
    ))}
  </div>
);

const Heartbeat: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[1, 1.4, 1.8].map((scale, i) => (
      <motion.div
        key={i}
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: [1, scale, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
        className="absolute w-32 h-32 rounded-full border-2 border-rose-500"
      />
    ))}
  </div>
);

const Diamonds: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 25 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -30, x: `${Math.random() * 100}vw`, rotate: 45, opacity: 1 }}
        animate={{ y: '110vh', rotate: 405, opacity: [1, 1, 0] }}
        transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.5 }}
        className="absolute w-4 h-4 bg-sky-200/80 border border-sky-400 shadow"
      />
    ))}
  </div>
);

const Sunburst: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <motion.div
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      className="w-[500px] h-[500px] opacity-15"
      style={{
        background: 'conic-gradient(from 0deg, #F59E0B 0deg 15deg, transparent 15deg 30deg, #F59E0B 30deg 45deg, transparent 45deg 60deg, #F59E0B 60deg 75deg, transparent 75deg 90deg, #F59E0B 90deg 105deg, transparent 105deg 120deg, #F59E0B 120deg 135deg, transparent 135deg 150deg, #F59E0B 150deg 165deg, transparent 165deg 180deg, #F59E0B 180deg 195deg, transparent 195deg 210deg, #F59E0B 210deg 225deg, transparent 225deg 240deg, #F59E0B 240deg 255deg, transparent 255deg 270deg, #F59E0B 270deg 285deg, transparent 285deg 300deg, #F59E0B 300deg 315deg, transparent 315deg 330deg, #F59E0B 330deg 345deg, transparent 345deg 360deg)'
      }}
    />
  </div>
);

const Neon: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 0.8] }}
      transition={{ duration: 1 }}
      className="w-44 h-44 rounded-full border-4 border-cyan-400 shadow-[0_0_50px_#22d3ee]"
    />
  </div>
);

const Quantum: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[0, 60, 120].map((deg, i) => (
      <motion.div
        key={i}
        initial={{ rotate: deg }}
        animate={{ rotate: deg + 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        className="absolute w-56 h-20 rounded-[50%] border-2 border-emerald-400/60"
      />
    ))}
  </div>
);

const Swirl: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <motion.div
      initial={{ scale: 3, rotate: 720, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="w-48 h-48 rounded-full border-4 border-dashed border-teal-400"
    />
  </div>
);

const Fireflies: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 28 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ x: `${Math.random() * 100}vw`, y: `${Math.random() * 100}vh`, opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 0], x: `calc(${Math.random() * 100}vw + ${Math.sin(i) * 20}px)`, y: `calc(${Math.random() * 100}vh + ${Math.cos(i) * 20}px)` }}
        transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_#fcd34d]"
      />
    ))}
  </div>
);

const Shimmer: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      initial={{ x: '-100%', y: '-100%' }}
      animate={{ x: '100%', y: '100%' }}
      transition={{ duration: 1.2, repeat: 1, ease: 'easeInOut' }}
      className="w-[200%] h-32 bg-gradient-to-r from-transparent via-white/30 to-transparent -rotate-45"
    />
  </div>
);

const Comet: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        initial={{ x: '-20%', y: `${20 + i * 25}%`, opacity: 0 }}
        animate={{ x: '120%', y: `${40 + i * 25}%`, opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, delay: i * 0.3, ease: 'easeOut' }}
        className="absolute w-40 h-1 bg-gradient-to-r from-transparent via-sky-300 to-white rounded-full blur-[1px]"
      />
    ))}
  </div>
);

const Supernova: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: [0, 5, 8], opacity: [1, 0.8, 0] }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      className="w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 blur-xl"
    />
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
          {style === 'burst' && <Burst />}
          {style === 'sparkle' && <Sparkle />}
          {style === 'pulse' && <Pulse />}
          {style === 'particles' && <Particles />}
          {style === 'celebration' && <Celebration />}
          {style === 'balloons' && <Balloons />}
          {style === 'laser' && <Laser />}
          {style === 'snowfall' && <Snowfall />}
          {style === 'cosmic' && <Cosmic />}
          {style === 'heartbeat' && <Heartbeat />}
          {style === 'diamonds' && <Diamonds />}
          {style === 'sunburst' && <Sunburst />}
          {style === 'neon' && <Neon />}
          {style === 'quantum' && <Quantum />}
          {style === 'swirl' && <Swirl />}
          {style === 'fireflies' && <Fireflies />}
          {style === 'shimmer' && <Shimmer />}
          {style === 'comet' && <Comet />}
          {style === 'supernova' && <Supernova />}

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
                style === 'coins' || style === 'trophy' || style === 'badge' ? "bg-amber-400 shadow-amber-500/40" :
                style === 'heartbeat' ? "bg-rose-500 shadow-rose-500/40" :
                style === 'shield' ? "bg-indigo-600 shadow-indigo-600/40" :
                "bg-emerald-500 shadow-emerald-500/40"
              )}
            >
              {style === 'trophy' ? <Trophy size={52} className="text-amber-950" /> :
               style === 'badge' ? <Award size={52} className="text-amber-950" /> :
               style === 'shield' ? <ShieldCheck size={52} className="text-white" /> :
               <CheckCircle2 size={56} className="text-white" strokeWidth={2.5} />}
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-black text-white font-display mb-2">{title}</h2>
            {subtitle && <p className="text-slate-300 text-sm max-w-sm">{subtitle}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
