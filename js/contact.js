(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var cfg = window.SITE_CONFIG || {};
  var cf = cfg.contactForm || {};

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function str(v) { return typeof v === "string" ? v.trim() : ""; }
  function isHttps(u) {
    try { return new URL(u).protocol === "https:"; } catch (e) { return false; }
  }
  var EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
  function isEmail(v) { return EMAIL_RE.test(v) && v.length <= 254; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== "") n.textContent = text;
    return n;
  }

  /* ---------- direct contact details (verified values only) ---------- */
  function fillRow(key, node) {
    var row = document.querySelector('[data-contact-row="' + key + '"]');
    if (!row || !node) return;
    row.replaceChildren(node);
  }
  function extLink(url, text) {
    var a = el("a", null, text);
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.appendChild(el("span", "visually-hidden", " (opens in a new tab)"));
    return a;
  }

  var email = str(cfg.email);
  var emailOk = isEmail(email);
  if (emailOk) {
    var ea = el("a", null, email); ea.href = "mailto:" + email; fillRow("email", ea);
  }
  var phone = str(cfg.phone);
  if (/^\+?[\d][\d\s().-]{5,}$/.test(phone)) {
    var pa = el("a", null, phone); pa.href = "tel:" + phone.replace(/[^\d+]/g, ""); fillRow("phone", pa);
  }
  var wa = str(cfg.whatsapp);
  if (isHttps(wa)) fillRow("whatsapp", extLink(wa, "Message on WhatsApp"));

  var extra = [];
  (Array.isArray(cfg.links) ? cfg.links : []).forEach(function (l) {
    if (!l || typeof l.label !== "string" || !isHttps(str(l.url))) return;
    var label = l.label.trim();
    var key = label.toLowerCase();
    if (key === "linkedin" || key === "github") fillRow(key, extLink(l.url.trim(), label));
    else if (label) extra.push({ label: label, url: l.url.trim() });
  });
  if (extra.length) {
    var dl = document.querySelector(".contact-dl");
    extra.forEach(function (x) {
      var dt = el("dt", null, x.label);
      var dd = el("dd"); dd.appendChild(extLink(x.url, x.label));
      dl.appendChild(dt); dl.appendChild(dd);
    });
  }

  /* ---------- delivery mode ---------- */
  var endpoint = str(cf.endpoint);
  var mode = isHttps(endpoint) ? "endpoint" : (emailOk ? "mailto" : "none");
  var timeoutMs = typeof cf.timeoutMs === "number" && cf.timeoutMs > 0 ? cf.timeoutMs : 15000;
  var maxMessage = mode === "mailto" ? 1000 : 3000;

  var fieldset = $("contact-fields");
  var submitBtn = $("cf-submit");
  var modeNote = $("form-mode");
  var summary = $("form-summary");
  var statusBox = $("form-status");
  var errorBox = $("form-error");
  var counter = $("cf-count");

  var MODE_TEXT = {
    none: "The contact form is not connected yet, so it cannot send messages.",
    mailto: "This form opens your email app with your message ready to send. Nothing is sent until you press send there.",
    endpoint: "Your message is sent through an online form service."
  };
  modeNote.textContent = MODE_TEXT[mode];
  modeNote.className = "notice form-mode" + (mode === "none" ? " notice-warn" : "");

  var SUBMIT_TEXT = { none: "Form not connected yet", mailto: "Open in email app", endpoint: "Send message" };
  submitBtn.textContent = SUBMIT_TEXT[mode];

  if (mode !== "none") {
    fieldset.disabled = false;
    submitBtn.disabled = false;
  }
  var noscriptNote = document.getElementById("contact-noscript");
  if (noscriptNote) noscriptNote.hidden = true;

  /* ---------- fields and validation ---------- */
  var fields = {
    name: { input: $("cf-name"), err: $("cf-name-err"), label: "Name" },
    email: { input: $("cf-email"), err: $("cf-email-err"), label: "Email" },
    type: { input: $("cf-type"), err: $("cf-type-err"), label: "Subject / project type" },
    message: { input: $("cf-message"), err: $("cf-message-err"), label: "Message" }
  };
  var order = ["name", "email", "type", "message"];
  Object.keys(fields).forEach(function (k) {
    var f = fields[k];
    f.baseDescribedBy = f.input.getAttribute("aria-describedby") || "";
  });

  function check(key) {
    var v = fields[key].input.value.trim();
    switch (key) {
      case "name":
        if (v.length < 2) return "Error: enter your name (at least 2 characters).";
        if (v.length > 100) return "Error: keep your name under 100 characters.";
        return "";
      case "email":
        if (!v) return "Error: enter your email address.";
        if (!isEmail(v)) return "Error: enter a valid email address, like name@example.com.";
        return "";
      case "type":
        return v ? "" : "Error: choose a subject or project type.";
      case "message":
        if (v.length < 10) return "Error: write a message of at least 10 characters.";
        if (v.length > maxMessage) return "Error: keep your message under " + maxMessage + " characters.";
        return "";
    }
    return "";
  }

  function showFieldError(key, msg) {
    var f = fields[key];
    if (msg) {
      f.err.textContent = msg;
      f.err.hidden = false;
      f.input.setAttribute("aria-invalid", "true");
      f.input.setAttribute("aria-describedby", (f.baseDescribedBy + " " + f.err.id).trim());
    } else {
      f.err.textContent = "";
      f.err.hidden = true;
      f.input.removeAttribute("aria-invalid");
      if (f.baseDescribedBy) f.input.setAttribute("aria-describedby", f.baseDescribedBy);
      else f.input.removeAttribute("aria-describedby");
    }
  }

  function renderSummary(errors) {
    summary.replaceChildren();
    if (!errors.length) { summary.hidden = true; return; }
    summary.appendChild(el("h2", null, errors.length === 1 ? "There is 1 problem with your message" : "There are " + errors.length + " problems with your message"));
    var ul = el("ul");
    errors.forEach(function (e) {
      var li = el("li");
      var a = el("a", null, fields[e.key].label + ": " + e.msg.replace(/^Error:\s*/, ""));
      a.href = "#" + fields[e.key].input.id;
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        fields[e.key].input.focus();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    summary.appendChild(ul);
    summary.hidden = false;
  }

  function validateAll() {
    var errors = [];
    order.forEach(function (k) {
      var m = check(k);
      showFieldError(k, m);
      if (m) errors.push({ key: k, msg: m });
    });
    renderSummary(errors);
    return errors;
  }

  var attempted = false;
  order.forEach(function (k) {
    var f = fields[k];
    var ev = k === "type" ? "change" : "input";
    f.input.addEventListener(ev, function () {
      if (!attempted) return;
      showFieldError(k, check(k));
      var errors = [];
      order.forEach(function (kk) { var m = check(kk); if (m) errors.push({ key: kk, msg: m }); });
      renderSummary(errors);
    });
    f.input.addEventListener("blur", function () {
      if (attempted) showFieldError(k, check(k));
    });
  });

  function updateCount() {
    var n = fields.message.input.value.length;
    counter.textContent = n + " / " + maxMessage;
    counter.classList.toggle("over", n > maxMessage);
  }
  fields.message.input.addEventListener("input", updateCount);
  updateCount();

  /* ---------- feedback ---------- */
  function clearFeedback() {
    statusBox.hidden = true; statusBox.replaceChildren(); statusBox.className = "form-status";
    errorBox.hidden = true; errorBox.replaceChildren();
  }
  function showStatus(parts, ok) {
    statusBox.replaceChildren.apply(statusBox, parts);
    statusBox.className = "form-status" + (ok ? " is-success" : "");
    statusBox.hidden = false;
  }
  function showError(parts) {
    errorBox.replaceChildren.apply(errorBox, parts);
    errorBox.hidden = false;
    errorBox.focus();
  }
  function emailFallback() {
    if (!emailOk) return [];
    var a = el("a", null, email); a.href = "mailto:" + email;
    return [document.createTextNode(" You can also email "), a, document.createTextNode(" directly.")];
  }

  /* ---------- sending ---------- */
  var busy = false;

  function collect() {
    var typeSel = fields.type.input;
    var typeLabel = typeSel.options[typeSel.selectedIndex].text;
    return {
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      type: typeLabel,
      message: fields.message.input.value.trim()
    };
  }

  function sendMailto(d) {
    var subject = "Portfolio enquiry: " + d.type;
    var body = "Name: " + d.name + "\nEmail: " + d.email + "\nSubject / project type: " + d.type + "\n\n" + d.message;
    var href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    /* Many email apps drop or reject very long mailto links, so refuse instead of silently losing text. */
    if (href.length > 1800) {
      showError([
        el("strong", null, "Your email app was not opened. "),
        document.createTextNode("The message is too long to pass to an email app. Please shorten it.")
      ].concat(emailFallback()));
      return;
    }
    var a = document.createElement("a");
    a.href = href;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    var addr = el("a", null, email); addr.href = "mailto:" + email;
    showStatus([
      el("strong", null, "Your email app should now open with your message ready. "),
      document.createTextNode("Nothing has been sent yet. Press send in your email app. If nothing opened, email "),
      addr,
      document.createTextNode(" directly.")
    ], false);
    statusBox.focus();
  }

  function errorFromResponse(status, json) {
    if (json) {
      if (Array.isArray(json.errors) && json.errors.length) {
        var m = json.errors.map(function (e) { return e && (e.message || e.error); }).filter(Boolean).join(" ");
        if (m) return m;
      }
      if (typeof json.message === "string" && json.message) return json.message;
      if (typeof json.error === "string" && json.error) return json.error;
    }
    if (status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (status >= 500) return "The form service had a problem. Please try again later.";
    return "The form service did not accept the message. Check your details and try again.";
  }

  function sendEndpoint(d) {
    var fd = new FormData();
    fd.append("name", d.name);
    fd.append("email", d.email);
    fd.append("subject", "Portfolio enquiry: " + d.type);
    fd.append("project_type", d.type);
    fd.append("message", d.message);
    var reserved = { name: 1, email: 1, subject: 1, project_type: 1, message: 1 };
    var extras = cf.fields && typeof cf.fields === "object" ? cf.fields : {};
    Object.keys(extras).forEach(function (k) {
      var v = extras[k];
      if (!reserved[k] && (typeof v === "string" || typeof v === "number")) fd.append(k, String(v));
    });

    busy = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    showStatus([document.createTextNode("Sending your message…")], false);

    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeoutMs);

    var finished = function () {
      clearTimeout(timer);
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = SUBMIT_TEXT.endpoint;
      form.removeAttribute("aria-busy");
    };

    fetch(endpoint, {
      method: "POST",
      body: fd,
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.text().then(function (t) {
        var json = null;
        try { json = t ? JSON.parse(t) : null; } catch (e) { json = null; }
        /* Strict: only an explicit success reply counts. A plain 200 with no recognisable body
           (for example a wrong URL that returns a web page) must never show "sent". */
        var ok = res.ok && !!json && (json.ok === true || json.success === true);
        var explicitFail = !!json && (json.ok === false || json.success === false);
        finished();
        if (ok) {
          form.reset();
          attempted = false;
          order.forEach(function (k) { showFieldError(k, ""); });
          renderSummary([]);
          updateCount();
          showStatus([
            el("strong", null, "Thank you, your message was sent."),
            document.createTextNode(" The form service accepted it.")
          ], true);
          statusBox.focus();
        } else {
          statusBox.hidden = true;
          var why = (res.ok && !explicitFail)
            ? "The form service replied in an unexpected way, so the message may not have been sent. Please try again later."
            : errorFromResponse(res.status, json);
          showError([el("strong", null, "Your message was not sent. "), document.createTextNode(why)].concat(emailFallback()));
        }
      });
    }).catch(function (err) {
      finished();
      statusBox.hidden = true;
      var timedOut = err && err.name === "AbortError";
      showError([
        el("strong", null, "Your message was not sent. "),
        document.createTextNode(timedOut
          ? "The form service took too long to respond. Check your connection and try again."
          : "Could not reach the form service. Check your connection and try again.")
      ].concat(emailFallback()));
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (mode === "none" || busy) return;
    attempted = true;
    clearFeedback();
    var errors = validateAll();
    if (errors.length) {
      summary.focus();
      return;
    }
    /* Basic spam trap: real visitors never see this field. If something filled it (for example an autofill tool), nothing is sent and the visitor is told so. */
    if ($("cf-confirm").value) {
      showError([el("strong", null, "Your message was not sent. "), document.createTextNode("Something filled a hidden field on this form. Please reload the page and try again.")].concat(emailFallback()));
      return;
    }

    var d = collect();
    if (mode === "mailto") sendMailto(d);
    else sendEndpoint(d);
  });
})();
