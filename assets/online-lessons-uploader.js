// assets/online-lessons-uploader.js
// Global logic: load lessons from Firebase RTDB and allow ONLY admin or the page's teacher to add lessons.
// Works with the existing per-teacher online.html pages (compat Firebase via TU.*).
//
// Data source:
//   online/{clubId}/{teacherId}/modules/{moduleId}
//
// It populates window.courseData in the legacy format used by existing pages:
//   { qa, video:[], tasks:[], docs:[{title,link}], downloads:[{title,link}] }
// and calls window.renderCourses() if it exists.

(function () {
  'use strict';

  // ---------- small helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const safeText = (v) => (v == null ? '' : String(v));
  const trimLines = (txt) => safeText(txt).split('\n').map(s => s.trim()).filter(Boolean);

  function toYouTubeEmbed(url) {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (raw.includes('youtube.com/embed/')) return raw;
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        const id = u.pathname.split('/').filter(Boolean)[0];
        return id ? `https://www.youtube.com/embed/${id}` : raw;
      }
      if (host.endsWith('youtube.com') || host.endsWith('m.youtube.com')) {
        if (u.pathname === '/watch') {
          const id = u.searchParams.get('v');
          return id ? `https://www.youtube.com/embed/${id}` : raw;
        }
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'shorts' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
        if (parts[0] === 'live' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
        if (parts[0] === 'embed' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      }
    } catch (e) {}
    return raw;
  }

  function isValidHttpUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function inferClubTeacherFromPath() {
    // Expected: /clubs/{club}/{teacher}/online.html
    const parts = (location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('clubs');
    if (i >= 0 && parts[i + 1] && parts[i + 2]) {
      return { clubId: parts[i + 1], teacherId: parts[i + 2] };
    }
    // Fallback: keep legacy globals if present
    const clubId = (window.CLUB_ID || '').trim();
    const teacherId = (window.TEACHER_ID || '').trim();
    return { clubId: clubId || 'unknown', teacherId: teacherId || 'unknown' };
  }

  function ensureTU() {
    if (!window.TU || !TU.db || !TU.auth) {
      console.warn('[online-lessons-uploader] TU is not initialized. Make sure /assets/tu-firebase.js is loaded and TU.init() is called.');
      return false;
    }
    return true;
  }

  // ---------- permissions ----------
  async function getUserRole(uid) {
    // Prefer TU.getRole if available; else read users/{uid}/role
    try {
      if (window.TU && typeof TU.getRole === 'function') {
        const r = await TU.getRole(TU.db, uid);
        return (r || '').toString();
      }
    } catch (e) {}

    try {
      const snap = await TU.db.ref(`users/${uid}/role`).once('value');
      return (snap.val() || '').toString();
    } catch {
      return '';
    }
  }

  async function getUserTeacherId(uid) {
    // Back-compat: different keys exist across your DB history.
    // Prefer canonical teacherId (matches folder name), also support teacherIdonline (security ID).
    // Some exports even contain a typo key: " teacherIdonline" (leading space).
    try {
      const snap = await TU.db.ref(`users/${uid}`).once('value');
      const v = snap.val() || {};
      const teacherId = (v.teacherId || '').toString().trim();
      const teacherIdOnline = (v.teacherIdonline || v[' teacherIdonline'] || '').toString().trim();
      return `${teacherId}|||${teacherIdOnline}`;
    } catch (e) {
      return '|||';
    }
  }

  async function canUploadForPage(uid, pageTeacherId) {
    const role = (await getUserRole(uid)).toLowerCase();
    if (role === 'admin') return true;
    if (role !== 'teacher') return false;

    const packed = await getUserTeacherId(uid);
    const [userTeacherId, userTeacherIdOnline] = String(packed || '').split('|||');

    // teacher editing their own page by canonical teacherId
    if ((userTeacherId || '').trim() === pageTeacherId) return true;

    // legacy: teacherIdonline might directly equal folder teacherId
    if ((userTeacherIdOnline || '').trim() === pageTeacherId) return true;

    try {
      const secSnap = await TU.db.ref(`teachers/${pageTeacherId}/classData/securityID`).once('value');
      const securityId = (secSnap.val() || '').toString();
      if (securityId && (userTeacherIdOnline || '').trim() === securityId) return true;
    } catch (e) {}

    return false;
  }

  function moduleToLegacyCourse(mod) {
    const qa = safeText(mod.qa || mod.title || '').trim();
    const desc = safeText(mod.desc || mod.description || '').trim();
    const video = Array.isArray(mod.video) ? mod.video : (mod.video ? [mod.video] : []);
    const tasks = Array.isArray(mod.tasks) ? mod.tasks : (mod.tasks ? [mod.tasks] : []);
    const docs = Array.isArray(mod.docs) ? mod.docs : [];
    const downloads = Array.isArray(mod.downloads) ? mod.downloads : [];
    return {
      qa: qa || '(No title)',
      desc,
      video: video.map(toYouTubeEmbed).filter(Boolean),
      tasks: tasks.map(safeText).filter(Boolean),
      docs: docs.map(d => ({ title: safeText(d?.title || 'File'), link: safeText(d?.link || d?.url || '') })).filter(d => d.link),
      downloads: downloads.map(d => ({ title: safeText(d?.title || 'Download'), link: safeText(d?.link || d?.url || '') })).filter(d => d.link),
      _id: safeText(mod._id || mod.id || '')
    };
  }

  function legacyCourseToModule(payload) {
    return {
      qa: safeText(payload.qa).trim(),
      desc: safeText(payload.desc).trim(),
      video: (payload.video || []).map(toYouTubeEmbed).filter(Boolean),
      tasks: (payload.tasks || []).map(safeText).filter(Boolean),
      docs: (payload.docs || []).map(d => ({ title: safeText(d?.title || 'File'), link: safeText(d?.link || '') })).filter(d => d.link),
      downloads: (payload.downloads || []).map(d => ({ title: safeText(d?.title || 'Download'), link: safeText(d?.link || '') })).filter(d => d.link),
      createdAtMs: Date.now(),
      createdByUid: (TU.auth.currentUser && TU.auth.currentUser.uid) ? TU.auth.currentUser.uid : ''
    };
  }

  // ---------- UI (minimal, logic-focused) ----------
  function ensureAddCard(canUpload) {
    const container = $('#courses');
    if (!container) return;

    // Remove existing injected card if any
    const prev = container.querySelector('[data-tu-add-lesson="1"]');
    if (prev) prev.remove();

    if (!canUpload) return;

    const card = document.createElement('div');
    card.setAttribute('data-tu-add-lesson', '1');
    card.className = 'course-card';
    card.tabIndex = 0;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <h3 style="margin-bottom:8px;">+ Add lesson</h3>
      <p style="opacity:.8;">Admin/Teacher can upload a new lesson for this page.</p>
      <span class="start-btn">Add</span>
    `;
    card.addEventListener('click', () => openAddModal());
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAddModal();
      }
    });
    container.appendChild(card);
  }

  function buildModalOnce() {
    if (document.getElementById('tuAddLessonModal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tuAddLessonModal';
    overlay.style.cssText = [
      'position:fixed','inset:0','background:rgba(0,0,0,.55)','display:none','align-items:center','justify-content:center','z-index:9999','padding:18px'
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'width:min(760px, 100%)','background:#0b1220','border:1px solid rgba(255,255,255,.12)','border-radius:16px','padding:16px','color:#fff'
    ].join(';');

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <h3 style="margin:0;">Add lesson</h3>
        <button type="button" id="tuAddLessonClose" style="cursor:pointer;background:transparent;border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:10px;padding:6px 10px;">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div style="grid-column:1 / -1;">
          <label style="font-size:12px;opacity:.8;">Title</label>
          <input id="tuAddTitle" type="text" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;" placeholder="Example: 3. Present Simple" />
        </div>
        <div style="grid-column:1 / -1;">
          <label style="font-size:12px;opacity:.8;">Description (optional)</label>
          <textarea id="tuAddDesc" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;min-height:76px;" placeholder="Short note..."></textarea>
        </div>
        <div>
          <label style="font-size:12px;opacity:.8;">Video links (one per line)</label>
          <textarea id="tuAddVideos" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;min-height:110px;" placeholder="https://youtu.be/...\nhttps://youtube.com/watch?v=..."></textarea>
        </div>
        <div>
          <label style="font-size:12px;opacity:.8;">Tasks (one per line)</label>
          <textarea id="tuAddTasks" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;min-height:110px;" placeholder="1) ...\n2) ..."></textarea>
        </div>
        <div>
          <label style="font-size:12px;opacity:.8;">Docs links (title | url) one per line</label>
          <textarea id="tuAddDocs" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;min-height:110px;" placeholder="Grammar PDF | https://...\nSlides | /path/file.pdf"></textarea>
        </div>
        <div>
          <label style="font-size:12px;opacity:.8;">Downloads links (title | url) one per line</label>
          <textarea id="tuAddDownloads" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;min-height:110px;" placeholder="Resources | https://...\nZip | /path/file.zip"></textarea>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
        <button type="button" id="tuAddLessonCancel" class="start-btn" style="padding:10px 14px;">Cancel</button>
        <button type="button" id="tuAddLessonSave" class="start-btn" style="padding:10px 14px;">Save</button>
      </div>
      <div id="tuAddLessonStatus" style="margin-top:10px;font-size:12px;opacity:.85;"></div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const close = () => { overlay.style.display = 'none'; setStatus(''); };
    const setStatus = (msg) => { const el = document.getElementById('tuAddLessonStatus'); if (el) el.textContent = msg || ''; };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    $('#tuAddLessonClose')?.addEventListener('click', close);
    $('#tuAddLessonCancel')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') close();
    });

    $('#tuAddLessonSave')?.addEventListener('click', async () => {
      const title = safeText($('#tuAddTitle')?.value).trim();
      if (!title) { setStatus('Title is required.'); return; }

      const desc = safeText($('#tuAddDesc')?.value).trim();
      const video = trimLines($('#tuAddVideos')?.value).filter(isValidHttpUrl).map(toYouTubeEmbed);
      const tasks = trimLines($('#tuAddTasks')?.value);

      const parseTitleUrlLines = (txt) => {
        return trimLines(txt).map(line => {
          // accept "title | url" or plain url
          const parts = line.split('|').map(s => s.trim()).filter(Boolean);
          if (parts.length === 1) {
            const url = parts[0];
            return { title: 'File', link: url };
          }
          return { title: parts[0], link: parts.slice(1).join('|').trim() };
        }).filter(x => x.link);
      };

      const docs = parseTitleUrlLines($('#tuAddDocs')?.value);
      const downloads = parseTitleUrlLines($('#tuAddDownloads')?.value);

      try {
        setStatus('Saving...');
        const mod = legacyCourseToModule({ qa: title, desc, video, tasks, docs, downloads });
        const newRef = TU.db.ref(MODULES_PATH).push();
        await newRef.set(mod);
        setStatus('Saved ✅');
        close();
      } catch (e) {
        console.error(e);
        setStatus('Error: ' + (e?.message || e));
      }
    });
  }

  function openAddModal() {
    buildModalOnce();
    const overlay = document.getElementById('tuAddLessonModal');
    if (!overlay) return;
    overlay.style.display = 'flex';
  }

  // ---------- realtime loader ----------
  let CLUB_ID = 'unknown';
  let TEACHER_ID = 'unknown';
  let MODULES_PATH = '';
  let canUpload = false;
  let attached = false;

  function attachRealtimeModulesOnce() {
    if (attached) return;
    attached = true;

    TU.db.ref(MODULES_PATH).on('value', (snap) => {
      const v = snap.val() || {};
      const arr = Object.keys(v).map((id) => ({ _id: id, ...v[id] }));
      // oldest -> newest
      arr.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));

      // IMPORTANT: many pages define `const courseData = window.courseData = []`.
      // If we reassign `window.courseData = [...]`, the local `courseData` const
      // keeps pointing to the old empty array and UI never updates.
      // So we MUTATE the existing array in place when possible.
      const nextCourses = arr.map(moduleToLegacyCourse);
      if (Array.isArray(window.courseData)) {
        window.courseData.length = 0;
        window.courseData.push(...nextCourses);
      } else {
        window.courseData = nextCourses;
      }

      if (typeof window.renderCourses === 'function') {
        try { window.renderCourses(); } catch (e) { console.warn(e); }
      }

      // Add "Add lesson" card after render
      ensureAddCard(canUpload);
    });
  }

  async function boot() {
    if (!ensureTU()) return;

    const inf = inferClubTeacherFromPath();
    CLUB_ID = inf.clubId;
    TEACHER_ID = inf.teacherId;

    // Canonical club id sometimes lives under teachers/{teacherId}/classData/club.
    // If it exists, prefer it to avoid folder/DB drift (e.g., python vs py).
    try {
      const clubSnap = await TU.db.ref(`teachers/${TEACHER_ID}/classData/club`).once('value');
      const canonicalClub = (clubSnap.val() || '').toString().trim();
      if (canonicalClub) CLUB_ID = canonicalClub;
    } catch (e) {}

    MODULES_PATH = `online/${CLUB_ID}/${TEACHER_ID}/modules`;

    // wait auth
    TU.auth.onAuthStateChanged(async (user) => {
      if (!user) {
        canUpload = false;
        attachRealtimeModulesOnce();
        return;
      }
      canUpload = await canUploadForPage(user.uid, TEACHER_ID);
      attachRealtimeModulesOnce();
      // Update Add card visibility immediately
      ensureAddCard(canUpload);
    });
  }

  // Start after DOM is ready (so legacy functions exist)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

// ======================================================
// GLOBAL LINK FIX (docs/downloads) for legacy online.html
// Fixes cases where href becomes "/https://..." which 404s.
// Applies across ALL pages that load this shared script.
// ======================================================
(function fixOnlineLinksGlobally() {
  const normalizeHref = (u) => {
    u = String(u ?? '').trim();
    if (!u) return '';
    // If the page defines safeAssetUrl(), prefer it.
    if (typeof window.safeAssetUrl === 'function') return window.safeAssetUrl(u);

    // Keep full URLs
    if (/^https?:\/\//i.test(u)) return u;

    // Keep absolute paths
    if (u.startsWith('/')) return u;

    // Make relative paths absolute
    return '/' + u;
  };

  const fixContainers = () => {
    ['doc-container', 'download-container'].forEach((id) => {
      const root = document.getElementById(id);
      if (!root) return;

      root.querySelectorAll('a[href]').forEach((a) => {
        const href = (a.getAttribute('href') || '').trim();
        if (!href) return;

        // Critical bug: "/https://..." -> "https://..."
        if (href.startsWith('/http://') || href.startsWith('/https://')) {
          a.setAttribute('href', href.slice(1));
        } else {
          a.setAttribute('href', normalizeHref(href));
        }

        // Ensure safe new-tab behavior
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      });
    });

    // Re-render icons if lucide is present
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  // Best path: wrap selectCourse so links are fixed right after render.
  if (typeof window.selectCourse === 'function') {
    const original = window.selectCourse;
    window.selectCourse = function patchedSelectCourse(index) {
      original(index);
      fixContainers();
    };
  } else {
    // Fallback: watch for DOM changes and re-fix when content updates.
    const obs = new MutationObserver(() => fixContainers());
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        obs.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixContainers);
  } else {
    fixContainers();
  }
})();



// ---- CLICK INTERCEPTOR (guaranteed fix even if DOM updates after render) ----
(function interceptBrokenHttpLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    const hrefAttr = a.getAttribute('href') || '';
    if (hrefAttr.startsWith('/http://') || hrefAttr.startsWith('/https://')) {
      e.preventDefault();
      const fixed = hrefAttr.slice(1); // remove leading "/"
      // preserve target behavior
      const target = a.getAttribute('target');
      if (target === '_blank') {
        window.open(fixed, '_blank', 'noopener');
      } else {
        window.location.href = fixed;
      }
      return;
    }
  }, true); // capture: run before default navigation
})();
