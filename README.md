# Chennai Crowd Watch (CROWDEX)

**Chennai Crowd Watch** is a cutting-edge Real-Time Public Crowd Awareness System designed for Chennai, India. It empowers users with live crowd data to make informed decisions before visiting popular public locations.

> **Tagline:** *"Know Before You Go"*

## 🚀 Project Overview

This application serves two primary user groups:
1.  **Public Users:** Can view real-time crowd status, "best time to visit" recommendations, and popular time trends for malls, beaches, parks, and transit hubs.
2.  **Administrators:** Have access to a powerful dashboard for managing camera feeds, uploading videos for analysis, and viewing detailed analytics.

### Key Features

*   **Real-Time Crowd Monitoring:** Live crowd levels (Low, Medium, High) displayed on an interactive map.
*   **Interactive Map:** Built with Leaflet, showcasing various Chennai landmarks with custom markers.
*   **Data Visualization:** "Popular Times" charts and historical trends using Recharts.
*   **AI-Powered Analysis:** Backend integration with YOLOv8 for detecting and counting people in video feeds (uploaded or live).
*   **Dual-Mode Interface:** Seamless toggle between Public Mode (User) and Admin Mode.
*   **Modern UI/UX:** Designed with Glassmorphism, smooth animations (Framer Motion), and a clean, light-themed aesthetic.

## 🛠️ Technology Stack

### Frontend
*   **Framework:** React 18 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Shadcn UI, Lucide React
*   **Maps:** Leaflet, React Leaflet
*   **Animations:** Framer Motion
*   **Charts:** Recharts
*   **State/Data:** React Query, React Hook Form

### Backend
*   **Framework:** FastAPI (Python)
*   **AI/ML:** YOLOv8 (Ultralytics) for object detection
*   **Video Processing:** OpenCV
*   **Communication:** WebSockets for live updates

## 📂 Project Structure

```bash
chennai-crowd-watch/
├── src/                # Frontend source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages (Public & Admin)
│   ├── hooks/          # Custom React hooks
│   └── data/           # Mock data and configuration
├── backend/            # Backend source code
│   ├── services/       # Business logic (Video processing, etc.)
│   ├── routers/        # API endpoints
│   └── main.py         # Entry point for FastAPI
└── README.md           # Project documentation
```

## ⚡ Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   Node.js (v18 or higher)
*   Python (v3.9 or higher)

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
Open a new terminal, navigate to the project root, and install frontend dependencies.

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will typically run on `http://localhost:8080` (or similar), and the backend API will be available at `http://localhost:8000`.

## 🖥️ Usage

*   **Public View:** Open the application in your browser. You will see the map of Chennai with various location markers. Click on any marker to see details like current crowd status and popular times.
*   **Admin Panel:** Toggle the switch in the navigation bar (if available) or navigate to `/admin` to access the dashboard. Here you can upload videos for analysis or view live camera simulations.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
