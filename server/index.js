const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const events = [
  { id:1, tag:"Hackathon",   date:"Mar 28–29, 2026", title:"HackACM Spring Edition",      desc:"24-hour build-anything hackathon. ₹50,000 in prizes across five tracks.", venue:"Main Auditorium",        img:"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80" },
  { id:2, tag:"Workshop",    date:"Mar 15, 2026",    title:"Intro to ML with PyTorch",     desc:"Hands-on neural nets from tensors to training loops. Build your first image classifier.", venue:"LH-301 · 90 min",    img:"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80" },
  { id:3, tag:"Talk",        date:"Apr 5, 2026",     title:"Distributed Systems at Scale", desc:"A senior engineer on the realities of building systems that serve millions.", venue:"Seminar Hall A",          img:"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80" },
  { id:4, tag:"Bootcamp",    date:"Apr 12–14, 2026", title:"Full-Stack Web Dev Bootcamp",  desc:"React, Node, databases, deployment — three days, one live project you take home.", venue:"CS Lab 2 · Beginner", img:"https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80" },
  { id:5, tag:"Competition", date:"Apr 20, 2026",    title:"Competitive Programming",      desc:"3-hour ICPC-style contest spanning algorithms, data structures and math.", venue:"CS Lab 1 · Individual",   img:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" },
  { id:6, tag:"Panel",       date:"May 3, 2026",     title:"Careers in Computing",         desc:"Six alumni across industry, research and startups. Candid career insights.", venue:"Amphitheatre · Open",    img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" },
];

const team = [
  { id:1, name:"Arjun Kumar",  role:"President",         bio:"Final year CS student. Distributed systems, open-source advocate, chapter strategy lead.",  img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { id:2, name:"Priya Sharma", role:"Vice President",    bio:"ML researcher and hackathon organiser. Drives the technical workshop calendar.",              img:"https://images.unsplash.com/photo-1494790108755-2616b612b188?w=400&q=80" },
  { id:3, name:"Rohan Nair",   role:"Technical Lead",    bio:"Full-stack developer. Manages chapter projects, codebase and the developer community.",       img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
  { id:4, name:"Sanya Mehta",  role:"Events Director",   bio:"Designer and logistics expert. Every event from conception to unforgettable execution.",      img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
  { id:5, name:"Vikram Rao",   role:"Secretary",         bio:"Detail-oriented, keeps records, minutes and inter-org communication airtight.",               img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
  { id:6, name:"Ananya Joshi", role:"Treasurer",         bio:"Finance x CS double major. Budget, sponsorships and financial planning.",                     img:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
  { id:7, name:"Karan Patel",  role:"Outreach Lead",     bio:"Manages industry relations, alumni network and external partnerships.",                       img:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  { id:8, name:"Divya Gupta",  role:"Creative Director", bio:"UI/UX designer. Brand, design systems, social media and all creative communications.",        img:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80" },
];

const projects = [
  { id:1, idx:"01", title:"CampusConnect",           desc:"Student platform connecting freshers to clubs, mentors and opportunities. 3,000+ users.",  tag:"Web · React" },
  { id:2, idx:"02", title:"Smart Attendance",        desc:"Face-recognition attendance via OpenCV deployed across two university departments.",        tag:"AI/ML · Python" },
  { id:3, idx:"03", title:"ICPC Regionals Top 12",   desc:"Best-ever result at ICPC Asia Regional 2025 in chapter history.",                          tag:"Achievement" },
  { id:4, idx:"04", title:"Open Source",             desc:"Members contributing to 20+ repos: Linux kernel modules, VS Code extensions, ML libs.",    tag:"OSS" },
  { id:5, idx:"05", title:"Research Publications",   desc:"Three IEEE conference papers co-authored by chapter members in 2024-25.",                  tag:"Research" },
];

const stats = { members: 240, events: 48, partners: 12, founded: 2018 };

app.get('/api/health',   (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/api/stats',    (_req, res) => res.json(stats));
app.get('/api/events',   (_req, res) => res.json(events));
app.get('/api/team',     (_req, res) => res.json(team));
app.get('/api/projects', (_req, res) => res.json(projects));

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required.' });
  console.log(`[Contact] ${name} <${email}>: ${message}`);
  res.json({ success: true, message: 'Message received! We will get back to you shortly.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

app.listen(PORT, () => console.log(`ACM API running on http://localhost:${PORT}`));
