// Μικρός server για τη σελίδα «Μηνύματα».
// Τα στατικά αρχεία (το Hugo site) σερβίρονται όπως πριν· μόνο το /api/* περνάει από εδώ.
import { DurableObject } from "cloudflare:workers";

const MAX_MESSAGES = 20;       // πόσα μηνύματα κρατάμε
const MAX_TEXT = 250;          // μέγιστο μήκος μηνύματος
const MIN_NICK = 2;
const MAX_NICK = 24;
const COOLDOWN_MS = 30_000;    // 1 μήνυμα ανά 30 δευτερόλεπτα
const BAN_MS = 6 * 3600_000;   // μπλόκο για 6 ώρες
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|gr|io|ru|xyz|info|biz|top|link|ly|me|co)\b)/i;
const RESERVED = ["admin", "διαχειριστης", "αγριοι δολιανων", "αγριοι-δολιανων", "moderator"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const stub = env.CHAT.get(env.CHAT.idFromName("main"));
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function normalize(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hue(nick) {
  let h = 0;
  for (const ch of normalize(nick)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h % 360;
}

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Η στιγμή (σε ms) που ξεκίνησε η τρέχουσα εβδομάδα: Δευτέρα 00:00 ώρα Ελλάδας.
function weekStart(now = Date.now()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Athens", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", weekday: "short",
    }).formatToParts(new Date(now)).map((p) => [p.type, p.value])
  );
  const y = +parts.year, m = +parts.month, d = +parts.day;
  const localAsUtc = Date.UTC(y, m - 1, d, +parts.hour, +parts.minute, +parts.second);
  const offset = Math.round((localAsUtc - now) / 60000) * 60000;
  const dayIdx = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
  return Date.UTC(y, m - 1, d - dayIdx) - offset;
}

export class Chat extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nick TEXT, text TEXT, color INTEGER, ts INTEGER, who TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS rate (who TEXT PRIMARY KEY, ts INTEGER)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS bans (who TEXT PRIMARY KEY, until INTEGER)`);
  }

  cleanup() {
    const now = Date.now();
    this.sql.exec(`DELETE FROM messages WHERE ts < ?`, weekStart(now));
    this.sql.exec(`DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY id DESC LIMIT ?)`, MAX_MESSAGES);
    this.sql.exec(`DELETE FROM rate WHERE ts < ?`, now - 3600_000);
    this.sql.exec(`DELETE FROM bans WHERE until < ?`, now);
  }

  list() {
    return this.sql.exec(`SELECT id, nick, text, color, ts FROM messages ORDER BY id ASC`).toArray();
  }

  isAdmin(request) {
    const key = request.headers.get("x-admin-key") || "";
    return Boolean(this.env.ADMIN_KEY) && key === this.env.ADMIN_KEY;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    this.cleanup();

    if (path === "/api/messages" && request.method === "GET") {
      return json({ messages: this.list() });
    }

    if (path === "/api/messages" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Κάτι πήγε στραβά." }, 400); }
      if (body.website) return json({ messages: this.list() }); // παγίδα για bots

      const nick = String(body.nick || "").replace(/\s+/g, " ").trim();
      const text = String(body.text || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (nick.length < MIN_NICK || nick.length > MAX_NICK)
        return json({ error: `Το ψευδώνυμο θέλει ${MIN_NICK} έως ${MAX_NICK} χαρακτήρες.` }, 400);
      if (RESERVED.includes(normalize(nick)))
        return json({ error: "Αυτό το ψευδώνυμο δεν επιτρέπεται, διάλεξε άλλο." }, 400);
      if (!text) return json({ error: "Γράψε κάτι πρώτα." }, 400);
      if (text.length > MAX_TEXT) return json({ error: `Έως ${MAX_TEXT} χαρακτήρες.` }, 400);
      if (LINK_RE.test(text) || LINK_RE.test(nick)) return json({ error: "Δεν επιτρέπονται σύνδεσμοι." }, 400);

      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const who = await sha256("agrioi:" + ip);
      const now = Date.now();

      const ban = this.sql.exec(`SELECT until FROM bans WHERE who = ?`, who).toArray()[0];
      if (ban) return json({ error: "Δεν μπορείς να γράψεις για λίγες ώρες." }, 403);

      const last = this.sql.exec(`SELECT ts FROM rate WHERE who = ?`, who).toArray()[0];
      if (last && now - last.ts < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - last.ts)) / 1000);
        return json({ error: `Περίμενε ${wait} δευτερόλεπτα πριν το επόμενο μήνυμα.` }, 429);
      }

      const dup = this.sql.exec(`SELECT 1 FROM messages WHERE who = ? AND text = ?`, who, text).toArray()[0];
      if (dup) return json({ error: "Αυτό το έγραψες ήδη." }, 400);

      this.sql.exec(`INSERT INTO messages (nick, text, color, ts, who) VALUES (?, ?, ?, ?, ?)`,
        nick, text, hue(nick), now, who);
      this.sql.exec(`INSERT INTO rate (who, ts) VALUES (?, ?) ON CONFLICT(who) DO UPDATE SET ts = excluded.ts`, who, now);
      this.cleanup();
      return json({ messages: this.list() });
    }

    // ---- Διαχείριση ----
    if (path === "/api/admin/check" && request.method === "POST") {
      return json({ ok: this.isAdmin(request) }, this.isAdmin(request) ? 200 : 403);
    }

    const del = path.match(/^\/api\/messages\/(\d+)$/);
    if (del && request.method === "DELETE") {
      if (!this.isAdmin(request)) return json({ error: "Λάθος κωδικός." }, 403);
      this.sql.exec(`DELETE FROM messages WHERE id = ?`, +del[1]);
      return json({ messages: this.list() });
    }

    const banM = path.match(/^\/api\/ban\/(\d+)$/);
    if (banM && request.method === "POST") {
      if (!this.isAdmin(request)) return json({ error: "Λάθος κωδικός." }, 403);
      const row = this.sql.exec(`SELECT who FROM messages WHERE id = ?`, +banM[1]).toArray()[0];
      if (row) {
        this.sql.exec(`INSERT INTO bans (who, until) VALUES (?, ?) ON CONFLICT(who) DO UPDATE SET until = excluded.until`,
          row.who, Date.now() + BAN_MS);
        this.sql.exec(`DELETE FROM messages WHERE who = ?`, row.who);
      }
      return json({ messages: this.list() });
    }

    if (path === "/api/messages" && request.method === "DELETE") {
      if (!this.isAdmin(request)) return json({ error: "Λάθος κωδικός." }, 403);
      this.sql.exec(`DELETE FROM messages`);
      return json({ messages: [] });
    }

    return json({ error: "Δεν βρέθηκε." }, 404);
  }
}
