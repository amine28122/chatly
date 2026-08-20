import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Code2, 
  Edit3, 
  Trash2, 
  Copy, 
  MonitorPlay, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Zap,
  Activity,
  ThumbsUp,
  Sliders,
  Diamond,
  Download,
  FileImage,
  Share2,
  Search,
  Filter,
  LayoutGrid,
  List,
  FolderOpen,
  Building2,
  Tag,
  Pin,
  CheckSquare,
  Square,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Clock,
  MoreVertical,
  Check,
  AlertCircle,
  Globe,
  SlidersHorizontal,
  X,
  FileText,
  Eye
} from 'lucide-react';
import { Chatbot, BotRole, EnvironmentType, BotViewMode } from '../types';

interface BotListProps {
  bots: Chatbot[];
  isAdmin?: boolean;
  canManageBot?: boolean;
  onCreateNewBot: () => void;
  onEditBot: (bot: Chatbot) => void;
  onOpenEmbed: (bot: Chatbot) => void;
  onOpenSimulator: (bot: Chatbot) => void;
  onOpenClientPreview: (bot: Chatbot) => void;
  onDuplicateBot: (bot: Chatbot) => void;
  onDeleteBot: (id: string) => void;
  onToggleActive: (id: string) => void;
  onUpdateBots?: (bots: Chatbot[]) => void;
  onOpenClientPortalAsUser?: (user: any) => void;
}

export const BotList: React.FC<BotListProps> = ({
  bots,
  isAdmin = false,
  canManageBot = true,
  onCreateNewBot,
  onEditBot,
  onOpenEmbed,
  onOpenSimulator,
  onOpenClientPreview,
  onDuplicateBot,
  onDeleteBot,
  onToggleActive,
  onUpdateBots,
  onOpenClientPortalAsUser,
}) => {
  // State for filtering, searching, and organizing
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'conversations' | 'satisfaction' | 'name' | 'client'>('updated');
  const [viewMode, setViewMode] = useState<BotViewMode>('grid');
  
  // Multi-selection state
  const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);
  const [isAssignClientModalOpen, setIsAssignClientModalOpen] = useState(false);
  const [newClientNameInput, setNewClientNameInput] = useState('');

  // Extract unique clients
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    bots.forEach(b => {
      if (b.clientName && b.clientName.trim()) {
        clients.add(b.clientName.trim());
      }
    });
    return Array.from(clients).sort();
  }, [bots]);

  // Extract unique tags
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    bots.forEach(b => {
      if (b.tags && Array.isArray(b.tags)) {
        b.tags.forEach(t => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [bots]);

  // Filtered and sorted bots
  const filteredBots = useMemo(() => {
    return bots
      .filter((bot) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = bot.name.toLowerCase().includes(q);
          const matchClient = (bot.clientName || '').toLowerCase().includes(q);
          const matchDomain = (bot.websiteUrl || '').toLowerCase().includes(q);
          const matchHeader = (bot.widgetConfig?.headerTitle || '').toLowerCase().includes(q);
          const matchTag = (bot.tags || []).some(t => t.toLowerCase().includes(q));
          if (!matchName && !matchClient && !matchDomain && !matchHeader && !matchTag) {
            return false;
          }
        }

        // Client filter
        if (selectedClient !== 'all') {
          if (selectedClient === 'unassigned') {
            if (bot.clientName && bot.clientName.trim()) return false;
          } else {
            if (bot.clientName !== selectedClient) return false;
          }
        }

        // Environment filter
        if (selectedEnvironment !== 'all') {
          if ((bot.environment || 'production') !== selectedEnvironment) return false;
        }

        // Role filter
        if (selectedRole !== 'all') {
          if (bot.role !== selectedRole) return false;
        }

        // Status filter
        if (selectedStatus === 'active' && !bot.isActive) return false;
        if (selectedStatus === 'inactive' && bot.isActive) return false;

        // Tag filter
        if (selectedTag !== 'all') {
          if (!bot.tags || !bot.tags.includes(selectedTag)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned bots stay on top unless specifically sorting
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortBy === 'conversations') {
          return b.stats.totalConversations - a.stats.totalConversations;
        }
        if (sortBy === 'satisfaction') {
          return b.stats.satisfactionRate - a.stats.satisfactionRate;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'client') {
          return (a.clientName || '').localeCompare(b.clientName || '');
        }
        // Default: updated date
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });
  }, [bots, searchQuery, selectedClient, selectedEnvironment, selectedRole, selectedStatus, selectedTag, sortBy]);

  // Grouped by client for "by_client" view
  const groupedByClient = useMemo(() => {
    const map = new Map<string, Chatbot[]>();
    filteredBots.forEach(bot => {
      const client = bot.clientName?.trim() || 'Unassigned / Direct Clients';
      if (!map.has(client)) {
        map.set(client, []);
      }
      map.get(client)!.push(bot);
    });
    return map;
  }, [filteredBots]);

  // KPIs
  const totalConversations = bots.reduce((acc, b) => acc + b.stats.totalConversations, 0);
  const avgSatisfaction = Math.round(
    bots.reduce((acc, b) => acc + b.stats.satisfactionRate, 0) / (bots.length || 1)
  );
  const activeCount = bots.filter(b => b.isActive).length;
  const productionCount = bots.filter(b => (b.environment || 'production') === 'production').length;

  // Toggle Selection
  const toggleSelectBot = (id: string) => {
    setSelectedBotIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedBotIds.length === filteredBots.length) {
      setSelectedBotIds([]);
    } else {
      setSelectedBotIds(filteredBots.map(b => b.id));
    }
  };

  // Pin Toggle
  const handleTogglePin = (bot: Chatbot) => {
    if (!onUpdateBots) return;
    const updated = bots.map(b => b.id === bot.id ? { ...b, isPinned: !b.isPinned } : b);
    onUpdateBots(updated);
  };

  // Bulk Operations
  const handleBulkActivate = () => {
    if (!onUpdateBots || selectedBotIds.length === 0) return;
    const updated = bots.map(b => selectedBotIds.includes(b.id) ? { ...b, isActive: true } : b);
    onUpdateBots(updated);
    setSelectedBotIds([]);
  };

  const handleBulkPause = () => {
    if (!onUpdateBots || selectedBotIds.length === 0) return;
    const updated = bots.map(b => selectedBotIds.includes(b.id) ? { ...b, isActive: false } : b);
    onUpdateBots(updated);
    setSelectedBotIds([]);
  };

  const handleBulkAssignClient = (clientName: string) => {
    if (!onUpdateBots || selectedBotIds.length === 0) return;
    const updated = bots.map(b => selectedBotIds.includes(b.id) ? { ...b, clientName: clientName.trim() } : b);
    onUpdateBots(updated);
    setSelectedBotIds([]);
    setIsAssignClientModalOpen(false);
    setNewClientNameInput('');
  };

  const handleBulkDelete = () => {
    if (selectedBotIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedBotIds.length} selected chatbots?`)) {
      if (onUpdateBots) {
        const updated = bots.filter(b => !selectedBotIds.includes(b.id));
        onUpdateBots(updated);
      }
      setSelectedBotIds([]);
    }
  };

  const handleBulkExportJSON = () => {
    const selectedBots = bots.filter(b => selectedBotIds.includes(b.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedBots, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chatbots-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ENTERPRISE KPI DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 backdrop-blur-md text-right">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[11px] text-emerald-400 font-semibold">{activeCount} active</span>
              <span className="text-2xl font-black text-white font-['Outfit',sans-serif]">{bots.length}</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium truncate">Total bots created</div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 backdrop-blur-md text-right">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-xl shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[11px] text-zinc-400 font-medium">Clients</span>
              <span className="text-2xl font-black text-white font-['Outfit',sans-serif]">{uniqueClients.length}</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium truncate">Client companies</div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 backdrop-blur-md text-right">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">{totalConversations.toLocaleString()}</div>
            <div className="text-xs text-zinc-400 font-medium truncate">Total visitor conversations</div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex items-center gap-4 backdrop-blur-md text-right">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[11px] text-indigo-400 font-semibold">{productionCount} live</span>
              <span className="text-2xl font-black text-white font-['Outfit',sans-serif]">{avgSatisfaction}%</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium truncate">Average client satisfaction</div>
          </div>
        </div>
      </div>

      {/* TOP COMMAND TOOLBAR: SEARCH, ADVANCED MULTI-FILTERS & VIEW SWITCHER */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3.5 backdrop-blur-md">
        
        {/* Row 1: Search & New Bot Action */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bot name, client company, website URL, or tag..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pr-10 pl-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              dir="ltr"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Create Button & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid view (visual cards)"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table view (dense management)"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'table' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('by_client')}
                title="Group by client company"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'by_client' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>

            {isAdmin && (
            <button
              id="btn-create-new-bot-top"
              onClick={onCreateNewBot}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Assistant +</span>
            </button>
          )}
          </div>
        </div>

        {/* Row 2: Comprehensive Multi-Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80 text-xs">
          
          {/* Client / Organization Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-zinc-900 text-white">All companies ({bots.length})</option>
              {uniqueClients.map((client) => {
                const count = bots.filter(b => b.clientName === client).length;
                return (
                  <option key={client} value={client} className="bg-zinc-900 text-white">
                    {client} ({count})
                  </option>
                );
              })}
              <option value="unassigned" className="bg-zinc-900 text-white">Unassigned to a company ({bots.filter(b => !b.clientName).length})</option>
            </select>
          </div>

          {/* Environment Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-zinc-900 text-white">All environments</option>
              <option value="production" className="bg-zinc-900 text-white">🟢 Production live</option>
              <option value="staging" className="bg-zinc-900 text-white">🟡 Staging test</option>
              <option value="development" className="bg-zinc-900 text-white">🔵 Development</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-zinc-900 text-white">Status: all</option>
              <option value="active" className="bg-zinc-900 text-white">Active only</option>
              <option value="inactive" className="bg-zinc-900 text-white">Paused only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-zinc-900 text-white">Business role: all</option>
              <option value="ecommerce_guide" className="bg-zinc-900 text-white">🛍️ E-commerce & sales</option>
              <option value="appointment_booking" className="bg-zinc-900 text-white">🩺 Bookings & medical</option>
              <option value="sales_lead" className="bg-zinc-900 text-white">⚡ Sales, real estate & services</option>
              <option value="customer_support" className="bg-zinc-900 text-white">🎧 Customer support</option>
              <option value="faq_assistant" className="bg-zinc-900 text-white">❓ FAQs & general info</option>
            </select>
          </div>

          {/* Tag Filter */}
          {uniqueTags.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-zinc-900 text-white">Tags: all</option>
                {uniqueTags.map(t => (
                  <option key={t} value={t} className="bg-zinc-900 text-white">#{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1.5 mr-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1 font-medium"
            >
              <option value="updated" className="bg-zinc-900 text-white">Sort: last updated</option>
              <option value="conversations" className="bg-zinc-900 text-white">Sort: most conversations</option>
              <option value="satisfaction" className="bg-zinc-900 text-white">Sort: highest satisfaction</option>
              <option value="name" className="bg-zinc-900 text-white">Sort: bot name (A-Z)</option>
              <option value="client" className="bg-zinc-900 text-white">Sort: company name (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedClient !== 'all' || selectedEnvironment !== 'all' || selectedRole !== 'all' || selectedStatus !== 'all' || selectedTag !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClient('all');
                setSelectedEnvironment('all');
                setSelectedRole('all');
                setSelectedStatus('all');
                setSelectedTag('all');
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-2 py-1 underline"
            >
              Reset filters
            </button>
          )}

        </div>
      </div>

      {/* BATCH / BULK ACTION FLOATING TOOLBAR (admin only) */}
      {isAdmin && selectedBotIds.length > 0 && (
        <div className="p-3 bg-indigo-950/90 border border-indigo-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
              {selectedBotIds.length} selected
            </div>
            <button
              onClick={selectAll}
              className="text-xs text-indigo-200 hover:text-white underline font-medium"
            >
              {selectedBotIds.length === filteredBots.length ? 'Deselect all' : 'Select all shown'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkActivate}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
            >
              Activate selected
            </button>
            <button
              onClick={handleBulkPause}
              className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              Pause
            </button>
            <button
              onClick={() => setIsAssignClientModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Assign to company</span>
            </button>
            <button
              onClick={handleBulkExportJSON}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete selected</span>
            </button>
            <button
              onClick={() => setSelectedBotIds([])}
              className="p-1.5 text-zinc-400 hover:text-white"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FILTER RESULTS SUMMARY */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Showing <strong className="text-white font-bold">{filteredBots.length}</strong> of {bots.length} bots
          {selectedClient !== 'all' && <span> for client <strong>{selectedClient}</strong></span>}
        </span>
        {filteredBots.length > 0 && (
          <button
            onClick={selectAll}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 font-medium"
          >
            {selectedBotIds.length === filteredBots.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>Select all</span>
          </button>
        )}
      </div>

      {/* VIEW 1: MODERN GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBots.map((bot) => {
            const isSelected = selectedBotIds.includes(bot.id);
            const env = bot.environment || 'production';
            const envLabel = env === 'production' ? 'Live' : env === 'staging' ? 'Staging test' : 'In development';

            return (
              <div
                key={bot.id}
                className={`bg-zinc-900/80 border rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group relative overflow-hidden backdrop-blur-md ${
                  isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                    : bot.isPinned 
                      ? 'border-indigo-500/40 hover:border-indigo-500/70' 
                      : 'border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* Luminous corner ambient accent */}
                <div
                  className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-15 pointer-events-none"
                  style={{ backgroundColor: bot.widgetConfig?.primaryColor || '#6366f1' }}
                />

                <div>
                  {/* Top Row: Company Badge, Environment & Pin/Select */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelectBot(bot.id)}
                        className="text-zinc-400 hover:text-white shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                        )}
                      </button>

                      {/* Company Name Badge */}
                      <span className="text-[11px] font-bold text-zinc-300 bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 rounded-lg truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{bot.clientName || 'Direct client'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Environment tag */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        env === 'production' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : env === 'staging'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {envLabel}
                      </span>

                      {/* Pin button */}
                      <button
                        onClick={() => handleTogglePin(bot)}
                        title={bot.isPinned ? 'Unpin' : 'Pin to top'}
                        className={`p-1 rounded-lg transition-colors ${
                          bot.isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Header: Avatar, Name, Domain */}
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 overflow-hidden relative shrink-0"
                      style={{ backgroundColor: `${bot.widgetConfig?.primaryColor || '#6366f1'}22` }}
                    >
                      {bot.widgetConfig?.avatarType === 'image' && bot.widgetConfig?.avatarUrl ? (
                        <img
                          src={bot.widgetConfig.avatarUrl}
                          alt={bot.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{bot.avatar || '🤖'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors line-clamp-1 font-['Outfit',sans-serif]">
                        {bot.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 justify-start" dir="ltr">
                        <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-[11px] text-zinc-400 line-clamp-1 font-mono">
                          {bot.websiteUrl || 'No URL set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Account Info strip if present */}
                  {bot.clientEmail && (
                    <div className="p-2 bg-indigo-950/40 border border-indigo-500/20 rounded-xl mb-3 flex items-center justify-between text-[11px] text-right">
                      <span className="text-zinc-400">Client login account:</span>
                      <span className="font-mono text-indigo-300 font-semibold truncate max-w-[170px]" dir="ltr">
                        {bot.clientEmail}
                      </span>
                    </div>
                  )}

                  {/* Widget Header Display Name preview */}
                  <div className="p-2 bg-zinc-950/70 border border-zinc-800/80 rounded-xl mb-3 flex items-center justify-between text-[11px] text-right">
                    <span className="text-zinc-400">Chat window title:</span>
                    <span className="font-bold text-indigo-300 truncate max-w-[170px]">
                      {bot.widgetConfig?.headerTitle || bot.name}
                    </span>
                  </div>

                  {/* Tags */}
                  {bot.tags && bot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {bot.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                      {bot.tags.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                          +{bot.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-950/90 rounded-2xl border border-zinc-800/60 mb-4 text-center">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">
                        {bot.stats.totalConversations.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-400">Conversations</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {bot.stats.satisfactionRate}%
                      </div>
                      <div className="text-[10px] text-zinc-400">Satisfaction</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-300 font-mono">
                        {bot.stats.avgResponseTimeMs}ms
                      </div>
                      <div className="text-[10px] text-zinc-400">Response speed</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
                  {/* Status Toggle (clients can manage their own bot; viewers are read-only) */}
                  {canManageBot && (
                    <button
                      onClick={() => onToggleActive(bot.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        bot.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${bot.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                      <span>{bot.isActive ? 'Active' : 'Paused'}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {/* Direct Client Portal Button (admin only) */}
                    {isAdmin && onOpenClientPortalAsUser && (
                      <button
                        onClick={() => {
                          const clean = (bot.clientName || bot.name).trim();
                          const slug = clean.toLowerCase().replace(/[^a-z0-9]/g, '') || `client${Date.now()}`;
                          onOpenClientPortalAsUser({
                            id: `user-client-${bot.id}`,
                            email: bot.clientEmail || `client@${slug.slice(0, 15)}.com`,
                            name: clean,
                            companyName: clean,
                            role: 'client',
                            assignedBotIds: [bot.id],
                          });
                        }}
                        title={`Open client portal for (${bot.clientName || bot.name})`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-xs"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Client portal</span>
                      </button>
                    )}

                    {/* Edit in Studio (clients can edit their own bot) */}
                    {canManageBot && (
                    <button
                      onClick={() => onEditBot(bot)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    )}

                    {/* Simulator Button */}
                    <button
                      onClick={() => onOpenSimulator(bot)}
                      title="Test in website simulator"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <MonitorPlay className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Demo Link */}
                    <a
                      href={`${window.location.origin}/?demo=${bot.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open live bot demo link"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-indigo-300 hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>

                    {/* Embed Code Button */}
                    <button
                      onClick={() => onOpenEmbed(bot)}
                      title="Get embed code"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Client Pitch Share */}
                    <button
                      onClick={() => onOpenClientPreview(bot)}
                      title="Open client pitch & share card"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate (admin only) */}
                    {isAdmin && (
                    <button
                      onClick={() => onDuplicateBot(bot)}
                      title="Duplicate bot"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    )}

                    {/* Delete (admin only) */}
                    {isAdmin && (
                    <button
                      onClick={() => onDeleteBot(bot.id)}
                      title="Delete bot"
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: HIGH-DENSITY TABLE VIEW (FOR 100+ BOTS MANAGEMENT) */}
      {viewMode === 'table' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-semibold">
                  <th className="py-3 px-4 w-10 text-center">
                    <button onClick={selectAll} className="text-zinc-400 hover:text-white">
                      {selectedBotIds.length === filteredBots.length && filteredBots.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Assistant & window name</th>
                  <th className="py-3 px-4">Client company</th>
                  <th className="py-3 px-4">Website / domain</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Conversations</th>
                  <th className="py-3 px-4">Satisfaction</th>
                  <th className="py-3 px-4">Response time</th>
                  <th className="py-3 px-4 text-left">Quick actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredBots.map((bot) => {
                  const isSelected = selectedBotIds.includes(bot.id);
                  const env = bot.environment || 'production';
                  const envLabel = env === 'production' ? 'Production' : env === 'staging' ? 'Staging' : 'Development';

                  return (
                    <tr 
                      key={bot.id}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleSelectBot(bot.id)}
                          className="text-zinc-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600" />
                          )}
                        </button>
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-inner border border-white/10 overflow-hidden relative shrink-0"
                            style={{ backgroundColor: `${bot.widgetConfig?.primaryColor || '#6366f1'}22` }}
                          >
                            {bot.widgetConfig?.avatarType === 'image' && bot.widgetConfig?.avatarUrl ? (
                              <img src={bot.widgetConfig.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{bot.avatar || '🤖'}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{bot.name}</span>
                              {bot.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </div>
                            <div className="text-[11px] text-indigo-300 font-medium">
                              Title: {bot.widgetConfig?.headerTitle || bot.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Client Organization */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-300 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          <span>{bot.clientName || 'Direct client'}</span>
                        </span>
                      </td>

                      {/* Domain */}
                      <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]" dir="ltr">
                        {bot.websiteUrl ? (
                          <a 
                            href={bot.websiteUrl.startsWith('http') ? bot.websiteUrl : `https://${bot.websiteUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="hover:text-indigo-400 flex items-center gap-1 justify-end"
                          >
                            <span className="truncate max-w-[140px]">{bot.websiteUrl.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Environment */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          env === 'production' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : env === 'staging'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {envLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {canManageBot && (
                        <button
                          onClick={() => onToggleActive(bot.id)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            bot.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${bot.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                          <span>{bot.isActive ? 'Active' : 'Paused'}</span>
                        </button>
                        )}
                      </td>

                      {/* Stats */}
                      <td className="py-3 px-4 font-mono text-white font-bold">
                        {bot.stats.totalConversations.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                        {bot.stats.satisfactionRate}%
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300">
                        {bot.stats.avgResponseTimeMs}ms
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenSimulator(bot)}
                            title="Website simulator"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          >
                            <MonitorPlay className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEmbed(bot)}
                            title="Embed code"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                          <button
                            onClick={() => onDuplicateBot(bot)}
                            title="Duplicate"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          )}
                          {canManageBot && (
                          <button
                            onClick={() => onEditBot(bot)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                          >
                            Edit
                          </button>
                          )}
                          {isAdmin && (
                          <button
                            onClick={() => onDeleteBot(bot.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: GROUPED BY COMPANY / CLIENT FOLDERS VIEW */}
      {viewMode === 'by_client' && (
        <div className="space-y-6">
          {Array.from(groupedByClient.entries()).map(([clientName, clientBots]) => {
            const clientTotalChats = clientBots.reduce((acc, b) => acc + b.stats.totalConversations, 0);
            const clientAvgSat = Math.round(clientBots.reduce((acc, b) => acc + b.stats.satisfactionRate, 0) / clientBots.length);
            
            return (
              <div 
                key={clientName}
                className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md"
              >
                {/* Client Folder Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base font-['Outfit',sans-serif]">
                          {clientName}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                          {clientBots.length} bots
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Client workspace • {clientTotalChats.toLocaleString()} total conversations • {clientAvgSat}% satisfaction
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                  <button
                    onClick={() => {
                      onCreateNewBot();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add a new bot for this company</span>
                  </button>
                  )}
                </div>

                {/* Sub-grid of bots for this client */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {clientBots.map((bot) => (
                    <div 
                      key={bot.id}
                      className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner border border-white/10 overflow-hidden shrink-0"
                              style={{ backgroundColor: `${bot.widgetConfig?.primaryColor || '#6366f1'}22` }}
                            >
                              {bot.widgetConfig?.avatarType === 'image' && bot.widgetConfig?.avatarUrl ? (
                                <img src={bot.widgetConfig.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{bot.avatar || '🤖'}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-xs line-clamp-1">{bot.name}</h4>
                              <span className="text-[10px] text-zinc-400 font-mono truncate block max-w-[150px]" dir="ltr">
                                {bot.websiteUrl || 'No link'}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            (bot.environment || 'production') === 'production'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {(bot.environment || 'production') === 'production' ? 'Production' : 'Staging'}
                          </span>
                        </div>

                        <div className="text-[11px] text-indigo-300 font-medium mb-3">
                          Title: {bot.widgetConfig?.headerTitle || bot.name}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900 text-xs">
                        <span className="font-mono text-zinc-400 text-[11px]">
                          {bot.stats.totalConversations} conversations
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenSimulator(bot)}
                            title="Website simulator"
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            <MonitorPlay className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onOpenEmbed(bot)}
                            title="Embed code"
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            <Code2 className="w-3 h-3" />
                          </button>
                          {canManageBot && (
                          <button
                            onClick={() => onEditBot(bot)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                          >
                            Edit
                          </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ASSIGN CLIENT / COMPANY TO SELECTED BOTS */}
      {isAssignClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base font-['Outfit',sans-serif] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>Assign Company / Client</span>
              </h3>
              <button
                onClick={() => setIsAssignClientModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Assign <strong className="text-white">{selectedBotIds.length}</strong> bots to a registered client company, or create a new one:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Choose from existing companies
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {uniqueClients.map((client) => (
                    <button
                      key={client}
                      type="button"
                      onClick={() => handleBulkAssignClient(client)}
                      className="w-full text-right px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-colors flex items-center justify-between"
                    >
                      <span>{client}</span>
                      <span className="text-[10px] text-zinc-500">
                        {bots.filter(b => b.clientName === client).length} bots
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Or enter a new client company name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newClientNameInput}
                    onChange={(e) => setNewClientNameInput(e.target.value)}
                    placeholder="e.g. Elite Real Estate Development"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  />
                  <button
                    type="button"
                    disabled={!newClientNameInput.trim()}
                    onClick={() => handleBulkAssignClient(newClientNameInput)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
