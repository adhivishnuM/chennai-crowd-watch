# Crowdex Technical Stack Documentation

This document provides a deep dive into the technologies, libraries, and architectural decisions powering **Crowdex** (Chennai Crowd Watch). It is designed to help developers and judges understand the "how" behind the application.

---

## High-Level Architecture

Crowdex operates as a modern **Client-Server application** with a heavy focus on real-time data and automated computer vision processing.

*   **Frontend (Client):** A Single Page Application (SPA) built with React that handles all user interaction, data visualization, and map rendering.
*   **Backend (Server):** A high-performance Python server that manages APIs, handles long-running WebSocket connections for video streams, and runs the YOLOv8 inference engine.
*   **Authentication:** Firebase Authentication with Google Sign-In for admin access control.
*   **Communication:**
    *   **REST API:** For static data (location lists, historical stats, camera management).
    *   **WebSockets:** For real-time, low-latency video streaming and live people-counting updates.

---

## Frontend Stack (User Interface)

The frontend is built for speed, clarity, and visual impact.

### 1. Core Framework
*   **[React 18](https://react.dev/):** The UI library used for building component-based interfaces.
    *   *Why:* Allows for a modular codebase (`Navbar`, `CrowdMap`, `LocationCard` are separate components) and efficient state management.
*   **[Vite](https://vitejs.dev/):** The build tool and development server.
    *   *Why:* Provides near-instant hot module replacement (HMR) during development and highly optimized production builds.
*   **[TypeScript](https://www.typescriptlang.org/):** Adds static typing to JavaScript.
    *   *Why:* Prevents common bugs (like accessing properties on undefined objects) and provides excellent autocomplete in VS Code.

### 2. Styling & Design System
*   **[Tailwind CSS](https://tailwindcss.com/):** A utility-first CSS framework.
    *   *Why:* Speeds up styling by using classes like `flex`, `p-4`, `text-center` instead of writing custom CSS files.
*   **Apple-Inspired Clean Design (CSS Variables):**
    *   *Implementation:* Defined in `index.css` using HSL CSS variables for colors (`--primary`, `--secondary`, `--crowd-low`, etc.).
    *   *Style:* Clean white cards with subtle shadows (`0 1px 2px rgba(0,0,0,0.04)`), not heavy blur/glassmorphism effects.
    *   *Why:* Creates a premium, minimalist aesthetic similar to Apple's design language.
*   **[Lucide React](https://lucide.dev/):** Icon library.
    *   *Why:* Provides clean, consistent, and lightweight vector icons (SVG). Used for location type icons (Building2, Train, TreePine, etc.) and UI elements.
*   **[Shadcn UI](https://ui.shadcn.com/):** Component library built on Radix UI.
    *   *Why:* Accessible, pre-styled components that ensure a consistent look across the admin dashboard and public views.

### 3. State Management & Data Fetching
*   **[React Context](https://react.dev/reference/react/useContext):** For authentication state (`AuthContext`).
    *   *Why:* Provides user/role information throughout the component tree.
*   **[@tanstack/react-query](https://tanstack.com/query/latest):** Handles server state (API calls).
    *   *Why:* Automatically caches API responses and handles "Loading" and "Error" states.
*   **[Sonner](https://sonner.emilkowal.ski/):** Toast notification library.
    *   *Why:* Provides sleek, high-performance feedback for user actions.

### 4. Visualization & Maps
*   **[React Leaflet](https://react-leaflet.js.org/):** The interactive map component.
    *   *Why:* A React wrapper around Leaflet.js. Uses Carto Positron tiles (free, no API key required) and custom pulsing markers based on crowd level.
    *   *Tile URL:* `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
*   **[Recharts](https://recharts.org/):** Data visualization library.
    *   *Why:* Composable and responsive charting library for popular times charts and trend visualizations.

### 5. Animation
*   **[Framer Motion](https://www.framer.com/motion/):** A production-ready animation library.
    *   *Why:* Powers smooth page transitions, card entrance animations, and micro-interactions with spring physics.
*   **[react-countup](https://www.npmjs.com/package/react-countup):** Animated number counting.
    *   *Why:* Creates smooth counting animations for statistics displays.

### 6. Authentication
*   **[Firebase Auth](https://firebase.google.com/docs/auth):** Google Sign-In authentication.
    *   *Why:* Secure, easy-to-implement authentication with role-based access control (user/admin).
*   **[Firestore](https://firebase.google.com/docs/firestore):** User profile and role storage.
    *   *Why:* Stores user roles to determine admin access.

---

## Backend Stack (Intelligence Engine)

The backend is the brain of Crowdex, handling the heavy lifting of computer vision.

### 1. Core Server
*   **[FastAPI](https://fastapi.tiangolo.com/):** A modern, fast web framework for building APIs with Python.
    *   *Why:* One of the fastest Python frameworks (comparable to NodeJS), natively supports **Asynchronous** programming (`async/await`), crucial for handling multiple camera streams simultaneously.
*   **[Uvicorn](https://www.uvicorn.org/):** The ASGI web server implementation.
    *   *Why:* Runs the FastAPI application, handling HTTP and WebSocket connections.

### 2. Computer Vision & Automated Detection
*   **[YOLOv8 (Ultralytics)](https://docs.ultralytics.com/):** "You Only Look Once" - State-of-the-art Object Detection model.
    *   *Why:* Incredibly fast and accurate. We use the `yolov8n.pt` (Nano) model optimized to run on CPUs while detecting people in real-time.
    *   *Implementation:* Singleton pattern in `services/detector.py`, filters for `class=0` (Person) only.
*   **[OpenCV (cv2)](https://opencv.org/):** Open Source Computer Vision Library.
    *   *Why:* Used for video frame reading, image resizing, drawing bounding boxes, and encoding frames as JPEG bytes.
*   **[NumPy](https://numpy.org/):** Fundamental package for scientific computing.
    *   *Why:* Used internally by OpenCV to handle image data as efficient multi-dimensional arrays.
*   **[yt-dlp](https://github.com/yt-dlp/yt-dlp):** Command-line media downloader and stream extractor.
    *   *Why:* Extracts direct stream URLs from YouTube Live for real-time crowd analysis.
*   **[Python-Multipart](https://andrew-d.github.io/python-multipart/):** Support for `multipart/form-data`.
    *   *Why:* Enables handling large video file uploads for offline detection analysis.

### 3. Real-Time Streaming
*   **WebSockets:** Standard protocol for two-way communication.
    *   *Why:* Keeps a channel open to "push" video frames and crowd counts to the frontend continuously.
    *   *Data Format:* Alternates between binary JPEG frames and JSON metadata (`{count, camera_id, timestamp}`).

### 4. Stream Types Supported
*   **RTSP:** Direct camera streams
*   **HLS (m3u8):** HTTP Live Streaming
*   **HTTP Streams:** Direct video URLs
*   **YouTube Live:** Via yt-dlp URL extraction

---

## Key Data Structures

### Location (70 Chennai Locations)
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
}
```

### Transport Routes
- **12 Bus Routes:** Major Chennai MTC routes with live occupancy
- **6 Train Routes:** MRTS, Metro, Suburban, EMU lines

---

## Key Technical Concepts

### Edge Vision Processing
Instead of sending massive video files to a cloud server (which is slow and expensive), Crowdex performs **Edge Inference**. The Python backend processes video frame-by-frame locally, extracts the metadata (count: 45 people), and only sends that light data or the processed frame to the frontend. This ensures privacy and speed.

### Singleton Pattern (Detector)
The YOLOv8 model is loaded once and shared across all requests. This prevents the expensive model loading from happening on every API call.

### Frame Skip Processing
For video uploads, a `frame_skip` parameter (1-60) controls processing speed vs. accuracy. Higher values process fewer frames, enabling quick scans of long videos.

### Asynchronous Concurrency
The backend uses Python's `asyncio`. This means the server can:
1. Receive a frame from Camera A
2. While processing Camera A, accept a request for "Marina Beach History"
3. Return results for both without blocking

This non-blocking architecture keeps the app responsive during heavy video processing.

### Time-Based Crowd Patterns
Mock data uses realistic hourly patterns per location type:
- Locations return 0 count when closed
- Weekend multipliers for leisure locations (1.4x)
- Rush hour multipliers for transit (1.3x during 7-10am, 5-8pm)
- Seeded random for consistent daily variation

### Component Composition (Frontend)
The frontend uses **Atomic Design principles**. Small components (`CrowdBadge`, `LocationTypeIcon`) combine into `LocationCard`, which forms `MapDashboard`. This makes the code maintainable and readable.

---

*Document updated: February 1, 2026*
