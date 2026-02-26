
(function () {
  const htmlEl = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

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

  function setTheme(isDark, persist) {
    if (isDark) {
      htmlEl.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.innerHTML = sunSVG;
      if (persist) persistTheme('dark');
    } else {
      htmlEl.removeAttribute('data-theme');
      if (themeIcon) themeIcon.innerHTML = moonSVG;
      if (persist) persistTheme('light');
    }
  }

  async function persistTheme(value){
    
    try {
      if (window.TU && TU.db && TU.auth && TU.auth.currentUser) {
        await TU.db.ref(`users/${TU.auth.currentUser.uid}/prefs/theme`).set(value);
        return;
      }
    } catch (e) {}
    try { sessionStorage.setItem('tu_theme', value); } catch (e) {}
  }

  function getGuestTheme(){
    try { return sessionStorage.getItem('tu_theme'); } catch(e) { return null; }
  }

  
  
  
  const guest = getGuestTheme();
  if (guest === 'dark') setTheme(true, false);
  else if (guest === 'light') setTheme(false, false);
  else {
    // Default theme: DARK (ignore system preference)
    setTheme(true, false);
  }

  
  async function syncFromFirebase(){
    try {
      if (!(window.TU && TU.db && TU.auth && TU.auth.currentUser)) return;
      const snap = await TU.db.ref(`users/${TU.auth.currentUser.uid}/prefs/theme`).once('value');
      const v = snap.val();
      if (v === 'dark') setTheme(true, false);
      if (v === 'light') setTheme(false, false);
    } catch (e) {}
  }
  document.addEventListener('tu-auth-changed', () => syncFromFirebase());
  syncFromFirebase();

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = htmlEl.getAttribute('data-theme') === 'dark';
      setTheme(!isDark, true);
    });
  }
})();


window.toggleReadMore = function toggleReadMore(id, btn) {
  const text = document.getElementById(id);
  if (!text) return;

  const allTexts = document.querySelectorAll('.description-container p');
  const allBtns  = document.querySelectorAll('.read-more-btn');

  const isCollapsed = text.classList.contains('collapsed');

  
  allTexts.forEach(p => {
    p.classList.remove('expanded');
    p.classList.add('collapsed');
    
    if (p.scrollTop) p.scrollTop = 0;
  });
  allBtns.forEach(b => { b.innerText = 'Read More'; });

  
  if (isCollapsed) {
    text.classList.remove('collapsed');
    text.classList.add('expanded');
    if (btn) btn.innerText = 'Show Less';
  }
};
