import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";
import type { ClientUser } from "./server/db";
import {
  verifyPassword,
  createSession,
  getSessionUserId,
  destroySession,
  readSessionToken,
  setSessionCookie,
  clearSessionCookie,
  rateLimiter,
  isUnsafeUrl,
  normalizeUrl,
  securityHeaders,
} from "./server/security";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(express.json({ limit: "1mb" }));
app.use(attachUser);

// Server-side Gemini client factory.
// Each request may use its own key: the bot's dedicated key (if the admin set one)
// or the platform's master GEMINI_API_KEY. Keys never leave the server.
function getAI(keyOverride?: string): GoogleGenAI | null {
  const apiKey = keyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ==========================================
// AUTH / SESSION MIDDLEWARE & GUARDS
// ==========================================
declare global {
  namespace Express {
    interface Request {
      user?: ClientUser;
      sessionId?: string;
    }
  }
}

type RoleName = "admin" | "client" | "viewer";

/** Resolve the current session user (if any) for every request. */
function attachUser(req: express.Request, _res: express.Response, next: express.NextFunction) {
  const token = readSessionToken(req);
  req.sessionId = token || undefined;
  const userId = token ? getSessionUserId(token) : null;
  req.user = userId ? db.getUserById(userId) : undefined;
  next();
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }
  next();
}

function requireRole(...roles: RoleName[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required. Please sign in." });
    if (!roles.includes(req.user.role as RoleName)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

function canAccessBot(user: ClientUser | undefined, botId: string | undefined | null): boolean {
  if (!botId) return false;
  if (!user) return false;
  if (user.role === "admin" || user.assignedBotIds?.includes("all")) return true;
  return !!user.assignedBotIds?.includes(botId);
}

/** Keeps client/viewer accounts confined to their assigned bots. */
function requireBotAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required. Please sign in." });
  const botId = (req.params.id as string) || (req.query?.botId as string);
  if (!canAccessBot(req.user, botId)) {
    return res.status(403).json({ error: "You do not have access to this bot." });
  }
  next();
}

/** Strip every secret field before serializing user accounts. */
function sanitizeUser(user: ClientUser) {
  const { passwordHash: _removed, ...safe } = user;
  return safe;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ==========================================
// 1. AUTH & CLIENT PORTAL LOGIN
// ==========================================
app.post("/api/auth/login", rateLimiter({ windowMs: 60_000, max: 10 }), (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = db.findUserByEmail(cleanEmail);

    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
    }

    user.lastLogin = new Date().toISOString();
    db.save();

    const token = createSession(user.id);
    setSessionCookie(res, token, IS_PROD);

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ success: true, user: sanitizeUser(req.user) });
});

app.post("/api/auth/logout", (req, res) => {
  destroySession(req.sessionId);
  clearSessionCookie(res);
  return res.json({ success: true });
});

// ==========================================
// 2. BOTS DATABASE API (PERSISTENT)
// ==========================================
app.get("/api/bots", requireAuth, (req, res) => {
  try {
    // Scope is always derived from the authenticated session — never trust query params.
    const bots = db.getBots(req.user);
    return res.json({ success: true, bots });
  } catch (error: any) {
    console.error("Fetch bots error:", error);
    return res.status(500).json({ error: "Failed to fetch bots" });
  }
});

app.get("/api/bots/:id", requireAuth, requireBotAccess, (req, res) => {
  try {
    const bot = db.getBotById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }
    return res.json({ success: true, bot });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch bot" });
  }
});

app.get("/api/bots/:id/client-access", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const bot = db.getBotById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    // Find the dedicated client user account for this bot
    let clientUser = db.getClientUsers().find((u) => u.assignedBotIds?.includes(bot.id));
    if (!clientUser) {
      const cleanCompanyName = (bot.clientName || bot.name || 'Client Business').trim();
      const slug = cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || `client${Date.now()}`;
      clientUser = db.upsertClientUser({
        id: `user-client-${bot.id}`,
        email: `client@${slug.slice(0, 15)}.com`,
        passwordHash: `${slug.slice(0, 8)}2026`,
        name: cleanCompanyName,
        companyName: cleanCompanyName,
        assignedBotIds: [bot.id],
        role: 'client',
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      credentials: {
        email: clientUser.email,
        // Displayed once to the admin after creation; the stored copy is always hashed.
        password: clientUser.passwordHash.startsWith("$s0$") ? "(hashed — reset via client account manager)" : clientUser.passwordHash,
        name: clientUser.name,
        companyName: clientUser.companyName,
        role: clientUser.role,
        portalUrl: `/?portal=true`,
        directDemoUrl: `/?demo=${bot.id}`,
      },
      bot,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch client access" });
  }
});

app.post("/api/bots", requireAuth, (req, res) => {
  try {
    const botData = req.body;
    if (!botData || !botData.id || !botData.name) {
      return res.status(400).json({ error: "Bot id and name are required" });
    }

    const existing = db.getBotById(botData.id);
    if (!existing && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create new bots." });
    }
    if (existing && req.user?.role === "viewer") {
      return res.status(403).json({ error: "Viewer accounts are read-only." });
    }
    if (existing && req.user?.role === "client" && !canAccessBot(req.user, botData.id)) {
      return res.status(403).json({ error: "You do not have access to this bot." });
    }

    const saved = db.upsertBot(botData);
    return res.json({ success: true, bot: saved });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to save bot" });
  }
});

app.delete("/api/bots/:id", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const ok = db.deleteBot(req.params.id);
    return res.json({ success: ok });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to delete bot" });
  }
});

// Public read-only bot profile (used by the embed widget on any website).
// Exposes only the fields a chatbot needs to run — never secrets.
app.get("/api/bots/:id/public", rateLimiter({ windowMs: 60_000, max: 240 }), (req, res) => {
  try {
    const bot = db.getBotById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }
    if (bot.isActive === false) {
      return res.status(404).json({ error: "Bot is not published." });
    }
    const safe = {
      id: bot.id,
      name: bot.name,
      clientName: bot.clientName,
      clientDomain: bot.clientDomain,
      description: bot.description,
      avatar: bot.avatar,
      role: bot.role,
      tone: bot.tone,
      websiteUrl: bot.websiteUrl,
      language: bot.language,
      systemPrompt: bot.systemPrompt,
      knowledgeBase: bot.knowledgeBase,
      rules: bot.rules || [],
      faqs: bot.faqs || [],
      whatsappNumber: bot.whatsappNumber,
      whatsappMessage: bot.whatsappMessage,
      enableWhatsAppHandover: bot.enableWhatsAppHandover,
      widgetConfig: bot.widgetConfig,
      isActive: true, // already guaranteed by the `isActive === false` guard above
      updatedAt: bot.updatedAt,
    };
    return res.json({ success: true, bot: safe });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch bot" });
  }
});

// Per-bot Gemini API key management (admin only).
// The actual key is stored server-side and NEVER returned in any response.
app.get("/api/bots/:id/apikey", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const bot = db.getBotById(req.params.id);
    if (!bot) return res.status(404).json({ error: "Bot not found" });
    return res.json({ success: true, hasKey: db.hasBotApiKey(bot.id) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to read key status" });
  }
});

app.post("/api/bots/:id/apikey", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const bot = db.getBotById(req.params.id);
    if (!bot) return res.status(404).json({ error: "Bot not found" });
    const text = String(req.body?.text ?? "").trim();
    db.setBotApiKey(bot.id, text || null);
    return res.json({ success: true, hasKey: db.hasBotApiKey(bot.id) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to save the key" });
  }
});

// ==========================================
// 3. CLIENT USER ACCOUNTS MANAGEMENT (ADMIN)
// ==========================================
app.get("/api/client-users", requireAuth, requireRole("admin"), (_req, res) => {
  try {
    const users = db.getClientUsers().map(sanitizeUser);
    return res.json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch client users" });
  }
});

app.post("/api/client-users", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const { email, password, name, companyName, assignedBotIds, role } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    const cleanRole: RoleName = role === "admin" || role === "client" || role === "viewer" ? role : "client";

    const newUser = db.upsertClientUser({
      id: req.body.id || `user-client-${Date.now()}`,
      email: email.toLowerCase().trim(),
      passwordHash: String(password),
      name,
      companyName: companyName || name,
      assignedBotIds: Array.isArray(assignedBotIds) && assignedBotIds.length > 0 ? assignedBotIds : ['all'],
      role: cleanRole,
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, user: sanitizeUser(newUser), generatedPassword: password });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to create client user" });
  }
});

app.delete("/api/client-users/:id", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const ok = db.deleteClientUser(req.params.id);
    return res.json({ success: ok });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to delete client user" });
  }
});

// ==========================================
// 4. REAL CONVERSATION TRANSCRIPTS & LOGS
// ==========================================
app.get("/api/conversations", requireAuth, (req, res) => {
  try {
    const botId = req.query.botId as string;
    if (botId && botId !== "all" && !canAccessBot(req.user, botId)) {
      return res.status(403).json({ error: "You do not have access to this bot's conversations." });
    }
    const conversations = db.getConversations(botId);
    return res.json({ success: true, conversations });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Public capture endpoint used by embedded widgets (rate-limited).
app.post("/api/conversations/log", rateLimiter({ windowMs: 60_000, max: 90 }), (req, res) => {
  try {
    const {
      conversationId,
      botId,
      botName,
      clientName,
      visitorId,
      visitorName,
      visitorPhone,
      visitorEmail,
      message,
      messages,
      status,
    } = req.body || {};

    // Accept either a single message object or an array (last message wins).
    const single = message && message.text ? message : Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;

    if (!botId || !single || !single.text) {
      return res.status(400).json({ error: "botId and message are required" });
    }

    db.logConversationMessage({
      conversationId,
      botId,
      botName,
      clientName,
      visitorId: visitorId || `vis-${Date.now()}`,
      visitorName,
      visitorPhone,
      visitorEmail,
      message: single,
      status,
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Conversation log error:", error);
    return res.status(500).json({ error: "Failed to log conversation" });
  }
});

// ==========================================
// 5. CAPTURED LEADS (VISITOR CRM)
// ==========================================
app.get("/api/leads", requireAuth, (req, res) => {
  try {
    const botId = req.query.botId as string;
    if (botId && botId !== "all" && !canAccessBot(req.user, botId)) {
      return res.status(403).json({ error: "You do not have access to this bot's leads." });
    }
    const leads = db.getLeads(botId);
    return res.json({ success: true, leads });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Public capture endpoint used by embedded widgets (rate-limited).
// Accepts both canonical fields and the widget's aliases (name/phone/note) for safety.
app.post("/api/leads", rateLimiter({ windowMs: 60_000, max: 60 }), (req, res) => {
  try {
    const {
      botId,
      botName,
      clientName,
      visitorName,
      visitorEmail,
      visitorPhone,
      message,
      sourceUrl,
      name,
      phone,
      note,
    } = req.body || {};

    const safeVisitorName = visitorName || name || '';
    const safeVisitorEmail = visitorEmail || '';
    const safeVisitorPhone = visitorPhone || phone || '';
    const safeMessage = message || note || '';

    if (!botId || (!safeVisitorName && !safeVisitorEmail && !safeVisitorPhone)) {
      return res.status(400).json({ error: "botId and contact info are required" });
    }

    const lead = db.addLead({
      botId,
      botName: botName || "AI Assistant",
      clientName: clientName || "Client Business",
      visitorName: safeVisitorName || "Anonymous Visitor",
      visitorEmail: safeVisitorEmail,
      visitorPhone: safeVisitorPhone,
      message: safeMessage,
      sourceUrl: sourceUrl || "",
    });

    return res.json({ success: true, lead });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to add lead" });
  }
});

app.patch("/api/leads/:id", requireAuth, (req, res) => {
  try {
    const lead = db.getLeads().find((l) => l.id === req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (!canAccessBot(req.user, lead.botId)) {
      return res.status(403).json({ error: "You do not have access to this lead." });
    }
    const { status } = req.body || {};
    const updated = db.updateLeadStatus(req.params.id, status);
    return res.json({ success: true, lead: updated });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to update lead" });
  }
});

// Chat API endpoint (public widget endpoint, rate-limited)
app.post("/api/chat", rateLimiter({ windowMs: 60_000, max: 25 }), async (req, res) => {
  try {
    const {
      botId,
      botName,
      systemPrompt,
      tone,
      knowledgeBase,
      rules,
      faqs,
      conversationHistory,
      message,
      whatsappNumber,
      whatsappMessage,
    } = req.body || {};

    const text = String(message || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (text.length > 4000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    // Use the bot's own dedicated key when the admin set one; otherwise fall back
    // to the platform master key. The key never leaves the server.
    const botKey = botId ? db.getBotApiKey(String(botId)) : null;
    const ai = getAI(botKey || undefined);
    if (!ai) {
      // Graceful fallback response if no API key is set
      const waNotice = whatsappNumber 
        ? `\n\n💬 You can also reach our human support team directly on WhatsApp: https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
        : '';
      return res.json({
        response: `Hello! I am ${botName || "your AI Assistant"}. I am here to help answer your questions, guide you through our products and services, and assist with any inquiries.${waNotice}`,
        isMock: true,
      });
    }

    // Build rich, structured context
    let contextPrompt = `You are a high-tier, sophisticated AI assistant embedded as a website chat widget named "${botName || "AI Concierge"}".\n`;
    contextPrompt += `Your desired tone of voice is: ${tone || "friendly, polished, and professional"}.\n\n`;
    
    if (systemPrompt && systemPrompt.trim()) {
      contextPrompt += `=== CORE GOALS & INSTRUCTIONS ===\n${systemPrompt}\n\n`;
    } else {
      contextPrompt += `=== CORE GOALS ===\nProvide helpful, elegant, concise, and accurate answers to website visitors, guiding them towards solutions, bookings, or purchases seamlessly.\n\n`;
    }

    // WhatsApp Human Support Handover Rule
    if (whatsappNumber && whatsappNumber.trim()) {
      const cleanPhone = whatsappNumber.trim().replace(/[^0-9+]/g, '').replace(/^\+/, '');
      const defaultMsg = encodeURIComponent(whatsappMessage || `Hello! I would like to speak with your support team regarding my inquiry on your website.`);
      const waLink = `https://wa.me/${cleanPhone}?text=${defaultMsg}`;
      
      contextPrompt += `=== HUMAN SUPPORT & WHATSAPP HANDOVER INSTRUCTIONS ===\n`;
      contextPrompt += `The project owner / company provides official direct human support via WhatsApp.\n`;
      contextPrompt += `Official WhatsApp Number: +${cleanPhone}\n`;
      contextPrompt += `Direct WhatsApp Link: ${waLink}\n`;
      contextPrompt += `RULE: If the visitor explicitly asks to speak with a human, calls for management/support agent, expresses anger/frustration, or asks for complex custom quotes not in the knowledge base, warmly answer their inquiry as best you can and DIRECT them to speak with human support on WhatsApp using this format:\n`;
      contextPrompt += `"If you would prefer to speak directly with our human support team or the project owner, you can reach us right away on WhatsApp:\n[💬 Chat with live support on WhatsApp](${waLink})"\n=====================================================\n\n`;
    }

    if (rules && Array.isArray(rules) && rules.length > 0) {
      contextPrompt += `=== STRICT BEHAVIORAL RULES & GUARDRAILS ===\n`;
      rules.forEach((rule: string, idx: number) => {
        if (rule && rule.trim()) {
          contextPrompt += `${idx + 1}. ${rule.trim()}\n`;
        }
      });
      contextPrompt += `You MUST STRICTLY FOLLOW every rule above without deviation.\n============================================\n\n`;
    }

    if (knowledgeBase && knowledgeBase.trim()) {
      contextPrompt += `=== VERIFIED KNOWLEDGE BASE & STORE DATA ===\n${knowledgeBase}\n============================================\n\n`;
    }

    if (faqs && Array.isArray(faqs) && faqs.length > 0) {
      contextPrompt += `=== VERIFIED FAQ REPOSITORY ===\n`;
      faqs.forEach((faq: { question: string; answer: string }, idx: number) => {
        if (faq.question && faq.answer) {
          contextPrompt += `Q${idx + 1}: ${faq.question}\nA${idx + 1}: ${faq.answer}\n`;
        }
      });
      contextPrompt += `===============================\n\n`;
    }

    contextPrompt += `Response Guidelines:
1. Always adhere strictly to the verified knowledge base, FAQs, and behavioral rules. If information (such as exact unlisted pricing or secret policies) is not in the knowledge base, politely guide them to the contact channels or WhatsApp support.
2. Format answers with clear, beautiful markdown typography (bold key points, clean bullet lists when listing options).
3. Be concise, engaging, and hospitable. Keep answers under 3-4 short paragraphs unless the user asks for deep technical details.`;

    // Format chat history
    const contents: any[] = [];
    
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-8).forEach((item: { sender: string; text: string }) => {
        if (item.sender === "user") {
          contents.push({ role: "user", parts: [{ text: item.text }] });
        } else if (item.sender === "bot") {
          contents.push({ role: "model", parts: [{ text: item.text }] });
        }
      });
    }

    // Add current user message
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I apologize, I could not generate a response right now. Please try again.";
    return res.json({ response: replyText, isMock: false });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error: "Failed to generate AI response",
      details: error?.message || "Unexpected error",
    });
  }
});

// Helper to sanitize HTML to plain text
function sanitizeHtmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Deep Multi-Page AI Website Crawler & Knowledge Extractor
app.post("/api/ai/analyze-website", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rawUrl = (req.body.url || "").trim();
    const cleanUrl = normalizeUrl(rawUrl);
    const safety = await isUnsafeUrl(rawUrl);
    if (!safety.ok) {
      return res.status(400).json({ error: `URL blocked: ${safety.reason}` });
    }
    if (!cleanUrl) {
      return res.status(400).json({ error: "Website URL is required" });
    }

    const { botRole } = req.body;
    
    // Extract domain and brand name (cleanUrl was already normalized above)
    let domainName = "brand";
    let originUrl = cleanUrl;
    try {
      const parsedUrl = new URL(cleanUrl);
      domainName = parsedUrl.hostname.replace(/^www\./, '');
      originUrl = parsedUrl.origin;
    } catch {
      domainName = cleanUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
    const brandPart = domainName.split('.')[0] || "Business";
    const capitalizedBrand = brandPart.charAt(0).toUpperCase() + brandPart.slice(1);

        let extractedPages: { url: string; title: string; text: string }[] = [];
    let detectedWhatsApp: string | null = null;

    // Breadth-first deep crawl: index every same-origin page we can reach
    // (small and large sites), then merge all content into one rich corpus.
    const maxPages = Math.max(1, Math.min(Number(req.body?.maxPages) || 90, 300));
    const seen = new Set<string>();
    const queue: string[] = [cleanUrl];
    const canonicalKey = (url: string) => {
      try { const p = new URL(url); return (p.origin + p.pathname).toLowerCase().replace(/\/+$/, ""); } catch { return url; }
    };
    const looksLikeAsset = (href: string) => /\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|mp4|mp3|mov|zip|rar|pdf|docx?|xlsx?|pptx?|css|js)$/i.test(href);

    while (queue.length > 0 && extractedPages.length < maxPages) {
      const batch = queue.splice(0, 6);
      await Promise.all(batch.map(async (url: string) => {
        const key = canonicalKey(url);
        if (seen.has(key) || extractedPages.length >= maxPages) return;
        seen.add(key);
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch(url, {
            signal: ctrl.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
            },
          });
          clearTimeout(tid);
          const ct = res.headers.get("content-type") || "";
          if (!res.ok || (ct && !ct.includes("text/html") && !ct.includes("application/xhtml"))) return;
          const html = await res.text();
          const text = sanitizeHtmlToText(html).slice(0, 12000);
          const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || new URL(url).hostname;
          extractedPages.push({ url, title, text });

          const wa = html.match(/(?:https?:\/\/)?(?:api\.whatsapp\.com\/send\?phone=|wa\.me\/|whatsapp:\/\/send\?phone=)([0-9+]+)/i);
          if (wa && wa[1] && !detectedWhatsApp) detectedWhatsApp = wa[1].replace(/[^0-9+]/g, "");

          for (const m of Array.from(html.matchAll(/href=["']([^"']+)["']/gi))) {
            const href = m[1];
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:") || looksLikeAsset(href)) continue;
            try {
              const full = new URL(href, url).toString();
              const p = new URL(full);
              if (p.hostname.replace(/^www\./, "") !== domainName) continue;
              const k2 = canonicalKey(full);
              if (!seen.has(k2) && seen.size < maxPages * 6) {
                seen.add(k2);
                queue.push(full);
              }
            } catch { /* ignore invalid link */ }
          }
        } catch { /* page failure is fine */ }
      }));
    }

    // Cap per-page text, then merge everything into one comprehensive corpus.
    extractedPages = extractedPages.map((p) => ({ ...p, text: p.text.slice(0, 12000) }));

    let aggregatedContent = "";
    if (extractedPages.length === 0) {
      aggregatedContent = `No live pages were reachable. Synthesize complete, realistic business details for ${capitalizedBrand} (${domainName}) based on industry-standard offerings for ${botRole || "E-commerce & Client Services"}.`;
    } else {
      extractedPages.forEach((p, idx) => {
        aggregatedContent += `\n\n--- PAGE ${idx + 1}: ${p.title} (${p.url}) ---\n${p.text}\n`;
      });
    }
    aggregatedContent = aggregatedContent.slice(0, 300000);

    const ai = getAI();
    let finalPayload: any = null;

    if (ai) {
      try {
        const extractionPrompt = `You are a world-class Business Intelligence & Conversational AI Architect.
The user wants to generate a comprehensive, highly trained AI Assistant for a client website by analyzing all pages of their site.

Target Website URL: "${cleanUrl}"
Domain Name: "${domainName}"
Pages Crawled: ${extractedPages.length > 0 ? extractedPages.map(p => p.url).join(', ') : cleanUrl}
Detected WhatsApp: "${detectedWhatsApp || 'Not found'}"

Extracted Deep Multi-Page Content:
"""
${aggregatedContent.slice(0, 120000)}
"""
Preferred Role: "${botRole || "Customer Concierge & Sales Guide"}"

Generate a complete, deeply structured JSON payload with:
1. "name": Branded name for the bot (e.g. "${capitalizedBrand} AI Concierge")
2. "clientName": "${capitalizedBrand} Official"
3. "description": 2-sentence executive summary of the brand and bot's mission
4. "whatsappNumber": "${detectedWhatsApp || ''}"
5. "whatsappMessage": "Hello! I would like to speak with your support team regarding my inquiry on ${capitalizedBrand}"
6. "knowledgeBase": A maximally comprehensive, deeply detailed multi-section knowledge base (aim for at least 1000-1600 words) formatted in beautiful clean Markdown, covering EVERY verifiable fact extracted from ALL the crawled pages below — every product, service, price, policy, menu, FAQ, location, contact detail, and page topic you find. Leave nothing out that appears on the site:
   - 🏛️ Company Profile & Brand Overview
   - 🛍️ Key Offerings, Products, Services & Catalogs
   - 💳 Pricing, Packages, Payment Methods & Quotation Process
   - 🚚 Shipping, Delivery, Returns, Guarantees & Booking Policies
   - 📞 Contact Channels, Headquarters, Support Hours & WhatsApp
7. "faqs": Array of at least 5-7 realistic, high-value client questions and detailed, polite answers covering products, orders, shipping, and support:
   [
     { "question": "...", "answer": "..." }
   ]
8. "rules": Array of at least 4 strict behavioral guardrails for the AI (e.g. never invent fake prices, offer WhatsApp support if customer is in doubt, be polite and concise)
9. "suggestedQuestions": Array of 3-4 short starter prompt chips for website visitors
10. "systemPrompt": A tailored, high-converting system instruction for this company
11. "welcomeMessage": A warm, welcoming greeting for website visitors (in the website's primary language, e.g. Arabic or English)
12. "headerTitle": "${capitalizedBrand} Concierge"
13. "headerSubtitle": "Official AI Assistant • Instant Replies"
14. "launcherLabel": "Chat with ${capitalizedBrand}"
15. "crawledPagesCount": ${extractedPages.length || 1}

Output ONLY valid JSON without markdown wrapping.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: extractionPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const rawJson = response.text || "{}";
        const cleanedJson = rawJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        finalPayload = JSON.parse(cleanedJson);
      } catch (aiErr) {
        console.warn("AI generation failed or invalid JSON, using structured fallback:", aiErr);
      }
    }

    if (!finalPayload) {
      finalPayload = {
        name: `${capitalizedBrand} AI Assistant`,
        clientName: `${capitalizedBrand} Co.`,
        description: `Bespoke AI Concierge engineered for ${domainName}, delivering 24/7 client guidance.`,
        whatsappNumber: detectedWhatsApp || '',
        whatsappMessage: `Hello! I would like to speak with your support team regarding my inquiry on ${capitalizedBrand}`,
        knowledgeBase: `### 🏛️ Company Overview\n${capitalizedBrand} is a premier provider of industry-leading products and client services.\n\n### 🛍️ Offerings & Services\n- Bespoke solutions tailored to client requirements.\n- High-reliability catalog with verified authenticity.\n\n### 🚚 Shipping & Policies\n- Fast domestic and international delivery.\n- Secure checkout and 24/7 dedicated support.`,
        faqs: [
          { question: "How do I place an order or schedule a consultation?", answer: "You can place orders directly through our website or contact our concierge team for private arrangements." },
          { question: "What is your shipping and return policy?", answer: "We provide insured tracked shipping on all orders with hassle-free returns within 14 days." },
          { question: "How can I speak directly with customer support?", answer: `You can reach our team anytime via WhatsApp or through our official contact page.` }
        ],
        rules: [
          "Be polite, professional, and hospitable.",
          "Provide direct answers based on verified company data.",
          "If the visitor insists on human support, provide the official WhatsApp contact."
        ],
        suggestedQuestions: [
          "What are your top products & services?",
          "How does shipping & delivery work?",
          "Can I speak with a human support agent?"
        ],
        welcomeMessage: `Hello and welcome to ${capitalizedBrand}! How can I assist you with our catalog, services, or inquiries today?`,
        headerTitle: `${capitalizedBrand} Concierge`,
        headerSubtitle: "Official AI Assistant • 24/7 Support",
        launcherLabel: `Chat with ${capitalizedBrand}`,
        crawledPagesCount: extractedPages.length || 1,
      };
    }

    return res.json({ success: true, data: finalPayload });
  } catch (error: any) {
    console.error("AI website crawler error:", error);
    return res.status(500).json({
      error: "Failed to analyze website",
      details: error?.message || "Unexpected error",
    });
  }
});

// Auto-generate FAQs and knowledge base for a chatbot
app.post("/api/ai/generate-faq", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { businessDescription, botRole } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.json({
        faqs: [
          { question: "What are your business hours?", answer: "We operate Monday through Friday from 9:00 AM to 6:00 PM EST, with 24/7 AI chat support." },
          { question: "How can I schedule a consultation or demo?", answer: "You can book directly via our interactive calendar or by asking right here in chat." },
          { question: "Do you offer a warranty or money-back guarantee?", answer: "Yes, all our offerings come with a comprehensive 30-day satisfaction guarantee and priority support." },
        ],
      });
    }

    const prompt = `You are a world-class conversational AI architect.
Given this website business description:
"${businessDescription || "E-commerce store, SaaS platform, or luxury boutique"}"
and primary role: "${botRole || "Customer concierge & sales guide"}"

Generate 4 realistic, high-value, and elegant Frequently Asked Questions (FAQs) as JSON:
[
  { "question": "Clear question phrasing", "answer": "Polite, comprehensive, and crisp answer" }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    return res.json({ faqs: parsed });
  } catch (error: any) {
    console.error("FAQ generation error:", error);
    return res.status(500).json({ error: "Failed to generate FAQs" });
  }
});

// Auto-enhance bot prompt
app.post("/api/ai/enhance-prompt", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { currentPrompt, botName, botRole } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.json({
        enhancedPrompt: `You are ${botName || "the AI Concierge"}, specializing in ${botRole || "customer success"}. Deliver exceptional, courteous assistance, highlight key product benefits, resolve inquiries with precision, and guide users effortlessly towards conversions.`,
      });
    }

    const prompt = `You are an elite Prompt Engineer. Refine and enhance the following system prompt for an embedded website chatbot named "${botName}" with role "${botRole}":
Current Draft: "${currentPrompt || "Help website visitors and answer their questions"}"

Write an authoritative, highly effective, and polished system instruction in English that gives this chatbot distinct charm, domain mastery, and high conversion etiquette. Output only the prompt text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({ enhancedPrompt: response.text?.trim() });
  } catch (error: any) {
    console.error("Prompt enhance error:", error);
    return res.status(500).json({ error: "Failed to enhance prompt" });
  }
});

// Real Website Screenshot Fetcher (returns base64 dataUrl for seamless image capture)
app.all("/api/screenshot", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    let rawUrl = (req.method === "POST" ? req.body?.url : req.query?.url) as string || "";
    const safety = await isUnsafeUrl(rawUrl);
    if (!safety.ok) {
      return res.status(400).json({ error: `URL blocked: ${safety.reason}` });
    }
    rawUrl = normalizeUrl(rawUrl);
    
    if (!rawUrl) {
      return res.status(400).json({ error: "Website URL is required" });
    }

    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      rawUrl = "https://" + rawUrl;
    }

    // Try Google PageSpeed Insights Headless Chrome Engine first for accurate rendering
    try {
      const googlePsiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(rawUrl)}&strategy=desktop`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      
      const psiResp = await fetch(googlePsiUrl, {
        signal: controller.signal,
        headers: { "Accept": "application/json" }
      });
      clearTimeout(timeoutId);

      if (psiResp.ok) {
        const psiData = await psiResp.json();
        const screenshotData = 
          psiData.lighthouseResult?.audits?.['final-screenshot']?.details?.data ||
          psiData.lighthouseResult?.fullPageScreenshot?.screenshot?.data;

        if (screenshotData && typeof screenshotData === 'string' && screenshotData.startsWith('data:image')) {
          return res.json({
            success: true,
            dataUrl: screenshotData,
            url: rawUrl,
            engine: "google-chrome-lighthouse",
          });
        }
      }
    } catch (gErr) {
      console.warn("Google PSI screenshot attempt:", gErr);
    }

    // Diverse, high-speed screenshot rendering engines
    const providers = [
      `https://api.microlink.io/?url=${encodeURIComponent(rawUrl)}&screenshot=true&embed=screenshot.url`,
      `https://image.thum.io/get/width/1280/crop/800/noanimate/${rawUrl}`,
      `https://mini.s-shot.ru/1280x800/PNG/1280/Z100/?${encodeURIComponent(rawUrl)}`,
      `https://s0.wp.com/mshots/v1/${encodeURIComponent(rawUrl)}?w=1280&h=800`,
    ];

    for (const providerUrl of providers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const response = await fetch(providerUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get("content-type") || "image/jpeg";
          if (contentType.startsWith("image/") || contentType.includes("octet-stream")) {
            const arrayBuffer = await response.arrayBuffer();

            if (arrayBuffer.byteLength > 4000) {
              const buffer = Buffer.from(arrayBuffer);
              const base64 = buffer.toString("base64");
              const safeMime = contentType.startsWith("image/") ? contentType : "image/jpeg";
              const dataUrl = `data:${safeMime};base64,${base64}`;
              return res.json({ 
                success: true, 
                dataUrl, 
                url: rawUrl,
                engine: providerUrl.split('/')[2] || "provider",
                byteLength: arrayBuffer.byteLength 
              });
            }
          }
        }
      } catch (e) {
        console.warn(`Screenshot provider ${providerUrl} error, trying next...`);
      }
    }

    // Direct fallback with URL
    return res.json({ 
      success: true, 
      dataUrl: `https://image.thum.io/get/width/1280/crop/800/noanimate/${rawUrl}`, 
      url: rawUrl,
      isDirectUrl: true
    });
  } catch (error: any) {
    console.error("Screenshot API error:", error);
    return res.status(500).json({ error: "Failed to generate screenshot" });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const publicDir = path.join(process.cwd(), "public");
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
