// Σελίδα «Μηνύματα». Μπορείς να προσθέσεις ή να αλλάξεις λέξεις στις λίστες ακριβώς από κάτω.

const DASOS = [
  "Μαύρο Βελανίδι", "Πεσμένο Κάστανο", "Υγρό Βρύο", "Γέρικη Οξιά", "Κρυφό Μανιτάρι",
  "Άγριο Πουρνάρι", "Ξερό Κλαδί", "Θαμμένη Ρίζα", "Σκουριασμένο Φύλλο", "Κόκκινη Αλεπού",
  "Κρύα Πηγή", "Βραχνός Κόρακας", "Νυχτερινή Κουκουβάγια", "Σάπιο Κούτσουρο", "Μοναχό Έλατο",
  "Σιωπηλός Λόγγος", "Χαμένο Μονοπάτι", "Πράσινη Σαύρα", "Μυρωδάτο Θυμάρι", "Ομιχλιασμένη Ρεματιά",
  "Αγκαθωτός Σκαντζόχοιρος", "Ζαλισμένος Δρυοκολάπτης", "Κουφό Βατόμουρο", "Στραβή Αγριαχλαδιά",
];

const ARGKO = [
  "Πετούγια", "Σόγιας", "Μουλωχτός", "Μπόμπος", "Μαμούζλης",
  "Μπαγάσας", "Ζαβολιάρης", "Τζαναμπέτης", "Κουτσαβάκης", "Λουφαδόρος", "Χαρμάνης",
  "Μπατίρης", "Σαλταδόρος", "Φαφλατάς", "Χαζοβιόλης", "Κουτορνίθι", "Τεμπέλχανας",
  "Ακαμάτης", "Ξεροκέφαλος", "Αλάνι", "Τζιμάνι", "Φασαρίας", "Λαπάς",
];

const TOPOS = [
  "του Λόγγου", "της Ρεματιάς", "του Πλατάνου", "της Βελανιδιάς", "του Ρέματος",
  "της Λαγκαδιάς", "του Πουρναριού", "της Καστανιάς",
];

// ------------------------------------------------------------------

const REFRESH_MS = 20000;
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function suggestNick() {
  const r = Math.random();
  if (r < 0.45) return pick(DASOS);
  if (r < 0.75) return pick(ARGKO);
  return pick(ARGKO) + " " + pick(TOPOS);
}

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch (e) { return null; }
}

let adminKey = store("agrioi-admin") || "";
let lastIds = "";

function fmtTime(ts) {
  return new Date(ts).toLocaleString("el-GR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

function render(messages) {
  const ids = messages.map((m) => m.id).join(",") + (adminKey ? ":a" : "");
  if (ids === lastIds) return;
  lastIds = ids;

  const chat = $("chat");
  const nearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 40;
  chat.textContent = "";

  if (!messages.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.textContent = "Ησυχία στο δάσος… γράψε το πρώτο μήνυμα.";
    chat.appendChild(e);
    return;
  }

  for (const m of messages) {
    const row = document.createElement("div");
    row.className = "msg";

    if (adminKey) {
      const tools = document.createElement("span");
      tools.className = "tools";
      const del = document.createElement("button");
      del.textContent = "σβήσε";
      del.onclick = () => adminCall("DELETE", "/api/messages/" + m.id);
      const ban = document.createElement("button");
      ban.textContent = "μπλόκο 6ω";
      ban.onclick = () => { if (confirmBan(m.nick)) adminCall("POST", "/api/ban/" + m.id); };
      tools.append(del, ban);
      row.appendChild(tools);
    }

    const who = document.createElement("span");
    who.className = "who";
    who.style.color = `hsl(${m.color} 55% 45%)`;
    who.textContent = m.nick;
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = fmtTime(m.ts);
    const text = document.createElement("div");
    text.className = "text";
    text.textContent = m.text;

    row.append(who, when, text);
    chat.appendChild(row);
  }
  if (nearBottom) chat.scrollTop = chat.scrollHeight;
}

function confirmBan(nick) {
  // απλή επιβεβαίωση χωρίς παράθυρο διαλόγου
  const s = $("adminStatus");
  if (s.dataset.pending === nick) { s.dataset.pending = ""; s.textContent = ""; return true; }
  s.dataset.pending = nick;
  s.textContent = `Πάτα ξανά «μπλόκο» για να μπλοκάρεις τον/την ${nick}.`;
  return false;
}

async function load() {
  try {
    const r = await fetch("/api/messages", { cache: "no-store" });
    const d = await r.json();
    render(d.messages || []);
  } catch (e) { /* θα ξαναδοκιμάσει στην επόμενη ανανέωση */ }
}

async function adminCall(method, path) {
  const r = await fetch(path, { method, headers: { "x-admin-key": adminKey } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { $("adminStatus").textContent = d.error || "Σφάλμα"; return; }
  lastIds = "";
  render(d.messages || []);
}

// ---- Φόρμα ----
const nickEl = $("nick"), textEl = $("text"), sendEl = $("send"), errEl = $("err");
nickEl.value = store("agrioi-nick") || suggestNick();
$("dice").onclick = () => { nickEl.value = suggestNick(); store("agrioi-nick", nickEl.value); };
nickEl.onchange = () => store("agrioi-nick", nickEl.value.trim());
textEl.oninput = () => { $("count").textContent = `${textEl.value.length} / 250`; };
textEl.onkeydown = (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("form").requestSubmit(); };

$("form").onsubmit = async (e) => {
  e.preventDefault();
  errEl.textContent = "";
  sendEl.disabled = true;
  try {
    const r = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nick: nickEl.value, text: textEl.value, website: $("website").value }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { errEl.textContent = d.error || "Κάτι πήγε στραβά, δοκίμασε ξανά."; return; }
    store("agrioi-nick", nickEl.value.trim());
    textEl.value = "";
    textEl.oninput();
    lastIds = "";
    render(d.messages || []);
    const chat = $("chat"); chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    errEl.textContent = "Δεν υπάρχει σύνδεση, δοκίμασε ξανά.";
  } finally {
    sendEl.disabled = false;
  }
};

// ---- Διαχείριση ----
$("adminToggle").onclick = (e) => { e.preventDefault(); $("admin").classList.toggle("open"); };
if (adminKey) { $("admin").classList.add("open"); $("adminStatus").textContent = "Είσαι διαχειριστής."; }
$("adminLogin").onclick = async () => {
  const key = $("adminKey").value;
  const r = await fetch("/api/admin/check", { method: "POST", headers: { "x-admin-key": key } });
  if (r.ok) {
    adminKey = key; store("agrioi-admin", key);
    $("adminStatus").textContent = "Είσαι διαχειριστής.";
  } else {
    adminKey = ""; store("agrioi-admin", null);
    $("adminStatus").textContent = "Λάθος κωδικός.";
  }
  lastIds = ""; load();
};
$("adminClear").onclick = () => {
  const s = $("adminStatus");
  if (s.dataset.pending === "*") { s.dataset.pending = ""; s.textContent = ""; adminCall("DELETE", "/api/messages"); }
  else { s.dataset.pending = "*"; s.textContent = "Πάτα ξανά «Σβήσε όλα» για επιβεβαίωση."; }
};

// ---- Ανανέωση ----
load();
setInterval(() => { if (document.visibilityState === "visible") load(); }, REFRESH_MS);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load(); });
