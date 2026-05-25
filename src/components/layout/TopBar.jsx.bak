import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, FileText, ClipboardList, X } from "lucide-react";
import { supabase } from "@/api/supabaseClient";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return Math.floor(diff / 60) + " mnt lalu";
  if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
  return new Date(iso).toLocaleDateString("id-ID", { day:"numeric", month:"short" });
}

function Clock({ isMobile }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const hh = String(time.getHours()).padStart(2,"0");
  const mm = String(time.getMinutes()).padStart(2,"0");
  const ss = String(time.getSeconds()).padStart(2,"0");
  const days = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  if (isMobile) return (
    <div style={{ fontSize:12, fontWeight:700, color:"#064e3b", fontFamily:"'SF Mono',Monaco,monospace", flexShrink:0 }}>
      {hh}:{mm}
    </div>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(6,78,59,0.06)", border:"1px solid rgba(6,78,59,0.1)", borderRadius:8, padding:"6px 12px", flexShrink:0 }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
        <span style={{ fontSize:14, fontWeight:700, color:"#064e3b", fontFamily:"'SF Mono',Monaco,monospace", lineHeight:1, letterSpacing:"0.5px" }}>
          {hh}<span style={{ opacity: time.getSeconds()%2===0?1:0.3, transition:"opacity 0.1s" }}>:</span>{mm}<span style={{ opacity: time.getSeconds()%2===0?1:0.3, transition:"opacity 0.1s" }}>:</span>{ss}
        </span>
        <span style={{ fontSize:9, color:"#6b7280", letterSpacing:"0.5px", marginTop:1 }}>{days[time.getDay()]}, {time.getDate()} {months[time.getMonth()]}</span>
      </div>
    </div>
  );
}

export default function TopBar({ user, onMenuClick, title, isMobile }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const fetchNotifs = async () => {
    if (!user?.email) return;
    setLoadingNotifs(true);
    try {
      let items = [];
      if (user.role === "student") {
        const { data: enrollments } = await supabase.from("CourseEnrollment").select("course_id,course_title").eq("student_id", user.email);
        const courseIds = (enrollments || []).map(e => e.course_id);
        if (courseIds.length > 0) {
          const { data: assignments } = await supabase.from("Assignment").select("id,title,type,course_id,course_title,created_date").in("course_id", courseIds).eq("published", true).order("created_date", { ascending: false }).limit(10);
          items = (assignments || []).map(a => ({ id:a.id, kind:a.type==="quiz"?"quiz":"assignment", title:a.title||"Tugas baru", subtitle:a.course_title||"", when:a.created_date, link:"/assignments/"+a.id }));
        }
      } else {
        const { data: assignments } = await supabase.from("Assignment").select("id,title,type,course_id,course_title,created_date").eq("teacher_id", user.email).order("created_date", { ascending: false }).limit(10);
        items = (assignments || []).map(a => ({ id:a.id, kind:a.type==="quiz"?"quiz":"assignment", title:a.title||"Tugas", subtitle:a.course_title||"", when:a.created_date, link:"/assignments/"+a.id }));
      }
      setNotifs(items);
    } catch(err) { console.error(err); }
    finally { setLoadingNotifs(false); }
  };

  const hasFresh = notifs.some(n => n.when && (Date.now() - new Date(n.when).getTime()) < 7*86400*1000);

  return (
    <header style={{ position:"sticky", top:0, zIndex:20, background:"rgba(237,242,239,0.9)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:"1px solid rgba(6,78,59,0.1)", height:isMobile?52:60, display:"flex", alignItems:"center", padding: isMobile?"0 12px":"0 24px", gap: isMobile?8:14 }}>

      <button onClick={onMenuClick} style={{ background:"none", border:"none", cursor:"pointer", color:"#111", display:"flex", alignItems:"center", padding:4, borderRadius:6, flexShrink:0 }}>
        <Menu size={isMobile?18:20} />
      </button>

      {!searchOpen && (
        <h1 style={{ fontSize: isMobile?13:15, fontWeight:700, color:"#111", fontFamily:"Inter,sans-serif", margin:0, letterSpacing:"-0.2px", flexShrink:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth: isMobile?120:200 }}>{title}</h1>
      )}

      {/* Search — full bar desktop, expandable mobile */}
      {isMobile ? (
        searchOpen ? (
          <div ref={searchRef} style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1, position:"relative", display:"flex", alignItems:"center" }}>
              <Search size={13} style={{ position:"absolute", left:10, color:"rgba(6,78,59,0.4)", pointerEvents:"none" }} />
              <input autoFocus type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&search.trim()){navigate("/courses?q="+encodeURIComponent(search.trim()));setSearchOpen(false);}}}
                placeholder="Cari..."
                style={{ width:"100%", background:"rgba(6,78,59,0.05)", border:"1px solid rgba(6,78,59,0.12)", borderRadius:8, padding:"7px 10px 7px 30px", fontSize:13, color:"#111", outline:"none", fontFamily:"Inter,sans-serif" }} />
            </div>
            <button onClick={() => { setSearchOpen(false); setSearch(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#6b7280", padding:4 }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex:1 }} />
            <button onClick={() => setSearchOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#374151", padding:4, display:"flex", alignItems:"center" }}>
              <Search size={18} />
            </button>
          </>
        )
      ) : (
        <>
          <div style={{ flex:1, maxWidth:400, marginLeft:8, position:"relative", display:"flex", alignItems:"center" }}>
            <Search size={14} style={{ position:"absolute", left:11, color:"rgba(6,78,59,0.4)", pointerEvents:"none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter"&&search.trim()) navigate("/courses?q="+encodeURIComponent(search.trim())); }}
              placeholder="Cari kelas, tugas, atau materi..."
              style={{ width:"100%", background:"rgba(6,78,59,0.05)", border:"1px solid rgba(6,78,59,0.08)", borderRadius:8, padding:"7px 11px 7px 32px", fontSize:13, color:"#111", outline:"none", fontFamily:"Inter,sans-serif" }}
              onFocus={e => { e.target.style.background="#fff"; e.target.style.borderColor="rgba(16,185,129,0.4)"; }}
              onBlur={e => { e.target.style.background="rgba(6,78,59,0.05)"; e.target.style.borderColor="rgba(6,78,59,0.08)"; }} />
          </div>
          <div style={{ flex:1, minWidth:0 }} />
        </>
      )}

      {!searchOpen && <Clock isMobile={isMobile} />}

      {/* Notif */}
      {!searchOpen && (
        <div ref={notifRef} style={{ position:"relative", flexShrink:0 }}>
          <button onClick={() => setNotifOpen(v=>!v)}
            style={{ background:notifOpen?"rgba(16,185,129,0.12)":"rgba(6,78,59,0.05)", border:"1px solid rgba(6,78,59,0.08)", borderRadius:8, width:isMobile?32:36, height:isMobile?32:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", color:"#0a3d1f" }}>
            <Bell size={isMobile?15:16} />
            {hasFresh && <span style={{ position:"absolute", top:7, right:8, width:6, height:6, borderRadius:"50%", background:"#10b981", border:"1.5px solid rgba(237,242,239,1)" }} />}
          </button>

          {notifOpen && (
            <div style={{ position:"fixed", top:isMobile?"60px":"calc(100% + 8px)", right:isMobile?"12px":"0", left:isMobile?"12px":"auto", width:isMobile?"auto":360, maxWidth:isMobile?"none":360, maxHeight:480, background:"#fff", border:"1px solid rgba(6,78,59,0.1)", borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.08)", overflow:"hidden", fontFamily:"Inter,sans-serif", display:"flex", flexDirection:"column", zIndex:100 }}>
              <div style={{ padding:"13px 16px", borderBottom:"1px solid rgba(6,78,59,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#111" }}>Notifikasi</span>
                <button onClick={fetchNotifs} style={{ background:"none", border:"none", fontSize:11, color:"#10b981", cursor:"pointer", fontWeight:500 }}>Muat ulang</button>
              </div>
              <div style={{ overflowY:"auto", flex:1 }}>
                {loadingNotifs && notifs.length===0 ? (
                  <div style={{ padding:"32px 20px", textAlign:"center", color:"rgba(17,17,17,0.4)", fontSize:13 }}>Memuat…</div>
                ) : notifs.length===0 ? (
                  <div style={{ padding:"32px 20px", textAlign:"center", color:"rgba(17,17,17,0.4)", fontSize:13, lineHeight:1.5 }}>
                    <Bell size={28} color="#d1d5db" style={{ marginBottom:10, display:"block", margin:"0 auto 10px" }} />
                    <p style={{ margin:0 }}>Belum ada notifikasi</p>
                    <p style={{ margin:"4px 0 0", fontSize:11, opacity:0.7 }}>{user?.role==="teacher"?"Tugas yang kamu buat akan muncul di sini":"Tugas baru dari kelas akan muncul di sini"}</p>
                  </div>
                ) : notifs.map(n => (
                  <button key={n.id} onClick={() => { setNotifOpen(false); navigate(n.link); }}
                    style={{ width:"100%", background:"none", border:"none", borderBottom:"1px solid rgba(6,78,59,0.05)", padding:"12px 16px", display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer", textAlign:"left", fontFamily:"Inter,sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(16,185,129,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background="none"}>
                    <div style={{ width:34, height:34, borderRadius:8, background:n.kind==="quiz"?"rgba(167,139,250,0.12)":"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {n.kind==="quiz" ? <ClipboardList size={15} color="#a78bfa" /> : <FileText size={15} color="#10b981" />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#111", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {n.kind==="quiz"?"📝 Kuis: ":"📄 Tugas: "}{n.title}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(17,17,17,0.5)", display:"flex", justifyContent:"space-between", gap:8 }}>
                        <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.subtitle}</span>
                        <span style={{ flexShrink:0, color:"#10b981" }}>{timeAgo(n.when)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avatar */}
      {!searchOpen && (
        <div style={{ width:isMobile?30:34, height:isMobile?30:34, background:"linear-gradient(135deg,#061510,#0a3d1f)", border:"1.5px solid rgba(52,211,153,0.35)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
            : <span style={{ color:"#34d399", fontSize:isMobile?11:13, fontWeight:700 }}>{user?.full_name?.charAt(0)?.toUpperCase()||"U"}</span>
          }
        </div>
      )}
    </header>
  );
}
