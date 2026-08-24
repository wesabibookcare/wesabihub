import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ratingEngine } from '@/src/engines/RatingEngine';
import { RatingTargetType, RatingRelationshipType } from '@/src/types';
import { toast } from 'sonner';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetId: string;
  targetName: string;
  targetType: RatingTargetType;
  relationshipType: RatingRelationshipType;
  parcelId: string;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  authorId,
  authorName,
  authorRole,
  targetId,
  targetName,
  targetType,
  relationshipType,
  parcelId,
  onSuccess
}) => {
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingEligibility, setCheckingEligibility] = useState<boolean>(true);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [ineligibilityReason, setIneligibilityReason] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && authorId && parcelId) {
      verifyEligibility();
    }
  }, [isOpen, authorId, parcelId, targetId]);

  const verifyEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const res = await ratingEngine.checkEligibility({
        authorId,
        targetId,
        targetType,
        parcelId
      });
      setIsEligible(res.isEligible);
      if (!res.isEligible) {
        setIneligibilityReason(res.reason || 'Not eligible to submit rating.');
      }
    } catch (err: any) {
      setIsEligible(false);
      setIneligibilityReason(err.message || 'Failed to verify rating eligibility.');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) {
      toast.error(ineligibilityReason);
      return;
    }

    try {
      setLoading(true);
      await ratingEngine.submitRating({
        authorId,
        authorName,
        authorRole,
        targetId,
        targetType,
        relationshipType,
        ratingValue,
        reviewText,
        parcelId
      });

      toast.success('Rating & review submitted successfully!');
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Rating submission failed:', err);
      toast.error(err.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-[10px] uppercase font-mono">
              Verifiable Service Rating
            </Badge>
            <span className="text-xs text-slate-400 font-mono">ID: {parcelId}</span>
          </div>
          <h2 className="text-xl font-bold dark:text-white font-display">
            Rate Experience with {targetName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your review updates the platform Trust Score for {targetName} ({targetType}).
          </p>
        </div>

        {checkingEligibility ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Verifying transaction eligibility...</p>
          </div>
        ) : !isEligible ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Rating Not Available</p>
                <p>{ineligibilityReason}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={onClose}>
              Close Window
            </Button>
          </div>
        ) : submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rating Submitted!</h3>
            <p className="text-xs text-slate-500">Thank you for helping keep OmorfiHub transparent and reliable.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating Selection */}
            <div className="space-y-2 text-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-4">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Tap to Select Rating
              </span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverValue !== null ? hoverValue : ratingValue) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverValue(star)}
                      onMouseLeave={() => setHoverValue(null)}
                      onClick={() => setRatingValue(star)}
                      className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={active ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-primary-600 font-mono">
                {ratingValue === 5 && "★★★★★ Excellent (5/5)"}
                {ratingValue === 4 && "★★★★☆ Good (4/5)"}
                {ratingValue === 3 && "★★★☆☆ Satisfactory (3/5)"}
                {ratingValue === 2 && "★★☆☆☆ Below Average (2/5)"}
                {ratingValue === 1 && "★☆☆☆☆ Poor Experience (1/5)"}
              </p>
            </div>

            {/* Optional Review Text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Written Review (Optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience regarding speed, parcel condition, hub hospitality, or rider professionalism..."
                rows={3}
                maxLength={500}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 text-right">{reviewText.length}/500 chars</p>
            </div>

            {/* Anti-abuse disclaimer */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>All ratings are verified against completed parcel audit logs to prevent abuse.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" className="w-1/2" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="w-1/2 font-bold" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Verified Rating'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
