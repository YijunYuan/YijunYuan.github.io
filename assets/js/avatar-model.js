(() => {
  'use strict';
  const host = document.querySelector('.avatar-model');
  if (!host) return;
  function showFallback() {
    host.classList.remove('is-ready');
    host.classList.add('is-fallback');
  }
  if (!window.THREE || !THREE.GLTFLoader || !THREE.DRACOLoader) {
    showFallback();
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (error) {
    console.warn('3D avatar unavailable; using portrait.', error);
    showFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', '3D portrait of ' + document.querySelector('header h1').textContent);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  const pivot = new THREE.Group();
  scene.add(pivot);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let targetX = 0;
  let targetY = 0;

  function render(time) {
    frame = 0;
    if (!ready || !visible || document.hidden) return;
    const dt = Math.min((time - lastTime) / 1000 || 1 / 60, 0.05);
    lastTime = time;
    const blend = 1 - Math.exp(-9 * dt);
    pivot.rotation.x += (targetX - pivot.rotation.x) * blend;
    pivot.rotation.y += (targetY - pivot.rotation.y) * blend;
    renderer.render(scene, camera);
    if (Math.abs(targetX - pivot.rotation.x) + Math.abs(targetY - pivot.rotation.y) > 0.0001) requestRender();
  }
  function requestRender() {
    if (!frame && ready && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Frame the portrait more closely while leaving room for the limited head turns.
    camera.position.z = 0.90 / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(camera.aspect, 1);
    camera.updateProjectionMatrix();
    requestRender();
  }
  function reset() {
    targetX = targetY = 0;
    if (motion.matches) pivot.rotation.set(0, 0, 0);
    requestRender();
  }
  document.addEventListener('pointermove', (event) => {
    if (motion.matches || event.pointerType === 'touch') return;
    const rect = host.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    targetY = THREE.MathUtils.clamp(dx / (innerWidth * 0.45), -1, 1) * 0.48;
    targetX = THREE.MathUtils.clamp(dy / (innerHeight * 0.45), -1, 1) * 0.28;
    requestRender();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => document.hidden ? reset() : requestRender());
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    requestRender();
  }).observe(host);

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    ready = false;
    showFallback();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    ready = pivot.children.length > 0;
    host.classList.toggle('is-fallback', !ready);
    host.classList.toggle('is-ready', ready);
    requestRender();
  });

  const draco = new THREE.DRACOLoader().setDecoderPath(host.dataset.draco);
  const loader = new THREE.GLTFLoader().setDRACOLoader(draco);
  loader.load(host.dataset.model, (gltf) => {
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    model.position.sub(center);
    const normalized = new THREE.Group();
    normalized.add(model);
    normalized.scale.setScalar(1 / radius);
    pivot.add(normalized);
    ready = true;
    resize();
    renderer.render(scene, camera);
    host.classList.remove('is-fallback');
    host.classList.add('is-ready');
    draco.dispose();
  }, undefined, (error) => {
    console.warn('3D avatar failed to load; using portrait.', error);
    showFallback();
    draco.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  });
})();
