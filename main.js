import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ---------- 基本 ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const PAPER = new THREE.Color(0xeee4cf);
scene.fog = new THREE.Fog(PAPER, 18, 75);
scene.background = PAPER;
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 400);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8a86, 1.3));
const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(-8, 20, 10); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 }); sun.shadow.bias = -.0008; sun.shadow.radius = 4;
scene.add(sun, sun.target);
const loader = new THREE.TextureLoader();
const tex = n => { const t = loader.load(`assets/${n}.jpg`); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const T = { rock: tex('rock'), stone: tex('stone'), wood: tex('wood') };
const sky = loader.load('assets/sky.jpg'); sky.colorSpace = THREE.SRGBColorSpace;
const skyMesh = new THREE.Mesh(new THREE.CylinderGeometry(180, 180, 150, 48, 1, true), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false }));
sky.wrapS = THREE.RepeatWrapping; sky.repeat.set(3, 1); skyMesh.renderOrder = -1; scene.add(skyMesh);
const INK = new THREE.LineBasicMaterial({ color: 0x1d1814, transparent: true, opacity: .85 });

// ---------- 地形 ----------
const solids = [];
function box(x, y, z, sx, sy, sz, kind = 'stone', opt = {}) {
  const t = T[kind].clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, sx / 3), Math.max(1, (kind === 'rock' ? sy : sz) / 3));
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshLambertMaterial({ map: t, color: opt.color || 0xffffff }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), INK));
  scene.add(m);
  if (!opt.deco) solids.push({ mesh: m, hx: sx / 2, hy: sy / 2, hz: sz / 2, delta: new THREE.Vector3(), name: opt.name });
  return m;
}
// 足場（上面の高さで指定）
const plat = (x, top, z, sx, sz, kind = 'stone', thick = 1, opt) => box(x, top - thick / 2, z, sx, thick, sz, kind, opt);
// 開始の広場と階段
plat(0, 0, 0, 8, 8, 'stone', 6);
for (let i = 0; i < 4; i++) plat(0, (i + 1) * .5, -4.5 - i, 3, 1, 'stone', 6);
plat(0, 2, -11, 4, 6, 'stone', 8);
// 跳び石
plat(0, 2, -16.5, 2, 2, 'rock', 9); plat(1.6, 2.5, -20, 2, 2, 'rock', 9); plat(-1.2, 3, -23.6, 2.2, 2.2, 'rock', 10);
plat(0, 3, -28.5, 6, 5, 'stone', 10);
// 崖とはしご
box(0, 6, -32.5, 7, 12, 3, 'rock');
const ladder = new THREE.Group();
for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(.12, 6, .12), new THREE.MeshLambertMaterial({ map: T.wood })); r.position.set(i ? .55 : -.55, 6, -30.9); r.castShadow = true; ladder.add(r); }
for (let k = 0; k < 13; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.2, .1, .1), new THREE.MeshLambertMaterial({ map: T.wood })); r.position.set(0, 3.3 + k * .45, -30.9); ladder.add(r); }
ladder.traverse(o => o.isMesh && o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), INK))); scene.add(ladder);
const LADDER = { x0: -.75, x1: .75, z0: -31.6, z1: -30.4, y0: 2.9, y1: 12.3 };
plat(0, 12, -37.5, 6, 7, 'stone', 6);
// 動く板（前後）
const mover = plat(0, 12, -43, 2.6, 2.6, 'wood', .4, { name: 'mover' });
plat(0, 12, -50, 6, 6.4, 'stone', 6);
// 昇降台
const lift = plat(0, 12, -55, 3.2, 3.2, 'wood', .4, { name: 'lift' });
const liftRopes = new THREE.Group();
for (const sx of [-1.3, 1.3]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 20), new THREE.MeshBasicMaterial({ color: 0x2a2420 })); r.position.set(sx, 10, 0); liftRopes.add(r); }
lift.add(liftRopes);
plat(0, 17, -61, 7, 8, 'stone', 6);
// 門と鐘
box(-2.6, 19.5, -63, .6, 5, .6, 'wood', { color: 0xc8483a }); box(2.6, 19.5, -63, .6, 5, .6, 'wood', { color: 0xc8483a });
box(0, 22.2, -63, 6.6, .5, .8, 'wood', { color: 0xc8483a });
const door = box(0, 19, -63, 4.6, 4, .4, 'wood', { name: 'door' });
const bell = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 12), new THREE.MeshLambertMaterial({ color: 0x5a4a38 })); bell.position.set(2.6, 18.2, -58.5); bell.castShadow = true;
bell.add(new THREE.LineSegments(new THREE.EdgesGeometry(bell.geometry, 30), INK)); scene.add(bell);
box(2.6, 18.9, -58.5, .08, 1.2, .08, 'wood', { deco: true });
// 頂上と鳥居
plat(0, 17, -69, 9, 8, 'stone', 6);
const torii = new THREE.Group();
for (const sx of [-2.2, 2.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.22, .25, 5, 12), new THREE.MeshLambertMaterial({ color: 0xc23b2e })); p.position.set(sx, 19.5, -71); p.castShadow = true; torii.add(p); }
const kasagi = new THREE.Mesh(new THREE.BoxGeometry(6.4, .4, .6), new THREE.MeshLambertMaterial({ color: 0x1d1814 })); kasagi.position.set(0, 22.2, -71); torii.add(kasagi);
const nuki = new THREE.Mesh(new THREE.BoxGeometry(5.2, .3, .35), new THREE.MeshLambertMaterial({ color: 0xc23b2e })); nuki.position.set(0, 21.3, -71); torii.add(nuki);
torii.traverse(o => o.isMesh && o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), INK))); scene.add(torii);
// 背景の岩柱と霧
const rnd = (a => () => (a = (a * 16807) % 2147483647) / 2147483647)(7);
for (let i = 0; i < 30; i++) {
  const side = i % 2 ? 1 : -1, z = 8 - i * 2.8 - rnd() * 3, x = side * (15 + rnd() * 22), h = 8 + rnd() * 22, w = 3 + rnd() * 4;
  box(x, -14 + h / 2 + (i * .45), z, w, h, w, 'rock', { deco: true, color: 0xd8d4cc });
}
const mistMat = new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: .55, depthWrite: false });
for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(140, 60), mistMat); m.rotation.x = -Math.PI / 2; m.position.set(0, -6 + i * 1.6, -30); scene.add(m); }

// ---------- 主人公（紙人形） ----------
const hero = new THREE.Group(); scene.add(hero);
const heroTex = loader.load('assets/hero_cut.png'); heroTex.colorSpace = THREE.SRGBColorSpace;
const HH = 1.9, body = new THREE.Mesh(new THREE.PlaneGeometry(HH * 600 / 900, HH), new THREE.MeshLambertMaterial({ map: heroTex, transparent: true, alphaTest: .35, side: THREE.DoubleSide }));
body.position.y = HH / 2; body.castShadow = true; body.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: heroTex, alphaTest: .35 });
const pivot = new THREE.Group(); pivot.add(body); hero.add(pivot);
let model = null, mixer = null, acts = {}, curAct = null;
new GLTFLoader().load('assets/hero.glb', g => {
  model = g.scene; const bb = new THREE.Box3().setFromObject(model); const h = bb.max.y - bb.min.y; const sc = 1.85 / h; model.scale.setScalar(sc);
  model.position.y = -bb.min.y * sc; model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; if (o.material) { o.material.metalness = 0; o.material.roughness = 1; } } });
  hero.add(model); pivot.visible = false; mixer = new THREE.AnimationMixer(model);
  for (const a of g.animations) acts[a.name] = mixer.clipAction(a);
  if (acts.jump) { acts.jump.setLoop(THREE.LoopOnce); acts.jump.clampWhenFinished = true; }
  play('idle'); window.__modelReady = true;
}, undefined, e => { console.log('model load failed', e); window.__modelReady = true; });
function play(n, fade = .2) { if (!acts[n] || curAct === n) return; const a = acts[n]; a.reset().fadeIn(fade).play(); if (curAct && acts[curAct]) acts[curAct].fadeOut(fade); curAct = n; }
let yaw = Math.PI; const MODEL_YAW = +(new URLSearchParams(location.search).get('my') || -Math.PI / 2);
const blob = new THREE.Mesh(new THREE.CircleGeometry(.45, 24), new THREE.MeshBasicMaterial({ color: 0x1d1814, transparent: true, opacity: .25, depthWrite: false })); blob.rotation.x = -Math.PI / 2; scene.add(blob);

// ---------- 入力 ----------
const keys = {}; addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); }); addEventListener('keyup', e => keys[e.code] = false);
const touch = { x: 0, z: 0, jump: false };
const isTouch = matchMedia('(pointer:coarse)').matches;
if (isTouch) {
  const st = document.getElementById('stick'), kb = document.getElementById('knob'), jb = document.getElementById('jump'); st.style.display = 'block'; jb.style.display = 'flex';
  let id = null, cx = 0, cy = 0;
  st.addEventListener('touchstart', e => { const t = e.changedTouches[0]; id = t.identifier; const r = st.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; e.preventDefault(); });
  addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === id) { let dx = (t.clientX - cx) / 55, dy = (t.clientY - cy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } touch.x = dx; touch.z = dy; kb.style.left = 40 + dx * 40 + 'px'; kb.style.top = 40 + dy * 40 + 'px'; } }, { passive: false });
  addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; touch.x = touch.z = 0; kb.style.left = kb.style.top = '40px'; } });
  jb.addEventListener('touchstart', e => { touch.jump = true; e.preventDefault(); }); jb.addEventListener('touchend', () => touch.jump = false);
}
const DEMO = new URLSearchParams(location.search).has('demo');
const auto = { x: 0, z: 0, jump: false };
function input() {
  if (DEMO) return auto;
  let x = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  let z = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  x += touch.x; z += touch.z; const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; }
  return { x, z, jump: keys.Space || touch.jump };
}

// ---------- 物理 ----------
const P = new THREE.Vector3(0, 0, 1.5), V = new THREE.Vector3(); const HW = .32, HT = 1.6;
let onGround = false, ground = null, climbing = false, gateOpen = false, started = false, finished = false, t0 = 0, face = 1;
let checkpoint = P.clone();
const CPS = [[0, 0, 1.5], [0, 3, -28], [0, 12, -36], [0, 12, -49], [0, 17, -59]];
function hits(px, py, pz) {
  for (const s of solids) {
    if (s.name === 'door' && gateOpen) continue;
    const c = s.mesh.position;
    if (Math.abs(px - c.x) < s.hx + HW && Math.abs(pz - c.z) < s.hz + HW && py < c.y + s.hy && py + HT > c.y - s.hy) return s;
  }
  return null;
}
function step(dt, inp) {
  const sp = 5.2;
  V.x += (inp.x * sp - V.x) * Math.min(1, dt * 12); V.z += (inp.z * sp - V.z) * Math.min(1, dt * 12);
  if (Math.abs(inp.x) > .1) face = Math.sign(inp.x);
  const inL = P.x > LADDER.x0 && P.x < LADDER.x1 && P.z > LADDER.z0 && P.z < LADDER.z1 && P.y > LADDER.y0 - .2 && P.y < LADDER.y1;
  climbing = inL && inp.z < -.3;
  if (climbing) { V.y = 3.2; } else if (inL && P.y > LADDER.y0 + .3 && !onGround) { V.y = Math.max(V.y - 22 * dt, -1.2); } else V.y -= 22 * dt;
  if (inp.jump && onGround) { V.y = 8.2; onGround = false; }
  // 乗っている床と一緒に動く
  if (ground && ground.delta) P.add(ground.delta);
  for (const ax of ['x', 'z', 'y']) {
    const old = P[ax]; P[ax] += V[ax] * dt;
    const s = hits(P.x, P.y, P.z);
    if (s) {
      const c = s.mesh.position;
      if (ax === 'y') {
        if (V.y <= 0) { P.y = c.y + s.hy; onGround = true; ground = s; } else { P.y = c.y - s.hy - HT; }
        V.y = 0;
      } else {
        const top = c.y + s.hy;
        if (top - P.y > 0 && top - P.y <= .55 && (onGround || climbing) && !hits(P.x, top + .01, P.z)) { P.y = top; }
        else if (ax === 'x') { P.x = old; V.x = 0; } else { P.z = old; V.z = 0; }
      }
    } else if (ax === 'y') { onGround = false; ground = null; }
  }
  // 足元の確認（端で浮かないように）
  if (onGround && !hits(P.x, P.y - .05, P.z)) { onGround = false; ground = null; }
  if (P.y < -8) { P.copy(checkpoint); V.set(0, 0, 0); flash('落ちた。もう一度。'); if (DEMO) { let bi = 0, bd = 1e9; W.forEach((w, i) => { const d = Math.hypot(w.x - P.x, w.z - P.z); if (d < bd) { bd = d; bi = i; } }); wi = bi; window.__falls = (window.__falls || 0) + 1; } }
  for (const c of CPS) if (P.distanceTo(new THREE.Vector3(...c)) < 2.5 && onGround) checkpoint.set(...c);
  if (!gateOpen && P.distanceTo(bell.position) < 1.4) { gateOpen = true; flash('鐘が鳴り、門が開いた。'); }
  if (!finished && P.z < -67 && P.y > 16) finish();
}
let flashT = 0; const hint = document.getElementById('hint');
function flash(s) { hint.textContent = s; hint.style.opacity = 1; flashT = 2.5; }
function zoneHint() {
  if (flashT > 0) return;
  let s = '左右・前後で歩く／スペースで跳ぶ';
  if (P.z < -14) s = '跳び石を渡る'; if (P.z < -27) s = 'はしごに向かって進むと登る'; if (P.y > 11) s = '動く板に乗って渡る';
  if (P.z < -48) s = '昇降台で上へ'; if (P.y > 16) s = gateOpen ? '鳥居へ' : '右の鐘に触れると門が開く';
  hint.textContent = s;
}

// ---------- 自動操縦（録画用 ?demo） ----------
const W = [
  { x: 0, z: -3 }, { x: 0, z: -8.6 }, { x: 0, z: -13.45, jump: true }, { x: 0, z: -16.3 }, { x: .55, z: -17.2, jump: true }, { x: 1.6, z: -20 },
  { x: .7, z: -20.8, jump: true }, { x: -1.2, z: -23.4 }, { x: -.8, z: -24.45, jump: true }, { x: 0, z: -27.5 }, { x: 0, z: -30.5 }, { x: 0, z: -30.6, climb: true },
  { x: 0, z: -35.5 }, { x: 0, z: -40.6, waitMover: -41.0 }, { onMover: true }, { x: 0, z: -43, waitMover: -45.2 }, { x: 0, z: -48 }, { x: 0, z: -52.7, waitLift: 12 },
  { onLift: true }, { x: 0, z: -55, waitLiftTop: true }, { x: 0, z: -58.5 }, { x: 2.1, z: -58.6 }, { x: 0, z: -60.5 }, { x: 0, z: -69 }
];
let wi = 0, hold = 0;
function pilot(dt) {
  auto.x = auto.z = 0; auto.jump = false; const w = W[wi]; if (!w) return;
  if (w.onMover || w.onLift) { const m = w.onMover ? mover : lift; const dx = m.position.x - P.x, dz = m.position.z - P.z, d = Math.hypot(dx, dz); if (ground && ground.mesh === m && d < .3) { wi++; return; } if (d > .05) { auto.x = dx / d * Math.min(1, d); auto.z = dz / d * Math.min(1, d); } return; }
  const dx = w.x - P.x, dz = w.z - P.z, d = Math.hypot(dx, dz);
  if (w.climb) { auto.z = -1; auto.x = dx; if (P.y > 11.9) { wi++; } return; }
  if (w.waitMover !== undefined && Math.abs(mover.position.z - w.waitMover) > .35) { if (ground && ground.name === 'mover') return; if (d > .2) { auto.x = dx / d * .6; auto.z = dz / d * .6; } return; }
  if (w.waitMover !== undefined && (ground && ground.name === 'mover')) { wi++; return; }
  if (w.waitLift !== undefined && lift.position.y - .2 > w.waitLift + .1) { if (d > .2) { auto.x = dx / d * .6; auto.z = dz / d * .6; } return; }
  if (w.waitLiftTop) { if (lift.position.y < 16.75) return; wi++; return; }
  if (d < .25) { wi++; return; }
  auto.x = dx / d; auto.z = dz / d;
  if (w.jump && d < .9 && onGround) { auto.jump = true; wi++; }
}

// ---------- ループ ----------
const clock = new THREE.Clock(); const camPos = new THREE.Vector3(0, 6, 10), camLook = new THREE.Vector3();
let walkT = 0;
function finish() { finished = true; const s = ((nowMs() - t0) / 1000).toFixed(1); document.getElementById('endt').textContent = `${s} 秒で山頂に着きました`; document.getElementById('end').style.display = 'flex'; }
let simT = 0, simStart = 0;
const REC = new URLSearchParams(location.search).has('rec');
const nowMs = () => REC ? simT * 1000 : performance.now();
function frame(dt) {
  simT += dt; const now = REC ? simT : clock.elapsedTime;
  // 動く仕掛け
  const mz = -43 + Math.max(-1, Math.min(1, Math.sin(now * .8) * 1.7)) * 2.3, mdz = mz - mover.position.z; mover.position.z = mz; solids.find(s => s.name === 'mover').delta.set(0, 0, mdz);
  const ly = 12 - .2 + (1 + Math.max(-1, Math.min(1, -Math.cos(now * .5) * 1.6))) * 2.5, ldy = ly - lift.position.y; lift.position.y = ly; solids.find(s => s.name === 'lift').delta.set(0, ldy, 0);
  liftRopes.position.y = 0;
  if (gateOpen && door.position.y < 23.5) door.position.y += dt * 2.5;
  if (started && !finished) { if (DEMO) pilot(dt); step(dt, input()); document.getElementById('timer').textContent = ((nowMs() - t0) / 1000).toFixed(1) + ' 秒'; zoneHint(); }
  flashT -= dt; if (flashT < 0 && hint.style.opacity === '1' && false) hint.style.opacity = 1;
  // 主人公の見た目
  hero.position.copy(P); const spd = Math.hypot(V.x, V.z); walkT += dt * spd * 2.2;
  pivot.rotation.y = Math.atan2(camera.position.x - P.x, camera.position.z - P.z);
  body.scale.x += ((face < 0 ? -1 : 1) - body.scale.x) * Math.min(1, dt * 14);
  const air = !onGround && !climbing;
  body.position.y = HH / 2 + (onGround ? Math.abs(Math.sin(walkT)) * .09 * Math.min(1, spd / 3) : 0);
  body.rotation.z = onGround ? Math.sin(walkT) * .06 * Math.min(1, spd / 3) : -face * .12;
  body.scale.y = air ? 1.06 : 1; if (climbing) body.rotation.z = Math.sin(now * 12) * .08;
  if (model) {
    if (spd > .3) { const ty = Math.atan2(V.x, V.z); let d = ty - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * 10); }
    if (climbing || (P.x > LADDER.x0 && P.x < LADDER.x1 && P.z > LADDER.z0 && P.z < LADDER.z1 && !onGround && P.y > LADDER.y0 + .2)) { yaw = Math.PI; play('climb'); }
    else if (!onGround) play('jump', .1); else if (spd > .6) play('walk'); else play('idle');
    if (acts.walk) acts.walk.timeScale = Math.max(.6, spd / 3.2);
    model.rotation.y = yaw + MODEL_YAW; mixer.update(dt);
  }
  // 影
  let gy = -50; for (const s of solids) { const c = s.mesh.position; if (Math.abs(P.x - c.x) < s.hx && Math.abs(P.z - c.z) < s.hz && c.y + s.hy <= P.y + .05) gy = Math.max(gy, c.y + s.hy); }
  blob.position.set(P.x, gy + .02, P.z); blob.visible = gy > -40; blob.scale.setScalar(1 / (1 + (P.y - gy) * .25));
  // カメラ
  const tgt = new THREE.Vector3(P.x * .7, P.y + 1.2, P.z); const want = tgt.clone().add(new THREE.Vector3(0, 3.1, 6.4));
  camPos.lerp(want, Math.min(1, dt * 3)); camera.position.copy(camPos); camLook.lerp(tgt.clone().add(new THREE.Vector3(0, .3, -4)), Math.min(1, dt * 4)); camera.lookAt(camLook);
  sun.position.set(P.x - 8, P.y + 20, P.z + 10); sun.target.position.set(P.x, P.y, P.z - 3);
  skyMesh.position.set(camera.position.x, camera.position.y + 25, camera.position.z);
  renderer.render(scene, camera);
}
function tick() { frame(Math.min(.033, clock.getDelta())); requestAnimationFrame(tick); }
camLook.set(0, 1, -4);
if (REC) { window.__frame = (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) frame(dt); return window.__state(); }; frame(1 / 30); } else tick();
function start() { document.getElementById('title').style.display = 'none'; started = true; finished = false; t0 = nowMs(); P.set(0, 0, 1.5); V.set(0, 0, 0); checkpoint.copy(P); wi = 0; gateOpen = false; door.position.y = 19; }
document.getElementById('start').onclick = start;
document.getElementById('again').onclick = () => { document.getElementById('end').style.display = 'none'; start(); };
if (DEMO && !REC) setTimeout(start, 1200);
window.__start = start;
window.__state = () => ({ V: V.toArray().map(v => +v.toFixed(2)), auto: { ...auto }, started, P: P.toArray().map(v => +v.toFixed(2)), wi, onGround, gateOpen, finished, falls: window.__falls || 0, g: ground ? (ground.name || 'static') : null, md: solids.find(s => s.name === 'mover').delta.z.toFixed(3), mover: +mover.position.z.toFixed(2), lift: +lift.position.y.toFixed(2) });
