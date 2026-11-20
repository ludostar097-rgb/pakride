# 🏛️ PakRide — System Architecture & Engineering Blueprint

---

## 1. High-Level Architecture

The PakRide platform employs a modular client-server architecture with real-time bidirectional push via WebSockets, strict server-side state enforcement, and a cross-platform mobile presentation layer.

```mermaid
flowchart TB
    subgraph Clients["Presentation Layer (Bilingual Web / PWA / Android APK)"]
        PassengerApp["Passenger Client<br/>(Fare Bidding, OTP, Map, WhatsApp)"]
        DriverApp["Driver Client<br/>(Request Feed, Quick Bids, PIN Entry)"]
        AdminDashboard["Admin Control Centre<br/>(City Radar, Verification, Ledger)"]
    end

    subgraph NativeWrapper["Mobile Runtime Bridge"]
        Capacitor["Capacitor Android Core<br/>(GPS, Network, WebView)"]
    end

    subgraph Gateway["API & Real-Time Gateway"]
        ExpressAPI["Express REST API (Port 4000)"]
        SocketEngine["Socket.io WebSocket Engine"]
        JWTAuth["JWT & Role Authorization Guard"]
    end

    subgraph CoreEngine["Business Logic & State Engines"]
        StateMachine["Server-Side Ride State Machine"]
        AtomicAssign["Atomic Driver Lock & Assignment"]
        PricingEngine["Zone Pricing & Minor Unit Calculator"]
        LedgerEngine["Integer Paisa Financial Ledger"]
    end

    subgraph DataStore["Persistence & External Services"]
        JSONStore["Thread-Safe Atomic File Store<br/>(PostgreSQL Ready)"]
        AuditTrail["Immutable Audit Log"]
        OSRM["Open Source Routing Machine (OSRM)"]
        OSMTiles["OpenStreetMap Vector Tile Server"]
    end

    PassengerApp <--> Capacitor
    DriverApp <--> Capacitor
    Capacitor <--> ExpressAPI
    Capacitor <--> SocketEngine
    AdminDashboard <--> ExpressAPI

    ExpressAPI --> JWTAuth
    JWTAuth --> CoreEngine
    SocketEngine <--> CoreEngine

    CoreEngine --> StateMachine
    CoreEngine --> AtomicAssign
    CoreEngine --> PricingEngine
    CoreEngine --> LedgerEngine

    CoreEngine --> JSONStore
    CoreEngine --> AuditTrail
    PassengerApp -.-> OSRM
    PassengerApp -.-> OSMTiles
```

---

## 2. Server-Enforced Ride State Machine

The ride lifecycle transitions strictly through server-validated state gates. Direct or out-of-order client transitions are rejected with an error.

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: Passenger submits pickup & proposed fare
    REQUESTED --> OFFERS_OPEN: Server broadcasts to online drivers
    OFFERS_OPEN --> DRIVER_SELECTED: Passenger accepts one offer (Atomic Lock)
    OFFERS_OPEN --> CANCELLED: Passenger cancels / timeout
    DRIVER_SELECTED --> EN_ROUTE: Driver marks arrived
    DRIVER_SELECTED --> CANCELLED: Permitted cancellation
    EN_ROUTE --> IN_PROGRESS: Driver verifies 4-Digit Passenger PIN
    EN_ROUTE --> CANCELLED: Permitted cancellation
    IN_PROGRESS --> COMPLETED: Trip finished & cash recorded
    IN_PROGRESS --> DISPUTED: Escalated to Admin/Support
    COMPLETED --> [*]
    CANCELLED --> [*]
    DISPUTED --> [*]
```

### State Transition Invariants
1. **Atomic Assignment:** When a passenger selects Offer $A$, all competing offers for the same `rideId` are immediately transitioned to `REJECTED` in an atomic lock, preventing concurrent double-booking.
2. **PIN Verification Gate:** Transitioning from `EN_ROUTE` to `IN_PROGRESS` strictly requires the driver to pass the passenger's matching `verificationOtp`.
3. **Cash Reconcile Trigger:** Transitioning to `COMPLETED` automatically records an entry in the financial ledger and updates driver net earnings.

---

## 3. Real-Time WebSocket Protocol

Communication between clients and the server runs over persistent Socket.io connections with room partitioning.

| Event Name | Direction | Payload | Purpose |
| :--- | :---: | :--- | :--- |
| `join_user_room` | Client $\rightarrow$ Server | `userId` | Subscribes client to private notifications. |
| `new_ride_available` | Server $\rightarrow$ Drivers | `RideRequest` | Broadcasts new ride in the active zone. |
| `submit_driver_offer` | Driver $\rightarrow$ Server | `rideId, counterFarePkr, eta` | Sends driver counteroffer. |
| `new_offer_received` | Server $\rightarrow$ Passenger | `offer` | Pushes counteroffer directly to passenger room. |
| `accept_driver_offer` | Passenger $\rightarrow$ Server | `offerId` | Triggers atomic assignment. |
| `offer_accepted_notify` | Server $\rightarrow$ Winning Driver | `ride, offer` | Alerts chosen driver with pickup coordinates. |
| `ride_status_changed` | Server $\rightarrow$ Both | `ride` | Updates trip progression (`EN_ROUTE`, `IN_PROGRESS`, etc.). |
| `driver_location_update` | Driver $\rightarrow$ Server | `lat, lng` | Broadcasts live GPS to passenger and Admin Radar. |

---

## 4. Geographic & Road Routing Architecture

To eliminate reliance on expensive commercial mapping APIs during early testing, the platform uses a **two-tier routing architecture**:

```mermaid
flowchart TD
    Req["Pickup & Destination Selected"] --> CheckNetwork{"Network Available?"}
    CheckNetwork -- Yes --> QueryOSRM["Query Free OSRM API<br/>router.project-osrm.org"]
    QueryOSRM -- 200 OK --> RenderRoads["Render Exact Karachi Road Polyline<br/>(Rashid Minhas, University Rd, etc.)"]
    QueryOSRM -- Error / Timeout --> Fallback["Fallback to Direct Spatial Path"]
    CheckNetwork -- No --> Fallback
    Fallback --> RenderDirect["Render Clean Dashed Vector Path"]
```

* **Street-by-Street Polylines:** Real-time road route coordinates are dynamically requested from OSRM (`/route/v1/driving/...`) and drawn directly onto Leaflet.
* **Fallback Resilience:** If connectivity is lost or OSRM is slow, the client falls back to direct coordinate vector calculation without crashing or interrupting ride booking.
* **Local Anchors:** Gulistan-e-Jauhar pilot landmarks (Jauhar Chowrangi, Millennium Mall, Airport, etc.) are pre-indexed with exact coordinates.

---

## 5. Financial Ledger & Minor Unit Integrity

To ensure zero rounding errors across all driver earnings, platform fees, and future digital payouts:

$$\text{Paisa} = \text{PKR} \times 100$$

* All values are strictly integers (`number` with no decimals).
* All ledger entries record:
  * `ride_id`
  * `gross_amount_paisa`
  * `platform_commission_paisa` (0% introductory)
  * `driver_net_paisa`
  * `reconciled_at` timestamp

---

## 6. Mobile APK CI/CD Architecture

```mermaid
flowchart LR
    Push["git push origin master"] --> GHA["GitHub Actions Runner (Ubuntu)"]
    GHA --> Setup["Setup Java 17 & Node.js 20"]
    GHA --> BuildWeb["npm run build (Vite + React)"]
    GHA --> SyncCap["npx cap sync android"]
    GHA --> Gradle["./gradlew assembleDebug"]
    GHA --> Artifact["Upload PakRide-Debug-APK"]
    Artifact --> Download["Direct Download to Android Phone"]
```

* **Capacitor Android Core:** Wraps the PWA inside a high-performance native WebView with hardware-accelerated rendering and GPS access.
* **Automated Cloud Build:** Compiles the `.apk` on GitHub's cloud runners without needing local Android Studio or SDK installations.
