import React, { useState, useEffect } from "react";
// Adjust this path to wherever your supabaseClient.js actually lives in the project
import { supabase } from "./supabaseClient";

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
    onLogin();
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0e0e0e", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <MaskIcon size={48} color="white"/>
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
    { key:"hints",        icon:<MaskIcon size={16}/>, label:"Hints" },
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
        <MaskIcon size={26} color="white"/>
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
  const [now] = useState(new Date());
  const weekUsers = [1200,1450,1100,1800,2100,1650,2340];
  const weekRevenue = [18000,24000,15000,31000,28000,22000,38500];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const recentActivity = [
    { user:"@temi_xx", action:"Signed up", time:"2 mins ago" },
    { user:"@kolade_f", action:"Bought Hint 2 (₦150)", time:"4 mins ago" },
    { user:"@sade_ng", action:"Withdrew ₦2,000", time:"7 mins ago" },
    { user:"@david_a", action:"Joined Stake & Win", time:"11 mins ago" },
    { user:"@grace_o", action:"Bought Hint 1 (₦100)", time:"15 mins ago" },
    { user:"@mike_t", action:"Reported a message", time:"22 mins ago" },
    { user:"@femi_b", action:"Signed up", time:"28 mins ago" },
  ];

  return (
    <div>
      {/* Live banner */}
      <div style={{ background:"linear-gradient(135deg,#ff5c3a,#ff8c42)", borderRadius:16, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div className="pulse" style={{ width:8, height:8, borderRadius:"50%", background:"white" }}/>
            <span style={{ color:"white", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Live right now</span>
          </div>
          <span className="syne" style={{ color:"white", fontSize:"2rem", fontWeight:800 }}>1,247</span>
          <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", marginLeft:8 }}>active users online</span>
        </div>
        <div style={{ display:"flex", gap:24 }}>
          {[["342","messages sent today"],["89","hints bought today"],["23","new signups today"]].map(([v,l]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div className="syne" style={{ color:"white", fontSize:"1.3rem", fontWeight:800 }}>{v}</div>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.72rem" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="fadeUp" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.users s={20} c="#38bdf8"/>} label="Total users" value="52,341" change="12% this week" positive color="#38bdf8"/>
        <StatCard icon={<Icons.chat s={20} c="#a855f7"/>} label="Total messages" value="1.2M" change="8% this week" positive color="#a855f7"/>
        <StatCard icon={<Icons.money s={20} c="#ff5c3a"/>} label="Total revenue" value="₦4.8M" change="22% this week" positive color="#ff5c3a"/>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Hints sold" value="38,920" change="18% this week" positive color="#ffcd3c"/>
        <StatCard icon={<Icons.gamepad s={20} c="#22c55e"/>} label="Games played" value="8,441" change="5% this week" positive color="#22c55e"/>
        <StatCard icon={<Icons.bank s={20} c="#ef4444"/>} label="Pending withdrawals" value="₦182,000" color="#ef4444"/>
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
        <Card>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>New users this week</p>
          <p className="syne" style={{ color:"white", fontSize:"1.4rem", fontWeight:800, marginBottom:16 }}>+2,340 <span style={{ fontSize:"0.85rem", color:"#22c55e", fontWeight:500, display:"inline-flex", alignItems:"center", gap:3 }}><Icons.trendUp s={12} c="#22c55e"/> 14%</span></p>
          <BarChart data={weekUsers} labels={days} color="#38bdf8"/>
        </Card>
        <Card>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Revenue this week (₦)</p>
          <p className="syne" style={{ color:"white", fontSize:"1.4rem", fontWeight:800, marginBottom:16 }}>₦38,500 <span style={{ fontSize:"0.85rem", color:"#22c55e", fontWeight:500, display:"inline-flex", alignItems:"center", gap:3 }}><Icons.trendUp s={12} c="#22c55e"/> 22%</span></p>
          <BarChart data={weekRevenue} labels={days} color="#ff5c3a"/>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18, fontSize:"0.95rem" }}>Recent activity</p>
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

  const ranges = {
    hourly:  { data:[1200,900,600,400,300,500,1800,3200,4100,3800,4200,4600,5100,4900,5300,5600,5200,4800,5900,6200,5400,4100,2800,1900], labels:["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"], total:"₦89,200", changeLabel:"vs. yesterday same hour" },
    daily:   { data:[18000,24000,15000,31000,28000,22000,38500], labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], total:"₦176,500", changeLabel:"this week" },
    weekly:  { data:[142000,168000,155000,190000,210000,198000,225000,240000], labels:["W1","W2","W3","W4","W5","W6","W7","W8"], total:"₦240,000", changeLabel:"this week" },
    monthly: { data:[280000,310000,295000,420000,380000,510000,490000,620000,580000,710000,680000,840000], labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], total:"₦840,000", changeLabel:"this month" },
    yearly:  { data:[1200000,2100000,3400000,4760000], labels:["2023","2024","2025","2026"], total:"₦4.76M", changeLabel:"this year" },
  };
  const current = ranges[range];

  // Real profit = only what Unmaskr actually keeps (hint 50% cut + Stake & Win 15% fee).
  // Top-ups and withdrawals are money passing through user wallets, not profit.
  const profitSources = [
    { source:"Hint purchases — Unmaskr's 50% cut", amount:"₦2,140,000", percent:62, color:"#ff5c3a" },
    { source:"Stake & Win — 15% fee", amount:"₦1,320,000", percent:38, color:"#ffcd3c" },
  ];
  const moneyMovedOnly = [
    { source:"Wallet top-ups (not profit — goes to user wallets)", amount:"₦960,000", color:"#38bdf8" },
    { source:"Withdrawals paid out (not profit — leaves the platform)", amount:"₦1,180,000", color:"#a855f7" },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.money s={20} c="#22c55e"/>} label="Your profit (all time)" value="₦3.46M" change="24%" positive color="#22c55e"/>
        <StatCard icon={<Icons.calendar s={20} c="#ffcd3c"/>} label="Profit this month" value="₦504K" change="18%" positive color="#ffcd3c"/>
        <StatCard icon={<Icons.calendar s={20} c="#22c55e"/>} label="Profit today" value="₦12,750" change="5%" positive color="#22c55e"/>
        <StatCard icon={<Icons.refresh s={20} c="#38bdf8"/>} label="Total money moved" value="₦9.08M" color="#38bdf8"/>
      </div>

      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:18 }}>
          <div>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:4 }}>Profit over time</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.78rem" }}>{current.changeLabel}</p>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {["hourly","daily","weekly","monthly","yearly"].map(r => (
              <button key={r} onClick={()=>setRange(r)} style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${range===r?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:range===r?"rgba(255,92,58,0.15)":"transparent", color:range===r?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.75rem", fontWeight:500, textTransform:"capitalize" }}>{r}</button>
            ))}
          </div>
        </div>
        <p className="syne" style={{ color:"white", fontSize:"1.4rem", fontWeight:800, marginBottom:16 }}>{current.total}</p>
        <BarChart data={current.data} labels={current.labels} color="#ff5c3a" height={120}/>
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

      <ProfitSweepLog totalProfit={3460000}/>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent transactions</p>
        {[
          { type:"Hint purchase", user:"@temi_xx", amount:"₦100", unmaskr:"₦50", time:"2m ago" },
          { type:"Stake & Win", user:"@kolade_f", amount:"₦3,000", unmaskr:"₦450", time:"5m ago" },
          { type:"Hint purchase", user:"@sade_ng", amount:"₦200", unmaskr:"₦100", time:"9m ago" },
          { type:"Wallet top-up", user:"@grace_o", amount:"₦1,000", unmaskr:"₦0", time:"14m ago" },
          { type:"Hint purchase", user:"@david_a", amount:"₦150", unmaskr:"₦75", time:"20m ago" },
        ].map((t,i) => (
          <div key={i} className="row-hover" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 8px", borderRadius:10, borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
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
  const users = [
    { name:"Temi Adeyemi", username:"temi_xx", joined:"Jun 25, 2025", messages:47, spent:"₦850", earned:"₦2,400", status:"active" },
    { name:"Kolade Femi", username:"kolade_f", joined:"Jun 24, 2025", messages:23, spent:"₦300", earned:"₦600", status:"active" },
    { name:"Sade Nwosu", username:"sade_ng", joined:"Jun 23, 2025", messages:89, spent:"₦1,200", earned:"₦4,100", status:"active" },
    { name:"David Ama", username:"david_a", joined:"Jun 22, 2025", messages:12, spent:"₦0", earned:"₦200", status:"inactive" },
    { name:"Grace Okon", username:"grace_o", joined:"Jun 21, 2025", messages:34, spent:"₦450", earned:"₦900", status:"active" },
    { name:"Mike Taiwo", username:"mike_t", joined:"Jun 20, 2025", messages:5, spent:"₦100", earned:"₦0", status:"suspended" },
    { name:"Femi Bello", username:"femi_b", joined:"Jun 19, 2025", messages:61, spent:"₦700", earned:"₦1,800", status:"active" },
  ];

  const filtered = users.filter(u =>
    (filter==="all" || u.status===filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.username.includes(search.toLowerCase()))
  );

  const statusColor = { active:"#22c55e", inactive:"#888", suspended:"#ef4444" };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.users s={20} c="#38bdf8"/>} label="Total users" value="52,341" change="12%" positive color="#38bdf8"/>
        <StatCard icon={<div style={{width:12,height:12,borderRadius:"50%",background:"#22c55e"}}/>} label="Active today" value="1,247" color="#22c55e"/>
        <StatCard icon={<Icons.plusCirc s={20} c="#ffcd3c"/>} label="New today" value="89" change="23%" positive color="#ffcd3c"/>
        <StatCard icon={<Icons.ban s={20} c="#ef4444"/>} label="Suspended" value="34" color="#ef4444"/>
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
                <tr key={i} className="row-hover" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", transition:"background 0.15s" }}>
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
                      <button style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"0.75rem" }}>View</button>
                      {u.status!=="suspended" && <button style={{ padding:"5px 10px", borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:"0.75rem" }}>Suspend</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
const Messages = () => {
  const msgs = [
    { from:"Anonymous", to:"@temi_xx", preview:"You always make everyone feel so welcome", time:"2m ago", hints:2, flagged:false },
    { from:"Anonymous", to:"@sade_ng", preview:"I really like you but I'm too scared to say it", time:"5m ago", hints:0, flagged:false },
    { from:"Anonymous", to:"@mike_t", preview:"You are a terrible person and everyone hates you", time:"10m ago", hints:0, flagged:true },
    { from:"Anonymous", to:"@kolade_f", preview:"Your content is amazing, keep it up!", time:"15m ago", hints:1, flagged:false },
    { from:"Anonymous", to:"@grace_o", preview:"I wish I could tell you this in person", time:"22m ago", hints:3, flagged:false },
    { from:"Anonymous", to:"@femi_b", preview:"Stop pretending to be who you're not", time:"30m ago", hints:0, flagged:true },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.chat s={20} c="#a855f7"/>} label="Total messages" value="1.2M" change="8%" positive color="#a855f7"/>
        <StatCard icon={<Icons.mail s={20} c="#38bdf8"/>} label="Sent today" value="3,420" change="12%" positive color="#38bdf8"/>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Hints bought" value="89" change="18%" positive color="#ffcd3c"/>
        <StatCard icon={<Icons.flag s={20} c="#ef4444"/>} label="Flagged today" value="12" color="#ef4444"/>
      </div>

      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <p className="syne" style={{ color:"white", fontWeight:700 }}>All messages</p>
          <div style={{ display:"flex", gap:8 }}>
            <Badge text="All" color="#888"/>
            <Badge text="Flagged (12)" color="#ef4444" icon={<Icons.flag s={11} c="#ef4444"/>}/>
          </div>
        </div>
        {msgs.map((m,i) => (
          <div key={i} className="row-hover" style={{ display:"flex", gap:12, padding:"14px 10px", borderRadius:10, borderBottom:i<msgs.length-1?"1px solid rgba(255,255,255,0.05)":"none", alignItems:"center", transition:"background 0.15s" }}>
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
              {m.flagged && <button style={{ padding:"5px 10px", borderRadius:6, border:"none", background:"#ef4444", color:"white", cursor:"pointer", fontSize:"0.72rem", fontWeight:600 }}>Delete</button>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── HINTS ────────────────────────────────────────────────────────────────────
const Hints = () => {
  const hintData = [
    { tier:"Hint 1 — Gender", price:"₦100", sold:18420, revenue:"₦921,000", unmaskr:"₦460,500", users:"₦460,500" },
    { tier:"Hint 2 — Birth/Relationship", price:"₦150", sold:11230, revenue:"₦684,500", unmaskr:"₦342,250", users:"₦342,250" },
    { tier:"Hint 3 — Circle/Age/Location", price:"₦200", sold:9270, revenue:"₦854,000", unmaskr:"₦427,000", users:"₦427,000" },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<MaskIcon size={20} color="#ffcd3c"/>} label="Total hints sold" value="38,920" change="18%" positive color="#ffcd3c"/>
        <StatCard icon={<Icons.money s={20} c="#ff5c3a"/>} label="Total hint revenue" value="₦2.46M" change="22%" positive color="#ff5c3a"/>
        <StatCard icon={<Icons.bank s={20} c="#22c55e"/>} label="Unmaskr earned" value="₦1.23M" change="22%" positive color="#22c55e"/>
        <StatCard icon={<Icons.user s={20} c="#38bdf8"/>} label="Paid to users" value="₦1.23M" change="22%" positive color="#38bdf8"/>
      </div>

      <Card style={{ marginBottom:20 }}>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Hint performance by tier</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["Hint Tier","Price","Sold","Total Revenue","Unmaskr (50%)","Users (50%)"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:"0.72rem", fontWeight:600, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.08em", borderBottom:"1px solid rgba(255,255,255,0.06)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hintData.map((h,i) => (
                <tr key={i} className="row-hover" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"14px", color:"white", fontSize:"0.85rem", fontWeight:500 }}>{h.tier}</td>
                  <td style={{ padding:"14px" }}><Badge text={h.price} color="#ffcd3c"/></td>
                  <td style={{ padding:"14px", color:"rgba(255,255,255,0.7)", fontSize:"0.85rem" }}>{h.sold.toLocaleString()}</td>
                  <td style={{ padding:"14px", color:"white", fontSize:"0.85rem", fontWeight:600 }}>{h.revenue}</td>
                  <td style={{ padding:"14px", color:"#22c55e", fontSize:"0.85rem" }}>{h.unmaskr}</td>
                  <td style={{ padding:"14px", color:"#38bdf8", fontSize:"0.85rem" }}>{h.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:6 }}>Hint sales this week</p>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.82rem", marginBottom:18 }}>Daily breakdown</p>
        <BarChart data={[320,280,410,390,520,480,610]} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color="#ffcd3c" height={100}/>
      </Card>
    </div>
  );
};

// ─── GAMES ────────────────────────────────────────────────────────────────────
const GamesAdmin = () => (
  <div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
      <StatCard icon={<Icons.gamepad s={20} c="#22c55e"/>} label="Games played" value="8,441" change="5%" positive color="#22c55e"/>
      <StatCard icon={<MaskIcon size={20} color="#a855f7"/>} label="Mystery Lobby" value="6,120" change="8%" positive color="#a855f7"/>
      <StatCard icon={<Icons.money s={20} c="#ffcd3c"/>} label="Stake & Win" value="2,321" change="3%" positive color="#ffcd3c"/>
      <StatCard icon={<Icons.bank s={20} c="#ff5c3a"/>} label="Stake revenue" value="₦1.32M" change="11%" positive color="#ff5c3a"/>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Mystery Lobby games</p>
        <BarChart data={[80,120,95,160,140,200,180]} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color="#a855f7" height={90}/>
      </Card>
      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Stake & Win games</p>
        <BarChart data={[30,45,28,60,52,80,70]} labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} color="#ffcd3c" height={90}/>
      </Card>
    </div>
    <Card style={{ marginTop:14 }}>
      <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Recent Stake & Win games</p>
      {[
        { players:"@temi, @kolade, @sade", stake:"₦500 each", pot:"₦1,500", winner:"@sade", unmaskr:"₦225", time:"10m ago" },
        { players:"@david, @grace", stake:"₦1,000 each", pot:"₦2,000", winner:"@david", unmaskr:"₦300", time:"35m ago" },
        { players:"@mike, @femi, @grace, @temi", stake:"₦200 each", pot:"₦800", winner:"Tie", unmaskr:"₦120", time:"1h ago" },
      ].map((g,i) => (
        <div key={i} className="row-hover" style={{ padding:"14px 10px", borderRadius:10, borderBottom:i<2?"1px solid rgba(255,255,255,0.05)":"none" }}>
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

// ─── DEPOSITS ─────────────────────────────────────────────────────────────────
// Admin manually confirms deposits for now (business account, testing phase —
// no automated Paystack webhook yet). Confirming a deposit here is the trigger
// point for crediting the user's wallet AND sending the "deposit confirmed" email.
const Deposits = () => {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([
    { id:1, user:"@sade_ng", name:"Sade Nwosu", method:"Bank transfer", reference:"TRX-88213", amount:"₦2,000", requested:"Jul 7, 3:40 PM" },
    { id:2, user:"@temi_xx", name:"Temi Adeyemi", method:"Bank transfer", reference:"TRX-88190", amount:"₦5,000", requested:"Jul 7, 1:15 PM" },
    { id:3, user:"@femi_b", name:"Femi Bello", method:"Bank transfer", reference:"TRX-88144", amount:"₦1,500", requested:"Jul 6, 6:20 PM" },
  ]);
  const [completed, setCompleted] = useState([
    { user:"@kolade_f", name:"Kolade Femi", amount:"₦3,000", date:"Jul 5" },
    { user:"@david_a", name:"David Ama", amount:"₦1,000", date:"Jul 4" },
  ]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [justConfirmed, setJustConfirmed] = useState(null);

  const confirmDeposit = async (dep) => {
    setConfirmingId(dep.id);

    // ── TODO (real Supabase wiring, once table schema is confirmed): ──
    // 1. Update the deposit/transaction row: status -> 'confirmed'
    // 2. Credit dep.amount to the user's wallet balance (profiles/wallets table)
    // 3. Send the confirmation email via the send-email Edge Function:
    //
    //    await supabase.functions.invoke('send-email', {
    //      body: {
    //        to: userEmail,          // pull from the user's profile/auth record
    //        toName: dep.name,
    //        subject: "Your deposit has been confirmed",
    //        htmlContent: `<p>Hi ${dep.name},</p><p>Your deposit of ${dep.amount} has been confirmed and added to your Unmaskr wallet.</p>`
    //      }
    //    });

    // Simulated for now so the UI is testable before Supabase is wired in:
    await new Promise(r => setTimeout(r, 600));
    setPending(p => p.filter(x => x.id !== dep.id));
    setCompleted(c => [{ user:dep.user, name:dep.name, amount:dep.amount, date:"Just now" }, ...c]);
    setConfirmingId(null);
    setJustConfirmed(dep.id);
    setTimeout(() => setJustConfirmed(null), 2500);
  };

  const rejectDeposit = (dep) => {
    setPending(p => p.filter(x => x.id !== dep.id));
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.clock s={20} c="#ffcd3c"/>} label="Pending" value={`₦${pending.reduce((s,d)=>s+Number(d.amount.replace(/[₦,]/g,"")),0).toLocaleString()}`} color="#ffcd3c"/>
        <StatCard icon={<Icons.check s={20} c="#22c55e"/>} label="Confirmed today" value="₦48,000" change="3" positive color="#22c55e"/>
        <StatCard icon={<Icons.calendar s={20} c="#38bdf8"/>} label="Confirmed this month" value="₦960K" color="#38bdf8"/>
        <StatCard icon={<Icons.hash s={20} c="#a855f7"/>} label="Requests today" value={String(pending.length)} color="#a855f7"/>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["pending","completed"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${tab===t?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:tab===t?"rgba(255,92,58,0.15)":"transparent", color:tab===t?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.83rem", fontWeight:500, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      <Card>
        {tab === "pending" ? (
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
        ) : (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Completed deposits</p>
            {completed.map((d,i) => (
              <div key={i} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<completed.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
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
  const pending = [
    { user:"@sade_ng", name:"Sade Nwosu", bank:"GTBank", account:"0123456789", amount:"₦2,000", requested:"Jun 25, 2:14 PM" },
    { user:"@temi_xx", name:"Temi Adeyemi", bank:"Access Bank", account:"9876543210", amount:"₦5,500", requested:"Jun 25, 11:02 AM" },
    { user:"@femi_b", name:"Femi Bello", bank:"Kuda", account:"1122334455", amount:"₦800", requested:"Jun 24, 6:45 PM" },
    { user:"@grace_o", name:"Grace Okon", bank:"Opay", account:"5544332211", amount:"₦1,200", requested:"Jun 24, 4:30 PM" },
  ];
  const completed = [
    { user:"@kolade_f", name:"Kolade Femi", bank:"Zenith Bank", amount:"₦3,000", date:"Jun 23" },
    { user:"@david_a", name:"David Ama", bank:"First Bank", amount:"₦500", date:"Jun 22" },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.clock s={20} c="#ffcd3c"/>} label="Pending" value="₦182,000" color="#ffcd3c"/>
        <StatCard icon={<Icons.check s={20} c="#22c55e"/>} label="Paid today" value="₦48,000" change="3" positive color="#22c55e"/>
        <StatCard icon={<Icons.calendar s={20} c="#38bdf8"/>} label="Paid this month" value="₦1.2M" color="#38bdf8"/>
        <StatCard icon={<Icons.hash s={20} c="#a855f7"/>} label="Requests today" value="23" color="#a855f7"/>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["pending","completed"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${tab===t?"#ff5c3a":"rgba(255,255,255,0.1)"}`, background:tab===t?"rgba(255,92,58,0.15)":"transparent", color:tab===t?"#ff5c3a":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"0.83rem", fontWeight:500, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      <Card>
        {tab === "pending" ? (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Pending withdrawals ({pending.length})</p>
            {pending.map((w,i) => (
              <div key={i} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<pending.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                <div style={{ flex:1 }}>
                  <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{w.name} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}>{w.user}</span></p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.75rem", marginTop:2 }}>{w.bank} · {w.account} · {w.requested}</p>
                </div>
                <span className="syne" style={{ color:"white", fontWeight:700, fontSize:"1rem" }}>{w.amount}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <button style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#22c55e", color:"white", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5 }}><Icons.check s={12} c="white"/>Pay</button>
                  <button style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:"0.78rem" }}>Reject</button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Completed withdrawals</p>
            {completed.map((w,i) => (
              <div key={i} className="row-hover" style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 10px", borderRadius:10, borderBottom:i<completed.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
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
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refunded, setRefunded] = useState(false);
  const [sentConfirm, setSentConfirm] = useState(false);
  const [resolvedConfirm, setResolvedConfirm] = useState(false);
  const complaints = [
    { user:"@grace_o", subject:"Received a threatening message", msg:"Someone sent me a very threatening anonymous message saying they know where I live. I am scared.", status:"open", time:"1h ago", priority:"high" },
    { user:"@temi_xx", subject:"Payment issue — hint not unlocked", msg:"I paid ₦150 for a hint but the hint never showed. My money was deducted.", status:"open", time:"3h ago", priority:"medium" },
    { user:"@kolade_f", subject:"Account can't login", msg:"I've been trying to login for 2 days. I reset my password but it still says invalid credentials.", status:"in progress", time:"1d ago", priority:"medium" },
    { user:"@femi_b", subject:"Fake hint — wrong information", msg:"The hint said the sender may be female but the person told me it was actually a male. This is misleading.", status:"resolved", time:"2d ago", priority:"low" },
  ];
  const statusColor = { open:"#ef4444", "in progress":"#ffcd3c", resolved:"#22c55e" };
  const priorityColor = { high:"#ef4444", medium:"#ffcd3c", low:"#22c55e" };

  const selectComplaint = c => {
    setSelected(c);
    setReplyText("");
    setRefundAmount("");
    setRefunded(false);
    setSentConfirm(false);
    setResolvedConfirm(false);
  };

  const applyRefund = () => {
    if(!refundAmount) return;
    setRefunded(true);
    setReplyText(t => `We've refunded ₦${Number(refundAmount).toLocaleString()} to your Unmaskr wallet — it should reflect immediately. We're sorry for the inconvenience and appreciate your patience.`);
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard icon={<Icons.flag s={20} c="#ef4444"/>} label="Open" value="8" color="#ef4444"/>
        <StatCard icon={<Icons.clock s={20} c="#ffcd3c"/>} label="In progress" value="3" color="#ffcd3c"/>
        <StatCard icon={<Icons.check s={20} c="#22c55e"/>} label="Resolved today" value="5" color="#22c55e"/>
        <StatCard icon={<Icons.chart s={20} c="#a855f7"/>} label="Total all time" value="142" color="#a855f7"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 1fr":"1fr", gap:14 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>All complaints</p>
          {complaints.map((c,i) => (
            <div key={i} onClick={()=>selectComplaint(c)} className="row-hover" style={{ padding:"14px 12px", borderRadius:12, borderBottom:i<complaints.length-1?"1px solid rgba(255,255,255,0.05)":"none", cursor:"pointer", transition:"background 0.15s", background:selected===c?"rgba(255,92,58,0.08)":"transparent" }}>
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

            {/* Refund to wallet — for money-related complaints */}
            <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:"14px", marginBottom:20 }}>
              <p style={{ color:"#22c55e", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Refund to wallet</p>
              {refunded ? (
                <p style={{ color:"#22c55e", fontSize:"0.85rem", display:"flex", alignItems:"center", gap:6 }}><Icons.check s={14} c="#22c55e"/>₦{Number(refundAmount).toLocaleString()} refunded to {selected.user}'s wallet</p>
              ) : (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <input type="number" placeholder="Amount (₦)" value={refundAmount} onChange={e=>setRefundAmount(e.target.value)} style={{ width:120, padding:"9px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", outline:"none", fontSize:"0.82rem", fontFamily:"'DM Sans',sans-serif" }}/>
                  <button onClick={applyRefund} disabled={!refundAmount} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:refundAmount?"#22c55e":"#333", color:"white", cursor:refundAmount?"pointer":"not-allowed", fontSize:"0.8rem", fontWeight:600 }}>Refund & draft reply</button>
                </div>
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
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:6 }}>Nothing sends automatically — you review and click Send.</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{if(replyText.trim()){setSentConfirm(true);setTimeout(()=>setSentConfirm(false),2500);}}} disabled={!replyText.trim()} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:replyText.trim()?"#ff5c3a":"#333", color:"white", cursor:replyText.trim()?"pointer":"not-allowed", fontSize:"0.85rem", fontWeight:600 }}>Send reply</button>
              <button onClick={()=>{setResolvedConfirm(true);setTimeout(()=>setResolvedConfirm(false),2500);}} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid rgba(34,197,94,0.3)", background:"rgba(34,197,94,0.1)", color:"#22c55e", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }}>Mark resolved</button>
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
const AdminSettings = ({ onLogout }) => (
  <div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card>
        <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:18 }}>Platform settings</p>
        {[
          { label:"Maintenance mode", desc:"Temporarily disable the app for all users", on:false },
          { label:"New signups", desc:"Allow new users to register", on:true },
          { label:"Hint purchases", desc:"Allow hint purchases", on:true },
          { label:"Games", desc:"Enable games section", on:true },
          { label:"Withdrawals", desc:"Allow users to withdraw funds", on:true },
          { label:"Stake & Win", desc:"Enable 18+ staking game", on:true },
        ].map(s => (
          <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <p style={{ color:"white", fontSize:"0.85rem", fontWeight:500 }}>{s.label}</p>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.75rem" }}>{s.desc}</p>
            </div>
            <div style={{ width:40, height:22, borderRadius:50, background:s.on?"#22c55e":"#333", position:"relative", cursor:"pointer", flexShrink:0 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:3, left:s.on?21:3, transition:"left 0.2s" }}/>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Card>
          <p className="syne" style={{ color:"white", fontWeight:700, marginBottom:16 }}>Revenue split</p>
          {[
            { label:"Hint revenue to Unmaskr", value:"50%" },
            { label:"Hint revenue to user", value:"50%" },
            { label:"Stake & Win fee", value:"15%" },
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
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.83rem", marginBottom:16 }}>admin@unmaskr.com</p>
          <button style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", cursor:"pointer", fontSize:"0.85rem", fontWeight:600 }} onClick={onLogout}>
            Sign out
          </button>
        </Card>
      </div>
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [active, setActive] = useState("overview");
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

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
        if (adminRow) setLoggedIn(true);
        else await supabase.auth.signOut();
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
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
        <MaskIcon size={40} color="rgba(255,255,255,0.3)"/>
      </div>
    </>
  );

  if (!loggedIn) return (
    <>
      <GlobalStyles/>
      <AdminLogin onLogin={() => setLoggedIn(true)}/>
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
              <div className="pulse" style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:50, padding:"6px 12px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e" }}/>
                <span style={{ color:"#22c55e", fontSize:"0.72rem", fontWeight:600 }}>1,247 online</span>
              </div>
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
            {active==="settings"      && <AdminSettings onLogout={handleLogout}/>}
          </div>
        </div>
      </div>
    </>
  );
}