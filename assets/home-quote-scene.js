(() => {
  "use strict";

  if (window.TUQuoteScene) return;

  function getPalette() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    return dark
      ? {
          core: 0xece1c8,
          glow: 0xc9a227,
          ring: 0xa88a29,
          panel: 0x2a2217,
          panelEdge: 0xd7c082,
          spark: 0xf0dc9a,
          fog: 0x15120f,
        }
      : {
          core: 0x3f3321,
          glow: 0xa67a18,
          ring: 0xb88c1d,
          panel: 0xe9dcc0,
          panelEdge: 0x7f5b17,
          spark: 0xa17618,
          fog: 0xf6efe1,
        };
  }

  function init(stage) {
    if (!stage || stage.dataset.sceneBooted === "true" || !window.THREE) return;
    stage.dataset.sceneBooted = "true";

    const mount = stage.querySelector(".quote-scene-canvas");
    const fallback = stage.querySelector(".quote-scene-fallback");
    if (!mount) return;

    const THREE = window.THREE;
    const prefersReducedMotion =
      !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const lowMemory =
      typeof navigator.deviceMemory === "number" &&
      navigator.deviceMemory > 0 &&
      navigator.deviceMemory < 4;
    const compact = window.innerWidth < 760;
    const particleCount = compact ? 36 : lowMemory ? 44 : 68;
    const cardCount = compact ? 5 : 7;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowMemory,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch (_) {
      stage.dataset.sceneBooted = "failed";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowMemory ? 1.2 : 1.6));
    renderer.setClearColor(0x000000, 0);
    if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const palette = getPalette();
    scene.fog = new THREE.Fog(palette.fog, 5.8, 11.8);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0.18, 6.25);

    const root = new THREE.Group();
    root.rotation.x = -0.14;
    scene.add(root);

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(palette.glow, compact ? 2.1 : 2.6, 14, 2);
    keyLight.position.set(0, 0.1, 2.8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.95);
    rimLight.position.set(-2.8, 2.6, 3.1);
    scene.add(rimLight);

    const floorLight = new THREE.PointLight(palette.ring, 1.3, 10, 2);
    floorLight.position.set(0, -1.7, 1.2);
    scene.add(floorLight);

    const materials = {};

    materials.core = new THREE.MeshStandardMaterial({
      color: palette.core,
      emissive: palette.glow,
      emissiveIntensity: 0.22,
      metalness: 0.22,
      roughness: 0.34,
    });

    materials.inner = new THREE.MeshStandardMaterial({
      color: palette.glow,
      emissive: palette.glow,
      emissiveIntensity: 0.4,
      metalness: 0.18,
      roughness: 0.42,
    });

    materials.ring = new THREE.MeshStandardMaterial({
      color: palette.ring,
      emissive: palette.glow,
      emissiveIntensity: 0.24,
      metalness: 0.42,
      roughness: 0.36,
      transparent: true,
      opacity: 0.95,
    });

    materials.panel = new THREE.MeshStandardMaterial({
      color: palette.panel,
      emissive: palette.ring,
      emissiveIntensity: 0.08,
      metalness: 0.16,
      roughness: 0.52,
    });

    materials.edge = new THREE.LineBasicMaterial({
      color: palette.panelEdge,
      transparent: true,
      opacity: 0.72,
    });

    materials.spark = new THREE.PointsMaterial({
      color: palette.spark,
      size: compact ? 0.04 : 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(compact ? 0.78 : 0.92, 1),
      materials.core
    );
    root.add(core);

    const innerCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(compact ? 0.34 : 0.4, 0),
      materials.inner
    );
    innerCore.rotation.z = Math.PI / 4;
    root.add(innerCore);

    const ringGroup = new THREE.Group();
    root.add(ringGroup);

    const ringOne = new THREE.Mesh(
      new THREE.TorusGeometry(compact ? 1.42 : 1.6, 0.045, 18, 96),
      materials.ring
    );
    ringOne.rotation.x = Math.PI / 2;
    ringOne.rotation.z = 0.35;
    ringGroup.add(ringOne);

    const ringTwo = new THREE.Mesh(
      new THREE.TorusGeometry(compact ? 1.1 : 1.26, 0.03, 18, 72),
      materials.ring
    );
    ringTwo.rotation.x = 1.16;
    ringTwo.rotation.y = 0.64;
    ringGroup.add(ringTwo);

    const slabGroup = new THREE.Group();
    root.add(slabGroup);

    const slabGeometry = new THREE.BoxGeometry(0.36, 1.28, 0.08);
    const slabEdgeGeometry = new THREE.EdgesGeometry(slabGeometry);
    const slabs = [];

    for (let index = 0; index < cardCount; index += 1) {
      const holder = new THREE.Group();
      const mesh = new THREE.Mesh(slabGeometry, materials.panel);
      const edges = new THREE.LineSegments(slabEdgeGeometry, materials.edge);
      holder.add(mesh);
      holder.add(edges);
      const angle = (index / cardCount) * Math.PI * 2;
      const radius = compact ? 1.85 : 2.1;
      holder.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.35) * 0.55,
        Math.sin(angle) * 0.75
      );
      holder.rotation.y = angle + Math.PI * 0.5;
      holder.rotation.z = (index % 2 === 0 ? 1 : -1) * 0.22;
      holder.scale.y = 0.82 + ((index % 3) * 0.18);
      slabGroup.add(holder);
      slabs.push(holder);
    }

    const sparkPositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      const radius = 2.2 + Math.random() * 1.35;
      const angle = Math.random() * Math.PI * 2;
      sparkPositions[stride] = Math.cos(angle) * radius;
      sparkPositions[stride + 1] = (Math.random() - 0.5) * 2.6;
      sparkPositions[stride + 2] = (Math.random() - 0.5) * 2.2;
    }

    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparks = new THREE.Points(sparkGeometry, materials.spark);
    root.add(sparks);

    const clock = new THREE.Clock();
    let rafId = 0;
    let inView = true;
    let docVisible = !document.hidden;

    function applyPalette() {
      const next = getPalette();
      scene.fog.color.setHex(next.fog);
      materials.core.color.setHex(next.core);
      materials.core.emissive.setHex(next.glow);
      materials.inner.color.setHex(next.glow);
      materials.inner.emissive.setHex(next.glow);
      materials.ring.color.setHex(next.ring);
      materials.ring.emissive.setHex(next.glow);
      materials.panel.color.setHex(next.panel);
      materials.panel.emissive.setHex(next.ring);
      materials.edge.color.setHex(next.panelEdge);
      materials.spark.color.setHex(next.spark);
      keyLight.color.setHex(next.glow);
      floorLight.color.setHex(next.ring);
      renderFrame();
    }

    function setSize() {
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderFrame();
    }

    function renderFrame() {
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      stage.classList.add("is-ready");
      if (fallback) fallback.setAttribute("aria-hidden", "true");
    }

    function animate() {
      rafId = 0;
      if (!inView || !docVisible) return;

      const t = clock.getElapsedTime();
      root.rotation.y = t * 0.36;
      root.rotation.x = -0.14 + Math.sin(t * 0.7) * 0.045;
      root.position.y = Math.sin(t * 1.1) * 0.08;

      ringGroup.rotation.z = t * 0.22;
      ringOne.rotation.z = 0.35 + t * 0.52;
      ringTwo.rotation.z = -t * 0.44;
      innerCore.rotation.y = -t * 0.8;
      innerCore.rotation.x = t * 0.4;

      for (let index = 0; index < slabs.length; index += 1) {
        const slab = slabs[index];
        slab.position.y += Math.sin(t * 1.15 + index * 0.7) * 0.0016;
        slab.rotation.x = Math.sin(t * 0.6 + index * 0.5) * 0.08;
      }

      sparks.rotation.y = -t * 0.14;
      sparks.rotation.x = Math.sin(t * 0.35) * 0.08;
      camera.position.z = 6.25 + Math.sin(t * 0.42) * 0.12;

      renderFrame();
      rafId = window.requestAnimationFrame(animate);
    }

    function start() {
      if (prefersReducedMotion || !inView || !docVisible || rafId) {
        renderFrame();
        return;
      }
      rafId = window.requestAnimationFrame(animate);
    }

    function stop() {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(stage);

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      inView = !!(entry && entry.isIntersecting);
      if (inView) start();
      else stop();
    }, { threshold: 0.12 });
    intersectionObserver.observe(stage);

    const themeObserver = new MutationObserver(applyPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    document.addEventListener("visibilitychange", () => {
      docVisible = !document.hidden;
      if (docVisible) start();
      else stop();
    });

    setSize();
    start();
  }

  window.TUQuoteScene = { init };
})();
