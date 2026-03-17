(function(){
  
  
  
  
  

  function djb2(str){
    let h = 5381;
    for (let i=0;i<str.length;i++) h = ((h<<5)+h) + str.charCodeAt(i);
    
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

    
    
    await new Promise((resolve, reject) => {
      ref.transaction(
        (curr) => {
          if (curr) return curr; 
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
      
      if (window.TU && TU.requireLogin) TU.requireLogin(auth);
      else window.location.href = '/auth/login.html';
      return { liked: false, redirected: true };
    }

    const uid = u.uid;
    const likeRef = db.ref(`userLikes/${uid}/${quoteId}`);

    
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

    
    ensureMeta(db, quoteId, meta).catch(()=>{});

    
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

  
  window.TUQuoteLikes = {
    parseQuote,
    quoteIdFromRaw,
    watchQuoteCount,
    watchUserLike,
    toggleLike,
    requireTU,
  };
})();
