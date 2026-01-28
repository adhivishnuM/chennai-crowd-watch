# 🚀 CROWDEX - Development Guide

## Quick Links

| Document | Purpose | Use With |
|----------|---------|----------|
| [LOVABLE_FRONTEND_PROMPT.md](./LOVABLE_FRONTEND_PROMPT.md) | Frontend development guide | Lovable AI |
| [BACKEND_AGENT_PROMPT.md](./BACKEND_AGENT_PROMPT.md) | Backend development guide | Claude Opus |
| [CROWDEX_PROJECT_DOCUMENT.md](./CROWDEX_PROJECT_DOCUMENT.md) | Project overview | Reference |

---

## Project Overview

**Crowdex** is a Real-Time Public Crowd Awareness System for Chennai, India.

**Tagline:** *"Know Before You Go"*

### What It Does
- Shows real-time crowd levels at popular Chennai locations
- Interactive map with live status markers
- "Popular Times" chart (like Google Maps)
- "Best Time to Visit" recommendations
- Admin panel for camera management and analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER DEVICE                          │
│                    (Browser / Mobile)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  Built with Lovable                                         │
│  ─────────────────────────────────────────────────────────  │
│  • Public View: Map, Locations, Best Times, Predictions     │
│  • Admin Panel: Cameras, Upload, Analytics, Settings        │
│  • Glassmorphism UI, Light Theme, Animations                │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                       │
│  Built with Claude Opus                                     │
│  ─────────────────────────────────────────────────────────  │
│  • REST API for locations, predictions                      │
│  • WebSocket for live camera streaming                      │
│  • YOLOv8 for person detection                              │
│  • Video upload processing                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Two-Mode System

### 🟢 Public View (User Mode)
**For:** Regular users checking crowd levels

| Feature | Description |
|---------|-------------|
| Interactive Map | Chennai map with location markers |
| Crowd Status | Real-time LOW/MEDIUM/HIGH for each place |
| Popular Times | Hourly crowd chart (like Google Maps) |
| Best Times | "Best time to visit" recommendations |
| Location Details | Deep dive into any location |

**NO ACCESS TO:** Live cameras, video upload, admin settings

### 🔴 Admin Panel (Backend Mode)  
**For:** Operators and administrators

| Feature | Description |
|---------|-------------|
| All Public Features | ✓ Everything users see |
| Live Camera Feeds | Real-time video with AI counting |
| Video Upload | Upload videos for crowd analysis |
| Location Management | Add/edit/delete locations |
| Analytics Dashboard | Historical data, charts, insights |
| System Settings | Thresholds, notifications, config |

---

## Chennai Locations (15 Total)

### 🏬 Malls (4)
1. Express Avenue Mall
2. Phoenix MarketCity
3. VR Chennai
4. Forum Vijaya Mall

### 🏖️ Beaches (2)
5. Marina Beach
6. Besant Nagar Beach (Elliot's Beach)

### 🌳 Parks (2)
7. Guindy National Park
8. Semmozhi Poonga

### 🚉 Transit (3)
9. Chennai Central Station
10. Chennai Egmore Station
11. CMBT Bus Terminus

### 🛍️ Markets (2)
12. T. Nagar Ranganathan Street
13. Pondy Bazaar

### 🏛️ Attractions (2)
14. Government Museum
15. Valluvar Kottam

---

## Design Theme

### Colors
| Element | Color | Hex |
|---------|-------|-----|
| Primary Background | White | `#FFFFFF` |
| Secondary/Accents | Black | `#0A0A0A` |
| LOW Crowd | Green | `#10B981` |
| MEDIUM Crowd | Amber | `#F59E0B` |
| HIGH Crowd | Red | `#EF4444` |

### Key Features
- **Light theme only** (no dark mode)
- **Glassmorphism** on all cards
- **Smooth animations** everywhere
- **Pulsing indicators** for live data
- **Count-up animations** for numbers

---

## Development Workflow

### Step 1: Frontend (Lovable)
1. Copy contents of `LOVABLE_FRONTEND_PROMPT.md`
2. Paste into Lovable
3. Let it generate the React frontend
4. Review and iterate

### Step 2: Backend (Claude Opus)
1. Copy contents of `BACKEND_AGENT_PROMPT.md`
2. Paste into Claude Opus
3. Let it build the FastAPI backend
4. Test API endpoints

### Step 3: Integration
1. Start backend: `uvicorn main:app --reload --port 8000`
2. Start frontend: `npm run dev`
3. Verify API connections
4. Test all features

---

## API Quick Reference

### Public Endpoints
```
GET  /api/locations              # All locations with status
GET  /api/locations/{id}         # Location detail + popular times
GET  /api/predictions            # Crowd predictions
GET  /api/predictions/{id}/weekly # Weekly heatmap
```

### Admin Endpoints
```
WS   /ws/camera/live            # Live camera stream
POST /api/upload/video          # Upload video
GET  /api/admin/analytics/*     # Analytics data
POST /api/admin/locations       # Create location
```

---

## Running Locally

### Backend
```bash
cd d:\crowdex\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd d:\crowdex
npm install
npm run dev
```

### Or Use Batch Files
```bash
start-backend.bat   # Starts FastAPI server
start-frontend.bat  # Starts React dev server
start-all.bat       # Starts both
```

---

## Important Files

```
d:\crowdex\
├── LOVABLE_FRONTEND_PROMPT.md   # 📋 Frontend prompt for Lovable
├── BACKEND_AGENT_PROMPT.md      # 📋 Backend prompt for Claude Opus
├── CROWDEX_PROJECT_DOCUMENT.md  # 📖 Project documentation
├── README.md                    # This file
├── src/                         # Frontend React code
├── backend/                     # Backend Python code
├── start-all.bat               # Launch script
└── package.json                # Frontend dependencies
```

---

## Questions?

Refer to the detailed prompts:
- **Frontend questions:** See `LOVABLE_FRONTEND_PROMPT.md`
- **Backend questions:** See `BACKEND_AGENT_PROMPT.md`
- **Project questions:** See `CROWDEX_PROJECT_DOCUMENT.md`

---

*Document prepared: January 28, 2026*
