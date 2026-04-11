/* ==========================================================
   DatasetName — page interactions
   - Dual ego-video synchronized player
   - Scroll reveal
   - Stat counter
   - Session switcher
   - Copy BibTeX
   ========================================================== */

(function () {
  'use strict';

  /* ---------- Dual Player ---------- */
  const root = document.querySelector('[data-dualplayer]');
  if (root) {
    const vA = root.querySelector('[data-ego="a"]');
    const vB = root.querySelector('[data-ego="b"]');
    const playBtn = root.querySelector('[data-play]');
    const seek = root.querySelector('[data-seek]');
    const timeEl = root.querySelector('[data-time]');
    const syncBtn = root.querySelector('[data-sync]');

    const fmt = (s) => {
      if (!isFinite(s)) return '00:00';
      const m = Math.floor(s / 60);
      const r = Math.floor(s % 60);
      return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    };

    const updateTime = () => {
      const cur = vA.currentTime || 0;
      const dur = vA.duration || 0;
      timeEl.textContent = `${fmt(cur)} / ${fmt(dur)}`;
      if (dur > 0) seek.value = Math.round((cur / dur) * 1000);
    };

    const playBoth = () => {
      vA.play().catch(() => {});
      vB.play().catch(() => {});
      playBtn.textContent = '❚❚';
    };
    const pauseBoth = () => {
      vA.pause(); vB.pause();
      playBtn.textContent = '▶';
    };

    playBtn.addEventListener('click', () => {
      if (vA.paused) playBoth(); else pauseBoth();
    });

    seek.addEventListener('input', () => {
      const dur = vA.duration || 0;
      const t = (seek.value / 1000) * dur;
      vA.currentTime = t;
      vB.currentTime = t;
    });

    syncBtn.addEventListener('click', () => {
      vB.currentTime = vA.currentTime;
    });

    vA.addEventListener('timeupdate', updateTime);
    vA.addEventListener('loadedmetadata', updateTime);

    // Keep B locked to A (drift correction)
    setInterval(() => {
      if (vA.paused || vB.paused) return;
      const drift = Math.abs(vA.currentTime - vB.currentTime);
      if (drift > 0.08) vB.currentTime = vA.currentTime;
    }, 500);

    // Session switcher
    const chips = root.querySelectorAll('[data-session]');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
        const srcA = chip.getAttribute('data-a');
        const srcB = chip.getAttribute('data-b');
        if (srcA) { vA.src = srcA; vA.load(); }
        if (srcB) { vB.src = srcB; vB.load(); }
        // Autoplay the new session (best-effort)
        Promise.all([
          new Promise((r) => vA.addEventListener('loadeddata', r, { once: true })),
          new Promise((r) => vB.addEventListener('loadeddata', r, { once: true })),
        ]).then(playBoth).catch(() => {});
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll('.section__head, .overview-grid, .dualplayer, .scans-grid, .tasks, .download-grid, .bibtex');
  revealTargets.forEach((el) => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Stat counter ---------- */
  const nums = document.querySelectorAll('.stat__num');
  const animateNum = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const dur = 1200;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateNum(e.target);
            io2.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((n) => io2.observe(n));
  }

  /* ---------- Copy BibTeX ---------- */
  const copyBtn = document.querySelector('[data-copy-bibtex]');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const pre = document.querySelector('.bibtex code');
      if (!pre) return;
      try {
        await navigator.clipboard.writeText(pre.textContent.trim());
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => (copyBtn.textContent = orig), 1600);
      } catch (e) {
        copyBtn.textContent = 'Copy failed';
      }
    });
  }
})();
