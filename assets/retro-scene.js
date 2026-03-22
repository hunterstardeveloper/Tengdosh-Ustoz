(function () {
  "use strict";

  if (window.__TU_RETRO_SCENE__) return;
  window.__TU_RETRO_SCENE__ = true;

  if (!window.THREE) return;
  if (document.body?.dataset?.noRetroScene === "true") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const path = decodeURIComponent(location.pathname || "");
  if (path.includes("/pages/private chat/")) return;

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    zIndex: "0",
    pointerEvents: "none",
    opacity: "0.9",
    overflow: "hidden",
  });
  document.body.prepend(container);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);
  const baseCameraPosition = new THREE.Vector3(0, 0.4, 8.8);
  camera.position.copy(baseCameraPosition);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const root = new THREE.Group();
  scene.add(root);

  const dustGroup = new THREE.Group();
  scene.add(dustGroup);

  const rings = [];
  const folios = [];
  let dust = null;
  let dustPositions = null;

  const pointer = { x: 0, y: 0 };
  const palette = () => {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") {
      return {
        accent: 0xc9a227,
        accentSoft: 0x8f6f18,
        body: 0x2a221b,
        page: 0xebe0c8,
        glow: 0xd4b252,
      };
    }
    return {
      accent: 0x8b6914,
      accentSoft: 0xb48d33,
      body: 0xe9dcc8,
      page: 0xfffbf3,
      glow: 0x8b6914,
    };
  };

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
  }

  function buildFolios() {
    clearGroup(root);
    folios.length = 0;
    rings.length = 0;

    const colors = palette();

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(colors.glow, 1.35);
    key.position.set(4, 6, 5);
    scene.add(key);

    const rim = new THREE.PointLight(colors.accent, 1.5, 18);
    rim.position.set(-4.8, 1.8, -3.2);
    scene.add(rim);

    const folioGeo = new THREE.BoxGeometry(1.1, 1.5, 0.08);
    const pageGeo = new THREE.BoxGeometry(0.92, 1.32, 0.025);
    const spineGeo = new THREE.BoxGeometry(0.12, 1.46, 0.1);

    for (let i = 0; i < 11; i++) {
      const group = new THREE.Group();

      const cover = new THREE.Mesh(
        folioGeo,
        new THREE.MeshStandardMaterial({
          color: colors.body,
          metalness: 0.18,
          roughness: 0.6,
        })
      );

      const pages = new THREE.Mesh(
        pageGeo,
        new THREE.MeshStandardMaterial({
          color: colors.page,
          metalness: 0.05,
          roughness: 0.84,
        })
      );
      pages.position.z = 0.03;

      const spine = new THREE.Mesh(
        spineGeo,
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? colors.accent : colors.accentSoft,
          metalness: 0.24,
          roughness: 0.48,
        })
      );
      spine.position.x = -0.48;

      group.add(cover, pages, spine);

      const angle = (i / 11) * Math.PI * 2;
      const radius = 2.15 + (i % 3) * 0.55;
      group.position.set(Math.cos(angle) * radius, -1.15 + i * 0.23, Math.sin(angle) * radius * 0.7);
      group.rotation.set(0.28 + (i % 3) * 0.08, angle + 0.2, (i % 2 ? -1 : 1) * 0.26);
      const scale = 0.72 + (i % 4) * 0.08;
      group.scale.setScalar(scale);
      root.add(group);

      folios.push({ group, angle, radius, lift: i * 0.28, wobble: 0.3 + (i % 4) * 0.08, baseScale: scale });
    }

    [3.4, 5.6].forEach((radius, idx) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.024, 12, 140),
        new THREE.MeshBasicMaterial({
          color: idx === 0 ? colors.accent : colors.accentSoft,
          transparent: true,
          opacity: idx === 0 ? 0.22 : 0.14,
        })
      );
      ring.rotation.set(Math.PI / 2.2, 0.25 + idx * 0.4, idx * 0.35);
      root.add(ring);
      rings.push(ring);
    });
  }

  function buildDust() {
    if (dust) {
      scene.remove(dust);
      dust.geometry.dispose();
      dust.material.dispose();
    }

    const colors = palette();
    const particleCount = 170;
    dustPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 16;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));

    dust = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: colors.glow,
        size: 0.04,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
      })
    );

    scene.add(dust);
  }

  function rebuild() {
    scene.children
      .filter((child) => child.isLight)
      .forEach((light) => scene.remove(light));
    buildFolios();
    buildDust();
  }

  rebuild();

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  const themeObserver = new MutationObserver(() => rebuild());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let time = 0;
  function animate() {
    time += 0.008;
    const pulseScale = 1 + Math.sin(time * 1.2) * 0.012;
    const targetRootY = Math.sin(time * 0.72) * 0.06;
    const targetRootZ = 0;

    root.rotation.y += (pointer.x * 0.18 - root.rotation.y) * 0.035;
    root.rotation.x += (-pointer.y * 0.08 - root.rotation.x) * 0.035;
    root.position.y += (targetRootY - root.position.y) * 0.055;
    root.position.z += (targetRootZ - root.position.z) * 0.06;
    root.scale.setScalar(pulseScale);
    camera.position.z += (baseCameraPosition.z - camera.position.z) * 0.06;
    camera.position.y += (baseCameraPosition.y - camera.position.y) * 0.05;
    camera.fov += (42 - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    container.style.transform = "translate3d(0, 0, 0) scale(1)";
    container.style.opacity = "0.9";

    folios.forEach((folio, index) => {
      const drift = time * (0.28 + index * 0.012);
      const angle = folio.angle + drift;
      folio.group.position.x = Math.cos(angle) * folio.radius;
      folio.group.position.z = Math.sin(angle) * folio.radius * 0.66;
      folio.group.position.y = Math.sin(time * folio.wobble + folio.lift) * 0.35 + (index - 5) * 0.18;
      folio.group.rotation.y += 0.003 + index * 0.00008;
      folio.group.rotation.z = Math.sin(time * 1.2 + folio.lift) * 0.18;
      folio.group.scale.setScalar(folio.baseScale);
    });

    rings.forEach((ring, index) => {
      ring.rotation.z += 0.0015 + index * 0.0008;
      ring.rotation.x = Math.PI / 2.2 + Math.sin(time * (0.6 + index * 0.2)) * 0.08;
    });

    if (dust && dustPositions) {
      for (let i = 0; i < dustPositions.length; i += 3) {
        dustPositions[i + 1] += Math.sin(time + i) * 0.0005;
      }
      if (dust.material) {
        dust.material.size = 0.04;
        dust.material.opacity = 0.58;
      }
      dust.geometry.attributes.position.needsUpdate = true;
      dust.rotation.y += 0.0006;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
