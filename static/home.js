// Αρχική σελίδα: «Φως στο σκοτάδι» και «Άνοιξε ένα βελανίδι».
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------- Φως στο σκοτάδι ----------------
  const lantern = document.getElementById("lantern");
  if (lantern) {
    const setLight = (x, y) => {
      lantern.style.setProperty("--x", x + "px");
      lantern.style.setProperty("--y", y + "px");
    };
    const setRadius = () => {
      const r = Math.max(150, Math.min(260, Math.min(lantern.clientWidth, lantern.clientHeight) * 0.3));
      lantern.style.setProperty("--r", r + "px");
    };
    setRadius();
    window.addEventListener("resize", setRadius);

    let lastMove = 0;
    const onPoint = (clientX, clientY) => {
      const b = lantern.getBoundingClientRect();
      setLight(clientX - b.left, clientY - b.top);
      lastMove = performance.now();
    };
    lantern.addEventListener("pointermove", (e) => onPoint(e.clientX, e.clientY));
    lantern.addEventListener("pointerdown", (e) => onPoint(e.clientX, e.clientY));
    lantern.addEventListener("touchmove", (e) => {
      const t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY);
    }, { passive: true });

    // Όταν κανείς δεν κινεί το φως (π.χ. στο κινητό), το λυχνάρι περιπλανιέται μόνο του
    let t0 = performance.now();
    const wander = (now) => {
      if (lantern.classList.contains("lit")) return;
      if (now - lastMove > 2500) {
        const w = lantern.clientWidth, h = lantern.clientHeight, t = (now - t0) / 1000;
        setLight(w * (0.5 + 0.28 * Math.sin(t * 0.37)), h * (0.48 + 0.26 * Math.sin(t * 0.53 + 1.3)));
      }
      requestAnimationFrame(wander);
    };
    setLight(lantern.clientWidth / 2, lantern.clientHeight * 0.3);

    const lightAll = () => {
      lantern.classList.add("lit");
      const btn = document.getElementById("lanternAll");
      if (btn) btn.style.display = "none";
    };
    document.getElementById("lanternAll")?.addEventListener("click", lightAll);

    if (reduce) lightAll(); else requestAnimationFrame(wander);
  }

  // ---------------- Άνοιξε ένα βελανίδι ----------------
  const acorn = document.getElementById("acorn");
  const quote = document.getElementById("quote");
  const qtext = document.getElementById("qtext");
  const qauth = document.getElementById("qauth");
  const tpl = document.getElementById("gnomika");
  if (!acorn || !quote) return;

  const qorig = document.getElementById("qorig");
  const all = tpl ? [...tpl.content.querySelectorAll("div")]
    .map((d) => ({
      text: d.textContent.trim(),
      author: (d.dataset.author || "").trim(),
      orig: (d.dataset.orig || "").trim(),
      src: (d.dataset.src || "").trim(),
    }))
    .filter((q) => q.text) : [];
  const byText = new Map(all.map((q) => [q.text, q]));

  // «Σακούλα» ανακατεμένων γνωμικών, ξεχωριστή για κάθε επισκέπτη.
  // Ο browser τη θυμάται και σε επόμενες επισκέψεις: κανένα γνωμικό δεν ξαναβγαίνει
  // πριν ανοίξουν όλα. Μετά ανακατεύονται ξανά από την αρχή.
  const KEY = "agrioi-velanidi";
  const load = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      return { bag: (d.bag || []).filter((t) => byText.has(t)), last: d.last || null };
    } catch (e) { return { bag: [], last: null }; }
  };
  const save = (st) => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  let state = load();
  const next = () => {
    if (!state.bag.length) {
      state.bag = shuffle(all.map((q) => q.text));
      // να μην ξαναβγεί αμέσως το τελευταίο του προηγούμενου γύρου
      if (state.bag.length > 1 && state.bag[state.bag.length - 1] === state.last) state.bag.unshift(state.bag.pop());
    }
    state.last = state.bag.pop();
    save(state);
    return byText.get(state.last);
  };

  let busy = false;
  acorn.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    const wasOpen = acorn.classList.contains("open");
    quote.classList.remove("show");
    acorn.classList.remove("open");

    setTimeout(() => {
      const q = all.length ? next() : { text: "Το βελανίδι είναι ακόμα άδειο.", author: "" };
      qtext.textContent = q.text;
      qorig.textContent = q.orig || "";
      qauth.textContent = q.author ? "— " + q.author + (q.src ? ", " + q.src : "") : "";
      acorn.classList.add("open");
      setTimeout(() => { quote.classList.add("show"); busy = false; }, reduce ? 0 : 450);
    }, wasOpen && !reduce ? 500 : 0);
  });
})();
