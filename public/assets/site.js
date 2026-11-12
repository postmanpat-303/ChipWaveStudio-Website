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

  /* ---------- history presentation ---------- */
  var deck = document.getElementById("history-deck");
  if (deck) {
    var slides = [
      ["Making music on computers", "/assets/history/s-01.webp"],
      ["Computers sang before trackers", "/assets/history/s-02.webp"],
      ["1987, Ultimate Soundtracker", "/assets/history/s-03.webp"],
      ["OctaMED squeezes eight channels out of four", "/assets/history/s-04.webp"],
      ["The tracker explosion", "/assets/history/s-05.webp"],
      ["The timeline replaces the pattern list", "/assets/history/s-06.webp"],
      ["Chiptune: limitation becomes style", "/assets/history/s-07.webp"],
      ["ChipWave Studio, a free studio with a retro heart", "/assets/history/s-08.webp"],
      ["The old way is still in there", "/assets/history/s-09.webp"],
      ["The pattern still scrolls", "/assets/history/s-10.webp"]
    ];
    var stage = document.getElementById("history-stage");
    var layerA = document.getElementById("history-a");
    var layerB = document.getElementById("history-b");
    var startBtn = document.getElementById("history-start");
    var toggleBtn = document.getElementById("history-toggle");
    var prevBtn = document.getElementById("history-prev");
    var nextBtn = document.getElementById("history-next");
    var fullBtn = document.getElementById("history-full");
    var countEl = document.getElementById("history-count");
    var liveEl = document.getElementById("history-live");
    var dotsEl = document.getElementById("history-dots");
    var front = layerA;
    var back = layerB;
    var slideIndex = 0;
    var playing = false;
    var timer = null;
    var warmed = false;

    slides.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Slide " + (i + 1) + " of " + slides.length + ", " + slide[0]);
      if (i === 0) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", function () { warm(); go(i); });
      dotsEl.appendChild(dot);
    });

    function warm() {
      if (warmed) return;
      warmed = true;
      slides.forEach(function (slide) {
        var im = new Image();
        im.src = slide[1];
      });
    }

    function dismissPoster() {
      if (startBtn.hidden) return;
      var restore = document.activeElement === startBtn;
      startBtn.hidden = true;
      if (restore) stage.focus({ preventScroll: true });
    }

    function paint(announce) {
      var label = "Slide " + (slideIndex + 1) + " of " + slides.length + ", " + slides[slideIndex][0];
      countEl.textContent = (slideIndex + 1) + " / " + slides.length;
      if (announce && liveEl) liveEl.textContent = label;
      Array.prototype.forEach.call(dotsEl.children, function (dot, i) {
        if (i === slideIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      toggleBtn.textContent = playing ? "Pause" : "Play";
      toggleBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      toggleBtn.setAttribute("aria-label", playing ? "Pause presentation" : "Play presentation");
    }

    function armTimer() {
      clearInterval(timer);
      timer = null;
      if (!playing) return;
      timer = setInterval(function () {
        if (slideIndex >= slides.length - 1) pause();
        else go(slideIndex + 1);
      }, 8000);
    }

    function play() {
      warm();
      playing = true;
      dismissPoster();
      armTimer();
      paint(true);
    }

    function pause() {
      playing = false;
      clearInterval(timer);
      timer = null;
      paint();
    }

    var loadToken = 0;
    function go(next) {
      var n = slides.length;
      next = (next + n) % n;
      if (next === slideIndex) {
        armTimer();
        return;
      }
      var slide = slides[next];
      if (playing) {
        clearInterval(timer);
        timer = null;
      }
      var token = ++loadToken;
      function reveal() {
        if (token !== loadToken) return;
        back.alt = slide[0];
        back.removeAttribute("aria-hidden");
        back.classList.add("is-show");
        front.classList.remove("is-show");
        front.setAttribute("aria-hidden", "true");
        front.alt = "";
        var swap = front;
        front = back;
        back = swap;
        slideIndex = next;
        dismissPoster();
        armTimer();
        paint(true);
      }
      if (back.getAttribute("src") === slide[1] && back.complete && back.naturalWidth) {
        reveal();
        return;
      }
      back.onload = function () {
        back.onload = null;
        reveal();
      };
      back.src = slide[1];
    }

    startBtn.addEventListener("click", function () {
      play();
      stage.focus({ preventScroll: true });
    });
    toggleBtn.addEventListener("click", function () { if (playing) pause(); else play(); });
    prevBtn.addEventListener("click", function () { warm(); go(slideIndex - 1); });
    nextBtn.addEventListener("click", function () { warm(); go(slideIndex + 1); });
    fullBtn.addEventListener("click", function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      var request = deck.requestFullscreen && deck.requestFullscreen();
      if (request && request.catch) request.catch(function () {});
      stage.focus({ preventScroll: true });
    });
    document.addEventListener("fullscreenchange", function () {
      var on = document.fullscreenElement === deck;
      fullBtn.textContent = on ? "Exit" : "Fullscreen";
      fullBtn.setAttribute("aria-label", on ? "Exit fullscreen" : "Enter fullscreen");
    });

    var touchX = 0;
    var touchY = 0;
    stage.addEventListener("touchstart", function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      warm();
      go(slideIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });

    deck.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); warm(); go(slideIndex + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); warm(); go(slideIndex - 1); }
      else if (e.key === " " && e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
        e.preventDefault();
        if (playing) pause(); else play();
      } else if (e.key === "Escape" && document.fullscreenElement === deck) {
        document.exitFullscreen();
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && playing) pause();
    });

    paint();
  }
})();
