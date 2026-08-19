import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown,
  Mic,
  ShieldCheck,
  Zap,
  Bot,
  HelpCircle,
  Headphones,
  Diamond,
  User,
  ArrowUp,
  PhoneCall,
  ExternalLink
} from 'lucide-react';
import { Chatbot, ChatMessage } from '../types';

interface ChatWidgetProps {
  bot: Chatbot;
  isEmbedded?: boolean;
  initialOpen?: boolean;
  standalone?: boolean;
  onSendMessage?: (message: string) => void;
}

// Check if a color is light or dark
function isLightColor(hexColor?: string): boolean {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 170;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  bot,
  isEmbedded = false,
  initialOpen = false,
  standalone = false,
}) => {
  const [isOpen, setIsOpen] = useState(isEmbedded || initialOpen || standalone);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, 'up' | 'down'>>({});
  const [isListening, setIsListening] = useState(false);
  const [showLauncherBubble, setShowLauncherBubble] = useState(true);

  // Lead capture form state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync welcome message reactively whenever bot name or welcomeMessage changes
  useEffect(() => {
    const welcomeText = bot.widgetConfig?.welcomeMessage || `Welcome to **${bot.name}**! 👋 How can I assist you today?`;
    setMessages((prev) => {
      if (prev.length === 0 || prev[0].id.startsWith('welcome-')) {
        return [
          {
            id: `welcome-${bot.id}`,
            sender: 'bot',
            text: welcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(1)
        ];
      }
      return prev;
    });
  }, [bot.id, bot.widgetConfig?.welcomeMessage, bot.name]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen || isEmbedded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isEmbedded]);

  // Text-To-Speech
  const handleSpeak = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const plainText = text.replace(/[*_#`[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.05;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice speech-to-text
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName: bot.name,
          systemPrompt: bot.systemPrompt,
          tone: bot.tone,
          knowledgeBase: bot.knowledgeBase,
          rules: bot.rules || [],
          faqs: bot.faqs,
          conversationHistory: updatedHistory.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          message: text,
          whatsappNumber: bot.whatsappNumber || bot.widgetConfig?.whatsappNumber,
          whatsappMessage: bot.whatsappMessage || bot.widgetConfig?.whatsappMessage,
        }),
      });

      const data = await response.json();
      const reply = data.response || `Thank you for reaching out to **${bot.name}**. How else may I assist you today?`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMock: data.isMock,
      };

      const finalMessages = [...updatedHistory, botMsg];
      setMessages(finalMessages);

      // Automatically log conversation transcript to server database for client portal
      try {
        fetch('/api/conversations/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: bot.id,
            botName: bot.name,
            visitorName: 'زائر موقع (Web Visitor)',
            messages: finalMessages.map((m) => ({
              id: m.id,
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp,
            })),
            summary: text.slice(0, 100),
            leadCaptured: false,
          }),
        }).catch((err) => console.error('Silent log fail', err));
      } catch (e) {
        // silent
      }
    } catch (e) {
      console.error(e);
      const fallback: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'bot',
        text: `Thank you for contacting **${bot.name}**. How may I help you further?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: bot.id,
          botName: bot.name,
          clientName: bot.clientName || 'Website Lead',
          name: leadName.trim(),
          phone: leadPhone.trim(),
          note: 'طلب تواصل مباشر من نافذة الشات بوت',
        }),
      });

      setLeadSuccess(true);
      setTimeout(() => {
        setShowLeadForm(false);
        setLeadSuccess(false);
        setLeadName('');
        setLeadPhone('');
      }, 2500);
    } catch (e) {
      console.error('Failed to submit lead', e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: bot.widgetConfig?.welcomeMessage || `Welcome to **${bot.name}**! 👋 How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Color & Position Configs
  const primaryColor = bot.widgetConfig?.primaryColor || '#4f46e5';
  const customBgColor = bot.widgetConfig?.backgroundColor || '#ffffff';
  const headerBgColor = bot.widgetConfig?.headerBgColor || (isLightColor(customBgColor) ? '#ffffff' : '#0f111a');
  const bubbleColor = bot.widgetConfig?.bubbleColor || primaryColor;
  const launcherBg = bot.widgetConfig?.launcherCustomBgColor || primaryColor;
  const isWidgetLight = isLightColor(customBgColor);
  const isLeft = bot.widgetConfig?.position === 'bottom-left';

  // Launcher Settings
  const shape = bot.widgetConfig?.launcherShape || 'pill';
  const iconType = bot.widgetConfig?.launcherIcon || 'bot_avatar';
  const size = bot.widgetConfig?.launcherSize || 'standard';
  const effect = bot.widgetConfig?.launcherEffect || 'none';
  const showDot = bot.widgetConfig?.launcherShowOnlineDot !== false;
  const showBadge = bot.widgetConfig?.launcherShowBadge !== false;
  const badgeText = bot.widgetConfig?.launcherBadgeText || bot.widgetConfig?.customBadge || 'Need help? Chat with AI 👋';
  const launcherLabel = bot.widgetConfig?.launcherLabel || 'Chat with us';

  // Render Bot Avatar
  const renderAvatar = (sizeClass = 'w-9 h-9', textSize = 'text-xs') => {
    const isImage = bot.widgetConfig?.avatarType === 'image' || (!bot.widgetConfig?.avatarType && !!bot.widgetConfig?.avatarUrl);
    if (isImage && bot.widgetConfig?.avatarUrl) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden shadow-sm border border-black/5 dark:border-white/10 relative shrink-0 bg-neutral-100 dark:bg-neutral-800`}>
          <img
            src={bot.widgetConfig.avatarUrl}
            alt={bot.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).innerHTML = `<div class="w-full h-full flex items-center justify-center ${textSize}">${bot.avatar || '💎'}</div>`;
            }}
          />
        </div>
      );
    }
    return (
      <div 
        className={`${sizeClass} rounded-full flex items-center justify-center ${textSize} shadow-sm border border-black/5 dark:border-white/10 shrink-0 text-white font-bold`}
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
      >
        {bot.avatar || '💎'}
      </div>
    );
  };

  // Render Launcher Trigger Icon
  const renderLauncherIcon = () => {
    switch (iconType) {
      case 'sparkle':
        return <Sparkles className="w-5 h-5 text-white" />;
      case 'chat_bubble':
        return <MessageSquare className="w-5 h-5 text-white" />;
      case 'headset':
        return <Headphones className="w-5 h-5 text-white" />;
      case 'diamond':
        return <Diamond className="w-5 h-5 text-white" />;
      case 'bolt':
        return <Zap className="w-5 h-5 text-white" />;
      case 'help':
        return <HelpCircle className="w-5 h-5 text-white" />;
      case 'bot_avatar':
      default:
        if (bot.widgetConfig?.avatarType === 'image' && bot.widgetConfig?.avatarUrl) {
          return (
            <img
              src={bot.widgetConfig.avatarUrl}
              alt={bot.name}
              className="w-6 h-6 rounded-full object-cover border border-white/60"
              referrerPolicy="no-referrer"
            />
          );
        }
        return <span className="text-base">{bot.avatar || '💎'}</span>;
    }
  };

  // Size styling classes for launcher button
  const getLauncherSizeClasses = () => {
    if (shape === 'circle' || shape === 'squircle' || shape === 'orb') {
      switch (size) {
        case 'compact': return 'w-11 h-11';
        case 'large': return 'w-16 h-16';
        case 'standard':
        default: return 'w-14 h-14';
      }
    }
    switch (size) {
      case 'compact': return 'px-4 py-2.5 text-xs';
      case 'large': return 'px-6 py-4 text-sm';
      case 'standard':
      default: return 'px-5 py-3.5 text-xs';
    }
  };

  // Shape styling classes for launcher button
  const getLauncherShapeClasses = () => {
    switch (shape) {
      case 'circle': return 'rounded-full';
      case 'squircle': return 'rounded-2xl';
      case 'orb': return 'rounded-full ring-4 ring-white/20';
      case 'card': return 'rounded-2xl px-4 py-3';
      case 'pill':
      default: return 'rounded-full';
    }
  };

  // Effect styling classes
  const getLauncherEffectClasses = () => {
    switch (effect) {
      case 'pulse': return 'animate-pulse';
      case 'glow': return 'shadow-[0_0_30px_rgba(79,70,229,0.7)]';
      default: return '';
    }
  };

  // Rich formatted text with Markdown, links & RTL auto detection
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Parse markdown links [Label](url)
      let formatted = line.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, label, url) => {
        const isWhatsApp = url.includes('wa.me') || url.includes('whatsapp.com');
        if (isWhatsApp) {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md transition-all no-underline scale-100 hover:scale-105 active:scale-95"><span>💬 ${label}</span></a>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-1">${label} ↗</a>`;
      });

      // Parse bold **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, `<strong class="${isWidgetLight ? 'text-zinc-950 font-bold' : 'text-white font-bold'}">$1</strong>`);

      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <li 
            key={idx} 
            dir="auto"
            className={`ml-4 list-disc ${isWidgetLight ? 'text-zinc-800' : 'text-zinc-200'} leading-relaxed my-1`} 
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, '') }} 
          />
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div 
            key={idx} 
            dir="auto"
            className={`ml-1 font-medium ${isWidgetLight ? 'text-zinc-800' : 'text-zinc-200'} leading-relaxed my-1`} 
            dangerouslySetInnerHTML={{ __html: formatted }} 
          />
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} dir="auto" className="leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className={isEmbedded ? 'w-full h-full flex flex-col font-sans' : `fixed z-50 ${isLeft ? 'left-6' : 'right-6'} bottom-6 font-sans`}>
      
      {/* 1. FLOATING LAUNCHER TRIGGER */}
      {!isEmbedded && !isOpen && (
        <div className="relative group flex items-center select-none animate-fadeIn">
          
          {/* Radar Ripple Effect */}
          {effect === 'radar' && (
            <span className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-ping pointer-events-none" />
          )}

          {/* Floating Callout Tooltip */}
          {showBadge && showLauncherBubble && (
            <div
              onClick={() => setIsOpen(true)}
              className={`absolute -top-14 ${isLeft ? 'left-0' : 'right-0'} bg-zinc-900/95 text-white border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-all whitespace-nowrap z-10`}
            >
              {showDot && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <span className="text-xs font-medium" dir="auto">{badgeText}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLauncherBubble(false);
                }}
                className="text-neutral-400 hover:text-white p-0.5 rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Launcher Button */}
          <button
            onClick={() => setIsOpen(true)}
            style={{ 
              background: `linear-gradient(135deg, ${launcherBg} 0%, ${launcherBg}dd 100%)`,
              boxShadow: `0 10px 30px -5px ${launcherBg}77`
            }}
            className={`flex items-center justify-center gap-2.5 text-white font-semibold shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20 ${getLauncherShapeClasses()} ${getLauncherSizeClasses()} ${getLauncherEffectClasses()}`}
          >
            <div className="relative flex items-center justify-center">
              {renderLauncherIcon()}
              {showDot && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border border-white rounded-full" />
              )}
            </div>

            {(shape === 'pill' || shape === 'card') && (
              <span className="font-semibold tracking-tight text-white text-xs" dir="auto">{launcherLabel}</span>
            )}
          </button>
        </div>
      )}

      {/* 2. CHATBOT WINDOW: PURE ELEGANCE & CONTEMPORARY SAAS */}
      {(isOpen || isEmbedded) && (
        <div
          style={{ 
            backgroundColor: customBgColor,
            borderColor: isWidgetLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'
          }}
          className={`flex flex-col overflow-hidden transition-all duration-300 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] relative ${
            isEmbedded
              ? 'w-full h-full rounded-2xl border'
              : 'w-[92vw] sm:w-[380px] h-[580px] rounded-[28px] border'
          } ${
            isWidgetLight ? 'text-zinc-900' : 'text-zinc-100'
          }`}
        >
          {/* HEADER: Clean, Minimalist, High-End */}
          <div 
            className="px-5 py-3.5 border-b flex items-center justify-between shrink-0"
            style={{ 
              backgroundColor: headerBgColor,
              borderColor: isWidgetLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
            }}
          >
            {/* Left: Avatar + Title + Status */}
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="relative shrink-0">
                {renderAvatar('w-10 h-10', 'text-sm')}
                {showDot && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-[14px] truncate tracking-tight ${isWidgetLight ? 'text-zinc-900' : 'text-white'}`}>
                    {bot.widgetConfig?.headerTitle || bot.name}
                  </span>
                  
                  {/* Subtle verified check */}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Online" />
                </div>

                <p className={`text-[11px] truncate font-medium ${isWidgetLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {bot.widgetConfig?.headerSubtitle || 'AI Concierge • Instant reply'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className={`flex items-center gap-1.5 ${isWidgetLight ? 'text-zinc-500' : 'text-zinc-400'} shrink-0`}>
              {/* WhatsApp Direct Live Agent Transfer */}
              {(bot.whatsappNumber || bot.widgetConfig?.whatsappNumber) && (
                <a
                  href={`https://wa.me/${(bot.whatsappNumber || bot.widgetConfig?.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(bot.whatsappMessage || bot.widgetConfig?.whatsappMessage || 'مرحباً، أود التحدث مع فريق الدعم بخصوص استفساري على الموقع')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="تواصل مباشرة عبر واتساب مع الدعم البشري"
                  className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/30 flex items-center gap-1.5 text-[11px] font-bold shadow-xs active:scale-95 group"
                >
                  <PhoneCall className="w-3 h-3 group-hover:animate-bounce" />
                  <span className="hidden sm:inline">واتساب</span>
                </a>
              )}

              <button
                onClick={handleReset}
                title="Restart chat"
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {!isEmbedded && (
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* MAIN MESSAGE STREAM */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[13px]">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-fadeIn`}
                >
                  {/* Message Bubble */}
                  <div
                    dir="auto"
                    className={`p-3.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-xs transition-all ${
                      isUser
                        ? 'text-white font-medium rounded-tr-xs shadow-sm'
                        : isWidgetLight
                          ? 'bg-zinc-100/90 text-zinc-900 border border-zinc-200/50 rounded-tl-xs'
                          : 'bg-zinc-800/80 text-zinc-100 border border-white/10 rounded-tl-xs'
                    }`}
                    style={
                      isUser 
                        ? { 
                            background: `linear-gradient(135deg, ${bubbleColor} 0%, ${bubbleColor}ee 100%)`,
                          } 
                        : undefined
                    }
                  >
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Micro Actions Bar */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-zinc-400 font-medium select-none">
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-1">
                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 transition-colors"
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>

                        {/* TTS */}
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className={`hover:text-indigo-500 p-0.5 transition-colors ${
                            speakingId === msg.id ? 'text-indigo-500 animate-pulse' : ''
                          }`}
                          title="Read aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>

                        {/* Thumbs Up */}
                        <button
                          onClick={() => setFeedbackRatings((prev) => ({ ...prev, [msg.id]: 'up' }))}
                          className={`hover:text-emerald-500 p-0.5 transition-colors ${
                            feedbackRatings[msg.id] === 'up' ? 'text-emerald-500' : ''
                          }`}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>

                        {/* Thumbs Down */}
                        <button
                          onClick={() => setFeedbackRatings((prev) => ({ ...prev, [msg.id]: 'down' }))}
                          className={`hover:text-rose-500 p-0.5 transition-colors ${
                            feedbackRatings[msg.id] === 'down' ? 'text-rose-500' : ''
                          }`}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <div className={`px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-xs ${
                  isWidgetLight ? 'bg-zinc-100 border border-zinc-200/60' : 'bg-zinc-800 border border-white/10'
                }`}>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED STARTER CHIPS */}
          {bot.widgetConfig?.suggestedQuestions && bot.widgetConfig.suggestedQuestions.length > 0 && messages.length <= 2 && (
            <div 
              className="px-4 py-2 border-t flex gap-2 overflow-x-auto no-scrollbar shrink-0"
              style={{ 
                borderColor: isWidgetLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
              }}
            >
              {bot.widgetConfig.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  dir="auto"
                  onClick={() => handleSendMessage(q)}
                  className={`shrink-0 text-[12px] font-medium px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 shadow-2xs ${
                    isWidgetLight 
                      ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900' 
                      : 'bg-zinc-800/60 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* ALL-IN-ONE INTEGRATED INPUT CAPSULE */}
          <div 
            className="p-3.5 border-t shrink-0"
            style={{ 
              borderColor: isWidgetLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
            }}
          >
            {/* Quick Lead Capture Drawer */}
            {showLeadForm ? (
              <form onSubmit={handleSubmitLead} className="mb-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>طلب اتصال أو استشارة سريعة</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {leadSuccess ? (
                  <p className="text-emerald-400 font-bold text-center py-2">
                    ✓ تم استلام بياناتك وسيتواصل معك الفريق فوراً!
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الكريم..."
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-black border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="رقم الهاتف أو الواتساب..."
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-black border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
                    >
                      إرسال الطلب الآن
                    </button>
                  </>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between mb-1 px-1">
                <button
                  type="button"
                  onClick={() => setShowLeadForm(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>طلب اتصال أو حجز موعد مباشر</span>
                </button>
                {bot.whatsappNumber && (
                  <a
                    href={`https://wa.me/${(bot.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، أود التحدث مع الدعم بخصوص استفساري')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>واتساب</span>
                  </a>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={`flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full border transition-all ${
                isWidgetLight 
                  ? 'bg-zinc-100/90 border-zinc-200 focus-within:border-zinc-400 focus-within:bg-white' 
                  : 'bg-zinc-800/80 border-white/10 focus-within:border-white/25 focus-within:bg-zinc-800'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                dir="auto"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={bot.widgetConfig?.placeholderText || 'Ask a question...'}
                className={`flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[13px] py-1.5 placeholder-zinc-400 ${
                  isWidgetLight ? 'text-zinc-900' : 'text-white'
                }`}
              />

              {/* Voice mic button */}
              <button
                type="button"
                onClick={handleVoiceInput}
                title={isListening ? 'Listening...' : 'Voice input'}
                className={`p-2 rounded-full transition-colors ${
                  isListening ? 'text-rose-500 animate-pulse' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button (Integrated Inside Capsule) */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                style={{ 
                  backgroundColor: inputValue.trim() ? primaryColor : undefined,
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                  inputValue.trim() 
                    ? 'text-white cursor-pointer hover:opacity-90 shadow-sm' 
                    : isWidgetLight 
                      ? 'bg-zinc-200/80 text-zinc-400 cursor-not-allowed' 
                      : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                }`}
                title="Send"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>

            {/* Minimal Brand Footer */}
            {bot.widgetConfig?.showBranding !== false && (
              <div className="pt-2 flex items-center justify-center gap-1 text-[10px] text-zinc-400 font-medium">
                <ShieldCheck className="w-3 h-3 text-zinc-400" />
                <span>Powered by AI Concierge</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
