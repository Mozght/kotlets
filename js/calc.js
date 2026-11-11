/**
 * Kotlets calculator math. Shared by the pages and by Node tests.
 * Money is computed in integer cents so splits and totals stay exact.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KotletsCalc = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AVG_MONTH_DAYS = 365.25 / 12; // 30.4375
  var DAY_MS = 86400000;
  var CURRENCIES = {
    EUR: { code: "EUR", symbol: "€", name: "Euro" },
    USD: { code: "USD", symbol: "$", name: "US dollar" },
    GBP: { code: "GBP", symbol: "£", name: "Pound sterling" },
    PLN: { code: "PLN", symbol: "zł", name: "Polish zloty" },
    CHF: { code: "CHF", symbol: "CHF", name: "Swiss franc" }
  };

  function toCents(amount) {
    if (!isFinite(amount)) return 0;
    return Math.round(Number(amount) * 100);
  }
  function fromCents(cents) {
    return cents / 100;
  }
  function clampNonNeg(n) {
    n = Number(n);
    if (!isFinite(n) || n < 0) return 0;
    return n;
  }
  function clampInt(n, min) {
    n = Math.floor(Number(n));
    if (!isFinite(n) || n < min) return min;
    return n;
  }

  function applyMode(amount, mode, people, nights, days) {
    var a = clampNonNeg(amount);
    people = Math.max(1, people);
    nights = Math.max(0, nights);
    days = Math.max(0, days);
    switch (mode) {
      case "per_night_group":
        return a * nights;
      case "per_person_per_night":
        return a * nights * people;
      case "per_person_per_day":
        return a * days * people;
      case "per_person":
        return a * people;
      case "per_person_per_day_ski":
        return a * days * people;
      case "trip_total":
      default:
        return a;
    }
  }

  /**
   * Trip budget.
   * food uses `days` (default nights + 1). Lodging uses `nights`.
   */
  function tripBudget(input) {
    var people = clampInt(input.travelers, 1);
    var nights = clampInt(input.nights, 0);
    var days = input.days == null ? nights + 1 : clampInt(input.days, 0);
    var bufferPct = clampNonNeg(input.bufferPct);
    var lodging = applyMode(input.lodging, input.lodgingMode || "per_night_group", people, nights, days);
    var transport = applyMode(input.transport, input.transportMode || "trip_total", people, nights, days);
    var food = applyMode(input.food, input.foodMode || "per_person_per_day", people, nights, days);
    var activities = applyMode(input.activities, input.activitiesMode || "trip_total", people, nights, days);
    var other = applyMode(input.other, input.otherMode || "trip_total", people, nights, days);

    var parts = {
      lodging: toCents(lodging),
      transport: toCents(transport),
      food: toCents(food),
      activities: toCents(activities),
      other: toCents(other)
    };
    var subtotal = parts.lodging + parts.transport + parts.food + parts.activities + parts.other;
    var buffer = Math.round(subtotal * (bufferPct / 100));
    var total = subtotal + buffer;
    return {
      people: people,
      nights: nights,
      days: days,
      currency: input.currency || "EUR",
      parts: {
        lodging: fromCents(parts.lodging),
        transport: fromCents(parts.transport),
        food: fromCents(parts.food),
        activities: fromCents(parts.activities),
        other: fromCents(parts.other),
        buffer: fromCents(buffer)
      },
      subtotal: fromCents(subtotal),
      buffer: fromCents(buffer),
      total: fromCents(total),
      perPerson: fromCents(Math.round(total / people)),
      perNight: nights > 0 ? fromCents(Math.round(total / nights)) : null,
      perDay: days > 0 ? fromCents(Math.round(total / days)) : null
    };
  }

  /**
   * Ski trip cost. Lift and rentals can be priced per person for the trip
   * or per person per ski day. Lodging follows the same modes as tripBudget.
   * Food uses calendar days (nights + 1 unless overridden).
   */
  function skiTrip(input) {
    var people = clampInt(input.people, 1);
    var skiDays = clampInt(input.skiDays, 0);
    var nights = clampInt(input.nights, 0);
    var days = input.days == null ? nights + 1 : clampInt(input.days, 0);
    var bufferPct = clampNonNeg(input.bufferPct);

    var lift = applyMode(input.lift, input.liftMode || "per_person", people, nights, skiDays);
    var rentals = applyMode(input.rentals, input.rentalsMode || "per_person", people, nights, skiDays);
    var lessons = applyMode(input.lessons, input.lessonsMode || "per_person", people, nights, skiDays);
    var lodging = applyMode(input.lodging, input.lodgingMode || "per_night_group", people, nights, days);
    var food = applyMode(input.food, input.foodMode || "per_person_per_day", people, nights, days);
    var transport = applyMode(input.transport, input.transportMode || "trip_total", people, nights, days);
    var other = applyMode(input.other, input.otherMode || "per_person", people, nights, days);

    var parts = {
      lift: toCents(lift),
      rentals: toCents(rentals),
      lessons: toCents(lessons),
      lodging: toCents(lodging),
      food: toCents(food),
      transport: toCents(transport),
      other: toCents(other)
    };
    var subtotal =
      parts.lift +
      parts.rentals +
      parts.lessons +
      parts.lodging +
      parts.food +
      parts.transport +
      parts.other;
    var buffer = Math.round(subtotal * (bufferPct / 100));
    var total = subtotal + buffer;
    return {
      people: people,
      skiDays: skiDays,
      nights: nights,
      days: days,
      currency: input.currency || "EUR",
      parts: {
        lift: fromCents(parts.lift),
        rentals: fromCents(parts.rentals),
        lessons: fromCents(parts.lessons),
        lodging: fromCents(parts.lodging),
        food: fromCents(parts.food),
        transport: fromCents(parts.transport),
        other: fromCents(parts.other),
        buffer: fromCents(buffer)
      },
      subtotal: fromCents(subtotal),
      buffer: fromCents(buffer),
      total: fromCents(total),
      perPerson: fromCents(Math.round(total / people)),
      perSkiDay: skiDays > 0 ? fromCents(Math.round(total / skiDays)) : null
    };
  }

  /**
   * Group settlement.
   * people: [{ id, name }]
   * expenses: [{ amount, paidBy, splitAmong: id[]|null, desc }]
   * splitAmong null/empty = all people. Remainder cents go to the first
   * people in the split list so the shares always sum to the amount.
   */
  function groupSplit(people, expenses) {
    var balances = {};
    var paid = {};
    var share = {};
    people.forEach(function (p) {
      balances[p.id] = 0;
      paid[p.id] = 0;
      share[p.id] = 0;
    });
    var ids = people.map(function (p) {
      return p.id;
    });
    (expenses || []).forEach(function (e) {
      var cents = toCents(clampNonNeg(e.amount));
      if (cents === 0) return;
      if (balances[e.paidBy] == null) return;
      var among = e.splitAmong && e.splitAmong.length ? e.splitAmong.slice() : ids.slice();
      among = among.filter(function (id) {
        return balances[id] != null;
      });
      if (!among.length) return;
      var n = among.length;
      var base = Math.floor(cents / n);
      var rem = cents - base * n;
      paid[e.paidBy] += cents;
      balances[e.paidBy] += cents;
      among.forEach(function (id, i) {
        var s = base + (i < rem ? 1 : 0);
        share[id] += s;
        balances[id] -= s;
      });
    });

    var debtors = [];
    var creditors = [];
    people.forEach(function (p) {
      var v = balances[p.id];
      if (v < 0) debtors.push({ id: p.id, name: p.name, amt: -v });
      else if (v > 0) creditors.push({ id: p.id, name: p.name, amt: v });
    });
    debtors.sort(function (a, b) {
      return b.amt - a.amt;
    });
    creditors.sort(function (a, b) {
      return b.amt - a.amt;
    });

    var transfers = [];
    var i = 0;
    var j = 0;
    while (i < debtors.length && j < creditors.length) {
      var pay = Math.min(debtors[i].amt, creditors[j].amt);
      if (pay > 0) {
        transfers.push({
          from: debtors[i].id,
          fromName: debtors[i].name,
          to: creditors[j].id,
          toName: creditors[j].name,
          amount: fromCents(pay)
        });
      }
      debtors[i].amt -= pay;
      creditors[j].amt -= pay;
      if (debtors[i].amt === 0) i++;
      if (creditors[j].amt === 0) j++;
    }

    var nets = people.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        paid: fromCents(paid[p.id]),
        share: fromCents(share[p.id]),
        net: fromCents(balances[p.id])
      };
    });
    var sumNet = nets.reduce(function (acc, n) {
      return acc + toCents(n.net);
    }, 0);
    return { people: nets, transfers: transfers, balanced: sumNet === 0 };
  }

  function parseISODate(s) {
    if (!s || typeof s !== "string") return null;
    var m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
    if (!m) return null;
    var y = Number(m[1]);
    var mo = Number(m[2]);
    var d = Number(m[3]);
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }

  function daysBetween(from, to) {
    return Math.round((to.getTime() - from.getTime()) / DAY_MS);
  }

  function addDays(from, days) {
    return new Date(from.getTime() + days * DAY_MS);
  }

  function formatISODate(dt) {
    var y = dt.getUTCFullYear();
    var m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    var d = String(dt.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  /**
   * Vacation savings.
   * Months are average calendar months (365.25 / 12) so a year is 12 months.
   * If a planned monthly amount is given, we also say when the target is hit
   * and whether that date beats the deadline.
   */
  function vacationSavings(input) {
    var target = toCents(clampNonNeg(input.target));
    var saved = toCents(clampNonNeg(input.saved));
    var remaining = Math.max(0, target - saved);
    var from = parseISODate(input.from) || parseISODate(input.startDate);
    var to = parseISODate(input.to) || parseISODate(input.targetDate);
    if (!from || !to) {
      return { error: "invalid_date", remaining: fromCents(remaining) };
    }
    var days = daysBetween(from, to);
    var dueNow = days <= 0;
    var months = dueNow ? 0 : days / AVG_MONTH_DAYS;
    var weeks = dueNow ? 0 : days / 7;
    var perMonth = dueNow ? fromCents(remaining) : months > 0 ? fromCents(Math.round(remaining / months)) : fromCents(remaining);
    var perWeek = dueNow ? fromCents(remaining) : weeks > 0 ? fromCents(Math.round(remaining / weeks)) : fromCents(remaining);

    var monthlyPlan = input.monthly == null || input.monthly === "" ? null : toCents(clampNonNeg(input.monthly));
    var projected = null;
    var onTrack = null;
    var shortfall = null;
    if (monthlyPlan != null) {
      if (remaining === 0) {
        projected = formatISODate(from);
        onTrack = !dueNow || days === 0;
        shortfall = 0;
      } else if (monthlyPlan === 0) {
        projected = null;
        onTrack = false;
        shortfall = fromCents(remaining);
      } else {
        var monthsNeeded = remaining / monthlyPlan;
        var daysNeeded = Math.ceil(monthsNeeded * AVG_MONTH_DAYS);
        var hit = addDays(from, daysNeeded);
        projected = formatISODate(hit);
        onTrack = daysNeeded <= Math.max(0, days);
        var savedByDeadline = dueNow ? 0 : Math.round(monthlyPlan * (days / AVG_MONTH_DAYS));
        shortfall = fromCents(Math.max(0, remaining - savedByDeadline));
      }
    }

    return {
      currency: input.currency || "EUR",
      target: fromCents(target),
      saved: fromCents(saved),
      remaining: fromCents(remaining),
      from: formatISODate(from),
      to: formatISODate(to),
      days: days,
      months: Math.round(months * 100) / 100,
      weeks: Math.round(weeks * 100) / 100,
      perMonth: perMonth,
      perWeek: perWeek,
      dueNow: dueNow,
      alreadyThere: remaining === 0,
      monthlyPlan: monthlyPlan == null ? null : fromCents(monthlyPlan),
      projectedDate: projected,
      onTrack: onTrack,
      shortfall: shortfall
    };
  }

  function formatMoney(amount, currency) {
    var meta = CURRENCIES[currency] || CURRENCIES.EUR;
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    var abs = Math.abs(n).toFixed(2);
    var sign = n < 0 ? "-" : "";
    if (meta.code === "EUR") return sign + "€" + abs;
    if (meta.code === "USD") return sign + "$" + abs;
    if (meta.code === "GBP") return sign + "£" + abs;
    if (meta.code === "PLN") return sign + abs + " zł";
    if (meta.code === "CHF") return sign + "CHF " + abs;
    return sign + meta.symbol + abs;
  }

  return {
    CURRENCIES: CURRENCIES,
    AVG_MONTH_DAYS: AVG_MONTH_DAYS,
    toCents: toCents,
    fromCents: fromCents,
    applyMode: applyMode,
    tripBudget: tripBudget,
    skiTrip: skiTrip,
    groupSplit: groupSplit,
    vacationSavings: vacationSavings,
    parseISODate: parseISODate,
    daysBetween: daysBetween,
    formatISODate: formatISODate,
    formatMoney: formatMoney
  };
});
