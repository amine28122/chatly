import React, { useState } from 'react';
import { X, Bot, Mail, Lock, Sparkles, ShieldCheck, Building2, Eye } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS: Array<{ label: string; note: string; email: string; password: string; icon: 'admin' | 'viewer' | 'client' }> = [
  { label: 'Admin', note: 'Full control', email: 'admin@agency.com', password: 'admin123', icon: 'admin' },
  { label: 'Viewer', note: 'Read-only', email: 'viewer@agency.com', password: 'viewer123', icon: 'viewer' },
  { label: 'Client', note: 'Client portal', email: 'client@auramaison.com', password: 'aura2026', icon: 'client' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#0c0d14] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-4 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-600/25">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Sign in to BotCraft AI</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Agency dashboard, client portals, and role-based access
            </p>
          </div>
        </div>

        <div className="p-8 pt-2 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="bg-zinc-950 p-2 rounded-2xl border border-zinc-800/80 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold px-2 uppercase tracking-wider block">
              One-click demo roles
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.password)}
                  className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[11px] font-bold text-zinc-300 flex flex-col items-center justify-center gap-0.5 transition-all"
                >
                  {acc.icon === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  ) : acc.icon === 'viewer' ? (
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{acc.label}</span>
                  <span className="text-[9px] font-medium text-zinc-500">{acc.note}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in to Dashboard'}
            </button>
          </form>

          <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
            Passwords are securely hashed — they are never stored or returned in plain text.
          </p>
        </div>
      </div>
    </div>
  );
};