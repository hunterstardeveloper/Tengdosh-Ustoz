(function () {
  'use strict';

  let threeRuntimePromise = null;
  let emptySceneRuntimePromise = null;

  function fixSymbols(input) {
    if (input == null) return '';
    let s = String(input);
    s = s.replace(/([A-Za-zÀ-ž])\?([A-Za-zÀ-ž])/g, "$1'$2");
    s = s.replace(/\u00C2\u00A0/g, ' ').replace(/\u00C2/g, '').replace(/\u00A0/g, ' ');
    return s;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureThreeRuntime() {
    if (window.THREE) return window.THREE;
    if (!threeRuntimePromise) {
      threeRuntimePromise = loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js').then(() => window.THREE);
    }
    return threeRuntimePromise;
  }

  async function ensureEmptySceneRuntime() {
    if (window.TUOnlineEmptyScene) return window.TUOnlineEmptyScene;
    if (!emptySceneRuntimePromise) {
      emptySceneRuntimePromise = loadScriptOnce('/assets/online-empty-scene.js?v=1').then(() => window.TUOnlineEmptyScene);
    }
    return emptySceneRuntimePromise;
  }

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

      if (host.endsWith('youtube.com')) {
        if (u.pathname === '/watch') {
          const id = u.searchParams.get('v');
          return id ? `https://www.youtube.com/embed/${id}` : raw;
        }
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'shorts' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
        if (parts[0] === 'live' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      }
    } catch (_) {}

    return raw;
  }

  function getYouTubeIdFromEmbed(embedUrl) {
    try {
      const u = new URL(embedUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('embed');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      if (parts[0]) return parts[0];
    } catch (_) {}
    return '';
  }

  function createLazyYouTubeIframe(embedUrl, title) {
    const url = toYouTubeEmbed(embedUrl);
    const id = getYouTubeIdFromEmbed(url);
    const thumb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', title || 'YouTube video player');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

    if (thumb && id) {
      const playSvg = `<svg viewBox='0 0 68 48' width='68' height='48' xmlns='http://www.w3.org/2000/svg'>
        <path d='M66.52 7.02a8 8 0 0 0-5.64-5.66C56.1 0 34 0 34 0S11.9 0 7.12 1.36A8 8 0 0 0 1.48 7.02C0 11.82 0 24 0 24s0 12.18 1.48 16.98a8 8 0 0 0 5.64 5.66C11.9 48 34 48 34 48s22.1 0 26.88-1.36a8 8 0 0 0 5.64-5.66C68 36.18 68 24 68 24s0-12.18-1.48-16.98z' fill='rgba(0,0,0,.68)'/>
        <path d='M45 24 27 14v20' fill='#fff'/>
      </svg>`;

      iframe.srcdoc = `
        <style>
          *{padding:0;margin:0;overflow:hidden}
          html,body{height:100%}
          a{display:flex;align-items:center;justify-content:center;height:100%;width:100%;position:relative;background:#000}
          img{width:100%;height:100%;object-fit:cover;filter:saturate(1.05) contrast(1.05)}
          .shadow{position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,.42), rgba(0,0,0,.06) 55%, rgba(0,0,0,.25))}
          .btn{position:absolute;display:flex;align-items:center;justify-content:center}
        </style>
        <a href='https://www.youtube.com/embed/${id}?autoplay=1'>
          <img src='${thumb}' alt='Video preview' loading='lazy' decoding='async'>
          <div class='shadow'></div>
          <div class='btn'>${playSvg}</div>
        </a>`;
    } else {
      iframe.src = url;
    }

    return iframe;
  }

  function ensureArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    return [v];
  }

  function injectRevealStyles() {
    if (document.getElementById('tu-online-enhancements-style')) return;
    const style = document.createElement('style');
    style.id = 'tu-online-enhancements-style';
    style.textContent = `
      .tu-reveal{opacity:0;transform:translateY(14px) scale(.985);filter:blur(3px);transition:opacity .6s ease, transform .6s cubic-bezier(.18,.9,.2,1), filter .6s ease;}
      .tu-reveal.tu-in{opacity:1;transform:translateY(0) scale(1);filter:blur(0);}
      .tu-empty-state{grid-column:1 / -1;display:grid;place-items:center;gap:18px;padding:40px 16px 20px;text-align:center;}
      .tu-empty-copy{max-width:420px;}
      .tu-empty-copy h3{margin:0 0 8px;font-family:var(--tu-font-serif);font-size:clamp(1.35rem,2.6vw,1.9rem);color:var(--tu-text);}
      .tu-empty-copy p{margin:0;color:var(--tu-text-soft);line-height:1.7;}
      .tu-empty-scene-shell{width:min(100%, 340px);aspect-ratio:1 / 1;border-radius:28px;border:1px solid var(--tu-line);background:radial-gradient(circle at 50% 38%, rgba(201,162,39,.16), transparent 35%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.1)), var(--tu-bg-panel);box-shadow:var(--tu-shadow);padding:14px;}
      .tu-empty-scene{position:relative;width:100%;height:100%;border-radius:22px;border:1px solid rgba(201,162,39,.1);background:radial-gradient(circle at 50% 50%, rgba(201,162,39,.08), transparent 52%), rgba(6,6,6,.14);overflow:hidden;}\n      .tu-empty-scene canvas{width:100% !important;height:100% !important;display:block;}
      .tu-empty-scene.is-ready::after{opacity:0;}
      .tu-empty-scene::after{content:'Preparing your study space';position:absolute;inset:auto 16px 14px 16px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--tu-accent);opacity:.72;transition:opacity .25s ease;}
      .tu-avatar-caption{margin-bottom:12px;}
      #moreAvatars{display:none;}
      #moreAvatars.open{display:contents;}
      .avatar-item{background:linear-gradient(135deg, rgba(255,255,255,.06), rgba(0,0,0,.08));}
      .avatar-item[data-generated='true']{border-color:rgba(201,162,39,.08);box-shadow:0 10px 20px rgba(0,0,0,.14);}
      .avatar-item[data-generated='true']:hover{transform:translateY(-2px) scale(1.03);border-color:rgba(201,162,39,.4);}
      @media (prefers-reduced-motion: reduce){
        .tu-reveal{opacity:1;transform:none;filter:none;transition:none;}
      }
    `;
    document.head.appendChild(style);
  }

  function setupRevealObserver() {
    injectRevealStyles();
    const items = document.querySelectorAll('.course-card, .hero, .video-section, .content-card');
    items.forEach(el => el.classList.add('tu-reveal'));

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('tu-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('tu-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '80px 0px' });

    items.forEach(el => io.observe(el));
  }

  function setDefaultLazyLoading() {
    document.querySelectorAll('img').forEach(img => {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
    document.querySelectorAll('iframe').forEach(fr => {
      if (!fr.getAttribute('loading')) fr.setAttribute('loading', 'lazy');
      if (!fr.getAttribute('referrerpolicy')) fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    });
  }

  function renderEmptyState(courseContainer, ready) {
    if (!courseContainer) return;
    const t = (key, fallback) => {
      try {
        if (window.TU_i18n && typeof window.TU_i18n.t === 'function') {
          return window.TU_i18n.t(key) || fallback;
        }
      } catch (_) {}
      return fallback;
    };

    const title = ready
      ? t('classes_empty', 'No classes')
      : t('classes_loading', 'Darslar yuklanmoqda...');

    const body = ready
      ? t('classes_empty_desc', 'Lessons will appear here once the teacher publishes a module.')
      : t('classes_loading_desc', 'The classroom is syncing your modules and study resources.');

    courseContainer.innerHTML = `
      <div class="tu-empty-state">
        <div class="tu-empty-scene-shell">
          <div class="tu-empty-scene" data-empty-scene="clock" aria-hidden="true"></div>
        </div>
        <div class="tu-empty-copy">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(body)}</p>
        </div>
      </div>`;
  }

  async function initEmptyStateScene(courseContainer, ready) {
    if (!courseContainer || !ready) return;
    const mount = courseContainer.querySelector('[data-empty-scene="clock"]');
    if (!mount || mount.dataset.sceneBooted === 'true') return;

    try {
      await ensureThreeRuntime();
      const api = await ensureEmptySceneRuntime();
      api && typeof api.init === 'function' && api.init(mount);
    } catch (_) {
      mount.dataset.sceneBooted = 'failed';
    }
  }

  function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function makeGeneratedAvatar(seed) {
    const rand = seededRandom(seed + 17);
    const hue = Math.floor(rand() * 360);
    const hue2 = (hue + 45 + Math.floor(rand() * 90)) % 360;
    const orbit1 = (hue + 160) % 360;
    const orbit2 = (hue + 225) % 360;
    const accent = (hue + 290) % 360;
    const ringScale = (0.62 + rand() * 0.26).toFixed(2);
    const dotX = (24 + rand() * 48).toFixed(1);
    const dotY = (20 + rand() * 46).toFixed(1);
    const dotR = (4.2 + rand() * 4.2).toFixed(1);
    const orbitRot = Math.floor(rand() * 180);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
        <defs>
          <linearGradient id="bg-${seed}" x1="16" y1="12" x2="82" y2="84" gradientUnits="userSpaceOnUse">
            <stop stop-color="hsl(${hue} 74% 64%)"/>
            <stop offset="1" stop-color="hsl(${hue2} 76% 40%)"/>
          </linearGradient>
          <radialGradient id="glow-${seed}" cx="0" cy="0" r="1" gradientTransform="translate(48 42) rotate(90) scale(38)">
            <stop stop-color="rgba(255,255,255,.88)"/>
            <stop offset="1" stop-color="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <rect width="96" height="96" rx="48" fill="url(#bg-${seed})"/>
        <circle cx="48" cy="48" r="46" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
        <circle cx="48" cy="48" r="18" fill="rgba(10,10,10,.16)"/>
        <circle cx="48" cy="48" r="11.4" fill="url(#glow-${seed})" opacity=".85"/>
        <g transform="rotate(${orbitRot} 48 48)">
          <ellipse cx="48" cy="48" rx="31" ry="14" stroke="hsla(${orbit1} 95% 85% / .92)" stroke-width="3.5"/>
          <ellipse cx="48" cy="48" rx="14" ry="31" stroke="hsla(${orbit2} 90% 84% / .5)" stroke-width="2.5"/>
        </g>
        <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="hsla(${accent} 96% 88% / .94)"/>
        <circle cx="72" cy="28" r="3" fill="rgba(255,255,255,.74)"/>
        <circle cx="24" cy="70" r="2.4" fill="rgba(255,255,255,.55)"/>
        <path d="M48 24 L52 34 L62 38 L52 42 L48 52 L44 42 L34 38 L44 34 Z" fill="rgba(255,255,255,.18)" transform="scale(${ringScale}) translate(${(1-ringScale)*48} ${(1-ringScale)*48})"/>
      </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function renderGeneratedAvatarPicker() {
    const picker = document.getElementById('avatarPicker');
    if (!picker) return;
    if (picker.dataset.generated === 'true') return;

    const avatars = Array.from({ length: 24 }, (_, index) => makeGeneratedAvatar(index + 1));
    const current = typeof window.selectedUserAvatar === 'string' && window.selectedUserAvatar.trim()
      ? window.selectedUserAvatar.trim()
      : '';
    const selectedSrc = avatars.includes(current) ? current : avatars[0];

    const createItem = (src, selected, extra) => {
      return `<img decoding="async" loading="lazy" src="${src}" class="avatar-item${selected ? ' selected' : ''}${extra ? ' extra-avatar' : ''}" data-generated="true" onclick="pickAvatar(this)">`;
    };

    const visible = avatars.slice(0, 12).map(src => createItem(src, src === selectedSrc, false)).join('');
    const extras = avatars.slice(12).map(src => createItem(src, src === selectedSrc, true)).join('');

    picker.innerHTML = `${visible}<div id="moreAvatars">${extras}</div>`;
    picker.dataset.generated = 'true';

    if (!current && typeof window.selectedUserAvatar !== 'undefined') {
      window.selectedUserAvatar = selectedSrc;
    }
  }

  function enhancedRenderCourses() {
    const courseContainer = document.getElementById('courses');
    if (!courseContainer) return;
    const cd = window.courseData;
    if (!cd || !Array.isArray(cd) || cd.length === 0) {
      const ready = !!window.__TU_COURSES_READY;
      renderEmptyState(courseContainer, ready);
      initEmptyStateScene(courseContainer, ready);
      return;
    }

    courseContainer.innerHTML = cd.map((course, index) => {
      const title = fixSymbols(course?.qa || `Dars ${index + 1}`);
      const desc = fixSymbols(course?.desc || `${title} mavzusi bo'yicha darslar va topshiriqlar.`);
      return `
        <div class="course-card" onclick="selectCourse(${index})" tabindex="0" role="button" aria-label="${escapeHtml(title)}">
          <h3>${index + 1}. ${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
          <span class="start-btn">Boshlash</span>
        </div>
      `;
    }).join('');
  }

  function enhancedSelectCourse(index) {
    const cd = window.courseData;
    const data = (cd && cd[index]) ? cd[index] : null;
    if (!data) return;

    const videoSection = document.getElementById('videoSection');
    const videoScrollable = document.getElementById('videoScrollable');
    const noVideoMsg = document.getElementById('noVideoMsg');

    if (videoSection) videoSection.classList.add('open');
    if (videoScrollable) videoScrollable.innerHTML = '';

    try {
      const key = fixSymbols(data.qa || '').replace(/[.#$/[\]]/g, '_');
      try { currentCourseKey = key; } catch (_) {}
      window.currentCourseKey = key;
    } catch (_) {}

    const videos = ensureArray(data.video).map(toYouTubeEmbed).filter(Boolean);
    if (videos.length > 0 && videoScrollable) {
      if (noVideoMsg) noVideoMsg.style.display = 'none';
      videos.forEach((v, i) => {
        const container = document.createElement('div');
        container.className = 'video-container';
        container.style.marginBottom = '20px';
        container.appendChild(createLazyYouTubeIframe(v, `${fixSymbols(data.qa || 'Video')} (${i + 1})`));
        videoScrollable.appendChild(container);
      });
    } else {
      if (noVideoMsg) noVideoMsg.style.display = 'block';
    }

    const qa = fixSymbols(data.qa || '');
    const tasks = ensureArray(data.tasks).map(fixSymbols);
    const docs = ensureArray(data.docs);
    const downloads = ensureArray(data.downloads);

    const qaEl = document.getElementById('qa-container');
    if (qaEl) qaEl.innerHTML = `<div class="content-card"><p>${escapeHtml(qa)}</p></div>`;

    const taskEl = document.getElementById('task-container');
    if (taskEl) taskEl.innerHTML = (tasks.length ? tasks : ["Bu darsda uyga vazifa berilmagan"]).map(t => `<div class="content-card task">${escapeHtml(t)}</div>`).join('');

    const docEl = document.getElementById('doc-container');
    if (docEl) docEl.innerHTML = docs.map(d => {
      const title = fixSymbols(d?.title || 'Fayl');
      const link = d?.link ? (String(d.link).startsWith('/') ? String(d.link) : ('/' + String(d.link))) : '#';
      return `<div class="content-card pdf"><a href="${escapeHtml(link)}" target="_blank" rel="noopener"><i data-lucide="file-text" class="inline-icon"></i> ${escapeHtml(title)}</a></div>`;
    }).join('');

    const dlEl = document.getElementById('download-container');
    if (dlEl) dlEl.innerHTML = downloads.map(d => {
      const title = fixSymbols(d?.title || 'Yuklab olish');
      const link = d?.link ? (String(d.link).startsWith('/') ? String(d.link) : ('/' + String(d.link))) : '#';
      return `<div class="content-card pdf"><a href="${escapeHtml(link)}"><i data-lucide="download" class="inline-icon"></i> ${escapeHtml(title)}</a></div>`;
    }).join('');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (_) {}
    }

    if (typeof window.loadFeedbacks === 'function') {
      try { window.loadFeedbacks(); } catch (_) {}
    }

    if (videoSection && typeof videoSection.scrollIntoView === 'function') {
      setTimeout(() => videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }

  function bindKeyboardSupport() {
    const container = document.getElementById('courses');
    if (!container) return;
    container.addEventListener('keydown', (e) => {
      const target = e.target;
      if (!target || !target.classList || !target.classList.contains('course-card')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cards = Array.from(container.querySelectorAll('.course-card'));
        const idx = cards.indexOf(target);
        if (idx >= 0) window.selectCourse(idx);
      }
    });
  }

  function boot() {
    window.selectCourse = enhancedSelectCourse;
    window.renderCourses = enhancedRenderCourses;

    setDefaultLazyLoading();
    renderGeneratedAvatarPicker();
    enhancedRenderCourses();
    setupRevealObserver();
    bindKeyboardSupport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
