import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Flag, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TrustScoreBadge } from './TrustScoreBadge';
import { ratingEngine } from '@/src/engines/RatingEngine';
import { trustEngine } from '@/src/engines/TrustEngine';
import { RatingReview, RatingTargetType, TrustScoreBreakdown } from '@/src/types';
import { toast } from 'sonner';

interface RatingSummaryCardProps {
  targetId: string;
  targetType: RatingTargetType;
  targetName?: string;
  currentUserId?: string;
  showReviewsList?: boolean;
}

export const RatingSummaryCard: React.FC<RatingSummaryCardProps> = ({
  targetId,
  targetType,
  targetName = 'Partner Entity',
  currentUserId,
  showReviewsList = true
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<any>(null);
  const [trustBreakdown, setTrustBreakdown] = useState<TrustScoreBreakdown | null>(null);
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');

  useEffect(() => {
    if (targetId) {
      loadRatingData();
    }
  }, [targetId, targetType]);

  const loadRatingData = async () => {
    try {
      setLoading(true);
      const [sum, trust, revs] = await Promise.all([
        ratingEngine.getSummaryForTarget(targetId),
        trustEngine.getTrustScoreBreakdown(targetId, targetType),
        ratingEngine.getRatingsForTarget(targetId, 20)
      ]);

      setSummary(sum);
      setTrustBreakdown(trust);
      setReviews(revs);
    } catch (err) {
      console.error('Failed to load rating summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (ratingId: string) => {
    if (!reportReason.trim()) {
      toast.error('Please specify a reason for reporting this review.');
      return;
    }

    try {
      await ratingEngine.reportRating(ratingId, currentUserId || 'ANONYMOUS', reportReason);
      toast.success('Review reported to platform moderation for review.');
      setReportingId(null);
      setReportReason('');
      loadRatingData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to report review.');
    }
  };

  if (loading) {
    return (
      <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
        <div className="h-6 w-3/8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-20 w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
      </Card>
    );
  }

  const avgRating = summary?.averageRating || 5.0;
  const totalReviews = summary?.totalReviews || 0;
  const starPercentages = summary?.starPercentages || { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
      {/* Header & Trust Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold dark:text-white font-display">
              Ratings & Trust Profile
            </h3>
            <Badge variant="info" className="text-[10px] uppercase font-mono">
              Verifiable
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Calculated from completed platform interactions and customer reviews.
          </p>
        </div>

        {trustBreakdown && (
          <TrustScoreBadge
            trustScore={trustBreakdown.trustScore}
            tier={trustBreakdown.tier}
            size="md"
          />
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left score summary */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
          <span className="text-5xl font-black font-display text-slate-900 dark:text-white">
            {avgRating}
          </span>
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                fill={s <= Math.round(avgRating) ? 'currentColor' : 'none'}
                className={s <= Math.round(avgRating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {totalReviews} Verified Review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Right Star Breakdown Bars */}
        <div className="md:col-span-7 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = starPercentages[star] || 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold font-mono text-slate-600 dark:text-slate-400 shrink-0">
                  {star} Star
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-slate-500 text-[11px]">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Reviews Stream */}
      {showReviewsList && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-sm font-bold dark:text-white font-display flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" /> Customer & Partner Feedback Stream
            </h4>
            <span className="text-xs text-slate-400 font-mono">{reviews.length} Recent</span>
          </div>

          {reviews.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-slate-400">
              <ShieldCheck size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No public reviews written yet for {targetName}.</p>
              <p className="text-[11px]">Completed transaction participants can write verified reviews.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {rev.authorName || 'Verified Partner'}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {rev.authorRole || 'USER'}
                      </Badge>
                      <Badge variant="success" className="text-[9px] uppercase flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Verified Order
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          fill={s <= rev.ratingValue ? 'currentColor' : 'none'}
                          className={s <= rev.ratingValue ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.reviewText && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{rev.reviewText}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>Interaction: {rev.relationshipType || 'PLATFORM_SERVICE'} • {new Date(rev.createdAt).toLocaleDateString()}</span>
                    {reportingId === rev.id ? (
                      <div className="flex items-center gap-1.5 w-full max-w-xs mt-2">
                        <input
                          type="text"
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          placeholder="Reason (spam, offensive, fake)..."
                          className="text-[10px] p-1.5 rounded border dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full"
                        />
                        <button
                          onClick={() => handleReportSubmit(rev.id)}
                          className="text-red-600 font-bold hover:underline shrink-0"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => setReportingId(null)}
                          className="text-slate-400 hover:underline shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReportingId(rev.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Flag size={10} /> Report Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
