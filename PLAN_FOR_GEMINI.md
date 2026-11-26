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

Typecheck passes and backend tests pass. **Nothing new has been committed since the last audit** — every
issue below is still open.

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

### Prompt 2.3 — Real pricing and sane limits
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
- Vehicle category icons: create custom SVG components in src/components/icons/ — CarIcon, MotorbikeIcon,
  RickshawIcon — drawn in the same 24x24, 2px stroke, rounded line style as Lucide, so they match.
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
