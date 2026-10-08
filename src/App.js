import React, { useState, useEffect } from "react";
// Adjust this path to wherever your supabaseClient.js actually lives in the project
import { supabase } from "./supabaseClient";
import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
// The two logo images that were embedded here as base64 text were corrupted (same
// broken data found and replaced in the main app's App.js), so the mask is drawn
// as the real traced logo instead — it can't fail to load, and it's the same
// artwork now used everywhere else in the app.
// Logo concept 9 ("layers peeling back") — same mark as the main site. The
// admin dashboard is always dark, so this only ever needs the white-on-dark
// treatment: back/middle layers in white at two opacity levels, front layer
// solid brand orange.
const LogoMaskImg = ({ size=24, style={} }) => (
  <svg height={size} width={size} viewBox="0 0 100 100" role="img" aria-label="Unmaskr" style={{ display:"block", flexShrink:0, ...style }}>
    <rect x="8" y="8" width="60" height="60" rx="16" fill="#ffffff" opacity="0.32"/>
    <rect x="24" y="24" width="60" height="60" rx="16" fill="#ffffff" opacity="0.68"/>
    <rect x="40" y="40" width="44" height="44" rx="12" fill="#ff5c3a"/>
  </svg>
);
const LogoFullImg = ({ height=24, style={} }) => (
  <div style={{ display:"flex", alignItems:"center", gap:height*0.32, ...style }}>
    <LogoMaskImg size={height}/>
    <span className="syne" style={{ fontSize:height*0.72, fontWeight:800, letterSpacing:"-0.02em", color:"white", lineHeight:1, whiteSpace:"nowrap" }}>unmaskr</span>
  </div>
);

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
    body { background: #0e0e0e; }
    .syne { font-family: 'Syne', sans-serif !important; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
    @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
    .fadeUp  { animation: fadeUp 0.5s ease both; }
    .fadeUp1 { animation: fadeUp 0.5s 0.08s ease both; }
    .fadeUp2 { animation: fadeUp 0.5s 0.16s ease both; }
    .fadeUp3 { animation: fadeUp 0.5s 0.24s ease both; }
    .fadeUp4 { animation: fadeUp 0.5s 0.32s ease both; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    .nav-item:hover { background: rgba(255,255,255,0.06) !important; }
    .row-hover:hover { background: rgba(255,255,255,0.04) !important; }
    .card-hover:hover { border-color: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    @media (max-width: 768px) {
      .admin-sidebar { width: 56px !important; }
      .admin-sidebar .sidebar-label { display: none !important; }
      .admin-sidebar .sidebar-logo-text { display: none !important; }
      .admin-sidebar .sidebar-admin-info { display: none !important; }
      .admin-content { padding: 16px !important; }
      .admin-topbar { padding: 12px 16px !important; }
      .admin-stat-grid { grid-template-columns: 1fr 1fr !important; }
      .admin-chart-grid { grid-template-columns: 1fr !important; }
      .admin-table { font-size: 0.75rem !important; }
      .admin-complaint-grid { grid-template-columns: 1fr !important; }
      .admin-settings-grid { grid-template-columns: 1fr !important; }
      .admin-notif-grid { grid-template-columns: 1fr !important; }
      table { min-width: 600px; }
      .table-wrap { overflow-x: auto; }
    }
    @media (max-width: 480px) {
      .admin-stat-grid { grid-template-columns: 1fr !important; }
      .live-banner { flex-direction: column !important; gap: 16px !important; }
      .live-stats { gap: 16px !important; }
    }
  `}</style>
);

// ─── SHARED ───────────────────────────────────────────────────────────────────
const MaskIcon = ({ size=24, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 130 105" fill={color}>
    <path d="M65 5 C35 5 10 22 10 46 C10 63 22 77 40 83 C38 91 30 99 20 103 C33 100 48 93 57 85 C59 86 62 86 65 86 C95 86 120 68 120 46 C120 22 95 5 65 5 Z"/>
    <ellipse cx="44" cy="44" rx="10" ry="11" fill="white"/>
    <ellipse cx="86" cy="44" rx="10" ry="11" fill="white"/>
    <path d="M38 64 Q65 82 92 64" stroke="white" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
  </svg>
);

// ─── ICONS (real SVGs, matching the main site — no emoji) ─────────────────────
const Ic = ({ d, s=18, c="currentColor", sw=1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const Icons = {
  chart:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M3 3v18h18","M18 17V9","M13 17V5","M8 17v-3"]}/>,
  users:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z","M22 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]}/>,
  user:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"]}/>,
  flag:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z","M4 22v-7"]}/>,
  check:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d="M20 6L9 17l-5-5"/>,
  close:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d="M18 6L6 18M6 6l12 12"/>,
  money:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M12 1v22","M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]}/>,
  gamepad:  ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M6 12h4","M8 10v4","M15 11h.01","M18 11h.01","M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"]}/>,
  bank:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M3 22h18","M6 18v-7","M10 18v-7","M14 18v-7","M18 18v-7","M12 2L2 7h20L12 2z"]}/>,
  chat:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  bell:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]}/>,
  settings: ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"]}/>,
  calendar: ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M3 4h18v18H3V4z","M8 2v4","M16 2v4","M3 10h18"]}/>,
  clock:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 6v6l4 2"]}/>,
  refresh:  ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16","M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8","M21 3v5h-5","M3 21v-5h5"]}/>,
  ban:      ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M4.93 4.93l14.14 14.14"]}/>,
  hash:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M4 9h16","M4 15h16","M10 3L8 21","M16 3l-2 18"]}/>,
  eye:      ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]}/>,
  mail:     ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"]}/>,
  plusCirc: ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 8v8","M8 12h8"]}/>,
  trendUp:  ({s=14,c="currentColor"})=><Ic s={s} c={c} d={["M22 7l-8.5 8.5-5-5L2 17","M16 7h6v6"]}/>,
  trendDown:({s=14,c="currentColor"})=><Ic s={s} c={c} d={["M22 17l-8.5-8.5-5 5L2 7","M16 17h6v-6"]}/>,
  chevL:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d="M15 18l-6-6 6-6"/>,
  chevR:    ({s=18,c="currentColor"})=><Ic s={s} c={c} d="M9 18l6-6-6-6"/>,
  arrowDownCirc: ({s=18,c="currentColor"})=><Ic s={s} c={c} d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z","M12 7v8","M8 11l4 4 4-4"]}/>,
  medal:    ({s=20,c="currentColor"})=><Ic s={s} c={c} d={["M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z","M8.21 13.89 7 23l5-3 5 3-1.21-9.12"]}/>,
};

const Avatar = ({ size=34, bg }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:bg||"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    <Icons.user s={Math.round(size*0.5)} c={bg?"white":"rgba(255,255,255,0.6)"}/>
  </div>
);
const AVATAR_COLORS = ["#ff5c3a","#38bdf8","#a855f7","#22c55e","#ffcd3c","#ec4899"];

const Card = ({ children, style={} }) => (
  <div className="card-hover" style={{ background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"22px 20px", transition:"all 0.2s", ...style }}>
    {children}
  </div>
);

const Badge = ({ text, color="#ff5c3a", icon }) => (
  <span style={{ background:`${color}22`, color, fontSize:"0.7rem", fontWeight:700, padding:"3px 10px", borderRadius:50, letterSpacing:"0.05em", display:"inline-flex", alignItems:"center", gap:5 }}>{icon}{text}</span>
);

const StatCard = ({ icon, label, value, change, positive=true, color="#ff5c3a" }) => (
  <Card>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>{icon}</div>
      {change && <span style={{ fontSize:"0.75rem", fontWeight:600, color:positive?"#22c55e":"#ef4444", display:"flex", alignItems:"center", gap:3 }}>{positive?<Icons.trendUp s={12} c="#22c55e"/>:<Icons.trendDown s={12} c="#ef4444"/>}{change}</span>}
    </div>
    <div className="syne" style={{ fontSize:"1.9rem", fontWeight:800, color:"white", marginBottom:4 }}>{value}</div>
    <div style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.4)" }}>{label}</div>
  </Card>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const timeAgo = (isoString) => {
  if (!isoString) return "";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// Exact date+time, for matching a report against your Paystack dashboard —
// timeAgo() alone ("2h ago") isn't precise enough to look up a transaction by.
const exactTime = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString("en-NG", { day:"numeric", month:"short", year:"numeric", hour:"numeric", minute:"2-digit" });
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
const BarChart = ({ data, labels, color="#ff5c3a", height=80 }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height }}>
      {data.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", borderRadius:"4px 4px 0 0", background:i===data.length-1?color:"rgba(255,255,255,0.1)", height:`${(v/max)*100}%`, minHeight:3, transition:"height 0.3s" }}/>
          {labels && <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.3)" }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
};
// ─── LOGIN ────────────────────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [factorId, setFactorId] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");

  const finishAdminCheck = async (userId, emailVal) => {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminRow) {
      setError("This account doesn't have admin access.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(emailVal);
  };

  const login = async () => {
    if(!email || !password) return;
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setMfaRequired(true);
        setLoading(false);
        return;
      }
    }

    await finishAdminCheck(data.user.id, email);
  };

  const verifyMfa = async () => {
    if (!mfaCode.trim() || !factorId) return;
    setLoading(true); setMfaError("");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setLoading(false); setMfaError(challengeError.message); return; }
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: mfaCode.trim() });
    if (verifyError) { setLoading(false); setMfaError("Invalid code — please try again."); return; }
    await finishAdminCheck(verifyData.user.id, email);
  };

  if (mfaRequired) return (
    <div style={{ minHeight:"100vh", background:"#0e0e0e", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <LogoMaskImg size={48}/>
          <h1 className="syne" style={{ color:"white", fontSize:"1.5rem", fontWeight:800, marginTop:16, marginBottom:6 }}>Two-factor code</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem" }}>Enter the 6-digit code from your authenticator app</p>
        </div>
        <input type="text" inputMode="numeric" placeholder="123456" value={mfaCode} onChange={e=>{setMfaCode(e.target.value.replace(/\D/g,"").slice(0,6)); setMfaError("");}}
          onKeyDown={e=>e.key==="Enter"&&verifyMfa()}
          style={{ width:"100%", padding:"14px 18px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:"1.2rem", letterSpacing:"0.3em", textAlign:"center", outline:"none", fontFamily:"'DM Sans',sans-serif" }}/>
        {mfaError && <p style={{ color:"#ef4444", fontSize:"0.82rem", marginTop:10, textAlign:"center" }}>{mfaError}</p>}
        <button onClick={verifyMfa} disabled={loading||mfaCode.length<6} style={{ width:"100%", marginTop:16, padding:"14px", borderRadius:12, border:"none", background:(loading||mfaCode.length<6)?"#7a3323":"#ff5c3a", color:"white", fontSize:"0.95rem", fontWeight:700, cursor:(loading||mfaCode.length<6)?"default":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          {loading ? "Verifying..." : "Verify"}
        </button>
        <p style={{ textAlign:"center", marginTop:16, fontSize:"0.82rem", color:"rgba(255,255,255,0.3)", cursor:"pointer" }} onClick={()=>{setMfaRequired(false);setMfaCode("");setMfaError("");supabase.auth.signOut();}}>← Back to sign in</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0e0e0e", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <LogoMaskImg size={48}/>
          <h1 className="syne" style={{ color:"white", fontSize:"1.8rem", fontWeight:800, marginTop:16, marginBottom:6 }}>unmaskr</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem" }}>Admin Dashboard</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input type="email" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)}
            style={{ padding:"14px 18px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:"0.95rem", outline:"none", fontFamily:"'DM Sans',sans-serif" }}/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
            style={{ padding:"14px 18px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:"0.95rem", outline:"none", fontFamily:"'DM Sans',sans-serif" }}
            onKeyDown={e=>e.key==="Enter"&&login()}/>
        </div>
        {error && <p style={{ color:"#ef4444", fontSize:"0.82rem", marginTop:10, textAlign:"center" }}>{error}</p>}
        <button onClick={login} disabled={loading} style={{ width:"100%", marginTop:16, padding:"14px", borderRadius:12, border:"none", background:loading?"#7a3323":"#ff5c3a", color:"white", fontSize:"0.95rem", fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, collapsed, setCollapsed }) => {
  const items = [
    { key:"overview",     icon:<Icons.chart s={16}/>, label:"Overview" },
    { key:"revenue",      icon:<Icons.money s={16}/>, label:"Revenue" },
    { key:"users",        icon:<Icons.users s={16}/>, label:"Users" },
    { key:"messages",     icon:<Icons.chat s={16}/>, label:"Messages" },
    { key:"hints",        icon:<LogoMaskImg size={16}/>, label:"Hints" },
    { key:"games",        icon:<Icons.gamepad s={16}/>, label:"Games" },
    { key:"deposits",     icon:<Icons.arrowDownCirc s={16}/>, label:"Deposits" },
    { key:"withdrawals",  icon:<Icons.bank s={16}/>, label:"Withdrawals" },
    { key:"complaints",   icon:<Icons.flag s={16}/>, label:"Complaints" },
    { key:"notifications",icon:<Icons.bell s={16}/>, label:"Push Alerts" },
    { key:"settings",     icon:<Icons.settings s={16}/>, label:"Settings" },
  ];

  return (
    <div style={{ width:collapsed?64:220, minHeight:"100vh", background:"#111", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", transition:"width 0.25s", flexShrink:0 }}>
      <div style={{ padding:"20px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <LogoMaskImg size={26}/>
        {!collapsed && <span className="syne" style={{ color:"white", fontWeight:800, fontSize:"1rem", whiteSpace:"nowrap" }}>unmaskr</span>}
        <button onClick={()=>setCollapsed(c=>!c)} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:"1rem", padding:4 }}>
          {collapsed?<Icons.chevR s={16}/>:<Icons.chevL s={16}/>}
        </button>
      </div>

      <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
        {items.map(item => (
          <button key={item.key} onClick={()=>setActive(item.key)} className="nav-item" style={{
            display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10,
            border:"none", cursor:"pointer", textAlign:"left", width:"100%", transition:"background 0.15s",
            background:active===item.key?"rgba(255,92,58,0.15)":"transparent",
            color:active===item.key?"#ff5c3a":"rgba(255,255,255,0.5)",
          }}>
            <span style={{ fontSize:"1rem", flexShrink:0 }}>{item.icon}</span>
            {!collapsed && <span style={{ fontSize:"0.88rem", fontWeight:active===item.key?600:400, whiteSpace:"nowrap" }}>{item.label}</span>}
            {!collapsed && active===item.key && <div style={{ marginLeft:"auto", width:4, height:4, borderRadius:"50%", background:"#ff5c3a" }}/>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div style={{ padding:"16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"#ff5c3a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:700, color:"white" }}>A</div>
            <div>
              <p style={{ color:"white", fontSize:"0.82rem", fontWeight:600 }}>Admin</p>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem" }}>Super Admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers:0, totalMessages:0, hintsSold:0, pendingWithdrawals:0, messagesToday:0, hintsToday:0, signupsToday:0 });
  const [weekUsers, setWeekUsers] = useState([0,0,0,0,0,0,0]);
  const [weekRevenue, setWeekRevenue] = useState([0,0,0,0,0,0,0]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  useEffect(() => { fetchOverview(); }, []);

  useEffect(() => {
    const channel = supabase.channel("online-users");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    const todayStr = new Date().toDateString();

    const [{ count: totalUsers }, { count: totalMessages }, { data: hintTx }, { data: withdrawalTx }] = await Promise.all([
      supabase.from("profiles").select("id", { count:"exact", head:true }),
      supabase.from("messages").select("id", { count:"exact", head:true }),
      supabase.from("transactions").select("amount, created_at").eq("type","hint_purchase").eq("status","completed"),
      supabase.from("transactions").select("amount").eq("type","withdrawal").eq("status","pending"),
    ]);

    const { data: recentProfiles } = await supabase.from("profiles").select("id, username, created_at").order("created_at",{ascending:false}).limit(5);
    const { data: recentMessages } = await supabase.from("messages").select("id, recipient_id, created_at").order("created_at",{ascending:false}).limit(5);

    const hintsSold = (hintTx || []).length;
    const pendingWithdrawals = (withdrawalTx || []).reduce((s,t)=>s+Number(t.amount),0);
    const hintsToday = (hintTx || []).filter(t => new Date(t.created_at).toDateString() === todayStr).length;
    const signupsToday = (recentProfiles || []).filter(p => new Date(p.created_at).toDateString() === todayStr).length;

    const { count: msgsToday } = await supabase.from("messages").select("id", { count:"exact", head:true }).gte("created_at", new Date().toISOString().slice(0,10));

    setStats({ totalUsers: totalUsers||0, totalMessages: totalMessages||0, hintsSold, pendingWithdrawals, messagesToday: msgsToday||0, hintsToday, signupsToday });

    const dayBuckets = [...Array(7)].map((_,i) => {
      const d = new Date(); d.setDate(d.getDate() - (6-i));
      return d.toDateString();
    });
    setWeekUsers(dayBuckets.map(dStr => (recentProfiles||[]).filter(p=>new Date(p.created_at).toDateString()===dStr).length));
    setWeekRevenue(dayBuckets.map(dStr => (hintTx||[]).filter(t=>new Date(t.created_at).toDateString()===dStr).reduce((s,t)=>s+Number(t.amount),0)));

    const recipientIds = [...new Set((recentMessages||[]).map(m=>m.recipient_id))];
    const { data: recipientProfiles } = recipientIds.length
      ? await supabase.from("profiles").select("id, username").in("id", recipientIds)
      : { data: [] };
    const usernameById = Object.fromEntries((recipientProfiles||[]).map(p=>[p.id,p.username]));

    const activity = [
      ...(recentProfiles||[]).map(p => ({ user:`@${p.username}`, action:"Signed up", time:timeAgo(p.created_at), ts:p.created_at })),
      ...(recentMessages||[]).map(m => ({ user:`@${usernameById[m.recipient_id]||"unknown"}`, action:"Received a message", time:timeAgo(m.created_at), ts:m.created_at })),
    ].sort((a,b)=> new Date(b.ts)-new Date(a.ts)).slice(0,7);
    setRecentActivity(activity);

    setLoading(false);
  };

  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#ff5c3a,#ff8c42)", borderRadius:16, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:24 }}>
        {[[String(stats.messagesToday),"messages sent today"],[String(stats.hintsToday),"hints bought today"],[String(stats.signupsToday),"new signups today"]].map(([v,l]) => (
          <div key={l} style={{ textAlign:"center" }}>
            <div className="syne" style={{ color:"white", fontSize:"1.3rem", fontWeight:800 }}>{v}</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.72rem" }}>{l}</div>
          </div>
        ))}
        <div style={{ textAlign:"center" }}>
          <div className="syne" style={{ color:"white", fontSize:"1.3rem", fontWeight:800, display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
            <span className="pulse" style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}/>{onlineCount}
          </div>
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.72rem" }}>active right now</div>
        </div>
      </div>

      <div className="fadeUp" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.users s={20} c="#38bdf8"/>} label="Total users" value={stats.totalUsers.toLocaleString()} color="#38bdf8"/>
        <StatCard icon={<Icons.chat s={20} c="#a855f7"/>} label="Total messages" value={stats.totalMessages.toLocaleString()} color="#a855f7"/>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Hints sold" value={stats.hintsSold.toLocaleString()} color="#ffcd3c"/>
        <StatCard icon={<Icons.bank s={20} c="#ef4444"/>} label="Pending withdrawals" value={`₦${stats.pendingWithdrawals.toLocaleString()}`} color="#ef4444"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>New users, last 7 days</p>
          <p className="syne" style={{ color:"white", fontSize:"1.4rem", fontWeight:800, marginBottom:16 }}>+{weekUsers.reduce((a,b)=>a+b,0)}</p>
          <ResponsiveContainer width="100%" height={160}>
            <RBarChart data={days.map((d,i)=>({ day:d, value:weekUsers[i] }))} margin={{ top:5, right:5, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12}/>
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false}/>
              <RTooltip contentStyle={{ background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white" }}/>
              <Bar dataKey="value" fill="#38bdf8" radius={[4,4,0,0]}/>
            </RBarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Hint revenue, last 7 days (₦)</p>
          <p className="syne" style={{ color:"white", fontSize:"1.4rem", fontWeight:800, marginBottom:16 }}>₦{weekRevenue.reduce((a,b)=>a+b,0).toLocaleString()}</p>
          <ResponsiveContainer width="100%" height={160}>
            <RBarChart data={days.map((d,i)=>({ day:d, value:weekRevenue[i] }))} margin={{ top:5, right:5, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12}/>
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false}/>
              <RTooltip contentStyle={{ background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white" }} formatter={(v)=>`₦${v.toLocaleString()}`}/>
              <Bar dataKey="value" fill="#ff5c3a" radius={[4,4,0,0]}/>
            </RBarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18, fontSize:"0.95rem" }}>Recent activity</p>
        {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}
        {!loading && recentActivity.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No activity yet.</p>}
        {recentActivity.map((a,i) => (
          <div key={i} className="row-hover" style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 8px", borderRadius:10, transition:"background 0.15s" }}>
            <Avatar size={34} bg={AVATAR_COLORS[i%AVATAR_COLORS.length]}/>
            <div style={{ flex:1 }}>
              <span style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{a.user}</span>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem" }}> · {a.action}</span>
            </div>
            <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.75rem", whiteSpace:"nowrap" }}>{a.time}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};
// ─── REVENUE ──────────────────────────────────────────────────────────────────
const Revenue = () => {
  const [range, setRange] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [hintTx, setHintTx] = useState([]);
  const [depositTx, setDepositTx] = useState([]);
  const [withdrawalTx, setWithdrawalTx] = useState([]);
  const [recentTx, setRecentTx] = useState([]);

  useEffect(() => { fetchRevenue(); }, []);

  const fetchRevenue = async () => {
    setLoading(true);
    const [{ data: hints }, { data: deposits }, { data: withdrawals }] = await Promise.all([
      supabase.from("transactions").select("amount, created_at, reference").eq("type","hint_purchase").eq("status","completed"),
      supabase.from("transactions").select("amount, created_at").eq("type","deposit").eq("status","completed"),
      supabase.from("transactions").select("amount, created_at").eq("type","withdrawal").eq("status","completed"),
    ]);
    setHintTx(hints || []);
    setDepositTx(deposits || []);
    setWithdrawalTx(withdrawals || []);

    const { data: recent } = await supabase
      .from("transactions")
      .select("id, user_id, type, amount, status, created_at, reference")
      .in("type", ["hint_purchase","deposit","withdrawal"])
      .order("created_at", { ascending:false })
      .limit(8);
    const userIds = [...new Set((recent||[]).map(t=>t.user_id))];
    const { data: profilesData } = userIds.length ? await supabase.from("profiles").select("id, username").in("id", userIds) : { data: [] };
    const usernameById = Object.fromEntries((profilesData||[]).map(p=>[p.id,p.username]));
    setRecentTx((recent||[]).map(t => ({
      type: t.type === "hint_purchase" ? "Hint purchase" : t.type === "deposit" ? "Wallet top-up" : "Withdrawal",
      user: `@${usernameById[t.user_id]||"unknown"}`,
      amount: `₦${Number(t.amount).toLocaleString()}`,
      unmaskr: t.type === "hint_purchase" ? `₦${hintProfit(t).toLocaleString()}` : "₦0",
      time: timeAgo(t.created_at),
    })));

    setLoading(false);
  };

  // NOTE: hint purchases are the ONLY source of platform revenue. Quiz Clash
  // is entirely free to play — no stakes, no pot, no money moves through it at
  // all — so it never appears anywhere in these revenue figures.
  //
  // Your real cut of a hint sale depends on whether the sender actually got
  // paid their 50% — tagged on the transaction as `reference`. No sender
  // match (no account, or no email given) means you kept the full 100%, not
  // 50%. Older rows from before this fix have no tag at all; those fall back
  // to the old 50% assumption since there's no way to know after the fact.
  const hintProfit = (t) => t.reference === "sender_unpaid" ? Number(t.amount) : Number(t.amount) * 0.5;
  const hintTotal = hintTx.reduce((s,t)=>s+Number(t.amount),0);
  const profit = hintTx.reduce((s,t)=>s+hintProfit(t),0);
  const fullMarginCount = hintTx.filter(t=>t.reference==="sender_unpaid").length;
  const depositTotal = depositTx.reduce((s,t)=>s+Number(t.amount),0);
  const withdrawalTotal = withdrawalTx.reduce((s,t)=>s+Number(t.amount),0);

  const todayStr = new Date().toDateString();
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const profitToday = hintTx.filter(t=>new Date(t.created_at).toDateString()===todayStr).reduce((s,t)=>s+hintProfit(t),0);
  const profitThisMonth = hintTx.filter(t=>{const d=new Date(t.created_at); return d.getMonth()===thisMonth && d.getFullYear()===thisYear;}).reduce((s,t)=>s+hintProfit(t),0);

  const bucketed = (() => {
    if (range === "hourly") {
      const labels = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];
      const data = labels.map((_,h) => hintTx.filter(t=>{const d=new Date(t.created_at); return d.toDateString()===todayStr && d.getHours()===h;}).reduce((s,t)=>s+hintProfit(t),0));
      return { data, labels };
    }
    if (range === "daily") {
      const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      const buckets = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toDateString(); });
      return { data: buckets.map(dStr=>hintTx.filter(t=>new Date(t.created_at).toDateString()===dStr).reduce((s,t)=>s+hintProfit(t),0)), labels: days };
    }
    if (range === "monthly") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const data = months.map((_,m)=>hintTx.filter(t=>{const d=new Date(t.created_at); return d.getMonth()===m && d.getFullYear()===thisYear;}).reduce((s,t)=>s+hintProfit(t),0));
      return { data, labels: months };
    }
    if (range === "yearly") {
      const years = [thisYear-3, thisYear-2, thisYear-1, thisYear];
      const data = years.map(y=>hintTx.filter(t=>new Date(t.created_at).getFullYear()===y).reduce((s,t)=>s+hintProfit(t),0));
      return { data, labels: years.map(String) };
    }
    const buckets = [...Array(8)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(7-i)*7); return d; });
    const data = buckets.map((start)=>{
      const end = new Date(start); end.setDate(end.getDate()+7);
      return hintTx.filter(t=>{const d=new Date(t.created_at); return d>=start && d<end;}).reduce((s,t)=>s+hintProfit(t),0);
    });
    return { data, labels: data.map((_,i)=>`W${i+1}`) };
  })();

  const chartTotal = bucketed.data.reduce((a,b)=>a+b,0);
  const rangeChangeLabel = { hourly:"today, by hour", daily:"last 7 days", weekly:"last 8 weeks", monthly:`${thisYear}, by month`, yearly:"last 4 years" }[range];

  const profitSources = [
    { source:"Hint purchases — Unmaskr's 50% cut", amount:`₦${profit.toLocaleString()}`, percent:100, color:"#ff5c3a" },
  ];
  const moneyMovedOnly = [
    { source:"Wallet top-ups (not profit — goes to user wallets)", amount:`₦${depositTotal.toLocaleString()}`, color:"#38bdf8" },
    { source:"Withdrawals paid out (not profit — leaves the platform)", amount:`₦${withdrawalTotal.toLocaleString()}`, color:"#a855f7" },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.money s={20} c="#22c55e"/>} label="Your profit (all time)" value={`₦${profit.toLocaleString()}`} color="#22c55e"/>
        <StatCard icon={<Icons.calendar s={20} c="#ffcd3c"/>} label="Profit this month" value={`₦${profitThisMonth.toLocaleString()}`} color="#ffcd3c"/>
        <StatCard icon={<Icons.calendar s={20} c="#22c55e"/>} label="Profit today" value={`₦${profitToday.toLocaleString()}`} color="#22c55e"/>
        <StatCard icon={<Icons.refresh s={20} c="#38bdf8"/>} label="Total money moved" value={`₦${(hintTotal+depositTotal+withdrawalTotal).toLocaleString()}`} color="#38bdf8"/>
      </div>
      {fullMarginCount > 0 && (
        <p style={{ color:"rgba(34,197,94,0.8)", fontSize:"0.78rem", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
          <Icons.money s={13} c="#22c55e"/>{fullMarginCount} of these sale{fullMarginCount===1?"":"s"} had no account to pay on the sender's side — you kept 100% on those, not 50%.
        </p>
      )}
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginBottom:24, marginTop:-10 }}>
        Profit shown here counts hint purchases only — the only feature that moves money.
      </p>

      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:18 }}>
          <div>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:4 }}>Profit over time</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem" }}>{rangeChangeLabel}</p>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["hourly","daily","weekly","monthly","yearly"].map(r => (
              <button key={r} onClick={()=>setRange(r)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${range===r?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:range===r?"rgba(255,92,58,0.15)":"transparent", color:range===r?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.75rem", fontWeight:500, textTransform:"capitalize" }}>{r}</button>
            ))}
          </div>
        </div>
        <p className="syne" style={{ color:"white", fontSize:"1.4rem", fontWeight:800, marginBottom:16 }}>₦{chartTotal.toLocaleString()}</p>
        <ResponsiveContainer width="100%" height={220}>
          <RBarChart data={bucketed.labels.map((l,i)=>({ label:l, value:bucketed.data[i] }))} margin={{ top:5, right:5, left:-20, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11}/>
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false}/>
            <RTooltip contentStyle={{ background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white" }} formatter={(v)=>`₦${v.toLocaleString()}`}/>
            <Bar dataKey="value" fill="#ff5c3a" radius={[4,4,0,0]}/>
          </RBarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginBottom:20 }}>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:4 }}>Profit sources</p>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:18 }}>Money Unmaskr actually keeps</p>
        {profitSources.map(b => (
          <div key={b.source} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem" }}>{b.source}</span>
              <span style={{ color:"white", fontSize:"0.85rem", fontWeight:600 }}>{b.amount}</span>
            </div>
            <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:3 }}>
              <div style={{ height:"100%", width:`${b.percent}%`, background:b.color, borderRadius:3, transition:"width 0.5s" }}/>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom:20 }}>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:4 }}>Other money moved</p>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:18 }}>Passes through the platform — not your profit</p>
        {moneyMovedOnly.map(m => (
          <div key={m.source} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.83rem" }}>{m.source}</span>
            <span style={{ color:"white", fontSize:"0.85rem", fontWeight:600 }}>{m.amount}</span>
          </div>
        ))}
      </Card>

      <ProfitSweepLog totalProfit={profit}/>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent transactions</p>
        {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}
        {!loading && recentTx.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No transactions yet.</p>}
        {recentTx.map((t,i) => (
          <div key={i} className="row-hover" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 8px", borderRadius:10, borderBottom:i<recentTx.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <div style={{ flex:1 }}>
              <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{t.type}</p>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem" }}>{t.user} · {t.time}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ color:"white", fontSize:"0.85rem", fontWeight:600 }}>{t.amount}</p>
              <p style={{ color:"#22c55e", fontSize:"0.72rem" }}>Your profit: {t.unmaskr}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── PROFIT SWEEP LOG ─────────────────────────────────────────────────────────
const ProfitSweepLog = ({ totalProfit }) => {
  const [sweeps, setSweeps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSweeps(); }, []);

  const fetchSweeps = async () => {
    setLoading(true);
    const { data } = await supabase.from("profit_sweeps").select("*").order("created_at", { ascending:false });
    setSweeps((data||[]).map(s => ({
      amount: Number(s.amount),
      note: s.note || "Profit sweep",
      date: new Date(s.created_at).toLocaleDateString("en-NG",{month:"short",day:"numeric",year:"numeric"}),
    })));
    setLoading(false);
  };

  const totalSwept = sweeps.reduce((s,x)=>s+x.amount,0);
  const stillInPaystack = totalProfit - totalSwept;

  const logSweep = async () => {
    if(!amount || saving) return;
    setSaving(true);
    const { error } = await supabase.from("profit_sweeps").insert({ amount:Number(amount), note: note || "Profit sweep" });
    setSaving(false);
    if (!error) { setAmount(""); setNote(""); fetchSweeps(); }
  };

  return (
    <Card style={{ marginBottom:20 }}>
      <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:4 }}>Profit swept to bank</p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:18 }}>Log it here whenever you move profit from Paystack into your own account — keeps this dashboard accurate</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:"14px 16px" }}>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Still in Paystack</p>
          <p className="syne" style={{ color:"#38bdf8", fontSize:"1.3rem", fontWeight:800 }}>₦{stillInPaystack.toLocaleString()}</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:"14px 16px" }}>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Already swept out</p>
          <p className="syne" style={{ color:"#22c55e", fontSize:"1.3rem", fontWeight:800 }}>₦{totalSwept.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <input type="number" placeholder="Amount (₦)" value={amount} onChange={e=>setAmount(e.target.value)} style={{ width:140, padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", outline:"none", fontSize:"0.85rem", fontFamily:"'DM Sans',sans-serif" }}/>
        <input placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} style={{ flex:1, minWidth:160, padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", outline:"none", fontSize:"0.85rem", fontFamily:"'DM Sans',sans-serif" }}/>
        <button onClick={logSweep} disabled={!amount||saving} style={{ padding:"10px 18px", borderRadius:10, border:"none", background:amount?"#ff5c3a":"#333", color:"white", cursor:(amount&&!saving)?"pointer":"not-allowed", fontSize:"0.85rem", fontWeight:600 }}>{saving?"Logging...":"Log sweep"}</button>
      </div>

      {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}
      {!loading && sweeps.length===0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No sweeps logged yet.</p>}
      {sweeps.map((s,i) => (
        <div key={i} className="row-hover" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 8px", borderRadius:8, borderBottom:i<sweeps.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
          <div>
            <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>₦{s.amount.toLocaleString()}</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem" }}>{s.note} · {s.date}</p>
          </div>
        </div>
      ))}
    </Card>
  );
};
// ─── USERS ────────────────────────────────────────────────────────────────────
const Users = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newToday, setNewToday] = useState(0);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profilesData, error } = await supabase
      .from("profiles")
      .select("id, name, username, created_at, status")
      .order("created_at", { ascending: false });

    if (error || !profilesData) { setLoading(false); return; }

    const enriched = await Promise.all(profilesData.map(async (u) => {
      const { count: messageCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", u.id);

      const { data: spentRows } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", u.id)
        .eq("type", "hint_purchase")
        .eq("status", "completed");

      const { data: earnedRows } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", u.id)
        .eq("type", "hint_earning")
        .eq("status", "completed");

      const spent = (spentRows || []).reduce((s, r) => s + Number(r.amount), 0);
      const earned = (earnedRows || []).reduce((s, r) => s + Number(r.amount), 0);

      return {
        id: u.id,
        name: u.name || u.username || "Unnamed",
        username: u.username || "",
        joined: new Date(u.created_at).toLocaleDateString("en-NG", { month:"short", day:"numeric", year:"numeric" }),
        messages: messageCount || 0,
        spent: `₦${spent.toLocaleString()}`,
        earned: `₦${earned.toLocaleString()}`,
        status: u.status || "active",
      };
    }));

    setUsers(enriched);
    const today = new Date().toDateString();
    setNewToday(profilesData.filter(u => new Date(u.created_at).toDateString() === today).length);
    setLoading(false);
  };

  const toggleSuspend = async (user) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", user.id);
    if (!error) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
  };

  const filtered = users.filter(u =>
    (filter==="all" || u.status===filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const suspendedCount = users.filter(u => u.status === "suspended").length;
  const statusColor = { active:"#22c55e", inactive:"#888", suspended:"#ef4444" };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.users s={20} c="#38bdf8"/>} label="Total users" value={users.length.toLocaleString()} color="#38bdf8"/>
        <StatCard icon={<Icons.plusCirc s={20} c="#ffcd3c"/>} label="New today" value={String(newToday)} color="#ffcd3c"/>
        <StatCard icon={<Icons.ban s={20} c="#ef4444"/>} label="Suspended" value={String(suspendedCount)} color="#ef4444"/>
      </div>

      <Card>
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..." style={{ flex:1, minWidth:180, padding:"10px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", outline:"none", fontSize:"0.88rem", fontFamily:"'DM Sans',sans-serif" }}/>
          <div style={{ display:"flex", gap:6 }}>
            {["all","active","inactive","suspended"].map(f => (
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${filter===f?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:filter===f?"rgba(255,92,58,0.15)":"transparent", color:filter===f?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.78rem", fontWeight:500, textTransform:"capitalize" }}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color:"rgba(255,255,255,0.3)", padding:"20px 8px", fontSize:"0.85rem" }}>Loading users...</p>
        ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["User","Joined","Messages","Spent","Earned","Status","Action"].map(h => (
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:"0.72rem", fontWeight:600, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.08em", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u,i) => (
                <tr key={u.id} className="row-hover" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", transition:"background 0.15s" }}>
                  <td style={{ padding:"12px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar size={28} bg={AVATAR_COLORS[i%AVATAR_COLORS.length]}/>
                      <div>
                        <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{u.name}</p>
                        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem" }}>@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px", color:"rgba(255,255,255,0.4)", fontSize:"0.82rem", whiteSpace:"nowrap" }}>{u.joined}</td>
                  <td style={{ padding:"12px", color:"white", fontSize:"0.85rem", fontWeight:500 }}>{u.messages}</td>
                  <td style={{ padding:"12px", color:"#ef4444", fontSize:"0.85rem" }}>{u.spent}</td>
                  <td style={{ padding:"12px", color:"#22c55e", fontSize:"0.85rem" }}>{u.earned}</td>
                  <td style={{ padding:"12px" }}><Badge text={u.status} color={statusColor[u.status]}/></td>
                  <td style={{ padding:"12px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>toggleSuspend(u)} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${u.status==="suspended"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`, background:u.status==="suspended"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", color:u.status==="suspended"?"#22c55e":"#ef4444", cursor:"pointer", fontSize:"0.75rem" }}>{u.status==="suspended"?"Unsuspend":"Suspend"}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding:"20px 12px", color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
const Messages = () => {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, recipient_id, text, hints_unlocked, flagged, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data) { setLoading(false); return; }

    const recipientIds = [...new Set(data.map(m => m.recipient_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", recipientIds);
    const usernameById = Object.fromEntries((profilesData || []).map(p => [p.id, p.username]));

    setMsgs(data.map(m => ({
      id: m.id,
      to: `@${usernameById[m.recipient_id] || "unknown"}`,
      preview: m.text,
      time: timeAgo(m.created_at),
      hints: (m.hints_unlocked || []).length,
      flagged: !!m.flagged,
    })));
    setLoading(false);
  };

  const deleteMessage = async (msg) => {
    const { error } = await supabase.from("messages").delete().eq("id", msg.id);
    if (!error) setMsgs(prev => prev.filter(m => m.id !== msg.id));
  };

  const flaggedCount = msgs.filter(m => m.flagged).length;
  const visible = showFlaggedOnly ? msgs.filter(m => m.flagged) : msgs;
  const hintsTotal = msgs.reduce((s, m) => s + m.hints, 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.chat s={20} c="#a855f7"/>} label="Total messages" value={msgs.length.toLocaleString()} color="#a855f7"/>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Hints unlocked" value={String(hintsTotal)} color="#ffcd3c"/>
        <StatCard icon={<Icons.flag s={20} c="#ef4444"/>} label="Flagged" value={String(flaggedCount)} color="#ef4444"/>
      </div>

      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <p className="syne" style={{ color:"white", fontWeight:700 }}>All messages</p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setShowFlaggedOnly(false)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}><Badge text="All" color={showFlaggedOnly?"#888":"#ff5c3a"}/></button>
            <button onClick={()=>setShowFlaggedOnly(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}><Badge text={`Flagged (${flaggedCount})`} color="#ef4444" icon={<Icons.flag s={11} c="#ef4444"/>}/></button>
          </div>
        </div>
        {loading && <p style={{ color:"rgba(255,255,255,0.3)", padding:"20px 8px", fontSize:"0.85rem" }}>Loading messages...</p>}
        {!loading && visible.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", padding:"20px 8px", fontSize:"0.85rem" }}>No messages found.</p>}
        {visible.map((m,i) => (
          <div key={m.id} className="row-hover" style={{ display:"flex", gap:12, padding:"14px 10px", borderRadius:10, borderBottom:i<visible.length-1?"1px solid rgba(255,255,255,0.05)":"none", alignItems:"center", transition:"background 0.15s" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><MaskIcon size={16} color="rgba(255,255,255,0.5)"/></div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem" }}>To</span>
                <span style={{ color:"white", fontSize:"0.82rem", fontWeight:500 }}>{m.to}</span>
                {m.flagged && <Badge text="Flagged" color="#ef4444" icon={<Icons.flag s={11} c="#ef4444"/>}/>}
                {m.hints > 0 && <Badge text={`${m.hints} hints`} color="#ffcd3c" icon={<MaskIcon size={11} color="#ffcd3c"/>}/>}
              </div>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.83rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.preview}</p>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem" }}>{m.time}</span>
              {m.flagged && <button onClick={()=>deleteMessage(m)} style={{ padding:"5px 10px", borderRadius:6, border:"none", background:"#ef4444", color:"white", cursor:"pointer", fontSize:"0.72rem", fontWeight:600 }}>Delete</button>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── HINTS ────────────────────────────────────────────────────────────────────
const Hints = () => {
  const [loading, setLoading] = useState(true);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [unmaskrShare, setUnmaskrShare] = useState(0);
  const [paidToUsers, setPaidToUsers] = useState(0);
  const [weekData, setWeekData] = useState([]);

  useEffect(() => { fetchHints(); }, []);

  const fetchHints = async () => {
    setLoading(true);
    const [{ data }, { data: earnings }] = await Promise.all([
      supabase.from("transactions").select("amount, created_at, reference").eq("type", "hint_purchase").eq("status", "completed"),
      // "Paid to users" is now the REAL total of what senders actually
      // received, not an assumed 50% — see hint_earning, created only when
      // a sender's account was actually found and credited.
      supabase.from("transactions").select("amount").eq("type", "hint_earning").eq("status", "completed"),
    ]);

    const rows = data || [];
    setTotalSold(rows.length);
    setTotalRevenue(rows.reduce((s,t)=>s+Number(t.amount),0));
    // Your real cut per sale: 100% when no sender account was found to pay
    // (tagged "sender_unpaid"), 50% otherwise — same logic as Revenue.
    // Rows from before this tagging existed fall back to the old 50% assumption.
    setUnmaskrShare(rows.reduce((s,t)=>s+(t.reference==="sender_unpaid"?Number(t.amount):Number(t.amount)*0.5),0));
    setPaidToUsers((earnings||[]).reduce((s,t)=>s+Number(t.amount),0));

    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const buckets = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
    setWeekData(buckets.map((d,i) => ({
      day: days[i],
      hints: rows.filter(t=>new Date(t.created_at).toDateString()===d.toDateString()).length,
    })));
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Total hints sold" value={totalSold.toLocaleString()} color="#ffcd3c"/>
        <StatCard icon={<Icons.money s={20} c="#ff5c3a"/>} label="Total hint revenue" value={`₦${totalRevenue.toLocaleString()}`} color="#ff5c3a"/>
        <StatCard icon={<Icons.bank s={20} c="#22c55e"/>} label="Unmaskr earned" value={`₦${unmaskrShare.toLocaleString()}`} color="#22c55e"/>
        <StatCard icon={<Icons.user s={20} c="#38bdf8"/>} label="Paid to users" value={`₦${paidToUsers.toLocaleString()}`} color="#38bdf8"/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginBottom:24, marginTop:-10 }}>
        Shown as one combined total — there's no column tracking which specific tier (1/2/3) each purchase was, so a per-tier breakdown isn't possible without adding one. Purchases here are only ever logged when the sender actually specified the info behind the hint — unspecified hints are shown to users for free and never create a transaction.
      </p>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:6 }}>Hint sales, last 7 days</p>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.82rem", marginBottom:18 }}>Daily breakdown</p>
        {loading ? <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p> : (
        <ResponsiveContainer width="100%" height={220}>
          <RBarChart data={weekData} margin={{ top:5, right:5, left:-20, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12}/>
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false}/>
            <RTooltip contentStyle={{ background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"white" }}/>
            <Bar dataKey="hints" fill="#ffcd3c" radius={[4,4,0,0]}/>
          </RBarChart>
        </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};
// ─── GAMES ────────────────────────────────────────────────────────────────────
const GamesAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [playersBySession, setPlayersBySession] = useState({});
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  useEffect(() => { fetchGames(); }, []);

  const fetchGames = async () => {
    setLoading(true);
    const { data: sessionsData } = await supabase
      .from("game_sessions")
      .select("id, game_type, status, host_name, created_at")
      .order("created_at", { ascending: false });
    const rows = sessionsData || [];
    setSessions(rows);

    const { data: playersData } = await supabase.from("game_players").select("session_id, display_name, score");
    const grouped = {};
    (playersData || []).forEach(p => { (grouped[p.session_id] = grouped[p.session_id] || []).push(p); });
    setPlayersBySession(grouped);
    setLoading(false);
  };

  const finished = sessions.filter(s => s.status === "finished");
  const mysteryFinished = finished.filter(s => s.game_type === "mystery_lobby");
  // NOTE: game_type is still "stake_win" in the database — renaming a column/value
  // isn't needed for the product rename, since this is purely an internal label.
  const quizFinished = finished.filter(s => s.game_type === "stake_win");
  const totalPlayed = mysteryFinished.length + quizFinished.length;

  const buckets = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toDateString(); });
  const mysteryWeek = buckets.map(dStr => mysteryFinished.filter(s => new Date(s.created_at).toDateString() === dStr).length);
  const quizWeek = buckets.map(dStr => quizFinished.filter(s => new Date(s.created_at).toDateString() === dStr).length);

  const recentQuiz = quizFinished.slice(0, 6).map(s => {
    const ps = playersBySession[s.id] || [];
    const top = Math.max(0, ...ps.map(p => p.score || 0));
    const winners = ps.filter(p => (p.score || 0) === top && top > 0);
    return {
      players: ps.map(p => p.display_name).join(", ") || "—",
      winner: winners.length > 1 ? "Tie" : (winners[0]?.display_name || "—"),
      time: timeAgo(s.created_at),
    };
  });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.gamepad s={20} c="#22c55e"/>} label="Games played" value={totalPlayed.toLocaleString()} color="#22c55e"/>
        <StatCard icon={<MaskIcon size={20} color="#a855f7"/>} label="Mystery Lobby" value={mysteryFinished.length.toLocaleString()} color="#a855f7"/>
        <StatCard icon={<Icons.trophy s={20} c="#ffcd3c"/>} label="Quiz Clash" value={quizFinished.length.toLocaleString()} color="#ffcd3c"/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginBottom:24, marginTop:-10 }}>
        Quiz Clash is free to play — no stakes, no pot, nothing here ever counts toward revenue.
      </p>
      {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", marginBottom:20 }}>Loading games...</p>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Mystery Lobby games, last 7 days</p>
          <BarChart data={mysteryWeek} labels={days} color="#a855f7" height={90}/>
        </Card>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Quiz Clash games, last 7 days</p>
          <BarChart data={quizWeek} labels={days} color="#ffcd3c" height={90}/>
        </Card>
      </div>
      <Card style={{ marginTop:14 }}>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent Quiz Clash games</p>
        {!loading && recentQuiz.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No finished Quiz Clash games yet.</p>}
        {recentQuiz.map((g,i) => (
          <div key={i} className="row-hover" style={{ padding:"14px 10px", borderRadius:10, borderBottom:i<recentQuiz.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>Winner: {g.winner}</span>
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.75rem" }}>{g.time}</span>
            </div>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem" }}>Players: {g.players}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};
// ─── DEPOSITS ─────────────────────────────────────────────────────────────────
// Confirming a deposit now goes through admin_confirm_deposit() in the database
// (see wallet-security.sql) instead of a raw read-then-write from the browser.
// That function checks the caller is actually an admin, checks the deposit is
// still pending (so double-tapping Confirm can't double-credit the wallet), and
// credits the wallet as one atomic step — all inside the database itself.
const Deposits = () => {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [justConfirmed, setJustConfirmed] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => { fetchDeposits(); }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, user_id, amount, reference, status, created_at")
      .eq("type", "deposit")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(t => t.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, username, email")
      .in("id", userIds);
    const profileById = Object.fromEntries((profilesData || []).map(p => [p.id, p]));

    const rows = data.map(t => ({
      id: t.id,
      userId: t.user_id,
      user: `@${profileById[t.user_id]?.username || "unknown"}`,
      name: profileById[t.user_id]?.name || "Unknown",
      email: profileById[t.user_id]?.email || null,
      method: "Bank transfer",
      reference: t.reference || "—",
      amount: `₦${Number(t.amount).toLocaleString()}`,
      rawAmount: Number(t.amount),
      requested: exactTime(t.created_at),
      date: new Date(t.created_at).toLocaleDateString("en-NG", { month:"short", day:"numeric" }),
      status: t.status,
    }));

    setPending(rows.filter(r => r.status === "pending"));
    setCompleted(rows.filter(r => r.status === "completed"));
    setLoading(false);
  };

  const confirmDeposit = async (dep) => {
    setConfirmingId(dep.id);
    setActionError("");
    const { error } = await supabase.rpc("admin_confirm_deposit", { p_transaction_id: dep.id });
    if (error) {
      setConfirmingId(null);
      setActionError(error.message?.includes("not_found_or_already_processed") ? "This deposit was already handled — refresh to see its current state." : "Couldn't confirm this deposit — please try again.");
      return;
    }

    if (dep.email) {
      await supabase.functions.invoke("send-email", {
        body: {
          to: dep.email,
          toName: dep.name,
          subject: "Your deposit has been confirmed",
          htmlContent: `<p>Hi ${dep.name},</p><p>Your deposit of ${dep.amount} has been confirmed and added to your Unmaskr wallet.</p>`
        }
      });
    }

    setPending(p => p.filter(x => x.id !== dep.id));
    setCompleted(c => [{ ...dep, status:"completed", date:"Just now" }, ...c]);
    setConfirmingId(null);
    setJustConfirmed(dep.id);
    setTimeout(() => setJustConfirmed(null), 2500);
  };

  const rejectDeposit = async (dep) => {
    setActionError("");
    const { error } = await supabase.rpc("admin_reject_deposit", { p_transaction_id: dep.id });
    if (error) {
      setActionError(error.message?.includes("not_found_or_already_processed") ? "This deposit was already handled — refresh to see its current state." : "Couldn't reject this deposit — please try again.");
      return;
    }
    setPending(p => p.filter(x => x.id !== dep.id));
  };

  const pendingTotal = pending.reduce((s,d) => s + d.rawAmount, 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.clock s={20} c="#ffcd3c"/>} label="Pending" value={`₦${pendingTotal.toLocaleString()}`} color="#ffcd3c"/>
        <StatCard icon={<Icons.hash s={20} c="#a855f7"/>} label="Pending requests" value={String(pending.length)} color="#a855f7"/>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["pending","completed"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${tab===t?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:tab===t?"rgba(255,92,58,0.15)":"transparent", color:tab===t?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.83rem", fontWeight:500, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      <Card>
        {loading && <p style={{ color:"rgba(255,255,255,0.3)", padding:"20px 8px", fontSize:"0.85rem" }}>Loading deposits...</p>}
        {actionError && <p style={{ color:"#ef4444", fontSize:"0.82rem", marginBottom:14 }}>{actionError}</p>}
        {!loading && tab === "pending" ? (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:6 }}>Pending deposits ({pending.length})</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.78rem", marginBottom:18 }}>Verify the transfer landed in your business account before confirming — this credits the user's wallet and emails them.</p>
            {pending.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", padding:"20px 8px" }}>No pending deposits.</p>}
            {pending.map((d,i) => (
              <div key={d.id} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<pending.length-1?"1px solid rgba(255,255,255,0.05)":"none", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{d.name} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>{d.user}</span></p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginTop:2 }}>{d.method} · Ref: {d.reference} · {d.requested}</p>
                </div>
                <span className="syne" style={{ color:"white", fontWeight:700, fontSize:"1rem" }}>{d.amount}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {justConfirmed === d.id ? (
                    <span style={{ color:"#22c55e", fontSize:"0.78rem", display:"flex", alignItems:"center", gap:5 }}><Icons.check s={12} c="#22c55e"/>Confirmed & emailed</span>
                  ) : (
                    <>
                      <button onClick={()=>confirmDeposit(d)} disabled={confirmingId===d.id} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#22c55e", color:"white", cursor:confirmingId===d.id?"default":"pointer", fontSize:"0.78rem", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, opacity:confirmingId===d.id?0.6:1 }}>
                        <Icons.check s={12} c="white"/>{confirmingId===d.id?"Confirming...":"Confirm"}
                      </button>
                      <button onClick={()=>rejectDeposit(d)} disabled={confirmingId===d.id} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:"0.78rem" }}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : !loading && (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Completed deposits</p>
            {completed.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", padding:"20px 8px" }}>No completed deposits yet.</p>}
            {completed.map((d,i) => (
              <div key={d.id} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<completed.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                <div style={{ flex:1 }}>
                  <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{d.name} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>{d.user}</span></p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginTop:2 }}>{d.date}</p>
                </div>
                <span className="syne" style={{ color:"#22c55e", fontWeight:700 }}>{d.amount}</span>
                <Badge text="Confirmed" color="#22c55e" icon={<Icons.check s={10} c="#22c55e"/>}/>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
};

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────
// Paying and rejecting now go through admin_pay_withdrawal() / admin_reject_withdrawal()
// in the database. The user's wallet was already debited the moment they requested
// the withdrawal (see request_withdrawal() in wallet-security.sql) — Pay here just
// flips the status once, and Reject refunds the held amount back automatically.
const Withdrawals = () => {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => { fetchWithdrawals(); }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, user_id, amount, bank_name, account_number, status, created_at")
      .eq("type", "withdrawal")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(t => t.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, username, email")
      .in("id", userIds);
    const profileById = Object.fromEntries((profilesData || []).map(p => [p.id, p]));

    const rows = data.map(t => ({
      id: t.id,
      userId: t.user_id,
      user: `@${profileById[t.user_id]?.username || "unknown"}`,
      name: profileById[t.user_id]?.name || "Unknown",
      email: profileById[t.user_id]?.email || null,
      bank: t.bank_name || "—",
      account: t.account_number || "—",
      amount: `₦${Number(t.amount).toLocaleString()}`,
      requested: exactTime(t.created_at),
      date: new Date(t.created_at).toLocaleDateString("en-NG", { month:"short", day:"numeric" }),
      status: t.status,
    }));

    setPending(rows.filter(r => r.status === "pending"));
    setCompleted(rows.filter(r => r.status === "completed"));
    setLoading(false);
  };

  const payWithdrawal = async (w) => {
    setPayingId(w.id);
    setActionError("");
    const { error } = await supabase.rpc("admin_pay_withdrawal", { p_transaction_id: w.id });
    if (error) {
      setPayingId(null);
      setActionError(error.message?.includes("not_found_or_already_processed") ? "This withdrawal was already handled — refresh to see its current state." : "Couldn't mark this as paid — please try again.");
      return;
    }
    if (w.email) {
      await supabase.functions.invoke("send-email", {
        body: {
          to: w.email,
          toName: w.name,
          subject: "Your withdrawal has been paid",
          htmlContent: `<p>Hi ${w.name},</p><p>Your withdrawal of ${w.amount} has been sent to your ${w.bank} account ending in ${w.account.slice(-4)}.</p>`
        }
      });
    }
    setPending(p => p.filter(x => x.id !== w.id));
    setCompleted(c => [{ ...w, status:"completed", date:"Just now" }, ...c]);
    setPayingId(null);
  };

  const rejectWithdrawal = async (w) => {
    setActionError("");
    const { error } = await supabase.rpc("admin_reject_withdrawal", { p_transaction_id: w.id });
    if (error) {
      setActionError(error.message?.includes("not_found_or_already_processed") ? "This withdrawal was already handled — refresh to see its current state." : "Couldn't reject this withdrawal — please try again.");
      return;
    }
    setPending(p => p.filter(x => x.id !== w.id));
  };

  const pendingTotal = pending.reduce((s,w) => s + Number(w.amount.replace(/[₦,]/g,"")), 0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.clock s={20} c="#ffcd3c"/>} label="Pending" value={`₦${pendingTotal.toLocaleString()}`} color="#ffcd3c"/>
        <StatCard icon={<Icons.hash s={20} c="#a855f7"/>} label="Pending requests" value={String(pending.length)} color="#a855f7"/>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["pending","completed"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${tab===t?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:tab===t?"rgba(255,92,58,0.15)":"transparent", color:tab===t?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.83rem", fontWeight:500, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      <Card>
        {loading && <p style={{ color:"rgba(255,255,255,0.3)", padding:"20px 8px", fontSize:"0.85rem" }}>Loading withdrawals...</p>}
        {actionError && <p style={{ color:"#ef4444", fontSize:"0.82rem", marginBottom:14 }}>{actionError}</p>}
        {!loading && tab === "pending" ? (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Pending withdrawals ({pending.length})</p>
            {pending.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", padding:"20px 8px" }}>No pending withdrawals.</p>}
            {pending.map((w,i) => (
              <div key={w.id} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<pending.length-1?"1px solid rgba(255,255,255,0.05)":"none", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{w.name} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>{w.user}</span></p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginTop:2 }}>{w.bank} · {w.account} · {w.requested}</p>
                </div>
                <span className="syne" style={{ color:"white", fontWeight:700, fontSize:"1rem" }}>{w.amount}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>payWithdrawal(w)} disabled={payingId===w.id} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#22c55e", color:"white", cursor:payingId===w.id?"default":"pointer", fontSize:"0.78rem", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, opacity:payingId===w.id?0.6:1 }}><Icons.check s={12} c="white"/>{payingId===w.id?"Paying...":"Pay"}</button>
                  <button onClick={()=>rejectWithdrawal(w)} disabled={payingId===w.id} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:"0.78rem" }}>Reject</button>
                </div>
              </div>
            ))}
          </>
        ) : !loading && (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Completed withdrawals</p>
            {completed.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", padding:"20px 8px" }}>No completed withdrawals yet.</p>}
            {completed.map((w,i) => (
              <div key={w.id} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<completed.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                <div style={{ flex:1 }}>
                  <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{w.name} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>{w.user}</span></p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginTop:2 }}>{w.bank} · {w.date}</p>
                </div>
                <span className="syne" style={{ color:"#22c55e", fontWeight:700 }}>{w.amount}</span>
                <Badge text="Paid" color="#22c55e" icon={<Icons.check s={10} c="#22c55e"/>}/>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
};
// ─── COMPLAINTS ───────────────────────────────────────────────────────────────
const CANNED_REPLIES = [
  { label:"Fixed — our fault", text:"Hi, thank you for bringing this to our attention. After reviewing your account, we can confirm this was an error on our end and it has now been fixed. We're sorry for the inconvenience caused." },
  { label:"Refunded", text:"We've refunded the amount to your Unmaskr wallet — it should reflect immediately. We're sorry for the inconvenience and appreciate your patience." },
  { label:"Investigating", text:"Thanks for reaching out. We're currently looking into this and will follow up within 24–48 hours." },
  { label:"User error, can't assist", text:"After reviewing the activity on your account, we can see this happened due to [reason]. Unfortunately, we're unable to assist further in this case." },
  { label:"Withdrawal fixed", text:"Your withdrawal has been processed and should now reflect in your account. We apologize for the delay." },
  { label:"Safety escalated", text:"Thank you for reporting this — we take safety seriously. The message has been removed and the account has been flagged for review. Please reach out immediately if you feel unsafe." },
];

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refunded, setRefunded] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [sentConfirm, setSentConfirm] = useState(false);
  const [resolvedConfirm, setResolvedConfirm] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [investigating, setInvestigating] = useState(false);
  const [foundMessages, setFoundMessages] = useState(null);
  const [actionDone, setActionDone] = useState({});

  // This user's own transaction history — what you need to actually trace a
  // money complaint (did a payment really fail? was a hint charged twice?)
  // instead of just taking their word for it before refunding.
  const [userTxns, setUserTxns] = useState(null);
  const [loadingTxns, setLoadingTxns] = useState(false);

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("id, user_id, subject, message, status, priority, created_at")
      .order("created_at", { ascending: false });
    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profilesData } = userIds.length ? await supabase.from("profiles").select("id, name, username, email").in("id", userIds) : { data: [] };
    const profileById = Object.fromEntries((profilesData||[]).map(p=>[p.id,p]));

    setComplaints(data.map(c => ({
      id: c.id,
      userId: c.user_id,
      user: `@${profileById[c.user_id]?.username || "unknown"}`,
      // Full name + exact timestamp, so you can match a report against your
      // Paystack dashboard by who-and-when rather than just a username.
      fullName: profileById[c.user_id]?.name || "Unknown",
      email: profileById[c.user_id]?.email || null,
      subject: c.subject,
      msg: c.message,
      status: c.status,
      priority: c.priority,
      time: timeAgo(c.created_at),
      exactTime: exactTime(c.created_at),
    })));
    setLoading(false);
  };

  const statusColor = { open:"#ef4444", "in progress":"#ffcd3c", resolved:"#22c55e" };
  const priorityColor = { high:"#ef4444", medium:"#ffcd3c", low:"#22c55e" };

  const selectComplaint = c => {
    setSelected(c);
    setReplyText(""); setRefundAmount(""); setRefunded(false); setRefundError("");
    setSentConfirm(false); setResolvedConfirm(false);
    setFoundMessages(null); setFromDate(""); setToDate(""); setActionDone({});
    setComplainantSuspended(false);
    setUserTxns(null);
    fetchUserTxns(c.userId);
  };

  const fetchUserTxns = async (userId) => {
    setLoadingTxns(true);
    const { data } = await supabase
      .from("transactions")
      .select("id, type, amount, currency, status, reference, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);
    setUserTxns(data || []);
    setLoadingTxns(false);
  };

  // Runs through admin_refund_user() in the database — checks the caller is
  // actually an admin, then credits the wallet as one atomic step. No more
  // raw read-then-write against the wallets table from the browser.
  const applyRefund = async () => {
    if (!refundAmount || !selected) return;
    setRefundError("");
    const { error } = await supabase.rpc("admin_refund_user", { p_user_id: selected.userId, p_amount: Number(refundAmount) });
    if (error) { setRefundError("Couldn't apply this refund — please try again."); return; }
    setRefunded(true);
    setReplyText(`We've added ₦${Number(refundAmount).toLocaleString()} to your Unmaskr wallet — it should reflect immediately. We're sorry for the inconvenience and appreciate your patience.`);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    await supabase.from("complaints").update({ status: "in progress" }).eq("id", selected.id);
    if (selected.email) {
      await supabase.functions.invoke("send-email", {
        body: { to: selected.email, toName: selected.user, subject: `Re: ${selected.subject}`, htmlContent: `<p>${replyText}</p>` }
      });
    }
    setComplaints(prev => prev.map(c => c.id === selected.id ? { ...c, status: "in progress" } : c));
    setSentConfirm(true);
    setTimeout(() => setSentConfirm(false), 2500);
  };

  const markResolved = async () => {
    if (!selected) return;
    await supabase.from("complaints").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", selected.id);
    setComplaints(prev => prev.map(c => c.id === selected.id ? { ...c, status: "resolved" } : c));
    setResolvedConfirm(true);
    setTimeout(() => setResolvedConfirm(false), 2500);
  };

  const investigate = async () => {
    if (!selected) return;
    setInvestigating(true);
    let query = supabase
      .from("messages")
      .select("id, text, sender_email, created_at")
      .eq("recipient_id", selected.userId)
      .order("created_at", { ascending: false });
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate + "T23:59:59");
    const { data, error } = await query;
    setFoundMessages(error || !data ? [] : data);
    setInvestigating(false);
  };

  const emailSender = async (msg) => {
    if (!msg.sender_email) return;
    await supabase.functions.invoke("send-email", {
      body: {
        to: msg.sender_email,
        toName: "there",
        subject: "About a message you sent on Unmaskr",
        htmlContent: `<p>Hi,</p><p>We received a complaint about a message sent from this email address on Unmaskr. Please review our community guidelines — further reports may result in account suspension.</p>`
      }
    });
    setActionDone(prev => ({ ...prev, [msg.id]: "emailed" }));
  };

  const suspendSender = async (msg) => {
    if (!msg.sender_email) return;
    const { data: senderProfile } = await supabase.from("profiles").select("id").eq("email", msg.sender_email).maybeSingle();
    if (!senderProfile) { setActionDone(prev => ({ ...prev, [msg.id]: "no-account" })); return; }
    await supabase.from("profiles").update({ status: "suspended" }).eq("id", senderProfile.id);
    setActionDone(prev => ({ ...prev, [msg.id]: "suspended" }));
  };

  const deleteMessage = async (msg) => {
    const { error } = await supabase.from("messages").delete().eq("id", msg.id);
    if (!error) {
      setFoundMessages(prev => prev.filter(m => m.id !== msg.id));
    }
  };

  const [complainantSuspended, setComplainantSuspended] = useState(false);
  const suspendComplainant = async () => {
    if (!selected) return;
    await supabase.from("profiles").update({ status: "suspended" }).eq("id", selected.userId);
    setComplainantSuspended(true);
  };

  const openCount = complaints.filter(c=>c.status==="open").length;
  const inProgressCount = complaints.filter(c=>c.status==="in progress").length;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.flag s={20} c="#ef4444"/>} label="Open" value={String(openCount)} color="#ef4444"/>
        <StatCard icon={<Icons.clock s={20} c="#ffcd3c"/>} label="In progress" value={String(inProgressCount)} color="#ffcd3c"/>
        <StatCard icon={<Icons.chart s={20} c="#a855f7"/>} label="Total all time" value={String(complaints.length)} color="#a855f7"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 1fr":"1fr", gap:14 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>All complaints</p>
          {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}
          {!loading && complaints.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No complaints yet.</p>}
          {complaints.map((c,i) => (
            <div key={c.id} onClick={()=>selectComplaint(c)} className="row-hover" style={{ padding:"14px 12px", borderRadius:12, borderBottom:i<complaints.length-1?"1px solid rgba(255,255,255,0.05)":"none", cursor:"pointer", transition:"background 0.15s", background:selected?.id===c.id?"rgba(255,92,58,0.08)":"transparent" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{c.fullName}</span>
                  <span style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.78rem" }}>{c.user}</span>
                  <Badge text={c.priority} color={priorityColor[c.priority]}/>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge text={c.status} color={statusColor[c.status]}/>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem" }}>{c.time}</span>
                </div>
              </div>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.82rem" }}>{c.subject}</p>
            </div>
          ))}
        </Card>

        {selected && (
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <p className="syne" style={{ color:"white", fontWeight:700 }}>Complaint details</p>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", display:"flex" }}><Icons.close s={18} c="rgba(255,255,255,0.3)"/></button>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <Badge text={selected.priority+" priority"} color={priorityColor[selected.priority]}/>
              <Badge text={selected.status} color={statusColor[selected.status]}/>
            </div>
            <p style={{ color:"white", fontSize:"0.92rem", fontWeight:600, marginBottom:8 }}>{selected.subject}</p>
            {/* Full name + exact date/time — what you need to look this person's
                payment up in Paystack, not just a relative "2h ago". */}
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.82rem", marginBottom:4 }}>From: {selected.fullName} ({selected.user})</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.82rem", marginBottom:4 }}>Filed: {selected.exactTime}</p>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:"16px", marginTop:16, marginBottom:20 }}>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.88rem", lineHeight:1.7 }}>{selected.msg}</p>
            </div>

            <div style={{ background:"rgba(168,85,247,0.06)", border:"1px solid rgba(168,85,247,0.15)", borderRadius:12, padding:"14px", marginBottom:20 }}>
              <p style={{ color:"#a855f7", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>This user's recent transactions</p>
              {loadingTxns && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.8rem" }}>Loading...</p>}
              {!loadingTxns && userTxns?.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.8rem" }}>No transactions on record for this user.</p>}
              {!loadingTxns && userTxns?.map(t => {
                const label = { deposit:"Top-up", withdrawal:"Withdrawal", hint_purchase:"Hint bought", hint_earning:"Hint earned", stake_win_payout:"Quiz Clash win" }[t.type] || t.type;
                const statusColor2 = { completed:"#22c55e", pending:"#ffcd3c", rejected:"#ef4444" }[t.status] || "rgba(255,255,255,0.4)";
                return (
                  <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ minWidth:0 }}>
                      <p style={{ color:"white", fontSize:"0.83rem", fontWeight:500 }}>{label} <span style={{ color:statusColor2, fontSize:"0.72rem" }}>· {t.status}</span></p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.72rem" }}>{exactTime(t.created_at)}{t.reference ? ` · Ref: ${t.reference}` : ""}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      <span className="syne" style={{ color:"white", fontWeight:700, fontSize:"0.85rem" }}>{t.currency||"₦"} {Number(t.amount).toLocaleString()}</span>
                      <button onClick={()=>setRefundAmount(String(t.amount))} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid rgba(168,85,247,0.3)", background:"rgba(168,85,247,0.1)", color:"#a855f7", cursor:"pointer", fontSize:"0.68rem" }}>Use amount</button>
                    </div>
                  </div>
                );
              })}
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginTop:10 }}>"Use amount" fills the refund box below with that transaction's amount — it doesn't refund anything by itself.</p>
            </div>

            <div style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:12, padding:"14px", marginBottom:20 }}>
              <p style={{ color:"#38bdf8", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Investigate: who messaged this user</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12, alignItems:"center" }}>
                <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{ padding:"8px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:"0.78rem", fontFamily:"'DM Sans',sans-serif" }}/>
                <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.78rem" }}>to</span>
                <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{ padding:"8px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:"0.78rem", fontFamily:"'DM Sans',sans-serif" }}/>
                <button onClick={investigate} disabled={investigating} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:"#38bdf8", color:"white", cursor:"pointer", fontSize:"0.78rem", fontWeight:600 }}>{investigating?"Searching...":"Search messages"}</button>
              </div>
              {foundMessages !== null && (
                <div>
                  {foundMessages.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.8rem" }}>No messages found in that range.</p>}
                  {foundMessages.map(m => (
                    <div key={m.id} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"12px", marginBottom:8 }}>
                      <p style={{ color:"white", fontSize:"0.83rem", marginBottom:6, lineHeight:1.5 }}>{m.text}</p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", marginBottom:8 }}>From: {m.sender_email || "no email on record"} · {timeAgo(m.created_at)}</p>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {actionDone[m.id] === "emailed" ? (
                          <span style={{ color:"#22c55e", fontSize:"0.72rem" }}>Emailed sender</span>
                        ) : actionDone[m.id] === "suspended" ? (
                          <span style={{ color:"#ef4444", fontSize:"0.72rem" }}>Sender account suspended</span>
                        ) : actionDone[m.id] === "no-account" ? (
                          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem" }}>No Unmaskr account tied to this email</span>
                        ) : (
                          <>
                            <button onClick={()=>emailSender(m)} disabled={!m.sender_email} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(56,189,248,0.3)", background:"rgba(56,189,248,0.1)", color:"#38bdf8", cursor:"pointer", fontSize:"0.72rem" }}>Email sender</button>
                            <button onClick={()=>suspendSender(m)} disabled={!m.sender_email} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:"0.72rem" }}>Suspend sender</button>
                          </>
                        )}
                        <button onClick={()=>deleteMessage(m)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:"0.72rem" }}>Delete message</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:"14px", marginBottom:20 }}>
              <p style={{ color:"#22c55e", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Add funds to wallet</p>
              {refunded ? (
                <p style={{ color:"#22c55e", fontSize:"0.85rem", display:"flex", alignItems:"center", gap:6 }}><Icons.check s={14} c="#22c55e"/>₦{Number(refundAmount).toLocaleString()} added to {selected.user}'s wallet</p>
              ) : (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <input type="number" placeholder="Amount (₦)" value={refundAmount} onChange={e=>setRefundAmount(e.target.value)} style={{ width:120, padding:"9px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", outline:"none", fontSize:"0.82rem", fontFamily:"'DM Sans',sans-serif" }}/>
                  <button onClick={applyRefund} disabled={!refundAmount} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:refundAmount?"#22c55e":"#333", color:"white", cursor:refundAmount?"pointer":"not-allowed", fontSize:"0.8rem", fontWeight:600 }}>Add funds & draft reply</button>
                </div>
              )}
              {refundError && <p style={{ color:"#ef4444", fontSize:"0.78rem", marginTop:8 }}>{refundError}</p>}
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:8 }}>Use this for overcharges, or when a deposit was confirmed on your end but never reflected due to a network issue.</p>
            </div>

            <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12, padding:"14px", marginBottom:20 }}>
              <p style={{ color:"#ef4444", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Suspend this user</p>
              {complainantSuspended ? (
                <p style={{ color:"#ef4444", fontSize:"0.85rem", display:"flex", alignItems:"center", gap:6 }}><Icons.check s={14} c="#ef4444"/>{selected.user}'s account has been suspended</p>
              ) : (
                <>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:10 }}>For false or abusive complaints — suspends {selected.user}'s own account, not the sender they're complaining about.</p>
                  <button onClick={suspendComplainant} style={{ padding:"9px 16px", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 }}>Suspend {selected.user}</button>
                </>
              )}
            </div>

            <div style={{ marginBottom:12 }}>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Ready-made replies (click to insert, then edit as needed)</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {CANNED_REPLIES.map(r => (
                  <button key={r.label} onClick={()=>setReplyText(r.text)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:"0.74rem" }}>{r.label}</button>
                ))}
              </div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Reply</p>
              <textarea rows={4} placeholder="Type your response, or click a ready-made reply above..." value={replyText} onChange={e=>setReplyText(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", resize:"none", fontSize:"0.88rem", fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:6 }}>Sends a real email to {selected.email || "the user (no email on file)"}.</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={sendReply} disabled={!replyText.trim()} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:replyText.trim()?"#ff5c3a":"#333", color:"white", cursor:replyText.trim()?"pointer":"not-allowed", fontSize:"0.85rem", fontWeight:600 }}>Send reply</button>
              <button onClick={markResolved} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid rgba(34,197,94,0.3)", background:"rgba(34,197,94,0.1)", color:"#22c55e", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }}>Mark resolved</button>
            </div>
            {sentConfirm && <p style={{ textAlign:"center", marginTop:10, color:"#22c55e", fontSize:"0.82rem", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Icons.check s={14} c="#22c55e"/>Reply emailed to {selected.user}</p>}
            {resolvedConfirm && <p style={{ textAlign:"center", marginTop:10, color:"#22c55e", fontSize:"0.82rem", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Icons.check s={14} c="#22c55e"/>Marked as resolved</p>}
          </Card>
        )}
      </div>
    </div>
  );
};
// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
const AUDIENCE_LABELS = { all:"All users", active:"Active", new:"New today", "18+":"18+", has_messages:"Has messages" };

const PushNotifications = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [audienceCounts, setAudienceCounts] = useState({ all:0, active:0, new:0, "18+":0, has_messages:0 });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sentThisMonth, setSentThisMonth] = useState(0);
  const [totalReached, setTotalReached] = useState(0);

  useEffect(() => { fetchAudienceCounts(); fetchHistory(); }, []);

  const fetchAudienceCounts = async () => {
    const { count: all } = await supabase.from("profiles").select("id", { count:"exact", head:true });
    const { count: active } = await supabase.from("profiles").select("id", { count:"exact", head:true }).eq("status","active");
    const todayStr = new Date().toISOString().slice(0,10);
    const { count: newToday } = await supabase.from("profiles").select("id", { count:"exact", head:true }).gte("created_at", todayStr);
    const eighteenYearsAgo = new Date(); eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear()-18);
    const { count: adults } = await supabase.from("profiles").select("id", { count:"exact", head:true }).lte("dob", eighteenYearsAgo.toISOString().slice(0,10));
    const { data: msgRecipients } = await supabase.from("messages").select("recipient_id");
    const uniqueRecipients = new Set((msgRecipients||[]).map(m=>m.recipient_id)).size;
    setAudienceCounts({ all: all||0, active: active||0, new: newToday||0, "18+": adults||0, has_messages: uniqueRecipients });
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase.from("push_notifications").select("*").order("created_at",{ ascending:false }).limit(20);
    setHistory((data||[]).map(n => ({
      title: n.title, body: n.body, target: AUDIENCE_LABELS[n.target] || n.target, reach: n.reach,
      sent: new Date(n.created_at).toLocaleDateString("en-NG",{month:"short",day:"numeric"}),
    })));
    const { data: allRows } = await supabase.from("push_notifications").select("reach, created_at");
    const now = new Date();
    setSentThisMonth((allRows||[]).filter(n=>{ const d=new Date(n.created_at); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }).length);
    setTotalReached((allRows||[]).reduce((s,n)=>s+Number(n.reach||0),0));
    setLoadingHistory(false);
  };

  const sendNotification = async () => {
    if (!title || !body || sending) return;
    setSending(true);
    const { data: reach, error: broadcastError } = await supabase.rpc("broadcast_notification", {
      p_title: title, p_body: body, p_target: target,
    });
    if (broadcastError) {
      setSending(false);
      return;
    }
    const { error } = await supabase.from("push_notifications").insert({ title, body, target, reach: reach || 0 });
    setSending(false);
    if (!error) {
      setSent(true);
      setTitle(""); setBody("");
      fetchHistory();
      setTimeout(()=>setSent(false), 3000);
    }
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Send push notification</p>
          <div style={{ padding:"10px 14px", background:"rgba(255,205,60,0.08)", border:"1px solid rgba(255,205,60,0.2)", borderRadius:10, marginBottom:14, fontSize:"0.76rem", color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>
            This reaches the in-app notification bell for every targeted user right away. It doesn't send an OS-level push to their phone yet — that needs a provider (FCM/OneSignal/web push) wired in separately.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Target audience</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["all","active","new","18+","has_messages"].map(t => (
                  <button key={t} onClick={()=>setTarget(t)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${target===t?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:target===t?"rgba(255,92,58,0.15)":"transparent", color:target===t?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.75rem" }}>{AUDIENCE_LABELS[t]} ({(audienceCounts[t]||0).toLocaleString()})</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Title</p>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notification title" style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", outline:"none", fontSize:"0.88rem", fontFamily:"'DM Sans',sans-serif" }}/>
            </div>
            <div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Message</p>
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="Notification body..." style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", resize:"none", outline:"none", fontSize:"0.88rem", fontFamily:"'DM Sans',sans-serif" }}/>
            </div>
            {sent ? (
              <div style={{ padding:"12px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, textAlign:"center", color:"#22c55e", fontSize:"0.85rem", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Icons.check s={16} c="#22c55e"/>Logged!</div>
            ) : (
              <button onClick={sendNotification} disabled={!title||!body||sending} style={{ padding:"12px", borderRadius:10, border:"none", background:(title&&body)?"#ff5c3a":"#333", color:"white", cursor:(title&&body&&!sending)?"pointer":"not-allowed", fontSize:"0.88rem", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Icons.bell s={16} c="white"/>{sending?"Logging...":`Send to ${(audienceCounts[target]||0).toLocaleString()} users`}
              </button>
            )}
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <StatCard icon={<Icons.bell s={20} c="#38bdf8"/>} label="Sent this month" value={String(sentThisMonth)} color="#38bdf8"/>
          <StatCard icon={<Icons.users s={20} c="#a855f7"/>} label="Total reached (all time)" value={totalReached.toLocaleString()} color="#a855f7"/>
        </div>
      </div>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent notifications</p>
        {loadingHistory && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}
        {!loadingHistory && history.length===0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No notifications sent yet.</p>}
        {history.map((n,i) => (
          <div key={i} className="row-hover" style={{ padding:"14px 10px", borderRadius:10, borderBottom:i<history.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <p style={{ color:"white", fontSize:"0.85rem", fontWeight:600 }}>{n.title}</p>
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.75rem" }}>{n.sent}</span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.82rem", marginBottom:8 }}>{n.body}</p>
            <div style={{ display:"flex", gap:12 }}>
              <Badge text={n.target} color="#888" icon={<Icons.users s={10} c="#888"/>}/>
              <Badge text={`${Number(n.reach).toLocaleString()} reached`} color="#38bdf8" icon={<Icons.mail s={10} c="#38bdf8"/>}/>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const AdminSettings = ({ onLogout, adminEmail }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
    setSettings(data);
    setLoading(false);
  };

  const toggle = async (field) => {
    if (!settings || saving) return;
    setSaving(field);
    const newValue = !settings[field];
    const { error } = await supabase.from("platform_settings").update({ [field]: newValue, updated_at: new Date().toISOString() }).eq("id", 1);
    if (!error) setSettings(s => ({ ...s, [field]: newValue }));
    setSaving(null);
  };

  // NOTE: the underlying field is still named stake_win_frozen in the database —
  // renaming a column isn't needed just to rename the product on-screen, so the
  // label below is the only thing that changed.
  const toggleRows = [
    { key:"maintenance_mode", label:"Maintenance mode", desc:"Temporarily disable the app for all users" },
    { key:"new_signups_enabled", label:"New signups", desc:"Allow new users to register" },
    { key:"hint_purchases_enabled", label:"Hint purchases", desc:"Allow hint purchases" },
    { key:"withdrawals_enabled", label:"Withdrawals", desc:"Allow users to withdraw funds" },
    { key:"mystery_lobby_frozen", label:"Freeze Mystery Lobby", desc:"Stop new Mystery Lobby games from starting", invert:true },
    { key:"stake_win_frozen", label:"Freeze Quiz Clash", desc:"Stop new Quiz Clash games from starting", invert:true },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:6 }}>Platform settings</p>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginBottom:18 }}>
            These flags are saved for real — but your main app needs to be updated to actually check and obey them (e.g. block signup when "New signups" is off).
          </p>
          {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}
          {!loading && settings && toggleRows.map(s => {
            const isOn = settings[s.key];
            return (
              <div key={s.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{s.label}</p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.75rem" }}>{s.desc}</p>
                </div>
                <div onClick={()=>toggle(s.key)} style={{ width:40, height:22, borderRadius:50, background:isOn?(s.invert?"#ef4444":"#22c55e"):"#333", position:"relative", cursor:saving===s.key?"default":"pointer", flexShrink:0, opacity:saving===s.key?0.6:1, transition:"background 0.2s" }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:3, left:isOn?21:3, transition:"left 0.2s" }}/>
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:16 }}>Revenue split</p>
            {[
              { label:"Hint revenue to Unmaskr", value:"50%" },
              { label:"Hint revenue to user", value:"50%" },
              { label:"Min withdrawal", value:"₦500" },
            ].map(r => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.83rem" }}>{r.label}</span>
                <span className="syne" style={{ color:"#ffcd3c", fontSize:"0.9rem", fontWeight:700 }}>{r.value}</span>
              </div>
            ))}
          </Card>

          <Card>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:16 }}>Admin account</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.83rem", marginBottom:16 }}>{adminEmail || "—"}</p>
            <button style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }} onClick={onLogout}>
              Sign out
            </button>
          </Card>

          <AdminMfaCard/>
        </div>
      </div>
    </div>
  );
};

const AdminMfaCard = () => {
  const [factor, setFactor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pendingFactorId, setPendingFactorId] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const fetchFactors = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactor(data?.totp?.find(f => f.status === "verified") || null);
    setLoading(false);
  };
  useEffect(() => { fetchFactors(); }, []);

  const startEnroll = async () => {
    setBusy(true); setErr("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setPendingFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(true);
  };

  const activate = async () => {
    if (!code.trim() || !pendingFactorId) return;
    setBusy(true); setErr("");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId });
    if (challengeError) { setBusy(false); setErr(challengeError.message); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: pendingFactorId, challengeId: challenge.id, code: code.trim() });
    setBusy(false);
    if (verifyError) { setErr("Invalid code — please try again."); return; }
    setEnrolling(false); setCode(""); setQrCode(""); setSecret("");
    fetchFactors();
  };

  const cancelEnroll = async () => {
    if (pendingFactorId) await supabase.auth.mfa.unenroll({ factorId: pendingFactorId });
    setEnrolling(false); setPendingFactorId(null); setQrCode(""); setSecret(""); setCode(""); setErr("");
  };

  const removeMfa = async () => {
    if (!factor) return;
    setBusy(true); setErr("");
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setFactor(null);
  };

  return (
    <Card>
      <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}><Icons.settings s={16} c="#ffcd3c"/>Two-factor authentication</p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem", marginBottom:16 }}>Require a code from an authenticator app (Google Authenticator, Authy, etc.) at every admin login.</p>

      {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>Loading...</p>}

      {!loading && !enrolling && factor && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, marginBottom:14 }}>
            <Icons.check s={14} c="#22c55e"/><span style={{ color:"#22c55e", fontSize:"0.83rem", fontWeight:600 }}>2FA is on</span>
          </div>
          <button onClick={removeMfa} disabled={busy} style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }}>{busy?"Removing...":"Turn off 2FA"}</button>
        </>
      )}

      {!loading && !enrolling && !factor && (
        <button onClick={startEnroll} disabled={busy} style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", background:"#ff5c3a", color:"white", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }}>{busy?"Starting...":"Set up 2FA"}</button>
      )}

      {enrolling && (
        <div>
          <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.8rem", marginBottom:12 }}>Scan this with your authenticator app:</p>
          {qrCode && <div style={{ background:"white", borderRadius:12, padding:12, marginBottom:12, display:"flex", justifyContent:"center" }}><img src={qrCode} alt="2FA QR code" style={{ width:160, height:160 }}/></div>}
          {secret && <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.72rem", marginBottom:14, wordBreak:"break-all" }}>Can't scan? Enter this code manually: <span style={{ color:"rgba(255,255,255,0.6)" }}>{secret}</span></p>}
          <input type="text" inputMode="numeric" placeholder="6-digit code" value={code} onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6)); setErr("");}}
            style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:"1rem", letterSpacing:"0.2em", textAlign:"center", outline:"none", fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={cancelEnroll} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:"0.83rem" }}>Cancel</button>
            <button onClick={activate} disabled={busy||code.length<6} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:(busy||code.length<6)?"#7a3323":"#ff5c3a", color:"white", cursor:(busy||code.length<6)?"default":"pointer", fontSize:"0.83rem", fontWeight:600 }}>{busy?"Verifying...":"Activate"}</button>
          </div>
        </div>
      )}

      {err && <p style={{ color:"#ef4444", fontSize:"0.78rem", marginTop:10 }}>{err}</p>}
    </Card>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [active, setActive] = useState("overview");
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: adminRow } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (adminRow) { setLoggedIn(true); setAdminEmail(session.user.email || ""); }
        else await supabase.auth.signOut();
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setAdminEmail("");
  };

  const titles = {
    overview:"Overview", revenue:"Revenue", users:"Users",
    messages:"Messages", hints:"Hint Analytics", games:"Games",
    deposits:"Deposits", withdrawals:"Withdrawals", complaints:"Complaints",
    notifications:"Push Notifications", settings:"Settings",
  };

  if (checkingSession) return (
    <>
      <GlobalStyles/>
      <div style={{ minHeight:"100vh", background:"#0e0e0e", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <LogoMaskImg size={40}/>
      </div>
    </>
  );

  if (!loggedIn) return (
    <>
      <GlobalStyles/>
      <AdminLogin onLogin={(email) => { setLoggedIn(true); setAdminEmail(email || ""); }}/>
    </>
  );

  return (
    <>
      <GlobalStyles/>
      <div style={{ display:"flex", minHeight:"100vh", background:"#0e0e0e", flexDirection:"row" }}>
        <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          <div className="admin-topbar" style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#111", flexWrap:"wrap", gap:10 }}>
            <div>
              <h1 className="syne" style={{ color:"white", fontSize:"1.1rem", fontWeight:800 }}>{titles[active]}</h1>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:2 }}>
                {new Date().toLocaleDateString("en-NG", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <button style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"0.78rem" }} onClick={handleLogout}>Sign out</button>
            </div>
          </div>

          <div className="admin-content" style={{ flex:1, padding:"20px", overflowY:"auto" }}>
            {active==="overview"      && <Overview/>}
            {active==="revenue"       && <Revenue/>}
            {active==="users"         && <Users/>}
            {active==="messages"      && <Messages/>}
            {active==="hints"         && <Hints/>}
            {active==="games"         && <GamesAdmin/>}
            {active==="deposits"      && <Deposits/>}
            {active==="withdrawals"   && <Withdrawals/>}
            {active==="complaints"    && <Complaints/>}
            {active==="notifications" && <PushNotifications/>}
            {active==="settings"      && <AdminSettings onLogout={handleLogout} adminEmail={adminEmail}/>}
          </div>
        </div>
      </div>
    </>
  );
}
