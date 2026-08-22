import { toast } from "sonner";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Package,
  Truck,
  Users,
  MessageSquare,
  Camera,
  Paperclip,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';
import { useNavigate } from 'react-router-dom';

type ExceptionType = 'DAMAGE' | 'MISSING' | 'BREAKDOWN' | 'COMPLAINT' | 'OTHER';

export const ExceptionReportingPage = () => {
  const { user, fbUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ExceptionType | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [assetId, setAssetId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{ name: string; size: string; url: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: { name: string; size: string; url: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        newAttachments.push({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          url
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(isCamera ? 'Photo captured successfully!' : 'File(s) attached successfully!');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
    toast.info('Attachment removed');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newAttachments: { name: string; size: string; url: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        newAttachments.push({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          url
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success('File(s) dropped and attached successfully!');
    }
  };

  const types = [
    { id: 'DAMAGE', label: 'Parcel Damage', icon: Package, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'MISSING', label: 'Missing Parcel', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'BREAKDOWN', label: 'Vehicle Breakdown', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'COMPLAINT', label: 'Customer Complaint', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'OTHER', label: 'Other Incident', icon: MessageSquare, color: 'text-slate-800', bg: 'bg-slate-50' },
  ];

  const handleNextStep = () => {
    if (!description.trim()) {
      toast.error('Please describe the incident first');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!type || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ exceptionId: string }>(fbUser, '/api/exceptions', {
        method: 'POST',
        body: {
          type,
          description,
          priority,
          assetId: assetId || 'N/A',
          attachments: attachments.map(a => ({ name: a.name, size: a.size }))
        }
      });

      const exceptionId = data.exceptionId;

      toast.success(`Exception ${exceptionId} reported successfully`);
      navigate(-1);
    } catch (error: any) {
      console.error('Error submitting exception:', error);
      toast.error(error.message || 'Failed to submit exception report to WOS Engine');
    } finally {
      setIsSubmitting(false);
    }
  };

   return (
    <LogisticsLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                className="rounded-xl"
              >
                 <ArrowLeft size={24} />
              </Button>
              <div>
                 <h1 className="text-3xl font-black tracking-tight dark:text-white">Report Exception</h1>
                 <p className="text-slate-800 dark:text-slate-300 font-bold">Step {step} of 3: {step === 1 ? 'Select Incident Type' : step === 2 ? 'Details & Evidence' : 'Review & Submit'}</p>
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {types.map((t) => (
                <Card
                  key={t.id}
                  onClick={() => { setType(t.id as ExceptionType); setStep(2); }}
                  className={cn(
                    "p-8 border-none shadow-xl rounded-[2.5rem] cursor-pointer transition-all hover:scale-105 hover:shadow-2xl group",
                    type === t.id ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-900"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl mb-6 inline-flex transition-colors",
                    type === t.id ? "bg-white/20 text-white" : cn(t.bg, t.color, "dark:bg-slate-800")
                  )}>
                    <t.icon size={32} />
                  </div>
                  <h3 className="text-xl font-black mb-2">{t.label}</h3>
                  <p className={cn("text-sm font-medium", type === t.id ? "text-primary-100" : "text-slate-900")}>
                    Select this to report issues related to {t.label.toLowerCase()}.
                  </p>
                </Card>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="p-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
                 <div className="space-y-6">
                    <div>
                       <label className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 block">Incident Description</label>
                       <textarea
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         placeholder="Provide a detailed description of what happened..."
                         className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-primary-500/50 resize-none transition-all"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 block">Priority Level</label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary-500/50 appearance-none"
                          >
                             <option>Normal</option>
                             <option>High</option>
                             <option>Critical</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 block">Affected Asset/Parcel ID (Optional)</label>
                          <input
                            type="text"
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            placeholder="ID #90211"
                            className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary-500/50"
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-xs font-black text-slate-800 uppercase tracking-widest block">Evidence & Attachments</label>

                       {/* Hidden Inputs */}
                       <input
                         type="file"
                         ref={fileInputRef}
                         onChange={(e) => handleFileChange(e, false)}
                         multiple
                         className="hidden"
                       />
                       <input
                         type="file"
                         ref={cameraInputRef}
                         accept="image/*"
                         capture="environment"
                         onChange={(e) => handleFileChange(e, true)}
                         className="hidden"
                       />

                       <div
                         onDragOver={handleDragOver}
                         onDragLeave={handleDragLeave}
                         onDrop={handleDrop}
                         className={cn(
                           "grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-[2rem] border-2 border-dashed transition-all",
                           isDragging ? "border-primary-500 bg-primary-50/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                         )}
                       >
                          <div
                            onClick={() => cameraInputRef.current?.click()}
                            className="aspect-square rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 group cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all"
                          >
                             <Camera size={32} className="text-slate-800 group-hover:text-primary-600 mb-2" />
                             <span className="text-[10px] font-black text-slate-800 group-hover:text-primary-600 uppercase tracking-widest">Take Photo</span>
                          </div>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 group cursor-pointer hover:bg-primary-50 hover:border-primary-200 transition-all"
                          >
                             <Paperclip size={32} className="text-slate-800 group-hover:text-primary-600 mb-2" />
                             <span className="text-[10px] font-black text-slate-800 group-hover:text-primary-600 uppercase tracking-widest">Attach File</span>
                          </div>

                          {/* Render Uploaded Files inside the grid */}
                          {attachments.map((file, idx) => (
                            <div key={idx} className="aspect-square rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col p-4 justify-between relative group overflow-hidden shadow-sm">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors z-10"
                              >
                                <X size={12} />
                              </button>
                              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                {file.name.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Paperclip size={24} className="text-slate-400" />
                                )}
                              </div>
                              <div className="mt-2 text-center overflow-hidden">
                                <p className="text-[10px] font-bold dark:text-white truncate" title={file.name}>{file.name}</p>
                                <p className="text-[8px] text-slate-500 font-medium">{file.size}</p>
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <Button
                   onClick={handleNextStep}
                   className="w-full h-16 rounded-[2rem] bg-primary-600 hover:bg-primary-700 text-white font-black text-lg mt-10 shadow-xl shadow-primary-500/20"
                 >
                   Review Summary
                 </Button>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="p-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
                 <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black dark:text-white">Review Submission</h3>
                    <p className="text-slate-900 font-medium">Verify your incident report details before sending.</p>
                 </div>

                 <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Report Type</span>
                       <span className="text-sm font-black dark:text-white">{type}</span>
                    </div>
                    {assetId && (
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Asset/Parcel ID</span>
                          <span className="text-sm font-black dark:text-white">{assetId}</span>
                       </div>
                    )}
                    <div className="flex justify-between">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Priority</span>
                       <Badge className={cn(
                          "text-white rounded-full px-3 py-1 font-black text-[10px] border-none uppercase",
                          priority === 'Critical' ? "bg-red-500" : priority === 'High' ? "bg-amber-500" : "bg-blue-500"
                       )}>{priority}</Badge>
                    </div>
                    {attachments.length > 0 && (
                       <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 block">Attached Evidence ({attachments.length})</span>
                          <div className="flex flex-wrap gap-2">
                             {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-xs shadow-sm">
                                   <Paperclip size={12} className="text-slate-500 shrink-0" />
                                   <span className="text-[10px] font-bold dark:text-white truncate max-w-[120px]">{file.name}</span>
                                   <span className="text-[8px] text-slate-500 font-medium">({file.size})</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 block">Description Summary</span>
                       <p className="text-sm font-medium dark:text-slate-300 leading-relaxed italic">
                          "{description}"
                       </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mt-10">
                    <Button variant="outline" className="h-16 rounded-[2rem] font-black text-lg border-slate-200" onClick={() => setStep(2)}>
                       Edit Details
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      className="h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-500/20"
                      onClick={handleSubmit}
                    >
                       Submit Report
                    </Button>
                 </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LogisticsLayout>
  );
};
