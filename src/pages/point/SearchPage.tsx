import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Package,
  User,
  Calendar,
  ChevronRight,
  X,
  History,
  TrendingUp,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine, parcelEngine, userEngine } from '@/src/engines';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  type: 'Parcel' | 'Staff';
  status: string;
  subtitle: string;
  lastUpdate: string;
}

const RECENT_SEARCHES_KEY = 'point_recent_searches';

export const SearchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = async (searchTerm?: string) => {
    const q = (searchTerm ?? query).trim();
    if (!q || !user) return;

    setQuery(q);
    setIsSearching(true);
    setHasSearched(true);
    try {
      let hubId = (user as any).hubId;
      if (!hubId) {
        const hubs = await centreEngine.getHubsByOwner(user.uid);
        if (hubs.length > 0) hubId = hubs[0].id;
      }

      const found: SearchResult[] = [];

      // Look up a parcel by tracking number or internal ID
      let parcel = await parcelEngine.getParcelByTracking(q).catch(() => null);
      if (!parcel) parcel = await parcelEngine.getParcel(q).catch(() => null);
      if (parcel) {
        found.push({
          id: parcel.trackingNumber || parcel.id,
          type: 'Parcel',
          status: parcel.status,
          subtitle: parcel.recipientInfo?.name || 'Unknown recipient',
          lastUpdate: parcel.updatedAt ? new Date(parcel.updatedAt).toLocaleString() : ''
        });
      }

      // Look up hub staff by name or email
      if (hubId) {
        const staff = await userEngine.getUsersByHub(hubId).catch(() => []);
        const matches = staff.filter(s =>
          s.displayName?.toLowerCase().includes(q.toLowerCase()) ||
          s.email?.toLowerCase().includes(q.toLowerCase())
        );
        matches.forEach(s => {
          found.push({
            id: s.uid,
            type: 'Staff',
            status: s.status || 'ACTIVE',
            subtitle: s.role?.replace('_', ' ') || 'Staff',
            lastUpdate: s.displayName || s.email || ''
          });
        });
      }

      setResults(found);
      if (found.length > 0) saveRecentSearch(q);
    } catch (err) {
      console.error('Search failed:', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (res: SearchResult) => {
    if (res.type === 'Parcel') {
      navigate(`/point/parcels/release?tracking=${encodeURIComponent(res.id)}`);
    } else {
      navigate('/point/employees');
    }
  };

  return (
    <PointLayout>
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        <div className="space-y-4">
          <h1 className="text-3xl font-black dark:text-white font-display">Global Hub Search</h1>
          <p className="text-slate-900">Find parcels or staff at your hub by tracking number, name, or email.</p>

          <div className="relative group">
             <div className="absolute inset-0 bg-primary-600/10 blur-2xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
             <div className="relative flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-2 rounded-3xl group-focus-within:border-primary-500 transition-all shadow-xl shadow-slate-200/20 dark:shadow-none">
                <Search className={cn("ml-4 transition-colors", query ? "text-primary-600" : "text-slate-800")} />
                <input
                  type="text"
                  placeholder="Type a tracking number, staff name, or email..."
                  className="flex-1 h-14 bg-transparent outline-none font-bold dark:text-white text-lg placeholder:text-slate-800"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {query && (
                  <button onClick={() => { setQuery(''); setHasSearched(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-800">
                     <X size={20} />
                  </button>
                )}
                <Button onClick={() => handleSearch()} disabled={isSearching || !query.trim()} className="h-14 px-8 rounded-2xl flex items-center gap-2">
                   {isSearching ? <Loader2 className="animate-spin" size={18} /> : <>Search <TrendingUp size={18} /></>}
                </Button>
             </div>
          </div>
        </div>

        {!hasSearched ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4">
             <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                   <History size={14} /> Recent Searches
                </h3>
                {recentSearches.length === 0 ? (
                  <p className="text-xs text-slate-500">Your recent searches will appear here.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                     {recentSearches.map((s, idx) => (
                       <button
                         key={idx}
                         type="button"
                         onClick={() => handleSearch(s)}
                       >
                         <Badge
                           variant="outline"
                           className="h-9 px-4 rounded-xl cursor-pointer hover:border-primary-500 hover:text-primary-600 transition-all bg-white dark:bg-slate-900"
                         >
                           {s}
                         </Badge>
                       </button>
                     ))}
                  </div>
                )}
             </div>

             <div className="md:col-span-2 space-y-6">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck size={14} /> Search Tips
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {[
                     { title: 'Tracking Numbers', desc: 'Enter the full tracking number to find a parcel instantly.' },
                     { title: 'Staff Names', desc: 'Search by first or last name to find a team member.' },
                     { title: 'Staff Email', desc: 'You can also search by a staff member\'s registered email.' },
                     { title: 'Internal Parcel ID', desc: 'The system ID works too if you don\'t have the tracking number.' },
                   ].map((tip, i) => (
                     <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
                        <p className="font-bold text-sm dark:text-white">{tip.title}</p>
                        <p className="text-xs text-slate-900">{tip.desc}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white font-display">Results for "{query}"</h2>
             </div>

             {isSearching ? (
               <div className="py-16 text-center">
                  <Loader2 className="animate-spin mx-auto text-primary-600" size={32} />
               </div>
             ) : results.length === 0 ? (
               <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                  <Search className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="font-bold dark:text-white">No results found</p>
                  <p className="text-sm text-slate-500 mt-1">Check the spelling or try a different tracking number, name, or email.</p>
               </Card>
             ) : (
               <div className="space-y-4">
                  {results.map((res, i) => (
                    <Card
                      key={i}
                      onClick={() => handleResultClick(res)}
                      className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group"
                    >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                             <div className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                               res.type === 'Parcel' ? "bg-primary-50 text-primary-600" : "bg-indigo-50 text-indigo-600"
                             )}>
                                {res.type === 'Parcel' ? <Package size={24} /> : <User size={24} />}
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                   <h4 className="font-bold text-lg dark:text-white">{res.id}</h4>
                                   <Badge variant="outline" className="h-6 rounded-lg text-[10px] font-bold uppercase">{res.type}</Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-900">
                                   <span className="flex items-center gap-1"><User size={14} /> {res.subtitle}</span>
                                   {res.lastUpdate && (
                                     <>
                                       <span className="w-1 h-1 rounded-full bg-slate-300" />
                                       <span className="flex items-center gap-1"><Calendar size={14} /> {res.lastUpdate}</span>
                                     </>
                                   )}
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <Badge variant="outline">{res.status.replace(/_/g, ' ')}</Badge>
                             <ChevronRight className="text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
             )}
          </motion.div>
        )}
      </div>
    </PointLayout>
  );
};
