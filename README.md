# TripPilot AI — Your AI Travel Copilot

> **Full Implementation Status**: Modules 1 through 16 Complete  
> **Architecture Level**: Production-Grade Multi-Domain Travel Copilot System

TripPilot AI is an original travel planning platform. Built around a central **Trip** object, it unifies trip planning, provider search handoffs for flights, stay search, interactive routing, weather information, budget estimates, social sharing, and administrative controls.

---

## 🎯 Central Architecture: Trip-Centric Model

TripPilot AI treats **TRIP** as the central product entity. Destinations and provider APIs act as supporting geospatial, cultural, and transaction infrastructure.

```text
TripPilot AI Core Platform
├── 1. AI Travel Agent (Natural language prompts, session memory, multi-domain orchestrator)
├── 2. Flights (route details and outbound provider search links)
├── 3. Hotels (6-provider stay matrix, Hotel Fit Intelligence, distance & transit scoring)
├── 4. Activities (Curated experiences, time slot assignments, category filters)
├── 5. Itinerary (Day-by-day spatial sequencing, interactive editing, drag & reorder)
├── 6. Maps (OpenStreetMap / OSRM engine, 7 transport modes, Haversine distance telemetry)
├── 7. Weather (Live Open-Meteo REST API integration, 7-day forecast advisory)
├── 8. Budget (Multi-currency allocation, expense splitting, command budget capping)
└── 9. Administrative Control (User management, provider health dashboard, system configs, moderation)
```

---

## 🔍 Explicit Integration & Status Matrix

Per system architecture rules, features and external provider integrations are transparently identified below:

| Feature / Subsystem | Integration Status | Data Source / Engine | Description |
|---|---|---|---|
| **Trip planning chat** | `Implemented` / `Optional LLM` | Deterministic planner, optional Gemini or OpenAI API | Works without a key; with a provider key, the assistant can interpret free-form trip requests and improve chat responses. Trip actions remain server-validated. |
| **Destination Resolver** | `Implemented` | DB + Global Knowledge Bank + Synthesizer | Resolves ANY destination worldwide (Tokyo, Paris, Bali, Dubai, etc.). Zero locations fail or are rejected. |
| **AI Command Execution** | `Implemented` | `aiTools.service` + `travelOrchestrator` | Real-time execution of natural language updates ("Make Day 3 cheaper", "Add a beach", "Optimize route"). |
| **Map & Route Engine** | `Implemented` | OpenStreetMap + OSRM Engine | Live routing & Haversine distance calculation across 7 transit modes (Walking, Taxi, Car, Metro, etc.). |
| **Weather API** | `Implemented` | Open-Meteo REST API | Live current weather and 7-day weather forecasts with outdoor activity advisories. |
| **Flight search** | `Provider handoff` | Official provider flight-search pages | TripPilot passes the route details to its own screen, then opens provider sites. It does not list schedules, airlines, or fares. |
| **Hotel search** | `Sample data` | Example properties and provider search handoffs | No live room inventory provider is connected. Current entries, ratings, and prices must not be treated as live property data. |
| **Activities** | `Curated suggestions` | Local catalog plus ticket search links | Suggestions are not verified listings or availability. Ticket searches open Klook or GetYourGuide; booking is completed and confirmed with them. |
| **Group trip planning** | `Implemented` | Trip collaborators and shared discussion | Trip owners can add existing TripPilot accounts as editors or viewers. Members can discuss plans; mention `@vani` to ask the assistant to work on the itinerary. |
| **Entry requirements** | `Safety guidance` | Official-source verification prompt | TripPilot does not claim visa eligibility. Travelers are directed to verify rules with destination government or embassy sources. |
| **Budget & Expense Allocations** | `AI estimate` / `Implemented` | `finance.service.js` | AI-generated budget breakdowns with multi-currency support, expense logging, and group splitting. |
| **Social Sharing & Journals** | `Implemented` | MongoDB + JWT Auth | Unique 8-character share codes, public blueprint view, travel journal entries, and photo logs. |
| **Administrative Control Center** | `Implemented` | `/api/admin/*` + React Admin Portal | Full user control, provider health checks, travel collections curation, content moderation, system configs. |

*Flight sample adapters remain in the repository for development reference, but the user-facing flight flow does not call them. Hotel provider availability is separate and may remain sample data.*

---

## 💎 Design System & Visual Identity

TripPilot AI features an original, dark-mode-first aesthetic crafted specifically for high-density travel intelligence:

* **Visual Direction**: Modern Travel Intelligence
* **Theme**: Sleek Dark Shell (`slate-950` / `#0b1120`) with Gold Accent Highlights (`amber-500` / `#f59e0b`) & Sky Blue Telemetry (`sky-500` / `#0ea5e9`)
* **Typography**: Clean, sans-serif hierarchy powered by Google Font `Inter`
* **Components**: Card containers, glassmorphic command panels, badges, modal popups, custom tab toggles, responsive tables, loading state spinners, and contextual empty state banners.

---

## 🚀 Key User Workflows & Routes

1. **Homepage (`/`)**: AI-first Travel Command Center with natural language prompt input, parameter fine-tuning, and live system metrics.
2. **AI Planner (`/plan-trip` / `/ai-planner`)**: Full-featured trip synthesis wizard. Enter any prompt or trip requirements to generate a complete multi-domain blueprint.
3. **Trip Workspace (`/trips/:id`)**: Comprehensive workspace combining:
   - Day-by-Day Itinerary Editor
   - Live Interactive Map with Polyline Telemetry
   - Weather Forecast Advisory Widget
   - Flight provider links and hotel search
   - Budget & Expense Split Tracker
   - Trip Intelligence & AI Copilot Command Panel
4. **My Trips (`/my-trips`)**: Personal trip command hub to view, filter, delete, and share AI trip blueprints.
5. **Explore & Collections (`/explore`)**: Browse curated destinations, attractions, and travel collection packages.
6. **Social Sharing (`/trips/share/:shareCode`)**: Clean, public, read-only trip blueprint view.
7. **Admin Control Center (`/admin/*`)**:
   - `/admin` — System Overview & Stats
   - `/admin/providers` — Real-Time Provider Integration Dashboard
   - `/admin/users` — User Account & Role Management
   - `/admin/destinations` — Destination Infrastructure Management
   - `/admin/collections` — Travel Collections Curation
   - `/admin/reports` — Community Content Moderation Queue
   - `/admin/settings` — Feature Flags & Platform Settings

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React, Axios
* **Backend**: Node.js, Express.js, MongoDB (Mongoose ODM)
* **API Providers**: Open-Meteo Weather API, OSRM Routing Engine, OpenStreetMap Geocoding
* **Security**: JWT (HttpOnly Cookies + Bearer Token fallback), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, Role-Based Access Control (`authorizeRoles('ADMIN')`)

---

## ⚡ Quick Start & Development Setup

### 1. Environment Configuration
Copy `server/.env.example` to `server/.env` and fill in the local database and JWT settings:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/trippilot_db
JWT_SECRET=trippilot_super_secret_jwt_key_2026_dev_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Optional LLM chat responses (Gemini or OpenAI)

For a Google AI Studio key:

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Add `LLM_PROVIDER=google`, `GOOGLE_API_KEY=...`, and `GEMINI_MODEL=gemini-3.6-flash` to `server/.env`.
3. Restart the backend. The code calls Gemini from the server using Google's `generateContent` endpoint. It never sends the key to the client.

Alternatively, create an API key from the [OpenAI API keys page](https://platform.openai.com/api-keys), set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...` in `server/.env`, then restart.

Without an LLM key, the deterministic planner still works. With one, the model can interpret free-form trip requests and improve chat responses; itinerary changes and trip permissions remain validated by the server. Prompts and relevant trip/itinerary context are sent to the selected LLM provider when enabled. Never put a key in `client/.env`, source code, or GitHub.

OpenAI API billing is separate from a ChatGPT subscription. See [OpenAI's billing explanation](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform). For Gemini, see Google's [API key safety guide](https://ai.google.dev/gemini-api/docs/api-key) and [model list](https://ai.google.dev/gemini-api/docs/models).

### Flight price handoff

Live flight prices are not connected. Flight search returns outbound links to Google Flights, Skyscanner, MakeMyTrip, Cleartrip, ixigo, and Trip.com; provider search details must be entered on those sites. To add live prices later, a developer needs an approved provider account and API key, a server-side adapter, and verified results marked `isLive = true`. A key alone does not provide inventory access.

### Currency display and affiliate links

Budget display conversion uses the European Central Bank's documented public reference-rate data endpoint, fetched by the server and cached for 12 hours. Converted values are approximate and do not change saved budget amounts. A failed rates request leaves the original currency in place. Partner tracking is optional; blank variables in `server/.env` keep links untracked. Booking.com tracking uses its documented `aid` link parameter. Agoda, GetYourGuide, and Klook tracking parameters remain unimplemented until their affiliate dashboards confirm the exact formats.

### Live hotel inventory

There is no provider key to paste in today: setting an API key alone does not change sample hotel data. To add live hotel results, choose a supplier that accepts your application, obtain its API credentials and commercial/affiliate approval, then implement its search API in `server/services/hotelProviders/`. Keep credentials in `server/.env`, normalize results into the provider schema, and return `inventoryVerified: true` only for API responses. Provider access is subject to each supplier's eligibility and terms.

### 2. Start Backend API Server
```bash
cd server
npm run dev
```

### 3. Start Frontend Client Server
```bash
cd client
npm run dev
```

### 4. Build Production Bundle
```bash
cd client
npm run build
```

---

## 🧪 Verification & Audit Suite

Run full end-to-end G8Trip-Parity automated verification suite from `server/`:
```bash
node scripts/testG8TripParity.js
```
This suite validates all 13 core G8Trip-parity acceptance test cases:
1. `Plan a 5-day trip to Delhi from Ahmedabad for 2 people.` (Produces Delhi trip)
2. `Plan a 5-day trip to Tokyo from Ahmedabad.` (Produces Tokyo trip)
3. `Make the Tokyo trip cheaper.` (Modifies active trip)
4. `Add Kyoto.` (Adds destination, updates route, accommodation, itinerary, budget)
5. `Remove Kyoto.` (Reverses additions and updates itinerary)
6. `Add 2 days.` (Extends trip duration intelligently)
7. `Find a hotel near my Day 3 activities.` (Searches hotels with fit intelligence)
8. `Find a rooftop restaurant near my hotel.` (Searches dynamic dining)
9. `Plan a road trip from Mumbai to Goa.` (Switches to road-trip mode)
10. `Plan a trip to [uncached destination e.g. Reykjavik].` (Dynamic research & synthesis)
11. `Plan a trip to the Moon.` (Handles impossible/fictional feasibility without fake flight/hotel data)
12. `Keep the total below ₹50,000.` (Optimizes trip budget with explicit cost tradeoffs)
13. `Give me a booking checklist.` (Generates dynamic booking checklist)
