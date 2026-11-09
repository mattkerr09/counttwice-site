(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) { module.exports = api; }
  if (typeof window !== "undefined") {
    window.CertPayrollCheck = api;
    function start() {
      var el = window.document.getElementById("checker");
      if (el) { api.mount(el); }
    }
    if (window.document.readyState === "loading") {
      window.document.addEventListener("DOMContentLoaded", start, { once: true });
    } else { start(); }
  }
})(this, function () {
  "use strict";

  function deepFreeze(value) {
    Object.keys(value).forEach(function (key) {
      if (value[key] && typeof value[key] === "object") { deepFreeze(value[key]); }
    });
    return Object.freeze(value);
  }

  var RULES = deepFreeze({
  "schema": 1,
  "checked": "2026-11-08",
  "about": "Flag definitions and wording for the certified payroll checker.",
  "limits": {
    "max_rows": 2000,
    "max_file_bytes": 2000000,
    "max_hours_per_day": 24,
    "weekly_overtime_after_hours": 40,
    "overtime_multiplier": 1.5,
    "tolerance_cents_per_hour": 1,
    "max_value_chars_in_messages": 40,
    "michigan": {
      "daily_cap_hours": 8,
      "daily_cap_hours_four_tens": 10,
      "double_time_multiplier": 2
    }
  },
  "columns": {
    "required": [
      "worker",
      "classification",
      "day1",
      "day2",
      "day3",
      "day4",
      "day5",
      "day6",
      "day7",
      "rate_paid"
    ],
    "optional": [
      "cash_fringe",
      "plan_fringe",
      "apprentice",
      "ot_rate_paid"
    ],
    "aliases": {
      "worker": [
        "worker",
        "name",
        "workername",
        "employee",
        "employeename"
      ],
      "classification": [
        "classification",
        "trade",
        "craft",
        "laborclassification",
        "workclassification"
      ],
      "day1": [
        "day1"
      ],
      "day2": [
        "day2"
      ],
      "day3": [
        "day3"
      ],
      "day4": [
        "day4"
      ],
      "day5": [
        "day5"
      ],
      "day6": [
        "day6"
      ],
      "day7": [
        "day7"
      ],
      "rate_paid": [
        "ratepaid",
        "rate",
        "hourlyrate",
        "straighttimerate",
        "strate"
      ],
      "cash_fringe": [
        "cashfringe",
        "cashinlieu",
        "cashinlieuoffringe",
        "fringecash"
      ],
      "plan_fringe": [
        "planfringe",
        "fringeplan",
        "fringecredit",
        "plancredit"
      ],
      "apprentice": [
        "apprentice",
        "jra",
        "journeyworkerorapprentice"
      ],
      "ot_rate_paid": [
        "otratepaid",
        "otrate",
        "overtimerate",
        "overtimeratepaid"
      ]
    }
  },
  "apprentice_values": {
    "yes": [
      "yes",
      "y",
      "true",
      "1",
      "ra",
      "apprentice"
    ],
    "no": [
      "no",
      "n",
      "false",
      "0",
      "j",
      "journeyworker",
      ""
    ]
  },
  "weekdays": [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ],
  "weekday_labels": {
    "sunday": "Sunday",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday"
  },
  "plurals": {
    "row": [
      "row",
      "rows"
    ],
    "hour": [
      "hour",
      "hours"
    ],
    "apprentice": [
      "apprentice",
      "apprentices"
    ],
    "journeyworker": [
      "journeyworker",
      "journeyworkers"
    ],
    "flag": [
      "flag",
      "flags"
    ],
    "fix": [
      "thing to fix",
      "things to fix"
    ],
    "note": [
      "note",
      "notes"
    ]
  },
  "severities": {
    "flag": {
      "heading": "Flags",
      "about": "Pay that looks short. Fix these before you sign."
    },
    "fix": {
      "heading": "Things to fix in your file or rates",
      "about": "The page couldn't check these yet."
    },
    "note": {
      "heading": "Notes",
      "about": "Worth a look. Not counted as a shortfall."
    }
  },
  "items": {
    "pay-short": {
      "severity": "flag",
      "rule": "R1",
      "title": "Pay under the base rate",
      "message": "{worker}, {classification}: paid {rate_paid} an hour against a {base} base rate. Cash and plan payments come to {total_paid} an hour, and base plus fringe is {total_due}. That's {gap} an hour short, about {week_amount} this week."
    },
    "fringe-short": {
      "severity": "flag",
      "rule": "R1",
      "title": "Fringe short",
      "message": "{worker}, {classification}: the fringe is {fringe} an hour. Cash above the base rate, cash fringe and plan payments come to {credit} an hour. That's {gap} an hour short, about {week_amount} this week."
    },
    "ot-short": {
      "severity": "flag",
      "rule": "R4",
      "title": "Overtime under time and a half",
      "message": "{worker}, {classification}: {ot_hours_text} of overtime paid at {ot_paid} an hour. Overtime needs at least {ot_required} an hour, not counting cash fringe. That's 1.5 times the {basis} basic rate. You're {gap} an hour short, about {week_amount} this week.",
      "message_extra_cash": "{worker}, {classification}: {ot_hours_text} of overtime paid at {ot_paid} an hour. Your cash fringe is {extra_cash} more than the fringe due, so that part counts as wages and overtime is figured on {basis}. Overtime needs at least {ot_required} an hour, not counting cash fringe. You're {gap} an hour short, about {week_amount} this week."
    },
    "ratio-over": {
      "severity": "flag",
      "rule": "R6",
      "title": "Apprentices over the ratio",
      "message": "{classification}: more apprentices than your {ratio} ratio allows on {days}. {details} An apprentice over the ratio must be paid the full rate for the work: {base} an hour plus {fringe} fringe.",
      "detail": "Day {day}: {apprentices_text} and {journeyworkers_text}, so {allowed} allowed."
    },
    "class-missing": {
      "severity": "fix",
      "rule": "R2",
      "title": "No rate for this trade",
      "message": "Row {row}, {worker}: there's no rate for {classification} yet. Add it to your rates to check this row."
    },
    "bad-row": {
      "severity": "fix",
      "rule": "SPEC",
      "title": "Row not read",
      "message": "Row {row}: {problem} This row wasn't checked.",
      "problems": {
        "wrong-fields": "it has {found} values, but the header has {expected}.",
        "missing-worker": "the worker is blank.",
        "missing-class": "the classification is blank.",
        "bad-hours": "{column} should be hours, like 8 or 7.5, but it says \"{value}\".",
        "negative-hours": "{column} is below zero.",
        "too-many-hours": "{column} is more than 24 hours.",
        "missing-rate": "rate_paid is blank.",
        "bad-money": "{column} should be a dollar amount, like 30.00, but it says \"{value}\".",
        "negative-money": "{column} is below zero.",
        "bad-apprentice": "apprentice should be yes or no, but it says \"{value}\".",
        "duplicate": "{worker} already has a {classification} row, row {first_row}. Put all of their {classification} hours on one row."
      }
    },
    "file-error": {
      "severity": "fix",
      "rule": "SPEC",
      "title": "File not read",
      "message": "{problem}",
      "problems": {
        "empty": "The file is empty.",
        "not-csv": "This doesn't look like a CSV file. In your spreadsheet, use Save As and pick CSV, comma separated.",
        "no-rows": "The file has a header but no rows.",
        "missing-columns": "The file is missing these columns: {columns}. The sample file shows them all.",
        "duplicate-columns": "Two columns mean the same thing: {columns}. Keep one.",
        "too-many-rows": "The file has {found} rows. This page checks up to {max} at a time. Split the file and check each part.",
        "too-big": "The file is bigger than {max_mb} MB. Check one week at a time.",
        "unreadable": "The browser couldn't read this file. Save it again as CSV and try once more."
      }
    },
    "form-error": {
      "severity": "fix",
      "rule": "SPEC",
      "title": "Check your rates",
      "message": "{problem}",
      "problems": {
        "no-rates": "Type at least one trade and its base rate.",
        "class-blank": "Rate line {line}: type the trade name.",
        "base-missing": "{classification}: type the base rate.",
        "base-bad": "{classification}: the base rate should be a dollar amount above zero, like 30.00.",
        "fringe-bad": "{classification}: the fringe should be a dollar amount, like 10.00, or 0.",
        "ratio-bad": "{classification}: write the ratio like 1:3, meaning 1 apprentice for every 3 journeyworkers.",
        "duplicate-class": "{classification} is in your rates twice. Keep one.",
        "week-start-bad": "Pick the weekday your pay week starts on.",
        "holiday-bad": "Holidays have to be days 1 to 7 of the pay week."
      }
    },
    "ot-unchecked": {
      "severity": "note",
      "rule": "R4",
      "title": "Overtime not checked",
      "message": "{worker}, {classification}: {ot_hours_text} of overtime. Overtime needs at least {ot_required} an hour, not counting cash fringe. Add an ot_rate_paid column to check what you paid."
    },
    "ot-multi-row": {
      "severity": "note",
      "rule": "R4",
      "title": "Overtime across two trades",
      "message": "{worker} is on {rows_text} with {hours_text} in all this week, including {ot_hours_text} of overtime. This page doesn't split overtime between trades, so check it by hand. Paying each trade its own rate only works if your records show the hours in each."
    },
    "wage-covers-fringe": {
      "severity": "note",
      "rule": "R1",
      "title": "Cash wage counted toward fringe",
      "message": "{worker}, {classification}: {credit} of the {rate_paid} rate counts toward the fringe, as cash."
    },
    "ot-basis-full-rate": {
      "severity": "note",
      "rule": "R4",
      "title": "Overtime figured on the full rate",
      "message": "{worker}, {classification}: overtime was figured on the full {rate_paid} rate. If {credit} of it is cash in place of fringe, put that in cash_fringe instead. Then overtime is figured on {basis_if_split}."
    },
    "pay-covered-by-plan": {
      "severity": "note",
      "rule": "R1",
      "title": "Wage under the base rate, total covered",
      "message": "{worker}, {classification}: the {rate_paid} wage is under the {base} base rate, but cash and plan payments of {total_paid} cover base plus fringe of {total_due}. The law counts the total. Overtime is still figured on at least {base}."
    },
    "apprentice-not-checked": {
      "severity": "note",
      "rule": "R6",
      "title": "Apprentice pay not checked",
      "message": "{worker}, {classification}: marked as an apprentice. Apprentice pay and overtime follow the registered program, so this page only checks the ratio."
    },
    "ratio-missing": {
      "severity": "note",
      "rule": "R6",
      "title": "No apprentice ratio",
      "message": "{classification}: apprentices are on this payroll, but there's no ratio typed. Add the ratio from the apprenticeship program, like 1:3, to check it."
    },
    "no-hours": {
      "severity": "note",
      "rule": "SPEC",
      "title": "No hours",
      "message": "Row {row}: {worker} has no hours this week, so the row was skipped."
    },
    "ignored-columns": {
      "severity": "note",
      "rule": "SPEC",
      "title": "Columns not used",
      "message": "These columns aren't used, so they were skipped: {columns}."
    },
    "mi-double-time": {
      "severity": "note",
      "rule": "R7",
      "title": "Michigan double time",
      "message": "{worker}, {classification}: {dt_hours_text} on a Sunday or a holiday you marked. Michigan's standard rule is double time, at least {dt_required} an hour before fringe. This page can't see your double-time rate, so check it by hand."
    },
    "mi-mode": {
      "severity": "note",
      "rule": "R7",
      "title": "Michigan rules on",
      "message": "Michigan rules are on. Time and a half counts for hours over {cap} a day, hours over 40 a week and Saturdays. Double time counts for Sundays and the holidays you marked. A trade's schedule can set other rules."
    }
  },
  "summary": {
    "counts": "{rows_read_text} read: {checked} checked, {skipped} skipped, {bad} not read.",
    "tally": "{flags_text}, {fixes_text}, {notes_text}.",
    "total": "Possible shortfall this week: {total}. Apprentice ratio fixes aren't in that number.",
    "none": "No flags. Nothing in these rows came up short on the checks this page runs. Read what it doesn't check before you sign.",
    "stopped": "The check stopped. Fix the items below and try again."
  },
  "ui": {
    "rates_heading": "Your rates",
    "rates_help": "Copy these from the wage determination in your contract. One line per trade.",
    "col_classification": "Trade",
    "col_base": "Base rate",
    "col_fringe": "Fringe",
    "col_ratio": "Apprentice ratio",
    "ratio_placeholder": "1:3",
    "add_trade": "Add a trade",
    "remove_trade": "Remove",
    "found_trades": "Found in your file: {classifications}. Type their rates.",
    "michigan_label": "Michigan state project",
    "michigan_help": "Counts Michigan's standard overtime hours: over 8 a day, over 40 a week, Saturdays, Sundays and holidays.",
    "week_start_label": "Day 1 of the pay week is a",
    "holidays_label": "Holidays this week",
    "four_tens_label": "Four 10-hour days allowed",
    "file_label": "Payroll file, CSV",
    "file_help": "Your file stays on this computer.",
    "check_button": "Check my numbers",
    "sample_button": "Try the sample week",
    "sample_note": "Sample loaded. The names and rates are made up.",
    "clear_button": "Clear everything",
    "print_button": "Print",
    "copy_button": "Copy results",
    "copied": "Copied.",
    "results_heading": "Results",
    "rows_heading": "Rows",
    "col_row": "Row",
    "col_worker": "Worker",
    "col_trade": "Trade",
    "col_hours": "Hours",
    "col_ot": "Overtime",
    "col_result": "Result",
    "result_clear": "No flags",
    "result_flagged": "Flagged",
    "result_noted": "Note",
    "result_skipped": "Skipped",
    "result_bad": "Not read",
    "result_apprentice": "Ratio only",
    "need_file": "Pick a payroll file first, or try the sample week.",
    "reading": "Reading your file on this computer.",
    "file_chosen": "{name} is ready. Type the rates, then press Check my numbers.",
    "checking": "Checking.",
    "no_results_yet": "Results show up here.",
    "cleared": "Cleared. Nothing was saved.",
    "copy_failed": "Couldn't copy. Select the results and copy them by hand.",
    "day_label": "Day {n}",
    "remove_trade_aria": "Remove this trade",
    "ratio_help": "Apprentices for every journeyworker, from the apprenticeship program. Leave it blank if you have no apprentices."
  },
  "analytics": {
    "run_event": "checker-run",
    "sample_event": "checker-sample",
    "notify_event": "notify-click"
  },
  "banned": [
    "compliant",
    "dol-approved",
    "dol approved",
    "guarantee",
    "legal advice"
  ],
  "sample": {
    "csv": "worker,classification,day1,day2,day3,day4,day5,day6,day7,rate_paid,cash_fringe,plan_fringe,apprentice,ot_rate_paid\nAna R.,Carpenter,8,8,8,8,8,0,0,30.00,0.00,10.00,no,\nBen C.,Carpenter,10,10,10,10,4,0,0,30.00,10.00,0.00,no,45.00\nCal D.,Carpenter,9,9,9,9,9,0,0,30.00,0.00,10.00,no,30.00\nDee F.,Laborer,8,8,8,8,8,0,0,22.00,4.00,0.00,no,\nEli G.,Laborer,8,8,8,8,8,0,0,20.50,6.00,0.00,no,\nFay H.,Carpenter,8,8,8,8,8,0,0,18.00,0.00,5.00,yes,\nGus K.,Carpenter,8,8,8,0,0,0,0,18.00,0.00,5.00,yes,\nHal M.,Electrician,8,8,8,8,8,0,0,38.50,0.00,18.25,no,\nIvy N.,Laborer,8,8,eight,8,8,0,0,22.00,6.00,0.00,no,\n",
    "rates": [
      {
        "classification": "Carpenter",
        "base": "30.00",
        "fringe": "10.00",
        "ratio": "1:3"
      },
      {
        "classification": "Laborer",
        "base": "22.00",
        "fringe": "6.00",
        "ratio": ""
      }
    ],
    "options": {
      "michigan": false,
      "week_start": "monday",
      "holidays": [],
      "four_tens": false
    }
  }
});

  function text(value) { return value == null ? "" : String(value).trim(); }
  function key(value) { return text(value).toLowerCase().replace(/\s+/g, " "); }
  function roundDiv(n, d) { return Math.floor((2 * n + d) / (2 * d)); }

  function parseDecimal(value, money) {
    var s = text(value);
    if (!s) { return { value: null }; }
    if (money) { s = s.replace(/^\$/, "").replace(/[,\s]/g, ""); }
    else { s = s.replace(/\s/g, ""); }
    var kind = money ? "money" : "hours";
    if (s.charAt(0) === "-") { return { error: "negative-" + kind }; }
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)) { return { error: "bad-" + kind }; }
    var parts = s.split(".");
    var fraction = (parts[1] || "") + "000";
    var units = Number(parts[0] || "0") * 100 + Number(fraction.slice(0, 2));
    if (fraction.charAt(2) >= "5") { units += 1; }
    if (!Number.isSafeInteger(units)) { return { error: "bad-" + kind }; }
    if (!money && units > RULES.limits.max_hours_per_day * 100) { return { error: "too-many-hours" }; }
    return { value: units };
  }
  function parseMoney(value) { return parseDecimal(value, true); }
  function parseHours(value) { return parseDecimal(value, false); }
  function formatMoney(cents) {
    var whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "$" + whole + "." + String(cents % 100).padStart(2, "0");
  }
  function formatHours(hours) {
    return String(Math.floor(hours / 100)) + (hours % 100 ? "." + String(hours % 100).padStart(2, "0").replace(/0$/, "") : "");
  }
  function plural(n, name) { return n + " " + RULES.plurals[name][n === 1 ? 0 : 1]; }
  function pluralHours(hours) { return formatHours(hours) + " " + RULES.plurals.hour[hours === 100 ? 0 : 1]; }
  function joinList(values) {
    if (values.length < 2) { return values.join(""); }
    return values.slice(0, -1).join(", ") + " and " + values[values.length - 1];
  }
  function render(template, values) {
    return template.replace(/\{([a-z_]+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match;
    });
  }
  function shorten(value) {
    var limit = RULES.limits.max_value_chars_in_messages;
    return value.length > limit ? value.slice(0, limit) + "..." : value;
  }
  function messageValues(values) {
    var out = Object.assign({}, values);
    var money = {
      rateCents: "rate_paid", baseCents: "base", fringeCents: "fringe", totalPaidCents: "total_paid",
      totalDueCents: "total_due", creditCents: "credit", gapCents: "gap", amountCents: "week_amount",
      otPaidCents: "ot_paid", otRequiredCents: "ot_required", basisCents: "basis",
      basisIfSplitCents: "basis_if_split", extraCashCents: "extra_cash", dtRequiredCents: "dt_required"
    };
    Object.keys(money).forEach(function (name) {
      if (values[name] != null) { out[money[name]] = formatMoney(values[name]); }
    });
    if (values.otHours != null) { out.ot_hours_text = pluralHours(values.otHours); }
    if (values.dtHours != null) { out.dt_hours_text = pluralHours(values.dtHours); }
    if (values.hours != null) { out.hours_text = pluralHours(values.hours); }
    if (values.rows != null) { out.rows_text = plural(values.rows, "row"); }
    if (values.firstRow != null) { out.first_row = values.firstRow; }
    if (values.capHours != null) { out.cap = values.capHours; }
    if (values.columns) { out.columns = joinList(values.columns); }
    if (values.value != null) { out.value = shorten(values.value); }
    out.max_mb = RULES.limits.max_file_bytes / 1000000;
    return out;
  }
  function item(id, row, values, extra) {
    values = values || {};
    var rule = RULES.items[id];
    var amount = extra && extra.amountCents || 0;
    var params = messageValues(Object.assign({}, values, {
      row: row ? row.row : null, worker: row ? row.worker : null,
      classification: row ? row.classification : null, amountCents: amount
    }, extra && extra.params));
    if (rule.problems) { params.problem = render(rule.problems[values.problem], params); }
    var template = extra && extra.extraCash ? rule.message_extra_cash : rule.message;
    return {
      id: id, severity: rule.severity, row: row ? row.row : null,
      worker: row ? row.worker : null, classification: row ? row.classification : null,
      message: render(template, params), amountCents: amount,
      perHourCents: extra && extra.perHourCents != null ? extra.perHourCents : null, values: values
    };
  }

  function parseCsv(input) {
    var source = String(input == null ? "" : input);
    var result = { headers: [], columns: [], records: [], fileErrors: [], ignoredColumns: [] };
    function fail(problem, values) { result.fileErrors.push(item("file-error", null, Object.assign({ problem: problem }, values))); }
    if (source.length > RULES.limits.max_file_bytes) { fail("too-big"); return result; }
    source = source.replace(/^\uFEFF/, "");
    var records = [], fields = [], field = "", quoted = false, atStart = true;
    function endField() { fields.push(field.trim()); field = ""; atStart = true; }
    function endRecord() { endField(); records.push(fields); fields = []; }
    for (var i = 0; i < source.length; i += 1) {
      var ch = source.charAt(i);
      if (quoted) {
        if (ch === '"' && source.charAt(i + 1) === '"') { field += '"'; i += 1; }
        else if (ch === '"') { quoted = false; }
        else { field += ch; }
      } else if (ch === '"' && atStart) { quoted = true; atStart = false; }
      else if (ch === ",") { endField(); }
      else if (ch === "\n" || ch === "\r") {
        endRecord();
        if (ch === "\r" && source.charAt(i + 1) === "\n") { i += 1; }
      } else { field += ch; atStart = false; }
    }
    endRecord();
    var first = records.findIndex(function (r) { return r.some(function (v) { return v !== ""; }); });
    if (first < 0) { fail("empty"); return result; }
    result.headers = records[first];
    if (result.headers.length < 2) { fail("not-csv"); return result; }
    var aliases = new Map();
    Object.keys(RULES.columns.aliases).forEach(function (name) {
      RULES.columns.aliases[name].forEach(function (alias) { aliases.set(alias, name); });
    });
    var seen = new Map(), duplicates = [];
    result.columns = result.headers.map(function (header) {
      var name = aliases.get(header.toLowerCase().replace(/[^a-z0-9]/g, "")) || null;
      if (!name) { result.ignoredColumns.push(header); }
      else if (seen.has(name)) {
        if (duplicates.indexOf(seen.get(name)) < 0) { duplicates.push(seen.get(name)); }
        duplicates.push(header);
      } else { seen.set(name, header); }
      return name;
    });
    if (duplicates.length) { fail("duplicate-columns", { columns: duplicates }); }
    var missing = RULES.columns.required.filter(function (name) { return !seen.has(name); });
    if (missing.length) { fail("missing-columns", { columns: missing }); }
    records.slice(first + 1).forEach(function (fields, index) {
      if (fields.every(function (v) { return !v; })) { return; }
      result.records.push({ row: index + 2, fields: fields });
    });
    if (result.records.length > RULES.limits.max_rows) {
      fail("too-many-rows", { found: result.records.length, max: RULES.limits.max_rows });
    }
    if (!result.records.length) { fail("no-rows"); }
    return result;
  }

  function readRows(csv, ratesByTrade) {
    var seen = new Map();
    return csv.records.map(function (record) {
      var fields = record.fields, data = {};
      csv.columns.forEach(function (name, i) { if (name) { data[name] = fields[i] || ""; } });
      var row = { row: record.row, worker: data.worker || "", classification: data.classification || "",
        apprentice: false, days: [], hours: 0, straightHours: 0, overtimeHours: 0, doubleTimeHours: 0, status: "bad" };
      function bad(problem, values) { row.error = Object.assign({ problem: problem }, values); return row; }
      if (fields.length < csv.headers.length || fields.slice(csv.headers.length).some(function (v) { return v !== ""; })) {
        return bad("wrong-fields", { found: fields.length, expected: csv.headers.length });
      }
      if (!row.worker) { return bad("missing-worker"); }
      if (!row.classification) { return bad("missing-class"); }
      for (var day = 1; day <= 7; day += 1) {
        var column = "day" + day, hours = parseHours(data[column]);
        if (hours.error) { return bad(hours.error, { column: column, value: data[column] }); }
        row.days.push(hours.value || 0);
      }
      var names = ["rate_paid", "cash_fringe", "plan_fringe", "ot_rate_paid"];
      for (var i = 0; i < names.length; i += 1) {
        var name = names[i], money = parseMoney(data[name]);
        if (name === "rate_paid" && money.value === null) { return bad("missing-rate"); }
        if (money.error) { return bad(money.error, { column: name, value: data[name] }); }
        row[name] = money.value == null && name !== "ot_rate_paid" ? 0 : money.value;
      }
      var apprentice = key(data.apprentice);
      if (RULES.apprentice_values.yes.indexOf(apprentice) >= 0) { row.apprentice = true; }
      else if (RULES.apprentice_values.no.indexOf(apprentice) < 0) { return bad("bad-apprentice", { value: data.apprentice }); }
      row.hours = row.days.reduce(function (sum, h) { return sum + h; }, 0);
      var identity = JSON.stringify([key(row.worker), key(row.classification)]);
      if (seen.has(identity)) { return bad("duplicate", { firstRow: seen.get(identity) }); }
      if (row.hours > 0 && (!ratesByTrade || ratesByTrade.has(key(row.classification)))) { seen.set(identity, row.row); }
      row.status = "checked";
      return row;
    });
  }

  function parseRates(lines) {
    var rates = [], errors = [], seen = new Set(), filled = false;
    (lines || []).forEach(function (line, index) {
      var classification = text(line.classification), base = text(line.base), fringe = text(line.fringe), ratio = text(line.ratio);
      if (!classification && !base && !fringe && !ratio) { return; }
      filled = true;
      var before = errors.length;
      function fail(problem, values) {
        errors.push(item("form-error", null, Object.assign({ problem: problem }, values), { params: { classification: classification } }));
      }
      if (!classification) { fail("class-blank", { line: index + 1 }); }
      if (!base) { fail("base-missing", { classification: classification }); }
      var b = parseMoney(base), f = parseMoney(fringe);
      if (base && (b.error || b.value <= 0)) { fail("base-bad", { classification: classification }); }
      if (f.error) { fail("fringe-bad", { classification: classification }); }
      var match = ratio.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
      if (ratio && (!match || Number(match[2]) < 1 || !Number.isSafeInteger(Number(match[1])) || !Number.isSafeInteger(Number(match[2])))) {
        fail("ratio-bad", { classification: classification });
      }
      if (classification && seen.has(key(classification))) { fail("duplicate-class", { classification: classification }); }
      if (classification) { seen.add(key(classification)); }
      if (before === errors.length) {
        rates.push({ classification: classification, baseCents: b.value, fringeCents: f.value || 0,
          ratio: match ? Number(match[1]) + ":" + Number(match[2]) : null,
          apprentices: match ? Number(match[1]) : null, journeyworkers: match ? Number(match[2]) : null });
      }
    });
    if (!filled) { errors.push(item("form-error", null, { problem: "no-rates" })); }
    return { rates: rates, errors: errors };
  }
  function optionsWithDefaults(options) {
    return Object.assign({ michigan: false, week_start: "monday", holidays: [], four_tens: false }, options);
  }
  function michiganHours(hours, options) {
    options = optionsWithDefaults(options);
    var dt = 0, ot = 0, candidates = 0;
    var cap = (options.four_tens ? RULES.limits.michigan.daily_cap_hours_four_tens : RULES.limits.michigan.daily_cap_hours) * 100;
    var start = RULES.weekdays.indexOf(options.week_start);
    hours.forEach(function (h, i) {
      var weekday = RULES.weekdays[(start + i) % 7];
      if (options.holidays.indexOf(i + 1) >= 0 || weekday === "sunday") { dt += h; }
      else if (weekday === "saturday") { ot += h; }
      else { ot += Math.max(0, h - cap); candidates += Math.min(h, cap); }
    });
    var weekly = Math.max(0, candidates - RULES.limits.weekly_overtime_after_hours * 100);
    return { st: candidates - weekly, ot: ot + weekly, dt: dt };
  }
  function splitHours(days, options) {
    if (options.michigan) { return michiganHours(days, options); }
    var hours = days.reduce(function (sum, h) { return sum + h; }, 0);
    var cap = RULES.limits.weekly_overtime_after_hours * 100;
    return { st: Math.min(hours, cap), ot: Math.max(0, hours - cap), dt: 0 };
  }
  function classificationsInFile(csvText) {
    var csv = parseCsv(csvText);
    if (csv.fileErrors.length) { return []; }
    var seen = new Set(), names = [];
    readRows(csv).forEach(function (row) {
      var name = key(row.classification);
      if (!row.error && row.hours > 0 && !seen.has(name)) { seen.add(name); names.push(row.classification); }
    });
    return names;
  }

  function finish(ok, items, rows, counts) {
    var noteOrder = ["mi-mode", "ignored-columns", "wage-covers-fringe", "pay-covered-by-plan", "ot-unchecked",
      "ot-basis-full-rate", "mi-double-time", "apprentice-not-checked", "no-hours", "ot-multi-row", "ratio-missing"];
    var levels = { flag: 0, fix: 1, note: 2 };
    items.sort(function (a, b) {
      var severity = levels[a.severity] - levels[b.severity];
      if (severity) { return severity; }
      if (a.severity === "note") {
        function group(x) { return x.id === "mi-mode" ? 0 : x.id === "ignored-columns" ? 1 : x.id === "ratio-missing" ? 3 : 2; }
        var groups = group(a) - group(b);
        if (groups) { return groups; }
        if (group(a) !== 2) { return 0; }
      }
      var ar = a.row == null ? (a.severity === "fix" ? -1 : Infinity) : a.row;
      var br = b.row == null ? (b.severity === "fix" ? -1 : Infinity) : b.row;
      if (ar !== br) { return ar - br; }
      return a.severity === "note" ? noteOrder.indexOf(a.id) - noteOrder.indexOf(b.id) : 0;
    });
    var summary = Object.assign({ ok: ok, rowsRead: 0, rowsChecked: 0, rowsSkipped: 0, rowsBad: 0,
      flags: 0, fixes: 0, notes: 0, totalCents: 0, lines: [] }, counts);
    items.forEach(function (entry) {
      summary[entry.severity === "flag" ? "flags" : entry.severity === "fix" ? "fixes" : "notes"] += 1;
      if (entry.severity === "flag") { summary.totalCents += entry.amountCents; }
    });
    if (!ok) { summary.lines.push(RULES.summary.stopped); }
    else {
      summary.lines.push(render(RULES.summary.counts, { rows_read_text: plural(summary.rowsRead, "row"), checked: summary.rowsChecked,
        skipped: summary.rowsSkipped, bad: summary.rowsBad }));
      summary.lines.push(render(RULES.summary.tally, { flags_text: plural(summary.flags, "flag"), fixes_text: plural(summary.fixes, "fix"), notes_text: plural(summary.notes, "note") }));
      if (summary.totalCents > 0) { summary.lines.push(render(RULES.summary.total, { total: formatMoney(summary.totalCents) })); }
      if (!summary.flags && !summary.fixes) { summary.lines.push(RULES.summary.none); }
    }
    return { ok: ok, summary: summary, items: items, rows: rows.map(function (row) {
      return { row: row.row, worker: row.worker, classification: row.classification, apprentice: row.apprentice,
        hours: row.hours, straightHours: row.straightHours, overtimeHours: row.overtimeHours,
        doubleTimeHours: row.doubleTimeHours, status: row.status };
    }) };
  }

  function check(input) {
    var csv = parseCsv(input.csvText), parsedRates = parseRates(input.rates), options = optionsWithDefaults(input.options);
    var items = csv.fileErrors.concat(parsedRates.errors);
    if (options.michigan) {
      if (RULES.weekdays.indexOf(options.week_start) < 0) { items.push(item("form-error", null, { problem: "week-start-bad" })); }
      if (!Array.isArray(options.holidays) || options.holidays.some(function (day) { return !Number.isInteger(day) || day < 1 || day > 7; })) {
        items.push(item("form-error", null, { problem: "holiday-bad" }));
      }
    }
    if (items.length) { return finish(false, items, [], { rowsRead: csv.records.length }); }
    if (options.michigan) { items.push(item("mi-mode", null, { capHours: options.four_tens ? 10 : 8 })); }
    if (csv.ignoredColumns.length) { items.push(item("ignored-columns", null, { columns: csv.ignoredColumns })); }
    var byTrade = new Map(), byWorker = new Map(), good = [];
    parsedRates.rates.forEach(function (rate) { byTrade.set(key(rate.classification), rate); });
    var rows = readRows(csv, byTrade);
    var counts = { rowsRead: rows.length, rowsBad: 0, rowsSkipped: 0, rowsChecked: 0 };
    rows.forEach(function (row) {
      if (row.error) { counts.rowsBad += 1; items.push(item("bad-row", row, row.error)); return; }
      if (!row.hours) { counts.rowsSkipped += 1; row.status = "skipped"; items.push(item("no-hours", row)); return; }
      row.rate = byTrade.get(key(row.classification));
      if (!row.rate) { counts.rowsSkipped += 1; row.status = "skipped"; items.push(item("class-missing", row)); return; }
      good.push(row); counts.rowsChecked += 1;
      var worker = key(row.worker);
      if (!byWorker.has(worker)) { byWorker.set(worker, []); }
      byWorker.get(worker).push(row);
    });
    good.forEach(function (row) {
      if (row.apprentice) { row.status = "apprentice"; items.push(item("apprentice-not-checked", row)); return; }
      var workerRows = byWorker.get(key(row.worker));
      var multi = workerRows.length > 1;
      var split = multi ? { st: row.hours, ot: 0, dt: 0 } : splitHours(row.days, options);
      row.straightHours = split.st; row.overtimeHours = split.ot; row.doubleTimeHours = split.dt;
      var B = row.rate.baseCents, F = row.rate.fringeCents, R = row.rate_paid, C = row.cash_fringe, P = row.plan_fringe;
      var total = R + C + P, gap = Math.max(0, B + F - total);
      var gapFringe = Math.max(0, F - Math.max(0, R - B) - C - P);
      var credit = Math.min(R - B, F - C - P);
      var tol = RULES.limits.tolerance_cents_per_hour;
      if (gap >= tol) {
        items.push(item(R < B ? "pay-short" : "fringe-short", row, {
          rateCents: R, baseCents: B, fringeCents: F, totalPaidCents: total, totalDueCents: B + F,
          creditCents: Math.max(0, R - B) + C + P, gapCents: gap, straightHours: split.st, premiumHours: split.ot + split.dt
        }, { amountCents: roundDiv(gap * split.st + gapFringe * (split.ot + split.dt), 100), perHourCents: gap }));
      }
      if (R > B && C + P < F) {
        items.push(item("wage-covers-fringe", row, { creditCents: credit }, { params: { rateCents: R } }));
      }
      if (R < B && gap < tol) {
        items.push(item("pay-covered-by-plan", row, { totalPaidCents: total, totalDueCents: B + F }, { params: { rateCents: R, baseCents: B } }));
      }
      if (split.ot > 0) {
        var extraCash = C - Math.min(C, Math.max(0, F - P));
        var basis = Math.max(B, R + extraCash), req2 = 3 * basis - 2 * extraCash;
        var required = roundDiv(req2, 2), O = row.ot_rate_paid;
        if (O === null) { items.push(item("ot-unchecked", row, { otHours: split.ot, otRequiredCents: required, basisCents: basis })); }
        else if (req2 - 2 * O >= 2 * tol) {
          var gap2 = req2 - 2 * O;
          items.push(item("ot-short", row, { otHours: split.ot, otPaidCents: O, otRequiredCents: required,
            basisCents: basis, extraCashCents: extraCash, gapHalfCents: gap2 }, {
            amountCents: roundDiv(gap2 * split.ot, 200), perHourCents: roundDiv(gap2, 2), extraCash: extraCash > 0,
            params: { gapCents: roundDiv(gap2, 2) }
          }));
        }
        if (R > B && C + P < F) {
          items.push(item("ot-basis-full-rate", row, { creditCents: credit, basisIfSplitCents: R - credit }, { params: { rateCents: R } }));
        }
      }
      if (options.michigan && split.dt > 0) {
        items.push(item("mi-double-time", row, { dtHours: split.dt, dtRequiredCents: 2 * B }));
      }
    });
    byWorker.forEach(function (workerRows) {
      if (workerRows.length < 2) { return; }
      var days = [0, 0, 0, 0, 0, 0, 0], hours = 0;
      workerRows.forEach(function (row) { hours += row.hours; row.days.forEach(function (h, i) { days[i] += h; }); });
      var split = splitHours(days, options);
      if (split.ot + split.dt > 0) {
        items.push(item("ot-multi-row", workerRows[0], { rows: workerRows.length, hours: hours, otHours: split.ot + split.dt }));
      }
    });
    parsedRates.rates.forEach(function (rate) {
      var tradeRows = good.filter(function (row) { return key(row.classification) === key(rate.classification); });
      if (!tradeRows.some(function (row) { return row.apprentice; })) { return; }
      var classRow = { row: null, worker: null, classification: rate.classification };
      if (rate.ratio === null) { items.push(item("ratio-missing", classRow)); return; }
      var days = [];
      for (var day = 1; day <= 7; day += 1) {
        var a = 0, j = 0;
        tradeRows.forEach(function (row) { if (row.days[day - 1]) { if (row.apprentice) { a += 1; } else { j += 1; } } });
        var allowed = Math.floor(j * rate.apprentices / rate.journeyworkers);
        if (a > allowed) { days.push({ day: day, apprentices: a, journeyworkers: j, allowed: allowed }); }
      }
      if (days.length) {
        var details = days.map(function (d) {
          return render(RULES.items["ratio-over"].detail, { day: d.day, apprentices_text: plural(d.apprentices, "apprentice"),
            journeyworkers_text: plural(d.journeyworkers, "journeyworker"), allowed: d.allowed });
        }).join(" ");
        items.push(item("ratio-over", classRow, { ratio: rate.ratio, days: days }, { params: {
          days: joinList(days.map(function (d) { return render(RULES.ui.day_label, { n: d.day }).toLowerCase(); })),
          details: details, baseCents: rate.baseCents, fringeCents: rate.fringeCents
        } }));
      }
    });
    good.forEach(function (row) {
      if (row.apprentice) { return; }
      var own = items.filter(function (entry) { return entry.row === row.row; });
      row.status = own.some(function (entry) { return entry.severity === "flag"; }) ? "flagged" : own.length ? "noted" : "checked";
    });
    return finish(true, items, rows, counts);
  }

  function track(result, win, isSample) {
    if (!result.ok || result.summary.rowsRead <= 0 || !win || typeof win.plausible !== "function") { return false; }
    win.plausible(isSample ? RULES.analytics.sample_event : RULES.analytics.run_event);
    return true;
  }

  function mount(el) {
    var doc = el.ownerDocument, win = doc.defaultView, ui = RULES.ui;
    var csvText = null, isSample = false, reader = null, readVersion = 0, rateLines = [];
    el.replaceChildren();
    function node(tag, className, content, parent) {
      var element = doc.createElement(tag);
      if (className) { element.className = className; }
      if (content != null) { element.textContent = content; }
      if (parent) { parent.appendChild(element); }
      return element;
    }
    function button(label, parent, action) {
      var b = node("button", "cp-button", label, parent);
      b.type = "button"; b.addEventListener("click", action); return b;
    }
    function labelInput(label, type, parent) {
      var wrap = node("label", type === "checkbox" ? "cp-toggle" : "cp-field", null, parent);
      var input;
      if (type === "checkbox") {
        input = node("input", "cp-input", null, wrap); input.type = type;
        node("span", "cp-label", label, wrap);
      } else {
        node("span", "cp-label", label, wrap);
        input = node("input", "cp-input", null, wrap); input.type = type;
      }
      return input;
    }
    var form = node("form", "cp-form", null, el);
    form.addEventListener("submit", function (event) { event.preventDefault(); run(); });
    node("h3", "cp-heading", ui.rates_heading, form);
    node("p", "cp-help", ui.rates_help, form);
    var rateTable = node("div", "cp-rates", null, form);
    var ratioHelp = node("p", "cp-help", ui.ratio_help, form);
    ratioHelp.id = "cp-ratio-help";
    function addRate(values) {
      values = values || {};
      var line = node("div", "cp-rate", null, rateTable), inputs = {};
      ["classification", "base", "fringe", "ratio"].forEach(function (name) {
        var input = labelInput(ui["col_" + name], "text", line);
        input.value = values[name] || "";
        if (name === "base" || name === "fringe") { input.inputMode = "decimal"; }
        if (name === "ratio") { input.placeholder = ui.ratio_placeholder; input.setAttribute("aria-describedby", ratioHelp.id); }
        inputs[name] = input;
      });
      var entry = { element: line, inputs: inputs };
      var remove = button(ui.remove_trade, line, function () {
        var index = rateLines.indexOf(entry);
        rateLines.splice(index, 1); line.remove();
        if (!rateLines.length) { addRate(); }
        rateLines[Math.min(index, rateLines.length - 1)].inputs.classification.focus();
      });
      remove.setAttribute("aria-label", ui.remove_trade_aria);
      rateLines.push(entry);
      return entry;
    }
    addRate();
    button(ui.add_trade, form, function () { addRate().inputs.classification.focus(); });
    var michigan = labelInput(ui.michigan_label, "checkbox", form);
    node("p", "cp-help", ui.michigan_help, form);
    var miOptions = node("div", "cp-mi-options", null, form);
    miOptions.hidden = true;
    michigan.addEventListener("change", function () { miOptions.hidden = !michigan.checked; });
    var weekLabel = node("label", "cp-field", null, miOptions);
    node("span", "cp-label", ui.week_start_label, weekLabel);
    var weekStart = node("select", "cp-input", null, weekLabel);
    RULES.weekdays.forEach(function (day) { var option = node("option", "", RULES.weekday_labels[day], weekStart); option.value = day; });
    weekStart.value = "monday";
    var holidayGroup = node("fieldset", "cp-holidays", null, miOptions);
    node("legend", "cp-label", ui.holidays_label, holidayGroup);
    var holidays = [];
    for (var day = 1; day <= 7; day += 1) { holidays.push(labelInput(render(ui.day_label, { n: day }), "checkbox", holidayGroup)); }
    var fourTens = labelInput(ui.four_tens_label, "checkbox", miOptions);
    var fileInput = labelInput(ui.file_label, "file", form);
    fileInput.accept = ".csv,text/csv";
    node("p", "cp-help", ui.file_help, form);
    var fileStatus = node("p", "cp-status", "", form);
    fileStatus.setAttribute("role", "status");
    var tradeStatus = node("p", "cp-status", "", form);
    tradeStatus.setAttribute("role", "status");
    var actions = node("div", "cp-actions", null, form);
    button(ui.check_button, actions, run);
    button(ui.sample_button, actions, function () {
      cancelRead(); csvText = RULES.sample.csv; isSample = true; fileInput.value = "";
      resetRates(RULES.sample.rates); setOptions(RULES.sample.options);
      fileStatus.textContent = ui.sample_note; tradeStatus.textContent = ""; run();
    });
    button(ui.clear_button, actions, function () {
      cancelRead(); csvText = null; isSample = false; form.reset(); fileInput.value = "";
      resetRates([{}]); setOptions({}); fileStatus.textContent = ui.cleared; tradeStatus.textContent = "";
      results.replaceChildren(); node("p", "cp-help", ui.no_results_yet, results);
      rateLines[0].inputs.classification.focus();
    });
    var results = node("section", "cp-results", null, el);
    results.setAttribute("aria-live", "polite");
    results.setAttribute("role", "region");
    results.setAttribute("aria-label", ui.results_heading);
    node("p", "cp-help", ui.no_results_yet, results);
    function cancelRead() {
      readVersion += 1;
      if (reader && reader.readyState === 1) { reader.abort(); }
      reader = null;
    }
    function resetRates(lines) {
      rateTable.replaceChildren(); rateLines = []; lines.forEach(addRate);
    }
    function setOptions(options) {
      options = optionsWithDefaults(options);
      michigan.checked = options.michigan; miOptions.hidden = !options.michigan;
      weekStart.value = options.week_start; fourTens.checked = options.four_tens;
      holidays.forEach(function (input, i) { input.checked = options.holidays.indexOf(i + 1) >= 0; });
    }
    function readRates() {
      return rateLines.map(function (entry) {
        var line = {}; Object.keys(entry.inputs).forEach(function (name) { line[name] = entry.inputs[name].value; }); return line;
      });
    }
    function readOptions() {
      return { michigan: michigan.checked, week_start: weekStart.value, four_tens: fourTens.checked,
        holidays: holidays.map(function (input, i) { return input.checked ? i + 1 : null; }).filter(function (day) { return day != null; }) };
    }
    function fileFailure(problem) {
      fileStatus.textContent = "";
      show(finish(false, [item("file-error", null, { problem: problem })], [], {}), false);
    }
    fileInput.addEventListener("change", function () {
      cancelRead(); csvText = null; isSample = false; tradeStatus.textContent = "";
      results.replaceChildren(); node("p", "cp-help", ui.no_results_yet, results);
      var file = fileInput.files && fileInput.files[0];
      if (!file) { fileStatus.textContent = ""; return; }
      if (file.size > RULES.limits.max_file_bytes) { fileFailure("too-big"); return; }
      fileStatus.textContent = ui.reading;
      var version = readVersion;
      reader = new win.FileReader();
      reader.onload = function () {
        if (version !== readVersion) { return; }
        csvText = String(reader.result); reader = null;
        fileStatus.textContent = render(ui.file_chosen, { name: file.name });
        var known = new Set(readRates().map(function (line) { return key(line.classification); }));
        var added = [];
        classificationsInFile(csvText).forEach(function (classification) {
          if (known.has(key(classification))) { return; }
          var blank = rateLines.find(function (entry) {
            return Object.keys(entry.inputs).every(function (name) { return !text(entry.inputs[name].value); });
          });
          if (blank) { blank.inputs.classification.value = classification; }
          else { addRate({ classification: classification }); }
          known.add(key(classification)); added.push(classification);
        });
        if (added.length) { tradeStatus.textContent = render(ui.found_trades, { classifications: joinList(added) }); }
      };
      reader.onerror = function () { if (version === readVersion) { reader = null; fileFailure("unreadable"); } };
      try { reader.readAsText(file); } catch (error) { reader = null; fileFailure("unreadable"); }
    });
    function run() {
      if (csvText === null) { fileStatus.textContent = reader ? ui.reading : ui.need_file; return; }
      show(check({ csvText: csvText, rates: readRates(), options: readOptions() }), isSample);
    }
    function show(result, sample) {
      results.replaceChildren();
      var heading = node("h3", "cp-heading", ui.results_heading, results);
      heading.tabIndex = -1;
      result.summary.lines.forEach(function (line) { node("p", "cp-summary", line, results); });
      var copyLines = result.summary.lines.slice();
      ["flag", "fix", "note"].forEach(function (severity) {
        var entries = result.items.filter(function (entry) { return entry.severity === severity; });
        if (!entries.length) { return; }
        var section = node("section", "cp-section cp-" + severity, null, results);
        node("h4", "cp-heading", RULES.severities[severity].heading, section);
        node("p", "cp-about", RULES.severities[severity].about, section);
        copyLines.push("", RULES.severities[severity].heading);
        entries.forEach(function (entry) {
          var block = node("div", "cp-item", null, section);
          node("h5", "cp-title", RULES.items[entry.id].title, block);
          node("p", "cp-message", entry.message, block);
          copyLines.push("- " + entry.message);
        });
      });
      if (result.rows.length) {
        node("h4", "cp-heading", ui.rows_heading, results);
        var scroll = node("div", "cp-table-wrap", null, results);
        scroll.tabIndex = 0; scroll.setAttribute("role", "region"); scroll.setAttribute("aria-label", ui.rows_heading);
        var table = node("table", "cp-table", null, scroll), thead = node("thead", "", null, table);
        var headers = node("tr", "", null, thead);
        ["row", "worker", "trade", "hours", "ot", "result"].forEach(function (name) {
          node("th", "", ui["col_" + name], headers).scope = "col";
        });
        var body = node("tbody", "", null, table);
        var statusKeys = { checked: "clear", flagged: "flagged", noted: "noted", skipped: "skipped", bad: "bad", apprentice: "apprentice" };
        result.rows.forEach(function (row) {
          var tr = node("tr", "", null, body);
          [row.row, row.worker, row.classification, formatHours(row.hours), formatHours(row.overtimeHours), ui["result_" + statusKeys[row.status]]].forEach(function (value) {
            node("td", "", value, tr);
          });
        });
      }
      var tools = node("div", "cp-actions", null, results);
      button(ui.print_button, tools, function () { win.print(); });
      var copyStatus = node("p", "cp-status", "", results);
      copyStatus.setAttribute("role", "status");
      button(ui.copy_button, tools, function () {
        try {
          win.navigator.clipboard.writeText(copyLines.join("\n")).then(function () {
            copyStatus.textContent = ui.copied;
          }, function () { copyStatus.textContent = ui.copy_failed; });
        } catch (error) { copyStatus.textContent = ui.copy_failed; }
      });
      heading.focus();
      track(result, win, sample);
    }
  }

  return { RULES: RULES, parseMoney: parseMoney, parseHours: parseHours, parseCsv: parseCsv, parseRates: parseRates,
    michiganHours: michiganHours, classificationsInFile: classificationsInFile, check: check, track: track,
    formatMoney: formatMoney, formatHours: formatHours, roundDiv: roundDiv, render: render, plural: plural,
    pluralHours: pluralHours, joinList: joinList, mount: mount };
});
