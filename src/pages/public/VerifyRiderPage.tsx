import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';


import { Shield, ShieldCheck, ShieldAlert, Award, Calendar, CheckCircle2, User, Loader2, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { userRepository } from '@/src/services/db/UserRepository';
import { Button } from '../../components/ui/Button';

export const VerifyRiderPage = () => {
  const { riderId } = useParams<{ riderId: string }>();
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchRider = async () => {
      if (!riderId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const riderUser = await userRepository.getById(riderId as string);
        if (riderUser) {
          setRider(riderUser);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load rider details:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRider();
  }, [riderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
        <p className="font-bold text-slate-800">Retrieving WeSabi Trust Ledger...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6">
        <Card className="p-8 max-w-md text-center space-y-6 shadow-xl border-slate-200">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-100">
            <ShieldAlert size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Rider ID Not Found</h3>
            <p className="text-sm text-slate-900 leading-relaxed font-medium">
              The credentials or scanned QR link do not match an active record on the WeSabiDispatch Trust Network. Do not hand over high-value packages.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/" className="inline-flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Return to Homepage
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const isActive = rider.status === 'ACTIVE' || rider.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-12 px-6">

      {/* Content wrapper */}
      <div className="max-w-md w-full mx-auto space-y-6">

        {/* Top brand header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-3">
            WS
          </div>
          <h2 className="font-black text-xl text-slate-950 dark:text-white">WeSabi Trust Ledger</h2>
          <p className="text-xs text-slate-800 font-bold uppercase tracking-wider mt-1">Direct Field-Verification Gateway</p>
        </div>

        {/* Verification Status badge */}
        <Card className="p-6 border-slate-200 shadow-xl space-y-6 relative overflow-hidden bg-white dark:bg-slate-900">
          {/* Status glow backdrops */}
          <div className={`absolute top-0 right-0 w-32 h-full -mr-16 rotate-12 -z-0 opacity-10 ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />

          {/* Verification indicator */}
          <div className="flex flex-col items-center text-center space-y-3 relative z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-rose-50 text-rose-600 border-rose-300'}`}>
              {isActive ? <ShieldCheck size={36} /> : <ShieldAlert size={36} />}
            </div>
            <div>
              <h3 className="font-black text-2xl text-slate-900 dark:text-white">
                {isActive ? 'VERIFIED ACTIVE' : 'UNAUTHORIZED ACCESS'}
              </h3>
              <p className="text-xs text-slate-800 font-bold uppercase tracking-widest mt-1">
                Security Ledger Status
              </p>
            </div>
          </div>

          {/* Rider Profile Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-900 shrink-0 border border-slate-300 dark:border-slate-600">
              <User size={28} />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                {rider.displayName}
              </h4>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wide">
                Rider ID: <span className="font-mono text-slate-900 dark:text-slate-300">{rider.dispatchId || 'WSD-PENDING'}</span>
              </p>
            </div>
          </div>

          {/* Verification Details List */}
          <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-5 relative z-10">

            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-800 font-bold uppercase tracking-wider">Trust Level Tier</span>
              <span className="font-black text-primary-600">{rider.trustLevel || 'TIER_1'}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-800 font-bold uppercase tracking-wider">Trust Score Status</span>
              <Badge className="bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 text-[10px] rounded-lg">
                {rider.trustScore || 100} PTS
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-800 font-bold uppercase tracking-wider">Academy Training</span>
              <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <CheckCircle2 size={14} className="text-emerald-500" /> Completed
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-800 font-bold uppercase tracking-wider">Partner Agreement</span>
              <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <CheckCircle2 size={14} className="text-emerald-500" /> Signed (v2.4)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-800 font-bold uppercase tracking-wider">Vehicle Registered</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {rider.vehicleType || 'Motorcycle'} ({rider.vehicleReg || 'N/A'})
              </span>
            </div>
          </div>

        </Card>

        {/* Security Warning Message */}
        <div className="text-center space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Zero Trust Security</p>
          <p className="text-[10px] text-slate-900 font-medium leading-relaxed px-4">
            Only hand over packages if the rider name matches their official physical ID card and transit scanner confirmation matches this terminal.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-xs text-slate-800 font-semibold">© 2026 WeSabiHub Trust Ledger. All rights reserved.</p>
      </div>

    </div>
  );
};
