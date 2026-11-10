(function () {
  "use strict";

  var api = window.CertPayrollCheck;
  var demo = document.getElementById("sample-demo");
  var total = document.getElementById("demo-total");
  var motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduce = motion && motion.matches;
  var frame = null;
  var started = false;
  var totalCents = 21500;
  var demoObserver;
  var revealObserver;

  function element(tag, className, text, parent) {
    var node = document.createElement(tag);
    node.className = className;
    if (text != null) { node.textContent = text; }
    parent.appendChild(node);
    return node;
  }

  function confirmSample() {
    var RULES = api.RULES;
    var result = api.check({ csvText: RULES.sample.csv, rates: RULES.sample.rates, options: RULES.sample.options });
    var flags = document.getElementById("demo-flags");
    var icon = flags.querySelector("svg").cloneNode(true);
    var rows = api.parseCsv(RULES.sample.csv);
    var columns = rows.columns;
    var body = demo.querySelector("tbody");
    while (body.firstChild) { body.removeChild(body.firstChild); }
    result.rows.forEach(function (row, index) {
      var tr = element("tr", row.status === "flagged" ? "row-flag" : row.apprentice ? "row-ratio" : "", null, body);
      tr.id = "demo-row-" + row.row;
      var raw = rows.records[index].fields;
      var rate = api.parseMoney(raw[columns.indexOf("rate_paid")]);
      [row.row, row.worker, row.classification, row.status === "bad" ? "Fix hours" : api.formatHours(row.hours),
        rate.value == null ? "Check rate" : api.formatMoney(rate.value)].forEach(function (value) {
        element("td", "", value, tr);
      });
    });
    while (flags.firstChild) { flags.removeChild(flags.firstChild); }
    result.items.filter(function (item) { return item.severity === "flag"; }).forEach(function (item) {
      var block = element("div", "demo-flag", null, flags);
      block.setAttribute("data-flag", item.id);
      block.appendChild(icon.cloneNode(true));
      var copy = element("div", "", null, block);
      var small = element("small", "", null, copy);
      var label = item.worker ? item.worker + ", " + item.classification + " · row " + item.row : item.classification;
      var rowNumber = item.row;
      if (item.id === "ratio-over") {
        label += " · days " + api.joinList(item.values.days.map(function (day) { return String(day.day); }));
        var apprentices = result.rows.filter(function (row) { return row.apprentice && row.classification === item.classification; });
        rowNumber = apprentices.length ? apprentices[0].row : null;
      }
      var link = element(rowNumber ? "a" : "span", "", label, small);
      if (rowNumber) { link.setAttribute("href", "#demo-row-" + rowNumber); }
      element("strong", "", RULES.items[item.id].title, copy);
      element("span", "amount", item.id === "ratio-over" ? item.values.ratio : api.formatMoney(item.amountCents), block);
      block.setAttribute("title", item.message);
    });
    totalCents = result.summary.totalCents;
    total.textContent = api.formatMoney(totalCents);
    var totalSr = document.getElementById("demo-total-sr");
    if (totalSr) { totalSr.textContent = api.formatMoney(totalCents); }
    document.getElementById("demo-meta").textContent = api.plural(result.summary.flags, "flag") + " · " +
      api.plural(result.summary.fixes, "fix") + " · " + api.plural(result.summary.notes, "note");
    document.getElementById("demo-caption").textContent = "The sample week: " + result.summary.rowsRead + " made-up rows, checked by this page.";
  }

  function finishDemo() {
    if (frame !== null) { window.cancelAnimationFrame(frame); frame = null; }
    if (demo) {
      demo.classList.remove("demo-pending");
      demo.classList.remove("demo-playing");
    }
    if (total && api) { total.textContent = api.formatMoney(totalCents); }
  }

  function playDemo() {
    if (started) { return; }
    started = true;
    if (reduce || !window.requestAnimationFrame) { finishDemo(); return; }
    demo.classList.add("demo-playing");
    var startTime;
    function tick(now) {
      if (startTime == null) { startTime = now; }
      var elapsed = now - startTime;
      var progress = Math.min(1, Math.max(0, (elapsed - 1250) / 1600));
      total.textContent = api.formatMoney(Math.round(totalCents * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) { frame = window.requestAnimationFrame(tick); }
      else { finishDemo(); }
    }
    frame = window.requestAnimationFrame(tick);
  }

  function start() {
    // checker.js mounts on DOMContentLoaded. Waiting for the same event keeps its own sample action in charge.
    var sample = document.getElementById("hero-sample");
    if (sample && api) {
      sample.addEventListener("click", function (event) {
        var buttons = document.querySelectorAll("#checker button");
        for (var i = 0; i < buttons.length; i += 1) {
          if (buttons[i].textContent === api.RULES.ui.sample_button) {
            event.preventDefault();
            buttons[i].click();
            document.getElementById("check").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            break;
          }
        }
      });
    }
    if (demo && total && api) { confirmSample(); }
    if (reduce || !("IntersectionObserver" in window)) { return; }

    revealObserver = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 24px 0px" });
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i += 1) { revealObserver.observe(reveals[i]); }
    document.documentElement.classList.add("motion-ready");

    if (demo && api) {
      demoObserver = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            playDemo();
            demoObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      demoObserver.observe(demo);
      demo.classList.add("demo-pending");
    }
  }

  function motionChanged(event) {
    reduce = event.matches;
    if (!reduce) { return; }
    document.documentElement.classList.remove("motion-ready");
    if (revealObserver) { revealObserver.disconnect(); }
    if (demoObserver) { demoObserver.disconnect(); }
    finishDemo();
  }
  if (motion) {
    if (motion.addEventListener) { motion.addEventListener("change", motionChanged); }
    else if (motion.addListener) { motion.addListener(motionChanged); }
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); }
  else { start(); }
})();
