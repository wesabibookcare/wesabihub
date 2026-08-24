import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  ShoppingBag,
  MapPin,
  Users,
  Truck,
  Code,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface RoleInfo {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
  approvalStatus: 'IMMEDIATE' | 'REQUIRED' | 'APPLICATION';
  responsibilities: string[];
  benefits: string[];
  learnMore: {
    capabilities: string[];
    process: string;
    features: string[];
  };
}

import { PUBLIC_SIGNUP_ROLES as ROLES } from '../../constants/roles';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [learningRole, setLearningRole] = useState<RoleInfo | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigate('/profile-completion', { state: { role: selectedRole } });
    }
  };

  const getStatusBadge = (status: RoleInfo['approvalStatus']) => {
    switch (status) {
      case 'IMMEDIATE':
        return <Badge variant="success" size="sm">Available Immediately</Badge>;
      case 'REQUIRED':
        return <Badge variant="warning" size="sm">Approval Required</Badge>;
      case 'APPLICATION':
        return <Badge variant="info" size="sm">Application Required</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            Step 2: Choose Your Path
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display tracking-tight">
            Join the OmorfiHub <span className="text-primary-600">Ecosystem</span>
          </h1>
          <p className="text-slate-800 dark:text-slate-300 max-w-2xl mx-auto">
            Select the role that best fits your needs. Each role unlocks specialized features and tools within the OmorfiHub platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {ROLES.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <Card
                className={cn(
                  "h-full cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-white dark:bg-slate-900",
                  selectedRole === role.id
                    ? "border-primary-600 ring-4 ring-primary-500/10 dark:bg-primary-900/5"
                    : "border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                )}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "p-3 rounded-2xl transition-all duration-300",
                      selectedRole === role.id
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300"
                    )}>
                      <role.icon size={24} />
                    </div>
                    {getStatusBadge(role.approvalStatus)}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{role.title}</h3>
                    <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed mb-4 min-h-[40px]">
                      {role.description}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6 flex-grow">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-2">Primary Responsibilities</h4>
                      <ul className="space-y-1.5">
                        {role.responsibilities.slice(0, 2).map((resp, i) => (
                          <li key={i} className="text-xs text-slate-900 dark:text-slate-300 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary-400" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-2">Main Benefits</h4>
                      <div className="flex flex-wrap gap-2">
                        {role.benefits.map((benefit, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLearningRole(role);
                      }}
                      className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1.5 group transition-colors"
                    >
                      <Info size={14} className="group-hover:scale-110 transition-transform" />
                      Learn More
                    </button>
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-primary-600 text-white rounded-full p-0.5"
                      >
                        <CheckCircle2 size={18} />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sticky Continue Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">Current Selection</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedRole ? ROLES.find(r => r.id === selectedRole)?.title : 'Please select a role to proceed'}
              </h4>
            </div>
            <Button
              size="lg"
              className="h-14 px-12 rounded-2xl text-lg bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-xl shadow-primary-600/20 w-full sm:w-auto group"
              disabled={!selectedRole}
              onClick={handleContinue}
            >
              Continue Selection
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Learn More Modal */}
      <AnimatePresence>
        {learningRole && (
          <Modal
            isOpen={!!learningRole}
            onClose={() => setLearningRole(null)}
            title={`About the ${learningRole.title} Role`}
            size="lg"
          >
            <div className="space-y-8 py-2">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-3xl border border-primary-100 dark:border-primary-800">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-primary-600 dark:text-primary-400">
                  <learningRole.icon size={32} />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Role Mission</h4>
                  <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                    {learningRole.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Key Capabilities
                  </h4>
                  <ul className="space-y-3">
                    {learningRole.learnMore.capabilities.map((cap, i) => (
                      <li key={i} className="text-sm text-slate-900 dark:text-slate-300 pl-7 relative">
                        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-primary-500" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                    <Info size={16} className="text-blue-500" />
                    Core Features
                  </h4>
                  <ul className="space-y-3">
                    {learningRole.learnMore.features.map((feature, i) => (
                      <li key={i} className="text-sm text-slate-900 dark:text-slate-300 pl-7 relative">
                        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary-500/20 border border-primary-500/40" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Clock size={18} className="text-primary-500" />
                  <h4 className="font-bold">Onboarding & Approval</h4>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                  {learningRole.learnMore.process}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-slate-200 dark:border-slate-800"
                  onClick={() => setLearningRole(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-[2] h-14 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold"
                  onClick={() => {
                    setSelectedRole(learningRole.id);
                    setLearningRole(null);
                  }}
                >
                  Apply as {learningRole.title}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
