# 🚗 PakRide (پاک رائڈ)
### End-to-End Pakistani Ride-Hailing Platform with Live Fare Bidding & Zero Commission

PakRide is a two-sided mobility marketplace engineered for Pakistan. Passengers propose fares, drivers accept or counteroffer in real-time, and trips are completed with an introductory **0% platform commission** cash-first model.

---

## 🌟 Key Features

1. **Real-Time Bidding & Atomic Assignment:**
   * Passenger proposes a fare in PKR.
   * Online drivers in the zone receive instant alerts and can accept or submit counteroffers.
   * Passenger selects the best driver; competing offers are atomically rejected.
2. **Server-Enforced Ride State Machine:**
   * `REQUESTED` $\rightarrow$ `OFFERS_OPEN` $\rightarrow$ `DRIVER_SELECTED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` / `CANCELLED`.
3. **Cash-First Financial Ledger:**
   * Stored in **integer minor units (PKR paisa: 1 PKR = 100 paisa)** to prevent floating-point calculation errors.
   * Automatic net driver earnings reconciliation at 0% introductory commission.
4. **Bilingual Urdu & English UX:**
   * Full Right-to-Left (RTL) typography with instant one-click toggle.
5. **Karachi Pilot Zone (Gulistan-e-Jauhar):**
   * Pre-configured zone boundary and coordinate anchors for major landmarks (Jauhar Chowrangi, Kamran Chowrangi, Millennium Mall, Airport, Darul Sehat Hospital, etc.).
6. **Mobile APK via Capacitor & GitHub Actions:**
   * Native Android wrapper pre-configured with AndroidManifest permissions.
   * Automated `.github/workflows/build-apk.yml` builds ready-to-install debug `.apk` on every push.

---

## 👥 Pre-Seeded Demonstration Personas

| Role | Name | Phone | Details |
| :--- | :--- | :--- | :--- |
| **Passenger** | Ali Khan | `03001234567` | Requests rides, proposes fares, compares driver offers. |
| **Driver (Car)** | Tariq Mehmood | `03007654321` | Toyota Corolla White (`KHI-8291`), Approved & Online. |
| **Driver (Bike)** | Kamran Iqbal | `03112233445` | Honda CD70 Red (`KHI-4412`), Approved & Online. |
| **Driver (Rickshaw)** | Zubair Ahmed | `03229988776` | Sazgar CNG Green (`KHI-9931`), Approved & Online. |
| **Unapproved Driver** | Usman Farooq | `03335555555` | Suzuki Alto (`KHI-3012`), Under Review (cannot go online). |
| **Admin** | Ahmad Hassan | `03009999999` | Super Admin: document review, active ride monitor, ledger. |

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend API & Real-Time Engine
```bash
cd backend
npm run dev
# Server runs on http://localhost:4000
```

### 2. Start the Frontend Application
```bash
cd frontend
npm run dev
# Vite runs on http://localhost:3000
```

---

## 📱 Generating the Android APK

1. Push this repository to GitHub:
   ```bash
   gh auth login -h github.com
   gh repo create ab069/pakride --private --source=. --remote=origin --push
   ```
2. The GitHub Action workflow (`.github/workflows/build-apk.yml`) will automatically trigger.
3. Go to the **Actions** tab on your GitHub repository, click on the latest build, and download the compiled **`PakRide-Debug-APK`** directly to your phone!
