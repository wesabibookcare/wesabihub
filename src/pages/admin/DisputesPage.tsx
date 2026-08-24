import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, Scale, MessageSquare, Cpu, Clock, Coins, CheckCircle2,
  Plus, Search, Briefcase, Layers, Settings, Play, Pause, Volume2,
  Sparkles, TrendingUp, Check, X, ChevronRight, UserCheck, RefreshCw,
  AlertTriangle, FileText, CheckCheck, ShieldCheck, Eye, Trash2, Sliders, Info
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import { toast } from 'sonner';
import { disputeEngine } from '../../engines/DisputeEngine';

import { paymentProtectionEngine } from '../../services/PaymentProtectionEngine';
import { auditEngine } from '@/src/engines';
import { notificationService } from '../../services/NotificationService';
import { categoryService, DisputeCategory } from '../../services/CategoryService';
import { Dispute } from '../../types';
import { Alert } from '../../components/ui/Alert';

export const AdminDisputesPage = () => {
  const { user, fbUser } = useAuth();
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const currentUserId = user?.uid || 'USR-ADMIN';
  const currentUserRole = user?.role || 'SUPER_ADMIN';
  const currentUserName = user?.displayName || 'Dispute Administrator';

  // State Management
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [categories, setCategories] = useState<DisputeCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Active Investigator Workspace Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'AI_AGENT' | 'NOTES' | 'DECISION'>('OVERVIEW');

  // Interactive Live Call Player Simulator State
  const [isCallPlaying, setIsCallPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Gemini & Note creation states
  const [runningAiAudit, setRunningAiAudit] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Decision Engine Form State
  const [decisionType, setDecisionType] = useState<'RELEASE_MERCHANT' | 'REFUND_BUYER' | 'PARTIAL_SPLIT'>('RELEASE_MERCHANT');
  const [buyerPercentage, setBuyerPercentage] = useState<number>(50);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [executingDecision, setExecutingDecision] = useState<boolean>(false);

  // Category Configuration Manager (Super Admin Only)
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Load Data
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const loadCategoriesOnce = async () => {
    if (categoriesLoaded) return;
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats);
      setCategoriesLoaded(true);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Setup real-time Firestore listener for disputes
    const unsubscribe = disputeEngine.subscribeToDisputes((allDisputes: any) => {
      setDisputes(allDisputes);

      // If a dispute is currently selected, refresh its details in real-time
      setSelectedDispute(currentSelected => {
        if (!currentSelected) return null;
        const refreshed = allDisputes.find(d => d.id === currentSelected.id);
        return refreshed || null;
      });

      setLoading(false);
      setRefreshing(false);
    });

    loadCategoriesOnce();

    return () => unsubscribe();
  }, []);

  const loadDisputes = async () => {
    // Real-time listener handles disputes sync automatically. We refresh categories if called manually.
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error manually loading categories:', error);
    }
  };

  // Sync Slider percentages
  const merchantPercentage = 100 - buyerPercentage;

  // Simulate Call Audio/Video Playback
  const toggleCallPlay = () => {
    if (isCallPlaying) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      setIsCallPlaying(false);
    } else {
      setIsCallPlaying(true);
      playbackTimerRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= 45) {
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            setIsCallPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  // Update Dispute Meta (Assignee, Status, Priority)
  const handleUpdateMeta = async (fields: Partial<Dispute>) => {
    if (!selectedDispute) return;

    const oldDisputes = [...disputes];
    const oldSelected = selectedDispute;

    // Optimistic Update: Update UI state immediately
    const updated = {
      ...selectedDispute,
      ...fields,
      latestActivity: `Meta details updated by Admin ${currentUserName}`
    };
    setSelectedDispute(updated);
    setDisputes(prev => prev.map(d => d.id === selectedDispute.id ? updated : d));

    try {
      await disputeEngine.updateDispute(selectedDispute.id, {
        ...fields,
        latestActivity: `Meta details updated by Admin ${currentUserName}`
      });
      toast.success('Dispute details updated');
    } catch (e) {
      console.error('Failed to update dispute meta:', e);
      toast.error('Failed to update dispute. Reverting changes...');
      // Rollback
      setDisputes(oldDisputes);
      setSelectedDispute(oldSelected);
    }
  };

  // Run Real AI pre-assessment via Gemini server route
  const handleRunAiAudit = async () => {
    if (!selectedDispute) return;
    setRunningAiAudit(true);
    try {
      let ppRecord = null;
      if (selectedDispute.shipmentId) {
        ppRecord = await disputeEngine.getPaymentProtectionByShipmentId(selectedDispute.shipmentId);
      }

      const data = await apiFetch<{ assessment: string }>(fbUser, "/api/disputes/pre-assess", {
        method: "POST",
        body: {
          disputeId: selectedDispute.id,
          reason: selectedDispute.reason,
          details: selectedDispute.details,
          initiatorRole: selectedDispute.initiatorRole,
          conversationSnapshot: selectedDispute.evidence?.conversationSnapshot || [],
          shipmentInfo: selectedDispute.evidence?.shipmentInfo,
          trackingHistory: selectedDispute.evidence?.trackingHistory || [],
          safePayRecord: ppRecord
        }
      });

      await disputeEngine.updateDispute(selectedDispute.id, {
        aiAssessment: data.assessment,
        latestActivity: `AI Forensics generated by compliance engine on request of Admin ${currentUserName}`
      });
      toast.success('AI Audit completed successfully');
      await loadDisputes();
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ type: 'error', message: "AI request failed: " + err.message });
      toast.error("AI request failed");
    } finally {
      setTimeout(() => setSaveStatus(null), 5000);
      setRunningAiAudit(false);
    }
  };

  // Add staff investigation note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedDispute) return;

    const newNote = {
      text: newNoteText,
      authorName: currentUserName,
      authorId: currentUserId,
      timestamp: new Date().toISOString()
    };

    const updatedNotes = [...(selectedDispute.internalNotes || []), newNote];
    const oldDisputes = [...disputes];
    const oldSelected = selectedDispute;

    // Optimistic Update: Update UI state immediately
    const updated = {
      ...selectedDispute,
      internalNotes: updatedNotes,
      latestActivity: `Private investigation note added by Staff ${currentUserName}`
    };
    setSelectedDispute(updated);
    setDisputes(prev => prev.map(d => d.id === selectedDispute.id ? updated : d));
    setNewNoteText('');

    try {
      await disputeEngine.updateDispute(selectedDispute.id, {
        internalNotes: updatedNotes,
        latestActivity: `Private investigation note added by Staff ${currentUserName}`
      });
      toast.success('Private note added');
    } catch (e) {
      console.error('Failed to save private note:', e);
      toast.error('Failed to add note. Reverting...');
      // Rollback
      setDisputes(oldDisputes);
      setSelectedDispute(oldSelected);
      setNewNoteText(newNote.text);
    }
  };

  // Final SafePay Decision Execution
  const handleExecuteResolution = async () => {
    if (!selectedDispute || !resolutionText.trim()) {
      setSaveStatus({ type: 'error', message: "Resolution justification notes are strictly required for financial compliance auditing." });
      return;
    }

    setExecutingDecision(true);
    try {
      let ppRecord = null;
      if (selectedDispute.shipmentId) {
        ppRecord = await disputeEngine.getPaymentProtectionByShipmentId(selectedDispute.shipmentId);
      }
      if (!ppRecord && selectedDispute.parcelId) {
        ppRecord = await disputeEngine.getPaymentProtectionByParcelId(selectedDispute.parcelId);
      }

      if (!ppRecord) {
        throw new Error('Associated active Payment Protection record not found.');
      }

      const totalAmount = ppRecord.amount;

      if (decisionType === 'RELEASE_MERCHANT') {
        // Payout to merchant
        await paymentProtectionEngine.adminReleasePayment(ppRecord.id, currentUserId);
        await disputeEngine.updateDispute(selectedDispute.id, {
          status: 'RESOLVED',
          resolutionType: 'RELEASE_TO_SELLER',
          resolutionNotes: resolutionText,
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUserId,
          latestActivity: `Case closed. 100% funds (${ppRecord.currency} ${totalAmount}) released to Merchant.`
        });
      } else if (decisionType === 'REFUND_BUYER') {
        // Refund to buyer
        await paymentProtectionEngine.adminRefundPayment(ppRecord.id, currentUserId);
        await disputeEngine.updateDispute(selectedDispute.id, {
          status: 'RESOLVED',
          resolutionType: 'REFUND_TO_BUYER',
          resolutionNotes: resolutionText,
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUserId,
          latestActivity: `Case closed. 100% funds (${ppRecord.currency} ${totalAmount}) refunded to Buyer.`
        });
      } else if (decisionType === 'PARTIAL_SPLIT') {
        // Split split
        const bAmount = (totalAmount * buyerPercentage) / 100;
        const mAmount = (totalAmount * merchantPercentage) / 100;
        await paymentProtectionEngine.adminPartialRefundPayment(ppRecord.id, bAmount, mAmount, currentUserId);

        await disputeEngine.updateDispute(selectedDispute.id, {
          status: 'RESOLVED',
          resolutionType: 'PARTIAL_SPLIT',
          resolutionNotes: resolutionText,
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUserId,
          latestActivity: `Case closed. Split payout executed: Buyer refunded ${ppRecord.currency} ${bAmount} (${buyerPercentage}%), Merchant paid ${ppRecord.currency} ${mAmount} (${merchantPercentage}%).`
        });
      }

      // Notify users about resolution
      await notificationService.send(
        selectedDispute.buyerId || 'BUYER',
        'Dispute Case Resolved',
        `Dispute ${selectedDispute.id} has been formally resolved. Decision: ${decisionType.replace('_', ' ')}. Notes: ${resolutionText}`,
        'SUCCESS',
        `/conversations/${selectedDispute.conversationId}`
      );

      await notificationService.send(
        selectedDispute.merchantId || 'MERCHANT',
        'Dispute Case Resolved',
        `Dispute ${selectedDispute.id} has been formally resolved. Decision: ${decisionType.replace('_', ' ')}. Notes: ${resolutionText}`,
        'SUCCESS',
        `/conversations/${selectedDispute.conversationId}`
      );

      await auditEngine.logEvent({ userId: currentUserId, action: 'DISPUTE_RESOLVED', details: {
        disputeId: selectedDispute.id,
        decisionType,
        resolutionNotes: resolutionText
      }, targetId: selectedDispute.id, result: 'SUCCESS' });

      setResolutionText('');
      setSaveStatus({ type: 'success', message: "Financial decision executed successfully. Funds moved, accounts updated, and custody cases resolved." });
      toast.success("Financial decision executed successfully");
      // Instantly update selectedDispute local state so the view updates without delay
      setSelectedDispute(prev => prev ? {
        ...prev,
        status: 'RESOLVED',
        resolutionType: decisionType === 'RELEASE_MERCHANT' ? 'RELEASE_TO_SELLER' : (decisionType === 'REFUND_BUYER' ? 'REFUND_TO_BUYER' : 'PARTIAL_SPLIT'),
        resolutionNotes: resolutionText,
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUserId
      } : null);
      await loadDisputes();
    } catch (err: any) {
      console.error(err);
      setSaveStatus({ type: 'error', message: "Error executing SafePay resolution: " + err.message });
      toast.error("Error executing SafePay resolution");
    } finally {
      setTimeout(() => setSaveStatus(null), 5000);
      setExecutingDecision(false);
    }
  };

  // Category Configuration Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const id = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await categoryService.saveCategory({
        id,
        name: newCatName,
        description: newCatDesc,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setNewCatName('');
      setNewCatDesc('');
      toast.success('Category added successfully');
      await loadDisputes();
    } catch (e) {
      console.error('Failed to add category:', e);
      toast.error('Failed to add category');
    }
  };

  const handleToggleCategory = async (id: string, currentVal: boolean) => {
    try {
      await categoryService.updateCategory(id, { isActive: !currentVal });
      toast.success(`Category ${!currentVal ? 'enabled' : 'disabled'} successfully`);
      await loadDisputes();
    } catch (e) {
      console.error('Failed to toggle category:', e);
      toast.error('Failed to toggle category');
    }
  };

  // Filter & Search Logic
  const filteredDisputes = disputes.filter(d => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.trackingNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.buyerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.merchantName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || d.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Analytics Metrics
  const metrics = {
    total: disputes.length,
    critical: disputes.filter(d => d.priority === 'CRITICAL' && d.status !== 'RESOLVED').length,
    underReview: disputes.filter(d => ['NEW', 'UNDER_REVIEW', 'EVIDENCE_REQUESTED'].includes(d.status)).length,
    resolved: disputes.filter(d => d.status === 'RESOLVED').length
  };

  return (
    <AdminLayout>
      {saveStatus && (
        <Alert variant={saveStatus.type} className="fixed top-20 right-6 z-50 w-auto max-w-sm" onClose={() => setSaveStatus(null)}>
          {saveStatus.message}
        </Alert>
      )}
      <div className="space-y-6 p-6 min-h-screen bg-slate-50">

        {/* Header & Desk Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold tracking-widest rounded-full uppercase">Control Deck</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-900">Secure Custody Audits & Payment Protection Decisions</span>
            </div>
            <h1 className="text-3xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2.5">
              Payment Protection Disputes Control Desk
            </h1>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={loadDisputes}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Reload Desk"}
            </button>
            {currentUserRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-md"
              >
                <Settings size={15} />
                Manage Categories
              </button>
            )}
          </div>
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Total Filed Disputes</p>
              <h3 className="text-2xl font-black text-slate-900 font-display">{metrics.total}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Layers size={20} />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Critical Escalations</p>
              <h3 className="text-2xl font-black text-red-600 font-display">{metrics.critical}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl animate-pulse">
              <ShieldAlert size={20} />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Awaiting Staff Payouts</p>
              <h3 className="text-2xl font-black text-amber-600 font-display">{metrics.underReview}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Successfully Resolved</p>
              <h3 className="text-2xl font-black text-emerald-600 font-display">{metrics.resolved}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Settings Panel for Super Admin */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-lg space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-800">Dynamic Dispute Category Configurator</h2>
                  <p className="text-xs text-slate-900">Configure global categories accessible by buyers and sellers when initiating protected payment claims.</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-800 hover:text-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Form */}
                <form onSubmit={handleAddCategory} className="space-y-3 border-r border-slate-100 pr-6">
                  <h3 className="text-xs font-bold text-slate-900">Add New Active Category</h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800">Category Label</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="e.g. Parcel Tampered"
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800">Internal Audit Rule Description</label>
                    <textarea
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="Brief details about what evidence is required..."
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs min-h-[60px] focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                    <Plus size={14} /> Add Category
                  </button>
                </form>

                {/* List */}
                <div className="md:col-span-2 space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  <h3 className="text-xs font-bold text-slate-900">Live Configured System Categories</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            {cat.name}
                            {!cat.isActive && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">DEACTIVATED</span>}
                          </p>
                          <p className="text-[10px] text-slate-900 leading-normal">{cat.description || "No rules defined."}</p>
                        </div>
                        <button
                          onClick={() => handleToggleCategory(cat.id, cat.isActive)}
                          className={`px-2 py-1 text-[9px] font-bold rounded-lg transition ${cat.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                        >
                          {cat.isActive ? 'Active' : 'Muted'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double-Pane Desk Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Pane - Disputes List Desk */}
          <div className="lg:col-span-4 space-y-4">

            {/* Filters */}
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-800" size={15} />
                <input
                  type="text"
                  placeholder="Search Desk (ID, Track, Names)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-xl text-xs focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-800 uppercase">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="NEW">New</option>
                    <option value="UNDER_REVIEW">Reviewing</option>
                    <option value="EVIDENCE_REQUESTED">Evidence</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-800 uppercase">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="ALL">All Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-slate-800 uppercase">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-20 text-center text-xs text-slate-900 font-bold flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-slate-800" size={24} />
                  Loading case folders from Firestore database...
                </div>
              ) : filteredDisputes.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-900">
                  No claims found matching filters on this desk.
                </div>
              ) : (
                filteredDisputes.map(claim => {
                  const isSelected = selectedDispute?.id === claim.id;

                  // Color codes
                  let priorityColor = "bg-slate-100 text-slate-900";
                  if (claim.priority === "CRITICAL") priorityColor = "bg-red-100 text-red-800 border border-red-200";
                  else if (claim.priority === "HIGH") priorityColor = "bg-orange-100 text-orange-800";
                  else if (claim.priority === "MEDIUM") priorityColor = "bg-amber-100 text-amber-800";

                  let statusColor = "bg-gray-100 text-gray-700";
                  if (claim.status === "NEW") statusColor = "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse";
                  else if (claim.status === "UNDER_REVIEW") statusColor = "bg-purple-100 text-purple-800";
                  else if (claim.status === "RESOLVED") statusColor = "bg-emerald-100 text-emerald-800";

                  const createdDate = new Date(claim.createdAt);
                  const formattedTime = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <motion.div
                      layoutId={`claim-card-${claim.id}`}
                      key={claim.id}
                      onClick={() => {
                        setSelectedDispute(claim);
                        setActiveTab('OVERVIEW');
                      }}
                      className={`p-4 rounded-2xl border transition text-left cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    >
                      {/* Accent color for critical cases */}
                      {claim.priority === 'CRITICAL' && claim.status !== 'RESOLVED' && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
                      )}

                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-[10px] font-mono tracking-wider font-bold opacity-80 uppercase">
                          {claim.id}
                        </span>
                        <div className="flex gap-1">
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${priorityColor}`}>
                            {claim.priority || 'MEDIUM'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${statusColor}`}>
                            {claim.status || 'NEW'}
                          </span>
                        </div>
                      </div>

                      <h4 className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                        {claim.reason}
                      </h4>
                      <p className={`text-[10px] line-clamp-2 mt-1 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-900'}`}>
                        {claim.details}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100/10 flex justify-between items-center text-[9px] opacity-70">
                        <span className="truncate max-w-[120px]">By {claim.buyerName || 'Buyer'}</span>
                        <span>{formattedTime}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane - Claims Investigator Workspace */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!selectedDispute ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-4 min-h-[500px]"
                >
                  <div className="p-5 bg-slate-50 text-slate-800 rounded-full border border-slate-100">
                    <Scale size={42} className="stroke-[1.5]" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-base font-black text-slate-800">Investigator Terminal Ready</h3>
                    <p className="text-xs text-slate-900 leading-relaxed">
                      Select a claim from the left desk to review custody tracking records, examine locked evidence snapshots, evaluate Compliance AI reports, and execute financial resolutions.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200/80 rounded-3xl shadow-md overflow-hidden min-h-[600px] flex flex-col"
                >

                  {/* Investigator Header */}
                  <div className="p-6 bg-slate-900 text-white border-b border-slate-800 relative">
                    <div className="flex flex-wrap justify-between items-start gap-4">

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-800 uppercase">
                          <span>Dispute {selectedDispute.id}</span>
                          <span>•</span>
                          <span>Opened by {selectedDispute.initiatorRole}</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-white leading-snug">
                          {selectedDispute.reason}
                        </h2>
                        <p className="text-xs text-slate-800 line-clamp-1">
                          Latest activity: {selectedDispute.latestActivity || "Filing recorded."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status update select */}
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-slate-800 uppercase">Set Status</p>
                          <select
                            value={selectedDispute.status}
                            onChange={e => handleUpdateMeta({ status: e.target.value as any })}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none"
                          >
                            <option value="NEW">New</option>
                            <option value="UNDER_REVIEW">Reviewing</option>
                            <option value="EVIDENCE_REQUESTED">Evidence Req.</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>

                        {/* Priority update select */}
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-slate-800 uppercase">Priority</p>
                          <select
                            value={selectedDispute.priority}
                            onChange={e => handleUpdateMeta({ priority: e.target.value as any })}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>

                        {/* Assign Admin select */}
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold text-slate-800 uppercase">Assigned Staff</p>
                          <select
                            value={selectedDispute.assignedAdminId || ''}
                            onChange={e => handleUpdateMeta({ assignedAdminId: e.target.value })}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            <option value={currentUserId}>Assign Me ({currentUserName.split(' ')[0]})</option>
                            <option value="USR-SUP01">Supervisor Chinedu</option>
                            <option value="USR-SUP02">Manager Fatimah</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Tabs Navigator */}
                  <div className="flex border-b border-slate-100 bg-slate-50 p-2 gap-1 overflow-x-auto">
                    {[
                      { id: 'OVERVIEW', label: 'Forensic Custody', icon: Scale },
                      { id: 'EVIDENCE', label: 'Frozen Chat', icon: MessageSquare },
                      { id: 'AI_AGENT', label: 'Gemini AI Audit', icon: Cpu },
                      { id: 'NOTES', label: 'Investigation Notes', icon: FileText },
                      { id: 'DECISION', label: 'Decision Engine', icon: Coins }
                    ].map(tab => {
                      const IconComp = tab.icon;
                      const isTabActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition whitespace-nowrap ${
                            isTabActive
                              ? 'bg-slate-900 text-white shadow'
                              : 'text-slate-800 hover:bg-slate-200/50 hover:text-slate-900'
                          }`}
                        >
                          <IconComp size={14} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Contents Pane */}
                  <div className="p-6 flex-1 overflow-y-auto max-h-[500px]">

                    {/* Tab 1: OVERVIEW & FORENSIC CUSTODY */}
                    {activeTab === 'OVERVIEW' && (
                      <div className="space-y-6">

                        {/* Transaction & Protected Stats Cards */}
                        <div className="grid md:grid-cols-2 gap-4">

                          {/* Financial Panel */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                              <Coins size={14} className="text-amber-500" /> Disputed Secure Funds
                            </h3>
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] font-bold text-slate-800">Protected Value:</span>
                              <span className="text-xl font-black text-slate-950 font-display">
                                NGN {selectedDispute.evidence?.shipmentInfo?.codAmount || selectedDispute.evidence?.shipmentInfo?.declaredValue || "15,000"}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] font-bold text-slate-800">Current Status:</span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-lg">
                                {selectedDispute.safePayStatus || "DISPUTE_OPENED"}
                              </span>
                            </div>
                            <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-800 leading-relaxed flex gap-1.5">
                              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                              <p>Funds are locked in the OmorfiHub Secure smart wallet. Payout is physically frozen until an Admin action.</p>
                            </div>
                          </div>

                          {/* Shipment & Parcel Details */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                              <Briefcase size={14} className="text-indigo-500" /> Logistics Snapshot
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <p className="text-[9px] font-bold text-slate-800 uppercase">Tracking Number</p>
                                <p className="font-bold text-slate-800">{selectedDispute.trackingNumber || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-800 uppercase">Parcel Type</p>
                                <p className="font-bold text-slate-800">{selectedDispute.evidence?.itemInfo?.category || "Tech Goods"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-800 uppercase">Buyer (Recipient)</p>
                                <p className="font-bold text-slate-800 truncate">{selectedDispute.buyerName || "Buyer User"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-800 uppercase">Merchant (Seller)</p>
                                <p className="font-bold text-slate-800 truncate">{selectedDispute.merchantName || "Merchant User"}</p>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Tracking timeline */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Logistics Custody Timeline</h3>
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-4">
                            {selectedDispute.evidence?.trackingHistory && selectedDispute.evidence.trackingHistory.length > 0 ? (
                              <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                                {selectedDispute.evidence.trackingHistory.map((step: any, i: number) => (
                                  <div key={i} className="relative text-xs">
                                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white" />
                                    <p className="font-black text-slate-800">{step.title || step.type}</p>
                                    <p className="text-[10px] text-slate-900">{step.description || step.message}</p>
                                    <p className="text-[9px] text-slate-800">{step.timestamp || step.time}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-900 italic">No tracking events recorded for this claim.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Tab 2: IMMUTABLE CHAT EVIDENCE */}
                    {activeTab === 'EVIDENCE' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-[10px] leading-relaxed flex gap-2">
                          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                          <p>
                            <strong>IMMUTABLE FORENSIC SNAPSHOT:</strong> This chat thread is an exact, read-only copy of user communications locked instantly when the dispute was initiated. It cannot be altered by either party.
                          </p>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto bg-slate-50 p-4 space-y-3 flex flex-col">
                          {selectedDispute.evidence?.conversationSnapshot && selectedDispute.evidence.conversationSnapshot.length > 0 ? (
                            selectedDispute.evidence.conversationSnapshot.map((msg: any) => {
                              const isMerchant = msg.senderRole === 'MERCHANT' || msg.senderRole === 'SELLER';
                              return (
                                <div
                                  key={msg.id}
                                  className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                                    isMerchant
                                      ? 'bg-slate-900 text-white rounded-br-none self-end'
                                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none self-start'
                                  }`}
                                >
                                  <div className="flex justify-between items-center gap-4 mb-1 text-[9px] opacity-75">
                                    <span className="font-bold">{msg.senderName} ({msg.senderRole})</span>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {msg.attachments.map((url: string, i: number) => (
                                        <div key={i} className="p-1.5 bg-slate-100 rounded text-[9px] text-slate-800 flex items-center gap-1">
                                          <FileText size={10} />
                                          Evidence Media #{i+1}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-900 italic text-center py-6">No chat history frozen in this claims record.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: AI PRE-ASSESSMENT REPORT */}
                    {activeTab === 'AI_AGENT' && (
                      <div className="space-y-4">

                        <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                          <div>
                            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <Cpu size={14} className="text-indigo-600" /> Gemini Compliance Assistant
                            </h3>
                            <p className="text-[10px] text-slate-900">Unbiased timeline evaluations, chat compliance checks, and secure payout protection options.</p>
                          </div>

                          <button
                            onClick={handleRunAiAudit}
                            disabled={runningAiAudit}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                          >
                            {runningAiAudit ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                Auditing Case...
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                Run AI Forensic Audit
                              </>
                            )}
                          </button>
                        </div>

                        {/* AI Report Output */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl min-h-[250px] max-h-[350px] overflow-y-auto whitespace-pre-line font-mono text-xs text-slate-800 leading-relaxed">
                          {selectedDispute.aiAssessment ? (
                            <div>
                              {selectedDispute.aiAssessment}
                            </div>
                          ) : (
                            <div className="text-center py-16 space-y-2">
                              <p className="text-slate-900 italic">No AI pre-assessment generated for this case folder yet.</p>
                              <p className="text-[10px] text-slate-800">Click &apos;Run AI Forensic Audit&apos; to securely prompt Gemini 3.5 Flash.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Tab 4: INTERNAL INVESTIGATION NOTES */}
                    {activeTab === 'NOTES' && (
                      <div className="space-y-4">

                        <div className="p-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-xl text-[10px] leading-relaxed flex gap-2">
                          <Info size={14} className="shrink-0 mt-0.5" />
                          <p>
                            <strong>STAFF ONLY NOTEBOOK:</strong> These investigation notes are private and fully restricted from buyers, sellers, or external portals. This notebook tracks operational steps, evidence audits, and case history.
                          </p>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                          {selectedDispute.internalNotes && selectedDispute.internalNotes.length > 0 ? (
                            selectedDispute.internalNotes.map((note, i) => (
                              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <p className="text-[10px] text-slate-800 font-bold">
                                  By {note.authorName} • {new Date(note.timestamp).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-800 font-sans leading-relaxed">{note.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-900 italic py-6 text-center">No private investigator notes logged on this claim yet.</p>
                          )}
                        </div>

                        {/* Note Form */}
                        <form onSubmit={handleAddNote} className="pt-2 border-t border-slate-100 flex gap-2">
                          <input
                            type="text"
                            placeholder="Write an internal investigation update..."
                            value={newNoteText}
                            onChange={e => setNewNoteText(e.target.value)}
                            className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                            required
                          />
                          <button type="submit" className="px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition">
                            Save Note
                          </button>
                        </form>

                      </div>
                    )}

                    {/* Tab 5: DECISION ENGINE (FINANCIAL resolutions) */}
                    {activeTab === 'DECISION' && (
                      <div className="space-y-5">
                        {selectedDispute.status === 'RESOLVED' ? (
                          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2">
                            <ShieldCheck className="mx-auto text-emerald-600" size={32} />
                            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Dispute Case formally Resolved</h3>
                            <p className="text-xs text-emerald-700 leading-normal max-w-md mx-auto">
                              This dispute was closed on {selectedDispute.resolvedAt ? new Date(selectedDispute.resolvedAt).toLocaleString() : 'N/A'}.
                              Resolution: <strong className="uppercase">{selectedDispute.resolutionType}</strong>.
                              Justification notes are recorded below.
                            </p>
                            <div className="p-3 bg-white border border-emerald-100 rounded-xl text-xs text-slate-900 max-w-md mx-auto text-left whitespace-pre-line italic">
                              &ldquo;{selectedDispute.resolutionNotes}&rdquo;
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">

                            <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-[10px] leading-relaxed flex gap-2">
                              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                              <p>
                                <strong>WARNING:</strong> Executing a final resolution triggers immediate, irreversible wallet transfers via the OmorfiHub Secure Smart Contract. Check that you have reviewed the evidence and compliance timelines carefully before clicking.
                              </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-3">

                              <button
                                onClick={() => setDecisionType('RELEASE_MERCHANT')}
                                className={`p-4 border rounded-xl text-left transition ${decisionType === 'RELEASE_MERCHANT' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'}`}
                              >
                                <Coins className="text-indigo-500 mb-2" size={18} />
                                <h4 className="text-xs font-black">Release Payout</h4>
                                <p className="text-[10px] opacity-70 mt-1 leading-normal">Release 100% of secure funds to Merchant. Validates shipping compliance.</p>
                              </button>

                              <button
                                onClick={() => setDecisionType('REFUND_BUYER')}
                                className={`p-4 border rounded-xl text-left transition ${decisionType === 'REFUND_BUYER' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'}`}
                              >
                                <Scale className="text-emerald-500 mb-2" size={18} />
                                <h4 className="text-xs font-black">Refund Buyer</h4>
                                <p className="text-[10px] opacity-70 mt-1 leading-normal">Refund 100% of secure funds to Buyer. Validates non-delivery or damage.</p>
                              </button>

                              <button
                                onClick={() => setDecisionType('PARTIAL_SPLIT')}
                                className={`p-4 border rounded-xl text-left transition ${decisionType === 'PARTIAL_SPLIT' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'}`}
                              >
                                <Sliders className="text-amber-500 mb-2" size={18} />
                                <h4 className="text-xs font-black">Partial Split</h4>
                                <p className="text-[10px] opacity-70 mt-1 leading-normal">Split payout percentages. Resolves minor defects or partial losses.</p>
                              </button>

                            </div>

                            {/* Dynamic Partial split sliders */}
                            {decisionType === 'PARTIAL_SPLIT' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                              >
                                <div className="flex justify-between text-xs font-bold text-slate-900">
                                  <span>Buyer Refund: {buyerPercentage}%</span>
                                  <span>Merchant Paid: {merchantPercentage}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="99"
                                  value={buyerPercentage}
                                  onChange={e => setBuyerPercentage(Number(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                />
                                <div className="grid grid-cols-2 gap-4 text-center text-xs">
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                                    <p className="text-[10px] font-bold text-slate-800">BUYER RECEIVES</p>
                                    <p className="text-sm font-black text-emerald-600">
                                      NGN {((selectedDispute.evidence?.shipmentInfo?.codAmount || 15000) * buyerPercentage) / 100}
                                    </p>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                                    <p className="text-[10px] font-bold text-slate-800 font-sans">MERCHANT RECEIVES</p>
                                    <p className="text-sm font-black text-slate-800">
                                      NGN {((selectedDispute.evidence?.shipmentInfo?.codAmount || 15000) * merchantPercentage) / 100}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* Payout Justification Textarea */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                Decision Justification Statement <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={resolutionText}
                                onChange={e => setResolutionText(e.target.value)}
                                placeholder="State the forensic grounds for your decision (required)..."
                                className="w-full p-3 border border-slate-200 rounded-2xl text-xs min-h-[80px] focus:outline-none focus:ring-1 focus:ring-slate-300"
                                required
                              />
                            </div>

                            <button
                              onClick={handleExecuteResolution}
                              disabled={executingDecision || !resolutionText.trim()}
                              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-md"
                            >
                              {executingDecision ? (
                                <>
                                  <RefreshCw size={15} className="animate-spin" />
                                  Executing Wallet Transfer...
                                </>
                              ) : (
                                <>
                                  <Scale size={15} />
                                  Execute Payout Resolution
                                </>
                              )}
                            </button>

                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Investigator Footer / Audit Snapshot */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-900 font-sans">
                    <span>Audit Officer: {currentUserName}</span>
                    <span className="flex items-center gap-1 font-mono uppercase">
                      <ShieldCheck size={12} className="text-emerald-500" /> Authorized Forensic Station
                    </span>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
