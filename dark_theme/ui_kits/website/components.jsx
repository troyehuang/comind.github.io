/* Website UI Kit — components. Exported onto window. */
const { useEffect, useRef, useState } = React;

/* ---------- Reveal wrapper ---------- */
function Reveal({ children, stagger = false, className = '', ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { el?.classList.add('is-in'); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${stagger ? 'stagger' : ''} ${className}`} {...rest}>{children}</div>;
}

/* ---------- NavBar ---------- */
function NavBar() {
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const sections = ['overview','dual-view','scans','tasks','download','cite'];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  const link = (id, label) => (
    <li><a href={`#${id}`} className={active === id ? 'is-active' : ''}>{label}</a></li>
  );
  return (
    <nav className="nav">
      <div className="nav__inner">
        <a href="#top" className="nav__brand">CoMind</a>
        <ul className="nav__links">
          {link('overview','Overview')}
          {link('dual-view','Dual-View')}
          {link('scans','Scans')}
          {link('tasks','Tasks')}
          {link('download','Download')}
          {link('cite','Cite')}
        </ul>
      </div>
    </nav>
  );
}

/* ---------- Fake video pane ---------- */
function FakeVideo({ variant = 'a' }) {
  return (
    <div className={`fake-vid fake-vid--${variant}`}>
      <div className="fake-vid__grid"/>
      <div className="fake-vid__hand"/>
      <div className="fake-vid__ob"/>
    </div>
  );
}

/* ---------- Recording preview card ---------- */
function RecCard({ caption }) {
  return (
    <div className="rec">
      <div className="rec__screen">
        <div className="rec__pane"><FakeVideo variant="a"/><span className="rec__tag">A</span></div>
        <div className="rec__div"></div>
        <div className="rec__pane"><FakeVideo variant="b"/><span className="rec__tag">B</span></div>
      </div>
      <div className="rec__cap">{caption}</div>
    </div>
  );
}

/* ---------- StatsStrip ---------- */
function StatsStrip({ values }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 850); return () => clearTimeout(t); }, []);
  return (
    <div className="stats">
      {values.map((v, i) => (
        <div className="stat" key={i}>
          <div className="stat__num"><Counter target={v.n} run={ready}/></div>
          <div className="stat__lbl">{v.label}</div>
        </div>
      ))}
    </div>
  );
}
function Counter({ target, run }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf, start = performance.now();
    const dur = 1200;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return <>{v.toLocaleString()}</>;
}

/* ---------- Hero ---------- */
function Hero() {
  useEffect(() => {
    let activeGhost = null, activeOverlay = null, activeSource = null, peekTimer = null;
    const recgrid = document.querySelector('.recgrid');
    const recs = document.querySelectorAll('.rec');

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

    const cancelPeek = (rec) => {
      clearTimeout(peekTimer);
      peekTimer = null;
      rec.classList.remove('is-peeking');
      if (recgrid) recgrid.classList.remove('has-peek');
    };

    const handlers = [];
    recs.forEach((rec) => {
      const onEnter = () => {
        if (activeGhost) return;
        rec.classList.add('is-peeking');
        if (recgrid) recgrid.classList.add('has-peek');
        peekTimer = setTimeout(() => {
          rec.classList.remove('is-peeking');
          if (recgrid) recgrid.classList.remove('has-peek');
          peekTimer = null;

          const rect = rec.getBoundingClientRect();
          activeSource = rec;

          const overlay = document.createElement('div');
          overlay.className = 'rec-overlay';
          document.body.appendChild(overlay);
          overlay.addEventListener('click', closeGhost);
          activeOverlay = overlay;

          const ghost = rec.cloneNode(true);
          ghost.className = 'rec-ghost';
          ghost.style.top = rect.top + 'px';
          ghost.style.left = rect.left + 'px';
          ghost.style.width = rect.width + 'px';
          document.body.appendChild(ghost);
          activeGhost = ghost;

          const origVids = rec.querySelectorAll('video');
          const cloneVids = ghost.querySelectorAll('video');
          cloneVids.forEach((v, i) => {
            if (origVids[i]) v.currentTime = origVids[i].currentTime;
            v.play().catch(() => {});
          });

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

          setTimeout(() => { ghost.addEventListener('mouseleave', closeGhost); }, 550);
          ghost.addEventListener('click', closeGhost);
        }, 400);
      };
      const onLeave = () => { if (peekTimer) cancelPeek(rec); };
      rec.addEventListener('mouseenter', onEnter);
      rec.addEventListener('mouseleave', onLeave);
      handlers.push({ rec, onEnter, onLeave });
    });

    const onKey = (e) => { if (e.key === 'Escape') closeGhost(); };
    document.addEventListener('keydown', onKey);

    return () => {
      handlers.forEach(({ rec, onEnter, onLeave }) => {
        rec.removeEventListener('mouseenter', onEnter);
        rec.removeEventListener('mouseleave', onLeave);
      });
      document.removeEventListener('keydown', onKey);
      if (peekTimer) clearTimeout(peekTimer);
      if (activeGhost && activeGhost.parentNode) activeGhost.remove();
      if (activeOverlay && activeOverlay.parentNode) activeOverlay.remove();
    };
  }, []);

  return (
    <header id="top" className="hero">
      <div className="hero__inner">
        <div className="hero__eyebrow">Egocentric Vision · Dataset · 2026</div>
        <h1 className="hero__title">
          <span>CoMind</span><br/>
          <span className="hero__title-accent">A Dual-View Egocentric Dataset for&nbsp;Interaction Understanding</span>
        </h1>
        <p className="hero__subtitle">
          Every session is captured simultaneously from <strong>two synchronized head-mounted cameras</strong>,
          paired with dense scene scans and high-resolution object scans — enabling a new class of
          multi-view first-person tasks.
        </p>
        <div className="hero__cta">
          <a className="btn btn--primary" href="#download">Download Dataset</a>
          <a className="btn" href="#">Paper (arXiv)</a>
          <a className="btn" href="#">Code</a>
          <a className="btn" href="#">Video</a>
        </div>
        <div className="recgrid">
          <RecCard caption="Eye Gaze Example"/>
          <RecCard caption="Handover Example"/>
          <RecCard caption="Social Example"/>
        </div>
        <StatsStrip values={[
          {n:1200,label:'Sessions'},
          {n:2400,label:'Ego Videos'},
          {n:85,label:'Scene Scans'},
          {n:540,label:'Object Scans'},
          {n:3,label:'Benchmark Tasks'},
        ]}/>
      </div>
      <HeroBg/>
    </header>
  );
}

/* ---------- Section header ---------- */
function SectionHead({ kicker, title, sub }) {
  return (
    <div className="section__head">
      <span className="section__kicker">{kicker}</span>
      <h2 className="section__title">{title}</h2>
      {sub && <p className="section__sub">{sub}</p>}
    </div>
  );
}

/* ---------- Overview ---------- */
function Overview() {
  return (
    <section id="overview" className="section">
      <div className="container">
        <Reveal><SectionHead kicker="01 — Overview" title="A new lens on first-person activity"/></Reveal>
        <Reveal>
          <div className="overview-grid">
            <p className="lede">
              DatasetName is a large-scale egocentric dataset designed for studying human–scene–object
              interaction from <strong>paired first-person viewpoints</strong>. Unlike prior datasets with a
              single wearable camera, every recording in DatasetName captures the same moment from two
              synchronized ego cameras — opening up new benchmarks for cross-view consistency, 3D reasoning,
              and collaborative activity understanding.
            </p>
            <ul className="feature-list">
              <li><span className="dot"/><div><b>Dual Ego Views</b> — two time-synchronized head-mounted cameras per session.</div></li>
              <li><span className="dot"/><div><b>Scene Scans</b> — dense 3D reconstructions of every recording environment.</div></li>
              <li><span className="dot"/><div><b>Object Scans</b> — high-resolution meshes for all interacted objects.</div></li>
              <li><span className="dot"/><div><b>Rich Annotations</b> — actions, hand/object states, gaze, and 6-DoF poses.</div></li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Dual-view player ---------- */
function DualPlayer() {
  const [session, setSession] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const sessions = ['Session 01 · Kitchen','Session 02 · Workshop','Session 03 · Office','Session 04 · Lab'];
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => (x + 0.03) % 1), 100);
    return () => clearInterval(id);
  }, [playing]);
  const fmt = (p) => {
    const total = 98;
    const cur = Math.floor(total * p);
    const mm = String(Math.floor(cur/60)).padStart(2,'0');
    const ss = String(cur%60).padStart(2,'0');
    return `${mm}:${ss} / 01:38`;
  };
  return (
    <div className="dualplayer">
      <div className="dualplayer__views">
        <figure className="ego">
          <div className="ego__label">Ego View — Subject A</div>
          <FakeVideo variant="a"/>
        </figure>
        <figure className="ego">
          <div className="ego__label">Ego View — Subject B</div>
          <FakeVideo variant="b"/>
        </figure>
      </div>
      <div className="dualplayer__controls">
        <button className="pbtn" onClick={() => setPlaying(!playing)}>{playing ? '❚❚' : '▶'}</button>
        <input type="range" min="0" max="1000" value={Math.round(t*1000)}
               onChange={(e) => setT(Number(e.target.value)/1000)} className="pbar"/>
        <span className="ptime">{fmt(t)}</span>
        <button className="pbtn pbtn--ghost">⟳ Sync</button>
      </div>
      <div className="sessions">
        {sessions.map((s, i) => (
          <button key={i} className={`chip ${i === session ? 'chip--active' : ''}`}
                  onClick={() => { setSession(i); setT(0); }}>{s}</button>
        ))}
      </div>
    </div>
  );
}
function DualView() {
  return (
    <section id="dual-view" className="section section--dark">
      <div className="container">
        <Reveal>
          <SectionHead kicker="02 — Signature Feature"
                       title="Two Egocentric Views, One Moment"
                       sub="Every session is recorded by two participants wearing synchronized capture glasses. Both streams are frame-aligned, hardware-timestamped, and come with shared scene & object scans."/>
        </Reveal>
        <Reveal><DualPlayer/></Reveal>
      </div>
    </section>
  );
}

/* ---------- Scan card ---------- */
function ScanCard({ badge, title, body, meta }) {
  return (
    <article className="scan-card">
      <div className="scan-card__media">
        <div className="scan-card__wire"/>
        <div className="scan-card__placeholder">{badge} preview</div>
        <div className="scan-card__badge">{badge}</div>
      </div>
      <div className="scan-card__body">
        <h3>{title}</h3>
        <p>{body}</p>
        <ul className="meta">{meta.map((m, i) => <li key={i} dangerouslySetInnerHTML={{__html:m}}/>)}</ul>
      </div>
    </article>
  );
}
function Scans() {
  return (
    <section id="scans" className="section">
      <div className="container">
        <Reveal>
          <SectionHead kicker="03 — 3D Assets" title="Scene & Object Scans"
                       sub="Beyond video, every session ships with the 3D context it was captured in."/>
        </Reveal>
        <Reveal stagger>
          <div className="scans-grid">
            <ScanCard badge="Scene Scan" title="Dense Scene Reconstructions"
              body="Photogrammetric scans of each recording environment, delivered as textured meshes and point clouds. Aligned to ego-camera coordinates for direct reprojection."
              meta={["Textured <code>.obj</code> / <code>.ply</code>","Camera extrinsics per frame","85 unique environments"]}/>
            <ScanCard badge="Object Scan" title="High-Resolution Object Scans"
              body="Every interacted object is independently scanned at sub-millimeter resolution, enabling 6-DoF pose supervision and rendering-based evaluation."
              meta={["Watertight meshes with PBR textures","Canonical object frame","540 unique instances"]}/>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Task card ---------- */
function TaskCard({ num, title, desc, tags }) {
  return (
    <article className="task">
      <div className="task__num">{num}</div>
      <h3 className="task__title">{title}</h3>
      <p className="task__desc">{desc}</p>
      <div className="task__tags">{tags.map((t, i) => <span key={i}>{t}</span>)}</div>
    </article>
  );
}
function Tasks() {
  return (
    <section id="tasks" className="section section--soft">
      <div className="container">
        <Reveal>
          <SectionHead kicker="04 — Benchmarks" title="Three Tasks"
                       sub="Built directly on top of the dual-view design — each task requires reasoning that a single ego camera cannot support."/>
        </Reveal>
        <Reveal stagger>
          <div className="tasks">
            <TaskCard num="T1" title="Cross-View Action Recognition"
              desc="Given two synchronized ego streams, predict the joint activity label. Models must fuse information from both viewpoints to disambiguate occluded interactions."
              tags={["Classification","Multi-view","Video"]}/>
            <TaskCard num="T2" title="Ego-to-Ego 3D Object Localization"
              desc="Localize manipulated objects in the shared scene coordinate system using both ego streams and the provided scene scan as geometric prior."
              tags={["3D Detection","6-DoF Pose","Scene Prior"]}/>
            <TaskCard num="T3" title="Collaborative Intent Forecasting"
              desc="Predict the next interaction step for each subject, conditioning on both wearers' past observations. Measures whether models can reason about partner-aware intent."
              tags={["Forecasting","Interaction","Temporal"]}/>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Download ---------- */
function DownloadTile({ name, size, desc }) {
  return (
    <a className="dl" href="#">
      <div className="dl__name">{name}</div>
      <div className="dl__size">{size}</div>
      <div className="dl__desc">{desc}</div>
    </a>
  );
}
function Download() {
  return (
    <section id="download" className="section">
      <div className="container">
        <Reveal><SectionHead kicker="05 — Access" title="Download"/></Reveal>
        <Reveal stagger>
          <div className="download-grid">
            <DownloadTile name="Ego Videos" size="~ 420 GB · MP4" desc="Paired ego streams for all 1,200 sessions."/>
            <DownloadTile name="Scene Scans" size="~ 65 GB · OBJ/PLY" desc="Textured meshes + aligned point clouds."/>
            <DownloadTile name="Object Scans" size="~ 30 GB · GLB" desc="High-resolution PBR meshes per instance."/>
            <DownloadTile name="Annotations" size="~ 1.2 GB · JSON" desc="Actions, poses, gaze, hand states, splits."/>
          </div>
        </Reveal>
        <p className="license">Released under <a href="#">CC BY-NC 4.0</a>. By downloading you agree to the <a href="#">terms of use</a>.</p>
      </div>
    </section>
  );
}

/* ---------- BibTeX ---------- */
function Cite() {
  const [copied, setCopied] = useState(false);
  const bib = `@article{datasetname2026,
  title     = {DatasetName: A Dual-View Egocentric Dataset for Interaction Understanding},
  author    = {Author One and Author Two and Author Three and Author Four},
  journal   = {arXiv preprint arXiv:2601.00000},
  year      = {2026}
}`;
  return (
    <section id="cite" className="section section--soft">
      <div className="container">
        <Reveal><SectionHead kicker="06 — BibTeX" title="Citation"/></Reveal>
        <Reveal>
          <pre className="bibtex"><code>{bib}</code></pre>
          <button className="btn" onClick={() => {
            navigator.clipboard?.writeText(bib).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
          }}>{copied ? 'Copied ✓' : 'Copy BibTeX'}</button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>© 2026 DatasetName Team</div>
        <div className="footer__links">
          <a href="#">Contact</a>
          <a href="#">GitHub</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  NavBar, Hero, Overview, DualView, Scans, Tasks, Download, Cite, Footer,
  Reveal, SectionHead, FakeVideo, RecCard, StatsStrip, Counter, DualPlayer,
  ScanCard, TaskCard, DownloadTile
});
