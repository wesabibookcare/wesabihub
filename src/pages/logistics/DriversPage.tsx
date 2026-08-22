import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Star,
  Phone,
  Briefcase,
  UserMinus,
  MapPin,
  QrCode,
  Download,
  Copy,
  Check,
  UserCheck,
  Building,
  IdCard,
  Mail,
  Loader2
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { DriverStatus } from '@/src/types/logistics';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { useAuth } from '@/src/context/AuthContext';
import { Invitation } from '@/src/services/InvitationService';
import { profileUpdateAuditService, ProfileChangeRecord } from '@/src/services/ProfileUpdateAuditService';


import { User, UserRole } from '@/src/types';
import { logisticsEngine, invitationEngine } from '@/src/engines';
import { userRepository } from '@/src/services/db/UserRepository';
import { toast } from 'sonner';

export const DriversPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [profileChanges, setProfileChanges] = useState<ProfileChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MANAGERS' | 'DRIVERS' | 'INVITES' | 'UPDATES'>('DRIVERS');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchTeam();
      fetchInvitations();
      fetchProfileChanges();
    }
  }, [user]);

  const fetchProfileChanges = async () => {
    if (!user?.uid) return;
    const changes = await profileUpdateAuditService.getChangesForAuthority(user.uid);
    setProfileChanges(changes);
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const company = await logisticsEngine.getCompanyByOwner(user!.uid);
      if (company) {
        const staff = await logisticsEngine.getStaff(company.id);
        setTeam(staff);
      }
    } catch (e) {
      console.error('Error fetching team:', e);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const results = await invitationEngine.getInvitationsBySender(user!.uid);
      // Filter for PENDING only if needed, or update Engine to handle it
      setInvitations(results.filter((i: any) => i.status === 'PENDING'));
    } catch (e) {
      console.error('Error fetching invitations:', e);
    }
  };

  const handleGenerateCode = async (role: UserRole) => {
    if (!user?.uid) return;
    const inv = await invitationEngine.generateInviteCode(user.uid, role);
    setGeneratedCode(inv);
    setShowCodeModal(true);
    toast.success('Invitation code generated');
    fetchInvitations();
  };

  const handleConfirmDriver = async (userId: string) => {
    try {
      await userRepository.update(userId, { status: 'ACTIVE' });
      fetchTeam();
      toast.success('Staff member confirmed successfully');
    } catch (e) {
      console.error('Error confirming driver:', e);
      toast.error('Failed to confirm staff member');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearChanges = async () => {
    try {
      await Promise.all(profileChanges.map(async (change) => {
        if (change.id) {
          await profileUpdateAuditService.markChangeAsSeen(change.id);
        }
      }));
      setProfileChanges([]);
      setActiveTab('DRIVERS');
      toast.success('All updates marked as reviewed');
    } catch (e) {
      console.error('Error clearing changes:', e);
      toast.error('Failed to clear updates');
    }
  };

  const filteredTeam = team.filter(t => {
    if (activeTab === 'MANAGERS') return t.role === 'FLEET_MANAGER';
    if (activeTab === 'DRIVERS') return t.role === 'DRIVER';
    return false;
  });

  return (
    <LogisticsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Team & Workforce</p>
            <h1 className="text-4xl font-black tracking-tight dark:text-white">Staff Management</h1>
            <p className="text-slate-900 font-medium mt-1">Manage your Fleet Managers and Drivers.</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleGenerateCode('FLEET_MANAGER')}
              className="rounded-2xl h-12 px-6 font-black bg-white text-slate-900 border border-slate-200 shadow-sm gap-2 hover:bg-slate-50"
            >
              <UserPlus size={18} />
              Invite Manager
            </Button>
            <Button
              onClick={() => handleGenerateCode('DRIVER')}
              className="rounded-2xl h-12 px-8 font-black bg-primary-600 shadow-lg shadow-primary-500/20 gap-2 text-white hover:bg-primary-700"
            >
              <Plus size={18} />
              Invite Driver
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'DRIVERS', label: 'Drivers', count: team.filter(t => t.role === 'DRIVER').length },
            { id: 'MANAGERS', label: 'Fleet Managers', count: team.filter(t => t.role === 'FLEET_MANAGER').length },
            { id: 'INVITES', label: 'Pending Invites', count: invitations.length },
            { id: 'UPDATES', label: 'Profile Updates', count: profileChanges.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary-600 text-white shadow-md"
                  : (tab.id === 'UPDATES' && tab.count > 0)
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-slate-50 text-slate-900 hover:bg-slate-100"
              )}
            >
              {tab.label}
              <Badge className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
              )}>
                {tab.count}
              </Badge>
            </button>
          ))}
        </div>

        {activeTab === 'UPDATES' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black dark:text-white">Recent Contact Updates</h3>
              {profileChanges.length > 0 && (
                <Button onClick={handleClearChanges} variant="ghost" className="text-primary-600 font-black text-xs uppercase tracking-widest">
                  Mark all as reviewed
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileChanges.map((change) => (
                <Card key={change.id} className="p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black dark:text-white">{change.userDisplayName}</p>
                      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{change.userRole.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div>
                      <p className="text-[8px] font-bold text-slate-800 uppercase tracking-widest mb-1">Old Number</p>
                      <p className="text-sm font-black text-slate-900">{change.oldValue}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1">New Number</p>
                      <p className="text-sm font-black text-emerald-600">{change.newValue}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] text-slate-800 font-medium italic">Update detected on {new Date(change.timestamp).toLocaleString()}</p>
                </Card>
              ))}
              {profileChanges.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                  <p className="text-slate-900 font-bold">No new updates to review.</p>
                  <p className="text-xs text-slate-800 mt-1">We'll notify you here when staff change their contact info.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'INVITES' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invitations.map((inv) => (
              <Card key={inv.id} className="p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-blue-50 text-blue-600 border-none rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase">
                    {inv.role.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-800">Code Generated</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-2xl font-black tracking-[0.2em] text-primary-600">{inv.code}</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(inv.code)} className="hover:bg-slate-100">
                    <Copy size={16} />
                  </Button>
                </div>
                <p className="mt-4 text-xs text-slate-900 font-medium text-center italic">Share this code with your new staff member.</p>
              </Card>
            ))}
            {invitations.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <QrCode className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-900 font-bold">No pending invitations.</p>
                <p className="text-xs text-slate-800 mt-1">Generate a code above to start onboarding.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeam.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-0 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-300">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white overflow-hidden shadow-lg shadow-indigo-500/20">
                          {member.photoURL || member.photoUrl ? (
                            <img src={member.photoURL || member.photoUrl} alt={member.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-2xl uppercase">
                              {member.displayName?.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center p-1 shadow-md">
                          <div className={cn("w-full h-full rounded-full", member.status === 'ACTIVE' ? "bg-emerald-500" : "bg-amber-400")} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={cn("rounded-full px-3 py-1 font-black text-[10px] tracking-widest uppercase",
                          member.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {member.status}
                        </Badge>
                        {member.status === 'PENDING' && (
                          <Button
                            size="sm"
                            className="h-7 rounded-full bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700"
                            onClick={() => handleConfirmDriver(member.id)}
                          >
                            Confirm Face
                          </Button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-black dark:text-white mb-1">{member.displayName}</h3>
                    <div className="flex items-center gap-3 text-slate-800">
                      <Mail size={14} />
                      <span className="text-sm font-bold truncate max-w-[200px]">{member.email}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">NIN / ID</p>
                        <span className="text-sm font-black dark:text-white">Verified</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Join Date</p>
                        <span className="text-sm font-black dark:text-white">
                          {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      className="text-[10px] font-bold text-primary-600 uppercase tracking-widest p-0 flex items-center gap-2 hover:bg-transparent"
                      onClick={() => {
                        setSelectedStaff(member);
                        setShowIdCard(true);
                      }}
                    >
                      <IdCard size={14} />
                      Download ID Card
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:text-red-500">
                        <UserMinus size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:text-primary-600">
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredTeam.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center">
                <Users className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-900 font-bold">No {activeTab.toLowerCase()} found.</p>
                <p className="text-xs text-slate-800 mt-1">Onboard staff by generating an invitation code.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Modal */}
      <AnimatePresence>
        {showCodeModal && generatedCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <UserCheck size={40} />
                </div>
                <h2 className="text-2xl font-black dark:text-white mb-2">Invitation Code</h2>
                <p className="text-slate-900 font-medium mb-8">Give this code to your new {generatedCode.role.replace('_', ' ').toLowerCase()}.</p>

                <div className="relative group">
                  <div className="text-5xl font-black tracking-[0.2em] text-primary-600 bg-slate-50 py-8 rounded-[2rem] border-2 border-dashed border-primary-100 group-hover:border-primary-300 transition-colors">
                    {generatedCode.code}
                  </div>
                  <Button
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full h-10 px-6 bg-slate-900 text-white font-black text-xs gap-2 hover:bg-slate-800"
                    onClick={() => copyToClipboard(generatedCode.code)}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                </div>

                <div className="mt-12">
                  <Button
                    onClick={() => setShowCodeModal(false)}
                    variant="outline"
                    className="w-full rounded-2xl h-12 font-black border-slate-200"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ID Card Modal */}
      <AnimatePresence>
        {showIdCard && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-2xl p-6"
            >
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white overflow-hidden shadow-2xl aspect-[3/4] flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />

                <div className="w-full flex justify-between items-center mb-8 relative z-10">
                   <div className="flex items-center gap-2">
                      <Building size={20} className="text-primary-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-left truncate max-w-[120px]">
                        {user?.companyName || 'Logistics Partner'}
                      </span>
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">WeSabiHub</div>
                </div>

                <div className="w-32 h-32 rounded-[2rem] border-4 border-white/10 overflow-hidden mb-6 relative z-10 shadow-2xl">
                   {selectedStaff.photoURL || selectedStaff.photoUrl ? (
                      <img src={selectedStaff.photoURL || selectedStaff.photoUrl} alt="Staff" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-black text-4xl">
                         {selectedStaff.displayName?.[0]}
                      </div>
                   )}
                </div>

                <div className="relative z-10 space-y-1">
                   <h2 className="text-2xl font-black tracking-tight">{selectedStaff.displayName}</h2>
                   <Badge className="bg-primary-600 text-white border-none rounded-full px-4 py-1.5 font-black text-[10px] tracking-widest uppercase">
                      {selectedStaff.role?.replace('_', ' ')}
                   </Badge>
                </div>

                <div className="mt-auto w-full grid grid-cols-1 gap-4 pt-8 border-t border-white/5 relative z-10">
                   <div className="flex flex-col items-center">
                      <QrCode size={48} className="text-white/20 mb-2" />
                      <p className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">Employee ID: {selectedStaff.uid.slice(-8).toUpperCase()}</p>
                   </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowIdCard(false)}
                  variant="outline"
                  className="rounded-2xl h-12 font-black border-slate-200"
                >
                  Close
                </Button>
                <Button
                  className="rounded-2xl h-12 font-black bg-primary-600 text-white gap-2 hover:bg-primary-700"
                  disabled={isDownloading}
                  onClick={async () => {
                    setIsDownloading(true);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    setIsDownloading(false);
                    toast.success('ID Card downloaded successfully!');
                    setShowIdCard(false);
                  }}
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LogisticsLayout>
  );
};
