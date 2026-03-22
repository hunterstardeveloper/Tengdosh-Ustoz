# Tengdosh Ustoz PWA patch

This package only contains the files that were added or changed.

## Where to put them

Copy these files into your project root and let them replace the old ones:

- `index.html`
- `home.html`
- `style.css`
- `sw.js`
- `manifest.webmanifest`

Copy these into your `assets/` folder:

- `assets/pwa-install.js`
- `assets/pwa-icon-180.png`
- `assets/pwa-icon-192.png`
- `assets/pwa-icon-512.png`

## Result

After copying them:

- the site gets a real web manifest
- the home page shows an install/download promo card
- iPhone users get the Safari "Add to Home Screen" hint
- the service worker caches the new PWA files too

## Important

- Keep `manifest.webmanifest` in the project root
- Keep the icon files inside `assets/`
- If your site is hosted inside a subfolder instead of the domain root, update the paths inside `manifest.webmanifest`
- Hard refresh once after deploy so the new service worker and manifest are picked up
