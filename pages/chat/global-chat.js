(function () {
  'use strict';

  const MESSAGES_PATH     = 'global_chat/messages';
  const TYPING_PATH       = 'global_chat/typing';
  const MSG_LIMIT         = 50;
  const TYPING_TIMEOUT_MS = 3000;
  const CACHE_KEY         = 'tu_global_chat_v1';

  let currentUser      = null;
  let myProfile        = null;
  let booted           = false;
  let typingTimer      = null;
  let isTyping         = false;
  let isListening      = false;

  let liveRef     = null;
  let typingRef   = null;

  const $  = (id) => document.getElementById(id);
  const db = ()   => firebase.database();

  function tl(key, fallback) {
    if (window.TU_i18n && typeof window.TU_i18n.t === 'function') {
      const v = window.TU_i18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback || key;
  }

  function detachListeners() {
    if (liveRef)   { liveRef.off();   liveRef   = null; }
    if (typingRef) { typingRef.off(); typingRef = null; }
    isListening = false;
  }

  function avatarColor(str) {
    const palette = [
      '#ef4444','#f97316','#f59e0b','#84cc16','#10b981',
      '#06b6d4','#3b82f6','#6366f1','#8b5cf6','#d946ef','#f43f5e'
    ];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h % palette.length)];
  }

  function initials(name, email) {
    const base  = (name || '').trim() || (email || 'S').split('@')[0];
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  }

  function fmtTime(ms) {
    try {
      const d = new Date(ms);
      return isNaN(d) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  function setStatus(online, text) {
    const dot = $('statusDot'), t = $('statusText');
    if (dot) dot.classList.toggle('online', !!online);
    if (t)   t.textContent = text || '';
  }

  function scrollIfNear(el) {
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) el.scrollTop = el.scrollHeight;
  }

  function normalise(v) {
    return {
      text:        String(v?.text  || ''),
      uid:         String(v?.uid   || ''),
      name:        String(v?.name  || 'Student'),
      email:       String(v?.email || ''),
      role:        String(v?.role  || 'user'),
      createdAtMs: typeof v?.createdAtMs === 'number' ? v.createdAtMs : Date.now()
    };
  }

  function loadCache() {
    try {
      const d = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (Array.isArray(d?.items)) return d.items.slice(-MSG_LIMIT);
    } catch {}
    return [];
  }

  function saveCache(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ v: 1, items: items.slice(-MSG_LIMIT) })); }
    catch {}
  }

  function cacheUpsert(key, msg) {
    const c = loadCache(), i = c.findIndex(x => x.key === key);
    if (i >= 0) c[i] = { key, msg }; else c.push({ key, msg });
    if (c.length > MSG_LIMIT) c.splice(0, c.length - MSG_LIMIT);
    saveCache(c);
  }

  function renderMsg(msg, key) {
    const isMe = !!(currentUser && currentUser.uid === msg.uid);

    const wrap = document.createElement('div');
    wrap.className      = `msg ${isMe ? 'is-me' : 'is-other'}`;
    wrap.dataset.msgKey = key;
    if (msg.uid) wrap.dataset.msgUid = msg.uid;

    const av = document.createElement('div');
    av.className        = 'avatar';
    av.textContent      = initials(msg.name, msg.email);
    av.style.background = avatarColor(msg.uid || 'x');
    av.style.boxShadow  = `0 2px 8px ${avatarColor(msg.uid || 'x')}44`;

    const main = document.createElement('div');
    main.className = 'msg-main';

    const head = document.createElement('div');
    head.className = 'msg-head';
    const left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;';

    const nameEl = document.createElement('div');
    nameEl.className   = 'msg-name';
    nameEl.textContent = msg.name || tl('role_student', 'Student');

    const roleEl = document.createElement('span');
    let roleCls = '', roleLabel = '';
    if (msg.role === 'admin')        { roleCls = 'admin';   roleLabel = tl('role_admin',   'Admin');   }
    else if (msg.role === 'teacher') { roleCls = 'teacher'; roleLabel = tl('role_teacher', 'Teacher'); }
    else                             { roleCls = '';        roleLabel = tl('role_student', 'Student'); }
    roleEl.className   = ('msg-role-pill ' + roleCls).trim();
    roleEl.textContent = roleLabel;

    left.appendChild(nameEl);
    left.appendChild(roleEl);

    const timeEl = document.createElement('div');
    timeEl.className   = 'msg-time';
    timeEl.textContent = fmtTime(msg.createdAtMs);

    head.appendChild(left);
    head.appendChild(timeEl);

    const bubble = document.createElement('div');
    bubble.className   = 'bubble';
    bubble.textContent = msg.text;

    main.appendChild(head);
    main.appendChild(bubble);

    wrap.appendChild(av);
    wrap.appendChild(main);
    return wrap;
  }

  async function setTypingState(active) {
    if (!currentUser) return;
    const r = db().ref(`${TYPING_PATH}/${currentUser.uid}`);
    if (active) {
      await r.set({ name: myProfile?.displayName || currentUser.displayName || 'Someone', timestamp: Date.now() });
      isTyping = true;
    } else {
      await r.remove().catch(() => {});
      isTyping = false;
    }
  }

  function updateTypingUI(data) {
    const el   = $('typingIndicator');
    const text = el?.querySelector('.typing-text');
    if (!el) return;
    const now    = Date.now();
    const active = Object.entries(data)
      .filter(([uid, d]) => uid !== currentUser?.uid && d?.timestamp && (now - d.timestamp) < 5000)
      .map(([, d]) => d.name);
    if (active.length > 0) {
      el.classList.add('active');
      if (text) {
        if (active.length === 1)      text.textContent = active[0] + tl('chat_typing_one', ' is typing…');
        else if (active.length === 2) text.textContent = active[0] + tl('chat_typing_two', ' and {other} are typing…').replace('{other}', active[1]);
        else                          text.textContent = active[0] + tl('chat_typing_many', ' and {n} others are typing…').replace('{n}', active.length - 1);
      }
    } else {
      el.classList.remove('active');
    }
  }

  async function sendMessage(text) {
    if (!currentUser) throw new Error('Not logged in.');
    const t = text.trim();
    if (!t) return;
    const name  = (myProfile?.displayName || currentUser.displayName || '').trim() || tl('role_student', 'Student');
    const email = currentUser.email || '';
    const role  = myProfile?.role || 'user';
    await db().ref(MESSAGES_PATH).push({
      text: t, uid: currentUser.uid, name, email, role,
      group_name: myProfile?.groupInUniversity || 'N/A',
      createdAtMs: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  async function startListening() {
    if (isListening) return;
    isListening = true;

    const list = $('chatList');
    if (!list) return;

    const cached = loadCache();
    if (cached.length) {
      list.innerHTML = '';
      const frag = document.createDocumentFragment();
      cached.forEach(it => frag.appendChild(renderMsg(it.msg, it.key)));
      list.appendChild(frag);
      list.scrollTop = list.scrollHeight;
      setStatus(false, tl('chat_syncing', 'Syncing…'));
    } else {
      setStatus(false, tl('chat_loading', 'Loading…'));
    }

    const msgsRef = db().ref(MESSAGES_PATH).orderByChild('createdAtMs').limitToLast(MSG_LIMIT);

    try {
      const snap  = await msgsRef.once('value');
      list.innerHTML = '';

      const frag  = document.createDocumentFragment();
      const items = [];
      let lastMs  = null;
      let lastKey = null;

      snap.forEach(child => {
        lastKey = child.key;
        const msg = normalise(child.val());
        frag.appendChild(renderMsg(msg, child.key));
        items.push({ key: child.key, msg });
        if (typeof msg.createdAtMs === 'number') lastMs = msg.createdAtMs;
      });

      list.appendChild(frag);
      list.scrollTop = list.scrollHeight;
      saveCache(items);

      const emptyEl = $('emptyState');
      if (items.length > 0) { if (emptyEl) emptyEl.remove(); }
      else if (emptyEl) emptyEl.querySelector('p').textContent = tl('chat_no_messages', 'No messages yet. Be the first to say hi!');

      setStatus(true, tl('chat_live', 'Live'));

      const capturedLastKey = lastKey;
      liveRef = lastMs !== null
        ? db().ref(MESSAGES_PATH).orderByChild('createdAtMs').startAfter(lastMs)
        : db().ref(MESSAGES_PATH).orderByChild('createdAtMs');

      liveRef.on('child_added', child => {
        if (child.key === capturedLastKey) return;
        const msg = normalise(child.val());
        if (!document.querySelector(`[data-msg-key="${child.key}"]`)) {
          list.appendChild(renderMsg(msg, child.key));
          scrollIfNear(list);
          const emptyEl2 = $('emptyState');
          if (emptyEl2) emptyEl2.remove();
        }
        cacheUpsert(child.key, msg);
      });

      liveRef.on('child_removed', child => {
        const wrap = document.querySelector(`[data-msg-key="${child.key}"]`);
        if (wrap) {
          wrap.style.animation = 'msgOut 0.2s ease forwards';
          setTimeout(() => wrap.remove(), 220);
        }
        const c = loadCache().filter(x => x.key !== child.key);
        saveCache(c);
      });

      typingRef = db().ref(TYPING_PATH);
      typingRef.on('value', snap => {
        updateTypingUI(snap.val() || {});
      });

    } catch (err) {
      console.error('Chat error:', err);
      setStatus(false, tl('chat_error_status', 'Error – check console'));
      isListening = false;
    }
  }

  function bindUI() {
    const form  = $('chatForm');
    const input = $('chatInput');
    const btn   = $('sendBtn');
    if (!form || !input || !btn) return;

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
      if (!currentUser) return;
      if (typingTimer) clearTimeout(typingTimer);
      if (!isTyping && input.value.trim()) setTypingState(true).catch(() => {});
      typingTimer = setTimeout(() => setTypingState(false).catch(() => {}), TYPING_TIMEOUT_MS);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!currentUser) return;
      btn.disabled = true;
      clearTimeout(typingTimer);
      await setTypingState(false).catch(() => {});
      try {
        await sendMessage(input.value);
        input.value = ''; input.style.height = 'auto'; input.focus();
      } catch (err) {
        alert(tl('chat_send_error', 'Could not send message.') + '\n' + (err?.message || err));
      } finally { btn.disabled = false; }
    });
  }

  function initTheme() {
    const themeBtn  = $('theme-toggle');
    const themeIcon = $('theme-icon');
    const html      = document.documentElement;
    const MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    const SUN  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    if (localStorage.getItem('theme') === 'light') { html.removeAttribute('data-theme'); if (themeIcon) themeIcon.innerHTML = MOON; }
    else { html.setAttribute('data-theme', 'dark'); if (themeIcon) themeIcon.innerHTML = SUN; }
    themeBtn?.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) { html.removeAttribute('data-theme'); if (themeIcon) themeIcon.innerHTML = MOON; localStorage.setItem('theme', 'light'); }
      else        { html.setAttribute('data-theme', 'dark'); if (themeIcon) themeIcon.innerHTML = SUN; localStorage.setItem('theme', 'dark'); }
    });
  }

  function initNavbar() {
    const nav   = $('main-navbar');
    const ham   = $('navbar-hamburger');
    const links = $('navbar-links');
    if (!links) return;
    const isMob = () => matchMedia('(max-width: 700px)').matches;
    function setOpen(o) {
      links.classList.toggle('open', o);
      ham?.classList.toggle('open', o);
      ham?.setAttribute('aria-expanded', String(o));
      document.body.classList.toggle('nav-open', o && isMob());
    }
    const scrollTarget = $('page-scroll') || window;
    scrollTarget.addEventListener('scroll', () =>
      nav?.classList.toggle('navbar--scrolled', (scrollTarget.scrollTop || window.scrollY) > 40), { passive: true });
    ham?.addEventListener('click', e => { e.stopPropagation(); setOpen(!links.classList.contains('open')); });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', e => { if (!isMob() || !links.classList.contains('open') || nav?.contains(e.target)) return; setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (!isMob()) setOpen(false); });
  }

  function initAvatar() {
    const avatarEl    = $('navbar-avatar');
    const DEFAULT_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    if (avatarEl) avatarEl.innerHTML = DEFAULT_SVG;
    document.addEventListener('tu-auth-changed', async ev => {
      const u = ev?.detail?.user;
      if (!u) { if (avatarEl) avatarEl.innerHTML = DEFAULT_SVG; return; }
      try {
        const snap = await db().ref(`users/${u.uid}`).once('value');
        const doc  = snap.val() || {};
        const url  = doc.avatarURL || doc.photoURL || u.photoURL || '';
        const name = (u.displayName || doc.displayName || u.email || '').trim();
        const init = (name ? name[0] : '').toUpperCase();
        if (avatarEl) {
          avatarEl.innerHTML = url
            ? `<img src="${url.startsWith('http') ? url : '/' + url.replace(/^\/+/, '')}" alt="Avatar" referrerpolicy="no-referrer">`
            : (init || '');
        }
      } catch { if (avatarEl) avatarEl.innerHTML = DEFAULT_SVG; }
    });
  }

  function initParticles() {
    const canvas = $('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const particles = [];
    function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
    resize();
    addEventListener('resize', resize);
    for (let i = 0; i < 55; i++) {
      particles.push({ x: Math.random()*1000, y: Math.random()*1000, r: 0.8+Math.random()*2, dx: (Math.random()-0.5)*0.18, dy: -0.05-Math.random()*0.2, op: 0.15+Math.random()*0.55, od: Math.random()>0.5?1:-1 });
    }
    function draw() {
      ctx.clearRect(0,0,W,H);
      const c = document.documentElement.getAttribute('data-theme')==='dark'?'165,180,252':'124,140,255';
      particles.forEach(p=>{
        p.x+=p.dx; p.y+=p.dy; p.op+=p.od*0.003;
        if(p.op>0.65||p.op<0.1) p.od*=-1;
        if(p.y<-10){p.y=H+10;p.x=Math.random()*W;} if(p.x<0||p.x>W) p.dx*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${c},${p.op})`; ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  function boot() {
    if (booted) return;
    booted = true;

    initTheme();
    initNavbar();
    initAvatar();
    initParticles();
    bindUI();
    setStatus(false, tl('chat_connecting', 'Connecting…'));

    const fy = $('footer-year');
    if (fy) fy.textContent = new Date().getFullYear();

    if (window.TU_i18n) { window.TU_i18n.injectSwitcher(); window.TU_i18n.applyTranslations(); }
    if (typeof TU !== 'undefined' && TU.init) TU.init();

    firebase.auth().onAuthStateChanged(async user => {
      const prevUser = currentUser;
      currentUser = user;

      if (user && !prevUser && isListening) {
        detachListeners();
        isListening = false;
        const list = $('chatList');
        if (list) list.innerHTML = '';
      }

      const footer = $('chatFooter');
      const banner = $('authBanner');
      const badge  = $('userBadge');

      if (!user) {
        setStatus(false, tl('chat_signin_to_chat', 'Sign in to chat'));
        if (footer) footer.style.display = 'none';
        if (banner) banner.style.display = 'flex';
        if (badge)  badge.style.display  = 'none';
        document.querySelector('.chat-shell')?.classList.remove('chat-shell--authed');
        document.querySelector('.chat-shell')?.removeAttribute('data-me-uid');
        await startListening().catch(err => console.error('startListening (guest):', err));
        return;
      }

      if (footer) footer.style.display = '';
      if (banner) banner.style.display = 'none';

      try {
        const snap = await db().ref(`users/${user.uid}`).once('value');
        myProfile  = snap.val() || {};
      } catch { myProfile = {}; }

      const shell = document.querySelector('.chat-shell');
      if (shell) {
        shell.classList.add('chat-shell--authed');
        shell.dataset.meUid = user.uid;
        if (myProfile?.role === 'admin') shell.dataset.meRole = 'admin';
        else shell.removeAttribute('data-me-role');
      }

      if (badge) {
        const n = myProfile?.displayName || user.displayName || tl('role_student', 'Student');
        const r = myProfile?.role ? ` · ${myProfile.role}` : '';
        badge.textContent = n + r; badge.style.display = '';
      }

      await startListening().catch(err => console.error('startListening (user):', err));
    });

    window.addEventListener('beforeunload', () => {
      setTypingState(false).catch(() => {});
      detachListeners();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

}());