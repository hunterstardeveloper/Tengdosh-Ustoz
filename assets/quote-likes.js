(function(){
  // Quote Likes v1 (Realtime DB)
  // Schema:
  //   quoteLikes/{quoteId}/count: number
  //   quoteMeta/{quoteId}: { raw, text, author, updatedAt }
  //   userLikes/{uid}/{quoteId}: true

  function djb2(str){
    let h = 5381;
    for (let i=0;i<str.length;i++) h = ((h<<5)+h) + str.charCodeAt(i);
    // unsigned 32-bit -> base36
    return (h >>> 0).toString(36);
  }

  function parseQuote(raw){
    const lastDash = raw.lastIndexOf(' - ');
    if (lastDash === -1) return { raw, text: raw, author: '' };
    return {
      raw,
      text: raw.slice(0, lastDash).trim(),
      author: raw.slice(lastDash + 3).trim(),
    };
  }

  function quoteIdFromRaw(raw){
    return djb2(String(raw || '').trim());
  }

  function requireTU(){
    if (!window.TU) throw new Error('TU is not available. Did you include /assets/tu-firebase.js and call TU.init()?');
    if (!window.TU.db) throw new Error('TU.db is not ready. Make sure TU.init() ran after Firebase scripts loaded.');
    return window.TU;
  }

  async function ensureMeta(db, quoteId, meta){
    if (!db) return;
    const ref = db.ref(`quoteMeta/${quoteId}`);

    // Create once (atomic) — avoids race conditions.
    // NOTE: Requires RTDB rules that allow creating quoteMeta when it doesn't exist.
    await new Promise((resolve, reject) => {
      ref.transaction(
        (curr) => {
          if (curr) return curr; // already exists
          return {
            raw: meta.raw || null,
            text: meta.text || null,
            author: meta.author || null,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
          };
        },
        (err) => (err ? reject(err) : resolve()),
        false
      );
    });
  }

  function watchQuoteCount(db, quoteId, cb){
    const ref = db.ref(`quoteLikes/${quoteId}/count`);
    const handler = (snap) => cb(Number(snap.val() || 0));
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }

  function watchUserLike(db, uid, quoteId, cb){
    const ref = db.ref(`userLikes/${uid}/${quoteId}`);
    const handler = (snap) => cb(!!snap.val());
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }

  async function toggleLike(db, auth, quoteId, meta){
    const u = auth.currentUser;
    if (!u) {
      // redirect to login preserving return url
      if (window.TU && TU.requireLogin) TU.requireLogin(auth);
      else window.location.href = '/auth/login.html';
      return { liked: false, redirected: true };
    }

    const uid = u.uid;
    const likeRef = db.ref(`userLikes/${uid}/${quoteId}`);

    // Toggle user like atomically
    const result = await new Promise((resolve, reject) => {
      likeRef.transaction(
        (curr) => (curr ? null : true),
        (err, committed, snap) => {
          if (err) return reject(err);
          if (!committed) return resolve({ liked: !!snap.val(), committed: false });
          resolve({ liked: !!snap.val(), committed: true });
        },
        false
      );
    });

    if (!result.committed) return { liked: result.liked, committed: false };

    // Ensure meta exists (best effort)
    ensureMeta(db, quoteId, meta).catch(()=>{});

    // Update aggregate count
    const delta = result.liked ? 1 : -1;
    await new Promise((resolve, reject) => {
      db.ref(`quoteLikes/${quoteId}/count`).transaction(
        (c) => {
          const next = (Number(c || 0) + delta);
          return next < 0 ? 0 : next;
        },
        (err) => (err ? reject(err) : resolve())
      );
    });

    return { liked: result.liked, committed: true };
  }

  // Public API
  window.TUQuoteLikes = {
    parseQuote,
    quoteIdFromRaw,
    watchQuoteCount,
    watchUserLike,
    toggleLike,
    requireTU,
  };
})();
