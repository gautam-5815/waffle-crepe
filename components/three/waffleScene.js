// Procedural 3D waffle scene (Three.js). No external models — everything is built from primitives.
import * as THREE from 'three';

const R = 2.2;            // waffle radius
const TOP = 0.175;        // top of the waffle base
const RIDGE_H = 0.28;
const SURFACE = TOP + RIDGE_H; // where toppings sit

const COLORS = {
  dough: '#E3A24B',
  doughDark: '#B9772C',
  plate: '#FBF4E8',
};

// Small seeded RNG so toppings land in the same place every time.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function inDisk(rand, maxR) {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * maxR;
  return [Math.cos(a) * r, Math.sin(a) * r];
}

function doughTexture() {
  // Subtle toasted speckle so the dough doesn't read as flat plastic.
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const v = 200 + Math.random() * 55;
    g.fillStyle = `rgba(${v},${v * 0.86},${v * 0.66},${Math.random() * 0.5})`;
    g.beginPath();
    g.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildWaffle() {
  const group = new THREE.Group();
  const tex = doughTexture();
  const dough = new THREE.MeshStandardMaterial({ color: COLORS.dough, roughness: 0.62, map: tex });
  const doughDark = new THREE.MeshStandardMaterial({ color: COLORS.doughDark, roughness: 0.7, map: tex });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.97, TOP * 2, 96), doughDark);
  base.castShadow = base.receiveShadow = true;
  group.add(base);

  // Grid ridges, clipped to the circle — this is what makes it a waffle.
  const cell = 0.44;
  const t = 0.12;
  for (let o = -R + cell; o < R - 0.05; o += cell) {
    const half = Math.sqrt(R * R - o * o) * 0.97;
    if (half < 0.2) continue;
    const geo = new THREE.BoxGeometry(half * 2, RIDGE_H, t);
    const a = new THREE.Mesh(geo, dough);
    a.position.set(0, TOP + RIDGE_H / 2, o);
    const b = new THREE.Mesh(geo, dough);
    b.rotation.y = Math.PI / 2;
    b.position.set(o, TOP + RIDGE_H / 2, 0);
    a.castShadow = b.castShadow = true;
    a.receiveShadow = b.receiveShadow = true;
    group.add(a, b);
  }

  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.14, 18, 120), dough);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = TOP + 0.1;
  rim.castShadow = true;
  group.add(rim);
  return group;
}

function buildPlate() {
  const mat = new THREE.MeshPhysicalMaterial({ color: COLORS.plate, roughness: 0.25, clearcoat: 0.8 });
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 2.6, 0.16, 96), mat);
  plate.position.y = -TOP - 0.1;
  plate.receiveShadow = true;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.07, 12, 120), mat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -TOP - 0.02;
  g.add(plate, lip);
  return g;
}

function glossy(color) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 });
}
function matte(color, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function drizzle(color, seed, radius = 0.06) {
  const rand = rng(seed);
  const pts = [];
  const n = 9;
  for (let k = 0; k <= n; k++) {
    const x = -1.7 + (3.4 * k) / n + (rand() - 0.5) * 0.2;
    const lim = Math.sqrt(Math.max(R * R - x * x, 0)) * 0.78;
    const z = (k % 2 ? 1 : -1) * lim;
    pts.push(new THREE.Vector3(x, (k % 2 ? -0.02 : 0.04) + rand() * 0.03, z)); // add() lifts to SURFACE
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, radius, 10, false), glossy(color));
  m.castShadow = true;
  return m;
}

function pool(color, r = 1.0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), glossy(color));
  m.scale.y = 0.07;
  m.position.y = SURFACE;
  return m;
}

function drips(color, count, seed) {
  const g = new THREE.Group();
  const rand = rng(seed);
  const mat = glossy(color);
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const len = 0.15 + rand() * 0.35;
    const cx = Math.cos(a), cz = Math.sin(a);
    const rimTop = TOP + 0.24;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), mat);
    blob.scale.set(1, 0.35, 1);
    blob.position.set(cx * (R - 0.02), rimTop - SURFACE, cz * (R - 0.02));
    const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, len, 6, 12), mat);
    d.position.set(cx * (R + 0.1), rimTop - 0.06 - len / 2 - SURFACE, cz * (R + 0.1));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat);
    tip.position.set(d.position.x, d.position.y - len / 2 - 0.03, d.position.z);
    g.add(blob, d, tip);
  }
  // add() lifts the group to SURFACE, so children are offset down to hang from the rim.
  return g;
}

function strawberry() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), glossy('#D7263D'));
  body.scale.set(1, 1.25, 1);
  const pos = body.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) { pos.setX(i, pos.getX(i) * (1 + y * 1.6)); pos.setZ(i, pos.getZ(i) * (1 + y * 1.6)); }
  }
  body.geometry.computeVertexNormals();
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.08, 6), matte('#3E8E41'));
  leaf.position.y = 0.27;
  leaf.rotation.x = Math.PI;
  g.add(body, leaf);
  g.rotation.z = Math.PI / 2.4;
  return g;
}

// Each preset matches a real menu item; only the toppings are illustrative.
const PRESETS = {
  berry: { syrup: '#C8691C', build: (add) => {
    add(pool('#C8691C', 1.05), 0);
    add(drizzle('#C8691C', 3, 0.045));
    add(drips('#C8691C', 7, 5), 0.0001);
    for (let i = 0; i < 6; i++) add(strawberry(), 0.2, 1.55);
    for (let i = 0; i < 9; i++) add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), glossy('#3B3F8F')), 0.11, 1.6);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.45), matte('#FFE38A', 0.4)), 0.16, 0.01);
  } },
  lotus: { build: (add) => {
    add(drizzle('#B5651D', 11));
    for (let i = 0; i < 4; i++) {
      // Caramelised biscuit: scalloped disc with a raised border.
      const c = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 14), matte('#8E4B1B', 0.75));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 28), matte('#7A3E14', 0.7));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.05;
      c.add(disc, ring);
      c.rotation.set(0.35, i, 0.2);
      add(c, 0.16, 1.35);
    }
    for (let i = 0; i < 20; i++) add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.05), matte('#A8622A')), 0.05, 1.8);
  } },
  nutty: { build: (add) => {
    add(drizzle('#3B1E0E', 21, 0.07));
    add(drizzle('#5A2E14', 22, 0.05));
    for (let i = 0; i < 14; i++) add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), matte('#A0622D', 0.5)), 0.1, 1.7);
  } },
  brownie: { build: (add) => {
    add(drizzle('#2E150A', 31, 0.07));
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.3), matte('#4A2615', 0.85));
      b.rotation.y = Math.random();
      add(b, 0.13, 1.5);
    }
    add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 20), matte('#F5E6C8', 0.5)), 0.32, 0.01);
  } },
  kinder: { build: (add) => {
    add(drizzle('#F3E9DA', 41, 0.07));
    add(drizzle('#4A2615', 42, 0.05));
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.22), matte('#5C2E12', 0.5));
      b.rotation.y = Math.random() * 3;
      add(b, 0.08, 1.4);
    }
  } },
  pistachio: { build: (add) => {
    add(drizzle('#A5C26B', 51, 0.07));
    for (let i = 0; i < 30; i++) add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), matte('#7FA34A')), 0.04, 1.8);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), matte('#E8F0D2', 0.5)), 0.3, 0.01);
  } },
  canadian: { build: (add) => {
    add(pool('#B8561A', 1.25), 0);
    add(drips('#B8561A', 9, 9), 0.0001);
    add(drizzle('#C8691C', 61, 0.05));
    add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.5), matte('#FFE38A', 0.35)), 0.17, 0.01);
  } },
};

export function createWaffleScene(canvas, opts = {}) {
  const { plate = true, particles = false, preset = 'berry', tilt = 0.55, distance = 9 } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, distance * Math.sin(tilt), distance * Math.cos(tilt));
  camera.lookAt(0, 0.2, 0);

  scene.add(new THREE.HemisphereLight('#FFF3DC', '#5A3A1E', 1.1));
  const key = new THREE.DirectionalLight('#FFE2B0', 2.4);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rimLight = new THREE.DirectionalLight('#FFB81C', 1.4);
  rimLight.position.set(-6, 3, -4);
  scene.add(rimLight);

  const root = new THREE.Group();
  scene.add(root);
  const spin = new THREE.Group();
  root.add(spin);
  spin.add(buildWaffle());
  if (plate) spin.add(buildPlate());

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -TOP - 0.2;
  ground.receiveShadow = true;
  root.add(ground);

  let toppings = new THREE.Group();
  spin.add(toppings);

  function setPreset(name, seed = 7) {
    const def = PRESETS[name] || PRESETS.berry;
    const old = toppings;
    old.userData.leaving = true;
    toppings = new THREE.Group();
    spin.add(toppings);
    const rand = rng(seed + name.length * 97);
    let i = 0;
    def.build((mesh, lift = 0.05, spread = 0) => {
      if (spread > 0) {
        const [x, z] = inDisk(rand, spread);
        mesh.position.x = x;
        mesh.position.z = z;
        mesh.position.y = SURFACE + lift;
      } else if (mesh.position.y === 0) {
        mesh.position.y = SURFACE + lift;
      }
      mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      mesh.userData.targetY = mesh.position.y;
      mesh.userData.delay = i++ * 0.035;
      mesh.position.y += 3;
      toppings.add(mesh);
    }, rand);
    toppings.userData.born = clock.getElapsedTime();
  }

  // Floating sugar / crumbs around the hero waffle.
  let dust;
  if (particles) {
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 6 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFD27A', size: 0.06, transparent: true, opacity: 0.8 }));
    scene.add(dust);
  }

  const clock = new THREE.Clock();
  setPreset(preset);

  const state = { px: 0, py: 0, scroll: 0, spinSpeed: 0.18, visible: true };
  let rx = 0, ry = 0;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  let raf = 0;
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }, { rootMargin: '100px' });
  io.observe(canvas);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!state.visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    if (!reduce) spin.rotation.y += dt * state.spinSpeed;
    rx += ((state.py * 0.25 + state.scroll * 0.5) - rx) * 0.06;
    ry += ((state.px * 0.45 + state.scroll * 1.2) - ry) * 0.06;
    root.rotation.x = rx;
    root.rotation.y = ry;
    root.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.08;

    // Drop toppings in, lift old ones away.
    spin.children.forEach((g) => {
      if (!g.isGroup || g === toppings || !g.userData.leaving) return;
      g.position.y += dt * 6;
      g.scale.multiplyScalar(0.9);
      if (g.scale.x < 0.02) spin.remove(g);
    });
    const age = t - (toppings.userData.born || 0);
    // Time-based drop (not per-frame) so it lands correctly even when frames are throttled.
    toppings.children.forEach((m) => {
      const p = reduce ? 1 : Math.min(Math.max((age - m.userData.delay) / 0.7, 0), 1);
      m.position.y = m.userData.targetY + 3 * Math.pow(1 - p, 3);
    });

    if (dust) {
      dust.rotation.y = t * 0.03;
      dust.position.y = Math.sin(t * 0.4) * 0.2;
    }
    renderer.render(scene, camera);
  }
  frame();

  return {
    setPreset,
    setPointer(x, y) { state.px = x; state.py = y; },
    setScroll(p) { state.scroll = p; },
    setSpin(s) { state.spinSpeed = s; },
    root,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { m.map?.dispose(); m.dispose(); });
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
