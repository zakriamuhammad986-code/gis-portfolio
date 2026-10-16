(function () {
  "use strict";

  var DATA = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
  var CATS = window.PROJECT_CATEGORIES || {};
  var grid = document.getElementById("project-grid");
  if (!grid) return;

  var searchInput = document.getElementById("project-search");
  var sortSelect = document.getElementById("project-sort");
  var catGroup = document.getElementById("category-filters");
  var statusEl = document.getElementById("results-status");
  var clearBtns = document.querySelectorAll("[data-clear-filters]");
  var emptyState = document.getElementById("empty-state");
  var dlg = document.getElementById("project-dialog");
  var dlgTitle = document.getElementById("dialog-title");
  var dlgEyebrow = document.getElementById("dialog-eyebrow");
  var dlgDates = document.getElementById("dialog-dates");
  var dlgBody = document.getElementById("dialog-body");
  var dlgClose = document.getElementById("dialog-close");
  var dlgPrev = document.getElementById("dialog-prev");
  var dlgNext = document.getElementById("dialog-next");
  var dlgPos = document.getElementById("dialog-pos");
  var dlgStatus = document.getElementById("dialog-status");
  var root = document.documentElement;

  var state = { cat: "all", q: "", sort: "newest" };
  var cards = {};
  var visible = [];
  var current = null;
  var opener = null;

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function catLabel(key) { return CATS[key] || key; }

  function isHttps(u) {
    try { return new URL(u).protocol === "https:"; } catch (e) { return false; }
  }

  function byId(id) {
    for (var i = 0; i < DATA.length; i++) if (DATA[i].id === id) return DATA[i];
    return null;
  }

  DATA.forEach(function (p, i) {
    p._i = i;
    p._hay = norm([p.title, p.summary, p.dates, p.studyArea || "", catLabel(p.category), (p.tools || []).join(" ")].join(" "));
  });

  /* ---------- images ---------- */
  function picture(p, lazy) {
    var base = p.image || "";
    var alt = p.imageIsPlaceholder ? (p.imageAlt || "Placeholder graphic. Not project output.") : (p.imageAlt || p.title);
    var img = el("img");
    img.width = 640; img.height = 400; img.alt = alt; img.decoding = "async";
    if (lazy) img.loading = "lazy";
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(base)) {
      img.src = base;
      return img;
    }
    var pic = el("picture");
    var s = el("source"); s.srcset = base + ".webp"; s.type = "image/webp";
    pic.appendChild(s);
    img.src = base + ".jpg";
    pic.appendChild(img);
    return pic;
  }

  function thumb(p, lazy) {
    var f = el("div", "project-thumb");
    f.appendChild(picture(p, lazy));
    if (p.imageIsPlaceholder) f.appendChild(el("span", "ph-badge", "Placeholder preview"));
    return f;
  }

  /* ---------- cards ---------- */
  function buildCard(p) {
    var li = el("li", "project-item");
    li.setAttribute("data-id", p.id);
    var art = el("article", "project-card");
    art.appendChild(thumb(p, true));

    var body = el("div", "project-body");
    var tags = el("ul", "tag-row");
    tags.setAttribute("aria-label", "Category");
    tags.appendChild(el("li", "tag", catLabel(p.category)));
    if (p.status) tags.appendChild(el("li", "tag tag-draft", p.status));
    body.appendChild(tags);

    var h = el("h3");
    var btn = el("button", "card-open", p.title);
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.addEventListener("click", function () { openProject(p.id, btn); });
    h.appendChild(btn);
    body.appendChild(h);

    body.appendChild(el("p", "project-dates", p.dates));
    body.appendChild(el("p", "project-summary", p.summary));

    var tools = el("ul", "tool-row");
    tools.setAttribute("aria-label", "Tools");
    (p.tools || []).slice(0, 4).forEach(function (t) { tools.appendChild(el("li", "tool", t)); });
    if ((p.tools || []).length > 4) tools.appendChild(el("li", "tool tool-more", "+" + (p.tools.length - 4) + " more"));
    body.appendChild(tools);

    var more = el("span", "view-more", "View details");
    more.setAttribute("aria-hidden", "true");
    body.appendChild(more);

    art.appendChild(body);
    li.appendChild(art);
    return li;
  }

  /* ---------- filter / sort ---------- */
  function cmpNewest(a, b) {
    if (a.sortEnd !== b.sortEnd) return a.sortEnd < b.sortEnd ? 1 : -1;
    if (a.sortStart !== b.sortStart) return a.sortStart < b.sortStart ? 1 : -1;
    return a._i - b._i;
  }

  function computeVisible() {
    var tokens = norm(state.q).split(/\s+/).filter(Boolean);
    var list = DATA.filter(function (p) {
      if (state.cat !== "all" && p.category !== state.cat) return false;
      return tokens.every(function (t) { return p._hay.indexOf(t) !== -1; });
    });
    if (state.sort === "newest") list.sort(cmpNewest);
    else if (state.sort === "oldest") list.sort(function (a, b) { return -cmpNewest(a, b); });
    else list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    return list;
  }

  function filtersActive() { return state.cat !== "all" || state.q.trim() !== ""; }

  function update() {
    visible = computeVisible();
    var nodes = visible.map(function (p) { return cards[p.id]; });
    grid.replaceChildren.apply(grid, nodes);
    emptyState.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;

    var msg = "Showing " + visible.length + " of " + DATA.length + " projects";
    if (state.cat !== "all") msg += " in " + catLabel(state.cat);
    if (state.q.trim()) msg += " matching “" + state.q.trim() + "”";
    statusEl.textContent = msg + ".";
    clearBtns.forEach(function (b) { if (b.hasAttribute("data-main-clear")) b.hidden = !filtersActive(); });
  }

  function clearFilters() {
    state.cat = "all"; state.q = "";
    searchInput.value = "";
    var all = catGroup.querySelector('input[value="all"]');
    if (all) all.checked = true;
    update();
  }

  /* ---------- detail dialog ---------- */
  function addDetails(hint) {
    var p = el("p", "missing");
    p.appendChild(el("span", "add-details", "Add details"));
    if (hint) p.appendChild(document.createTextNode(" " + hint));
    return p;
  }

  function section(title, node) {
    var s = el("section", "detail-section");
    s.appendChild(el("h3", null, title));
    s.appendChild(node);
    return s;
  }

  function list(items, cls) {
    var ul = el("ul", cls || "detail-list");
    items.forEach(function (t) { ul.appendChild(el("li", cls === "tool-row" ? "tool" : null, t)); });
    return ul;
  }

  function linkRow(dl, label, url, hint) {
    dl.appendChild(el("dt", null, label));
    var dd = el("dd");
    if (url && isHttps(url)) {
      var a = el("a", null, url.replace(/^https:\/\//, ""));
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.appendChild(el("span", "visually-hidden", " (opens in a new tab)"));
      dd.appendChild(a);
    } else {
      dd.appendChild(el("span", "add-details", "Add link"));
      dd.appendChild(document.createTextNode(" " + hint));
    }
    dl.appendChild(dd);
  }

  function renderDetail(p) {
    current = p;
    dlgEyebrow.textContent = catLabel(p.category) + (p.status ? " · " + p.status : "");
    dlgTitle.textContent = p.title;
    dlgDates.textContent = p.dates;
    dlgBody.replaceChildren();

    /* preview */
    var fig = el("figure", "detail-figure");
    if (p.screenshot && (/^(assets\/|\.\/assets\/)/.test(p.screenshot) || isHttps(p.screenshot))) {
      var im = el("img"); im.src = p.screenshot; im.alt = p.screenshotAlt || "Screenshot of " + p.title;
      im.width = 640; im.height = 400;
      fig.appendChild(im);
    } else {
      fig.appendChild(thumb(p, false));
      var cap = el("figcaption", null, "Placeholder preview. Add a screenshot or map of the finished work.");
      fig.appendChild(cap);
    }
    dlgBody.appendChild(fig);

    if (p.caution) {
      var n = el("p", "notice notice-caution");
      n.appendChild(el("strong", null, "Please note. "));
      n.appendChild(document.createTextNode(p.caution));
      dlgBody.appendChild(n);
    }

    var cols = el("div", "detail-grid");

    cols.appendChild(section("Overview", el("p", null, p.overview)));
    cols.appendChild(section("Objective", el("p", null, p.objective)));

    var area = p.studyArea ? el("p", null, p.studyArea) : addDetails("Add the study area.");
    cols.appendChild(section("Study area", area));

    var data = el("div");
    if (p.data && p.data.length) data.appendChild(list(p.data));
    else data.appendChild(addDetails(p.dataHint || "Add data sources and dates."));
    cols.appendChild(section("Data sources and dates", data));

    var meth = el("div");
    if (p.methods && p.methods.length) meth.appendChild(list(p.methods));
    if (p.methodsHint) meth.appendChild(addDetails("Step-by-step workflow not documented yet. " + p.methodsHint));
    cols.appendChild(section("Methods and workflow", meth));

    cols.appendChild(section("Tools and software", list(p.tools || [], "tool-row")));

    var out = el("div");
    if (p.outputs && p.outputs.length) out.appendChild(list(p.outputs));
    else out.appendChild(addDetails(p.outputsHint || "Add outputs and findings."));
    cols.appendChild(section("Outputs and findings", out));

    var role = el("dl", "detail-dl");
    role.appendChild(el("dt", null, "My role"));
    var rd = el("dd");
    if (p.role) rd.textContent = p.role; else rd.appendChild(addDetails("Add your role in this project."));
    role.appendChild(rd);
    role.appendChild(el("dt", null, "Project type"));
    role.appendChild(el("dd", null, p.projectType || "Add details"));
    cols.appendChild(section("Role and project type", role));

    var links = el("dl", "detail-dl");
    var L = p.links || {};
    linkRow(links, "GitHub", L.github, "Only after the repository has been checked.");
    linkRow(links, "Live demo", L.demo, "Only after the demo has been checked.");
    linkRow(links, "Report", L.report, "Only if a report is available to share.");
    var lk = el("div"); lk.appendChild(links);
    if (p.linksHint) lk.appendChild(el("p", "hint", p.linksHint));
    cols.appendChild(section("Links", lk));

    dlgBody.appendChild(cols);
    dlgBody.scrollTop = 0;

    var idx = visible.indexOf(p);
    var listForNav = idx === -1 ? DATA.slice().sort(cmpNewest) : visible;
    if (idx === -1) idx = listForNav.indexOf(p);
    dlgPrev.disabled = idx <= 0;
    dlgNext.disabled = idx >= listForNav.length - 1;
    dlgPrev.dataset.target = idx > 0 ? listForNav[idx - 1].id : "";
    dlgNext.dataset.target = idx < listForNav.length - 1 ? listForNav[idx + 1].id : "";
    dlgPos.textContent = "Project " + (idx + 1) + " of " + listForNav.length;
    dlgStatus.textContent = "Project " + (idx + 1) + " of " + listForNav.length + ": " + p.title;
  }

  function openProject(id, from) {
    var p = byId(id);
    if (!p) return;
    opener = from || opener;
    renderDetail(p);
    if (!dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      root.classList.add("modal-open");
    }
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
  }

  function step(btn) {
    var id = btn.dataset.target;
    if (!id) return;
    renderDetail(byId(id));
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
    if (btn.disabled) {
      var other = btn === dlgPrev ? dlgNext : dlgPrev;
      (other.disabled ? dlgClose : other).focus();
    }
  }

  dlgPrev.addEventListener("click", function () { step(dlgPrev); });
  dlgNext.addEventListener("click", function () { step(dlgNext); });
  dlgClose.addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () {
    root.classList.remove("modal-open");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    var back = opener && document.contains(opener) ? opener : (current && cards[current.id] ? cards[current.id].querySelector(".card-open") : null);
    if (back) back.focus();
    opener = null;
  });

  window.addEventListener("hashchange", function () {
    var id = decodeURIComponent(location.hash.slice(1));
    if (id && byId(id)) openProject(id, null);
    else if (dlg.open) dlg.close();
  });

  /* ---------- wire up ---------- */
  DATA.forEach(function (p) { cards[p.id] = buildCard(p); });

  var counts = { all: DATA.length };
  DATA.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
  document.querySelectorAll("[data-count]").forEach(function (s) {
    s.textContent = String(counts[s.getAttribute("data-count")] || 0);
  });

  searchInput.addEventListener("input", function () { state.q = searchInput.value; update(); });
  sortSelect.addEventListener("change", function () { state.sort = sortSelect.value; update(); });
  catGroup.addEventListener("change", function (e) {
    if (e.target && e.target.name === "category") { state.cat = e.target.value; update(); }
  });
  document.getElementById("project-form").addEventListener("submit", function (e) { e.preventDefault(); });
  clearBtns.forEach(function (b) {
    b.addEventListener("click", function () { clearFilters(); searchInput.focus(); });
  });

  update();

  var initial = decodeURIComponent(location.hash.slice(1));
  if (initial && byId(initial)) openProject(initial, null);
})();
