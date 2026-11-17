/* M6 Freight customer site — v2 (all-in hourly for local, fixed for trips) */
(function () {
  "use strict";
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
  var promises = ["No account needed", "Reply within " + co.replyPromiseMinutes + " min · " + co.hours, "Free date changes up to " + P.freeChangeHours + "h before"];
  $("promises").innerHTML = promises.map(function (p) { return '<span class="pill">' + esc(p) + "</span>"; }).join("");
  $("howLocal").textContent = "Jobs within " + C.base.localRadiusMiles + " miles of " + C.base.place + ": from £" + minRate + "/hr for van and driver, fuel and stairs included. " + P.minimumHours + "-hour minimum, then " + P.incrementMinutes + "-minute steps. The clock starts when we arrive at your door.";
  $("howAlways").textContent = "One all-in figure, no booking fees and no add-ons on the day. Free date changes up to " + P.freeChangeHours + " hours before.";
  $("faqHourly").textContent = $("howLocal").textContent + " We show you an estimate before you book; you pay for the actual time.";
  $("faqPay").textContent = "Local jobs: nothing until the job's done (" + PAY.payMethods + "). Fixed-price trips: a £" + PAY.tripDeposit + " refundable deposit holds the slot, the rest on the day. Trade accounts pay by invoice.";
  $("faqChange").textContent = "Change your date free up to " + P.freeChangeHours + " hours before. Your cancellation rights are set out in the booking terms.";
  if (co.goodsInTransitCover) $("faqIns").textContent = "Yes. Goods in transit are covered up to " + co.goodsInTransitCover + " per job" + (co.publicLiabilityCover ? ", with " + co.publicLiabilityCover + " public liability" : "") + ". Tell us about anything worth more before you book.";

  var tiles = [];
  if (co.ownerDriven) tiles.push(["The owner drives your job", "No call centre, no stranger. The person you message is the person who turns up" + (co.ownerFirstName ? ": " + co.ownerFirstName + "." : ".")]);
  tiles.push(["Driver photo the day before", "You'll know who's coming, in which van, and the arrival window."]);
  tiles.push(["Call 30 minutes out", "Plus a live map link on WhatsApp while we're on the way."]);
  tiles.push([co.goodsInTransitCover ? "Covered to " + co.goodsInTransitCover : "Proof at every step", co.goodsInTransitCover ? "Goods in transit insurance on every job." : "Photos at loading and delivery, sent to you."]);
  $("trustTiles").innerHTML = tiles.map(function (t) { return '<div class="tile"><b>' + esc(t[0]) + "</b><p>" + esc(t[1]) + "</p></div>"; }).join("");

  if (co.googleRating && +co.googleReviewCount >= 5) {
    $("reviews").hidden = false;
    $("revLine").innerHTML = "<b>" + esc(co.googleRating) + " ★</b> from " + esc(co.googleReviewCount) + " Google reviews" + (co.googleReviewsUrl ? ' · <a href="' + esc(co.googleReviewsUrl) + '" target="_blank" rel="noopener">Read them all on Google</a>' : "");
  }
  if (C.returnTrips && C.returnTrips.length) {
    $("returns").hidden = false;
    $("tripList").innerHTML = C.returnTrips.map(function (t) {
      var d = new Date(t.date + "T12:00:00");
      return '<div class="trip"><b>' + esc(t.from) + " → " + esc(t.to) + '</b><span class="small">' + esc(fmtDate(d)) + " · " + esc((C.vans.filter(function (v) { return v.id === t.van; })[0] || {}).name || "Van") + '</span><span class="tp tab">' + M.money(t.price) + '</span><a class="btn btn-wa" href="' + wa("Hi M6 Freight, I'd like the return trip " + t.from + " → " + t.to + " on " + fmtDate(d) + " at " + M.money(t.price) + ".") + '" target="_blank" rel="noopener">Book this trip</a></div>';
    }).join("");
  }
  $("fCompany").innerHTML = esc(co.legalName) + "<br>Company no. " + esc(co.companyNumber) + "<br>Registered office: " + esc(co.registeredOffice) + (co.vatRegistered ? "" : "<br>Not VAT registered");
  $("fContact").innerHTML = 'Phone / WhatsApp: <a href="tel:+' + co.phoneIntl + '">' + esc(co.phoneDisplay) + '</a><br>Email: <a href="mailto:' + esc(co.email) + '">' + esc(co.email) + "</a><br>" + esc(co.hours);

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
    if (w === "pick" && pick.value) { var p = pick.value.split("-"); d = new Date(+p[0], +p[1] - 1, +p[2]); }
    return d;
  }

  $("quoteForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("qErr"); err.hidden = true;
    var f = $("from").value.trim(), t = $("to").value.trim();
    if (!f || !t) { err.textContent = "Add where we collect from and where it's going."; err.hidden = false; return; }
    if (!$("items").value.trim()) $("items").value = "parcel";
    var btn = $("goBtn"); btn.textContent = "Working out your price…"; btn.disabled = true;
    Promise.all([M.locate(f), M.locate(t), BASE ? Promise.resolve(BASE) : M.locate(C.base.place)]).then(function (r) {
      btn.textContent = "Show my price →"; btn.disabled = false;
      if (!r[0] || !r[1]) { err.textContent = "We couldn't find " + (!r[0] ? '"' + f + '"' : '"' + t + '"') + ". Try a postcode, e.g. WV1 1AA."; err.hidden = false; return; }
      BASE = r[2];
      S.from = r[0]; S.to = r[1]; S.fromText = f; S.toText = t;
      S.miles = M.miles(r[0], r[1]);
      S.local = !!BASE && M.miles(BASE, r[0]) <= C.base.localRadiusMiles && M.miles(BASE, r[1]) <= C.base.localRadiusMiles;
      S.items = M.readItems($("items").value); S.vol = M.volume(S.items);
      S.vanId = M.bestVan(S.vol).id;
      S.date = chosenDate();
      if (!S.helpersTouched) S.helpers = M.needsTwo(S.items) ? 1 : 0;
      showResults(true);
      M.postLead({ type: "price_viewed", from: f, to: t, miles: S.miles, local: S.local, items: $("items").value, date: iso(S.date), price: current().total, van: S.vanId, at: new Date().toISOString() });
      try { localStorage.setItem("m6_last", JSON.stringify({ f: f, t: t, i: $("items").value })); } catch (x) {}
    });
  });

  function van() { return C.vans.filter(function (v) { return v.id === S.vanId; })[0]; }
  function quoteFor(v, d) { return M.price({ van: v, miles: S.miles, vol: S.vol, date: d || S.date, helpers: S.helpers, flexible: S.flexible, local: S.local }); }
  function current() { return quoteFor(van()); }

  function showResults(scroll) {
    var R = $("results"); R.hidden = false;
    $("rFrom").innerHTML = esc(S.from.label) + "<small>Collection</small>";
    $("rTo").innerHTML = esc(S.to.label) + "<small>Delivery</small>";
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
    var v = van(), best = M.bestVan(S.vol), q = current();
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
    $("bMode").textContent = S.local ? "Local · hourly, all-in" : "Trip · fixed price, all-in";
    $("bVan").textContent = v.name + " · just your job";
    $("bSub").textContent = S.local
      ? "Estimate for about " + hrs(q.hours) + " at £" + q.hourlyRate + "/hr. You pay for the actual time, in " + P.incrementMinutes + "-min steps." + (co.vatRegistered ? " Inc VAT." : "")
      : "Fixed price for the whole job" + (co.vatRegistered ? ", including VAT." : ". No VAT to add.");
    $("bWhen").textContent = (M.isToday(S.date) ? "Today" : fmtDate(S.date)) + (S.flexible ? " (±2 days, we confirm the day)" : "") + (S.local ? "" : " · about " + M.etaText(S.miles));
    var incl = ["Van and driver, only your goods on board", "Fuel, blankets, straps, any stairs", "Driver photo the day before, ETA on the day", "Photo when delivered"];
    if (co.goodsInTransitCover) incl.splice(2, 0, "Goods covered to " + co.goodsInTransitCover);
    $("bIncl").innerHTML = incl.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    $("bLines").innerHTML = q.lines.length > 1 ? q.lines.map(function (l) { return "<div><span>" + esc(l.label) + "</span><span>" + (l.amount < 0 ? "−" : "") + M.money(Math.abs(l.amount)) + "</span></div>"; }).join("") : "";
    $("bHold").textContent = "Price held for " + P.priceHoldHours + " hours · free date changes up to " + P.freeChangeHours + "h before.";
    $("waPrice").href = wa("Hi M6 Freight, please hold this price for me:\n" + summaryText(q, null));
    $("barVan").textContent = v.name + (S.local ? " · estimate" : " · fixed"); $("barPrice").textContent = M.money(q.total);
  }

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
    var itemsTxt = S.items.map(function (i) { return (i.qty > 1 ? i.qty + " x " : "") + i.name; }).join(", ");
    return [
      (S.ref ? "Ref " + S.ref + "\n" : "") + S.fromText + " → " + S.toText + " (" + S.miles + " miles)",
      "Items: " + itemsTxt,
      "Van: " + van().name + (S.helpers ? " + " + S.helpers + " helper(s)" : ""),
      "Date: " + fmtDate(S.date) + (S.flexible ? " (flexible ±2 days)" : ""),
      S.local ? "Price: approx " + M.money(q.total) + " (about " + hrs(q.hours) + " at £" + q.hourlyRate + "/hr, all-in)" : "Price: " + M.money(q.total) + " fixed, all-in"
    ].concat(extra || []).join("\n");
  }

  /* ---------- checkout ---------- */
  function within14(d) { return (dayStart(d) - dayStart(new Date())) / 864e5 < 14; }
  function openCheckout() {
    var q = current();
    $("checkout").hidden = false;
    $("sPrice").textContent = (S.local ? "≈" : "") + M.money(q.total);
    $("sSummary").innerHTML = "<div><b>" + esc(S.from.label) + "</b> → <b>" + esc(S.to.label) + "</b></div><div>" + esc(van().name) + " · " + S.miles + " miles</div><div>" + esc(M.isToday(S.date) ? "Today" : fmtDate(S.date)) + (S.flexible ? " (±2 days)" : "") + "</div><div class='note'>" + (S.local ? "Hourly estimate, all-in" : "Fixed price, all-in") + "</div>";
    var opts = S.local ? [
      { id: "after", t: "Pay when the job's done", tag: "No deposit", d: "Pay by " + PAY.payMethods + " at the end, for the actual time.", a: "£0 now" },
      { id: "invoice", t: "Trade account invoice", d: PAY.businessInvoiceDays + "-day terms for approved trade accounts.", a: "Account" }
    ] : [
      { id: "deposit", t: "£" + PAY.tripDeposit + " refundable deposit now", tag: "Holds your slot", d: "Card, Apple Pay or Google Pay on a secure Stripe page. The remaining " + M.money(Math.max(0, q.total - PAY.tripDeposit)) + " on the day.", a: M.money(PAY.tripDeposit) },
      { id: "full", t: "Pay in full", d: "We send a secure payment link for the exact amount on WhatsApp.", a: M.money(q.total) },
      { id: "invoice", t: "Trade account invoice", d: PAY.businessInvoiceDays + "-day terms for approved trade accounts.", a: "Account" }
    ];
    $("payOpts").innerHTML = opts.map(function (o, i) {
      return '<input type="radio" name="pay" id="p_' + o.id + '" value="' + o.id + '"' + (i === 0 ? " checked" : "") + '><label for="p_' + o.id + '"><span><b>' + esc(o.t) + (o.tag ? '<span class="tagb">' + esc(o.tag) + "</span>" : "") + '</b><span class="note">' + esc(o.d) + '</span></span><span class="amt tab">' + esc(o.a) + "</span></label>";
    }).join("");
    $("earlyBox").hidden = !within14(S.date);
    $("cAddrFrom").placeholder = "House number, street — " + S.fromText;
    $("cAddrTo").placeholder = "House number, street — " + S.toText;
    $("checkout").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { $("cName").focus({ preventScroll: true }); }, 500);
  }
  $("bookBtn").addEventListener("click", openCheckout);
  $("barBook").addEventListener("click", openCheckout);
  $("backBtn").addEventListener("click", function () { $("results").scrollIntoView({ behavior: "smooth" }); });

  $("coForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("coErr"); err.hidden = true;
    var name = $("cName").value.trim(), phone = $("cPhone").value.trim(), email = $("cEmail").value.trim();
    var aF = $("cAddrFrom").value.trim(), aT = $("cAddrTo").value.trim(), missing = [];
    if (!name) missing.push("name"); if (phone.replace(/\D/g, "").length < 10) missing.push("mobile number");
    if (!aF) missing.push("collection address"); if (!aT) missing.push("delivery address");
    if (!$("earlyBox").hidden && !$("cEarly").checked) missing.push("request to start within 14 days (tick the box, or pick a later date)");
    if (!$("cTerms").checked) missing.push("agreement to the booking terms");
    if (missing.length) { err.textContent = "Please add your " + missing.join(", ") + "."; err.hidden = false; return; }
    var pay = document.querySelector('input[name="pay"]:checked').value, q = current();
    S.ref = M.ref();
    var payTxt = { after: "Pay when done", deposit: "£" + PAY.tripDeposit + " deposit by card", full: "Pay in full by link", invoice: "Trade invoice" }[pay];
    var msg = "NEW BOOKING\n" + summaryText(q, [
      "Payment: " + payTxt, "Name: " + name, "Mobile: " + phone + (email ? "\nEmail: " + email : ""),
      "Collect: " + aF, "Deliver: " + aT + ($("cNotes").value.trim() ? "\nNotes: " + $("cNotes").value.trim() : ""),
      "Early start requested: " + ($("earlyBox").hidden ? "n/a" : "yes"), "WhatsApp updates: " + ($("cUpdates").checked ? "yes" : "no")
    ]);
    M.postLead({ type: "booking", ref: S.ref, name: name, phone: phone, email: email, collect: aF, deliver: aT, from: S.fromText, to: S.toText,
      miles: S.miles, local: S.local, hours: q.hours, items: $("items").value, van: S.vanId, date: iso(S.date), flexible: S.flexible, helpers: S.helpers,
      payment: pay, price: q.total, earlyStart: !$("earlyBox").hidden, whatsappUpdates: $("cUpdates").checked, message: msg, at: new Date().toISOString() });

    $("dRef").textContent = S.ref;
    $("dLine").textContent = van().name + ", " + (M.isToday(S.date) ? "today" : fmtDate(S.date)) + ", " + (S.local ? "about " : "") + M.money(q.total) + ". Thanks, " + name.split(" ")[0] + ".";
    var acts = '<a class="btn btn-wa" href="' + wa(msg) + '" target="_blank" rel="noopener">Send booking to M6 Freight on WhatsApp</a>';
    if (pay === "deposit" && PAY.depositPaymentLink) {
      var link = PAY.depositPaymentLink + (PAY.depositPaymentLink.indexOf("?") > -1 ? "&" : "?") + "client_reference_id=" + encodeURIComponent(S.ref) + (email ? "&prefilled_email=" + encodeURIComponent(email) : "");
      acts = '<a class="btn btn-go" href="' + esc(link) + '" target="_blank" rel="noopener">Pay £' + PAY.tripDeposit + " refundable deposit</a>" + acts;
    }
    $("dActions").innerHTML = acts;
    var steps = [
      ["Send it to us", C.leadWebhookUrl ? "We've got your booking. Tap the green button if you'd also like it in WhatsApp." : "Tap the green button. Your booking arrives on our WhatsApp, already filled in."],
      ["We confirm", "A real person confirms within " + co.replyPromiseMinutes + " minutes (" + co.hours + ")" + (pay === "full" ? " and sends your secure payment link." : pay === "deposit" && !PAY.depositPaymentLink ? " and sends your deposit link." : ".")],
      ["Day before", "Driver photo, van and your arrival window. Change the date free up to " + P.freeChangeHours + "h before."],
      ["On the way", "A call 30 minutes out and a live map link."],
      ["Done", "Photo when it's delivered" + (S.local ? ", then pay for the actual time." : ".")]
    ];
    $("dTimeline").innerHTML = steps.map(function (s, i) { return '<li><span class="n">' + (i + 1) + "</span><span><b>" + esc(s[0]) + "</b><br>" + esc(s[1]) + "</span></li>"; }).join("");
    $("checkout").hidden = true; $("results").hidden = true; $("done").hidden = false;
    $("bar").classList.remove("on"); document.body.classList.remove("has-bar");
    $("done").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- pre-filled links from the quote desk, or a remembered quote ---------- */
  var qs = new URLSearchParams(location.search);
  if (qs.get("from") && qs.get("to")) {
    $("from").value = qs.get("from"); $("to").value = qs.get("to"); $("items").value = qs.get("items") || "";
    if (qs.get("date")) { $("wPick").checked = true; pick.hidden = false; pick.value = qs.get("date"); }
    if (qs.get("helpers")) { S.helpers = parseInt(qs.get("helpers"), 10) || 0; S.helpersTouched = true; }
    $("quoteForm").requestSubmit ? $("quoteForm").requestSubmit() : $("goBtn").click();
  } else {
    try { var last = JSON.parse(localStorage.getItem("m6_last") || "null"); if (last) { $("from").value = last.f; $("to").value = last.t; $("items").value = last.i; } } catch (x) {}
  }
})();
