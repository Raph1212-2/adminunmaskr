import React, { useState, useEffect, useRef } from "react";
import { supabase } from './supabaseClient';
// The share-image card needs a logo it can draw onto a canvas. It is built from
// the same SVG mask used everywhere else (white version), so it can't be corrupted
// the way the old embedded PNG could.
const logoMaskWhite = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect x="8" y="8" width="60" height="60" rx="16" fill="#ffffff" opacity="0.32"/><rect x="24" y="24" width="60" height="60" rx="16" fill="#ffffff" opacity="0.68"/><rect x="40" y="40" width="44" height="44" rx="12" fill="#ff5c3a"/></svg>');
// triviaQuestions.js and triviaQuestionsNew.js are loaded lazily now, only
// when someone actually opens Quiz Clash — see loadQuestionBank() below.
// ── REAL LOGO (from brand asset) ────────────────────────────────────────────────
// LogoMask = just the mask icon. LogoFull = mask + "unmaskr" wordmark lockup.
// Use variant="white" on dark backgrounds, default (black) on light backgrounds.
// The mask is drawn directly as an SVG. It can't fail to load and shows the same
// way on every page.
// Logo concept 9 ("layers peeling back") — three rounded squares, offset and
// overlapping, with the brightest orange one always on top as the "thing
// being revealed." Back/middle layers use the ink color (black or white,
// via `variant`) at two opacity levels so the depth effect works on both
// light and dark backgrounds; the front layer stays solid brand orange
// either way, since that's the one color meant to read the same everywhere.
const LogoMask = ({ size=24, variant="black", style={} }) => {
  const ink = variant==="white" ? "#ffffff" : "#0e0e0e";
  return (
    <svg height={size} width={size} viewBox="0 0 100 100" role="img" aria-label="Unmaskr" style={{ display:"block", flexShrink:0, ...style }}>
      <rect x="8" y="8" width="60" height="60" rx="16" fill={ink} opacity="0.32"/>
      <rect x="24" y="24" width="60" height="60" rx="16" fill={ink} opacity="0.68"/>
      <rect x="40" y="40" width="44" height="44" rx="12" fill="#ff5c3a"/>
    </svg>
  );
};

// Composed from the mask icon + styled wordmark text (rather than a separate
// full-lockup image file) — one less asset to keep in sync, and it can't go
// stale/corrupt the way an embedded binary blob can.
const LogoFull = ({ height=24, variant="black", style={} }) => (
  <div style={{ display:"flex", alignItems:"center", gap:height*0.32, ...style }}>
    <LogoMask size={height} variant={variant}/>
    <span className="syne" style={{ fontSize:height*0.72, fontWeight:800, letterSpacing:"-0.02em", color:variant==="white"?"white":"#0e0e0e", lineHeight:1, whiteSpace:"nowrap" }}>unmaskr</span>
  </div>
);

// ── LUCIDE-STYLE SVG ICONS ─────────────────────────────────────────────────────
const Icon = ({ d, size=20, color="currentColor", strokeWidth=1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const Icons = {
  mask: ({size=24,color="currentColor"})=>(
    <svg width={size} height={size} viewBox="0 0 130 105" fill={color}>
      <path d="M65 5 C35 5 10 22 10 46 C10 63 22 77 40 83 C38 91 30 99 20 103 C33 100 48 93 57 85 C59 86 62 86 65 86 C95 86 120 68 120 46 C120 22 95 5 65 5 Z"/>
      <ellipse cx="44" cy="44" rx="10" ry="11" fill="white"/><ellipse cx="86" cy="44" rx="10" ry="11" fill="white"/>
      <path d="M38 64 Q65 82 92 64" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  inbox:    ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"]}/>,
  stats:    ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M18 20V10","M12 20V4","M6 20v-6"]}/>,
  wallet:   ({s=20,c="currentColor"})=><Icon size={s} color={c} d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-10 9H3V9h8v4zm10 0h-8V9h8v4z"/>,
  games:    ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M6 12h4","M8 10v4","M15 11h.01","M18 11h.01","M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"]}/>,
  settings: ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]}/>,
  back:     ({s=20,c="currentColor"})=><Icon size={s} color={c} d="M19 12H5M12 5l-7 7 7 7"/>,
  copy:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z","M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"]}/>,
  share:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8","M16 6l-4-4-4 4","M12 2v13"]}/>,
  react:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  reply:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-5 9l-4-4 4-4m-4 4h12"/>,
  flag:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z","M4 22v-7"]}/>,
  lock:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z","M7 11V7a5 5 0 0 1 10 0v4"]}/>,
  unlock:   ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z","M7 11V7a5 5 0 0 1 9.9-1"]}/>,
  check:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M20 6L9 17l-5-5"/>,
  eye:      ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]}/>,
  mail:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"]}/>,
  phone:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
  bank:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M3 22h18","M6 18v-7","M10 18v-7","M14 18v-7","M18 18v-7","M12 2L2 7h20L12 2z"]}/>,
  card:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z","M1 10h22"]}/>,
  withdraw: ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M12 5v14","M19 12l-7 7-7-7"]}/>,
  deposit:  ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M12 19V5","M5 12l7-7 7 7"]}/>,
  receipt:  ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]}/>,
  user:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"]}/>,
  shield:   ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  bell:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]}/>,
  help:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3","M12 17h.01","M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"]}/>,
  chat:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  doc:      ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]}/>,
  sun:      ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z","M12 1v2","M12 21v2","M4.22 4.22l1.42 1.42","M18.36 18.36l1.42 1.42","M1 12h2","M21 12h2","M4.22 19.78l1.42-1.42","M18.36 5.64l1.42-1.42"]}/>,
  palette:  ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5S18.33 11 17.5 11z"/>,
  photo:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]}/>,
  logout:   ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]}/>,
  trophy:   ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M6 9H3.5a2.5 2.5 0 0 1 0-5H6","M18 9h2.5a2.5 2.5 0 0 0 0-5H18","M4 22h16","M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22","M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22","M18 2H6v7a6 6 0 0 0 12 0V2z"]}/>,
  timer:    ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 6v6l4 2"]}/>,
  warning:  ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]}/>,
  globe:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M2 12h20","M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"]}/>,
  search:   ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M11 17.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5z","M16 16l4.5 4.5"]}/>,
  close:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M18 6L6 18M6 6l12 12"/>,
  plus:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M12 5v14M5 12h14"/>,
  chevron:  ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M9 18l6-6-6-6"/>,
  info:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 16v-4","M12 8h.01"]}/>,
  star:     ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  money:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M12 1v22","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]}/>,
  dice:     ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z","M3.27 6.96L12 12.01l8.73-5.05","M12 22.08V12"]}/>,
  heart:    ({s=18,c="currentColor"})=><Icon size={s} color={c} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  heartOff: ({s=18,c="currentColor"})=><Icon size={s} color={c} d={["M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"]}/>,
  medal:    ({s=20,c="currentColor"})=><Icon size={s} color={c} d={["M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z","M8.21 13.89 7 23l5-3 5 3-1.21-9.12"]}/>,
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif;}
    body{overflow-x:hidden;background:#fafaf8;}
    .syne{font-family:'Syne',sans-serif!important;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
    @keyframes float{0%,100%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-18px) rotate(4deg);}}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
    @keyframes popIn{from{transform:scale(0.85);opacity:0;}to{transform:scale(1);opacity:1;}}
    .fadeUp{animation:fadeUp 0.55s ease both;}
    .fadeUp1{animation:fadeUp 0.55s 0.1s ease both;}
    .fadeUp2{animation:fadeUp 0.55s 0.2s ease both;}
    .fadeUp3{animation:fadeUp 0.55s 0.35s ease both;}
    .slideUp{animation:slideUp 0.4s ease both;}
    .popIn{animation:popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;}
    .float1{animation:float 7s ease-in-out infinite;}
    .float2{animation:float 9s 2s ease-in-out infinite;}
    .btn-p:hover{background:#ff5c3a!important;transform:translateY(-2px)!important;box-shadow:0 12px 30px rgba(255,92,58,0.3)!important;}
    .btn-o:hover{background:#f0efec!important;}
    .msg-row:hover{background:#f7f6f3!important;}
    .hint-hover:hover{border-color:rgba(255,255,255,0.4)!important;transform:translateY(-3px)!important;}
    .tab-btn:hover{background:rgba(0,0,0,0.06)!important;}
    .game-card:hover{transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(0,0,0,0.1)!important;}
    .srow:hover{background:#f7f6f3!important;}
    .topic-btn:hover{border-color:#0e0e0e!important;}
    input:focus,textarea:focus,select:focus{outline:none!important;border-color:#0e0e0e!important;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px;}
    @media(max-width:768px){nav{padding:14px 16px!important;}}
    @media(max-width:480px){h1{font-size:clamp(2rem,8vw,3rem)!important;}}
  `}</style>
);
// ── SHARED UI ──────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, style={}, disabled, outline }) => (
  <button onClick={onClick} disabled={disabled} className={outline?"btn-o":"btn-p"} style={{
    padding:"13px 28px",borderRadius:50,border:outline?"1.5px solid rgba(0,0,0,0.2)":"none",
    background:outline?"transparent":disabled?"#ccc":"#0e0e0e",
    color:outline?"#0e0e0e":"white",fontSize:"0.92rem",fontWeight:600,
    cursor:disabled?"not-allowed":"pointer",transition:"all 0.25s",display:"inline-flex",alignItems:"center",gap:8,...style
  }}>{children}</button>
);
const Inp = ({ placeholder, type="text", value, onChange, style={} }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{
    width:"100%",padding:"14px 18px",borderRadius:14,
    border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",
    fontSize:"0.95rem",transition:"border-color 0.2s",...style
  }}/>
);
const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",padding:"6px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,transition:"background 0.15s"}} className="tab-btn">
    <Icons.back s={20} c="#555"/>
  </button>
);
const Modal = ({ children, onClose }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div className="slideUp" style={{background:"white",borderRadius:"24px 24px 0 0",padding:"32px 28px",width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:40,height:4,borderRadius:2,background:"#e0e0e0",margin:"0 auto 24px"}}/>
      {children}
    </div>
  </div>
);
const Tog = ({ on, onToggle }) => (
  <div onClick={onToggle} style={{width:44,height:24,borderRadius:50,background:on?"#0e0e0e":"#ddd",position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}>
    <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:on?23:3,transition:"left 0.2s"}}/>
  </div>
);
const Tag = ({ text }) => <p style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#ff5c3a",marginBottom:14}}>{text}</p>;

// Defined here at module level (not inside Settings) on purpose — a component
// defined inside another component's body gets recreated on every render of
// its parent, which makes React tear down and rebuild the whole subtree
// (including any <input> inside it) on every keystroke, dropping focus and
// dismissing the mobile keyboard after each letter. Keeping it stable here
// fixes exactly that.
const SubPage = ({title,onBack,children}) => (
  <div style={{minHeight:"100vh",background:"#fafaf8"}}>
    <div style={{padding:"20px 28px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)",position:"sticky",top:0,background:"#fafaf8",zIndex:10}}>
      <BackBtn onClick={onBack}/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>{title}</span>
    </div>
    <div style={{maxWidth:480,margin:"0 auto",padding:"32px 24px"}}>{children}</div>
  </div>
);

const Avatar = ({ size=36, bg="#0e0e0e", iconColor="white", iconSize }) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <Icons.user s={iconSize||Math.round(size*0.5)} c={iconColor}/>
  </div>
);

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
// Real, database-backed notifications — created by Postgres triggers (see the
// SQL supplied alongside this file) whenever a message arrives, a hint you
// posted earns you money, a deposit/withdrawal is confirmed, or an admin
// replies to your support message. This bell is the only place users see
// them; there is no separate push/email delivery for these yet.
const NOTIF_ICONS = {
  new_message: Icons.chat,
  hint_earning: Icons.money,
  deposit: Icons.deposit,
  withdrawal: Icons.withdraw,
  complaint: Icons.chat,
  broadcast: Icons.bell,
};

const NotificationBell = ({ userId, goTo }) => {
  const [open,setOpen] = useState(false);
  const [notifs,setNotifs] = useState([]);
  const [loading,setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at",{ascending:false}).limit(30);
    setNotifs(data||[]);
    setLoading(false);
  };

  useEffect(() => { fetchNotifs(); }, [userId]);

  // New notifications show up live, without a refresh
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`notifications-${userId}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`user_id=eq.${userId}` }, (payload) => {
        setNotifs(n => [payload.new, ...n]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unread = notifs.filter(n=>!n.read).length;

  const togglePanel = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unread>0) {
      const ids = notifs.filter(n=>!n.read).map(n=>n.id);
      await supabase.from("notifications").update({ read:true }).in("id", ids);
      setNotifs(ns => ns.map(n=>({...n,read:true})));
    }
  };

  if (!userId) return null;

  return (
    <div style={{position:"relative"}}>
      <button className="tab-btn" onClick={togglePanel} style={{padding:"8px",borderRadius:10,border:"none",background:"transparent",cursor:"pointer",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icons.bell s={20} c="#555"/>
        {unread>0 && <span style={{position:"absolute",top:5,right:5,width:8,height:8,borderRadius:"50%",background:"#ff5c3a"}}/>}
      </button>
      {open && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:190}} onClick={()=>setOpen(false)}/>
          <div style={{position:"absolute",top:"100%",right:0,marginTop:8,width:320,maxWidth:"85vw",maxHeight:420,overflowY:"auto",background:"white",borderRadius:16,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",zIndex:200,border:"1px solid rgba(0,0,0,0.07)"}}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)"}}><p className="syne" style={{fontWeight:700,fontSize:"0.9rem"}}>Notifications</p></div>
            {loading && <p style={{padding:"20px",textAlign:"center",color:"#aaa",fontSize:"0.85rem"}}>Loading...</p>}
            {!loading && notifs.length===0 && <p style={{padding:"20px",textAlign:"center",color:"#aaa",fontSize:"0.85rem"}}>No notifications yet.</p>}
            {notifs.map(n=>{
              const NIcon = NOTIF_ICONS[n.type] || Icons.bell;
              return (
                <div key={n.id} onClick={()=>{setOpen(false); if(n.link) goTo(n.link);}} style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.05)",cursor:n.link?"pointer":"default",display:"flex",gap:10,alignItems:"flex-start",background:n.read?"transparent":"rgba(255,92,58,0.04)"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><NIcon s={14} c="#555"/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:"0.85rem",fontWeight:600,marginBottom:2}}>{n.title}</p>
                    <p style={{fontSize:"0.8rem",color:"#888",lineHeight:1.5}}>{n.body}</p>
                    <p style={{fontSize:"0.7rem",color:"#ccc",marginTop:4}}>{timeAgoLite(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const AppNav = ({ goTo, active, userId }) => (
  <nav style={{position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:"rgba(250,250,248,0.94)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>goTo("inbox")}>
      <LogoFull height={26}/>
    </div>
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      {[
        {k:"inbox",I:Icons.inbox,label:"Inbox"},
        {k:"stats",I:Icons.stats,label:"Stats"},
        {k:"wallet",I:Icons.wallet,label:"Wallet"},
        {k:"games",I:Icons.games,label:"Games"},
        {k:"settings",I:Icons.settings,label:"Settings"},
      ].map(({k,I,label})=>(
        <React.Fragment key={k}>
          {k==="settings" && <NotificationBell userId={userId} goTo={goTo}/>}
          <button className="tab-btn" onClick={()=>goTo(k)} title={label} style={{padding:"8px",borderRadius:10,border:"none",background:active===k?"#0e0e0e":"transparent",color:active===k?"white":"#555",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <I s={20} c={active===k?"white":"#555"}/>
          </button>
        </React.Fragment>
      ))}
    </div>
  </nav>
);
// ── DATA ───────────────────────────────────────────────────────────────────────
// Pricing rule (per Raph): named "good economy" countries get their own/USD tier.
// Every other country defaults to the Nigerian rate (same tier + currency as NG).
const CURRENCIES = {
  NG:{code:"NGN",symbol:"₦",hints:[100,150,200],stakeMin:200,stakeMax:1000000},
  US:{code:"USD",symbol:"$",hints:[0.4,0.8,1.2],stakeMin:1,stakeMax:1000},
  GB:{code:"GBP",symbol:"£",hints:[0.3,0.6,1.0],stakeMin:1,stakeMax:800},
};
const GOOD_ECONOMY_USD = ["CA","AU","DE","FR"]; // ride the USD tier alongside the US
const getCurrency = (countryCode) => {
  if(countryCode==="NG") return CURRENCIES.NG;
  if(countryCode==="US") return CURRENCIES.US;
  if(countryCode==="GB") return CURRENCIES.GB;
  if(GOOD_ECONOMY_USD.includes(countryCode)) return CURRENCIES.US;
  return CURRENCIES.NG; // Ghana, Kenya, South Africa, Other, and any unlisted country
};
const COUNTRIES = [
  {name:"Nigeria",code:"NG",flag:"🇳🇬",phone:"+234"},
  {name:"United States",code:"US",flag:"🇺🇸",phone:"+1"},
  {name:"United Kingdom",code:"GB",flag:"🇬🇧",phone:"+44"},
  {name:"Ghana",code:"GH",flag:"🇬🇭",phone:"+233"},
  {name:"Kenya",code:"KE",flag:"🇰🇪",phone:"+254"},
  {name:"South Africa",code:"ZA",flag:"🇿🇦",phone:"+27"},
  {name:"Canada",code:"CA",flag:"🇨🇦",phone:"+1"},
  {name:"Australia",code:"AU",flag:"🇦🇺",phone:"+61"},
  {name:"Germany",code:"DE",flag:"🇩🇪",phone:"+49"},
  {name:"France",code:"FR",flag:"🇫🇷",phone:"+33"},
  {name:"Other",code:"OTHER",flag:"🌍",phone:""},
];

// Each hint only ever costs money when the sender actually supplied that piece
// of data. "unspecified" is what the recipient sees for free when the sender
// left it blank — no wallet debit, no transaction, ever, for that reveal.
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Fuzzy-but-truthful hint generators — each always contains the real value
// somewhere in the range/clue, but never states it outright.
const monthRangeHint = (monthName) => {
  const idx = MONTH_NAMES.indexOf(monthName);
  if (idx === -1) return `This person may be born around ${monthName}.`;
  const startOffset = [-2,-1,0][Math.floor(Math.random()*3)]; // true month lands at the start, middle, or end of the window
  const startIdx = (idx + startOffset + 12) % 12;
  const endIdx = (startIdx + 2) % 12;
  return `This person may be born between ${MONTH_NAMES[startIdx]} and ${MONTH_NAMES[endIdx]}.`;
};
const ageRangeHint = (ageVal) => {
  const age = Number(ageVal);
  if (!age) return `This person may be around ${ageVal} years old.`;
  const span = 2 + Math.floor(Math.random()*3); // 2-4 year window
  const offset = Math.floor(Math.random()*(span+1)); // true age sits somewhere inside the window
  const start = Math.max(1, age - offset);
  return `This person may be between ${start} and ${start+span} years old.`;
};
const nameLetterHint = (name) => {
  const clean = (name||"").trim();
  if (!clean) return "The sender didn't specify their name.";
  const letters = [...new Set(clean.replace(/[^a-zA-Z]/g,"").toUpperCase().split(""))];
  const options = [
    () => `This person's name starts with the letter "${clean[0].toUpperCase()}".`,
    () => `This person's name ends with the letter "${clean[clean.length-1].toUpperCase()}".`,
    () => letters.length ? `This person's name contains the letter "${letters[Math.floor(Math.random()*letters.length)]}".` : `This person's name starts with the letter "${clean[0].toUpperCase()}".`,
  ];
  return options[Math.floor(Math.random()*options.length)]();
};

const ALL_HINTS = [
  {key:"gender",label:"Gender Hint",result:g=>`This sender may identify as ${g}.`,unspecified:"The sender didn't specify their gender."},
  {key:"birth",label:"Birth Period Hint",result:monthRangeHint,unspecified:"The sender didn't specify their birth month."},
  {key:"name",label:"Name Hint",result:nameLetterHint,unspecified:"The sender didn't specify their name."},
  {key:"relationship",label:"Relationship Hint",result:()=>"This person may be someone you know personally.",unspecified:"The sender didn't specify this."},
  {key:"circle",label:"Circle Hint",result:()=>"This person may be in your close circle.",unspecified:"The sender didn't specify this."},
  {key:"age",label:"Age Hint",result:ageRangeHint,unspecified:"The sender didn't specify their age."},
  {key:"location",label:"Location Hint",result:()=>"This person may live close to you.",unspecified:"The sender didn't specify this."},
  {key:"frequency",label:"Frequency Hint",result:()=>"This person may have messaged you before.",unspecified:"The sender didn't specify this."},
];
const getRandHints = (u=[]) => [...ALL_HINTS.filter(h=>!u.includes(h.key))].sort(()=>Math.random()-0.5).slice(0,3);
// True only when the sender actually provided this specific piece of data.
const isHintSpecified = (key, specified) => !!(specified && specified[key]);

const TERMS = `TERMS AND CONDITIONS — UNMASKR\nLast updated: June 2025\n\n1. ACCEPTANCE\nBy using Unmaskr, you agree to these Terms.\n\n2. ELIGIBILITY\nYou must be at least 16 years old to use Unmaskr.\n\n3. ANONYMOUS MESSAGING\nUnmaskr allows anonymous messages. We may disclose sender info to law enforcement if messages contain threats or illegal content.\n\n4. HINT SYSTEM\nHints are based on general profile data voluntarily shared by senders. For entertainment only. When a hint is purchased, 50% goes to the message recipient's wallet. 50% is retained by Unmaskr. If the sender didn't provide the information behind a hint, it is shown for free and no payment is taken.\n\n5. PAYMENTS & REFUNDS\nAll payments are processed via Bachs. If a withdrawal or deposit fails due to a technical issue on our end, the full amount is automatically returned to your Unmaskr wallet within 10 minutes. Users are responsible for providing correct bank/airtime details.\n\n6. CONTENT MODERATION\nProfanity and offensive language is automatically filtered. Users who attempt to bypass filters using alternate spellings or abbreviations do so at their own risk and remain fully liable for their content. Unmaskr reserves the right to suspend accounts found violating these terms.\n\n7. SEXUAL CONTENT\nSexual language is strictly blocked for users under 18 years of age. This applies to all messages sent and received.\n\n8. PROHIBITED CONDUCT\nNo threatening, harassing, defamatory or illegal content. Violations may result in permanent account suspension.\n\n9. SAFETY\nReport harmful messages using the report button. Unmaskr reviews all reports promptly.\n\n10. PRIVACY\nWe collect only data necessary to operate the platform. We do not sell your data. Wallets never expire. Even if a wallet is unclaimed or abandoned for 5 years or more, the balance remains yours and can be claimed at any time.\n\n11. GAMES — STAKE & WIN\nThe 18+ staking game involves real money. You must be 18+ based on your registered date of birth. Winners receive the total pot. Maximum stake: equivalent of ₦1,000,000 in your local currency. Minimum 2, maximum 10 players. In the event of a dispute, an Unmaskr admin may review account activity to assist resolution.\n\n12. CHANGES\nWe may update these terms at any time.\n\n13. CONTACT\nsupport@unmaskr.com`;

// ── PROFANITY FILTER ───────────────────────────────────────────────────────────
const PROFANITY = ["fuck","shit","bitch","damn","ass","crap","bastard","idiot","stupid"];
const SEXUAL_WORDS = ["sex","nude","naked","porn","xxx","dick","pussy","cock","boobs","vagina","penis","horny"];
const filterText = (text, isMinor=false) => {
  let result = text;
  const words = isMinor ? [...PROFANITY, ...SEXUAL_WORDS] : PROFANITY;
  words.forEach(w => {
    const regex = new RegExp(w.replace(/[aeiou]/gi, '[aeiou*@0-9]?'), 'gi');
    result = result.replace(regex, match => match.replace(/[aeiou]/gi, '*'));
  });
  return result;
};

// ── TRIVIA DATA BY TOPIC & DIFFICULTY ─────────────────────────────────────────
const TRIVIA_TOPICS = [
  {key:"tech",label:"Tech & Science",icon:()=><Icons.globe s={16} c="#3b82f6"/>},
  {key:"med",label:"Medical Science",icon:()=><Icons.help s={16} c="#ef4444"/>},
  {key:"politics",label:"Politics",icon:()=><Icons.shield s={16} c="#6366f1"/>},
  {key:"economics",label:"Economics",icon:()=><Icons.money s={16} c="#f59e0b"/>},
  {key:"social",label:"Social Life",icon:()=><Icons.chat s={16} c="#ec4899"/>},
  {key:"education",label:"Education",icon:()=><Icons.doc s={16} c="#8b5cf6"/>},
  {key:"entertainment",label:"Entertainment",icon:()=><Icons.star s={16} c="#f97316"/>},
  {key:"history",label:"History & General",icon:()=><Icons.info s={16} c="#14b8a6"/>},
  {key:"sports",label:"Sports",icon:()=><Icons.trophy s={16} c="#22c55e"/>},
  {key:"music",label:"Music",icon:()=><Icons.bell s={16} c="#a855f7"/>},
  {key:"food",label:"Food & Culture",icon:()=><Icons.star s={16} c="#f59e0b"/>},
  {key:"humanrights",label:"Human Rights",icon:()=><Icons.user s={16} c="#6366f1"/>},
  {key:"geography",label:"Geography",icon:()=><Icons.globe s={16} c="#0ea5e9"/>},
  {key:"popculture",label:"Pop Culture",icon:()=><Icons.star s={16} c="#f43f5e"/>},
  {key:"relationships",label:"Relationships",icon:()=><Icons.react s={16} c="#ec4899"/>},
];

// ALL_QUESTIONS now lives in ./triviaQuestions.js (imported at the top of this file) —
// 20 questions per topic per difficulty so long-time players see far fewer repeats.

const mergeQuestionBanks = (a, b) => {
  const out = {};
  const topics = new Set([...Object.keys(a||{}), ...Object.keys(b||{})]);
  topics.forEach(t => {
    out[t] = {};
    const diffs = new Set([...Object.keys((a||{})[t]||{}), ...Object.keys((b||{})[t]||{})]);
    diffs.forEach(d => {
      out[t][d] = [...(((a||{})[t]||{})[d]||[]), ...(((b||{})[t]||{})[d]||[])];
    });
  });
  return out;
};

let _questionBankPromise = null;
const loadQuestionBank = () => {
  if (!_questionBankPromise) {
    _questionBankPromise = Promise.all([
      import('./triviaQuestions'),
      import('./triviaQuestionsNew'),
    ]).then(([base, extra]) => mergeQuestionBanks(base.ALL_QUESTIONS, extra.NEW_QUESTIONS));
  }
  return _questionBankPromise;
};

const getQuestions = async (topics, difficulty, count) => {
  const ALL_QUESTIONS = await loadQuestionBank();
  const topicKeys = topics.length > 0 ? topics : Object.keys(ALL_QUESTIONS);
  let pool = [];
  topicKeys.forEach(t => {
    if(ALL_QUESTIONS[t]) {
      const diffs = difficulty === "mix" ? ["easy","medium","hard"] : [difficulty];
      diffs.forEach(d => { if(ALL_QUESTIONS[t][d]) pool = [...pool, ...ALL_QUESTIONS[t][d]]; });
    }
  });
  return [...pool].sort(()=>Math.random()-0.5).slice(0, Math.min(count, pool.length));
};

const THEMES = [
  {key:"classic",label:"Classic",bg:"#fafaf8",card:"#ffffff",accent:"#0e0e0e"},
  {key:"night",label:"Night",bg:"#0e0e0e",card:"#1a1a1a",accent:"#ff5c3a"},
  {key:"sunset",label:"Sunset",bg:"#fff5f0",card:"#ffffff",accent:"#ff5c3a"},
  {key:"mint",label:"Mint",bg:"#f0fdf8",card:"#ffffff",accent:"#059669"},
  {key:"lavender",label:"Lavender",bg:"#f5f3ff",card:"#ffffff",accent:"#7c3aed"},
  {key:"gold",label:"Gold",bg:"#fffbeb",card:"#ffffff",accent:"#d97706"},
];

const EMOJIS = ["❤️","🔥","😂","😭","🙌","✨","💯","👏","😍","🫶"];
// ── RECEIPT MODAL ──────────────────────────────────────────────────────────────
const ReceiptModal = ({ title, items, onClose }) => {
  const date = new Date().toLocaleString();
  return (
    <Modal onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:"#f0fff4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
          <Icons.receipt s={24} c="#16a34a"/>
        </div>
        <p className="syne" style={{fontWeight:800,fontSize:"1.1rem",marginBottom:4}}>{title||"Payment Receipt"}</p>
        <p style={{fontSize:"0.8rem",color:"#aaa"}}>Unmaskr · {date}</p>
      </div>
      <div style={{background:"#f8f8f6",borderRadius:14,padding:"20px",marginBottom:20}}>
        {items.map(([k,v],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<items.length-1?"1px solid rgba(0,0,0,0.06)":"none",fontSize:"0.88rem"}}>
            <span style={{color:"#888"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{padding:"12px 14px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,marginBottom:16,fontSize:"0.78rem",color:"#0369a1",lineHeight:1.6,display:"flex",gap:8,alignItems:"flex-start"}}>
        <Icons.info s={14} c="#0369a1"/> <span>Funds typically arrive within 10 minutes. If not received, please contact support with your reference number.</span>
      </div>
      <p style={{fontSize:"0.75rem",color:"#aaa",textAlign:"center",marginBottom:16}}>Save a screenshot for your records.</p>
      <Btn onClick={onClose} style={{width:"100%"}}>Done</Btn>
    </Modal>
  );
};

// ── SHARE MODAL ────────────────────────────────────────────────────────────────
const ShareModal = ({ message, ownerName, onClose }) => {
  const [copied,setCopied] = useState(false);
  const [generating,setGenerating] = useState(false);
  const [shareError,setShareError] = useState("");
  const cardRef = useRef(null);
  const shareText = `"${message}"\n\nSend me an anonymous message on Unmaskr — ${window.location.origin}/${ownerName||"yourname"}`;
  const toWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`,"_blank");
  const toTW = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,"_blank");
  const copyTxt = () => {navigator.clipboard?.writeText(shareText);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  // Draws the share card by hand, one instruction at a time — background,
  // shapes, icon, then text — instead of asking a library to look at the
  // page and recreate it. There is no "guessing" step here: whatever font,
  // size, and position I tell the canvas to use is exactly what gets drawn,
  // every single time. This is the actual fix for the text glitches, not
  // just a better version of the same kind of fix.
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach(word => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  };

  const roundRectPath = (ctx, x, y, w, h, r) => {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    // Manual fallback for older browsers without native roundRect support
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const generateCardBlob = async () => {
    if (document.fonts) {
      try {
        await Promise.all([
          document.fonts.load("700 16px 'DM Sans'"),
          document.fonts.load("800 16px 'DM Sans'"),
          document.fonts.load("600 16px 'DM Sans'"),
        ]);
      } catch (e) { /* fonts.ready below still catches the rest */ }
      if (document.fonts.ready) await document.fonts.ready;
    }

    const maskImg = await loadImage(logoMaskWhite);

    const SCALE = 3;      // output resolution multiplier (retina-quality)
    const W = 480;        // card width, in design pixels
    const PAD_X = 24, PAD_Y = 34;
    const bubbleX = PAD_X, bubbleW = W - PAD_X*2;
    const bubblePadX = 22, bubblePadY = 26;

    // First pass on a throwaway context: measure how tall the message will
    // wrap to, so we know the full card height before drawing anything for real.
    const measureCanvas = document.createElement("canvas");
    const mctx = measureCanvas.getContext("2d");
    mctx.font = "600 17px 'DM Sans'";
    const msgLines = wrapText(mctx, message, bubbleW - bubblePadX*2);
    const lineHeight = 17 * 1.65;
    const bubbleH = bubblePadY*2 + msgLines.length * lineHeight;

    const badgeH = 30, badgeMarginBottom = 22;
    const bubbleMarginBottom = 26;
    const bottomRowH = 44;
    const H = PAD_Y + badgeH + badgeMarginBottom + bubbleH + bubbleMarginBottom + bottomRowH + PAD_Y;

    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    // Card background + rounded outer edge (everything else clips to this)
    roundRectPath(ctx, 0, 0, W, H, 22);
    ctx.clip();
    const bg = ctx.createLinearGradient(0, 0, W*0.6, H);
    bg.addColorStop(0, "#1a0b2e");
    bg.addColorStop(0.42, "#0e0e0e");
    bg.addColorStop(1, "#2d0a1f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative glow blobs
    const blob = (cx, cy, r, color) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    };
    blob(-46+75, -46+75, 75, "rgba(255,92,58,0.55)");
    blob(W+36-85, H+56-85, 85, "rgba(124,58,237,0.5)");
    blob(W+24-50, H*0.38, 50, "rgba(236,72,153,0.45)");

    // Badge pill
    let y = PAD_Y;
    ctx.font = "700 11px 'DM Sans'";
    const badgeText = "ANONYMOUS MESSAGE";
    const badgeTextW = ctx.measureText(badgeText).width;
    const badgeIconSize = 14, badgeGap = 7, badgePadX = 16;
    const badgeW = badgePadX*2 + badgeIconSize + badgeGap + badgeTextW;
    roundRectPath(ctx, PAD_X, y, badgeW, badgeH, 50);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.drawImage(maskImg, PAD_X + badgePadX, y + (badgeH-badgeIconSize)/2, badgeIconSize, badgeIconSize);
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, PAD_X + badgePadX + badgeIconSize + badgeGap, y + badgeH/2 + 1);

    // White message bubble
    y += badgeH + badgeMarginBottom;
    roundRectPath(ctx, bubbleX, y, bubbleW, bubbleH, 18);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#0e0e0e";
    ctx.font = "600 17px 'DM Sans'";
    ctx.textBaseline = "alphabetic";
    msgLines.forEach((line, i) => {
      const lineW = ctx.measureText(line).width;
      ctx.fillText(line, bubbleX + (bubbleW - lineW)/2, y + bubblePadY + 17*0.8 + i*lineHeight);
    });

    // Bottom row: mask icon + "Send me one too" + link
    y += bubbleH + bubbleMarginBottom;
    const bottomIconSize = 22;
    ctx.drawImage(maskImg, PAD_X, y + (bottomRowH-bottomIconSize)/2 - 6, bottomIconSize, bottomIconSize);
    const textX = PAD_X + bottomIconSize + 10;
    ctx.fillStyle = "white";
    ctx.font = "800 14px 'DM Sans'";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Send me one too", textX, y + 16);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "400 12px 'DM Sans'";
    ctx.fillText(`${window.location.host}/${ownerName||"yourname"}`, textX, y + 34);

    return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  };

  const saveImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    setShareError("");
    try {
      const blob = await generateCardBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "unmaskr-message.png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShareError("Saved! Now open WhatsApp (or wherever) and attach it from your photos — that route always comes out looking right.");
    } catch (err) {
      setShareError("Couldn't generate the image — try again.");
    }
    setGenerating(false);
  };

  const shareAsImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    setShareError("");
    try {
      const blob = await generateCardBlob();
      const file = new File([blob], "unmaskr-message.png", { type:"image/png" });

      if (navigator.canShare && navigator.canShare({ files:[file] })) {
        await navigator.share({
          files:[file],
          title:"Anonymous message on Unmaskr",
          text:`Send me an anonymous message too — ${window.location.origin}/${ownerName||"yourname"}`,
        });
      } else {
        // Fallback for browsers without file-sharing support (mostly desktop) — download instead
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "unmaskr-message.png";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareError("Image saved — attach it manually in WhatsApp, since your browser doesn't support direct sharing.");
      }
    } catch (err) {
      if (err.name !== "AbortError") setShareError("Couldn't generate the image — try again.");
    }
    setGenerating(false);
  };

  return (
    <Modal onClose={onClose}>
      <p className="syne" style={{fontWeight:700,fontSize:"1rem",marginBottom:6}}>Share this message</p>
      <p style={{fontSize:"0.83rem",color:"#888",marginBottom:20,fontWeight:300}}>Share it as an image, just like NGL</p>
      <div ref={cardRef} style={{position:"relative",background:"linear-gradient(150deg,#1a0b2e 0%,#0e0e0e 42%,#2d0a1f 100%)",borderRadius:22,padding:"34px 24px",marginBottom:20,textAlign:"center",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-46,left:-46,width:150,height:150,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,92,58,0.55) 0%,rgba(255,92,58,0) 70%)"}}/>
        <div style={{position:"absolute",bottom:-56,right:-36,width:170,height:170,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.5) 0%,rgba(124,58,237,0) 70%)"}}/>
        <div style={{position:"absolute",top:"38%",right:-24,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.45) 0%,rgba(236,72,153,0) 70%)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.22)",borderRadius:50,padding:"7px 16px",marginBottom:22}}>
            <LogoMask size={14} variant="white"/>
            <span style={{color:"white",fontSize:"0.68rem",fontWeight:700,whiteSpace:"nowrap"}}>ANONYMOUS MESSAGE</span>
          </div>
          <div style={{background:"white",borderRadius:18,padding:"26px 22px",marginBottom:26,boxShadow:"0 14px 40px rgba(0,0,0,0.35)"}}>
            <p style={{color:"#0e0e0e",fontSize:"1.05rem",lineHeight:1.65,fontWeight:600}}>{message}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <LogoMask size={22} variant="white"/>
            <div style={{textAlign:"left"}}>
              <p style={{color:"white",fontSize:"0.86rem",fontWeight:800,whiteSpace:"nowrap"}}>Send me one too</p>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:"0.76rem"}}>{window.location.host}/{ownerName||"yourname"}</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={saveImage} disabled={generating} style={{padding:"14px",borderRadius:12,border:"none",background:"#ff5c3a",color:"white",fontWeight:700,cursor:generating?"default":"pointer",fontSize:"0.92rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:generating?0.7:1}}>
          <Icons.photo s={16} c="white"/> {generating?"Preparing image...":"Save image"}
        </button>
        {shareError && <p style={{fontSize:"0.78rem",color:shareError.includes("Saved")||shareError.includes("saved")?"#16a34a":"#ef4444",textAlign:"center"}}>{shareError}</p>}
        <button onClick={shareAsImage} disabled={generating} style={{padding:"13px",borderRadius:12,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",color:"#0e0e0e",fontWeight:500,cursor:generating?"default":"pointer",fontSize:"0.87rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:generating?0.6:1}}>
          <Icons.share s={15} c="#555"/> Share directly instead
        </button>
        <button onClick={toWA} style={{padding:"13px",borderRadius:12,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",color:"#0e0e0e",fontWeight:500,cursor:"pointer",fontSize:"0.87rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Icons.share s={15} c="#555"/> Share as text instead
        </button>
        <button onClick={copyTxt} style={{padding:"13px",borderRadius:12,border:"1.5px solid rgba(0,0,0,0.12)",background:"white",fontWeight:500,cursor:"pointer",fontSize:"0.87rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Icons.copy s={15} c="#555"/> {copied?"Copied!":"Copy text"}
        </button>
      </div>
      <p style={{textAlign:"center",marginTop:14,fontSize:"0.75rem",color:"#ccc"}}>"Save image" always comes out looking right. "Share directly" is faster, but some apps crop their own preview a bit oddly.</p>
    </Modal>
  );
};

// ── EMOJI PICKER ───────────────────────────────────────────────────────────────
const EmojiPicker = ({ onPick, onClose }) => (
  <div style={{position:"absolute",bottom:"100%",left:0,background:"white",borderRadius:14,padding:"12px",boxShadow:"0 8px 30px rgba(0,0,0,0.15)",display:"flex",gap:8,flexWrap:"wrap",width:240,zIndex:50,marginBottom:8}}>
    {EMOJIS.map(e=>(<button key={e} onClick={()=>{onPick(e);onClose();}} style={{fontSize:"1.4rem",background:"none",border:"none",cursor:"pointer",padding:"4px",borderRadius:8,transition:"transform 0.15s"}}>{e}</button>))}
  </div>
);
// ── LANDING ────────────────────────────────────────────────────────────────────
const Landing = ({ goTo }) => {
  const [vis,setVis] = useState(0);
  const msgs = [{t:"You always make people feel seen",tm:"just now"},{t:"Honestly you inspire me more than you know",tm:"2m ago"},{t:"I wish I had your energy",tm:"5m ago"}];
  useEffect(()=>{const tm=setInterval(()=>setVis(v=>Math.min(v+1,msgs.length)),700);return()=>clearInterval(tm);},[]);
  return (
    <div style={{background:"#fafaf8",color:"#0e0e0e"}}>
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 30px",background:"rgba(250,250,248,0.9)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}><LogoFull height={28}/></div>
        <div style={{display:"flex",gap:10}}>
          <Btn outline onClick={()=>goTo("login")}>Log in</Btn>
          <Btn onClick={()=>goTo("signup")}>Get started</Btn>
        </div>
      </nav>
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"130px 24px 90px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 55% 45% at 15% 25%,rgba(255,92,58,0.09) 0%,transparent 70%),radial-gradient(ellipse 45% 40% at 85% 70%,rgba(255,205,60,0.11) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:"8%",left:"4%",opacity:0.05}} className="float1"><LogoMask size={120}/></div>
        <div style={{position:"absolute",top:"55%",right:"5%",opacity:0.04}} className="float2"><LogoMask size={130}/></div>
        <div style={{position:"relative",zIndex:1}}>
          <div className="fadeUp" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#f0efec",border:"1px solid rgba(0,0,0,0.1)",borderRadius:100,padding:"6px 16px",fontSize:"0.78rem",fontWeight:500,color:"#888",marginBottom:28}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#ff5c3a",display:"inline-block"}}/>Anonymous messages, reimagined
          </div>
          <h1 className="syne fadeUp1" style={{fontSize:"clamp(2.6rem,7vw,5rem)",fontWeight:800,lineHeight:1.05,letterSpacing:"-0.03em",maxWidth:740}}>
            What do people <span style={{position:"relative",display:"inline-block"}}>really<span style={{position:"absolute",bottom:4,left:0,right:0,height:7,background:"#ffcd3c",borderRadius:3,zIndex:-1}}/></span><br/>think about you?
          </h1>
          <p className="fadeUp2" style={{fontSize:"1.05rem",color:"#666",lineHeight:1.75,maxWidth:440,margin:"24px auto 0",fontWeight:300}}>Share your Unmaskr link, receive honest anonymous messages, and play fun games with friends.</p>
          <div className="fadeUp3" style={{display:"flex",gap:12,justifyContent:"center",marginTop:40,flexWrap:"wrap"}}>
            <Btn onClick={()=>goTo("signup")} style={{padding:"15px 34px",fontSize:"0.95rem"}}>Create your link — it's free</Btn>
            <Btn outline onClick={()=>goTo("send",{username:"demo"})} style={{padding:"15px 34px",fontSize:"0.95rem"}}>See how it works</Btn>
          </div>
          <div style={{marginTop:44,display:"flex",flexDirection:"column",gap:10,maxWidth:400,margin:"44px auto 0"}}>
            {msgs.slice(0,vis).map((m,i)=>(
              <div key={i} style={{background:"white",borderRadius:14,padding:"14px 18px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)",display:"flex",gap:12,alignItems:"center",textAlign:"left",animation:"fadeUp 0.4s ease both"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LogoMask size={18}/></div>
                <div><p style={{fontSize:"0.88rem",color:"#0e0e0e",fontWeight:500}}>{m.t}</p><p style={{fontSize:"0.72rem",color:"#aaa",marginTop:2}}>{m.tm}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div style={{display:"flex",justifyContent:"center",gap:40,flexWrap:"wrap",padding:"56px 24px",borderTop:"1px solid rgba(0,0,0,0.07)",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        {[["100K+","Messages sent"],["50K+","Active users"],["100%","Anonymous"],["Free","To get started"]].map(([n,l])=>(
          <div key={l} style={{textAlign:"center"}}><div className="syne" style={{fontSize:"2.3rem",fontWeight:800}}>{n}</div><div style={{fontSize:"0.83rem",color:"#888",marginTop:4}}>{l}</div></div>
        ))}
      </div>
      <div style={{padding:"90px 32px",maxWidth:1080,margin:"0 auto"}}>
        <Tag text="How it works"/>
        <h2 className="syne" style={{fontSize:"clamp(1.9rem,4vw,2.9rem)",fontWeight:800,letterSpacing:"-0.02em",lineHeight:1.1,maxWidth:420}}>Three simple steps</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:20,marginTop:56}}>
          {[{n:"01",icon:<Icons.copy s={22} c="white"/>,t:"Create your link",d:"Sign up and get your unique Unmaskr link in seconds."},{n:"02",icon:<Icons.share s={22} c="white"/>,t:"Share it everywhere",d:"Post on Instagram, WhatsApp, Twitter — let people send you honest messages."},{n:"03",icon:<Icons.chat s={22} c="white"/>,t:"Receive & explore",d:"Read messages, react, reply, buy hints and play games with friends."}].map(s=>(
            <div key={s.n} style={{background:"#f3f2ef",borderRadius:18,padding:"32px 28px",position:"relative",overflow:"hidden"}}>
              <div className="syne" style={{position:"absolute",top:14,right:18,fontSize:"3.8rem",fontWeight:800,color:"rgba(0,0,0,0.06)",lineHeight:1}}>{s.n}</div>
              <div style={{width:46,height:46,borderRadius:13,background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>{s.icon}</div>
              <h3 className="syne" style={{fontSize:"1.05rem",fontWeight:700,marginBottom:10}}>{s.t}</h3>
              <p style={{fontSize:"0.88rem",color:"#666",lineHeight:1.65,fontWeight:300}}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"90px 32px",background:"#0e0e0e",color:"white"}}>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <p style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"#ffcd3c",marginBottom:14}}>The hint system</p>
          <h2 className="syne" style={{fontSize:"clamp(1.9rem,4vw,2.9rem)",fontWeight:800,letterSpacing:"-0.02em",lineHeight:1.1,maxWidth:500}}>Curious who sent it?<br/>Get a <span style={{color:"#ffcd3c"}}>hint.</span></h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginTop:48}}>
            {ALL_HINTS.slice(0,4).map((h,i)=>(
              <div key={h.key} className="hint-hover" style={{border:`1px solid ${i===1?"#ffcd3c":"rgba(255,255,255,0.1)"}`,background:i===1?"rgba(255,205,60,0.05)":"transparent",borderRadius:16,padding:"24px 20px",transition:"all 0.2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                  <Icons.lock s={16} c="#ffcd3c"/>
                  <span style={{fontSize:"0.75rem",fontWeight:700,color:"#ffcd3c",textTransform:"uppercase",letterSpacing:"0.06em"}}>Hint</span>
                </div>
                <h3 className="syne" style={{fontSize:"0.95rem",fontWeight:700,marginBottom:8,color:"white"}}>{h.label}</h3>
                <p style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.4)",fontStyle:"italic"}}>"{h.result("...")}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"90px 32px",maxWidth:1080,margin:"0 auto"}}>
        <Tag text="Games"/>
        <h2 className="syne" style={{fontSize:"clamp(1.9rem,4vw,2.9rem)",fontWeight:800,letterSpacing:"-0.02em",lineHeight:1.1,maxWidth:500}}>Play with friends</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginTop:48}}>
          {[{icon:<LogoMask size={32}/>,t:"Mystery Lobby",d:"Host shares a link. Players pick preferences. Guess what others picked or get eliminated!",b:"For everyone",bc:"#0e0e0e",c:"#f0efec"},{icon:<Icons.trophy size={32} color="#ffcd3c"/>,t:"Quiz Clash",d:"Trivia questions across any topic and difficulty you pick. Highest score wins — bragging rights only.",b:"For everyone",bc:"#0e0e0e",c:"#0e0e0e"}].map(g=>(
            <div key={g.t} className="game-card" style={{background:g.c,borderRadius:20,padding:"32px 28px",transition:"all 0.2s",cursor:"pointer",border:g.c==="#0e0e0e"?"none":"1px solid rgba(0,0,0,0.06)"}} onClick={()=>goTo("signup")}>
              <div style={{width:56,height:56,borderRadius:16,background:g.bc==="#0e0e0e"?"#0e0e0e":"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>{g.icon}</div>
              <div style={{display:"inline-block",background:g.bc,color:"white",fontSize:"0.7rem",fontWeight:700,padding:"4px 12px",borderRadius:50,marginBottom:14}}>{g.b}</div>
              <h3 className="syne" style={{fontSize:"1.2rem",fontWeight:800,marginBottom:10,color:g.c==="#0e0e0e"?"white":"#0e0e0e"}}>{g.t}</h3>
              <p style={{fontSize:"0.88rem",color:g.c==="#0e0e0e"?"rgba(255,255,255,0.55)":"#666",lineHeight:1.65,fontWeight:300}}>{g.d}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"90px 32px",textAlign:"center",background:"#f3f2ef"}}>
        <h2 className="syne" style={{fontSize:"clamp(2rem,5vw,3.6rem)",fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.1,maxWidth:560,margin:"0 auto"}}>Ready to find out what people really think?</h2>
        <p style={{margin:"20px auto 0",maxWidth:380,color:"#666",fontSize:"0.98rem",fontWeight:300,lineHeight:1.7}}>Join thousands already using Unmaskr.</p>
        <Btn onClick={()=>goTo("signup")} style={{marginTop:36,padding:"16px 38px",fontSize:"1rem"}}>Create your free link</Btn>
      </div>
      <footer style={{padding:"32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,borderTop:"1px solid rgba(0,0,0,0.08)",fontSize:"0.83rem",color:"#888"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><LogoFull height={22}/></div>
        <div style={{display:"flex",gap:22}}>{["Privacy","Terms","Safety","Contact"].map(l=><span key={l} style={{cursor:"pointer"}} onClick={()=>goTo("terms")}>{l}</span>)}</div>
        <span>© 2025 Unmaskr. All rights reserved.</span>
      </footer>
    </div>
  );
};
// ── SIGNUP ─────────────────────────────────────────────────────────────────────
const Signup = ({ goTo, onSignupComplete, signupsDisabled }) => {
  if (signupsDisabled) return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{maxWidth:380}}>
        <LogoMask size={48}/>
        <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginTop:20,marginBottom:12}}>Signups paused</h2>
        <p style={{color:"#888",fontSize:"0.9rem",lineHeight:1.7,marginBottom:24,fontWeight:300}}>We're not accepting new signups right now. Please check back soon.</p>
        <Btn onClick={()=>goTo("landing")} style={{width:"100%"}}>Back to homepage</Btn>
      </div>
    </div>
  );

  const [step,setStep] = useState(1);
  const [form,setForm] = useState({name:"",username:"",email:"",password:"",dob:"",gender:"",ageGroup:"",country:"NG",dobConfirmed:false});
  const [pwErr,setPwErr] = useState("");
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const ageGroups = ["16–18","19–21","22–26","27–30","31 and above"];
  const validatePw = pw => {
    if(pw.length < 8) return "Password must be at least 8 characters";
    if(!/[0-9!@#$%^&*]/.test(pw)) return "Must include at least one number or symbol";
    return "";
  };
  const [signupError, setSignupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => (s<=1 ? 0 : s-1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown > 0]);

  const saveProfileAndWallet = async (userId) => {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        name: form.name,
        username: form.username,
        country: form.country,
        dob: form.dob,
        gender: form.gender,
        age_group: form.ageGroup,
        email: form.email,
      });
    if (profileError) return profileError;

    await supabase.from("wallets").insert({ user_id: userId, balance: 0 });
    return null;
  };

  const handleSignup = async () => {
    setLoading(true);
    setSignupError("");
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) {
      setSignupError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // No email confirmation required — already fully signed in, so the
      // profile can be saved right now (auth.uid() resolves correctly).
      const profileError = await saveProfileAndWallet(data.user.id);
      setLoading(false);
      if (profileError) { setSignupError("Couldn't save your profile: " + profileError.message); return; }
      onSignupComplete && onSignupComplete(form);
      goTo("inbox");
    } else {
      // Confirmation required — NOT signed in yet, so saving the profile now
      // would fail RLS (auth.uid() is null until the code is verified).
      // Save it after verifyCode succeeds instead.
      setLoading(false);
      setNeedsConfirmation(true);
      setResendCooldown(90);
    }
  };

  const verifyCode = async () => {
    if (!otpCode.trim()) return;
    setVerifying(true);
    setOtpError("");
    const { data, error } = await supabase.auth.verifyOtp({ email: form.email, token: otpCode.trim(), type: "signup" });
    if (error) {
      setOtpError(error.message);
      setVerifying(false);
      return;
    }
    // Now actually signed in — safe to save the profile.
    const profileError = await saveProfileAndWallet(data.user.id);
    setVerifying(false);
    if (profileError) { setOtpError("Couldn't save your profile: " + profileError.message); return; }
    onSignupComplete && onSignupComplete(form);
    goTo("inbox");
  };

  const resendCode = async () => {
    if (resendCooldown > 0) return; // extra guard against rapid clicks/scripts, on top of the visible cooldown
    setResendMsg("");
    setResendCooldown(90);
    const { error } = await supabase.auth.resend({ type: "signup", email: form.email });
    setResendMsg(error ? "Couldn't resend — try again shortly." : "New code sent!");
  };

  if (needsConfirmation) return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div className="popIn" style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Icons.mail s={24} c="#0e0e0e"/></div>
        <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:8}}>Check your email</h2>
        <p style={{color:"#888",fontSize:"0.9rem",marginBottom:28,fontWeight:300}}>We sent a 6-digit code to <strong>{form.email}</strong></p>
        <Inp placeholder="Enter 6-digit code" value={otpCode} onChange={e=>setOtpCode(e.target.value)}/>
        {otpError && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:10}}>{otpError}</p>}
        <Btn onClick={verifyCode} style={{width:"100%",marginTop:16}} disabled={!otpCode.trim()||verifying}>{verifying?"Verifying...":"Verify & continue"}</Btn>
        <p style={{textAlign:"center",marginTop:14,fontSize:"0.85rem",color:"#aaa"}}>Didn't get it? {resendCooldown>0 ? <span style={{color:"#ccc"}}>Resend in {String(Math.floor(resendCooldown/60)).padStart(1,"0")}:{String(resendCooldown%60).padStart(2,"0")}</span> : <span style={{color:"#ff5c3a",cursor:"pointer"}} onClick={resendCode}>Resend</span>}</p>
        {resendMsg && <p style={{fontSize:"0.78rem",color:"#888",marginTop:6}}>{resendMsg}</p>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>goTo("landing")}><LogoFull height={24}/></div>
        <span style={{fontSize:"0.85rem",color:"#888"}}>Have an account? <span style={{color:"#0e0e0e",fontWeight:500,cursor:"pointer",textDecoration:"underline"}} onClick={()=>goTo("login")}>Log in</span></span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
        <div className="popIn" style={{width:"100%",maxWidth:440}}>
          <div style={{display:"flex",gap:6,marginBottom:36}}>{[1,2,3].map(n=><div key={n} style={{flex:1,height:4,borderRadius:2,background:step>=n?"#0e0e0e":"#e0e0e0",transition:"background 0.3s"}}/>)}</div>

          {step===1 && <>
            <h1 className="syne" style={{fontSize:"1.9rem",fontWeight:800,letterSpacing:"-0.02em",marginBottom:8}}>Create your account</h1>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:20,fontWeight:300}}>Get your anonymous message link in seconds.</p>
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:12,padding:"14px 16px",marginBottom:20,fontSize:"0.82rem",color:"#0369a1",lineHeight:1.7,display:"flex",gap:10,alignItems:"flex-start"}}>
              <Icons.info s={16} c="#0369a1" style={{flexShrink:0,marginTop:2}}/>
              <span><strong>How we use your data:</strong> Your name and email are used only for your account. Gender, birth month, and age group generate anonymous hints only. We never sell your data and your wallet balance never expires.</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Inp placeholder="Your full name" value={form.name} onChange={upd("name")}/>
              <Inp placeholder="Email address" type="email" value={form.email} onChange={upd("email")}/>
              <div>
                <Inp placeholder="Password" type="password" value={form.password} onChange={e=>{upd("password")(e);setPwErr(validatePw(e.target.value));}}/>
                <p style={{fontSize:"0.78rem",color:pwErr?"#ef4444":"#aaa",marginTop:6}}>
                  {pwErr || "Min. 8 characters, include at least one number or symbol"}
                </p>
              </div>
              <div>
                <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:10}}>Your country</label>
                <select value={form.country} onChange={upd("country")} style={{width:"100%",padding:"14px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",fontSize:"0.95rem",cursor:"pointer"}}>
                  {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
            </div>
            <Btn onClick={()=>setStep(2)} style={{width:"100%",marginTop:20,padding:"15px"}} disabled={!form.name||!form.email||!form.password||!!validatePw(form.password)}>Continue</Btn>
          </>}

          {step===2 && <>
            <h1 className="syne" style={{fontSize:"1.9rem",fontWeight:800,letterSpacing:"-0.02em",marginBottom:8}}>A little about you</h1>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:28,fontWeight:300}}>Only general info is ever shown in hints — never your identity.</p>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:10}}>Your gender</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Male","Female","Non-binary","Prefer not to say"].map(g=>(
                    <button key={g} onClick={()=>setForm(f=>({...f,gender:g}))} style={{padding:"9px 14px",borderRadius:50,fontSize:"0.8rem",border:`1.5px solid ${form.gender===g?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:form.gender===g?"#0e0e0e":"white",color:form.gender===g?"white":"#555",cursor:"pointer",transition:"all 0.2s"}}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:10}}>Age group</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {ageGroups.map(a=>(
                    <button key={a} onClick={()=>setForm(f=>({...f,ageGroup:a}))} style={{padding:"9px 14px",borderRadius:50,fontSize:"0.8rem",border:`1.5px solid ${form.ageGroup===a?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:form.ageGroup===a?"#0e0e0e":"white",color:form.ageGroup===a?"white":"#555",cursor:"pointer",transition:"all 0.2s"}}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:10}}>Date of birth</label>
                <Inp type="date" value={form.dob} onChange={upd("dob")}/>
              </div>
              <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"12px 14px",background:"#f8f8f6",borderRadius:10}}>
                <input type="checkbox" checked={form.dobConfirmed} onChange={e=>setForm(f=>({...f,dobConfirmed:e.target.checked}))} style={{marginTop:2,width:16,height:16,flexShrink:0}}/>
                <span style={{fontSize:"0.82rem",color:"#666",lineHeight:1.6}}>I confirm my date of birth is correct and I am at least 16 years old.</span>
              </label>
            </div>
            <Btn onClick={()=>setStep(3)} style={{width:"100%",marginTop:24,padding:"15px"}} disabled={!form.gender||!form.dob||!form.ageGroup||!form.dobConfirmed}>Continue</Btn>
            <div style={{textAlign:"center",marginTop:14}}><span style={{fontSize:"0.85rem",color:"#aaa",cursor:"pointer"}} onClick={()=>setStep(1)}>← Back</span></div>
          </>}

          {step===3 && <>
            <h1 className="syne" style={{fontSize:"1.9rem",fontWeight:800,letterSpacing:"-0.02em",marginBottom:8}}>Pick your username</h1>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:32,fontWeight:300}}>This becomes your unique Unmaskr link.</p>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",fontSize:"0.9rem",color:"#aaa",pointerEvents:"none"}}>unmaskr.com/</div>
              <Inp placeholder="yourname" value={form.username} onChange={upd("username")} style={{paddingLeft:130}}/>
            </div>
            {form.username && <div style={{marginTop:10,padding:"10px 14px",background:"#f0fff4",border:"1px solid #86efac",borderRadius:10,fontSize:"0.83rem",color:"#166534",display:"flex",alignItems:"center",gap:8}}><Icons.check s={14} c="#16a34a"/> unmaskr.com/{form.username} is available!</div>}
            <Btn onClick={handleSignup} style={{width:"100%",marginTop:20,padding:"15px"}} disabled={!form.username||loading}>{loading?"Creating your account...":"Create my link"}</Btn>
{signupError && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:10,textAlign:"center"}}>{signupError}</p>}
            <div style={{textAlign:"center",marginTop:14}}><span style={{fontSize:"0.85rem",color:"#aaa",cursor:"pointer"}} onClick={()=>setStep(2)}>← Back</span></div>
          </>}

          <p style={{textAlign:"center",marginTop:24,fontSize:"0.78rem",color:"#bbb",lineHeight:1.6}}>By signing up you agree to our <span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>goTo("terms")}>Terms of Service</span></p>
        </div>
      </div>
    </div>
  );
};
// ── LOGIN ──────────────────────────────────────────────────────────────────────
const Login = ({ goTo, onLoginComplete }) => {
  const [form,setForm] = useState({email:"",password:""});
  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);
  const upd = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const tryLogin = async () => {
    if(!form.email||!form.password) return;
    setLoading(true);
    setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) {
      setErr(error.message==="Invalid login credentials" ? "Wrong email or password, please try again." : error.message);
      setLoading(false);
      return;
    }
    // Check suspension immediately so a suspended user gets clear feedback
    // right here, instead of a confusing flash of the app before being kicked out.
    const { data: prof } = await supabase.from("profiles").select("status").eq("id", data.user.id).single();
    if (prof?.status === "suspended") {
      await supabase.auth.signOut();
      setErr("This account has been suspended. Contact support@unmaskr.com for more information.");
      setLoading(false);
      return;
    }
    setLoading(false);
    onLoginComplete && onLoginComplete();
    goTo("inbox");
  };
  return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>goTo("landing")}><LogoFull height={24}/></div>
        <span style={{fontSize:"0.85rem",color:"#888"}}>No account? <span style={{color:"#0e0e0e",fontWeight:500,cursor:"pointer",textDecoration:"underline"}} onClick={()=>goTo("signup")}>Sign up free</span></span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
        <div className="popIn" style={{width:"100%",maxWidth:400}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <LogoMask size={44}/>
            <h1 className="syne" style={{fontSize:"1.9rem",fontWeight:800,letterSpacing:"-0.02em",marginTop:16,marginBottom:8}}>Welcome back</h1>
            <p style={{color:"#888",fontSize:"0.9rem",fontWeight:300}}>Log in to see your anonymous messages</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp placeholder="Email address" type="email" value={form.email} onChange={upd("email")}/>
            <Inp placeholder="Password" type="password" value={form.password} onChange={e=>{upd("password")(e);setErr("");}}/>
          </div>
          {err && <div style={{marginTop:10,padding:"10px 14px",background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:10,fontSize:"0.83rem",color:"#ef4444",display:"flex",alignItems:"center",gap:8}}><Icons.warning s={14} c="#ef4444"/>{err}</div>}
          <Btn onClick={tryLogin} style={{width:"100%",marginTop:20,padding:"15px"}} disabled={!form.email||!form.password||loading}>{loading?"Logging in...":"Log in"}</Btn>
          <p style={{textAlign:"center",marginTop:16,fontSize:"0.85rem",color:"#ff5c3a",cursor:"pointer",fontWeight:500}} onClick={()=>goTo("forgot")}>Forgot password?</p>
        </div>
      </div>
    </div>
  );
};

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
const ForgotPassword = ({ goTo }) => {
  const [step,setStep] = useState(1);
  const [email,setEmail] = useState("");
  const [code,setCode] = useState("");
  const [newPass,setNewPass] = useState("");
  const [confirmPass,setConfirmPass] = useState("");
  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);
  const [resendCooldown,setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => (s<=1 ? 0 : s-1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown > 0]);

  const sendReset = async () => {
    if (resendCooldown > 0) return;
    setLoading(true); setErr("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setResendCooldown(90);
    setStep(2);
  };

  const verifyCode = async () => {
    setLoading(true); setErr("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" });
    setLoading(false);
    if (error) { setErr("That code is wrong or has expired."); return; }
    setStep(3);
  };

  const resetPassword = async () => {
    if (newPass !== confirmPass) { setErr("Passwords don't match."); return; }
    if (newPass.length < 8 || !/[0-9!@#$%^&*]/.test(newPass)) { setErr("Min. 8 characters, with at least one number or symbol."); return; }
    setLoading(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    await supabase.auth.signOut();
    goTo("login");
  };

  const iconCircle = (I) => (
    <div style={{width:52,height:52,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={24} c="#0e0e0e"/></div>
  );
  const errLine = err && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:10}}>{err}</p>;

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"20px 32px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <BackBtn onClick={()=>goTo("login")}/>
        <LogoMask size={24}/>
        <span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Reset password</span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
        <div className="popIn" style={{width:"100%",maxWidth:400}}>
          {step===1 && <>
            {iconCircle(Icons.lock)}
            <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:8}}>Forgot your password?</h2>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:28,fontWeight:300}}>Enter your email and we'll send a 6-digit code.</p>
            <Inp placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
            {errLine}
            <Btn onClick={sendReset} style={{width:"100%",marginTop:16,padding:"15px"}} disabled={!email||loading}>{loading?"Sending...":"Send reset code"}</Btn>
          </>}
          {step===2 && <>
            {iconCircle(Icons.mail)}
            <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:8}}>Enter your code</h2>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:28,fontWeight:300}}>We sent a 6-digit code to <strong>{email}</strong></p>
            <Inp placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))}/>
            {errLine}
            <Btn onClick={verifyCode} style={{width:"100%",marginTop:16,padding:"15px"}} disabled={code.length<6||loading}>{loading?"Verifying...":"Verify code"}</Btn>
            <p style={{textAlign:"center",marginTop:14,fontSize:"0.85rem",color:"#aaa"}}>Didn't get it? {resendCooldown>0 ? <span style={{color:"#ccc"}}>Resend in {Math.floor(resendCooldown/60)}:{String(resendCooldown%60).padStart(2,"0")}</span> : <span style={{color:"#ff5c3a",cursor:"pointer"}} onClick={sendReset}>Resend</span>}</p>
          </>}
          {step===3 && <>
            {iconCircle(Icons.unlock)}
            <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:8}}>New password</h2>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:28,fontWeight:300}}>Choose a strong new password.</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Inp placeholder="New password (min 8 chars + number/symbol)" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)}/>
              <Inp placeholder="Confirm new password" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}/>
            </div>
            {errLine}
            <Btn onClick={resetPassword} style={{width:"100%",marginTop:16,padding:"15px"}} disabled={newPass.length<8||!confirmPass||loading}>{loading?"Saving...":"Reset password"}</Btn>
          </>}
        </div>
      </div>
    </div>
  );
};

// ── TERMS ──────────────────────────────────────────────────────────────────────
const Terms = ({ goTo, fromSend, onAccept }) => (
  <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column"}}>
    <div style={{padding:"20px 32px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)",position:"sticky",top:0,background:"#fafaf8",zIndex:10}}>
      <BackBtn onClick={()=>fromSend?onAccept(false):goTo("landing")}/>
      <span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Terms & Conditions</span>
    </div>
    <div style={{flex:1,maxWidth:680,margin:"0 auto",padding:"40px 28px",width:"100%"}}>
      <div style={{background:"white",borderRadius:20,padding:"32px 28px",border:"1px solid rgba(0,0,0,0.08)",whiteSpace:"pre-wrap",fontSize:"0.88rem",lineHeight:1.9,color:"#444"}}>{TERMS}</div>
      {fromSend && <div style={{display:"flex",gap:12,marginTop:24}}><Btn outline onClick={()=>onAccept(false)} style={{flex:1}}>Decline</Btn><Btn onClick={()=>onAccept(true)} style={{flex:1}}>I Accept</Btn></div>}
    </div>
  </div>
);
// ── INBOX ──────────────────────────────────────────────────────────────────────
const Inbox = ({ goTo, currency, isMinor=false, userId, username="yourname", hintsDisabled=false }) => {
  const cur = currency || CURRENCIES.NG;
  const [messages,setMessages] = useState([]);
  const [loadingMsgs,setLoadingMsgs] = useState(true);
  const [msgLoadError,setMsgLoadError] = useState("");

  const fetchMessages = () => {
    if (!userId) { setLoadingMsgs(false); return; }
    setLoadingMsgs(true);
    // Runs through the database's get_inbox_messages() function instead of a raw
    // select — the database itself withholds sender_email/age/name/gender for any
    // hint you haven't paid for, so there's nothing sensitive to intercept anymore.
    setMsgLoadError("");
    supabase.rpc("get_inbox_messages")
      .then(({ data, error }) => {
        if (error) {
          // Surfaced instead of silently showing "No messages yet" — the most
          // common cause is that wallet-security.sql hasn't been run yet, so
          // this database function doesn't exist.
          console.error("get_inbox_messages failed:", error);
          setMsgLoadError(error.message || "Couldn't load your messages.");
          setLoadingMsgs(false);
          return;
        }
        if (data) setMessages(data.map(m => ({
          id: m.id,
          text: m.text,
          time: new Date(m.created_at).toLocaleString(),
          read: m.read,
          hints: m.hints_unlocked || [],
          hintTexts: m.hint_texts || {},
          reactions: m.reactions || [],
          replies: m.replies || [],
          sd: m.sd || {},
          specified: m.specified || {},
          hasSenderEmail: !!m.has_email,
        })));
        setLoadingMsgs(false);
      });
  };

  useEffect(() => { fetchMessages(); }, [userId]);
  const [activeMsg,setActiveMsg] = useState(null);
  const [copied,setCopied] = useState(false);
  const [activeHints,setActiveHints] = useState([]);
  const [showHints,setShowHints] = useState(false);
  const [showEmoji,setShowEmoji] = useState(false);
  const [replyText,setReplyText] = useState("");
  const [replyStatus,setReplyStatus] = useState(null); // null | "sent" | "emailed" | "error"
  const [shareMsg,setShareMsg] = useState(null);
  const [receipt,setReceipt] = useState(null);
  const [unlocking,setUnlocking] = useState(false);
  const unread = messages.filter(m=>!m.read).length;

  const openMsg = async msg => {
    if (!msg.read) {
      await supabase.from("messages").update({ read: true }).eq("id", msg.id);
    }
    setMessages(ms=>ms.map(m=>m.id===msg.id?{...m,read:true}:m));
    setActiveMsg({...msg,read:true});
    setActiveHints(getRandHints(msg.hints));
    setShowHints(msg.hints.length>0);
    setReplyText("");
  };

  const [unlockError,setUnlockError] = useState("");

  const unlockHint = async (h, idx) => {
    if (unlocking || !userId) return;
    setUnlocking(true);
    setUnlockError("");

    // The ENTIRE purchase — checking you haven't already unlocked it, working out
    // the price, debiting your wallet, crediting the sender's, and recording both
    // transactions — happens inside one database function now. The browser only
    // ever says which hint on which message; it can no longer decide an amount or
    // credit a wallet directly, and a double-tap can't charge you twice because the
    // database itself rejects a hint that's already unlocked before touching money.
    const { data, error } = await supabase.rpc("purchase_hint", {
      p_message_id: activeMsg.id,
      p_hint_key: h.key,
      p_tier_index: idx,
    });

    if (error) {
      setUnlocking(false);
      console.error("purchase_hint failed:", error);
      if (error.message?.includes("insufficient_funds")) setUnlockError("Not enough wallet balance for this hint. Top up your wallet to continue.");
      else if (error.message?.includes("already_unlocked")) setUnlockError("You've already unlocked this hint.");
      else if (error.message?.includes("rate_limited")) setUnlockError("You're unlocking hints a little too fast — give it a minute and try again.");
      // Shown instead of a generic message so we can actually see what's wrong,
      // rather than guess — same fix as the inbox's earlier silent-failure bug.
      else setUnlockError(error.message || "Couldn't unlock this hint. Please try again.");
      return;
    }

    const updated = [...activeMsg.hints, h.key];
    // The reveal text itself (a random range/phrasing) is cosmetic, not money, so
    // it's still generated here and saved as a normal update — the database has
    // already confirmed above that this hint is genuinely unlocked before we do this.
    const revealText = data?.charged ? h.result(data.value) : h.unspecified;
    const updatedTexts = { ...activeMsg.hintTexts, [h.key]: revealText };
    await supabase.from("messages").update({ hint_texts: updatedTexts }).eq("id", activeMsg.id);

    setActiveMsg(m=>({...m,hints:updated,hintTexts:updatedTexts}));
    setMessages(ms=>ms.map(m=>m.id===activeMsg.id?{...m,hints:updated,hintTexts:updatedTexts}:m));
    setActiveHints(getRandHints(updated));
    if (data?.charged) {
      setReceipt({label:h.label, price:`${cur.symbol}${data.price}`, senderShare:`${cur.symbol}${(data.price*0.5).toFixed(2)}`, platformFee:`${cur.symbol}${(data.price*0.5).toFixed(2)}`});
    }
    setUnlocking(false);
  };

  const addReaction = async emoji => {
    const updated = [...activeMsg.reactions,emoji];
    await supabase.from("messages").update({ reactions: updated }).eq("id", activeMsg.id);
    setActiveMsg(m=>({...m,reactions:updated}));
    setMessages(ms=>ms.map(m=>m.id===activeMsg.id?{...m,reactions:updated}:m));
  };

  // The actual delivery (as a new anonymous message in the sender's own inbox,
  // or an email if they gave one but have no account) happens entirely inside
  // send_reply() in the database — the sender's real email never reaches this
  // browser, same privacy guarantee as everywhere else sender data is handled.
  const sendReply = async () => {
    if(!replyText.trim()) return;
    const filtered = filterText(replyText.trim(), isMinor);
    setReplyStatus(null);
    const { data, error } = await supabase.rpc("send_reply", { p_message_id: activeMsg.id, p_reply_text: filtered });
    if (error) { setReplyStatus("error"); return; }
    const updated = [...activeMsg.replies, filtered];
    setActiveMsg(m=>({...m,replies:updated}));
    setMessages(ms=>ms.map(m=>m.id===activeMsg.id?{...m,replies:updated}:m));
    setReplyText("");
    setReplyStatus(data?.delivered ? "sent" : data?.emailed ? "emailed" : null);
  };

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column"}}>
      <AppNav goTo={goTo} active="inbox" userId={userId}/>
      <div style={{maxWidth:700,margin:"0 auto",width:"100%",padding:"32px 20px"}}>
        <div className="fadeUp" style={{background:"#0e0e0e",borderRadius:18,padding:"22px 26px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
          <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.78rem",fontWeight:500,marginBottom:4}}>YOUR LINK</p><p style={{color:"white",fontSize:"0.95rem",fontWeight:500}}>{window.location.host}/{username}</p></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{navigator.clipboard?.writeText(`${window.location.origin}/${username}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"white",fontSize:"0.83rem",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Icons.copy s={14} c="white"/>{copied?"Copied!":"Copy link"}
            </button>
            <button onClick={()=>goTo("send",{username})} style={{padding:"10px 16px",borderRadius:50,border:"none",background:"#ff5c3a",color:"white",fontSize:"0.83rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Icons.eye s={14} c="white"/>Preview
            </button>
          </div>
        </div>
        <div className="fadeUp1" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div><h2 className="syne" style={{fontSize:"1.5rem",fontWeight:800}}>Your Messages</h2>{unread>0&&<p style={{fontSize:"0.83rem",color:"#ff5c3a",marginTop:2}}>{unread} unread</p>}</div>
          <span style={{fontSize:"0.83rem",color:"#aaa"}}>{messages.length} total</span>
        </div>
        {loadingMsgs && <p style={{textAlign:"center",color:"#aaa",padding:"40px 0"}}>Loading messages...</p>}
        {!loadingMsgs && msgLoadError && (
          <div style={{textAlign:"center",padding:"40px 24px",background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:16}}>
            <Icons.warning s={28} c="#ef4444"/>
            <p className="syne" style={{fontWeight:700,fontSize:"1rem",marginTop:12,marginBottom:6,color:"#991b1b"}}>Couldn't load your messages</p>
            <p style={{color:"#991b1b",fontSize:"0.82rem",fontFamily:"monospace",wordBreak:"break-word"}}>{msgLoadError}</p>
          </div>
        )}
        {!loadingMsgs && !msgLoadError && messages.length===0 && (
          <div style={{textAlign:"center",padding:"60px 24px"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Icons.inbox s={28} c="#aaa"/></div>
            <p className="syne" style={{fontWeight:700,fontSize:"1.1rem",marginBottom:8}}>No messages yet</p>
            <p style={{color:"#888",fontSize:"0.9rem",fontWeight:300,marginBottom:24}}>Share your link to start receiving anonymous messages!</p>
            <Btn onClick={()=>{navigator.clipboard?.writeText(`${window.location.origin}/${username}`);setCopied(true);setTimeout(()=>setCopied(false),2000);}}><Icons.copy s={16} c="white"/>{copied?"Copied!":"Copy your link"}</Btn>
          </div>
        )}
        <div className="fadeUp2" style={{display:"flex",flexDirection:"column",gap:10}}>
          {messages.map(msg=>(
            <div key={msg.id} className="msg-row" onClick={()=>openMsg(msg)} style={{background:"white",borderRadius:16,padding:"18px 20px",border:`1px solid ${!msg.read?"rgba(255,92,58,0.25)":"rgba(0,0,0,0.07)"}`,cursor:"pointer",transition:"all 0.18s",display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LogoMask size={18}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa"}}>Anonymous</span><span style={{fontSize:"0.75rem",color:"#ccc"}}>{msg.time}</span></div>
                <p style={{fontSize:"0.92rem",color:msg.read?"#555":"#0e0e0e",fontWeight:msg.read?300:500,lineHeight:1.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{msg.text}</p>
                <div style={{display:"flex",gap:10,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
                  {msg.hints.length>0&&<span style={{fontSize:"0.72rem",color:"#ff5c3a",display:"flex",alignItems:"center",gap:3}}><Icons.unlock s={12} c="#ff5c3a"/>{msg.hints.length} hint{msg.hints.length>1?"s":""}</span>}
                  {msg.reactions.length>0&&<span style={{fontSize:"0.72rem",color:"#888"}}>{msg.reactions.slice(0,3).join(" ")}</span>}
                  {msg.replies.length>0&&<span style={{fontSize:"0.72rem",color:"#888",display:"flex",alignItems:"center",gap:3}}><Icons.reply s={12} c="#888"/>{msg.replies.length} repl{msg.replies.length>1?"ies":"y"}</span>}
                </div>
              </div>
              {!msg.read&&<div style={{width:8,height:8,borderRadius:"50%",background:"#ff5c3a",flexShrink:0,marginTop:6}}/>}
            </div>
          ))}
        </div>
      </div>

      {shareMsg&&<ShareModal message={shareMsg} ownerName={username} onClose={()=>setShareMsg(null)}/>}
      {receipt&&<ReceiptModal title="Hint Purchase Receipt" items={[["Item",receipt.label],["Amount",receipt.price],["Status","Paid"],["Sender's share",receipt.senderShare],["Platform fee",receipt.platformFee]]} onClose={()=>setReceipt(null)}/>}

      {activeMsg&&!shareMsg&&!receipt&&(
        <Modal onClose={()=>{setActiveMsg(null);setShowHints(false);setShowEmoji(false);}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><LogoMask size={24}/></div>
          <p style={{textAlign:"center",fontSize:"0.8rem",color:"#aaa",marginBottom:16}}>Anonymous · {activeMsg.time}</p>
          <p style={{fontSize:"1.05rem",lineHeight:1.75,textAlign:"center",color:"#0e0e0e",marginBottom:16}}>{activeMsg.text}</p>
          {activeMsg.reactions.length>0&&<div style={{textAlign:"center",marginBottom:12,fontSize:"1.2rem"}}>{activeMsg.reactions.join(" ")}</div>}

          <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20,position:"relative"}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowEmoji(p=>!p)} style={{padding:"8px 14px",borderRadius:50,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",cursor:"pointer",fontSize:"0.85rem",fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
                <Icons.react s={14} c="#555"/>React
              </button>
              {showEmoji&&<EmojiPicker onPick={addReaction} onClose={()=>setShowEmoji(false)}/>}
            </div>
            <button onClick={()=>setShareMsg(activeMsg.text)} style={{padding:"8px 14px",borderRadius:50,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",cursor:"pointer",fontSize:"0.85rem",fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
              <Icons.share s={14} c="#555"/>Share
            </button>
            <button style={{padding:"8px 14px",borderRadius:50,border:"none",background:"transparent",cursor:"pointer",fontSize:"0.85rem",color:"#ff5c3a",fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
              <Icons.flag s={14} c="#ff5c3a"/>Report
            </button>
          </div>

          {activeMsg.replies.length>0&&(
            <div style={{marginBottom:16}}>
              {activeMsg.replies.map((r,i)=>(
                <div key={i} style={{background:"#f0efec",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LogoMask size={14} variant="white"/></div>
                  <div><p style={{fontSize:"0.78rem",fontWeight:600,color:"#0e0e0e",marginBottom:3}}>{username} replied:</p><p style={{fontSize:"0.88rem",color:"#444",lineHeight:1.6}}>{r}</p></div>
                </div>
              ))}
            </div>
          )}
          <div style={{marginBottom:20}}>
            <p style={{fontSize:"0.78rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Icons.reply s={14} c="#aaa"/>Reply as {username}</p>
            <div style={{display:"flex",gap:8}}>
              <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Type your reply..." rows={2} style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid rgba(0,0,0,0.1)",background:"#fafaf8",fontSize:"0.88rem",resize:"none",lineHeight:1.5}}/>
              <button onClick={sendReply} disabled={!replyText.trim()} style={{padding:"10px 16px",borderRadius:12,border:"none",background:replyText.trim()?"#0e0e0e":"#e0e0e0",color:"white",fontWeight:600,cursor:replyText.trim()?"pointer":"not-allowed",fontSize:"0.83rem"}}>Send</button>
            </div>
            {replyStatus==="sent" && <p style={{fontSize:"0.78rem",color:"#16a34a",marginTop:8}}>Delivered to their Unmaskr inbox.</p>}
            {replyStatus==="emailed" && <p style={{fontSize:"0.78rem",color:"#16a34a",marginTop:8}}>Emailed to them — they didn't have an account to deliver it to directly.</p>}
            {replyStatus==="error" && <p style={{fontSize:"0.78rem",color:"#ef4444",marginTop:8}}>Couldn't send that reply — please try again.</p>}
          </div>

          {activeMsg.hints.length>0&&(
            <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
              {ALL_HINTS.filter(h=>activeMsg.hints.includes(h.key)).map(h=>{
                const specified = isHintSpecified(h.key, activeMsg.specified);
                return (
                  <div key={h.key} style={{padding:"12px 16px",borderRadius:12,background:"#f0efec",fontSize:"0.88rem",color:"#555",display:"flex",gap:10,alignItems:"center"}}>
                    <Icons.unlock s={14} c="#ff5c3a"/>{specified ? (activeMsg.hintTexts?.[h.key] || h.result(activeMsg.sd[h.key])) : h.unspecified}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{borderTop:"1px solid rgba(0,0,0,0.07)",paddingTop:20}}>
            {hintsDisabled ? (
              <div style={{textAlign:"center",padding:"12px 14px",background:"#fff8f0",borderRadius:12,border:"1px solid rgba(255,92,58,0.15)"}}>
                <p style={{fontSize:"0.85rem",color:"#888"}}>Hint purchases are temporarily paused. Check back soon.</p>
              </div>
            ) : !showHints?(
              <div style={{textAlign:"center"}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Icons.lock s={22} c="#0e0e0e"/></div>
                <p className="syne" style={{fontWeight:700,fontSize:"1rem",marginBottom:6}}>Curious who sent this?</p>
                <p style={{fontSize:"0.85rem",color:"#888",marginBottom:20,fontWeight:300,lineHeight:1.6}}>Unlock a hint to get a general clue about the sender.</p>
                <button onClick={()=>setShowHints(true)} style={{padding:"12px 28px",borderRadius:50,border:"1.5px solid #0e0e0e",background:"white",fontSize:"0.9rem",fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
                  <Icons.unlock s={16} c="#0e0e0e"/>Unlock a hint
                </button>
              </div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <p className="syne" style={{fontWeight:700,fontSize:"0.9rem",display:"flex",alignItems:"center",gap:6}}><Icons.unlock s={16} c="#0e0e0e"/>Choose a hint</p>
                  <button onClick={()=>setShowHints(false)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}><Icons.close s={16} c="#aaa"/></button>
                </div>
                <div style={{padding:"12px 14px",background:"#f8f8f6",borderRadius:10,marginBottom:14,fontSize:"0.78rem",color:"#888",lineHeight:1.6,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <Icons.info s={14} c="#aaa"/>Hints show general info only — never the sender's identity. If the sender didn't share that detail, it's shown for free.
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {activeHints.length===0
                    ?<div style={{padding:"16px",background:"#f0efec",borderRadius:12,textAlign:"center",fontSize:"0.88rem",color:"#888",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icons.check s={16} c="#16a34a"/>All available hints unlocked!</div>
                    :activeHints.map((h,idx)=>{
                      const unlocked = activeMsg.hints.includes(h.key);
                      const specified = isHintSpecified(h.key, activeMsg.specified);
                      const price = cur.hints[Math.min(idx,cur.hints.length-1)];
                      return (<div key={h.key}>
                        {unlocked
                          ?<div style={{padding:"14px 18px",borderRadius:12,background:"#f0efec",fontSize:"0.88rem",color:"#555",display:"flex",gap:10,alignItems:"center"}}><Icons.unlock s={14} c="#ff5c3a"/>{specified ? (activeMsg.hintTexts?.[h.key] || h.result(activeMsg.sd[h.key])) : h.unspecified}</div>
                          :<button onClick={()=>unlockHint(h,idx)} disabled={unlocking} style={{width:"100%",padding:"14px 18px",borderRadius:12,border:"1.5px solid rgba(0,0,0,0.12)",background:"white",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:unlocking?"default":"pointer",fontSize:"0.88rem",transition:"all 0.2s",opacity:unlocking?0.6:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              {specified ? <Icons.lock s={16} c="#aaa"/> : <Icons.info s={16} c="#aaa"/>}
                              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}><span style={{fontWeight:500}}>{h.label}</span><span style={{fontSize:"0.74rem",color:"#aaa"}}>{specified ? "General clue · anonymous" : "Sender didn't specify this"}</span></div>
                            </div>
                            <span style={{fontWeight:700,color:specified?"#0e0e0e":"#16a34a"}}>{unlocking?"...":specified?`${cur.symbol}${price}`:"Free"}</span>
                          </button>}
                      </div>);
                    })}
                </div>
                {unlockError && <p style={{marginTop:12,padding:"10px 14px",background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:10,fontSize:"0.8rem",color:"#ef4444"}}>{unlockError}</p>}
              </>
            )}
          </div>
          <button onClick={()=>{setActiveMsg(null);setShowHints(false);setShowEmoji(false);}} style={{width:"100%",marginTop:20,padding:"14px",borderRadius:12,border:"none",background:"#f0efec",cursor:"pointer",fontSize:"0.88rem",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Icons.close s={16} c="#555"/>Close
          </button>
        </Modal>
      )}
    </div>
  );
};
// ── SEND PAGE ──────────────────────────────────────────────────────────────────
const isDarkColor = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return (0.299*((n>>16)&255) + 0.587*((n>>8)&255) + 0.114*(n&255)) < 140;
};

const SendPage = ({ goTo, params, receiverCurrency }) => {
  const username = params?.username||"yourname";
  const [recipientProfile,setRecipientProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase.from("public_profiles").select("id, theme, bg_color").eq("username", username).single()
      .then(({ data }) => { if (!cancelled) setRecipientProfile(data); });
    return () => { cancelled = true; };
  }, [username]);

  const theme = THEMES.find(t=>t.key===(recipientProfile?.theme||"classic"))||THEMES[0];
  const bgColor = recipientProfile?.bg_color || theme.bg;
  const darkBg = isDarkColor(bgColor);
  const pageText = darkBg ? "#ffffff" : "#0e0e0e";
  const [msg,setMsg] = useState("");
  const [gender,setGender] = useState("");
  const [birthMonth,setBirthMonth] = useState("");
  const [age,setAge] = useState("");
  const [senderName,setSenderName] = useState("");
  const [senderEmail,setSenderEmail] = useState("");
  const [honeypot,setHoneypot] = useState("");
  const [sendErr,setSendErr] = useState("");
  const [sent,setSent] = useState(false);
  const [termsAccepted,setTermsAccepted] = useState(false);
  const [showTermsRead,setShowTermsRead] = useState(false);
  const MAX = 300;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const isMinor = false;
  const lbl = {fontSize:"0.8rem",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:"#aaa",display:"block",marginBottom:10};
  const opt = {fontWeight:300,textTransform:"none",letterSpacing:0};

  const handleSend = async () => {
    if (honeypot) { setSent(true); return; }
    setSendErr("");
    const filtered = filterText(msg.trim(), isMinor);
    if (recipientProfile?.id) {
      const { error } = await supabase.from("messages").insert({
        recipient_id: recipientProfile.id,
        text: filtered,
        sender_email: senderEmail || null,
        sender_gender: gender || null,
        sender_birth_period: birthMonth || null,
        sender_age: age ? Number(age) : null,
        sender_name: senderName.trim() || null,
        sender_device_token: getGuestToken(),
      });
      if (error) {
        setSendErr(error.message?.includes("rate_limited") ? "You're sending messages a little too fast — please wait a bit and try again." : "Something went wrong sending your message. Please try again.");
        return;
      }
    }
    setSent(true);
  };

  if(showTermsRead) return <Terms goTo={goTo} fromSend onAccept={v=>{setTermsAccepted(v);setShowTermsRead(false);}}/>;
  if(sent) return (
    <div style={{minHeight:"100vh",background:bgColor,color:pageText,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div className="popIn" style={{maxWidth:380}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Icons.check s={32} c="white"/></div>
        <h2 className="syne" style={{fontSize:"2rem",fontWeight:800,marginBottom:12}}>Message sent!</h2>
        <p style={{color:"#888",fontSize:"0.95rem",lineHeight:1.7,marginBottom:32,fontWeight:300}}>Your anonymous message has been delivered. They'll never know it was you.</p>
        {senderEmail&&<p style={{fontSize:"0.83rem",color:"#888",marginBottom:16,padding:"12px 14px",background:"rgba(128,128,128,0.15)",borderRadius:10}}>We'll email <strong>{senderEmail}</strong> if {username} replies.</p>}
        <Btn onClick={()=>goTo("signup")} style={{width:"100%",padding:"15px",background:theme.accent}}>Create your own Unmaskr link</Btn>
        <p style={{marginTop:16,fontSize:"0.85rem",color:"#aaa",cursor:"pointer"}} onClick={()=>setSent(false)}>Send another</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:bgColor,color:pageText}}>
      <div style={{padding:"18px 28px",borderBottom:"1px solid rgba(128,128,128,0.2)",display:"flex",alignItems:"center"}}>
        <LogoFull height={24} variant={darkBg?"white":"black"}/>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"48px 24px"}}>
        <div className="fadeUp" style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><LogoMask size={36} variant="white"/></div>
          <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:6}}>@{username}</h2>
          <p style={{color:"#888",fontSize:"0.9rem",fontWeight:300}}>Send an anonymous message. They won't know it's you.</p>
        </div>
        <div className="fadeUp1" style={{background:theme.card,color:"#0e0e0e",borderRadius:20,padding:"28px 24px",border:"1px solid rgba(0,0,0,0.08)"}}>
          <label style={lbl}>Your message</label>
          <textarea placeholder={`Say something honest to @${username}...`} value={msg} onChange={e=>e.target.value.length<=MAX&&setMsg(e.target.value)} rows={4} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.1)",background:"#fafaf8",fontSize:"0.95rem",resize:"none",lineHeight:1.6}}/>
          <div style={{textAlign:"right",fontSize:"0.75rem",color:msg.length>MAX*0.85?"#ff5c3a":"#ccc",marginTop:4}}>{msg.length}/{MAX}</div>

          <div style={{marginTop:16}}>
            <label style={lbl}>Your gender <span style={opt}>(optional)</span></label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Male","Female","Non-binary","Prefer not to say"].map(g=>(
                <button key={g} onClick={()=>setGender(gender===g?"":g)} style={{padding:"8px 14px",borderRadius:50,fontSize:"0.8rem",border:`1.5px solid ${gender===g?theme.accent:"rgba(0,0,0,0.1)"}`,background:gender===g?theme.accent:"white",color:gender===g?"white":"#555",cursor:"pointer",transition:"all 0.2s"}}>{g}</button>
              ))}
            </div>
          </div>

          <div style={{marginTop:16}}>
            <label style={lbl}>Birth month <span style={opt}>(optional)</span></label>
            <select value={birthMonth} onChange={e=>setBirthMonth(e.target.value)} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",fontSize:"0.9rem",cursor:"pointer"}}>
              <option value="">Select birth month</option>{months.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{marginTop:16}}>
            <label style={lbl}>Your age <span style={opt}>(optional)</span></label>
            <input type="number" inputMode="numeric" min="1" max="120" placeholder="e.g. 24" value={age} onChange={e=>setAge(e.target.value.slice(0,3))} style={{width:"100%",padding:"14px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",fontSize:"0.95rem"}}/>
          </div>

          <div style={{marginTop:16}}>
            <label style={lbl}>Your name <span style={opt}>(optional)</span></label>
            <Inp placeholder="e.g. Chidera" value={senderName} onChange={e=>setSenderName(e.target.value)}/>
            <p style={{fontSize:"0.73rem",color:"#aaa",marginTop:5}}>Never shown directly — only ever used for a vague clue like "starts with C".</p>
          </div>

          <div style={{marginTop:16}}>
            <label style={lbl}><span style={{display:"flex",alignItems:"center",gap:6}}><Icons.mail s={14} c="#aaa"/>Your email <span style={opt}>(optional — get notified if they reply)</span></span></label>
            <Inp placeholder="your@email.com" type="email" value={senderEmail} onChange={e=>setSenderEmail(e.target.value)}/>
            <p style={{fontSize:"0.73rem",color:"#aaa",marginTop:5,display:"flex",alignItems:"center",gap:4}}><Icons.info s={12} c="#aaa"/>Unmaskr will email you if {username} replies. Your email stays private.</p>
          </div>

          <div style={{marginTop:20,padding:"14px 16px",background:"#f8f8f6",borderRadius:12,display:"flex",alignItems:"flex-start",gap:12}}>
            <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{marginTop:2,cursor:"pointer",width:16,height:16,flexShrink:0}}/>
            <p style={{fontSize:"0.83rem",color:"#666",lineHeight:1.6}}>I accept the <span style={{color:theme.accent,textDecoration:"underline",cursor:"pointer",fontWeight:500}} onClick={()=>setShowTermsRead(true)}>Terms & Conditions</span>. My message is anonymous.</p>
          </div>

          <input type="text" name="website" value={honeypot} onChange={e=>setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden="true" style={{position:"absolute",left:"-9999px",width:1,height:1,opacity:0}}/>

          <Btn onClick={handleSend} style={{width:"100%",marginTop:16,padding:"15px",background:theme.accent}} disabled={!msg.trim()||!termsAccepted}>
            <Icons.share s={16} c="white"/>Send anonymously
          </Btn>
          {sendErr && <p style={{textAlign:"center",marginTop:10,fontSize:"0.82rem",color:"#ef4444"}}>{sendErr}</p>}
          <p style={{textAlign:"center",marginTop:12,fontSize:"0.78rem",color:"#ccc",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Icons.lock s={12} c="#ccc"/>100% anonymous · Your identity is never revealed</p>
        </div>
        <div className="fadeUp2" style={{marginTop:28,textAlign:"center"}}>
          <p style={{fontSize:"0.85rem",color:"#888",marginBottom:14}}>Want your own anonymous message link?</p>
          <Btn outline onClick={()=>goTo("signup")} style={{fontSize:"0.85rem",padding:"10px 22px",color:pageText,borderColor:darkBg?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.2)"}}>Create yours free</Btn>
        </div>
      </div>
    </div>
  );
};

// ── STATS ──────────────────────────────────────────────────────────────────────
const Stats = ({ goTo, userId }) => {
  const [loading,setLoading] = useState(true);
  const [totalMessages,setTotalMessages] = useState(0);
  const [hintsUnlocked,setHintsUnlocked] = useState(0);
  const [walletEarned,setWalletEarned] = useState(0);
  const [weekData,setWeekData] = useState([{d:"Mon",m:0},{d:"Tue",m:0},{d:"Wed",m:0},{d:"Thu",m:0},{d:"Fri",m:0},{d:"Sat",m:0},{d:"Sun",m:0}]);
  const [topMessage,setTopMessage] = useState(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetchStats = async () => {
      setLoading(true);
      const { data: msgs } = await supabase.from("messages").select("id, text, hints_unlocked, reactions, created_at").eq("recipient_id", userId);
      const { data: earnings } = await supabase.from("transactions").select("amount").eq("user_id", userId).eq("type","hint_earning").eq("status","completed");

      const all = msgs || [];
      setTotalMessages(all.length);
      setHintsUnlocked(all.reduce((s,m)=>s+(m.hints_unlocked?.length||0),0));
      setWalletEarned((earnings||[]).reduce((s,t)=>s+Number(t.amount),0));

      const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      const buckets = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
      setWeekData(buckets.map((d,i)=>({ d: days[i], m: all.filter(m=>new Date(m.created_at).toDateString()===d.toDateString()).length })));

      const mostLoved = [...all].sort((a,b)=>(b.reactions?.length||0)+(b.hints_unlocked?.length||0)-((a.reactions?.length||0)+(a.hints_unlocked?.length||0)))[0];
      setTopMessage(mostLoved || null);
      setLoading(false);
    };
    fetchStats();
  }, [userId]);

  const maxM = Math.max(1, ...weekData.map(x=>x.m));
  const stats = [
    {l:"Total Messages",v:String(totalMessages),s:"All time",icon:<Icons.chat s={22} c="#0e0e0e"/>,c:"#f0efec"},
    {l:"Hints Unlocked",v:String(hintsUnlocked),s:"On your messages",icon:<Icons.unlock s={22} c="#f97316"/>,c:"#fff8f0"},
    {l:"Wallet Earned",v:`₦${walletEarned.toLocaleString()}`,s:"From hint purchases",icon:<Icons.money s={22} c="#16a34a"/>,c:"#f0fff4"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <AppNav goTo={goTo} active="stats" userId={userId}/>
      <div style={{maxWidth:700,margin:"0 auto",padding:"32px 20px"}}>
        <div className="fadeUp"><Tag text="Your activity"/><h2 className="syne" style={{fontSize:"1.8rem",fontWeight:800,marginBottom:28}}>Stats & Insights</h2></div>
        {loading && <p style={{textAlign:"center",color:"#aaa",padding:"20px 0"}}>Loading...</p>}
        <div className="fadeUp1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:28}}>
          {stats.map(s=>(
            <div key={s.l} style={{background:s.c,borderRadius:16,padding:"20px 18px",border:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{marginBottom:10}}>{s.icon}</div>
              <div className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:4}}>{s.v}</div>
              <div style={{fontSize:"0.8rem",fontWeight:600,marginBottom:2}}>{s.l}</div>
              <div style={{fontSize:"0.72rem",color:"#888"}}>{s.s}</div>
            </div>
          ))}
        </div>
        <div className="fadeUp2" style={{background:"white",borderRadius:20,padding:"24px",border:"1px solid rgba(0,0,0,0.07)",marginBottom:20}}>
          <p className="syne" style={{fontWeight:700,fontSize:"0.9rem",marginBottom:20,display:"flex",alignItems:"center",gap:6}}><Icons.stats s={16} c="#0e0e0e"/>Messages this week</p>
          <div style={{display:"flex",alignItems:"flex-end",gap:10,height:120}}>
            {weekData.map(d=>(
              <div key={d.d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{width:"100%",background:d.m===maxM&&d.m>0?"#0e0e0e":"#f0efec",borderRadius:6,height:`${(d.m/maxM)*100}px`,transition:"height 0.4s ease",minHeight:8}}/>
                <span style={{fontSize:"0.72rem",color:"#aaa"}}>{d.d}</span>
              </div>
            ))}
          </div>
        </div>
        {topMessage && (
          <div className="fadeUp3" style={{background:"#0e0e0e",borderRadius:20,padding:"24px",color:"white"}}>
            <p style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Icons.star s={12} c="rgba(255,255,255,0.4)"/>Most loved message</p>
            <p style={{fontSize:"1.05rem",lineHeight:1.7,color:"rgba(255,255,255,0.85)"}}>"{topMessage.text}"</p>
            <p style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.3)",marginTop:10}}>{timeAgoLite(topMessage.created_at)} · {topMessage.hints_unlocked?.length||0} hints unlocked</p>
          </div>
        )}
      </div>
    </div>
  );
};
const timeAgoLite = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if (mins<1) return "Just now";
  if (mins<60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if (hrs<24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
};
// ── WALLET ─────────────────────────────────────────────────────────────────────
const Wallet = ({ goTo, currency, userId, userName, withdrawalsDisabled=false }) => {
  const cur = currency || CURRENCIES.NG;
  const [tab,setTab] = useState("overview");
  const [amount,setAmount] = useState("");
  const [wMethod,setWMethod] = useState("");
  const [tMethod,setTMethod] = useState("");
  const [phone,setPhone] = useState("");
  const [acct,setAcct] = useState("");
  const [bankName,setBankName] = useState("");
  const [acctName,setAcctName] = useState("");
  const [transferRef,setTransferRef] = useState("");
  const [done,setDone] = useState(false);
  const [receipt,setReceipt] = useState(null);
  const [filter,setFilter] = useState("all");
  const [submitting,setSubmitting] = useState(false);
  const [withdrawError,setWithdrawError] = useState("");
  const [topupError,setTopupError] = useState("");
  const [balance,setBalance] = useState(0);
  const [txns,setTxns] = useState([]);
  const [loading,setLoading] = useState(true);

  const fetchWallet = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
    setBalance(wallet ? Number(wallet.balance) : 0);
    const { data: tx } = await supabase.from("transactions").select("id, type, amount, status, created_at").eq("user_id", userId).order("created_at",{ascending:false});
    setTxns((tx||[]).map(t => ({
      type: (t.type==="hint_purchase"||t.type==="withdrawal") ? "debit" : "credit",
      label: t.type==="hint_purchase"?"Hint unlocked":t.type==="hint_earning"?"Hint purchased on your message":t.type==="withdrawal"?"Withdrawal":t.type==="deposit"?"Wallet top-up":t.type,
      amount: Number(t.amount),
      time: timeAgoLite(t.created_at),
      cat: t.type==="withdrawal"?"withdrawal":(t.type==="hint_purchase"||t.type==="hint_earning")?"hint":"other",
      status: t.status,
    })));
    setLoading(false);
  };
  useEffect(() => { fetchWallet(); }, [userId]);

  // Bank list for withdrawals (Bachs needs a bank code, so users pick from a list)
  const [banks,setBanks] = useState([]);
  const [bankCode,setBankCode] = useState("");
  const [banksErr,setBanksErr] = useState("");
  useEffect(() => {
    if (tab!=="withdraw" || wMethod!=="bank" || banks.length>0 || !userId) return;
    let cancelled = false;
    supabase.functions.invoke("super-service").then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.banks) { console.error("bank-list failed:", error, data); setBanksErr("Couldn't load banks — please try again."); return; }
      setBanksErr(""); setBanks(data.banks);
    });
    return () => { cancelled = true; };
  }, [tab,wMethod,userId]);

  const filtered = filter==="all"?txns:txns.filter(t=>t.cat===filter);
  const makeRef = () => "UNM-"+(Math.random()*9999|0).toString().padStart(4,"0");

  const finishWithdraw = async () => {
    if (!userId || submitting) return;
    setSubmitting(true);
    setWithdrawError("");
    // Debits the wallet and records the pending request as one step in the
    // database — the balance is held the moment you ask, not later when an
    // admin gets to it, so you can never request more than you actually have,
    // even across two requests submitted close together.
    const { data: txnId, error } = await supabase.rpc("request_withdrawal", {
      p_amount: Number(amount),
      p_currency: cur.code,
      p_bank_name: wMethod==="bank" ? bankName : "Airtime",
      p_account_number: wMethod==="bank" ? acct : phone,
      p_account_name: acctName,
    });
    setSubmitting(false);
    if (error) {
      setWithdrawError(error.message?.includes("insufficient_funds") ? "Your wallet balance is lower than this amount." : "Couldn't submit your withdrawal — please try again.");
      return;
    }
    if (wMethod==="bank" && bankCode && txnId) {
      const { error: attachErr } = await supabase.rpc("attach_withdrawal_bank", { p_txn_id: String(txnId), p_bank_code: bankCode });
      if (attachErr) console.error("attach_withdrawal_bank failed:", attachErr);
    }
    setDone(true);
    setReceipt({
      title:"Withdrawal Receipt",
      items:[
        ["Amount",`${cur.symbol}${amount}`],
        ["Method",wMethod==="airtime"?"Airtime":"Bank Transfer"],
        ["Status","Pending admin approval"],
        ["Reference",txnId],
        ["Note","Your admin reviews and approves withdrawals — you'll be emailed once it's paid."],
      ]
    });
  };

  // Top-ups now go through Bachs: the server creates a bank-transfer checkout
  // (a fresh account number for this top-up only) and the wallet is credited
  // automatically by the webhook once the money arrives.
  const finishTopup = async () => {
    if (!userId || submitting) return;
    const amt = Number(amount);
    if (!amt || amt < 100) { setTopupError("Minimum top-up is "+cur.symbol+"100."); return; }
    setSubmitting(true);
    setTopupError("");
    const { data, error } = await supabase.functions.invoke("bright-service", { body: { amount: amt } });
    setSubmitting(false);
    if (error || !data?.checkout_url) {
      let msg = "Couldn't start your top-up — please try again.";
      try { const b = await error?.context?.json?.(); if (b?.error) msg = b.error; } catch (e) {}
      if (data?.error) msg = data.error;
      console.error("top-up start failed:", error, data);
      setTopupError(msg);
      return;
    }
    // Opens Bachs's page, which shows a fresh account number for this top-up only.
    window.location.href = data.checkout_url;
  };

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <AppNav goTo={goTo} active="wallet" userId={userId}/>
      {receipt&&<ReceiptModal title={receipt.title} items={receipt.items} onClose={()=>{setReceipt(null);fetchWallet();}}/>}
      <div style={{maxWidth:680,margin:"0 auto",padding:"32px 20px"}}>
        <div className="fadeUp" style={{background:"#0e0e0e",borderRadius:24,padding:"32px 28px",marginBottom:24,color:"white"}}>
          <p style={{fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <Icons.wallet s={14} c="rgba(255,255,255,0.4)"/>Available balance
          </p>
          <div className="syne" style={{fontSize:"2.8rem",fontWeight:800,marginBottom:4}}>{loading?"...":`${cur.symbol}${balance.toLocaleString()}`}</div>
          <p style={{fontSize:"0.83rem",color:"rgba(255,255,255,0.4)"}}>50% of all hint purchases on your messages go here. Balance never expires — even unclaimed funds remain yours to withdraw years from now.</p>
          <div style={{display:"flex",gap:10,marginTop:24}}>
            <button onClick={()=>{setTab("withdraw");setDone(false);}} style={{flex:1,padding:"12px",borderRadius:50,border:"none",background:"#ff5c3a",color:"white",fontWeight:600,cursor:"pointer",fontSize:"0.88rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Icons.withdraw s={16} c="white"/>Withdraw
            </button>
            <button onClick={()=>{setTab("topup");setDone(false);}} style={{flex:1,padding:"12px",borderRadius:50,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"white",fontWeight:500,cursor:"pointer",fontSize:"0.88rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Icons.deposit s={16} c="white"/>Top up
            </button>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {["overview","withdraw","topup"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setDone(false);}} style={{padding:"8px 16px",borderRadius:50,border:`1px solid ${tab===t?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:tab===t?"#0e0e0e":"transparent",color:tab===t?"white":"#555",cursor:"pointer",fontSize:"0.83rem",fontWeight:500}}>
              {t==="topup"?"Top up":t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {tab==="overview"&&(
          <div className="fadeUp">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <p className="syne" style={{fontWeight:700,display:"flex",alignItems:"center",gap:6}}><Icons.receipt s={16} c="#0e0e0e"/>Transaction history</p>
              <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"6px 12px",borderRadius:50,border:"1px solid rgba(0,0,0,0.1)",background:"white",fontSize:"0.8rem",cursor:"pointer"}}>
                <option value="all">All</option>
                <option value="hint">Hints</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="other">Top-ups</option>
              </select>
            </div>
            {loading && <p style={{textAlign:"center",color:"#aaa",padding:"20px 0"}}>Loading...</p>}
            {!loading && filtered.length===0 && <p style={{textAlign:"center",color:"#aaa",padding:"20px 0"}}>No transactions yet.</p>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map((t,i)=>(
                <div key={i} style={{background:"white",borderRadius:14,padding:"16px 18px",border:"1px solid rgba(0,0,0,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:t.type==="credit"?"#f0fff4":"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {t.type==="credit"?<Icons.deposit s={16} c="#16a34a"/>:<Icons.withdraw s={16} c="#ef4444"/>}
                    </div>
                    <div>
                      <p style={{fontSize:"0.88rem",fontWeight:500,marginBottom:2}}>{t.label} {t.status==="pending"&&<span style={{color:"#f59e0b",fontSize:"0.75rem"}}>(pending)</span>}</p>
                      <p style={{fontSize:"0.75rem",color:"#aaa"}}>{t.time}</p>
                    </div>
                  </div>
                  <span style={{fontWeight:700,fontSize:"0.92rem",color:t.type==="credit"?"#166534":"#991b1b"}}>
                    {t.type==="credit"?"+":"-"}{cur.symbol}{Math.abs(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="withdraw"&&(
          <div className="fadeUp">
            {withdrawalsDisabled ? (
              <div style={{textAlign:"center",padding:"40px 24px",background:"#fff8f0",borderRadius:16,border:"1px solid rgba(255,92,58,0.15)"}}>
                <Icons.warning s={28} c="#f97316"/>
                <p style={{fontWeight:600,marginTop:12,marginBottom:6}}>Withdrawals paused</p>
                <p style={{fontSize:"0.85rem",color:"#888"}}>Withdrawals are temporarily unavailable. Check back soon.</p>
              </div>
            ) : done?(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"#f0fff4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                  <Icons.check s={28} c="#16a34a"/>
                </div>
                <h3 className="syne" style={{fontSize:"1.4rem",fontWeight:800,marginBottom:8}}>Withdrawal requested!</h3>
                <p style={{color:"#888",fontWeight:300,marginBottom:8}}>Your request has been sent for approval.</p>
                <p style={{fontSize:"0.83rem",color:"#aaa",marginBottom:20}}>You'll receive an email once it's paid.</p>
                <Btn onClick={()=>setReceipt(receipt)}><Icons.receipt s={16} c="white"/>View Receipt</Btn>
              </div>
            ):<>
              <h3 className="syne" style={{fontSize:"1.2rem",fontWeight:800,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                <Icons.withdraw s={20} c="#0e0e0e"/>Withdraw funds
              </h3>
              <p style={{fontSize:"0.85rem",color:"#888",marginBottom:20,fontWeight:300}}>Minimum: {cur.symbol}100 · Reviewed and approved by an admin before payout.</p>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                {[{k:"bank",l:"Bank Transfer",d:"To your bank account",i:<Icons.bank s={16}/>},{k:"airtime",l:"Airtime",d:"To your phone",i:<Icons.phone s={16}/>}].map(m=>(
                  <button key={m.k} onClick={()=>setWMethod(m.k)} style={{padding:"14px 18px",borderRadius:14,border:`1.5px solid ${wMethod===m.k?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:wMethod===m.k?"#0e0e0e":"white",color:wMethod===m.k?"white":"#0e0e0e",cursor:"pointer",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{opacity:wMethod===m.k?1:0.5}}>{m.i}</span>
                    <div>
                      <p style={{fontWeight:600,fontSize:"0.92rem",marginBottom:2}}>{m.l}</p>
                      <p style={{fontSize:"0.78rem",color:wMethod===m.k?"rgba(255,255,255,0.55)":"#aaa"}}>{m.d}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Amount</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",color:"#aaa"}}>{cur.symbol}</span>
                  <Inp placeholder="100" value={amount} onChange={e=>setAmount(e.target.value)} style={{paddingLeft:36}}/>
                </div>
                <p style={{fontSize:"0.78rem",color:"#aaa",marginTop:6}}>Min: {cur.symbol}100 · Available: {cur.symbol}{balance.toLocaleString()}</p>
              </div>
              {wMethod==="bank"&&(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <Inp placeholder="Account number" value={acct} onChange={e=>setAcct(e.target.value)}/>
                  <select value={bankCode} onChange={e=>{const b=banks.find(x=>x.code===e.target.value); setBankCode(e.target.value); setBankName(b?b.name:"");}} style={{width:"100%",padding:"14px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",fontSize:"0.95rem",cursor:"pointer"}}>
                    <option value="">{banks.length?"Select your bank":(banksErr||"Loading banks...")}</option>
                    {banks.map(b=><option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                  <Inp placeholder="Account holder name" value={acctName} onChange={e=>setAcctName(e.target.value)}/>
                </div>
              )}
              {wMethod==="airtime"&&(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <select style={{width:"100%",padding:"14px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",fontSize:"0.95rem",cursor:"pointer"}}>
                    {COUNTRIES.map(c=><option key={c.code}>{c.flag} {c.name} ({c.phone})</option>)}
                  </select>
                  <Inp placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)}/>
                  <div style={{padding:"12px 14px",background:"#f0efec",borderRadius:10,fontSize:"0.78rem",color:"#666",lineHeight:1.6,display:"flex",gap:8}}>
                    <Icons.info s={14} c="#888"/>Airtime withdrawals powered by our airtime partner. A small conversion fee may apply.
                  </div>
                </div>
              )}
              <Btn onClick={finishWithdraw} style={{width:"100%",marginTop:20,padding:"15px"}} disabled={!amount||Number(amount)<100||Number(amount)>balance||!wMethod||(wMethod==="bank"&&(!/^\d{10}$/.test(acct)||!bankName||!bankCode))||(wMethod==="airtime"&&!phone)||submitting}>
                <Icons.withdraw s={16} c="white"/>{submitting?"Submitting...":(wMethod==="airtime"?"Withdraw as airtime":"Request withdrawal")}
              </Btn>
              {withdrawError && <p style={{marginTop:12,padding:"10px 14px",background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:10,fontSize:"0.8rem",color:"#ef4444"}}>{withdrawError}</p>}
            </>}
          </div>
        )}

        {tab==="topup"&&(
          <div className="fadeUp">
            <h3 className="syne" style={{fontSize:"1.2rem",fontWeight:800,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
              <Icons.deposit s={20} c="#0e0e0e"/>Top up your wallet
            </h3>
            <p style={{fontSize:"0.85rem",color:"#888",marginBottom:20,fontWeight:300}}>Pay by bank transfer. You'll get a fresh account number for this top-up — it's valid for 30 minutes and your wallet is credited automatically.</p>

            <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Amount</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",color:"#aaa"}}>{cur.symbol}</span>
              <Inp placeholder="1000" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))} style={{paddingLeft:36}}/>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
              {[500,1000,2000,5000].map(n=>(
                <button key={n} onClick={()=>setAmount(String(n))} style={{padding:"8px 14px",borderRadius:50,border:"1.5px solid rgba(0,0,0,0.1)",background:Number(amount)===n?"#0e0e0e":"white",color:Number(amount)===n?"white":"#555",cursor:"pointer",fontSize:"0.8rem"}}>{cur.symbol}{n.toLocaleString()}</button>
              ))}
            </div>
            <p style={{fontSize:"0.78rem",color:"#aaa",marginTop:8}}>Minimum {cur.symbol}100.</p>

            <Btn onClick={finishTopup} style={{width:"100%",marginTop:20,padding:"15px"}} disabled={!amount||Number(amount)<100||submitting}>
              <Icons.bank s={16} c="white"/>{submitting?"Preparing...":"Get account number"}
            </Btn>
            {topupError && <p style={{marginTop:12,padding:"10px 14px",background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:10,fontSize:"0.8rem",color:"#ef4444"}}>{topupError}</p>}

            <div style={{marginTop:16,padding:"12px 14px",background:"#f0efec",borderRadius:10,fontSize:"0.78rem",color:"#666",lineHeight:1.6,display:"flex",gap:8}}>
              <Icons.info s={14} c="#888"/>Send the exact amount shown. After paying, come back here — your balance updates within a minute. Not credited? Contact support with the amount and time.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// ── GAMES ──────────────────────────────────────────────────────────────────────
// NOTE: Mystery Lobby below is still fully simulated — no real multiplayer
// backend exists yet (no games/sessions table). Left as-is per the agreed
// plan; revisit once that backend design is scoped out. (Quiz Clash below it
// DOES use real Supabase tables/realtime — only Mystery Lobby is the mock.)
const Games = ({ goTo, mysteryFrozen=false, quizFrozen=false, userId }) => (
  <div style={{minHeight:"100vh",background:"#fafaf8"}}>
    <AppNav goTo={goTo} active="games" userId={userId}/>
    <div style={{maxWidth:700,margin:"0 auto",padding:"40px 24px"}}>
      <div className="fadeUp">
        <Tag text="Games"/>
        <h2 className="syne" style={{fontSize:"2rem",fontWeight:800,letterSpacing:"-0.02em",marginBottom:8}}>Play with friends</h2>
        <p style={{color:"#666",fontSize:"0.9rem",marginBottom:36,fontWeight:300}}>Fun games for picnics, hangouts and sleepovers.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div className="game-card fadeUp1" onClick={()=>!mysteryFrozen&&goTo("game-lobby")} style={{background:"white",borderRadius:20,padding:"28px 24px",border:"1px solid rgba(0,0,0,0.08)",cursor:mysteryFrozen?"not-allowed":"pointer",opacity:mysteryFrozen?0.5:1,transition:"all 0.2s",display:"flex",gap:20,alignItems:"center"}}>
          <div style={{width:64,height:64,borderRadius:18,background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LogoMask size={32}/></div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <h3 className="syne" style={{fontSize:"1.1rem",fontWeight:800}}>Mystery Lobby</h3>
              <span style={{background:mysteryFrozen?"#888":"#0e0e0e",color:"white",fontSize:"0.68rem",fontWeight:700,padding:"3px 10px",borderRadius:50}}>{mysteryFrozen?"Paused":"For everyone"}</span>
            </div>
            <p style={{fontSize:"0.88rem",color:"#666",lineHeight:1.6,fontWeight:300}}>{mysteryFrozen?"Temporarily unavailable — check back soon.":"Host shares a link. Players pick preferences. Guess what others picked or get eliminated!"}</p>
          </div>
          <Icons.chevron s={20} c="#ccc"/>
        </div>
        <div className="game-card fadeUp2" onClick={()=>!quizFrozen&&goTo("game-quiz")} style={{background:"#0e0e0e",borderRadius:20,padding:"28px 24px",cursor:quizFrozen?"not-allowed":"pointer",opacity:quizFrozen?0.5:1,transition:"all 0.2s",display:"flex",gap:20,alignItems:"center"}}>
          <div style={{width:64,height:64,borderRadius:18,background:"rgba(255,205,60,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icons.trophy s={32} c="#ffcd3c"/></div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <h3 className="syne" style={{fontSize:"1.1rem",fontWeight:800,color:"white"}}>Quiz Clash</h3>
              <span style={{background:quizFrozen?"#888":"#0e0e0e",color:"white",fontSize:"0.68rem",fontWeight:700,padding:"3px 10px",borderRadius:50}}>{quizFrozen?"Paused":"For everyone"}</span>
            </div>
            <p style={{fontSize:"0.88rem",color:"rgba(255,255,255,0.55)",lineHeight:1.6,fontWeight:300}}>{quizFrozen?"Temporarily unavailable — check back soon.":"Pick topics, difficulty and question count. Highest score wins — bragging rights only."}</p>
          </div>
          <Icons.chevron s={20} c="rgba(255,255,255,0.3)"/>
        </div>
      </div>
    </div>
  </div>
);

// ── MYSTERY LOBBY (real-time, host-authored multiple-choice quiz) ─────────────
// Host writes their own questions (4 options each, one marked correct, no
// duplicate option text). Fixes the old fixed-category system where players
// saw the same 4 questions every game. Options are shuffled once per session
// at start time so the "correct" slot isn't always in the same place.
const AVATAR_COLORS = ["#0e0e0e","#ff5c3a","#6366f1","#059669","#d97706","#ec4899"];

const shuffleArr = (arr) => [...arr].sort(()=>Math.random()-0.5);

const makeLobbyCode = () => "UNMSK-" + Math.floor(1000 + Math.random()*9000);

const getGuestToken = () => {
  try {
    let token = localStorage.getItem("unmaskr_guest_token");
    if (!token) { token = "guest-" + Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem("unmaskr_guest_token", token); }
    return token;
  } catch (e) {
    // Some mobile/in-app browsers (private mode, embedded WhatsApp/Instagram
    // browsers, etc.) block storage entirely and throw here. Fall back to a
    // token that just lives for this page load instead of crashing the app.
    return "guest-" + Math.random().toString(36).slice(2) + Date.now();
  }
};

const EMPTY_QUESTION_DRAFT = { q:"", options:["","","",""], correctIndex:0 };

// Shuffle each question's options once, keeping correctIndex pointing at the
// right (now-moved) option — locked in for the whole game session.
const shuffleQuestionOptions = (questions) => questions.map(item => {
  const correctText = item.options[item.correctIndex];
  const shuffled = shuffleArr(item.options);
  return { q: item.q, options: shuffled, correctIndex: shuffled.indexOf(correctText) };
});
const GameLobby = ({ goTo, frozen=false, joinCode, userId, userName }) => {
  if (frozen) return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{maxWidth:380}}>
        <LogoMask size={48}/>
        <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginTop:20,marginBottom:12}}>Mystery Lobby paused</h2>
        <p style={{color:"#888",fontSize:"0.9rem",lineHeight:1.7,marginBottom:24,fontWeight:300}}>This game is temporarily unavailable. Check back soon.</p>
        <Btn onClick={()=>goTo("games")} style={{width:"100%"}}>Back to games</Btn>
      </div>
    </div>
  );

  const guestTokenRef = useRef(userId ? null : getGuestToken());
  const [phase,setPhase] = useState(joinCode ? "join" : "setup");
  const [guestName,setGuestName] = useState(userName || "");
  const [session,setSession] = useState(null);
  const [myPlayer,setMyPlayer] = useState(null);
  const [players,setPlayers] = useState([]);
  const [lobbyCopied,setLobbyCopied] = useState(false);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  // ── Question builder state (host, setup phase) ──────────────────────────
  const [questions,setQuestions] = useState([]);
  const [showQForm,setShowQForm] = useState(false);
  const [editingIdx,setEditingIdx] = useState(null);
  const [qDraft,setQDraft] = useState(EMPTY_QUESTION_DRAFT);
  const [qError,setQError] = useState("");

  // ── Playing state ────────────────────────────────────────────────────────
  const [myQuestions,setMyQuestions] = useState([]);
  const [qIndex,setQIndex] = useState(0);
  const [myScore,setMyScore] = useState(0);
  const [answered,setAnswered] = useState(null);
  const [showAnswer,setShowAnswer] = useState(false);

  const fetchPlayers = async (sessionId) => {
    const { data } = await supabase.from("game_players").select("*").eq("session_id", sessionId).order("joined_at");
    if (data) setPlayers(data);
  };

  useEffect(() => {
    if (joinCode) loadSessionByCode(joinCode);
  }, [joinCode]);

  const loadSessionByCode = async (code) => {
    setLoading(true);
    const { data, error: e } = await supabase.from("game_sessions").select("*").eq("lobby_code", code).eq("game_type","mystery_lobby").single();
    setLoading(false);
    if (e || !data) { setError("This lobby doesn't exist or has ended."); return; }
    setSession(data);
    fetchPlayers(data.id);
    if (data.status === "playing") { setMyQuestions(data.custom_questions || []); setPhase("playing"); }
    else if (data.status === "finished") setPhase("result");
  };

  // Realtime: keep players list and session state in sync across every device in the lobby
  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase.channel(`mystery-${session.id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'game_players', filter:`session_id=eq.${session.id}` }, () => fetchPlayers(session.id))
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'game_sessions', filter:`id=eq.${session.id}` }, (payload) => {
        setSession(payload.new);
        if (payload.new.status === "playing" && phase !== "playing") {
          setMyQuestions(payload.new.custom_questions || []);
          setPhase("playing");
        }
        if (payload.new.status === "finished") setPhase("result");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // ── Question builder logic ───────────────────────────────────────────────
  const openAddQuestion = () => { setQDraft({ q:"", options:["","","",""], correctIndex:0 }); setEditingIdx(null); setQError(""); setShowQForm(true); };
  const openEditQuestion = (idx) => { setQDraft({ ...questions[idx], options:[...questions[idx].options] }); setEditingIdx(idx); setQError(""); setShowQForm(true); };
  const closeQForm = () => { setShowQForm(false); setQError(""); };
  const removeQuestion = (idx) => setQuestions(qs => qs.filter((_,i)=>i!==idx));

  const saveQuestion = () => {
    const q = qDraft.q.trim();
    const opts = qDraft.options.map(o=>o.trim());
    if (!q) { setQError("Enter the question."); return; }
    if (opts.some(o=>!o)) { setQError("Fill in all 4 options."); return; }
    const lower = opts.map(o=>o.toLowerCase());
    if (new Set(lower).size !== 4) { setQError("Options can't repeat — each one needs to be different."); return; }
    const clean = { q, options: opts, correctIndex: qDraft.correctIndex };
    if (editingIdx !== null) setQuestions(qs => qs.map((item,i)=> i===editingIdx ? clean : item));
    else setQuestions(qs => [...qs, clean]);
    setShowQForm(false); setQError("");
  };

  // ── Lobby actions ────────────────────────────────────────────────────────
  const createLobby = async () => {
    const name = userName || guestName.trim();
    if (!name) { setError("Enter your name"); return; }
    if (questions.length < 3) { setError("Add at least 3 questions before creating the lobby."); return; }
    setError(""); setLoading(true);
    const code = makeLobbyCode();
    const { data: newSession, error: sErr } = await supabase.from("game_sessions").insert({
      lobby_code: code, game_type:"mystery_lobby", host_user_id: userId||null, host_name: name,
      custom_questions: questions,
    }).select().single();
    if (sErr) { setError(sErr.message); setLoading(false); return; }
    const { data: hostPlayer } = await supabase.from("game_players").insert({
      session_id: newSession.id, user_id: userId||null, guest_token: guestTokenRef.current, display_name: name, is_host:true,
    }).select().single();
    setSession(newSession); setMyPlayer(hostPlayer);
    fetchPlayers(newSession.id);
    setLoading(false); setPhase("lobby");
  };

  const joinLobby = async () => {
    const name = userName || guestName.trim();
    if (!name) { setError("Enter your name"); return; }
    setError(""); setLoading(true);
    const { data: player, error: jErr } = await supabase.from("game_players").insert({
      session_id: session.id, user_id: userId||null, guest_token: guestTokenRef.current, display_name: name, is_host:false,
    }).select().single();
    setLoading(false);
    if (jErr) { setError(jErr.message); return; }
    setMyPlayer(player);
    fetchPlayers(session.id);
    setPhase("lobby");
  };

  const startGame = async () => {
    if (players.length < 2) { setError("Need at least 2 players before starting"); return; }
    const shuffled = shuffleQuestionOptions(session.custom_questions || []);
    await supabase.from("game_sessions").update({ status:"playing", custom_questions: shuffled }).eq("id", session.id);
    setMyQuestions(shuffled);
    setPhase("playing");
  };

  const submitAnswer = (optionIdx) => {
    const correct = optionIdx === myQuestions[qIndex]?.correctIndex;
    setAnswered(optionIdx);
    setShowAnswer(true);
    if (correct) setMyScore(s=>s+1);
  };

  const nextQuestion = async () => {
    if (qIndex === myQuestions.length-1) {
      await supabase.from("game_players").update({ score: myScore, ready:true }).eq("id", myPlayer.id);
      const { data: fresh } = await supabase.from("game_players").select("*").eq("session_id", session.id);
      if (fresh && fresh.every(p=>p.ready)) {
        await finishGame(fresh);
      } else {
        fetchPlayers(session.id);
        setPhase("waiting-others");
      }
    } else {
      setQIndex(i=>i+1); setShowAnswer(false); setAnswered(null);
    }
  };

  const finishGame = async (finalPlayers) => {
    await supabase.from("game_sessions").update({ status:"finished" }).eq("id", session.id);
    fetchPlayers(session.id);
    setPhase("result");
  };

  // Poll for other players finishing while I wait
  useEffect(() => {
    if (phase !== "waiting-others" || !session) return;
    const interval = setInterval(async () => {
      const { data: fresh } = await supabase.from("game_players").select("*").eq("session_id", session.id);
      if (fresh) {
        setPlayers(fresh);
        if (fresh.every(p=>p.ready)) { clearInterval(interval); await finishGame(fresh); }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, session]);

  const shareLink = `${window.location.origin}/join/${session?.lobby_code}`;

  // ── JOIN screen (arrived via a shared link) ──────────────────────────────
  if (phase==="join") return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div className="popIn" style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <LogoMask size={44}/>
        <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginTop:16,marginBottom:8}}>Join Mystery Lobby</h2>
        {loading && <p style={{color:"#888"}}>Loading lobby...</p>}
        {error && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:16}}>{error}</p>}
        {session && !error && (
          <>
            <p style={{color:"#888",fontSize:"0.9rem",marginBottom:8,fontWeight:300}}>Hosted by <strong>{session.host_name}</strong> — enter your name to join.</p>
            <p style={{color:"#aaa",fontSize:"0.82rem",marginBottom:24}}>{(session.custom_questions||[]).length} question{(session.custom_questions||[]).length===1?"":"s"} written by the host</p>
            {!userName && <Inp placeholder="Your name" value={guestName} onChange={e=>setGuestName(e.target.value)} style={{marginBottom:12}}/>}
            {error && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:12}}>{error}</p>}
            <Btn onClick={joinLobby} style={{width:"100%"}} disabled={loading}>Join lobby</Btn>
          </>
        )}
      </div>
    </div>
  );

  // ── SETUP screen (host writes the questions for this game) ───────────────
  if (phase==="setup") return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <div style={{padding:"20px 28px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <BackBtn onClick={()=>goTo("games")}/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Mystery Lobby</span>
      </div>
      <div style={{maxWidth:560,margin:"0 auto",padding:"32px 24px 100px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><LogoMask size={28}/></div>
          <h2 className="syne" style={{fontSize:"1.5rem",fontWeight:800,marginBottom:6}}>Write your own questions</h2>
          <p style={{color:"#888",fontSize:"0.88rem",fontWeight:300,lineHeight:1.6}}>Each question needs 4 answer options with one marked correct. Everyone who joins answers the same set — fresh questions every time means no more repeats.</p>
        </div>

        {!userName && (
          <div style={{marginBottom:24}}>
            <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Your name</label>
            <Inp placeholder="Your name" value={guestName} onChange={e=>setGuestName(e.target.value)}/>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em"}}>Questions ({questions.length})</label>
          {questions.length>0 && questions.length<3 && <span style={{fontSize:"0.75rem",color:"#ff5c3a"}}>Add {3-questions.length} more</span>}
        </div>

        {questions.length===0 && !showQForm && (
          <div style={{textAlign:"center",padding:"36px 20px",background:"white",borderRadius:16,border:"1px dashed rgba(0,0,0,0.15)",marginBottom:16}}>
            <p style={{color:"#aaa",fontSize:"0.88rem",marginBottom:4}}>No questions yet</p>
            <p style={{color:"#ccc",fontSize:"0.78rem"}}>Add at least 3 to create a lobby</p>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {questions.map((item,idx)=>(
            <div key={idx} style={{background:"white",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(0,0,0,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <p style={{fontWeight:700,fontSize:"0.92rem",flex:1}}>{idx+1}. {item.q}</p>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button onClick={()=>openEditQuestion(idx)} style={{padding:6,borderRadius:8,border:"none",background:"#f0efec",cursor:"pointer",display:"flex"}}><Icons.settings s={13} c="#555"/></button>
                  <button onClick={()=>removeQuestion(idx)} style={{padding:6,borderRadius:8,border:"none",background:"#fff5f5",cursor:"pointer",display:"flex"}}><Icons.close s={13} c="#ef4444"/></button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {item.options.map((opt,oi)=>(
                  <div key={oi} style={{padding:"7px 10px",borderRadius:8,fontSize:"0.78rem",background:oi===item.correctIndex?"#f0fff4":"#fafaf8",color:oi===item.correctIndex?"#166534":"#666",border:`1px solid ${oi===item.correctIndex?"#86efac":"rgba(0,0,0,0.06)"}`,display:"flex",alignItems:"center",gap:5}}>
                    {oi===item.correctIndex && <Icons.check s={11} c="#16a34a"/>}{opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!showQForm ? (
          <button onClick={openAddQuestion} style={{width:"100%",padding:"14px",borderRadius:14,border:"1.5px dashed rgba(0,0,0,0.2)",background:"white",cursor:"pointer",fontSize:"0.9rem",fontWeight:600,color:"#555",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:20}}>
            <Icons.plus s={16} c="#555"/>Add question
          </button>
        ) : (
          <div className="popIn" style={{background:"white",borderRadius:16,padding:"20px",border:"1.5px solid #0e0e0e",marginBottom:20}}>
            <p className="syne" style={{fontWeight:700,fontSize:"0.95rem",marginBottom:14}}>{editingIdx!==null?"Edit question":"New question"}</p>
            <Inp placeholder="e.g. What's my favourite food?" value={qDraft.q} onChange={e=>setQDraft(d=>({...d,q:e.target.value}))} style={{marginBottom:14}}/>
            <p style={{fontSize:"0.78rem",color:"#aaa",marginBottom:8}}>4 options — tap the circle to mark the correct one</p>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {qDraft.options.map((opt,oi)=>(
                <div key={oi} style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setQDraft(d=>({...d,correctIndex:oi}))} style={{width:24,height:24,borderRadius:"50%",flexShrink:0,border:`2px solid ${qDraft.correctIndex===oi?"#16a34a":"rgba(0,0,0,0.2)"}`,background:qDraft.correctIndex===oi?"#16a34a":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {qDraft.correctIndex===oi && <Icons.check s={13} c="white"/>}
                  </button>
                  <Inp placeholder={`Option ${oi+1}`} value={opt} onChange={e=>setQDraft(d=>({...d,options:d.options.map((o,i)=>i===oi?e.target.value:o)}))} style={{flex:1}}/>
                </div>
              ))}
            </div>
            {qError && <p style={{color:"#ef4444",fontSize:"0.82rem",marginBottom:12}}>{qError}</p>}
            <div style={{display:"flex",gap:10}}>
              <Btn outline onClick={closeQForm} style={{flex:1}}>Cancel</Btn>
              <Btn onClick={saveQuestion} style={{flex:1}}>Save question</Btn>
            </div>
          </div>
        )}

        {error && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:12,textAlign:"center"}}>{error}</p>}
        <Btn onClick={createLobby} style={{width:"100%",padding:"15px"}} disabled={loading || questions.length<3}>{loading?"Creating...":"Create lobby"}</Btn>
      </div>
    </div>
  );

  // ── LOBBY room (waiting for players, real-time list) ─────────────────────
  if (phase==="lobby" && session) {
    const isHost = myPlayer?.is_host;
    return (
      <div style={{minHeight:"100vh",background:"#fafaf8"}}>
        <div style={{padding:"20px 28px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
          <BackBtn onClick={()=>goTo("games")}/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Lobby</span>
        </div>
        <div style={{maxWidth:480,margin:"0 auto",padding:"36px 24px"}}>
          <div className="fadeUp" style={{background:"white",borderRadius:20,padding:"24px",border:"1px solid rgba(0,0,0,0.08)",marginBottom:20,textAlign:"center"}}>
            <p style={{fontSize:"0.78rem",fontWeight:600,color:"#aaa",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Share this link</p>
            <p className="syne" style={{fontSize:"1.1rem",fontWeight:800,marginBottom:14,wordBreak:"break-all"}}>{shareLink}</p>
            <button onClick={()=>{navigator.clipboard?.writeText(shareLink);setLobbyCopied(true);setTimeout(()=>setLobbyCopied(false),2000);}} style={{padding:"10px 20px",borderRadius:50,border:"1.5px solid rgba(0,0,0,0.12)",background:"white",cursor:"pointer",fontSize:"0.85rem",display:"inline-flex",alignItems:"center",gap:8}}>
              <Icons.copy s={14} c="#555"/>{lobbyCopied?"Copied!":"Copy link"}
            </button>
            <p style={{fontSize:"0.78rem",color:"#aaa",marginTop:14}}>{(session.custom_questions||[]).length} questions ready to play</p>
          </div>
          <div style={{background:"white",borderRadius:20,padding:"24px",border:"1px solid rgba(0,0,0,0.08)",marginBottom:24}}>
            <p style={{fontSize:"0.78rem",fontWeight:600,color:"#aaa",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Players ({players.length})</p>
            {players.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <Avatar size={30} bg={AVATAR_COLORS[i%AVATAR_COLORS.length]} iconSize={16}/>
                <span style={{flex:1,fontSize:"0.92rem",fontWeight:500}}>{p.display_name}{p.is_host&&" (Host)"}</span>
                <Icons.check s={14} c="#16a34a"/>
              </div>
            ))}
          </div>
          {error && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:12,textAlign:"center"}}>{error}</p>}
          {isHost ? (
            <Btn onClick={startGame} style={{width:"100%",padding:"15px"}}><Icons.games s={18} c="white"/>Start Game</Btn>
          ) : (
            <p style={{textAlign:"center",color:"#888",fontSize:"0.85rem"}}>Waiting for the host to start the game...</p>
          )}
        </div>
      </div>
    );
  }

  // ── PLAYING (self-paced, everyone answers the same host-written questions) ─
  const currentQ = myQuestions[qIndex];
  if (phase==="playing" && currentQ) return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span className="syne" style={{fontWeight:800,fontSize:"1.05rem"}}>Question {qIndex+1}/{myQuestions.length}</span>
        <span style={{background:"#0e0e0e",color:"white",padding:"6px 14px",borderRadius:50,fontSize:"0.83rem",fontWeight:600}}>Score: {myScore}</span>
      </div>
      <div style={{height:4,background:"#f0efec"}}><div style={{height:"100%",width:`${(qIndex/myQuestions.length)*100}%`,background:"#ff5c3a",transition:"width 0.3s"}}/></div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"32px 24px"}}>
        <div className="fadeUp" style={{background:"#0e0e0e",borderRadius:20,padding:"28px",marginBottom:24,textAlign:"center"}}>
          <h3 className="syne" style={{fontSize:"1.15rem",fontWeight:800,color:"white",lineHeight:1.5}}>{currentQ.q}</h3>
        </div>
        {!showAnswer?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {currentQ.options.map((opt,oi) => (
              <button key={oi} onClick={()=>submitAnswer(oi)} style={{padding:"16px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",color:"#0e0e0e",cursor:"pointer",fontSize:"0.92rem",fontWeight:500,textAlign:"left",transition:"all 0.2s"}} onMouseDown={e=>e.currentTarget.style.background="#f0efec"}>
                {opt}
              </button>
            ))}
          </div>
        ):(
          <div className="popIn">
            <div style={{padding:"20px",background:answered===currentQ.correctIndex?"#f0fff4":"#fff5f5",border:`1px solid ${answered===currentQ.correctIndex?"#86efac":"#fca5a5"}`,borderRadius:16,marginBottom:20,textAlign:"center"}}>
              <p style={{fontWeight:700,marginBottom:6}}>{answered===currentQ.correctIndex?"Correct! +1 point":"Not quite!"}</p>
              <p style={{fontSize:"0.83rem",color:"#555",lineHeight:1.6}}>Correct answer: {currentQ.options[currentQ.correctIndex]}</p>
            </div>
            <Btn onClick={nextQuestion} style={{width:"100%",padding:"15px"}}>{qIndex===myQuestions.length-1?"Finish":"Next question"}</Btn>
          </div>
        )}
      </div>
    </div>
  );

  // ── WAITING for other players to finish ──────────────────────────────────
  if (phase==="waiting-others") return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{maxWidth:380}}>
        <Icons.timer s={40} c="#0e0e0e"/>
        <h2 className="syne" style={{fontSize:"1.4rem",fontWeight:800,marginTop:16,marginBottom:8}}>You're done! Score: {myScore}</h2>
        <p style={{color:"#888",fontSize:"0.9rem",fontWeight:300}}>Waiting for the other players to finish...</p>
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────
  const sorted = [...players].sort((a,b)=>(b.score||0)-(a.score||0));
  return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div className="popIn" style={{maxWidth:420,width:"100%"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"#f0fff4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Icons.trophy s={36} c="#16a34a"/></div>
        <h2 className="syne" style={{fontSize:"2rem",fontWeight:800,marginBottom:20}}>Game over!</h2>
        <div style={{background:"white",borderRadius:20,padding:"20px",border:"1px solid rgba(0,0,0,0.08)",marginBottom:24,textAlign:"left"}}>
          {sorted.map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<sorted.length-1?"1px solid rgba(0,0,0,0.06)":"none"}}>
              <span style={{width:20,textAlign:"center",fontSize:"0.8rem",color:"#aaa",fontWeight:700}}>{i+1}</span>
              <Avatar size={30} bg={AVATAR_COLORS[i%AVATAR_COLORS.length]} iconSize={16}/>
              <span style={{flex:1,fontWeight:500}}>{p.display_name}</span>
              <span className="syne" style={{fontWeight:800}}>{p.score||0} pts</span>
            </div>
          ))}
        </div>
        <Btn onClick={()=>goTo("games")} style={{width:"100%"}}>Back to games</Btn>
      </div>
    </div>
  );
};
// ── STAKE & WIN (still simulated) ──────────────────────────────────────────────
const makeStakeLobbyCode = () => "STAKE-"+Math.floor(1000+Math.random()*9000);

const makeQuizLobbyCode = () => "QUIZ-"+Math.floor(1000+Math.random()*9000);

const GameQuiz = ({ goTo, frozen=false, joinCode, userId, userName }) => {
  if (frozen) return (
    <div style={{minHeight:"100vh",background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{maxWidth:380}}>
        <Icons.trophy s={48} c="#ffcd3c"/>
        <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,color:"white",marginTop:20,marginBottom:12}}>Quiz Clash paused</h2>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.9rem",lineHeight:1.7,marginBottom:24,fontWeight:300}}>This game is temporarily unavailable. Check back soon.</p>
        <Btn onClick={()=>goTo("games")} style={{width:"100%",background:"#ff5c3a"}}>Back to games</Btn>
      </div>
    </div>
  );

  const guestTokenRef = useRef(userId ? null : getGuestToken());
  const [phase,setPhase] = useState(joinCode ? "join" : "setup");
  const [guestName,setGuestName] = useState(userName || "");
  const [session,setSession] = useState(null);
  const [myPlayer,setMyPlayer] = useState(null);
  const [players,setPlayers] = useState([]);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);
  const [lobbyCopied,setLobbyCopied] = useState(false);

  const [selectedTopics,setSelectedTopics] = useState([]);
  const [difficulty,setDifficulty] = useState("medium");
  const [questionCount,setQuestionCount] = useState(10);
  const [expectedPlayers,setExpectedPlayers] = useState(3);

  const [myQuestions,setMyQuestions] = useState([]);
  const [qIndex,setQIndex] = useState(0);
  const [myScore,setMyScore] = useState(0);
  const [answered,setAnswered] = useState(null);
  const [showAnswer,setShowAnswer] = useState(false);

  const fetchPlayers = async (sessionId) => {
    const { data } = await supabase.from("game_players").select("*").eq("session_id", sessionId).order("joined_at");
    if (data) setPlayers(data);
  };

  useEffect(() => { if (joinCode) loadSessionByCode(joinCode); }, [joinCode]);

  const loadSessionByCode = async (code) => {
    setLoading(true);
    const { data, error: e } = await supabase.from("game_sessions").select("*").eq("lobby_code", code).eq("game_type","stake_win").single();
    setLoading(false);
    if (e || !data) { setError("This lobby doesn't exist or has ended."); return; }
    setSession(data);
    fetchPlayers(data.id);
    if (data.status === "playing") { setMyQuestions(data.questions || []); setPhase("playing"); }
    else if (data.status === "finished") setPhase("result");
    else setPhase("join");
  };

  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase.channel(`quiz-${session.id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'game_players', filter:`session_id=eq.${session.id}` }, () => fetchPlayers(session.id))
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'game_sessions', filter:`id=eq.${session.id}` }, (payload) => {
        setSession(payload.new);
        if (payload.new.status === "playing" && phase !== "playing") {
          setMyQuestions(payload.new.questions || []);
          setPhase("playing");
        }
        if (payload.new.status === "finished") setPhase("result");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  const toggleTopic = key => setSelectedTopics(t=>t.includes(key)?t.filter(k=>k!==key):[...t,key]);

  const createLobby = async () => {
    const name = userName || guestName.trim();
    if (!name) { setError("Enter your name"); return; }
    setError(""); setLoading(true);
    const code = makeQuizLobbyCode();
    const { data: newSession, error: sErr } = await supabase.from("game_sessions").insert({
      lobby_code: code, game_type:"stake_win", host_user_id: userId||null, host_name: name, max_players: expectedPlayers,
      stake_amount: 0, topics: selectedTopics, difficulty, question_count: questionCount,
    }).select().single();
    if (sErr) { setError(sErr.message); setLoading(false); return; }

    const { data: hostPlayer } = await supabase.from("game_players").insert({
      session_id:newSession.id, user_id:userId||null, guest_token:guestTokenRef.current, display_name:name, is_host:true,
    }).select().single();

    setSession(newSession); setMyPlayer(hostPlayer);
    fetchPlayers(newSession.id);
    setLoading(false); setPhase("lobby");
  };

  const joinLobby = async () => {
    const name = userName || guestName.trim();
    if (!name) { setError("Enter your name"); return; }
    setError(""); setLoading(true);
    const { data: player, error: jErr } = await supabase.from("game_players").insert({
      session_id:session.id, user_id:userId||null, guest_token:guestTokenRef.current, display_name:name, is_host:false,
    }).select().single();
    setLoading(false);
    if (jErr) { setError(jErr.message); return; }
    setMyPlayer(player);
    fetchPlayers(session.id);
    setPhase("lobby");
  };

  const startGame = async () => {
    if (players.length < 2) { setError("Need at least 2 players to start"); return; }
    const qs = await getQuestions(selectedTopics.length?selectedTopics:(session.topics||[]), difficulty||session.difficulty, questionCount||session.question_count);
    await supabase.from("game_sessions").update({ status:"playing", questions: qs, current_question:0 }).eq("id", session.id);
    setMyQuestions(qs);
    setPhase("playing");
  };

  // Questions come in two shapes now: the older {q, a:boolean, f} True/False
  // ones, and newer {q, options:[4 strings], correctIndex, f} multiple-choice
  // ones — detected by whether `options` is present, so both can sit in the
  // same question pool without either format needing to change.
  const submitAnswer = async (myAnswer) => {
    const q = myQuestions[qIndex];
    const isMC = Array.isArray(q?.options);
    const correct = isMC ? myAnswer === q.correctIndex : myAnswer === q?.a;
    setAnswered(myAnswer);
    setShowAnswer(true);
    if (correct) setMyScore(s=>s+1);
  };

  const nextQuestion = async () => {
    if (qIndex === myQuestions.length-1) {
      await supabase.from("game_players").update({ score: myScore, ready:true }).eq("id", myPlayer.id);
      const { data: fresh } = await supabase.from("game_players").select("*").eq("session_id", session.id);
      if (fresh && fresh.every(p=>p.ready)) {
        await finishGame();
      } else {
        fetchPlayers(session.id);
        setPhase("waiting-others");
      }
    } else {
      setQIndex(i=>i+1); setShowAnswer(false); setAnswered(null);
    }
  };

  // Marks the session finished exactly once, no matter how many players'
  // phones call this at the same moment — see settle_stake_game in the
  // database. Since this session's stake_amount is always 0 now, its payout
  // step is a no-op; only the "mark finished, exactly once" part matters here.
  const finishGame = async () => {
    await supabase.rpc("settle_stake_game", { p_session_id: session.id });
    fetchPlayers(session.id);
    setPhase("result");
  };

  useEffect(() => {
    if (phase !== "waiting-others" || !session) return;
    const interval = setInterval(async () => {
      const { data: fresh } = await supabase.from("game_players").select("*").eq("session_id", session.id);
      if (fresh) {
        setPlayers(fresh);
        if (fresh.every(p=>p.ready)) { clearInterval(interval); await finishGame(); }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, session]);

  const shareLink = `${window.location.origin}/join-quiz/${session?.lobby_code}`;

  // ── JOIN (arrived via link) ──────────────────────────────────────────
  if (phase==="join") return (
    <div style={{minHeight:"100vh",background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div className="popIn" style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <Icons.trophy s={44} c="#ffcd3c"/>
        <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,color:"white",marginTop:16,marginBottom:8}}>Join Quiz Clash</h2>
        {loading && <p style={{color:"rgba(255,255,255,0.5)"}}>Loading...</p>}
        {error && <p style={{color:"#ff5c3a",fontSize:"0.85rem",marginBottom:16}}>{error}</p>}
        {session && !error && (
          <>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.9rem",marginBottom:20,fontWeight:300}}>Hosted by <strong style={{color:"white"}}>{session.host_name}</strong> — free to play.</p>
            {!userName && <Inp placeholder="Your name" value={guestName} onChange={e=>setGuestName(e.target.value)} style={{marginBottom:12}}/>}
            <Btn onClick={joinLobby} style={{width:"100%",background:"#ff5c3a"}} disabled={loading}>Join lobby</Btn>
          </>
        )}
      </div>
    </div>
  );

  // ── SETUP (host configures the game) ─────────────────────────────────
  if (phase==="setup") return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <div style={{padding:"20px 28px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <BackBtn onClick={()=>goTo("games")}/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Quiz Clash</span>
      </div>
      <div style={{maxWidth:520,margin:"0 auto",padding:"32px 24px"}}>
        {!userName && (
          <div style={{marginBottom:20}}>
            <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:10}}>Your name</label>
            <Inp value={guestName} onChange={e=>setGuestName(e.target.value)}/>
          </div>
        )}

        <div style={{marginBottom:24}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:14}}>Max players</label>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setExpectedPlayers(n=>Math.max(2,n-1))} style={{width:40,height:40,borderRadius:12,border:"1.5px solid rgba(0,0,0,0.12)",background:"white",cursor:"pointer"}}><Icons.close s={16} c="#555"/></button>
            <span className="syne" style={{fontSize:"1.5rem",fontWeight:800,minWidth:30,textAlign:"center"}}>{expectedPlayers}</span>
            <button onClick={()=>setExpectedPlayers(n=>Math.min(10,n+1))} style={{width:40,height:40,borderRadius:12,border:"1.5px solid rgba(0,0,0,0.12)",background:"white",cursor:"pointer"}}><Icons.plus s={16} c="#555"/></button>
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:14}}>Topics</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {TRIVIA_TOPICS.map(t=>{
              const sel = selectedTopics.includes(t.key);
              return <button key={t.key} onClick={()=>toggleTopic(t.key)} style={{padding:"8px 14px",borderRadius:50,fontSize:"0.8rem",border:`1.5px solid ${sel?"#0e0e0e":"rgba(0,0,0,0.12)"}`,background:sel?"#0e0e0e":"white",color:sel?"white":"#555",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><t.icon/>{t.label}</button>;
            })}
          </div>
          {selectedTopics.length===0&&<p style={{fontSize:"0.78rem",color:"#aaa",marginTop:8}}>No topics selected = mix of all topics</p>}
        </div>

        <div style={{marginBottom:24}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:14}}>Difficulty</label>
          <div style={{display:"flex",gap:8}}>
            {[{k:"easy",l:"Easy"},{k:"medium",l:"Medium"},{k:"hard",l:"Hard"},{k:"mix",l:"Mix"}].map(d=>(
              <button key={d.k} onClick={()=>setDifficulty(d.k)} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${difficulty===d.k?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:difficulty===d.k?"#0e0e0e":"white",color:difficulty===d.k?"white":"#555",cursor:"pointer",fontSize:"0.83rem",fontWeight:600}}>{d.l}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:14}}>Number of questions</label>
          <div style={{display:"flex",gap:8}}>
            {[5,10,15,20].map(n=>(
              <button key={n} onClick={()=>setQuestionCount(n)} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${questionCount===n?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:questionCount===n?"#0e0e0e":"white",color:questionCount===n?"white":"#555",cursor:"pointer",fontSize:"0.9rem",fontWeight:700}}>{n}</button>
            ))}
          </div>
        </div>

        {error && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:12}}>{error}</p>}
        <Btn onClick={createLobby} style={{width:"100%",padding:"15px"}} disabled={loading}>
          <Icons.share s={18} c="white"/>{loading?"Creating...":"Create Lobby & Invite"}
        </Btn>
      </div>
    </div>
  );

  // ── LOBBY (real-time waiting room) ───────────────────────────────────
  if (phase==="lobby") {
    const isHost = myPlayer?.is_host;
    return (
      <div style={{minHeight:"100vh",background:"#fafaf8"}}>
        <div style={{padding:"20px 28px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
          <BackBtn onClick={()=>goTo("games")}/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Lobby</span>
        </div>
        <div style={{maxWidth:480,margin:"0 auto",padding:"36px 24px"}}>
          <div className="fadeUp" style={{textAlign:"center",marginBottom:24}}>
            <Icons.trophy s={40} c="#ffcd3c"/>
            <h2 className="syne" style={{fontSize:"1.4rem",fontWeight:800,marginTop:10,marginBottom:6}}>Invite your friends</h2>
            <p style={{color:"#888",fontSize:"0.86rem",fontWeight:300}}>Free to play — bragging rights only.</p>
          </div>
          <div style={{background:"white",borderRadius:20,padding:"24px",border:"1px solid rgba(0,0,0,0.08)",marginBottom:20,textAlign:"center"}}>
            <p style={{fontSize:"0.78rem",fontWeight:600,color:"#aaa",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Share this link</p>
            <p className="syne" style={{fontSize:"1rem",fontWeight:800,marginBottom:14,wordBreak:"break-all"}}>{shareLink}</p>
            <button onClick={()=>{navigator.clipboard?.writeText(shareLink);setLobbyCopied(true);setTimeout(()=>setLobbyCopied(false),2000);}} style={{padding:"10px 20px",borderRadius:50,border:"1.5px solid rgba(0,0,0,0.12)",background:"white",cursor:"pointer",fontSize:"0.85rem",display:"inline-flex",alignItems:"center",gap:8}}>
              <Icons.copy s={14} c="#555"/>{lobbyCopied?"Copied!":"Copy link"}
            </button>
          </div>
          <div style={{background:"white",borderRadius:20,padding:"24px",border:"1px solid rgba(0,0,0,0.08)",marginBottom:24}}>
            <p style={{fontSize:"0.78rem",fontWeight:600,color:"#aaa",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Players ({players.length}/{session.max_players})</p>
            {players.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <Avatar size={30} bg={AVATAR_COLORS[i%AVATAR_COLORS.length]} iconSize={16}/>
                <span style={{flex:1,fontSize:"0.92rem",fontWeight:500}}>{p.display_name}{p.is_host&&" (Host)"}</span>
                <Icons.check s={14} c="#16a34a"/>
              </div>
            ))}
          </div>
          {error && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:12,textAlign:"center"}}>{error}</p>}
          {isHost ? (
            <Btn onClick={startGame} style={{width:"100%",padding:"15px"}}><Icons.trophy s={18} c="white"/>Start Game</Btn>
          ) : (
            <p style={{textAlign:"center",color:"#888",fontSize:"0.85rem"}}>Waiting for the host to start the game...</p>
          )}
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────
  const currentQ = myQuestions[qIndex];
  if (phase==="playing" && currentQ) return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span className="syne" style={{fontWeight:800,fontSize:"1.05rem"}}>Question {qIndex+1}/{myQuestions.length}</span>
        <span style={{background:"#0e0e0e",color:"white",padding:"6px 14px",borderRadius:50,fontSize:"0.83rem",fontWeight:600}}>Score: {myScore}</span>
      </div>
      <div style={{height:4,background:"#f0efec"}}><div style={{height:"100%",width:`${(qIndex/myQuestions.length)*100}%`,background:"#ff5c3a",transition:"width 0.3s"}}/></div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"32px 24px"}}>
        <div className="fadeUp" style={{background:"#0e0e0e",borderRadius:20,padding:"28px",marginBottom:24,textAlign:"center"}}>
          <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.78rem",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>{Array.isArray(currentQ.options)?"Pick one":"True or False?"}</p>
          <h3 className="syne" style={{fontSize:"1.15rem",fontWeight:800,color:"white",lineHeight:1.5}}>{currentQ.q}</h3>
        </div>
        {!showAnswer ? (
          Array.isArray(currentQ.options) ? (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {currentQ.options.map((opt,i)=>(
                <button key={i} onClick={()=>submitAnswer(i)} style={{padding:"16px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.1)",background:"white",color:"#0e0e0e",cursor:"pointer",fontSize:"0.92rem",fontWeight:500,textAlign:"left"}}>{opt}</button>
              ))}
            </div>
          ) : (
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>submitAnswer(true)} style={{flex:1,padding:"20px",borderRadius:16,border:"none",background:"#22c55e",color:"white",fontSize:"1rem",fontWeight:700,cursor:"pointer"}}>TRUE</button>
              <button onClick={()=>submitAnswer(false)} style={{flex:1,padding:"20px",borderRadius:16,border:"none",background:"#ef4444",color:"white",fontSize:"1rem",fontWeight:700,cursor:"pointer"}}>FALSE</button>
            </div>
          )
        ):(
          <div className="popIn">
            {Array.isArray(currentQ.options) ? (
              <div style={{padding:"20px",background:answered===currentQ.correctIndex?"#f0fff4":"#fff5f5",border:`1px solid ${answered===currentQ.correctIndex?"#86efac":"#fca5a5"}`,borderRadius:16,marginBottom:20,textAlign:"center"}}>
                <p style={{fontWeight:700,marginBottom:6}}>{answered===currentQ.correctIndex?"Correct! +1 point":"Not quite!"}</p>
                <p style={{fontSize:"0.83rem",color:"#555",lineHeight:1.6}}>{currentQ.f || `Correct answer: ${currentQ.options[currentQ.correctIndex]}`}</p>
              </div>
            ) : (
              <div style={{padding:"20px",background:answered===currentQ.a?"#f0fff4":"#fff5f5",border:`1px solid ${answered===currentQ.a?"#86efac":"#fca5a5"}`,borderRadius:16,marginBottom:20,textAlign:"center"}}>
                <p style={{fontWeight:700,marginBottom:6}}>{answered===currentQ.a?"Correct! +1 point":"Wrong!"}</p>
                <p style={{fontSize:"0.83rem",color:"#555",lineHeight:1.6}}>{currentQ.f}</p>
              </div>
            )}
            <Btn onClick={nextQuestion} style={{width:"100%",padding:"15px"}}>{qIndex===myQuestions.length-1?"Finish":"Next question"}</Btn>
          </div>
        )}
      </div>
    </div>
  );

  // ── WAITING for other players to finish ──────────────────────────────
  if (phase==="waiting-others") return (
    <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
      <div style={{maxWidth:380}}>
        <Icons.timer s={40} c="#0e0e0e"/>
        <h2 className="syne" style={{fontSize:"1.4rem",fontWeight:800,marginTop:16,marginBottom:8}}>You're done! Score: {myScore}</h2>
        <p style={{color:"#888",fontSize:"0.9rem",fontWeight:300}}>Waiting for the other players to finish...</p>
      </div>
    </div>
  );

  // ── RESULT — plain leaderboard, no money language anywhere ───────────
  if (phase==="result") {
    const sorted = [...players].sort((a,b)=>(b.score||0)-(a.score||0));
    const top = sorted[0]?.score||0;
    const tied = sorted.filter(p=>p.score===top);
    const isTie = tied.length>1;
    const rankColors = ["#d4af37","#a8a8a8","#b08d57"];
    return (
      <div style={{minHeight:"100vh",background:"#fafaf8"}}>
        <div style={{padding:"20px 28px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",gap:8}}>
          <Icons.trophy s={20} c="#0e0e0e"/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Results</span>
        </div>
        <div style={{maxWidth:480,margin:"0 auto",padding:"40px 24px"}}>
          <div className="popIn" style={{textAlign:"center",marginBottom:28}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:isTie?"#f0f4ff":"#f0fff4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              {isTie?<Icons.info s={32} c="#6366f1"/>:<Icons.trophy s={32} c="#16a34a"/>}
            </div>
            <h2 className="syne" style={{fontSize:"1.8rem",fontWeight:800,marginBottom:8}}>{isTie?"It's a tie!":"We have a winner!"}</h2>
            {!isTie && <p style={{color:"#888",fontWeight:300,fontSize:"0.9rem"}}>{sorted[0].display_name} takes the win with {top} correct answer{top===1?"":"s"}.</p>}
            {isTie && <p style={{color:"#888",fontWeight:300,fontSize:"0.9rem"}}>{tied.map(p=>p.display_name).join(", ")} tied with {top} correct answer{top===1?"":"s"}.</p>}
          </div>
          <div style={{background:"white",borderRadius:20,padding:"20px",border:"1px solid rgba(0,0,0,0.08)",marginBottom:24}}>
            {sorted.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<sorted.length-1?"1px solid rgba(0,0,0,0.06)":"none"}}>
                {i<3?<Icons.medal s={20} c={rankColors[i]}/>:<span style={{width:20,textAlign:"center",fontSize:"0.8rem",color:"#aaa",fontWeight:700}}>{i+1}</span>}
                <Avatar size={30} bg={AVATAR_COLORS[i%AVATAR_COLORS.length]} iconSize={16}/>
                <span style={{flex:1,fontWeight:500}}>{p.display_name}</span>
                <span className="syne" style={{fontWeight:800}}>{p.score||0}/{session.question_count}</span>
              </div>
            ))}
          </div>
          <Btn onClick={()=>goTo("games")} style={{width:"100%"}}>Back to games</Btn>
        </div>
      </div>
    );
  }
  return null;
};

// ── CUSTOMIZATION ──────────────────────────────────────────────────────────────
const Customization = ({ goTo, customization, setCustomization, userId }) => {
  const [local,setLocal] = useState(customization);
  const [saving,setSaving] = useState(false);
  const [saveErr,setSaveErr] = useState("");
  const theme = THEMES.find(t=>t.key===local.theme)||THEMES[0];

  const save = async () => {
    if (!userId) { setSaveErr("You need to be logged in to save this."); return; }
    setSaving(true); setSaveErr("");
    const { error } = await supabase.from("profiles").update({ theme: local.theme, bg_color: local.bgColor || null }).eq("id", userId);
    setSaving(false);
    if (error) { setSaveErr(error.message); return; }
    setCustomization(local);
    goTo("settings");
  };

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <div style={{padding:"20px 28px",display:"flex",alignItems:"center",gap:16,borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
        <BackBtn onClick={()=>goTo("settings")}/><span className="syne" style={{fontWeight:800,fontSize:"1.1rem"}}>Customize your page</span>
      </div>
      <div style={{maxWidth:520,margin:"0 auto",padding:"32px 24px"}}>
        <div style={{marginBottom:28}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:14}}>Choose a theme</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {THEMES.map(t=>(
              <button key={t.key} onClick={()=>setLocal(l=>({...l,theme:t.key}))} style={{padding:"14px 10px",borderRadius:14,border:`2px solid ${local.theme===t.key?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:t.bg,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:t.accent,margin:"0 auto 6px"}}/>
                <p style={{fontSize:"0.78rem",fontWeight:600}}>{t.label}</p>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:28}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:6,marginBottom:14}}><Icons.palette s={14} c="#aaa"/>Custom background color</label>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <input type="color" value={local.bgColor||theme.bg} onChange={e=>setLocal(l=>({...l,bgColor:e.target.value}))} style={{width:52,height:52,borderRadius:12,border:"1.5px solid rgba(0,0,0,0.12)",cursor:"pointer",padding:2}}/>
            <div>
              <p style={{fontWeight:500,fontSize:"0.92rem"}}>Pick any color</p>
              <p style={{fontSize:"0.78rem",color:"#aaa",marginTop:2}}>Overrides the theme background</p>
            </div>
          </div>
        </div>
        <div style={{marginBottom:28}}>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:14}}>Preview</label>
          <div style={{background:local.bgColor||theme.bg,borderRadius:16,padding:"24px",border:"1px solid rgba(0,0,0,0.08)",textAlign:"center"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:theme.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><LogoMask size={24} variant="white"/></div>
            <p className="syne" style={{fontWeight:800,fontSize:"1rem"}}>@yourname</p>
            <p style={{fontSize:"0.8rem",color:"#888",marginTop:4}}>Send me an anonymous message</p>
          </div>
        </div>
        <Btn onClick={save} style={{width:"100%",padding:"15px"}} disabled={saving}>
          <Icons.check s={16} c="white"/>{saving?"Saving...":"Save changes"}
        </Btn>
        {saveErr && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:10,textAlign:"center"}}>{saveErr}</p>}
      </div>
    </div>
  );
};
const ChangePassword = ({ profile, onBack }) => {
  const [pw,setPw] = useState({current:"",newPass:"",confirm:""});
  const [err,setErr] = useState("");
  const [saving,setSaving] = useState(false);
  const [saved,setSaved] = useState(false);
  const save = async () => {
    if (pw.newPass !== pw.confirm) { setErr("Passwords don't match."); return; }
    if (pw.newPass.length < 8 || !/[0-9!@#$%^&*]/.test(pw.newPass)) { setErr("Min. 8 characters, with at least one number or symbol."); return; }
    if (pw.newPass === pw.current) { setErr("New password must be different from your current one."); return; }
    setSaving(true); setErr("");
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: profile?.email, password: pw.current });
    if (verifyError) { setSaving(false); setErr("Your current password is wrong."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw.newPass });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setSaved(true);
    setTimeout(onBack, 1500);
  };
  return (
    <SubPage title="Change Password" onBack={onBack}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[["Current password","current"],["New password","newPass"],["Confirm new password","confirm"]].map(([label,key])=>(
          <div key={key}>
            <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>{label}</label>
            <Inp type="password" value={pw[key]} onChange={e=>setPw(p=>({...p,[key]:e.target.value}))}/>
          </div>
        ))}
      </div>
      <p style={{fontSize:"0.78rem",color:"#aaa",marginTop:10}}>Min. 8 characters, at least one number or symbol.</p>
      {err && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:6}}>{err}</p>}
      <Btn onClick={save} style={{width:"100%",marginTop:24,padding:"15px"}} disabled={!pw.current||pw.newPass.length<8||pw.newPass!==pw.confirm||saving}>{saving?"Updating...":"Update password"}</Btn>
      {saved && <p style={{textAlign:"center",marginTop:12,color:"#16a34a",fontSize:"0.85rem"}}>Password updated!</p>}
    </SubPage>
  );
};

// ── SETTINGS ───────────────────────────────────────────────────────────────────
const Settings = ({ goTo, customization, setCustomization, currency, profile, userId, onLogout }) => {
  const cur = currency || CURRENCIES.NG;
  const [sec,setSec] = useState(null);
  const [name,setName] = useState(profile?.name||"");
  const [username,setUsername] = useState(profile?.username||"");
  const [gender,setGender] = useState(profile?.gender||"");
  const [email,setEmail] = useState(profile?.email||"");
  const [pw,setPw] = useState({current:"",newPass:"",confirm:""});
  const [pwErr,setPwErr] = useState("");
  const [saved,setSaved] = useState(false);
  const [saving,setSaving] = useState(false);
  const [saveErr,setSaveErr] = useState("");
  const [balance,setBalance] = useState(0);
  const [avatarUrl,setAvatarUrl] = useState(profile?.avatar_url||"");
  const [uploadingPhoto,setUploadingPhoto] = useState(false);
  const [photoErr,setPhotoErr] = useState("");
  const fileInputRef = useRef(null);
  const [toggles,setToggles] = useState({messages:true,discover:true,filter:true,emailNotif:false,newMsg:true,gameInvite:true,hintNotif:false,updates:false});
  const [darkMode,setDarkMode] = useState("auto");
  const [contactSubject,setContactSubject] = useState("Payment issue");
  const [contactMessage,setContactMessage] = useState("");
  const [contactSubmitting,setContactSubmitting] = useState(false);
  const [contactSubmitted,setContactSubmitted] = useState(false);

  const submitComplaint = async () => {
    if (!contactMessage.trim() || !userId) return;
    setContactSubmitting(true);
    const priority = contactSubject === "Safety concern" ? "high" : "medium";
    const { error } = await supabase.from("complaints").insert({
      user_id: userId,
      subject: contactSubject,
      message: contactMessage.trim(),
      status: "open",
      priority,
    });
    setContactSubmitting(false);
    if (!error) { setContactSubmitted(true); setContactMessage(""); }
  };

  useEffect(() => {
    setName(profile?.name||""); setUsername(profile?.username||""); setGender(profile?.gender||""); setEmail(profile?.email||""); setAvatarUrl(profile?.avatar_url||"");
  }, [profile]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5*1024*1024) { setPhotoErr("File must be under 5MB."); return; }
    if (!["image/jpeg","image/png","image/gif","image/webp"].includes(file.type)) { setPhotoErr("Please choose a JPG, PNG, GIF or WEBP image."); return; }
    setPhotoErr(""); setUploadingPhoto(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert:true });
    if (uploadError) { setUploadingPhoto(false); setPhotoErr(uploadError.message); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;
    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setUploadingPhoto(false);
    if (profileError) { setPhotoErr(profileError.message); return; }
    setAvatarUrl(publicUrl);
  };

  useEffect(() => {
    if (!userId) return;
    supabase.from("wallets").select("balance").eq("user_id", userId).single().then(({data})=>{ if(data) setBalance(Number(data.balance)); });
  }, [userId]);

  const saveProfile = async () => {
    setSaving(true); setSaveErr("");
    const { error } = await supabase.from("profiles").update({ name, username, gender }).eq("id", userId);
    setSaving(false);
    if (error) { setSaveErr(error.message); return; }
    setSaved(true);
    setTimeout(()=>{setSaved(false);setSec(null);},1500);
  };

  const saveEmail = async () => {
    setSaving(true); setSaveErr("");
    const { error } = await supabase.auth.updateUser({ email });
    if (error) { setSaving(false); setSaveErr(error.message); return; }
    const { error: profileError } = await supabase.from("profiles").update({ email }).eq("id", userId);
    setSaving(false);
    if (profileError) { setSaveErr(profileError.message); return; }
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const savePassword = async () => {
    if (pw.newPass !== pw.confirm) { setPwErr("Passwords don't match."); return; }
    setSaving(true); setPwErr("");
    const { error } = await supabase.auth.updateUser({ password: pw.newPass });
    setSaving(false);
    if (error) { setPwErr(error.message); return; }
    setSaved(true);
    setTimeout(()=>{setSaved(false);setSec(null);setPw({current:"",newPass:"",confirm:""});},1500);
  };

  const sections = [
    {key:"help",icon:<Icons.help s={18} c="#555"/>,label:"Help & FAQ",desc:"Common questions answered"},
    {key:"contact",icon:<Icons.chat s={18} c="#555"/>,label:"Contact Support",desc:"Get help from our team"},
    {key:"notifications",icon:<Icons.bell s={18} c="#555"/>,label:"Notifications",desc:"Manage alerts and emails"},
    {key:"privacy",icon:<Icons.shield s={18} c="#555"/>,label:"Privacy & Safety",desc:"Block users, message filters"},
    {key:"terms",icon:<Icons.doc s={18} c="#555"/>,label:"Terms & Privacy",desc:"Read our policies"},
    {key:"appearance",icon:<Icons.sun s={18} c="#555"/>,label:"Appearance",desc:"Light or dark mode"},
    {key:"account",icon:<Icons.mail s={18} c="#555"/>,label:"Account Details",desc:"Change email address"},
    {key:"password",icon:<Icons.lock s={18} c="#555"/>,label:"Change Password",desc:"Update your password"},
    {key:"photo",icon:<Icons.photo s={18} c="#555"/>,label:"Profile Picture",desc:"Upload or change your photo"},
    {key:"profile",icon:<Icons.user s={18} c="#555"/>,label:"Edit Profile",desc:"Name, username, gender"},
  ];

  if(sec==="profile") return (
    <SubPage title="Edit Profile" onBack={()=>setSec(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Full name</label>
          <Inp value={name} onChange={e=>setName(e.target.value)}/>
        </div>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Username</label>
          <Inp value={username} onChange={e=>setUsername(e.target.value)}/>
        </div>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:10}}>Gender</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["Male","Female","Non-binary","Prefer not to say"].map(g=>(
              <button key={g} onClick={()=>setGender(g)} style={{padding:"9px 16px",borderRadius:50,fontSize:"0.83rem",border:`1.5px solid ${gender===g?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:gender===g?"#0e0e0e":"white",color:gender===g?"white":"#555",cursor:"pointer",transition:"all 0.2s"}}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{padding:"12px 16px",background:"#fff8f0",border:"1px solid rgba(255,92,58,0.15)",borderRadius:12,fontSize:"0.82rem",color:"#888",lineHeight:1.6,display:"flex",gap:8}}>
          <Icons.warning s={14} c="#f97316"/>Gender details may be used to generate hints. Changes apply to new messages only.
        </div>
      </div>
      <Btn onClick={saveProfile} style={{width:"100%",marginTop:28,padding:"15px"}} disabled={saving}><Icons.check s={16} c="white"/>{saving?"Saving...":"Save changes"}</Btn>
      {saveErr && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:10,textAlign:"center"}}>{saveErr}</p>}
      {saved&&<p style={{textAlign:"center",marginTop:12,color:"#16a34a",fontSize:"0.85rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icons.check s={14} c="#16a34a"/>Saved!</p>}
    </SubPage>
  );

  if(sec==="account") return (
    <SubPage title="Account Details" onBack={()=>setSec(null)}>
      <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Email address</label>
      <Inp type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <p style={{marginTop:10,fontSize:"0.82rem",color:"#aaa",display:"flex",alignItems:"center",gap:6}}><Icons.info s={12} c="#aaa"/>A verification email will be sent to your new address.</p>
      <Btn onClick={saveEmail} style={{width:"100%",marginTop:24,padding:"15px"}} disabled={saving}><Icons.check s={16} c="white"/>{saving?"Updating...":"Update email"}</Btn>
      {saveErr && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:10,textAlign:"center"}}>{saveErr}</p>}
      {saved&&<p style={{textAlign:"center",marginTop:12,color:"#16a34a",fontSize:"0.85rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icons.check s={14} c="#16a34a"/>Verification sent!</p>}
    </SubPage>
  );

  if(sec==="password") return <ChangePassword profile={profile} onBack={()=>setSec(null)}/>;

  if(sec==="password") return (
    <SubPage title="Change Password" onBack={()=>setSec(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>New password</label>
          <Inp type="password" value={pw.newPass} onChange={e=>setPw(p=>({...p,newPass:e.target.value}))}/>
        </div>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Confirm new password</label>
          <Inp type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))}/>
        </div>
      </div>
      <p style={{fontSize:"0.78rem",color:"#aaa",marginTop:10,display:"flex",alignItems:"center",gap:6}}><Icons.info s={12} c="#aaa"/>Min. 8 characters, at least one number or symbol.</p>
      {pwErr && <p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:6}}>{pwErr}</p>}
      <Btn onClick={savePassword} style={{width:"100%",marginTop:24,padding:"15px"}} disabled={pw.newPass.length<8||pw.newPass!==pw.confirm||saving}>
        <Icons.check s={16} c="white"/>{saving?"Updating...":"Update password"}
      </Btn>
      {saved&&<p style={{textAlign:"center",marginTop:12,color:"#16a34a",fontSize:"0.85rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icons.check s={14} c="#16a34a"/>Password updated!</p>}
    </SubPage>
  );

  if(sec==="photo") return (
    <SubPage title="Profile Picture" onBack={()=>setSec(null)}>
      <div style={{width:100,height:100,borderRadius:"50%",background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",overflow:"hidden"}}>
        {avatarUrl ? <img src={avatarUrl} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <LogoMask size={50} variant="white"/>}
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoSelect} style={{display:"none"}}/>
      <div onClick={()=>!uploadingPhoto && fileInputRef.current?.click()} style={{background:"#f3f2ef",borderRadius:16,padding:"24px",marginBottom:16,cursor:uploadingPhoto?"default":"pointer",border:"2px dashed #ccc",textAlign:"center",opacity:uploadingPhoto?0.6:1}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Icons.photo s={32} c="#aaa"/></div>
        <p style={{fontWeight:600,marginBottom:4}}>{uploadingPhoto?"Uploading...":avatarUrl?"Change photo":"Upload a photo"}</p>
        <p style={{fontSize:"0.83rem",color:"#aaa"}}>JPG, PNG, GIF or WEBP. Max 5MB.</p>
      </div>
      {photoErr && <p style={{color:"#ef4444",fontSize:"0.82rem",marginBottom:12,textAlign:"center"}}>{photoErr}</p>}
      <Btn outline onClick={()=>setSec(null)} style={{width:"100%"}}>Done</Btn>
    </SubPage>
  );


  if(sec==="help") return (
    <SubPage title="Help & FAQ" onBack={()=>setSec(null)}>
      {[
        {q:"Is Unmaskr really anonymous?",a:"Yes. Senders are completely anonymous. Hints are based on general data they voluntarily share — never their exact identity. If a sender doesn't share a piece of info, that hint is shown for free."},
        {q:"How do I earn from hints?",a:"When someone pays to see a hint on your message, 50% goes to your wallet automatically. Withdraw anytime — balances never expire."},
        {q:"What if a withdrawal fails?",a:"If a withdrawal fails for any technical reason, the full amount is automatically returned to your wallet within 10 minutes."},
        {q:"How does Quiz Clash work?",a:"Everyone answers the same trivia questions, picked from the topics and difficulty the host chooses. Highest score wins — it's free to play, just for bragging rights."},
        {q:"What happens in a tie in Quiz Clash?",a:"Tied players share the win — you can always start a rematch among just the tied players to settle it."},
        {q:"How do I contact support?",a:"Go to Settings → Contact Support. We typically reply within 24 hours at support@unmaskr.com."},
      ].map((item,i)=>(
        <div key={i} style={{background:"white",borderRadius:16,padding:"20px",marginBottom:12,border:"1px solid rgba(0,0,0,0.07)"}}>
          <p style={{fontWeight:600,marginBottom:8,fontSize:"0.95rem"}}>{item.q}</p>
          <p style={{color:"#666",fontSize:"0.88rem",lineHeight:1.7,fontWeight:300}}>{item.a}</p>
        </div>
      ))}
    </SubPage>
  );

  if(sec==="contact") return (
    <SubPage title="Contact Support" onBack={()=>setSec(null)}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"#f0efec",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Icons.chat s={24} c="#0e0e0e"/></div>
        <h2 className="syne" style={{fontSize:"1.5rem",fontWeight:800,marginBottom:8}}>We're here to help</h2>
        <p style={{color:"#888",fontSize:"0.9rem",fontWeight:300}}>Usually reply within 24 hours.</p>
      </div>
      {contactSubmitted ? (
        <div style={{textAlign:"center",padding:"24px",background:"#f0fff4",borderRadius:16,border:"1px solid #86efac"}}>
          <Icons.check s={28} c="#16a34a"/>
          <p style={{fontWeight:600,marginTop:10,marginBottom:4}}>Message sent!</p>
          <p style={{fontSize:"0.85rem",color:"#666"}}>We'll get back to you within 24 hours.</p>
        </div>
      ) : (
      <>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Subject</label>
          <select value={contactSubject} onChange={e=>setContactSubject(e.target.value)} style={{width:"100%",padding:"14px 18px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",fontSize:"0.95rem",cursor:"pointer"}}>
            <option>Payment issue</option>
            <option>Account problem</option>
            <option>Report a bug</option>
            <option>Safety concern</option>
            <option>Withdrawal not received</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:"0.8rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>Message</label>
          <textarea placeholder="Describe your issue..." rows={5} value={contactMessage} onChange={e=>setContactMessage(e.target.value)} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid rgba(0,0,0,0.12)",background:"#fafaf8",fontSize:"0.95rem",resize:"none",lineHeight:1.6}}/>
        </div>
      </div>
      <Btn onClick={submitComplaint} style={{width:"100%",marginTop:20,padding:"15px"}} disabled={!contactMessage.trim()||contactSubmitting}>
        <Icons.share s={16} c="white"/>{contactSubmitting?"Sending...":"Send message"}
      </Btn>
      </>
      )}
      <div style={{marginTop:24,padding:"14px",background:"#f3f2ef",borderRadius:12,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Icons.mail s={14} c="#666"/><p style={{fontSize:"0.83rem",color:"#666"}}>Or email: <strong>support@unmaskr.com</strong></p>
      </div>
    </SubPage>
  );

  if(sec==="privacy") return (
    <SubPage title="Privacy & Safety" onBack={()=>setSec(null)}>
      {[
        {k:"messages",l:"Allow anonymous messages",d:"Turn off to stop new messages"},
        {k:"discover",l:"Show in discover",d:"Let others find your profile"},
        {k:"filter",l:"Filter offensive messages",d:"Auto-hide harmful messages"},
        {k:"emailNotif",l:"Email notifications",d:"Get notified by email"},
      ].map(item=>(
        <div key={item.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
          <div><p style={{fontWeight:500,marginBottom:4,fontSize:"0.92rem"}}>{item.l}</p><p style={{fontSize:"0.8rem",color:"#aaa"}}>{item.d}</p></div>
          <Tog on={toggles[item.k]} onToggle={()=>setToggles(t=>({...t,[item.k]:!t[item.k]}))}/>
        </div>
      ))}
      <div onClick={onLogout} style={{marginTop:32,padding:"14px 16px",borderRadius:12,border:"1px solid rgba(239,68,68,0.2)",background:"#fff5f5",cursor:"pointer",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Icons.logout s={16} c="#ef4444"/><p style={{color:"#ef4444",fontWeight:600,fontSize:"0.9rem"}}>Delete my account</p>
      </div>
      <p style={{fontSize:"0.72rem",color:"#ccc",textAlign:"center",marginTop:8}}>Not wired to actually delete the account yet — currently logs you out.</p>
    </SubPage>
  );

  if(sec==="notifications") return (
    <SubPage title="Notifications" onBack={()=>setSec(null)}>
      {[
        {k:"newMsg",l:"New messages",d:"When someone sends you a message"},
        {k:"gameInvite",l:"Game invites",d:"When a friend invites you to a game"},
        {k:"hintNotif",l:"Hint purchased",d:"When someone buys a hint on your message"},
        {k:"updates",l:"Platform updates",d:"News and announcements"},
      ].map(item=>(
        <div key={item.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
          <div><p style={{fontWeight:500,marginBottom:4,fontSize:"0.92rem"}}>{item.l}</p><p style={{fontSize:"0.8rem",color:"#aaa"}}>{item.d}</p></div>
          <Tog on={toggles[item.k]} onToggle={()=>setToggles(t=>({...t,[item.k]:!t[item.k]}))}/>
        </div>
      ))}
    </SubPage>
  );

  if(sec==="appearance") return (
    <SubPage title="Appearance" onBack={()=>setSec(null)}>
      <p style={{fontSize:"0.88rem",color:"#888",marginBottom:24,fontWeight:300}}>Choose how Unmaskr looks. Automatic follows your device.</p>
      {[{k:"auto",l:"Automatic",d:"Follows your device setting"},{k:"light",l:"Light",d:"Always light mode"},{k:"dark",l:"Dark",d:"Always dark mode"}].map(m=>(
        <button key={m.k} onClick={()=>setDarkMode(m.k)} style={{width:"100%",padding:"16px 18px",borderRadius:14,border:`1.5px solid ${darkMode===m.k?"#0e0e0e":"rgba(0,0,0,0.1)"}`,background:darkMode===m.k?"#0e0e0e":"white",color:darkMode===m.k?"white":"#0e0e0e",cursor:"pointer",textAlign:"left",marginBottom:10,transition:"all 0.2s",display:"flex",alignItems:"center",gap:12}}>
          <Icons.sun s={18} c={darkMode===m.k?"white":"#555"}/>
          <div><p style={{fontWeight:600,marginBottom:2}}>{m.l}</p><p style={{fontSize:"0.78rem",opacity:0.6}}>{m.d}</p></div>
        </button>
      ))}
    </SubPage>
  );

  if(sec==="terms") return <Terms goTo={goTo} fromSend={false}/>;

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8"}}>
      <AppNav goTo={goTo} active="settings" userId={userId}/>
      <div style={{maxWidth:600,margin:"0 auto",padding:"32px 20px"}}>
        <div className="fadeUp" style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
            {avatarUrl ? <img src={avatarUrl} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <LogoMask size={32} variant="white"/>}
          </div>
          <div><h2 className="syne" style={{fontSize:"1.3rem",fontWeight:800}}>{profile?.name||"Your Name"}</h2><p style={{color:"#888",fontSize:"0.88rem"}}>{window.location.host}/{profile?.username||"yourname"}</p></div>
        </div>

        <div className="fadeUp" style={{background:"#f3f2ef",borderRadius:16,padding:"16px 18px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",border:"1px solid rgba(0,0,0,0.06)"}} onClick={()=>goTo("wallet")}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"#0e0e0e",display:"flex",alignItems:"center",justifyContent:"center"}}><Icons.wallet s={18} c="white"/></div>
            <div>
              <p style={{fontSize:"0.72rem",fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Wallet balance</p>
              <p className="syne" style={{fontWeight:800,fontSize:"1.2rem"}}>{cur.symbol}{balance.toLocaleString()}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:"0.8rem",color:"#888"}}>View wallet</span><Icons.chevron s={16} c="#ccc"/></div>
        </div>

        <div className="fadeUp" style={{background:"#f0f4ff",borderRadius:16,padding:"16px 18px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",border:"1px solid rgba(0,0,0,0.06)"}} onClick={()=>goTo("customization")}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center"}}><Icons.palette s={18} c="white"/></div>
            <div>
              <p style={{fontWeight:500,fontSize:"0.92rem",marginBottom:2}}>Customize your send page</p>
              <p style={{fontSize:"0.78rem",color:"#aaa"}}>Change theme and background color</p>
            </div>
          </div>
          <Icons.chevron s={16} c="#ccc"/>
        </div>

        <div className="fadeUp1" style={{display:"flex",flexDirection:"column",gap:8}}>
          {sections.map(s=>(
            <button key={s.key} className="srow" onClick={()=>setSec(s.key)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:14,border:"1px solid rgba(0,0,0,0.07)",background:"white",cursor:"pointer",textAlign:"left",transition:"background 0.15s",width:"100%"}}>
              <span style={{width:28,display:"flex",justifyContent:"center"}}>{s.icon}</span>
              <div style={{flex:1}}>
                <p style={{fontWeight:500,fontSize:"0.92rem",marginBottom:2}}>{s.label}</p>
                <p style={{fontSize:"0.78rem",color:"#aaa"}}>{s.desc}</p>
              </div>
              <Icons.chevron s={16} c="#ccc"/>
            </button>
          ))}
        </div>

        <div className="fadeUp2" onClick={onLogout} style={{marginTop:24,padding:"16px 18px",borderRadius:14,border:"1px solid rgba(239,68,68,0.2)",background:"#fff5f5",cursor:"pointer",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Icons.logout s={16} c="#ef4444"/><p style={{color:"#ef4444",fontWeight:600,fontSize:"0.9rem"}}>Log out</p>
        </div>
      </div>
    </div>
  );
};
// ── APP ROUTER ─────────────────────────────────────────────────────────────────
const calcAge = (dobStr) => {
  if(!dobStr) return null;
  const dob = new Date(dobStr);
  if(isNaN(dob)) return null;
  const today = new Date();
  let age = today.getFullYear()-dob.getFullYear();
  const m = today.getMonth()-dob.getMonth();
  if(m<0||(m===0&&today.getDate()<dob.getDate())) age--;
  return age;
};

// Screens that are NOT usernames — anything else in the URL path is treated
// as someone's username and routes straight to the send-message page.
const RESERVED_PATHS = ["landing","signup","login","forgot","terms","inbox","send","stats","wallet","games","game-lobby","game-quiz","settings","customization","join","join-quiz"];

const getInitialRouteFromURL = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, ""); // strip leading/trailing slashes
  if (!path) return { screen: "landing", params: {} };
  const parts = path.split("/");
  const segment = parts[0];
  // Game invite links: /join/CODE (Mystery Lobby) and /join-quiz/CODE (Quiz Clash)
  if (segment === "join" && parts[1]) return { screen: "game-lobby", params: { joinCode: parts[1] } };
  if (segment === "join-quiz" && parts[1]) return { screen: "game-quiz", params: { joinCode: parts[1] } };
  if (RESERVED_PATHS.includes(segment)) return { screen: segment, params: {} };
  // Anything else (e.g. "/temi") is treated as a username send-link
  return { screen: "send", params: { username: segment } };
};

export default function App() {
  const initialRoute = getInitialRouteFromURL();
  const [screen,setScreen] = useState(initialRoute.screen);
  const [params,setParams] = useState(initialRoute.params);
  const [customization,setCustomization] = useState({theme:"classic",bgColor:""});
  const [checkingSession,setCheckingSession] = useState(true);
  const [session,setSession] = useState(null);
  const [profile,setProfile] = useState(null);
  const [suspendedNotice,setSuspendedNotice] = useState(false);
  const [platformSettings,setPlatformSettings] = useState(null);

  const userCountry = profile?.country || "NG";
  const userDOB = profile?.dob || "";
  const currency = getCurrency(userCountry);
  const age = calcAge(userDOB);
  const isMinor = age!==null && age<18;

  const goTo = (s,p={}) => {
    setScreen(s);
    setParams(p);
    window.scrollTo(0,0);
    // Keep the address bar in sync so links stay shareable/refreshable
    const path = s==="landing" ? "/" : s==="send" && p.username ? `/${p.username}` : `/${s}`;
    window.history.pushState({}, "", path);
  };

  const [profileFetchError,setProfileFetchError] = useState("");
  const fetchProfile = async (uid) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (error) {
      console.error("Profile fetch failed:", error);
      setProfileFetchError(`${error.message} (code: ${error.code || "none"})`);
    } else {
      setProfileFetchError("");
    }
    if (data) {
      if (data.status === "suspended") {
        // Suspended accounts are signed out immediately, not let into the app.
        await supabase.auth.signOut();
        setProfile(null);
        setSuspendedNotice(true);
        return;
      }
      setProfile(data);
      // Reflect the owner's saved send-page theme in this session too, so
      // their own "Preview" matches what visitors to their link actually see.
      if (data.theme || data.bg_color) setCustomization({ theme: data.theme || "classic", bgColor: data.bg_color || "" });
    }
  };

  const fetchPlatformSettings = async () => {
    const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
    if (data) setPlatformSettings(data);
  };

  useEffect(() => {
    fetchPlatformSettings();

    // Safety timeout: some mobile networks can leave this request hanging
    // indefinitely instead of erroring out. Don't let the whole app get stuck
    // on the loading screen forever waiting for it — move on after 6 seconds
    // regardless. Worst case, the user just has to log in again.
    let settled = false;
    const timeout = setTimeout(() => { if (!settled) { settled = true; setCheckingSession(false); } }, 6000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return; // timeout already fired, don't override later
      settled = true;
      clearTimeout(timeout);
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Only redirect to inbox if we're not already on a direct send-link —
        // someone with an account clicking a friend's link should still see it.
        setScreen(s => (s==="landing") ? "inbox" : s);
      }
      setCheckingSession(false);
    }).catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => { clearTimeout(timeout); listener.subscription.unsubscribe(); };
  }, []);

  // Presence: mark this tab as "online" on a shared channel while the app is
  // open, so the admin dashboard can show a real active-users count instead
  // of a hardcoded number. Works for logged-in users and anonymous visitors.
  // This is a "nice to have" feature — wrapped so it can never take the rest
  // of the app down if a browser blocks storage or the realtime connection.
  useEffect(() => {
    let channel;
    try {
      const presenceKey = session?.user?.id || getGuestToken();
      channel = supabase.channel("online-users", { config: { presence: { key: presenceKey } } });
      channel.subscribe(async (status) => {
        try {
          if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
        } catch (e) { /* non-critical, ignore */ }
      });
    } catch (e) { /* non-critical, ignore */ }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  // Applies immediately after signup so currency/age-gating don't wait on the
  // profile re-fetch — real profile data arrives right after via onAuthStateChange.
  const onSignupComplete = (form) => {
    setProfile(p => ({ ...(p||{}), country: form.country, dob: form.dob, name: form.name, username: form.username, gender: form.gender, email: form.email }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    goTo("landing");
  };

  if (checkingSession) return (
    <>
      <GlobalStyles/>
      <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
        <div style={{animation:"pulse 1.4s ease-in-out infinite"}}><LogoMask size={40}/></div>
        <p style={{fontSize:"0.8rem",color:"#aaa"}}>Loading...</p>
        <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}`}</style>
      </div>
    </>
  );

  if (suspendedNotice) return (
    <>
      <GlobalStyles/>
      <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
        <div style={{maxWidth:380}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Icons.warning s={28} c="#ef4444"/></div>
          <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginBottom:12}}>Account suspended</h2>
          <p style={{color:"#888",fontSize:"0.9rem",lineHeight:1.7,marginBottom:24,fontWeight:300}}>This account has been suspended. Contact <strong>support@unmaskr.com</strong> if you believe this is a mistake.</p>
          <Btn onClick={()=>{setSuspendedNotice(false);goTo("landing");}} style={{width:"100%"}}>Back to homepage</Btn>
        </div>
      </div>
    </>
  );

  // Maintenance mode blocks everyone except someone already mid-checkout on a
  // send page (so an in-progress anonymous message isn't abruptly interrupted).
  if (platformSettings?.maintenance_mode && screen !== "send") return (
    <>
      <GlobalStyles/>
      <div style={{minHeight:"100vh",background:"#fafaf8",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
        <div style={{maxWidth:380}}>
          <LogoMask size={48}/>
          <h2 className="syne" style={{fontSize:"1.6rem",fontWeight:800,marginTop:20,marginBottom:12}}>Down for maintenance</h2>
          <p style={{color:"#888",fontSize:"0.9rem",lineHeight:1.7,fontWeight:300}}>We're making some improvements. Please check back shortly.</p>
        </div>
      </div>
    </>
  );

  const screens = {
    landing:       <Landing goTo={goTo}/>,
    signup:        <Signup goTo={goTo} onSignupComplete={onSignupComplete} signupsDisabled={platformSettings?.new_signups_enabled===false}/>,
    login:         <Login goTo={goTo}/>,
    forgot:        <ForgotPassword goTo={goTo}/>,
    terms:         <Terms goTo={goTo} fromSend={false}/>,
    inbox:         <Inbox goTo={goTo} currency={currency} isMinor={isMinor} userId={session?.user?.id} username={profile?.username||"yourname"} hintsDisabled={platformSettings?.hint_purchases_enabled===false}/>,
    send:          <SendPage goTo={goTo} params={params} receiverCurrency={currency}/>,
    stats:         <Stats goTo={goTo} userId={session?.user?.id}/>,
    wallet:        <Wallet goTo={goTo} currency={currency} userId={session?.user?.id} userName={profile?.name} withdrawalsDisabled={platformSettings?.withdrawals_enabled===false}/>,
    games:         <Games goTo={goTo} mysteryFrozen={platformSettings?.mystery_lobby_frozen} quizFrozen={platformSettings?.stake_win_frozen} userId={session?.user?.id}/>,
    "game-lobby":  <GameLobby goTo={goTo} frozen={platformSettings?.mystery_lobby_frozen} joinCode={params?.joinCode} userId={session?.user?.id} userName={profile?.name||profile?.username}/>,
    "game-quiz":   <GameQuiz goTo={goTo} frozen={platformSettings?.stake_win_frozen} joinCode={params?.joinCode} userId={session?.user?.id} userName={profile?.name||profile?.username}/>,
    settings:      <Settings goTo={goTo} customization={customization} setCustomization={setCustomization} currency={currency} profile={profile} userId={session?.user?.id} onLogout={handleLogout}/>,
    customization: <Customization goTo={goTo} customization={customization} setCustomization={setCustomization} userId={session?.user?.id}/>,
  };

  return (
    <>
      <GlobalStyles/>
      {profileFetchError && (
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:999,background:"#ef4444",color:"white",padding:"10px 16px",fontSize:"0.8rem",textAlign:"center"}}>
          Profile fetch error: {profileFetchError}
        </div>
      )}
      {screens[screen]||screens.landing}
    </>
  );
}
