(() => {
  "use strict";
  // ---- example data, to be replaced by the API (see DEVELOPERS.md) ----
  const TODAY = 12;                                   // adventsdag
  const TODAY_HINT = "Drinkt elke ochtend twee koffie, zwart en zonder suiker.";
  const STREAK_FOR_HINT = 5;                          // pakjes op rij raak voor de hint van vandaag
  const PEOPLE = ["Sofie", "Jonas", "Lotte", "Wout", "Elif", "Bram", "Noor", "Tante Rita"];
  const BOARD_TODAY = [["Sofie", 1650], ["Jonas", 1420], ["Wout", 1210], ["Lotte", 980], ["Noor", 820], ["Elif", 640], ["Bram", 0]];
  const BOARD_TOTAL = [["Sofie", 14220], ["Jonas", 13180], ["Lotte", 11050], ["Wout", 9860], ["Elif", 8120], ["Bram", 6400], ["Noor", 5240]];
  const ME_TOTAL_BEFORE = 9950;                       // jouw totaal over dag 1 tot 11
  const DURATION = 45;

  const store = {
    get(k, d) { try { const v = localStorage.getItem("sl_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("sl_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const $ = id => document.getElementById(id);
  const stage = $("stage"), cv = $("cv"), fxEl = $("fx");

  /* ---------- end-screen helpers ---------- */
  const PAST = [
    [11, "Heeft een hekel aan rozijnen in kerstbrood."], [10, "Gaat elk jaar skiën in de krokusvakantie."], [9, "Speelt al jaren in een fanfare."],
    [8, "Draagt bijna altijd een sjaal, ook binnen."], [7, "Heeft twee katten."], [6, "Leest elke avond voor het slapengaan."], [5, "Fietst elke dag naar het werk."],
    [4, "Is dol op Indisch eten."], [3, "Heeft ooit een marathon gelopen."], [2, "Spaart oude vinylplaten."], [1, "Is de oudste van drie kinderen."]
  ];
  const PAST_GUESSES = [[7, "Lotte"], [8, "Lotte"], [9, "Jonas"], [10, "Jonas"], [11, "Wout"]];
  function renderHints() {}
  // highscores: "today" = beste score van vandaag, "total" = som van de dagrecords
  let boardKind = "today";
  function boardRows(kind, score) {
    const myToday = Math.max(store.get("best_d" + TODAY, 0), score || 0);
    const base = kind === "today" ? BOARD_TODAY : BOARD_TOTAL;
    const rows = base.map(([n, s]) => ({ n, s, me: false }));
    rows.push({ n: "Jij", s: kind === "today" ? myToday : ME_TOTAL_BEFORE + myToday, me: true });
    rows.sort((a, b) => b.s - a.s);
    return rows;
  }
  function renderBoard(score) {
    const lb = $("lb"); if (!lb) return;
    const rows = boardRows(boardKind, score);
    lb.innerHTML = rows.map((r, i) => `<li class="${r.me ? "me" : ""}"><span class="rk">${i + 1}</span><span>${r.n}${i === 0 ? ' <i class="crown" aria-label="eerste plaats">★</i>' : ""}</span><span class="sc">${r.s.toLocaleString("nl-BE")}</span></li>`).join("");
  }
  let showAll = false;
  function renderPast() {
    const el = $("past"); if (!el) return;
    el.innerHTML = PAST.slice(0, showAll ? PAST.length : 3).map(([d, h]) => `<li><b>Dag ${d}</b><span>${h}</span></li>`).join("");
    $("moreBtn").textContent = showAll ? "Toon minder" : "Toon alle 11 dagen";
  }
  function renderGuess() {
    const el = $("gchips"); if (!el) return;
    const g = store.get("guess", null);
    el.innerHTML = PEOPLE.map(p => `<button type="button" aria-pressed="${g === p}" data-p="${p}">${p}</button>`).join("");
    $("gstatus").innerHTML = g ? `Je gok voor dag 12: <b>${g}</b>. Aanpassen kan tot middernacht.` : "Kies wie jij denkt dat jou getrokken heeft.";
    $("timeline").innerHTML = PAST_GUESSES.map(([d, n]) => `<div><b>Dag ${d}</b><span>${n}</span></div>`).join("") + `<div class="today"><b>Vandaag</b><span>${g || "?"}</span></div>`;
  }

  /* ---------- audio ---------- */
  let ac = null, soundOn = store.get("sound", true);
  const soundBtn = $("soundBtn");
  const syncSound = () => { soundBtn.textContent = soundOn ? "Geluid aan" : "Geluid uit"; soundBtn.setAttribute("aria-pressed", String(soundOn)); };
  syncSound();
  soundBtn.addEventListener("click", e => { e.stopPropagation(); soundOn = !soundOn; store.set("sound", soundOn); syncSound(); });
  soundBtn.addEventListener("pointerdown", e => e.stopPropagation());
  function initAudio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === "suspended") ac.resume(); }
  function tone(f, d, type = "sine", v = .08, slide = 0) {
    if (!ac || !soundOn) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02);
  }
  const bells = () => [1568, 1976, 2349].forEach((f, i) => setTimeout(() => tone(f, .12, "triangle", .03), i * 40));
  const sfx = {
    drop() { tone(520, .16, "sine", .05, -260); },
    deliver(c) { const b = 523 * Math.pow(1.06, Math.min(c, 8)); [b, b * 1.26, b * 1.5].forEach((f, i) => setTimeout(() => tone(f, .16, "triangle", .07), i * 60)); bells(); },
    miss() { tone(220, .18, "sine", .04, -80); },
    star() { [988, 1319, 1568, 1976].forEach((f, i) => setTimeout(() => tone(f, .14, "sine", .06), i * 55)); },
    sponsor() { [659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .16, "square", .035), i * 70)); },
    hit() { tone(150, .32, "sawtooth", .09, -90); },
    hint() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, .22, "triangle", .06), i * 80)); },
    land() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, .3, "triangle", .06), i * 110)); }
  };
  let jingleT = 0;

  const nogl = msg => { const m = document.createElement("div"); m.className = "nogl"; m.textContent = msg; stage.appendChild(m); };
  if (!window.THREE) { nogl("De 3D-weergave kon niet laden. Herlaad de pagina of probeer een andere browser."); return; }
  const T = window.THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;

  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { nogl("Je browser ondersteunt geen WebGL, dus de slee kan niet vertrekken."); return; }
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  scene.fog = new T.Fog(0x1d1544, 30, 105);
  const camera = new T.PerspectiveCamera(58, 9 / 16, .1, 220);
  let WIDE = false;
  function resize() {
    const r = stage.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; WIDE = camera.aspect > 1.2; camera.fov = WIDE ? 44 : 58; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  /* ---------- lights ---------- */
  scene.add(new T.HemisphereLight(0xa9a0f0, 0x2a1a30, .75));
  const moonL = new T.DirectionalLight(0xc9d2ff, 1.15); moonL.position.set(-6, 22, -14); scene.add(moonL); scene.add(moonL.target);
  moonL.castShadow = true; const SMAP = Math.min(window.innerWidth, 2048) > 900 ? 2048 : 1024; moonL.shadow.mapSize.set(SMAP, SMAP);
  Object.assign(moonL.shadow.camera, { left: -13, right: 13, top: 16, bottom: -16, near: 1, far: 70 }); moonL.shadow.bias = -.0006; moonL.shadow.normalBias = .02;
  const front = new T.DirectionalLight(0xffe8d0, .7); front.position.set(3, 8, 10); scene.add(front);
  const sleighLight = new T.PointLight(0xffb070, 1.4, 12, 1.5); scene.add(sleighLight);

  /* ---------- helpers ---------- */
  function dotTex(inner, outer) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c);
  }
  const soft = dotTex("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  function brickTex() {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#3a1a16"; g.fillRect(0, 0, 128, 128);
    let s = 3; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const cols = ["#8a3b2e", "#7b3328", "#94443a", "#6f2d24"];
    for (let row = 0; row < 8; row++) { const off = row % 2 ? 16 : 0; for (let col = -1; col < 5; col++) { g.fillStyle = cols[Math.floor(r() * 4)]; g.fillRect(col * 32 + off + 2, row * 16 + 2, 28, 12); } }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  const S_ = (r, w = 20, h = 14) => new T.SphereGeometry(r, w, h);
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); return o; };
  const std = (color, rough = .7, extra = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
  const rand = (a, b) => a + Math.random() * (b - a);

  const M = {
    red: std(0xd8261e, .5), redDark: std(0x9e1914, .6), white: std(0xf7f2ff, .9), skin: std(0xffc9a8, .6),
    black: std(0x1c1626, .35), gold: std(0xffc94a, .25, { metalness: .75 }), green: std(0x2f8f5b, .7),
    fur: std(0x8a5a3c, .8), furLight: std(0xc89a72, .85), antler: std(0x6b4a2e, .7), hoof: std(0x2a1e18, .5),
    sack: std(0x9a6f3e, .95), snow: std(0xeef0ff, .95), roofEdge: std(0x2b2140, .8),
    brick: new T.MeshStandardMaterial({ map: brickTex(), roughness: .9 }),
    rudolph: new T.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2010, emissiveIntensity: 1.6, roughness: .3 }),
    hole: new T.MeshBasicMaterial({ color: 0x120604 }),
    tower: std(0x3a3266, .8), towerRoof: std(0x2b2450, .7)
  };

  /* ---------- sky: moon, stars, snow ---------- */
  const moon = new T.Sprite(new T.SpriteMaterial({ map: dotTex("rgba(255,250,235,1)", "rgba(255,240,220,0)"), transparent: true, depthWrite: false, fog: false }));
  moon.position.set(-22, 30, -120); moon.scale.set(30, 30, 1); scene.add(moon);
  const moonCore = new T.Mesh(new T.CircleGeometry(4.2, 48), new T.MeshBasicMaterial({ color: 0xfff6e2, fog: false })); moonCore.position.set(-22, 30, -119.5); scene.add(moonCore);
  const stG = new T.BufferGeometry(), stP = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) { stP[i * 3] = (Math.random() - .5) * 260; stP[i * 3 + 1] = 12 + Math.random() * 70; stP[i * 3 + 2] = -150 - Math.random() * 30; }
  stG.setAttribute("position", new T.BufferAttribute(stP, 3));
  scene.add(new T.Points(stG, new T.PointsMaterial({ size: .7, map: soft, color: 0xe8e2ff, transparent: true, depthWrite: false, fog: false })));
  const SN = 900, snG = new T.BufferGeometry(), snP = new Float32Array(SN * 3), snS = new Float32Array(SN);
  for (let i = 0; i < SN; i++) { snP[i * 3] = (Math.random() - .5) * 40; snP[i * 3 + 1] = Math.random() * 18 - 1; snP[i * 3 + 2] = -90 + Math.random() * 100; snS[i] = .5 + Math.random(); }
  snG.setAttribute("position", new T.BufferAttribute(snP, 3));
  scene.add(new T.Points(snG, new T.PointsMaterial({ size: .14, map: soft, color: 0xffffff, transparent: true, opacity: .85, depthWrite: false })));

  /* ground far below */
  const groundTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#e6e9fb'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(150,160,215,${Math.random() * .14})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(40, 50); return t; })();
  const ground = new T.Mesh(new T.PlaneGeometry(200, 260), new T.MeshStandardMaterial({ map: groundTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -1, -90); ground.receiveShadow = true; scene.add(ground);
  // footpaths between the house rows
  [-1.75, 1.75, -5.6, 5.6].forEach(x => { const p = new T.Mesh(new T.PlaneGeometry(.9, 260), new T.MeshStandardMaterial({ color: 0xbfc3df, roughness: 1 })); p.rotation.x = -Math.PI / 2; p.position.set(x, -.99, -90); p.receiveShadow = true; scene.add(p); });
  // drifting clouds
  const cloudTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); for (let i = 0; i < 14; i++) { const x = 40 + Math.random() * 176, y = 50 + Math.random() * 40, r = 22 + Math.random() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(200,195,240,.5)'); gr.addColorStop(1, 'rgba(200,195,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); } return new T.CanvasTexture(c); })();
  const clouds = []; for (let i = 0; i < 9; i++) { const c = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, transparent: true, opacity: .55, depthWrite: false })); c.position.set(rand(-30, 30), rand(13, 22), rand(-140, -10)); c.scale.set(rand(18, 30), rand(7, 11), 1); scene.add(c); clouds.push(c); }
  // chimney smoke
  const SM = 260, smG = new T.BufferGeometry(), smP = new Float32Array(SM * 3), smC = new Float32Array(SM * 3), smV = new Float32Array(SM * 2), smL = new Float32Array(SM);
  for (let i = 0; i < SM; i++) smP[i * 3 + 1] = -99;
  smG.setAttribute('position', new T.BufferAttribute(smP, 3)); smG.setAttribute('color', new T.BufferAttribute(smC, 3));
  const smoke = new T.Points(smG, new T.PointsMaterial({ size: .8, map: soft, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); smoke.frustumCulled = false; scene.add(smoke); let smN = 0;
  function puff(x, y, z, warm) { const i = smN; smN = (smN + 1) % SM; smP.set([x + rand(-.1, .1), y, z], i * 3); smV[i * 2] = rand(-.15, .15); smV[i * 2 + 1] = rand(.7, 1.2); smL[i] = 2.2; const c = warm ? [.5, .34, .18] : [.22, .21, .3]; smC.set(c, i * 3); }

  /* ---------- sleigh + reindeer ---------- */
  const SLEIGH_Y = 6.2, XLIM = 4.3;
  const rig = new T.Group(); rig.scale.setScalar(1.05); scene.add(rig);
  const sleigh = new T.Group(); rig.add(sleigh);
  (function buildSleigh() {
    const body = mesh(new T.BoxGeometry(1.6, .75, 2.1), M.red, 0, .35, .1); sleigh.add(body);
    sleigh.add(mesh(new T.BoxGeometry(1.62, .08, 2.12), M.gold, 0, .74, .1));
    const back = mesh(new T.BoxGeometry(1.6, .85, .28), M.red, 0, .9, 1.05); sleigh.add(back);
    sleigh.add(mesh(new T.BoxGeometry(1.64, .08, .32), M.gold, 0, 1.33, 1.05));
    const curl = mesh(new T.TorusGeometry(.42, .14, 10, 24, Math.PI), M.red, 0, .55, -.95); curl.rotation.y = Math.PI / 2; curl.rotation.z = Math.PI / 2; sleigh.add(curl);
    [-1, 1].forEach(s => {
      sleigh.add(mesh(new T.BoxGeometry(.08, .08, 2.6), M.gold, s * .62, -.22, 0));
      const rc = mesh(new T.TorusGeometry(.3, .045, 8, 16, Math.PI), M.gold, s * .62, .08, -1.3); rc.rotation.y = Math.PI / 2; rc.rotation.z = -Math.PI / 2; sleigh.add(rc);
      [-.7, .7].forEach(z => sleigh.add(mesh(new T.BoxGeometry(.06, .3, .06), M.gold, s * .62, -.05, z)));
    });
    // sack with presents
    const sack = mesh(S_(.55), M.sack, 0, 1.05, .75); sack.scale.set(1, 1.05, .9); sleigh.add(sack);
    // velvet seat, tartan lap blanket, gold scrollwork and a lantern on a pole
    sleigh.add(mesh(new T.BoxGeometry(1.4, .18, .9), std(0x1f5a3a, .7), 0, .78, .45));
    const plaid = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.fillStyle = "#1f5a3a"; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(200,30,30,.75)"; for (let i = 0; i < 64; i += 16) { g.fillRect(i, 0, 5, 64); g.fillRect(0, i, 64, 5); } g.fillStyle = "rgba(255,200,80,.6)"; for (let i = 8; i < 64; i += 16) { g.fillRect(i, 0, 1.5, 64); g.fillRect(0, i, 64, 1.5); } const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 2); return t; })();
    const lap = mesh(new T.BoxGeometry(1.3, .12, .7), new T.MeshStandardMaterial({ map: plaid, roughness: .9 }), 0, 1.0, -.25); lap.rotation.x = .25; sleigh.add(lap);
    [-1, 1].forEach(s => {
      const sc = mesh(new T.TorusGeometry(.22, .04, 8, 20, Math.PI * 1.5), M.gold, s * .81, .45, .45); sc.rotation.y = s * Math.PI / 2; sleigh.add(sc);
      const sc2 = mesh(new T.TorusGeometry(.14, .035, 8, 18, Math.PI * 1.5), M.gold, s * .81, .45, -.35); sc2.rotation.y = s * Math.PI / 2; sc2.rotation.z = Math.PI; sleigh.add(sc2);
      sleigh.add(mesh(new T.BoxGeometry(.03, .06, 1.9), M.gold, s * .81, .2, .1));
    });
    const pole = mesh(new T.CylinderGeometry(.03, .03, .9, 6), M.gold, .7, 1.0, -1.05); sleigh.add(pole);
    const lant = mesh(new T.BoxGeometry(.2, .26, .2), std(0xfff0c8, .2, { emissive: 0xffc070, emissiveIntensity: 2.2 }), .7, 1.55, -1.05); sleigh.add(lant);
    sleigh.add(mesh(new T.ConeGeometry(.17, .14, 4), M.gold, .7, 1.75, -1.05));
    const lg = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffc27a, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false })); lg.position.set(.7, 1.55, -1.05); lg.scale.set(1.8, 1.8, 1); sleigh.add(lg);
    [[.25, 1.55, .7, 0xe8332a], [-.2, 1.6, .85, 0x3f8cff], [.02, 1.7, .55, 0xffc94a]].forEach(([x, y, z, c]) => { const b = mesh(new T.BoxGeometry(.3, .3, .3), std(c, .45), x, y, z); b.rotation.set(.3, .5, .2); sleigh.add(b); });
    // Santa from behind (seated)
    const santa = new T.Group(); santa.position.set(0, .95, .05); sleigh.add(santa);
    const torso = mesh(S_(.45, 24, 18), M.red); torso.scale.set(1, 1.05, .9); santa.add(torso);
    const trim = mesh(new T.TorusGeometry(.33, .07, 10, 24), M.white, 0, -.35, 0); trim.rotation.x = Math.PI / 2; santa.add(trim);
    santa.add(mesh(new T.CylinderGeometry(.46, .46, .13, 24), M.black, 0, -.08, 0));
    const head = mesh(S_(.27), M.skin, 0, .62, -.05); santa.add(head);
    const beard = mesh(S_(.26), M.white, 0, .5, -.16); beard.scale.set(1.05, 1, .8); santa.add(beard);
    const brim = mesh(new T.TorusGeometry(.25, .07, 10, 24), M.white, 0, .8, -.04); brim.rotation.x = Math.PI / 2; santa.add(brim);
    const hat = new T.Group(); hat.position.set(0, .8, -.04); santa.add(hat);
    hat.add(mesh(new T.ConeGeometry(.25, .6, 22), M.red, 0, .3, 0)); hat.add(mesh(S_(.08), M.white, 0, .6, 0));
    hat.rotation.x = .75; sleigh.userData.hat = hat;
    [-1, 1].forEach(s => { const a = mesh(new T.CylinderGeometry(.1, .11, .55, 10), M.red, s * .38, .15, -.3); a.rotation.x = 1.1; a.rotation.z = s * -.3; santa.add(a); santa.add(mesh(S_(.11, 12, 10), M.green, s * .32, .02, -.55)); });
  })();

  function buildReindeer(rudolph) {
    const g = new T.Group();
    const body = mesh(S_(.42, 20, 14), M.fur); body.scale.set(.8, .72, 1.5); g.add(body);
    const belly = mesh(S_(.36, 16, 12), M.furLight, 0, -.12, 0); belly.scale.set(.72, .55, 1.3); g.add(belly);
    const neck = mesh(new T.CylinderGeometry(.13, .17, .62, 12), M.fur, 0, .38, -.52); neck.rotation.x = -.7; g.add(neck);
    const head = new T.Group(); head.position.set(0, .7, -.8); g.add(head);
    const hd = mesh(S_(.21, 16, 12), M.fur); hd.scale.set(.85, .85, 1.15); head.add(hd);
    head.add(mesh(S_(.12, 12, 10), M.furLight, 0, -.05, -.2));
    head.add(mesh(S_(rudolph ? .085 : .055, 12, 10), rudolph ? M.rudolph : M.black, 0, -.03, -.32));
    [-1, 1].forEach(s => {
      head.add(mesh(S_(.03, 8, 6), M.black, s * .1, .07, -.13));
      const ear = mesh(new T.ConeGeometry(.06, .18, 8), M.fur, s * .17, .12, .02); ear.rotation.z = s * -1.2; head.add(ear);
      const ant = new T.Group(); ant.position.set(s * .08, .17, .02); ant.rotation.z = s * -.35; head.add(ant);
      const main = mesh(new T.CylinderGeometry(.025, .035, .5, 6), M.antler, 0, .25, 0); main.rotation.x = .25; ant.add(main);
      const t1 = mesh(new T.CylinderGeometry(.02, .025, .22, 6), M.antler, s * .07, .28, -.05); t1.rotation.z = s * -.9; ant.add(t1);
      const t2 = mesh(new T.CylinderGeometry(.02, .025, .2, 6), M.antler, s * -.02, .4, -.12); t2.rotation.x = -.8; ant.add(t2);
    });
    if (rudolph) { const glow = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xff3020, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false })); glow.position.set(0, -.03, -.34); glow.scale.set(.9, .9, 1); head.add(glow); }
    const collar = mesh(new T.TorusGeometry(.17, .045, 8, 18), M.red, 0, .2, -.42); collar.rotation.x = -.85; g.add(collar);
    g.add(mesh(S_(.06, 10, 8), M.gold, 0, .1, -.55));
    const legs = [];
    [[-.18, -.42], [.18, -.42], [-.18, .42], [.18, .42]].forEach(([x, z], i) => {
      const leg = new T.Group(); leg.position.set(x, -.12, z); g.add(leg);
      leg.add(mesh(new T.CylinderGeometry(.055, .05, .62, 8), M.fur, 0, -.31, 0));
      leg.add(mesh(S_(.065, 8, 6), M.hoof, 0, -.64, 0));
      leg.userData.phase = (i < 2 ? 0 : Math.PI) + (i % 2) * .4;
      legs.push(leg);
    });
    g.add(mesh(S_(.08, 8, 6), M.white, 0, .15, .62));
    // saddle blanket with gold trim, chest harness with sleigh bells
    const blanket = mesh(new T.BoxGeometry(.62, .06, .62), std(0xb3201a, .6), 0, .3, .05); blanket.rotation.x = -.05; g.add(blanket);
    g.add(mesh(new T.BoxGeometry(.66, .03, .66), M.gold, 0, .27, .05));
    [-1, 1].forEach(s => { const flap = mesh(new T.BoxGeometry(.04, .3, .55), std(0xb3201a, .6), s * .32, .15, .05); flap.rotation.z = s * .25; g.add(flap); });
    const strap = mesh(new T.TorusGeometry(.33, .035, 6, 24), std(0x5a1410, .6), 0, 0, -.32); strap.scale.set(1, .85, 1); g.add(strap);
    for (let b = -2; b <= 2; b++) g.add(mesh(S_(.05, 8, 6), M.gold, Math.sin(b * .5) * .3, -.24 + Math.abs(b) * .05, -.36 + Math.abs(b) * .02));
    [-1, 1].forEach(s => head.add(mesh(S_(.012, 6, 4), M.white, s * .108, .085, -.155)));
    g.userData = { legs, head };
    return g;
  }
  const deer = [];
  [[-.6, -2.6, false], [.6, -2.6, false], [-.6, -4.3, true], [.6, -4.3, false]].forEach(([x, z, r], i) => {
    const d = buildReindeer(r); d.position.set(x, .45, z); d.userData.base = new T.Vector3(x, .45, z); d.userData.ph = i * .7; rig.add(d); deer.push(d);
  });
  // reins
  const reinMat = new T.LineBasicMaterial({ color: 0xffc94a, transparent: true, opacity: .8 });
  const reinGeo = new T.BufferGeometry(); const reinPos = new Float32Array(4 * 2 * 3);
  reinGeo.setAttribute("position", new T.BufferAttribute(reinPos, 3));
  rig.add(new T.LineSegments(reinGeo, reinMat));
  rig.traverse(o => { if (o.isMesh) o.castShadow = true; });

  // golden sparkle trail
  const TR = 220, trG = new T.BufferGeometry(), trP = new Float32Array(TR * 3), trL = new Float32Array(TR);
  for (let i = 0; i < TR; i++) trP[i * 3 + 1] = -99;
  trG.setAttribute("position", new T.BufferAttribute(trP, 3));
  const trail = new T.Points(trG, new T.PointsMaterial({ size: .18, map: soft, color: 0xffd27a, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  trail.frustumCulled = false; scene.add(trail); let trN = 0;

  /* ---------- burst particles ---------- */
  const BU = 400, bG = new T.BufferGeometry(), bP = new Float32Array(BU * 3), bC = new Float32Array(BU * 3), bV = new Float32Array(BU * 3), bL = new Float32Array(BU);
  for (let i = 0; i < BU; i++) bP[i * 3 + 1] = -99;
  bG.setAttribute("position", new T.BufferAttribute(bP, 3)); bG.setAttribute("color", new T.BufferAttribute(bC, 3));
  const bursts = new T.Points(bG, new T.PointsMaterial({ size: .3, map: soft, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  bursts.frustumCulled = false; scene.add(bursts); let bN = 0;
  function burst(p, hex, n = 30, spd = 5, up = 2) {
    const c = new T.Color(hex);
    for (let k = 0; k < n; k++) {
      const i = bN; bN = (bN + 1) % BU;
      bP[i * 3] = p.x; bP[i * 3 + 1] = p.y; bP[i * 3 + 2] = p.z;
      const v = new T.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(spd * (.3 + Math.random() * .7));
      bV[i * 3] = v.x; bV[i * 3 + 1] = v.y + up; bV[i * 3 + 2] = v.z;
      bC[i * 3] = c.r; bC[i * 3 + 1] = c.g; bC[i * 3 + 2] = c.b; bL[i] = .7 + Math.random() * .5;
    }
  }

  /* ---------- world objects (detailed, merged per material for speed) ---------- */
  function canvasTex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
  }
  let seed = 17; const srnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const sidingTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#d9d4e4"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      const l = 205 + srnd() * 30; g.fillStyle = `rgb(${l},${l - 4},${l + 8})`; g.fillRect(0, y, w, 14);
      g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(0, y + 14, w, 2);
      g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, y, w, 1);
      for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(srnd() * w, y, 1 + srnd() * 2, 14); }
    }
  }, 1, 1);
  const shingleTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#2a2340"; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) {
      const off = row % 2 ? 16 : 0;
      for (let col = -1; col < 9; col++) {
        const l = 60 + srnd() * 30; g.fillStyle = `rgb(${l + 30},${l - 10},${l - 6})`;
        g.beginPath(); g.roundRect ? g.roundRect(col * 32 + off + 1, row * 16 + 1, 30, 15, [0, 0, 6, 6]) : g.rect(col * 32 + off + 1, row * 16 + 1, 30, 15); g.fill();
        g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(col * 32 + off + 1, row * 16 + 13, 30, 3);
      }
    }
  }, 2, 2);
  const snowTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#eef1ff"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = srnd(); g.fillStyle = v > .97 ? "rgba(255,255,255,1)" : `rgba(160,170,220,${srnd() * .12})`; g.fillRect(srnd() * w, srnd() * h, 2, 2); }
  }, 2, 2);
  const brickTex2 = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#3a1a16"; g.fillRect(0, 0, w, h);
    const cols = ["#8a3b2e", "#7b3328", "#94443a", "#6f2d24", "#a24d3d"];
    for (let row = 0; row < 16; row++) { const off = row % 2 ? 16 : 0; for (let col = -1; col < 9; col++) {
      g.fillStyle = cols[Math.floor(srnd() * cols.length)]; g.fillRect(col * 32 + off + 2, row * 16 + 2, 28, 12);
      g.fillStyle = "rgba(255,220,190,.1)"; g.fillRect(col * 32 + off + 2, row * 16 + 2, 28, 2);
    } }
    const gr = g.createLinearGradient(0, 0, 0, 60); gr.addColorStop(0, "rgba(20,10,10,.85)"); gr.addColorStop(1, "rgba(20,10,10,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, 60);
  }, 1, 1.4);
  const WALL_TINTS = [0x6e5a9a, 0x9a5a6e, 0x5a7aa6, 0xb0805e, 0x6a8a7a, 0xc4b59a, 0x8a6fb0];
  const wallMats = WALL_TINTS.map(c => new T.MeshStandardMaterial({ color: c, map: sidingTex, roughness: .85 }));
  const shingleMat = new T.MeshStandardMaterial({ map: shingleTex, roughness: .8 });
  const snowMat = new T.MeshStandardMaterial({ map: snowTex, roughness: .9, color: 0xf4f6ff });
  const iceMat = new T.MeshStandardMaterial({ color: 0xcfe6ff, roughness: .1, metalness: .1, transparent: true, opacity: .85 });
  const trimMat = std(0xf3efe6, .6);
  const chimMat = new T.MeshStandardMaterial({ map: brickTex2, roughness: .9 });
  const capMat = std(0x5d4a48, .8);
  const doorMats = [std(0x7a1d1d, .5), std(0x1e4d3a, .5), std(0x23305a, .5)];
  const wreathMat = std(0x1f6b3a, .9), bowMat = std(0xd8261e, .5), knobMat = M.gold;
  const glassOff = () => new T.MeshStandardMaterial({ color: 0x1e2546, roughness: .15, metalness: .6, emissive: 0x0b0d22, emissiveIntensity: 1 });
  const ringMat = new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0, depthWrite: false });
  const BULBS = [0xff4a3a, 0xffc94a, 0x4ad08a, 0x4a9aff, 0xff7ad0];

  // merge every mesh in a temp group into one mesh per material, keeping "keep" meshes live
  function bake(tmp, shadow = true) {
    tmp.updateMatrixWorld(true);
    const buckets = new Map(), keep = [];
    tmp.traverse(o => {
      if (!o.isMesh) return;
      if (o.userData.keep) { keep.push(o); return; }
      if (!buckets.has(o.material)) buckets.set(o.material, []);
      buckets.get(o.material).push(o);
    });
    const out = new T.Group();
    for (const [mat, list] of buckets) {
      let n = 0; const geos = list.map(m => { const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()); g.applyMatrix4(m.matrixWorld); n += g.attributes.position.count; return g; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      for (const g of geos) {
        pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
        o += g.attributes.position.count; g.dispose();
      }
      list.forEach(m => m.geometry.dispose());
      const bg = new T.BufferGeometry();
      bg.setAttribute("position", new T.BufferAttribute(pos, 3)); bg.setAttribute("normal", new T.BufferAttribute(nor, 3)); bg.setAttribute("uv", new T.BufferAttribute(uv, 2));
      const bm = new T.Mesh(bg, mat); bm.castShadow = shadow && !mat.transparent; bm.receiveShadow = true; out.add(bm);
    }
    for (const k of keep) { const mw = k.matrixWorld.clone(); k.removeFromParent(); k.position.set(0, 0, 0); k.rotation.set(0, 0, 0); k.scale.set(1, 1, 1); k.applyMatrix4(mw); out.add(k); }
    return out;
  }
  const keepMesh = (g, m, x, y, z) => { const o = mesh(g, m, x, y, z); o.userData.keep = true; return o; };

  function prism(w, h, d) {
    const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(0, h); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0);
    const g = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g;
  }
  function addWindow(tmp, x, y, z, glass, wide) {
    const fw = wide ? .72 : .5, fh = .62;
    tmp.add(mesh(new T.BoxGeometry(fw + .1, fh + .1, .06), trimMat, x, y, z));
    const gl = keepMesh(new T.PlaneGeometry(fw - .04, fh - .04), glass, x, y, z + .035); tmp.add(gl);
    tmp.add(mesh(new T.BoxGeometry(.04, fh, .03), trimMat, x, y, z + .05));
    tmp.add(mesh(new T.BoxGeometry(fw, .04, .03), trimMat, x, y + .04, z + .05));
    tmp.add(mesh(new T.BoxGeometry(fw + .2, .06, .14), trimMat, x, y - fh / 2 - .06, z + .06));
    tmp.add(mesh(new T.BoxGeometry(fw + .16, .06, .12), snowMat, x, y - fh / 2 - .01, z + .07));
  }
  function bulbPoints(pts, opacity) {
    const geo = new T.BufferGeometry(), pos = new Float32Array(pts.length * 3), col = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { pos.set(p, i * 3); const c = new T.Color(BULBS[i % BULBS.length]); col.set([c.r, c.g, c.b], i * 3); });
    geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const mat = new T.PointsMaterial({ size: .26, map: soft, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending });
    return new T.Points(geo, mat);
  }

  function buildHouse(x) {
    const tmp = new T.Group();
    const w = rand(2.5, 3.1), d = rand(2.7, 3.3), h = rand(1.9, 3.1);
    const wallMat = wallMats[Math.floor(Math.random() * wallMats.length)];
    const top = -1 + h, rise = 1.15, ov = .28;
    tmp.add(mesh(new T.BoxGeometry(w, h, d), wallMat, 0, -1 + h / 2, 0));
    tmp.add(mesh(prism(w, rise, d), wallMat, 0, top, 0));
    // corner trims and a foundation band
    [-1, 1].forEach(s => [-1, 1].forEach(t => tmp.add(mesh(new T.BoxGeometry(.1, h, .1), trimMat, s * w / 2, -1 + h / 2, t * d / 2))));
    tmp.add(mesh(new T.BoxGeometry(w + .06, .1, d + .06), trimMat, 0, top, 0));
    // roof: two shingle panels, each with a snow blanket, ridge cap and snow lip
    const half = w / 2 + ov, len = Math.hypot(half, rise), ang = Math.atan2(rise, half);
    [-1, 1].forEach(s => {
      const side = new T.Group(); side.position.set(s * half / 2, top + rise / 2 + .05, 0); side.rotation.z = -s * ang; tmp.add(side);
      side.add(mesh(new T.BoxGeometry(len + .02, .14, d + .45), shingleMat, 0, 0, 0));
      const snowW = len * rand(.68, .86);
      side.add(mesh(new T.BoxGeometry(snowW, .2, d + .48), snowMat, -s * (len - snowW) / 2, .13, 0));
      const lip = mesh(new T.CylinderGeometry(.11, .11, d + .48, 10), snowMat, -s * (len / 2 - snowW) , .1, 0); lip.rotation.x = Math.PI / 2; side.add(lip);
      // icicles along the eave
      for (let z = -d / 2; z <= d / 2; z += rand(.16, .3)) {
        const L = rand(.12, .38);
        const ic = mesh(new T.ConeGeometry(.035, L, 5), iceMat, s * (len / 2), -.07 - L / 2, z); ic.rotation.x = Math.PI; ic.rotation.z = s * ang; side.add(ic);
      }
    });
    const ridge = mesh(new T.CylinderGeometry(.16, .16, d + .5, 12), snowMat, 0, top + rise + .1, 0); ridge.rotation.x = Math.PI / 2; tmp.add(ridge);
    // front facade (+z faces the camera)
    const fz = d / 2 + .02, glass = glassOff();
    const rows = h > 2.55 ? 2 : 1;
    for (let r = 0; r < rows; r++) {
      const wy = top - .55 - r * 1.05;
      if (r === rows - 1) { addWindow(tmp, -w * .28, wy, fz, glass); addWindow(tmp, w * .28, wy, fz, glass); }
      else { addWindow(tmp, -w * .22, wy, fz, glass, true); addWindow(tmp, w * .22, wy, fz, glass, true); }
    }
    // round attic window in the gable
    const att = keepMesh(new T.CircleGeometry(.2, 20), glass, 0, top + .45, fz + .01); tmp.add(att);
    tmp.add(mesh(new T.TorusGeometry(.22, .04, 8, 20), trimMat, 0, top + .45, fz + .02));
    // side windows
    [-1, 1].forEach(s => { const sw = keepMesh(new T.PlaneGeometry(.45, .55), glass, s * (w / 2 + .01), top - .6, 0); sw.rotation.y = s * Math.PI / 2; tmp.add(sw); });
    // door with wreath (only when the ground floor is tall enough to show it)
    const dm = doorMats[Math.floor(Math.random() * doorMats.length)];
    tmp.add(mesh(new T.BoxGeometry(.56, .95, .07), dm, 0, -1 + .48, fz));
    tmp.add(mesh(new T.BoxGeometry(.68, .06, .1), trimMat, 0, -1 + .98, fz + .02));
    tmp.add(mesh(S_(.035, 8, 6), knobMat, .18, -1 + .45, fz + .06));
    tmp.add(mesh(new T.TorusGeometry(.13, .045, 8, 18), wreathMat, 0, -1 + .7, fz + .07));
    tmp.add(mesh(S_(.04, 8, 6), bowMat, 0, -1 + .58, fz + .1));
    tmp.add(mesh(new T.BoxGeometry(.8, .1, .3), snowMat, 0, -.95, fz + .15));
    // chimney
    const cx = (Math.random() < .5 ? -1 : 1) * rand(w * .12, w * .28);
    const slope = rise * (1 - Math.abs(cx) / half);
    const cBase = top + slope - .5, cH = rand(1.15, 1.5);
    tmp.add(mesh(new T.BoxGeometry(.78, cH, .78), chimMat, cx, cBase + cH / 2, 0));
    const capY = cBase + cH;
    tmp.add(mesh(new T.BoxGeometry(.98, .14, .98), capMat, cx, capY + .02, 0));
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => tmp.add(mesh(new T.BoxGeometry(a ? .14 : .98, .1, b ? .14 : .98), snowMat, cx + a * .42, capY + .13, b * .42)));
    const hole = keepMesh(new T.PlaneGeometry(.62, .62), M.hole, cx, capY + .1, 0); hole.rotation.x = -Math.PI / 2; tmp.add(hole);
    const ring = keepMesh(new T.TorusGeometry(.62, .07, 8, 28), ringMat.clone(), cx, capY + .24, 0); ring.rotation.x = Math.PI / 2; tmp.add(ring);

    const g = bake(tmp);
    g.position.x = x;
    const ringM = g.children.find(o => o.geometry && o.geometry.type === "TorusGeometry");
    const glow = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffb35c, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    glow.position.set(cx, capY + .55, 0); glow.scale.set(3, 3, 1); g.add(glow);
    // string lights along the front gable edges, dim until delivered
    const pts = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, sx = -half + t * 2 * half; pts.push([sx, top + rise * (1 - Math.abs(sx) / half) - .06 + Math.sin(i * 1.7) * .03, d / 2 + .3]); }
    const lights = bulbPoints(pts, .18); g.add(lights);
    const porch = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffc27a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    porch.position.set(0, -1 + 1.1, fz + .3); porch.scale.set(1.6, 1.6, 1); g.add(porch);
    return { g, k: "house", cx: x + cx, top: capY + .1, ring: ringM, glow, wm: glass, lights, porch, delivered: false, half: w / 2, smokeT: Math.random() * 2, chimX: cx, chimY: capY + .3 };
  }
  function buildTree(x, z) {
    const tmp = new T.Group(), s = rand(.8, 1.25);
    const leaf = std(0x1f4d3a, .9);
    tmp.add(mesh(new T.CylinderGeometry(.12 * s, .16 * s, .6 * s, 8), std(0x4a2f22, .9), 0, -.7, 0));
    [[1.1, 1.0, -.3], [.85, .9, .35], [.6, .8, .95]].forEach(([r, hh, y]) => {
      tmp.add(mesh(new T.ConeGeometry(r * s, hh * s * 1.3, 10), leaf, 0, y * s, 0));
      tmp.add(mesh(new T.ConeGeometry(r * s * .82, hh * s * .55, 10), snowMat, 0, y * s + hh * s * .48, 0));
    });
    tmp.add(mesh(new T.OctahedronGeometry(.16 * s), std(0xffc94a, .3, { emissive: 0xffa21a, emissiveIntensity: 1.2 }), 0, 1.75 * s, 0));
    const g = bake(tmp); g.position.set(x, 0, z);
    const pts = []; for (let i = 0; i < 26; i++) { const a = i * 2.4, yy = -.35 + i / 26 * 2, r = (1 - (yy + .35) / 2.2) * 1.05 * s; pts.push([Math.cos(a) * r, yy * s, Math.sin(a) * r]); }
    const l = bulbPoints(pts, .95); l.material.size = .22; g.add(l);
    return { g, k: "decor", lights: l };
  }
  function buildLamp(x, z) {
    const tmp = new T.Group();
    tmp.add(mesh(new T.CylinderGeometry(.05, .07, 2.2, 8), M.black, 0, .1, 0));
    tmp.add(mesh(new T.BoxGeometry(.28, .32, .28), std(0xfff0c8, .3, { emissive: 0xffc070, emissiveIntensity: 2 }), 0, 1.35, 0));
    tmp.add(mesh(new T.ConeGeometry(.25, .18, 4), M.black, 0, 1.6, 0));
    const g = bake(tmp, false); g.position.set(x, 0, z);
    const gl = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffc27a, transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false }));
    gl.position.y = 1.35; gl.scale.set(2.2, 2.2, 1); g.add(gl);
    const pool = new T.Mesh(new T.CircleGeometry(1.3, 24), new T.MeshBasicMaterial({ map: soft, color: 0xffb060, transparent: true, opacity: .45, depthWrite: false, blending: T.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -.98; g.add(pool);
    return { g, k: "decor" };
  }
  function buildTower(x) {
    const g = new T.Group(); g.position.x = x;
    g.add(mesh(new T.BoxGeometry(1.6, 6.2, 1.6), M.tower, 0, 2.1, 0));
    const sp = mesh(new T.ConeGeometry(1.25, 3.4, 4), M.towerRoof, 0, 6.9, 0); sp.rotation.y = Math.PI / 4; g.add(sp);
    g.add(mesh(new T.CylinderGeometry(.04, .04, .9, 6), M.gold, 0, 9, 0));
    g.add(mesh(new T.BoxGeometry(.5, .06, .06), M.gold, 0, 9.1, 0));
    const clock = mesh(new T.CircleGeometry(.42, 24), new T.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd28a, emissiveIntensity: .7 }), 0, 4.2, .81); g.add(clock);
    // warning light at the tip
    const tip = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xff4030, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false }));
    tip.position.set(0, 9.6, 0); tip.scale.set(1.4, 1.4, 1); g.add(tip);
    return { g, k: "tower", x, tip };
  }
  const starShape = new T.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .24 : .58; const px = Math.cos(a) * r, py = Math.sin(a) * r; i ? starShape.lineTo(px, py) : starShape.moveTo(px, py); }
  const starGeo = new T.ExtrudeGeometry(starShape, { depth: .14, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: 3 }); starGeo.center();
  const starMat = std(0xffc94a, .25, { emissive: 0xffa21a, emissiveIntensity: 1, metalness: .5 });
  function buildStar(x) {
    const g = new T.Group(); g.position.set(x, SLEIGH_Y + .5, 0); g.add(new T.Mesh(starGeo, starMat));
    const s = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0xffc94a, transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false })); s.scale.set(3, 3, 1); g.add(s);
    return { g, k: "star", x };
  }
  const sponsorTex = (() => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d");
    g.fillStyle = "#5fe0b5"; g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#0f2b25"; g.font = "bold 120px 'Bagel Fat One','Trebuchet MS',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("JM", 256, 110);
    g.font = "600 34px 'IBM Plex Mono', monospace"; g.fillText("JOUW MERK HIER", 256, 205);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  })();
  function buildSponsor(x) {
    const g = new T.Group(); g.position.set(x, SLEIGH_Y + .4, 0);
    const ring = mesh(new T.TorusGeometry(1.25, .14, 12, 40), std(0x5fe0b5, .35, { emissive: 0x2a9c7a, emissiveIntensity: .8 })); g.add(ring);
    // balloon above holding the ring
    const bal = new T.Group(); bal.position.y = 3.4; g.add(bal);
    const env = mesh(S_(1.3, 28, 20), std(0x5fe0b5, .5)); env.scale.set(1, 1.15, 1); bal.add(env);
    const banner = mesh(new T.PlaneGeometry(2.2, 1.1), new T.MeshStandardMaterial({ map: sponsorTex, roughness: .6 }), 0, -.1, 1.32); bal.add(banner);
    bal.add(mesh(new T.BoxGeometry(.5, .35, .5), std(0x8a5a3c, .9), 0, -1.75, 0));
    [-1, 1].forEach(s => { const l = mesh(new T.CylinderGeometry(.015, .015, 2.2, 4), M.black, s * .9, -2.1, 0); l.rotation.z = s * .25; g.add(l); });
    const gl = new T.Sprite(new T.SpriteMaterial({ map: soft, color: 0x5fe0b5, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false })); gl.scale.set(4, 4, 1); g.add(gl);
    return { g, k: "sponsor", x };
  }

  /* ---------- falling presents ---------- */
  const PCOL = [[0xe8332a, 0xffc94a], [0x3f8cff, 0xf6f1ff], [0xffc94a, 0xe8332a], [0x9b5bff, 0x5fe0b5]];
  const pMats = PCOL.map(([b, r]) => [std(b, .45), std(r, .35, { metalness: .2 })]);
  const pBox = new T.BoxGeometry(.5, .5, .5), pA = new T.BoxGeometry(.12, .52, .52), pB = new T.BoxGeometry(.52, .52, .12);
  function buildPresent() {
    const [mb, mr] = pMats[Math.floor(Math.random() * 4)], g = new T.Group();
    g.add(new T.Mesh(pBox, mb)); g.add(new T.Mesh(pA, mr)); g.add(new T.Mesh(pB, mr)); return g;
  }

  /* ---------- state ---------- */
  const G = 15, DROP_V = 1.5;
  const S = { mode: "intro", t: 0, speed: 8, x: 0, tx: 0, vx: 0, lives: 3, inv: 0, score: 0, delivered: 0, drops: 0, combo: 0, best: 0, stars: 0, sponsors: 0,
    objs: [], falling: [], nextRowZ: 0, nextStar: 0, nextSponsor: 0, starsSpawned: 0, shake: 0, endT: 0, stuck: false, cool: 0, rows: 0 };
  const SPAWN_Z = -100, ROW_GAP = 9, LANES = [-3.5, 0, 3.5];

  function clearAll() { for (const o of S.objs) scene.remove(o.g); for (const p of S.falling) scene.remove(p.g); S.objs = []; S.falling = []; }
  function spawnRow(z) {
    S.rows++;
    const playing = S.mode === "play";
    const towerLane = playing && S.t > 5 && Math.random() < .28 ? Math.floor(Math.random() * 3) : -1;
    LANES.forEach((lx, i) => {
      let o;
      if (i === towerLane) o = buildTower(lx + rand(-.4, .4));
      else if (Math.random() < .9) o = buildHouse(lx + rand(-.35, .35));
      if (o) { o.g.position.z = z; scene.add(o.g); S.objs.push(o); }
    });
    // trees and street lamps on the paths between the houses
    [-1.75, 1.75, -5.6, 5.6].forEach((lx, i) => { const r = Math.random(); let o = null; if (r < .4) o = buildTree(lx + rand(-.15, .15), z + rand(-3.5, 3.5)); else if (r < .62 && i < 2) o = buildLamp(lx, z + 3); if (o) { o.g.traverse(m => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); scene.add(o.g); S.objs.push(o); } });
    // decorative outer rows so the village feels endless
    (WIDE ? [-15.2, -11.4, -7.6, 7.6, 11.4, 15.2] : [-7.6, 7.6]).forEach(lx => { if (Math.random() < .85) { const o = buildHouse(lx + rand(-.4, .4)); o.decor = true; o.g.position.z = z + rand(-2, 2); scene.add(o.g); S.objs.push(o); } });
  }
  function reset() {
    clearAll();
    Object.assign(S, { mode: "play", t: 0, speed: 15, x: 0, tx: 0, vx: 0, lives: 3, inv: 1, score: 0, delivered: 0, drops: 0, combo: 0, best: 0, stars: 0, sponsors: 0,
      nextStar: 1.5, nextSponsor: 9, starsSpawned: 0, shake: 0, endT: 0, stuck: false, cool: 0, rows: 0 });
    for (let z = -14; z > SPAWN_Z; z -= ROW_GAP) spawnRow(z);
    S.nextRowZ = SPAWN_Z;
    // a few stars are already waiting in the sky so the first catch comes within seconds
    [[-26, 0], [-52, 1], [-80, 2]].forEach(([z, k]) => {
      const lane = [rand(-1.2, 1.2), rand(-3.6, -1.5), rand(1.5, 3.6)][k];
      const o = buildStar(lane); o.g.position.z = z; scene.add(o.g); S.objs.push(o); S.starsSpawned++;
    });
    S.celebrated = false; S.snap = null; S.hintNow = false;
    renderBoard(0); buildLives(); buildPips(); setCombo();
  }
  // populate the intro scene
  for (let z = 6; z > SPAWN_Z; z -= ROW_GAP) spawnRow(z);

  /* ---------- feedback ---------- */
  const v3 = new T.Vector3();
  function popNum(p, text, color, big) {
    v3.copy(p).project(camera); const r = stage.getBoundingClientRect();
    const el = document.createElement("div"); el.className = "popnum"; el.textContent = text;
    el.style.left = (v3.x + 1) / 2 * r.width + "px"; el.style.top = (1 - v3.y) / 2 * r.height + "px"; el.style.color = color;
    if (big) el.style.fontSize = "30px";
    fxEl.appendChild(el); setTimeout(() => el.remove(), 950);
  }
  const toastEl = $("toast"); let toastTimer = 0;
  function toast(msg, sp) { toastEl.textContent = msg; toastEl.classList.toggle("sp", !!sp); toastEl.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1700); }
  const comboEl = $("combo");
  function setCombo() { const m = Math.min(5, 1 + Math.floor(S.combo / 2)); comboEl.textContent = "x" + m; comboEl.classList.toggle("on", m > 1); return m; }

  /* ---------- actions ---------- */
  function drop() {
    if (S.mode !== "play" || S.cool > 0) return;
    S.cool = .28; S.drops++;
    const g = buildPresent(); g.position.set(S.x, SLEIGH_Y + .6, .7); scene.add(g);
    S.falling.push({ g, vy: DROP_V, spin: rand(3, 6) });
    sfx.drop();
  }
  function hurt() {
    S.lives--; S.inv = 1.6; S.shake = .5; S.combo = 0; setCombo(); buildPips();
    burst(new T.Vector3(S.x, SLEIGH_Y, 0), 0xc4583f, 40, 6);
    sfx.hit(); buildLives();
    const hf = $("hitflash"); hf.classList.add("on"); setTimeout(() => hf.classList.remove("on"), 60);
    if (navigator.vibrate) { try { navigator.vibrate(70); } catch (e) {} }
    if (S.lives <= 0) { S.mode = "landing"; S.endT = 0; S.stuck = true; }
  }
  function deliver(h, p) {
    h.delivered = true; S.delivered++; S.combo++; S.best = Math.max(S.best, S.combo);
    if (S.combo >= STREAK_FOR_HINT && !store.get("hint_d" + TODAY, false)) {
      store.set("hint_d" + TODAY, true); S.hintNow = true;
      setTimeout(() => { toast("Reeks van " + STREAK_FOR_HINT + "! Hint van vandaag vrijgespeeld"); sfx.hint(); }, 250);
    }
    buildPips();
    const m = setCombo(), pts = 100 * m;
    S.score += pts;
    h.wm.emissive.setHex(0xffb35c); h.wm.emissiveIntensity = 1.6; h.wm.color.setHex(0xffd9a0);
    h.glow.material.opacity = .9; h.lights.material.opacity = 1; h.porch.material.opacity = .85;
    const wp = new T.Vector3(); h.g.localToWorld(wp.set(h.cx - h.g.position.x, h.top, 0));
    burst(wp, 0xffc94a, 36, 5, 4); burst(wp, 0xffffff, 16, 3, 3);
    popNum(wp, "+" + pts, "#ffc94a", m > 1);
    if (m > 1 && S.combo % 2 === 0) toast(`Combo x${m}`);
    sfx.deliver(S.combo); renderBoard(S.score);
  }

  /* ---------- update ---------- */
  const keys = { l: 0, r: 0 };
  function update(dt, now) {
    const tt = now / 1000, playing = S.mode === "play";
    if (S.mode === "intro") S.speed = 7;
    if (S.mode === "end") S.speed = 5;
    if (playing) { S.t += dt; S.speed = 15 + S.t * .2; }
    if (S.mode === "landing") {
      S.endT += dt; S.speed = Math.max(4, S.speed - 12 * dt);
      if (S.endT > 1.5) {
        const prev = store.get("best_d" + TODAY, 0);
        if (S.score > prev && S.score > 0 && !S.celebrated) startCelebrate(prev); else showEnd();
      }
    }
    if (S.mode === "celebrate") {
      S.celT += dt; S.speed = 6; S.fwT -= dt;
      if (S.fwT <= 0) {
        S.fwT = .18;
        const cols = [0xffc94a, 0x5fe0b5, 0xff6a5c, 0x8fa0ff, 0xffffff];
        burst(new T.Vector3(S.x + rand(-6, 6), SLEIGH_Y + rand(1.5, 6), rand(-14, -3)), cols[Math.floor(Math.random() * cols.length)], 46, 7, 1);
        if (Math.random() < .35) sfx.star();
      }
      if (S.celT > 1.2 && !S.snap) S.wantSnap = true;
      if (S.celT > 4.2) { $("celebrate").hidden = true; showEnd(); }
    }
    const dz = S.speed * dt;
    S.cool = Math.max(0, S.cool - dt); S.inv = Math.max(0, S.inv - dt); S.shake = Math.max(0, S.shake - dt);

    // steering
    if (playing) { const k = keys.r - keys.l; if (k) S.tx += k * 9 * dt; S.tx = Math.max(-XLIM, Math.min(XLIM, S.tx)); }
    else if (S.mode === "intro") S.tx = Math.sin(tt * .5) * 2.2;
    const px = S.x; S.x += (S.tx - S.x) * Math.min(1, dt * 6); S.vx = (S.x - px) / Math.max(dt, 1e-3);

    rig.position.set(S.x, SLEIGH_Y + Math.sin(tt * 2.2) * .15, 0);
    rig.rotation.z = -S.vx * .045; rig.rotation.y = -S.vx * .03;
    rig.visible = !(S.inv > 0 && playing && Math.floor(S.inv * 12) % 2 === 0) && S.mode !== "end";
    if (S.mode === "celebrate") { rig.visible = true; rig.position.y = SLEIGH_Y + Math.sin(tt * 3) * .5; rig.rotation.z = Math.sin(tt * 2) * .15; }
    sleighLight.position.set(S.x, SLEIGH_Y + 1, 1);
    sleigh.userData.hat.rotation.z = Math.sin(tt * 9) * .2;
    for (const d of deer) {
      const ph = d.userData.ph, b = d.userData.base;
      d.position.set(b.x - S.vx * .05 * (b.z / -4), b.y + Math.sin(tt * 8 + ph) * .12, b.z);
      d.rotation.x = Math.sin(tt * 8 + ph) * .08;
      for (const leg of d.userData.legs) leg.rotation.x = Math.sin(tt * 12 + ph + leg.userData.phase) * .7;
      d.userData.head.rotation.x = Math.sin(tt * 8 + ph + 1) * .1;
    }
    // reins from Santa's hands to the front pair collars
    const hands = [[-.32, 1.0, -.5], [.32, 1.0, -.5]];
    let ri = 0;
    [deer[0], deer[1]].forEach((d, i) => {
      const h = hands[i]; reinPos.set([h[0], h[1], h[2], d.position.x, d.position.y + .2, d.position.z - .42], ri); ri += 6;
    });
    [deer[2], deer[3]].forEach((d, i) => {
      const a = deer[i]; reinPos.set([a.position.x, a.position.y + .2, a.position.z - .42, d.position.x, d.position.y + .2, d.position.z + .5], ri); ri += 6;
    });
    reinGeo.attributes.position.needsUpdate = true;
    if (playing || S.mode === "intro") {
      for (let k = 0; k < 2; k++) { const i = trN; trN = (trN + 1) % TR; trP[i * 3] = S.x + rand(-.7, .7); trP[i * 3 + 1] = SLEIGH_Y - .3 + rand(-.1, .1); trP[i * 3 + 2] = 1.2; trL[i] = 1.2; }
    }
    for (let i = 0; i < TR; i++) { if (trL[i] <= 0) continue; trL[i] -= dt; trP[i * 3 + 2] += dz * .9; trP[i * 3 + 1] -= dt * .5; if (trL[i] <= 0) trP[i * 3 + 1] = -99; }
    trG.attributes.position.needsUpdate = true;

    // world
    S.nextRowZ += dz;
    while (S.nextRowZ > SPAWN_Z) { spawnRow(S.nextRowZ - ROW_GAP); S.nextRowZ -= ROW_GAP; }
    if (playing && S.t >= S.nextStar && S.starsSpawned < 12 && S.t < DURATION - 2.5) {
      const o = buildStar(rand(-XLIM + .3, XLIM - .3)); o.g.position.z = SPAWN_Z; scene.add(o.g); S.objs.push(o);
      S.starsSpawned++; S.nextStar = S.t + rand(3.3, 4.3);
    }
    if (playing && S.t >= S.nextSponsor && S.t < DURATION - 4) {
      const o = buildSponsor(rand(-2.8, 2.8)); o.g.position.z = SPAWN_Z; scene.add(o.g); S.objs.push(o);
      S.nextSponsor = S.t + rand(11, 14);
    }

    for (const o of S.objs) {
      if (o.dead) continue;
      const pz = o.g.position.z;
      o.g.position.z += dz;
      const z = o.g.position.z;
      if (o.k === "house" && !o.decor) {
        // golden ring when a drop right now would land in this chimney
        const fall = (DROP_V + Math.sqrt(DROP_V * DROP_V + 2 * G * Math.max(0, SLEIGH_Y + .6 - o.top))) / G;
        const predZ = z + S.speed * fall;
        const aligned = !o.delivered && playing && Math.abs(predZ - .7) < 1.1 && Math.abs(o.cx - S.x) < .75;
        const near = !o.delivered && playing && z > -40 && z < 2;
        o.ring.material.opacity += ((aligned ? 1 : near ? .28 : 0) - o.ring.material.opacity) * Math.min(1, dt * 12);
        o.ring.scale.setScalar(aligned ? 1 + Math.sin(tt * 18) * .08 : 1);
        if (o.delivered) o.glow.material.opacity = .55 + Math.sin(tt * 6 + o.cx) * .15;
      } else if (o.k === "star") {
        o.g.rotation.y += dt * 2.4;
        if (playing && pz < 0 && z >= 0 && Math.abs(o.x - S.x) < 1.1) {
          o.dead = true; scene.remove(o.g);
          S.score += 100; S.stars++; burst(o.g.position, 0xffc94a, 44, 7); popNum(o.g.position, "+100", "#ffc94a"); sfx.star();
          renderBoard(S.score);
        }
      } else if (o.k === "sponsor") {
        o.g.rotation.y = Math.sin(tt) * .2;
        if (playing && pz < 0 && z >= 0 && Math.abs(o.x - S.x) < 1.15) {
          o.dead = true; S.score += 150; S.sponsors++;
          burst(new T.Vector3(o.x, SLEIGH_Y, 0), 0x5fe0b5, 50, 7); popNum(new T.Vector3(o.x, SLEIGH_Y + .5, 0), "+150", "#5fe0b5", true);
          sfx.sponsor(); toast("Sponsorballon van Jouw Merk Hier: +150", true); renderBoard(S.score);
          o.g.visible = false;
        }
      } else if (o.k === "tower") {
        o.tip.material.opacity = .6 + Math.sin(tt * 6) * .35;
        if (playing && S.inv <= 0 && pz < 0 && z >= 0 && Math.abs(o.x - S.x) < 1.25) hurt();
      }
    }
    S.objs = S.objs.filter(o => { if (o.dead && o.k !== "sponsor") return false; if (o.g.position.z > 14) { scene.remove(o.g); return false; } return true; });

    // falling presents
    for (const p of S.falling) {
      const prevY = p.g.position.y;
      p.vy -= G * dt; p.g.position.y += p.vy * dt;
      p.g.rotation.x += dt * p.spin; p.g.rotation.z += dt * p.spin * .6;
      const y = p.g.position.y;
      for (const o of S.objs) {
        if (o.k !== "house" || o.decor || o.delivered) continue;
        const z = o.g.position.z;
        if (prevY > o.top && y <= o.top && Math.abs(o.cx - p.g.position.x) < .62 && Math.abs(z - p.g.position.z) < .75) {
          p.done = true; deliver(o, p.g.position); break;
        }
      }
      if (!p.done && y < 1.3) {
        p.done = true; S.combo = 0; setCombo(); buildPips();
        burst(p.g.position, 0xeef0ff, 14, 3, 2); popNum(p.g.position, "mis", "#b3a8d6"); sfx.miss();
      }
      if (p.done) scene.remove(p.g);
    }
    S.falling = S.falling.filter(p => !p.done);

    // chimney smoke and twinkling lights
    for (const o of S.objs) {
      if (o.k !== "house") continue;
      const z = o.g.position.z;
      if (z < -70 || z > -3) continue;
      o.smokeT -= dt;
      if (o.smokeT <= 0) { o.smokeT = o.delivered ? .12 : .32; puff(o.g.position.x + o.chimX, o.chimY, z, o.delivered); }
      if (o.delivered) o.lights.material.opacity = .75 + Math.sin(tt * 5 + o.chimX * 3) * .25;
    }
    for (let i = 0; i < SM; i++) {
      if (smL[i] <= 0) continue; smL[i] -= dt;
      smP[i * 3] += smV[i * 2] * dt; smP[i * 3 + 1] += smV[i * 2 + 1] * dt; smP[i * 3 + 2] += dz + dt * .3;
      smC[i * 3] *= .985; smC[i * 3 + 1] *= .985; smC[i * 3 + 2] *= .985;
      if (smL[i] <= 0) smP[i * 3 + 1] = -99;
    }
    smG.attributes.position.needsUpdate = true; smG.attributes.color.needsUpdate = true;
    for (const c of clouds) { c.position.z += dz * .25; if (c.position.z > 10) { c.position.z = -140; c.position.x = rand(-30, 30); } }
    moonL.position.set(S.x - 7, 22, -14); moonL.target.position.set(S.x, 0, -2);

    // snow streams past
    for (let i = 0; i < SN; i++) {
      snP[i * 3 + 2] += dz * (.6 + snS[i] * .3); snP[i * 3 + 1] -= snS[i] * dt;
      if (snP[i * 3 + 2] > 12 || snP[i * 3 + 1] < -1) { snP[i * 3 + 2] = -90; snP[i * 3 + 1] = Math.random() * 18 - 1; snP[i * 3] = (Math.random() - .5) * 40; }
    }
    snG.attributes.position.needsUpdate = true;
    for (let i = 0; i < BU; i++) {
      if (bL[i] <= 0) continue; bL[i] -= dt;
      bP[i * 3] += bV[i * 3] * dt; bP[i * 3 + 1] += bV[i * 3 + 1] * dt; bP[i * 3 + 2] += bV[i * 3 + 2] * dt + dz * .5;
      bV[i * 3 + 1] -= 7 * dt; bC[i * 3] *= .985; bC[i * 3 + 1] *= .985; bC[i * 3 + 2] *= .985;
      if (bL[i] <= 0) bP[i * 3 + 1] = -99;
    }
    bG.attributes.position.needsUpdate = true; bG.attributes.color.needsUpdate = true;

    if (playing) { jingleT -= dt; if (jingleT <= 0) { jingleT = 1.6; if (soundOn && ac) bells(); } }
    if (playing && S.t >= DURATION) { S.mode = "landing"; S.endT = 0; sfx.land(); }

    // camera follows behind and above
    camera.position.set(S.x * .55, 12.6, 13.5);
    if (S.shake > 0) { camera.position.x += (Math.random() - .5) * S.shake; camera.position.y += (Math.random() - .5) * S.shake; }
    camera.lookAt(S.x * .7, 3.2, -9);
    if (S.mode === "celebrate") {
      const a = -.9 + S.celT * .45;
      camera.position.set(S.x + Math.sin(a) * 9, 9 - Math.min(1, S.celT) * 1.5, Math.cos(a) * 9 + 1);
      camera.lookAt(S.x, SLEIGH_Y + .5, -1.5);
    }
    renderer.toneMappingExposure = S.mode === "landing" ? 1.05 + (S.stuck ? -Math.min(1, S.endT) * .8 : Math.min(1, S.endT) * 1.6) : 1.05;
  }

  /* ---------- HUD ---------- */
  const hud = $("hud"), livesEl = $("lives"), scoreEl = $("score"), timerBar = $("timerbar"), pipsEl = $("pips"), depthEl = $("depth"), dropBtn = $("dropBtn");
  const hatSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18c2-8 7-13 15-13-2 3-2 7-1 13z" fill="#e8332a"/><rect x="2" y="16.5" width="17" height="4.5" rx="2.2" fill="#f6f1ff"/><circle cx="18.5" cy="5" r="2.6" fill="#f6f1ff"/></svg>';
  function buildLives() { livesEl.innerHTML = [0, 1, 2].map(i => hatSvg.replace("<svg", `<svg class="${i < S.lives ? "" : "lost"}"`)).join(""); livesEl.setAttribute("aria-label", `${Math.max(0, S.lives)} mutsen over`); }
  function buildPips() {
    const got = store.get("hint_d" + TODAY, false);
    pipsEl.innerHTML = got ? '<em>Hint van vandaag ✓</em>' :
      '<em>Reeks</em>' + Array.from({ length: STREAK_FOR_HINT }, (_, i) => `<span class="${i < S.combo ? "on" : ""}"></span>`).join("") + '<em class="tg">hint</em>';
  }
  let lastScore = -1, lastDel = -1;
  function syncHud() {
    if (S.score !== lastScore) { scoreEl.textContent = S.score.toLocaleString("nl-BE"); lastScore = S.score; }
    if (S.delivered !== lastDel) { depthEl.textContent = S.delivered + " bezorgd"; lastDel = S.delivered; }
    timerBar.style.transform = `scaleX(${Math.max(0, 1 - S.t / DURATION)})`;
  }
  buildLives(); buildPips();

  /* ---------- screens ---------- */
  const intro = $("intro"), endEl = $("end"), adEl = $("ad");
  let extraUsed = false;
  let coachT = 0;
  function start() {
    initAudio();
    intro.hidden = true; endEl.hidden = true; hud.hidden = false; pipsEl.hidden = false; depthEl.hidden = false; dropBtn.hidden = false;
    reset();
    const coach = $("coach"); coach.hidden = false; coach.classList.remove("out");
    clearTimeout(coachT); coachT = setTimeout(() => { coach.classList.add("out"); setTimeout(() => coach.hidden = true, 500); }, 6500);
  }
  // the drop button glows while a drop right now would land in a chimney
  setInterval(() => {
    if (S.mode !== "play") { dropBtn.classList.remove("ready"); return; }
    const ready = S.objs.some(o => o.k === "house" && !o.decor && !o.delivered && o.ring && o.ring.material.opacity > .7);
    dropBtn.classList.toggle("ready", ready);
  }, 60);
  $("startBtn").addEventListener("click", start);
  // new personal day record: a short fly-around with fireworks, recorded as the "highscore video"
  function startCelebrate(prev) {
    S.mode = "celebrate"; S.celT = 0; S.fwT = 0; S.celebrated = true; S.prevBest = prev;
    hud.hidden = true; pipsEl.hidden = true; depthEl.hidden = true; dropBtn.hidden = true; comboEl.classList.remove("on");
    const c = $("celebrate");
    c.querySelector("[data-score]").textContent = S.score.toLocaleString("nl-BE");
    c.querySelector("[data-prev]").textContent = prev ? `Vorig record vandaag: ${prev.toLocaleString("nl-BE")}` : "Je eerste score van vandaag";
    c.hidden = false; sfx.land();
  }
  function showEnd() {
    S.mode = "end"; hud.hidden = true; pipsEl.hidden = true; depthEl.hidden = true; dropBtn.hidden = true; comboEl.classList.remove("on");
    for (const p of S.falling) scene.remove(p.g); S.falling = [];
    const prevDay = store.get("best_d" + TODAY, 0), isRecord = S.celebrated;
    store.set("best_d" + TODAY, Math.max(prevDay, S.score));
    const rankToday = boardRows("today", 0).findIndex(r => r.me) + 1;
    const hintOpen = store.get("hint_d" + TODAY, false);
    const acc = S.drops ? Math.round(S.delivered / S.drops * 100) : 0;
    boardKind = "today";
    endEl.innerHTML = `
      <div class="end-grid">
        <section class="end-col">
          <p class="io-label">${S.stuck ? "Vastgelopen tegen een toren" : "Route afgewerkt"} · adventsdag ${TODAY}</p>
          <h2 class="io-title">${S.score.toLocaleString("nl-BE")} punten${isRecord ? ' <span class="rec">Dagrecord</span>' : ""}</h2>
          <p class="io-text">Je staat <b>${rankToday}e</b> van 8 in de dagstand van Familie Peeters. ${hintOpen ? (S.hintNow ? "Je haalde een reeks van " + STREAK_FOR_HINT + " en speelde de hint van vandaag vrij." : "De hint van vandaag had je al.") : "Geen hint vandaag: bezorg " + STREAK_FOR_HINT + " pakjes op rij."}</p>
          <div class="io-stats">
            <div><b>${S.delivered}</b><span>bezorgd</span></div>
            <div><b>${acc}%</b><span>raak</span></div>
            <div><b>${S.best}</b><span>langste reeks</span></div>
            <div><b>${S.stars}</b><span>sterren</span></div>
          </div>
          ${isRecord ? `<div class="hsvideo">
            <div class="hsv-thumb">${S.snap ? `<img src="${S.snap}" alt="Stilstaand beeld uit je highscore-video">` : ""}<span class="hsv-play" aria-hidden="true">▶</span><span class="hsv-len">0:04</span></div>
            <div class="hsv-txt"><b>Je highscore-video staat klaar</b><span>Een korte clip van je dagrecord om te delen in de groepschat.</span>
              <div class="hsv-act"><button class="io-btn light" id="replayBtn" type="button">Bekijk opnieuw</button><button class="io-btn blue" id="shareVid" type="button">Deel video</button></div></div>
          </div>` : ""}
          <h3 class="io-h3">Hint van vandaag</h3>
          <div class="cards one" id="cards">
            <div class="fc ${hintOpen ? "earned" : "locked"}"><div class="fc-in"><div class="fc-front"><span>Adventsdag ${TODAY}</span><b>${hintOpen ? "Open me" : "Reeks van " + STREAK_FOR_HINT}</b></div><div class="fc-back"><span>Hint van je Santa</span><p>${hintOpen ? TODAY_HINT : "Bezorg " + STREAK_FOR_HINT + " pakjes op rij zonder te missen om de hint van vandaag te openen. Je kan het opnieuw proberen."}</p>${hintOpen ? '<small>Let op: hints mogen een vals spoor zijn.</small>' : ""}</div></div></div>
          </div>
          <details class="pastbox"><summary>Hints van eerdere dagen</summary><ul class="past" id="past"></ul><button class="more" id="moreBtn" type="button">Toon alle 11 dagen</button></details>
        </section>
        <section class="end-col">
          <div class="io-card guesscard">
            <h3 class="io-h3">Wie denk jij dat jou trok?</h3>
            <p class="io-text sm">Raad elke dag. Hoe vroeger je juist zit, hoe meer punten bij de ontknoping op 20 december.</p>
            <div class="gchips" id="gchips"></div>
            <p class="gstatus" id="gstatus"></p>
            <div class="timeline" id="timeline"></div>
            <div class="points"><span>Juist op het feest: <b>+100</b></span><span>Per dag eerder juist: <b>+50</b></span></div>
          </div>
          <div class="io-card">
            <div class="lb-head"><h3 class="io-h3">Highscores Familie Peeters</h3>
              <div class="tabs" role="tablist"><button type="button" role="tab" data-kind="today" aria-selected="true">Vandaag</button><button type="button" role="tab" data-kind="total" aria-selected="false">Totaal</button></div></div>
            <ol class="lb" id="lb"></ol>
            <p class="io-small lb-note" id="lbNote">Beste score van vandaag. Je mag vaker vliegen, alleen je beste telt.</p>
            <a class="io-link" href="deelnemer.html#feestje">Bekijk het feestje en alle verlanglijsten</a>
          </div>
          <div class="io-actions">
            ${extraUsed ? `<button class="io-btn" id="againBtn" type="button">Vlieg opnieuw (demo)</button>` : `<button class="io-btn blue" id="adBtn" type="button">Extra vlucht via sponsorvideo</button>`}
            <button class="io-btn light" id="shareBtn" type="button">Deel je score</button>
            ${extraUsed ? "" : `<button class="io-link" id="againLink" type="button">Gewoon opnieuw (demo)</button>`}
          </div>
          <p class="io-small">Morgen opent adventsdag ${TODAY + 1} met een nieuwe route en een nieuwe hint. <a class="io-link" href="index.html">Terug naar de homepage</a></p>
        </section>
      </div>`;
    endEl.hidden = false; endEl.scrollTop = 0;
    renderBoard(0); renderGuess(); showAll = false; renderPast();
    endEl.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
      boardKind = b.dataset.kind;
      endEl.querySelectorAll(".tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
      $("lbNote").textContent = boardKind === "today" ? "Beste score van vandaag. Je mag vaker vliegen, alleen je beste telt." : "Som van je dagrecords over alle adventsdagen tot nu.";
      renderBoard(0);
    }));
    $("replayBtn")?.addEventListener("click", () => { endEl.hidden = true; S.celebrated = false; startCelebrate(S.prevBest || 0); });
    $("shareVid")?.addEventListener("click", e => { e.target.textContent = "Demo: video wordt gedeeld"; setTimeout(() => e.target.textContent = "Deel video", 2000); });
    // flip the hint cards one by one
    endEl.querySelectorAll(".fc").forEach((c, i) => setTimeout(() => { c.classList.add("flipped"); if (c.classList.contains("earned")) sfx.star(); }, 700 + i * 650));
    endEl.querySelectorAll(".fc").forEach(c => c.addEventListener("click", () => c.classList.toggle("flipped")));
    $("gchips").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      store.set("guess", b.dataset.p); renderGuess(); toast(`Gok opgeslagen: ${b.dataset.p}`);
    });
    $("moreBtn").addEventListener("click", () => { showAll = !showAll; renderPast(); });
    $("shareBtn").addEventListener("click", async e => {
      const txt = `Ik bezorgde ${S.delivered} pakjes (${S.score} punten) in Santa's Sleeroute van Familie Peeters. Wie doet beter? secretsantaorganizer.com`;
      try { await navigator.clipboard.writeText(txt); e.target.textContent = "Gekopieerd"; } catch (err) { e.target.textContent = "Kopiëren lukt hier niet"; }
      setTimeout(() => { e.target.textContent = "Deel je score"; }, 1800);
    });
    $("adBtn")?.addEventListener("click", playAd);
    $("againBtn")?.addEventListener("click", start);
    $("againLink")?.addEventListener("click", start);
  }
  function playAd() {
    adEl.hidden = false; let n = 5; $("adcount").textContent = n;
    const iv = setInterval(() => { n--; $("adcount").textContent = n; if (n <= 0) { clearInterval(iv); adEl.hidden = true; extraUsed = true; start(); toast("Extra vlucht van Jouw Merk Hier", true); } }, 1000);
  }

  const fsBtn = $("fsBtn");
  fsBtn.addEventListener("pointerdown", e => e.stopPropagation());
  fsBtn.addEventListener("click", async e => {
    e.stopPropagation();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await (stage.requestFullscreen ? stage.requestFullscreen() : stage.webkitRequestFullscreen());
    } catch (err) { fsBtn.querySelector("span").textContent = "Niet beschikbaar"; setTimeout(() => fsBtn.querySelector("span").textContent = "Volledig scherm", 1800); }
  });
  document.addEventListener("fullscreenchange", () => { fsBtn.querySelector("span").textContent = document.fullscreenElement ? "Sluiten" : "Volledig scherm"; });
  /* ---------- input: drag to steer, tap to drop ---------- */
  let ptr = null;
  stage.addEventListener("pointerdown", e => {
    if (S.mode !== "play" || e.target.closest("button")) return;
    const r = stage.getBoundingClientRect();
    ptr = { x0: e.clientX, t0: performance.now(), tx0: S.tx, w: Math.min(r.width, r.height * .75), moved: 0 };
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener("pointermove", e => {
    if (!ptr || S.mode !== "play") return;
    const d = e.clientX - ptr.x0; ptr.moved = Math.max(ptr.moved, Math.abs(d));
    S.tx = Math.max(-XLIM, Math.min(XLIM, ptr.tx0 + d / ptr.w * 13));
  });
  stage.addEventListener("pointerup", () => { if (ptr && ptr.moved < 10 && performance.now() - ptr.t0 < 300) drop(); ptr = null; });
  stage.addEventListener("pointercancel", () => { ptr = null; });
  dropBtn.addEventListener("click", e => { e.stopPropagation(); drop(); });
  window.addEventListener("keydown", e => {
    if (["ArrowLeft", "a", "A"].includes(e.key)) { keys.l = 1; if (S.mode === "play") e.preventDefault(); }
    if (["ArrowRight", "d", "D"].includes(e.key)) { keys.r = 1; if (S.mode === "play") e.preventDefault(); }
    if ((e.key === " " || e.key === "ArrowDown" || e.key === "s" || e.key === "S") && S.mode === "play") { e.preventDefault(); if (!e.repeat) drop(); }
    if ((e.key === "Enter" || e.key === " ") && S.mode === "intro" && document.activeElement === document.body) { e.preventDefault(); start(); }
  });
  window.addEventListener("keyup", e => {
    if (["ArrowLeft", "a", "A"].includes(e.key)) keys.l = 0;
    if (["ArrowRight", "d", "D"].includes(e.key)) keys.r = 0;
  });

  /* ---------- loop ---------- */
  let last = performance.now(), paused = false;
  document.addEventListener("visibilitychange", () => { paused = document.hidden; last = performance.now(); keys.l = keys.r = 0; });
  function frame(now) {
    const dt = Math.min(.033, (now - last) / 1000); last = now;
    if (!paused) {
      update(dt, now); renderer.render(scene, camera);
      if (S.wantSnap) { S.wantSnap = false; try { S.snap = cv.toDataURL("image/jpeg", .82); } catch (e) {} }
      if (S.mode === "play") syncHud();
    }
    requestAnimationFrame(frame);
  }
  window.__sl = S;
  requestAnimationFrame(frame);
})();
