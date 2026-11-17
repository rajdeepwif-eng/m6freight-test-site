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
