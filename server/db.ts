import fs from 'fs';
import path from 'path';
import { Chatbot } from '../src/types';
import { DEFAULT_BOTS } from '../src/data/defaultBots';
import { hashPassword, isHashedPassword, generatePassword } from './security';

export type UserRole = 'admin' | 'client' | 'viewer';

export interface ClientUser {
  id: string;
  email: string;
  passwordHash: string; // Always stored as a scrypt hash (never plaintext).
  name: string;
  companyName: string;
  assignedBotIds: string[];
  role: UserRole;
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

export interface AppDatabase {
  bots: Chatbot[];
  clientUsers: ClientUser[];
  conversations: StoredConversation[];
  leads: StoredLead[];
  /** Per-bot Gemini API keys. Stored separately from the bot object so they are
   *  never serialized into any bots() response — only used server-side on chat. */
  geminiApiKeys?: Record<string, string>;
  agencyProfile: {
    name: string;
    email: string;
    phone: string;
    website: string;
    brandName: string;
  };
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial Seed Data
const INITIAL_CLIENT_USERS: ClientUser[] = [
  {
    id: 'user-admin',
    email: 'admin@agency.com',
    passwordHash: 'admin123',
    name: 'Agency Founder',
    companyName: 'BotCraft AI Agency',
    assignedBotIds: ['all'],
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-viewer',
    email: 'viewer@agency.com',
    passwordHash: 'viewer123',
    name: 'Read-Only Analyst',
    companyName: 'BotCraft AI Agency',
    assignedBotIds: ['all'],
    role: 'viewer',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-aura',
    email: 'client@auramaison.com',
    passwordHash: 'aura2026',
    name: 'Marcus Vance',
    companyName: 'AURA Maison Group',
    assignedBotIds: ['bot-luxury-01'],
    role: 'client',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-apex',
    email: 'contact@apexhealth.com',
    passwordHash: 'apex2026',
    name: 'Dr. Sarah Lin',
    companyName: 'Apex Health Institute',
    assignedBotIds: ['bot-clinic-02'],
    role: 'client',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-nexus',
    email: 'billing@nexuscloud.io',
    passwordHash: 'nexus2026',
    name: 'Alexander Reed',
    companyName: 'Nexus Cloud Systems',
    assignedBotIds: ['bot-saas-03'],
    role: 'client',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_LEADS: StoredLead[] = [
  {
    id: 'lead-1',
    botId: 'bot-luxury-01',
    botName: 'AURA Concierge',
    clientName: 'AURA Maison Group',
    visitorName: 'Sophie Beaumont',
    visitorEmail: 'sophie.b@paris-lux.fr',
    visitorPhone: '+33 6 82 91 00 23',
    message: 'Interested in bespoke Grand Complication watch viewing in Paris salon next Tuesday.',
    sourceUrl: 'https://auramaison.com/collections',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'new',
  },
  {
    id: 'lead-2',
    botId: 'bot-clinic-02',
    botName: 'Apex Clinical Advisor',
    clientName: 'Apex Health Institute',
    visitorName: 'Tariq Al-Mansoor',
    visitorEmail: 'tariq.m@gulfcorp.ae',
    visitorPhone: '+971 50 847 2910',
    message: 'Booking Comprehensive Multi-Omics longevity assessment for VIP family package.',
    sourceUrl: 'https://apexhealth.com/programs',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'contacted',
  },
  {
    id: 'lead-3',
    botId: 'bot-saas-03',
    botName: 'Nexus Cloud Architect',
    clientName: 'Nexus Cloud Systems Inc',
    visitorName: 'David Chen',
    visitorEmail: 'dchen@fintech-scale.io',
    visitorPhone: '+1 415 892 1104',
    message: 'Enterprise SOC2 private cloud deployment with dedicated VPC peering.',
    sourceUrl: 'https://nexuscloud.io/pricing',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: 'qualified',
  },
];

const INITIAL_CONVERSATIONS: StoredConversation[] = [
  {
    id: 'conv-101',
    botId: 'bot-luxury-01',
    botName: 'AURA Concierge',
    clientName: 'AURA Maison Group',
    visitorId: 'vis-aura-892',
    visitorName: 'Sophie Beaumont',
    visitorEmail: 'sophie.b@paris-lux.fr',
    visitorPhone: '+33 6 82 91 00 23',
    messages: [
      { id: 'm1', sender: 'user', text: 'Bonjour, what is the private consultation fee for the Tourbillon collection?', timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
      { id: 'm2', sender: 'bot', text: 'Welcome to AURA Maison. Private salon viewings in Paris and London are complimentary for registered clients with insured delivery included.', timestamp: new Date(Date.now() - 1000 * 60 * 39).toISOString() },
      { id: 'm3', sender: 'user', text: 'Can I speak directly with the concierge manager on WhatsApp?', timestamp: new Date(Date.now() - 1000 * 60 * 36).toISOString() },
      { id: 'm4', sender: 'bot', text: 'Certainly! You can connect with our head concierge immediately on WhatsApp: [💬 Direct VIP WhatsApp Concierge](https://wa.me/33612345678)', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString() }
    ],
    startedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'escalated_to_whatsapp',
    satisfaction: 'positive',
  },
  {
    id: 'conv-102',
    botId: 'bot-clinic-02',
    botName: 'Apex Clinical Advisor',
    clientName: 'Apex Health Institute',
    visitorId: 'vis-apex-412',
    visitorName: 'Tariq Al-Mansoor',
    visitorPhone: '+971 50 847 2910',
    messages: [
      { id: 'm1', sender: 'user', text: 'What does the Executive Longevity biomarker panel include?', timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString() },
      { id: 'm2', sender: 'bot', text: 'Our Executive Longevity Panel includes full-genome sequencing, epigenetic biological age profiling, metabolic lipidomics, and a dedicated 90-minute consultation with Dr. Vance.', timestamp: new Date(Date.now() - 1000 * 60 * 129).toISOString() },
      { id: 'm3', sender: 'user', text: 'How do I book for next Monday in Dubai?', timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString() },
      { id: 'm4', sender: 'bot', text: 'I have logged your booking request. Our clinical intake coordinator will reach out to confirm your private suite at +971 50 847 2910.', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
    ],
    startedAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'resolved',
    satisfaction: 'positive',
  }
];

class DatabaseEngine {
  private data: AppDatabase;

  constructor() {
    this.data = this.load();
  }

  /** Ensure every stored credential is a scrypt hash, seed accounts exist, and none of the default bots are missing. */
  private normalizeSecrets(db: AppDatabase): AppDatabase {
    const users = db.clientUsers.map((u) => ({
      ...u,
      passwordHash: isHashedPassword(u.passwordHash) ? u.passwordHash : hashPassword(u.passwordHash || generatePassword()),
    }));

    // Safety net: merge back any default bot that is missing from the persisted file.
    const botIds = new Set(db.bots.map((b) => b.id));
    for (const def of DEFAULT_BOTS) {
      if (!botIds.has(def.id)) {
        db.bots.push(def);
        botIds.add(def.id);
      }
    }
    if (!users.some((u) => u.email.toLowerCase() === 'admin@agency.com')) {
      users.push({
        id: 'user-admin',
        email: 'admin@agency.com',
        passwordHash: hashPassword('admin123'),
        name: 'Agency Founder',
        companyName: 'BotCraft AI Agency',
        assignedBotIds: ['all'],
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
    if (!users.some((u) => u.email.toLowerCase() === 'viewer@agency.com')) {
      users.push({
        id: 'user-viewer',
        email: 'viewer@agency.com',
        passwordHash: hashPassword('viewer123'),
        name: 'Read-Only Analyst',
        companyName: 'BotCraft AI Agency',
        assignedBotIds: ['all'],
        role: 'viewer',
        createdAt: new Date().toISOString(),
      });
    }
    db.clientUsers = users;
    return db;
  }

  private load(): AppDatabase {
    let data: AppDatabase;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.bots && Array.isArray(parsed.bots)) {
          data = {
            bots: parsed.bots.length > 0 ? parsed.bots : DEFAULT_BOTS,
            clientUsers: parsed.clientUsers || INITIAL_CLIENT_USERS,
            conversations: parsed.conversations || INITIAL_CONVERSATIONS,
            leads: parsed.leads || INITIAL_LEADS,
            agencyProfile: parsed.agencyProfile || {
              name: 'BotCraft Agency',
              email: 'admin@agency.com',
              phone: '+1 800 555 0199',
              website: 'https://botcraft.ai',
              brandName: 'BotCraft AI',
            },
          };
        } else {
          throw new Error('Invalid database structure');
        }
      } else {
        data = {
          bots: DEFAULT_BOTS,
          clientUsers: INITIAL_CLIENT_USERS,
          conversations: INITIAL_CONVERSATIONS,
          leads: INITIAL_LEADS,
          agencyProfile: {
            name: 'BotCraft Agency',
            email: 'admin@agency.com',
            phone: '+1 800 555 0199',
            website: 'https://botcraft.ai',
            brandName: 'BotCraft AI',
          },
        };
      }
    } catch (e) {
      console.error('Error reading database file, using fresh seed data:', e);
      data = {
        bots: DEFAULT_BOTS,
        clientUsers: INITIAL_CLIENT_USERS,
        conversations: INITIAL_CONVERSATIONS,
        leads: INITIAL_LEADS,
        agencyProfile: {
          name: 'BotCraft Agency',
          email: 'admin@agency.com',
          phone: '+1 800 555 0199',
          website: 'https://botcraft.ai',
          brandName: 'BotCraft AI',
        },
      };
    }

    const normalized = this.normalizeSecrets(data);
    this.saveDirect(normalized);
    return normalized;
  }

  private saveDirect(db: AppDatabase) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write to database.json', e);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // --- BOTS CRUD ---
  public getBots(user?: { role: string; assignedBotIds?: string[] }): Chatbot[] {
    if (!user || user.role === 'admin' || user.assignedBotIds?.includes('all')) {
      return this.data.bots;
    }
    const ids = user.assignedBotIds || [];
    return this.data.bots.filter((b) => ids.includes(b.id));
  }

  public getBotById(id: string): Chatbot | undefined {
    return this.data.bots.find((b) => b.id === id);
  }

  public upsertBot(bot: Chatbot): Chatbot {
    const idx = this.data.bots.findIndex((b) => b.id === bot.id);
    const isNew = idx < 0;

    if (idx >= 0) {
      this.data.bots[idx] = { ...this.data.bots[idx], ...bot, updatedAt: new Date().toISOString() };
    } else {
      this.data.bots.push({
        ...bot,
        createdAt: bot.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // AUTO-PROVISION / SYNC DEDICATED CLIENT PORTAL ACCOUNT:
    const cleanCompanyName = (bot.clientName || bot.name || 'Client Business').trim();
    const slug = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || `client${Date.now()}`;
    const targetEmail = (bot.clientEmail?.trim().toLowerCase()) || `client@${slug.slice(0, 15)}.com`;
    const targetPassword = (bot.clientPassword?.trim()) || `${slug.slice(0, 8)}2026`;

    // Look for existing client user assigned to this bot or with this exact email
    const existingIdx = this.data.clientUsers.findIndex(
      (u) => u.assignedBotIds?.includes(bot.id) || u.email.toLowerCase() === targetEmail
    );

    if (existingIdx >= 0) {
      const existing = this.data.clientUsers[existingIdx];
      const botIds = Array.from(new Set([...(existing.assignedBotIds || []), bot.id]));
      this.data.clientUsers[existingIdx] = {
        ...existing,
        email: targetEmail,
        passwordHash: isHashedPassword(targetPassword) ? targetPassword : hashPassword(targetPassword),
        name: cleanCompanyName,
        companyName: cleanCompanyName,
        assignedBotIds: botIds,
      };
    } else {
      this.data.clientUsers.push({
        id: `user-client-${bot.id}`,
        email: targetEmail,
        passwordHash: isHashedPassword(targetPassword) ? targetPassword : hashPassword(targetPassword),
        name: cleanCompanyName,
        companyName: cleanCompanyName,
        assignedBotIds: [bot.id],
        role: 'client',
        createdAt: new Date().toISOString(),
      });
    }

    this.save();
    return this.getBotById(bot.id)!;
  }

  public deleteBot(id: string): boolean {
    const initialLen = this.data.bots.length;
    this.data.bots = this.data.bots.filter((b) => b.id !== id);
    if (this.data.bots.length !== initialLen) {
      // Also remove this bot's private API key (if any).
      if (this.data.geminiApiKeys && id in this.data.geminiApiKeys) {
        delete this.data.geminiApiKeys[id];
      }
      this.save();
      return true;
    }
    return false;
  }

  // --- PER-BOT GEMINI API KEYS (admin-managed, never exposed to clients) ---
  public getBotApiKey(botId: string): string | null {
    if (!this.data.geminiApiKeys) return null;
    const key = this.data.geminiApiKeys[botId];
    return typeof key === "string" && key.length > 0 ? key : null;
  }

  public hasBotApiKey(botId: string): boolean {
    return this.getBotApiKey(botId) !== null;
  }

  public setBotApiKey(botId: string, key: string | null): void {
    if (!this.data.geminiApiKeys) this.data.geminiApiKeys = {};
    if (key && key.trim().length > 0) {
      this.data.geminiApiKeys[botId] = key.trim();
    } else {
      delete this.data.geminiApiKeys[botId];
    }
    this.save();
  }

  // --- CLIENT USERS ---
  public getClientUsers(): ClientUser[] {
    return this.data.clientUsers;
  }

  public findUserByEmail(email: string): ClientUser | undefined {
    return this.data.clientUsers.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public getUserById(id: string): ClientUser | undefined {
    return this.data.clientUsers.find((u) => u.id === id);
  }

  public upsertClientUser(user: ClientUser): ClientUser {
    const idx = this.data.clientUsers.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    const stored: ClientUser = {
      ...user,
      email: user.email.toLowerCase().trim(),
      passwordHash: isHashedPassword(user.passwordHash) ? user.passwordHash : hashPassword(user.passwordHash || generatePassword()),
    };
    if (idx >= 0) {
      this.data.clientUsers[idx] = { ...this.data.clientUsers[idx], ...stored };
    } else {
      this.data.clientUsers.push(stored);
    }
    this.save();
    return stored;
  }

  public deleteClientUser(id: string): boolean {
    const initialLen = this.data.clientUsers.length;
    this.data.clientUsers = this.data.clientUsers.filter((u) => u.id !== id);
    if (this.data.clientUsers.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- CONVERSATIONS ---
  public getConversations(botId?: string): StoredConversation[] {
    if (botId && botId !== 'all') {
      return this.data.conversations.filter((c) => c.botId === botId);
    }
    return this.data.conversations;
  }

  public logConversationMessage(payload: {
    conversationId?: string;
    botId: string;
    botName?: string;
    clientName?: string;
    visitorId: string;
    visitorName?: string;
    visitorPhone?: string;
    visitorEmail?: string;
    message: { sender: 'user' | 'bot' | 'system'; text: string; id?: string; timestamp?: string };
    status?: 'active' | 'resolved' | 'escalated_to_whatsapp';
  }): StoredConversation {
    const convId = payload.conversationId || `conv-${payload.botId}-${payload.visitorId}`;
    let conv = this.data.conversations.find((c) => c.id === convId);

    const now = new Date().toISOString();
    const msg = {
      id: payload.message.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: payload.message.sender,
      text: payload.message.text,
      timestamp: payload.message.timestamp || now,
    };

    if (!conv) {
      const bot = this.getBotById(payload.botId);
      conv = {
        id: convId,
        botId: payload.botId,
        botName: payload.botName || bot?.name || 'AI Assistant',
        clientName: payload.clientName || bot?.clientName || 'General Client',
        visitorId: payload.visitorId,
        visitorName: payload.visitorName,
        visitorPhone: payload.visitorPhone,
        visitorEmail: payload.visitorEmail,
        messages: [msg],
        startedAt: now,
        lastActiveAt: now,
        status: payload.status || 'active',
      };
      this.data.conversations.unshift(conv);
    } else {
      conv.messages.push(msg);
      conv.lastActiveAt = now;
      if (payload.status) conv.status = payload.status;
      if (payload.visitorName && !conv.visitorName) conv.visitorName = payload.visitorName;
      if (payload.visitorPhone && !conv.visitorPhone) conv.visitorPhone = payload.visitorPhone;
      if (payload.visitorEmail && !conv.visitorEmail) conv.visitorEmail = payload.visitorEmail;
    }

    // Update bot stats
    const targetBot = this.getBotById(payload.botId);
    if (targetBot) {
      targetBot.stats = targetBot.stats || {
        totalConversations: 0,
        totalMessages: 0,
        satisfactionRate: 98,
        resolvedQueries: 0,
        avgResponseTimeMs: 450,
      };
      targetBot.stats.totalMessages += 1;
      if (conv.messages.length === 1) {
        targetBot.stats.totalConversations += 1;
      }
    }

    this.save();
    return conv;
  }

  // --- LEADS ---
  public getLeads(botId?: string): StoredLead[] {
    if (botId && botId !== 'all') {
      return this.data.leads.filter((l) => l.botId === botId);
    }
    return this.data.leads;
  }

  public addLead(lead: Omit<StoredLead, 'id' | 'createdAt' | 'status'>): StoredLead {
    const newLead: StoredLead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    this.data.leads.unshift(newLead);
    this.save();
    return newLead;
  }

  public updateLeadStatus(id: string, status: StoredLead['status']): StoredLead | null {
    const lead = this.data.leads.find((l) => l.id === id);
    if (lead) {
      lead.status = status;
      this.save();
      return lead;
    }
    return null;
  }
}

export const db = new DatabaseEngine();
