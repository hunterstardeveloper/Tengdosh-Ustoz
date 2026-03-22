(function () {
  "use strict";

  if (window.TUTheme) return;

  const root = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const localKeys = ["theme"];
  const sessionKey = "tu_theme";
  const themeColors = {
    dark: "#0a0a0b",
    light: "#f5f0e8",
  };

  function normalizeTheme(value) {
    return value === "light" ? "light" : value === "dark" ? "dark" : null;
  }

  function safeGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSet(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (error) {}
  }

  function readDomTheme() {
    return normalizeTheme(root.getAttribute("data-theme"));
  }

  function prefersDarkTheme() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch (error) {
      return true;
    }
  }

  function getStoredTheme() {
    for (const key of localKeys) {
      const value = normalizeTheme(safeGet(window.localStorage, key));
      if (value) return value;
    }

    const sessionTheme = normalizeTheme(safeGet(window.sessionStorage, sessionKey));
    if (sessionTheme) return sessionTheme;

    return readDomTheme() || (prefersDarkTheme() ? "dark" : "light");
  }

  function updateThemeColor(theme) {
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColors[theme] || themeColors.dark);
    }

    try {
      root.style.colorScheme = theme;
    } catch (error) {}
  }

  function applyDomTheme(theme) {
    root.setAttribute("data-theme", theme);
    updateThemeColor(theme);
  }

  function persistTheme(theme) {
    for (const key of localKeys) {
      safeSet(window.localStorage, key, theme);
    }
    safeSet(window.sessionStorage, sessionKey, theme);
  }

  function setTheme(theme, options) {
    const normalized = normalizeTheme(theme) || "dark";
    const persist = !(options && options.persist === false);
    applyDomTheme(normalized);
    if (persist) persistTheme(normalized);
    return normalized;
  }

  const initialTheme = getStoredTheme();
  applyDomTheme(initialTheme);
  persistTheme(initialTheme);

  window.TUTheme = {
    getStoredTheme,
    set(theme) {
      return setTheme(theme);
    },
    apply(theme) {
      return setTheme(theme, { persist: false });
    },
    toggle() {
      const nextTheme = getStoredTheme() === "dark" ? "light" : "dark";
      return setTheme(nextTheme);
    },
    sync() {
      const theme = getStoredTheme();
      applyDomTheme(theme);
      persistTheme(theme);
      return theme;
    },
  };

  window.addEventListener("storage", (event) => {
    if (!event || !localKeys.includes(event.key)) return;
    applyDomTheme(getStoredTheme());
  });
})();
