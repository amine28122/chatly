import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Bot, 
  Palette, 
  BookOpen, 
  Code2, 
  Plus, 
  Trash2, 
  Check, 
  MonitorPlay,
  Diamond,
  Zap,
  HelpCircle,
  Wand2,
  Upload,
  User,
  Paintbrush,
  MessageSquare,
  Headphones,
  Eye,
  Radio,
  Layers,
  Globe,
  RefreshCw,
  FileText,
  Shield,
  FileUp,
  AlertCircle,
  CheckCircle2,
  Copy,
  Info,
  Download,
  FileImage,
  Building2,
  Tag,
  Pin,
  X,
  Mail,
  Lock,
  KeyRound,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  Chatbot, 
  BotRole, 
  ToneOfVoice, 
  WidgetStylePreset, 
  LauncherIconType, 
  LauncherShape, 
  LauncherSize, 
  LauncherEffect, 
  FAQItem,
  EnvironmentType
} from '../types';
import { ChatWidget } from './ChatWidget';

interface BotEditorProps {
  bot: Chatbot;
  isNewBot?: boolean;
  isAdminKey?: boolean;
  onSave: (updatedBot: Chatbot) => void;
  onCancel: () => void;
  onOpenSimulator: (bot: Chatbot) => void;
  onOpenEmbed: (bot: Chatbot) => void;
  onOpenClientPreview?: (bot: Chatbot) => void;
  onOpenClientPortalAsUser?: (user: any) => void;
}

export const BotEditor: React.FC<BotEditorProps> = ({
  bot,
  isNewBot = false,
  isAdminKey = false,
  onSave,
  onCancel,
  onOpenSimulator,
  onOpenEmbed,
  onOpenClientPreview,
  onOpenClientPortalAsUser,
}) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'knowledge' | 'rules' | 'widget' | 'embed'>('persona');
  const [currentBot, setCurrentBot] = useState<Chatbot>({
    ...bot,
    rules: bot.rules || [],
  });
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [newQuestionChip, setNewQuestionChip] = useState('');
  const [newCustomRule, setNewCustomRule] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showProvisionedModal, setShowProvisionedModal] = useState(false);
  const [sandboxMode, setSandboxMode] = useState<'chat_window' | 'launcher_button'>('chat_window');
  const [newTagInput, setNewTagInput] = useState('');

  // Per-bot Gemini key (admin only) state
  const [botKeyInput, setBotKeyInput] = useState('');
  const [botKeyStatus, setBotKeyStatus] = useState<boolean | null>(null);
  const [keyActionMsg, setKeyActionMsg] = useState<string | null>(null);

  // Load whether this bot already has a dedicated key (never the key value itself)
  useEffect(() => {
    if (!isAdminKey || !currentBot.id || isNewBot) {
      setBotKeyStatus(null);
      return;
    }
    fetch(`/api/bots/${encodeURIComponent(currentBot.id)}/apikey`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setBotKeyStatus(!!d.hasKey);
      })
      .catch(() => {
        setBotKeyStatus(null);
      });
  }, [isAdminKey, currentBot.id, isNewBot]);

  const handleSaveBotKey = async () => {
    if (!isAdminKey || !currentBot.id || isNewBot) return;
    setKeyActionMsg(null);
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(currentBot.id)}/apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: botKeyInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBotKeyStatus(!!data.hasKey);
        setBotKeyInput('');
        setKeyActionMsg(data.hasKey ? '✓ Dedicated key saved (used only by this bot).' : 'Key removed.');
      } else {
        setKeyActionMsg(data.error || 'Could not save the key.');
      }
      setTimeout(() => setKeyActionMsg(null), 4000);
    } catch (e) {
      setKeyActionMsg('Failed to save the key.');
      setTimeout(() => setKeyActionMsg(null), 4000);
    }
  };

  const handleRemoveBotKey = async () => {
    if (!isAdminKey || !currentBot.id) return;
    setKeyActionMsg(null);
    try {
      const res = await fetch(`/api/bots/${encodeURIComponent(currentBot.id)}/apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBotKeyStatus(false);
        setKeyActionMsg('Key removed. The bot now uses the platform master key.');
      } else {
        setKeyActionMsg(data.error || 'Could not remove the key.');
      }
      setTimeout(() => setKeyActionMsg(null), 4000);
    } catch (err) {
      setKeyActionMsg('Failed to remove the key.');
      setTimeout(() => setKeyActionMsg(null), 4000);
    }
  };

  // Sync state whenever the selected bot prop changes
  useEffect(() => {
    const slug = (bot.clientName || bot.name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    setCurrentBot({
      ...bot,
      clientEmail: bot.clientEmail || `client@${slug.slice(0, 12)}.com`,
      clientPassword: bot.clientPassword || `${slug.slice(0, 8)}2026`,
      rules: bot.rules || [],
    });
  }, [bot.id, bot.updatedAt]);

  // Curated Luxury Color Palettes that transform the entire widget
  const COLOR_PALETTES = [
    {
      id: 'midnight-luxury',
      name: 'Midnight Obsidian',
      bg: '#0a0b12',
      primary: '#6366f1',
      header: '#121422',
      bubble: '#6366f1',
      icon: '💎',
    },
    {
      id: 'emerald-concierge',
      name: 'Emerald Velvet',
      bg: '#04150f',
      primary: '#059669',
      header: '#062b1e',
      bubble: '#059669',
      icon: '🌲',
    },
    {
      id: 'royal-indigo',
      name: 'Royal Sapphire',
      bg: '#070e1c',
      primary: '#2563eb',
      header: '#0d1a33',
      bubble: '#2563eb',
      icon: '👑',
    },
    {
      id: 'cyber-violet',
      name: 'Cyber Violet',
      bg: '#0e091e',
      primary: '#8b5cf6',
      header: '#191033',
      bubble: '#8b5cf6',
      icon: '⚡',
    },
    {
      id: 'rose-gold',
      name: 'Rose Luxury',
      bg: '#180811',
      primary: '#e11d48',
      header: '#290e1f',
      bubble: '#e11d48',
      icon: '🌸',
    },
    {
      id: 'champagne-gold',
      name: 'Champagne Gold',
      bg: '#14120a',
      primary: '#d97706',
      header: '#262112',
      bubble: '#d97706',
      icon: '🍾',
    },
    {
      id: 'clean-minimal',
      name: 'Pure Snow Light',
      bg: '#ffffff',
      primary: '#0ea5e9',
      header: '#f4f4f5',
      bubble: '#0ea5e9',
      icon: '❄️',
    },
    {
      id: 'custom',
      name: 'Deep Slate Minimal',
      bg: '#0f172a',
      primary: '#38bdf8',
      header: '#1e293b',
      bubble: '#38bdf8',
      icon: '🪐',
    },
  ];

  // Curated Luxury Avatar Presets
  const AVATAR_PRESETS = [
    {
      title: 'Luxury Concierge',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    {
      title: 'Medical MD',
      url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    },
    {
      title: 'Executive Advisor',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    },
    {
      title: 'Tech Specialist',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    {
      title: 'Private Stylist',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    },
    {
      title: 'Architect Engineer',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
  ];

  // Popular Pre-Made Business Rules Presets
  const PREMADE_RULES_PRESETS = [
    {
      title: 'Strict Knowledge Base Only',
      rule: 'Answer strictly using verified facts from the knowledge base. If unmentioned, politely refer the visitor to the human team.',
      icon: '🛡️',
    },
    {
      title: 'Lead & Contact Capture',
      rule: 'Always politely ask for the visitor\'s email address or phone number before confirming bookings or custom price quotes.',
      icon: '📧',
    },
    {
      title: 'Zero Competitor Mention',
      rule: 'Never name or compare competing brands. Focus strictly on our unique features and proprietary benefits.',
      icon: '🚫',
    },
    {
      title: 'Bilingual Excellence',
      rule: 'Detect and reply fluently in the visitor\'s language (Arabic or English) with natural professional terminology.',
      icon: '🌐',
    },
    {
      title: 'Direct & Concise Output',
      rule: 'Keep replies concise and structured with bullet points. Avoid lengthy paragraphs unless requested.',
      icon: '⚡',
    },
    {
      title: 'No Unauthorized Discounts',
      rule: 'Do not offer or promise custom discounts beyond the published promotional codes in the knowledge base.',
      icon: '🔒',
    },
  ];

  const handleApplyPalette = (palette: typeof COLOR_PALETTES[0]) => {
    setCurrentBot((prev) => ({
      ...prev,
      widgetConfig: {
        ...prev.widgetConfig,
        stylePreset: palette.id as any,
        backgroundColor: palette.bg,
        primaryColor: palette.primary,
        headerBgColor: palette.header,
        bubbleColor: palette.bubble,
      },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCurrentBot((prev) => ({
          ...prev,
          widgetConfig: {
            ...prev.widgetConfig,
            avatarType: 'image',
            avatarUrl: reader.result as string,
          },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Click AI Website Analysis & Knowledge Extraction
  const handleAnalyzeWebsite = async () => {
    const targetUrl = currentBot.websiteUrl?.trim();
    if (!targetUrl) {
      alert('Please enter a website URL first.');
      return;
    }

    setIsAnalyzingWebsite(true);
    setAnalysisStatus('Crawling website pages and extracting business intelligence...');

    try {
      const res = await fetch('/api/ai/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          botRole: currentBot.role,
        }),
      });

      const raw = await res.json();
      if (raw.error) {
        throw new Error(raw.details || raw.error);
      }
      const data = raw.data || raw;

      // Convert generated FAQs to structured items
      const generatedFaqs: FAQItem[] = (data.faqs || []).map((f: any, idx: number) => ({
        id: `faq-web-${Date.now()}-${idx}`,
        question: f.question,
        answer: f.answer,
      }));

      setCurrentBot((prev) => ({
        ...prev,
        name: data.name || prev.name,
        clientName: data.clientName || prev.clientName,
        description: data.description || prev.description,
        whatsappNumber: data.whatsappNumber || prev.whatsappNumber,
        whatsappMessage: data.whatsappMessage || prev.whatsappMessage,
        enableWhatsAppHandover: Boolean(data.whatsappNumber || prev.whatsappNumber || prev.enableWhatsAppHandover),
        knowledgeBase: data.knowledgeBase ? `${data.knowledgeBase}\n\n${prev.knowledgeBase ? `=== Previous Data ===\n${prev.knowledgeBase}` : ''}`.trim() : prev.knowledgeBase,
        systemPrompt: data.systemPrompt || prev.systemPrompt,
        rules: data.rules && Array.isArray(data.rules) && data.rules.length > 0 ? Array.from(new Set([...(prev.rules || []), ...data.rules])) : prev.rules,
        faqs: [...generatedFaqs, ...prev.faqs],
        widgetConfig: {
          ...prev.widgetConfig,
          whatsappNumber: data.whatsappNumber || prev.widgetConfig.whatsappNumber || prev.whatsappNumber,
          whatsappMessage: data.whatsappMessage || prev.widgetConfig.whatsappMessage || prev.whatsappMessage,
          headerTitle: data.headerTitle || prev.widgetConfig.headerTitle,
          headerSubtitle: data.headerSubtitle || prev.widgetConfig.headerSubtitle,
          welcomeMessage: data.welcomeMessage || prev.widgetConfig.welcomeMessage,
          launcherLabel: data.launcherLabel || prev.widgetConfig.launcherLabel,
          suggestedQuestions: data.suggestedQuestions && Array.isArray(data.suggestedQuestions)
            ? data.suggestedQuestions
            : prev.widgetConfig.suggestedQuestions,
        },
      }));

      const crawledCount = data.crawledPagesCount || 1;
      setAnalysisStatus(`✓ Scanned ${crawledCount} pages — extracted knowledge base, FAQs, and contact info!`);
      setTimeout(() => setAnalysisStatus(null), 6000);
    } catch (e: any) {
      console.error('Website analysis failed:', e);
      setAnalysisStatus(`Analysis error: ${e.message || 'Could not reach website'}`);
      setTimeout(() => setAnalysisStatus(null), 5000);
    } finally {
      setIsAnalyzingWebsite(false);
    }
  };

  // Upload Document/Text into Knowledge Base
  const handleFileUploadToKnowledge = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const fileSnippet = `\n\n=== Document: ${file.name} ===\n${content.trim()}\n`;
        setCurrentBot((prev) => ({
          ...prev,
          knowledgeBase: (prev.knowledgeBase + fileSnippet).trim(),
        }));
      }
    };
    reader.readAsText(file);
  };

  // Append Quick Knowledge Section Templates
  const handleAppendKnowledgeTemplate = (type: string) => {
    let snippet = '';
    switch (type) {
      case 'pricing':
        snippet = `\n\n=== Pricing & Packages ===\n- Standard Plan: $49/mo (Includes basic features)\n- Pro Plan: $149/mo (Includes priority 24/7 support & advanced integrations)\n- Enterprise: Custom Quote (Dedicated account manager & SLA)\n`;
        break;
      case 'shipping':
        snippet = `\n\n=== Shipping & Delivery Terms ===\n- Worldwide Courier: 2-4 business days on all express orders.\n- Tracking: Real-time encrypted tracking links dispatched via SMS/Email.\n- Free Shipping: Applicable on all orders exceeding $150.\n`;
        break;
      case 'returns':
        snippet = `\n\n=== Returns & Refund Policy ===\n- 30-Day Guarantee: Full refund or exchange within 30 days of receipt.\n- Condition: Products must be in original unworn packaging.\n- Return Process: Contact concierge to generate a pre-paid return label.\n`;
        break;
      case 'hours':
        snippet = `\n\n=== Business Hours & Contact ===\n- Headquarters: Main Avenue, Suite 500, New York, NY\n- Human Support Hours: Monday - Friday, 9:00 AM - 6:00 PM EST\n- Email: support@example.com | Phone: +1 (800) 555-0199\n- AI Concierge: Operating 24/7/365 with instant responses.\n`;
        break;
      case 'promo':
        snippet = `\n\n=== Active Promotional Codes ===\n- Code 'WELCOME10': 10% off your initial booking or order.\n- Code 'VIPCONCIERGE': Complimentary gift or priority queueing.\n`;
        break;
    }

    setCurrentBot((prev) => ({
      ...prev,
      knowledgeBase: (prev.knowledgeBase + snippet).trim(),
    }));
  };

  const handleEnhancePrompt = async () => {
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName: currentBot.name,
          botRole: currentBot.role,
          currentPrompt: currentBot.systemPrompt,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setCurrentBot((prev) => ({ ...prev, systemPrompt: data.enhancedPrompt }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerateAIFAQs = async () => {
    setIsGeneratingFaqs(true);
    try {
      const res = await fetch('/api/ai/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDescription: currentBot.description || currentBot.knowledgeBase,
          botRole: currentBot.role,
        }),
      });
      const data = await res.json();
      if (data.faqs && Array.isArray(data.faqs)) {
        const newFaqs: FAQItem[] = data.faqs.map((f: any, idx: number) => ({
          id: `faq-ai-${Date.now()}-${idx}`,
          question: f.question,
          answer: f.answer,
        }));
        setCurrentBot((prev) => ({
          ...prev,
          faqs: [...prev.faqs, ...newFaqs],
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFaqs(false);
    }
  };

  const handleSave = () => {
    const slug = (currentBot.clientName || currentBot.name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    const finalBot: Chatbot = {
      ...currentBot,
      clientEmail: currentBot.clientEmail?.trim() || `client@${slug.slice(0, 12)}.com`,
      clientPassword: currentBot.clientPassword?.trim() || `${slug.slice(0, 8)}2026`,
    };
    setCurrentBot(finalBot);
    onSave(finalBot);
    setSaveSuccess(true);
    setShowProvisionedModal(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Word count & Char count calculations
  const knowledgeWords = currentBot.knowledgeBase ? currentBot.knowledgeBase.trim().split(/\s+/).filter(Boolean).length : 0;
  const knowledgeChars = currentBot.knowledgeBase?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      
      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Concierge "{currentBot.name}" saved successfully! All knowledge, rules, and customizations are updated.
            </span>
          </div>
          <span className="text-xs text-emerald-400/80 font-medium">Ready to deploy</span>
        </div>
      )}

      {/* Website Analysis Toast */}
      {analysisStatus && (
        <div className="bg-indigo-500/15 border border-indigo-500/40 p-4 rounded-2xl flex items-center justify-between text-indigo-200 animate-fadeIn">
          <div className="flex items-center gap-3">
            {isAnalyzingWebsite ? (
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-400" />
            )}
            <span className="font-semibold text-xs sm:text-sm">{analysisStatus}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-2xl transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif]">
                {isNewBot ? 'Create Bespoke AI Concierge' : `Studio: ${currentBot.name}`}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                Live Studio
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customize personality, analyze website content, set strict rules, and refine launcher styling.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onOpenClientPreview && (
            <button
              type="button"
              onClick={() => onOpenClientPreview(currentBot)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all"
              title="Download Client Pitch Mockup"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Pitch Image</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenSimulator(currentBot)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors"
          >
            <MonitorPlay className="w-4 h-4 text-emerald-400" />
            <span>Test on Host Site</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Changes Saved!' : 'Save Concierge'}</span>
          </button>
        </div>
      </div>

      {/* Studio Navigation Tabs (5 Tabs) */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'persona'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>1. Persona & AI Prompt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'knowledge'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>2. Knowledge Base & FAQs ({currentBot.faqs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>3. Strict Rules & Guardrails ({currentBot.rules?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('widget')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'widget'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Palette className="w-4 h-4 text-pink-400" />
          <span>4. Full Color & Launcher Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('embed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'embed'
              ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>5. Connect & Embed Code</span>
        </button>
      </div>

      {/* Main Studio Grid: Left Config Panel (7 cols) + Right Live Sandbox (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
          
          {/* TAB 1: PERSONA & PROMPT */}
          {activeTab === 'persona' && (
            <div className="space-y-5 text-xs">
              
              {/* SECTION: CLIENT ORGANIZATION & ENVIRONMENT METADATA */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-sm font-['Outfit',sans-serif]">Client Organization & Environment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentBot({ ...currentBot, isPinned: !currentBot.isPinned })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                        currentBot.isPinned
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${currentBot.isPinned ? 'fill-amber-400' : ''}`} />
                      <span>{currentBot.isPinned ? 'Pinned in Dashboard' : 'Pin to Top'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1.5">
                      Client / Company Name
                    </label>
                    <input
                      type="text"
                      value={currentBot.clientName || ''}
                      onChange={(e) => setCurrentBot({ ...currentBot, clientName: e.target.value })}
                      placeholder="e.g. AURA Maison Group / Apex Clinics"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1.5">
                      Deployment Environment
                    </label>
                    <select
                      value={currentBot.environment || 'production'}
                      onChange={(e) => setCurrentBot({ ...currentBot, environment: e.target.value as EnvironmentType })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      <option value="production">🟢 Production (Live on Client Website)</option>
                      <option value="staging">🟡 Staging (Pre-launch Testing)</option>
                      <option value="development">🔵 Development (Draft & R&D)</option>
                    </select>
                  </div>
                </div>

                {/* DEDICATED CLIENT PORTAL LOGIN CREDENTIALS */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-zinc-950 to-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs font-['Outfit',sans-serif]">
                        Client Portal Login Details (Gmail & Password)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Auto-isolated portal
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    On <strong>Save</strong>, a dedicated isolated client portal is auto-created so the client can log in and follow conversations, leads, and visitors for this bot only.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Client email (Gmail):</span>
                      </label>
                      <input
                        type="email"
                        value={currentBot.clientEmail || ''}
                        onChange={(e) => setCurrentBot({ ...currentBot, clientEmail: e.target.value })}
                        placeholder="client@gmail.com or info@company.com"
                        className="w-full bg-black/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Client portal password:</span>
                      </label>
                      <input
                        type="text"
                        value={currentBot.clientPassword || ''}
                        onChange={(e) => setCurrentBot({ ...currentBot, clientPassword: e.target.value })}
                        placeholder="client2026 or a custom password"
                        className="w-full bg-black/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-indigo-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    <div className="flex items-center gap-1">
                      <span>Unified client login link:</span>
                      <span className="font-mono text-zinc-200 font-bold bg-black/50 px-1.5 py-0.5 rounded border border-zinc-800">
                        {typeof window !== 'undefined' ? `${window.location.origin}/?portal=true` : '/?portal=true'}
                      </span>
                    </div>
                    {onOpenClientPortalAsUser && (
                      <button
                        type="button"
                        onClick={() => {
                          const slug = (currentBot.clientName || currentBot.name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
                          onOpenClientPortalAsUser({
                            id: `user-client-${currentBot.id}`,
                            email: currentBot.clientEmail || `client@${slug.slice(0, 12)}.com`,
                            name: currentBot.clientName || currentBot.name,
                            companyName: currentBot.clientName || currentBot.name,
                            role: 'client',
                            assignedBotIds: [currentBot.id],
                          });
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 underline underline-offset-2"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview client dashboard now</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin-only: dedicated Gemini API key for THIS bot */}
                {isAdminKey && (
                  <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-zinc-950 to-amber-950/30 border border-amber-500/25 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white text-xs">Dedicated Gemini Key (admin only)</span>
                      </div>
                      {botKeyStatus === true ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">✓ Key set</span>
                      ) : botKeyStatus === false ? (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold border border-zinc-700">Uses platform key</span>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Set a dedicated Gemini key for this bot. It is stored securely server-side and is never shown to — or editable by — the client.
                      When this bot replies to visitors, it uses exactly this key and your platform master key stays protected.
                    </p>

                    {isNewBot ? (
                      <p className="text-[11px] text-amber-300 font-semibold">Save the bot first, then return here to set its dedicated key.</p>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="password"
                          value={botKeyInput}
                          onChange={(e) => setBotKeyInput(e.target.value)}
                          placeholder="Paste the bot's Gemini API key (e.g. AIza...)"
                          className="w-full bg-black/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveBotKey}
                            disabled={!botKeyInput.trim()}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Save Key
                          </button>
                          {botKeyStatus === true && (
                            <button
                              type="button"
                              onClick={handleRemoveBotKey}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-all"
                            >
                              Remove
                            </button>
                          )}
                          {keyActionMsg && <span className="text-[11px] text-emerald-400">{keyActionMsg}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags Manager */}
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tags & Labels (for organizing 100+ bots)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {(currentBot.tags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = (currentBot.tags || []).filter((_, i) => i !== idx);
                            setCurrentBot({ ...currentBot, tags: filtered });
                          }}
                          className="text-indigo-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          e.preventDefault();
                          const val = newTagInput.trim().replace(/^#/, '');
                          if (!currentBot.tags?.includes(val)) {
                            setCurrentBot({ ...currentBot, tags: [...(currentBot.tags || []), val] });
                          }
                          setNewTagInput('');
                        }
                      }}
                      placeholder="Add tag (e.g. VIP, Shopify, Healthcare) and press Enter"
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={!newTagInput.trim()}
                      onClick={() => {
                        const val = newTagInput.trim().replace(/^#/, '');
                        if (val && !currentBot.tags?.includes(val)) {
                          setCurrentBot({ ...currentBot, tags: [...(currentBot.tags || []), val] });
                        }
                        setNewTagInput('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold text-xs"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              {/* Connected Domain & 1-Click AI Website Analysis */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-sm font-['Outfit',sans-serif]">Client Website & Instant AI Crawler</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
                    Auto-Extract Knowledge
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={currentBot.websiteUrl}
                      onChange={(e) => setCurrentBot({ ...currentBot, websiteUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeWebsite}
                    disabled={isAnalyzingWebsite || !currentBot.websiteUrl}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shrink-0 active:scale-95"
                  >
                    {isAnalyzingWebsite ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isAnalyzingWebsite ? 'Analyzing Website...' : 'Crawl & Auto-Train Knowledge'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Enter your client's website URL. Gemini AI will analyze the site, extract product catalogs, pricing, policies, FAQs, and train your concierge automatically.
                </p>
              </div>

              {/* Assistant Name & Widget Header Display Name */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-neutral-300">Assistant Internal Name</label>
                      <span className="text-[10px] text-neutral-500">Dashboard & Bot List</span>
                    </div>
                    <input
                      type="text"
                      value={currentBot.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentBot((prev) => {
                          const shouldSyncHeader = !prev.widgetConfig.headerTitle || prev.widgetConfig.headerTitle === prev.name;
                          return {
                            ...prev,
                            name: val,
                            widgetConfig: {
                              ...prev.widgetConfig,
                              headerTitle: shouldSyncHeader ? val : prev.widgetConfig.headerTitle,
                            },
                          };
                        });
                      }}
                      placeholder="e.g. AURA Haute"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Widget Header Display Name</span>
                      </label>
                      <span className="text-[10px] text-indigo-400/90 bg-indigo-500/10 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
                        Shown in Chat Header
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentBot.widgetConfig.headerTitle !== undefined ? currentBot.widgetConfig.headerTitle : currentBot.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentBot((prev) => ({
                          ...prev,
                          widgetConfig: {
                            ...prev.widgetConfig,
                            headerTitle: val,
                          },
                        }));
                      }}
                      placeholder="e.g. AURA Maison Concierge"
                      className="w-full bg-neutral-900 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1.5">
                      Widget Subtitle & Tagline
                    </label>
                    <input
                      type="text"
                      value={currentBot.widgetConfig.headerSubtitle || ''}
                      onChange={(e) =>
                        setCurrentBot((prev) => ({
                          ...prev,
                          widgetConfig: {
                            ...prev.widgetConfig,
                            headerSubtitle: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Haute Horlogerie & Fine Curations"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1.5">Primary Industry Role</label>
                    <select
                      value={currentBot.role}
                      onChange={(e) => setCurrentBot({ ...currentBot, role: e.target.value as BotRole })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      <option value="ecommerce_guide">🛍️ Luxury E-Commerce & Sizing Guide</option>
                      <option value="appointment_booking">🩺 Clinical & VIP Consultation Booking</option>
                      <option value="sales_lead">⚡ SaaS Sales & Solutions Engineer</option>
                      <option value="customer_support">🎧 24/7 Autonomous Customer Support</option>
                      <option value="faq_assistant">❓ Interactive Knowledge Base Guide</option>
                      <option value="custom">⚙️ Custom Tailored Agent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Tone of Voice</label>
                  <select
                    value={currentBot.tone}
                    onChange={(e) => setCurrentBot({ ...currentBot, tone: e.target.value as ToneOfVoice })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="luxury_concierge">💎 Ultra-Luxury & Refined Concierge</option>
                    <option value="professional_executive">👔 Professional & Executive</option>
                    <option value="tech_expert">⚡ Technical Specialist & Articulate</option>
                    <option value="friendly_approachable">🌟 Warm & Friendly</option>
                    <option value="concise_fast">⚡ Ultra-Concise & Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Primary Interaction Language</label>
                  <select
                    value={currentBot.language || 'auto'}
                    onChange={(e) => setCurrentBot({ ...currentBot, language: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="auto">🌐 Automatic Visitor Detection (Arabic & English)</option>
                    <option value="en">🇺🇸 Strict English Only</option>
                    <option value="multilingual">🌍 Global Multilingual (100+ Languages)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">Description & Role Summary</label>
                <textarea
                  rows={2}
                  value={currentBot.description}
                  onChange={(e) => setCurrentBot({ ...currentBot, description: e.target.value })}
                  placeholder="Summary of what this assistant does for visitors..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* System Prompt with AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-300">System Instruction Prompt</label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingPrompt}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isEnhancingPrompt ? 'Refining Prompt...' : 'AI Enhance Prompt'}</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={currentBot.systemPrompt}
                  onChange={(e) => setCurrentBot({ ...currentBot, systemPrompt: e.target.value })}
                  placeholder="Detailed guidelines on how the AI must behave, recommend products, and answer..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: KNOWLEDGE BASE STUDIO & FAQS */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 text-xs">
              
              {/* Top Banner: Crawl Website or Upload Document */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-neutral-950 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm font-['Outfit',sans-serif]">
                      Ingest Website & Document Knowledge
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {knowledgeWords} Words Trained
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: URL Crawl */}
                  <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Extract from URL</span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={currentBot.websiteUrl}
                        onChange={(e) => setCurrentBot({ ...currentBot, websiteUrl: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAnalyzeWebsite}
                        disabled={isAnalyzingWebsite || !currentBot.websiteUrl}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all"
                      >
                        {isAnalyzingWebsite ? '...' : 'Crawl'}
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Upload File */}
                  <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload Document (.txt, .md, .csv)</span>
                    </div>
                    <label className="flex items-center justify-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg cursor-pointer transition-colors border border-neutral-700 font-semibold text-xs">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Select File to Ingest</span>
                      <input
                        type="file"
                        accept=".txt,.md,.csv,.json,.doc,.docx"
                        onChange={handleFileUploadToKnowledge}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 1-Click Quick Section Snippets */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-300 text-xs block">
                  Quick Add Knowledge Sections:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAppendKnowledgeTemplate('pricing')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>💳</span>
                    <span>+ Pricing & Plans</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendKnowledgeTemplate('shipping')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>🚚</span>
                    <span>+ Shipping & Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendKnowledgeTemplate('returns')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>🔄</span>
                    <span>+ Returns & Refunds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendKnowledgeTemplate('hours')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>⏰</span>
                    <span>+ Working Hours & Contact</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendKnowledgeTemplate('promo')}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>🎁</span>
                    <span>+ VIP Promo Code</span>
                  </button>
                </div>
              </div>

              {/* Freeform Knowledge Base Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-300">
                    Comprehensive Knowledge Base (Markdown Supported)
                  </label>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {knowledgeChars} chars • {knowledgeWords} words
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={currentBot.knowledgeBase}
                  onChange={(e) => setCurrentBot({ ...currentBot, knowledgeBase: e.target.value })}
                  placeholder="Paste or write anything: full product specifications, customer policies, pricing tables, booking rules..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* FAQs Section */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm font-['Outfit',sans-serif]">
                      Trained FAQs ({currentBot.faqs.length})
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Visitors can browse these directly in the widget's "Instant FAQs" tab.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAIFAQs}
                    disabled={isGeneratingFaqs}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold rounded-xl transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingFaqs ? 'Generating FAQs...' : 'Generate 4 AI FAQs'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {currentBot.faqs.map((faq, idx) => (
                    <div key={faq.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">Question #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = currentBot.faqs.filter((f) => f.id !== faq.id);
                            setCurrentBot({ ...currentBot, faqs: filtered });
                          }}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = currentBot.faqs.map((f) =>
                            f.id === faq.id ? { ...f, question: e.target.value } : f
                          );
                          setCurrentBot({ ...currentBot, faqs: updated });
                        }}
                        placeholder="Question..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = currentBot.faqs.map((f) =>
                            f.id === faq.id ? { ...f, answer: e.target.value } : f
                          );
                          setCurrentBot({ ...currentBot, faqs: updated });
                        }}
                        placeholder="Answer..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newFaq: FAQItem = {
                        id: `faq-${Date.now()}`,
                        question: '',
                        answer: '',
                      };
                      setCurrentBot({ ...currentBot, faqs: [...currentBot.faqs, newFaq] });
                    }}
                    className="w-full py-3 border border-dashed border-neutral-800 hover:border-indigo-500/50 rounded-2xl text-neutral-400 hover:text-indigo-300 font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add FAQ Entry</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRICT RULES & GUARDRAILS */}
          {activeTab === 'rules' && (
            <div className="space-y-6 text-xs">
              <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-['Outfit',sans-serif]">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Strict Behavioral Rules & Guardrails</span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Rules defined here are enforced as strict constraints during live customer chats. The AI concierge will strictly adhere to these boundaries (e.g. privacy, discounts, competitor mentions, language).
                </p>
              </div>

              {/* Add Custom Rule */}
              <div className="space-y-2">
                <label className="font-semibold text-neutral-300">Add New Custom Rule</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomRule}
                    onChange={(e) => setNewCustomRule(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCustomRule.trim()) {
                        e.preventDefault();
                        setCurrentBot({
                          ...currentBot,
                          rules: [...(currentBot.rules || []), newCustomRule.trim()],
                        });
                        setNewCustomRule('');
                      }
                    }}
                    placeholder="e.g. Always ask for customer phone number before booking appointments..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCustomRule.trim()) return;
                      setCurrentBot({
                        ...currentBot,
                        rules: [...(currentBot.rules || []), newCustomRule.trim()],
                      });
                      setNewCustomRule('');
                    }}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Rule</span>
                  </button>
                </div>
              </div>

              {/* Pre-Made Popular Rules Presets */}
              <div className="space-y-2">
                <span className="font-semibold text-neutral-400 block text-[11px]">
                  1-Click Business Guardrail Presets:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PREMADE_RULES_PRESETS.map((preset, idx) => {
                    const isAlreadyAdded = currentBot.rules?.includes(preset.rule);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isAlreadyAdded) return;
                          setCurrentBot({
                            ...currentBot,
                            rules: [...(currentBot.rules || []), preset.rule],
                          });
                        }}
                        disabled={isAlreadyAdded}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isAlreadyAdded
                            ? 'bg-neutral-950 border-neutral-800 opacity-50 cursor-default'
                            : 'bg-neutral-950 border-neutral-800 hover:border-amber-500/50 hover:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-white text-xs mb-1">
                          <span>{preset.icon}</span>
                          <span>{preset.title}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2">
                          {preset.rule}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Rules List */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span>Active Guardrails ({currentBot.rules?.length || 0})</span>
                  </h4>
                  {currentBot.rules && currentBot.rules.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentBot({ ...currentBot, rules: [] })}
                      className="text-neutral-500 hover:text-rose-400 text-[11px]"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {(!currentBot.rules || currentBot.rules.length === 0) ? (
                  <div className="p-6 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-xs">
                    No active rules defined yet. Add custom rules or select presets above to enforce strict guardrails.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentBot.rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex items-start justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-neutral-200 text-xs leading-relaxed">
                            {rule}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = currentBot.rules?.filter((_, i) => i !== idx) || [];
                            setCurrentBot({ ...currentBot, rules: filtered });
                          }}
                          className="text-neutral-500 hover:text-rose-400 p-1 shrink-0"
                          title="Remove Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FULL COLOR & LAUNCHER STUDIO */}
          {activeTab === 'widget' && (
            <div className="space-y-6 text-xs">
              
              {/* SECTION: WIDGET HEADER DISPLAY NAME, SUBTITLE & BRANDING */}
              <div className="p-5 bg-neutral-950 border border-indigo-500/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm font-['Outfit',sans-serif] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Widget Header Display Name & Subtitle</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Change the name and subtitle displayed at the top of the chat window. Updates live immediately.
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold">
                    Live Header Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                      Widget Header Name (Name in chat window)
                    </label>
                    <input
                      type="text"
                      value={currentBot.widgetConfig.headerTitle !== undefined ? currentBot.widgetConfig.headerTitle : currentBot.name}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: { ...currentBot.widgetConfig, headerTitle: e.target.value },
                        })
                      }
                      placeholder="e.g. AURA Maison Concierge"
                      className="w-full bg-neutral-900 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                      Widget Subtitle & Tagline
                    </label>
                    <input
                      type="text"
                      value={currentBot.widgetConfig.headerSubtitle || ''}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: { ...currentBot.widgetConfig, headerSubtitle: e.target.value },
                        })
                      }
                      placeholder="e.g. Haute Horlogerie & Fine Curations"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                    Message Input Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={currentBot.widgetConfig.placeholderText || ''}
                    onChange={(e) =>
                      setCurrentBot({
                        ...currentBot,
                        widgetConfig: { ...currentBot.widgetConfig, placeholderText: e.target.value },
                      })
                    }
                    placeholder="e.g. Inquire about private viewings, provenance..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION A: PROFILE AVATAR PHOTO & ICON */}
              <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm font-['Outfit',sans-serif] flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Profile Avatar & Concierge Photo</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Upload your brand logo, team member portrait, or select a luxury curated preset.
                    </p>
                  </div>

                  {/* Avatar Type Toggle */}
                  <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setCurrentBot({
                        ...currentBot,
                        widgetConfig: { ...currentBot.widgetConfig, avatarType: 'image' }
                      })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentBot.widgetConfig.avatarType === 'image'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Photo Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentBot({
                        ...currentBot,
                        widgetConfig: { ...currentBot.widgetConfig, avatarType: 'emoji' }
                      })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentBot.widgetConfig.avatarType === 'emoji'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Emoji / Symbol
                    </button>
                  </div>
                </div>

                {/* Photo Image Inputs */}
                {currentBot.widgetConfig.avatarType === 'image' ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-4">
                      {/* Avatar Live Preview Ring */}
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-neutral-800">
                          <img
                            src={currentBot.widgetConfig.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-neutral-900 rounded-full" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Image URL</label>
                          <input
                            type="url"
                            value={currentBot.widgetConfig.avatarUrl}
                            onChange={(e) =>
                              setCurrentBot({
                                ...currentBot,
                                widgetConfig: { ...currentBot.widgetConfig, avatarUrl: e.target.value },
                              })
                            }
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* File Upload from Device */}
                        <div>
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-neutral-700">
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Upload Image from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Curated Presets Selection */}
                    <div>
                      <span className="block text-[11px] font-semibold text-neutral-400 mb-2">Or Choose from Curated Concierge Portraits:</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {AVATAR_PRESETS.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() =>
                              setCurrentBot({
                                ...currentBot,
                                widgetConfig: { ...currentBot.widgetConfig, avatarUrl: p.url },
                              })
                            }
                            className={`rounded-2xl overflow-hidden border p-1 cursor-pointer transition-all ${
                              currentBot.widgetConfig.avatarUrl === p.url
                                ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/40'
                                : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900'
                            }`}
                          >
                            <img
                              src={p.url}
                              alt={p.title}
                              className="w-full h-12 object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-[9px] text-center text-neutral-400 font-medium truncate mt-1">
                              {p.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={currentBot.avatar}
                      onChange={(e) => setCurrentBot({ ...currentBot, avatar: e.target.value })}
                      className="w-14 h-14 text-center text-3xl bg-neutral-900 border border-neutral-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['💎', '✨', '👑', '⚡', '🌸', '🛍️', '🩺', '🤖', '🎧'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCurrentBot({ ...currentBot, avatar: emoji })}
                          className={`w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition-all ${
                            currentBot.avatar === emoji
                              ? 'border-indigo-500 bg-neutral-800 ring-1 ring-indigo-500'
                              : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: ONE-CLICK LUXURY COLOR PALETTES */}
              <div className="space-y-3">
                <label className="font-bold text-white text-sm font-['Outfit',sans-serif] flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-pink-400" />
                  <span>One-Click Full Widget Color Presets</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => handleApplyPalette(palette)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        currentBot.widgetConfig.backgroundColor === palette.bg &&
                        currentBot.widgetConfig.primaryColor === palette.primary
                          ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-neutral-800 shadow-lg'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{palette.icon}</span>
                        <span className="font-bold text-white text-xs truncate">{palette.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: palette.bg }}
                          title="Background"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: palette.primary }}
                          title="Accent"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: palette.header }}
                          title="Header"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION C: FLOATING LAUNCHER STUDIO */}
              <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-5">
                <div>
                  <h3 className="font-bold text-white text-sm font-['Outfit',sans-serif] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Website Floating Launcher Button Customization</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Customize the floating launcher icon, shape, animation radar effects, and greeting tooltip.
                  </p>
                </div>

                {/* 1. Launcher Shape */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                    Launcher Geometry & Shape
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'pill', name: 'Luxury Pill', desc: 'Avatar + Label' },
                      { id: 'circle', name: 'Circle', desc: 'Classic Round' },
                      { id: 'squircle', name: 'Squircle', desc: 'Modern Rounded' },
                      { id: 'card', name: 'Status Card', desc: 'Active Card' },
                      { id: 'orb', name: 'Glowing Orb', desc: 'High Accent' },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() =>
                          setCurrentBot({
                            ...currentBot,
                            widgetConfig: {
                              ...currentBot.widgetConfig,
                              launcherShape: shape.id as LauncherShape,
                            },
                          })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          (currentBot.widgetConfig.launcherShape || 'pill') === shape.id
                            ? 'border-indigo-500 bg-indigo-950/40 text-white font-bold ring-1 ring-indigo-500'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs">{shape.name}</div>
                        <div className="text-[10px] opacity-75">{shape.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Launcher Icon Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                    Trigger Icon Symbol
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bot_avatar', name: 'Photo Avatar', icon: <User className="w-4 h-4 text-indigo-400" /> },
                      { id: 'sparkle', name: 'AI Sparkle', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
                      { id: 'chat_bubble', name: 'Chat Bubble', icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> },
                      { id: 'headset', name: 'VIP Headset', icon: <Headphones className="w-4 h-4 text-sky-400" /> },
                      { id: 'diamond', name: 'Diamond Gem', icon: <Diamond className="w-4 h-4 text-pink-400" /> },
                      { id: 'bolt', name: 'Fast Bolt', icon: <Zap className="w-4 h-4 text-yellow-400" /> },
                      { id: 'help', name: 'Assistance Help', icon: <HelpCircle className="w-4 h-4 text-purple-400" /> },
                    ].map((item) => {
                      const isSelected = (currentBot.widgetConfig.launcherIcon || 'bot_avatar') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setCurrentBot({
                              ...currentBot,
                              widgetConfig: {
                                ...currentBot.widgetConfig,
                                launcherIcon: item.id as LauncherIconType,
                              },
                            })
                          }
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                              : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                          }`}
                        >
                          <div className="shrink-0">{item.icon}</div>
                          <span className="font-bold text-white text-xs truncate">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Launcher Size & Visual Attention Effect */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Size */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                      Launcher Size
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'compact', name: 'Compact', desc: '48px' },
                        { id: 'standard', name: 'Standard', desc: '56px' },
                        { id: 'large', name: 'Prominent', desc: '64px' },
                      ].map((size) => (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() =>
                            setCurrentBot({
                              ...currentBot,
                              widgetConfig: {
                                ...currentBot.widgetConfig,
                                launcherSize: size.id as LauncherSize,
                              },
                            })
                          }
                          className={`p-2 rounded-xl border text-center transition-all ${
                            (currentBot.widgetConfig.launcherSize || 'standard') === size.id
                              ? 'border-indigo-500 bg-indigo-950/40 text-white font-bold'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs">{size.name}</div>
                          <div className="text-[10px] opacity-75">{size.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attention Driver Effect */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                      Visual Attention Effect
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'radar', name: 'Radar Wave' },
                        { id: 'pulse', name: 'Glow Pulse' },
                        { id: 'glow', name: 'Neon Halo' },
                        { id: 'none', name: 'Clean Static' },
                      ].map((eff) => (
                        <button
                          key={eff.id}
                          type="button"
                          onClick={() =>
                            setCurrentBot({
                              ...currentBot,
                              widgetConfig: {
                                ...currentBot.widgetConfig,
                                launcherEffect: eff.id as LauncherEffect,
                              },
                            })
                          }
                          className={`p-2 rounded-xl border text-center text-xs transition-all ${
                            (currentBot.widgetConfig.launcherEffect || 'radar') === eff.id
                              ? 'border-indigo-500 bg-indigo-950/40 text-white font-bold'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {eff.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Labels & Proactive Badge Customization */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Floating Button Label
                    </label>
                    <input
                      type="text"
                      value={currentBot.widgetConfig.launcherLabel || ''}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: { ...currentBot.widgetConfig, launcherLabel: e.target.value },
                        })
                      }
                      placeholder="e.g. Chat with AI"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Floating Welcome Tooltip
                    </label>
                    <input
                      type="text"
                      value={currentBot.widgetConfig.launcherBadgeText || currentBot.widgetConfig.customBadge || ''}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: {
                            ...currentBot.widgetConfig,
                            launcherBadgeText: e.target.value,
                            customBadge: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Ask our AI Concierge 👋"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Website Position
                    </label>
                    <select
                      value={currentBot.widgetConfig.position}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: {
                            ...currentBot.widgetConfig,
                            position: e.target.value as 'bottom-right' | 'bottom-left',
                          },
                        })
                      }
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="bottom-right">Bottom Right (Recommended)</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </div>

                {/* 5. Toggles for Online Status & Tooltip */}
                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-850">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={currentBot.widgetConfig.launcherShowOnlineDot !== false}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: {
                            ...currentBot.widgetConfig,
                            launcherShowOnlineDot: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-neutral-900 border-neutral-750 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 font-medium">
                      Show Active Green 24/7 Status Dot
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={currentBot.widgetConfig.launcherShowBadge !== false}
                      onChange={(e) =>
                        setCurrentBot({
                          ...currentBot,
                          widgetConfig: {
                            ...currentBot.widgetConfig,
                            launcherShowBadge: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-neutral-900 border-neutral-750 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 font-medium">
                      Show Proactive Floating Tooltip Callout
                    </span>
                  </label>
                </div>
              </div>

              {/* Greeting */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">Welcome Greeting Message</label>
                <textarea
                  rows={2}
                  value={currentBot.widgetConfig.welcomeMessage}
                  onChange={(e) =>
                    setCurrentBot({
                      ...currentBot,
                      widgetConfig: { ...currentBot.widgetConfig, welcomeMessage: e.target.value },
                    })
                  }
                  placeholder="Welcome message shown when visitor opens chat..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Suggested Questions Chips */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">Quick Starter Prompt Chips</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newQuestionChip}
                    onChange={(e) => setNewQuestionChip(e.target.value)}
                    placeholder="e.g. Book a private consultation"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newQuestionChip.trim()) return;
                      setCurrentBot({
                        ...currentBot,
                        widgetConfig: {
                          ...currentBot.widgetConfig,
                          suggestedQuestions: [
                            ...currentBot.widgetConfig.suggestedQuestions,
                            newQuestionChip.trim(),
                          ],
                        },
                      });
                      setNewQuestionChip('');
                    }}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Add Chip
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentBot.widgetConfig.suggestedQuestions.map((q, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-xl text-[11px] flex items-center gap-1.5"
                    >
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = currentBot.widgetConfig.suggestedQuestions.filter((_, i) => i !== idx);
                          setCurrentBot({
                            ...currentBot,
                            widgetConfig: { ...currentBot.widgetConfig, suggestedQuestions: filtered },
                          });
                        }}
                        className="text-neutral-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EMBED & INTEGRATION */}
          {activeTab === 'embed' && (
            <div className="space-y-5 text-xs">
              {/* DEDICATED CLIENT PORTAL CARD FOR THIS SPECIFIC BOT */}
              <div className="p-5 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-indigo-950/40 border border-emerald-500/30 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-['Outfit',sans-serif]">
                        Dedicated Client Portal for this bot
                      </h4>
                      <p className="text-zinc-400 text-[11px]">
                        Private dashboard for this bot's owner ({currentBot.clientName || currentBot.name}) to follow leads and conversations.
                      </p>
                    </div>
                  </div>

                  {onOpenClientPortalAsUser && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleanCompanyName = (currentBot.clientName || currentBot.name || 'Client Business').trim();
                        const slug = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || `client${Date.now()}`;
                        onOpenClientPortalAsUser({
                          id: `user-client-${currentBot.id}`,
                          email: currentBot.clientEmail || `client@${slug.slice(0, 15)}.com`,
                          name: cleanCompanyName,
                          companyName: cleanCompanyName,
                          role: 'client',
                          assignedBotIds: [currentBot.id],
                        });
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open client dashboard now</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Client login email:</span>
                    <p className="font-mono text-emerald-300 font-bold select-all">
                      {currentBot.clientEmail || `client@${((currentBot.clientName || currentBot.name).toLowerCase().replace(/[^a-z0-9]/g, '') || 'client').slice(0, 15)}.com`}
                    </p>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Client portal password:</span>
                    <p className="font-mono text-indigo-300 font-bold select-all">
                      {currentBot.clientPassword || `${((currentBot.clientName || currentBot.name).toLowerCase().replace(/[^a-z0-9]/g, '') || 'client').slice(0, 8)}2026`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const clean = (currentBot.clientName || currentBot.name).toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
                      const email = currentBot.clientEmail || `client@${clean.slice(0, 15)}.com`;
                      const pass = currentBot.clientPassword || `${clean.slice(0, 8)}2026`;
                      const text = `Welcome! 🎉\nYour company's AI assistant (${currentBot.clientName || currentBot.name}) is ready:\n\n🔗 Live bot demo link:\n${window.location.origin}/?demo=${currentBot.id}\n\n🔐 Your private client portal for conversations & leads:\n${window.location.origin}/?portal=true\n- Login (Gmail): ${email}\n- Password: ${pass}`;
                      navigator.clipboard.writeText(text);
                      alert('✓ Copied the welcome card with client login details!');
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3 h-3 text-emerald-400" />
                    <span>Copy client welcome & credentials card</span>
                  </button>

                  <a
                    href={`${window.location.origin}/?demo=${currentBot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                    <span>Open standalone preview link (?demo={currentBot.id})</span>
                  </a>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Ready to Connect with Your Website</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Embed this AI assistant into Shopify, WordPress, Webflow, Next.js, or any custom HTML website with zero friction.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenEmbed(currentBot)}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  Open Full Embed Center & Platform Guides
                </button>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">Universal JavaScript Script Tag</label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-indigo-300 overflow-x-auto select-all">
                  {`<script src="${window.location.origin}/widget.js" data-bot-id="${currentBot.id}" defer></script>`}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">Iframe Sandbox Embed</label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto select-all">
                  {`<iframe src="${window.location.origin}/chat/${currentBot.id}" width="100%" height="600" frameborder="0"></iframe>`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE SANDBOX (5 COLS) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white font-['Outfit',sans-serif]">Live Studio Sandbox</span>
              </div>
              
              {/* Preview Mode Switcher */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSandboxMode('chat_window')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    sandboxMode === 'chat_window'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Open Window
                </button>
                <button
                  type="button"
                  onClick={() => setSandboxMode('launcher_button')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    sandboxMode === 'launcher_button'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Floating Launcher
                </button>
              </div>
            </div>

            <div className="h-[620px] rounded-2xl overflow-hidden shadow-2xl relative bg-[#06070d] flex items-center justify-center">
              {sandboxMode === 'chat_window' ? (
                <ChatWidget bot={currentBot} isEmbedded={true} />
              ) : (
                <div className="w-full h-full p-8 flex flex-col justify-between relative bg-gradient-to-b from-neutral-950/80 to-neutral-900/90 border border-neutral-800/80 rounded-2xl">
                  <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl">
                    <span className="text-xs font-bold text-white block mb-1">Launcher Simulation Stage</span>
                    <p className="text-[11px] text-neutral-400">
                      Testing shape: <strong className="text-indigo-400 capitalize">{currentBot.widgetConfig?.launcherShape || 'Pill'}</strong> • 
                      Icon: <strong className="text-indigo-400 capitalize">{currentBot.widgetConfig?.launcherIcon || 'Avatar'}</strong> • 
                      Size: <strong className="text-indigo-400 capitalize">{currentBot.widgetConfig?.launcherSize || 'Standard'}</strong>
                    </p>
                  </div>

                  <div className="relative h-40 flex items-end justify-end">
                    <ChatWidget bot={currentBot} isEmbedded={false} initialOpen={false} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* CLIENT ACCOUNT PROVISIONED SUCCESS MODAL */}
      {showProvisionedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b0c13] border border-emerald-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 pb-3 text-center space-y-2 border-b border-zinc-800/80">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                Bot saved and client portal provisioned! 🎉
              </h3>
              <p className="text-xs text-zinc-400">
                A dedicated, isolated dashboard was created for ({currentBot.clientName || currentBot.name}).
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Credentials Box */}
              <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <span className="text-zinc-400 font-medium">Company / Client:</span>
                  <span className="text-white font-bold">{currentBot.clientName || currentBot.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <span className="text-zinc-400 font-medium">Login email:</span>
                  <span className="font-mono text-emerald-300 font-bold select-all bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    {currentBot.clientEmail || `client@example.com`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <span className="text-zinc-400 font-medium">Client portal password:</span>
                  <span className="font-mono text-indigo-300 font-bold select-all bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                    {currentBot.clientPassword || `client2026`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Client dashboard link:</span>
                  <span className="font-mono text-amber-300 text-[11px] font-bold select-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/?portal=true` : '/?portal=true'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onOpenClientPortalAsUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProvisionedModal(false);
                      onOpenClientPortalAsUser({
                        id: `user-client-${currentBot.id}`,
                        email: currentBot.clientEmail || `client@example.com`,
                        name: currentBot.clientName || currentBot.name,
                        companyName: currentBot.clientName || currentBot.name,
                        role: 'client',
                        assignedBotIds: [currentBot.id],
                      });
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Open client dashboard to preview</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const email = currentBot.clientEmail || `client@example.com`;
                    const pass = currentBot.clientPassword || `client2026`;
                    const text = `Welcome! 🎉\nYour company's AI assistant (${currentBot.clientName || currentBot.name}) is ready:\n\n🔗 Live bot demo link:\n${window.location.origin}/?demo=${currentBot.id}\n\n🔐 Your private client portal for conversations & leads:\n${window.location.origin}/?portal=true\n- Login (Gmail): ${email}\n- Password: ${pass}`;
                    navigator.clipboard.writeText(text);
                    alert('✓ Copied the WhatsApp welcome message with login details!');
                  }}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl font-bold border border-zinc-800 flex items-center justify-center gap-2 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy ready WhatsApp welcome message</span>
                </button>

                <div className="flex gap-2">
                  <a
                    href={`${window.location.origin}/?demo=${currentBot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-indigo-300 hover:text-indigo-200 rounded-xl font-bold border border-zinc-800 flex items-center justify-center gap-1.5 transition-all text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open standalone preview link</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowProvisionedModal(false)}
                    className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold text-[11px] transition-all"
                  >
                    Close
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
