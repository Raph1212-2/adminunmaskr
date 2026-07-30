import React, { useState, useEffect } from "react";
// Adjust this path to wherever your supabaseClient.js actually lives in the project
import { supabase } from "./supabaseClient";
import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import logoMaskWhite from './assets/logo-mask-white.png';
import logoFullWhite from './assets/logo-full-white.png';
// ── REAL LOGO (from brand asset) — admin dashboard is dark, so we only need the white variant
const LogoMaskImg = ({ size=24, style={} }) => (
  <img src={logoMaskWhite} alt="Unmaskr" style={{ height:size, width:"auto", display:"block", ...style }}/>
);
const LogoFullImg = ({ height=24, style={} }) => (
  <img src={logoFullWhite} alt="Unmaskr" style={{ height, width:"auto", display:"block", ...style }}/>
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

  const login = async () => {
    if(!email || !password) return;
    setError("");
    setLoading(true);

    // 1. Real Supabase Auth check
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // 2. Is this authenticated user actually an admin?
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!adminRow) {
      setError("This account doesn't have admin access.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(email);
  };

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
      {/* Logo */}
      <div style={{ padding:"20px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <LogoMaskImg size={26}/>
        {!collapsed && <span className="syne" style={{ color:"white", fontWeight:800, fontSize:"1rem", whiteSpace:"nowrap" }}>unmaskr</span>}
        <button onClick={()=>setCollapsed(c=>!c)} style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:"1rem", padding:4 }}>
          {collapsed?<Icons.chevR s={16}/>:<Icons.chevL s={16}/>}
        </button>
      </div>

      {/* Nav items */}
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

      {/* Admin tag */}
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

  // Real active-users-online count via Supabase Realtime Presence. The main
  // app tracks itself on the same "online-users" channel whenever it's open
  // (see the presence useEffect in the main app's root App component) — this
  // just listens in and counts how many distinct clients are present.
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
    const messagesToday = 0; // computed below from a fresh count query
    const hintsToday = (hintTx || []).filter(t => new Date(t.created_at).toDateString() === todayStr).length;
    const signupsToday = (recentProfiles || []).filter(p => new Date(p.created_at).toDateString() === todayStr).length;

    const { count: msgsToday } = await supabase.from("messages").select("id", { count:"exact", head:true }).gte("created_at", new Date().toISOString().slice(0,10));

    setStats({ totalUsers: totalUsers||0, totalMessages: totalMessages||0, hintsSold, pendingWithdrawals, messagesToday: msgsToday||0, hintsToday, signupsToday });

    // Last 7 days, oldest to newest
    const dayBuckets = [...Array(7)].map((_,i) => {
      const d = new Date(); d.setDate(d.getDate() - (6-i));
      return d.toDateString();
    });
    setWeekUsers(dayBuckets.map(dStr => (recentProfiles||[]).filter(p=>new Date(p.created_at).toDateString()===dStr).length));
    setWeekRevenue(dayBuckets.map(dStr => (hintTx||[]).filter(t=>new Date(t.created_at).toDateString()===dStr).reduce((s,t)=>s+Number(t.amount),0)));

    // Recent activity: merge recent signups + recent messages, newest first
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
      {/* Today snapshot */}
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

      {/* Stat cards */}
      <div className="fadeUp" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.users s={20} c="#38bdf8"/>} label="Total users" value={stats.totalUsers.toLocaleString()} color="#38bdf8"/>
        <StatCard icon={<Icons.chat s={20} c="#a855f7"/>} label="Total messages" value={stats.totalMessages.toLocaleString()} color="#a855f7"/>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Hints sold" value={stats.hintsSold.toLocaleString()} color="#ffcd3c"/>
        <StatCard icon={<Icons.bank s={20} c="#ef4444"/>} label="Pending withdrawals" value={`₦${stats.pendingWithdrawals.toLocaleString()}`} color="#ef4444"/>
      </div>

      {/* Charts row */}
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

      {/* Recent activity */}
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
      supabase.from("transactions").select("amount, created_at").eq("type","hint_purchase").eq("status","completed"),
      supabase.from("transactions").select("amount, created_at").eq("type","deposit").eq("status","completed"),
      supabase.from("transactions").select("amount, created_at").eq("type","withdrawal").eq("status","completed"),
    ]);
    setHintTx(hints || []);
    setDepositTx(deposits || []);
    setWithdrawalTx(withdrawals || []);

    const { data: recent } = await supabase
      .from("transactions")
      .select("id, user_id, type, amount, status, created_at")
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
      unmaskr: t.type === "hint_purchase" ? `₦${(Number(t.amount)*0.5).toLocaleString()}` : "₦0",
      time: timeAgo(t.created_at),
    })));

    setLoading(false);
  };

  // NOTE: profit here is hint purchases only (Unmaskr's 50% cut). Stake & Win's
  // 5% fee isn't included — no games/stakes table exists in the database yet.
  const hintTotal = hintTx.reduce((s,t)=>s+Number(t.amount),0);
  const profit = hintTotal * 0.5;
  const depositTotal = depositTx.reduce((s,t)=>s+Number(t.amount),0);
  const withdrawalTotal = withdrawalTx.reduce((s,t)=>s+Number(t.amount),0);

  const todayStr = new Date().toDateString();
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const profitToday = hintTx.filter(t=>new Date(t.created_at).toDateString()===todayStr).reduce((s,t)=>s+Number(t.amount),0)*0.5;
  const profitThisMonth = hintTx.filter(t=>{const d=new Date(t.created_at); return d.getMonth()===thisMonth && d.getFullYear()===thisYear;}).reduce((s,t)=>s+Number(t.amount),0)*0.5;

  const bucketed = (() => {
    if (range === "hourly") {
      const labels = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];
      const data = labels.map((_,h) => hintTx.filter(t=>{const d=new Date(t.created_at); return d.toDateString()===todayStr && d.getHours()===h;}).reduce((s,t)=>s+Number(t.amount)*0.5,0));
      return { data, labels };
    }
    if (range === "daily") {
      const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      const buckets = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toDateString(); });
      return { data: buckets.map(dStr=>hintTx.filter(t=>new Date(t.created_at).toDateString()===dStr).reduce((s,t)=>s+Number(t.amount)*0.5,0)), labels: days };
    }
    if (range === "monthly") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const data = months.map((_,m)=>hintTx.filter(t=>{const d=new Date(t.created_at); return d.getMonth()===m && d.getFullYear()===thisYear;}).reduce((s,t)=>s+Number(t.amount)*0.5,0));
      return { data, labels: months };
    }
    if (range === "yearly") {
      const years = [thisYear-3, thisYear-2, thisYear-1, thisYear];
      const data = years.map(y=>hintTx.filter(t=>new Date(t.created_at).getFullYear()===y).reduce((s,t)=>s+Number(t.amount)*0.5,0));
      return { data, labels: years.map(String) };
    }
    const buckets = [...Array(8)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(7-i)*7); return d; });
    const data = buckets.map((start)=>{
      const end = new Date(start); end.setDate(end.getDate()+7);
      return hintTx.filter(t=>{const d=new Date(t.created_at); return d>=start && d<end;}).reduce((s,t)=>s+Number(t.amount)*0.5,0);
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
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginBottom:24, marginTop:-10 }}>
        Profit shown here counts hint purchases only — Stake & Win's 5% fee isn't included, since no games data exists in the database yet.
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
// Manual log of when you move profit out of Paystack into your own bank account.
// This is bookkeeping only — it doesn't move real money, it just helps you track
// how much of your profit is still sitting in Paystack vs. already in your account.
const ProfitSweepLog = ({ totalProfit }) => {
  const [sweeps, setSweeps] = useState([
    { amount:800000, note:"Monthly sweep to GTBank business account", date:"Jun 1, 2026" },
    { amount:500000, note:"Partial withdrawal for expenses", date:"May 15, 2026" },
  ]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const totalSwept = sweeps.reduce((s,x)=>s+x.amount,0);
  const stillInPaystack = totalProfit - totalSwept;

  const logSweep = () => {
    if(!amount) return;
    setSweeps(s=>[{ amount:Number(amount), note:note||"Profit sweep", date:new Date().toLocaleDateString("en-NG",{month:"short",day:"numeric",year:"numeric"}) }, ...s]);
    setAmount(""); setNote("");
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
        <button onClick={logSweep} disabled={!amount} style={{ padding:"10px 18px", borderRadius:10, border:"none", background:amount?"#ff5c3a":"#333", color:"white", cursor:amount?"pointer":"not-allowed", fontSize:"0.85rem", fontWeight:600 }}>Log sweep</button>
      </div>

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

    // Message count, spend, and earnings per user. Simple per-user queries —
    // fine for testing-scale data; worth moving to a single SQL view/RPC
    // once you have real volume.
    // NOTE: 'hint_purchase' / 'hint_earning' are assumed transaction.type
    // values — adjust these two strings if your main app uses different ones.
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
  const [weekData, setWeekData] = useState([]);

  useEffect(() => { fetchHints(); }, []);

  const fetchHints = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("type", "hint_purchase")
      .eq("status", "completed");

    const rows = data || [];
    setTotalSold(rows.length);
    setTotalRevenue(rows.reduce((s,t)=>s+Number(t.amount),0));

    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const buckets = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
    setWeekData(buckets.map((d,i) => ({
      day: days[i],
      hints: rows.filter(t=>new Date(t.created_at).toDateString()===d.toDateString()).length,
    })));
    setLoading(false);
  };

  const unmaskrShare = totalRevenue * 0.5;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Total hints sold" value={totalSold.toLocaleString()} color="#ffcd3c"/>
        <StatCard icon={<Icons.money s={20} c="#ff5c3a"/>} label="Total hint revenue" value={`₦${totalRevenue.toLocaleString()}`} color="#ff5c3a"/>
        <StatCard icon={<Icons.bank s={20} c="#22c55e"/>} label="Unmaskr earned" value={`₦${unmaskrShare.toLocaleString()}`} color="#22c55e"/>
        <StatCard icon={<Icons.user s={20} c="#38bdf8"/>} label="Paid to users" value={`₦${unmaskrShare.toLocaleString()}`} color="#38bdf8"/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginBottom:24, marginTop:-10 }}>
        Shown as one combined total — there's no column tracking which specific tier (1/2/3) each purchase was, so a per-tier breakdown isn't possible without adding one.
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
  const [playersBySession, setPlayersBySession] = useState({}); // session_id -> [players]
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  useEffect(() => { fetchGames(); }, []);

  const fetchGames = async () => {
    setLoading(true);
    const { data: sessionsData } = await supabase
      .from("game_sessions")
      .select("id, game_type, status, stake_amount, currency, host_name, created_at")
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
  const stakeFinished = finished.filter(s => s.game_type === "stake_win");
  const totalPlayed = mysteryFinished.length + stakeFinished.length;

  // Unmaskr's 5% cut of each finished Stake & Win game's actual pot (stake × real player count)
  const stakeRevenue = stakeFinished.reduce((sum, s) => {
    const count = (playersBySession[s.id] || []).length;
    return sum + Number(s.stake_amount || 0) * count * 0.05;
  }, 0);

  const buckets = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toDateString(); });
  const mysteryWeek = buckets.map(dStr => mysteryFinished.filter(s => new Date(s.created_at).toDateString() === dStr).length);
  const stakeWeek = buckets.map(dStr => stakeFinished.filter(s => new Date(s.created_at).toDateString() === dStr).length);

  const recentStake = stakeFinished.slice(0, 6).map(s => {
    const ps = playersBySession[s.id] || [];
    const top = Math.max(0, ...ps.map(p => p.score || 0));
    const winners = ps.filter(p => (p.score || 0) === top && top > 0);
    const pot = Number(s.stake_amount || 0) * ps.length;
    return {
      players: ps.map(p => p.display_name).join(", ") || "—",
      pot: `${s.currency || "₦"}${pot.toLocaleString()}`,
      winner: winners.length > 1 ? "Tie" : (winners[0]?.display_name || "—"),
      unmaskr: `${s.currency || "₦"}${(pot * 0.05).toLocaleString()}`,
      time: timeAgo(s.created_at),
    };
  });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.gamepad s={20} c="#22c55e"/>} label="Games played" value={totalPlayed.toLocaleString()} color="#22c55e"/>
        <StatCard icon={<MaskIcon size={20} color="#a855f7"/>} label="Mystery Lobby" value={mysteryFinished.length.toLocaleString()} color="#a855f7"/>
        <StatCard icon={<Icons.money s={20} c="#ffcd3c"/>} label="Stake & Win" value={stakeFinished.length.toLocaleString()} color="#ffcd3c"/>
        <StatCard icon={<Icons.bank s={20} c="#ff5c3a"/>} label="Stake revenue (5% fee)" value={`₦${stakeRevenue.toLocaleString()}`} color="#ff5c3a"/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.72rem", marginBottom:24, marginTop:-10 }}>
        Stake revenue assumes ₦ — if players are staking in USD/GBP it's summed in with Naira figures here, since sessions don't currently separate totals by currency.
      </p>
      {loading && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", marginBottom:20 }}>Loading games...</p>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Mystery Lobby games, last 7 days</p>
          <BarChart data={mysteryWeek} labels={days} color="#a855f7" height={90}/>
        </Card>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Stake & Win games, last 7 days</p>
          <BarChart data={stakeWeek} labels={days} color="#ffcd3c" height={90}/>
        </Card>
      </div>
      <Card style={{ marginTop:14 }}>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent Stake & Win games</p>
        {!loading && recentStake.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>No finished Stake & Win games yet.</p>}
        {recentStake.map((g,i) => (
          <div key={i} className="row-hover" style={{ padding:"14px 10px", borderRadius:10, borderBottom:i<recentStake.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>Pot: {g.pot}</span>
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.75rem" }}>{g.time}</span>
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem" }}>Players: {g.players}</span>
              <span style={{ color:"#22c55e", fontSize:"0.78rem" }}>Winner: {g.winner}</span>
              <span style={{ color:"#ff5c3a", fontSize:"0.78rem" }}>Unmaskr fee: {g.unmaskr}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── DEPOSITS ─────────────────────────────────────────────────────────────────
// Admin manually confirms deposits for now (business account, testing phase —
// no automated Paystack webhook yet). Confirming a deposit credits the user's
// wallet and sends the "deposit confirmed" email in one action.
const Deposits = () => {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [justConfirmed, setJustConfirmed] = useState(null);

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
      requested: new Date(t.created_at).toLocaleString("en-NG", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }),
      date: new Date(t.created_at).toLocaleDateString("en-NG", { month:"short", day:"numeric" }),
      status: t.status,
    }));

    setPending(rows.filter(r => r.status === "pending"));
    setCompleted(rows.filter(r => r.status === "completed"));
    setLoading(false);
  };

  const confirmDeposit = async (dep) => {
    setConfirmingId(dep.id);

    // 1. Mark the transaction confirmed
    const { error: txError } = await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", dep.id);

    if (txError) { setConfirmingId(null); return; }

    // 2. Credit the user's wallet (read-then-write — fine at admin/manual
    // volume; move to an atomic RPC if this ever needs to handle concurrent
    // confirmations)
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", dep.userId)
      .single();

    if (wallet) {
      await supabase
        .from("wallets")
        .update({ balance: Number(wallet.balance) + dep.rawAmount, updated_at: new Date().toISOString() })
        .eq("user_id", dep.userId);
    }

    // 3. Email the user, if we have an address on file
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
    const { error } = await supabase.from("transactions").update({ status: "rejected" }).eq("id", dep.id);
    if (!error) setPending(p => p.filter(x => x.id !== dep.id));
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
const Withdrawals = () => {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

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
      requested: new Date(t.created_at).toLocaleString("en-NG", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }),
      date: new Date(t.created_at).toLocaleDateString("en-NG", { month:"short", day:"numeric" }),
      status: t.status,
    }));

    setPending(rows.filter(r => r.status === "pending"));
    setCompleted(rows.filter(r => r.status === "completed"));
    setLoading(false);
  };

  const payWithdrawal = async (w) => {
    setPayingId(w.id);

    const { error } = await supabase.from("transactions").update({ status: "completed" }).eq("id", w.id);
    if (!error) {
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
    }
    setPayingId(null);
  };

  const rejectWithdrawal = async (w) => {
    const { error } = await supabase.from("transactions").update({ status: "rejected" }).eq("id", w.id);
    if (!error) setPending(p => p.filter(x => x.id !== w.id));
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
  const [sentConfirm, setSentConfirm] = useState(false);
  const [resolvedConfirm, setResolvedConfirm] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [investigating, setInvestigating] = useState(false);
  const [foundMessages, setFoundMessages] = useState(null);
  const [actionDone, setActionDone] = useState({});

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("id, user_id, subject, message, status, priority, created_at")
      .order("created_at", { ascending: false });
    if (error || !data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profilesData } = userIds.length ? await supabase.from("profiles").select("id, username, email").in("id", userIds) : { data: [] };
    const profileById = Object.fromEntries((profilesData||[]).map(p=>[p.id,p]));

    setComplaints(data.map(c => ({
      id: c.id,
      userId: c.user_id,
      user: `@${profileById[c.user_id]?.username || "unknown"}`,
      email: profileById[c.user_id]?.email || null,
      subject: c.subject,
      msg: c.message,
      status: c.status,
      priority: c.priority,
      time: timeAgo(c.created_at),
    })));
    setLoading(false);
  };

  const statusColor = { open:"#ef4444", "in progress":"#ffcd3c", resolved:"#22c55e" };
  const priorityColor = { high:"#ef4444", medium:"#ffcd3c", low:"#22c55e" };

  const selectComplaint = c => {
    setSelected(c);
    setReplyText(""); setRefundAmount(""); setRefunded(false);
    setSentConfirm(false); setResolvedConfirm(false);
    setFoundMessages(null); setFromDate(""); setToDate(""); setActionDone({});
    setComplainantSuspended(false);
  };

  const applyRefund = async () => {
    if (!refundAmount || !selected) return;
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", selected.userId).single();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + Number(refundAmount), updated_at: new Date().toISOString() }).eq("user_id", selected.userId);
    }
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

  // De-anonymized investigation: find real senders of messages to this user
  // in a date range, using messages.sender_email (recipients never see this,
  // but admin can, for abuse investigation).
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
                  <span style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{c.user}</span>
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
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.82rem", marginBottom:4 }}>From: {selected.user} · {selected.time}</p>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:"16px", marginTop:16, marginBottom:20 }}>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.88rem", lineHeight:1.7 }}>{selected.msg}</p>
            </div>

            {/* Investigate: see who actually sent this user messages, and act on it */}
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

            {/* Add funds to wallet — for overcharges, or confirmed deposits that never reflected */}
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
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:8 }}>Use this for overcharges, or when a deposit was confirmed on your end but never reflected due to a network issue.</p>
            </div>

            {/* Suspend the complainant — for false/abusive complaints */}
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
const PushNotifications = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [sent, setSent] = useState(false);
  const recent = [
    { title:"New feature: Profile Themes!", body:"Customize your send page with beautiful themes.", target:"All users", sent:"Jun 24", reach:"52,341" },
    { title:"Your wallet earned money!", body:"Someone bought a hint on your message. Check your wallet!", target:"Users with messages", sent:"Jun 22", reach:"34,120" },
    { title:"Play Stake & Win", body:"Challenge your friends to a trivia game and win real money!", target:"18+ users", sent:"Jun 20", reach:"28,900" },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Send push notification</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Target audience</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["all","active","new","18+","has_messages"].map(t => (
                  <button key={t} onClick={()=>setTarget(t)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${target===t?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:target===t?"rgba(255,92,58,0.15)":"transparent", color:target===t?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.75rem", textTransform:"capitalize" }}>{t==="all"?"All users":t==="has_messages"?"Has messages":t}</button>
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
              <div style={{ padding:"12px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, textAlign:"center", color:"#22c55e", fontSize:"0.85rem", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Icons.check s={16} c="#22c55e"/>Notification sent!</div>
            ) : (
              <button onClick={()=>{if(title&&body){setSent(true);setTimeout(()=>setSent(false),3000);}}} style={{ padding:"12px", borderRadius:10, border:"none", background:title&&body?"#ff5c3a":"#333", color:"white", cursor:title&&body?"pointer":"not-allowed", fontSize:"0.88rem", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Icons.bell s={16} c="white"/>Send to {target==="all"?"all 52,341 users":target+" users"}
              </button>
            )}
          </div>
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <StatCard icon={<Icons.bell s={20} c="#38bdf8"/>} label="Sent this month" value="8" color="#38bdf8"/>
          <StatCard icon={<Icons.eye s={20} c="#22c55e"/>} label="Avg open rate" value="34%" change="4%" positive color="#22c55e"/>
          <StatCard icon={<Icons.users s={20} c="#a855f7"/>} label="Total reached" value="420K" color="#a855f7"/>
        </div>
      </div>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent notifications</p>
        {recent.map((n,i) => (
          <div key={i} className="row-hover" style={{ padding:"14px 10px", borderRadius:10, borderBottom:i<recent.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
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

  const toggleRows = [
    { key:"maintenance_mode", label:"Maintenance mode", desc:"Temporarily disable the app for all users" },
    { key:"new_signups_enabled", label:"New signups", desc:"Allow new users to register" },
    { key:"hint_purchases_enabled", label:"Hint purchases", desc:"Allow hint purchases" },
    { key:"withdrawals_enabled", label:"Withdrawals", desc:"Allow users to withdraw funds" },
    { key:"mystery_lobby_frozen", label:"Freeze Mystery Lobby", desc:"Stop new Mystery Lobby games from starting", invert:true },
    { key:"stake_win_frozen", label:"Freeze Stake & Win", desc:"Stop new Stake & Win games from starting", invert:true },
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
            // For "frozen" flags, the toggle should show ON when frozen (i.e. the switch means "freeze is active")
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
              { label:"Stake & Win fee", value:"5%" },
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
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [active, setActive] = useState("overview");
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [adminEmail, setAdminEmail] = useState("");

  // On load, check if there's already a valid admin session (so refreshing
  // the page doesn't force a re-login every time).
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
          {/* Top bar */}
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

          {/* Content */}
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