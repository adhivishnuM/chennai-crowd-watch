# CROWDEX FRONTEND SPECIFICATION

## Project Overview

**Crowdex** is a Real-Time Public Crowd Awareness System for Chennai, India. Users can check crowd levels at 70 popular Chennai locations on an interactive map before visiting.

**Tagline:** "Know Before You Go"

---

## Design System

### Design Philosophy
Apple-inspired clean, minimal aesthetic. **Not** glassmorphism with heavy blur effects - instead uses clean white cards with subtle shadows.

### Color Palette (Light Theme Only - No Dark Mode)

```css
:root {
  --background: #FFFFFF;
  --foreground: #000000;
  --card: #FFFFFF;
  --secondary: #F5F5F5;        /* Soft gray for backgrounds */
  --muted-foreground: #737373; /* 45% gray for secondary text */
  --border: #EBEBEB;           /* 92% gray for borders */
  
  /* Crowd Level Colors */
  --crowd-low: hsl(142, 71%, 45%);     /* Green */
  --crowd-medium: hsl(38, 92%, 50%);   /* Amber */
  --crowd-high: hsl(0, 84%, 60%);      /* Red */
}
```

### Typography
- **Font Family:** System fonts (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif`)
- **Numbers:** Use `tabular-nums` for aligned number displays

### Card Styling (NOT Glassmorphism)
Cards use subtle shadows, not blur effects:

```css
.glass-card {
  background: var(--card);
  border-radius: 1rem;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.glass-card-hover:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

---

## Location Data Structure

### 70 Chennai Locations Across 7 Types

| Type | Count | Icon (Lucide) |
|------|-------|---------------|
| mall | 12 | Building2 |
| foodcourt | 8 | Utensils |
| park | 10 | TreePine |
| transit | 12 | Train |
| market | 12 | ShoppingCart |
| museum | 8 | Landmark |
| toll | 8 | Milestone |

### Location Interface
```typescript
interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'mall' | 'foodcourt' | 'park' | 'transit' | 'market' | 'museum' | 'toll';
  crowdLevel: 'low' | 'medium' | 'high';
  currentCount: number;
  capacity: number;
  trend: 'rising' | 'falling' | 'stable';
  bestTime: string;
  popularTimes: { hour: string; crowdLevel: number; label: string | null }[];
  distance?: string;
}
```

### Operating Hours Per Type
```typescript
const operatingHours = {
  mall: { open: 10, close: 22 },      // 10am - 10pm
  foodcourt: { open: 10, close: 22 }, // 10am - 10pm
  park: { open: 5, close: 19 },       // 5am - 7pm
  transit: { open: 4, close: 23 },    // 4am - 11pm
  market: { open: 6, close: 21 },     // 6am - 9pm
  museum: { open: 9, close: 17 },     // 9am - 5pm
  toll: { open: 0, close: 24 },       // 24 hours
};
```

### Time-Based Crowd Patterns
- Crowd counts return 0 when locations are closed
- Weekend multipliers for malls/parks (1.4x busier)
- Rush hour multipliers for transit/toll (1.3x during 7-10am, 5-8pm on weekdays)
- Uses seeded pseudo-random for consistent daily variation

---

## Icons - Lucide Only (NO Emoji)

**IMPORTANT:** The UI uses **Lucide React icons**, not emoji characters.

### LocationTypeIcon Component
```typescript
import { Building2, Utensils, TreePine, Train, ShoppingCart, Landmark, Milestone, MapPin } from 'lucide-react';

function LocationTypeIcon({ type, size = 18 }) {
  switch (type) {
    case 'mall': return <Building2 size={size} strokeWidth={1.5} />;
    case 'foodcourt': return <Utensils size={size} strokeWidth={1.5} />;
    case 'park': return <TreePine size={size} strokeWidth={1.5} />;
    case 'transit': return <Train size={size} strokeWidth={1.5} />;
    case 'market': return <ShoppingCart size={size} strokeWidth={1.5} />;
    case 'museum': return <Landmark size={size} strokeWidth={1.5} />;
    case 'toll': return <Milestone size={size} strokeWidth={1.5} />;
    default: return <MapPin size={size} strokeWidth={1.5} />;
  }
}
```

### Trend Icons
```typescript
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
// rising → TrendingUp (red)
// falling → TrendingDown (green)
// stable → Minus (gray)
```

---

## Crowd Badge Display

**IMPORTANT:** Badge labels are "Low", "Moderate", "Busy" - NOT "LOW", "MEDIUM", "HIGH"

```typescript
const labels = {
  low: 'Low',
  medium: 'Moderate',
  high: 'Busy',
};
```

Badge styling uses colored backgrounds with matching text:
- Low: Green background/text
- Medium: Amber background/text  
- High: Red background/text

Optional pulsing dot animation when `showPulse={true}`.

---

## Two-Mode Architecture

### Public View (All Users)
- Interactive map with location markers
- Location list with filtering
- Location detail pages
- Transport page (buses/trains)
- Best Times page

### Admin Panel (Authenticated Admins Only)
Access requires Firebase auth with `role: "admin"` in Firestore.

---

## Authentication

### Firebase Auth with Google Sign-In
```typescript
interface AuthContextType {
  user: User | null;
  role: 'user' | 'admin' | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

User roles stored in Firestore `users` collection. New users default to `role: "user"`.

---

## Public View Pages

### 1. Map Dashboard (Home)

**Main Components:**
- `CrowdMap` - React-Leaflet map with Carto Positron tiles
- `LocationCard` - Compact location cards in side panel
- Filter pills for type filtering (horizontal scrollable)

**Map Configuration:**
```typescript
const CHENNAI_CENTER = [13.0500, 80.2500];
const DEFAULT_ZOOM = 12;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
```

**Map Markers:**
- Colored dots based on crowd level (green/amber/red)
- Pulsing animation ring
- Click to select location
- Popup with name, address, trend, "View Details" button

**Desktop Layout:**
- Map takes 70% width
- Side panel (384px) on right with location list
- Collapsible panel toggle

**Mobile Layout:**
- Full screen map
- "View List" button opens bottom sheet
- Draggable bottom sheet with location cards

### 2. Location Detail (`/location/:id`)

**Sections:**
1. **Hero Card:** Type icon, name, address, crowd badge
2. **Stats Grid:** 
   - Public users see: crowd level (text), trend, wait time
   - Admin users see: current count, capacity %, trend, wait time
3. **Best Time Card:** Sparkles icon, recommended time range
4. **Popular Times Chart:** 24-hour bar chart (like Google Maps)
5. **Live Trend Chart:** Area chart showing last 3 hours
6. **Stats Grid:** Peak hours, avg wait, vs yesterday, next hour prediction

Uses `react-countup` for animated number displays.

### 3. Transport Page

Shows real-time crowd data for Chennai public transport.

**Buses (12 routes):**
Broadway↔Tambaram, Broadway↔Kelambakkam, Broadway↔Taramani, Perambur↔Besant Nagar, CMBT↔Thiruvanmiyur, Parry Corner↔Vadapalani, T. Nagar↔Adyar, Anna Nagar↔Mylapore, Guindy↔Central, Koyambedu↔OMR, Egmore↔Velachery, Tambaram↔T. Nagar

**Trains (6 routes):**
MRTS (Velachery↔Beach), Metro-B (Wimco Nagar↔Airport), Suburban (Central↔Arakkonam), Metro-G (Central↔Poonamallee), EMU (Beach↔Tambaram), Express (Egmore↔Trichy)

**Data Interface:**
```typescript
interface BusRoute {
  id: string;
  from: string;
  to: string;
  occupation: number;  // 0-100%
  status: 'Very High' | 'Crowded' | 'Moderate' | 'Low';
  nextBus: number;     // minutes
  trend: 'rising' | 'falling' | 'stable';
}
```

### 4. Best Times Page

Overview of best visiting times for all locations with filtering by type.

---

## Admin Panel

### Sidebar Navigation
```typescript
type AdminPage = 'dashboard' | 'locations' | 'cameras' | 'live-cctv' | 'upload' | 'analytics' | 'users' | 'settings';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: MapPin, label: 'Locations', page: 'locations' },
  { icon: Camera, label: 'Local Camera', page: 'cameras' },
  { icon: Radio, label: 'Live CCTV', page: 'live-cctv' },
  { icon: Upload, label: 'Video Upload', page: 'upload' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Users, label: 'Users', page: 'users' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];
```

### Admin Pages

#### 1. Dashboard
- Stats cards: Locations, Cameras, Avg Load, Alerts
- Recent Activity feed with live indicator
- Quick Actions grid (navigates to other admin pages)
- System Status display
- Crowd Distribution visualization (Low/Moderate/High counts)

#### 2. Locations Management
- Data table with location CRUD
- Filter and search

#### 3. Local Camera
- Local webcam integration for testing
- Uses device camera with YOLO detection

#### 4. Live CCTV
- Stream from RTSP, HLS, or YouTube Live URLs
- Save/edit/delete custom camera configurations
- Real-time YOLO person detection
- Live count display with statistics

#### 5. Video Upload
- Drag-and-drop or click to upload
- Frame skip slider (1-60) for processing speed
- Real-time progress with live preview frame
- Download JSON results

#### 6. Analytics
- Date range selector
- Charts for historical data

#### 7. Users
- List users from Firestore
- Role management (user/admin)

#### 8. Settings
- Crowd threshold configuration
- Notification settings

---

## Technical Stack

### Frontend
- React 18 + TypeScript
- Vite
- React Router v6
- React-Leaflet (Carto Positron tiles - free, no API key)
- Recharts for charts
- Framer Motion for animations
- Lucide React for icons
- TanStack Query
- Tailwind CSS + shadcn/ui components
- Firebase Authentication
- react-countup for animated numbers

### API Configuration
```typescript
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_BASE_URL = `${BASE_URL}/api`;
export const WS_BASE_URL = `${BASE_URL.replace(/^http/, "ws")}/ws`;
```

---

## Key Implementation Notes

1. **No Emoji in UI** - Use Lucide icons for location types and trends
2. **No Glassmorphism** - Clean Apple-style cards with subtle shadows
3. **Badge Labels** - "Low", "Moderate", "Busy" (not uppercase)
4. **Capacity Hidden from Public** - Only admins see exact counts and percentages
5. **Time-Based Patterns** - Locations return 0 crowd when closed
6. **Mobile First** - Bottom sheet on mobile, side panel on desktop

---

*Document updated: February 1, 2026*
*Reflects current production codebase*
