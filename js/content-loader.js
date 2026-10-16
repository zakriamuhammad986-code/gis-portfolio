/*
  Loads the site's editable content from the JSON files in /content, then runs the page scripts.
  The JSON files are what the admin panel (/admin) edits. Nothing here is a secret: everything in /content is public.

  Usage in a page:
    <script src="js/content-loader.js" data-content="site,projects" data-scripts="js/main.js,js/projects.js"></script>
  If a content file cannot be loaded, the page still runs with safe empty defaults and shows a notice.
*/
(function () {
  "use strict";

  var tag = document.currentScript;
  var wanted = (tag.getAttribute("data-content") || "site").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var scripts = (tag.getAttribute("data-scripts") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var failed = [];

  function getJSON(name) {
    return fetch("content/" + name + ".json", { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function emptyToNull(v) {
    if (v === "" || v === undefined) return null;
    if (Array.isArray(v) && v.length === 0) return null;
    return v;
  }

  var apply = {
    site: function (j) {
      var cf = j.contactForm || {};
      var fields = {};
      (cf.fieldsList || []).forEach(function (f) { if (f && f.key) fields[String(f.key)] = String(f.value == null ? "" : f.value); });
      window.SITE_CONFIG = {
        email: j.email || "",
        phone: j.phone || "",
        whatsapp: j.whatsapp || "",
        links: Array.isArray(j.links) ? j.links : [],
        contactForm: { endpoint: cf.endpoint || "", fields: fields, timeoutMs: Number(cf.timeoutMs) || 15000 },
        showServicesPage: j.showServicesPage === true
      };
    },
    projects: function (j) {
      window.PROJECT_CATEGORIES = j.categories || {};
      window.PROJECTS = (j.projects || []).map(function (p) {
        ["data", "outputs", "role", "studyArea", "caution", "status", "linksHint"].forEach(function (k) { p[k] = emptyToNull(p[k]); });
        p.links = p.links || {};
        return p;
      });
    },
    experience: function (j) { window.EXPERIENCE_DATA = j; },
    services: function (j) { window.SERVICES_DATA = j; }
  };

  var defaults = {
    site: { contactForm: {} },
    projects: { categories: {}, projects: [] },
    experience: {},
    services: { services: [] }
  };

  function showNotice() {
    if (!failed.length) return;
    var box = document.createElement("div");
    box.setAttribute("role", "alert");
    box.style.cssText = "margin:0;padding:12px 16px;background:#2a1a1a;color:#ffb4b4;border-bottom:1px solid #ff9b9b;font:16px/1.5 system-ui,sans-serif;text-align:center";
    box.textContent = "Some page content could not be loaded (" + failed.join(", ") + "). If you opened this file directly from your disk, run a local web server instead (for example: python3 -m http.server).";
    document.body.insertBefore(box, document.body.firstChild);
  }

  function runScripts(i) {
    if (i >= scripts.length) return;
    var s = document.createElement("script");
    s.src = scripts[i];
    s.onload = function () { runScripts(i + 1); };
    s.onerror = function () { runScripts(i + 1); };
    document.body.appendChild(s);
  }

  Promise.all(wanted.map(function (name) {
    return getJSON(name).then(function (j) { apply[name](j); }).catch(function () {
      failed.push(name + ".json");
      apply[name](defaults[name] || {});
    });
  })).then(function () {
    showNotice();
    runScripts(0);
  });
})();
