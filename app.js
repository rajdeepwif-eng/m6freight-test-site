/* M6 Freight customer site — v2 (all-in hourly for local, fixed for trips) */
(function () {
  "use strict";
  var TERMS_VERSION = "draft 2026-11-18";
  var C = window.M6_CONFIG, M = window.M6, co = C.company, P = C.pricing, PAY = C.payments;
  var $ = function (id) { return document.getElementById(id); };
  var S = { from: null, to: null, fromText: "", toText: "", miles: 0, items: [], vol: 0, vanId: null,
            date: null, flexible: false, helpers: 0, helpersTouched: false, local: false, ref: null };
  var BASE = null;
  M.locate(C.base.place).then(function (b) { BASE = b; });

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var wa = function (text) { return "https://wa.me/" + co.phoneIntl + (text ? "?text=" + encodeURIComponent(text) : ""); };
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function fmtDate(d) { return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function todayAllowed() { return new Date().getHours() < P.sameDayCutoffHour; }
  function earliest() { var d = dayStart(new Date()); if (!todayAllowed()) d.setDate(d.getDate() + 1); return d; }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function tripDeposit(total) { return Math.max(PAY.tripDeposit, Math.round(total * (PAY.tripDepositPct || 0) / 100)); }
  function hrs(h) { var whole = Math.floor(h), m = Math.round((h - whole) * 60); return whole + "h" + (m ? " " + m + "m" : ""); }

  /* ---------- page text from settings ---------- */
  var minRate = Math.min.apply(null, C.vans.map(function (v) { return v.hourly; }));
  $("callTop").href = "tel:+" + co.phoneIntl; $("callTop").textContent = "Call " + co.phoneDisplay;
  $("wayCall").href = "tel:+" + co.phoneIntl; $("wayCallTxt").textContent = co.phoneDisplay;
  var photoMsg = "Hi M6 Freight, here are photos of what needs moving. From: ... To: ... Date: ...";
  $("wayPhotos").href = wa(photoMsg); $("photoLink").href = wa(photoMsg);
  $("waFloat").href = wa("Hi M6 Freight, I'd like a price.");
  $("bizWa").href = wa("Hi M6 Freight, I'd like a trade account. Company: ... Typical jobs: ...");
  $("bizInv").textContent = "Monthly invoice, " + PAY.businessInvoiceDays + "-day terms (approved accounts)";
  $("flexPct").textContent = P.flexiblePct;
  var minTrip = Math.min.apply(null, C.vans.map(function (v) { return v.minimum; }));
  var promises = ["Local from £" + minRate + "/hr · trips from £" + minTrip, "No account needed", "Free date changes up to " + P.freeChangeHours + "h before"];
  $("promises").innerHTML = promises.map(function (p) { return '<span class="pill">' + esc(p) + "</span>"; }).join("");
  var localTxt = "Jobs within " + C.base.localRadiusMiles + " miles of " + C.base.place + " are charged by the hour: from £" + minRate + "/hr on weekdays for van and driver, fuel included (+" + P.weekendPct + "% at weekends, +" + P.sameDayPct + "% for same-day; extra people £" + P.helperHourly + "/hr each). " + P.minimumHours + "-hour minimum, then " + P.incrementMinutes + "-minute steps. The clock starts when we arrive at your door and stops when the job's done. There's no fee for stairs; they just take the time they take.";
  $("faqHourly").textContent = localTxt + " We show you an estimate before you book; you pay for the actual time.";
  $("faqPay").textContent = "Local jobs: " + (PAY.localDeposit ? "a £" + PAY.localDeposit + " deposit, the rest" : "nothing up front; you pay") + " when the job's done (" + PAY.payMethods + "). Fixed-price trips: a deposit of " + (PAY.tripDepositPct ? PAY.tripDepositPct + "% (at least £" + PAY.tripDeposit + ")" : "£" + PAY.tripDeposit) + " holds the slot, the rest on the day. Trade accounts pay by invoice.";
  $("faqChange").textContent = C.cancellationPolicy;
  if (co.goodsInTransitCover) $("faqIns").textContent = "Yes. Goods in transit are covered up to " + co.goodsInTransitCover + " per job" + (co.publicLiabilityCover ? ", with " + co.publicLiabilityCover + " public liability" : "") + ". Tell us about anything worth more before you book.";
  var chUrl = "https://find-and-update.company-information.service.gov.uk/company/" + co.companyNumber;
  $("faqReal").innerHTML = "We're " + esc(co.legalName) + ", company number " + esc(co.companyNumber) + '. You can check us on <a href="' + chUrl + '" target="_blank" rel="noopener">Companies House</a>' + (co.googleReviewsUrl ? ' and read our <a href="' + esc(co.googleReviewsUrl) + '" target="_blank" rel="noopener">Google reviews</a>' : "") + ".";
  $("closeCall").href = "tel:+" + co.phoneIntl; $("closeCall").textContent = "Call " + co.phoneDisplay;

  /* Why people pick us: only promises switched on in config */
  var R = [
    ["Clear, all-in pricing", "Van, driver and fuel are in the price, with no booking fee and no stairs fee. Trips are one fixed price; local jobs are the hourly rate you see, for the time we actually take."],
    [PAY.localDeposit ? "Small deposit, pay the rest after" : "No deposit on local jobs", "Request in about a minute and pay when the job's done. Free date changes up to " + P.freeChangeHours + " hours before."],
    [co.arrivalWindowHours + "-hour arrival window", "Plus a WhatsApp message when we're about 30 minutes away." + (co.noCancellationsMonths ? " No cancellations by us in the last " + co.noCancellationsMonths + " months." : "")]
  ];
  if (co.ownerDriven) R.push([C.driversWanted ? "The owner drives most jobs" : "The owner drives your job", (C.driversWanted ? "The person you message is the person who turns up. If we ever need a partner driver, we tell you first and you can say no" : "The person you message is the person who turns up") + (co.dbsChecked ? ", DBS checked." : ".") + (co.dayBeforePhoto ? " Driver photo sent the day before." : "")]);
  if (co.paddingStandard) R.push(["Padded, every time", "Blankets and wrap on every piece, door-frame and floor protection in your home. Standard, not an extra."]);
  if (co.damagePromise) R.push(["Our damage promise", co.damagePromise + (co.claimReplyHours ? " We reply to any damage report within " + co.claimReplyHours + " hours." : "")]);
  else if (co.proofOfDelivery) R.push(["Proof at every step", "A photo when it's delivered, sent to you on WhatsApp."]);
  if (co.goodsInTransitCover) R.push(["Insured", "Goods in transit cover up to " + co.goodsInTransitCover + (co.publicLiabilityCover ? ", public liability " + co.publicLiabilityCover : "") + "."]);
  R.push(["A real, registered company", esc(co.legalName) + ", company no. " + esc(co.companyNumber) + '. <a href="' + chUrl + '" target="_blank" rel="noopener">Check us on Companies House</a>.']);
  var ICON = {
    price: '<path d="M4 12l8-8h8v8l-8 8z"/><circle cx="16" cy="8" r="1.6"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h5M3 9h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    pad: '<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 10h16M4 14h16"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
    building: '<path d="M4 21V5l8-2v18M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>'
  };
  function iconFor(t) { t = t.toLowerCase(); return t.indexOf("pric") > -1 ? ICON.price : t.indexOf("deposit") > -1 ? ICON.wallet : t.indexOf("arrival") > -1 ? ICON.clock : t.indexOf("owner") > -1 ? ICON.person : t.indexOf("padded") > -1 ? ICON.pad : t.indexOf("damage") > -1 || t.indexOf("insured") > -1 ? ICON.shield : t.indexOf("proof") > -1 ? ICON.camera : ICON.building; }
  $("reasonCards").innerHTML = R.map(function (r) { return '<div class="tile reason"><svg class="ricon" viewBox="0 0 24 24" aria-hidden="true">' + iconFor(r[0]) + '</svg><h3>' + esc(r[0]) + "</h3><p>" + (r[1].indexOf("<a ") > -1 ? r[1] : esc(r[1])) + "</p></div>"; }).join("");

  /* Meet your driver: only with a REAL photo */
  if (co.driverPhoto) {
    $("driver").hidden = false; $("driverImg").src = co.driverPhoto;
    $("driverImg").alt = (co.ownerFirstName || "Your driver") + " with the M6 Freight van";
    $("driverH").textContent = "Meet " + (co.ownerFirstName || "your driver");
    $("driverP").textContent = (co.ownerDriven ? "He owns M6 Freight and drives every job himself. " : "") + "You'll get this photo again the day before, so you know exactly who's coming.";
  }

  /* How a job actually goes */
  var steps = [
    ["Get your price", "Postcodes and a list, typed like a text, or photos on WhatsApp. About a minute."],
    ["Request", "Name, mobile and addresses. No account. " + (PAY.localDeposit ? "" : "Local jobs: no deposit.")],
    ["We confirm", "A real person confirms on WhatsApp. We aim to reply within " + co.replyPromiseMinutes + " minutes (" + co.hours + ")."],
    ["Day before", (co.dayBeforePhoto ? "Driver photo, van and " : "Your ") + co.arrivalWindowHours + "-hour arrival window."],
    ["On the day", "A message when we're about 30 minutes away. " + (co.paddingStandard ? "Everything padded, loaded, strapped and delivered." : "Loaded, strapped and delivered.")],
    ["Done", (co.proofOfDelivery ? "Photo when it's delivered, then pay." : "Check everything's arrived, then pay.") + " We'll ask how we did."]
  ];
  $("howSteps").innerHTML = steps.map(function (s) { return "<li><b>" + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("");
  $("padding").hidden = !co.paddingStandard;
  $("areaLinks").innerHTML = "Areas: " + (C.base.towns || []).map(function (t) { return '<a href="areas/' + t.toLowerCase().replace(/[^a-z]+/g, "-") + '.html">' + esc(t) + "</a>"; }).join(" · ");
  $("areaLine").textContent = "Local hourly pricing within " + C.base.localRadiusMiles + " miles of " + C.base.place + ", including:";
  $("areaTowns").innerHTML = (C.base.towns || []).map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") + '<span class="chip alt">Anywhere in the UK at a fixed price</span>';

  /* ---------- reviews, stats, driver: real data, or clearly-labelled SAMPLE data in demo mode ---------- */
  var DEMO = !!C.demoMode, SM = C.sample || {}, SAMPLE = '<span class="sample">SAMPLE</span>';
  var rating = co.googleRating && +co.googleReviewCount >= 5 ? { r: co.googleRating, n: co.googleReviewCount, demo: false } : (DEMO ? { r: SM.rating, n: SM.reviewCount, demo: true } : null);
  if (rating) {
    $("rateBar").hidden = false; $("rateBar").href = rating.demo ? "#reviews" : (co.googleReviewsUrl || "#reviews");
    $("rateBar").innerHTML = "★★★★★ " + esc(rating.r) + " from " + esc(rating.n) + " Google reviews" + (rating.demo ? " " + SAMPLE : "");
  }
  if (DEMO && SM.reviews && !(co.googleRating && +co.googleReviewCount >= 5)) {
    $("reviews").hidden = false;
    $("revLine").innerHTML = "<b>" + esc(SM.rating) + " ★</b> from " + esc(SM.reviewCount) + " Google reviews " + SAMPLE;
    $("revGrid").innerHTML = SM.reviews.map(function (r) { return '<figure class="rev"><div class="stars" aria-label="' + r[1] + ' out of 5">' + "★★★★★".slice(0, r[1]) + '<span class="off">' + "★★★★★".slice(r[1]) + "</span></div><blockquote>" + esc(r[2]) + "</blockquote><figcaption>" + esc(r[0]) + " " + SAMPLE + "</figcaption></figure>"; }).join("");
  }
  if (DEMO && SM.stats) {
    $("stats").hidden = false;
    $("statStrip").innerHTML = SM.stats.map(function (s) { return '<div class="statbox"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></div>"; }).join("") + '<div class="statbox note">' + SAMPLE + "<span>Example figures for the test site</span></div>";
  }
  if (DEMO && !co.driverPhoto) {
    $("driver").hidden = false;
    $("driverImg").parentNode.innerHTML = '<div class="phph"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg><span>Real photo of the owner with the van goes here</span>' + SAMPLE + "</div>";
    $("driverH").textContent = "Meet " + (co.ownerFirstName || "the owner");
    $("driverP").textContent = "He owns M6 Freight and drives every job himself. You'll get his photo and the van's registration on WhatsApp the day before, so you know exactly who's coming.";
  }
  if (rating && !rating.demo) {
    $("reviews").hidden = false;
    $("revLine").innerHTML = "<b>" + esc(co.googleRating) + " ★</b> from " + esc(co.googleReviewCount) + " Google reviews" + (co.googleReviewsUrl ? ' · <a href="' + esc(co.googleReviewsUrl) + '" target="_blank" rel="noopener">Read them all on Google</a>' : "");
  }
  var TRIPS = (C.returnTrips && C.returnTrips.length) ? C.returnTrips : (DEMO && SM.trips ? SM.trips.map(function (t) { var d = new Date(); d.setDate(d.getDate() + parseInt(t.date, 10)); return { from: t.from, to: t.to, date: iso(d), price: t.price, van: t.van, demo: true }; }) : []);
  if (TRIPS.length) {
    $("returns").hidden = false;
    $("tripList").innerHTML = TRIPS.map(function (t) {
      var d = new Date(t.date + "T12:00:00");
      return '<div class="trip"><b>' + esc(t.from) + " → " + esc(t.to) + (t.demo ? " " + SAMPLE : "") + '</b><span class="small">' + esc(fmtDate(d)) + " · " + esc((C.vans.filter(function (v) { return v.id === t.van; })[0] || {}).name || "Van") + '</span><span class="tp tab">' + M.money(t.price) + '</span><a class="btn btn-wa" href="' + wa("Hi M6 Freight, I'd like the return trip " + t.from + " → " + t.to + " on " + fmtDate(d) + " at " + M.money(t.price) + ".") + '" target="_blank" rel="noopener">Book this trip</a></div>';
    }).join("");
  }
  $("fCompany").innerHTML = esc(co.legalName) + ", registered in " + esc(co.registeredIn) + "<br>Company no. " + esc(co.companyNumber) + "<br>Registered office: " + esc(co.registeredOffice) + (co.tradingAddress ? "<br>Trading address: " + esc(co.tradingAddress) : "") + (co.vatRegistered ? "" : "<br>Not VAT registered");
  $("fContact").innerHTML = 'Phone / WhatsApp: <a href="tel:+' + co.phoneIntl + '">' + esc(co.phoneDisplay) + '</a><br>Email: <a href="mailto:' + esc(co.email) + '">' + esc(co.email) + "</a><br>" + esc(co.hours) + "<br>Complaints: email us and we'll reply within 5 working days.";

  /* ---------- structured data for search engines (used once the site is live) ---------- */
  try {
    var ld = { "@context": "https://schema.org", "@type": "MovingCompany", name: co.tradingName, legalName: co.legalName,
      telephone: "+" + co.phoneIntl, email: co.email, url: C.siteUrl, areaServed: (C.base.towns || []).concat(["United Kingdom"]),
      priceRange: "££", image: C.siteUrl + "img/hero-motorway.jpg" };
    if (co.tradingAddress) ld.address = co.tradingAddress;
    if (co.googleRating && +co.googleReviewCount >= 5) ld.aggregateRating = { "@type": "AggregateRating", ratingValue: co.googleRating, reviewCount: co.googleReviewCount };
    var sc = document.createElement("script"); sc.type = "application/ld+json"; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
  } catch (x) {}

  /* ---------- quote form ---------- */
  var pick = $("pickDate"); pick.min = iso(new Date());
  document.querySelectorAll('input[name="when"]').forEach(function (r) {
    r.addEventListener("change", function () { pick.hidden = !(r.value === "pick" && r.checked); if (!pick.hidden) pick.focus(); });
  });
  if (!todayAllowed()) { $("wToday").disabled = true; $("wToday").nextElementSibling.title = "Same-day bookings close at " + P.sameDayCutoffHour + ":00"; }
  document.querySelectorAll("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () { var t = $("items"); t.value = (t.value.trim() ? t.value.trim() + ", " : "") + b.getAttribute("data-add"); t.focus(); });
  });
  function chosenDate() {
    var w = document.querySelector('input[name="when"]:checked').value, d = dayStart(new Date());
    if (w === "tomorrow") d.setDate(d.getDate() + 1);
    if (w === "pick") {
      var p = (pick.value || "").split("-");
      if (p.length !== 3 || isNaN(+p[0])) return null;
      d = new Date(+p[0], +p[1] - 1, +p[2]);
    }
    if (d < earliest()) return null;
    return d;
  }

  $("quoteForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("qErr"); err.hidden = true;
    var f = $("from").value.trim(), t = $("to").value.trim();
    function fail(m) { err.textContent = m; err.hidden = false; $("results").hidden = true; $("bar").classList.remove("on"); document.body.classList.remove("has-bar"); }
    if (!f || !t) { fail("Add where we collect from and where it's going."); return; }
    $("checkout").hidden = true; $("done").hidden = true;
    var vq = $("viaBox").hidden ? "" : $("via").value.trim();
    var off = M.offshore(f) || M.offshore(t) || (vq && M.offshore(vq));
    if (off) { fail(off + " needs a ferry crossing, so we price it by hand. Send the details on WhatsApp and we'll reply with a price."); err.innerHTML = esc(err.textContent) + ' <a href="' + wa("Hi M6 Freight, I need a price for a job to/from " + off + ": " + f + " to " + t + ". Items: " + $("items").value) + '" target="_blank" rel="noopener">Message us</a>'; return; }
    var when = chosenDate();
    if (!when) { fail("Choose a date from " + fmtDate(earliest()) + " onwards."); return; }
    if (!$("items").value.trim()) $("items").value = "parcel";
    var btn = $("goBtn"); btn.textContent = "Working out your price…"; btn.disabled = true;
    Promise.all([M.locate(f), M.locate(t), BASE ? Promise.resolve(BASE) : M.locate(C.base.place), vq ? M.locate(vq) : Promise.resolve(null)]).then(function (r) {
      btn.textContent = "Show my price →"; btn.disabled = false;
      if (!r[0] || !r[1]) { fail("We couldn't find " + (!r[0] ? '"' + f + '"' : '"' + t + '"') + ". Try a postcode, e.g. WV1 1AA."); return; }
      if (vq && !r[3]) { fail("We couldn't find the extra stop \"" + vq + "\". Try a postcode."); return; }
      S.via = r[3] || null; S.viaText = vq;
      BASE = r[2];
      S.from = r[0]; S.to = r[1]; S.fromText = f; S.toText = t;
      S.miles = S.via ? M.miles(r[0], S.via) + M.miles(S.via, r[1]) : M.miles(r[0], r[1]);
      S.local = !!BASE && M.miles(BASE, r[0]) <= C.base.localRadiusMiles && M.miles(BASE, r[1]) <= C.base.localRadiusMiles && (!S.via || M.miles(BASE, S.via) <= C.base.localRadiusMiles);
      S.items = M.readItems($("items").value); S.vol = M.volume(S.items);
      S.vanId = M.bestVan(S.vol).id;
      S.date = when;
      S.helpersTouched = false; S.helpers = M.needsTwo(S.items) ? 1 : 0;
      if (S.pendingHelpers) { S.helpers = S.pendingHelpers; S.helpersTouched = true; S.pendingHelpers = 0; }
      S.flexible = false; $("flex").checked = false; if (S.promo) { S.promoNote = S.promo; } S.promo = ""; $("cPromo").value = ""; $("promoMsg").textContent = S.promoNote ? "New price: please re-enter code " + S.promoNote + " if you'd like to use it." : ""; S.promoNote = "";
      showResults(true);
      if (S.dateNote) { S.dateNote = false; var n = document.createElement("span"); n.className = "note"; n.textContent = " The date in your link wasn't available, so we've shown " + fmtDate(S.date) + ". Pick another day below."; $("bWhen").appendChild(n); }
      M.postLead({ type: "price_viewed", from: f, to: t, miles: S.miles, local: S.local, items: $("items").value, date: iso(S.date), price: current().total, van: S.vanId, at: new Date().toISOString() });
    });
  });

  function van() { return C.vans.filter(function (v) { return v.id === S.vanId; })[0]; }
  function quoteFor(v, d) { return M.price({ van: v, miles: S.miles, vol: S.vol, date: d || S.date, helpers: S.helpers, flexible: S.flexible, local: S.local, promo: S.promo, stops: S.via ? 1 : 0 }); }
  function current() { return quoteFor(van()); }

  function showResults(scroll) {
    var R = $("results"); R.hidden = false;
    $("rFrom").innerHTML = esc(S.from.label) + "<small>Collection</small>";
    $("rTo").innerHTML = esc(S.to.label) + "<small>Delivery" + (S.via ? " · via " + esc(S.via.label) : "") + "</small>";
    var line = $("roadLine"); line.classList.remove("dash"); void line.getBBox(); line.classList.add("dash");
    $("sMiles").textContent = S.miles;
    $("sVol").textContent = S.vol.toFixed(1);
    $("approxNote").hidden = !(S.from.approx || S.to.approx);
    $("itemList").innerHTML = S.items.map(function (i) {
      return '<span class="item' + (i.known ? "" : " unk") + '">' + (i.qty > 1 ? i.qty + " × " : "") + esc(i.name) + (i.known ? "" : " (we'll check size)") + "</span>";
    }).join("");
    renderAll();
    $("bar").classList.add("on"); document.body.classList.add("has-bar");
    if (scroll) R.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  var VANSVG = '<svg viewBox="0 0 46 28" aria-hidden="true"><path d="M2 6h26v15H2zM28 11h9l6 6v4H28z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="10" cy="23" r="3.2" fill="currentColor"/><circle cx="35" cy="23" r="3.2" fill="currentColor"/></svg>';

  function renderAll() {
    if (S.promo && !M.promoInfo(S.promo, S.date)) { var lost = S.promo, li = M.promoInfo(lost, new Date()); S.promo = ""; $("promoMsg").textContent = "Code " + lost + " doesn't cover this date" + (li && li.ends ? " (jobs up to " + promoEnds(li) + ")" : "") + ", so it's been removed."; }
    var v = van(), best = M.bestVan(S.vol), q = current();
    var oversize = S.vol > M.maxM3();
    $("bookBtn").hidden = oversize; $("barBook").hidden = oversize;
    $("oversize").hidden = !oversize;
    $("flex").disabled = M.isToday(S.date); if (M.isToday(S.date)) S.flexible = false;
    var pct = Math.min(100, Math.round(S.vol / v.capacityM3 * 100));
    $("fillBar").style.width = pct + "%";
    $("fillNote").textContent = "Fills about " + pct + "% of a " + v.name.toLowerCase() + " (" + v.capacityM3 + " m³).";
    $("helpHint").textContent = M.needsTwo(S.items) ? "(we suggest 1 for heavy items)" : "";
    $("sTime").textContent = S.local ? hrs(q.hours) : M.etaText(S.miles).replace(" door to door", "");
    $("sTimeLbl").textContent = S.local ? "estimated job time" : "drive + loading";

    $("vanList").innerHTML = C.vans.map(function (x) {
      var tooSmall = S.vol > x.capacityM3, qx = quoteFor(x);
      return '<button type="button" class="van" data-van="' + x.id + '" aria-pressed="' + (x.id === S.vanId) + '"' + (tooSmall ? " disabled" : "") + ">" + VANSVG +
        "<span><b>" + esc(x.name) + "</b>" + (x.id === best.id ? '<span class="tagfit">Best fit</span>' : "") +
        '<br><span class="note">' + esc(x.example) + " · " + x.capacityM3 + " m³" + (S.local ? " · £" + (x.hourly + S.helpers * P.helperHourly) + "/hr" : "") + (tooSmall ? " · too small" : "") + "</span></span>" +
        '<span class="vp tab">' + (S.local ? "≈" : "") + M.money(qx.total) + "</span></button>";
    }).join("");
    $("vanList").querySelectorAll(".van").forEach(function (b) { b.addEventListener("click", function () { S.vanId = b.getAttribute("data-van"); renderAll(); }); });

    var start = dayStart(new Date()); if (!todayAllowed()) start.setDate(start.getDate() + 1);
    var days = [], low = Infinity;
    for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate() + i); var p = quoteFor(v, d).total; days.push({ d: d, p: p }); low = Math.min(low, p); }
    $("dateStrip").innerHTML = days.map(function (x) {
      var on = x.d.toDateString() === S.date.toDateString();
      return '<button type="button" class="date' + (x.p === low ? " low" : "") + '" data-d="' + iso(x.d) + '" aria-pressed="' + on + '"><small>' + x.d.toLocaleDateString("en-GB", { weekday: "short" }) + '</small><b class="tab">' + M.money(x.p) + "</b><small>" + x.d.getDate() + " " + x.d.toLocaleDateString("en-GB", { month: "short" }) + "</small></button>";
    }).join("");
    $("dateStrip").querySelectorAll(".date").forEach(function (b) { b.addEventListener("click", function () { var p = b.getAttribute("data-d").split("-"); S.date = new Date(+p[0], +p[1] - 1, +p[2]); renderAll(); }); });
    $("helpers").textContent = S.helpers;

    countTo($("bPrice"), q.total);
    $("bMode").textContent = S.local ? "Local · hourly, all-in" : approx() ? "Trip · estimated price, all-in" : "Trip · fixed price, all-in";
    $("bVan").textContent = v.name + " · just your job";
    $("bSub").textContent = S.local
      ? "Estimate for about " + hrs(q.hours) + " at £" + q.hourlyRate + "/hr" + (S.promo ? ", then " + M.promoInfo(S.promo, S.date).pct + "% off your final bill" : "") + ". You pay for the actual time, in " + P.incrementMinutes + "-min steps." + (co.vatRegistered ? " Inc VAT." : "")
      : (approx() ? "Estimated from the postcode area. We confirm the fixed price once we have your full address" : "Fixed price for the whole job") + (co.vatRegistered ? ", including VAT." : ". No VAT to add.");
    $("bWhen").textContent = (M.isToday(S.date) ? "Today" : fmtDate(S.date)) + (S.flexible ? " (±2 days, we confirm the day)" : "") + (S.local ? "" : " · about " + M.etaText(S.miles));
    var incl = ["Van and driver, only your goods on board", "Fuel included, no booking or stairs fee", (co.dayBeforePhoto ? "Driver photo the day before, " : "Arrival window the day before, ") + "message when we're 30 min away"];
    if (co.proofOfDelivery) incl.push("Photo when delivered");
    if (co.goodsInTransitCover) incl.splice(2, 0, "Goods covered to " + co.goodsInTransitCover);
    $("bIncl").innerHTML = incl.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    $("bLines").innerHTML = q.lines.length > 1 ? q.lines.map(function (l) { return "<div><span>" + esc(l.label) + "</span><span>" + (l.amount < 0 ? "−" : "") + M.money(Math.abs(l.amount)) + "</span></div>"; }).join("") : "";
    $("bHold").textContent = "Price held for " + P.priceHoldHours + " hours · free date changes up to " + P.freeChangeHours + "h before.";
    $("waPrice").href = wa("Hi M6 Freight, please hold this price for me:\n" + summaryText(q, null));
    $("barVan").textContent = v.name + (S.local || approx() ? " · estimate" : " · fixed"); $("barPrice").textContent = M.money(q.total);
    $("waPrice").hidden = oversize; $("bHold").hidden = oversize; $("bLines").hidden = oversize;
    if (oversize) { $("bMode").textContent = "Too big for one van"; $("bSub").textContent = "This looks like more than one Luton load. Send photos or a list on WhatsApp and we'll price it properly."; $("bar").classList.remove("on"); document.body.classList.remove("has-bar"); }
    if (!$("checkout").hidden) { if (oversize) $("checkout").hidden = true; else fillCheckout(); }
  }
  function approx() { return !!(S.from && S.to && (S.from.approx || S.to.approx)); }

  var countTimer;
  function countTo(el, target) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var from = parseInt((el.textContent || "0").replace(/[^\d]/g, ""), 10) || 0;
    clearInterval(countTimer);
    if (reduce || from === target) { el.textContent = M.money(target); return; }
    var steps = 18, n = 0;
    countTimer = setInterval(function () { n++; el.textContent = M.money(from + (target - from) * (n / steps)); if (n >= steps) { clearInterval(countTimer); el.textContent = M.money(target); } }, 22);
  }

  $("flex").addEventListener("change", function () { S.flexible = this.checked; renderAll(); });
  $("hMinus").addEventListener("click", function () { S.helpersTouched = true; S.helpers = Math.max(0, S.helpers - 1); renderAll(); });
  $("hPlus").addEventListener("click", function () { S.helpersTouched = true; S.helpers = Math.min(3, S.helpers + 1); renderAll(); });

  function summaryText(q, extra) {
    var itemsTxt = S.items.map(function (i) { return (i.qty > 1 ? i.qty + " × " : "") + i.name; }).join(", ");
    return [
      (S.ref ? "Ref " + S.ref + "\n" : "") + S.fromText + " → " + (S.via ? S.viaText + " → " : "") + S.toText + " (" + S.miles + " miles)",
      "Items: " + itemsTxt,
      "Van: " + van().name + (S.helpers ? " + " + plural(S.helpers, "helper") : ""),
      "Date: " + fmtDate(S.date) + (S.flexible ? " (flexible ±2 days)" : "") + (S.promo ? "\nCode: " + S.promo : ""),
      S.local ? "Price: approx " + M.money(q.total) + " (about " + hrs(q.hours) + " at £" + q.hourlyRate + "/hr, all-in)" : "Price: " + M.money(q.total) + (approx() ? " estimated (area only, to confirm)" : " fixed, all-in")
    ].concat(extra || []).join("\n");
  }

  /* ---------- checkout ---------- */
  function within14(d) { return (dayStart(d) - dayStart(new Date())) / 864e5 < 14; }
  function openCheckout() {
    $("checkout").hidden = false; showStep(1);
    $("bar").classList.remove("on"); document.body.classList.remove("has-bar");
    fillCheckout();
    $("checkout").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { $("cName").focus({ preventScroll: true }); }, 500);
  }
  function fillCheckout() {
    var q = current(), was = document.querySelector('input[name="pay"]:checked');
    was = was ? was.value : null;
    $("sPrice").textContent = (S.local ? "≈" : "") + M.money(q.total);
    $("sSummary").innerHTML = "<div><b>" + esc(S.from.label) + "</b> → <b>" + esc(S.to.label) + "</b></div><div>" + esc(van().name) + " · " + S.miles + " miles</div><div>" + esc(M.isToday(S.date) ? "Today" : fmtDate(S.date)) + (S.flexible ? " (±2 days)" : "") + "</div><div class='note'>" + (S.local ? "Hourly estimate, all-in" : approx() ? "Estimated price, confirmed with your address" : "Fixed price, all-in") + "</div>";
    var dep = tripDeposit(q.total);
    var opts = S.local ? [
      { id: "after", t: PAY.localDeposit ? "£" + PAY.localDeposit + " deposit, rest when done" : "Pay when the job's done", tag: PAY.localDeposit ? "" : "No deposit", d: "Pay by " + PAY.payMethods + " at the end, for the actual time.", a: PAY.localDeposit ? "£" + PAY.localDeposit + " now" : "£0 now" },
      { id: "invoice", t: "Trade account invoice", d: PAY.businessInvoiceDays + "-day terms for approved trade accounts.", a: "Account" }
    ] : [
      { id: "deposit", t: M.money(dep) + " deposit now", tag: "Holds your slot", d: "Card, Apple Pay or Google Pay on a secure Stripe page. The remaining " + M.money(Math.max(0, q.total - dep)) + " on the day. Refund terms are in the booking terms.", a: M.money(dep) },
      { id: "full", t: "Pay in full", d: "We send a secure payment link for the exact amount on WhatsApp.", a: M.money(q.total) },
      { id: "invoice", t: "Trade account invoice", d: PAY.businessInvoiceDays + "-day terms for approved trade accounts.", a: "Account" }
    ];
    $("payOpts").innerHTML = opts.map(function (o, i) {
      return '<input type="radio" name="pay" id="p_' + o.id + '" value="' + o.id + '"' + (i === 0 ? " checked" : "") + '><label for="p_' + o.id + '"><span><b>' + esc(o.t) + (o.tag ? '<span class="tagb">' + esc(o.tag) + "</span>" : "") + '</b><span class="note">' + esc(o.d) + '</span></span><span class="amt tab">' + esc(o.a) + "</span></label>";
    }).join("");
    if (was && $("p_" + was)) $("p_" + was).checked = true;
    $("earlyBox").hidden = true;
    $("cancelInfo").textContent = C.cancellationPolicy;
    $("cardNote").hidden = S.local && !PAY.localDeposit;
    $("cAddrFrom").placeholder = "House number, street — " + S.fromText;
    $("cAddrTo").placeholder = "House number, street — " + S.toText;
    var sl = $("cSlot"), keep = sl.value; var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), slots = (C.slots || []).filter(function (x) { if (!M.isToday(S.date)) return true; return slotStart(x) - nowMin >= 90; });
    sl.innerHTML = '<option value="">Any time (we confirm)</option>' + slots.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("");
    if (keep && slots.indexOf(keep) === -1) { sl.value = ""; $("slotNote").textContent = "Your " + keep + " slot isn't available on this date. Pick another time."; } else { sl.value = keep; $("slotNote").textContent = ""; }
    $("promoBox").hidden = !C.promoCodes || !Object.keys(C.promoCodes).length;
  }
  function slotStart(x) {
    x = String(x); var m = x.match(/^(\d{1,2})(?::(\d\d))?\s*(am|pm)?/i), h = +m[1], end = x.match(/[–-]\s*(\d{1,2})(?::\d\d)?\s*(am|pm)?/i);
    var mer = (m[3] || "").toLowerCase();
    if (!mer && end && end[2]) { mer = end[2].toLowerCase(); if (mer === "pm" && h > +end[1] && h !== 12) mer = "am"; }
    if (mer === "pm" && h < 12) h += 12; if (mer === "am" && h === 12) h = 0;
    return h * 60 + (+m[2] || 0);
  }
  function promoEnds(pi) { return pi && pi.ends ? fmtDate(new Date(pi.ends + "T12:00")) : ""; }
  function applyPromo() {
    var c = $("cPromo").value.trim().toUpperCase(), msg = $("promoMsg"), raw = C.promoCodes && (C.promoCodes[c] || C.promoCodes[c.toLowerCase()]);
    if (!c) { S.promo = ""; msg.textContent = ""; }
    else {
      var pi = M.promoInfo(c, S.date);
      if (pi) { S.promo = c; msg.textContent = "Code " + c + " applied: " + pi.pct + "% off" + (S.local ? " your final bill" : "") + (pi.ends ? ". For jobs booked and done by " + promoEnds(pi) : "") + (pi.terms ? ". " + pi.terms.replace(/\.$/, "") : "") + "."; }
      else if (M.promoInfo(c, new Date())) msg.textContent = "Code " + c + " is for jobs up to " + promoEnds(M.promoInfo(c, new Date())) + ". Pick an earlier date to use it." + (S.promo ? " Your code " + S.promo + " is still applied." : "");
      else msg.textContent = (raw ? "That code has ended." : "That code isn't valid.") + (S.promo ? " Your code " + S.promo + " is still applied." : "");
    }
    renderAll();
  }
  $("promoBtn").addEventListener("click", applyPromo);
  $("cPromo").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } });
  /* ---------- one step per screen on phones ---------- */
  var STEP = 1, STEPS = 3, mqStep = window.matchMedia("(max-width: 920px)");
  function stepMissing(n) {
    var m = [], digits = $("cPhone").value.replace(/\(0\)/g, "").replace(/\D/g, "");
    if (n === 1) { if (!$("cName").value.trim()) m.push("name"); if (!/^(07\d{9}|447\d{9})$/.test(digits)) m.push("UK mobile number (07…)"); }
    if (n === 2) { if (!$("cAddrFrom").value.trim()) m.push("collection address"); if (!$("cAddrTo").value.trim()) m.push("delivery address"); }
    return m;
  }
  function showStep(n) {
    STEP = n; var f = $("coForm");
    f.classList.toggle("stepped", mqStep.matches);
    f.classList.toggle("first", n === 1); f.classList.toggle("last", n === STEPS);
    f.querySelectorAll(".cstep").forEach(function (s) { s.classList.toggle("on", +s.getAttribute("data-step") === n); });
    $("stepNote").textContent = "Step " + n + " of " + STEPS;
    $("coErr").hidden = true;
  }
  $("stepNext").addEventListener("click", function () {
    var m = stepMissing(STEP);
    if (m.length) { $("coErr").textContent = "Please add your " + m.join(", ") + "."; $("coErr").hidden = false; return; }
    showStep(Math.min(STEPS, STEP + 1));
    var first = document.querySelector('.cstep[data-step="' + STEP + '"] input'); if (first) first.focus({ preventScroll: true });
    $("checkout").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("stepBack").addEventListener("click", function () { showStep(Math.max(1, STEP - 1)); var first = document.querySelector('.cstep[data-step="' + STEP + '"] input'); if (first) first.focus({ preventScroll: true }); });
  (mqStep.addEventListener ? mqStep.addEventListener("change", function () { showStep(STEP); }) : mqStep.addListener(function () { showStep(STEP); }));

  $("bookBtn").addEventListener("click", openCheckout);
  $("barBook").addEventListener("click", openCheckout);
  $("backBtn").addEventListener("click", function () { $("bar").classList.add("on"); document.body.classList.add("has-bar"); $("results").scrollIntoView({ behavior: "smooth" }); });

  $("coForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (mqStep.matches && STEP < STEPS) { $("stepNext").click(); return; }
    var typed = $("cPromo").value.trim().toUpperCase();
    if (!$("promoBox").hidden && typed && typed !== S.promo) { applyPromo(); if (S.promo !== typed) { $("coErr").textContent = "Check the discount code, or clear it to continue."; $("coErr").hidden = false; return; } }
    var err = $("coErr"); err.hidden = true;
    var name = $("cName").value.trim(), phone = $("cPhone").value.trim(), email = $("cEmail").value.trim();
    var aF = $("cAddrFrom").value.trim(), aT = $("cAddrTo").value.trim(), missing = [];
    var digits = phone.replace(/\(0\)/g, "").replace(/\D/g, "");
    if (!name) missing.push("name");
    if (!/^(07\d{9}|447\d{9})$/.test(digits)) missing.push("UK mobile number (07…)");
    if (!aF) missing.push("collection address"); if (!aT) missing.push("delivery address");
    if (!$("cTerms").checked) missing.push("agreement to the booking terms");
    if (missing.length) { err.textContent = "Please add your " + missing.join(", ") + "."; err.hidden = false; return; }
    var pay = document.querySelector('input[name="pay"]:checked').value, q = current();
    S.ref = M.ref();
    var payTxt = { after: PAY.localDeposit ? "£" + PAY.localDeposit + " deposit, rest when done" : "Pay when done", deposit: M.money(tripDeposit(q.total)) + " deposit by card", full: "Pay in full by link", invoice: "Trade invoice" }[pay];
    var msg = "BOOKING REQUEST\n" + summaryText(q, [
      "Price lines: " + q.lines.map(function (l) { return l.label + " " + (l.amount < 0 ? "-" : "") + M.money(Math.abs(l.amount)); }).join("; "),
      "Payment: " + payTxt, "Name: " + name, "Mobile: " + phone + (email ? "\nEmail: " + email : ""),
      "Collect: " + aF + ($("cSlot").value ? " (time: " + $("cSlot").value + ")" : ""), "Deliver: " + aT + ($("cNotes").value.trim() ? "\nNotes: " + $("cNotes").value.trim() : ""),
      "Agreed to booking terms: yes (" + TERMS_VERSION + ")", "WhatsApp updates: " + ($("cUpdates").checked ? "yes" : "no"),
      "Sent: " + new Date().toLocaleString("en-GB")
    ]);
    M.postLead({ type: "booking", ref: S.ref, name: name, phone: phone, email: email, collect: aF, deliver: aT, from: S.fromText, to: S.toText,
      miles: S.miles, local: S.local, hours: q.hours, items: $("items").value, van: S.vanId, date: iso(S.date), flexible: S.flexible, helpers: S.helpers,
      payment: pay, price: q.total, termsVersion: TERMS_VERSION, whatsappUpdates: $("cUpdates").checked, message: msg, at: new Date().toISOString() });

    $("dRef").textContent = S.ref;
    $("dLine").textContent = van().name + ", " + (M.isToday(S.date) ? "today" : fmtDate(S.date)) + ", " + (S.local ? "about " : "") + M.money(q.total) + ". Thanks, " + name.split(" ")[0] + ".";
    var acts = '<a class="btn btn-wa" href="' + wa(msg) + '" target="_blank" rel="noopener">Send my booking request on WhatsApp</a>';
    if (pay === "deposit" && PAY.depositPaymentLink) {
      var link = PAY.depositPaymentLink + (PAY.depositPaymentLink.indexOf("?") > -1 ? "&" : "?") + "client_reference_id=" + encodeURIComponent(S.ref) + (email ? "&prefilled_email=" + encodeURIComponent(email) : "");
      acts = acts + '<a class="btn btn-go" href="' + esc(link) + '" target="_blank" rel="noopener">Pay ' + M.money(tripDeposit(q.total)) + " deposit</a>";
    }
    $("dActions").innerHTML = acts;
    $("dExtras").innerHTML = '<a href="' + icsHref() + '" download="M6-Freight-' + S.ref + '.ics">Add to my calendar</a> · <a href="' + esc(shareUrl()) + '">Link to this price</a>';
    var steps = [
      ["Send it to us", C.leadWebhookUrl ? "We've received your request. Tap the green button if you'd also like it in WhatsApp." : "Tap the green button to send it. Nothing reaches us until you do."],
      ["We confirm", "Your booking is confirmed when we reply on WhatsApp (we aim to within " + co.replyPromiseMinutes + " minutes, " + co.hours + ")" + (pay === "full" ? ", with your secure payment link." : pay === "deposit" && !PAY.depositPaymentLink ? ", with your deposit link." : ".")],
      ["Day before", (co.dayBeforePhoto ? "Driver photo, van and " : "Your ") + "arrival window. Change the date free up to " + P.freeChangeHours + "h before."],
      ["On the way", "A message when we're about 30 minutes away."],
      ["Done", (co.proofOfDelivery ? "Photo when it's delivered, then reply 'all received' on WhatsApp" : "Check everything's arrived, then reply 'all received' on WhatsApp") + (S.local ? ", then pay for the actual time." : ".")]
    ];
    $("dTimeline").innerHTML = steps.map(function (s, i) { return '<li><span class="n">' + (i + 1) + "</span><span><b>" + esc(s[0]) + "</b><br>" + esc(s[1]) + "</span></li>"; }).join("");
    $("checkout").hidden = true; $("results").hidden = true; $("done").hidden = false;
    $("bar").classList.remove("on"); document.body.classList.remove("has-bar");
    $("done").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (!C.driversWanted) document.querySelectorAll('a[href="drive.html"]').forEach(function (a) { var br = a.nextElementSibling; if (br && br.tagName === "BR") br.remove(); a.remove(); });

  /* ---------- extra stop, share link, calendar ---------- */
  $("addStop").addEventListener("click", function () { $("viaBox").hidden = false; this.hidden = true; $("via").focus(); });
  $("rmStop").addEventListener("click", function () { $("viaBox").hidden = true; $("via").value = ""; $("addStop").hidden = false; $("addStop").focus(); });
  function shareUrl() {
    var u = location.origin + location.pathname + "?from=" + encodeURIComponent(S.fromText) + "&to=" + encodeURIComponent(S.toText) + "&items=" + encodeURIComponent($("items").value) + "&date=" + iso(S.date) + (S.helpers ? "&helpers=" + S.helpers : "") + (S.via ? "&via=" + encodeURIComponent(S.viaText) : "");
    return u;
  }
  $("shareBtn").addEventListener("click", function () {
    var u = shareUrl(), msg = $("shareMsg");
    if (navigator.share) { navigator.share({ title: "My M6 Freight price", url: u }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { msg.textContent = "Link copied. It reopens this price."; }, function () { msg.textContent = u; });
    else msg.textContent = u;
  });
  function icsHref() {
    var d = S.date, p = function (n) { return String(n).padStart(2, "0"); }, ds = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    var e = new Date(d); e.setDate(e.getDate() + 1); var de = e.getFullYear() + p(e.getMonth() + 1) + p(e.getDate());
    var t = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//M6 Freight//Booking//EN", "BEGIN:VEVENT", "UID:" + S.ref + "@m6freight", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART;VALUE=DATE:" + ds, "DTEND;VALUE=DATE:" + de, "SUMMARY:M6 Freight " + S.ref + " (request - confirmed on WhatsApp)",
      "DESCRIPTION:" + (S.fromText + " to " + S.toText).replace(/[,;]/g, " ") + ". Time: " + ($("cSlot").value || "we confirm") + ". Contact 0" + co.phoneIntl.slice(2), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(t);
  }
  /* ---------- pre-filled links from the quote desk, or a remembered quote ---------- */
  var qs = new URLSearchParams(location.search);
  if (qs.get("from") && qs.get("to")) {
    $("from").value = qs.get("from"); $("to").value = qs.get("to"); $("items").value = qs.get("items") || "";
    var qd = qs.get("date");
    if (qd && /^\d{4}-\d{2}-\d{2}$/.test(qd)) { var qp = qd.split("-"), qdd = new Date(+qp[0], +qp[1] - 1, +qp[2]); if (qdd >= earliest()) { $("wPick").checked = true; pick.hidden = false; pick.value = qd; } else S.dateNote = true; } else if (qd) S.dateNote = true;
    if (qs.get("via")) { $("viaBox").hidden = false; $("addStop").hidden = true; $("via").value = qs.get("via"); }
    var qh = Math.max(0, Math.min(3, parseInt(qs.get("helpers"), 10) || 0));
    if (qh) S.pendingHelpers = qh;
    $("quoteForm").requestSubmit ? $("quoteForm").requestSubmit() : $("goBtn").click();
  }
})();
