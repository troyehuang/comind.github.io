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

  /* ---------- Rec card sync ---------- */
  document.querySelectorAll('[data-rec]').forEach((rec) => {
    const vids = rec.querySelectorAll('video');
    if (vids.length === 2) {
      setInterval(() => {
        if (vids[0].paused || vids[1].paused) return;
        if (Math.abs(vids[0].currentTime - vids[1].currentTime) > 0.08)
          vids[1].currentTime = vids[0].currentTime;
      }, 500);
    }
  });

  /* ---------- Rec hover: peek → pop (3D Touch style) ---------- */
  let activeGhost = null;
  let activeOverlay = null;
  let activeSource = null;
  let peekTimer = null;

  const closeGhost = () => {
    if (!activeGhost) return;
    const src = activeSource;
    const rect = src.getBoundingClientRect();
    activeGhost.classList.remove('is-centered');
    activeGhost.style.top = rect.top + 'px';
    activeGhost.style.left = rect.left + 'px';
    activeGhost.style.width = rect.width + 'px';
    activeOverlay.classList.remove('is-visible');
    const g = activeGhost, o = activeOverlay;
    activeGhost = null; activeOverlay = null; activeSource = null;
    g.addEventListener('transitionend', () => { g.remove(); o.remove(); }, { once: true });
    setTimeout(() => { if (g.parentNode) g.remove(); if (o.parentNode) o.remove(); }, 600);
  };

  const recgrid = document.querySelector('.recgrid');

  const cancelPeek = (rec) => {
    clearTimeout(peekTimer);
    peekTimer = null;
    rec.classList.remove('is-peeking');
    if (recgrid) recgrid.classList.remove('has-peek');
  };

  document.querySelectorAll('.rec').forEach((rec) => {
    rec.addEventListener('mouseenter', () => {
      if (activeGhost) return;

      // Stage 1: Peek — lift up, dim siblings
      rec.classList.add('is-peeking');
      if (recgrid) recgrid.classList.add('has-peek');

      // Stage 2: Pop — after peek settles (400ms), fly ghost to center
      peekTimer = setTimeout(() => {
        rec.classList.remove('is-peeking');
        if (recgrid) recgrid.classList.remove('has-peek');
        peekTimer = null;

        const rect = rec.getBoundingClientRect();
        activeSource = rec;

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'rec-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', closeGhost);
        activeOverlay = overlay;

        // Clone
        const ghost = rec.cloneNode(true);
        ghost.className = 'rec-ghost';
        ghost.style.top = rect.top + 'px';
        ghost.style.left = rect.left + 'px';
        ghost.style.width = rect.width + 'px';
        document.body.appendChild(ghost);
        activeGhost = ghost;

        // Sync video time
        const origVids = rec.querySelectorAll('video');
        const cloneVids = ghost.querySelectorAll('video');
        cloneVids.forEach((v, i) => {
          if (origVids[i]) v.currentTime = origVids[i].currentTime;
          v.play().catch(() => {});
        });

        // Measure real height at target width
        const targetW = Math.min(1800, window.innerWidth - 60);
        const targetLeft = (window.innerWidth - targetW) / 2;
        ghost.style.transition = 'none';
        ghost.style.width = targetW + 'px';
        ghost.style.left = '-9999px';
        const actualH = ghost.offsetHeight;
        ghost.style.top = rect.top + 'px';
        ghost.style.left = rect.left + 'px';
        ghost.style.width = rect.width + 'px';
        ghost.offsetHeight;
        ghost.style.transition = '';

        const targetTop = Math.max(0, (window.innerHeight - actualH) / 2);

        requestAnimationFrame(() => {
          overlay.classList.add('is-visible');
          ghost.style.top = targetTop + 'px';
          ghost.style.left = targetLeft + 'px';
          ghost.style.width = targetW + 'px';
          ghost.classList.add('is-centered');
        });

        setTimeout(() => {
          ghost.addEventListener('mouseleave', closeGhost);
        }, 550);
        ghost.addEventListener('click', closeGhost);
      }, 400);
    });

    rec.addEventListener('mouseleave', () => {
      if (peekTimer) cancelPeek(rec);
    });
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGhost(); });

  /* ---------- Scroll reveal + stagger ---------- */
  const revealTargets = document.querySelectorAll('.section__head, .recgrid, .overview-grid, .dualplayer, .bibtex');
  revealTargets.forEach((el) => el.classList.add('reveal'));

  // Stagger groups: children animate one by one
  const staggerTargets = document.querySelectorAll('.scans-grid, .tasks, .download-grid');
  staggerTargets.forEach((el) => { el.classList.add('reveal'); el.classList.add('stagger'); });

  const allReveal = document.querySelectorAll('.reveal');
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
    allReveal.forEach((el) => io.observe(el));
  } else {
    allReveal.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Nav scroll spy ---------- */
  const navLinks = document.querySelectorAll('.nav__links a');
  const sections = [];
  navLinks.forEach((a) => {
    const id = a.getAttribute('href');
    if (id && id.startsWith('#')) {
      const sec = document.querySelector(id);
      if (sec) sections.push({ el: sec, link: a });
    }
  });
  if (sections.length && 'IntersectionObserver' in window) {
    const spyIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            const match = sections.find((s) => s.el === e.target);
            if (match) match.link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((s) => spyIO.observe(s.el));
  }

  /* ---------- Stat counter — waits for hero entrance to finish ---------- */
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
  // Stats panel is the last hero child (delay .8s + anim .8s = 1.6s).
  // Start counting only after entrance animation completes.
  const statsBox = document.querySelector('.stats');
  if (statsBox) {
    const startCounting = () => nums.forEach((n) => animateNum(n));
    // If stats are already in viewport (hero), wait for entrance anim
    const rect = statsBox.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setTimeout(startCounting, 850);
    } else {
      // If user scrolls down before entrance finishes, use observer
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              startCounting();
              io2.disconnect();
            }
          });
        },
        { threshold: 0.5 }
      );
      io2.observe(statsBox);
    }
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
