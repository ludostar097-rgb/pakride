# 🚗 PakRide (پاک رائڈ)
### Enterprise-Grade Pakistani Ride-Hailing Platform with Real-Time Bidding & 0% Commission

PakRide is a modern two-sided ride-hailing marketplace engineered specifically for the Pakistani operating landscape. Passengers propose fares, drivers accept or counteroffer in real time, and trips are settled through an introductory **0% platform commission** cash-first model.

Built with clean modular architecture, full bilingual Urdu (RTL) / English typography, integer minor unit financial precision, dynamic typo-tolerant geocoding, multi-city scalability (Karachi Pilot, Islamabad, Rawalpindi, Lahore), and native Android APK compilation.

---

## 🌟 Executive Highlights & Core Value Propositions

| Feature | Engineering Standard | Commercial Benefit |
| :--- | :--- | :--- |
| **Real-Time Fare Bidding** | Passenger proposes fare; drivers accept or counterbid via WebSockets. | Higher conversion, transparent pricing, eliminates algorithmic surge resentment. |
| **0% Platform Commission** | Centralized server setting (`introductoryCommissionPercent: 0`). | Rapid driver acquisition; beats competitor 20–28% deductions. |
| **Integer Paisa Financial Ledger** | All finances stored as integer minor units ($1\text{ PKR} = 100\text{ Paisa}$). | Zero floating-point rounding errors; auditable cash reconciliation. |
| **Typo-Tolerant Address Search** | Photon (OSM + Elasticsearch) with Pakistani phonetic auto-correction. | Handles Pakistani transliteration (`centuras`, `jauhr`, `sadar`, `masjd`). |
| **Server-Controlled State Machine** | Strict atomic state transitions with tamper-proof audit trails. | Eliminates double-booking and invalid trip sequences. |
| **4-Digit Safety PIN Verification** | Server-generated verification code required to begin trips. | Prevents driver impersonation and fraudulent ride starts. |
| **Multi-City & Zone Scalability** | Dynamic database-driven city and zone registry with GPS geofencing. | Controlled expansion: activate one verified zone at a time per blueprint. |
| **Bilingual Urdu RTL / English** | 1-Click dynamic layout switch (`dir="rtl"`) with native Urdu typography. | 100% accessible to non-English literate drivers and riders. |
| **Turnkey Android APK & Vercel** | Pre-configured Capacitor 7 bridge + GitHub Actions CI/CD. | Ready to install on Android devices or deploy to cloud in minutes. |

---

## 📱 The 3 Integrated Applications

PakRide provides three complete, fully functional applications switchable via the top navigation bar with zero dummy placeholder screens:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  PR PakRide   [ 🚗 Passenger App ]  [ 🚕 Driver App ]  [ 🛡️ Admin Console ]  [ Sign In / Up ] [ اردو ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. 🚗 Passenger App
- **Multi-City Hubs:** Switch between Karachi (Pilot), Islamabad, Rawalpindi, and Lahore.
- **3 Vehicle Categories:** Car (4 seats), Motorcycle (1 rider), Rickshaw (3 seats).
- **Typo-Tolerant Search Bar:** Live address suggestions with "Did you mean: ...?" correction banner.
- **Interactive Leaflet Map:** Tap anywhere on the map to reverse-geocode real street addresses dynamically.
- **Recent Places:** 1-tap quick access chips for frequent destinations.
- **Gate & Pickup Notes:** Quick tag chips (`+ Main Gate`, `+ Near Bakery`, `+ Call when arrived`).
- **Safety Suite:** 4-digit ride verification PIN, direct Madadgar 15 Police SOS, WhatsApp family trip share, and simulated voice updates.
- **Real-Time In-Ride Chat:** Bidirectional messaging with driver during active trips.
- **Trip Review:** 5-star rating and comment submission updating driver's public rating.

### 2. 🚕 Driver App
- **Online/Offline Availability:** 1-tap toggle with instant dispatch broadcast.
- **KYC Verification Gate:** Unapproved or suspended drivers are strictly barred from going online.
- **Live Requests Radar:** Real-time feed of open passenger rides in the driver's active zone.
- **One-Thumb Quick Bidding:** Accept proposed fare or counteroffer via `+20`, `+50`, `+100` PKR pills.
- **PIN Verification Modal:** Driver must enter passenger's 4-digit PIN to begin trip.
- **0% Commission Savings Counter:** Tracks daily earnings and money kept in pocket vs 20% competitor fee.
- **Vehicle Manager:** Switch or update vehicle details (Car, Bike, Rickshaw) on the fly.

### 3. 🛡️ Admin Control Centre
- **City Radar (Live Map):** Visual Leaflet map showing active fleet pins across Karachi, Islamabad, Rawalpindi, and Lahore.
- **Cities & Zones Management:** 1-tap toggle to activate/pause zones; modal to add new cities and zones with GPS center coordinates, radius, and category tariffs.
- **Driver Verification Queue:** Inspect driver CNIC, driving license, and vehicle registration; 1-click Approve or Suspend.
- **Live Dispatch Monitor:** Real-time table of every active ride across the network.
- **Financial Cash Reconciliation Ledger:** Auditable minor-unit ledger tracking gross fares, 0% platform fee, and driver net payouts.

### 4. 🔐 Unified Auth & Security
- Complete phone + password registration, bcrypt hash verification, and cryptographic JWT tokens saved in `localStorage`.
- Forgot password workflow with 4-digit verification OTP.

---

## 🧪 Comprehensive Automated Testing (30/30 Tests Passed)

PakRide includes 4 comprehensive automated test suites covering every layer of the platform:

```bash
# Run unit & state machine tests (CI friendly)
cd backend && npm test

# Run live server integration audit
cd backend && npm run test:live

# Run all 30 tests
cd backend && npm run test:all
```

| Suite | Tests | Description | Status |
| :--- | :---: | :--- | :---: |
| **`e2e.test.ts`** | 8 | Core ride lifecycle, gate notes, atomic driver lock, PIN verification, 0% commission ledger, driver approval gate. | ✅ PASS |
| **`security_and_persistence.test.ts`** | 6 | JWT tampering rejection, role privilege isolation, state machine transition legality, double-booking prevention, PIN brute force defense. | ✅ PASS |
| **`multicity_and_auth.test.ts`** | 6 | Islamabad user registration, dynamic zone creation/toggle, Islamabad fare calculation, in-ride chat, 5-star review submission. | ✅ PASS |
| **`live_system_audit.test.ts`** | 10 | Live full-stack execution against running servers on ports 4000 & 3000 (real JWT tokens, password reset OTP, WebSockets, etc.). | ✅ PASS |

---

## 🏗️ Architecture & Technology Stack

```
Frontend (React 18 + Vite 6 + Tailwind CSS + Leaflet + Lucide + Socket.io)
   │
   ├── Native Bridge (Capacitor 7 Android Wrapper)
   │
Backend API Gateway (Node.js 20+ + TypeScript + Express + Socket.io)
   │
   ├── Core State Machine (Server-enforced ride lifecycle transitions)
   ├── Financial Ledger (Integer paisa minor units: 100 paisa = 1 PKR)
   ├── Dynamic Geocoding (Photon + OpenStreetMap Nominatim + OSRM Road Router)
   └── Atomic Persistence (Thread-safe JSON Store / PostgreSQL Schema Ready)
```

---

## 🚀 Local Development Quickstart

### 1. Start the Backend API & Real-Time Engine
```bash
cd backend
npm install
npm run dev
# Server running on http://localhost:4000
```

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
# Vite application running on http://localhost:3000
```

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository: **`ab069/pakride`** (or **`ludostar097-rgb/pakride`**).
3. Set **Root Directory** to `frontend` (or keep root; both `vercel.json` files are configured).
4. Add environment variable:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```
5. Click **Deploy**.

### Building the Android APK
1. **GitHub Actions (Automated Cloud Build):**
   - Workflow `.github/workflows/build-apk.yml` automatically compiles the web bundle and builds the APK via Gradle (Java 21).
   - Download `PakRide-Debug-APK` directly from the [Actions tab](https://github.com/ludostar097-rgb/pakride/actions).
2. **Android Studio (Local Build):**
   - Open `frontend/android` in Android Studio.
   - Select **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.

---

## 🔐 User Authentication & Roles

PakRide supports role-governed user accounts:
- **Passenger**: Book rides, negotiate fares via transparent bidding, track trips with security PIN verification.
- **Driver**: Register vehicle, submit documents for review, accept ride requests or place counter-bids, receive 100% net earnings.
- **Admin**: Document review and approval, multi-city zone management, dispute settlement, and 0% commission transparent ledger.

Users register and sign in securely through the in-app authentication portal. All session tokens are cryptographically signed JWTs.

---

## 📄 Key Documentation Links

- [SPECIFICATIONS.md](file:///c:/Users/abdullah/Documents/ahmadhassan/SPECIFICATIONS.md) — Comprehensive functional, technical, and regulatory specs.
- [ARCHITECTURE.md](file:///c:/Users/abdullah/Documents/ahmadhassan/ARCHITECTURE.md) — System architecture diagrams, state machine, and data flow.
- [AUDIT_BUGS_AND_ROADMAP.md](file:///c:/Users/abdullah/Documents/ahmadhassan/AUDIT_BUGS_AND_ROADMAP.md) — Anti-shortcut audit, resolved gaps, and test matrix.
