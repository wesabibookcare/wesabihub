import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  Truck,
  Users,
  ChevronRight,
  ArrowUpRight,
  Boxes,
  Clock,
  MoreVertical,
  Plus,
  Loader2
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { JobStatus, TransportJob } from '@/src/types/logistics';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { logisticsEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { Modal } from '@/src/components/ui/Modal';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { User } from '@/src/types';
import { Vehicle } from '@/src/types/logistics';

export const TransportJobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState<Partial<TransportJob>>({
    jobNumber: `JB-${Math.floor(100000 + Math.random() * 900000)}`,
    origin: '',
    destination: '',
    status: JobStatus.PENDING,
    priority: 'NORMAL',
    parcelCount: 1,
    estimatedTime: '2 Hours'
  });

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchResources();
    }
  }, [user]);

  const fetchResources = async () => {
    try {
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (company) {
        const staff = await logisticsEngine.getStaff(company.id);
        setDrivers(staff.filter(s => s.role === 'DRIVER'));
        const fleet = await logisticsEngine.getFleet(company.id);
        setVehicles(fleet);
      }
    } catch (e) {
      console.error('Error fetching resources:', e);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (company) {
        const data = await logisticsEngine.getJobs(company.id);
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load transport jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.origin || !newJob.destination) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (!company) throw new Error('Company not found');

      const driver = drivers.find(d => d.uid === newJob.driverId);

      await logisticsEngine.createJob(company.id, {
        jobNumber: newJob.jobNumber!,
        origin: newJob.origin!,
        destination: newJob.destination!,
        status: newJob.status!,
        priority: newJob.priority!,
        parcelCount: Number(newJob.parcelCount),
        estimatedTime: newJob.estimatedTime!,
        driverId: newJob.driverId,
        driverName: driver?.displayName,
        vehicleId: newJob.vehicleId,
        createdAt: new Date().toISOString()
      });

      toast.success('Transport job created and assigned');
      setIsModalOpen(false);
      setNewJob({
        jobNumber: `JB-${Math.floor(100000 + Math.random() * 900000)}`,
        origin: '',
        destination: '',
        status: JobStatus.PENDING,
        priority: 'NORMAL',
        parcelCount: 1,
        estimatedTime: '2 Hours'
      });
      fetchJobs();
    } catch (e) {
      console.error('Error creating job:', e);
      toast.error('Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'CRITICAL': return "bg-red-500 shadow-red-500/20";
      case 'URGENT': return "bg-amber-500 shadow-amber-500/20";
      default: return "bg-blue-500 shadow-blue-500/20";
    }
  };

  const getStatusBadge = (s: JobStatus) => {
    switch(s) {
      case JobStatus.COMPLETED: return "bg-emerald-500/10 text-emerald-600";
      case JobStatus.IN_TRANSIT: return "bg-blue-500/10 text-blue-600";
      case JobStatus.ASSIGNED: return "bg-indigo-500/10 text-indigo-600";
      case JobStatus.PENDING: return "bg-slate-500/10 text-slate-800";
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
           <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Operations Center</p>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Transport Jobs</h1>
           <p className="text-slate-900 font-medium mt-1">Monitor and manage all active transport operations.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl h-12 px-8 font-black bg-primary-600 shadow-lg shadow-primary-500/20 gap-2"
        >
           <Plus size={20} />
           Manual Assignment
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Transport Job"
        description="Manually assign a transport job to a driver and vehicle."
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-800">Job Number</label>
            <Input value={newJob.jobNumber} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Origin Point</label>
              <Input
                placeholder="e.g. Lagos Hub A"
                value={newJob.origin}
                onChange={e => setNewJob({ ...newJob, origin: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Destination Point</label>
              <Input
                placeholder="e.g. Ibadan Point B"
                value={newJob.destination}
                onChange={e => setNewJob({ ...newJob, destination: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Driver</label>
              <Select
                value={newJob.driverId}
                onChange={e => setNewJob({ ...newJob, driverId: e.target.value })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...drivers.map(d => ({ value: d.uid, label: d.displayName }))
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Vehicle</label>
              <Select
                value={newJob.vehicleId}
                onChange={e => setNewJob({ ...newJob, vehicleId: e.target.value })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...vehicles.map(v => ({ value: v.plateNumber, label: `${v.make} (${v.plateNumber})` }))
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Priority</label>
              <Select
                value={newJob.priority}
                onChange={e => setNewJob({ ...newJob, priority: e.target.value as any })}
                options={[
                  { value: 'NORMAL', label: 'Normal' },
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'CRITICAL', label: 'Critical' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-800">Parcel Count</label>
              <Input
                type="number"
                value={newJob.parcelCount}
                onChange={e => setNewJob({ ...newJob, parcelCount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-12 rounded-2xl font-black bg-primary-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Transport Job'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl flex flex-wrap items-center gap-4">
         <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={18} />
            <input
              type="text"
              placeholder="Search by Job ID, Point, or Driver..."
              className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500/50"
            />
         </div>
         <Button variant="outline" className="rounded-xl h-12 border-slate-200 dark:border-slate-800 font-bold gap-2">
            <Filter size={18} />
            Filters
         </Button>
      </Card>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed bg-slate-50/50 rounded-[2.5rem]">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
             <Briefcase size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">No Active Transport Jobs</h3>
          <p className="text-sm text-slate-800 max-w-sm">There are currently no transport assignments linked to your fleet. Incoming jobs from Hub centers will appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
               <Card className="p-0 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                  <div className="p-6 pb-0">
                     <div className="flex items-start justify-between mb-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-xl", getPriorityColor(job.priority))}>
                           {job.jobNumber.slice(0, 2)}
                        </div>
                        <Badge className={cn("rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase", getStatusBadge(job.status))}>
                           {job.status.replace('_', ' ')}
                        </Badge>
                     </div>

                     <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-4">
                           <div className="flex flex-col items-center gap-1 mt-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                              <div className="w-0.5 h-8 bg-slate-100 dark:bg-slate-800" />
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                           </div>
                           <div className="flex-1">
                              <div className="mb-4">
                                 <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none mb-1">Origin Hub</p>
                                 <p className="text-sm font-black dark:text-white leading-tight">{job.origin}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none mb-1">Destination Point</p>
                                 <p className="text-sm font-black dark:text-white leading-tight">{job.destination}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none mb-1">Assigned Driver</p>
                        <div className="flex items-center gap-2">
                           <Users size={12} className="text-primary-600" />
                           <span className="text-xs font-black dark:text-white truncate">{job.driverName || 'Unassigned'}</span>
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none mb-1">Vehicle</p>
                        <div className="flex items-center gap-2">
                           <Truck size={12} className="text-primary-600" />
                           <span className="text-xs font-black dark:text-white truncate">{job.vehicleId || 'Pending'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 pt-4 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                           <Boxes size={14} className="text-slate-800" />
                           <span className="text-xs font-black dark:text-white">{job.parcelCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Clock size={14} className="text-slate-800" />
                           <span className="text-xs font-black dark:text-white">{job.estimatedTime}</span>
                        </div>
                     </div>
                     <Button size="icon" className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-primary-600 transition-colors shadow-lg">
                        <ChevronRight size={18} />
                     </Button>
                  </div>
               </Card>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </LogisticsLayout>
  );
};
