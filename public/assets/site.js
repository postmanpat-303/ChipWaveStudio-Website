/* chipwavestudio.com — small, dependency-free behaviour */
(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var burger = document.getElementById("burger");

  /* ---------- mobile menu ---------- */
  if (burger && header) {
    burger.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    header.addEventListener("click", function (e) {
      var a = e.target.closest(".nav a");
      if (!a) return;
      header.classList.remove("menu-open");
      burger.setAttribute("aria-expanded", "false");
    });
  }

  /* ---------- year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());


  /* ---------- reveal on scroll ---------- */
  var revealable = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    revealable.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealable.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- preview helper: ?nolazy loads every image at once ---------- */
  if (/[?&]nolazy\b/.test(location.search)) {
    Array.prototype.forEach.call(document.querySelectorAll("img[loading='lazy']"), function (img) {
      img.loading = "eager";
      img.decoding = "sync";
    });
    revealable.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- nav highlighting ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navLinks.forEach(function (a) {
          if (a.getAttribute("href") === id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- theme switcher ---------- */
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll(".theme-switch button"));
  var themeImgs = Array.prototype.slice.call(document.querySelectorAll(".theme-img"));
  var themeNames = { dark: "Dark Circuit", amiga: "Amiga Workbench" };
  var themeShots = ["The Tracker", "The Order list"];

  function setTheme(name) {
    if (!themeNames[name]) return;
    themeButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.theme === name));
    });
    themeImgs.forEach(function (img, i) {
      var src = img.dataset[name];
      if (!src) return;
      var label = (themeShots[i] || "ChipWave Studio") + ", " + themeNames[name];
      img.src = src;
      img.alt = label + " theme.";
      img.dataset.caption = label + " theme.";
    });
  }

  themeButtons.forEach(function (b) {
    b.addEventListener("click", function () { setTheme(b.dataset.theme); });
  });

  /* ---------- video facade ---------- */
  var videoBtn = document.getElementById("video-play");
  if (videoBtn) {
    videoBtn.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + videoBtn.dataset.id +
        "?autoplay=1&rel=0&modestbranding=1";
      frame.title = "ChipWave Studio promo";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      frame.loading = "lazy";
      videoBtn.replaceWith(frame);
    }, { once: true });
  }

  /* ---------- lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-caption");
  var lbClose = document.getElementById("lb-close");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var items = [];
  var index = 0;

  function collect() {
    items = [];
    Array.prototype.forEach.call(document.querySelectorAll(".gallery button"), function (btn) {
      items.push({
        src: btn.dataset.full,
        caption: btn.dataset.caption || "",
        alt: (btn.querySelector("img") || {}).alt || "",
        el: btn
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".feature-shot img, .theme-pair img, .new-showcase img"), function (img) {
      items.push({
        src: img.dataset.full || img.currentSrc || img.src,
        caption: img.dataset.caption || (img.parentElement.querySelector("figcaption") || {}).textContent || "",
        alt: img.alt,
        el: img
      });
    });
  }

  function show(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    var item = items[index];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCap.textContent = item.caption;
    lbImg.style.opacity = "0";
    requestAnimationFrame(function () { lbImg.style.transition = "opacity .2s"; lbImg.style.opacity = "1"; });
  }

  function openFor(el) {
    collect();
    var i = items.findIndex(function (item) { return item.el === el; });
    if (i < 0) return;
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
    show(i);
    lbClose.focus();
  }

  function close() {
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery button");
    if (btn) { e.preventDefault(); openFor(btn); return; }
    var img = e.target.closest(".feature-shot img, .theme-pair img, .new-showcase img");
    if (img) { e.preventDefault(); openFor(img); }
  });

  if (lb) {
    lbClose.addEventListener("click", close);
    lbPrev.addEventListener("click", function () { show(index - 1); });
    lbNext.addEventListener("click", function () { show(index + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
    });
  }

  /* ---------- open links in new tabs safely ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('a[rel~="noopener"]'), function (a) {
    if (a.target !== "_blank") a.target = "_blank";
    a.setAttribute("rel", "noopener noreferrer");
  });
})();
