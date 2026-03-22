(() => {
  "use strict";

  if (window.__TENGDOSH_PWA_PROMO__) return;
  window.__TENGDOSH_PWA_PROMO__ = true;

  const DISMISS_KEY = "tengdosh_pwa_promo_dismissed_v1";
  const INSTALL_KEY = "tengdosh_pwa_installed_hint_v1";
  const DISPLAY_MODE_QUERY = "(display-mode: standalone)";
  const ua = navigator.userAgent || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  let deferredPrompt = null;

  const $ = (id) => document.getElementById(id);

  function t(key, fallback) {
    try {
      if (window.TU_i18n && typeof window.TU_i18n.t === "function") {
        return window.TU_i18n.t(key);
      }
    } catch {}

    return fallback || key;
  }

  function getInstalledHint() {
    try {
      return localStorage.getItem(INSTALL_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setInstalledHint(value) {
    try {
      if (value) localStorage.setItem(INSTALL_KEY, "1");
      else localStorage.removeItem(INSTALL_KEY);
    } catch {}
  }

  function isInstalled() {
    const installed =
      (window.matchMedia && window.matchMedia(DISPLAY_MODE_QUERY).matches) ||
      window.navigator.standalone === true ||
      getInstalledHint();

    if (installed) setInstalledHint(true);
    return installed;
  }

  function getDismissedKey() {
    try {
      return sessionStorage.getItem(DISMISS_KEY) || "";
    } catch {
      return "";
    }
  }

  function setDismissedKey(value) {
    try {
      if (value) sessionStorage.setItem(DISMISS_KEY, value);
      else sessionStorage.removeItem(DISMISS_KEY);
    } catch {}
  }

  function stateKey(state) {
    if (state.installed) return "installed";
    if (state.canPrompt) return "install-ready";
    if (!state.installed && state.isIOS) return "ios-install";
    return "";
  }

  function getState() {
    return {
      installed: isInstalled(),
      canPrompt: !!deferredPrompt && !isInstalled(),
      isIOS,
    };
  }

  function resolveConfig(config) {
    if (!config) return null;

    return {
      key: config.key || "",
      hideAction: !!config.hideAction,
      disableAction: !!config.disableAction,
      eyebrow: config.eyebrowKey ? t(config.eyebrowKey, config.eyebrowFallback) : (config.eyebrow || ""),
      title: config.titleKey ? t(config.titleKey, config.titleFallback) : (config.title || ""),
      text: config.textKey ? t(config.textKey, config.textFallback) : (config.text || ""),
      actionLabel: config.actionKey ? t(config.actionKey, config.actionFallback) : (config.actionLabel || ""),
      secondaryLabel: config.secondaryKey ? t(config.secondaryKey, config.secondaryFallback) : (config.secondaryLabel || ""),
      chips: (config.chipKeys || []).map((chip) => t(chip, "")),
    };
  }

  function syncLabels() {
    const promo = $("pwaPromo");
    const close = $("pwaPromoClose");

    if (promo) {
      promo.setAttribute("aria-label", t("pwa_promo_aria", "App install promotion"));
    }

    if (close) {
      const closeLabel = t("pwa_promo_close_aria", "Close install promotion");
      close.setAttribute("aria-label", closeLabel);
      close.title = closeLabel;
    }
  }

  function applyConfig(config) {
    const promo = $("pwaPromo");
    const eyebrow = $("pwaPromoEyebrow");
    const title = $("pwaPromoTitle");
    const text = $("pwaPromoText");
    const action = $("pwaPromoAction");
    const secondary = $("pwaPromoSecondary");
    const chipOne = $("pwaPromoChipOne");
    const chipTwo = $("pwaPromoChipTwo");
    const chipThree = $("pwaPromoChipThree");

    if (!promo || !eyebrow || !title || !text || !action || !secondary) return;

    syncLabels();

    if (!config) {
      promo.hidden = true;
      return;
    }

    promo.hidden = false;
    promo.dataset.state = config.key || "";
    eyebrow.textContent = config.eyebrow || "";
    title.textContent = config.title || "";
    text.textContent = config.text || "";
    action.hidden = !!config.hideAction;
    action.disabled = !!config.disableAction;
    action.textContent = config.actionLabel || t("pwa_promo_action_download", "Download app");
    secondary.textContent = config.secondaryLabel || t("pwa_promo_action_later", "Later");
    chipOne.textContent = (config.chips && config.chips[0]) || "";
    chipTwo.textContent = (config.chips && config.chips[1]) || "";
    chipThree.textContent = (config.chips && config.chips[2]) || "";
  }

  function getConfig(state) {
    if (state.canPrompt) {
      return {
        key: "install-ready",
        eyebrowKey: "pwa_promo_install_eyebrow",
        titleKey: "pwa_promo_install_title",
        textKey: "pwa_promo_install_text",
        actionKey: "pwa_promo_action_download",
        secondaryKey: "pwa_promo_action_later",
        chipKeys: [
          "pwa_promo_chip_fast_launch",
          "pwa_promo_chip_home_screen",
          "pwa_promo_chip_cleaner_view",
        ],
      };
    }

    if (!state.installed && state.isIOS) {
      return {
        key: "ios-install",
        eyebrowKey: "pwa_promo_ios_eyebrow",
        titleKey: "pwa_promo_ios_title",
        textKey: "pwa_promo_ios_text",
        hideAction: true,
        secondaryKey: "pwa_promo_action_close",
        chipKeys: [
          "pwa_promo_chip_safari_only",
          "pwa_promo_chip_home_screen",
          "pwa_promo_chip_full_screen_view",
        ],
      };
    }

    return null;
  }

  function refresh() {
    const promo = $("pwaPromo");
    if (!promo) return;

    const state = getState();
    const key = stateKey(state);
    const dismissed = getDismissedKey();

    if (dismissed && dismissed === key) {
      promo.hidden = true;
      return;
    }

    applyConfig(resolveConfig(getConfig(state)));
  }

  async function runInstall() {
    const action = $("pwaPromoAction");
    if (!deferredPrompt || !action) return;

    action.disabled = true;
    action.textContent = t("pwa_promo_opening", "Opening...");

    try {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      await promptEvent.prompt();
      const result = await promptEvent.userChoice.catch(() => ({ outcome: "dismissed" }));

      if (result && result.outcome === "accepted") {
        setInstalledHint(true);
        applyConfig(resolveConfig({
          key: "installing",
          eyebrowKey: "pwa_promo_installing_eyebrow",
          titleKey: "pwa_promo_installing_title",
          textKey: "pwa_promo_installing_text",
          hideAction: true,
          secondaryKey: "pwa_promo_action_close",
          chipKeys: [
            "pwa_promo_chip_almost_ready",
            "pwa_promo_chip_quick_access",
            "pwa_promo_chip_saved",
          ],
        }));
        setTimeout(refresh, 3500);
      } else {
        refresh();
      }
    } catch {
      refresh();
    } finally {
      action.disabled = false;
    }
  }

  function init() {
    const promo = $("pwaPromo");
    const action = $("pwaPromoAction");
    const close = $("pwaPromoClose");
    const secondary = $("pwaPromoSecondary");

    if (!promo || !action || !close || !secondary) return;

    syncLabels();
    action.addEventListener("click", runInstall);

    const dismiss = () => {
      const currentState = promo.dataset.state || "";
      if (currentState) setDismissedKey(currentState);
      promo.hidden = true;
    };

    close.addEventListener("click", dismiss);
    secondary.addEventListener("click", dismiss);

    document.addEventListener("tu-lang-changed", () => {
      syncLabels();
      refresh();
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      setDismissedKey("");
      refresh();
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      setInstalledHint(true);
      setDismissedKey("");
      refresh();
    });

    if (window.matchMedia) {
      const media = window.matchMedia(DISPLAY_MODE_QUERY);
      const listener = () => refresh();
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", listener);
      } else if (typeof media.addListener === "function") {
        media.addListener(listener);
      }
    }

    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
