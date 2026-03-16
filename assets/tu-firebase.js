(function () {
  function hasFirebaseConfig() {
    return !!window.TU_FIREBASE_CONFIG;
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

    return { auth: stubAuth, db: stubDb, stub: true };
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
    return { auth, db, stub: false };
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

  // -----------------------------
  // BAN SYSTEM
  // -----------------------------
  // Supported shapes in RTDB:
  // 1) /banned/{uid}: true
  // 2) /banned/{uid}: { active: true, until: <ms timestamp|null>, reason: "..." }
  // 3) /users/{uid}/banned: same shapes as above (legacy/alternative)
  function isBanActive(raw) {
    if (!raw) return false;
    if (raw === true) return true;
    if (typeof raw === 'object') {
      if (raw.active === false) return false;
      const until = raw.until;
      if (typeof until === 'number' && until > 0) {
        return Date.now() < until;
      }
      // if "until" is missing/null and active isn't explicitly false -> treat as active
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
    // Prefer /banned/{uid}, fallback to /users/{uid}/banned
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
    // avoid redirect loop
    if (window.location.pathname.includes('/auth/banned.html')) return;
    window.location.href = `${root}/auth/banned.html`;
  }

  function redirectToHome() {
    const root = getRootPath();
    // avoid redirect loop
    if (window.location.pathname.includes('/home.html')) return;
    window.location.href = `${root}/home.html`;
  }

  // Realtime ban listener (no refresh needed)
  // Returns an "unsubscribe" function.
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
    // Avoid redirect loops on auth pages
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

  function injectMenuStyles() {
    if (document.getElementById('tu-menu-styles-v2')) return;
    const style = document.createElement('style');
    style.id = 'tu-menu-styles-v2';
    style.textContent = `
      :root{ --tu-accent: rgba(124,140,255,1); }
      body.tu-menu-open{ overflow:hidden !important; }
      /* Floating icon (same vibe as the video: circular ring button) */
      .tu-menu-btn{
        position:fixed; top:18px; right:18px; z-index:2000;
        width:46px; height:46px; border-radius:999px;
        display:flex; align-items:center; justify-content:center;
        border:1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.04);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 18px 44px rgba(0,0,0,.34);
        cursor:pointer;
        color: inherit;
        transition: transform .18s ease, background .18s ease, border-color .18s ease;
      }
      .tu-menu-btn:hover{ transform: translateY(-1px) scale(1.02); background: rgba(255,255,255,.06); border-color: rgba(124,140,255,.35); }
      .tu-menu-btn:active{ transform: translateY(0) scale(.98); }

      .tu-menu-overlay{
        position:fixed; inset:0; z-index:3000;
        background: rgba(0,0,0,.22);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        opacity:0;
        pointer-events:none;
        transition: opacity .18s ease;
      }
      .tu-menu-overlay.open{ opacity:1; pointer-events:auto; }

      .tu-menu-panel{
        position:fixed;
        top: 78px;
        right: 18px;
        width: 340px;
        max-width: calc(100vw - 36px);
        border-radius: 26px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(18, 20, 32, .72);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 30px 80px rgba(0,0,0,.55);
        padding: 16px;
        transform-origin: 92% 0%;
        transform: translateY(-18px) scale(.90);
        opacity: 0;
      }

      /* Light theme (when page uses no [data-theme="dark"]) */
      html:not([data-theme="dark"]) .tu-menu-panel{
        background: rgba(255,255,255,.78);
        border-color: rgba(17, 24, 39, .12);
        box-shadow: 0 30px 80px rgba(0,0,0,.18);
      }
      html:not([data-theme="dark"]) .tu-menu-btn{
        border-color: rgba(17,24,39,.10);
        background: rgba(255,255,255,.62);
        box-shadow: 0 18px 44px rgba(0,0,0,.16);
      }
      html:not([data-theme="dark"]) .tu-tile,
      html:not([data-theme="dark"]) .tu-tab,
      html:not([data-theme="dark"]) .tu-menu-close{
        border-color: rgba(17,24,39,.10);
        background: rgba(17,24,39,.04);
      }
      /* Springy open/close (closer to the video) */
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
        border:1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.06);
        cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition: transform .16s ease, background .16s ease;
      }
      .tu-menu-close:hover{ background: rgba(255,255,255,.09); transform: scale(1.02); }
      .tu-menu-close:active{ transform: scale(.98); }

      .tu-tabs{ margin-top:12px; display:flex; gap:10px; }
      .tu-tab{
        flex:1;
        border-radius: 14px;
        padding: 10px 12px;
        border:1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.06);
        font-weight: 800;
        cursor:pointer;
        transition: background .18s ease, border-color .18s ease, transform .18s ease;
      }
      .tu-tab.active{ background: rgba(124,140,255,.28); border-color: rgba(124,140,255,.55); }

      .tu-menu-label{ margin-top:12px; font-size: 11px; letter-spacing: .14em; opacity:.55; padding-left: 2px; }

      .tu-grid{ margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .tu-tile{
        border-radius: 16px;
        padding: 14px 12px;
        border:1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.06);
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
      }
      .tu-menu-overlay.open .tu-tile{ animation: tuTileIn .30s cubic-bezier(.2,.95,.2,1) forwards; animation-delay: var(--d, 0ms); }
      @keyframes tuTileIn{ to { transform: translateY(0) scale(1); opacity: 1; } }

      .tu-tile:hover{ background: rgba(255,255,255,.09); }
      .tu-ico{ width:34px; height:34px; border-radius: 12px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); }
      .tu-tile span:last-child{ text-decoration: underline; text-underline-offset: 3px; }
      .tu-danger{ color: #ffb4b4; }

      @media (max-width: 520px){
        .tu-menu-panel{ right: 12px; width: 320px; }
        .tu-menu-btn{ right: 12px; }
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

    
    document.addEventListener('tu-auth-changed', (ev) => {
      const user = ev.detail && ev.detail.user;
      const title = overlay.querySelector('#tuMenuTitle');
      if (user && user.displayName) title.textContent = user.displayName;
      else title.textContent = 'Menu';
    });
  }

  function requireLogin(auth) {
    if (!auth.currentUser) {
      // Firebase may take a moment to restore the session (LOCAL persistence).
      // Delay redirect slightly to prevent infinite login/register loops.
      setTimeout(() => {
        if (!auth.currentUser) redirectToLogin();
      }, 450);
      return false;
    }
    // Fast path: if we already know the session is banned, don't allow access.
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

  
  // -----------------------------
  // ADMIN FAB (Offline admin panel access without keyboard shortcuts)
  // Shows only for admins, or the matching teacher for the current classroom.
  // Requires an element with id="admin-overlay" on the page.
  function getPageTeacherIdFromPath() {
    try {
      const parts = (window.location.pathname || "").split("/").filter(Boolean);
      const i = parts.indexOf("clubs");
      if (i >= 0 && parts.length >= i + 3) {
        const candidate = decodeURIComponent(parts[i + 2] || "").trim();
        if (!candidate) return "";
        const lower = candidate.toLowerCase();
        // Ignore list pages like teachers-sec-*.html
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

      // Back-compat: teacherIdonline can be validated against teachers/{teacherId}/classData/securityID
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
      "padding:12px 14px",
      "border-radius:999px",
      "border:1px solid rgba(255,255,255,0.18)",
      "background:rgba(99,102,241,0.92)",
      "color:#fff",
      "font-weight:700",
      "cursor:pointer",
      "box-shadow:0 12px 30px rgba(0,0,0,0.35)",
      "display:none"
    ].join(";");

    btn.addEventListener("click", () => {
      // Prefer page-provided openAdmin()
      if (typeof window.openAdmin === "function") {
        window.openAdmin();
        return;
      }
      // Fallback: just unhide the overlay
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

    // refresh on auth change and once after DOM settles
    document.addEventListener("tu-auth-changed", () => refresh());
    setTimeout(() => refresh(), 700);
  }

  // -----------------------------
  // MENTOR CHAT CTA (visible on mentor pages)
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
          border:1px solid rgba(124,140,255,0.35);
          background: rgba(124,140,255,0.92);
          color:#fff;
          font-weight:700;
          font-size:13px;
          text-decoration:none;
          box-shadow:0 12px 30px rgba(0,0,0,0.35);
          display:inline-flex;
          align-items:center;
          gap:8px;
        }
        .tu-mentor-chat-btn:hover{
          transform: translateY(-1px);
          box-shadow:0 14px 34px rgba(0,0,0,0.4);
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
    // If a floating theme toggle exists, offset the CTA so they don't overlap.
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      try {
        const cs = window.getComputedStyle(themeToggle);
        const bottom = parseFloat(cs.bottom || "0");
        const height = parseFloat(cs.height || themeToggle.offsetHeight || "0");
        if (!Number.isNaN(bottom) && !Number.isNaN(height)) {
          const offset = Math.max(24, bottom + height + 12);
          btn.style.bottom = `${offset}px`;
        } else {
          btn.style.bottom = "90px";
        }
      } catch (e) {
        btn.style.bottom = "90px";
      }
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
  }

  // -----------------------------
  // CHAT NOTIFICATION BADGE (bell)
  function findChatBellAnchors() {
    try {
      return document.querySelectorAll('a.navbar-icon[href*="/pages/private chat/private_chat.html"]');
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

  function updateChatBellBadges(count) {
    const badges = ensureChatBellBadges();
    if (!badges.length) return;
    const show = Number(count) > 0;
    const text = count > 99 ? "99+" : String(count || "");
    badges.forEach((badge) => {
      if (show) {
        badge.textContent = text;
        badge.classList.remove("hidden");
      } else {
        badge.textContent = "";
        badge.classList.add("hidden");
      }
    });
  }

  function isChatForUser(chatId, uid) {
    if (!chatId || !uid) return false;
    const parts = String(chatId).split("_");
    if (parts.length !== 2) return false;
    return parts[0] === uid || parts[1] === uid;
  }

  function watchUnreadMessages(db, uid, onUpdate) {
    if (!db || !uid) return () => {};
    const chatsRef = db.ref("chats");
    const chatListeners = {};
    const chatCounts = {};

    function updateTotal() {
      let total = 0;
      Object.keys(chatCounts).forEach((k) => {
        total += chatCounts[k] || 0;
      });
      onUpdate(total);
    }

    function attachChat(chatId) {
      const q = db.ref(`chats/${chatId}/messages`).orderByChild("read").equalTo(false);
      const cb = q.on("value", (snap) => {
        let count = 0;
        snap.forEach((child) => {
          const v = child.val() || {};
          if (v.senderId && v.senderId !== uid) count += 1;
        });
        chatCounts[chatId] = count;
        updateTotal();
      });
      chatListeners[chatId] = { ref: q, cb: cb };
    }

    function detachChat(chatId) {
      const h = chatListeners[chatId];
      if (!h) return;
      h.ref.off("value", h.cb);
      delete chatListeners[chatId];
      delete chatCounts[chatId];
    }

    function handleChats(snap) {
      const active = {};
      snap.forEach((child) => {
        const chatId = child.key;
        if (!isChatForUser(chatId, uid)) return;
        active[chatId] = true;
        if (!chatListeners[chatId]) attachChat(chatId);
      });
      Object.keys(chatListeners).forEach((id) => {
        if (!active[id]) detachChat(id);
      });
      updateTotal();
    }

    chatsRef.on("value", handleChats);

    return function stop() {
      chatsRef.off("value", handleChats);
      Object.keys(chatListeners).forEach((id) => detachChat(id));
      onUpdate(0);
    };
  }

  function setupChatBellUnread(db, auth) {
    const anchors = findChatBellAnchors();
    if (!anchors || !anchors.length) return;
    let stop = null;

    function refresh() {
      if (stop) {
        stop();
        stop = null;
      }
      if (!auth.currentUser) {
        updateChatBellBadges(0);
        return;
      }
      stop = watchUnreadMessages(db, auth.currentUser.uid, updateChatBellBadges);
    }

    document.addEventListener("tu-auth-changed", refresh);
    setTimeout(refresh, 600);
  }

window.TU = {
    init: function () {
      const { auth, db, stub } = initFirebaseOnce();
      
      if (!stub && typeof firebase !== 'undefined' && firebase.auth && firebase.auth.Auth) {
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      }
      
      window.TU.auth = auth;
      window.TU.db = db;

      // Auto-inject admin panel button on pages that have an admin overlay
      try { setupAdminFab(db, auth); } catch (e) {}
      try { setupMentorChatCta(); } catch (e) {}
      if (!stub) {
        try { setupChatBellUnread(db, auth); } catch (e) {}
      }

      let banUnsub = null;

      auth.onAuthStateChanged((user) => {
        window.TU.user = user || null;

        // stop previous ban listener
        if (banUnsub) { banUnsub(); banUnsub = null; }

        if (user) {
          ensureUserDoc(db, user).catch(() => {});

          // Realtime ban watch (redirect both ways)
          banUnsub = watchBan(db, user.uid, (meta) => {
            cacheBan(meta);

            if (meta && meta.active) {
              redirectToBanned();
              return;
            }

            // If user just got unbanned and is currently on banned page -> go home
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
    ensureUserDoc,
    getRole,
    requireLogin,
    requireRole,
    getRootPath,
    popReturnUrl,
    needsProfileCompletion,
    requireProfileCompletion,
    getUserDoc,
    // ban helpers
    getBanStatus,
    checkBanAndRedirect,
    isCachedBanned,
    watchBan,
    redirectToHome,
  };
})();
