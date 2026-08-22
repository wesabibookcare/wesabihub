import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Search,
  Star,
  Navigation,
  Phone,
  Clock,
  Building2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine } from '@/src/engines';
import { userRepository } from '@/src/services/db/UserRepository';
import { HubCenter } from '@/src/types';
import { toast } from 'sonner';

export const SavedHubsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'nearest' | 'favorites' | 'top' | 'open'>('nearest');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(user?.preferences?.favoriteHubIds || []);

  useEffect(() => {
    setLoading(true);
    centreEngine.listNearbyHubs(0, 0, 9999)
      .then(list => setHubs(list.filter(h => h.status === 'ACTIVE')))
      .catch(() => toast.error('Failed to load hub points'))
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = async (hubId: string) => {
    if (!user) return;
    const next = favoriteIds.includes(hubId) ? favoriteIds.filter(id => id !== hubId) : [...favoriteIds, hubId];
    setFavoriteIds(next);
    try {
      await userRepository.update(user.uid, { preferences: { ...(user.preferences || {}), favoriteHubIds: next } });
    } catch {
      toast.error('Failed to save favorite');
      setFavoriteIds(favoriteIds);
    }
  };

  const isOpenNow = (operatingHours: string) => {
    // Best-effort check: treat "24" or "24/7" hours as always open, otherwise assume open during the day.
    if (!operatingHours) return true;
    return operatingHours.toLowerCase().includes('24');
  };

  const filteredHubs = useMemo(() => {
    let list = hubs.filter(h =>
      !searchQuery ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (quickFilter === 'favorites') list = list.filter(h => favoriteIds.includes(h.id));
    if (quickFilter === 'top') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (quickFilter === 'open') list = list.filter(h => isOpenNow(h.operatingHours));

    return list;
  }, [hubs, searchQuery, quickFilter, favoriteIds]);

  const handleViewDetails = (hub: HubCenter) => {
    const coords = hub.location || hub.gps;
    if (coords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hub.address)}`, '_blank');
    }
  };

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">WeSabiHub Points</h1>
            <p className="text-slate-800">Find and manage your preferred pick-up and drop-off locations.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex items-center gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 w-4 h-4" />
                 <Input
                   placeholder="Search hub by name or city..."
                   className="pl-10 h-11"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {([
                { id: 'nearest', label: 'Nearest' },
                { id: 'favorites', label: 'Favorites' },
                { id: 'top', label: 'Top Rated' },
                { id: 'open', label: 'Open Now' },
              ] as const).map(f => (
                <Badge
                  key={f.id}
                  variant={quickFilter === f.id ? 'info' : 'outline'}
                  className={cn("h-8 px-4 rounded-full cursor-pointer", quickFilter !== f.id && "hover:bg-slate-100")}
                  onClick={() => setQuickFilter(f.id)}
                >
                  {f.label}
                </Badge>
              ))}
           </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
            <p className="text-sm text-slate-800">Loading hub points...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
             {filteredHubs.length === 0 ? (
               <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                 {quickFilter === 'favorites' ? "You haven't saved any hubs as favorites yet. Tap the star on a hub to save it here." : "No hub points found."}
               </div>
             ) : filteredHubs.map((hub) => (
               <Card key={hub.id} className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 group hover:border-primary-500 transition-all">
                  <div className="h-32 bg-gradient-to-br from-primary-50 to-slate-100 dark:from-primary-950/40 dark:to-slate-900 relative overflow-hidden flex items-center justify-center">
                     <Building2 size={40} className="text-primary-300 dark:text-primary-800" />
                     <button
                       onClick={() => toggleFavorite(hub.id)}
                       className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-lg text-amber-400 hover:scale-110 transition-transform z-10"
                     >
                        <Star size={16} className={cn(favoriteIds.includes(hub.id) ? "fill-current" : "")} />
                     </button>
                     <Badge variant={isOpenNow(hub.operatingHours) ? 'success' : 'error'} className="absolute bottom-4 left-4 z-10">
                        {isOpenNow(hub.operatingHours) ? 'Open' : 'Closed'}
                     </Badge>
                  </div>
                  <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <h3 className="text-lg font-bold dark:text-white group-hover:text-primary-600 transition-colors">{hub.name}</h3>
                        <p className="text-xs text-slate-800 flex items-center gap-1">
                           <MapPin size={12} /> {hub.address}
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                           <Phone size={12} /> {hub.contactPhone}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                           <Building2 size={12} /> {hub.type.replace(/_/g, ' ')}
                        </div>
                     </div>

                     <div className="h-px bg-slate-100 dark:bg-slate-800" />

                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-bold dark:text-white">
                           <Star size={14} className="fill-amber-400 text-amber-400" />
                           {hub.rating?.toFixed(1) || 'New'}
                        </div>
                        <Button variant="text" onClick={() => handleViewDetails(hub)} className="text-primary-600 font-bold p-0 flex items-center gap-1 text-xs">
                           Get Directions <ChevronRight size={14} />
                        </Button>
                     </div>
                  </div>
               </Card>
             ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
};
