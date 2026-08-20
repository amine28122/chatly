export type BotRole = 
  | 'ecommerce_guide' 
  | 'customer_support' 
  | 'appointment_booking' 
  | 'sales_lead' 
  | 'faq_assistant' 
  | 'custom';

export type ToneOfVoice = 
  | 'luxury_concierge' 
  | 'friendly_approachable' 
  | 'professional_executive' 
  | 'tech_expert' 
  | 'concise_fast';

export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetTheme = 'dark' | 'light' | 'glass' | 'custom';
export type LauncherIconType = 'bot_avatar' | 'chat' | 'sparkle' | 'headset' | 'diamond' | 'robot' | 'zap' | 'message';
export type LauncherShape = 'circle' | 'pill' | 'squircle' | 'card' | 'glow_orb';
export type LauncherSize = 'compact' | 'standard' | 'large';
export type LauncherEffect = 'pulse' | 'glow' | 'radar' | 'none';

export type WidgetStylePreset = 
  | 'midnight-luxury' 
  | 'emerald-concierge' 
  | 'royal-indigo' 
  | 'rose-gold' 
  | 'cyber-violet' 
  | 'clean-minimal'
  | 'champagne-gold'
  | 'pure-snow'
  | 'custom';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface WidgetConfig {
  primaryColor: string; // Hex color for accents, CTA, user bubble
  secondaryColor: string;
  backgroundColor: string; // Hex color for the ENTIRE widget background (e.g. #090a0f, #1e1b4b, #ffffff)
  headerBgColor: string; // Hex or tint for the header
  bubbleColor: string; // Hex for user chat bubble
  assistantBubbleColor?: string; // Hex for assistant bubble
  textColor: string;
  theme: WidgetTheme;
  stylePreset: WidgetStylePreset;
  position: WidgetPosition;
  
  // Launcher Trigger Customization (Website Icon & Floating Button)
  launcherIcon: LauncherIconType;
  launcherShape?: LauncherShape; // circle | pill | squircle | card | glow_orb
  launcherSize?: LauncherSize; // compact | standard | large
  launcherEffect?: LauncherEffect; // pulse | glow | radar | none
  launcherLabel: string; // e.g. "Chat with Concierge" or empty
  launcherCustomBgColor?: string; // Optional custom color for floating trigger
  launcherShowOnlineDot?: boolean; // Online status green radar dot
  launcherShowBadge?: boolean; // Show proactive callout bubble
  launcherBadgeText?: string; // Proactive tooltip e.g. "Ask AI anything 👋"
  
  headerTitle: string;
  headerSubtitle: string;
  welcomeMessage: string;
  placeholderText: string;
  suggestedQuestions: string[];
  autoOpenDelaySeconds: number; // 0 = disabled
  showBranding: boolean;
  avatarType: 'image' | 'emoji';
  avatarUrl: string; // Profile photo image URL or base64 data
  soundEnabled: boolean;
  glassBlur: boolean;
  customBadge: string;
  enableWhatsAppButton?: boolean;
  whatsappNumber?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  isMock?: boolean;
}

export interface ChatbotSession {
  id: string;
  botId: string;
  visitorId: string;
  messages: ChatMessage[];
  startedAt: string;
  lastActiveAt: string;
  rating?: 'positive' | 'negative';
  resolved?: boolean;
}

export type EnvironmentType = 'production' | 'staging' | 'development';
export type BotViewMode = 'grid' | 'table' | 'by_client';

export interface Chatbot {
  id: string;
  name: string;
  clientName?: string; // Company / Client Organization e.g. "AURA Maison Group"
  clientEmail?: string; // Client's Gmail/Email for dedicated dashboard login
  clientPassword?: string; // Password for client dashboard login
  clientDomain?: string; // Associated main website or tenant domain
  environment?: EnvironmentType; // production | staging | development
  tags?: string[]; // Custom tags e.g. ["VIP", "Shopify", "Arabic", "Healthcare"]
  isPinned?: boolean; // Pinned to top of dashboard
  clientNotes?: string; // Agency / Internal management notes
  folder?: string; // Client folder / category
  description: string;
  avatar: string;
  role: BotRole;
  tone: ToneOfVoice;
  websiteUrl: string;
  language: 'en' | 'multilingual' | 'auto';
  systemPrompt: string;
  knowledgeBase: string;
  whatsappNumber?: string; // e.g. "+966501234567" or "+212612345678"
  whatsappMessage?: string; // Pre-filled custom text e.g. "Hello, I would like to speak with customer service"
  enableWhatsAppHandover?: boolean; // Enable 1-click WhatsApp button and AI human transfer
  rules?: string[]; // Strict behavioral rules & guardrails
  faqs: FAQItem[];
  widgetConfig: WidgetConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalConversations: number;
    totalMessages: number;
    satisfactionRate: number; // e.g. 98%
    resolvedQueries: number;
    avgResponseTimeMs: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'admin' | 'client' | 'viewer'; // viewer = read-only access
  companyName?: string;
  assignedBotIds?: string[];
  createdAt: string;
}

export interface ClientUserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  companyName: string;
  assignedBotIds: string[];
  role: 'admin' | 'client' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

export interface StoredLead {
  id: string;
  botId: string;
  botName: string;
  clientName: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  message?: string;
  sourceUrl?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

export interface StoredConversation {
  id: string;
  botId: string;
  botName: string;
  clientName: string;
  visitorId: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'bot' | 'system';
    text: string;
    timestamp: string;
  }>;
  startedAt: string;
  lastActiveAt: string;
  status: 'active' | 'resolved' | 'escalated_to_whatsapp';
  satisfaction?: 'positive' | 'negative' | 'neutral';
}

export type ActiveView = 
  | 'landing' 
  | 'dashboard' 
  | 'bot_editor' 
  | 'simulator' 
  | 'analytics'
  | 'client_portal'
  | 'standalone_demo';
