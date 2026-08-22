import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { searchService } from '../../services/SearchService';

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const searchResults = await searchService.globalAdminSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      performSearch();
    }
  }, [query]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Search className="animate-pulse text-primary-500" size={48} />
          <p className="text-slate-900 font-bold animate-pulse">Searching the WeSabiHub ecosystem...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalResults = (results?.users?.length || 0) + (results?.centers?.length || 0) + (results?.shipments?.length || 0);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Search Results
          </h1>
          <p className="text-slate-900 font-medium mt-1">
            Found {totalResults} matches for "{query}" across platform entities.
          </p>
        </div>

        {totalResults === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-slate-200">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <Search size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No matches found</h3>
              <p className="text-slate-900 max-w-xs mx-auto mt-2">
                We couldn't find any users, centers, or shipments matching your search terms.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {/* Users Section */}
            {results?.users?.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Users size={18} className="text-primary-600" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Users ({results.users.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.map((user: any) => (
                    <Link key={user.id} to={`/admin/users?id=${user.id}`}>
                      <Card className="p-4 hover:shadow-lg transition-all border-slate-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
                            {user.displayName?.[0] || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{user.displayName}</h4>
                            <p className="text-[10px] text-slate-900 truncate font-mono">{user.email}</p>
                            <Badge className="mt-2 text-[9px] font-black uppercase tracking-widest">{user.role}</Badge>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-all" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Hub Centers Section */}
            {results?.centers?.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <MapPin size={18} className="text-emerald-600" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Hub Centers ({results.centers.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.centers.map((center: any) => (
                    <Link key={center.id} to={`/admin/overview?center=${center.id}`}>
                      <Card className="p-4 hover:shadow-lg transition-all border-slate-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                            <MapPin size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{center.name}</h4>
                            <p className="text-[10px] text-slate-900 truncate">{center.city}, {center.state}</p>
                            <Badge className="mt-2 text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white border-none">ACTIVE HUB</Badge>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Shipments Section */}
            {results?.shipments?.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Package size={18} className="text-indigo-600" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Shipments ({results.shipments.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.shipments.map((shipment: any) => (
                    <Link key={shipment.id} to={`/tracking/${shipment.trackingNumber}`}>
                      <Card className="p-4 hover:shadow-lg transition-all border-slate-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                            <Package size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{shipment.trackingNumber}</h4>
                            <p className="text-[10px] text-slate-900 truncate mt-0.5">Recipient: {shipment.recipientInfo?.name}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                               <Badge className="text-[9px] font-black uppercase tracking-widest">{shipment.status}</Badge>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
