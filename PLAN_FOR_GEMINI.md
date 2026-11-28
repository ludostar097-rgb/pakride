# PakRide — Next Plan (for Gemini to implement)

Audit date: 26 Nov 2026 · Audited commit: `36c80a0` · Planned by Claude, built by Gemini.

**How to use this file:** do the phases in order. Paste ONE prompt at a time into Gemini, let it finish, run the
"Check it's done" steps yourself, commit, then move to the next prompt. Don't paste several at once — big
multi-task prompts are how fake "✅ All gaps resolved" reports happen.

Always add this line to the end of every prompt you give Gemini:

> Do not mark anything as done unless it actually runs. Do not add mock data, fake fallbacks, demo codes, or
> "simulated" features. Show me the list of files you changed. Run `npm test` in backend and `npx tsc --noEmit`
> in both backend and frontend and paste the output.

---

## Where we stand (honest score)

| Area | Score | Summary |
|---|---|---|
| Idea & feature scope | 8/10 | Bidding, 0% commission, Urdu RTL, multi-city — strong and differentiated |
| Backend logic | 6/10 | State machine + paisa ledger are good; many endpoints don't check *who* is calling |
| Security | 2/10 | One click = admin. Fixed reset OTP `7788`. Default JWT secret. Not launchable |
| Data / infra | 3/10 | Single JSON file committed to git, wiped on Render redeploy |
| Real-time | 4/10 | Sockets + 3s polling both running; driver GPS never sent |
| UI look | 6/10 | Polished dark glass, but feels like a dashboard, not a ride app |
| Icons & buttons | 3/10 | Wrong icons, emoji mixed with icons, 84 of 100 buttons styled one-off, tiny tap targets |
| Mobile UX | 4/10 | Long scroll page; no full-screen map + bottom sheet like Uber/Careem/inDrive |

Typecheck passes and backend tests pass. Since then Gemini committed Phase 1.1 (frontend login only) — see
"Status update" below. Pricing: 4/10. Vehicle categories: 3 only, no Car Plus / Premium.

**Recommended order now:** ~~1.2~~ ✅ → **1.2b** → 1.3 → 0.2 → 0.1 (leftovers) → 2.1 → 2.5 → 2.6 → 2.2 → 2.4 → 0.3 → Phase 3 → 4 → 5.

---

## Status update — Claude re-audit of Gemini commit `35dfd1a` ("Phase 1.2"), 26 Nov

Gemini's own summary of this commit is mostly true this time. I re-ran the live attack test against the new code:
**20 of 29 checks pass (was 14 of 26).**

### Fixed and verified live ✅
| Check | Now |
|---|---|
| Another passenger opens someone else's ride | ✅ Blocked (403) |
| Stranger posts in a trip chat / rates a driver | ✅ Blocked (403), 0 of 5 ratings accepted |
| Reset code returned by the API | ✅ No longer returned; random 6-digit code, hashed, 5 min, 5 tries |
| Admin takeover with a guessed reset code | ✅ Blocked |
| Forged admin token with the old default secret | ✅ Rejected; server refuses to start without `JWT_SECRET` |
| 30 wrong passwords | ✅ Locked after 10 |
| Driver status "BANANA" | ✅ Rejected |
| Old login popup with `7788`, fake "APPROVED" driver profile, blank City Manager screen | ✅ Gone / fixed |
| Booking opens on Islamabad → Karachi | ✅ Destination now starts empty |

### Still failing ❌
| Check | Result | Fix in |
|---|---|---|
| Admin sets commission to 500% | ❌ Accepted — `PUT /api/admin/settings` still saves `req.body` as-is | Prompt 1.2b |
| PKR 1 car fare | ❌ Accepted | Prompt 2.6 (min 75% of suggested) |
| Book Islamabad → Karachi (1,528 km) | ❌ Accepted | Prompt 1.2b (60 km cap now), 2.6 |
| Book from Quetta (no zone) | ❌ Accepted, priced as D.G. Khan | Prompt 1.2b |
| Driver feed / new-ride broadcast shows passenger phone before a driver is chosen | ❌ Leaks | Prompt 1.2b + 1.3 |
| Anonymous socket hears every new ride (with phone) and every offer | ❌ Still open | Prompt 1.3 |
| Anonymous socket moves a driver to 0,0 | ❌ Still open | Prompt 1.3 |

### New problems found in this commit (not caught by tests)
1. **The Android app will be blocked by CORS.** `capacitor.config.json` uses `androidScheme: "http"`, so the
   app's origin is `http://localhost`, which is not in the allowed list. Login from the phone app will fail.
2. **Production has no admin account.** Seeding is now off in production (correct), but nothing else creates
   an admin, so on Render nobody can approve drivers.
3. **Rate limiter is mis-configured.** On start, express-rate-limit logs `ERR_ERL_KEY_GEN_IPV6` (IPv6 users
   can bypass it). Also `trust proxy` is not set, so on Render every user shares the proxy's IP.
4. **Forgot-password tells attackers which numbers have accounts** (404 "No account found").
5. **A driver can lock any ride on purpose** by typing 5 wrong PINs (ride goes to DISPUTED). Lock the PIN for
   10 minutes instead, and notify the passenger.
6. **The test suite writes into the real `backend/data/pakride_store.json`** (running `npm test` changes a
   tracked file). Tests must use a temporary data folder.
7. The driver screen now shows "Loading Driver Profile…" forever if the profile fails to load — needs an error
   message and a Retry button.
8. Dummies from Phase 0 still in place: dev quick-login buttons, "Use Demo Photo/Copy/CNIC", `★ 4.9 •
   Verified Captain`, `driverRating || 4.9`, "You Saved", ETA hard-coded to 4 min, 'CD 70' / 'KHI-0000'
   vehicle defaults, `'zone-karachi-jauhar'` fallback.

➡ **Next: Prompt 1.2b, then 1.3.** Then continue with the order at the bottom of this file.

### Prompt 1.2b — Finish the backend lockdown
```
In backend/src (and frontend/capacitor.config.json):
1. PUT /api/admin/settings: validate with zod. introductoryCommissionPercent 0–30, every other field typed
   and bounded; unknown keys rejected (.strict()). Write an audit event with old and new values.
2. Ride request + calculate-fare: if the pickup is not inside an active zone, return 400 "PakRide is not
   available here yet". Delete the "nearest zone anywhere in Pakistan" fallback in pricing.ts and the
   'zone-karachi-jauhar' fallback in server.ts. Reject trips longer than 60 km.
3. Never send passengerPhone to drivers before they are the selected driver: strip it from
   /api/rides/driver/feed and from the new_ride_available payload.
4. express-rate-limit: use the ipKeyGenerator helper in both keyGenerators (fixes ERR_ERL_KEY_GEN_IPV6) and
   add app.set('trust proxy', 1) for Render.
5. forgot-password: always return the same 200 message, whether or not the number has an account.
6. Ride PIN: after 5 wrong tries, block PIN entry for 10 minutes and notify the passenger. Do NOT move the
   ride to DISPUTED automatically.
7. Production admin: add a one-time script `npm run create-admin -- --phone 03XXXXXXXXX` that asks for a
   password and creates an ADMIN user. No admin is created automatically.
8. Android CORS: set capacitor androidScheme to "https", remove cleartext/allowMixedContent, and add
   "https://localhost" and "capacitor://localhost" to the default allowed origins.
9. Tests: point the store at a temp folder (e.g. env PAKRIDE_DATA_DIR) so `npm test` never changes
   backend/data/pakride_store.json. Add tests for 1, 2, 3, 5 and 6.
10. Frontend driver screen: if the profile fails to load, show an error and a Retry button, not an endless
   spinner.
```
**Check:** commission 500 → 400. Quetta pickup → "not available here yet". Server log has no
ERR_ERL_KEY_GEN_IPV6. `git status` is clean after `npm test`. Android app can log in.

---

## Vehicle categories — why there's no Car+ / Premium, and what to add

Right now the whole app has only 3 types: `CAR | MOTORCYCLE | RICKSHAW`, hard-coded in 12 files (types,
pricing, zones, booking card, driver setup, admin). Every car — a 2008 Mehran and a 2024 Civic — is the same
"Car" at the same price. Competitors in Pakistan split cars into tiers, and riders who want AC / a newer car
pay more. You should add tiers, but **as data, not as more hard-coding**, so you can add "XL" or "Ladies only"
later without code changes.

### Recommended category list (launch)

| Code | Name (EN / اردو) | Seats | Who qualifies (admin checks at verification) | Price vs Car |
|---|---|---|---|---|
| `BIKE` | Bike / بائیک | 1 | Motorcycle, 70cc+ | ~0.45× |
| `RICKSHAW` | Rickshaw / رکشہ | 3 | CNG/petrol auto-rickshaw | ~0.65× |
| `CAR_MINI` | Mini / منی | 4 | Small hatchbacks (Alto, Mehran, Wagon R, Cultus), any year 2010+ | ~0.85× |
| `CAR` | Car / کار | 4 | Sedans/hatchbacks 1000cc+, 2012+, working AC | 1.0× |
| `CAR_PLUS` | Car Plus / کار پلس | 4 | 1300cc+, **2017+**, AC required, clean interior, driver rating ≥ 4.6 | ~1.3× |
| `PREMIUM` | Premium / پریمیم | 4 | Civic, Corolla Altis Grande, Elantra, Sportage, Tucson etc., **2020+**, AC, rating ≥ 4.8, 50+ trips | ~1.8× |
| `XL` *(phase 2)* | XL / ایکس ایل | 6–7 | BR-V, APV, Hiace-type, 2015+ | ~1.5× |

Multipliers are **starting suggestions** — admin sets the real per-city prices. Rules:
- A driver is approved for ONE top tier, and may also accept rides from lower car tiers if they switch it on
  (e.g. a Premium driver can take Car Plus and Car rides). Never upward.
- Premium/Car Plus drivers must upload 4 photos of the car (front, back, interior front, interior back);
  admin decides the tier, not the driver.
- Tier auto-downgrades if rating drops below the threshold (admin notified).

### Prompt 2.5 — Vehicle categories as data
```
Replace the hard-coded VehicleCategory union ('CAR' | 'MOTORCYCLE' | 'RICKSHAW') with a database-driven
category system. Do NOT add more hard-coded strings in components.
Backend:
1. New table VehicleCategory: code, nameEn, nameUr, iconKey, seats, sortOrder, isActive,
   minYear, minEngineCc, requiresAc, minDriverRating, minCompletedTrips, requiresInteriorPhotos.
   Seed: BIKE, RICKSHAW, CAR_MINI, CAR, CAR_PLUS, PREMIUM (XL inactive). Migrate old 'MOTORCYCLE' -> 'BIKE'.
2. New table Tariff (per city x category): baseFarePaisa, perKmPaisa, perMinPaisa, minFarePaisa,
   isActive. Remove the baseFareCarPaisa/perKmMotoPaisa... columns from Zone.
3. DriverProfile gets: approvedCategoryCode (set by admin only), acceptLowerTiers: boolean,
   vehicle.engineCc, vehicle.hasAc, vehicle photos (front, back, interiorFront, interiorBack).
4. GET /api/categories?cityId= -> active categories with that city's tariff.
5. POST /api/rides/calculate-fare returns a price for EVERY active category in that city in one call.
6. Ride request validates the category is active in that city.
7. Driver feed: driver sees rides of their approved category, plus lower car tiers if acceptLowerTiers.
   BIKE and RICKSHAW never mix with car tiers.
8. Admin: approve driver INTO a category; nightly job downgrades drivers below minDriverRating.
Frontend:
9. BookingCard renders categories from the API (horizontal scroll list), each with its own custom SVG icon,
   name, seats, price, ETA. Default-select the cheapest car tier.
10. Driver signup: driver picks requested category, enters engine cc + AC + year, uploads interior photos
    when required. Shows "Requested: Premium — admin will confirm".
11. Admin "Categories & Prices" screen: edit category rules and the tariff table per city (inline-editable
    grid), with a preview calculator (distance + minutes -> fare for each category).
Tests: fare for each category, driver eligibility, lower-tier acceptance, inactive category rejected.
```

---

## Pricing audit

**How it works today:** `fare = base + perKm × max(distance, 1)`, rounded to PKR 5. Distance is a straight
line × 1.35. Time = distance × 3.5 min. Example (Karachi, Jauhar → Airport, 4.1 km): Car PKR 315, Bike
PKR 135, Rickshaw PKR 195.

**Problems:**
1. **No time component.** Karachi/Lahore traffic means a 5 km trip can take 10 or 40 minutes; drivers lose
   money in traffic. Need `perMin`.
2. **Distance is a guess** (×1.35 straight line). Can be off by 30–100% around rivers, canals, one-ways,
   cantonment roads. Use the real road distance/time (OSRM — already used for drawing the map).
3. **No floor on the passenger's offer.** PKR 1 is accepted. inDrive-style apps enforce a minimum
   (e.g. 70–80% of the suggested fare).
4. **No ceilings.** Driver counter-offer can be up to PKR 500,000; passenger "raise fare" has no limit and
   works even after the trip started.
5. **No distance or zone limits.** Intercity (1,528 km) accepted; areas outside every zone are priced with
   the nearest city's rates.
6. **Admin can only set car prices** when creating a zone; bike/rickshaw are hard-coded, and nothing can be
   edited after creation.
7. **Commission setting has no validation** (500% accepted). Also commission is recorded but cash is never
   collected from drivers — there's no driver wallet/dues for when commission goes above 0%.
8. **Cash marked "PAID" automatically** on completion; no driver confirmation "cash received", no dispute.
9. **Missing charges real apps have:** waiting time after free minutes, cancellation fee (after driver has
   arrived / after X minutes), tolls (motorway/expressway), airport pickup fee.
10. **Fuel price changes** (frequent in Pakistan) require code edits. Make perKm admin-editable per city, with
    a one-click "+X% to all tariffs in city" tool.

### Prompt 2.6 — Pricing engine
```
Rewrite backend/src/services/pricing.ts as a real pricing engine (works with Prompt 2.5 tables):
1. Route: get road distance (km) and duration (min) from OSRM on the backend. Cache by rounded coordinates
   for 10 minutes. If OSRM fails, return 503 "Couldn't calculate route, try again" — NO straight-line
   fallback.
2. suggestedFare = max(minFare, base + perKm*km + perMin*min), round to nearest PKR 10.
3. Limits (all admin-editable in Settings): max trip 60 km (city rides only), passenger offer must be
   >= 75% of suggested, driver counter <= 150% of suggested, passenger raise-fare max 3 times, each <= PKR 100,
   only while OFFERS_OPEN.
4. Pickup must be inside an ACTIVE zone; destination must be within the same city's service area.
   Otherwise 400 with a clear message.
5. Extra charges (admin-editable per city): free waiting 3 min then perWaitMinPaisa; cancellation fee when
   passenger cancels after driver ARRIVED or > 2 min after accepting; airport fee; tolls entered by driver
   with photo of receipt, added to final fare.
6. Final fare = agreed fare + waiting + tolls + airport fee. Show a breakdown on the receipt.
7. Cash flow: driver taps "Cash received PKR X" to complete; ledger status CASH_COLLECTED. Add driver dues
   balance = sum of commission owed (for when commission > 0), visible to driver and admin.
8. Settings validation with zod: commission 0–30%, all limits positive and sensible.
9. Admin "+X% all tariffs in this city" bulk tool (for fuel price changes), logged in the audit log.
Unit tests: each formula branch, each limit, each extra charge, rounding.
```

---

## Workflow & connection audit (what happens between screens)

| Flow | Works? | Problem |
|---|---|---|
| Sign up → use app | ⚠️ | No SMS verification; driver gets fake defaults |
| Login / logout | ✅ (new) | Placeholder looks pre-filled; CITY_MANAGER blank screen |
| Forgot password | ❌ | Code always 7788; anyone can reset anyone (incl. admin) |
| Driver onboarding → admin approval | ⚠️ | "Use Demo CNIC" buttons; docs stored inside the JSON DB; no reject reason shown to driver |
| Passenger books | ⚠️ | Wrong default route; no fare floor; no zone check |
| Driver sees request | ⚠️ | Works, but every logged-out socket sees it too; feed polls every 3s AND uses sockets |
| Offer → accept | ✅ | ETA always "4 min"; offers never expire on the server |
| Driver drives to pickup | ❌ | Driver GPS never sent → passenger map never moves; no "Arrived" step |
| PIN → start → complete | ✅ | Works |
| Chat / call | ⚠️ | Works, but strangers can read/post |
| Rating | ❌ | Anyone can rate any ride unlimited times; driver can't rate passenger |
| History / receipts | ❌ | No screen |
| Complaints / SOS follow-up | ❌ | API only, no screen |
| Admin dashboard | ⚠️ | Works; no complaints/audit tabs; no tariff editing |
| Server restart / redeploy | ❌ | JSON file DB; Render wipes it; seed resets admin password |
| Android APK | ❌ | No location permission; cleartext HTTP; no push notifications |

---

## Why the icons and buttons feel "not good"

You're right. Concretely:

1. **Wrong icons for the vehicles.** Motorcycle uses `Bike` (a *bicycle*). Rickshaw uses `Navigation` (a GPS
   arrow). Lucide has no rickshaw at all, so it was faked. (`BookingCard.tsx:191, 216`)
2. **Emoji mixed with line icons.** 45 emoji (🚗 🛺 🏍 🟢 🔴 📌 🎉 ✨ 🎯 🏁 ⚡) sit next to Lucide line icons. Emoji
   render differently on every phone (Samsung vs iPhone vs Windows) and look childish next to clean icons.
3. **No icon size system.** Icons appear at 9 different sizes (w-2.5 → w-9), mostly 14–16px — too small to read
   on a phone.
4. **No button system.** 100 buttons; only 16 use the shared `pak-btn` classes, 84 are hand-styled one at a
   time, so every button has slightly different padding, radius, height and colour.
5. **Tap targets too small.** Most buttons are ~28–32px tall with 12px text. Minimum should be 44–48px,
   especially for drivers using one thumb while in a car.
6. **Text too small.** 83 places use 10–11px text. Urdu Nastaliq at that size is unreadable.
7. **Too many effects.** Glow, blur, gradient, pulse and bounce all at once. Premium apps (Uber, Careem) are
   calm: flat surfaces, one accent colour, motion only when something changes.
8. **Five corner radii** (md, lg, xl, 2xl, 3xl) used randomly.
9. **Logo is just the letters "PR"** in a gradient square — no real brand mark.

---

## Every dummy / fake thing still in the app (full inventory, 26 Nov 2026)

You said: **no dummy things, everything working end to end.** This is the complete list. All of it must go.

### A. Fake logins and fake accounts
| # | What | Where |
|---|---|---|
| A1 | 6 demo personas, one-click login with password `pakride123` (incl. Admin) | `frontend/src/App.tsx:40-83, 238-289` |
| A2 | `mock-token-<id>` fallback tokens when not logged in | `App.tsx:136,283`, `PassengerView.tsx:71`, `DriverView.tsx:68`, `AdminView.tsx:66`, `LiveChatModal.tsx:33`, `VehicleManageModal.tsx:40` |
| A3 | First visit shows "Ali Khan" as logged in | `App.tsx:97` |
| A4 | Fake driver profile invented in the browser if the real one doesn't load (rating 4.9, 38 trips, plate `ISB-4921`, "Toyota Corolla") | `App.tsx:494-514` |
| A5 | Seed script creates 8 demo users and runs on **every** server start | `backend/src/seed.ts`, `server.ts:69` |
| A6 | "Switch Demo Role" text | `i18n/translations.ts:8` |

### B. Fake verification codes
| # | What | Where |
|---|---|---|
| B1 | Password reset code is always `7788`, returned by the API and shown on screen as "Simulation Note: Use Demo Code" | `server.ts:214-220`, `AuthModal.tsx:111,360-362` |
| B2 | No SMS is ever sent; sign-up has no phone verification at all | `server.ts` register route |

### C. Fake documents and vehicles
| # | What | Where |
|---|---|---|
| C1 | "Use Demo Photo", "Use Demo Copy", "Use Demo CNIC" buttons upload a drawn SVG instead of a real document | `driver/VehicleSetupCard.tsx:57, 263, 298, 333` |
| C2 | Vehicle defaults to "Honda CD 70", "Black", plate `KHI-0000` if the driver leaves fields blank | `server.ts:154-158, 860-863`, `VehicleSetupCard.tsx:34-35,121-122` |
| C3 | New drivers are always put in Karachi / Gulistan-e-Jauhar regardless of where they live | `server.ts:168-169` |

### D. Fake numbers shown to users
| # | What | Where |
|---|---|---|
| D1 | Driver card always shows "★ 4.9 • Verified Captain" — not the real rating | `passenger/ActiveRideCard.tsx:215` |
| D2 | Offers show rating 4.9 if missing | `passenger/IncomingOffersList.tsx:96` |
| D3 | Every offer says "4 mins away" — driver ETA is hard-coded to 4 | `DriverView.tsx:233`, `server.ts:572`, `IncomingOffersList.tsx:106` |
| D4 | New drivers start with a 5.0 rating | `server.ts:170` |
| D5 | "Today Net Cash" actually shows **all-time** totals | `EarningsCard.tsx`, `translations.ts:77`, `/api/driver/earnings` |
| D6 | "You Saved PKR X" = invented 20% of earnings vs a "competitor" | `EarningsCard.tsx:18` |
| D7 | Trip time = distance × 3.5 min; distance = straight line × 1.35 (fare is based on a guess) | `server.ts:342,421`, `pricing.ts:84-87` |
| D8 | If driver has no GPS, they're placed at a fixed Karachi point (24.918, 67.135) | `server.ts:509-510` |
| D9 | If pickup isn't in any zone, the ride is silently priced and labelled as Karachi Jauhar | `server.ts:330, 394-397`, `pricing.ts:39`, `ledger.ts:24` |

### E. Fake places
| # | What | Where |
|---|---|---|
| E1 | Hard-coded landmark lists for Karachi, Islamabad, Lahore, Multan, DG Khan (sent by `/api/zones`) | `shared/constants.ts:180-234` (both copies), `server.ts:256-266` |
| E2 | Booking opens with a preset pickup/destination (Islamabad → Karachi, 1,404 km, PKR 68,965) instead of your GPS | `PassengerView.tsx:41-48`, `services/geocoding.ts:265-300` |
| E3 | Add-Zone form has a prefilled Karachi preset | `admin/AddZoneModal.tsx:70` |

### F. Fake features (button exists, nothing real happens)
| # | What | Where |
|---|---|---|
| F1 | "Voice note" — just shows text for 4 seconds | `ActiveRideCard.tsx:67`, `translations.ts:63,156` |
| F2 | WhatsApp share links to `pakride.pk/track/<id>` — that page doesn't exist | `ActiveRideCard.tsx:62` |
| F3 | Passenger "live driver on map" — the driver app never sends GPS, so it never moves | `DriverView` (no `driver_location_update` emit) |
| F4 | JazzCash / Easypaisa payment code exists but nothing calls it; only cash works | `backend/src/services/ledger.ts:61` |
| F5 | Complaints / incidents API exists but there is **no screen** to report one or for admin to see them | `/api/complaints`, `/api/admin/complaints` (unused) |
| F6 | Ride history API exists but there is **no history screen** | `/api/rides/passenger/history` (unused) |
| F7 | Audit log API exists, no admin screen | `/api/admin/audit` (unused) |
| F8 | Driver can't rate passenger; passenger rating isn't checked (can rate any ride, many times) | `server.ts:743` |
| F9 | "Verified Captain" label shown without checking verification | `ActiveRideCard.tsx:215` |
| F10 | Offer 3-minute expiry only counted in the browser; server never expires offers | `server.ts:575` |

### G. Fake data store
| # | What | Where |
|---|---|---|
| G1 | Whole database is one JSON file committed to git; tests write into it | `backend/data/pakride_store.json` |
| G2 | Reset codes kept only in memory — lost on restart | `server.ts:204` |
| G3 | Render "keep-alive" self-ping to stay awake on the free plan | `server.ts:1060-1076` |

---

## PHASE 0 — Remove every dummy (paste these first)

### Prompt 0.1 — Remove dummies from the frontend
```
PakRide frontend: remove every dummy, demo, mock and fake value. Real data only. If real data is missing,
show an empty state or an error with a Retry button — NEVER invent a value.
1. App.tsx: delete DEMO_PERSONAS, handleSwitchApp, handleSwitchAccount, the Passenger/Driver/Admin tabs,
   the persona dropdown, the fake driverProfile fallback (lines ~494-514), and every `mock-token-` fallback
   in all components. No token = show the login screen.
2. AuthModal.tsx: remove demoOtpHint and the "Simulation Note / Use Demo Code" box.
3. VehicleSetupCard.tsx: delete SAMPLE_BIKE_DOC and the "Use Demo Photo / Copy / CNIC" buttons. Driver must
   take or pick a real photo (Capacitor Camera on Android, file input on web). All vehicle fields required,
   no "Honda CD 70" defaults.
4. ActiveRideCard.tsx: show the driver's real rating from the ride (driverRating) and show "Verified" only if
   the backend says the driver is APPROVED. Remove the fake voice-note button. Remove the WhatsApp link until
   the real tracking page exists (Phase 5).
5. IncomingOffersList.tsx: no 4.9 fallback — if a driver has no ratings show "New". ETA must come from the
   offer (real), no `|| 4`.
6. EarningsCard.tsx: remove "You Saved" 20% calculation. Show real Today / This week / All time from the API.
7. PassengerView.tsx + geocoding.ts: delete defaultHubs and preset city lists. Pickup = user's GPS
   (reverse-geocoded). Destination starts EMPTY. Quick places = only the user's own recent/saved places.
8. AddZoneModal.tsx: remove the Karachi preset; empty form.
9. translations.ts: remove switchRole, audioSimulatedMsg and any demo wording.
10. Delete KARACHI_LANDMARKS, ISLAMABAD_LANDMARKS, LAHORE_LANDMARKS, MULTAN_LANDMARKS, DGKHAN_LANDMARKS from
    frontend/src/shared/constants.ts.
After you finish, this search must return ZERO results in frontend/src:
  demo|Demo|mock|Mock|simulat|Simulat|DEMO_PERSONAS|pakride123|7788|LANDMARKS|ISB-4921|KHI-0000|'CD 70'|4\.9
```

### Prompt 0.2 — Remove dummies from the backend
```
PakRide backend: remove every dummy and silent fallback. Real data or a clear error — never an invented value.
1. server.ts: remove the seedDemoData() call. Move seed.ts to backend/scripts/seed-dev.ts, run only via
   `npm run seed:dev`, refuse to run if NODE_ENV=production. Create the first admin with a one-time script
   `npm run create-admin -- --phone X` that asks for a password; no hard-coded password anywhere.
2. Forgot password: remove '7788' and demoOtp. Random 6-digit code, hashed, 5-minute expiry, stored in the
   DB, sent via SmsService. Add phone OTP verification to registration too.
3. Register: no vehicle defaults ('Honda', 'CD 70', 'Black'), no default city/zone — the driver picks a
   city from active cities; vehicle fields required when submitting documents; new driver rating = null
   (shown as "New"), ratingCount 0.
4. /api/driver/vehicle: remove 'Honda' / 'CD 70' / 'KHI-0000' fallbacks; return 400 for missing fields.
5. Remove every `|| 'zone-karachi-jauhar'`, `|| 'city-karachi'`, `|| 24.918`, `|| 67.135` fallback.
   If pickup is not inside an ACTIVE zone, return 400 "PakRide is not available here yet".
   If the driver has no GPS, return 400 "Turn on location".
6. Offer ETA: calculate from the driver's real GPS to pickup using OSRM, not `etaMinutes || 4`.
7. Ride distance/time and fare: use OSRM road distance and duration, not haversine x1.35 and x3.5.
8. /api/driver/earnings: return today, thisWeek and allTime separately (Pakistan time zone).
9. Remove the LANDMARKS constants and their fields from GET /api/zones.
10. Remove the Render keep-alive self-ping.
11. Tests must create their own data in a separate test DB/file and never touch backend/data.
After you finish, this search must return ZERO results in backend/src (excluding tests):
  demo|Demo|mock|simulat|Simulat|7788|pakride123|LANDMARKS|'Honda'|'CD 70'|KHI-0000|24\.918|67\.135|\|\| 4\b
```

### Prompt 0.3 — Finish the half-built features (end to end)
```
These PakRide features have a backend but no working screen, or a screen but no backend. Build each one
fully, front to back, with real data:
1. Ride history (passenger): list from /api/rides/passenger/history, tap for receipt (route, fare, driver,
   time). Driver trip history too (new endpoint).
2. Complaints: "Report a problem" on a completed or active ride -> POST /api/complaints. Admin
   "Complaints" tab: list, change status (INVESTIGATING / RESOLVED / DISMISSED), add resolution notes.
3. Admin audit log tab from /api/admin/audit with filters.
4. Two-way rating: passenger rates driver AND driver rates passenger, once per ride, only after COMPLETED.
5. Live driver location: driver app sends GPS every 5s while online; passenger sees the car move and ETA
   update after a driver is assigned.
6. Server-side offer expiry: offers become EXPIRED after 3 min; ride with no accepted offer after 10 min
   becomes CANCELLED (reason: no captains), both apps notified.
7. Driver "Arrived at pickup" step (new status ARRIVED) so the passenger is notified.
8. Payments: keep CASH only for launch and REMOVE the JazzCash/Easypaisa stub code, OR integrate the real
   JazzCash sandbox fully (checkout, callback with hash verification, refund). Don't leave half of it.
```

---

## PHASE 1 — Security & trust (~1 week, right after Phase 0)

### Prompt 1.1 — Remove the demo backdoor (skip if Prompt 0.1 already did all of this)
```
In the PakRide repo, remove the demo persona system from the production build:
- In frontend/src/App.tsx delete DEMO_PERSONAS, handleSwitchApp, handleSwitchAccount and the
  Passenger/Driver/Admin header tabs and persona dropdown. Wrap them in `if (import.meta.env.DEV)` only if I
  still need them locally.
- Remove every `mock-token-${...}` fallback (App.tsx, PassengerView, DriverView, AdminView, LiveChatModal,
  VehicleManageModal). If there is no real token, show the login screen.
- On first load with no token, show a Login / Sign-up screen, not "Ali Khan".
- After login, route by role: PASSENGER -> passenger app, DRIVER -> driver app, ADMIN -> admin app.
  A passenger must never see driver or admin UI.
- Remove the demo passwords table from README.md.
```
**Check it's done:** open the site in a private window → you see a login screen. No "Admin Console" tab
anywhere. Log in as passenger → no driver/admin UI.

### Prompt 1.2 — Lock down the backend
```
In backend/src:
1. auth.ts: if process.env.JWT_SECRET is missing, throw on startup (no default secret).
2. server.ts: only call seedDemoData() when NODE_ENV !== 'production'. Seed must never overwrite an existing
   user's passwordHash.
3. Forgot password: generate a random 6-digit OTP with crypto.randomInt, never return it in the response, store
   a hash of it, expire in 5 minutes, max 5 attempts. Add an SmsService interface with a console
   implementation for dev (real provider comes later).
4. Add express-rate-limit: login & register 10/15min per IP+phone, forgot/reset 5/hour, ride PIN attempts
   max 5 per ride then lock.
5. Ownership checks:
   - GET /api/rides/:id -> only passenger, assigned driver, or admin. Drivers who are not assigned see no
     passengerPhone and no verificationOtp.
   - GET/POST /api/rides/:id/chat -> only passenger or assigned driver; max 500 chars.
   - POST /api/rides/:id/rate -> only the passenger, only when status COMPLETED, only once, rating 1–5.
   - POST /api/admin/drivers/:userId/approve -> status must be one of APPROVED, SUSPENDED, REJECTED,
     UNDER_REVIEW.
   - bump-fare only while status is OFFERS_OPEN, max +500 PKR per bump.
6. Validate every request body with zod (already installed). Return 400 with clear messages.
7. Lock CORS to the frontend URL from env (FRONTEND_URL), not '*'.
Add tests for each of these in backend/src/tests/security_and_persistence.test.ts.
```
**Check:** start backend without JWT_SECRET → it refuses to start. Forgot-password response has no code in it.

### Prompt 1.3 — Secure the real-time socket
```
In backend/src/server.ts Socket.io:
- Require the JWT in the handshake (socket.handshake.auth.token). Reject connections without a valid token.
- Join the user's room automatically from the token (user:<id>). Delete the 'join_user_room' event so
  nobody can join someone else's room.
- driver_location_update: ignore driverId from the client; use the token's userId; only accept if role is
  DRIVER and online. Throttle to 1 update / 3s.
- Send driver position ONLY to the passenger of that driver's active ride, not io.emit to everyone.
- new_offer_received: send only to user:<passengerId>. Remove the global io.emit.
- new_ride_available: send only to online approved drivers in the same city with the matching vehicle
  category (use rooms like city:<id>:cat:<CAR>).
Update the frontend socket connection to pass auth: { token }.
```

---

## PHASE 2 — Make it real (~1–2 weeks)

### Prompt 2.1 — Real database
```
Replace backend/src/db/store.ts (JSON file) with PostgreSQL using Prisma. Keep the same public method names so
server.ts changes are minimal. Models: User, DriverProfile, Vehicle, Ride, Offer, ChatMessage, LedgerEntry,
Complaint, Zone, AuditEvent, Settings. Money stays integer paisa. Make selectOfferAtomically a real DB
transaction with a WHERE status IN ('REQUESTED','OFFERS_OPEN') guard. Remove backend/data/pakride_store.json
from git and add it to .gitignore. Tests must use a separate test database, never the dev data.
Driver document images (CNIC, license, photo) go to Cloudinary or S3 — store only the URL in the DB.
```

### Prompt 2.2 — Real GPS and live tracking
```
- Add @capacitor/geolocation. Add ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION to AndroidManifest.xml.
- Driver app: while online, send location every 5s via socket 'driver_location_update'.
- Passenger app: when a driver is assigned, show the driver's moving car marker on the map and a live ETA.
- Remove capacitor.config.json "cleartext": true and "allowMixedContent": true; use HTTPS backend URL.
```

### Prompt 2.3 — Real pricing and sane limits (SKIP — replaced by Prompts 2.5 + 2.6 above)
```
- Calculate distance and duration from OSRM road route on the backend (cache results), not straight-line x1.35.
- Reject ride requests over 60 km or with pickup outside an active zone, with a clear message.
- Default the booking screen to the user's GPS location as pickup and an EMPTY destination
  (currently it defaults to Islamabad -> Karachi, 1404 km, PKR 68,965).
- Expire offers on the server after 3 minutes (status EXPIRED) and broadcast it.
```

### Prompt 2.4 — Remove double updates and fake features
```
- Remove the 3-second polling in PassengerView and DriverView; use socket events only, plus one refetch on
  socket reconnect.
- Fix socket.off(event) calls to pass the exact handler function so they stop removing App-level listeners.
- Remove the fake "voice note" button and the WhatsApp link to pakride.pk/track (page doesn't exist) until
  a real public trip-tracking page is built.
- Replace every alert() and console.error-only failure with a visible error message to the user.
```

---

## PHASE 3 — Design system: icons, buttons, look (~1 week)

Do this BEFORE the screen redesign in Phase 4, so all new screens use the system.

### Prompt 3.1 — Design tokens
```
Create a real design system for PakRide in frontend/tailwind.config.js and src/index.css. Rules:
- Colours: one brand green (#00A859) for primary actions only; neutral greys for everything else;
  semantic colours: success green, warning amber, danger red, info blue. Define light and dark values.
- Remove all glow, animated blur blobs, animate-pulse and animate-bounce from normal UI. Motion only on
  state change (150–250ms ease-out). Respect prefers-reduced-motion.
- Surfaces: solid backgrounds (no backdrop-blur) except the bottom sheet over the map.
- Radius scale: 8px (inputs, chips), 12px (buttons), 16px (cards), 24px (bottom sheet). Nothing else.
- Type scale: 12 caption, 14 body, 16 body-large, 18 title, 22 heading, 28 fare/price. Minimum 12px
  anywhere; Urdu minimum 14px with line-height 1.8. Delete every text-[10px], text-[11px], text-[9px].
- Spacing on a 4px grid.
```

### Prompt 3.2 — One Button component
```
Create frontend/src/components/ui/Button.tsx and replace ALL 100 <button> elements in the app with it.
Variants: primary (solid green), secondary (outlined/neutral), ghost (text only), danger (red).
Sizes: lg = 56px tall (main actions like "Find Captain", "Accept", "Start Trip"),
       md = 48px (default), sm = 40px (chips like +20/+50). Nothing under 40px; icon-only buttons 48x48.
States: hover, pressed (scale 0.98), disabled (40% opacity, no pointer), loading (spinner + disabled).
Full-width option for bottom-of-screen actions. Visible focus ring for keyboard.
Icon slot left/right with 8px gap, icon size 20px. Works in RTL (Urdu) — use gap and logical
properties (ms-/me-), not space-x and ml-/mr-.
Also create IconButton.tsx, Chip.tsx (for +20/+50/+100 and quick notes) and Badge.tsx.
```

### Prompt 3.3 — Fix the icons
```
Icon rules for PakRide:
- Use ONE icon set only: lucide-react, stroke width 2, sizes 16 (inline text), 20 (buttons/lists),
  24 (nav/headers). Remove every emoji from the UI (🚗 🛺 🏍 🟢 🔴 📌 🎉 ✨ 🎯 🏁 ⚡) and replace with icons or
  plain text.
- Vehicle category icons: create custom SVG components in src/components/icons/ — BikeIcon (motorbike),
  RickshawIcon, MiniCarIcon (small hatchback), CarIcon (sedan), CarPlusIcon (sedan + small star/AC badge),
  PremiumIcon (executive sedan/SUV silhouette), XlIcon (7-seater van) — all drawn in the same 24x24, 2px
  stroke, rounded line style as Lucide, so they match. Map them by category.iconKey from the API.
  Do NOT use Lucide `Bike` (that's a bicycle) or `Navigation` for rickshaw.
- Status dots: use a small coloured circle element, not 🟢/🔴 emoji.
- Map markers: custom SVG pins — green pickup dot, dark destination square, top-down car icon for drivers,
  rotated to heading.
- Replace the "PR" letters logo with a simple SVG mark (e.g. a stylised road/pin shape) + "PakRide"
  wordmark. Generate app icon and splash from it for Android.
```

**Check for Phase 3:** search the code for `text-[10px]`, `🚗`, `<Bike`, `animate-bounce` → zero results.
Every button is `<Button ...>`.

---

## PHASE 4 — Ride-app UX redesign (~2 weeks)

### Prompt 4.1 — Passenger app shell
```
Redesign the passenger app as a mobile-first ride app (like Careem/inDrive, but our own design):
- Full-screen map. Small top bar: menu button (left), nothing else. No theme/language toggles in the header —
  move them to Settings.
- Draggable bottom sheet with these states:
  1. Idle: "Where to?" big search field + saved places (Home, Work) + recent places.
  2. Choose ride: 3 vehicle cards (custom icons, price, ETA, seats) in a horizontal row, fare stepper with
     -/+ and chips, payment = Cash, one big "Find a captain" button (56px, full width).
  3. Searching: radar animation on map, offers slide in as cards with Accept / Decline, timer bar, "Raise
     fare" chip, Cancel.
  4. Driver assigned: driver photo, name, rating, car + plate in large text, PIN in large digits, Call / Chat
     / Share / SOS as 4 equal icon buttons.
  5. In trip / Completed: fare receipt + rating stars.
- Side menu: Ride history, Saved places, Profile, Language (English / اردو), Theme, Help, Logout.
- All text from translations.ts, full RTL check in Urdu.
```

### Prompt 4.2 — Driver app shell
```
Redesign the driver app for one-thumb use in a car:
- Full-screen map, big Online/Offline switch at the bottom (64px).
- Incoming request = full-width card with pickup distance, trip distance, passenger offer in 28px text,
  three big buttons: Accept (green), counter chips (+20 +50 +100), Skip.
- Active trip: one huge primary button that changes label: "Arrived" -> "Enter PIN & Start" -> "Complete
  trip". Navigation button opens Google Maps.
- Earnings as a separate tab, not on the main screen.
- High-contrast, large Urdu text by default for drivers.
```

### Prompt 4.3 — Admin as a separate site
```
Move the admin console to its own route /admin with its own login, desktop layout with left sidebar
(Overview, Live map, Drivers queue, Rides, Zones, Ledger, Complaints, Settings). Tables with search, filters
and pagination. Never bundled into the Android passenger/driver app.
```

### Prompt 4.4 — Missing screens and states
```
Add: phone + OTP sign-up, onboarding (3 slides), ride history with receipts, profile edit, saved places,
help/complaint form (uses existing /api/complaints), loading skeletons, empty states, error states with retry,
offline banner. Toasts: top-center, plain language ("Your captain is on the way"), no bouncing, auto-hide 3s.
```

---

## PHASE 5 — Launch readiness

```
- Push notifications with Firebase Cloud Messaging (new offer, driver arrived, trip completed).
- Sentry error tracking on frontend and backend.
- GitHub Actions: run backend tests + tsc on every push (currently CI only builds the APK).
- Real SMS provider for OTP (Twilio or a Pakistani gateway).
- Privacy policy + terms pages; data deletion option (Play Store requires it).
- Release-signed APK / AAB for Play Store.
- Public trip-share tracking page /track/:token (time-limited token, not ride id).
- Load test: 200 drivers sending GPS + 50 concurrent bookings.
```

---

## End-to-end acceptance test (do this yourself on 2 real phones)

The app is "complete" only when every line passes with **no seed data, a fresh database, and real phones**:

1. Phone A: install APK → sign up as passenger with your real number → receive SMS code → verified.
2. Phone B: sign up as driver → SMS code → pick city → enter real vehicle → take real photos of CNIC, licence,
   vehicle papers → status "Under review". Driver cannot go online.
3. Laptop: log in to /admin with the admin you created via `create-admin` → see the driver in the queue →
   open the real photos → Approve.
4. Phone B: goes online → map shows its real location.
5. Phone A: pickup auto-filled from GPS, type a destination → road route drawn → fare from real road
   distance → "Find a captain".
6. Phone B: request appears with real distance to pickup → sends a counter-offer.
7. Phone A: offer shows real driver name, real rating ("New" if none), real ETA → Accept.
8. Phone A: watches the driver's car move on the map; ETA counts down.
9. Phone B: "Arrived" → Phone A notified → driver enters passenger's PIN → trip starts.
10. Chat both ways during trip; Call button dials the real number.
11. Phone B: Complete → both see receipt with the agreed fare.
12. Both rate each other. Rating appears on the profiles. Can't rate twice.
13. Phone A: Ride history shows the trip. Report a problem → Admin sees it in Complaints.
14. Admin: Ledger shows the trip, driver earnings "Today" shows it.
15. Restart the backend server → everything above is still there.
16. Try pickup in a city with no active zone → "PakRide is not available here yet".
17. Forgot password → real SMS code → reset works; wrong code 5 times → locked.
18. Run the "ZERO results" searches from Prompts 0.1 and 0.2 → nothing found.

If any step fails, give Gemini the step number and what happened, and fix that one step only.

---

## Things to watch with Gemini

- It tends to write "✅ Implemented / 100% passed" reports. Check each item yourself.
- It added mock fallbacks before (`mock-token-...`, demo OTP `7788`, fake voice note). Tell it explicitly: no
  mocks.
- It writes test results into the real data file (`backend/data/pakride_store.json` is modified right now —
  restore it with `git checkout -- backend/data/pakride_store.json`).
- Bring each finished phase back to Claude for a review before starting the next one.
