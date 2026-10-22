/* Secret Santa Organizer: sneeuw in de header en lichte sneeuwvlokken op de pagina (zoals de echte site). */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // header: witte vlokken op een canvas
  document.querySelectorAll(".sso-hdr").forEach(hdr => {
    const cv = document.createElement("canvas"); cv.className = "sso-snow"; cv.setAttribute("aria-hidden", "true");
    hdr.prepend(cv);
    const ctx = cv.getContext("2d"); let W = 0, H = 0, flakes = [];
    const size = () => {
      const r = hdr.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round(W / 14);
      flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .8 + Math.random() * 1.8, v: .15 + Math.random() * .45, s: Math.random() * 6 }));
    };
    size(); window.addEventListener("resize", size);
    let vis = true;
    new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(hdr);
    const tick = t => {
      if (vis) {
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = "rgba(255,255,255,.75)";
        for (const f of flakes) {
          f.y += f.v; f.x += Math.sin(t / 1600 + f.s) * .25;
          if (f.y > H) { f.y = -4; f.x = Math.random() * W; }
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // pagina: enkele lichtgrijze vlokken die traag vallen
  if (document.body.dataset.flakes !== "off") {
    const box = document.createElement("div"); box.className = "sso-flakes"; box.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 26; i++) {
      const f = document.createElement("i"), s = 4 + Math.random() * 9;
      f.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${14 + Math.random() * 16}s;animation-delay:${-Math.random() * 30}s;--dx:${(Math.random() * 60 - 30).toFixed(0)}px`;
      box.appendChild(f);
    }
    document.body.prepend(box);
  }
})();
