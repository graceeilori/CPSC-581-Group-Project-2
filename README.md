# CPSC-581-Group-Project-2
Repository for the second group project of CPSC 581

## Project Structure
```
CPSC-581-Group-Project-2/
├── my-app/       ← Next.js frontend
└── server/       ← Node.js socket server
```

## Prerequisites

Make sure you have these installed:
- Node.js
- npm

---

## Setup — First Time Only

### 1. Clone the repo
```bash
git clone https://github.com/ChristianN517/CPSC-581-Group-Project-2.git
cd CPSC-581-Group-Project-2
```

### 2. Install frontend dependencies
```bash
cd my-app
npm install
```

### 3. Install server dependencies
```bash
cd ../server
npm install
```

---

## Running the App

You need **two terminals open at the same time.**

### Terminal 1: Socket Server
```bash
cd server
node index.js
```
Server runs on `http://localhost:3001`

### Terminal 2: Next.js Frontend
```bash
cd my-app
npm run dev
```
Frontend runs on `http://localhost:3000`

---

## Key Dependencies Added

| Package | Location | Purpose |
|---|---|---|
| `socket.io` | `server/` | Real-time event server |
| `cors` | `server/` | Allows cross-origin requests |
| `socket.io-client` | `my-app/` | Connects frontend to socket server |
| `three` | `my-app/` | 3D rendering engine |
| `@react-three/fiber` | `my-app/` | React renderer for Three.js |
| `@react-three/drei` | `my-app/` | Three.js helper components |

---

## Notes
- Both the server and frontend must be running at the same time for the app to work
- If you get a CORS error, make sure the server is running on port `3001`