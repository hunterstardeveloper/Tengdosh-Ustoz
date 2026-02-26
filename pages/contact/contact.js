(() => {
  "use strict";

  const API_BASE_URL = "https://repo3-17oc.onrender.com";

  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function setStatus(msg, type) {
    const el = $("statusLine");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("ok", "err");
    if (type) el.classList.add(type);
  }

  function initNavbar() {
    const scrollEl = $("page-scroll") || document.querySelector(".page-scroll") || window;
    const navbar = $("main-navbar");
    const links = $("navbar-links");
    const burger = $("navbar-hamburger");

    const closeMenu = () => {
      if (!links || !burger) return;
      links.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };

    if (burger && links) {
      burger.addEventListener("click", () => {
        const isOpen = links.classList.toggle("open");
        burger.classList.toggle("open", isOpen);
        burger.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("nav-open", isOpen);
      });

      links.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => closeMenu());
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
      });

      document.addEventListener("click", (e) => {
        const t = e.target;
        if (!t) return;
        if (links.classList.contains("open")) {
          const inNav = navbar && navbar.contains(t);
          const inMenu = links.contains(t);
          if (!inNav && !inMenu) closeMenu();
        }
      });
    }

    const onScroll = () => {
      if (!navbar) return;
      const y = scrollEl === window ? window.scrollY : scrollEl.scrollTop;
      navbar.classList.toggle("navbar--scrolled", y > 8);
    };

    if (scrollEl && scrollEl !== window) scrollEl.addEventListener("scroll", onScroll, { passive: true });
    else window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  
  function initNavbarAvatar() {
    const avatar = $("navbar-avatar");
    if (!avatar) return;

    const DEFAULT_SVG = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>`;

    const setDefault = () => {
      avatar.innerHTML = DEFAULT_SVG;
      avatar.removeAttribute("data-initials");
    };

    const initialsFrom = (nameOrEmail) => {
      const s = (nameOrEmail || "").trim();
      if (!s) return "";
      const parts = s.split(/\s+/).filter(Boolean);
      const a = parts[0]?.[0] || "";
      const b = parts.length > 1 ? parts[parts.length - 1][0] : (s.includes("@") ? s[1] || "" : "");
      return (a + b).toUpperCase();
    };

    const render = async (user) => {
      if (!user) {
        setDefault();
        return;
      }

      let profile = {};
      try {
        const snap = await TU.db.ref(`users/${user.uid}`).once("value");
        profile = snap && snap.exists() ? snap.val() : {};
      } catch (_) {}

      const photo = profile?.photoURL || user.photoURL || "";
      const name = profile?.displayName || profile?.name || user.displayName || user.email || "";

      if (photo) {
        avatar.innerHTML = `<img src="${photo}" alt="Account" referrerpolicy="no-referrer" />`;
      } else {
        const ini = initialsFrom(name);
        if (ini) {
          avatar.textContent = ini;
          avatar.setAttribute("data-initials", ini);
        } else {
          setDefault();
        }
      }
    };

    setDefault();

    document.addEventListener("tu-auth-changed", (e) => {
      const u = e?.detail?.user || null;
      if (window.TU && TU.db) render(u);
      else setDefault();
    });

    try {
      if (window.TU && TU.auth && TU.auth.currentUser) render(TU.auth.currentUser);
    } catch (_) {}
  }

  function initThemeToggle() {
    const htmlEl = document.documentElement;
    const btn = $("theme-toggle");
    const icon = $("theme-icon");

    const moonSVG = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    const sunSVG =
      '<circle cx="12" cy="12" r="5"></circle>' +
      '<line x1="12" y1="1" x2="12" y2="3"></line>' +
      '<line x1="12" y1="21" x2="12" y2="23"></line>' +
      '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
      '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
      '<line x1="1" y1="12" x2="3" y2="12"></line>' +
      '<line x1="21" y1="12" x2="23" y2="12"></line>' +
      '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
      '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

    function persistTheme(value) {
      try {
        if (window.TU && TU.db && TU.auth && TU.auth.currentUser) {
          TU.db.ref(`users/${TU.auth.currentUser.uid}/prefs/theme`).set(value);
          return;
        }
      } catch (_) {}
      try { sessionStorage.setItem("tu_theme", value); } catch (_) {}
    }

    function setTheme(isDark, persist) {
      if (isDark) {
        htmlEl.setAttribute("data-theme", "dark");
        if (icon) icon.innerHTML = sunSVG;
        if (persist) persistTheme("dark");
      } else {
        htmlEl.removeAttribute("data-theme");
        if (icon) icon.innerHTML = moonSVG;
        if (persist) persistTheme("light");
      }
    }

    let initial = null;
    try { initial = sessionStorage.getItem("tu_theme"); } catch (_) {}
    if (initial === "dark") setTheme(true, false);
    else if (initial === "light") setTheme(false, false);
    else setTheme(true, false); 

    if (btn) {
      btn.addEventListener("click", async () => {
        const isDark = htmlEl.getAttribute("data-theme") === "dark";
        setTheme(!isDark, true);
      });
    }
  }

  async function initAutofill() {
    const first = $("firstName");
    const sur = $("surname");
    const group = $("group");
    const hint = $("autofillHint");
    if (!first || !sur || !group) return;

    const lockFields = (locked) => {
      [first, sur, group].forEach((el) => {
        el.readOnly = locked;
        el.disabled = locked;
      });
    };

    function setHint(text) {
      if (!hint) return;
      hint.textContent = text;
    }

    try {
      if (!window.TU || !TU.auth) {
        setHint("If you are registered, log in from the Account page to auto-fill your details.");
        lockFields(false);
        return;
      }

      TU.auth.onAuthStateChanged(async (user) => {
        if (!user) {
          setHint("Not logged in. You can still send a message, or log in to auto-fill your details.");
          lockFields(false);
          return;
        }

        // Attempt to read profile
        try {
          const snap = await TU.db.ref(`users/${user.uid}`).once("value");
          const profile = snap && snap.exists() ? snap.val() : {};
          const displayName = profile?.displayName || profile?.name || user.displayName || "";
          const surname = profile?.surename || profile?.surname || "";
          const grp = profile?.groupInUniversity || profile?.group || "";

          if (displayName) first.value = displayName;
          if (surname) sur.value = surname;
          if (grp) group.value = grp;

          lockFields(true);
          setHint("Your Name / Surname / Group were auto-filled from your account.");
        } catch (_) {
          lockFields(true);
          setHint("Logged in. Unable to load profile, but your account is detected.");
        }
      });
    } catch (_) {
      lockFields(false);
    }
  }

  const COOLDOWN_MS = (6 * 60 + 30) * 60 * 1000; // 6h 30m
  const STORAGE_KEY = "tu_contact_last_sent_at";

  function getLastSent() {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = v ? Number(v) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  function setLastSent(ts) {
    localStorage.setItem(STORAGE_KEY, String(ts));
  }

  function formatRemaining(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function updateCooldownUI() {
    const pill = $("cooldownPill");
    const btn = $("submitBtn");
    if (!pill || !btn) return;

    const now = Date.now();
    const last = getLastSent();
    const remaining = (last + COOLDOWN_MS) - now;

    if (remaining > 0) {
      pill.textContent = `Cooldown: ${formatRemaining(remaining)}`;
      btn.disabled = true;
    } else {
      pill.textContent = "Cooldown: ready";
      btn.disabled = false;
    }
  }


function initResetCombo() {
  let buf = "";
  const target = "RESET";
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey && e.altKey && e.shiftKey)) {
      buf = "";
      return;
    }
    if (e.key && e.key.length === 1) {
      buf += e.key.toUpperCase();
      if (buf.length > target.length) buf = buf.slice(-target.length);
      if (buf === target) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (_) {}
        updateCooldownUI();
        setStatus("Cooldown reset (test mode).", "ok");
        buf = "";
      }
    } else if (e.key === "Backspace") {
      buf = buf.slice(0, -1);
    }
  });
}

  function initForm() {
    const form = $("contactForm");
    if (!form) return;

    const anonymous = $("anonymousToggle");
    const personalBlock = $("personalBlock");
    const first = $("firstName");
    const sur = $("surname");
    const group = $("group");
    const message = $("message");

    const imgUrl = $("imgUrl");
    const videoUrl = $("videoUrl");
    const linkUrl = $("linkUrl");
    const fileInput = $("fileInput");
    const dropzone = $("dropzone");
    const fileList = $("fileList");

    const btn = $("submitBtn");

    const toggleAnon = () => {
      const isAnon = !!(anonymous && anonymous.checked);
      if (personalBlock) personalBlock.style.display = isAnon ? "none" : "block";
    };

    const MAX_FILES = 5;

    function renderFiles(files) {
      if (!fileList) return;
      fileList.innerHTML = "";
      const arr = Array.from(files || []);
      arr.forEach((f, idx) => {
        const row = document.createElement("div");
        row.className = "file-chip";
        row.innerHTML = `
          <span>${f.name} • ${Math.round(f.size / 1024)} KB</span>
          <button type="button" data-rm="${idx}">Remove</button>
        `;
        fileList.appendChild(row);
      });

      fileList.querySelectorAll("button[data-rm]").forEach((btnRm) => {
        btnRm.addEventListener("click", () => {
          if (!fileInput) return;
          const i = Number(btnRm.getAttribute("data-rm"));
          const current = Array.from(fileInput.files || []);
          current.splice(i, 1);
          const dt = new DataTransfer();
          current.forEach((x) => dt.items.add(x));
          fileInput.files = dt.files;
          renderFiles(fileInput.files);
        });
      });
    }

    function addFiles(newFiles) {
      if (!fileInput) return;

      const current = Array.from(fileInput.files || []);
      const incoming = Array.from(newFiles || []);
      const merged = current.concat(incoming).slice(0, MAX_FILES);

      const dt = new DataTransfer();
      merged.forEach((f) => dt.items.add(f));
      fileInput.files = dt.files;

      renderFiles(fileInput.files);
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });

      fileInput.addEventListener("change", () => {
        addFiles(fileInput.files);
      });

      ["dragenter", "dragover"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add("is-dragover");
        });
      });

      ["dragleave", "drop"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove("is-dragover");
        });
      });

      dropzone.addEventListener("drop", (e) => {
        const files = e.dataTransfer?.files;
        if (files && files.length) addFiles(files);
      });
    }

    if (anonymous) {
      anonymous.addEventListener("change", toggleAnon);
      toggleAnon();
    }
updateCooldownUI();
    setInterval(updateCooldownUI, 1000);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const now = Date.now();
      const last = getLastSent();
      if (now < last + COOLDOWN_MS) {
        const remaining = (last + COOLDOWN_MS) - now;
        setStatus(`You can send again in ${formatRemaining(remaining)}.`, "err");
        updateCooldownUI();
        return;
      }

      const isAnon = !!(anonymous && anonymous.checked);
      const msg = (message?.value || "").trim();

      if (!msg || msg.length < 3) {
        setStatus("Please write a message (at least 3 characters).", "err");
        return;
      }

      const clean = (v) => (v || "").trim();
      const payload = {
        isAnonymous: isAnon,
        firstName: isAnon ? "" : clean(first?.value),
        surname: isAnon ? "" : clean(sur?.value),
        group: isAnon ? "" : clean(group?.value),
        message: msg,
        attachments: {
          imageUrl: clean(imgUrl?.value),
          videoUrl: clean(videoUrl?.value),
          linkUrl: clean(linkUrl?.value),
          files: Array.from(fileInput?.files || []).map((f) => ({ name: f.name, size: f.size, type: f.type })),
        },
        timestamp: new Date().toISOString(),
      };

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v9h-9"/></svg> Sending...`;
      }
      setStatus("", null);

      try {
        const resp = await fetch(API_BASE_URL + "/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok || !data.ok) {
          setStatus("Delivery failed. Please try again later.", "err");
          return;
        }

        setLastSent(Date.now());
        updateCooldownUI();
        setStatus("Message delivered.", "ok");
        form.reset();
        if (fileList) fileList.innerHTML = "";
        if (anonymous) anonymous.checked = false;
        toggleAnon();
      } catch (err) {
        setStatus("Network error. Please try again later.", "err");
      } finally {
        if (btn) {
          btn.innerHTML = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Send message`;
          updateCooldownUI();
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    try { if (window.TU && typeof TU.init === "function") TU.init(); } catch (_) {}
    const fy = document.getElementById("footer-year");
    if (fy) fy.textContent = String(new Date().getFullYear());
    initNavbar();
    initNavbarAvatar();
    initThemeToggle();
    initAutofill();
    initForm();
    initResetCombo();
  });
})();
