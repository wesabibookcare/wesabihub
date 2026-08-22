import React from 'react';
import { motion } from 'motion/react';
import {
  Map as MapIcon,
  Navigation,
  MapPin,
  Truck,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Boxes
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { ShipmentTrackerMap } from '@/src/components/ui/ShipmentTrackerMap';
import { toast } from 'sonner';

export const AssignedRoutesPage = () => {
  const MOCK_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const LAGOS_HUB = { lat: 6.5244, lng: 3.3792 };
  const ABUJA_WUSE = { lat: 9.0765, lng: 7.3986 };

  const routes = [
    {
      id: "RT-8812",
      name: "Mainland Supply Chain A",
      distance: "12.4 km",
      time: "45 mins",
      stopsCount: 4,
      status: "ACTIVE",
      stops: [
        { name: "Lagos Hub A", type: "PICKUP", time: "09:00 AM", status: "COMPLETED" },
        { name: "Surulere Point", type: "DROPOFF", time: "09:45 AM", status: "IN_PROGRESS" },
        { name: "Ikeja Hub B", type: "PICKUP", time: "10:30 AM", status: "PENDING" },
        { name: "Maryland Point", type: "DROPOFF", time: "11:15 AM", status: "PENDING" },
      ]
    },
    {
      id: "RT-8813",
      name: "Island Corridor Express",
      distance: "8.2 km",
      time: "32 mins",
      stopsCount: 3,
      status: "PENDING",
      stops: [
        { name: "Lekki Central Hub", type: "PICKUP", time: "01:00 PM", status: "PENDING" },
        { name: "VGC Point 4", type: "DROPOFF", time: "01:45 PM", status: "PENDING" },
        { name: "Ajah Hub", type: "DROPOFF", time: "02:30 PM", status: "PENDING" },
      ]
    }
  ];

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-2">Logistics Planning</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Assigned Routes</h1>
           <p className="text-slate-900 font-medium mt-1">Optimize delivery paths and monitor route progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Routes List */}
         <div className="xl:col-span-1 space-y-6">
            <h3 className="text-xl font-black dark:text-white px-2">Active Schedules</h3>
            {routes.map((route) => (
               <Card
                 key={route.id}
                 className={cn(
                   "p-6 border-none shadow-xl rounded-[2.5rem] cursor-pointer transition-all hover:scale-[1.02]",
                   route.status === 'ACTIVE' ? "bg-slate-900 text-white" : "bg-white dark:bg-slate-900"
                 )}
               >
                  <div className="flex items-center justify-between mb-6">
                     <Badge className={cn(
                       "rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase",
                       route.status === 'ACTIVE' ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900"
                     )}>
                        {route.status}
                     </Badge>
                     <span className={cn("text-xs font-bold uppercase tracking-widest", route.status === 'ACTIVE' ? "text-slate-800" : "text-slate-800")}>
                        {route.id}
                     </span>
                  </div>

                  <h4 className="text-xl font-black mb-6 leading-tight">{route.name}</h4>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className={cn("p-4 rounded-3xl", route.status === 'ACTIVE' ? "bg-white/5" : "bg-slate-50 dark:bg-slate-800")}>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", route.status === 'ACTIVE' ? "text-slate-900" : "text-slate-800")}>Distance</p>
                        <p className="text-lg font-black">{route.distance}</p>
                     </div>
                     <div className={cn("p-4 rounded-3xl", route.status === 'ACTIVE' ? "bg-white/5" : "bg-slate-50 dark:bg-slate-800")}>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", route.status === 'ACTIVE' ? "text-slate-900" : "text-slate-800")}>Est. Time</p>
                        <p className="text-lg font-black">{route.time}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary-600" />
                        <span className="text-sm font-bold">{route.stopsCount} Stops</span>
                     </div>
                     <Button variant={route.status === 'ACTIVE' ? 'default' : 'outline'} className={cn("rounded-xl font-black gap-2", route.status === 'ACTIVE' ? "bg-primary-600" : "")}>
                        View Map <ArrowRight size={16} />
                     </Button>
                  </div>
               </Card>
            ))}
         </div>

         {/* Route Details / Map View Placeholder */}
         <div className="xl:col-span-2 space-y-8">
            <Card className="p-0 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden min-h-[600px] flex flex-col">
               {/* Interactive Map */}
               <div className="flex-1 bg-slate-100 dark:bg-slate-800 relative group overflow-hidden min-h-[400px]">
                  <ShipmentTrackerMap
                    apiKey={MOCK_API_KEY}
                    origin={LAGOS_HUB}
                    destination={ABUJA_WUSE}
                    isOutForDelivery={true}
                  />
               </div>

               {/* Route Timeline */}
               <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xl font-black dark:text-white mb-8">Route Timeline</h3>
                  <div className="relative">
                     <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                     <div className="space-y-10">
                        {routes[0].stops.map((stop, idx) => (
                           <div key={idx} className="relative flex items-center gap-8 pl-14">
                              <div className={cn(
                                "absolute left-0 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 z-10 shadow-lg",
                                stop.status === 'COMPLETED' ? "bg-emerald-500 text-white" :
                                stop.status === 'IN_PROGRESS' ? "bg-primary-600 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-800"
                              )}>
                                 {stop.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                 <div>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-none mb-1", stop.status === 'PENDING' ? "text-slate-800" : "text-primary-600")}>
                                       {stop.type} • {stop.time}
                                    </p>
                                    <p className="text-lg font-black dark:text-white leading-tight">{stop.name}</p>
                                 </div>
                                 <Badge className={cn(
                                   "rounded-xl px-3 py-1 font-bold text-[10px]",
                                   stop.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" :
                                   stop.status === 'IN_PROGRESS' ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-800"
                                 )}>
                                    {stop.status.replace('_', ' ')}
                                 </Badge>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-8">
                        <div className="text-center">
                           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Total Parcels</p>
                           <p className="text-xl font-black dark:text-white">42 Units</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Fuel Estimate</p>
                           <p className="text-xl font-black dark:text-white">₦15,000</p>
                        </div>
                     </div>
                     <Button
                       className="rounded-2xl h-14 px-8 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 gap-2"
                       onClick={() => toast.success('Navigation launched successfully!')}
                     >
                        <Navigation size={20} />
                        Launch Navigation
                     </Button>
                  </div>
               </div>
            </Card>
         </div>
      </div>
      </div>
    </LogisticsLayout>
  );
};
