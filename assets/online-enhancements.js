(function () {
  'use strict';

  let animationsCache = null;
  async function getAnimations() {
    if (animationsCache) return animationsCache;
    try {
      const mod = await import("./base64.js");
      animationsCache = mod?.animations || {};
    } catch (_) {
      animationsCache = {};
    }
    return animationsCache;
  }
  
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
    if (!ready) {
      courseContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; width: 100%;">
          <h3 style="color: var(--muted, #6b7280); font-size: 20px;">Darslar yuklanmoqda...</h3>
        </div>`;
      return;
    }

    courseContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; width: 100%;">
        <h3 style="color: var(--muted, #6b7280); font-size: 20px;">Bu yerda darslar mavjud emas</h3>
        <img
          data-empty-anim="1"
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          alt="No courses"
          loading="lazy"
          decoding="async"
          style="max-width: 260px; width: 100%; margin-top: 18px;"
          draggable="false"
        >
      </div>`;
  }

  function loadEmptyAnimation(courseContainer) {
    if (!courseContainer) return;
    const img = courseContainer.querySelector('img[data-empty-anim="1"]');
    if (!img) return;
    const key = "1 animation";
    getAnimations().then((animations) => {
      const src = animations && animations[key];
      if (src && img.getAttribute('src') !== src) {
        img.setAttribute('src', src);
      }
    }).catch(() => {});
  }

  function enhancedRenderCourses() {
    const courseContainer = document.getElementById('courses');
    if (!courseContainer) return;
    const cd = window.courseData;
    if (!cd || !Array.isArray(cd) || cd.length === 0) {
      const ready = !!window.__TU_COURSES_READY;
      renderEmptyState(courseContainer, ready);
      if (ready) loadEmptyAnimation(courseContainer);
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

    const root = (typeof window.ROOT_ASSET === 'string') ? window.ROOT_ASSET : '/';

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
