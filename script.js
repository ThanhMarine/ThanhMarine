(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "tm-theme";
  var LANG_KEY = "tm-lang";

  var themeToggle = document.getElementById("themeToggle");
  var langToggle = document.getElementById("langToggle");
  var langLabel = langToggle ? langToggle.querySelector(".lang-label") : null;
  var menuToggle = document.getElementById("menuToggle");
  var nav = document.getElementById("site-nav");
  var header = document.querySelector(".site-header");

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* ignore */ }
  }

  /* ---------- Theme ---------- */

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme === "dark" ? "dark" : "light";
    if (persist) safeSet(THEME_KEY, theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute("media")) {
        metas[i].setAttribute("content", theme === "dark" ? "#0b141a" : "#f7f5ef");
      }
    }
  }

  var savedTheme = safeGet(THEME_KEY);
  applyTheme(savedTheme || systemTheme(), false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }

  if (window.matchMedia) {
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function (event) {
      if (!safeGet(THEME_KEY)) applyTheme(event.matches ? "dark" : "light", false);
    };
    if (media.addEventListener) media.addEventListener("change", onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  /* ---------- Language ---------- */

  var currentLang = safeGet(LANG_KEY) === "en" ? "en" : "vi";

  function setMeta(attribute, name, value) {
    if (!value) return;
    var element = document.querySelector("meta[" + attribute + '="' + name + '"]');
    if (element) element.setAttribute("content", value);
  }

  function applyLanguage(lang, persist) {
    currentLang = lang === "en" ? "en" : "vi";
    root.lang = currentLang;

    var translated = document.querySelectorAll("[data-vi], [data-en]");
    for (var i = 0; i < translated.length; i++) {
      var value = translated[i].getAttribute("data-" + currentLang);
      if (value !== null) translated[i].textContent = value;
    }

    var labels = document.querySelectorAll("[data-aria-vi], [data-aria-en]");
    for (var j = 0; j < labels.length; j++) {
      var label = labels[j].getAttribute("data-aria-" + currentLang);
      if (label !== null) labels[j].setAttribute("aria-label", label);
    }

    if (langLabel) langLabel.textContent = currentLang === "vi" ? "EN" : "VI";
    if (langToggle) {
      langToggle.setAttribute(
        "aria-label",
        currentLang === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"
      );
    }

    var title = root.getAttribute("data-title-" + currentLang);
    var description = root.getAttribute("data-desc-" + currentLang);
    if (title) document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:locale", currentLang === "vi" ? "vi_VN" : "en_US");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    if (persist) safeSet(LANG_KEY, currentLang);
  }

  applyLanguage(currentLang, false);

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      applyLanguage(currentLang === "vi" ? "en" : "vi", true);
    });
  }

  /* ---------- Mobile menu ---------- */

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute(
      "aria-label",
      currentLang === "vi" ? "Mở menu" : "Open menu"
    );
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      menuToggle.setAttribute(
        "aria-label",
        isOpen
          ? (currentLang === "vi" ? "Đóng menu" : "Close menu")
          : (currentLang === "vi" ? "Mở menu" : "Open menu")
      );
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (header && header.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    if (window.matchMedia) {
      var wide = window.matchMedia("(min-width: 901px)");
      var onWide = function (event) { if (event.matches) closeMenu(); };
      if (wide.addEventListener) wide.addEventListener("change", onWide);
      else if (wide.addListener) wide.addListener(onWide);
    }
  }

  /* ---------- Active section ---------- */

  var sectionLinks = nav
    ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'))
    : [];

  function setActiveSection(hash) {
    for (var i = 0; i < sectionLinks.length; i++) {
      var isActive = sectionLinks[i].getAttribute("href") === hash;
      sectionLinks[i].classList.toggle("is-active", isActive);
      if (isActive) sectionLinks[i].setAttribute("aria-current", "location");
      else sectionLinks[i].removeAttribute("aria-current");
    }
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      var best = null;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) best = entries[i];
      }
      if (best) setActiveSection("#" + best.target.id);
    }, { rootMargin: "-38% 0px -52% 0px", threshold: 0 });

    for (var s = 0; s < sections.length; s++) spy.observe(sections[s]);
  }

  /* ---------- Reveal on scroll ---------- */

  var revealItems = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    for (var r = 0; r < revealItems.length; r++) revealObserver.observe(revealItems[r]);
  } else {
    for (var v = 0; v < revealItems.length; v++) revealItems[v].classList.add("is-visible");
  }

  /* ---------- Header state ---------- */

  var ticking = false;
  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  /* ---------- Year ---------- */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}());
