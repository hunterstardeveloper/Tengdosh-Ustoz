(() => {
  "use strict";

  const FIREBASE_VERSION = "10.7.1";
  const scriptCache = new Map();
  const numberFormatter = new Intl.NumberFormat();
  const state = {
    siteDataPromise: null,
    siteDataBooted: false,
    siteDataRefreshTimer: null,
    authPromise: null,
    authBooted: false,
    likeRuntimePromise: null,
    quoteScenePromise: null,
    quotesPromise: null,
    quoteCarouselBooted: false,
    quoteSceneBooted: false,
    teachersData: null,
    quoteIndex: 0,
    currentQuoteId: null,
    currentCount: 0,
    currentLiked: false,
    quoteCountToken: 0,
    autoStart: null,
    animFrame: null,
    quoteSwapTimer: null,
    toastTimer: null,
  };

  const ICON_PATHS = {
    sparkles:
      '<path d="M12 3l1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3z"></path><path d="M5 3v4"></path><path d="M3 5h4"></path><path d="M19 15v6"></path><path d="M16 18h6"></path>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    "file-code-2":
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M10 13l-2 2 2 2"></path><path d="M14 17l2-2-2-2"></path>',
    "book-check":
      '<path d="M12 21V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14"></path><path d="M12 21a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"></path><path d="M12 7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14"></path><path d="M12 21a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2"></path><path d="m16 12 2 2 4-4"></path>',
    "trending-up":
      '<path d="M22 7 13.5 15.5l-5-5L2 17"></path><path d="M16 7h6v6"></path>',
    quote:
      '<path d="M3 21c3 0 6-3 6-6V9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10c0 4.4-3.6 8-8 8"></path><path d="M15 21c3 0 6-3 6-6V9h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10c0 4.4-3.6 8-8 8"></path>',
    radio:
      '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path><path d="M7.7 16.3a6 6 0 0 1 0-8.6"></path><path d="M16.3 7.7a6 6 0 0 1 0 8.6"></path><path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2"></path><circle cx="12" cy="12" r="2"></circle>',
  };

  const moonIcon =
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  const sunIcon =
    '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

  function svgFor(name) {
    const path = ICON_PATHS[name];
    if (!path) return "";
    return '<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
  }

  function renderIcons(root = document) {
    root.querySelectorAll("[data-lucide]").forEach((el) => {
      const name = el.getAttribute("data-lucide");
      if (!name || !ICON_PATHS[name]) return;
      if (el.dataset.iconReady === name) return;
      el.innerHTML = svgFor(name);
      el.dataset.iconReady = name;
    });
  }

  function scheduleIdle(callback, timeout = 1500) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(callback, { timeout });
    } else {
      window.setTimeout(callback, 0);
    }
  }

  function observeOnce(element, callback, rootMargin = "200px") {
    if (!element || typeof IntersectionObserver === "undefined") {
      callback();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.some((entry) => entry.isIntersecting);
      if (!hit) return;
      observer.disconnect();
      callback();
    }, { rootMargin });
    observer.observe(element);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function t(key, fallback = "") {
    return window.TU_i18n ? window.TU_i18n.t(key) : fallback || key;
  }

  function loadScriptOnce(src) {
    const url = new URL(src, window.location.href).toString();
    if (scriptCache.has(url)) return scriptCache.get(url);

    const promise = new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === url);
      const onError = () => reject(new Error("Failed to load " + url));
      let script = existing;

      if (script) {
        script.addEventListener("load", () => resolve(script), { once: true });
        script.addEventListener("error", onError, { once: true });
        if (script.dataset.ready === "true") resolve(script);
        return;
      }

      script = document.createElement("script");
      script.src = url;
      script.defer = true;
      script.async = false;
      script.addEventListener("load", () => {
        script.dataset.ready = "true";
        resolve(script);
      }, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.head.appendChild(script);
    });

    scriptCache.set(url, promise);
    return promise;
  }

  async function ensureQuotes() {
    if (Array.isArray(window.quotes) && window.quotes.length) return window.quotes;
    if (state.quotesPromise) return state.quotesPromise;

    state.quotesPromise = loadScriptOnce("/assets/home-quotes.js?v=1")
      .then(() => {
        if (!Array.isArray(window.quotes) || !window.quotes.length) {
          throw new Error("Quotes are unavailable");
        }
        return window.quotes;
      })
      .catch((error) => {
        state.quotesPromise = null;
        throw error;
      });

    return state.quotesPromise;
  }

  async function ensureQuoteSceneRuntime() {
    if (state.quoteScenePromise) return state.quoteScenePromise;

    state.quoteScenePromise = (async () => {
      if (!window.THREE) {
        await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");
      }
      await loadScriptOnce("/assets/home-quote-scene.js?v=1");
      if (!window.TUQuoteScene || typeof window.TUQuoteScene.init !== "function") {
        throw new Error("Quote scene runtime is unavailable");
      }
      return window.TUQuoteScene;
    })().catch((error) => {
      state.quoteScenePromise = null;
      throw error;
    });

    return state.quoteScenePromise;
  }

  async function ensureConfig() {
    if (window.TU_FIREBASE_CONFIG) return window.TU_FIREBASE_CONFIG;
    await loadScriptOnce("/assets/firebase-config.js");
    if (!window.TU_FIREBASE_CONFIG) {
      throw new Error("Firebase config is unavailable");
    }
    return window.TU_FIREBASE_CONFIG;
  }

  async function fetchDbJson(path, options = {}) {
    const config = await ensureConfig();
    const base = String(config.databaseURL || "").replace(/\/$/, "");
    const cleanPath = String(path).replace(/^\/+/, "").replace(/\.json$/i, "");
    const query = options.shallow ? "?shallow=true" : "";
    const response = await fetch(base + "/" + cleanPath + ".json" + query, {
      cache: options.cache || "no-store",
    });

    if (!response.ok) {
      throw new Error("DB request failed for " + cleanPath + ": " + response.status);
    }

    return response.json();
  }

  function initFirebaseApp() {
    if (!window.firebase || !window.TU_FIREBASE_CONFIG) {
      throw new Error("Firebase runtime is unavailable");
    }
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.TU_FIREBASE_CONFIG);
    }
    return firebase;
  }

  async function ensureAuthRuntime() {
    if (state.authPromise) return state.authPromise;
    state.authPromise = (async () => {
      await ensureConfig();
      await loadScriptOnce("https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/firebase-app-compat.js");
      await loadScriptOnce("https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/firebase-auth-compat.js");
      return initFirebaseApp().auth();
    })();
    return state.authPromise;
  }

  async function ensureLikeRuntime() {
    if (state.likeRuntimePromise) return state.likeRuntimePromise;
    state.likeRuntimePromise = (async () => {
      const auth = await ensureAuthRuntime();
      await loadScriptOnce("https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/firebase-database-compat.js");
      const db = initFirebaseApp().database();
      await loadScriptOnce("/assets/quote-likes.js");
      if (!window.TUQuoteLikes) {
        throw new Error("Quote likes runtime is unavailable");
      }
      return { auth, db, api: window.TUQuoteLikes };
    })();
    return state.likeRuntimePromise;
  }

  function animateCount(element, value, options = {}) {
    if (!element) return;
    const duration = Number(options.duration ?? 900);
    const formatter = options.formatter || ((number) => numberFormatter.format(number));
    const current = Number(String(element.dataset.value || element.textContent || "0").replace(/[^0-9]/g, "")) || 0;
    const target = Number(value) || 0;

    if (current === target) {
      element.textContent = formatter(target);
      element.dataset.value = String(target);
      return;
    }

    if (element._countFrame) {
      cancelAnimationFrame(element._countFrame);
    }

    const start = performance.now();
    const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);

    const tick = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      const next = Math.round(current + (target - current) * easeOut(progress));
      element.textContent = formatter(next);

      if (progress < 1) {
        element._countFrame = requestAnimationFrame(tick);
      } else {
        element.dataset.value = String(target);
        element._countFrame = null;
      }
    };

    element._countFrame = requestAnimationFrame(tick);
  }

  function formatTo12Hour(timeString) {
    if (!timeString || !timeString.includes(":")) return timeString;
    const parts = timeString.split(":");
    const hour = Number(parts[0]);
    const minute = parts[1];
    if (Number.isNaN(hour)) return timeString;
    const suffix = hour >= 12 ? "PM" : "AM";
    const normalized = hour % 12 || 12;
    return normalized + ":" + minute + " " + suffix;
  }

  function getClubName(path) {
    const names = {
      py: "Python",
      java: "Java",
      "full-stack": "Full-stack",
      english: "English",
      SI: "Self Improvement",
      mathematics: "Mathematics",
      prodev: "ProDev",
    };
    return names[path] || "Educational Club";
  }

  function renderSchedule(teachersData) {
    state.teachersData = teachersData || null;
    const container = document.getElementById("upcoming-classes-container");
    if (!container) return;

    const now = new Date();
    const liveDuration = 60 * 60 * 1000;

    if (!teachersData) {
      container.innerHTML = '<div class="card glass" style="grid-column: 1/-1; text-align: center;"><p>' + escapeHtml(t("schedule_no_classes", "No classes available right now.")) + "</p></div>";
      refreshReveal(container);
      renderIcons(container);
      return;
    }

    const classes = [];
    Object.keys(teachersData).forEach((teacherName) => {
      const data = teachersData[teacherName] && teachersData[teacherName].classData;
      if (!data || !data.hasClass || !data.date || !data.time) return;

      const formattedDate = data.date.includes(".")
        ? data.date.split(".").reverse().join("-")
        : data.date;
      const classStart = new Date(formattedDate + "T" + data.time);
      const classEnd = new Date(classStart.getTime() + liveDuration);

      if (now >= classEnd || Number.isNaN(classStart.getTime())) return;

      classes.push({
        teacher: teacherName,
        club: data.club || "SI",
        date: data.date,
        time: data.time,
        room: data.room || t("tbd", "TBD"),
        isLive: now >= classStart && now < classEnd,
        timestamp: classStart.getTime(),
      });
    });

    classes.sort((left, right) => left.timestamp - right.timestamp);

    if (!classes.length) {
      container.innerHTML = '<div class="card glass" style="grid-column: 1/-1; text-align: center;"><p>' + escapeHtml(t("schedule_none", "No upcoming classes found.")) + "</p></div>";
      refreshReveal(container);
      renderIcons(container);
      return;
    }

    container.innerHTML = classes.map((cls) => {
      const safeClub = escapeHtml(getClubName(cls.club));
      const safeTeacher = escapeHtml(cls.teacher);
      const safeTime = escapeHtml(formatTo12Hour(cls.time));
      const safeRoom = escapeHtml(cls.room);
      const href = "/clubs/" + encodeURIComponent(cls.club) + "/" + encodeURIComponent(cls.teacher) + "/offline.html";
      const statusText = cls.isLive
        ? '<span class="live-pulse"><i data-lucide="radio" class="inline-icon"></i> ' + escapeHtml(t("schedule_live", "Live now")) + "</span>"
        : escapeHtml(t("schedule_next", "Next class")) + ": " + escapeHtml(cls.date);
      const accentStyle = cls.isLive
        ? ' style="border: 2px solid #ff4d4d; color: #ff4d4d; background: rgba(255,77,77,0.1);"'
        : "";

      return (
        '<div class="card glass" style="text-align: center; padding: 40px 20px;">' +
          '<div style="margin-bottom: 25px;">' +
            '<div class="pill" style="margin-bottom: 15px;">' + safeClub + "</div>" +
            '<h3 style="font-size: 24px; margin-bottom: 12px;">' + statusText + "</h3>" +
            '<p style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--primary);">' + escapeHtml(t("schedule_teacher", "Teacher")) + ": " + safeTeacher + "</p>" +
            '<p style="font-size: 22px; margin-bottom: 8px;">' + escapeHtml(t("schedule_time", "Time")) + ": " + safeTime + "</p>" +
            '<p style="font-size: 18px; color: var(--text);">' + escapeHtml(t("schedule_room", "Room")) + ": " + safeRoom + "</p>" +
          "</div>" +
          '<a href="' + href + '"' + accentStyle + ">" + escapeHtml(cls.isLive ? t("schedule_join", "Join now") : t("schedule_view", "View details")) + "</a>" +
        "</div>"
      );
    }).join("");

    refreshReveal(container);
    renderIcons(container);
  }

  async function fetchUsersCount() {
    try {
      const users = await fetchDbJson("users", { shallow: true });
      return users && typeof users === "object" ? Object.keys(users).length : 0;
    } catch (_) {
      const users = await fetchDbJson("users");
      return users && typeof users === "object" ? Object.keys(users).length : 0;
    }
  }

  async function refreshSiteData() {
    const usersCountEl = document.getElementById("users-count");
    const teachersCountEl = document.getElementById("teachers-count");

    try {
      const [usersCount, teachersData] = await Promise.all([
        fetchUsersCount(),
        fetchDbJson("teachers").catch(() => null),
      ]);

      const teacherCount = teachersData && typeof teachersData === "object"
        ? Object.keys(teachersData).length
        : 0;

      animateCount(usersCountEl, usersCount);
      animateCount(teachersCountEl, teacherCount);
      renderSchedule(teachersData);
    } catch (_) {
      animateCount(usersCountEl, 0);
      animateCount(teachersCountEl, 0);
      renderSchedule(null);
    }
  }

  function bootSiteData() {
    if (state.siteDataBooted) return state.siteDataPromise;
    state.siteDataBooted = true;
    state.siteDataPromise = refreshSiteData();

    if (!state.siteDataRefreshTimer) {
      state.siteDataRefreshTimer = window.setInterval(refreshSiteData, 5 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) refreshSiteData();
      });
      document.addEventListener("tu-lang-changed", () => {
        renderSchedule(state.teachersData);
      });
    }

    return state.siteDataPromise;
  }

  function setAvatarLoggedOut() {
    const avatarEl = document.getElementById("navbar-avatar");
    if (!avatarEl) return;
    avatarEl.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
        '<circle cx="12" cy="7" r="4"></circle>' +
      "</svg>";
    avatarEl.removeAttribute("data-user-ready");
  }

  function setAvatarLoggedIn(user) {
    const avatarEl = document.getElementById("navbar-avatar");
    if (!avatarEl || !user) return;
    const name = String(user.displayName || user.email || "").trim();
    const initial = name ? name[0].toUpperCase() : "";
    const photoUrl = String(user.photoURL || "").trim();

    if (photoUrl) {
      avatarEl.innerHTML = '<img src="' + escapeHtml(photoUrl) + '" alt="Account avatar" referrerpolicy="no-referrer" loading="lazy" decoding="async">';
    } else {
      avatarEl.textContent = initial || "";
    }

    avatarEl.setAttribute("data-user-ready", "true");
  }

  function bootAvatar() {
    if (state.authBooted) return;
    state.authBooted = true;

    ensureAuthRuntime()
      .then((auth) => {
        auth.onAuthStateChanged((user) => {
          if (user) setAvatarLoggedIn(user);
          else setAvatarLoggedOut();
        });
      })
      .catch(() => {
        setAvatarLoggedOut();
      });
  }

  function djb2Hash(value) {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) + hash) + value.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  function parseQuote(raw) {
    if (window.TUQuoteLikes && typeof window.TUQuoteLikes.parseQuote === "function") {
      return window.TUQuoteLikes.parseQuote(raw);
    }

    const lastDash = String(raw).lastIndexOf(" - ");
    if (lastDash === -1) {
      return { raw, text: raw, author: "" };
    }

    return {
      raw,
      text: String(raw).slice(0, lastDash).trim(),
      author: String(raw).slice(lastDash + 3).trim(),
    };
  }

  function getQuoteId(raw) {
    if (window.TUQuoteLikes && typeof window.TUQuoteLikes.quoteIdFromRaw === "function") {
      return window.TUQuoteLikes.quoteIdFromRaw(raw);
    }
    return djb2Hash(String(raw || "").trim());
  }

  async function refreshQuoteCount(quoteId) {
    const token = ++state.quoteCountToken;
    state.currentCount = 0;
    updateLikeUI();

    try {
      let count = 0;
      if (window.TUQuoteLikes && typeof window.TUQuoteLikes.getQuoteCount === "function") {
        count = await window.TUQuoteLikes.getQuoteCount(quoteId);
      }
      if (token !== state.quoteCountToken) return;
      state.currentCount = Number(count || 0);
      updateLikeUI();
    } catch (_) {
      if (token !== state.quoteCountToken) return;
      state.currentCount = 0;
      updateLikeUI();
    }
  }

  function updateLikeUI() {
    const likeBtn = document.getElementById("like-btn");
    const likeCount = document.getElementById("like-count");
    if (likeBtn) likeBtn.classList.toggle("active-like", state.currentLiked);
    if (likeCount) likeCount.textContent = String(state.currentCount);
    const heartPath = likeBtn ? likeBtn.querySelector("path") : null;
    if (heartPath) {
      heartPath.setAttribute("fill", state.currentLiked ? "currentColor" : "none");
    }
  }

  function showToast(message) {
    const toast = document.getElementById("copy-toast");
    if (!toast) return;

    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }

  function setupThemeToggle() {
    const htmlEl = document.documentElement;
    const themeBtn = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    if (!themeBtn || !themeIcon) return;

    const stored = localStorage.getItem("theme");
    const initialTheme = stored || (htmlEl.getAttribute("data-theme") === "dark" ? "dark" : "light");

    const applyTheme = (theme) => {
      if (theme === "dark") {
        htmlEl.setAttribute("data-theme", "dark");
        themeIcon.innerHTML = sunIcon;
      } else {
        htmlEl.removeAttribute("data-theme");
        themeIcon.innerHTML = moonIcon;
      }
    };

    applyTheme(initialTheme);

    themeBtn.addEventListener("click", () => {
      const next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      applyTheme(next);
    });
  }

  let revealObserver = null;

  function ensureRevealObserver() {
    if (revealObserver || typeof IntersectionObserver === "undefined") return revealObserver;

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    return revealObserver;
  }

  function refreshReveal(scope = document) {
    const observer = ensureRevealObserver();
    const cards = scope.querySelectorAll(".card, .principle-card");

    cards.forEach((element) => {
      if (!element.dataset.revealReady) {
        element.dataset.revealReady = "true";
        element.style.opacity = "0";
        element.style.transform = "translateY(24px)";
      }

      if (observer) observer.observe(element);
    });
  }

  async function setupQuoteCarousel() {
    const quoteText = document.getElementById("quote-text");
    const quoteAuthor = document.getElementById("quote-author");
    const quoteCounter = document.getElementById("quote-counter");
    const likeBtn = document.getElementById("like-btn");
    const copyBtn = document.getElementById("copy-btn");
    const shareBtn = document.getElementById("share-btn");
    const autoBtn = document.getElementById("auto-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const ringEl = document.getElementById("ring-progress");

    if (!quoteText || !quoteAuthor || !quoteCounter || !likeBtn || !copyBtn || !shareBtn || !prevBtn || !nextBtn) {
      return;
    }

    try {
      await ensureQuotes();
    } catch (_) {
      return;
    }

    if (state.quoteCarouselBooted || !Array.isArray(window.quotes) || !window.quotes.length) return;
    state.quoteCarouselBooted = true;
    state.quoteIndex = Math.floor(Math.random() * window.quotes.length);

    const circumference = 2 * Math.PI * 20;
    const autoDuration = 8000;
    const card = document.querySelector(".quote-card");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let touchStartX = 0;
    let resumeAutoOnVisible = false;

    if (ringEl) {
      ringEl.style.strokeDasharray = String(circumference);
      ringEl.style.strokeDashoffset = String(circumference);
    }

    function setAutoState(isRunning) {
      if (!autoBtn) return;
      autoBtn.classList.toggle("auto-on", isRunning);
      autoBtn.setAttribute("aria-pressed", String(isRunning));
    }

    function clearSwapTimer() {
      if (state.quoteSwapTimer) {
        window.clearTimeout(state.quoteSwapTimer);
        state.quoteSwapTimer = null;
      }
    }

    function stopAuto(options = {}) {
      const preserveRing = !!options.preserveRing;
      if (state.animFrame) cancelAnimationFrame(state.animFrame);
      state.animFrame = null;
      state.autoStart = null;
      if (ringEl && !preserveRing) ringEl.style.strokeDashoffset = String(circumference);
      setAutoState(false);
    }

    function startAuto() {
      if (state.animFrame) cancelAnimationFrame(state.animFrame);
      state.animFrame = null;
      if (window.quotes.length < 2) {
        setAutoState(false);
        return;
      }
      setAutoState(true);
      state.autoStart = performance.now();
      if (ringEl) ringEl.style.strokeDashoffset = String(circumference);

      const tick = (now) => {
        if (state.autoStart === null) return;

        const elapsed = now - state.autoStart;
        const progress = Math.min(elapsed / autoDuration, 1);
        if (ringEl) ringEl.style.strokeDashoffset = String(circumference * (1 - progress));

        if (progress >= 1) {
          showQuote(state.quoteIndex + 1);
          state.autoStart = performance.now();
        }

        state.animFrame = requestAnimationFrame(tick);
      };

      state.animFrame = requestAnimationFrame(tick);
    }

    function restartAuto() {
      stopAuto();
      startAuto();
    }

    function showQuote(index, options = {}) {
      const immediate = !!options.immediate || prefersReducedMotion;
      state.quoteIndex = (index + window.quotes.length) % window.quotes.length;
      state.currentLiked = false;
      const raw = window.quotes[state.quoteIndex];
      const parsed = parseQuote(raw);
      state.currentQuoteId = getQuoteId(raw);
      refreshQuoteCount(state.currentQuoteId);
      updateLikeUI();

      clearSwapTimer();
      if (card) card.classList.add("is-switching");
      quoteText.classList.add("fading");
      quoteAuthor.classList.add("fading");
      quoteCounter.classList.add("fading");

      const commitQuote = () => {
        quoteText.textContent = '"' + parsed.text + '"';
        quoteAuthor.textContent = parsed.author ? parsed.author : "";
        quoteCounter.textContent = String(state.quoteIndex + 1) + " / " + String(window.quotes.length);
        requestAnimationFrame(() => {
          quoteText.classList.remove("fading");
          quoteAuthor.classList.remove("fading");
          quoteCounter.classList.remove("fading");
          if (card) card.classList.remove("is-switching");
        });
      };

      if (immediate) {
        commitQuote();
        return;
      }

      state.quoteSwapTimer = window.setTimeout(() => {
        state.quoteSwapTimer = null;
        commitQuote();
      }, 180);
    }

    likeBtn.addEventListener("click", async () => {
      if (!state.currentQuoteId) return;

      likeBtn.disabled = true;

      try {
        try { sessionStorage.setItem("tu_return_url", window.location.href); } catch (_) {}
        const runtime = await ensureLikeRuntime();
        const result = await runtime.api.toggleLike(
          runtime.db,
          runtime.auth,
          state.currentQuoteId,
          parseQuote(window.quotes[state.quoteIndex])
        );

        if (result && result.redirected) return;

        state.currentLiked = !!(result && result.liked);
        await refreshQuoteCount(state.currentQuoteId);
        likeBtn.classList.remove("like-pop");
        void likeBtn.offsetWidth;
        likeBtn.classList.add("like-pop");
        likeBtn.addEventListener("animationend", () => likeBtn.classList.remove("like-pop"), { once: true });
      } catch (_) {
        showToast("Could not update like");
      } finally {
        likeBtn.disabled = false;
      }
    });

    copyBtn.addEventListener("click", () => {
      const parsed = parseQuote(window.quotes[state.quoteIndex]);
      const full = '"' + parsed.text + '"' + (parsed.author ? "  " + parsed.author : "");
      navigator.clipboard.writeText(full)
        .then(() => showToast(t("quote_copied", "Copied to clipboard")))
        .catch(() => showToast("Could not copy"));
    });

    shareBtn.addEventListener("click", () => {
      const parsed = parseQuote(window.quotes[state.quoteIndex]);
      const full = '"' + parsed.text + '"' + (parsed.author ? "  " + parsed.author : "");

      if (navigator.share) {
        navigator.share({ title: "Inspirational Quote", text: full }).catch(() => {});
        return;
      }

      navigator.clipboard.writeText(full)
        .then(() => showToast(t("quote_copied", "Copied to clipboard")))
        .catch(() => showToast("Could not copy"));
    });

    prevBtn.addEventListener("click", () => {
      showQuote(state.quoteIndex - 1);
      restartAuto();
    });

    nextBtn.addEventListener("click", () => {
      showQuote(state.quoteIndex + 1);
      restartAuto();
    });

    if (autoBtn) {
      autoBtn.addEventListener("click", () => {
        if (state.autoStart === null) startAuto();
        else stopAuto();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        showQuote(state.quoteIndex - 1);
        restartAuto();
      }
      if (event.key === "ArrowRight") {
        showQuote(state.quoteIndex + 1);
        restartAuto();
      }
    });

    if (card) {
      card.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].screenX;
      }, { passive: true });

      card.addEventListener("touchend", (event) => {
        const diff = event.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) <= 40) return;
        showQuote(diff < 0 ? state.quoteIndex + 1 : state.quoteIndex - 1);
        restartAuto();
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resumeAutoOnVisible = state.autoStart !== null;
        stopAuto({ preserveRing: true });
        return;
      }
      if (resumeAutoOnVisible) {
        resumeAutoOnVisible = false;
        startAuto();
      }
    });

    document.addEventListener("tu-lang-changed", () => {
      const wasRunning = state.autoStart !== null;
      stopAuto();
      showQuote(state.quoteIndex, { immediate: true });
      if (wasRunning || !autoBtn) startAuto();
    });

    showQuote(state.quoteIndex, { immediate: true });
    startAuto();
  }

  async function bootQuoteScene() {
    const stage = document.getElementById("quote-scene-stage");
    if (!stage || state.quoteSceneBooted) return;
    state.quoteSceneBooted = true;

    try {
      const api = await ensureQuoteSceneRuntime();
      api.init(stage);
    } catch (_) {
      stage.classList.remove("is-ready");
    }
  }

  function setupScheduleToggle() {
    const toggleBtn = document.getElementById("toggle-schedule-btn");
    const classesContainer = document.getElementById("upcoming-classes-container");
    if (!toggleBtn || !classesContainer) return;

    toggleBtn.addEventListener("click", () => {
      const hidden = !classesContainer.classList.contains("visible");
      classesContainer.classList.toggle("visible", hidden);
      toggleBtn.textContent = hidden
        ? t("schedule_hide", "Hide Schedule")
        : t("schedule_show", "Show Upcoming Classes");
    });
  }

  function setupNav() {
    const nav = document.getElementById("main-navbar");
    const ham = document.getElementById("navbar-hamburger");
    const links = document.getElementById("navbar-links");
    if (!nav || !links) return;

    const isMobile = () => window.matchMedia("(max-width: 1080px)").matches;

    const setOpen = (open) => {
      links.classList.toggle("open", open);
      if (ham) {
        ham.classList.toggle("open", open);
        ham.setAttribute("aria-expanded", String(open));
      }
      document.body.classList.toggle("nav-open", open && isMobile());
    };

    const onScroll = () => {
      nav.classList.toggle("navbar--scrolled", window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (ham) {
      ham.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(!links.classList.contains("open"));
      });
    }

    links.querySelectorAll("a").forEach((anchor) => {
      anchor.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (event) => {
      if (!isMobile() || !links.classList.contains("open")) return;
      if (nav.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) setOpen(false);
    });

    links.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        setOpen(false);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function startParticles() {
    const canvas = document.getElementById("particles-canvas");
    if (!canvas) return;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = String(connection && connection.effectiveType ? connection.effectiveType : "").toLowerCase();
    const slowConnection = !!(
      connection && (
        connection.saveData ||
        effectiveType.includes("slow-2g") ||
        effectiveType.includes("2g") ||
        effectiveType.includes("3g")
      )
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 900 || slowConnection) {
      canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = [];
    const particleCount = 28;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2,
      dx: -0.12 + Math.random() * 0.24,
      dy: -0.22 + Math.random() * 0.14,
      opacity: 0.18 + Math.random() * 0.32,
      direction: Math.random() > 0.5 ? 1 : -1,
    });

    resize();
    for (let index = 0; index < particleCount; index += 1) {
      particles.push(createParticle());
    }

    const currentColor = () => (
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "201, 162, 39"
        : "139, 105, 20"
    );

    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (document.hidden) return;

      ctx.clearRect(0, 0, width, height);
      const color = currentColor();

      particles.forEach((particle) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.opacity += particle.direction * 0.002;

        if (particle.opacity > 0.55 || particle.opacity < 0.12) {
          particle.direction *= -1;
        }
        if (particle.y < -12) {
          particle.y = height + 12;
          particle.x = Math.random() * width;
        }
        if (particle.x < 0 || particle.x > width) {
          particle.dx *= -1;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + color + ", " + particle.opacity + ")";
        ctx.fill();
      });
    };

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden || !frame) return;
      frame = requestAnimationFrame(draw);
    });

    frame = requestAnimationFrame(draw);
  }

  function setFooterYear() {
    const year = document.getElementById("footer-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function setupReadMore() {
    window.toggleReadMore = (event) => {
      if (event) event.stopPropagation();
      const moreText = document.getElementById("more-text");
      const button = document.getElementById("read-more-btn");
      if (!moreText || !button) return;
      const expanded = moreText.style.display === "inline";
      moreText.style.display = expanded ? "none" : "inline";
      button.textContent = expanded ? "Read More..." : "Read Less";
    };
  }

  function init() {
    setupThemeToggle();
    setupReadMore();
    setupScheduleToggle();
    setupNav();
    setFooterYear();
    setAvatarLoggedOut();
    renderIcons();
    refreshReveal();

    observeOnce(document.querySelector(".site-stats"), bootSiteData, "300px");
    observeOnce(document.getElementById("upcoming-classes-container"), bootSiteData, "300px");
    observeOnce(document.querySelector(".quote-section"), () => {
      scheduleIdle(() => {
        void setupQuoteCarousel();
      }, 1200);
      scheduleIdle(() => {
        void bootQuoteScene();
      }, 1800);
    }, "240px");

    if (document.readyState === "complete") {
      scheduleIdle(() => bootSiteData(), 2000);
      scheduleIdle(() => bootAvatar(), 3000);
      scheduleIdle(() => startParticles(), 2500);
    } else {
      window.addEventListener("load", () => {
        scheduleIdle(() => bootSiteData(), 2000);
        scheduleIdle(() => bootAvatar(), 3000);
        scheduleIdle(() => startParticles(), 2500);
      }, { once: true });
    }
  }

  init();
})();
