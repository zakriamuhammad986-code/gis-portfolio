(function () {
  "use strict";

  var root = document.getElementById("services-root");
  if (!root) return;

  var cfg = window.SITE_CONFIG || {};
  var data = window.SERVICES_DATA || {};
  var projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
  var lead = document.getElementById("services-lead");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== "") n.textContent = text;
    return n;
  }
  function str(v) { return typeof v === "string" ? v.trim() : ""; }

  var items = (Array.isArray(data.services) ? data.services : []).filter(function (s) {
    return s && s.published === true && str(s.title);
  });

  /* Off by default: unless the switch is on AND something is published, the page offers nothing. */
  if (cfg.showServicesPage !== true || !items.length) {
    var sec = el("section", "section");
    var c = el("div", "container");
    var box = el("div", "empty-state");
    box.appendChild(el("h2", null, "This page is not available yet"));
    box.appendChild(el("p", null, "My academic and course work is on the Projects page."));
    var a = el("a", "btn btn-secondary", "View projects");
    a.href = "projects.html";
    box.appendChild(a);
    c.appendChild(box);
    sec.appendChild(c);
    root.replaceChildren(sec);
    return;
  }

  if (lead && str(data.lead)) lead.textContent = str(data.lead);

  var frag = document.createDocumentFragment();

  /* Scope note */
  var s1 = el("section", "section");
  s1.setAttribute("style", "padding-block: var(--space-6) 0");
  var c1 = el("div", "container");
  var note = el("p", "notice");
  note.setAttribute("style", "margin-top:0");
  note.appendChild(el("strong", null, "Before any work begins. "));
  note.appendChild(document.createTextNode(str(data.scopeNote) || "Project scope, data availability and validation requirements are discussed before any work begins."));
  c1.appendChild(note);
  s1.appendChild(c1);
  frag.appendChild(s1);

  /* Services */
  var s2 = el("section", "section");
  s2.setAttribute("aria-labelledby", "services-title");
  var c2 = el("div", "container");
  var head = el("div", "section-head");
  var h2 = el("h2", null, "What I can help with");
  h2.id = "services-title";
  head.appendChild(h2);
  head.appendChild(el("p", null, "There are no fixed prices. Each task is scoped individually."));
  c2.appendChild(head);

  var grid = el("ul", "service-grid");
  var ctaText = str(data.cta) || "Contact for scope and quote";

  items.forEach(function (s) {
    var li = el("li", "service-card");
    var art = el("article");
    art.appendChild(el("h3", null, str(s.title)));
    if (str(s.summary)) art.appendChild(el("p", "service-summary", str(s.summary)));

    var inc = Array.isArray(s.includes) ? s.includes.map(str).filter(Boolean) : [];
    if (inc.length) {
      var ul = el("ul", "detail-list");
      inc.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      art.appendChild(ul);
    }
    if (str(s.limits)) art.appendChild(el("p", "service-limits", str(s.limits)));

    var rel = (Array.isArray(s.relatedProjects) ? s.relatedProjects : []).map(function (id) {
      for (var i = 0; i < projects.length; i++) if (projects[i].id === id) return projects[i];
      return null;
    }).filter(Boolean);
    if (rel.length) {
      var p = el("p", "service-related");
      p.appendChild(document.createTextNode("Related project work: "));
      rel.forEach(function (pr, i) {
        if (i) p.appendChild(document.createTextNode(", "));
        var a = el("a", null, pr.title);
        a.href = "projects.html#" + encodeURIComponent(pr.id);
        p.appendChild(a);
      });
      art.appendChild(p);
    }

    var btn = el("a", "btn btn-secondary", ctaText);
    btn.href = "contact.html";
    art.appendChild(btn);

    li.appendChild(art);
    grid.appendChild(li);
  });

  c2.appendChild(grid);
  s2.appendChild(c2);
  frag.appendChild(s2);

  root.replaceChildren(frag);
})();
