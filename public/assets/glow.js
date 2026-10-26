/* chipwavestudio.com — the pointer glow trail, kept in its own file */
(function () {
  "use strict";

  var canvas = document.getElementById("glow");
  if (!canvas) return;

  var toggle = document.querySelector("[data-glow-toggle]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var supported = !reduce.matches && fine.matches;

  if (!supported) {
    canvas.hidden = true;
    if (toggle && toggle.parentElement) toggle.parentElement.hidden = true;
    return;
  }

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var COLORS = ["#22e3ff", "#8b5cff", "#ff3fb4", "#b6ff3c", "#ffd23f", "#22e3ff", "#8b5cff"];
  var AURA_COLOR = "#8ff0ff";
  var MAX_PARTS = 140;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var parts = [];
  var aura = { x: 0, y: 0, a: 0 };
  var pointer = { x: 0, y: 0, px: -1, py: -1 };
  var lastMove = 0;
  var lastTime = 0;
  var raf = 0;
  var enabled = true;
  try { enabled = localStorage.getItem("cw-glow") !== "off"; } catch (e) { /* private mode */ }

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  function makeSprite(hex, soft) {
    var size = soft ? 128 : 64;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var g2 = c.getContext("2d");
    var rgb = hexToRgb(hex);
    var mid = size / 2;
    var grad = g2.createRadialGradient(mid, mid, 0, mid, mid, mid);
    if (soft) {
      grad.addColorStop(0, "rgba(255,255,255,0.20)");
      grad.addColorStop(0.35, "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.10)");
      grad.addColorStop(1, "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0)");
    } else {
      grad.addColorStop(0, "rgba(255,255,255,0.72)");
      grad.addColorStop(0.3, "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.4)");
      grad.addColorStop(1, "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0)");
    }
    g2.fillStyle = grad;
    g2.fillRect(0, 0, size, size);
    return c;
  }

  var SPRITES = COLORS.map(function (c) { return makeSprite(c, false); });
  var AURA = makeSprite(AURA_COLOR, true);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function addPart(x, y, burst) {
    if (parts.length >= MAX_PARTS) return;
    var angle = burst ? Math.random() * Math.PI * 2 : Math.PI * (0.15 + Math.random() * 0.7);
    var speed = burst ? 1.6 + Math.random() * 2.6 : 0.25 + Math.random() * 0.9;
    parts.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (burst ? 0 : 0.35),
      size: 6 + Math.random() * 11,
      age: 0,
      ttl: 700 + Math.random() * 900,
      sprite: SPRITES[(Math.random() * SPRITES.length) | 0]
    });
  }

  function frame(ts) {
    raf = 0;
    var dt = lastTime ? Math.min(48, ts - lastTime) : 16;
    lastTime = ts;
    var k = dt / 16.67;

    var idle = (ts - lastMove) > 160;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    /* a soft aura that eases toward the pointer */
    aura.x += (pointer.x - aura.x) * Math.min(1, 0.14 * k);
    aura.y += (pointer.y - aura.y) * Math.min(1, 0.14 * k);
    aura.a += ((idle ? 0 : 1) - aura.a) * Math.min(1, (idle ? 0.06 : 0.12) * k);
    if (aura.a > 0.01) {
      var aSize = 420;
      ctx.globalAlpha = aura.a * 0.42;
      ctx.drawImage(AURA, aura.x - aSize / 2, aura.y - aSize / 2, aSize, aSize);
    }

    /* the trailing motes */
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.age += dt;
      if (p.age >= p.ttl) { parts.splice(i, 1); continue; }
      var damp = Math.pow(0.982, k);
      p.vx *= damp;
      p.vy = p.vy * damp - 0.018 * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      var t = p.age / p.ttl;
      var size = p.size * (1 - t * 0.4);
      ctx.globalAlpha = Math.pow(1 - t, 1.5) * 0.42;
      ctx.drawImage(p.sprite, p.x - size / 2, p.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (parts.length || aura.a > 0.01) {
      raf = requestAnimationFrame(frame);
    } else {
      lastTime = 0;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function wake() {
    if (!raf) {
      lastTime = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function onMove(e) {
    if (!enabled) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;

    if (pointer.px < 0) { pointer.px = pointer.x; pointer.py = pointer.y; }
    var dx = pointer.x - pointer.px;
    var dy = pointer.y - pointer.py;
    var dist = Math.sqrt(dx * dx + dy * dy);
    pointer.px = pointer.x;
    pointer.py = pointer.y;

    if (dist > 1.5) {
      var n = Math.max(1, Math.min(3, Math.round(dist / 16)));
      for (var i = 0; i < n; i++) addPart(pointer.x, pointer.y, false);
    }
    lastMove = performance.now();
    wake();
  }

  function onDown(e) {
    if (!enabled) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    for (var i = 0; i < 7; i++) addPart(e.clientX, e.clientY, true);
    lastMove = performance.now();
    wake();
  }

  function setGlow(on, save) {
    enabled = on;
    document.documentElement.classList.toggle("glow-off", !on);
    if (toggle) {
      toggle.textContent = "Pointer glow: " + (on ? "on" : "off");
      toggle.setAttribute("aria-pressed", String(on));
    }
    if (!on) {
      parts.length = 0;
      aura.a = 0;
      ctx.clearRect(0, 0, W, H);
    }
    if (save) {
      try { localStorage.setItem("cw-glow", on ? "on" : "off"); } catch (err) { /* ignore */ }
    }
  }

  resize();
  setGlow(enabled, false);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerleave", function () { pointer.px = -1; pointer.py = -1; });

  if (toggle) {
    toggle.addEventListener("click", function () { setGlow(!enabled, true); });
  }

  reduce.addEventListener("change", function (e) {
    if (e.matches) setGlow(false, false);
  });
})();
