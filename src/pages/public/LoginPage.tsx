import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Package, Mail, Lock, ArrowRight, Loader2, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { userEngine } from '../../engines';
import { ROLE_REDIRECTS } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { LiveFaceScanModal } from '../../components/common/LiveFaceScanModal';
import { User } from '../../types';
import { HeroCarousel } from '../../components/public/HeroCarousel';

export const LoginPage: React.FC = () => {
  const { bootstrapNeeded } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [faceScanModalOpen, setFaceScanModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingRedirectPath, setPendingRedirectPath] = useState<string>('/dashboard');

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || null;

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('wesabi_device_id');
    if (!deviceId) {
      deviceId = `DEV-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
      localStorage.setItem('wesabi_device_id', deviceId);
    }
    return deviceId;
  };

  const processPostLogin = async (user: User, redirectPath: string) => {
    const deviceId = getDeviceId();
    const isKnownDevice = user.knownDevices && user.knownDevices.includes(deviceId);
    const hasApprovalRole = !!(user.requestedRole || (user.roles && user.roles.some(r => r !== 'CUSTOMER')));

    if (!isKnownDevice && hasApprovalRole) {
      setPendingUser(user);
      setPendingRedirectPath(redirectPath);
      setFaceScanModalOpen(true);
      return;
    }

    if (!user.knownDevices || !user.knownDevices.includes(deviceId)) {
      const updatedDevices = [...(user.knownDevices || []), deviceId];
      await userEngine.updateUser(user.uid || user.id, { knownDevices: updatedDevices });
    }

    navigate(redirectPath);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await userEngine.login(email, password);
      const redirectPath = from || ROLE_REDIRECTS[user.role] || '/dashboard';
      await processPostLogin(user, redirectPath);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await userEngine.signInWithGoogle();
      if (user) {
        const redirectPath = from || ROLE_REDIRECTS[user.role] || '/dashboard';
        await processPostLogin(user, redirectPath);
      } else {
        navigate('/role-selection');
      }
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled. Please try again.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <HeroCarousel showDots={false} />
        <div className="absolute inset-0 bg-slate-950/70" />
      </div>
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl text-white border-white/30 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md pt-8">
        <div className="flex justify-center">
          <div className="bg-slate-900 p-3 rounded-xl">
            <Package className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white font-sans drop-shadow">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-200 font-medium drop-shadow">
          Sign in to your WeSabiHub account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl rounded-3xl border-slate-200">
          <CardContent className="pt-6">
            {bootstrapNeeded && (
              <Alert className="border-red-100 bg-red-50/50 text-red-950 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-red-950 uppercase tracking-tight">Initialization Required</h4>
                    <p className="text-xs text-red-900 mt-0.5 font-medium">
                      No Super Administrator has been registered yet. The platform must be initialized before use.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/bootstrap')}
                      className="mt-2 text-xs font-bold text-red-600 hover:text-red-800 underline focus:outline-none block"
                    >
                      Create Initial Super Administrator &rarr;
                    </button>
                  </div>
                </div>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <Alert variant="error">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </Alert>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-900 uppercase tracking-tight">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-900" />
                  </div>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-primary-500 text-slate-950"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-tight">Password</label>
                  <Link to="/forgot-password" title="Forgot Password" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-900" />
                  </div>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-primary-500 text-slate-950"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px]">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center rounded-xl py-3 border-slate-300 hover:bg-slate-50 text-slate-950 font-bold transition-all shadow-sm"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px]">New to WeSabiHub?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/register" title="Register">
                  <Button variant="outline" className="w-full rounded-2xl py-6 border-slate-300 text-slate-950 font-bold hover:bg-slate-50 shadow-sm transition-all">
                    Create a free account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LiveFaceScanModal
        isOpen={faceScanModalOpen}
        onClose={() => setFaceScanModalOpen(false)}
        onCapture={async () => {
          if (pendingUser) {
            const deviceId = getDeviceId();
            const updatedDevices = [...(pendingUser.knownDevices || []), deviceId];
            await userEngine.updateUser(pendingUser.uid || pendingUser.id, { knownDevices: updatedDevices });
          }
          setFaceScanModalOpen(false);
          navigate(pendingRedirectPath);
        }}
      />
    </div>
  );
};
