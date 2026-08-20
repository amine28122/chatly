import React, { useState } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Bot, 
  MonitorPlay, 
  BarChart3, 
  Settings, 
  Code2,
  Sparkles,
  FileImage,
  Globe,
  Camera,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Users,
  Building2,
  Eye
} from 'lucide-react';
import { Chatbot, User, ActiveView } from '../types';
import { BotList } from './BotList';
import { BotEditor } from './BotEditor';
import { WebsiteSimulator } from './WebsiteSimulator';
import { AnalyticsView } from './AnalyticsView';
import { EmbedModal } from './EmbedModal';
import { ClientPreviewModal } from './ClientPreviewModal';
import { ClientAccountsModal } from './ClientAccountsModal';

interface DashboardProps {
  user: User;
  bots: Chatbot[];
  activeView: ActiveView;
  selectedBot: Chatbot | null;
  onUpdateBots: (bots: Chatbot[]) => void;
  onNavigate: (view: ActiveView) => void;
  onSelectBot: (bot: Chatbot | null) => void;
  onOpenClientPortalAsUser?: (user: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  bots,
  activeView,
  selectedBot,
  onUpdateBots,
  onNavigate,
  onSelectBot,
  onOpenClientPortalAsUser,
}) => {
  const [embedModalBot, setEmbedModalBot] = useState<Chatbot | null>(null);
  const [clientPreviewBot, setClientPreviewBot] = useState<Chatbot | null>(null);
  const [isClientAccountsOpen, setIsClientAccountsOpen] = useState(false);
  const [isNewBot, setIsNewBot] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [isQuickAnalyzing, setIsQuickAnalyzing] = useState(false);
  const [quickStatus, setQuickStatus] = useState<string | null>(null);

  // Viewer accounts have read-only privileges enforced server-side too.
  const isReadOnly = user?.role === 'viewer';
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  // Instant AI Bot Generator from any website URL
  const handleQuickGenerateFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setQuickStatus('Viewer accounts are read-only — sign in as an admin to create bots.');
      return;
    }
    let clean = quickUrl.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    setIsQuickAnalyzing(true);
    setQuickStatus(`Analyzing ${clean} & generating bespoke AI concierge...`);

    try {
      const response = await fetch('/api/ai/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      });

      const data = await response.json();
      if (data.success && data.botProfile) {
        const p = data.botProfile;
        const hostClean = clean.replace(/https?:\/\//i, '').replace(/[\/\?#].*$/, '').replace(/^www\./i, '');
        const slug = hostClean.toLowerCase().replace(/[^a-z0-9]/g, '') || `client${Date.now().toString().slice(-4)}`;
        const newBot: Chatbot = {
          id: `bot-${Date.now()}`,
          name: p.name || 'AI Concierge',
          clientName: p.clientName || hostClean || 'Client Business',
          clientEmail: `client.${slug.slice(0, 10)}@gmail.com`,
          clientPassword: `${slug.slice(0, 8)}2026`,
          description: p.description || `Dedicated AI Concierge trained on ${clean}.`,
          avatar: p.avatar || '💎',
          role: p.role || 'ecommerce_guide',
          tone: p.tone || 'luxury_concierge',
          websiteUrl: clean,
          language: p.language || 'en',
          systemPrompt: p.systemPrompt || `You are the Head AI Concierge for ${clean}. Provide warm, precise answers.`,
          knowledgeBase: p.knowledgeBase || '',
          rules: p.rules || [
            'Only provide facts verified by the website catalog and policies.',
            'Never fabricate prices or false inventory claims.',
            'Maintain a respectful, sophisticated, and helpful demeanor.'
          ],
          faqs: (p.faqs && p.faqs.length > 0) ? p.faqs : [
            {
              id: `faq-${Date.now()}-1`,
              question: 'How do I contact customer support or advisors?',
              answer: `You can chat with me 24/7 or visit ${clean} for direct contact.`,
            }
          ],
          widgetConfig: {
            primaryColor: p.primaryColor || '#6366f1',
            secondaryColor: '#4338ca',
            backgroundColor: '#090a12',
            headerBgColor: '#121422',
            bubbleColor: p.primaryColor || '#6366f1',
            textColor: '#ffffff',
            theme: 'glass',
            stylePreset: 'midnight-luxury',
            position: 'bottom-right',
            launcherIcon: 'diamond',
            launcherLabel: p.launcherLabel || 'Chat with AI',
            headerTitle: p.headerTitle || p.name || 'AI Concierge',
            headerSubtitle: p.headerSubtitle || 'Instant Assistant • 24/7',
            welcomeMessage: p.welcomeMessage || `Welcome! 👋 How may I assist you today?`,
            placeholderText: 'Ask about products, pricing, or services...',
            suggestedQuestions: p.suggestedQuestions || [
              'What are your featured services or catalog?',
              'How can I get in touch with an advisor?',
            ],
            autoOpenDelaySeconds: 4,
            showBranding: true,
            avatarType: 'emoji',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            soundEnabled: true,
            glassBlur: true,
            customBadge: 'AI Active 24/7',
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            totalConversations: 0,
            totalMessages: 0,
            satisfactionRate: 100,
            resolvedQueries: 0,
            avgResponseTimeMs: 420,
          },
        };

        const updated = [newBot, ...bots];
        onUpdateBots(updated);
        onSelectBot(newBot);
        setQuickUrl('');
        setQuickStatus('Bot successfully generated!');
        setTimeout(() => {
          setQuickStatus(null);
          onNavigate('bot_editor');
        }, 1200);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      console.error(err);
      setQuickStatus('Could not auto-scrape. Creating standard bot template...');
      setTimeout(() => {
        setQuickStatus(null);
        handleCreateNewBot(clean);
      }, 1500);
    } finally {
      setIsQuickAnalyzing(false);
    }
  };

  const handleCreateNewBot = (presetUrl?: string) => {
    if (!isAdmin) return;
    const defaultSuffix = Date.now().toString().slice(-4);
    const newBot: Chatbot = {
      id: `bot-${Date.now()}`,
      name: 'Bespoke AI Concierge',
      clientName: 'New Client Business',
      clientEmail: `client.${defaultSuffix}@gmail.com`,
      clientPassword: `client${defaultSuffix}2026`,
      description: 'Sophisticated AI concierge trained to guide visitors, answer inquiries, and schedule VIP viewings.',
      avatar: '💎',
      role: 'ecommerce_guide',
      tone: 'luxury_concierge',
      websiteUrl: presetUrl || 'https://mywebsite.com',
      language: 'en',
      systemPrompt: `You are the Head Digital Concierge for our website. Greet visitors with warmth and sophistication, provide accurate catalog answers, and guide them towards solutions or appointments seamlessly.`,
      knowledgeBase: `Website Information & Store Policies:
- Business Hours: 24/7 Digital Concierge assistance.
- Service Commitment: White-glove client experience and complimentary insured worldwide delivery.`,
      faqs: [
        {
          id: `faq-${Date.now()}`,
          question: 'How do I contact your concierge or schedule a consultation?',
          answer: 'You can converse directly with this AI assistant or provide your details for private advisor confirmation.',
        },
      ],
      widgetConfig: {
        primaryColor: '#6366f1',
        secondaryColor: '#4338ca',
        backgroundColor: '#090a12',
        headerBgColor: '#121422',
        bubbleColor: '#6366f1',
        textColor: '#ffffff',
        theme: 'glass',
        stylePreset: 'midnight-luxury',
        position: 'bottom-right',
        launcherIcon: 'diamond',
        launcherLabel: 'VIP Concierge',
        headerTitle: 'AI Brand Concierge',
        headerSubtitle: 'Bespoke Inquiries & VIP Service',
        welcomeMessage: 'Welcome! 💎 How may I assist your experience today?',
        placeholderText: 'Inquire about products, pricing, or bookings...',
        suggestedQuestions: [
          'What are your featured collections and pricing?',
          'How do I book a private consultation?',
        ],
        autoOpenDelaySeconds: 4,
        showBranding: true,
        avatarType: 'emoji',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        soundEnabled: true,
        glassBlur: true,
        customBadge: 'AI Active 24/7',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        satisfactionRate: 100,
        resolvedQueries: 0,
        avgResponseTimeMs: 460,
      },
    };

    setIsNewBot(true);
    onSelectBot(newBot);
    onNavigate('bot_editor');
  };

  const handleSaveBot = async (updatedBot: Chatbot) => {
    const savedBot: Chatbot = {
      ...updatedBot,
      updatedAt: new Date().toISOString(),
    };
    const exists = bots.some((b) => b.id === savedBot.id);
    let newBotsList: Chatbot[];
    if (exists) {
      newBotsList = bots.map((b) => (b.id === savedBot.id ? savedBot : b));
    } else {
      newBotsList = [savedBot, ...bots];
    }
    onUpdateBots(newBotsList);
    onSelectBot(savedBot);
    setIsNewBot(false);

    // Save to persistent server database
    try {
      await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedBot),
      });
    } catch (e) {
      console.error('Failed to persist bot to server:', e);
    }
  };

  const handleDuplicateBot = async (botToDup: Chatbot) => {
    const duplicated: Chatbot = {
      ...botToDup,
      id: `bot-dup-${Date.now()}`,
      name: `${botToDup.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        satisfactionRate: 100,
        resolvedQueries: 0,
        avgResponseTimeMs: 480,
      },
    };
    onUpdateBots([duplicated, ...bots]);

    try {
      await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
    } catch (e) {
      console.error('Failed to persist duplicated bot:', e);
    }
  };

  const handleDeleteBot = async (id: string) => {
    if (confirm('Are you sure you want to delete this chatbot?')) {
      const remaining = bots.filter((b) => b.id !== id);
      onUpdateBots(remaining);
      if (selectedBot?.id === id) {
        onSelectBot(remaining[0] || null);
      }

      try {
        await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete bot from server:', e);
      }
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = bots.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    onUpdateBots(updated);
  };

  const handleOpenSimulator = (bot: Chatbot) => {
    onSelectBot(bot);
    onNavigate('simulator');
  };

  // If in bot editor view
  if (activeView === 'bot_editor' && selectedBot) {
    return (
      <>
        <BotEditor
          bot={selectedBot}
          isNewBot={isNewBot}
          isAdminKey={isAdmin}
          onSave={handleSaveBot}
          onCancel={() => onNavigate('dashboard')}
          onOpenSimulator={handleOpenSimulator}
          onOpenEmbed={(b) => setEmbedModalBot(b)}
          onOpenClientPreview={(b) => setClientPreviewBot(b)}
          onOpenClientPortalAsUser={onOpenClientPortalAsUser}
        />
        {embedModalBot && (
          <EmbedModal
            bot={embedModalBot}
            isOpen={true}
            onClose={() => setEmbedModalBot(null)}
            onOpenSimulator={() => {
              const b = embedModalBot;
              setEmbedModalBot(null);
              handleOpenSimulator(b);
            }}
          />
        )}
        {clientPreviewBot && (
          <ClientPreviewModal
            bot={clientPreviewBot}
            isOpen={true}
            onClose={() => setClientPreviewBot(null)}
          />
        )}
      </>
    );
  }

  // If in simulator view
  if (activeView === 'simulator') {
    const targetBot = selectedBot || bots[0];
    return (
      <>
        <WebsiteSimulator
          currentBot={targetBot}
          allBots={bots}
          onSelectBot={(b) => onSelectBot(b)}
          onBackToDashboard={() => onNavigate('dashboard')}
          onOpenClientPreview={(b) => setClientPreviewBot(b)}
        />
        {clientPreviewBot && (
          <ClientPreviewModal
            bot={clientPreviewBot}
            isOpen={true}
            onClose={() => setClientPreviewBot(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP INSTANT BOT GENERATOR HERO BANNER (admin only) */}
      {isAdmin && (
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/40 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant AI Assistant Generator</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Build a custom AI chatbot for any client website in 10 seconds
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Enter your client's website URL and the AI will analyze its product catalog, tone of voice, and brand colors — then build a complete ready-to-embed assistant.
          </p>

          {/* Quick Input Form */}
          <form onSubmit={handleQuickGenerateFromUrl} className="pt-2 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Enter client website URL (e.g. https://myshop.com)..."
                className="w-full bg-black/70 border border-zinc-800 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono text-left"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isQuickAnalyzing || !quickUrl.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isQuickAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing & generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Bot Now</span>
                </>
              )}
            </button>
          </form>

          {quickStatus && (
            <p className="text-xs text-indigo-300 font-semibold animate-fadeIn flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{quickStatus}</span>
            </p>
          )}
        </div>
      </div>
      )}

      {/* 2. SUBNAV TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold flex-wrap">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeView === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>All Bots ({bots.length})</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Analytics & Conversations</span>
          </button>

          <button
            onClick={() => {
              if (bots[0]) onSelectBot(bots[0]);
              onNavigate('simulator');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <MonitorPlay className="w-4 h-4 text-emerald-400" />
            <span>Website Simulator</span>
          </button>

          {/* Client Portals Manager Button (admin only) */}
          {isAdmin && (
            <button
              onClick={() => setIsClientAccountsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all shadow-xs"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Client Accounts & Portals</span>
            </button>
          )}

          {/* Direct Client Portal Preview (admin only) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('client_portal')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-xs"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Client Portal Preview</span>
            </button>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={() => handleCreateNewBot()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manual Bot</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeView === 'analytics' ? (
        <AnalyticsView bots={bots} />
      ) : (
        <BotList
          bots={bots}
          isAdmin={isAdmin}
          canManageBot={!isReadOnly}
          onCreateNewBot={() => handleCreateNewBot()}
          onEditBot={(b) => {
            onSelectBot(b);
            setIsNewBot(false);
            onNavigate('bot_editor');
          }}
          onOpenEmbed={(b) => setEmbedModalBot(b)}
          onOpenSimulator={handleOpenSimulator}
          onOpenClientPreview={(b) => setClientPreviewBot(b)}
          onDuplicateBot={handleDuplicateBot}
          onDeleteBot={handleDeleteBot}
          onToggleActive={handleToggleActive}
          onUpdateBots={onUpdateBots}
          onOpenClientPortalAsUser={onOpenClientPortalAsUser}
        />
      )}

      {/* Embed Code Modal */}
      {embedModalBot && (
        <EmbedModal
          bot={embedModalBot}
          isOpen={true}
          onClose={() => setEmbedModalBot(null)}
          onOpenSimulator={() => {
            const b = embedModalBot;
            setEmbedModalBot(null);
            handleOpenSimulator(b);
          }}
        />
      )}

      {/* Client Pitch Image Generator Modal */}
      {clientPreviewBot && (
        <ClientPreviewModal
          bot={clientPreviewBot}
          isOpen={true}
          onClose={() => setClientPreviewBot(null)}
        />
      )}

      {/* Client Portals & Logins Modal */}
      <ClientAccountsModal
        isOpen={isClientAccountsOpen}
        onClose={() => setIsClientAccountsOpen(false)}
        bots={bots}
        onOpenClientPortalAsUser={(clientUser) => {
          if (onOpenClientPortalAsUser) {
            onOpenClientPortalAsUser(clientUser);
          } else {
            onNavigate('client_portal');
          }
        }}
      />
    </div>
  );
};

