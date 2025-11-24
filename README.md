# MyTrello - Kanban Task Manager with MongoDB Sync

A robust, full-stack Kanban board application inspired by Trello. This application features a React frontend with fluid drag-and-drop capabilities and a Node.js/Express backend that syncs data in real-time to a MongoDB Cloud database.

## 🚀 Features

### Core Functionalities
- **Multi-Board Management**: Create, rename, and delete multiple independent project boards.
- **Drag & Drop Interface**:
  - **Cards**: Move tasks between columns or reorder them within a list.
  - **Lists (Columns)**: Reorder entire columns to organize workflows.
- **Task Details**:
  - Add descriptions to tasks.
  - **Subtasks/Checklists**: Add actionable sub-items with a visual progress bar.
  - Edit task titles and delete tasks.
- **Search**: Real-time filtering of tasks across the current board.

### Backend & Persistence
- **Cloud Sync**: All data is stored securely in MongoDB Atlas.
- **Real-time Status Indicators**: Visual feedback for "Saving...", "Saved to Cloud", or "Sync Error" in the navigation bar.
- **Optimistic UI**: The interface updates instantly while syncing occurs in the background for a seamless user experience.

### Technical Highlights
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, `@dnd-kit` for physics-based drag-and-drop.
- **Backend**: Node.js, Express REST API.
- **Database**: Mongoose ODM with MongoDB Atlas.
- **Architecture**: Component-based architecture with clean separation of concerns (Services, Models, Components).

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Utilities**: `dnd-kit` (Drag and drop), `lucide-react` (Icons)

---

## 📦 Installation & Setup

### Prerequisites
1.  **Node.js**: Ensure Node.js (v16+) is installed.
2.  **MongoDB URI**: The project is pre-configured with a connection string, but for production, ensure you have your own MongoDB Atlas cluster.

### 1. Install Backend Dependencies
Open your terminal in the project root and install the required server packages:

```bash
npm install express mongoose cors dotenv
```

### 2. Configure Environment (Optional)
Currently, the `MONGO_URI` is hardcoded in `server/server.js`. For best practices, create a `.env` file in the root:

```env
MONGO_URI=your_mongodb_connection_string_here
PORT=5000
```
*Note: If you skip this, the app will use the default connection string provided in `server.js`.*

---

## ▶️ How to Run

You need to run the Backend and the Frontend simultaneously.

### Step 1: Start the Backend Server
In your terminal, run:

```bash
node server/server.js
```
You should see: `🚀 Server running on http://localhost:5000` and `✅ MongoDB Connected Successfully`.

### Step 2: Start the Frontend
Since this project uses an `importmap` architecture in `index.html` (no build step required for this specific setup):

1.  Open the `index.html` file directly in a browser (if using a local server extension like Live Server).
2.  **OR** (Recommended) Use a simple HTTP server to serve the files:

```bash
npx serve .
```
Then open the localhost link provided (usually `http://localhost:3000`).

---

## 📂 Project Structure

```
/
├── components/         # React UI Components (Column, TaskCard, TaskModal)
├── services/           # External service integrations (AI/Gemini)
├── server/             # Backend Logic
│   ├── models/         # Mongoose Database Schemas
│   └── server.js       # Express API Entry point
├── App.tsx             # Main Application Logic & State
├── index.html          # Entry point (Import maps & Tailwind)
├── types.ts            # TypeScript Interfaces
└── README.md           # Documentation
```

## 🛡️ API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/boards` | Fetch all boards |
| `POST` | `/api/boards` | Create a new board |
| `PUT` | `/api/boards/:id` | Update a specific board (Sync state) |
| `DELETE` | `/api/boards/:id` | Delete a board |
# My-Trello
