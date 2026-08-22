import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { userEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      import('@/src/services/authService').then(({ authService }) => {
        authService.hasPassword().then(setHasPassword);
      });
    }
  }, [isOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await userEngine.changePassword(user.id, currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Verify current password.');
      toast.error('Password update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await userEngine.requestPasswordReset(user.email);
      toast.success('Password reset email sent.');
      onClose();
    } catch (error) {
      toast.error('Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasPassword ? "Security & Password" : "Set Local Password"}
      description={hasPassword
        ? "Protect your account by regularly updating your password."
        : "Create a local password for your account to login without Google in the future."
      }
    >
      <div className="space-y-6 pt-2">
        {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                {error}
            </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          {hasPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
              <Input
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Confirm New</label>
              <Input
                type="password"
                placeholder="Confirm new"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 h-11 rounded-xl">
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Update Password'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">OR</span></div>
            </div>

            <button
              type="button"
              onClick={handleResetRequest}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 text-center transition"
            >
                Forgot current password? Send me a reset link instead.
            </button>
          </div>
        </form>

        <div className="p-4 bg-slate-50 rounded-xl flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
            <p className="text-[10px] text-slate-500 leading-relaxed">
                Changing your password will re-authenticate your session. Make sure you use a strong, unique password not used elsewhere.
            </p>
        </div>
      </div>
    </Modal>
  );
};
