(() => {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---- motion layer ---- */
  const reduceM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const logo = document.querySelector(".hdr .logo");
  if (!reduceM) { setTimeout(() => { logo.classList.add("peeking"); setTimeout(() => logo.classList.remove("peeking"), 1900); }, 1200); }
  if (!reduceM && "IntersectionObserver" in window) {
    // staggered reveals for everything below the first screen
    const groups = [".statement .label", ".fact", ".pillars-head", ".pcard", ".gband > div:first-child > *", ".visual", ".how-head", ".how-steps li", ".bleft > *", ".fmt", ".quotes .label", ".quotes .h2", ".q", ".faq .wrap > div:first-child", ".faq details", ".fband", ".fgrid > div"];
    const vh = window.innerHeight;
    groups.forEach(sel => document.querySelectorAll(sel).forEach((el, i) => {
      if (el.getBoundingClientRect().top < vh * .92) return;
      el.classList.add("rv"); el.style.setProperty("--d", (i % 6) * .09 + "s");
    }));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv").forEach(el => io.observe(el));
    setTimeout(() => document.querySelectorAll(".rv").forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); }), 2500);

    // rolling digits (odometer) that ease into place when the numbers come into view
    const factsBox = document.querySelector(".facts");
    const odos = [...document.querySelectorAll(".fact b")].map((b, fi) => {
      const raw = b.textContent.trim(), digits = raw.match(/^[0-9]+/)[0], suf = raw.slice(digits.length);
      b.setAttribute("aria-label", raw); b.textContent = "";
      const wrap = document.createElement("span"); wrap.className = "odo"; wrap.setAttribute("aria-hidden", "true");
      const cols = [...digits].map((d, ci) => {
        const col = document.createElement("span"); col.className = "odo-col";
        for (let k = 0; k < 30; k++) { const sp = document.createElement("span"); sp.textContent = k % 10; col.appendChild(sp); }
        col.style.transitionDelay = (fi * .12 + ci * .08) + "s";
        wrap.appendChild(col);
        return { col, target: 20 + +d };
      });
      b.appendChild(wrap);
      if (suf) { const sx = document.createElement("span"); sx.className = "odo-suf"; sx.textContent = suf; sx.style.transitionDelay = (fi * .12 + 1.4) + "s"; b.appendChild(sx); }
      return cols;
    });
    const ioF = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; ioF.disconnect();
      factsBox.classList.add("rolled"); setTimeout(() => factsBox.classList.add("settled"), 3000);
      odos.flat().forEach(c => { c.col.style.transform = `translateY(${-c.target}em)`; });
    }), { threshold: .45 });
    if (factsBox) ioF.observe(factsBox);

    // statement words light up while you scroll
    const big = document.querySelector(".statement .big"), words = [];
    if (big) {
      const walk = node => [...node.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(part => { if (!part) return; if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part)); else { const sp = document.createElement("span"); sp.className = "w"; sp.textContent = part; frag.appendChild(sp); words.push(sp); } });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
      walk(big);
    }
    const frame = document.getElementById("frame"), heroCopy = document.querySelector(".hero-copy"), phone = document.querySelector(".visual .phone"),
      floats = document.querySelectorAll(".visual .float"), fband = document.querySelector(".fband");
    let ticking = false;
    const onS = () => {
      ticking = false;
      const vh2 = window.innerHeight, y = window.scrollY;
      // hero: frame eases back, copy drifts up, 3D camera pulls out
      const hp = Math.min(1, y / (frame.offsetHeight || 1));
      frame.style.transform = `scale(${1 - hp * .06})`;
      frame.style.borderRadius = `${28 + hp * 24}px`;
      if (heroCopy) heroCopy.style.transform = `translateY(${-hp * 60}px)`;
      window.__hs = hp;
      if (big && words.length) {
        const r = big.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh2 * .85 - r.top) / (r.height + vh2 * .35)));
        const n = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle("on", i < n));
      }
      if (phone) {
        const r = phone.getBoundingClientRect(), c = (r.top + r.height / 2 - vh2 / 2) / vh2;
        phone.style.transform = innerWidth < 600 ? `translateY(${c * -24}px)` : `translateY(${c * -50}px) rotate(${c * -3}deg)`;
        floats.forEach((f, i) => f.style.translate = `0 ${c * (i ? 70 : -60)}px`);
      }
      if (fband) {
        const r = fband.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh2 - r.top) / (r.height + 120)));
        fband.style.transform = `scale(${.92 + p * .08})`;
      }
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onS); } }, { passive: true });
    window.addEventListener("resize", onS); onS();
  }
  const hdr = document.getElementById("hdr");
  const onScroll = () => hdr.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const T = window.THREE;
  const frame = document.getElementById("frame"), cv = document.getElementById("scene");
  if (!T) return;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new T.Scene();
  scene.fog = new T.Fog(0xefe7e8, 22, 62);
  const camera = new T.PerspectiveCamera(34, 16 / 9, .1, 200);

  /* soft winter daylight */
  scene.add(new T.HemisphereLight(0xffffff, 0xd9c6bd, .95));
  const sun = new T.DirectionalLight(0xfff0dc, 1.5); sun.position.set(8, 12, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 }); sun.shadow.bias = -.0005; sun.shadow.radius = 4;
  scene.add(sun); scene.add(sun.target);
  const fire = new T.PointLight(0xff8a40, 1.6, 7, 1.6); scene.add(fire);

  function canvasTex(w, h, draw, rx = 1, ry = 1) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
  function dot(inner, outer) { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); }
  const soft = dot("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  let sd = 9; const sr = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const brick = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#4a221c"; g.fillRect(0, 0, w, h); const cols = ["#9a4434", "#8a3b2e", "#a54e3e", "#7f3428", "#b0594a"]; for (let r = 0; r < 16; r++) { const off = r % 2 ? 16 : 0; for (let c = -1; c < 9; c++) { g.fillStyle = cols[Math.floor(sr() * 5)]; g.fillRect(c * 32 + off + 2, r * 16 + 2, 28, 12); g.fillStyle = "rgba(255,230,210,.12)"; g.fillRect(c * 32 + off + 2, r * 16 + 2, 28, 2); } } }, 1, 1.8);
  const snowT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#f7f8ff"; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(170,175,215,${sr() * .12})`; g.fillRect(sr() * w, sr() * h, 2, 2); } }, 3, 2);
  const shingle = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3a3048"; g.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) { const off = r % 2 ? 16 : 0; for (let c = -1; c < 9; c++) { const l = 70 + sr() * 30; g.fillStyle = `rgb(${l + 34},${l - 6},${l - 2})`; g.fillRect(c * 32 + off + 1, r * 16 + 1, 30, 14); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(c * 32 + off + 1, r * 16 + 12, 30, 3); } } }, 4, 2);
  const std = (c, r = .7, x = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: r }, x));
  const snowMat = new T.MeshStandardMaterial({ map: snowT, roughness: .95 });
  const S_ = (r, w = 28, h = 20) => new T.SphereGeometry(r, w, h);
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };

  const world = new T.Group(); scene.add(world);

  /* roof: shingles with a thick snow blanket and icicles */
  const roof = new T.Group(); world.add(roof);
  roof.add(mesh(new T.BoxGeometry(24, .5, 10), new T.MeshStandardMaterial({ map: shingle, roughness: .8 }), 0, 0, 0));
  roof.add(mesh(new T.BoxGeometry(24, .45, 9.2), snowMat, 0, .42, -.3));
  const lip = mesh(new T.CylinderGeometry(.26, .26, 24, 16), snowMat, 0, .38, 4.3); lip.rotation.z = Math.PI / 2; roof.add(lip);
  const iceMat = new T.MeshStandardMaterial({ color: 0xd6ecff, roughness: .08, metalness: .1, transparent: true, opacity: .9 });
  for (let x = -11.5; x < 11.5; x += .28 + sr() * .3) { const L = .2 + sr() * .55; const ic = mesh(new T.ConeGeometry(.05, L, 6), iceMat, x, -.1 - L / 2, 4.85); ic.rotation.x = Math.PI; ic.castShadow = false; roof.add(ic); }
  roof.rotation.z = .14; roof.position.set(0, -2.5, 0);

  /* chimney */
  const chim = new T.Group(); world.add(chim);
  const brickMat = new T.MeshStandardMaterial({ map: brick, roughness: .9 });
  chim.add(mesh(new T.BoxGeometry(1.8, 3.8, 1.8), brickMat, 0, -.7, 0));
  chim.add(mesh(new T.BoxGeometry(2.15, .32, 2.15), std(0x6d5650, .8), 0, 1.3, 0));
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => chim.add(mesh(new T.BoxGeometry(a ? .3 : 2.2, .22, b ? .3 : 2.2), snowMat, a * .95, 1.56, b * .95)));
  const hole = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshBasicMaterial({ color: 0x1a0a06 })); hole.rotation.x = -Math.PI / 2; hole.position.y = 1.47; chim.add(hole);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: dot("rgba(255,175,95,1)", "rgba(255,120,50,0)"), transparent: true, depthWrite: false, opacity: .55 }));
  glow.position.y = 1.9; glow.scale.set(3.2, 3.2, 1); chim.add(glow);
  fire.position.set(0, 1.8, 0); chim.add(fire);

  /* Santa peeking out and waving */
  const M = { red: std(0xd8261e, .55), white: std(0xf7f2ff, .9), skin: std(0xffc9a8, .6), cheek: std(0xff8f86, .6), nose: std(0xf2826e, .45), black: std(0x1c1626, .35), gold: std(0xffc94a, .25, { metalness: .7 }), green: std(0x2f8f5b, .7) };
  const santa = new T.Group(); chim.add(santa);
  const torso = mesh(S_(.5, 32, 24), M.red); torso.scale.set(1, 1.05, .9); santa.add(torso);
  const belt = mesh(new T.CylinderGeometry(.5, .5, .15, 32), M.black, 0, -.06, 0); belt.scale.set(1.01, 1, .91); santa.add(belt);
  santa.add(mesh(new T.BoxGeometry(.2, .16, .06), M.gold, 0, -.06, .46));
  [.18, .34].forEach(y => santa.add(mesh(S_(.035, 10, 8), M.white, 0, y, .43)));
  const head = new T.Group(); head.position.set(0, .7, 0); santa.add(head);
  head.add(mesh(S_(.3), M.skin));
  const beard = mesh(S_(.3), M.white, 0, -.15, .09); beard.scale.set(1.08, 1, .78); head.add(beard);
  head.add(mesh(S_(.17), M.white, 0, -.34, .12));
  [-1, 1].forEach(s => {
    const mo = mesh(S_(.09, 14, 10), M.white, s * .085, -.04, .27); mo.scale.set(1.5, .7, .8); mo.rotation.z = s * -.3; head.add(mo);
    head.add(mesh(S_(.036, 10, 8), M.black, s * .1, .09, .265));
    head.add(mesh(S_(.012, 6, 4), M.white, s * .108, .1, .295));
    const ch = mesh(S_(.06, 12, 8), M.cheek, s * .17, 0, .22); ch.scale.set(1, .7, .5); head.add(ch);
  });
  head.add(mesh(S_(.065, 14, 10), M.nose, 0, .02, .3));
  const hat = new T.Group(); hat.position.y = .19; head.add(hat);
  const brim = mesh(new T.TorusGeometry(.27, .075, 12, 32), M.white); brim.rotation.x = Math.PI / 2; hat.add(brim);
  const cone = new T.Group(); hat.add(cone);
  cone.add(mesh(new T.ConeGeometry(.27, .62, 28), M.red, 0, .31, 0)); cone.add(mesh(S_(.09), M.white, 0, .62, 0));
  cone.rotation.z = -.45;
  function arm() { const g = new T.Group(); g.add(mesh(new T.CylinderGeometry(.11, .12, .55, 14), M.red, 0, -.275, 0)); const cuff = mesh(new T.TorusGeometry(.115, .045, 8, 18), M.white, 0, -.55, 0); cuff.rotation.x = Math.PI / 2; g.add(cuff); g.add(mesh(S_(.13, 16, 12), M.green, 0, -.64, 0)); return g; }
  const armL = arm(); armL.position.set(-.42, .25, 0); armL.rotation.z = -.5; santa.add(armL);
  const armR = arm(); armR.position.set(.42, .25, 0); armR.rotation.z = 2.5; santa.add(armR);
  santa.scale.setScalar(1.05); santa.position.y = 1.5;

  /* presents spiralling out of the chimney */
  const PC = [[0xe8332a, 0xffc94a], [0x0000d2, 0xffffff], [0xffc94a, 0xe8332a], [0x9b5bff, 0x5fe0b5], [0x2fbf86, 0xffffff]];
  const boxG = new T.BoxGeometry(.5, .5, .5), rA = new T.BoxGeometry(.12, .52, .52), rB = new T.BoxGeometry(.52, .52, .12), bowG = new T.TorusGeometry(.09, .035, 8, 16);
  const presents = [];
  for (let i = 0; i < 8; i++) {
    const [b, r] = PC[i % PC.length], mb = std(b, .45), mr = std(r, .35, { metalness: .2 });
    const g = new T.Group(); g.add(mesh(boxG, mb)); g.add(mesh(rA, mr)); g.add(mesh(rB, mr));
    const b1 = mesh(bowG, mr, -.08, .31, 0); b1.rotation.set(0, .6, .6); g.add(b1);
    const b2 = mesh(bowG, mr, .08, .31, 0); b2.rotation.set(0, -.6, -.6); g.add(b2);
    chim.add(g); presents.push({ g, phase: i / 8, spin: .6 + sr(), size: .7 + sr() * .55, dir: sr() < .5 ? 1 : -1 });
  }

  /* sleigh with four reindeer flying across the sky */
  const fly = new T.Group(); scene.add(fly);
  (function buildSleigh() {
    const s = new T.Group(); fly.add(s);
    s.add(mesh(new T.BoxGeometry(1.5, .7, 2), M.red, 0, .35, .1));
    s.add(mesh(new T.BoxGeometry(1.52, .07, 2.02), M.gold, 0, .72, .1));
    s.add(mesh(new T.BoxGeometry(1.5, .8, .26), M.red, 0, .85, 1));
    const curl = mesh(new T.TorusGeometry(.4, .13, 10, 24, Math.PI), M.red, 0, .52, -.9); curl.rotation.set(0, Math.PI / 2, Math.PI / 2); s.add(curl);
    [-1, 1].forEach(k => { s.add(mesh(new T.BoxGeometry(.07, .07, 2.5), M.gold, k * .58, -.2, 0)); const rc = mesh(new T.TorusGeometry(.28, .04, 8, 16, Math.PI), M.gold, k * .58, .08, -1.25); rc.rotation.set(0, Math.PI / 2, -Math.PI / 2); s.add(rc); });
    const sack = mesh(S_(.5, 20, 14), std(0x9a6f3e, .95), 0, 1.0, .7); s.add(sack);
    const body = mesh(S_(.42, 20, 14), M.red, 0, .95, 0); body.scale.set(1, 1.05, .9); s.add(body);
    s.add(mesh(S_(.26, 20, 14), M.skin, 0, 1.55, -.05));
    const bd = mesh(S_(.25, 16, 12), M.white, 0, 1.42, -.14); bd.scale.set(1.05, 1, .8); s.add(bd);
    const hb = mesh(new T.TorusGeometry(.24, .065, 10, 20), M.white, 0, 1.72, -.04); hb.rotation.x = Math.PI / 2; s.add(hb);
    const hc = mesh(new T.ConeGeometry(.24, .55, 20), M.red, .08, 1.98, .1); hc.rotation.x = .7; s.add(hc);
    const fur = std(0x8a5a3c, .8), light = std(0xc89a72, .85), ant = std(0x6b4a2e, .7);
    const deer = [];
    [[-.55, -2.4], [.55, -2.4], [-.55, -4], [.55, -4]].forEach(([x, z], i) => {
      const d = new T.Group(); d.position.set(x, .45, z); fly.add(d);
      const b = mesh(S_(.4, 18, 12), fur); b.scale.set(.8, .72, 1.5); d.add(b);
      d.add(mesh(new T.BoxGeometry(.55, .05, .5), std(0xb3201a, .6), 0, .29, .05));
      const n = mesh(new T.CylinderGeometry(.12, .16, .55, 10), fur, 0, .36, -.5); n.rotation.x = -.7; d.add(n);
      const hd = mesh(S_(.2, 14, 10), fur, 0, .66, -.78); hd.scale.set(.85, .85, 1.15); d.add(hd);
      d.add(mesh(S_(.11, 10, 8), light, 0, .6, -.98));
      d.add(mesh(S_(i === 2 ? .08 : .05, 10, 8), i === 2 ? std(0xff2a1a, .3, { emissive: 0xff2010, emissiveIntensity: 1.4 }) : M.black, 0, .62, -1.09));
      [-1, 1].forEach(k => { const a = mesh(new T.CylinderGeometry(.022, .03, .45, 6), ant, k * .1, .95, -.74); a.rotation.z = k * -.4; d.add(a); const t = mesh(new T.CylinderGeometry(.018, .022, .2, 6), ant, k * .17, 1.0, -.8); t.rotation.z = k * -1; d.add(t); });
      const legs = [];
      [[-.17, -.4], [.17, -.4], [-.17, .4], [.17, .4]].forEach(([lx, lz], j) => { const l = new T.Group(); l.position.set(lx, -.12, lz); l.add(mesh(new T.CylinderGeometry(.05, .045, .55, 8), fur, 0, -.27, 0)); d.add(l); l.userData.p = (j < 2 ? 0 : Math.PI) + i * .7; legs.push(l); });
      d.userData.legs = legs; d.userData.p = i * .8; deer.push(d);
    });
    fly.userData.deer = deer;
  })();
  fly.scale.setScalar(.55);
  const TR = 160, trG = new T.BufferGeometry(), trP = new Float32Array(TR * 3), trL = new Float32Array(TR);
  for (let i = 0; i < TR; i++) trP[i * 3 + 1] = -99;
  trG.setAttribute("position", new T.BufferAttribute(trP, 3));
  scene.add(new T.Points(trG, new T.PointsMaterial({ size: .16, map: soft, color: 0xffb93a, transparent: true, depthWrite: false })));
  let trN = 0;

  /* distant village silhouettes and pine trees */
  const farMat = std(0xd8cdd9, 1), winMat = new T.MeshBasicMaterial({ color: 0xffc27a });
  for (let i = 0; i < 10; i++) {
    const w = 2 + sr() * 2.5, h = 2 + sr() * 3, x = -20 + i * 4.6 + sr();
    const hs = new T.Mesh(new T.BoxGeometry(w, h, 2), farMat); hs.position.set(x, -5 + h / 2, -18 - sr() * 4); world.add(hs);
    const rf = new T.Mesh(new T.ConeGeometry(w * .78, 1.4, 4), std(0xf4f2fa, 1)); rf.rotation.y = Math.PI / 4; rf.position.set(x, -5 + h + .7, hs.position.z); world.add(rf);
    for (let k = 0; k < 3; k++) if (sr() < .55) { const wn = new T.Mesh(new T.PlaneGeometry(.35, .45), winMat); wn.position.set(x - w / 3 + k * w / 3, -5 + h * .55, hs.position.z + 1.01); world.add(wn); }
  }
  const pine = std(0x6f8f86, 1);
  for (let i = 0; i < 12; i++) { const x = -22 + i * 4 + sr() * 2, z = -12 - sr() * 6, s = .8 + sr() * .9; const t = new T.Mesh(new T.ConeGeometry(.9 * s, 3 * s, 8), pine); t.position.set(x, -4.4 + 1.5 * s, z); world.add(t); const c = new T.Mesh(new T.ConeGeometry(.7 * s, 1.2 * s, 8), std(0xf6f6fb, 1)); c.position.set(x, -4.4 + 2.6 * s, z); world.add(c); }

  /* snow */
  const SN = 1300, snG = new T.BufferGeometry(), snP = new Float32Array(SN * 3), snS = new Float32Array(SN);
  for (let i = 0; i < SN; i++) { snP[i * 3] = (sr() - .5) * 34; snP[i * 3 + 1] = sr() * 16 - 4; snP[i * 3 + 2] = (sr() - .5) * 22; snS[i] = .4 + sr() * .8; }
  snG.setAttribute("position", new T.BufferAttribute(snP, 3));
  scene.add(new T.Points(snG, new T.PointsMaterial({ size: .11, map: soft, color: 0xffffff, transparent: true, opacity: 1, depthWrite: false })));
  const sn2 = new T.Points(snG, new T.PointsMaterial({ size: .05, map: soft, color: 0x9aa0c8, transparent: true, opacity: .55, depthWrite: false })); scene.add(sn2);

  /* layout */
  let narrow = false;
  function resize() {
    const r = cv.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; narrow = camera.aspect < 1.05;
    camera.fov = narrow ? 50 : 34; camera.updateProjectionMatrix();
    chim.position.set(narrow ? 0 : 3.9, narrow ? .4 : 0, 0);
    roof.position.set(narrow ? 0 : 1.5, narrow ? -2.1 : -2.5, 0);
  }
  new ResizeObserver(resize).observe(cv); resize();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  frame.addEventListener("pointermove", e => { const r = frame.getBoundingClientRect(); mouse.tx = (e.clientX - r.left) / r.width * 2 - 1; mouse.ty = (e.clientY - r.top) / r.height * 2 - 1; });
  frame.addEventListener("pointerleave", () => { mouse.tx = mouse.ty = 0; });
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(frame);

  let last = performance.now(); const t0 = last;
  function tick(now) {
    const dt = Math.min(.04, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    const hs = window.__hs || 0;
    camera.position.set(Math.sin(t * .12) * .8 + mouse.x * 1.2, 1.4 - mouse.y * .6 + Math.sin(t * .2) * .2 + hs * 2.5, 15 + hs * 5);
    camera.lookAt(narrow ? 0 : 1.2, narrow ? 2.2 : .6, 0);
    sun.target.position.copy(chim.position);

    armR.rotation.z = 2.5 + Math.sin(t * 5) * .35;
    armL.rotation.z = -.5 + Math.sin(t * 1.3) * .08;
    santa.rotation.y = Math.sin(t * .6) * .35 - .25;
    santa.position.y = 1.5 + Math.sin(t * 2) * .05;
    head.rotation.z = Math.sin(t * 1.1) * .08;
    cone.rotation.x = Math.sin(t * 2.4) * .12;

    for (const p of presents) {
      const k = (p.phase + t * .055) % 1, y = 1.9 + k * 7, rad = .5 + k * 2.6, a = p.phase * Math.PI * 2 + k * 5 * p.dir;
      p.g.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad * .7);
      p.g.rotation.x += dt * p.spin; p.g.rotation.y += dt * p.spin * .8;
      p.g.scale.setScalar(Math.max(.001, p.size * Math.min(1, k * 6) * (1 - Math.max(0, (k - .85) / .15))));
    }

    // sleigh crosses the sky every 14 seconds, right to left, behind the chimney
    const u = (t % 14) / 14;
    const fx = narrow ? 9 - u * 18 : 15 - u * 30, fy = (narrow ? 5.6 : 3.4) + Math.sin(u * Math.PI) * 1.1, fz = -9 + u * 2;
    fly.position.set(fx, fy, fz); fly.rotation.set(0, Math.PI / 2 + .25, Math.sin(u * Math.PI * 2) * .06);
    fly.visible = u > .02 && u < .98;
    for (const d of fly.userData.deer) { d.position.y = .45 + Math.sin(t * 8 + d.userData.p) * .12; for (const l of d.userData.legs) l.rotation.x = Math.sin(t * 12 + l.userData.p) * .7; }
    if (fly.visible) for (let k = 0; k < 2; k++) { const i = trN; trN = (trN + 1) % TR; trP.set([fx + .7 + Math.random() * .3, fy - .1 + (Math.random() - .5) * .2, fz + (Math.random() - .5) * .3], i * 3); trL[i] = 1.4; }
    for (let i = 0; i < TR; i++) { if (trL[i] <= 0) continue; trL[i] -= dt; trP[i * 3 + 1] -= dt * .35; if (trL[i] <= 0) trP[i * 3 + 1] = -99; }
    trG.attributes.position.needsUpdate = true;

    for (let i = 0; i < SN; i++) { snP[i * 3 + 1] -= snS[i] * dt * .9; snP[i * 3] += Math.sin(t * .8 + i) * dt * .15; if (snP[i * 3 + 1] < -4) { snP[i * 3 + 1] = 12; snP[i * 3] = (Math.random() - .5) * 34; } }
    snG.attributes.position.needsUpdate = true;
    fire.intensity = 1.5 + Math.sin(t * 13) * .25;
    renderer.render(scene, camera);
  }
  function loop(now) { if (visible && !document.hidden) tick(now); else last = now; requestAnimationFrame(loop); }
  if (reduce) tick(performance.now() + 5000); else requestAnimationFrame(loop);
})();
