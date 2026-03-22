(() => {
  "use strict";

  if (window.TUOnlineEmptyScene) return;

  function init(mount) {
    if (!mount || mount.dataset.sceneBooted === "true" || !window.THREE) return;
    mount.dataset.sceneBooted = "true";

    const THREE = window.THREE;
    const prefersReducedMotion =
      !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory > 0 && navigator.deviceMemory < 4;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowMemory,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch (_) {
      mount.dataset.sceneBooted = "failed";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowMemory ? 1.2 : 1.6));
    renderer.setClearColor(0x000000, 0);
    if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(0, 0, 5.35);

    const root = new THREE.Group();
    scene.add(root);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));

    const keyLight = new THREE.PointLight(0xc9a227, 2.1, 12, 2);
    keyLight.position.set(1.6, 1.35, 3.2);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xf5e3a8, 1.2, 12, 2);
    rimLight.position.set(-2.1, -0.3, 2.6);
    scene.add(rimLight);

    const shadowLight = new THREE.PointLight(0x6f5410, 0.8, 10, 2);
    shadowLight.position.set(0, -2.6, 1.1);
    scene.add(shadowLight);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.07, 22, 96),
      new THREE.MeshStandardMaterial({
        color: 0xb9931c,
        emissive: 0xa77b12,
        emissiveIntensity: 0.18,
        metalness: 0.52,
        roughness: 0.34,
      })
    );
    root.add(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.035, 18, 72),
      new THREE.MeshStandardMaterial({
        color: 0xe8d5a0,
        emissive: 0xcaa635,
        emissiveIntensity: 0.22,
        metalness: 0.24,
        roughness: 0.42,
        transparent: true,
        opacity: 0.92,
      })
    );
    innerRing.rotation.x = Math.PI / 2;
    root.add(innerRing);

    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x241c12,
        emissive: 0x3b2c12,
        emissiveIntensity: 0.12,
        metalness: 0.18,
        roughness: 0.72,
      })
    );
    dial.rotation.x = Math.PI / 2;
    root.add(dial);

    const centerCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 22, 22),
      new THREE.MeshStandardMaterial({
        color: 0xf1dfac,
        emissive: 0xc9a227,
        emissiveIntensity: 0.28,
        metalness: 0.34,
        roughness: 0.3,
      })
    );
    centerCap.position.z = 0.06;
    root.add(centerCap);

    const tickGeometry = new THREE.BoxGeometry(0.055, 0.22, 0.06);
    const tickMaterial = new THREE.MeshStandardMaterial({
      color: 0xefddb0,
      emissive: 0xbd9426,
      emissiveIntensity: 0.08,
      metalness: 0.3,
      roughness: 0.44,
    });

    for (let index = 0; index < 12; index += 1) {
      const tick = new THREE.Mesh(tickGeometry, tickMaterial);
      const angle = (index / 12) * Math.PI * 2;
      tick.position.set(Math.sin(angle) * 0.95, Math.cos(angle) * 0.95, 0.07);
      tick.rotation.z = -angle;
      root.add(tick);
    }

    const hands = new THREE.Group();
    hands.position.z = 0.09;
    root.add(hands);

    function makeHand(length, width, color, emissiveIntensity) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, length, 0.045),
        new THREE.MeshStandardMaterial({
          color,
          emissive: 0xc9a227,
          emissiveIntensity,
          metalness: 0.26,
          roughness: 0.35,
        })
      );
      mesh.position.y = length * 0.5 - 0.08;
      return mesh;
    }

    const hourHandPivot = new THREE.Group();
    hourHandPivot.add(makeHand(0.55, 0.1, 0xf0deb1, 0.12));
    hands.add(hourHandPivot);

    const minuteHandPivot = new THREE.Group();
    minuteHandPivot.add(makeHand(0.82, 0.065, 0xe4c768, 0.14));
    hands.add(minuteHandPivot);

    const secondsHandPivot = new THREE.Group();
    const secondsHand = makeHand(0.95, 0.03, 0xc98b27, 0.22);
    secondsHand.position.y = 0.38;
    secondsHandPivot.add(secondsHand);
    hands.add(secondsHandPivot);

    const orbitGroup = new THREE.Group();
    root.add(orbitGroup);

    const orbitOne = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.02, 16, 88),
      new THREE.MeshStandardMaterial({
        color: 0x8d6a12,
        emissive: 0x8d6a12,
        emissiveIntensity: 0.1,
        metalness: 0.12,
        roughness: 0.6,
        transparent: true,
        opacity: 0.72,
      })
    );
    orbitOne.rotation.x = 1.02;
    orbitGroup.add(orbitOne);

    const orbitTwo = orbitOne.clone();
    orbitTwo.rotation.x = 2.14;
    orbitTwo.rotation.y = 0.62;
    orbitTwo.scale.setScalar(0.86);
    orbitGroup.add(orbitTwo);

    const particleCount = lowMemory ? 28 : 44;
    const particles = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.1 + Math.random() * 1.05;
      particles[stride] = Math.cos(angle) * radius;
      particles[stride + 1] = Math.sin(angle) * radius;
      particles[stride + 2] = (Math.random() - 0.5) * 1.2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particles, 3));
    const particleCloud = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xf1dd98,
        size: lowMemory ? 0.045 : 0.055,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    root.add(particleCloud);

    let rafId = 0;
    let inView = true;
    let docVisible = !document.hidden;
    let hoverX = 0;
    let hoverY = 0;
    let targetHoverX = 0;
    let targetHoverY = 0;

    function setSize() {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderFrame();
    }

    function renderFrame() {
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      mount.classList.add("is-ready");
    }

    function updateClockHands(now) {
      const milliseconds = now.getMilliseconds() / 1000;
      const seconds = now.getSeconds() + milliseconds;
      const minutes = now.getMinutes() + seconds / 60;
      const hours = (now.getHours() % 12) + minutes / 60;

      hourHandPivot.rotation.z = -(hours / 12) * Math.PI * 2;
      minuteHandPivot.rotation.z = -(minutes / 60) * Math.PI * 2;
      secondsHandPivot.rotation.z = -(seconds / 60) * Math.PI * 2;
    }

    function animate() {
      rafId = 0;
      if (!inView || !docVisible) return;

      const now = new Date();
      const time = performance.now() * 0.001;

      hoverX += (targetHoverX - hoverX) * 0.08;
      hoverY += (targetHoverY - hoverY) * 0.08;

      updateClockHands(now);

      root.rotation.x = hoverY * 0.18;
      root.rotation.y = time * 0.18 + hoverX * 0.26;
      root.position.y = Math.sin(time * 0.7) * 0.06;

      outerRing.rotation.z = time * 0.34;
      innerRing.rotation.z = -time * 0.28;
      orbitGroup.rotation.z = time * 0.12;
      orbitGroup.rotation.x = 1.02 + Math.sin(time * 0.45) * 0.08;
      particleCloud.rotation.z = -time * 0.08;

      camera.position.x = hoverX * 0.14;
      camera.position.y = hoverY * -0.12;
      camera.position.z = 5.35 + Math.sin(time * 0.4) * 0.08;

      renderFrame();
      if (prefersReducedMotion) return;
      rafId = window.requestAnimationFrame(animate);
    }

    function start() {
      if (!inView || !docVisible) return;
      if (prefersReducedMotion) {
        animate();
        return;
      }
      if (!rafId) rafId = window.requestAnimationFrame(animate);
    }

    function stop() {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    mount.addEventListener("pointermove", (event) => {
      const rect = mount.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
      targetHoverX = Math.max(-1, Math.min(1, x));
      targetHoverY = Math.max(-1, Math.min(1, y));
      if (prefersReducedMotion) renderFrame();
    }, { passive: true });

    mount.addEventListener("pointerleave", () => {
      targetHoverX = 0;
      targetHoverY = 0;
      if (prefersReducedMotion) renderFrame();
    }, { passive: true });

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(mount);

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      inView = !!(entry && entry.isIntersecting);
      if (inView) start();
      else stop();
    }, { threshold: 0.12 });
    intersectionObserver.observe(mount);

    document.addEventListener("visibilitychange", () => {
      docVisible = !document.hidden;
      if (docVisible) start();
      else stop();
    });

    setSize();
    start();
  }

  window.TUOnlineEmptyScene = { init };
})();
