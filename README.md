# 🏛️ People's Priorities AI

**Empowering Democracy through Multi-Agent Civic Intelligence.**

People's Priorities AI is a next-generation civic engagement platform designed to transform how citizens propose and prioritize public development projects. By leveraging **Google Gemini AI Multi-Agents**, the platform analyzes community demand, clusters similar requests, and provides municipal planners with data-driven budget allocation strategies.

## 🚀 Key Features

### 1. 🤖 Multi-Agent Civic Pipeline
The platform uses a collaborative AI agent architecture to process citizen feedback:
- **Feedback & Vision Agent:** Analyzes visual evidence (photos of broken roads, muddy paths, etc.) and categorizes needs in real-time.
- **Priority & Impact Agent:** Calculates urgency scores and estimates direct beneficiaries based on population data and community voting.
- **AI Budget Planner:** Drafts optimal budget distributions (₹2Cr - ₹5Cr) across sectors like Roads, Education, and Health.
- **Planning Agent:** Clusters related requests to suggest comprehensive development projects instead of isolated fixes.

### 2. 🗺️ Interactive Demand Hotspots
A real-time map interface that visualizes:
- **Concentrated Demand:** See where citizens are requesting schools, water treatment, or road repairs most urgently.
- **Infrastructure Gaps:** Heatmaps showing areas with low connectivity or poor public facilities.

### 3. 💬 AI Civic Companion (Multilingual)
A 24/7 AI Assistant that supports **Hindi, English, Marathi, Tamil, and Bengali**:
- **Scheme Discovery:** Helps citizens find relevant government schemes (Ayushman Bharat, PM Kisan, etc.).
- **Document Checklist:** Provides requirements for passports, driving licenses, and other civic services.
- **Complaint Tracking:** Real-time status updates on submitted ward reports.

### 4. 📊 Admin Decision Dashboard
A powerful interface for Municipal Commissioners and Planners:
- **AI-Generated Analytics:** Visualizes trends, department performance, and category distributions using Recharts.
- **Project Dispatch:** Directly assign verified citizen proposals to relevant departments (PWD, Water Board, etc.).

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion).
- **AI Engine:** Google Gemini (via `@google/genai`).
- **Backend:** Node.js (Express), TSX.
- **Database/Auth:** Firebase (Firestore & Authentication).
- **Visualization:** Recharts (Charts) & Google Maps API.

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tanya-garg10/peoples-priorities-ai.git
   cd peoples-priorities-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_key
   # Add other Firebase config variables from your console
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📸 Project Workflow

1. **Citizen Proposal:** A citizen uploads a photo of a civic issue (e.g., a pothole) and describes the need.
2. **AI Analysis:** The **Vision Agent** confirms the issue from the photo, and the **Impact Agent** assigns a priority level.
3. **Community Consensus:** Other citizens can vote/support the proposal to increase its "Democratic Score."
4. **Budget Dispatch:** AI clusters similar local requests and presents a "Budget Dispatch" to the Municipal Commissioner for approval.

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  Built with ❤️ for a Smarter, More Democratic Future.
</div>
