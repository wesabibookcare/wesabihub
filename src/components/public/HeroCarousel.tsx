import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const SLIDES = [
  { src: '/assets/hero/customer.jpg', caption: 'Customers sending & receiving parcels with ease' },
  { src: '/assets/hero/merchant.jpg', caption: 'Merchants preparing business shipments' },
  { src: '/assets/hero/hub-owner.jpg', caption: 'Hub owners running secure local parcel points' },
  { src: '/assets/hero/hub-staff.jpg', caption: 'Hub staff managing drop-offs and pickups' },
  { src: '/assets/hero/dispatch-rider.jpg', caption: 'Dispatch riders delivering to destinations' },
];

interface HeroCarouselProps {
  intervalMs?: number;
  className?: string;
  showDots?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ intervalMs = 4500, className, showDots = true }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <div className={className ? className : "absolute inset-0 overflow-hidden"}>
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
          className="absolute inset-0 bg-slate-950"
        >
          <img
            src={SLIDES[index].src}
            alt={SLIDES[index].caption}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient so foreground text stays readable over any photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      {showDots && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
