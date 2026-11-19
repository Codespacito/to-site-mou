// Σελίδα «Μηνύματα». Μπορείς να προσθέσεις ή να αλλάξεις λέξεις στις λίστες ακριβώς από κάτω.

// Αστεία του χωριού (μονολεκτικά)
const XORIO = [
  "Μπουνταλάς", "Μπουμπούνας", "Μαντράχαλος", "Λιγούρης", "Χασομέρης", "Μπεκρής", "Χαλβάς",
  "Μαγκούφης", "Ζεβζέκης", "Κουφιοκέφαλος", "Φαφλατάς", "Ξεροκέφαλος", "Τζαναμπέτης", "Ζαβολιάρης",
  "Σουγιάς", "Μουλωχτός", "Μπόμπος", "Μαμουζλής", "Γκιώσα", "Ντάνα", "Ματρακάς", "Μασκούλι",
  "Μπαλτάς", "Τυρόγαλο", "Τραχανάς", "Τσίπουρο", "Τσαρούχι", "Γκλίτσα", "Ταγάρι", "Κουρούπι",
  "Μαστραπάς", "Καλύβι", "Ρέμα", "Κέρατο",
];

// Ζώα του δάσους του Πάρνωνα (μονολεκτικά)
const ZOA = [
  "Τσακάλι", "Αλεπού", "Ασβός", "Κουνάβι", "Νυφίτσα", "Λαγός", "Σκαντζόχοιρος", "Αγριογούρουνο",
  "Καπρί", "Κουκουβάγια", "Μπούφος", "Δρυοκολάπτης", "Πέρδικα", "Κότσυφας", "Κίσσα", "Κούκος",
  "Τσαλαπετεινός", "Χελώνα", "Σαλαμάνδρα", "Οχιά", "Γκουστέρα",
];

// Έτοιμες συνδυαστικές φράσεις
const FRASEIS = [
  "Πούρο με Φλέβα", "Λαίμαργο Αγριογούρουνο", "Αγουροξυπνημένος Μπούφος", "Φουσκωμένος Σκαντζόχοιρος",
  "Ξεκούτης Ασβός", "Τσαχπίνα Αλεπού", "Μπεκρή Πέρδικα", "Γκρινιάρα Κουκουβάγια", "Κουτσομπόλα Κίσσα",
  "Ζαβό Κουνάβι", "Ξεμυαλισμένο Τσακάλι", "Πεισματάρα Χελώνα", "Μουλωχτή Οχιά", "Φαφλατάς Κότσυφας",
  "Ζαλισμένος Δρυοκολάπτης", "Μεθυσμένο Κουμαρόμουρο", "Ξεραμένη Ρίγανη", "Ρετσινωμένο Κουκουνάρι",
  "Τρύπιο Τσαρούχι", "Μπαγιάτικος Τραχανάς", "Πρωινό Τσίπουρο",
];

// Φυτά του Πάρνωνα ως «τόποι»
const FYTA = [
  "της Ελάτης", "της Μαύρης Πεύκης", "του Αρκουδόκεδρου", "του Κέδρου", "της Καστανιάς",
  "του Πλατάνου", "της Βελανιδιάς", "της Χαρουπιάς", "της Κουμαριάς", "του Πουρναριού",
  "του Θυμαριού", "της Ρίγανης", "του Φασκόμηλου", "του Φλισκουνιού", "της Αγριαχλαδιάς", "της Μαλεβής",
  "της Κερασιάς", "της Βυσινιάς", "του Ρέματος",
];

// Ζώα ως «τόποι»
const ZOA_TOPOS = [
  "του Τσακαλιού", "της Αλεπούς", "του Ασβού", "του Λαγού", "της Κουκουβάγιας",
  "του Αγριογούρουνου", "της Πέρδικας", "του Μπούφου",
];

// ------------------------------------------------------------------

const REFRESH_MS = 20000;
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Συνδυαστικό: έτοιμη φράση ή αυτόματος συνδυασμός
// (χωριό + φυτό, ζώο + φυτό, χωριό + ζώο)
function combo() {
  const r = Math.random();
  if (r < 0.25) return pick(FRASEIS);
  let word, place;
  do {
    if (r < 0.50) { word = pick(XORIO); place = pick(FYTA); }
    else if (r < 0.75) { word = pick(ZOA); place = pick(FYTA); }
    else { word = pick(XORIO); place = pick(ZOA_TOPOS); }
  } while (place.includes(word.slice(0, 4))); // όχι «Ρέμα του Ρέματος»
  return word + " " + place;
}

// Τρεις τρόποι εμφάνισης, ο καθένας με την ίδια πιθανότητα:
// 1) μονολεκτικό, 2) συνδυαστικό, 3) τυχαίο απ' όλα
function suggestNick() {
  let nick;
  do { nick = suggestOnce(); } while (nick.length > 24); // όριο ψευδωνύμου: 24 χαρακτήρες
  return nick;
}

function suggestOnce() {
  const mode = Math.floor(Math.random() * 3);
  const single = () => pick(Math.random() < 0.6 ? XORIO : ZOA);
  if (mode === 0) return single();
  if (mode === 1) return combo();
  return Math.random() < 0.5 ? single() : combo();
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
  const r = await fetch(path, { method, headers: { "x-admin-key": encodeURIComponent(adminKey) } });
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
  const key = $("adminKey").value.trim();
  let r;
  try {
    r = await fetch("/api/admin/check", { method: "POST", headers: { "x-admin-key": encodeURIComponent(key) } });
  } catch (e) {
    $("adminStatus").textContent = "Δεν υπάρχει σύνδεση, δοκίμασε ξανά.";
    return;
  }
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
