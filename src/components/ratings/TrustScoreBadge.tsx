import React from 'react';
import { ShieldCheck, Award, Star, Zap } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { TrustTier } from '@/src/types';

interface TrustScoreBadgeProps {
  trustScore?: number;
  tier?: TrustTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  trustScore = 75,
  tier,
  size = 'md',
  showLabel = true
}) => {
  // Derive tier if not explicitly provided
  let currentTier: TrustTier = tier || 'BRONZE';
  if (!tier) {
    if (trustScore >= 90) currentTier = 'DIAMOND';
    else if (trustScore >= 80) currentTier = 'PLATINUM';
    else if (trustScore >= 70) currentTier = 'GOLD';
    else if (trustScore >= 60) currentTier = 'SILVER';
  }

  const tierConfigs = {
    DIAMOND: {
      color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      badgeVariant: 'info' as const,
      icon: Zap,
      label: 'Diamond Tier'
    },
    PLATINUM: {
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      badgeVariant: 'info' as const,
      icon: Award,
      label: 'Platinum Tier'
    },
    GOLD: {
      color: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
      badgeVariant: 'warning' as const,
      icon: Star,
      label: 'Gold Tier'
    },
    SILVER: {
      color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/30',
      badgeVariant: 'outline' as const,
      icon: ShieldCheck,
      label: 'Silver Tier'
    },
    BRONZE: {
      color: 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/30',
      badgeVariant: 'outline' as const,
      icon: ShieldCheck,
      label: 'Bronze Tier'
    }
  };

  const config = tierConfigs[currentTier];
  const IconComponent = config.icon;

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold ${config.color}`}>
        <IconComponent size={12} className="shrink-0" />
        <span>{trustScore} PTS</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`p-4 rounded-2xl border space-y-2 ${config.color}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">Platform Trust Score</span>
          <Badge variant={config.badgeVariant} className="text-[10px] uppercase font-mono">
            {config.label}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-display tracking-tight">{trustScore}</span>
          <span className="text-xs opacity-70">/ 100 PTS</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-current transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold ${config.color}`}>
      <IconComponent size={14} className="shrink-0" />
      <div className="flex items-center gap-1">
        <span>Trust Score:</span>
        <span className="font-mono">{trustScore}/100</span>
      </div>
      {showLabel && (
        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 ml-0.5">
          {currentTier}
        </span>
      )}
    </div>
  );
};
