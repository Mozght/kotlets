(function () {
  "use strict";
  var C = window.KotletsCalc;
  if (!C) return;

  /* Nav */
  var btn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  function el(id) { return document.getElementById(id); }
  function num(id) {
    var n = el(id) ? Number(el(id).value) : 0;
    return isFinite(n) ? n : 0;
  }
  function val(id) { return el(id) ? el(id).value : ""; }
  function money(n, cur) { return C.formatMoney(n, cur); }

  function bind(form, render) {
    if (!form) return;
    var run = function () { render(); };
    form.addEventListener("input", run);
    form.addEventListener("change", run);
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
    render();
  }

  /* ---- Trip budget ---- */
  var tripForm = el("trip-form");
  if (tripForm) {
    var nightsIn = el("nights");
    var daysIn = el("days");
    var daysTouched = false;
    if (daysIn) {
      daysIn.addEventListener("input", function () { daysTouched = true; });
    }
    if (nightsIn && daysIn) {
      nightsIn.addEventListener("input", function () {
        if (!daysTouched) daysIn.value = String(Math.max(0, Math.floor(Number(nightsIn.value) || 0) + 1));
      });
    }
    bind(tripForm, function () {
      var r = C.tripBudget({
        travelers: num("travelers"),
        nights: num("nights"),
        days: num("days"),
        currency: val("currency"),
        lodging: num("lodging"),
        lodgingMode: val("lodgingMode"),
        transport: num("transport"),
        transportMode: val("transportMode"),
        food: num("food"),
        foodMode: val("foodMode"),
        activities: num("activities"),
        activitiesMode: val("activitiesMode"),
        other: num("other"),
        otherMode: val("otherMode"),
        bufferPct: num("bufferPct")
      });
      var cur = r.currency;
      var rows = [
        ["Lodging", r.parts.lodging],
        ["Transport", r.parts.transport],
        ["Food", r.parts.food],
        ["Activities", r.parts.activities],
        ["Other", r.parts.other],
        ["Buffer (" + num("bufferPct") + "%)", r.parts.buffer]
      ];
      el("trip-results").innerHTML =
        "<h2>Your trip estimate</h2>" +
        "<p class='big'>" + money(r.total, cur) + "</p>" +
        "<p>" + money(r.perPerson, cur) + " per person" +
        (r.perNight != null ? " · " + money(r.perNight, cur) + " per night" : "") +
        (r.perDay != null ? " · " + money(r.perDay, cur) + " per day" : "") +
        "</p>" +
        "<table><caption class='visually-hidden'>Cost breakdown</caption><tbody>" +
        rows.map(function (row) {
          return "<tr><th scope='row'>" + row[0] + "</th><td>" + money(row[1], cur) + "</td></tr>";
        }).join("") +
        "<tr><th scope='row'>Total</th><td>" + money(r.total, cur) + "</td></tr>" +
        "</tbody></table>" +
        "<p>For " + r.people + " traveller" + (r.people === 1 ? "" : "s") +
        ", " + r.nights + " night" + (r.nights === 1 ? "" : "s") +
        " and " + r.days + " day" + (r.days === 1 ? "" : "s") +
        ". Figures are rounded to the nearest cent.</p>";
    });
  }

  /* ---- Ski trip ---- */
  var skiForm = el("ski-form");
  if (skiForm) {
    var sn = el("ski-nights");
    var sd = el("ski-days-cal");
    var daysTouchedS = false;
    if (sd) sd.addEventListener("input", function () { daysTouchedS = true; });
    if (sn && sd) {
      sn.addEventListener("input", function () {
        if (!daysTouchedS) sd.value = String(Math.max(0, Math.floor(Number(sn.value) || 0) + 1));
      });
    }
    bind(skiForm, function () {
      var r = C.skiTrip({
        people: num("ski-people"),
        skiDays: num("ski-days"),
        nights: num("ski-nights"),
        days: num("ski-days-cal"),
        currency: val("ski-currency"),
        lift: num("lift"),
        liftMode: val("liftMode"),
        rentals: num("rentals"),
        rentalsMode: val("rentalsMode"),
        lessons: num("lessons"),
        lessonsMode: val("lessonsMode"),
        lodging: num("ski-lodging"),
        lodgingMode: val("ski-lodgingMode"),
        food: num("ski-food"),
        foodMode: val("ski-foodMode"),
        transport: num("ski-transport"),
        transportMode: val("ski-transportMode"),
        other: num("ski-other"),
        otherMode: val("ski-otherMode"),
        bufferPct: num("ski-buffer")
      });
      var cur = r.currency;
      var rows = [
        ["Lift passes", r.parts.lift],
        ["Rentals", r.parts.rentals],
        ["Lessons", r.parts.lessons],
        ["Lodging", r.parts.lodging],
        ["Food", r.parts.food],
        ["Transport", r.parts.transport],
        ["Other / insurance", r.parts.other],
        ["Buffer (" + num("ski-buffer") + "%)", r.parts.buffer]
      ];
      el("ski-results").innerHTML =
        "<h2>Your ski trip estimate</h2>" +
        "<p class='big'>" + money(r.total, cur) + "</p>" +
        "<p>" + money(r.perPerson, cur) + " per person" +
        (r.perSkiDay != null ? " · " + money(r.perSkiDay, cur) + " per ski day (group)" : "") +
        "</p>" +
        "<table><caption class='visually-hidden'>Ski cost breakdown</caption><tbody>" +
        rows.map(function (row) {
          return "<tr><th scope='row'>" + row[0] + "</th><td>" + money(row[1], cur) + "</td></tr>";
        }).join("") +
        "<tr><th scope='row'>Total</th><td>" + money(r.total, cur) + "</td></tr>" +
        "</tbody></table>" +
        "<p>" + r.people + " people, " + r.skiDays + " ski day" + (r.skiDays === 1 ? "" : "s") +
        ", " + r.nights + " night" + (r.nights === 1 ? "" : "s") +
        ". Lift and rental “per day” rates use ski days, not nights.</p>";
    });
  }

  /* ---- Savings ---- */
  var savForm = el("savings-form");
  if (savForm) {
    if (el("save-from") && !el("save-from").value) {
      var t = new Date();
      el("save-from").value = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    }
    bind(savForm, function () {
      var r = C.vacationSavings({
        target: num("save-target"),
        saved: num("save-saved"),
        from: val("save-from"),
        to: val("save-to"),
        monthly: val("save-monthly") === "" ? null : num("save-monthly"),
        currency: val("save-currency")
      });
      var box = el("savings-results");
      if (r.error) {
        box.innerHTML = "<h2>Vacation savings plan</h2><p>Enter a real start date and a target date (use YYYY-MM-DD). The 31st of April, for example, is not a valid date.</p>";
        return;
      }
      var cur = r.currency;
      var html = "<h2>Vacation savings plan</h2>";
      if (r.alreadyThere) {
        html += "<p class='big'>You’re there</p><p>The " + money(r.target, cur) + " target is already covered.</p>";
      } else if (r.dueNow) {
        html += "<p class='big'>" + money(r.remaining, cur) + "</p><p>The target date is today or in the past. You would need the remaining " + money(r.remaining, cur) + " now.</p>";
      } else {
        html += "<p class='big'>" + money(r.perMonth, cur) + " <span class='gold'>/ month</span></p>" +
          "<p>" + money(r.perWeek, cur) + " per week to reach " + money(r.target, cur) +
          " by " + r.to + ".</p>" +
          "<table><tbody>" +
          "<tr><th scope='row'>Still to save</th><td>" + money(r.remaining, cur) + "</td></tr>" +
          "<tr><th scope='row'>Time left</th><td>" + r.days + " days · " + r.months + " months · " + r.weeks + " weeks</td></tr>" +
          "<tr><th scope='row'>Already saved</th><td>" + money(r.saved, cur) + "</td></tr>" +
          "</tbody></table>" +
          "<p>Months use the average calendar month (365.25 ÷ 12 = 30.4375 days), so a full year is exactly 12 months. Monthly and weekly amounts are rounded to the nearest cent.</p>";
      }
      if (r.monthlyPlan != null && !r.alreadyThere) {
        if (r.monthlyPlan === 0) {
          html += "<p>A monthly transfer of zero never reaches the target.</p>";
        } else if (r.projectedDate) {
          html += "<p>At " + money(r.monthlyPlan, cur) + " a month you would hit the target around <strong>" + r.projectedDate + "</strong>. ";
          html += r.onTrack
            ? "That is on track for your deadline.</p>"
            : "That is after the deadline — you would still be about " + money(r.shortfall, cur) + " short on " + r.to + ".</p>";
        }
      }
      box.innerHTML = html;
    });
  }

  /* ---- Group split ---- */
  var splitRoot = el("split-app");
  if (splitRoot) {
    var state = {
      currency: "EUR",
      people: [
        { id: "p1", name: "Alex" },
        { id: "p2", name: "Kasia" },
        { id: "p3", name: "Marek" }
      ],
      nextId: 4,
      expenses: [
        { id: "e1", desc: "Apartment deposit", amount: 900, paidBy: "p1", splitAmong: ["p1", "p2", "p3"] },
        { id: "e2", desc: "Train tickets", amount: 210, paidBy: "p2", splitAmong: ["p1", "p2", "p3"] },
        { id: "e3", desc: "Dinner (Alex & Kasia)", amount: 64, paidBy: "p1", splitAmong: ["p1", "p2"] }
      ],
      nextExp: 4
    };

    function uid(prefix, n) { return prefix + n; }

    function renderSplit() {
      var people = state.people;
      var peopleFields = people.map(function (p, i) {
        return "<div class='row-card'><label for='name-" + p.id + "'>Person " + (i + 1) + "</label>" +
          "<input type='text' id='name-" + p.id + "' data-pid='" + p.id + "' value='" + escapeHtml(p.name) + "' autocomplete='name'>" +
          (people.length > 2 ? "<button type='button' class='btn btn-ghost del' data-del-person='" + p.id + "'>Remove</button>" : "") +
          "</div>";
      }).join("");

      var expFields = state.expenses.map(function (e) {
        var opts = people.map(function (p) {
          return "<option value='" + p.id + "'" + (e.paidBy === p.id ? " selected" : "") + ">" + escapeHtml(p.name) + "</option>";
        }).join("");
        var checks = people.map(function (p) {
          var on = !e.splitAmong || e.splitAmong.indexOf(p.id) !== -1;
          return "<label><input type='checkbox' data-split='" + e.id + "' value='" + p.id + "'" + (on ? " checked" : "") + "> " + escapeHtml(p.name) + "</label>";
        }).join("");
        return "<div class='row-card' data-eid='" + e.id + "'>" +
          "<div class='field-row two'>" +
          "<div class='field'><label for='desc-" + e.id + "'>What for</label>" +
          "<input type='text' id='desc-" + e.id + "' data-edesc='" + e.id + "' value='" + escapeHtml(e.desc) + "'></div>" +
          "<div class='field'><label for='amt-" + e.id + "'>Amount</label>" +
          "<input type='number' id='amt-" + e.id + "' data-eamt='" + e.id + "' min='0' step='0.01' value='" + e.amount + "'></div>" +
          "</div>" +
          "<div class='field'><label for='paid-" + e.id + "'>Paid by</label>" +
          "<select id='paid-" + e.id + "' data-epaid='" + e.id + "'>" + opts + "</select></div>" +
          "<fieldset><legend>Split equally among</legend><div class='checks'>" + checks + "</div></fieldset>" +
          "<button type='button' class='btn btn-ghost del' data-del-exp='" + e.id + "'>Remove expense</button>" +
          "</div>";
      }).join("");

      var result = C.groupSplit(people, state.expenses.map(function (e) {
        return { amount: e.amount, paidBy: e.paidBy, splitAmong: e.splitAmong };
      }));
      var cur = state.currency;
      var body = result.people.map(function (p) {
        var note = p.net > 0 ? "is owed " + money(p.net, cur) : p.net < 0 ? "owes " + money(-p.net, cur) : "is settled";
        return "<tr><th scope='row'>" + escapeHtml(p.name) + "</th><td>" + money(p.paid, cur) + "</td><td>" + money(p.share, cur) + "</td><td>" + note + "</td></tr>";
      }).join("");
      var transfers = result.transfers.length
        ? "<ul class='settle'>" + result.transfers.map(function (t) {
          return "<li><strong>" + escapeHtml(t.fromName) + "</strong> pays <strong>" + escapeHtml(t.toName) + "</strong> " + money(t.amount, cur) + "</li>";
        }).join("") + "</ul>"
        : "<p>Everyone is settled — no payments needed.</p>";

      splitRoot.innerHTML =
        "<div class='calc-layout'>" +
        "<form class='panel' id='split-form'>" +
        "<h2>People and expenses</h2>" +
        "<div class='field'><label for='split-currency'>Currency</label>" +
        "<select id='split-currency'>" + currencyOptions(state.currency) + "</select>" +
        "<p class='hint'>There is no live exchange rate. Enter every amount in the same currency.</p></div>" +
        "<h3>Who is on the trip</h3>" +
        "<div class='stack' id='people-list'>" + peopleFields + "</div>" +
        "<p><button type='button' class='btn btn-ghost' id='add-person'>Add a person</button></p>" +
        "<h3>Who paid what</h3>" +
        "<div class='stack' id='exp-list'>" + expFields + "</div>" +
        "<p><button type='button' class='btn btn-ghost' id='add-exp'>Add an expense</button></p>" +
        "</form>" +
        "<div class='results' id='split-results' aria-live='polite'>" +
        "<h2>Who owes whom</h2>" + transfers +
        "<table><caption class='visually-hidden'>Balances</caption>" +
        "<thead><tr><th>Name</th><th>Paid</th><th>Share</th><th>Balance</th></tr></thead>" +
        "<tbody>" + body + "</tbody></table>" +
        "<p>Shares of an amount that does not divide evenly are rounded to the nearest cent, with leftover cents given to the first people in the split so the shares still add up exactly.</p>" +
        "</div></div>";

      el("split-currency").addEventListener("change", function (e) {
        state.currency = e.target.value;
        renderSplit();
      });
      people.forEach(function (p) {
        var input = el("name-" + p.id);
        if (!input) return;
        input.addEventListener("input", function () {
          p.name = input.value;
          /* Don't full re-render on each keystroke (would steal focus). Update results names on change/blur via refreshBalances? */
        });
        input.addEventListener("change", function () {
          p.name = input.value;
          renderSplit();
        });
      });
      splitRoot.querySelectorAll("[data-del-person]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-del-person");
          if (state.people.length <= 2) return;
          state.people = state.people.filter(function (p) { return p.id !== id; });
          state.expenses.forEach(function (e) {
            if (e.paidBy === id) e.paidBy = state.people[0].id;
            if (e.splitAmong) e.splitAmong = e.splitAmong.filter(function (x) { return x !== id; });
          });
          renderSplit();
        });
      });
      el("add-person").addEventListener("click", function () {
        var id = uid("p", state.nextId++);
        state.people.push({ id: id, name: "Person " + (state.people.length + 1) });
        state.expenses.forEach(function (e) {
          if (e.splitAmong && e.splitAmong.length) e.splitAmong.push(id);
        });
        renderSplit();
      });
      state.expenses.forEach(function (e) {
        var desc = splitRoot.querySelector("[data-edesc='" + e.id + "']");
        var amt = splitRoot.querySelector("[data-eamt='" + e.id + "']");
        var paid = splitRoot.querySelector("[data-epaid='" + e.id + "']");
        if (desc) desc.addEventListener("change", function () { e.desc = desc.value; renderSplit(); });
        if (amt) amt.addEventListener("change", function () { e.amount = Number(amt.value) || 0; renderSplit(); });
        if (paid) paid.addEventListener("change", function () { e.paidBy = paid.value; renderSplit(); });
      });
      splitRoot.querySelectorAll("[data-split]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          var id = cb.getAttribute("data-split");
          var exp = state.expenses.filter(function (x) { return x.id === id; })[0];
          if (!exp) return;
          var chosen = Array.prototype.slice.call(splitRoot.querySelectorAll("[data-split='" + id + "']:checked")).map(function (n) { return n.value; });
          exp.splitAmong = chosen;
          renderSplit();
        });
      });
      splitRoot.querySelectorAll("[data-del-exp]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-del-exp");
          state.expenses = state.expenses.filter(function (e) { return e.id !== id; });
          renderSplit();
        });
      });
      el("add-exp").addEventListener("click", function () {
        state.expenses.push({
          id: uid("e", state.nextExp++),
          desc: "",
          amount: 0,
          paidBy: state.people[0].id,
          splitAmong: state.people.map(function (p) { return p.id; })
        });
        renderSplit();
      });
    }

    function escapeHtml(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function currencyOptions(cur) {
      return Object.keys(C.CURRENCIES).map(function (k) {
        var m = C.CURRENCIES[k];
        return "<option value='" + k + "'" + (k === cur ? " selected" : "") + ">" + m.name + " (" + m.code + ")</option>";
      }).join("");
    }
    renderSplit();
  }
})();
