# Smart Tourist Safety Monitoring & Incident Response System

A full-stack mobile tourist safety ecosystem featuring real-time foreground GPS monitoring, rule-based geo-fencing, deterministic safety scoring, two-step emergency SOS incident logging, and explainable movement anomaly detection.

---

## 1. System Architecture

```
[ React Native (Expo SDK 58) Mobile App ]
          │
          │ HTTP / REST APIs
          ▼
[ Express.js REST API & Controllers ]
          │
          ├─ Geo-Fence Engine (Haversine Formula)
          ├─ Deterministic Safety Score Engine (0-100)
          ├─ Emergency SOS Incident Service
          └─ Explainable Anomaly Detection Service
          │
          ▼
[ Prisma ORM 7 + Better-SQLite3 Adapter ]
          │
          ▼
[ SQLite Database (dev.db) ]
```

---

## 2. Day 2 Completed Features

1. **Foreground Location Services (`expo-location`)**:
   - Explicit user consent and foreground permission management.
   - Live latitude, longitude, and accuracy display.
   - On-demand GPS refresh and simulated demo location mode.

2. **Geo-Fencing Engine**:
   - Configurable safety zones with `SAFE`, `CAUTION`, and `DANGER` risk levels.
   - Great-circle distance calculations using the Haversine formula.
   - Automatic perimeter entry and exit transition detection without alert spam.

3. **Deterministic Safety Scoring Engine (0–100)**:
   - Transparent, explainable rule engine calculating real-time safety scores.
   - Categories: `SAFE` (80–100), `MODERATE` (50–79), and `HIGH RISK` (0–49).
   - Contributing factors breakdown (danger zone penalty, open SOS penalty, active anomalies, GPS availability).

4. **Two-Step Emergency SOS Workflow**:
   - High-contrast emergency SOS button.
   - Safety confirmation step to prevent accidental triggers.
   - Transmits GPS coordinates, tourist ID, and timestamp to backend incident response API.
   - Returns unique incident reference ID (e.g. `INC-XXXXXX`).

5. **Explainable Anomaly Detection Engine**:
   - Rule-based detection for:
     - Prolonged Location Inactivity (> 180 min)
     - Route Deviation from itinerary corridor (> 3000m)
     - Sudden Implausible Location Jump (> 250 km/h)
     - Danger-Zone Entry
     - Repeated Suspicious Events cluster
   - Built-in simulation suite to test each rule immediately.

6. **Incident & Alert History**:
   - Unified audit trail for SOS incidents and anomaly alerts.
   - Category filtering: `All`, `SOS`, `Geo-fence`, `Anomaly`.
   - Displays severity, timestamps, coordinates, and status.

7. **Full Mobile Navigation (6 Tabs)**:
   - **Home**: Integrated overview of tourist identity, safety score, location, and quick actions.
   - **Tourist ID**: Digital pass with verifiable credentials and registration form.
   - **Location**: Live GPS tracking, coordinates, and geo-fence proximity.
   - **Safety**: Real-time score, geo-fence alerts, anomaly simulation, and SOS.
   - **Incidents**: Unified event and alert history log.
   - **Profile**: Tourist details, backend connection configuration, and project notes.

---

## 3. Database Models (Prisma & SQLite)

- **Tourist**: Digital identity, contact, emergency contact, itinerary corridor, and validity timestamp.
- **SafetyZone**: Zone name, center latitude/longitude, radius (meters), risk level (`SAFE`, `CAUTION`, `DANGER`), and description.
- **Incident**: Incident reference, tourist foreign key, type (`SOS`), status (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `CANCELLED`), severity (`CRITICAL`), coordinates, and timestamps.
- **AnomalyAlert**: Anomaly type, severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), description, coordinates, status (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`), and timestamps.

---

## 4. API Endpoints

### Health & Tourists
- `GET /api/health` — Service health status
- `POST /api/tourists` — Register new tourist
- `GET /api/tourists` — List all registered tourists
- `GET /api/tourists/:id` — Get tourist by ID

### Geo-Fencing & Safety Zones
- `GET /api/geofence/zones` — List all configured safety zones
- `GET /api/geofence/zones/:id` — Get single zone by ID
- `POST /api/geofence/zones` — Create a new safety zone
- `POST /api/geofence/evaluate` — Evaluate GPS coordinates against safety zones

### Safety Score Engine
- `GET /api/safety-score/:touristId?latitude=...&longitude=...` — Get calculated safety score
- `POST /api/safety-score/calculate` — Calculate score via POST payload

### Emergency SOS & Incidents
- `POST /api/incidents/sos` — Trigger emergency SOS incident
- `GET /api/incidents` — List all incidents (filters: `touristId`, `status`, `severity`, `type`)
- `GET /api/incidents/:id` — Get incident by ID
- `GET /api/incidents/tourist/:touristId` — Get incidents for specific tourist
- `PATCH /api/incidents/:id/status` — Update incident status

### Anomaly Detection
- `POST /api/anomalies/detect` — Run rule-based anomaly detection against coordinates
- `POST /api/anomalies/simulate` — Simulate anomaly scenario (`DANGER_ZONE_ENTRY`, `SUDDEN_LOCATION_CHANGE`, `ROUTE_DEVIATION`, `INACTIVITY`, `REPEATED_SUSPICIOUS_EVENTS`)
- `GET /api/anomalies` — List all anomaly alerts
- `GET /api/anomalies/tourist/:touristId` — List alerts for specific tourist
- `PATCH /api/anomalies/:id/status` — Update alert status

---

## 5. How to Run the Project

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start the Backend API
```bash
cd backend
npm install
npm test          # Run automated API test suite
npm run dev       # Starts Express API on http://localhost:5050
```

### 2. Start the Mobile Application
```bash
cd mobile
npm install
npx expo start    # Starts Expo Metro bundler
```
- Open on Android/iOS via Expo Go app, or press `w` for web preview.
- To configure the backend URL when using Expo Go on a physical phone, open the **Profile** tab in the app and set your machine's LAN IP (e.g. `http://192.168.x.x:5050/api`).

---

## 6. Testing & Demonstration Guide

### How to Test Geo-Fencing
1. Open the **Location** tab or **Safety** tab.
2. Under "Simulate Location Movement", select:
   - **Amer Fort (Safe Zone)**: User status changes to `SAFE` with zero penalty.
   - **Old Bazaar (Caution Zone)**: Notice score deduction (-15 pts) and warning badge.
   - **Aravalli Ridge (Danger Zone)**: Triggers instant `🚨 DANGER ZONE ALERT` banner and score drop (-40 pts).
3. Switch back to a safe zone; the app alerts `✓ Exited previous safety zone perimeter` without spamming alerts.

### How to Test Emergency SOS
1. On the **Home** or **Safety** tab, tap **ACTIVATE EMERGENCY SOS**.
2. Review the location coordinates preview and check the confirmation box.
3. Tap **CONFIRM & BROADCAST SOS**.
4. The backend records the incident in SQLite and returns reference code `INC-XXXXXX`.
5. Switch to the **Incidents** tab to see the incident logged with timestamp and coordinates.

### How to Simulate Movement Anomalies
1. Navigate to the **Safety** tab.
2. Under "Rule-Based Anomaly Detection", tap any scenario button:
   - **Danger Zone Entry**
   - **Sudden Location Jump** (85 km displacement in 3 minutes)
   - **Route Deviation** (> 3 km from registered corridor)
   - **Location Inactivity** (> 180 min)
   - **Repeated Suspicious Events** (cluster of anomalies)
3. The alert is saved to the database and the Safety Score card immediately re-calculates to reflect the risk factors.

---

## 7. Academic Project Disclaimers

1. **Rule-Based Anomaly Detection vs. Machine Learning**:
   The anomaly detection engine uses deterministic, explainable rule thresholds (time, displacement speed, zone boundaries). It is not a black-box deep learning model.
2. **Hash-Chained Audit Trail vs. Public Blockchain**:
   Digital identity verification and incident references use cryptographic SHA-256 hashes for data integrity demonstration. It is not connected to Ethereum or a public blockchain network.
3. **Simulated Emergency Response**:
   The SOS system persists incident reports to the backend SQLite database for testing and demonstration. It is not connected to actual police (112 / 911), medical, or municipal emergency services.
4. **Demonstration Safety Zones**:
   Zone coordinates (Amer Fort, Aravalli Ridge, Riverbank) are demonstration presets configured for the Jaipur tourist corridor and do not represent official government safety classifications.
