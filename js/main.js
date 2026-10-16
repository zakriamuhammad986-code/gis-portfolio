(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    root.classList.add("nav-js");

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    window.matchMedia("(min-width: 821px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- Contact / social links (only verified values from content/site.json) ---------- */
  var cfg = window.SITE_CONFIG || {};
  var items = [];

  if (typeof cfg.email === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(cfg.email.trim())) {
    items.push({ label: "Email", href: "mailto:" + cfg.email.trim(), text: cfg.email.trim(), external: false });
  }

  /* Phone: same validation rule as the Contact page. Shown as a tap-to-call link. */
  if (typeof cfg.phone === "string") {
    var ph = cfg.phone.trim();
    if (/^\+?[\d][\d\s().-]{5,}$/.test(ph)) {
      items.push({ label: "Phone", href: "tel:" + ph.replace(/[^\d+]/g, ""), text: ph, external: false });
    }
  }

  (Array.isArray(cfg.links) ? cfg.links : []).forEach(function (l) {
    if (!l || typeof l.label !== "string" || typeof l.url !== "string") return;
    try {
      var u = new URL(l.url);
      if (u.protocol === "https:") {
        items.push({ label: l.label, href: u.href, text: l.label, external: true });
      }
    } catch (err) { /* ignore invalid URL */ }
  });

  if (items.length) {
    document.querySelectorAll("[data-contact-links]").forEach(function (box) {
      var ul = document.createElement("ul");
      items.forEach(function (it) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = it.href;
        a.textContent = it.text;
        if (it.external) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          var sr = document.createElement("span");
          sr.className = "visually-hidden";
          sr.textContent = " (opens in a new tab)";
          a.appendChild(sr);
        }
        li.appendChild(a);
        ul.appendChild(li);
      });
      box.replaceChildren(ul);
    });
  }

  /* ---------- Subtle reveal on scroll ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".reveal");

  if (!reduce && "IntersectionObserver" in window && targets.length) {
    root.classList.add("reveal-ready");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Optional Services link (only when showServicesPage is true in content/site.json) ---------- */
  if (cfg.showServicesPage === true) {
    var here = location.pathname.split("/").pop();
    document.querySelectorAll(".nav-list, .footer-grid nav ul").forEach(function (ul) {
      if (ul.querySelector('a[href="services.html"]')) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "services.html";
      a.textContent = "Services";
      if (here === "services.html") a.setAttribute("aria-current", "page");
      li.appendChild(a);
      var contact = ul.querySelector('a[href="contact.html"]');
      ul.insertBefore(li, contact ? contact.closest("li") : null);
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
})();
