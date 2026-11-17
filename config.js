/* =====================================================================
   M6 FREIGHT — SETTINGS (v2)
   The only file you need to edit. Every price, promise and company
   detail on the site comes from here.
   Anything marked  // CONFIRM  is a placeholder: check before go-live.
   ===================================================================== */
window.M6_CONFIG = {

  company: {
    tradingName: "M6 Freight",
    legalName: "M6 FREIGHTUK LTD",              // CONFIRM
    companyNumber: "17059854",                   // CONFIRM
    registeredOffice: "128 City Road, London, EC1V 2NX", // CONFIRM
    registeredIn: "England and Wales",
    tradingAddress: "",                          // CONFIRM: a real geographic address customers can write to (required by the E-Commerce Regs if the registered office is a formation/virtual address)
    phoneDisplay: "07301 519319",
    phoneIntl: "447301519319",
    email: "info@m6freightuk.co.uk",             // CONFIRM
    hours: "7am–9pm, 7 days",
    replyPromiseMinutes: 15,                     // "we aim to reply within X minutes" — never reply while driving
    ownerDriven: true,                           // CONFIRM: true shows "The owner drives your job"
    ownerFirstName: "",                          // e.g. "Gurpreet" — shown on the site and WhatsApp messages
    vatRegistered: false,                        // CONFIRM
    goodsInTransitCover: "",                     // CONFIRM e.g. "£10,000" — "" hides it
    publicLiabilityCover: "",                    // CONFIRM e.g. "£1m" — "" hides it
    googleReviewsUrl: "",                        // your Google review link
    googleRating: "",                            // REAL rating only, e.g. "4.9" — shown once count >= 5
    googleReviewCount: "",                       // REAL count only
    arrivalWindowHours: 2,                       // arrival window you promise
    paddingStandard: false,                      // true ONLY once you own blankets, wrap, door + floor protectors and use them on every job
    dayBeforePhoto: true,                        // CONFIRM: you WhatsApp a driver/van photo the day before every job
    proofOfDelivery: true,                       // CONFIRM: you photograph every delivery and send it
    damagePromise: "",                           // CONFIRM with insurer, e.g. "If we break it, we repair or replace it up to £500" — "" hides it
    claimReplyHours: 0,                          // e.g. 48 = "we reply to any damage report within 48h" — 0 hides it
    dbsChecked: false,                           // true only if the driver holds a current DBS check
    driverPhoto: "",                             // REAL photo path, e.g. "img/driver.jpg" — "" hides the Meet your driver section
    noCancellationsMonths: 0                     // e.g. 12 = "No cancellations by us in 12 months" — only if true
  },

  /* Where the van is based. Jobs with BOTH ends inside the radius are priced hourly (all-in);
     anything else gets a fixed all-in trip price. */
  base: { place: "Wolverhampton", localRadiusMiles: 25,      // CONFIRM
          towns: ["Wolverhampton", "Walsall", "Dudley", "West Bromwich", "Birmingham", "Telford", "Cannock", "Stafford", "Kidderminster", "Bridgnorth"] },

  /* Vans. hourly = all-in rate for van + driver (fuel, blankets, straps, stairs included).
     base/perMile/minimum = fixed trip pricing. CONFIRM every number. */
  vans: [
    // Hourly rates = MARKET-BASED PLACEHOLDERS (checked 18 Nov 2026), not his prices. CONFIRM.
    //  - Wolverhampton removals directory average ~£50/hr, range £32–£120 (hamuch.com, checked 18 Nov 2026)
    //  - Hello Vans Wolverhampton: 1 mover from £40/hr, 2 movers from £60/hr, 3 from £80/hr, 2-hour minimum
    //  - Checkatrade UK 2026: 1 man + van avg £64/hr (£35–£93); 2 men £78/hr
    // Per-mile (trips) = placeholders kept so the charged rate incl. return share stays inside
    //  Homemove's £1–£2/mile guide for 100+ mile jobs. Benchmark with 5 real local quotes.
    { id: "small",  name: "Small van",  example: "Berlingo / Combo",  capacityM3: 3,  hourly: 40, base: 25, perMile: 1.10, minimum: 60 },
    { id: "medium", name: "Medium van", example: "Transit Custom",    capacityM3: 6,  hourly: 45, base: 30, perMile: 1.30, minimum: 75 },
    { id: "large",  name: "Large van",  example: "LWB Transit / Sprinter", capacityM3: 11, hourly: 50, base: 35, perMile: 1.55, minimum: 90 },
    { id: "luton",  name: "Luton van",  example: "Luton + tail-lift", capacityM3: 18, hourly: 55, base: 45, perMile: 1.75, minimum: 110 }
  ],

  pricing: {
    roadFactor: 1.22,          // straight-line miles x this ≈ road miles (checked: B'ham–Manchester 86 vs 87)
    roadFactorLong: 1.15,      // trips over ~100 straight-line miles run mostly on motorways (checked: Durham–Bishop's Stortford ≈ 245 vs OSRM 242)
    returnShare: 0.15,         // ASSUMED - confirm: share of the empty return leg charged on trips (no source)
    minimumHours: 2,           // local hourly jobs
    incrementMinutes: 15,
    localMph: 20,              // town driving, for local time estimates
    loadMinutesPerM3: 12,      // loading + unloading time per m³, for local estimates
    loadMinutes: 30,           // loading + unloading allowance for trip time estimates
    helperHourly: 20,          // extra person, local jobs (per hour)
    helperTripFee: 45,         // extra person, fixed-price trips (per job)
    sameDayPct: 15,
    weekendPct: 10,
    flexiblePct: 12,           // real saving when the customer lets you pick a day within ±2 days
    sameDayCutoffHour: 14,
    avgMph: 42,
    priceHoldHours: 24,
    freeChangeHours: 48        // free date changes up to this many hours before
  },

  /* Return trips you're ALREADY driving — sold at a real discount. Leave [] to hide the section.
     Example: { from: "Durham", to: "Bishop's Stortford", date: "2026-11-23", price: 180, van: "large" } */
  returnTrips: [],

  payments: {
    tripDeposit: 25,                 // minimum deposit for a fixed-price trip
    tripDepositPct: 20,              // deposit = the higher of tripDeposit or this % of the price (protects a day's work)
    localDeposit: 0,                 // 0 = no deposit on local jobs (Buddy style). Set e.g. 20 if no-shows become a problem
    depositPaymentLink: "",          // CONFIRM: Stripe Payment Link for the deposit
    localPayAfter: true,             // local hourly jobs: nothing to pay until the job's done
    payMethods: "card, Apple Pay, Google Pay or bank transfer",
    businessInvoiceDays: 30
  },

  /* Cancellation: SOLICITOR TO CONFIRM. Dated van jobs may fall outside the 14-day cancellation right
     (Consumer Contracts Regs 2013 reg 28(1)(h)). This text is shown before booking. */
  cancellationPolicy: "Change your date free up to 48 hours before. Cancellation terms are in our booking terms (being finalised).",

  /* TEST SITE ONLY. demoMode shows clearly-labelled SAMPLE reviews, rating, stats, return trips and
     job tracking so you can see what the site looks like in a year. MUST be false before go-live:
     publishing invented reviews or stats is illegal under UK consumer law (DMCC Act 2024). */
  demoMode: true,
  sample: {
    rating: "4.9", reviewCount: "127",
    stats: [["1,200+", "jobs done"], ["98%", "on time"], ["15 min", "typical reply"], ["£0", "booking fees"]],
    reviews: [
      ["Sarah, Wolverhampton", 5, "Sofa from Marketplace collected the same afternoon. Price on the website was exactly what I paid."],
      ["Daniel, Walsall", 5, "Booked at 9pm, confirmed on WhatsApp before I'd put the kettle on. Turned up in the window he said."],
      ["Priya, Telford", 5, "Flat move, 2nd floor, no lift. Two hours as estimated, everything strapped and careful."],
      ["Mark, Dudley (trade)", 5, "We use them for furniture deliveries every week. One message and it's done, invoice at the month end."],
      ["Aisha, Birmingham", 4, "Great job on a student move. Running 20 minutes late but he messaged ahead."],
      ["Tom, Cannock", 5, "Moved a fridge freezer and washer to my new place. Clear price, no surprises."]
    ],
    trips: [
      { from: "Wolverhampton", to: "London", date: "+3", price: 145, van: "large" },
      { from: "Birmingham", to: "Manchester", date: "+5", price: 95, van: "medium" },
      { from: "Wolverhampton", to: "Bristol", date: "+8", price: 120, van: "large" }
    ]
  },

  leadWebhookUrl: "",                // optional n8n / Make / Zapier webhook for every price + booking
  siteUrl: "https://rajdeepwif-eng.github.io/m6freight-test-site/"
};
