/**
 * Google Analytics 4 + Consent Mode v2 + cookie banner.
 * The measurement ID is defined only here, as GA_MEASUREMENT_ID.
 * Swap that one value later, for example:
 */
(function () {
  "use strict";

  var GA_MEASUREMENT_ID = "G-41XB0TPRC8";
  var STORAGE_KEY = "kotlets-cookie-consent";
  var usedSent = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  var choice = null;
  try {
    choice = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    choice = null;
  }

  if (choice === "accepted") {
    gtag("consent", "update", { analytics_storage: "granted" });
  }

  var gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(gaScript);

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  function pageSlug() {
    var path = (window.location.pathname || "").split("/").pop() || "";
    path = path.replace(/\.html$/i, "");
    return path || "index";
  }

  function trackCalculatorUsed() {
    if (usedSent) return;
    if (typeof gtag !== "function") return;
    var slug = pageSlug();
    if (!slug || slug === "index" || slug === "privacy") return;
    usedSent = true;
    gtag("event", "calculator_used", { calculator: slug });
  }

  function trackEtsyClick(url) {
    if (typeof gtag !== "function") return;
    gtag("event", "etsy_click", url ? { link_url: url } : {});
  }

  function applyChoice(next) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {}
    choice = next;
    if (typeof gtag === "function") {
      gtag("consent", "update", {
        analytics_storage: next === "accepted" ? "granted" : "denied"
      });
    }
    hideBanner();
  }

  var banner;

  function hideBanner() {
    if (banner) banner.setAttribute("hidden", "");
  }

  function openBanner() {
    if (!banner) buildBanner();
    banner.removeAttribute("hidden");
    var first = banner.querySelector("[data-cookie]");
    if (first && first.focus) first.focus();
  }

  function buildBanner() {
    if (banner) return;
    banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.id = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie settings");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML =
      "<div class='cookie-banner-inner'>" +
        "<p>We use Google Analytics to see which calculators are used. Analytics cookies are set only if you accept. You can read more in the <a href='privacy.html'>privacy policy</a>.</p>" +
        "<div class='cookie-actions'>" +
          "<button type='button' class='btn' data-cookie='accept'>Accept</button>" +
          "<button type='button' class='btn btn-ghost' data-cookie='decline'>Decline</button>" +
        "</div>" +
      "</div>";
    banner.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-cookie]") : null;
      if (!btn) return;
      applyChoice(btn.getAttribute("data-cookie") === "accept" ? "accepted" : "declined");
    });
    document.body.appendChild(banner);
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  window.KotletsAnalytics = {
    trackCalculatorUsed: trackCalculatorUsed,
    trackEtsyClick: trackEtsyClick,
    openCookieSettings: openBanner
  };

  onReady(function () {
    buildBanner();
    if (choice === "accepted" || choice === "declined") hideBanner();
    document.addEventListener("click", function (e) {
      var settings = e.target && e.target.closest ? e.target.closest(".js-cookie-settings") : null;
      if (settings) {
        e.preventDefault();
        openBanner();
        return;
      }
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.href || "";
      if (/^https?:\/\/([^/]*\.)?etsy\.com(\/|$)/i.test(href)) {
        trackEtsyClick(href);
      }
    });
  });
})();
