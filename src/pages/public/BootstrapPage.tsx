import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export const BootstrapPage: React.FC = () => {
  const { bootstrapNeeded, refreshBootstrapStatus } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // If bootstrap is disabled (a Super Admin exists), immediately redirect away
  useEffect(() => {
    if (!bootstrapNeeded) {
      const checkAgain = async () => {
        await refreshBootstrapStatus();
      };
      checkAgain();
    }
  }, [bootstrapNeeded, refreshBootstrapStatus]);

  useEffect(() => {
    if (!bootstrapNeeded && !loading && !success) {
      navigate('/login');
    }
  }, [bootstrapNeeded, navigate, loading, success]);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.bootstrapSuperAdmin(email, password, name);
      setSuccess(true);

      // Refresh bootstrap status across the app state
      await refreshBootstrapStatus();

      setTimeout(() => {
        navigate('/admin');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Bootstrap process failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="text-center py-8">
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
              </div>
              <CardTitle className="text-2xl font-bold font-sans">Super Administrator Bootstrapped!</CardTitle>
              <CardDescription className="text-sm text-slate-800">
                The initial Super Administrator account has been securely created.
                <br />
                The bootstrap process is now permanently disabled.
              </CardDescription>
              <div className="pt-4 flex justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-slate-900" />
              </div>
              <p className="text-xs text-slate-800">Redirecting to Super Admin Dashboard...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md pt-8">
        <div className="flex justify-center">
          <div className="bg-red-600 p-3 rounded-xl animate-pulse">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          System Initialization
        </h2>
        <p className="mt-2 text-center text-sm text-slate-800">
          Create the initial Super Administrator for OmorfiHub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-red-100 shadow-lg">
          <CardHeader className="bg-red-50/50 rounded-t-xl border-b border-red-100/50 pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-red-950 text-base font-bold">One-Time Bootstrap Mode</CardTitle>
                <CardDescription className="text-red-700 text-xs">
                  This page is only active when there is no Super Administrator in the system. Setting up this account secures the platform.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleBootstrap}>
              {error && (
                <Alert variant="error">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="text-sm font-medium text-red-800">{error}</span>
                  </div>
                </Alert>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-800" />
                  </div>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 rounded-xl"
                    placeholder="E.g., John Doe"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-800" />
                  </div>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-xl"
                    placeholder="wesabibookcare@gmail.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-800" />
                  </div>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-xl"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
                <p className="text-[11px] text-slate-800">Must be at least 8 characters</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-800" />
                  </div>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 rounded-xl"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Initializing Platform...
                  </>
                ) : (
                  'Create First Super Administrator'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
