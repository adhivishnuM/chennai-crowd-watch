# 🎨 LOVABLE FRONTEND PROMPT: Build Crowdex Premium UI

## Your Mission

Build a **stunning, premium frontend** for **"Crowdex"** – a Real-Time Public Crowd Awareness System for Chennai, India. This is a **frontend-only** project. The backend will be built separately by Claude Opus. Use mock data and simulated API responses.

**Tagline:** *"Know Before You Go"*

**Core Concept:** Users can check real-time crowd levels at popular Chennai locations (malls, parks, beaches, stations) on an interactive map before visiting, saving time and avoiding crowds.

---

## 🔄 TWO-MODE ARCHITECTURE

### The Toggle System
The app has **TWO MODES** switchable via a toggle in the navbar:

| Mode | Who Uses It | What They See |
|------|-------------|---------------|
| **Public View** | Regular users | Interactive map, crowd levels, best times, predictions |
| **Admin Panel** | Operators/Admins | Camera feeds, video upload, analytics, location management |

**Toggle Implementation:**
- Fixed toggle switch in top navigation bar
- Labels: "Public View" (left) | "Admin Panel" (right)
- Icons: 👁️ (eye) for Public | ⚙️ (gear) for Admin
- Smooth sliding animation when switching (300ms transition)
- Toggle state persisted in localStorage
- Entire UI dynamically adapts based on selected mode
- **NO authentication required** - simple toggle switch

---

## 🎨 DESIGN SYSTEM

### Color Palette (LIGHT THEME ONLY - No Dark Mode)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| **Primary Background** | Pure White | `#FFFFFF` | Page backgrounds |
| **Secondary/Accents** | Rich Black | `#0A0A0A` | Text, icons, toggle active state |
| **Card Background** | Frosted Glass White | `rgba(255, 255, 255, 0.7)` | All cards, modals |
| **Card Border** | Subtle White | `rgba(255, 255, 255, 0.3)` | Glassmorphism borders |
| **Low Crowd** | Emerald Green | `#10B981` | LOW status badges, map markers |
| **Medium Crowd** | Amber | `#F59E0B` | MEDIUM status badges, map markers |
| **High Crowd** | Rose Red | `#EF4444` | HIGH status badges, map markers |
| **Subtle Gray BG** | Soft Gray | `#F3F4F6` | Section backgrounds |
| **Text Primary** | Near Black | `#111827` | Headings, important text |
| **Text Secondary** | Slate Gray | `#6B7280` | Body text, descriptions |
| **Border/Dividers** | Light Gray | `#E5E7EB` | Separators, borders |
| **Map Base** | Light Mapbox Style | - | Use `mapbox://styles/mapbox/light-v11` |

### Typography
- **Primary Font:** Inter (Google Fonts) - Clean, modern, highly readable
- **Font Weights:** 400 (body), 500 (medium), 600 (semibold), 700 (bold)
- **Headings:** Bold, tight letter-spacing
- **Body:** Regular weight, 1.5 line-height
- **Numbers/Stats:** Tabular figures for alignment, slightly larger

### Glassmorphism Specifications (CRITICAL!)

Every card and floating element MUST have:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}
```

### Animation Requirements (MAKE IT ALIVE!)

1. **Hover Effects:**
   - All buttons: scale(1.02), shadow lift
   - All cards: translateY(-2px), deeper shadow
   - All icons: subtle color shift or scale

2. **Loading States:**
   - Skeleton loading with shimmer animation
   - Smooth fade-in when content loads
   - Pulsing effect on live indicators

3. **Transitions:**
   - Page transitions: fade + slide (200ms)
   - Mode toggle: smooth morph (300ms)
   - Charts: animated drawing effect
   - Numbers: count-up animation when data changes

4. **Live Indicators:**
   - Pulsing dot animation for real-time data
   - Heartbeat effect on active cameras
   - Ripple effect on map markers

5. **Micro-interactions:**
   - Button press feedback
   - Input focus glow
   - Toggle switch sliding
   - Tab switching smooth scroll

---

## 📍 CHENNAI LOCATION DATA (Mock Data)

### Pre-defined Locations
Create mock data for these 15 Chennai locations:

```javascript
const CHENNAI_LOCATIONS = [
  // MALLS
  {
    id: "loc_001",
    name: "Express Avenue Mall",
    type: "mall",
    address: "Whites Road, Royapettah, Chennai",
    lat: 13.0604,
    lng: 80.2627,
    capacity: 5000,
    icon: "🏬"
  },
  {
    id: "loc_002",
    name: "Phoenix MarketCity",
    type: "mall",
    address: "Velachery Main Road, Velachery",
    lat: 12.9941,
    lng: 80.2189,
    capacity: 8000,
    icon: "🏬"
  },
  {
    id: "loc_003",
    name: "VR Chennai",
    type: "mall",
    address: "Jawaharlal Nehru Road, Anna Nagar",
    lat: 13.0878,
    lng: 80.2069,
    capacity: 6000,
    icon: "🏬"
  },
  {
    id: "loc_004",
    name: "Forum Vijaya Mall",
    type: "mall",
    address: "Arcot Road, Vadapalani",
    lat: 13.0500,
    lng: 80.2121,
    capacity: 4000,
    icon: "🏬"
  },
  
  // BEACHES
  {
    id: "loc_005",
    name: "Marina Beach",
    type: "beach",
    address: "Marina Beach Road, Triplicane",
    lat: 13.0500,
    lng: 80.2824,
    capacity: 50000,
    icon: "🏖️"
  },
  {
    id: "loc_006",
    name: "Besant Nagar Beach",
    type: "beach",
    address: "Elliot's Beach, Besant Nagar",
    lat: 12.9988,
    lng: 80.2717,
    capacity: 10000,
    icon: "🏖️"
  },
  
  // PARKS
  {
    id: "loc_007",
    name: "Guindy National Park",
    type: "park",
    address: "Guindy, Chennai",
    lat: 13.0067,
    lng: 80.2206,
    capacity: 3000,
    icon: "🌳"
  },
  {
    id: "loc_008",
    name: "Semmozhi Poonga",
    type: "park",
    address: "Cathedral Road, Gopalapuram",
    lat: 13.0371,
    lng: 80.2565,
    capacity: 2000,
    icon: "🌳"
  },
  
  // TRANSIT
  {
    id: "loc_009",
    name: "Chennai Central Station",
    type: "transit",
    address: "Periyamet, Chennai",
    lat: 13.0827,
    lng: 80.2707,
    capacity: 15000,
    icon: "🚉"
  },
  {
    id: "loc_010",
    name: "Chennai Egmore Station",
    type: "transit",
    address: "Egmore, Chennai",
    lat: 13.0732,
    lng: 80.2609,
    capacity: 10000,
    icon: "🚉"
  },
  {
    id: "loc_011",
    name: "CMBT Bus Terminus",
    type: "transit",
    address: "Koyambedu, Chennai",
    lat: 13.0694,
    lng: 80.1948,
    capacity: 20000,
    icon: "🚌"
  },
  
  // MARKETS
  {
    id: "loc_012",
    name: "T. Nagar Ranganathan Street",
    type: "market",
    address: "T. Nagar, Chennai",
    lat: 13.0418,
    lng: 80.2341,
    capacity: 25000,
    icon: "🛍️"
  },
  {
    id: "loc_013",
    name: "Pondy Bazaar",
    type: "market",
    address: "Thyagaraya Road, T. Nagar",
    lat: 13.0458,
    lng: 80.2399,
    capacity: 15000,
    icon: "🛍️"
  },
  
  // ATTRACTIONS
  {
    id: "loc_014",
    name: "Government Museum",
    type: "attraction",
    address: "Pantheon Road, Egmore",
    lat: 13.0694,
    lng: 80.2566,
    capacity: 5000,
    icon: "🏛️"
  },
  {
    id: "loc_015",
    name: "Valluvar Kottam",
    type: "attraction",
    address: "Valluvar Kottam High Road, Nungambakkam",
    lat: 13.0499,
    lng: 80.2422,
    capacity: 3000,
    icon: "🏛️"
  }
];
```

### Mock Data Generation Functions
```javascript
// Generate realistic crowd count that varies over time
function generateCrowdCount(capacity) {
  const hour = new Date().getHours();
  const timeMultiplier = getTimeMultiplier(hour);
  const randomVariation = 0.8 + Math.random() * 0.4; // 80% - 120%
  return Math.floor(capacity * timeMultiplier * randomVariation);
}

// Time-based crowd patterns
function getTimeMultiplier(hour) {
  const patterns = {
    0: 0.05, 1: 0.03, 2: 0.02, 3: 0.02, 4: 0.02, 5: 0.05,
    6: 0.1, 7: 0.2, 8: 0.35, 9: 0.5, 10: 0.65, 11: 0.8,
    12: 0.9, 13: 0.85, 14: 0.7, 15: 0.65, 16: 0.7, 17: 0.8,
    18: 0.85, 19: 0.9, 20: 0.75, 21: 0.6, 22: 0.4, 23: 0.2
  };
  return patterns[hour] || 0.5;
}

// Get crowd level from percentage
function getCrowdLevel(count, capacity) {
  const percentage = (count / capacity) * 100;
  if (percentage <= 40) return { level: "LOW", color: "#10B981" };
  if (percentage <= 70) return { level: "MEDIUM", color: "#F59E0B" };
  return { level: "HIGH", color: "#EF4444" };
}

// Generate popular times data (24 hours)
function generatePopularTimes(locationId) {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    crowdLevel: Math.floor(getTimeMultiplier(hour) * 100),
    label: hour === new Date().getHours() ? "Now" : null
  }));
}

// Get best time recommendation
function getBestTimeToVisit(popularTimes) {
  const lowCrowdHours = popularTimes
    .filter(t => t.crowdLevel < 40)
    .map(t => t.hour);
  return lowCrowdHours.length > 0 
    ? `${lowCrowdHours[0]} - ${lowCrowdHours[lowCrowdHours.length - 1]}`
    : "Early morning (6-8 AM)";
}
```

---

## 📱 MODE 1: PUBLIC VIEW

### Navigation Structure
- **Top Navbar (Sticky):**
  - Left: Crowdex Logo
  - Center: Mode Toggle ("Public View" / "Admin Panel")
  - Right: Search icon, Info/About

- **Mobile Bottom Tab Bar:**
  - 🗺️ Map (Home)
  - 📊 Popular
  - ⏰ Best Times
  - 🔔 Alerts (optional)

---

### PAGE 1: Interactive Map Dashboard (HOME - Most Important!)

**This is the MAIN screen. Make it SPECTACULAR!**

#### Map Section (Full Screen Background)
- Use **Mapbox GL JS** or **react-map-gl**
- Light map style: `mapbox://styles/mapbox/light-v11`
- Center on Chennai: `[80.2707, 13.0827]`
- Default zoom: 12

#### Custom Map Markers
Each location has a custom animated marker:
```
- Marker Design: Circular gradient with status color
- Size: 32px (small) to 48px (large based on importance)
- Animation: Gentle pulsing effect (scale 1.0 → 1.1 → 1.0)
- Pulse speed based on status:
  - LOW: slow pulse (2s)
  - MEDIUM: medium pulse (1.5s)
  - HIGH: fast pulse (1s)
- Shadow: colored glow matching status
```

#### Location Popup (On Marker Click)
Glassmorphic popup appears with:
```
┌─────────────────────────────────┐
│ 🏬 Express Avenue Mall          │
│ Anna Salai, Royapettah          │
├─────────────────────────────────┤
│  ●  MEDIUM   ~3,250 people      │
│     65% capacity                │
│                                 │
│  Trend: ↗️ Rising (+5% in 1hr)  │
│                                 │
│  [ View Details → ]             │
└─────────────────────────────────┘
```

#### Bottom Sheet / Side Panel
**Desktop (≥1024px):** Right side panel (320px width)
**Mobile (<768px):** Draggable bottom sheet (pull up to expand)

Content:
- **Header:** "Nearby Places" with filter pills
- **Filter Pills:** All | 🏬 Malls | 🏖️ Beaches | 🌳 Parks | 🚉 Transit | 🛍️ Markets
- **Location Cards List:** Scrollable list of all locations
  - Each card shows: Icon, Name, Status Badge, Distance, Mini sparkline trend
  - Cards sorted by: Distance (default) or Crowd Level

#### Location Card Design
```
┌────────────────────────────────────────┐
│ 🏬  Express Avenue Mall      🟡 MEDIUM │
│     1.2 km away                        │
│     ▃▅▆█▇▅▃  ~3,250 people             │
│                                        │
│     Best time: 2-4 PM                  │
└────────────────────────────────────────┘
```

#### Search Functionality
- Glassmorphic search bar at top (or floating)
- Search by location name
- Auto-suggest dropdown with matching locations
- On select: Map flies to location, opens popup

---

### PAGE 2: Location Detail View

**Accessed when user clicks "View Details" on any location**

#### Hero Section
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🏬  Express Avenue Mall                            │
│      Whites Road, Royapettah, Chennai               │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │      🟡  MEDIUM          ~3,250             │   │
│  │         65% full          people            │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Live • Updated 30 seconds ago                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Popular Times Section (LIKE GOOGLE MAPS!)
```
Popular Times
─────────────────────────────────────────
Usually busy at this time

      ▁▂▃▄▅▆███▇▆▅▄▄▅▆▇▆▅▄▃▂▁
     6 7 8 9 10 11 12 1 2 3 4 5 6 7 8 9 10
              AM            PM          

     [Current hour highlighted with accent color]
     
     Hover/tap shows: "Usually moderate at 2 PM"
```

**Implementation:**
- Bar chart with 18 bars (6 AM to 11 PM)
- Bar height represents crowd level (0-100%)
- Current hour bar has accent border/glow
- Color gradient: green (low) → yellow (medium) → red (high)
- Animated bar drawing on load
- Tooltip on hover/tap: "Usually [busy/quiet/moderate] at [time]"

#### Best Time to Visit Section
```
┌─────────────────────────────────────────┐
│  🌟 Best Time to Visit                  │
│                                         │
│     2:00 PM - 4:00 PM                   │
│                                         │
│     Typically 40% less crowded          │
│     than peak hours                     │
│                                         │
│  ─────────────────────────────────────  │
│  6AM      12PM      6PM      10PM       │
│  ▓▓▓▓▓▓▓░░░▓▓▓░░░░░▓▓▓▓▓▓▓░░           │
│         ^^ GREEN = BEST TIMES ^^        │
└─────────────────────────────────────────┘
```

#### Live Trend Section
```
┌─────────────────────────────────────────┐
│  📈 Live Trend (Last 3 Hours)           │
│                                         │
│          ╱╲                             │
│         ╱  ╲    ╱╲                      │
│     ___╱    ╲__╱  ╲___                  │
│                                         │
│     1:00   2:00   3:00   Now            │
│                                         │
│  ↗️ Rising trend (+12% in last hour)    │
└─────────────────────────────────────────┘
```

#### Quick Stats Grid (2x2)
```
┌──────────────────┐ ┌──────────────────┐
│ Peak Today       │ │ Average Today    │
│ 🔴 4,200 @ 12PM  │ │ 2,800 people     │
└──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐
│ Wait Time Est.   │ │ vs Yesterday     │
│ ~15 minutes      │ │ ↗️ +8% busier    │
└──────────────────┘ └──────────────────┘
```

#### Actions
- "📍 Get Directions" button (opens Google Maps)
- "🔔 Set Alert" button (notify when crowd drops)
- "📤 Share" button

---

### PAGE 3: Best Times Overview

**Dedicated page for planning visits across all locations**

#### Header
```
Plan Your Visit
─────────────────────────────────────────
Find the best times to visit Chennai's popular spots
```

#### Filter Section
- Filter pills: All | Malls | Beaches | Parks | Transit | Markets
- Sort dropdown: By Crowd Level | By Distance | A-Z

#### Location Cards Grid
Each card shows:
```
┌─────────────────────────────────────────┐
│ 🏬 Express Avenue Mall                  │
│                                         │
│ Popular Times:                          │
│ ▁▂▃▅███▇▅▃▂▁▂▃▄▅▄▃▂                     │
│ 6AM     12PM     6PM     10PM           │
│                                         │
│ 🌟 Best: 2-4 PM  │  🔴 Avoid: 12-1 PM   │
│                                         │
│ Current: 🟡 MEDIUM (65%)                │
└─────────────────────────────────────────┘
```

#### Comparison Feature (Optional)
- Allow user to select 2-3 locations
- Show side-by-side comparison of peak times
- Help decide which location to visit

---

### PAGE 4: Alerts (Optional Feature)

**User can set alerts for favorite locations**
```
┌─────────────────────────────────────────┐
│ 🔔 My Alerts                            │
├─────────────────────────────────────────┤
│                                         │
│ Express Avenue Mall                     │
│ Alert when: Crowd drops to LOW          │
│ Status: 🟡 Currently MEDIUM             │
│ [Remove Alert]                          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ + Add New Alert                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⚙️ MODE 2: ADMIN PANEL

### Navigation Structure
**Collapsible Sidebar (Left side):**
```
┌──────────────────┐
│ CROWDEX          │
│ Admin Panel      │
├──────────────────┤
│ 📊 Dashboard     │
│ 📍 Locations     │
│ 📹 Live Cameras  │
│ 📤 Video Upload  │
│ 📈 Analytics     │
│ ⚙️ Settings      │
├──────────────────┤
│ 👁️ Switch to     │
│    Public View   │
└──────────────────┘
```

---

### ADMIN PAGE 1: Dashboard

**System overview at a glance**

#### Stats Cards Row (4 cards)
```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Locations  │ │ Cameras    │ │ Avg Crowd  │ │ Alerts     │
│   15       │ │   12/15    │ │   MEDIUM   │ │   3 today  │
│ monitored  │ │  online    │ │  (58%)     │ │            │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

#### Live Activity Feed
```
┌─────────────────────────────────────────────────────────┐
│ Live Activity                                           │
├─────────────────────────────────────────────────────────┤
│ 🔴 Marina Beach reached HIGH capacity      2 min ago    │
│ 🟡 Express Avenue now MEDIUM               5 min ago    │
│ 🟢 Government Museum dropped to LOW        8 min ago    │
│ 📹 Camera 3 reconnected                    12 min ago   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

#### Quick Actions Grid
```
┌──────────────────┐ ┌──────────────────┐
│ + Add Location   │ │ 📤 Upload Video  │
└──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐
│ 📹 View Cameras  │ │ 📊 Generate      │
│                  │ │    Report        │
└──────────────────┘ └──────────────────┘
```

#### System Health
- Camera status indicators (green/red dots)
- Last data sync timestamp
- API status indicator

---

### ADMIN PAGE 2: Location Management

**CRUD operations for locations**

#### Locations Table
```
┌────┬────────────────────┬────────────┬──────────┬──────────┬─────────┐
│ ID │ Name               │ Status     │ Cameras  │ Capacity │ Actions │
├────┼────────────────────┼────────────┼──────────┼──────────┼─────────┤
│ 01 │ Express Avenue     │ 🟡 MEDIUM  │ 2        │ 5000     │ ⋮       │
│ 02 │ Phoenix MarketCity │ 🟢 LOW     │ 3        │ 8000     │ ⋮       │
│ 03 │ Marina Beach       │ 🔴 HIGH    │ 4        │ 50000    │ ⋮       │
└────┴────────────────────┴────────────┴──────────┴──────────┴─────────┘

[ + Add New Location ]
```

#### Add/Edit Location Modal
Glassmorphic modal overlay with form:
- Name (text input)
- Address (text input)
- Location on Map (clickable map to set lat/lng)
- Capacity (number input)
- Type (dropdown: Mall, Beach, Park, Transit, Market, Attraction)
- Assign Cameras (multi-select)
- Thresholds: LOW/MEDIUM/HIGH percentages
- Save / Cancel buttons

---

### ADMIN PAGE 3: Live Camera Feeds

**Grid view of all camera streams**

#### Camera Grid (2x2 or 3x3)
```
┌─────────────────────┐ ┌─────────────────────┐
│ ┌─────────────────┐ │ │ ┌─────────────────┐ │
│ │                 │ │ │ │                 │ │
│ │  [Video Feed]   │ │ │ │  [Video Feed]   │ │
│ │                 │ │ │ │                 │ │
│ ├─────────────────┤ │ │ ├─────────────────┤ │
│ │ Express Avenue  │ │ │ │ Marina Beach    │ │
│ │ 🟡 45 people    │ │ │ │ 🔴 892 people   │ │
│ └─────────────────┘ │ │ └─────────────────┘ │
└─────────────────────┘ └─────────────────────┘
```

Each camera card:
- Video feed placeholder (black with play icon for demo)
- Location name overlay
- Live count badge (pulsing)
- Crowd level indicator
- Fullscreen toggle button
- Settings gear icon

#### Camera Detail View (On click/fullscreen)
- Large video feed
- Real-time count with animation
- Chart: counts over last hour
- AI detection overlay toggle
- Camera settings panel

---

### ADMIN PAGE 4: Video Upload & Analysis

**Upload videos for crowd analysis**

#### Upload Zone
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│         ┌───────────────────────────────────┐           │
│         │                                   │           │
│         │      📁 Drop video here           │           │
│         │         or click to browse        │           │
│         │                                   │           │
│         │   Supported: MP4, AVI, MOV        │           │
│         │   Max size: 500MB                 │           │
│         │                                   │           │
│         └───────────────────────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Processing Progress
```
┌─────────────────────────────────────────────────────────┐
│ Processing: campus_video.mp4                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ████████████████░░░░░░░░░░░░░░░░░  45%                 │
│                                                         │
│  ✓ Uploaded                                             │
│  ✓ Processing frames...                                 │
│  ○ Analyzing...                                         │
│  ○ Generating report...                                 │
│                                                         │
│  Current frame: 450/1000  |  Count: 23 people           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Analysis Results
After processing complete:
- Video preview thumbnail
- Frame-by-frame crowd chart
- Summary stats: Average, Peak, Duration
- Download report button (CSV/PDF)

---

### ADMIN PAGE 5: Analytics Dashboard

**Historical data and insights**

#### Date Range Picker
- Preset buttons: Today | Yesterday | Last 7 Days | Last 30 Days
- Custom date range picker

#### Charts Section
1. **Line Chart:** Crowd trends over time (all locations or selected)
2. **Bar Chart:** Daily averages comparison
3. **Heatmap:** Weekly patterns (days × hours grid)
4. **Pie Chart:** Distribution by crowd level

#### Insights Cards
```
┌──────────────────────┐ ┌──────────────────────┐
│ 🔥 Busiest Location  │ │ 😌 Quietest Time     │
│ Marina Beach         │ │ Tuesday 6 AM         │
│ Avg: 12,500 people   │ │ Avg across all: 890  │
└──────────────────────┘ └──────────────────────┘
```

#### Export Options
- Download as PNG (charts)
- Export to CSV (data)
- Generate PDF Report

---

### ADMIN PAGE 6: Settings

**System configuration**

#### Settings Sections

1. **Crowd Thresholds**
   - LOW: 0-__% (default 40)
   - MEDIUM: __-__% (default 41-70)
   - HIGH: __% and above (default 71)

2. **Notifications**
   - Enable/disable high crowd alerts
   - Email notification toggle
   - Alert frequency settings

3. **API Configuration**
   - Backend API URL
   - Map provider API key (masked)
   - WebSocket settings

4. **Data Management**
   - Clear cache button
   - Export all data
   - Reset to defaults

---

## 📐 RESPONSIVE LAYOUT STRUCTURE

### Desktop Layout (≥1024px)
```
PUBLIC VIEW:
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo | Mode Toggle | Search                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────┬───────────────────┐   │
│  │                                 │                   │   │
│  │      INTERACTIVE MAP            │   LOCATION LIST   │   │
│  │        (70% width)              │    SIDE PANEL     │   │
│  │                                 │    (30% width)    │   │
│  │                                 │                   │   │
│  └─────────────────────────────────┴───────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

ADMIN VIEW:
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo | Mode Toggle                                   │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │           MAIN CONTENT AREA                      │
│  NAV     │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
PUBLIC VIEW:
┌─────────────────────┐
│ NAVBAR (sticky)     │
├─────────────────────┤
│                     │
│   FULL-SCREEN MAP   │
│                     │
│   (with gestures)   │
│                     │
├─────────────────────┤
│ BOTTOM SHEET        │
│ (draggable)         │
│ - Location cards    │
├─────────────────────┤
│ BOTTOM TAB BAR      │
│ Map|Popular|Plan|Me │
└─────────────────────┘

ADMIN VIEW:
┌─────────────────────┐
│ NAVBAR + Hamburger  │
├─────────────────────┤
│                     │
│   MAIN CONTENT      │
│   (Full width)      │
│                     │
├─────────────────────┤
│ BOTTOM NAV (icons)  │
└─────────────────────┘
```

---

## 🧩 COMPONENT LIBRARY TO BUILD

Create these reusable components:

1. **GlassCard** - Glassmorphic card container (various sizes)
2. **CrowdBadge** - Status badge (LOW/MEDIUM/HIGH with colors)
3. **LiveIndicator** - Pulsing dot for real-time data
4. **MapMarker** - Custom map marker with status pulse
5. **PopularTimesChart** - Bar chart like Google Maps
6. **TrendSparkline** - Mini line chart for cards
7. **CounterAnimation** - Animated number display
8. **ModeToggle** - Public/Admin switch component
9. **LocationCard** - Card for location list
10. **SearchBar** - Glassmorphic search input
11. **FilterPills** - Horizontal scrollable filter chips
12. **Sidebar** - Collapsible admin navigation
13. **BottomSheet** - Mobile draggable bottom panel
14. **DataTable** - Clean table for admin
15. **UploadZone** - Drag-and-drop file upload
16. **StatCard** - Dashboard stat display
17. **SkeletonLoader** - Loading placeholder with shimmer
18. **TimelineBar** - Best times visual indicator

---

## 🔧 TECHNICAL REQUIREMENTS

### Framework & Libraries
- **React 18+** with TypeScript
- **Vite** for build tooling
- **React Router v6** for navigation
- **react-map-gl** or **Mapbox GL JS** for maps
- **Recharts** or **Visx** for charts
- **Framer Motion** for animations
- **Lucide React** for icons
- **date-fns** for dates
- **Zustand** or React Context for state management

### State Management
- Use React Context or Zustand for:
  - Mode toggle state (public/admin)
  - Selected location
  - Filter states
  - Mock data updates (setInterval for simulating live data)

### Mock Data Service
Create `src/services/mockData.ts`:
- All 15 Chennai locations with coordinates
- Functions to generate varying crowd data
- Simulated real-time updates (update every 5 seconds)
- Historical data patterns
- Popular times data

### API Integration Points (For future backend)
Prepare these API hooks/functions (use mock data for now):
```typescript
// Ready for backend integration
const API_BASE = 'http://localhost:8000';

// GET /api/locations - List all locations
// GET /api/locations/:id - Get location details
// GET /api/locations/:id/history - Get historical data
// WS /ws/camera/live - Live camera WebSocket
// POST /api/upload/video - Upload video
// GET /api/predictions - Get predictions
```

---

## ✅ QUALITY CHECKLIST

Before considering complete, verify:

- [ ] **Glassmorphism applied** to ALL cards and floating elements
- [ ] **All interactive elements** have smooth hover states
- [ ] **Numbers animate** when they change (count-up effect)
- [ ] **Loading states** have skeleton shimmer effects
- [ ] **Page transitions** are smooth (fade + slide)
- [ ] **Mode toggle** works perfectly and remembers state
- [ ] **Map markers pulse** based on crowd status
- [ ] **Charts are interactive** (hover tooltips work)
- [ ] **Mobile experience** is polished (bottom sheets, gestures)
- [ ] **All icons** are consistent (Lucide)
- [ ] **Typography hierarchy** is clear
- [ ] **Spacing** is consistent (8px grid system)
- [ ] **Colors** match the design system exactly
- [ ] **Popular Times chart** looks like Google Maps
- [ ] **Overall feel** is PREMIUM, not half-baked

---

## 🎯 BUILD PRIORITY ORDER

1. **Design system setup** - Colors, fonts, glassmorphism base CSS
2. **Component library** - Build reusable components first
3. **Mode toggle** - Get switching working
4. **Public View: Map Dashboard** - The hero page!
5. **Public View: Location Detail** - With Popular Times
6. **Public View: Best Times page**
7. **Admin: Dashboard** - Stats overview
8. **Admin: Locations Management**
9. **Admin: Live Cameras** (placeholder feeds)
10. **Admin: Analytics**
11. **Polish** - Animations, transitions, edge cases

---

## 💡 FINAL NOTES

### What This Frontend Should Feel Like:
- **Apple design quality** - Clean, polished, attention to detail
- **Google Maps functionality** - Familiar map interaction patterns
- **Premium SaaS product** - Not a hackathon prototype

### Key Differentiators:
- The glassmorphism effect should be EVERYWHERE
- Animations should feel buttery smooth
- The map interaction should be as smooth as Google Maps
- Numbers should animate when they change
- Everything should feel ALIVE - pulsing indicators, live updates
- The Popular Times chart is a KEY feature - make it beautiful

### Remember:
- **Light theme ONLY** - No dark mode
- **White primary, Black secondary** - Not maroon
- **Chennai public places focus** - Malls, beaches, parks, transit
- **User mode = viewing only** - No camera access
- **Admin mode = full control** - All features

---

**BUILD THIS. Make it stunning. Make it premium. Make it WOW.** 🚀

---

*This prompt should be pasted directly into Lovable for frontend generation*
*Document prepared: January 28, 2026*
