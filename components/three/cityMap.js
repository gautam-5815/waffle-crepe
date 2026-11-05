// "Waffle-grid Dubai": an abstract 3D map where city blocks are waffle cells and both kitchens are pinned.
// Positions are projected from real coordinates; the scene is illustrative, not a street map.
import * as THREE from 'three';

const ORIGIN = { lat: 25.075, lon: 55.326 };
const SCALE = 42; // world units per degree
export function project(lat, lon) {
  return new THREE.Vector3((lon - ORIGIN.lon) * SCALE, 0, -(lat - ORIGIN.lat) * SCALE);
}

function noise(x, z) {
  return (Math.sin(x * 1.7 + z * 0.6) * Math.cos(z * 1.3 - x * 0.4) + Math.sin(x * 0.5 + z * 2.1) * 0.5) * 0.5 + 0.5;
}

export function createCityMap(canvas, labelsEl, places) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight('#FFF3DC', '#6B4A33', 1.2));
  const sun = new THREE.DirectionalLight('#FFE2B0', 2.2);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#FFB81C', 1.2);
  rim.position.set(-8, 4, -6);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);

  // Waffle base: a thick golden slab the city sits in.
  const SIZE = 12.5;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(SIZE + 0.6, 0.5, SIZE + 0.6),
    new THREE.MeshStandardMaterial({ color: '#C98632', roughness: 0.7 })
  );
  base.position.y = -0.25;
  base.receiveShadow = true;
  world.add(base);

  const pinsPos = places.map((p) => project(p.lat, p.lon));
  const routeA = pinsPos[0], routeB = pinsPos[1];
  const distToRoute = (x, z) => {
    const ab = new THREE.Vector2(routeB.x - routeA.x, routeB.z - routeA.z);
    const ap = new THREE.Vector2(x - routeA.x, z - routeA.z);
    const t = THREE.MathUtils.clamp(ap.dot(ab) / ab.lengthSq(), 0, 1);
    return ap.sub(ab.multiplyScalar(t)).length();
  };

  // City blocks = waffle cells (instanced).
  const cell = 0.5, gap = 0.1;
  const n = Math.floor(SIZE / cell);
  const geo = new THREE.BoxGeometry(cell - gap, 1, cell - gap);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const blocks = new THREE.InstancedMesh(geo, mat, n * n);
  blocks.castShadow = blocks.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  const palette = ['#F3D9A4', '#E8B86A', '#E3A24B', '#F7E9CF'];
  const heights = [];
  let i = 0;
  for (let gx = 0; gx < n; gx++) {
    for (let gz = 0; gz < n; gz++) {
      const x = -SIZE / 2 + cell / 2 + gx * cell;
      const z = -SIZE / 2 + cell / 2 + gz * cell;
      let h = 0.08 + Math.pow(noise(x * 0.6, z * 0.6), 2.2) * 0.9;
      const nearPin = Math.min(...pinsPos.map((p) => Math.hypot(p.x - x, p.z - z)));
      if (nearPin < 1.6) h += (1.6 - nearPin) * 0.5 * noise(x * 3, z * 3); // denser around each kitchen
      if (nearPin < 0.45) h = 0.06; // plaza under each pin
      const onRoute = distToRoute(x, z) < 0.28;
      if (onRoute) h = 0.04;
      heights.push(h);
      m4.makeScale(1, h, 1).setPosition(x, 0, z);
      blocks.setMatrixAt(i, m4);
      col.set(onRoute ? '#2A160B' : palette[(gx * 7 + gz * 3) % palette.length]);
      blocks.setColorAt(i, col);
      i++;
    }
  }
  world.add(blocks);

  // Delivery route: a syrup line between the kitchens with a moving "scooter" bead.
  const mid = routeA.clone().lerp(routeB, 0.5).add(new THREE.Vector3(0, 1.6, 0));
  const curve = new THREE.QuadraticBezierCurve3(routeA.clone().setY(0.15), mid, routeB.clone().setY(0.15));
  const route = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 120, 0.035, 8, false),
    new THREE.MeshPhysicalMaterial({ color: '#C8691C', roughness: 0.2, clearcoat: 1 })
  );
  world.add(route);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), new THREE.MeshStandardMaterial({ color: '#FFB81C', emissive: '#FF9A00', emissiveIntensity: 0.6 }));
  world.add(bead);

  // Pins.
  const pins = places.map((p, idx) => {
    const g = new THREE.Group();
    const color = idx === 0 ? '#D7263D' : '#2A160B';
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 20), new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1 }));
    head.position.y = 1.35;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 32, 1, true), new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1 }));
    cone.rotation.x = Math.PI;
    cone.position.y = 0.85;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshStandardMaterial({ color: '#FFF6E6' }));
    dot.position.y = 1.35;
    dot.position.z = 0.28;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 48), new THREE.MeshBasicMaterial({ color: '#FFB81C', transparent: true, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    head.castShadow = cone.castShadow = true;
    g.add(cone, head, dot, ring);
    g.position.copy(pinsPos[idx]);
    world.add(g);
    return { group: g, ring, head, place: p };
  });

  // HTML labels that follow the pins.
  const labels = places.map((p) => {
    const el = document.createElement('button');
    el.className = 'maplabel';
    el.type = 'button';
    el.innerHTML = `<strong>${p.short}</strong><span>${p.area}</span>`;
    el.addEventListener('click', () => p.onSelect?.());
    labelsEl.appendChild(el);
    return el;
  });

  // Camera rig: orbit around a target, fly to a pin on focus().
  const rig = { target: new THREE.Vector3(0, 0, 0), radius: 18, angle: 0.6, height: 11.5 };
  const goal = { ...rig, target: rig.target.clone() };
  let auto = true;
  let focused = -1;

  function focus(idx) {
    focused = idx;
    auto = idx < 0;
    if (idx < 0) { goal.target.set(0, 0, 0); goal.radius = 18; goal.height = 11.5; return; }
    goal.target.copy(pinsPos[idx]);
    goal.radius = 6.5;
    goal.height = 4.6;
  }

  const pointer = { x: 0, y: 0 };
  const onPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width - 0.5;
    pointer.y = (e.clientY - r.top) / r.height - 0.5;
  };
  canvas.addEventListener('pointermove', onPointer);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  let raf = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (auto && !reduce) goal.angle += dt * 0.08;
    const k = 1 - Math.exp(-dt * 3);
    rig.target.lerp(goal.target, k);
    rig.radius += (goal.radius - rig.radius) * k;
    rig.height += (goal.height - rig.height) * k;
    rig.angle += (goal.angle + pointer.x * 0.4 - rig.angle) * k;
    camera.position.set(
      rig.target.x + Math.sin(rig.angle) * rig.radius,
      rig.height - pointer.y * 1.5,
      rig.target.z + Math.cos(rig.angle) * rig.radius
    );
    camera.lookAt(rig.target);

    if (!reduce) {
      bead.position.copy(curve.getPoint((Math.sin(t * 0.5) + 1) / 2));
      pins.forEach((p, idx) => {
        p.head.position.y = 1.35 + Math.sin(t * 2 + idx) * 0.06;
        const s = 1 + ((t * 0.8 + idx * 0.5) % 1) * 2.2;
        p.ring.scale.setScalar(s);
        p.ring.material.opacity = 1 - (s - 1) / 2.2;
      });
    } else bead.position.copy(curve.getPoint(0.5));

    // Project labels.
    const w = canvas.clientWidth, h = canvas.clientHeight;
    pins.forEach((p, idx) => {
      tmp.copy(p.group.position).setY(2.05).project(camera);
      const el = labels[idx];
      el.style.transform = `translate(-50%, -100%) translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px)`;
      el.classList.toggle('is-active', focused === idx);
    });
    renderer.render(scene, camera);
  }
  frame();

  return {
    focus,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onPointer);
      labels.forEach((el) => el.remove());
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => m.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
