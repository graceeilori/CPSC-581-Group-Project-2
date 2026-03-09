# CPSC-581-Group-Project-2
Repository for the second group project of CPSC 581

## Project Structure
```
CPSC-581-Group-Project-2/
├── my-app/       ← Next.js frontend
└── server/       ← Node.js socket server
```
## Dev HTTPS with mkcert (step-by-step)

These steps show how to generate a locally-trusted certificate for your machine's LAN IP and `localhost` using `mkcert`, place the files in the `server/` folder, and start the socket server with TLS. A helper PowerShell script is included at `server/mkcert-and-start.ps1` to automate steps 2–3.

Prerequisites:
- Windows machine used for development
- `mkcert` installed (see step 1)

Step 1 — Install mkcert and trust the local CA

If you use Chocolatey:

```powershell
choco install mkcert -y
mkcert -install
```

If you use Scoop:

```powershell
scoop install mkcert
mkcert -install
```

Example output (successful):

```
Created a new local CA in C:\Users\UserName\AppData\Local\mkcert
The local CA is now installed in the system trust store!
```

Step 2 — Generate certificate and key for your LAN IP and localhost

Open PowerShell and change to the server folder:

```powershell
cd C:\Users\User\GitHub\\server
```

Find your machine's LAN IP (example `177.177.1.100`) or supply it directly. Then run:

```powershell
mkcert -cert-file cert.pem -key-file key.pem 177.177.1.100 localhost
```

Replace `177.177.1.100` with your LAN IP. Example output:

```
Created a new certificate valid for the following names: 177.177.1.100, localhost
Wrote cert.pem
Wrote key.pem
```

You should now see `cert.pem` and `key.pem` in the `server/` folder alongside `index.js`.

Step 3 — Start the socket server with the generated cert/key

Option A — Use the included PowerShell helper (recommended):

```powershell
# from the repository root
cd server
.\mkcert-and-start.ps1
```

The helper will detect your primary LAN IP (or prompt you), run `mkcert` if necessary, create `cert.pem`/`key.pem` in the `server/` folder, set the required environment variables for the session, and then start `node index.js`.

Example server output when HTTPS is active:

```
HTTPS server listening on https://0.0.0.0:3001
Socket.io running
```

Option B — Manually set environment variables then start the server:

```powershell
$env:SSL_CERT_PATH = 'C:\Users\UserName\GitHub\server\cert.pem'
$env:SSL_KEY_PATH  = 'C:\Users\UserName\GitHub\server\key.pem'
node index.js
```

Step 4 — Test in the browser (same machine)

- Open: `https://177.177.1.100:3001` (replace with your LAN IP)
- Expect: secure padlock, certificate issued by `mkcert development CA`, SAN includes your LAN IP and `localhost`.
- WebRTC: `getUserMedia()` will now work in Chrome when the page is served from an HTTPS origin.

Step 5 — Test from another device on the LAN (optional)

Either run `mkcert -install` on that device as well (recommended), or export and install the mkcert CA root from your dev machine:

```powershell
# on dev machine
mkcert -CAROOT
# copy the file 'rootCA.pem' from the printed folder to the other device and install it into that machine's "Trusted Root Certification Authorities" store
```

After installing the CA on the other device, open `https://177.177.1.100:3001` — the browser should accept the certificate without warnings.

Troubleshooting tips
- If the browser still warns, restart the browser and confirm the CA was installed on that OS.
- Ensure firewall rules allow incoming connections on port `3001`.
- To remove the mkcert CA from your machine: `mkcert -uninstall`.

PowerShell helper script
- The helper is at: `server/mkcert-and-start.ps1`. It will:
	- Check for `mkcert` and run `mkcert -install` if missing
	- Detect a primary LAN IPv4 address (or prompt you)
	- Generate `cert.pem` and `key.pem` in the `server/` folder
	- Start `node index.js` with the environment variables set

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
Server runs on `http://localhost:3001` by default.
The server can also serve TLS directly if you provide cert/key files (useful for testing on another machine on your LAN). See the **HTTPS / LAN testing** section below.

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

## HTTPS / LAN testing (microphone & WebRTC)

Chrome only allows `getUserMedia()` on secure contexts (HTTPS) or `localhost`. To test the app across two machines on the same network (for example `http://192.168.56.1:3000`) you must serve the frontend and socket server over HTTPS.

Two supported options:

- Quick: use `mkcert` to generate a local cert and place it in `server/` as `cert.pem` and `key.pem`. `server/index.js` will automatically use those files and start the socket server with HTTPS. See `DEV_HTTPS.md` for step-by-step mkcert + Caddy instructions and alternatives.

- Explicit env vars: set `SSL_CERT_PATH` and `SSL_KEY_PATH` to point to your cert and key before starting the socket server, e.g. on PowerShell:

```powershell
$env:SSL_CERT_PATH = 'C:\full\path\to\192.168.56.1+localhost.pem'
$env:SSL_KEY_PATH = 'C:\full\path\to\192.168.56.1+localhost-key.pem'
node server/index.js
```

Client socket URL selection:
- The frontend derives the socket URL from the page origin by default (so when you load `https://192.168.56.1:3000` it will try `https://192.168.56.1:3001`).
- You can override the socket URL with an env var `NEXT_PUBLIC_SOCKET_URL` (useful for tunnels or alternate ports).

If you want, follow `DEV_HTTPS.md` for a short Caddy-based reverse-proxy alternative that terminates TLS and proxies to the local ports.