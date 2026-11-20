# 📋 PakRide — Technical & Functional Specifications (Specs)
**Version:** 1.0.0 (Master Pilot Specification)  
**Jurisdiction / First Zone:** Karachi, Sindh (Gulistan-e-Jauhar Pilot Catchment)  
**Platform Commission:** 0% Introductory Rate (Configurable Server Setting)  
**Monetary Standard:** Integer Minor Units (PKR Paisa: 100 paisa = 1 PKR)

---

## 1. Executive Product Definition

PakRide is an end-to-end Pakistani two-sided ride-hailing marketplace engineered with **transparent fare negotiation** (passengers propose fares; drivers accept or counteroffer) and an **introductory 0% platform commission** cash-first model.

### 1.1 Supported Vehicle Categories
1. **Car (`CAR`):** 4-seater hatchbacks and sedans (Corolla, Alto, Cultus, WagonR).
2. **Motorcycle (`MOTORCYCLE`):** 1-rider bikes (Honda CD70, 125, Pridor).
3. **Rickshaw (`RICKSHAW`):** 3-seater auto-rickshaws (Sazgar, Qingqi, 4-stroke CNG).

---

## 2. Functional Specifications by Persona

### 2.1 Passenger Experience
* **Authentication & Role:** Lightweight phone verification and token-based session.
* **Pickup & Destination:**
  * Landmark shortcuts (Jauhar Chowrangi, Kamran Chowrangi, Millennium Mall, Darul Sehat Hospital, Jinnah International Airport, Karachi University, etc.).
  * Exact latitude/longitude coordinate resolution.
  * 1-Tap **GPS "Locate Me"** button with automated browser/device geolocation.
* **Karachi Landmark & Gate Notes:**
  * Free-text and single-tap preset pills (`+ Main Gate`, `+ Near Bakery / Pharmacy`, `+ Call when arrived`, `+ Street Corner`).
* **Dynamic Fare Suggestion & Negotiation:**
  * Displays baseline estimated fare based on category and distance.
  * Passenger enters proposed fare in PKR.
* **Live Counteroffer Sheet:**
  * Real-time stream of incoming driver bids with:
    * Driver name, photo/rating, vehicle model & color.
    * Proposed counteroffer in PKR.
    * Proximity ETA in minutes.
  * Single-tap acceptance triggering **Atomic Driver Assignment**.
* **Trip Security & Safety:**
  * **4-Digit Ride PIN:** Cryptographically secure 4-digit verification code generated on assignment.
  * **1-Tap WhatsApp Family Share:** Pre-formatted message containing driver details, license plate, route, and live status.
  * **SOS Emergency Trigger:** Direct link to Sindh Police Helpline (Madadgar 15).
  * **Audio / Voice Status:** Quick status prompts (*"Waiting at pickup spot"*).

---

### 2.2 Driver Experience
* **Onboarding & Document Review:**
  * Driver registers vehicle category, make, model, year, and plate number.
  * Uploads CNIC front/back and Driving License (simulated/sandbox in pilot).
  * Enters `UNDER_REVIEW` state. **Unapproved drivers are strictly barred from toggling online.**
* **Availability Toggle:** Online / Offline switch enabled only for `APPROVED` drivers.
* **Live Request Feed:**
  * Real-time broadcast of open ride requests within the active zone matching the driver's vehicle category.
  * Displays passenger name, proposed fare, pickup, destination, and passenger's gate note.
* **One-Thumb Quick Bidding:**
  * **Accept at Passenger Fare:** 1-tap accept.
  * **Quick Increments:** `+20 PKR`, `+50 PKR`, `+100 PKR` buttons for instant submission.
  * **Custom Input:** Numeric fare adjustment.
* **Active Trip Progression:**
  * Status 1: **"I Have Arrived at Pickup"** $\rightarrow$ transitions ride to `EN_ROUTE`.
  * Status 2: **"Start Trip"** $\rightarrow$ opens **PIN Entry Modal**. Driver must input passenger's 4-digit code to transition to `IN_PROGRESS`.
  * Status 3: **"Complete Trip & Collect Cash"** $\rightarrow$ reconciles payment in ledger, marks ride `COMPLETED`.
* **0% Commission Savings Tracker:**
  * Live earnings calculator showing total trips, net cash, and estimated competitor commission saved (calculated at 20% standard platform fees).

---

### 2.3 Admin Control Centre
* **City Radar (Live Map):**
  * Interactive Leaflet radar map rendering Gulistan-e-Jauhar pilot zone.
  * Real-time fleet pins for online/offline Cars, Bikes, and Rickshaws.
* **Driver Document Review Queue:**
  * Inspect driver credentials (CNIC, Driving License, Vehicle details).
  * 1-Click **Approve Driver** or **Suspend/Reject** with automated audit logging.
* **Live Dispatches & Ride Monitor:**
  * Real-time table of all active requests, driver assignments, and trip statuses.
* **Cash Reconciliation Ledger:**
  * Complete audit log of gross trip amounts, platform commission (0%), and driver net amounts in integer paisa.
* **Platform Configuration:**
  * Centralized toggle for commission rates and zone activation switches.

---

## 3. Financial & Ledger Specifications

1. **Integer Minor Units Standard:**
   * All monetary values in the database, APIs, and business logic are stored in **PKR Paisa** ($1\text{ PKR} = 100\text{ Paisa}$).
   * Example: A PKR 250 ride is stored as `25000` integer minor units.
   * Floating-point arithmetic is strictly prohibited in the financial ledger to avoid IEEE-754 rounding inaccuracies.
2. **0% Platform Commission Formula:**
   $$\text{Platform Commission Paisa} = \text{round}\left(\frac{\text{Gross Amount Paisa} \times \text{Commission Rate}}{100}\right) = 0$$
   $$\text{Driver Net Paisa} = \text{Gross Amount Paisa} - \text{Platform Commission Paisa} = \text{Gross Amount Paisa}$$
3. **Pluggable Payment Adapters:**
   * **Phase 1 (Pilot):** Cash-first settlement ledger.
   * **Phase 2 (Wallets):** Stubs for JazzCash & Easypaisa merchant webhook callbacks with SHA-256 signature verification and idempotency keys.

---

## 4. Pre-Seeded Pilot Personas

| Role | Name | Phone | Vehicle / Status |
| :--- | :--- | :--- | :--- |
| **Passenger** | Ali Khan | `03001234567` | Verified Rider |
| **Driver (Car)** | Tariq Mehmood | `03007654321` | Toyota Corolla GLi White (`KHI-8291`) • Approved & Online |
| **Driver (Bike)** | Kamran Iqbal | `03112233445` | Honda CD70 Red (`KHI-4412`) • Approved & Online |
| **Driver (Rickshaw)** | Zubair Ahmed | `03229988776` | Sazgar CNG Green (`KHI-9931`) • Approved & Online |
| **Driver (Pending)** | Usman Farooq | `03335555555` | Suzuki Alto (`KHI-3012`) • Under Review (Online Barred) |
| **Super Admin** | Ahmad Hassan | `03009999999` | Super Administrator & Ops Lead |
