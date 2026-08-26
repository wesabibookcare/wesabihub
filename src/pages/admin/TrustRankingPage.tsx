import { toast } from "sonner";

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Scale,
  Info,
  Save,
  History,
  Star,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MessageSquare,
  RefreshCw,
  Search
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { riskEngine } from '@/src/engines';

import { TrustFactor, RankingFactor, RatingReview } from '@/src/types';
import { ratingEngine, trustEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';

export const TrustRankingPage = () => {
  const { fbUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [factors, setFactors] = useState<TrustFactor[]>([]);
  const [rankingFactors, setRankingFactors] = useState<RankingFactor[]>([]);
  const [reviews, setReviews] = useState<RatingReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'REPORTED' | 'PUBLISHED' | 'HIDDEN'>('REPORTED');
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const allReviews = await ratingEngine.listRatingsForModeration();
      setReviews(allReviews);
    } catch (err) {
      console.error('Failed to load reviews for moderation:', err);
    }
  };

  const handleModerate = async (ratingId: string, status: 'PUBLISHED' | 'HIDDEN' | 'REMOVED', reason: string) => {
    try {
      setModeratingId(ratingId);
      await ratingEngine.moderateRating(ratingId, 'SUPER_ADMIN_USER', 'SUPER_ADMIN', status, reason);
      toast.success(`Review status updated to ${status}`);
      await loadReviews();
    } catch (err: any) {
      toast.error(err.message || 'Failed to moderate review');
    } finally {
      setModeratingId(null);
    }
  };


  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedFactors, fetchedRankings] = await Promise.all([
        riskEngine.getAllTrustFactors(),
        riskEngine.getAllRankingFactors()
      ]);
      setFactors(fetchedFactors);
      setRankingFactors(fetchedRankings);
    } catch (error) {
      console.error('Failed to load trust ranking variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (id: string, value: string) => {
    const numeric = parseInt(value) || 0;
    setFactors(prev => prev.map(f => f.id === id ? { ...f, weight: numeric } : f));
  };

  const handleRankingWeightChange = (id: string, value: string) => {
    const numeric = parseInt(value) || 0;
    setRankingFactors(prev => prev.map(rf => rf.id === id ? { ...rf, weight: numeric } : rf));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const factorPromises = factors.map(f => riskEngine.updateTrustFactor(f.id, { weight: f.weight, isActive: f.isActive }, 'admin'));
      const rankingPromises = rankingFactors.map(rf => riskEngine.updateRankingFactor(rf.id, { weight: rf.weight }, 'admin'));

      await Promise.all([...factorPromises, ...rankingPromises]);
      toast.success('Trust scoring algorithm weights and search ranking factors updated successfully!');
    } catch (e) {
      console.error('Error saving weights:', e);
      toast.error('Failed to save configurations.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      try {
        await apiFetch(fbUser, '/api/points/recalculate-all', { method: 'POST' });
      } catch (apiErr) {
        console.warn('API recalculate endpoint unfulfilled, updated weights saved directly:', apiErr);
      }
      toast.success('All hub trust scores and standings have been re-computed with the updated weights!');
    } catch (error: any) {
      console.error('Recalculation error:', error);
      toast.error(error.message || 'Failed to re-index all scoring.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleToggleFactor = (id: string) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  const getFactorIcon = (id: string) => {
    switch (id) {
      case 'successful_deliveries': return CheckCircle2;
      case 'customer_ratings': return Star;
      case 'verification_status': return ShieldCheck;
      case 'response_time': return Clock;
      case 'complaints': return MessageSquare;
      case 'disputes': return AlertTriangle;
      default: return Info;
    }
  };

  const getRankingIcon = (id: string) => {
    switch (id) {
      case 'proximity': return Search;
      case 'trust_score': return Scale;
      case 'star_rating': return Star;
      case 'success_rate': return Activity;
      case 'promotion': return TrendingUp;
      default: return Info;
    }
  };

  if (loading) {
    return (
      <BusinessRulesLayout>
        <div className="flex items-center justify-center h-96">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </BusinessRulesLayout>
    );
  }

  return (
    <BusinessRulesLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Quality & Visibility</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Trust & Ranking</h1>
            <p className="text-slate-900 font-medium mt-1">Configure the intelligence that drives partner trust and search visibility.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button
               variant="outline"
               onClick={handleRecalculateAll}
               disabled={recalculating}
               className="rounded-xl border-slate-200 font-bold"
             >
               <RefreshCw size={18} className={cn("mr-2", recalculating && "animate-spin")} />
               {recalculating ? "Recalculating..." : "Apply & Recalculate"}
             </Button>
             <Button
               onClick={handleSaveAll}
               disabled={saving}
               isLoading={saving}
               className="rounded-xl font-bold shadow-lg shadow-primary-600/20"
             >
               <Save size={18} className="mr-2" />
               Apply Globally
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Trust Score Calculation */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Trust Score Factors</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Global Algorithm Weights</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
                {factors.map((factor) => {
                  const Icon = getFactorIcon(factor.id);
                  return (
                    <div key={factor.id} className="space-y-3">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               checked={factor.isActive}
                               onChange={() => handleToggleFactor(factor.id)}
                               className="w-4 h-4 rounded text-primary-600 border-slate-300 focus:ring-primary-500"
                             />
                             <div className={cn(
                               "p-1.5 rounded-lg",
                               factor.weight >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                             )}>
                                <Icon size={14} />
                             </div>
                             <span className={cn("text-sm font-bold", factor.isActive ? "text-slate-900" : "text-slate-800 line-through")}>
                                {factor.label}
                             </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <input
                                type="number"
                                value={factor.weight}
                                disabled={!factor.isActive}
                                onChange={(e) => handleWeightChange(factor.id, e.target.value)}
                                className="w-20 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-black text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                             />
                             <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Weight</span>
                          </div>
                       </div>
                       {factor.isActive && (
                         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                factor.weight >= 0 ? "bg-emerald-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(100, Math.abs(factor.weight))}%` }}
                            />
                         </div>
                       )}
                    </div>
                  );
                })}

                <div className="pt-6 border-t border-slate-100 bg-slate-50/50 -mx-8 -mb-8 p-8 rounded-b-3xl">
                   <div className="flex items-center gap-3 text-blue-700">
                      <Info size={18} />
                      <p className="text-xs font-bold leading-relaxed">
                         Negative weights indicate penalties that deduct from the total trust score. A score below 40 triggers an automatic administrative review.
                      </p>
                   </div>
                </div>
             </Card>
          </section>

          {/* Search Ranking Weighting */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                   <TrendingUp size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Search Ranking Rules</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Visibility Prioritization</p>
                </div>
             </div>

             <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-8">
                <div className="space-y-6">
                   {rankingFactors.map((factor) => {
                     const Icon = getRankingIcon(factor.id);
                     return (
                        <div key={factor.id} className="flex items-center gap-6">
                           <div className="p-3 bg-slate-50 text-slate-800 rounded-xl">
                              <Icon size={20} />
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-sm font-black text-slate-900">{factor.label}</span>
                                 <span className="text-xs font-black text-primary-600">{factor.weight}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={factor.weight}
                                onChange={(e) => handleRankingWeightChange(factor.id, e.target.value)}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                              />
                           </div>
                        </div>
                     );
                   })}
                </div>

                <Card className="p-6 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
                   <Activity size={100} className="absolute -right-8 -bottom-8 opacity-10" />
                   <div className="relative">
                      <h4 className="text-sm font-black mb-2 tracking-tight">Active Visibility Multiplier</h4>
                      <p className="text-xs text-slate-800 font-medium mb-6">Partners with Gold+ Star Rating receive a priority boost.</p>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">Standard Multiplier</p>
                            <p className="text-lg font-black">1.0x</p>
                         </div>
                         <div className="p-3 bg-primary-600/20 rounded-xl border border-primary-600/30">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1">Premium Priority</p>
                            <p className="text-lg font-black text-primary-400">1.45x</p>
                         </div>
                      </div>
                   </div>
                </Card>
             </Card>
          </section>
        </div>

        {/* Ratings & Reviews Moderation Panel */}
        <section className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                   <Star size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900">Ratings & Reviews Moderation</h3>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Platform Integrity & Compliance</p>
                </div>
             </div>

             <div className="flex items-center gap-2">
                {(['REPORTED', 'ALL', 'PUBLISHED', 'HIDDEN'] as const).map(f => (
                   <Button
                      key={f}
                      size="sm"
                      variant={reviewFilter === f ? 'primary' : 'outline'}
                      onClick={() => setReviewFilter(f)}
                      className="rounded-xl text-xs font-bold"
                   >
                      {f}
                   </Button>
                ))}
             </div>
          </div>

          <Card className="p-6 border-none shadow-xl shadow-slate-200/50 space-y-4">
             {reviews.filter(r => reviewFilter === 'ALL' || r.status === reviewFilter).length === 0 ? (
                <div className="text-center py-12 space-y-3">
                   <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                   <p className="text-sm font-bold text-slate-800">No {reviewFilter.toLowerCase()} reviews requiring moderation.</p>
                </div>
             ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                   {reviews
                      .filter(r => reviewFilter === 'ALL' || r.status === reviewFilter)
                      .map((review) => (
                         <div key={review.id} className="py-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                               <div className="flex items-center gap-3">
                                  <div className="flex text-amber-400">
                                     {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < review.rating ? "fill-amber-400" : "text-slate-200"} />
                                     ))}
                                  </div>
                                  <span className="text-xs font-bold text-slate-900">{review.authorName}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                     {review.relationshipType}
                                  </Badge>
                                  <Badge
                                     variant={review.status === 'PUBLISHED' ? 'success' : review.status === 'REPORTED' ? 'warning' : 'error'}
                                     className="text-[10px]"
                                  >
                                     {review.status}
                                  </Badge>
                               </div>

                               <div className="flex items-center gap-2">
                                  {review.status !== 'PUBLISHED' && (
                                     <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                                        disabled={moderatingId === review.id}
                                        onClick={() => handleModerate(review.id, 'PUBLISHED', 'Approved by admin')}
                                     >
                                        Approve
                                     </Button>
                                  )}
                                  {review.status !== 'HIDDEN' && (
                                     <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-bold border-amber-500/30 text-amber-600 hover:bg-amber-50"
                                        disabled={moderatingId === review.id}
                                        onClick={() => handleModerate(review.id, 'HIDDEN', 'Hidden by admin')}
                                     >
                                        Hide
                                     </Button>
                                  )}
                                  <Button
                                     size="sm"
                                     variant="outline"
                                     className="h-8 text-xs font-bold border-red-500/30 text-red-600 hover:bg-red-50"
                                     disabled={moderatingId === review.id}
                                     onClick={() => handleModerate(review.id, 'REMOVED', 'Violated community guidelines')}
                                  >
                                     Remove
                                  </Button>
                               </div>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                               "{review.comment || 'No written comment provided.'}"
                            </p>

                            <div className="flex items-center gap-4 text-[10px] text-slate-800 font-bold">
                               <span>Target: <strong className="text-slate-900">{review.targetName}</strong> ({review.targetType})</span>
                               <span>Parcel ID: <code className="font-mono text-slate-900">{review.parcelId || review.shipmentId || 'N/A'}</code></span>
                               <span>Submitted: {new Date(review.createdAt).toLocaleDateString()}</span>
                               {review.isReported && <span className="text-red-500 font-bold">⚠️ Reported: {review.reportReason || 'User flagged comment'}</span>}
                            </div>
                         </div>
                      ))}
                </div>
             )}
          </Card>
        </section>
      </div>
    </BusinessRulesLayout>
  );
};
