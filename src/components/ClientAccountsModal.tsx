import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Plus,
  Copy,
  Check,
  Building2,
  Key,
  Mail,
  Bot,
  ExternalLink,
  Trash2,
  Sparkles,
  Send,
  Eye
} from 'lucide-react';
import { Chatbot, ClientUserAccount } from '../types';

interface ClientAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bots: Chatbot[];
  onOpenClientPortalAsUser?: (user: any) => void;
}

export function ClientAccountsModal({
  isOpen,
  onClose,
  bots,
  onOpenClientPortalAsUser,
}: ClientAccountsModalProps) {
  const [users, setUsers] = useState<ClientUserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBotId, setSelectedBotId] = useState(bots[0]?.id || '');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client-users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch (e) {
      console.error('Failed to fetch client users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !name) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/client-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          companyName: companyName || name,
          email,
          password,
          assignedBotIds: [selectedBotId],
          role: 'client',
        }),
      });

      if (!res.ok) throw new Error('فشل إنشاء حساب العميل');

      // Reset form
      setName('');
      setCompanyName('');
      setEmail('');
      setPassword('');
      setIsAdding(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      await fetch(`/api/client-users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  const copyClientCard = (user: ClientUserAccount) => {
    const assignedBot = bots.find(b => user.assignedBotIds?.includes(b.id)) || bots[0];
    const demoUrl = `${window.location.origin}/?demo=${assignedBot?.id}`;
    const portalUrl = `${window.location.origin}/`;

    const text = `🎉 مرحباً ${user.name} (${user.companyName})،
تم تجهيز وتدريب روبوت الذكاء الاصطناعي الخاص بموقعكم بنجاح!

🔗 1. رابط تجربة البوت المباشر (Demo):
${demoUrl}

📊 2. رابط لوحة تحكم شركتك الخاصة (لمتابعة الرسائل وأرقام العملاء والواتساب):
${portalUrl}

🔑 بيانات الدخول الخاصة بكم:
- البريد الإلكتروني: ${user.email}
- كلمة السر: ${user.passwordHash}

فريق الدعم الفني جاهز لمساعدتكم في أي وقت!`;

    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#0c0d14] border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                إدارة حسابات وبوابات العملاء (Client Logins & Portals)
              </h2>
              <p className="text-xs text-zinc-400">
                إنشاء حسابات مخصصة لعملائك ليدخل كل عميل للوحة تحكمه بكلمة سر خاصة به.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-300">
              قائمة حسابات الشركات المسجلة ({users.filter(u => u.role === 'client').length}):
            </span>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'إلغاء' : 'إضافة حساب عميل جديد'}</span>
            </button>
          </div>

          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleCreateUser} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>إنشاء حساب دخول جديد لشركة أو عميل</span>
              </h3>

              {error && (
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">اسم الشخص المسؤول:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: د. سارة أو أحمد علي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">اسم الشركة أو المتجر:</label>
                  <input
                    type="text"
                    placeholder="مثال: AURA Maison أو متجر النخبة"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">البريد الإلكتروني للدخول:</label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">كلمة السر:</label>
                  <input
                    type="text"
                    required
                    placeholder="اختر كلمة سر سهلة للعميل"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">تعيين الشات بوت المخصص لهذا العميل:</label>
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  {bots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.clientName || 'Organization'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                >
                  حفظ وإنشاء الحساب
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="space-y-3">
            {users.filter(u => u.role === 'client').map((user) => {
              const assignedBot = bots.find(b => user.assignedBotIds?.includes(b.id));

              return (
                <div
                  key={user.id}
                  className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{user.companyName || user.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                        {user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                      <span>📧 {user.email}</span>
                      <span>🔑 {user.passwordHash}</span>
                    </div>
                    <p className="text-[11px] text-indigo-400 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      <span>البوت المعين: {assignedBot?.name || 'جميع البوتات'}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Copy Welcome Card for WhatsApp */}
                    <button
                      onClick={() => copyClientCard(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl font-bold transition-all border border-emerald-500/30"
                      title="نسخ بطاقة الدخول لإرسالها للعميل عبر واتساب"
                    >
                      {copiedId === user.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === user.id ? 'تم النسخ!' : 'نسخ بيانات العميل للواتساب'}</span>
                    </button>

                    {/* Open As Client */}
                    {onOpenClientPortalAsUser && (
                      <button
                        onClick={() => {
                          onOpenClientPortalAsUser(user);
                          onClose();
                        }}
                        className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                        title="معاينة لوحة تحكم هذا العميل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-xl transition-all"
                      title="حذف هذا الحساب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
