import React from 'react';
import { 
  Bot, 
  LogOut, 
  Sparkles, 
  MonitorPlay, 
  LayoutDashboard, 
  Home, 
  Plus,
  BarChart3,
  Building2,
  Users
} from 'lucide-react';
import { User, ActiveView } from '../types';

interface NavbarProps {
  user: User | null;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onCreateNewBot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  onNavigate,
  onOpenAuth,
  onLogout,
  onCreateNewBot,
}) => {
  const isClient = user?.role === 'client';

  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-40 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate(isClient ? 'client_portal' : 'dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-['Outfit',sans-serif]">BotCraft</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                AI
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block -mt-0.5 font-medium">
              {isClient ? `لوحة العميل: ${user.companyName || user.name}` : 'منصة إدارة وتخصيص المساعدين الأذكياء'}
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800/90 text-xs font-semibold">
          {!isClient && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'dashboard' || activeView === 'bot_editor'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>لوحة التحكم والبوتات</span>
              </button>

              <button
                onClick={() => onNavigate('simulator')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'simulator'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MonitorPlay className="w-3.5 h-3.5 text-emerald-400" />
                <span>محاكي المواقع المباشر</span>
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>التحليلات والتقارير</span>
              </button>

              <button
                onClick={() => onNavigate('client_portal')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeView === 'client_portal'
                    ? 'bg-amber-600 text-white shadow-md font-bold'
                    : 'text-amber-400/90 hover:text-amber-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>معاينة لوحة العميل</span>
              </button>
            </>
          )}

          {user && isClient && (
            <button
              onClick={() => onNavigate('client_portal')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-600 text-white shadow-md font-bold"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>لوحة التحكم الخاصة بشركة ({user.companyName || user.name})</span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {!isClient && (activeView === 'dashboard' || activeView === 'bot_editor') && (
                <button
                  onClick={onCreateNewBot}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إنشاء بوت جديد</span>
                </button>
              )}

              <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 pr-3">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-500/40"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-zinc-200 block leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold tracking-wide">
                    {isClient ? 'حساب عميل مستقل' : 'مدير المنصة (Admin)'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors mr-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>دخول لوحة التحكم</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
