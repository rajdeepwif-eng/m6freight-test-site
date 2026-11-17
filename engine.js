/* M6 Freight pricing engine: postcode lookup, item reader, van picker, prices.
   Shared by the customer site (index.html) and the staff quote tool (quote.html). */
(function () {
  "use strict";
  var C = window.M6_CONFIG;

  /* ---------- 1. Places ---------- */
  // Fallback centroids by postcode area (used when the live postcode service can't be reached).
  var AREAS = {
    AB:[57.15,-2.09],AL:[51.75,-0.34],B:[52.48,-1.89],BA:[51.38,-2.36],BB:[53.75,-2.48],BD:[53.79,-1.75],BH:[50.72,-1.88],BL:[53.58,-2.43],
    BN:[50.82,-0.14],BR:[51.40,0.02],BS:[51.45,-2.59],BT:[54.60,-5.93],CA:[54.89,-2.93],CB:[52.20,0.12],CF:[51.48,-3.18],CH:[53.19,-2.89],
    CM:[51.74,0.47],CO:[51.89,0.90],CR:[51.37,-0.10],CT:[51.28,1.08],CV:[52.41,-1.51],CW:[53.10,-2.44],DA:[51.45,0.21],DD:[56.46,-2.97],
    DE:[52.92,-1.48],DG:[55.07,-3.61],DH:[54.78,-1.57],DL:[54.52,-1.55],DN:[53.52,-1.13],DT:[50.71,-2.44],DY:[52.51,-2.09],E:[51.53,-0.05],
    EC:[51.52,-0.09],EH:[55.95,-3.19],EN:[51.65,-0.08],EX:[50.72,-3.53],FK:[56.00,-3.78],FY:[53.82,-3.05],G:[55.86,-4.25],GL:[51.86,-2.24],
    GU:[51.24,-0.57],HA:[51.58,-0.34],HD:[53.65,-1.78],HG:[53.99,-1.54],HP:[51.75,-0.47],HR:[52.06,-2.72],HU:[53.74,-0.33],HX:[53.72,-1.86],
    IG:[51.56,0.08],IP:[52.06,1.16],IV:[57.48,-4.22],KA:[55.61,-4.50],KT:[51.41,-0.30],KY:[56.11,-3.16],L:[53.41,-2.98],LA:[54.05,-2.80],
    LD:[52.24,-3.38],LE:[52.64,-1.13],LL:[53.14,-3.79],LN:[53.23,-0.54],LS:[53.80,-1.55],LU:[51.88,-0.42],M:[53.48,-2.24],ME:[51.38,0.52],
    MK:[52.04,-0.76],ML:[55.78,-3.98],N:[51.57,-0.11],NE:[54.97,-1.61],NG:[52.95,-1.15],NN:[52.24,-0.90],NP:[51.59,-3.00],NR:[52.63,1.30],
    NW:[51.55,-0.17],OL:[53.54,-2.12],OX:[51.75,-1.26],PA:[55.85,-4.42],PE:[52.57,-0.24],PH:[56.40,-3.43],PL:[50.38,-4.14],PO:[50.82,-1.09],
    PR:[53.76,-2.70],RG:[51.45,-0.97],RH:[51.24,-0.20],RM:[51.58,0.18],S:[53.38,-1.47],SA:[51.62,-3.94],SE:[51.48,-0.06],SG:[51.90,-0.20],
    SK:[53.41,-2.15],SL:[51.51,-0.59],SN:[51.56,-1.78],SO:[50.90,-1.40],SP:[51.07,-1.79],SR:[54.91,-1.38],SS:[51.54,0.71],ST:[53.00,-2.18],
    SW:[51.46,-0.17],SY:[52.71,-2.75],TA:[51.02,-3.10],TD:[55.60,-2.80],TF:[52.68,-2.45],TN:[51.13,0.26],TQ:[50.46,-3.53],TR:[50.26,-5.05],
    TS:[54.57,-1.23],TW:[51.45,-0.34],UB:[51.53,-0.45],W:[51.51,-0.20],WA:[53.39,-2.59],WC:[51.52,-0.12],WD:[51.66,-0.40],WF:[53.68,-1.50],
    WN:[53.55,-2.63],WR:[52.19,-2.22],WS:[52.59,-1.98],WV:[52.59,-2.13],YO:[53.96,-1.08]
  };
  var TOWNS = {
    birmingham:"B",manchester:"M",liverpool:"L",leeds:"LS",sheffield:"S",nottingham:"NG",leicester:"LE",coventry:"CV",wolverhampton:"WV",
    walsall:"WS",dudley:"DY",london:"WC",bristol:"BS",cardiff:"CF",newport:"NP",swansea:"SA",newcastle:"NE",glasgow:"G",edinburgh:"EH",
    aberdeen:"AB",dundee:"DD",belfast:"BT",stoke:"ST","stoke-on-trent":"ST",derby:"DE",oxford:"OX",cambridge:"CB",southampton:"SO",
    portsmouth:"PO",brighton:"BN",york:"YO",hull:"HU",bradford:"BD",reading:"RG","milton keynes":"MK",northampton:"NN",peterborough:"PE",
    norwich:"NR",ipswich:"IP",exeter:"EX",plymouth:"PL",preston:"PR",blackpool:"FY",bolton:"BL",stockport:"SK",warrington:"WA",
    chester:"CH",crewe:"CW",telford:"TF",shrewsbury:"SY",worcester:"WR",gloucester:"GL",cheltenham:"GL",swindon:"SN",bath:"BA",
    luton:"LU",watford:"WD",huddersfield:"HD",halifax:"HX",wakefield:"WF",doncaster:"DN",sunderland:"SR",durham:"DH",middlesbrough:"TS",
    carlisle:"CA",lancaster:"LA",lincoln:"LN",wigan:"WN",oldham:"OL",blackburn:"BB",harrogate:"HG",salisbury:"SP",bournemouth:"BH",
    colchester:"CO",chelmsford:"CM",southend:"SS",canterbury:"CT",maidstone:"ME",guildford:"GU",crawley:"RH",tunbridge:"TN",
    "west bromwich":"B","sutton coldfield":"B",solihull:"B",cannock:"WS",stafford:"ST",lichfield:"WS",tamworth:"B",nuneaton:"CV",rugby:"CV"
  };

  var cache = {};
  function clean(s) { return String(s || "").trim().replace(/\s+/g, " "); }
  var FULL_PC = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;
  var OUT_PC  = /^([A-Z]{1,2}\d[A-Z\d]?)$/i;

  function fallback(q) {
    var s = clean(q).toLowerCase();
    var m = s.toUpperCase().match(/^([A-Z]{1,2})\d/);
    if (m && AREAS[m[1]]) return { lat: AREAS[m[1]][0], lng: AREAS[m[1]][1], label: s.toUpperCase(), approx: true };
    var keys = Object.keys(TOWNS).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      if (s.indexOf(keys[i]) !== -1) {
        var a = AREAS[TOWNS[keys[i]]];
        return { lat: a[0], lng: a[1], label: keys[i].replace(/\b\w/g, function (c) { return c.toUpperCase(); }), approx: true };
      }
    }
    return null;
  }

  function getJSON(url) {
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(t); return r.ok ? r.json() : null; })
      .catch(function () { clearTimeout(t); return null; });
  }

  function locate(q) {
    q = clean(q);
    if (!q) return Promise.resolve(null);
    var key = q.toLowerCase();
    if (cache[key]) return Promise.resolve(cache[key]);
    var api = "https://api.postcodes.io/";
    var p;
    var full = q.match(FULL_PC), out = q.match(OUT_PC);
    if (full) {
      p = getJSON(api + "postcodes/" + encodeURIComponent(full[1] + full[2])).then(function (j) {
        return j && j.result ? { lat: j.result.latitude, lng: j.result.longitude, label: j.result.postcode + ", " + (j.result.admin_district || "") } : null;
      });
    } else if (out) {
      p = getJSON(api + "outcodes/" + encodeURIComponent(out[1])).then(function (j) {
        return j && j.result ? { lat: j.result.latitude, lng: j.result.longitude, label: j.result.outcode + ", " + ((j.result.admin_district || [])[0] || "") } : null;
      });
    } else {
      p = getJSON(api + "places?limit=1&q=" + encodeURIComponent(q)).then(function (j) {
        var r = j && j.result && j.result[0];
        return r ? { lat: r.latitude, lng: r.longitude, label: r.name_1 + (r.county_unitary ? ", " + r.county_unitary : "") } : null;
      });
    }
    return p.then(function (res) {
      res = res || fallback(q);
      if (res) cache[key] = res;
      return res;
    });
  }

  function miles(a, b) {
    var R = 3958.8, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var straight = 2 * R * Math.asin(Math.sqrt(h));
    var f = straight > 100 ? (C.pricing.roadFactorLong || 1.15) : C.pricing.roadFactor;
    return Math.max(2, Math.round(straight * f));
  }

  /* ---------- 2. Item reader: "2 sofas, a fridge and 10 boxes" ---------- */
  var ITEMS = [
    ["corner sofa",2.6,1],["sofa bed",1.8,1],["3 seater",1.8,1],["three seater",1.8,1],["2 seater",1.3,0],["two seater",1.3,0],["sofa",1.6,1],["settee",1.6,1],["couch",1.6,1],
    ["armchair",0.6,0],["recliner",0.8,0],["office chair",0.3,0],["dining chair",0.2,0],["chair",0.25,0],
    ["king bed",1.8,1],["super king",2.0,1],["double bed",1.5,1],["single bed",0.9,0],["bunk bed",1.4,1],["bed frame",1.3,1],["mattress",0.6,0],["bed",1.4,1],
    ["double wardrobe",2.0,1],["wardrobe",1.5,1],["chest of drawers",0.6,0],["drawers",0.6,0],["bedside",0.15,0],["dresser",0.8,0],["sideboard",0.9,1],
    ["bookcase",0.6,0],["bookshelf",0.6,0],["shelving",0.5,0],["desk",0.6,0],["dining table",0.9,1],["coffee table",0.3,0],["table",0.7,0],
    ["american fridge",1.5,1],["fridge freezer",1.0,1],["fridge",0.7,0],["freezer",0.8,0],["washing machine",0.6,1],["washer",0.6,1],["dryer",0.6,1],
    ["dishwasher",0.5,0],["range cooker",1.0,1],["cooker",0.6,1],["oven",0.6,1],["microwave",0.08,0],["tv",0.3,0],["television",0.3,0],
    ["piano",1.6,1],["treadmill",1.2,1],["exercise bike",0.6,0],["bike",0.5,0],["bicycle",0.5,0],["motorbike",1.8,1],["motorcycle",1.8,1],
    ["mirror",0.15,0],["rug",0.2,0],["lamp",0.1,0],["plant",0.2,0],["bbq",0.5,0],["lawn mower",0.4,0],["tool chest",0.4,0],
    ["pallet",1.4,1],["crate",0.5,0],["parcel",0.05,0],["package",0.05,0],["envelope",0.005,0],["document",0.005,0],
    ["suitcase",0.12,0],["bag",0.06,0],["box",0.07,0],["boxes",0.07,0],["tyre",0.1,0],["tyres",0.1,0],["door",0.2,0],["radiator",0.1,0],
    ["boiler",0.25,0],["sink",0.2,0],["bath",0.8,1],["kitchen unit",0.5,0],["worktop",0.3,0],["plasterboard",0.05,0],["timber",0.1,0]
  ];
  ITEMS.sort(function (a, b) { return b[0].length - a[0].length; });
  var WORDNUM = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, fifteen:15, twenty:20, couple:2, few:3 };

  function readItems(text) {
    var parts = String(text || "").toLowerCase().replace(/&/g, ",").split(/,|\band\b|\+|\n|;|\//);
    var out = [];
    parts.forEach(function (raw) {
      var s = raw.replace(/[^a-z0-9 \-]/g, " ").replace(/\s+/g, " ").trim();
      if (!s) return;
      var qty = 1, m = s.match(/^(\d+)\s*x?\s*/);
      if (m) { qty = parseInt(m[1], 10) || 1; s = s.slice(m[0].length); }
      else {
        var w = s.split(" ")[0];
        if (WORDNUM[w]) { qty = WORDNUM[w]; s = s.slice(w.length).trim(); if (s.indexOf("of ") === 0) s = s.slice(3); }
      }
      var m2 = s.match(/\s+x\s*(\d+)$/); if (m2) { qty = parseInt(m2[1], 10); s = s.slice(0, m2.index); }
      var hit = null;
      for (var i = 0; i < ITEMS.length; i++) { if ((" " + s + " ").indexOf(" " + ITEMS[i][0]) !== -1 || s.indexOf(ITEMS[i][0]) !== -1) { hit = ITEMS[i]; break; } }
      if (hit) out.push({ name: s || hit[0], qty: Math.min(qty, 500), m3: hit[1] * Math.min(qty, 500), heavy: !!hit[2], known: true });
      else out.push({ name: s, qty: Math.min(qty, 500), m3: 0.3 * Math.min(qty, 500), heavy: false, known: false });
    });
    // merge duplicates
    var merged = {};
    out.forEach(function (it) { var k = it.name; if (merged[k]) { merged[k].qty += it.qty; merged[k].m3 += it.m3; } else merged[k] = it; });
    return Object.keys(merged).map(function (k) { return merged[k]; });
  }

  function volume(items) { return items.reduce(function (s, i) { return s + i.m3; }, 0); }
  function needsTwo(items) { return items.some(function (i) { return i.heavy; }); }

  function bestVan(m3) {
    for (var i = 0; i < C.vans.length; i++) if (m3 <= C.vans[i].capacityM3 * 0.9) return C.vans[i];
    return C.vans[C.vans.length - 1];
  }

  /* ---------- 3. Price (all-in: no item, stairs or booking fees) ---------- */
  function isToday(d) { var t = new Date(); return d.toDateString() === t.toDateString(); }
    // o: { van, miles, vol, date, helpers, flexible, local(bool) }
  function price(o) {
    var P = C.pricing, v = o.van, lines = [], total, hours = null;
    var d = o.date || new Date();
    if (o.local) {
      var mins = o.miles / P.localMph * 60 + Math.max(20, (o.vol || 0.5) * P.loadMinutesPerM3);
      hours = Math.max(P.minimumHours, Math.ceil(mins / P.incrementMinutes) * P.incrementMinutes / 60);
      var rate = v.hourly + (o.helpers || 0) * P.helperHourly;
      total = rate * hours;
      lines.push({ label: v.name + (o.helpers ? " + " + o.helpers + " helper" + (o.helpers > 1 ? "s" : "") : "") + " · £" + rate + "/hr all-in", amount: total });
    } else {
      var charged = o.miles * (1 + P.returnShare);
      total = Math.max(v.minimum, v.base + charged * v.perMile);
      lines.push({ label: v.name + " · " + o.miles + " miles, all-in", amount: total });
      if (o.helpers) { var h = o.helpers * P.helperTripFee; lines.push({ label: o.helpers + " extra " + (o.helpers > 1 ? "people" : "person"), amount: h }); total += h; }
    }
    if (isToday(d)) { var sd = total * P.sameDayPct / 100; lines.push({ label: "Same-day", amount: sd }); total += sd; }
    var day = d.getDay();
    if (day === 0 || day === 6) { var we = total * P.weekendPct / 100; lines.push({ label: "Weekend", amount: we }); total += we; }
    if (o.flexible) { var fx = -total * P.flexiblePct / 100; lines.push({ label: "Flexible-date saving", amount: fx }); total += fx; }
    lines.forEach(function (l) { l.amount = Math.round(l.amount); });
    total = lines.reduce(function (s, l) { return s + l.amount; }, 0);
    var hourlyRate = o.local ? Math.round(total / hours) : null;
    return { total: total, lines: lines, hours: hours, hourlyRate: hourlyRate, local: !!o.local };
  }

  function etaText(miles, date) {
    var P = C.pricing;
    var mins = Math.round(miles / P.avgMph * 60 + P.loadMinutes);
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h ? h + "h " : "") + m + "m door to door";
  }

  function money(n) { return "£" + Math.round(n).toLocaleString("en-GB"); }
  function ref() { var s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = ""; for (var i = 0; i < 5; i++) r += s[Math.floor(Math.random() * s.length)]; return "M6-" + r; }

  function postLead(payload) {
    if (!C.leadWebhookUrl) return;
    try { fetch(C.leadWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), mode: "no-cors" }).catch(function () {}); } catch (e) {}
  }

  window.M6 = { locate: locate, miles: miles, readItems: readItems, volume: volume, needsTwo: needsTwo, bestVan: bestVan,
    price: price, etaText: etaText, money: money, ref: ref, postLead: postLead, isToday: isToday };
})();
