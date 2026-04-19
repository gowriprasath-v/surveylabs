import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Activity, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import { register as apiRegister } from '../api/authApi';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return toast.error('Please fill in all required fields');
    }

    try {
      setLoading(true);
      if (isLogin) {
        const res = await login(username, password);
        // check requires_password_reset? 
        // the AuthContext handles user state. We can redirect to /setup if needed later, but /dashboard is default
        const searchParams = new URLSearchParams(location.search);
        const redirect = searchParams.get('redirect') || '/dashboard';
        navigate(redirect);
        toast.success(`Welcome back!`);
      } else {
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        if (password.length < 8) return toast.error('Password must be at least 8 characters');

        await apiRegister(username, password);

        await login(username, password);
        toast.success('Account created successfully!');
        navigate('/setup'); // Force wizard on new register
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err.message || 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-surface-2' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-danger' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Fair', color: 'bg-accent' };
    if (score >= 3) return { label: 'Strong', color: 'bg-success' };
    return { label: 'Good', color: 'bg-primary' };
  };

  const strength = calculateStrength(password);

  return (
    <div className="flex min-h-screen bg-base overflow-hidden">
      {/* ── LEFT PANEL (Visual 55%) ── */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-center p-16 animate-mesh-shift"
        style={{ background: 'linear-gradient(120deg, #0B1020, #0E1A33, #123456, #0B2B3C)', backgroundSize: '200% 200%' }}>

        <div className="absolute inset-0 bg-base/40 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-xl mx-auto space-y-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-[1.1]">
              Understand your audience.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">Deeply.</span>
            </h1>
            <p className="text-lg text-cyan-100/80 max-w-md leading-relaxed">
              The intelligent survey platform built for teams who demand more than just data.
            </p>
          </div>

          <div className="relative h-64 -mx-10">
            {/* Floating Card 1 */}
            <div className="absolute left-8 top-0 p-5 bg-surface/80 border border-[var(--color-border)] rounded-2xl w-64 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Activity size={16} className="text-emerald-400" />
                </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Today's Volume</div>
            </div>
            <div className="text-2xl font-bold text-white">12,847</div>
              <div className="text-xs text-emerald-400 font-medium mt-1">↑ 24% vs yesterday</div>
            </div>

            {/* Floating Card 2 */}
            <div className="absolute right-0 top-16 p-4 bg-surface/80 border border-[var(--color-border)] rounded-xl w-56 shadow-md">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Star size={12} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">4.9/5 Average</div>
              <div className="text-xs text-white/50 mt-0.5">Rated by 2,300+ teams</div>
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Form 45%) ── */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 md:p-20 relative bg-base z-10 shadow-2xl">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-text-1 font-semibold tracking-tight text-xl">SurveyLabs</span>
          </div>

          <div className="flex gap-6 mb-8 border-b border-[var(--color-border)] relative">
            <button onClick={() => setIsLogin(true)} className={`pb-3 font-semibold transition-colors ${isLogin ? 'text-text-1' : 'text-text-2 hover:text-text-1'}`}>
              Sign In
            </button>
            <button onClick={() => setIsLogin(false)} className={`pb-3 font-semibold transition-colors ${!isLogin ? 'text-text-1' : 'text-text-2 hover:text-text-1'}`}>
              Create Account
            </button>
            <div className="absolute bottom-0 h-[2px] bg-primary w-14" style={{ left: isLogin ? 0 : 80, width: isLogin ? 50 : 108 }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-text-2 mb-1.5">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text" required placeholder="name@company.com"
                    value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-text-2">Password</label>
                  {isLogin && <button type="button" onClick={() => toast.error('Password reset — contact your admin to reset credentials.')} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</button>}
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg pl-10 pr-10 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-2 hover:text-text-1 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <>
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1 text-xs font-medium">
                      <span className="text-text-2">Password strength</span>
                      <span className={strength.label ? 'text-text-1' : 'text-text-2'}>{strength.label || 'None'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden flex">
                      <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: password.length === 0 ? '0%' : strength.label === 'Weak' ? '25%' : strength.label === 'Fair' ? '50%' : strength.label === 'Good' ? '75%' : '100%' }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-2 mb-1.5 mt-2">Confirm Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" required className="rounded border-[var(--color-border)] bg-surface text-primary focus:ring-primary" />
                    <span className="text-xs text-text-2">I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a></span>
                  </div>
                </>
              )}

              {isLogin && (
                <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" className="rounded border-[var(--color-border)] bg-surface text-primary focus:ring-primary" />
                  <span className="text-xs text-text-2">Remember me for 30 days</span>
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" loading={loading} className="w-full h-11 pointer-events-auto">
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </div>
          </form>

          <div className="mt-12 text-center text-xs text-text-2/60 border-t border-white/5 pt-6">
            <p className="mb-3 uppercase tracking-widest font-semibold text-[10px]">Trusted by elite teams</p>
            <div className="flex justify-center gap-4 text-text-2/40 font-bold tracking-tighter mix-blend-screen opacity-50">
              <span className="text-sm">Vercel</span>
              <span className="text-sm">Linear</span>
              <span className="text-sm">Notion</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
