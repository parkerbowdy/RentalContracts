# J-Town Rental — Connected Replacement, v1

REAL SUPABASE CONNECTION, NOT LOCAL-ONLY STORAGE
The app writes to the approved Supabase project using staff authentication,
RLS and server-side RPC functions. No fake sample items or local database.
The public publishable key in config.js is intentional; no service-role key
or manager PIN is included. Auth tokens are kept in sessionStorage (per tab).

FILES
index.html = rental price list and checkout
manager.html = item entry, settings, log, returns, PIN setup
app.js, config.js, theme.css, logo.png, _headers must stay with the HTML files.
The _headers file applies response headers only on hosts that support it.
Configure equivalent security headers on other hosts.

DEPLOYMENT
1. Keep source in GitHub; deploy the extracted folder using a suitable HTTPS
   business-application host. This package does not deploy itself.
2. In Supabase > Authentication > URL Configuration, set Site URL to your
   deployed HTTPS address. Add exact redirect URLs for index.html and
   manager.html (and directory root if you use it). Avoid broad wildcards.
3. Visit index.html. Sign in with the invited rental-app email and password.
4. If you have not set a password, use the password-setup/reset button after
   configuring redirect URLs. Open the latest email link in the same browser.
   Account links containing access tokens are handled and removed from URL.
5. On Manager: add ACTUAL prices, enter APPROVED terms, verify hours and set
   your 6–12 digit manager PIN privately. No placeholder terms are inserted.
6. Verify the complete flow using fictional records before real customer use.
   These checks write real cloud records. There is no record-deletion UI.

IMPLEMENTED
- Staff login; manager role enforced by backend.
- All active items visible below search, with 4hr,24hr,5day,deposit prices.
- 4hr/24hr/manual selection. Prices/deposits editable before signing.
- Quarter-hour checkout ceiling and open+30/closing due-back calculations.
- Edited preset due time becomes manual duration, retaining entered price.
- Barcode text parser for multiline U.S. AAMVA output. Expiration expects
  MMDDYYYY. Phone and LICENSE ISSUING STATE are manually confirmed.
- Customer lookup; reuse unexpired ID image; expired license needs new image.
- Brother scan-image upload or tablet photo; converted to JPEG for upload.
- Terms acceptance, signature capture, signature invalidation after edits,
  checkout transaction modal and atomic server-side checkout.
- Rental search with 50-record pagination, contract details, print.
- Return modal, exact RED overdue warning and Epicor review acknowledgment.
- Deposit-return reference required unless verified manager PIN + reason;
  no-deposit rentals do not require a deposit refund reference.
- Backend PIN hashing and failed-attempt limits. PIN set/change needs an
  active manager session; override PIN is never written into app files.
- Private uploaded images with 5-minute signed access links when viewed.
- Contract data, terms snapshot, signatures and ID images stored in cloud.

NOT YET IMPLEMENTED / LAUNCH CHECKS
- Separate automatically archived PDF file: NOT implemented. Contract is
  reconstructed from cloud snapshots and images; Print / Save PDF is local.
- Email delivery and auto-store-copy email: NOT implemented.
- Tablet-camera PDF417 decoding: NOT implemented. Use compatible keyboard-
  output scanner or manual data entry. Camera is available for ID PHOTO only.
- Direct Brother scanner control: NOT implemented; scan then attach image.
- Epicor integration: NOT implemented; staff enters references manually.
- Inventory availability/reservations and existing rental-board sync: absent.
- Holiday closures, after-the-fact signed-contract amendments, staff-invite
  interface, retention/deletion workflows, backup restoration and device
  session-management policies need implementation/configuration.
- Item name/number/details come from item record; edit them in Manager.
  Contract-specific item-description overrides are not implemented.
- Backend required signature-image upload is not independent identity or
  signature authenticity verification. Legal review of terms/signing process
  and Kentucky ID-image retention requirements remains necessary.
- Current checkout does not verify POS references against Epicor.
- Hours use Eastern local wall-clock day calculations; DST ambiguous/nonexistent
  entered times are rejected by the browser conversion helper.
- Return uses server time; the earliest initiated attempt in the prior five
  minutes is used while paperwork is completed. Cancellation cannot be used
  to undo a completed return.
- Current server code was migrated successfully and timing/hash self-checks
  passed. End-to-end authentication/upload/checkout/return, adversarial
  authorization, rate-limit/concurrency and cross-device testing have NOT been
  performed in this session. Do not treat this package as launch-certified.
- Session tokens are tab-scoped. Do not share a manager login with all staff.
  Create and authorize each staff account before use.
- Review host TLS/security headers, Supabase auth signup settings, login rate
  limits, MFA options and your backup/retention configuration before live use.

VERSION STATUS
This is a real connected implementation for deployment/acceptance testing,
not a claim that the full production system is live or audited. No backend
changes beyond your approved migrations were applied while building files.
