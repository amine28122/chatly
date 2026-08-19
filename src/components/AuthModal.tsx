import React, { useState } from 'react';
import { X, Bot, Mail, Lock, User as UserIcon, Sparkles, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('jaafarirayan98@gmail.com');
  const [password, setPassword] = useState('admin123');
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
        throw new Error(data.error || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-4 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-600/25">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              تسجيل الدخول إلى المنصة
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              لوحة تحكم الوكالة وبوابات الشركات والعملاء
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-2 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Quick Preset Selector for Testing */}
          <div className="bg-zinc-950 p-2 rounded-2xl border border-zinc-800/80 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold px-2 uppercase tracking-wider block">
              تجربة سريعة بنقرة واحدة (Quick Role Fill):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('jaafarirayan98@gmail.com', 'admin123')}
                className="py-1.5 px-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 rounded-xl text-[11px] font-bold text-indigo-300 flex items-center justify-center gap-1 transition-all"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>لوحة صاحب الوكالة (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('client@auramaison.com', 'aura2026')}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[11px] font-bold text-zinc-300 flex items-center justify-center gap-1 transition-all"
              >
                <Building2 className="w-3 h-3 text-amber-400" />
                <span>لوحة العميل (Client)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">البريد الإلكتروني (Email)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@agency.com أو client@company.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">كلمة السر (Password)</label>
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
              {loading ? 'جارٍ تسجيل الدخول...' : 'دخول إلى لوحة التحكم'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
