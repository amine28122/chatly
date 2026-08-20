// =============================================
// Shared security utilities — password hashing,
// session store, rate limiting, SSRF protection.
// =============================================
import crypto from "node:crypto";
import { lookup } from "node:dns/promises";

// ---------- Password hashing (scrypt, built-in, zero deps) ----------
export const HASH_PREFIX = "$s0$";

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("base64url");
  const derived = crypto.scryptSync(String(plain), salt, 64);
  return `${HASH_PREFIX}${salt}$${derived.toString("base64url")}`;
}

export function verifyPassword(plain: string, stored: string | undefined): boolean {
  if (!stored || typeof stored !== "string" || stored.length === 0) return false;
  if (!stored.startsWith(HASH_PREFIX)) {
    // Legacy plaintext entry; only matches an exact equality during migration.
    return plain === stored;
  }
  const body = stored.slice(HASH_PREFIX.length);
  const sep = body.indexOf("$");
  if (sep < 0) return false;
  const salt = body.slice(0, sep);
  const expectedB64 = body.slice(sep + 1);
  try {
    const expected = Buffer.from(expectedB64, "base64url");
    const actual = crypto.scryptSync(String(plain), salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function isHashedPassword(stored: string | undefined): boolean {
  return !!stored && stored.startsWith(HASH_PREFIX);
}

export function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// ---------- Server-side session store ----------
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const sessionMap = new Map<string, { userId: string; createdAt: number }>();

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessionMap.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function getSessionUserId(token: string | null | undefined): string | null {
  if (!token) return null;
  const s = sessionMap.get(token);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessionMap.delete(token);
    return null;
  }
  return s.userId;
}

export function destroySession(token: string | null | undefined): void {
  if (token) sessionMap.delete(token);
}

// ---------- Cookie helpers (HttpOnly session cookie) ----------
export const SESSION_COOKIE_NAME = "chatly_session";

export function readSessionToken(req: any): string | null {
  const raw = req?.headers?.cookie as string | undefined;
  if (!raw) return null;
  const re = new RegExp("(?:^|;\\s*)" + SESSION_COOKIE_NAME + "=([^;]+)", "i");
  const m = raw.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

export function setSessionCookie(res: any, token: string, secure: boolean): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: any): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}
// ---------- Simple in-memory rate limiter (per IP, sliding window) ----------
interface RateLimiterOpts {
  windowMs: number;
  max: number;
}

export function rateLimiter({ windowMs, max }: RateLimiterOpts) {
  const hits = new Map<string, number[]>();
  return (req: any, res: any, next: any) => {
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
    }
    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}

// ---------- SSRF protection ----------
function isPrivateIp(ip: string): boolean {
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127 || a === 169) return true; // loopback / link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // private 172.16/12
    if (a === 192 && b === 168) return true; // private 192.168/16
    if (a >= 224) return true; // multicast/reserved
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local fe80::/10
  return false;
}

// ---------- URL normalization (auto-add scheme, strip whitespace) ----------
export function normalizeUrl(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return "https:" + raw;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) return raw;
  return "https://" + raw;
}

export async function isUnsafeUrl(url: string): Promise<{ ok: boolean; reason?: string }> {
  let u: URL;
  const normalized = normalizeUrl(url);
  try {
    u = new URL(normalized);
  } catch {
    return { ok: false, reason: "Invalid URL format." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "Only http/https URLs are allowed." };
  }
  if (u.username || u.password) {
    return { ok: false, reason: "URLs with embedded credentials are not allowed." };
  }
  if (/^localhost$|\.local$|^local\./i.test(u.hostname)) {
    return { ok: false, reason: "Local/internal hostnames are blocked." };
  }
  try {
    const addrs = await lookup(u.hostname, { all: true });
    if (addrs.length === 0) return { ok: false, reason: "Hostname could not be resolved." };
    for (const a of addrs) {
      if (isPrivateIp(a.address)) {
        return { ok: false, reason: "Private/internal network addresses are blocked." };
      }
    }
  } catch {
    return { ok: false, reason: "Hostname could not be resolved." };
  }
  return { ok: true };
}

// ---------- Basic security headers ----------
export function securityHeaders(_req: any, res: any, next: any): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https:; frame-ancestors *"
  );
  next();
}