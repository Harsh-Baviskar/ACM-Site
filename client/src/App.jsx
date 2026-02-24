import { useState, useEffect, useRef, useCallback } from "react";

/* ─── GOOGLE FONTS injected once ─── */
const FontLink = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,500&display=swap');
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
    html{scroll-behavior:auto;}
    body{overflow-x:hidden;cursor:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(0,96,210,0.35);border-radius:2px;}
  ` }} />
);

/* ─── COLOUR SYSTEM ─── */
/* Scroll 0→1 drives the entire page from icy white-blue → deep navy */
const lerp = (a, b, t) => a + (b - a) * t;
const lerpColor = (c1, c2, t) => ({
  r: Math.round(lerp(c1.r, c2.r, t)),
  g: Math.round(lerp(c1.g, c2.g, t)),
  b: Math.round(lerp(c1.b, c2.b, t)),
});
const rgb = (c) => `rgb(${c.r},${c.g},${c.b})`;
const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

/* Enhanced interpolation to avoid 'grey' mid-tones */
const multiStopLerp = (stops, t) => {
  if (t <= 0) return stops[0].color;
  if (t >= 1) return stops[stops.length - 1].color;
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i], s2 = stops[i + 1];
    if (t >= s1.pos && t <= s2.pos) {
      const localT = (t - s1.pos) / (s2.pos - s1.pos);
      return lerpColor(s1.color, s2.color, localT);
    }
  }
  return stops[0].color;
};

const TOP_BG = { r: 255, g: 255, b: 255 }; // nearly white with a faint icy tint
const BOT_BG = { r: 5, g: 18, b: 50 }; // near-black navy
const TOP_TEXT = { r: 5, g: 15, b: 50 }; // darker for contrast on light bg
const BOT_TEXT = { r: 235, g: 245, b: 255 }; // brighter for contrast on dark bg
const TOP_ACC = { r: 20, g: 80, b: 180 };
const BOT_ACC = { r: 100, g: 180, b: 255 };

/* High-contrast colors for cards (avoids mid-tone invisibility) */
const CARD_TEXT_DARK = "#193971ff";   /* on light card backgrounds */
const CARD_TEXT_LIGHT = "#f5faff";   /* on dark card backgrounds */

/* ─── IMAGE POOLS ─── */
const EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80", // hackathon
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80", // workshop
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80", // talk
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80", // bootcamp
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80", // team
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80", // conference
];
const TEAM_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "https://content.mycareersfuture.gov.sg/wp-content/uploads/2019/03/Kelvin_-CareersCompass-Generic-Story-733-x-340px-37.jpg",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
];

/* ─── DATA ─── */
const EVENTS = [
  { tag: "Hackathon", date: "Mar 28–29, 2026", title: "HackACM Spring Edition", desc: "24-hour build-anything hackathon. ₹50,000 in prizes across five tracks. Solo or team of four.", venue: "Main Auditorium", img: EVENT_IMAGES[0] },
  { tag: "Workshop", date: "Mar 15, 2026", title: "Intro to ML with PyTorch", desc: "Hands-on neural nets, tensors to training loops. Build your first image classifier in one session.", venue: "LH-301 · 90 min", img: EVENT_IMAGES[1] },
  { tag: "Talk", date: "Apr 5, 2026", title: "Distributed Systems at Scale", desc: "A senior engineer on the realities of building systems that serve millions of daily users.", venue: "Seminar Hall A", img: EVENT_IMAGES[2] },
  { tag: "Bootcamp", date: "Apr 12–14, 2026", title: "Full-Stack Web Dev Bootcamp", desc: "React, Node, databases, deployment — three days, one live project you take home.", venue: "CS Lab 2 · Beginner friendly", img: EVENT_IMAGES[3] },
  { tag: "Competition", date: "Apr 20, 2026", title: "Competitive Programming", desc: "3-hour ICPC-style contest. Problems from algorithms and data structures to pure math.", venue: "CS Lab 1 · Individual", img: EVENT_IMAGES[4] },
  { tag: "Panel", date: "May 3, 2026", title: "Careers in Computing", desc: "Six alumni across industry, research and startups. Candid insights on what the real world looks like.", venue: "Amphitheatre · Open", img: EVENT_IMAGES[5] },
];

const TEAM = [
  { initials: "AK", name: "Arjun Kumar", role: "President", bio: "Final year CS student. Distributed systems, open-source advocate, chapter strategy lead.", img: TEAM_IMAGES[0] },
  { initials: "PS", name: "Priya Sharma", role: "Vice President", bio: "ML researcher and hackathon organiser. Drives the technical workshop calendar.", img: TEAM_IMAGES[1] },
  { initials: "RN", name: "Rohan Nair", role: "Technical Lead", bio: "Full-stack developer. Manages chapter projects, codebase and the developer community.", img: TEAM_IMAGES[2] },
  { initials: "SM", name: "Sanya Mehta", role: "Events Director", bio: "Designer and logistics expert. Every event from conception to unforgettable execution.", img: TEAM_IMAGES[3] },
  { initials: "VR", name: "Vikram Rao", role: "Secretary", bio: "Organised, detail-oriented. Keeps records, minutes and inter-org communication airtight.", img: TEAM_IMAGES[4] },
  { initials: "AJ", name: "Ananya Joshi", role: "Treasurer", bio: "Finance × CS double major. Budget, sponsorships and financial planning.", img: TEAM_IMAGES[5] },
  { initials: "KP", name: "Karan Patel", role: "Outreach Lead", bio: "Manages industry relations, alumni network and external partnerships.", img: TEAM_IMAGES[6] },
  { initials: "DG", name: "Divya Gupta", role: "Creative Director", bio: "UI/UX designer. Brand, design systems, social media and all creative communications.", img: TEAM_IMAGES[7] },
];

const PROJECTS = [
  { idx: "01", title: "CampusConnect", desc: "Student platform connecting freshers to clubs, mentors and opportunities. 3,000+ users.", tag: "Web · React" },
  { idx: "02", title: "Smart Attendance", desc: "Face-recognition attendance via OpenCV, deployed across two university departments.", tag: "AI/ML · Python" },
  { idx: "03", title: "ICPC Regionals — Top 12", desc: "Our competitive programming team's best-ever result at ICPC Asia Regional 2025.", tag: "Achievement" },
  { idx: "04", title: "Open Source", desc: "Members contributing to 20+ repos: Linux kernel modules, VS Code extensions, ML libraries.", tag: "OSS" },
  { idx: "05", title: "Research Publications", desc: "Three papers co-authored by members accepted at IEEE conferences in 2024–25.", tag: "Research" },
];

/* ─── HOOKS ─── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function useInView(threshold = 0.18) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

/* ─── ANIMATED CURSOR ─── */
function Cursor({ mouse }) {
  const ringRef = useRef(null);
  const raf = useRef(null);
  const pos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const animate = () => {
      pos.current.x += (mouse.x - pos.current.x) * 0.13;
      pos.current.y += (mouse.y - pos.current.y) * 0.13;
      if (ringRef.current) {
        ringRef.current.style.left = pos.current.x + "px";
        ringRef.current.style.top = pos.current.y + "px";
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [mouse]);

  return (
    <>
      <div style={{
        position: "fixed", left: mouse.x, top: mouse.y, width: 9, height: 9,
        background: "#3b8aff", borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
        transform: "translate(-50%,-50%)", boxShadow: "0 0 12px rgba(59,138,255,0.7)",
        transition: "width .15s,height .15s"
      }} />
      <div ref={ringRef} style={{
        position: "fixed", width: 36, height: 36,
        border: "1.5px solid rgba(59,138,255,0.55)", borderRadius: "50%",
        pointerEvents: "none", zIndex: 9998, transform: "translate(-50%,-50%)",
        transition: "width .3s,height .3s,border-color .3s"
      }} />
    </>
  );
}

/* ─── PARTICLE HERO CANVAS ─── */
function HeroCanvas({ scrollP }) {
  const canvasRef = useRef(null);
  const state = useRef({ particles: [], w: 0, h: 0, mx: -1000, my: -1000, raf: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = state.current;

    const resize = () => {
      s.w = canvas.width = canvas.offsetWidth;
      s.h = canvas.height = canvas.offsetHeight;
      init();
    };

    const init = () => {
      s.particles = [];
      const count = Math.floor((s.w * s.h) / 7500);
      for (let i = 0; i < count; i++) {
        s.particles.push({
          x: Math.random() * s.w, y: Math.random() * s.h,
          vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
          r: Math.random() * 1.8 + .4, a: Math.random() * .45 + .15,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, s.w, s.h);
      s.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > s.w) p.vx *= -1;
        if (p.y < 0 || p.y > s.h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60,130,255,${p.a})`;
        ctx.fill();
      });
      // lines
      for (let i = 0; i < s.particles.length; i++) {
        for (let j = i + 1; j < s.particles.length; j++) {
          const dx = s.particles[i].x - s.particles[j].x;
          const dy = s.particles[i].y - s.particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(s.particles[i].x, s.particles[i].y);
            ctx.lineTo(s.particles[j].x, s.particles[j].y);
            ctx.strokeStyle = `rgba(60,130,255,${(1 - d / 130) * .1})`;
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        }
        // mouse
        const md = Math.hypot(s.particles[i].x - s.mx, s.particles[i].y - s.my);
        if (md < 170) {
          ctx.beginPath();
          ctx.moveTo(s.particles[i].x, s.particles[i].y);
          ctx.lineTo(s.mx, s.my);
          ctx.strokeStyle = `rgba(80,160,255,${(1 - md / 170) * .3})`;
          ctx.lineWidth = .8;
          ctx.stroke();
        }
      }
      s.raf = requestAnimationFrame(draw);
    };

    const onMM = (e) => {
      const r = canvas.getBoundingClientRect();
      s.mx = e.clientX - r.left; s.my = e.clientY - r.top;
    };
    const onML = () => { s.mx = -1000; s.my = -1000; };

    window.addEventListener("resize", resize);
    canvas.parentElement?.addEventListener("mousemove", onMM);
    canvas.parentElement?.addEventListener("mouseleave", onML);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener("resize", resize);
      canvas.parentElement?.removeEventListener("mousemove", onMM);
      canvas.parentElement?.removeEventListener("mouseleave", onML);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 1 - scrollP * 3 }} />;
}

/* ─── FLOATING 3D ORBS ─── */
/* ─── FLOATING 3D ORBS ─── */
function Orbs({ scrollP }) {
  const orbs = [
    // Top Orbs (Very low opacity to keep background white)
    { size: 900, x: "85%", y: "15%", blur: 120, opacity: 0.08, delay: 0, speed: 100 },
    { size: 700, x: "10%", y: "30%", blur: 100, opacity: 0.06, delay: 0.8, speed: 140 },
    { size: 800, x: "30%", y: "10%", blur: 110, opacity: 0.05, delay: 2.2, speed: 80 },

    // Middle Orbs
    { size: 1000, x: "90%", y: "65%", blur: 140, opacity: 0.12, delay: 1.5, speed: 190 },
    { size: 850, x: "60%", y: "85%", blur: 120, opacity: 0.14, delay: 3.0, speed: 220 },
    { size: 600, x: "40%", y: "50%", blur: 90, opacity: 0.09, delay: 4.0, speed: 160 },
    { size: 700, x: "5%", y: "80%", blur: 110, opacity: 0.11, delay: 5.2, speed: 200 },
    { size: 950, x: "50%", y: "45%", blur: 130, opacity: 0.10, delay: 6.5, speed: 170 },

    // Extra Sprawl Orbs
    { size: 500, x: "2%", y: "15%", blur: 80, opacity: 0.04, delay: 7.0, speed: 110 },
    { size: 850, x: "75%", y: "40%", blur: 120, opacity: 0.07, delay: 8.5, speed: 180 },
    { size: 1100, x: "15%", y: "90%", blur: 150, opacity: 0.18, delay: 9.2, speed: 260 },
    { size: 900, x: "80%", y: "95%", blur: 130, opacity: 0.20, delay: 10.5, speed: 280 },
    { size: 650, x: "95%", y: "55%", blur: 100, opacity: 0.08, delay: 11.8, speed: 150 },
    { size: 750, x: "25%", y: "70%", blur: 115, opacity: 0.13, delay: 13.0, speed: 210 },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {orbs.map((o, i) => {
        // Opacity increases as you scroll down to handle the background transition from white to navy
        const dynamicOpacity = o.opacity * (0.35 + scrollP * 0.65);
        const parallaxY = scrollP * o.speed;

        return (
          <div key={i} style={{
            position: "absolute", left: o.x, top: o.y,
            width: o.size, height: o.size,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, rgba(100,180,255,${dynamicOpacity}), rgba(30,80,200,${dynamicOpacity * 0.6}), transparent 75%)`,
            filter: `blur(${o.blur}px)`,
            transform: `translate(-50%,-50%) translateY(${parallaxY}px)`,
            transition: "transform .1s linear",
            animation: `orbFloat ${10 + i * 2}s ease-in-out infinite alternate`,
            animationDelay: `${o.delay}s`,
          }} />
        );
      })}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes orbFloat {
          from { transform: translate(-50%,-50%) translateY(0) scale(1); }
          to   { transform: translate(-50%,-50%) translateY(-40px) scale(1.06); }
        }
      ` }} />
    </div>
  );
}

/* ─── NAV ─── */
function Nav({ scrollP, bgColor, textColor }) {
  const accentC = lerpColor(TOP_ACC, BOT_ACC, scrollP);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 56px", height: 70,
      background: rgba(bgColor, .82),
      backdropFilter: "blur(20px) saturate(1.4)",
      borderBottom: `1px solid ${rgba(accentC, .15)}`,
      transition: "background .4s, border .4s",
    }}>
      {/* Left: ACM logo */}
      <a href="#home" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: rgb(textColor), lineHeight: 1.3 }}>
          <img src="/pvgacm.png" alt="ACM" style={{ width: "39%", height: "39%", objectFit: "contain" }} />
        </div>
      </a>
      {/* Center: nav links */}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 40 }}>
        {["About", "Events", "Team", "Projects"].map(s => (
          <a key={s} href={`#${s.toLowerCase()}`} style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
            color: rgba(textColor, .9), textDecoration: "none", letterSpacing: ".1em",
            textTransform: "uppercase", transition: "color .2s",
          }}
            onMouseEnter={e => e.target.style.color = rgb(accentC)}
            onMouseLeave={e => e.target.style.color = rgba(textColor, .9)}
          >{s}</a>
        ))}
        <a href="#join" style={{
          padding: "9px 22px", background: rgb(accentC), color: "white",
          borderRadius: 5, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
          textDecoration: "none", boxShadow: `0 4px 16px ${rgba(accentC, .45)}`,
          transition: "transform .2s, box-shadow .2s",
        }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 8px 24px ${rgba(accentC, .6)}`; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = `0 4px 16px ${rgba(accentC, .45)}`; }}
        >Join Us</a>
      </div>
      {/* Right: college logo placeholder */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", minWidth: 38 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: rgba(accentC, .15), border: `1px dashed ${rgba(accentC, .4)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
        }} title="Add college logo: replace this div with <img src='/path/to/logo.png' alt='College' style={{width:'100%',height:'100%',objectFit:'contain'}}">
          {/* Replace this with: <img src="/your-college-logo.png" alt="College" style={{width:"100%",height:"100%",objectFit:"contain"}} /> */}
        </div>
      </div>
    </nav>
  );
}

/* ─── SECTION WRAPPER with scroll-triggered entrance ─── */
function Section({ id, children, style = {}, transition = "slideUp" }) {
  const [ref, visible] = useInView(0.12);
  const transforms = {
    slideUp: visible ? "translateY(0)" : "translateY(60px)",
    slideLeft: visible ? "translateX(0)" : "translateX(-80px)",
    slideRight: visible ? "translateX(0)" : "translateX(80px)",
    zoomIn: visible ? "scale(1)" : "scale(.92)",
    zoomOut: visible ? "scale(1)" : "scale(1.06)",
    popUp: visible ? "scale(1) translateY(0)" : "scale(.88) translateY(40px)",
  };
  return (
    <section id={id} ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: transforms[transition],
      transition: "opacity .9s cubic-bezier(.4,0,.2,1), transform .9s cubic-bezier(.4,0,.2,1)",
      ...style,
    }}>
      {children}
    </section>
  );
}

/* ─── STAGGERED CHILD ─── */
function Stagger({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity .8s ${delay}s cubic-bezier(.4,0,.2,1), transform .8s ${delay}s cubic-bezier(.4,0,.2,1)`,
      ...style,
    }}>{children}</div>
  );
}

/* ─── EVENT CARD ─── */
function EventCard({ event, idx, accentC, textC, bgC, scrollP }) {
  const [hovered, setHovered] = useState(false);
  const cardBg = lerpColor(TOP_BG, BOT_BG, scrollP);
  const cardText = lerpColor(TOP_TEXT, BOT_TEXT, scrollP);
  const imgBrightness = 0.9 - scrollP * 0.08;

  return (
    <Stagger delay={idx * .08}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.98)",
          border: `1px solid ${rgba(accentC, hovered ? .45 : .12)}`,
          boxShadow: hovered
            ? `0 24px 64px ${rgba(accentC, .15)}, 0 0 0 1px ${rgba(accentC, .2)}`
            : `0 8px 32px rgba(0,0,0,.04)`,
          transform: hovered ? "translateY(-10px) scale(1.02)" : "translateY(0) scale(1)",
          transition: "all .6s cubic-bezier(.4,0,.2,1)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          cursor: "none",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img src={event.img} alt={event.title}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hovered ? "scale(1.1)" : "scale(1.0)",
              transition: "transform .6s cubic-bezier(.4,0,.2,1), filter .6s ease",
              filter: `brightness(${imgBrightness}) saturate(${1.15 + scrollP * 0.05})`,
            }} />
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to bottom, transparent 30%, rgba(255, 255, 255, 0.9) 100%)`,
            transition: "background .6s ease",
          }} />
          <div style={{
            position: "absolute", top: 16, left: 16,
            padding: "4px 12px",
            background: rgba(accentC, .9),
            borderRadius: 4,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase",
            color: "white", fontWeight: 700,
          }}>{event.tag}</div>
          {/* Date badge */}
          <div style={{
            position: "absolute", bottom: 16, right: 16,
            padding: "6px 14px",
            background: "rgba(240, 245, 255, 0.9)",
            border: "1px solid rgba(0, 80, 200, 0.1)",
            borderRadius: 6,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12, color: rgb(cardText), letterSpacing: ".06em", fontWeight: 700,
            transition: "background .6s ease, color .6s ease, transform .4s",
            transform: hovered ? "scale(1.03)" : "scale(1)",
          }}>{event.date}</div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 24px 28px", transition: "color .6s ease", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
          <h3 style={{
            fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 700,
            color: "#061d4d", lineHeight: 1.2, marginBottom: 12, letterSpacing: "-.01em",
          }}>{event.title}</h3>
          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600,
            color: "rgba(6, 29, 77, 0.85)", lineHeight: 1.6, marginBottom: 20,
          }}>{event.desc}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#061d4d", letterSpacing: ".04em", fontWeight: 700 }}>{event.venue}</span>
            <div style={{
              width: 32, height: 32,
              border: `1px solid ${rgba(accentC, hovered ? .8 : .3)}`,
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              color: hovered ? "white" : rgb(accentC), fontSize: 14,
              background: hovered ? rgb(accentC) : "transparent",
              transition: "all .3s",
            }}>
              <span style={{ color: hovered ? "white" : rgb(accentC), transition: "color .3s" }}>→</span>
            </div>
          </div>
        </div>
      </div>
    </Stagger>
  );
}

/* ─── TEAM CARD ─── */
function TeamCard({ member, idx, accentC, textC, bgC, scrollP }) {
  const [hovered, setHovered] = useState(false);
  const isDark = scrollP > .35;
  return (
    <Stagger delay={idx * .07}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: rgba(bgC, 0.85),
          backdropFilter: "blur(20px)",
          border: `1px solid ${rgba(accentC, hovered ? .4 : .12)}`,
          boxShadow: hovered ? `0 20px 56px ${rgba(accentC, .2)}` : `0 4px 24px rgba(0,0,0,.06)`,
          transform: hovered ? "translateY(-8px) scale(1.025)" : "translateY(0) scale(1)",
          transition: "all .4s cubic-bezier(.4,0,.2,1)",
          cursor: "none", position: "relative",
        }}
      >
        <div style={{ position: "relative", overflow: "hidden" }}>
          <img src={member.img} alt={member.name}
            style={{
              width: "100%", aspectRatio: "3/4", objectFit: "cover",
              transform: hovered ? "scale(1.08)" : "scale(1)",
              transition: "transform .5s cubic-bezier(.4,0,.2,1)",
              display: "block",
              filter: scrollP > .5 ? "brightness(.7) saturate(1.1)" : "brightness(.88)",
            }} />
          {/* Overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to top, ${rgba(BOT_BG, .92)} 0%, transparent 55%)`,
            opacity: hovered ? 1 : 0,
            transition: "opacity .4s",
            display: "flex", flexDirection: "column",
            justifyContent: "flex-end", padding: 20,
          }}>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 18, color: "white", marginBottom: 4, fontWeight: 700 }}>{member.name}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: rgba(BOT_ACC, 1), marginBottom: 10, fontWeight: 700 }}>{member.role}</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, color: "rgba(240,248,255,1)", lineHeight: 1.6 }}>{member.bio}</div>
          </div>
        </div>
        <div style={{ padding: "16px 20px 20px", borderTop: `1px solid ${rgba(accentC, .1)}` }}>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 17, color: isDark ? CARD_TEXT_LIGHT : CARD_TEXT_DARK, fontWeight: 700 }}>{member.name}</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: isDark ? "rgba(245,250,255,.95)" : "rgba(10,21,40,.95)", marginTop: 3, fontWeight: 600 }}>{member.role}</div>
        </div>
      </div>
    </Stagger>
  );
}

/* ─── HERO SECTION ─── */
function Hero({ scrollP, bgC, textC, accentC }) {
  const parallax = scrollP * -180;
  return (
    <section id="home" style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", justifyContent: "center",
    }}>
      <HeroCanvas scrollP={scrollP} />
      {/* Big blurred circle 3D accent */}
      <div style={{
        position: "absolute", right: "-10%", top: "8%",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle at 40% 40%, rgba(60,130,255,.22), rgba(30,60,180,.1), transparent 65%)",
        filter: "blur(60px)", pointerEvents: "none",
        transform: `translateY(${parallax * .4}px)`,
      }} />
      {/* Glassmorphic card floating in corner */}
      <div style={{
        position: "absolute", right: 72, top: "22%",
        padding: "28px 32px",
        background: "rgba(64, 165, 219, 0.62)",
        backdropFilter: "blur(24px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,.13)",
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(0,30,100,.15), inset 0 1px 0 rgba(255,255,255,.1)",
        transform: `translateY(${parallax * .6}px) rotateX(4deg) rotateY(-4deg)`,
        display: "flex", flexDirection: "column", gap: 24,
        fontFamily: "'DM Sans',sans-serif",
      }}>
        {[["240+", "Active Members"], ["48", "Events / Year"], ["12", "Industry Partners"]].map(([n, l]) => (
          <div key={l} style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 38, color: "white", lineHeight: 1, fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: "rgb(255, 255, 255)", marginTop: 4, fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Main copy */}
      <div style={{ position: "relative", zIndex: 2, padding: "40px 72px 0", maxWidth: 900, transform: `translateY(${parallax * .2}px)` }}>
        <div style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, letterSpacing: ".4em",
          textTransform: "uppercase", color: "rgba(32, 88, 137, 0.95)", fontWeight: 700,
          marginBottom: 24, display: "flex", alignItems: "center", gap: 14,
        }}>
          <p style={{ fontSize: 18, fontWeight: 600, alignItems: "center" }}>ACM PVG's CoET & M ~ Since 2018 </p>
        </div>
        <h1 style={{
          fontFamily: "'Instrument Serif',serif",
          fontSize: "clamp(52px,8vw,108px)",
          lineHeight: .95, letterSpacing: "-.03em", color: "rgba(166, 213, 255, 0.95)",
          fontWeight: 700, marginBottom: 36,
        }}>
          Computing<br />
          <em style={{ color: "rgba(50, 98, 140, 0.95)", fontStyle: "italic", fontWeight: 700 }}>for the</em><br />
          curious mind.
        </h1>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 600,
          color: "rgba(32, 88, 137, 0.95)", maxWidth: 520, lineHeight: 1.7, marginBottom: 48,
        }}>
          The student chapter of the Association for Computing Machinery — where curiosity meets collaboration, and ideas become impact.
        </p>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#join" style={{
            padding: "15px 36px", background: "white", color: "#001850",
            borderRadius: 6, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 8px 32px rgba(0,20,80,.2)",
            transition: "transform .2s, box-shadow .2s",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 14px 42px rgba(0,20,80,.3)"; }}
            onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 8px 32px rgba(0,20,80,.2)"; }}
          >Join the Chapter</a>
          <a href="#about" style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 900,
            color: "rgba(127, 150, 255, 1)", textDecoration: "none",
            borderBottom: "1px solid rgba(240,248,255,.6)", paddingBottom: 2,
            transition: "color .2s, border-color .2s",
          }}
            onMouseEnter={e => { e.target.style.color = "rgba(0, 132, 255, 0.55)"; e.target.style.borderColor = "white"; }}
            onMouseLeave={e => { e.target.style.color = "rgba(127, 150, 255, 1)"; e.target.style.borderColor = "rgba(240,248,255,.6)"; }}
          >Explore our work →</a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 1, height: 52, background: "linear-gradient(to bottom, rgba(180,210,255,.5), transparent)", animation: "scrollPulse 2s infinite" }} />
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes scrollPulse { 0%,100%{opacity:.3} 50%{opacity:.9} }
        ` }} />
      </div>
    </section>
  );
}

/* ─── ABOUT SECTION ─── */
function About({ bgC, textC, accentC, scrollP }) {
  return (
    <Section id="about" transition="slideUp" style={{ padding: "130px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 72px" }}>
        {/* Big transparent watermark */}
        <div style={{
          position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Instrument Serif',serif", fontSize: "clamp(100px,18vw,220px)",
          color: rgba(accentC, .04), pointerEvents: "none", userSelect: "none",
          letterSpacing: "-.04em", lineHeight: 1, whiteSpace: "nowrap",
        }}>ACM</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start", position: "relative" }}>
          <div>
            <Stagger delay={0}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, letterSpacing: ".2em", textTransform: "uppercase", color: rgb(accentC), fontWeight: 1000, marginBottom: 24 }}>Who We Are</div>
              <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: "clamp(36px,4.5vw,60px)", lineHeight: 1.08, color: rgb(textC), fontWeight: 700, letterSpacing: "-.02em" }}>
                A community of builders, thinkers and problem-solvers.
              </h2>
            </Stagger>
          </div>
          <div>
            <Stagger delay={.15}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 600, color: rgba(textC, .95), lineHeight: 1.75, marginBottom: 22 }}>
                Since our founding, we've been the heart of the computing community at our university — connecting students with the ideas, people and opportunities that shape the field. We're affiliated with ACM, the world's largest educational and scientific computing society.
              </p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 600, color: rgba(textC, .95), lineHeight: 1.75, marginBottom: 36 }}>
                From hands-on workshops and competitive hackathons to research talks and industry mentorship, everything we do bridges the gap between the classroom and the real world of computing.
              </p>
              {/* Glassmorphic stat pills */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["Founded 2018", "Est."], ["Top 12 ICPC", "Achievement"], ["3 IEEE Papers", "Research"]].map(([label, sub]) => (
                  <div key={label} style={{
                    padding: "10px 20px",
                    background: rgba(accentC, .08),
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${rgba(accentC, .2)}`,
                    borderRadius: 8,
                    fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700,
                    color: rgb(textC),
                  }}>
                    {label}
                  </div>
                ))}
              </div>
            </Stagger>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── EVENTS SECTION ─── */
function Events({ bgC, textC, accentC, scrollP }) {
  return (
    <Section id="events" transition="zoomIn" style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 72px" }}>
        <Stagger delay={0}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, letterSpacing: ".18em", textTransform: "uppercase", color: "#061d4d", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, fontWeight: 1000 }}>
                <span>01</span>
                <span style={{ display: "block", width: 28, height: 1, background: "rgba(6, 29, 77, 0.2)" }} />
                <span>Events & Workshops</span>
              </div>
              <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 800, letterSpacing: "-.02em", color: "#061d4d" }}>What's happening</h2>
            </div>
            <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: rgb(accentC), textDecoration: "none", borderBottom: `1px solid ${rgb(accentC)}`, paddingBottom: 2 }}>View All</a>
          </div>
        </Stagger>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {EVENTS.map((ev, i) => (
            <EventCard key={i} event={ev} idx={i} accentC={accentC} textC={textC} bgC={bgC} scrollP={scrollP} />
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── TEAM SECTION ─── */
function Team({ bgC, textC, accentC, scrollP }) {
  const isDark = scrollP > .35;
  const sectionText = isDark ? CARD_TEXT_LIGHT : CARD_TEXT_DARK;
  const sectionMuted = isDark ? "rgba(245,250,255,.85)" : "rgba(10,21,40,.85)";
  const sectionLine = isDark ? "rgba(245,250,255,.4)" : "rgba(10,21,40,.4)";
  return (
    <Section id="team" transition="slideLeft" style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 72px" }}>
        <Stagger delay={0}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 72 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, letterSpacing: ".18em", textTransform: "uppercase", color: sectionMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, fontWeight: 1000 }}>
                <span>02</span>
                <span style={{ display: "block", width: 28, height: 1, background: sectionLine }} />
                <span>Leadership</span>
              </div>
              <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 1000, letterSpacing: "-.02em", color: sectionText }}>The team behind the chapter</h2>
            </div>
            <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: rgb(accentC), textDecoration: "none", borderBottom: `1px solid ${rgb(accentC)}`, paddingBottom: 2 }}>Full Directory</a>
          </div>
        </Stagger>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {TEAM.map((m, i) => (
            <TeamCard key={i} member={m} idx={i} accentC={accentC} textC={textC} bgC={bgC} scrollP={scrollP} />
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── PROJECTS SECTION ─── */
function Projects({ bgC, textC, accentC, scrollP }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const isDark = scrollP > .55;
  return (
    <Section id="projects" transition="slideRight" style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 72px" }}>
        <Stagger delay={0}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 72 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.9)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, fontWeight: 1000 }}>
                <span>03</span>
                <span style={{ display: "block", width: 28, height: 1, background: "rgba(255, 255, 255, 0.25)" }} />
                <span>Projects & Achievements</span>
              </div>
              <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 1000, letterSpacing: "-.02em", color: "white" }}>What we've built</h2>
            </div>
            <a href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: rgb(accentC), textDecoration: "none", borderBottom: `1px solid ${rgb(accentC)}`, paddingBottom: 2 }}>All Projects</a>
          </div>
        </Stagger>
        <div>
          {PROJECTS.map((p, i) => (
            <Stagger key={i} delay={i * .08}>
              <div
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: "grid", gridTemplateColumns: "72px 1fr 260px 140px", gap: 40,
                  alignItems: "center", padding: "36px 28px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  background: hoveredIdx === i ? rgba(accentC, .06) : "transparent",
                  backdropFilter: hoveredIdx === i ? "blur(8px)" : "none",
                  borderRadius: hoveredIdx === i ? 12 : 0,
                  transform: hoveredIdx === i ? "translateX(8px)" : "translateX(0)",
                  transition: "all .35s cubic-bezier(.4,0,.2,1)",
                  cursor: "none",
                }}
              >
                <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 34, color: hoveredIdx === i ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.35)", fontStyle: "italic", transition: "color .3s", fontWeight: 800 }}>{p.idx}</div>
                <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, color: "white", letterSpacing: "-.01em", transition: "color .3s", fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.6 }}>{p.desc}</div>
                <div>
                  <span style={{
                    display: "inline-block", padding: "5px 14px",
                    border: `1px solid ${rgba(accentC, hoveredIdx === i ? .6 : .3)}`,
                    borderRadius: 4,
                    fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase",
                    color: rgb(accentC), fontWeight: 700,
                    background: hoveredIdx === i ? rgba(accentC, .1) : "transparent",
                    transition: "all .3s",
                  }}>{p.tag}</span>
                </div>
              </div>
              {i === PROJECTS.length - 1 && <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }} />}
            </Stagger>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── CTA SECTION ─── */
function CTA({ bgC, textC, accentC, scrollP }) {
  const isDark = scrollP > .75;
  return (
    <Section id="join" transition="popUp" style={{ padding: "160px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* 3D floating ring ornament */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        width: 600, height: 600,
        border: `1px solid ${rgba(accentC, .07)}`,
        borderRadius: "50%", pointerEvents: "none",
        animation: "ringRotate 18s linear infinite",
      }} />
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        width: 420, height: 420,
        border: `1px solid ${rgba(accentC, .1)}`,
        borderRadius: "50%", pointerEvents: "none",
        animation: "ringRotate 12s linear infinite reverse",
      }} />
      <style>{`
        @keyframes ringRotate {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>
      {/* Background text */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        fontFamily: "'Instrument Serif',serif",
        fontSize: "clamp(100px,20vw,280px)",
        color: rgba(accentC, .04), pointerEvents: "none", userSelect: "none",
        whiteSpace: "nowrap", letterSpacing: "-.04em", lineHeight: 1,
      }}>ACM</div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 72px" }}>
        <Stagger delay={0}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, letterSpacing: ".18em", textTransform: "uppercase", color: rgb(accentC), fontWeight: 1000, marginBottom: 20 }}>Join the Chapter</div>
          <h2 style={{
            fontFamily: "'Instrument Serif',serif",
            fontSize: "clamp(40px,6vw,80px)",
            fontWeight: 700, letterSpacing: "-.02em",
            color: rgb(textC), lineHeight: 1.05, maxWidth: 700, margin: "0 auto 20px",
          }}>Ready to build something that matters?</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 600, color: rgba(textC, .95), maxWidth: 480, margin: "0 auto 52px", lineHeight: 1.7 }}>
            Whether you write code, design systems, or just love computing — there is a place for you here.
          </p>
          {/* Glassmorphic CTA button */}
          <a href="mailto:acm@university.edu" style={{
            display: "inline-block", padding: "18px 48px",
            background: rgba(accentC, isDark ? .9 : 1),
            color: "white", borderRadius: 8,
            fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700,
            textDecoration: "none",
            boxShadow: `0 8px 32px ${rgba(accentC, .45)}, 0 0 0 1px ${rgba(accentC, .3)}`,
            transition: "transform .25s, box-shadow .25s",
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-4px) scale(1.03)"; e.target.style.boxShadow = `0 16px 48px ${rgba(accentC, .6)}, 0 0 0 1px ${rgba(accentC, .4)}`; }}
            onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = `0 8px 32px ${rgba(accentC, .45)}, 0 0 0 1px ${rgba(accentC, .3)}`; }}
          >Get in Touch</a>
        </Stagger>
      </div>
    </Section>
  );
}

/* ─── FOOTER ─── */
function Footer({ bgC, textC, accentC }) {
  return (
    <footer style={{ padding: "64px 72px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 48, borderBottom: `1px solid ${rgba(textC, .08)}`, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, background: rgb(accentC), borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, color: "white", boxShadow: `0 4px 16px ${rgba(accentC, .4)}` }}>ACM</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: rgb(textC), lineHeight: 1.4, fontWeight: 700 }}>
              ACM Student Chapter
              <span style={{ display: "block", fontSize: 12, color: rgba(textC, .85), fontWeight: 600 }}>PVG's CoET & M · Est. 2018</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            {[
              ["Navigate", ["About", "Events", "Team", "Projects"]],
              ["Connect", ["LinkedIn", "Instagram", "GitHub", "Email Us"]],
              ["Resources", ["Membership", "ACM Digital Library", "Sponsor Us", "Faculty Advisor"]],
            ].map(([heading, links]) => (
              <div key={heading}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: rgba(textC, .85), marginBottom: 18, fontWeight: 700 }}>{heading}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {links.map(l => (
                    <a key={l} href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: rgba(textC, .9), textDecoration: "none", fontWeight: 600, transition: "color .2s" }}
                      onMouseEnter={e => e.target.style.color = rgb(accentC)}
                      onMouseLeave={e => e.target.style.color = rgba(textC, .9)}
                    >{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: rgba(textC, .85), fontWeight: 600 }}>© 2026 ACM Student Chapter, University Name.</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: rgba(textC, .75), fontWeight: 600, maxWidth: 400, textAlign: "right", lineHeight: 1.5 }}>ACM is the world's largest educational and scientific computing society.</div>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT APP ─── */
export default function App() {
  const scrollP = useScrollProgress();
  const mouse = useMousePosition();

  // Enhanced stops: keep it white/bright longer, then transition through a vibrant sky blue
  const bgStops = [
    { pos: 0, color: { r: 255, g: 255, b: 255 } }, // Pure White
    { pos: 0.3, color: { r: 240, g: 250, b: 255 } }, // Very Light Ice
    { pos: 0.6, color: { r: 180, g: 215, b: 255 } }, // Vibrant Sky Blue (midpoint)
    { pos: 1.0, color: { r: 5, g: 18, b: 50 } }      // Deep Navy
  ];

  const bgColor = multiStopLerp(bgStops, scrollP);
  const textColor = lerpColor(TOP_TEXT, BOT_TEXT, scrollP);
  const accentColor = lerpColor(TOP_ACC, BOT_ACC, scrollP);

  // Computed background gradient (also subtle mesh)
  const pageBg = `
    radial-gradient(ellipse at 70% 10%, ${rgba(lerpColor({ r: 200, g: 230, b: 255 }, { r: 40, g: 90, b: 200 }, scrollP), .25)} 0%, transparent 55%),
    radial-gradient(ellipse at 20% 80%, ${rgba(lerpColor({ r: 160, g: 210, b: 255 }, { r: 20, g: 50, b: 150 }, scrollP), .18)} 0%, transparent 50%),
    ${rgb(bgColor)}
  `;

  return (
    <div style={{ minHeight: "100vh", background: pageBg, transition: "background .15s" }}>
      <FontLink />
      <Cursor mouse={mouse} />
      <Orbs scrollP={scrollP} />
      <Nav scrollP={scrollP} bgColor={bgColor} textColor={textColor} />

      <Hero scrollP={scrollP} bgC={bgColor} textC={textColor} accentC={accentColor} />
      <About scrollP={scrollP} bgC={bgColor} textC={textColor} accentC={accentColor} />
      <Events scrollP={scrollP} bgC={bgColor} textC={textColor} accentC={accentColor} />
      <Team scrollP={scrollP} bgC={bgColor} textC={textColor} accentC={accentColor} />
      <Projects scrollP={scrollP} bgC={bgColor} textC={textColor} accentC={accentColor} />
      <CTA scrollP={scrollP} bgC={bgColor} textC={textColor} accentC={accentColor} />
      <Footer bgC={bgColor} textC={textColor} accentC={accentColor} />
    </div>
  );
}
