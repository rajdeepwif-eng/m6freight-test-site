# M6 Freight website (v2)

A fast quote-and-book site. **v2 pricing:** local jobs (both ends inside the radius of `base`) are priced hourly and all-in, with a 2-hour minimum and 15-minute steps. Every other job is a fixed all-in trip price. There are no booking, item or stairs fees, and no "was/now" prices.

Also added in v2: a photo hero, a "send photos" WhatsApp route, a trade-account section, a return-trips board (`returnTrips` in config), the 14-day early-start consent in checkout, a reviews policy page and an opt-out line in the quote-desk replies.

 Customers see a fixed price in seconds with no sign-up. They pick a van and a day, then book with one of four payment options. Every booking reaches you on WhatsApp, already filled in.

## Files
| File | What it is |
| --- | --- |
| `index.html` | The customer site |
| `quote.html` | **Quote Desk** for you: paste a WhatsApp enquiry, get every van priced, and send a reply with a pre-filled booking link |
| `config.js` | **The only file you edit**: rates, vans, company details, payment links, opening hours |
| `engine.js` | Postcode lookup, item reader and pricing |
| `app.js`, `styles.css` | Site behaviour and design |
| `terms.html`, `privacy.html` | DRAFTS. A solicitor must approve them before go-live |

## Before go-live (in this order)
1. **Rates:** replace the placeholder van rates in `config.js` with your real ones. Test 5 recent jobs and check the site prices them the way you would.
2. **Deposit link:** in Stripe, go to Payment Links, create a £25 link and paste it into `depositPaymentLink`.
3. **Company details:** check the company number, registered office, VAT status and goods-in-transit cover.
4. **Promises:** keep "reply within 5 minutes" and "collected today" only if you can always deliver them. Advertising rules (ASA/CMA) require proof for these claims.
5. **Images:** the 3 photos in `img/` are AI-generated illustrations. Replace them with real photos of the van and jobs as soon as possible.
6. **Reviews:** add your real Google rating and review count. Never invent or copy reviews: fake reviews are banned under UK consumer law.
7. **Terms and privacy:** get the drafts checked by a solicitor.
8. **Optional:** set `leadWebhookUrl` to an n8n, Make or Zapier webhook. Every price viewed and every booking is then logged, even if the customer never presses WhatsApp.

## Hosting
- **GitHub Pages:** go to Settings, Pages, choose "Deploy from branch: main / root", then point m6freightuk.co.uk at it.
- **Firebase:** open the repo in Firebase Studio, or run `firebase init hosting` with the public dir `.` and then `firebase deploy`.
- Also redirect **m6freight.co.uk** to the live site. That address currently shows an error.

## Next step (phase 2)
Charge the exact total by card at checkout. This needs one small server function (Firebase Function or Stripe Checkout) to create the payment for the right amount. Until then, the "Pay in full" option sends the customer a Stripe link on WhatsApp.


## Council fixes (18 Nov 2026)
- **Bugs fixed:** trip time showing "NaN"; "3 seater sofa" being read as 3 sofas; loads over one Luton now get "send photos" instead of a price; past or blank dates rejected; helpers and the flexible discount reset on each new quote; old results hidden after a failed lookup; UK mobile number check; flexible discount can't be combined with same-day or weekend charges; quote desk uses local dates, reads town names and labels area estimates.
- **Claims reworded** (gate 6): "clear price" instead of "honest price"; "we aim to reply" instead of a guarantee; padding, driver photo and delivery photo now only show when switched on in config (`paddingStandard`, `dayBeforePhoto`, `proofOfDelivery`); "a message when we're 30 minutes away" instead of a call (never use a hand-held phone while driving).
- **Legal** (gate 5): the 14-day early-start box was removed until a solicitor decides whether Consumer Contracts Regs reg 28(1)(h) applies; trading disclosures added (registered in England and Wales, a slot for a trading address, complaints contact); booking messages now record the terms version and a timestamp.
- **Privacy:** fonts are self-hosted (no Google requests); nothing is stored in the browser; the privacy notice has been rewritten (draft).
- **Deposits:** a trip deposit is the higher of £25 or 20% of the price; `localDeposit` can be set if no-shows become a problem.

## Update 18 Nov 2026
- Hourly rates replaced with **market-based placeholders** (Wolverhampton directory average about £50/hr, range £32–£120; Hello Vans 1 mover from £40/hr, 2 movers from £60/hr, 2-hour minimum; Checkatrade UK average £64/hr). Per-mile placeholders were lowered to fit Homemove's £1–£2/mile range. They are still not his prices.
- Added `golive.html` (checklist), a favicon, WhatsApp/Facebook link previews, search-engine business data, a 404 page, and an "old enquiry" reply option in the quote desk.

## Update 18 Nov 2026 (later)
- On phones, checkout now goes one step per screen (details, then addresses, then payment), following the GOV.UK "one thing per page" pattern. Desktop still shows the whole form at once.
- WebP images: the hero is about 50% smaller and preloaded. Phone keyboards now match each field (number pad for phone numbers, capitals for postcodes).
- To add next (needs his accounts): a postcode-to-address lookup service, and Apple Pay/Google Pay deposits through Stripe Checkout.

## 18 Nov 2026: year-one build + 50-lead stress test
- Added (SAMPLE-labelled while `demoMode` is true): reviews, rating bar, stats strip, driver section, return-trips board, trade portal (trade.html), job tracking (track.html), 10 town pages (areas/), 2 price guides (guides/). golive.html now has a "SAMPLE content OFF" row — demoMode must be false before go-live.
- Stress test `tests/stress50.py`: 54 lead-to-booking scenarios (local, long trips, islands, weekend/same-day/flexible, helpers, oversize, bad postcodes/dates/phones, XSS, very long notes, mobile 3-step, links from the quote desk, town pages) plus engine checks. 54/54 pass. Quote desk → site link prices match on 5 sample jobs.
- Fixes from the test and council: ferry jobs (NI, IoW, IoM, Channel Is., Scottish islands, Scilly) no longer get a road price; old checkout closes on a new price and refreshes if helpers/date/van change; too-big loads lose the price-hold button; "estimated" (not "fixed") when only the postcode area is known; quote desk £NaN fixed, extra people reset, past dates blocked, town parsing; "N-bedroom house" and "a couple of" understood; Enter on a mobile step moves to the next step; claim wording matched to flags; 404 page fixed; benchmark figures corrected (HaMuch £50 avg, Hello Vans crew pricing; 15% return share marked ASSUMED).
- Added after comparing with the live MoveHive /drive page: collection time slots (past slots hidden for today), discount codes with end date and terms (config; TEST10 blocked at go-live), partner-driver page drive.html (WhatsApp only, documents seen in person; switch `driversWanted`), "owner drives" promise now says partners only with the customer's OK, privacy notice covers partner drivers and applicants, delivery sign-off = photo + "all received". Not added on purpose: marketplace, customer accounts, payment escrow (FCA payment-services risk), in-app chat, AI photo listing, vehicle transport. Suite now 56/56.
- "Elite" upgrade + council round 3: extra stop on the way (stop fee/time in config, ASSUMED), "Share or save this price" link, add-to-calendar file after booking, discount codes fixed (Enter applies, typed code applied on submit, removed with a message if the date is past its end, keeps a good code on a bad entry, uppercase-insensitive, hourly rate shown before discount), time slots work in minutes with 90-min notice and warn if a chosen slot disappears, drive.html mobile layout and duplicate numbers fixed, "+44 (0)7…" accepted, 6-character booking refs, "owner drives most jobs" when partner drivers are on, right-to-work and insurance wording corrected (rules widened to subcontractors from 1 Oct 2026; GIT cover varies by policy). Suite 59/59.
