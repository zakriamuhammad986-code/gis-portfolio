(function () {
  "use strict";

  var root = document.getElementById("experience-root");
  if (!root) return;

  var data = window.EXPERIENCE_DATA || {};

  var SECTIONS = [
    { key: "experience", id: "experience", title: "Experience", intro: "Internships and work, listed only once verified." },
    { key: "training", id: "training", title: "Training", intro: "Courses, workshops and programmes." },
    { key: "certificates", id: "certificates", title: "Certificates & Learning", intro: "Certificates and learning I can document." },
    { key: "achievements", id: "achievements", title: "Achievements", intro: "Verified recognition." }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== "") n.textContent = text;
    return n;
  }

  function str(v) { return typeof v === "string" ? v.trim() : ""; }

  function isHttps(u) {
    try { return new URL(u).protocol === "https:"; } catch (e) { return false; }
  }

  /* Only items explicitly set to published: true, and that have a title, are ever shown. */
  function publishedItems(key) {
    var list = Array.isArray(data[key]) ? data[key] : [];
    return list.filter(function (it) { return it && it.published === true && str(it.title); });
  }

  function entry(it) {
    var li = el("li", "entry");
    var art = el("article");

    var type = str(it.type);
    if (type) {
      var tags = el("ul", "tag-row");
      tags.setAttribute("aria-label", "Type");
      tags.appendChild(el("li", "tag", type));
      art.appendChild(tags);
    }

    art.appendChild(el("h3", null, str(it.title)));

    var who = [str(it.organization), str(it.department), str(it.location)].filter(Boolean).join(" · ");
    if (who) art.appendChild(el("p", "entry-org", who));

    if (str(it.dates)) art.appendChild(el("p", "project-dates", str(it.dates)));
    if (str(it.summary)) art.appendChild(el("p", "entry-summary", str(it.summary)));

    var resp = Array.isArray(it.responsibilities) ? it.responsibilities.map(str).filter(Boolean) : [];
    if (resp.length) {
      var ul = el("ul", "detail-list");
      resp.forEach(function (r) { ul.appendChild(el("li", null, r)); });
      art.appendChild(ul);
    }

    if (str(it.credentialId)) art.appendChild(el("p", "entry-meta", "Credential ID: " + str(it.credentialId)));

    if (str(it.credentialUrl) && isHttps(str(it.credentialUrl))) {
      var p = el("p", "entry-meta");
      var a = el("a", null, "View credential");
      a.href = str(it.credentialUrl);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.appendChild(el("span", "visually-hidden", " (opens in a new tab)"));
      p.appendChild(a);
      art.appendChild(p);
    }

    if (str(it.note)) art.appendChild(el("p", "entry-meta", str(it.note)));

    li.appendChild(art);
    return li;
  }

  var shown = 0;
  var frag = document.createDocumentFragment();

  SECTIONS.forEach(function (s, i) {
    var items = publishedItems(s.key);
    if (!items.length) return;
    shown += items.length;

    var sec = el("section", "section" + (shown && frag.childNodes.length % 2 ? " section-alt" : ""));
    sec.id = s.id;
    sec.setAttribute("aria-labelledby", s.id + "-title");
    var c = el("div", "container");
    var head = el("div", "section-head");
    var h = el("h2", null, s.title);
    h.id = s.id + "-title";
    head.appendChild(h);
    head.appendChild(el("p", null, s.intro));
    c.appendChild(head);
    var list = el("ul", "entry-list");
    items.forEach(function (it) { list.appendChild(entry(it)); });
    c.appendChild(list);
    sec.appendChild(c);
    frag.appendChild(sec);
  });

  if (!shown) {
    var sec = el("section", "section");
    var c = el("div", "container");
    var box = el("div", "empty-state");
    box.appendChild(el("h2", null, "Nothing to show here yet"));
    box.appendChild(el("p", null, "Experience, training and certificates will be added once they have been verified. My academic and course work is on the Projects page."));
    var a = el("a", "btn btn-secondary", "View projects");
    a.href = "projects.html";
    box.appendChild(a);
    c.appendChild(box);
    sec.appendChild(c);
    frag.appendChild(sec);
  }

  root.replaceChildren(frag);

  /* In-page links only for sections that exist */
  var nav = document.getElementById("experience-jump");
  if (nav) {
    var ul = el("ul", "jump-links");
    SECTIONS.forEach(function (s) {
      if (document.getElementById(s.id)) {
        var li = el("li");
        var a = el("a", null, s.title);
        a.href = "#" + s.id;
        li.appendChild(a);
        ul.appendChild(li);
      }
    });
    if (ul.children.length > 1) nav.appendChild(ul); else nav.hidden = true;
  }
})();
