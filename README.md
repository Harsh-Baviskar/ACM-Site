# ACM Student Chapter Website

Full-stack **React + Vite + Node.js / Express** website for an ACM student chapter.

Scroll-driven blue gradient · Glassmorphism · 3D card effects · Cinematic section transitions · Animated particle canvas · Custom cursor

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite 5                  |
| Backend  | Node.js, Express 4                |
| Fonts    | Instrument Serif, DM Sans         |
| Build    | Vite (ESM, no Webpack/CRA)        |

---

## Project Structure

```
acm-site/
├── client/                  # Vite + React frontend
│   ├── index.html           # Vite root HTML (NOT inside public/)
│   ├── vite.config.js       # Vite config + /api proxy to :5000
│   ├── package.json
│   └── src/
│       ├── main.jsx         # React entry point
│       └── App.jsx          # Entire site component
│
├── server/                  # Express REST API
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### 1. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Run in development

Open **two terminals**:

```bash
# Terminal 1 — API server (port 5000)
cd server
npm run dev

# Terminal 2 — Vite dev server (port 3000)
cd client
npm run dev
```

Open **http://localhost:3000** — API calls to `/api/*` are proxied to `:5000` automatically via `vite.config.js`.

---

## API Endpoints

| Method | Endpoint        | Description             |
|--------|-----------------|-------------------------|
| GET    | /api/health     | Health check            |
| GET    | /api/stats      | Chapter stats           |
| GET    | /api/events     | All events              |
| GET    | /api/team       | Team members            |
| GET    | /api/projects   | Projects & achievements |
| POST   | /api/contact    | Contact form submission |

---

## Production Build

```bash
# Build the React app
cd client
npm run build          # outputs to client/dist/

# Serve everything from Express
cd ../server
NODE_ENV=production node index.js
```

Express will serve the static `client/dist/` and handle SPA routing via a catch-all.

## Deploy to Vercel

This repository includes a root `vercel.json` for a single Vercel project. It builds the Vite client and exposes the Express API through `/api/*` serverless functions.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New → Project**, import the repository, and keep the project root at the repository root.
3. Deploy with the settings from `vercel.json`.

The deployed site will be available at the Vercel URL. Check the API with `/api/health`.

The contact endpoint currently logs messages in the function logs and does not persist submissions. Use a database or email provider before relying on it in production.

---

## Customization

- Replace `"University Name"` with your college name in `App.jsx` and `index.html`
- Swap Unsplash image URLs for real event/member photos
- Update `server/index.js` data arrays with real content
- Change `mailto:acm@university.edu` to your chapter's email

---

## Design Features

| Feature | Detail |
|---|---|
| Scroll gradient | Icy white-blue → deep navy, all colours lerp continuously |
| Particle canvas | Interactive dot network, reacts to mouse position |
| Floating orbs | Parallax glassmorphic blur orbs |
| Section transitions | slideUp · zoomIn · slideLeft · slideRight · popUp per section |
| Event cards | Cover image, 3D hover tilt, frosted glass, date badge |
| Team cards | Photo + bio overlay on hover |
| Projects list | Editorial row, horizontal slide on hover |
| Custom cursor | Dot + lagging ring |
| CTA rings | Rotating concentric decorative borders |
