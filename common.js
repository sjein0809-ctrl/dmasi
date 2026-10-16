// Shared helpers for all daily games
const Daily = (() => {
  const LAUNCH = Date.UTC(2026, 9, 15); // Day #1

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const key = y * 10000 + (m + 1) * 100 + d;
  const dayNum = Math.max(1, Math.floor((Date.UTC(y, m, d) - LAUNCH) / 86400000) + 1);

  // Each game gets its own seed from the date + game name
  function seedFor(name) {
    let h = key;
    for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 2654435761);
    return h >>> 0;
  }

  function load(name) {
    try { return JSON.parse(localStorage.getItem(name + "-" + key)); } catch (e) { return null; }
  }
  function save(name, v) {
    try { localStorage.setItem(name + "-" + key, JSON.stringify(v)); } catch (e) {}
  }

  let timer = null;
  function countdown(el, label) {
    clearTimeout(timer);
    const n = new Date();
    const mid = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    const s = Math.floor((mid - n) / 1000);
    const p = v => String(v).padStart(2, "0");
    el.textContent = "Next " + label + " in " + p(Math.floor(s / 3600)) + "h " + p(Math.floor(s % 3600 / 60)) + "m " + p(s % 60) + "s";
    timer = setTimeout(() => countdown(el, label), 1000);
  }
  function stopCountdown() { clearTimeout(timer); }

  async function share(text, btn) {
    const old = btn.textContent;
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied!";
    } catch (e) {
      window.prompt("Copy your score", text);
    }
    setTimeout(() => { btn.textContent = old; }, 1500);
  }

  function point(cv, e) {
    const r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * cv.width / r.width,
      y: (e.clientY - r.top) * cv.height / r.height
    };
  }

  // Daily scores for the home page: { game: { yyyymmdd: score } }
  const SCORES = "dailyish-scores";
  function allScores() {
    try { return JSON.parse(localStorage.getItem(SCORES)) || {}; } catch (e) { return {}; }
  }
  function record(game, score) {
    const all = allScores();
    (all[game] = all[game] || {})[key] = score;
    try { localStorage.setItem(SCORES, JSON.stringify(all)); } catch (e) {}
  }

  // footer clock: any <… data-next> shows the time left until tomorrow's games
  function tickNext() {
    const els = document.querySelectorAll("[data-next]");
    if (!els.length) return;
    const n = new Date();
    const s = Math.floor((new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n) / 1000);
    const p = v => String(v).padStart(2, "0");
    const text = p(Math.floor(s / 3600)) + "h " + p(Math.floor(s % 3600 / 60)) + "m " + p(s % 60) + "s";
    els.forEach(el => { el.textContent = text; });
  }
  tickNext();
  setInterval(tickNext, 1000);

  return { rng, key, dayNum, seedFor, load, save, countdown, stopCountdown, share, point, record, allScores };
})();
