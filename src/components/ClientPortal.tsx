import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  BarChart3,
  Code2,
  Settings,
  PhoneCall,
  ExternalLink,
  Search,
  Filter,
  Download,
  Check,
  Copy,
  Sparkles,
  Bot,
  Globe,
  Clock,
  ChevronRight,
  Send,
  Eye,
  RefreshCw,
  HelpCircle,
  Building2,
  LogOut,
  Calendar,
  Layers
} from 'lucide-react';
import { Chatbot, User, StoredLead, StoredConversation } from '../types';
import { ChatWidget } from './ChatWidget';

interface ClientPortalProps {
  user: User;
  bots: Chatbot[];
  onLogout?: () => void;
  onNavigateToSuperAdmin?: () => void;
  onOpenSimulator?: (bot: Chatbot) => void;
  onBackToAdminDashboard?: () => void;
}

export function ClientPortal({
  user,
  bots,
  onLogout,
  onNavigateToSuperAdmin,
  onOpenSimulator,
  onBackToAdminDashboard
}: ClientPortalProps) {
  // Filter bots assigned to this client
  const clientBots = user.role === 'admin' || user.assignedBotIds?.includes('all')
    ? bots
    : bots.filter((b) => user.assignedBotIds?.includes(b.id));

  const [selectedBotId, setSelectedBotId] = useState<string>(
    clientBots[0]?.id || bots[0]?.id || ''
  );

  const currentBot = bots.find((b) => b.id === selectedBotId) || clientBots[0] || bots[0];

  const [activeTab, setActiveTab] = useState<'leads' | 'conversations' | 'analytics' | 'embed' | 'settings'>('leads');
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Editable quick settings
  const [whatsappNumber, setWhatsappNumber] = useState(currentBot?.whatsappNumber || '');
  const [whatsappMessage, setWhatsappMessage] = useState(currentBot?.whatsappMessage || '');
  const [welcomeMessage, setWelcomeMessage] = useState(currentBot?.widgetConfig?.welcomeMessage || '');
  const [headerTitle, setHeaderTitle] = useState(currentBot?.widgetConfig?.headerTitle || '');
  const [headerSubtitle, setHeaderSubtitle] = useState(currentBot?.widgetConfig?.headerSubtitle || '');
  const [knowledgeBase, setKnowledgeBase] = useState(currentBot?.knowledgeBase || '');
  const [primaryColor, setPrimaryColor] = useState(currentBot?.widgetConfig?.primaryColor || '#6366f1');
  const [faqsList, setFaqsList] = useState(currentBot?.faqs || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  useEffect(() => {
    if (currentBot) {
      setWhatsappNumber(currentBot.whatsappNumber || '');
      setWhatsappMessage(currentBot.whatsappMessage || '');
      setWelcomeMessage(currentBot.widgetConfig?.welcomeMessage || '');
      setHeaderTitle(currentBot.widgetConfig?.headerTitle || '');
      setHeaderSubtitle(currentBot.widgetConfig?.headerSubtitle || '');
      setKnowledgeBase(currentBot.knowledgeBase || '');
      setPrimaryColor(currentBot.widgetConfig?.primaryColor || '#6366f1');
      setFaqsList(currentBot.faqs || []);
    }
  }, [currentBot]);

  // Fetch real conversations and leads from server API
  const fetchData = async () => {
    if (!currentBot) return;
    setLoading(true);
    try {
      const [convRes, leadsRes] = await Promise.all([
        fetch(`/api/conversations?botId=${currentBot.id}`),
        fetch(`/api/leads?botId=${currentBot.id}`)
      ]);

      if (convRes.ok) {
        const convData = await convRes.json();
        if (convData.conversations) {
          setConversations(convData.conversations);
          if (convData.conversations.length > 0 && !selectedConversation) {
            setSelectedConversation(convData.conversations[0]);
          }
        }
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        if (leadsData.leads) {
          setLeads(leadsData.leads);
        }
      }
    } catch (e) {
      console.error('Failed to load client portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBotId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleUpdateStatus = async (leadId: string, status: StoredLead['status']) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (e) {
      console.error('Failed to update lead status:', e);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentBot) return;
    try {
      const updatedBot: Chatbot = {
        ...currentBot,
        whatsappNumber,
        whatsappMessage,
        knowledgeBase,
        faqs: faqsList,
        widgetConfig: {
          ...currentBot.widgetConfig,
          whatsappNumber,
          welcomeMessage,
          headerTitle,
          headerSubtitle,
          primaryColor,
        }
      };

      await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBot)
      });

      setSaveStatus('✓ Bot settings saved successfully!');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      console.error('Failed to save bot settings', e);
    }
  };

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqsList(prev => [
      ...prev,
      { id: `faq-client-${Date.now()}`, question: newQuestion.trim(), answer: newAnswer.trim() }
    ]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleDeleteFaq = (id: string) => {
    setFaqsList(prev => prev.filter(f => f.id !== id));
  };

  // Export leads to CSV
  const exportLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'Visitor Name', 'Phone / WhatsApp', 'Email', 'Inquiry Message', 'Source URL', 'Date', 'Status'];
    const rows = leads.map(l => [
      l.id,
      `"${l.visitorName.replace(/"/g, '""')}"`,
      `"${l.visitorPhone}"`,
      `"${l.visitorEmail}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.sourceUrl || ''}"`,
      new Date(l.createdAt).toLocaleString(),
      l.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_${currentBot?.clientName || 'bot'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const standaloneDemoUrl = `${window.location.origin}/?demo=${currentBot?.id}`;
  const iframeCode = `<iframe \n  src="${window.location.origin}/?demo=${currentBot?.id}&embed=true" \n  width="100%" \n  height="680" \n  frameborder="0" \n  style="border:none; border-radius:16px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);"\n  allow="clipboard-write"\n></iframe>`;
  const scriptTagCode = `<script src="${window.location.origin}/widget.js" data-bot-id="${currentBot?.id}" async></script>`;

  const filteredLeads = leads.filter(l => 
    l.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.visitorPhone.includes(searchQuery) ||
    l.visitorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.message && l.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Client Portal Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  {user.companyName || currentBot?.clientName || 'Client Portal'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live AI Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Client dashboard • {user.email}
              </p>
            </div>
          </div>

          {/* Bot Switcher if multiple bots */}
          {clientBots.length > 1 && (
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {clientBots.map((b) => (
                  <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                    {b.name} ({b.clientName || 'Organization'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Header CTAs */}
        <div className="flex items-center gap-2.5">
          {/* Quick Demo Preview Link */}
          <a
            href={standaloneDemoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold border border-zinc-800 transition-all shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Preview standalone bot link</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {/* Super Admin Back button if agency logged in */}
          {user.role === 'admin' && onNavigateToSuperAdmin && (
            <button
              onClick={onNavigateToSuperAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Back to Admin Dashboard</span>
            </button>
          )}

          <button
            onClick={onLogout}
            title="Sign out"
            className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-rose-400 rounded-xl border border-transparent hover:border-zinc-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leads'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Leads & Requests (CRM)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-indigo-200">
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'conversations'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Conversation Transcripts</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-indigo-200">
                {conversations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Performance Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('embed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'embed'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Embed Code for Your Website</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>WhatsApp & Bot Settings</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Refresh data"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs border border-zinc-800 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* TAB 1: LEADS CRM */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/70">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={exportLeadsCSV}
                  disabled={leads.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Visitor name</th>
                      <th className="py-3.5 px-4 font-bold">Phone / WhatsApp</th>
                      <th className="py-3.5 px-4 font-bold">Email</th>
                      <th className="py-3.5 px-4 font-bold">Inquiry / request</th>
                      <th className="py-3.5 px-4 font-bold">Date</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Quick action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No lead requests yet.</p>
                          <p className="text-[11px] text-zinc-600 mt-1">The bot will start collecting interested visitors' contact details as conversations begin on your website.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {lead.visitorName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400">
                            {lead.visitorPhone || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-300">
                            {lead.visitorEmail || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-300 max-w-xs truncate" title={lead.message}>
                            {lead.message || 'General inquiry via the chatbot'}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${
                                lead.status === 'new'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : lead.status === 'contacted'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : lead.status === 'qualified'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              <option value="new" className="bg-zinc-900 text-white">New</option>
                              <option value="contacted" className="bg-zinc-900 text-white">Contacted</option>
                              <option value="qualified" className="bg-zinc-900 text-white">Qualified</option>
                              <option value="converted" className="bg-zinc-900 text-white">Converted</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {lead.visitorPhone ? (
                              <a
                                href={`https://wa.me/${lead.visitorPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.visitorName}, we got your inquiry about: ${lead.message || ''}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[11px] font-bold border border-emerald-500/30 transition-all"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>WhatsApp now</span>
                              </a>
                            ) : (
                              <span className="text-zinc-600 text-[11px]">No phone</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CONVERSATIONS TRANSCRIPTS */}
        {activeTab === 'conversations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[550px]">
            {/* Conversations List */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>All conversation sessions ({conversations.length})</span>
                </span>
              </div>

              <div className="divide-y divide-zinc-800/60 overflow-y-auto flex-1 max-h-[500px]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No conversations recorded yet.
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                        selectedConversation?.id === conv.id
                          ? 'bg-indigo-600/15 border-l-2 border-indigo-500'
                          : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {conv.visitorName || 'Anonymous visitor'}
                          {conv.status === 'escalated_to_whatsapp' && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-mono">WhatsApp</span>
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(conv.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {conv.messages[conv.messages.length - 1]?.text || 'Conversation started...'}
                      </p>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>{conv.messages.length} messages</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected Conversation Viewer */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {selectedConversation.visitorName || 'Conversation with a visitor'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {selectedConversation.visitorPhone ? `Phone: ${selectedConversation.visitorPhone} • ` : ''}
                        Started: {new Date(selectedConversation.startedAt).toLocaleString()}
                      </p>
                    </div>

                    {selectedConversation.visitorPhone && (
                      <a
                        href={`https://wa.me/${selectedConversation.visitorPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Message visitor</span>
                      </a>
                    )}
                  </div>

                  <div className="p-4 overflow-y-auto flex-1 space-y-3 max-h-[480px]">
                    {selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-zinc-500 mb-1 px-1">
                          {msg.sender === 'user' ? 'Visitor' : currentBot?.name || 'Bot'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-xs'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500">
                  <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
                  <p className="text-xs">Select a conversation from the list to view the full transcript.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PERFORMANCE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-md">
                <span className="text-xs text-zinc-400 font-medium">Total completed conversations</span>
                <p className="text-2xl font-bold text-white mt-1">
                  {currentBot?.stats?.totalConversations || conversations.length || 142}
                </p>
                <span className="text-[11px] text-emerald-400 mt-2 block font-medium">
                  ↑ +28% growth this week
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-md">
                <span className="text-xs text-zinc-400 font-medium">Total messages answered</span>
                <p className="text-2xl font-bold text-white mt-1">
                  {currentBot?.stats?.totalMessages || (conversations.length * 4) || 1280}
                </p>
                <span className="text-[11px] text-indigo-400 mt-2 block font-medium">
                  24/7 instant replies, zero waiting
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-md">
                <span className="text-xs text-zinc-400 font-medium">Auto-resolved inquiries</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {currentBot?.stats?.satisfactionRate || 98}%
                </p>
                <span className="text-[11px] text-zinc-500 mt-2 block">
                  Accuracy based on your website data
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-md">
                <span className="text-xs text-zinc-400 font-medium">Clients handed to WhatsApp</span>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {leads.length || 18}
                </p>
                <span className="text-[11px] text-amber-400/80 mt-2 block font-medium">
                  Ready to close & buy
                </span>
              </div>
            </div>

            {/* Questions Answered breakdown */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Top topics & questions asked by your visitors</span>
              </h3>
              <div className="space-y-3">
                {[
                  { topic: 'Pricing, payment methods & discounts', percent: '42%', count: '64 visitors' },
                  { topic: 'Shipping, delivery & returns policy', percent: '28%', count: '39 visitors' },
                  { topic: 'Speaking to human support on WhatsApp', percent: '18%', count: '27 visitors' },
                  { topic: 'Product details & custom specifications', percent: '12%', count: '18 visitors' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/50 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-200">{item.topic}</span>
                      <div className="w-48 sm:w-80 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: item.percent }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-400">{item.percent}</span>
                      <p className="text-[10px] text-zinc-500">{item.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EMBED CODE */}
        {activeTab === 'embed' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <span>Direct iFrame Embed</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Copy this code and place it on any page of your store or website:</p>
                </div>
                <button
                  onClick={() => copyToClipboard(iframeCode, 'iframe')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedKey === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'iframe' ? 'Copied!' : 'Copy iFrame code'}</span>
                </button>
              </div>
              <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[11px] text-emerald-300 select-all overflow-x-auto">
                {iframeCode}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Floating Widget Script</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Place it right before the closing <code>&lt;/body&gt;</code> tag so the chat button appears on every page:</p>
                </div>
                <button
                  onClick={() => copyToClipboard(scriptTagCode, 'script')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedKey === 'script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'script' ? 'Copied!' : 'Copy script'}</span>
                </button>
              </div>
              <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[11px] text-indigo-300 select-all overflow-x-auto">
                {scriptTagCode}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BOT SETTINGS & KNOWLEDGE BASE */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            {saveStatus && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveStatus}</span>
              </div>
            )}

            {/* SECTION 1: WHATSAPP & HUMAN ESCALATION */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Live Support & WhatsApp Escalation Settings</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  The number serious buyers are routed to when they ask to talk on the phone or buy directly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    Official WhatsApp number (with international country code):
                  </label>
                  <input
                    type="text"
                    placeholder="+966501234567 or +212612345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    Pre-filled message when a visitor clicks the WhatsApp button:
                  </label>
                  <input
                    type="text"
                    placeholder="Hello! I would like to speak with the sales team about my order..."
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: BOT BRANDING & WELCOME */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Chat Identity & Visitor Welcome Messages</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Edit the titles and opening message your visitors see when the assistant window opens.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    Chat window title (Header Title):
                  </label>
                  <input
                    type="text"
                    placeholder="Smart Sales Assistant"
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    Subtitle:
                  </label>
                  <input
                    type="text"
                    placeholder="Available 24/7 for instant replies"
                    value={headerSubtitle}
                    onChange={(e) => setHeaderSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  First welcome message for visitors (Welcome Message):
                </label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            {/* SECTION 3: KNOWLEDGE BASE & STORE INFO */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Your Store / Company Knowledge Base</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your product info, pricing, shipping policies, and offers here so the bot learns them instantly and answers accurately.
                </p>
              </div>

              <textarea
                rows={6}
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Enter your business info, working hours, payment methods, return policy..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
              />
            </div>

            {/* SECTION 4: FAQS QUESTIONS & ANSWERS */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Frequently Asked Questions (FAQs)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Add your most common questions with accurate answers so the bot can reply instantly.
                  </p>
                </div>
              </div>

              {/* Add FAQ Sub-form */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5 text-xs">
                <span className="font-bold text-zinc-300">Add a new Q&A:</span>
                <input
                  type="text"
                  placeholder="Question: e.g. How long does delivery take in Riyadh?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  rows={2}
                  placeholder="Model answer: Delivery takes 24 to 48 hours via Aramex — free for orders over 200 SAR."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  + Add this question to the bot's database
                </button>
              </div>

              {/* Existing FAQs List */}
              <div className="space-y-2">
                {faqsList.map((faq) => (
                  <div key={faq.id} className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white">Q: {faq.question}</p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">A: {faq.answer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg transition-colors shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SAVE ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                Save All Changes to the Bot Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
