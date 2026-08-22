import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Star,
  Filter,
  ChevronRight,
  Globe,
  Store,
  Fuel,
  Crosshair,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { Select } from '@/src/components/ui/Select';
import { centreEngine } from '@/src/engines';
import { HubCenter } from '@/src/types';
import { toast } from 'sonner';

export const FindCenterPage = () => {
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHubs();
  }, []);

  const loadHubs = async () => {
    setLoading(true);
    try {
      const results = await centreEngine.getAllHubs();
      setHubs(results);
    } catch (error) {
      toast.error('Failed to load centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const results = await centreEngine.searchHubs({
        state: selectedState === 'all' ? '' : selectedState,
        query: searchQuery
      });
      setHubs(results);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const results = await centreEngine.listNearbyHubs(latitude, longitude, 20);
          setHubs(results);
          toast.success(`Found ${results.length} hubs near your location.`);
        } catch (error) {
          toast.error("Failed to fetch hubs near your location.");
        }
      }, () => {
        toast.error("Unable to retrieve your location.");
      });
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  return (
    <PublicLayout>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* Sidebar Filters */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Find a Hub</h1>
                <p className="text-slate-600 dark:text-slate-300">Explore WeSabiHub pre-launch demo centers across the nation.</p>
              </div>

              <Card className="p-6 space-y-6 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Developer Sandbox Notice</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                      These locations represent development seed centers created for simulation and testing of the WeSabiHub workflow engine.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">State / Region</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none dark:text-white"
                    >
                      <option value="">All States</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja (FCT)">Abuja (FCT)</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Kano">Kano</option>
                      <option value="Oyo">Oyo</option>
                    </select>
                  </div>
                  <Input
                    label="Search City or Neighborhood"
                    placeholder="e.g. Lekki, Ikeja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                  />
                  <Button type="submit" className="w-full h-12">
                    Search Centers
                  </Button>
                  <Button type="button" variant="outline" className="w-full h-12" onClick={handleFindNearMe} leftIcon={<Crosshair className="w-5 h-5" />}>
                    Use Current Location
                  </Button>
                </form>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Showing <span className="text-slate-900 dark:text-white font-bold">{hubs.length}</span> pre-launch demo centers
                </p>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-500 font-medium">Loading pre-launch demo hubs...</div>
              ) : hubs.length === 0 ? (
                <Card className="p-12 text-center space-y-4">
                  <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hubs found</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Try adjusting your search criteria or location filter.</p>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {hubs.map((hub) => (
                    <Card key={hub.id} className="p-0 overflow-hidden group hover:border-primary-500/50 transition-all bg-white dark:bg-slate-900">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-6 md:p-8 flex-1 space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="info" size="sm" className="bg-primary-50 text-primary-600">
                                  {hub.type?.replace('_', ' ') || 'Hub Center'}
                                </Badge>
                                {hub.status === 'ACTIVE' ? (
                                  <Badge variant="success" size="sm">Open Now</Badge>
                                ) : (
                                  <Badge variant="error" size="sm">Inactive</Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
                                {hub.name}
                                {hub.isVerified && <ShieldCheck size={18} className="text-primary-500" />}
                              </h3>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-4 h-4 fill-current" />
                                {hub.rating || 4.8}
                              </div>
                              <p className="text-xs text-slate-500">{hub.reviews || 12} reviews</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{hub.address}, {hub.city}, {hub.state}</p>
                            </div>
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-600 dark:text-slate-300">{hub.operatingHours || '8:00 AM - 6:00 PM'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 md:w-48 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{(hub as any).distanceKm ? `${(hub as any).distanceKm} km` : 'Verified'}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Location</p>
                          </div>
                          <Button className="w-full" onClick={() => {
                            localStorage.setItem('selected_hub', JSON.stringify(hub));
                            toast.success(`Selected "${hub.name}"!`);
                          }}>Select Hub</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
