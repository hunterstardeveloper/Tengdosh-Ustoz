(function () {

  const FIREBASE_SDK_VERSION = "10.7.1";
  let firestorePromise = null;

  function hasFirebaseConfig() {
    return !!window.TU_FIREBASE_CONFIG;
  }

  function loadScriptOnce(src, checkReady) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof checkReady === "function" && checkReady()) {
          resolve();
          return;
        }

        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  function makeStubFirebase() {
    
    const stubAuth = {
      currentUser: null,
      setPersistence: () => Promise.resolve(),
      onAuthStateChanged: (cb) => {
        try { cb(null); } catch (e) {}
        return () => {};
      },
      signOut: () => Promise.resolve(),
    };

    const stubSnap = {
      exists: () => false,
      val: () => null,
    };

    const stubRef = {
      once: () => Promise.resolve(stubSnap),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      child: () => stubRef,
    };

    const stubDb = {
      ref: () => stubRef,
    };

    return { auth: stubAuth, db: stubDb, firestore: null, stub: true };
  }

  function getFirestoreInstance() {
    if (typeof firebase === "undefined" || typeof firebase.firestore !== "function") {
      return null;
    }
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.TU_FIREBASE_CONFIG);
    }
    return firebase.firestore();
  }

  function ensureFirestore() {
    if (typeof firebase === "undefined" || !hasFirebaseConfig()) {
      return Promise.resolve(null);
    }
    const existing = getFirestoreInstance();
    if (existing) return Promise.resolve(existing);
    if (!firestorePromise) {
      firestorePromise = loadScriptOnce(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore-compat.js`,
        () => typeof firebase !== "undefined" && typeof firebase.firestore === "function"
      ).then(() => getFirestoreInstance()).catch(() => null);
    }
    return firestorePromise;
  }

  function initFirebaseOnce() {
    
    if (typeof firebase === 'undefined' || !hasFirebaseConfig()) {
      return makeStubFirebase();
    }
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.TU_FIREBASE_CONFIG);
    }
    const auth = firebase.auth();
    const db = firebase.database();
    const firestore = getFirestoreInstance();
    return { auth, db, firestore, stub: false };
  }

  async function ensureUserDoc(db, user) {
    if (!user) return;
    const ref = db.ref(`users/${user.uid}`);
    const snap = await ref.once('value');
    if (!snap.exists()) {
      await ref.set({
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        role: 'user',
        phone: null,
        groupInUniversity: null,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });
    }
  }

  async function getRole(db, uid) {
    const snap = await db.ref(`users/${uid}/role`).once('value');
    return snap.val() || 'user';
  }

  async function getUserDoc(db, uid) {
    const snap = await db.ref(`users/${uid}`).once('value');
    return snap.val() || {};
  }

  
  
  
  
  
  
  
  function isBanActive(raw) {
    if (!raw) return false;
    if (raw === true) return true;
    if (typeof raw === 'object') {
      if (raw.active === false) return false;
      const until = raw.until;
      if (typeof until === 'number' && until > 0) {
        return Date.now() < until;
      }
      
      return raw.active === true || raw.active === undefined;
    }
    return false;
  }

  function getBanMeta(raw) {
    if (!raw) return null;
    if (raw === true) return { active: true, until: null, reason: null };
    if (typeof raw === 'object') {
      return {
        active: isBanActive(raw),
        until: typeof raw.until === 'number' ? raw.until : null,
        reason: typeof raw.reason === 'string' ? raw.reason : null,
      };
    }
    return null;
  }

  function cacheBan(meta) {
    try {
      if (meta && meta.active) {
        sessionStorage.setItem('tu_banned', '1');
        sessionStorage.setItem('tu_banned_until', meta.until ? String(meta.until) : '');
        sessionStorage.setItem('tu_banned_reason', meta.reason || '');
      } else {
        sessionStorage.removeItem('tu_banned');
        sessionStorage.removeItem('tu_banned_until');
        sessionStorage.removeItem('tu_banned_reason');
      }
    } catch (e) {}
  }

  function isCachedBanned() {
    try {
      if (sessionStorage.getItem('tu_banned') !== '1') return false;
      const untilRaw = sessionStorage.getItem('tu_banned_until');
      const until = untilRaw ? Number(untilRaw) : null;
      if (until && !Number.isNaN(until)) {
        return Date.now() < until;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async function getBanStatus(db, uid) {
    
    try {
      const snap = await db.ref(`banned/${uid}`).once('value');
      const v = snap.val();
      if (v !== null && v !== undefined) return getBanMeta(v);
    } catch (e) {}

    try {
      const snap2 = await db.ref(`users/${uid}/banned`).once('value');
      return getBanMeta(snap2.val());
    } catch (e) {}

    return null;
  }

  function redirectToBanned() {
    const root = getRootPath();
    
    if (window.location.pathname.includes('/auth/banned.html')) return;
    window.location.href = `${root}/auth/banned.html`;
  }

  function redirectToHome() {
    const root = getRootPath();
    
    if (window.location.pathname.includes('/home.html')) return;
    window.location.href = `${root}/home.html`;
  }

  
  
  function watchBan(db, uid, onChange) {
    const refA = db.ref(`banned/${uid}`);
    const refB = db.ref(`users/${uid}/banned`);

    let usingA = false;

    const handlerA = (snap) => {
      const v = snap.val();
      if (v !== null && v !== undefined) {
        usingA = true;
        onChange(getBanMeta(v));
      } else if (!usingA) {
        onChange(null);
      }
    };

    const handlerB = (snap) => {
      if (usingA) return;
      onChange(getBanMeta(snap.val()));
    };

    refA.on('value', handlerA);
    refB.on('value', handlerB);

    return () => {
      refA.off('value', handlerA);
      refB.off('value', handlerB);
    };
  }

  async function checkBanAndRedirect(db, user) {
    if (!user) {
      cacheBan(null);
      return;
    }
    const meta = await getBanStatus(db, user.uid);
    cacheBan(meta);
    if (meta && meta.active) redirectToBanned();
  }

  function normalizePhone(p) {
    if (!p) return '';
    return String(p).replace(/[^0-9+]/g, '').trim();
  }

  async function needsProfileCompletion(db, uid) {
    const doc = await getUserDoc(db, uid);
    const phone = normalizePhone(doc.phone || doc['phone number'] || '');
    const group = String(doc.groupInUniversity || doc.group || '').trim();
    return {
      ok: !!(phone && group),
      missingPhone: !phone,
      missingGroup: !group,
      phone,
      group,
      doc,
    };
  }

  async function requireProfileCompletion(db, auth, opts = {}) {
    if (!auth.currentUser) {
      redirectToLogin();
      return false;
    }
    const status = await needsProfileCompletion(db, auth.currentUser.uid);
    if (status.ok) return true;

    
    try { sessionStorage.setItem('tu_return_url', opts.returnUrl || window.location.href); } catch(e) {}
    const root = getRootPath();
    const params = new URLSearchParams();
    params.set('complete', '1');
    if (status.missingPhone) params.set('needPhone', '1');
    if (status.missingGroup) params.set('needGroup', '1');
    window.location.href = `${root}/pages/account/account.html?${params.toString()}`;
    return false;
  }

  
  
  function saveReturnUrl() {
    try {
      sessionStorage.setItem('tu_return_url', window.location.href);
    } catch (e) {}
  }

  function popReturnUrl(fallback) {
    try {
      const u = sessionStorage.getItem('tu_return_url');
      sessionStorage.removeItem('tu_return_url');
      return u || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function redirectToLogin() {
    
    const p = window.location.pathname || "";
    if (p.includes("/auth/login.html") || p.includes("/auth/register.html") || p.includes("/auth/forgot.html") || p.includes("/auth/banned.html") || p.includes("/auth/forbidden.html")) {
      return;
    }
    saveReturnUrl();
    const root = getRootPath();
    window.location.href = `${root}/auth/login.html`;
  }

  function getRootPath() {
    
    const p = window.location.pathname;
    if (p.includes('/clubs/')) return p.split('/clubs/')[0] || '';
    if (p.includes('/auth/')) return p.split('/auth/')[0] || '';
    return '';
  }

  function injectFixedControlAlignmentStyles() {
    if (document.getElementById("tu-fixed-control-styles")) return;
    const style = document.createElement("style");
    style.id = "tu-fixed-control-styles";
    style.textContent = `
      .tu-fixed-control{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        padding:0 !important;
        line-height:0 !important;
        text-align:center !important;
        appearance:none !important;
        -webkit-appearance:none !important;
      }
      .tu-fixed-control > svg,
      .tu-fixed-control > img{
        display:block !important;
        margin:0 !important;
        flex:0 0 auto !important;
        pointer-events:none !important;
      }
      .tu-fixed-theme-control > svg,
      .tu-fixed-theme-control > img{
        width:22px !important;
        height:22px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeFixedControlAlignment() {
    injectFixedControlAlignmentStyles();

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      const cs = window.getComputedStyle(themeToggle);
      if (cs.position === "fixed") {
        themeToggle.classList.add("tu-fixed-control", "tu-fixed-theme-control");
      }
    }

    document.querySelectorAll("a.back, .back-btn").forEach((control) => {
      const cs = window.getComputedStyle(control);
      if (cs.position === "fixed" || cs.position === "absolute") {
        control.classList.add("tu-fixed-control");
      }
    });
  }

  function injectMenuStyles() {
    if (document.getElementById('tu-menu-styles-v2')) return;
    const style = document.createElement('style');
    style.id = 'tu-menu-styles-v2';
    style.textContent = `
      :root{
        --tu-menu-accent: var(--tu-accent, #c9a227);
        --tu-menu-line: rgba(201,162,39,0.22);
        --tu-menu-line-strong: rgba(201,162,39,0.35);
        --tu-menu-btn-top: 18px;
        --tu-menu-btn-right: 18px;
        --tu-menu-panel-top: 78px;
        --tu-menu-panel-right: 18px;
        --tu-menu-panel-width: 340px;
      }
      body.tu-menu-open{ overflow:hidden !important; }
      .tu-menu-btn{
        position:fixed; top:var(--tu-menu-btn-top); right:var(--tu-menu-btn-right); z-index:2000;
        width:46px; height:46px; border-radius:999px;
        display:flex; align-items:center; justify-content:center;
        border:1px solid var(--tu-menu-line);
        background: linear-gradient(135deg, rgba(35,31,26,.92), rgba(20,18,16,.96));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 18px 44px rgba(0,0,0,.34);
        cursor:pointer;
        color: var(--tu-menu-accent);
        transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
      }
      .tu-menu-btn:hover{ transform: translateY(-1px) scale(1.02); background: linear-gradient(135deg, rgba(43,37,31,.94), rgba(24,21,18,.98)); border-color: var(--tu-menu-line-strong); box-shadow: 0 22px 46px rgba(0,0,0,.38); }
      .tu-menu-btn:active{ transform: translateY(0) scale(.98); }

      .tu-menu-overlay{
        position:fixed; inset:0; z-index:3000;
        background: rgba(0,0,0,.32);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity:0;
        pointer-events:none;
        transition: opacity .18s ease;
      }
      .tu-menu-overlay.open{ opacity:1; pointer-events:auto; }

      .tu-menu-panel{
        position:fixed;
        top: var(--tu-menu-panel-top);
        right: var(--tu-menu-panel-right);
        width: min(var(--tu-menu-panel-width), calc(100vw - 24px));
        max-width: calc(100vw - 24px);
        border-radius: 28px;
        border: 1px solid var(--tu-menu-line);
        background: linear-gradient(180deg, rgba(255,255,255,.03), transparent 18%), linear-gradient(135deg, rgba(34,29,23,.96), rgba(17,15,13,.98));
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 30px 80px rgba(0,0,0,.55);
        padding: 16px;
        transform-origin: 92% 0%;
        transform: translateY(-18px) scale(.90);
        opacity: 0;
      }

      html:not([data-theme="dark"]) .tu-menu-panel{
        background: linear-gradient(180deg, rgba(255,255,255,.76), rgba(249,245,238,.92));
        border-color: rgba(139,105,20,.18);
        box-shadow: 0 30px 80px rgba(44,36,22,.16);
      }
      html:not([data-theme="dark"]) .tu-menu-btn{
        color: var(--tu-menu-accent);
        border-color: rgba(139,105,20,.22);
        background: linear-gradient(135deg, rgba(255,251,245,.92), rgba(244,236,223,.96));
        box-shadow: 0 18px 44px rgba(44,36,22,.12);
      }
      html:not([data-theme="dark"]) .tu-tile,
      html:not([data-theme="dark"]) .tu-tab,
      html:not([data-theme="dark"]) .tu-menu-close{
        border-color: rgba(139,105,20,.16);
        background: rgba(139,105,20,.05);
      }
      .tu-menu-overlay.open .tu-menu-panel{ animation: tuPopIn .38s cubic-bezier(.18,.95,.2,1) forwards; }
      .tu-menu-overlay.closing .tu-menu-panel{ animation: tuPopOut .20s ease forwards; }

      @keyframes tuPopIn{
        0%{ transform: translateY(-18px) scale(.90); opacity:0; }
        55%{ transform: translateY(0) scale(1.045); opacity:1; }
        78%{ transform: translateY(0) scale(.995); opacity:1; }
        100%{ transform: translateY(0) scale(1); opacity:1; }
      }
      @keyframes tuPopOut{
        0%{ transform: translateY(0) scale(1); opacity:1; }
        100%{ transform: translateY(-10px) scale(.94); opacity:0; }
      }

      .tu-menu-head{ position:relative; padding: 6px 4px 2px; }
      .tu-menu-title{ text-align:center; font-weight: 900; letter-spacing:.2px; }
      .tu-menu-close{
        position:absolute; top:0; right:0;
        width:36px; height:36px; border-radius:12px;
        border:1px solid var(--tu-menu-line);
        background: linear-gradient(135deg, rgba(39,34,28,.96), rgba(23,20,17,.98));
        color: inherit;
        cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition: transform .16s ease, background .16s ease, border-color .16s ease;
      }
      .tu-menu-close:hover{ background: rgba(201,162,39,.1); border-color: var(--tu-menu-line-strong); transform: scale(1.02); }
      .tu-menu-close:active{ transform: scale(.98); }

      .tu-tabs{ margin-top:12px; display:flex; gap:10px; }
      .tu-tab{
        flex:1;
        border-radius: 14px;
        padding: 10px 12px;
        border:1px solid var(--tu-menu-line);
        background: rgba(201,162,39,.06);
        color: inherit;
        font-weight: 800;
        cursor:pointer;
        transition: background .18s ease, border-color .18s ease, transform .18s ease, color .18s ease;
      }
      .tu-tab.active{ background: linear-gradient(135deg, rgba(201,162,39,.94), rgba(159,127,23,.96)); border-color: var(--tu-menu-line-strong); color:#16120d; }

      .tu-menu-label{ margin-top:12px; font-size: 11px; letter-spacing: .14em; opacity:.58; padding-left: 2px; text-transform: uppercase; }

      .tu-grid{ margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .tu-tile{
        border-radius: 16px;
        padding: 14px 12px;
        border:1px solid var(--tu-menu-line);
        background: linear-gradient(135deg, rgba(39,34,28,.96), rgba(23,20,17,.98));
        text-decoration:none;
        color: inherit;
        font-weight: 800;
        display:flex;
        flex-direction: column;
        align-items:center;
        justify-content:center;
        gap: 8px;
        min-height: 84px;
        transform: translateY(10px) scale(.98);
        opacity: 0;
        transition: background .18s ease, border-color .18s ease, transform .18s ease;
      }
      .tu-menu-overlay.open .tu-tile{ animation: tuTileIn .30s cubic-bezier(.2,.95,.2,1) forwards; animation-delay: var(--d, 0ms); }
      @keyframes tuTileIn{ to { transform: translateY(0) scale(1); opacity: 1; } }

      .tu-tile:hover{ background: rgba(201,162,39,.1); border-color: var(--tu-menu-line-strong); }
      .tu-ico{ width:34px; height:34px; border-radius: 12px; display:flex; align-items:center; justify-content:center; border:1px solid var(--tu-menu-line); background: rgba(201,162,39,.08); color: var(--tu-menu-accent); }
      .tu-tile span:last-child{ text-decoration: underline; text-underline-offset: 3px; }
      .tu-danger{ color: #d89484; }

      @media (max-width: 520px){
        .tu-menu-panel{ right: var(--tu-menu-panel-right); width: min(var(--tu-menu-panel-width), calc(100vw - 24px)); }
        .tu-menu-btn{ right: var(--tu-menu-btn-right); }
      }
`;
    document.head.appendChild(style);
  }

  function mountFloatingMenu(auth) {
    if (document.getElementById('tuMenuBtn')) return;
    injectMenuStyles();
    const root = getRootPath();

    const btn = document.createElement('button');
    btn.id = 'tuMenuBtn';
    btn.className = 'tu-menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open menu');
    
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="2" opacity=".95" />
        <circle cx="16.6" cy="7.6" r="2.1" fill="currentColor" opacity=".75" />
      </svg>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'tuMenuOverlay';
    overlay.className = 'tu-menu-overlay';
    overlay.innerHTML = `
      <div class="tu-menu-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="tu-menu-head">
          <div class="tu-menu-title" id="tuMenuTitle">Menu</div>
          <button class="tu-menu-close" id="tuMenuClose" type="button" aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="tu-tabs" role="tablist" aria-label="Menu tabs">
          <button class="tu-tab active" type="button" id="tuTabProfile" role="tab" aria-selected="true">Profile</button>
          <button class="tu-tab" type="button" id="tuTabFeeds" role="tab" aria-selected="false">Feeds</button>
        </div>

        <div class="tu-menu-label">QUICK NAV</div>
        <div class="tu-grid" id="tuMenuGrid">
          <a class="tu-tile" href="/assets/${root}/index.html" style="--d:40ms">
            <span class="tu-ico">🏠</span>
            <span>Main page</span>
          </a>
          <a class="tu-tile" href="/assets/${root}/index.html#clubs" style="--d:80ms">
            <span class="tu-ico">🧑‍🤝‍🧑</span>
            <span>Clubs</span>
          </a>
          <a class="tu-tile" href="/assets/${root}/pages/account/account.html" style="--d:120ms">
            <span class="tu-ico">👤</span>
            <span>Account</span>
          </a>
          <button class="tu-tile tu-danger" id="tuLogoutBtn" type="button" style="--d:160ms">
            <span class="tu-ico">↩️</span>
            <span>Log out</span>
          </button>
        </div>
      </div>
    `;

    function open() {
      overlay.classList.remove('closing');
      overlay.classList.add('open');
      document.body.classList.add('tu-menu-open');
    }
    function close() {
      if (!overlay.classList.contains('open')) return;
      overlay.classList.add('closing');
      overlay.classList.remove('open');
      document.body.classList.remove('tu-menu-open');
      
      setTimeout(() => overlay.classList.remove('closing'), 220);
    }

    btn.addEventListener('click', open);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#tuMenuClose').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    
    const tabProfile = overlay.querySelector('#tuTabProfile');
    const tabFeeds = overlay.querySelector('#tuTabFeeds');
    function setActive(which){
      const isProfile = which === 'profile';
      tabProfile.classList.toggle('active', isProfile);
      tabFeeds.classList.toggle('active', !isProfile);
      tabProfile.setAttribute('aria-selected', String(isProfile));
      tabFeeds.setAttribute('aria-selected', String(!isProfile));
    }
    tabProfile.addEventListener('click', () => setActive('profile'));
    tabFeeds.addEventListener('click', () => setActive('feeds'));

    
    const logoutBtn = overlay.querySelector('#tuLogoutBtn');
    logoutBtn.addEventListener('click', async () => {
      if (auth.currentUser) await auth.signOut();
      close();
      window.location.href = `${root}/auth/login.html`;
    });

    document.body.appendChild(btn);
    document.body.appendChild(overlay);

    function updateFloatingMenuPosition() {
      const rootStyle = document.documentElement.style;
      let btnTop = 18;
      let btnRight = 18;
      let panelTop = 78;
      let panelRight = 18;
      let panelWidth = 340;

      const themeToggle = document.getElementById("theme-toggle");
      if (themeToggle) {
        const rect = themeToggle.getBoundingClientRect();
        const cs = window.getComputedStyle(themeToggle);
        const topValue = parseFloat(cs.top || "");
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          cs.display !== "none" &&
          cs.visibility !== "hidden";
        const isTopRightControl =
          cs.position === "fixed" &&
          Number.isFinite(topValue) &&
          topValue < Math.max(180, window.innerHeight * 0.35);

        if (isVisible && isTopRightControl) {
          const gap = 12;
          btnRight = Math.max(12, Math.round(window.innerWidth - rect.right));
          panelRight = btnRight;
          btnTop = Math.max(12, Math.round(rect.bottom + gap));
          panelTop = Math.round(btnTop + 60);
        }
      }

      if (window.innerWidth <= 520) {
        panelWidth = 320;
        btnRight = Math.max(12, btnRight);
        panelRight = Math.max(12, panelRight);
      }

      rootStyle.setProperty("--tu-menu-btn-top", `${btnTop}px`);
      rootStyle.setProperty("--tu-menu-btn-right", `${btnRight}px`);
      rootStyle.setProperty("--tu-menu-panel-top", `${panelTop}px`);
      rootStyle.setProperty("--tu-menu-panel-right", `${panelRight}px`);
      rootStyle.setProperty("--tu-menu-panel-width", `${panelWidth}px`);
    }

    updateFloatingMenuPosition();
    window.addEventListener("resize", updateFloatingMenuPosition, { passive: true });
    window.addEventListener("load", updateFloatingMenuPosition, { once: true });

    
    document.addEventListener('tu-auth-changed', (ev) => {
      const user = ev.detail && ev.detail.user;
      const title = overlay.querySelector('#tuMenuTitle');
      if (user && user.displayName) title.textContent = user.displayName;
      else title.textContent = 'Menu';
    });
  }

  function requireLogin(auth) {
    if (!auth.currentUser) {
      
      
      setTimeout(() => {
        if (!auth.currentUser) redirectToLogin();
      }, 450);
      return false;
    }
    
    if (isCachedBanned()) {
      redirectToBanned();
      return false;
    }
    return true;
  }

  async function requireRole(db, auth, allowed) {
    if (!requireLogin(auth)) return false;
    const role = await getRole(db, auth.currentUser.uid);
    if (!allowed.includes(role)) {
      const root = getRootPath();
      window.location.href = `${root}/auth/forbidden.html`;
      return false;
    }
    return true;
  }

  
  
  
  
  
  function getPageTeacherIdFromPath() {
    try {
      const parts = (window.location.pathname || "").split("/").filter(Boolean);
      const i = parts.indexOf("clubs");
      if (i >= 0 && parts.length >= i + 3) {
        const candidate = decodeURIComponent(parts[i + 2] || "").trim();
        if (!candidate) return "";
        const lower = candidate.toLowerCase();
        
        if (lower.includes(".html")) return "";
        if (lower.startsWith("teachers-sec")) return "";
        return candidate;
      }
    } catch (e) {}
    return "";
  }

  async function canEditThisClassroom(db, userDoc, teacherId) {
    const role = (userDoc && userDoc.role) ? String(userDoc.role) : "user";
    if (role === "admin") return true;

    if (role === "teacher") {
      const tid = (userDoc.teacherId || "").toString().trim();
      if (tid && teacherId && tid === teacherId) return true;

      
      const online = (userDoc.teacherIdonline || userDoc[" teacherIdonline"] || "").toString().trim();
      if (online && teacherId) {
        try {
          const secSnap = await db.ref(`teachers/${teacherId}/classData/securityID`).once("value");
          const sec = (secSnap.val() || "").toString().trim();
          if (sec && sec === online) return true;
        } catch (e) {}
      }
    }

    return false;
  }

  function ensureAdminFabExists() {
    const overlay = document.getElementById("admin-overlay");
    if (!overlay) return null;

    let btn = document.getElementById("tu-admin-fab");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = "tu-admin-fab";
    btn.type = "button";
    btn.textContent = "Admin panel";
    btn.setAttribute("aria-label", "Open admin panel");
    btn.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:92px",
      "z-index:9999",
      "padding:12px 16px",
      "border-radius:999px",
      "border:1px solid rgba(201,162,39,0.22)",
      "background:linear-gradient(135deg, rgba(201,162,39,0.96), rgba(159,127,23,0.96))",
      "color:#16120d",
      "font-weight:800",
      "cursor:pointer",
      "box-shadow:0 16px 34px rgba(0,0,0,0.35)",
      "display:none"
    ].join(";");

    btn.addEventListener("click", () => {
      
      if (typeof window.openAdmin === "function") {
        window.openAdmin();
        return;
      }
      
      overlay.classList.remove("hidden");
    });

    document.body.appendChild(btn);
    return btn;
  }

  function setupAdminFab(db, auth) {
    const btn = ensureAdminFabExists();
    if (!btn) return;

    const teacherId = getPageTeacherIdFromPath();

    async function refresh() {
      try {
        if (!auth.currentUser) {
          btn.style.display = "none";
          return;
        }
        const userDoc = await getUserDoc(db, auth.currentUser.uid);
        const ok = await canEditThisClassroom(db, userDoc, teacherId);
        btn.style.display = ok ? "inline-flex" : "none";
      } catch (e) {
        btn.style.display = "none";
      }
    }

    
    document.addEventListener("tu-auth-changed", () => refresh());
    setTimeout(() => refresh(), 700);
  }

  
  
  function setupMentorChatCta() {
    const p = window.location.pathname || "";
    if (p.includes("/private chat/")) return;

    const teacherId = (window.TEACHER_ID || window.teacherId || getPageTeacherIdFromPath() || "").toString().trim();
    if (!teacherId) return;

    if (document.getElementById("tu-mentor-chat-btn")) return;

    if (!document.getElementById("tu-mentor-chat-style")) {
      const style = document.createElement("style");
      style.id = "tu-mentor-chat-style";
      style.textContent = `
        .tu-mentor-chat-btn{
          position:fixed;
          right:20px;
          bottom:24px;
          z-index:9999;
          padding:12px 16px;
          border-radius:999px;
          border:1px solid rgba(201,162,39,0.24);
          background: linear-gradient(135deg, rgba(201,162,39,0.96), rgba(159,127,23,0.96));
          color:#16120d;
          font-weight:800;
          font-size:13px;
          text-decoration:none;
          box-shadow:0 16px 34px rgba(0,0,0,0.35);
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          max-width: calc(100vw - 24px);
          white-space: normal;
          overflow-wrap: anywhere;
          text-align: center;
          transition: transform .16s ease, box-shadow .18s ease, filter .18s ease;
        }
        .tu-mentor-chat-btn:hover{
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow:0 18px 38px rgba(0,0,0,0.4);
        }
      `;
      document.head.appendChild(style);
    }

    const root = getRootPath();
    const href = `${root}/pages/private chat/private_chat.html?mentor=${encodeURIComponent(teacherId)}`;
    const btn = document.createElement("a");
    btn.id = "tu-mentor-chat-btn";
    btn.className = "tu-mentor-chat-btn";
    btn.href = href;
    
    function updateMentorChatPosition() {
      btn.style.right = "20px";
      btn.style.bottom = "24px";
      btn.style.top = "auto";

      const themeToggle = document.getElementById("theme-toggle");
      if (!themeToggle) return;

      try {
        const rect = themeToggle.getBoundingClientRect();
        const cs = window.getComputedStyle(themeToggle);
        const topValue = parseFloat(cs.top || "");
        const bottomValue = parseFloat(cs.bottom || "");
        const height = parseFloat(cs.height || themeToggle.offsetHeight || "0");
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          cs.display !== "none" &&
          cs.visibility !== "hidden";

        if (!isVisible || cs.position !== "fixed") return;

        const isBottomAnchored =
          Number.isFinite(bottomValue) &&
          bottomValue >= 0 &&
          bottomValue < Math.max(220, window.innerHeight * 0.5) &&
          (!Number.isFinite(topValue) || topValue > Math.max(180, window.innerHeight * 0.4));

        if (isBottomAnchored && Number.isFinite(height)) {
          const offset = Math.max(24, Math.round(bottomValue + height + 12));
          btn.style.bottom = `${offset}px`;
        }
      } catch (e) {}
    }

    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      Message Mentor
    `;
    btn.addEventListener("click", () => {
      try { sessionStorage.setItem("tu_return_url", href); } catch (e) {}
    });

    document.body.appendChild(btn);
    updateMentorChatPosition();
    window.addEventListener("resize", updateMentorChatPosition, { passive: true });
    window.addEventListener("load", updateMentorChatPosition, { once: true });
  }

  
  
  const unreadChatNameCache = new Map();
  let lastUnreadChatState = { total: 0, chats: [] };

  function injectUnreadChatStyles() {
    if (document.getElementById("tu-unread-chat-styles")) return;
    const style = document.createElement("style");
    style.id = "tu-unread-chat-styles";
    style.textContent = `
      .navbar-icon,
      .navbar-hamburger,
      .tu-menu-btn {
        position: relative;
      }
      .nav-badge,
      .tu-unread-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #c9a227;
        color: #16120d;
        border: 2px solid rgba(12, 10, 8, 0.88);
        box-shadow: 0 10px 24px rgba(0,0,0,.28);
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0;
        z-index: 3;
      }
      .nav-badge.hidden,
      .tu-unread-badge.hidden {
        display: none !important;
      }
      .tu-chat-mobile-item {
        display: none;
      }
      .tu-chat-mobile-link {
        position: relative;
      }
      .tu-chat-mobile-copy {
        min-width: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
      }
      .tu-chat-mobile-label {
        font: inherit;
        color: inherit;
      }
      .tu-chat-mobile-meta {
        display: block;
        max-width: 100%;
        font-size: 0.68rem;
        line-height: 1.35;
        letter-spacing: 0.04em;
        text-transform: none;
        opacity: 0.74;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tu-chat-mobile-badge {
        position: static;
        margin-left: auto;
        flex-shrink: 0;
      }
      @media (max-width: 900px) {
        .tu-chat-mobile-item {
          display: list-item;
        }
        .tu-chat-mobile-link::before {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getReadableUserName(data) {
    if (!data) return "";
    const first = String(data.displayName || data.name || data.username || data.userName || "").trim();
    const last = String(data.surename || data.surname || "").trim();
    if (first && last && !first.toLowerCase().includes(last.toLowerCase())) {
      return `${first} ${last}`.trim();
    }
    return first || String(data.email || "").trim();
  }

  function getUnreadChatStateEmpty() {
    return { total: 0, chats: [] };
  }

  function formatUnreadChatSummary(state) {
    const chats = Array.isArray(state?.chats) ? state.chats : [];
    if (!chats.length) return "";
    const preview = chats.slice(0, 3).map((chat) => {
      const name = chat.peerName || "Someone";
      return chat.unreadCount > 1 ? `${name} (${chat.unreadCount})` : name;
    }).join(", ");
    if (chats.length > 3) return `${preview} +${chats.length - 3} more`;
    return preview;
  }

  function buildUnreadChatLabel(state) {
    const total = Number(state?.total) || 0;
    if (!total) return "Private chat";
    const totalLabel = total === 1 ? "1 new message" : `${total} new messages`;
    const summary = formatUnreadChatSummary(state);
    return summary ? `Private chat - ${totalLabel} from ${summary}` : `Private chat - ${totalLabel}`;
  }

  function getUnreadBadgeText(total) {
    return total > 99 ? "99+" : String(total || "");
  }

  function findChatBellAnchors() {
    try {
      return document.querySelectorAll('a.navbar-icon[href*="/pages/private chat/private_chat.html"]');
    } catch (e) {
      return [];
    }
  }

  function findUnreadMenuButtons() {
    try {
      return document.querySelectorAll(".navbar-hamburger, #tuMenuBtn");
    } catch (e) {
      return [];
    }
  }

  function ensureChatBellBadges() {
    const anchors = findChatBellAnchors();
    const badges = [];
    if (!anchors || !anchors.length) return badges;
    anchors.forEach((a) => {
      let badge = a.querySelector(".nav-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "nav-badge hidden";
        badge.setAttribute("aria-hidden", "true");
        a.appendChild(badge);
      }
      badges.push(badge);
    });
    return badges;
  }

  function ensureUnreadMenuBadges() {
    const buttons = findUnreadMenuButtons();
    const badges = [];
    if (!buttons || !buttons.length) return badges;
    buttons.forEach((button) => {
      let badge = button.querySelector(".tu-unread-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tu-unread-badge hidden";
        badge.setAttribute("aria-hidden", "true");
        button.appendChild(badge);
      }
      badges.push(badge);
    });
    return badges;
  }

  function ensureMobileChatMenuEntries() {
    const root = getRootPath();
    const href = `${root}/pages/private%20chat/private_chat.html`;
    const lists = document.querySelectorAll(".navbar-links");
    const entries = [];
    lists.forEach((list) => {
      if (!list) return;
      let item = list.querySelector(".tu-chat-mobile-item");
      if (!item) {
        item = document.createElement("li");
        item.className = "tu-chat-mobile-item";
        item.innerHTML = `
          <a href="${href}" class="tu-chat-mobile-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 9h8"></path>
              <path d="M8 13h5"></path>
            </svg>
            <span class="tu-chat-mobile-copy">
              <span class="tu-chat-mobile-label">Private chat</span>
              <small class="tu-chat-mobile-meta">Open your messages</small>
            </span>
            <span class="tu-unread-badge tu-chat-mobile-badge hidden" aria-hidden="true"></span>
          </a>
        `;
        list.appendChild(item);
      }
      const link = item.querySelector(".tu-chat-mobile-link");
      const badge = item.querySelector(".tu-chat-mobile-badge");
      const meta = item.querySelector(".tu-chat-mobile-meta");
      if (link && badge && meta) {
        entries.push({ link, badge, meta });
      }
    });
    return entries;
  }

  function updateBadgeNode(badge, total) {
    if (!badge) return;
    const show = Number(total) > 0;
    badge.textContent = show ? getUnreadBadgeText(total) : "";
    badge.classList.toggle("hidden", !show);
  }

  function updateUnreadChatUi(state) {
    lastUnreadChatState = state || getUnreadChatStateEmpty();
    injectUnreadChatStyles();
    const total = Number(lastUnreadChatState?.total) || 0;
    const label = buildUnreadChatLabel(lastUnreadChatState);
    const summary = formatUnreadChatSummary(lastUnreadChatState);

    ensureChatBellBadges().forEach((badge) => updateBadgeNode(badge, total));
    ensureUnreadMenuBadges().forEach((badge) => updateBadgeNode(badge, total));

    findChatBellAnchors().forEach((anchor) => {
      anchor.setAttribute("title", label);
      anchor.setAttribute("aria-label", label);
    });

    findUnreadMenuButtons().forEach((button) => {
      button.setAttribute("title", label);
      const baseLabel = button.id === "tuMenuBtn" ? "Open menu" : "Toggle menu";
      button.setAttribute("aria-label", total ? `${baseLabel} - ${label}` : baseLabel);
    });

    ensureMobileChatMenuEntries().forEach(({ link, badge, meta }) => {
      updateBadgeNode(badge, total);
      if (meta) {
        meta.textContent = total ? summary : "Open your messages";
      }
      if (link) {
        link.setAttribute("title", label);
        link.setAttribute("aria-label", label);
      }
    });

    document.dispatchEvent(new CustomEvent("tu-unread-chat-state", { detail: lastUnreadChatState }));
  }

  function getCachedUnreadPeerName(db, uid) {
    const key = String(uid || "").trim();
    if (!key) return Promise.resolve("Someone");
    if (unreadChatNameCache.has(key)) return Promise.resolve(unreadChatNameCache.get(key));
    const pending = db.ref(`users/${key}`).once("value")
      .then((snap) => {
        const name = getReadableUserName((snap && snap.val()) || {}) || "Someone";
        unreadChatNameCache.set(key, name);
        return name;
      })
      .catch(() => {
        unreadChatNameCache.set(key, "Someone");
        return "Someone";
      });
    unreadChatNameCache.set(key, pending);
    return pending.then((name) => {
      unreadChatNameCache.set(key, name);
      return name;
    });
  }

  const knownPrivateChatObservers = new Map();

  function getPrivateChatPeerUid(data, uid) {
    const participants = Array.isArray(data?.participants) ? data.participants : [];
    return participants.find((value) => value && value !== uid) || "";
  }

  function getPrivateChatId(uidA, uidB) {
    const values = [String(uidA || "").trim(), String(uidB || "").trim()].filter(Boolean);
    if (values.length !== 2) return "";
    return values.sort().join("_");
  }

  function sortKnownPrivateChats(entries) {
    return Array.from(entries || []).sort((a, b) => {
      const aTime = Number(a?.data?.lastMessageAtMs || 0);
      const bTime = Number(b?.data?.lastMessageAtMs || 0);
      if (aTime !== bTime) return bTime - aTime;
      return String(a?.peerUid || "").localeCompare(String(b?.peerUid || ""));
    });
  }

  function createKnownPrivateChatObserver(db, uid) {
    const listeners = new Set();
    let stopped = false;
    let currentSnapshot = [];
    let firestoreInstance = null;
    let usersRef = null;
    let userAddedHandler = null;
    let userChangedHandler = null;
    let userRemovedHandler = null;
    const chatEntries = new Map();
    const peerListeners = new Map();

    function emit() {
      if (stopped) return;
      currentSnapshot = sortKnownPrivateChats(chatEntries.values());
      listeners.forEach((listener) => {
        try { listener(currentSnapshot); } catch (e) {}
      });
    }

    function removeChatEntry(chatId) {
      if (!chatId) return;
      if (!chatEntries.has(chatId)) return;
      chatEntries.delete(chatId);
      emit();
    }

    function watchPeerChat(peerUid) {
      const normalizedPeerUid = String(peerUid || "").trim();
      if (!normalizedPeerUid || normalizedPeerUid === uid || peerListeners.has(normalizedPeerUid) || !firestoreInstance) {
        return;
      }

      const chatId = getPrivateChatId(uid, normalizedPeerUid);
      if (!chatId) return;

      const unsubscribe = firestoreInstance.collection("privateChats").doc(chatId).onSnapshot((doc) => {
        if (stopped) return;
        if (!doc.exists) {
          removeChatEntry(chatId);
          return;
        }

        const data = doc.data() || {};
        const resolvedPeerUid = getPrivateChatPeerUid(data, uid) || normalizedPeerUid;
        if (!resolvedPeerUid) {
          removeChatEntry(chatId);
          return;
        }

        chatEntries.set(chatId, {
          chatId: doc.id,
          peerUid: resolvedPeerUid,
          data,
        });
        emit();
      }, (error) => {
        console.error("private chat doc watcher failed", chatId, error);
        removeChatEntry(chatId);
      });

      peerListeners.set(normalizedPeerUid, { chatId, unsubscribe });
    }

    function unwatchPeerChat(peerUid) {
      const normalizedPeerUid = String(peerUid || "").trim();
      if (!normalizedPeerUid) return;
      const entry = peerListeners.get(normalizedPeerUid);
      if (!entry) return;
      peerListeners.delete(normalizedPeerUid);
      if (typeof entry.unsubscribe === "function") {
        try { entry.unsubscribe(); } catch (e) {}
      }
      removeChatEntry(entry.chatId);
    }

    function attachUsersWatcher() {
      if (!db || typeof db.ref !== "function") {
        emit();
        return;
      }

      usersRef = db.ref("users");
      userAddedHandler = (snap) => {
        const data = (snap && typeof snap.val === "function") ? (snap.val() || {}) : {};
        const peerUid = String(data.uid || snap?.key || "").trim();
        watchPeerChat(peerUid);
      };
      userChangedHandler = (snap) => {
        const data = (snap && typeof snap.val === "function") ? (snap.val() || {}) : {};
        const peerUid = String(data.uid || snap?.key || "").trim();
        watchPeerChat(peerUid);
      };
      userRemovedHandler = (snap) => {
        const data = (snap && typeof snap.val === "function") ? (snap.val() || {}) : {};
        const peerUid = String(data.uid || snap?.key || "").trim();
        unwatchPeerChat(peerUid);
      };

      usersRef.on("child_added", userAddedHandler);
      usersRef.on("child_changed", userChangedHandler);
      usersRef.on("child_removed", userRemovedHandler);
    }

    async function boot() {
      firestoreInstance = await ensureFirestore().catch(() => null);
      if (stopped || !firestoreInstance) {
        emit();
        return;
      }
      attachUsersWatcher();
    }

    boot().catch(() => emit());

    return {
      subscribe(listener) {
        listeners.add(listener);
        try { listener(currentSnapshot); } catch (e) {}
        return () => {
          listeners.delete(listener);
        };
      },
      hasSubscribers() {
        return listeners.size > 0;
      },
      stop() {
        stopped = true;
        listeners.clear();
        if (usersRef) {
          if (userAddedHandler) usersRef.off("child_added", userAddedHandler);
          if (userChangedHandler) usersRef.off("child_changed", userChangedHandler);
          if (userRemovedHandler) usersRef.off("child_removed", userRemovedHandler);
        }
        Array.from(peerListeners.values()).forEach((entry) => {
          if (typeof entry?.unsubscribe === "function") {
            try { entry.unsubscribe(); } catch (e) {}
          }
        });
        peerListeners.clear();
        chatEntries.clear();
        usersRef = null;
        userAddedHandler = null;
        userChangedHandler = null;
        userRemovedHandler = null;
        currentSnapshot = [];
      },
    };
  }

  function observeKnownPrivateChats(db, uid, listener) {
    const key = String(uid || "").trim();
    if (!key || typeof listener !== "function") return () => {};
    let entry = knownPrivateChatObservers.get(key);
    if (!entry) {
      entry = createKnownPrivateChatObserver(db, key);
      knownPrivateChatObservers.set(key, entry);
    }
    const unsubscribe = entry.subscribe(listener);
    return function stopObservingKnownPrivateChats() {
      try { unsubscribe(); } catch (e) {}
      const current = knownPrivateChatObservers.get(key);
      if (current && !current.hasSubscribers()) {
        current.stop();
        knownPrivateChatObservers.delete(key);
      }
    };
  }

  function watchUnreadMessages(db, uid, onUpdate) {
    if (!uid) return () => {};

    let stopped = false;
    let snapshotVersion = 0;
    const unsubscribe = observeKnownPrivateChats(db, uid, async (chatStates) => {
      const currentVersion = ++snapshotVersion;
      let total = 0;
      const unreadChats = [];
      (chatStates || []).forEach((entry) => {
        const data = entry && entry.data ? entry.data : {};
        const unread = data.unreadCounts || {};
        const unreadCount = Number(unread[uid]) || 0;
        if (unreadCount <= 0) return;
        total += unreadCount;
        unreadChats.push({
          chatId: entry.chatId,
          peerUid: entry.peerUid,
          unreadCount,
          lastMessageText: String(data.lastMessageText || "").trim(),
          lastMessageAtMs: Number(data.lastMessageAtMs) || 0,
        });
      });

      unreadChats.sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        return (b.lastMessageAtMs || 0) - (a.lastMessageAtMs || 0);
      });

      const chats = await Promise.all(unreadChats.slice(0, 5).map(async (chat) => ({
        ...chat,
        peerName: await getCachedUnreadPeerName(db, chat.peerUid),
      })));

      if (stopped || currentVersion !== snapshotVersion) return;
      onUpdate({ total, chats });
    });

    return function stop() {
      stopped = true;
      try { unsubscribe(); } catch (e) {}
      onUpdate(getUnreadChatStateEmpty());
    };
  }

  function setupChatBellUnread(db, auth) {
    injectUnreadChatStyles();
    let stop = null;

    function stopWatching() {
      if (typeof stop === "function") {
        try { stop(); } catch (e) {}
      }
      stop = null;
    }

    function refresh() {
      stopWatching();
      if (!auth.currentUser) {
        updateUnreadChatUi(getUnreadChatStateEmpty());
        return;
      }

      const uid = auth.currentUser.uid;
      stop = watchUnreadMessages(db, uid, updateUnreadChatUi);
    }

    document.addEventListener("tu-auth-changed", refresh);
    window.addEventListener("resize", () => updateUnreadChatUi(lastUnreadChatState), { passive: true });
    setTimeout(refresh, 600);
  }

  let incomingPrivateCallBannerEl = null;
  let incomingPrivateCallAudio = null;
  let incomingPrivateCallSessionKey = "";
  const incomingPrivateCallNotified = new Set();

  function isPrivateChatPage() {
    try {
      const path = decodeURIComponent(String(window.location.pathname || "")).toLowerCase();
      return path.includes("/pages/private chat/private_chat.html");
    } catch (e) {
      return false;
    }
  }

  function getIncomingCallSessionKey(call) {
    if (!call || !call.callId) return "";
    const stamp = Number(call.createdAtMs || call.updatedAtMs || 0);
    return `${call.callId}:${stamp}`;
  }

  function getIncomingCallParticipants(call, uid) {
    if (Array.isArray(call?.participants) && call.participants.length) {
      return call.participants;
    }
    const fromUid = String(call?.fromUid || "").trim();
    const toUid = String(call?.toUid || uid || "").trim();
    return [fromUid, toUid].filter(Boolean).sort();
  }

  function getIncomingCallUrl(call, action = "join") {
    const root = getRootPath();
    const params = new URLSearchParams();
    params.set("callAction", action === "accept" ? "accept" : "join");
    params.set("callId", String(call?.callId || ""));
    params.set("callPeer", String(call?.fromUid || ""));
    params.set("callMode", String(call?.mode || "").toLowerCase() === "video" ? "video" : "audio");
    if (call?.fromUid) params.set("mentor", String(call.fromUid));
    return `${root}/pages/private%20chat/private_chat.html?${params.toString()}`;
  }

  function injectIncomingCallStyles() {
    if (document.getElementById("tu-incoming-call-styles")) return;
    const style = document.createElement("style");
    style.id = "tu-incoming-call-styles";
    style.textContent = `
      .tu-incoming-call-banner {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 12000;
        width: min(360px, calc(100vw - 28px));
        padding: 16px 16px 14px;
        border-radius: 18px;
        background: linear-gradient(145deg, rgba(16,22,36,0.96), rgba(9,13,24,0.94));
        border: 1px solid rgba(201,162,39,0.26);
        box-shadow: 0 18px 44px rgba(0,0,0,.42);
        color: #f5f7fb;
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .tu-incoming-call-top {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .tu-incoming-call-avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 46px;
        background: rgba(201,162,39,0.18);
        border: 1px solid rgba(201,162,39,0.32);
        color: #eac979;
        font-weight: 800;
        font-size: 16px;
        letter-spacing: 0.04em;
      }
      .tu-incoming-call-copy {
        min-width: 0;
        flex: 1;
      }
      .tu-incoming-call-label {
        display: inline-flex;
        align-items: center;
        margin-bottom: 6px;
        padding: 4px 9px;
        border-radius: 999px;
        background: rgba(201,162,39,0.12);
        color: #eac979;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .tu-incoming-call-title {
        font-size: 16px;
        font-weight: 700;
        line-height: 1.3;
        color: #f5f7fb;
      }
      .tu-incoming-call-meta {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.4;
        color: rgba(245,247,251,0.72);
      }
      .tu-incoming-call-actions {
        display: flex;
        gap: 10px;
        margin-top: 14px;
      }
      .tu-incoming-call-btn {
        flex: 1;
        min-height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        color: #f5f7fb;
        font-size: 13px;
        font-weight: 700;
      }
      .tu-incoming-call-btn.accept {
        background: rgba(34,197,94,0.16);
        border-color: rgba(34,197,94,0.3);
        color: #c7f9d9;
      }
      .tu-incoming-call-btn.decline {
        background: rgba(239,68,68,0.15);
        border-color: rgba(239,68,68,0.28);
        color: #fecaca;
      }
      @media (max-width: 700px) {
        .tu-incoming-call-banner {
          right: 12px;
          left: 12px;
          bottom: 12px;
          width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function stopIncomingCallTone() {
    if (!incomingPrivateCallAudio) return;
    incomingPrivateCallAudio.pause();
    try { incomingPrivateCallAudio.currentTime = 0; } catch (e) {}
  }

  function playIncomingCallTone() {
    const root = getRootPath();
    const src = `${root}/assets/incoming.mp3`;
    if (!incomingPrivateCallAudio || incomingPrivateCallAudio.src !== new URL(src, window.location.href).toString()) {
      incomingPrivateCallAudio = new Audio(src);
      incomingPrivateCallAudio.loop = true;
      incomingPrivateCallAudio.preload = "auto";
    }
    incomingPrivateCallAudio.volume = 1;
    incomingPrivateCallAudio.play().catch(() => {});
  }

  function removeIncomingCallBanner() {
    incomingPrivateCallSessionKey = "";
    if (incomingPrivateCallBannerEl && incomingPrivateCallBannerEl.parentNode) {
      incomingPrivateCallBannerEl.parentNode.removeChild(incomingPrivateCallBannerEl);
    }
    incomingPrivateCallBannerEl = null;
    stopIncomingCallTone();
  }

  async function updateIncomingCallStatus(firestore, uid, call, status) {
    if (!firestore || !uid || !call?.callId) return;
    const updatedAtMs = Date.now();
    const participants = getIncomingCallParticipants(call, uid);
    const patch = {
      callId: call.callId,
      chatId: call.callId,
      participants,
      fromUid: String(call.fromUid || ""),
      toUid: String(call.toUid || ""),
      mode: String(call.mode || "").toLowerCase() === "video" ? "video" : "audio",
      status,
      createdAtMs: Number(call.createdAtMs || updatedAtMs),
      endedBy: uid,
      endedAtMs: updatedAtMs,
      updatedAtMs,
    };
    await firestore.collection("privateCalls").doc(call.callId).set(patch, { merge: true });
    await firestore.collection("privateChats").doc(call.callId).set({
      chatId: call.callId,
      participants,
      createdAtMs: Number(call.createdAtMs || updatedAtMs),
      updatedAtMs,
      lastMessageAtMs: 0,
      lastMessageSenderId: "",
      lastMessageText: "",
      unreadCounts: {
        [String(call.fromUid || "")]: 0,
        [String(call.toUid || "")]: 0,
      },
      typing: {
        [String(call.fromUid || "")]: 0,
        [String(call.toUid || "")]: 0,
      },
      activeCall: patch,
    }, { merge: true }).catch(() => {});
  }

  async function showIncomingCallNotification(call, peerName) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (!document.hidden && document.hasFocus()) return;

    const modeLabel = String(call?.mode || "").toLowerCase() === "video" ? "Video call" : "Voice call";
    const title = peerName || "Incoming call";
    const options = {
      body: `${modeLabel} incoming`,
      icon: "/icon.png",
      badge: "/icon.png",
      tag: `incoming-call-${String(call?.callId || "unknown")}`,
      renotify: true,
      data: {
        url: getIncomingCallUrl(call),
        peerUid: String(call?.fromUid || ""),
      },
    };
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
      }
      new Notification(title, options);
    } catch (e) {}
  }

  function renderIncomingCallBanner(firestore, uid, call, peerName) {
    if (!firestore || !uid || !call?.callId) return;
    injectIncomingCallStyles();
    const sessionKey = getIncomingCallSessionKey(call);
    incomingPrivateCallSessionKey = sessionKey;

    const initials = String(peerName || "U")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

    if (!incomingPrivateCallBannerEl) {
      incomingPrivateCallBannerEl = document.createElement("div");
      incomingPrivateCallBannerEl.className = "tu-incoming-call-banner";
      incomingPrivateCallBannerEl.id = "tu-incoming-call-banner";
      document.body.appendChild(incomingPrivateCallBannerEl);
    }

    const modeLabel = String(call.mode || "").toLowerCase() === "video" ? "Video call" : "Voice call";
    incomingPrivateCallBannerEl.innerHTML = `
      <div class="tu-incoming-call-top">
        <div class="tu-incoming-call-avatar">${initials}</div>
        <div class="tu-incoming-call-copy">
          <div class="tu-incoming-call-label">${modeLabel}</div>
          <div class="tu-incoming-call-title">${peerName || "Someone"} is calling you</div>
          <div class="tu-incoming-call-meta">Accept to answer in private chat.</div>
        </div>
      </div>
      <div class="tu-incoming-call-actions">
        <button type="button" class="tu-incoming-call-btn decline">Decline</button>
        <button type="button" class="tu-incoming-call-btn accept">Accept</button>
      </div>
    `;

    const declineBtn = incomingPrivateCallBannerEl.querySelector(".tu-incoming-call-btn.decline");
    const acceptBtn = incomingPrivateCallBannerEl.querySelector(".tu-incoming-call-btn.accept");

    if (declineBtn) {
      declineBtn.onclick = async () => {
        declineBtn.disabled = true;
        acceptBtn && (acceptBtn.disabled = true);
        try {
          await updateIncomingCallStatus(firestore, uid, call, "rejected");
        } catch (e) {}
        removeIncomingCallBanner();
      };
    }

    if (acceptBtn) {
      acceptBtn.onclick = () => {
        const acceptUrl = getIncomingCallUrl(call, "accept");
        removeIncomingCallBanner();
        window.location.href = acceptUrl;
      };
    }

    playIncomingCallTone();
  }

  function setupIncomingPrivateCalls(db, auth) {
    if (isPrivateChatPage()) return;
    let stop = null;

    function stopWatching() {
      if (typeof stop === "function") {
        try { stop(); } catch (e) {}
      }
      stop = null;
      removeIncomingCallBanner();
    }

    async function refresh() {
      stopWatching();
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const firestore = await ensureFirestore().catch(() => null);
      if (!firestore) return;

      let stopped = false;
      const unsubscribe = observeKnownPrivateChats(db, uid, async (chatStates) => {
        if (stopped) return;
        const now = Date.now();
        const ringing = [];
        (chatStates || []).forEach((entry) => {
          const chatData = entry && entry.data ? entry.data : {};
          const data = chatData.activeCall || null;
          if (!data) return;
          const status = String(data.status || "").toLowerCase();
          if (status !== "ringing") return;
          if (String(data.toUid || "") !== String(uid || "")) return;
          const createdAtMs = Number(data.createdAtMs || 0);
          if (createdAtMs > 0 && (now - createdAtMs) > 45000) return;
          const callId = String(data.callId || entry.chatId || "").trim();
          if (!callId) return;
          ringing.push({
            ...data,
            callId,
            chatId: data.chatId || entry.chatId,
            participants: getIncomingCallParticipants(data, uid),
          });
        });

        ringing.sort((a, b) => {
          const aTime = Number(a.createdAtMs || a.updatedAtMs || 0);
          const bTime = Number(b.createdAtMs || b.updatedAtMs || 0);
          return bTime - aTime;
        });

        const activeCall = ringing[0] || null;
        if (!activeCall) {
          removeIncomingCallBanner();
          return;
        }

        const sessionKey = getIncomingCallSessionKey(activeCall);
        const peerName = await getCachedUnreadPeerName(db, activeCall.fromUid);

        if (!incomingPrivateCallNotified.has(sessionKey)) {
          incomingPrivateCallNotified.add(sessionKey);
          showIncomingCallNotification(activeCall, peerName).catch(() => {});
        }

        renderIncomingCallBanner(firestore, uid, activeCall, peerName);
      });

      stop = function stopIncomingWatcher() {
        stopped = true;
        try { unsubscribe(); } catch (e) {}
      };
    }

    document.addEventListener("tu-auth-changed", refresh);
    window.addEventListener("beforeunload", removeIncomingCallBanner);
    setTimeout(refresh, 800);
  }

window.TU = {
    init: function () {
      const { auth, db, firestore, stub } = initFirebaseOnce();
      
      if (!stub && typeof firebase !== 'undefined' && firebase.auth && firebase.auth.Auth) {
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      }
      
      window.TU.auth = auth;
      window.TU.db = db;
      window.TU.firestore = firestore || null;
      try { normalizeFixedControlAlignment(); } catch (e) {}

      if (!stub) {
        ensureFirestore().then((fs) => {
          window.TU.firestore = fs || null;
          document.dispatchEvent(new CustomEvent("tu-firestore-ready", { detail: { firestore: fs || null } }));
        }).catch(() => {
          window.TU.firestore = null;
        });
      }

      
      try { setupAdminFab(db, auth); } catch (e) {}
      try { setupMentorChatCta(); } catch (e) {}
      if (!stub) {
        try { setupChatBellUnread(db, auth); } catch (e) {}
        try { setupIncomingPrivateCalls(db, auth); } catch (e) {}
      }

      let banUnsub = null;

      auth.onAuthStateChanged((user) => {
        window.TU.user = user || null;

        
        if (banUnsub) { banUnsub(); banUnsub = null; }

        if (user) {
          ensureUserDoc(db, user).catch(() => {});

          
          banUnsub = watchBan(db, user.uid, (meta) => {
            cacheBan(meta);

            if (meta && meta.active) {
              redirectToBanned();
              return;
            }

            
            if (window.location.pathname.includes('/auth/banned.html')) {
              redirectToHome();
            }
          });
        } else {
          cacheBan(null);
        }

        document.dispatchEvent(new CustomEvent('tu-auth-changed', { detail: { user } }));
      });;

      
      

      return window.TU;
    },
    getFirestore: ensureFirestore,
    observeKnownPrivateChats,
    ensureUserDoc,
    getRole,
    requireLogin,
    requireRole,
    getRootPath,
    popReturnUrl,
    needsProfileCompletion,
    requireProfileCompletion,
    getUserDoc,
    
    getBanStatus,
    checkBanAndRedirect,
    isCachedBanned,
    watchBan,
    redirectToHome,
  };
})();
