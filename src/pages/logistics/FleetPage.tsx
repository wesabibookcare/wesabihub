import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Settings,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Loader2
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { VehicleStatus, Vehicle } from '@/src/types/logistics';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { logisticsEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { Modal } from '@/src/components/ui/Modal';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';

export const FleetPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    make: '',
    model: '',
    plateNumber: '',
    type: 'VAN',
    status: VehicleStatus.ACTIVE,
    lastMaintenance: new Date().toISOString()
  });

  useEffect(() => {
    if (user) {
      fetchFleet();
    }
  }, [user]);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (company) {
        const data = await logisticsEngine.getFleet(company.id);
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching fleet:', error);
      toast.error('Failed to load fleet inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (!company) throw new Error('Company not found');

      await logisticsEngine.addVehicle(company.id, {
        make: newVehicle.make!,
        model: newVehicle.model!,
        plateNumber: newVehicle.plateNumber!,
        type: newVehicle.type as any,
        status: newVehicle.status as any,
        lastMaintenance: newVehicle.lastMaintenance!
      });

      toast.success('Vehicle added successfully');
      setIsAddModalOpen(false);
      setNewVehicle({
        make: '',
        model: '',
        plateNumber: '',
        type: 'VAN',
        status: VehicleStatus.ACTIVE,
        lastMaintenance: new Date().toISOString()
      });
      fetchFleet();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (s: VehicleStatus) => {
    switch(s) {
      case VehicleStatus.ON_ROUTE: return "bg-blue-500/10 text-blue-600";
      case VehicleStatus.ACTIVE: return "bg-emerald-500/10 text-emerald-600";
      case VehicleStatus.MAINTENANCE: return "bg-amber-500/10 text-amber-600";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <LogisticsLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary-600" size={40} />
        </div>
      </LogisticsLayout>
    );
  }

  return (
    <LogisticsLayout>
      <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Asset Management</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Fleet Inventory</h1>
           <p className="text-slate-900 font-medium mt-1">Manage and monitor your logistics vehicles.</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-2xl h-12 px-8 font-black bg-primary-600 shadow-lg shadow-primary-500/20 gap-2"
        >
           <Plus size={20} />
           Add New Vehicle
        </Button>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Vehicle"
        description="Register a new vehicle to your fleet inventory."
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Make</label>
              <Input
                placeholder="e.g. Toyota"
                value={newVehicle.make}
                onChange={e => setNewVehicle({ ...newVehicle, make: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Model</label>
              <Input
                placeholder="e.g. Hiace"
                value={newVehicle.model}
                onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-800">Plate Number</label>
            <Input
              placeholder="e.g. ABC-123-XY"
              value={newVehicle.plateNumber}
              onChange={e => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Type</label>
              <Select
                value={newVehicle.type}
                onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
                options={[
                  { value: 'BIKE', label: 'Bike' },
                  { value: 'VAN', label: 'Van' },
                  { value: 'TRUCK', label: 'Truck' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Status</label>
              <Select
                value={newVehicle.status}
                onChange={e => setNewVehicle({ ...newVehicle, status: e.target.value as any })}
                options={[
                  { value: VehicleStatus.ACTIVE, label: 'Active' },
                  { value: VehicleStatus.MAINTENANCE, label: 'Maintenance' },
                  { value: VehicleStatus.INACTIVE, label: 'Inactive' },
                ]}
              />
            </div>
          </div>
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl font-black bg-primary-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fleet Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                 <Truck size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Total Fleet</p>
                 <h3 className="text-2xl font-black dark:text-white">{vehicles.length}</h3>
              </div>
           </div>
        </Card>
      </div>

      {/* Vehicles Grid */}
      {vehicles.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed bg-slate-50/50 rounded-[2.5rem]">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
             <Truck size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">No Vehicles Registered</h3>
          <p className="text-sm text-slate-800 max-w-sm">Your fleet inventory is empty. Add your first vehicle to start tracking operations.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v, idx) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
               <Card className="p-0 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                  <div className="p-6">
                     <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                           <Truck size={28} />
                        </div>
                        <Badge className={cn("rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase", getStatusBadge(v.status))}>
                           {v.status.replace('_', ' ')}
                        </Badge>
                     </div>

                     <h3 className="text-xl font-black dark:text-white leading-tight">{v.make} {v.model}</h3>
                     <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">{v.plateNumber}</p>

                     <div className="grid grid-cols-2 gap-4 mt-8">
                        <div>
                           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Type</p>
                           <p className="text-sm font-black dark:text-white">{v.type}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Status</p>
                           <p className="text-sm font-black dark:text-white">{v.status}</p>
                        </div>
                     </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Active Status</span>
                     </div>
                     <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => toast.info('Vehicle settings interface restricted')}>
                        <Settings size={18} className="text-slate-800" />
                     </Button>
                  </div>
               </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Maintenance Log */}
      <Card className="p-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
               <AlertTriangle className="text-amber-500" size={28} />
               Maintenance Log
            </h2>
            <Button
              variant="outline"
              className="rounded-2xl h-11 px-6 font-bold border-slate-200"
              onClick={() => toast.info('Maintenance scheduling interface restricted')}
            >
               View Schedule
            </Button>
         </div>

         <div className="p-12 text-center flex flex-col items-center justify-center border-dashed bg-slate-50/50 rounded-[2rem]">
            <p className="text-sm font-black text-slate-900">No recent maintenance records found.</p>
            <p className="text-xs text-slate-800 mt-1">Vehicle maintenance history will be automatically logged by fleet managers.</p>
         </div>
      </Card>
    </div>
    </LogisticsLayout>
  );
};
