(function () {
  "use strict";

  function parseQuote(raw) {
    const lastDash = String(raw).lastIndexOf(" - ");
    if (lastDash === -1) return { raw: raw, text: raw, author: "" };
    return {
      raw: raw,
      text: String(raw).slice(0, lastDash).trim(),
      author: String(raw).slice(lastDash + 3).trim(),
    };
  }

  function quoteIdFromRaw(raw) {
    let hash = 5381;
    const input = String(raw || "").trim();
    for (let index = 0; index < input.length; index += 1) {
      hash = ((hash << 5) + hash) + input.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  function requireTU() {
    if (!window.TU || !window.TU.db || !window.TU.auth) {
      throw new Error("TU is not available. Did you include /assets/tu-firebase.js and call TU.init()?");
    }
    return window.TU;
  }

  async function getQuoteCount(quoteId) {
    const tu = requireTU();
    const snap = await tu.db.ref(`quoteLikes/${quoteId}/count`).once("value");
    return Number(snap.val() || 0);
  }

  async function watchQuoteCount(db, quoteId, callback) {
    const ref = db.ref(`quoteLikes/${quoteId}/count`);
    const handler = ref.on(
      "value",
      (snap) => callback(Number(snap.val() || 0)),
      () => callback(0)
    );
    return function stopWatching() {
      ref.off("value", handler);
    };
  }

  async function watchUserLike(db, uid, quoteId, callback) {
    const ref = db.ref(`userLikes/${uid}/${quoteId}`);
    const handler = ref.on(
      "value",
      (snap) => callback(!!snap.val()),
      () => callback(false)
    );
    return function stopWatching() {
      ref.off("value", handler);
    };
  }

  async function toggleLike(db, auth, quoteId, meta) {
    const tu = requireTU();
    const user = auth && auth.currentUser ? auth.currentUser : null;
    if (!user) {
      if (typeof tu.requireLogin === "function") {
        tu.requireLogin(tu.auth || auth);
      } else {
        window.location.href = "/auth/login.html";
      }
      return { liked: false, redirected: true };
    }

    const uid = user.uid;
    const likeRef = db.ref(`userLikes/${uid}/${quoteId}`);
    const countRef = db.ref(`quoteLikes/${quoteId}/count`);
    const metaRef = db.ref(`quoteMeta/${quoteId}`);
    const likeSnap = await likeRef.once("value");
    const liked = !!likeSnap.val();

    if (liked) {
      await likeRef.remove();
      await countRef.transaction((current) => Math.max(0, Number(current || 0) - 1));
    } else {
      await likeRef.set({
        uid: uid,
        quoteId: String(quoteId),
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });
      await countRef.transaction((current) => Number(current || 0) + 1);
    }

    if (meta && typeof meta === "object") {
      await metaRef.update({
        quoteId: String(quoteId),
        raw: meta.raw || null,
        text: meta.text || null,
        author: meta.author || null,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
      });
    }

    return { liked: !liked, committed: true };
  }

  window.TUQuoteLikes = {
    parseQuote: parseQuote,
    quoteIdFromRaw: quoteIdFromRaw,
    getQuoteCount: getQuoteCount,
    watchQuoteCount: watchQuoteCount,
    watchUserLike: watchUserLike,
    toggleLike: toggleLike,
    requireTU: requireTU,
  };
})();
