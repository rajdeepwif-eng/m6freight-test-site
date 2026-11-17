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
    phoneDisplay: "07301 519319",
    phoneIntl: "447301519319",
    email: "info@m6freightuk.co.uk",             // CONFIRM
    hours: "7am–9pm, 7 days",
    replyPromiseMinutes: 5,                      // only if you can always keep it
    ownerDriven: true,                           // CONFIRM: true shows "The owner drives your job"
    ownerFirstName: "",                          // e.g. "Gurpreet" — shown on the site and WhatsApp messages
    vatRegistered: false,                        // CONFIRM
    goodsInTransitCover: "",                     // CONFIRM e.g. "£10,000" — "" hides it
    publicLiabilityCover: "",                    // CONFIRM e.g. "£1m" — "" hides it
    googleReviewsUrl: "",                        // your Google review link
    googleRating: "",                            // REAL rating only, e.g. "4.9" — shown once count >= 5
    googleReviewCount: "",                       // REAL count only
    arrivalWindowHours: 2,                       // arrival window you promise
    paddingStandard: true,                       // CONFIRM: blankets, wrap, door + floor protectors on every job (buy the kit first)
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
    { id: "small",  name: "Small van",  example: "Berlingo / Combo",  capacityM3: 3,  hourly: 45, base: 25, perMile: 1.30, minimum: 60 },
    { id: "medium", name: "Medium van", example: "Transit Custom",    capacityM3: 6,  hourly: 55, base: 30, perMile: 1.60, minimum: 75 },
    { id: "large",  name: "Large van",  example: "LWB Transit / Sprinter", capacityM3: 11, hourly: 65, base: 35, perMile: 2.10, minimum: 90 },
    { id: "luton",  name: "Luton van",  example: "Luton + tail-lift", capacityM3: 18, hourly: 75, base: 45, perMile: 2.40, minimum: 110 }
  ],

  pricing: {
    roadFactor: 1.22,          // straight-line miles x this ≈ road miles (checked: B'ham–Manchester 86 vs 87)
    roadFactorLong: 1.15,      // trips over ~100 straight-line miles run mostly on motorways (checked: Durham–Bishop's Stortford ≈ 245 vs OSRM 242)
    returnShare: 0.30,         // share of the empty return leg charged on trips
    minimumHours: 2,           // local hourly jobs
    incrementMinutes: 15,
    localMph: 20,              // town driving, for local time estimates
    loadMinutesPerM3: 12,      // loading + unloading time per m³, for estimates
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
    tripDeposit: 25,                 // refundable deposit to hold a fixed-price trip
    depositPaymentLink: "",          // CONFIRM: Stripe Payment Link for the deposit
    localPayAfter: true,             // local hourly jobs: nothing to pay until the job's done
    payMethods: "card, Apple Pay, Google Pay or bank transfer",
    businessInvoiceDays: 30
  },

  leadWebhookUrl: "",                // optional n8n / Make / Zapier webhook for every price + booking
  siteUrl: "https://rajdeepwif-eng.github.io/m6freight-test-site/"
};
