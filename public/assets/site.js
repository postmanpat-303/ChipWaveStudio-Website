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
    .map(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return null;
      return document.querySelector(href);
    })
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

  /* ---------- lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-caption");
  var lbClose = document.getElementById("lb-close");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var shotSelector = ".feature-shot img, .marketing img, .theme-row img, .new-showcase img";
  var items = [];
  var index = 0;
  var opener = null;
  var pageBits = [header, document.getElementById("main"), document.querySelector(".site-footer")];

  function captionFor(img) {
    if (img.dataset.caption) return img.dataset.caption;
    var fig = img.parentElement && img.parentElement.querySelector("figcaption");
    return fig ? fig.textContent.trim() : "";
  }

  function collect() {
    items = [];
    Array.prototype.forEach.call(document.querySelectorAll(".gallery button"), function (btn) {
      var thumb = btn.querySelector("img");
      items.push({
        src: btn.dataset.full,
        caption: btn.dataset.caption || (btn.textContent || "").trim(),
        alt: thumb ? thumb.alt : "",
        el: btn
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(shotSelector), function (img) {
      items.push({
        src: img.dataset.full || img.currentSrc || img.src,
        caption: captionFor(img),
        alt: img.alt,
        el: img
      });
    });
  }

  function show(i) {
    if (!items.length || !lb) return;
    index = (i + items.length) % items.length;
    var item = items[index];
    lbImg.src = item.src;
    lbImg.alt = item.alt || item.caption || "Screenshot";
    lbCap.textContent = item.caption;
  }

  function lockScroll() {
    var gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = gap + "px";
  }

  function unlockScroll() {
    document.documentElement.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  function setPageHidden(hidden) {
    pageBits.forEach(function (el) {
      if (!el) return;
      if (hidden) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
    });
  }

  function openFor(el) {
    if (!lb) return;
    collect();
    var i = items.findIndex(function (item) { return item.el === el; });
    if (i < 0) return;
    opener = el;
    lb.classList.add("is-open");
    lockScroll();
    show(i);
    lbClose.focus();
    setPageHidden(true);
  }

  function close() {
    if (!lb || !lb.classList.contains("is-open")) return;
    lb.classList.remove("is-open");
    unlockScroll();
    setPageHidden(false);
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  }

  Array.prototype.forEach.call(document.querySelectorAll(shotSelector), function (img) {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    if (!img.getAttribute("aria-label")) {
      img.setAttribute("aria-label", "Enlarge screenshot: " + (img.alt || "app capture"));
    }
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery button");
    if (btn) { e.preventDefault(); openFor(btn); return; }
    var img = e.target.closest(shotSelector);
    if (img) { e.preventDefault(); openFor(img); }
  });

  document.addEventListener("keydown", function (e) {
    var img = e.target.closest && e.target.closest(shotSelector);
    if (img && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openFor(img);
      return;
    }
    if (!lb || !lb.classList.contains("is-open")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); return; }
    if (e.key !== "Tab") return;
    var focusables = [lbPrev, lbClose, lbNext].filter(Boolean);
    if (!focusables.length) return;
    var at = focusables.indexOf(document.activeElement);
    var next = e.shiftKey ? (at <= 0 ? focusables.length - 1 : at - 1) : (at === focusables.length - 1 || at < 0 ? 0 : at + 1);
    if (e.shiftKey ? at <= 0 : at === focusables.length - 1 || at < 0) {
      e.preventDefault();
      focusables[next].focus();
    }
  });

  if (lb) {
    lb.setAttribute("aria-describedby", "lb-caption");
    lbClose.addEventListener("click", function (e) { e.stopPropagation(); close(); });
    lbPrev.addEventListener("click", function (e) { e.stopPropagation(); show(index - 1); });
    lbNext.addEventListener("click", function (e) { e.stopPropagation(); show(index + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  }

  /* ---------- open links in new tabs safely ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('a[rel~="noopener"]'), function (a) {
    if (a.target !== "_blank") a.target = "_blank";
    a.setAttribute("rel", "noopener noreferrer");
  });

  /* ---------- YouTube: a local poster until play is pressed ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("a.yt[data-yt]"), function (a) {
    a.addEventListener("click", function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(a.getAttribute("data-yt")) + "?autoplay=1&rel=0";
      f.title = a.getAttribute("aria-label") || "YouTube video";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.referrerPolicy = "strict-origin-when-cross-origin";
      var box = document.createElement("div");
      box.className = a.className;
      box.appendChild(f);
      a.replaceWith(box);
    });
  });
})();
