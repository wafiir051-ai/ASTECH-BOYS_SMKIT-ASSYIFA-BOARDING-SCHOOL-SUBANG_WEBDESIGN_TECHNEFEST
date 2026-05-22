import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { BookOpen, ClipboardList, Users, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function useFadeIn(delay = 0) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay*1000); return () => clearTimeout(t); }, []);
  return { opacity:go?1:0, transform:go?"translateY(0)":"translateY(16px)", transition:`opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(.22,1,.36,1) ${delay}s` };
}

function useCounter(target, delay=0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), delay*1000+200); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!started) return;
    const num = parseInt(target);
    if (isNaN(num)) return;
    const start = performance.now();
    const tick = (now) => { const p = Math.min((now-start)/900,1); setCount(Math.round((1-Math.pow(1-p,3))*num)); if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [started, target]);
  return target==="-"?"-":count;
}

function StatCard({ label, value, icon:Icon, color, bg, delay=0, isMobile }) {
  const style = useFadeIn(delay);
  const displayed = useCounter(value, delay);
  const [hov, setHov] = useState(false);
  return (
    <div style={{ ...style, background:"#fff", border:`1px solid ${hov?color+"50":"rgba(0,0,0,0.07)"}`, padding: isMobile?"14px 16px":"20px 22px", display:"flex", alignItems:"center", gap:isMobile?12:16, borderRadius:12, boxShadow:hov?`0 6px 24px ${color}18`:"0 1px 3px rgba(0,0,0,0.04)", transition:"border 0.2s, box-shadow 0.2s, transform 0.2s", transform:hov?"translateY(-2px)":"translateY(0)", cursor:"default" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ width:isMobile?36:44, height:isMobile?36:44, background:bg, borderRadius:isMobile?9:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform 0.2s", transform:hov?"scale(1.08) rotate(-4deg)":"scale(1)" }}>
        <Icon size={isMobile?16:20} color={color} />
      </div>
      <div>
        <p style={{ fontSize:isMobile?22:30, fontWeight:800, color:"#111", margin:0, lineHeight:1, letterSpacing:"-1px" }}>{displayed}</p>
        <p style={{ fontSize:isMobile?9:10, color:"#9ca3af", letterSpacing:"1px", textTransform:"uppercase", margin:"4px 0 0", fontWeight:600 }}>{label}</p>
      </div>
    </div>
  );
}

function ListItem({ children, to, delay=0 }) {
  const [hov, setHov] = useState(false);
  const style = useFadeIn(delay);
  const inner = (
    <div style={{ ...style, background:"#fff", border:`1px solid ${hov?"rgba(16,185,129,0.3)":"rgba(0,0,0,0.06)"}`, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, borderRadius:10, cursor:"pointer", boxShadow:hov?"0 4px 16px rgba(0,0,0,0.07)":"0 1px 3px rgba(0,0,0,0.04)", transition:"border 0.15s, box-shadow 0.15s, transform 0.15s", transform:hov?"translateX(3px)":"translateX(0)" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration:"none" }}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { user, isMobile } = useOutletContext();

  const role = user?.role || "student";
  const PALETTE = ["#022c22","#064e3b","#065f46","#0a2240","#1e1b4b"];

  const { data: courses=[] } = useQuery({ queryKey:["courses",role,user?.email], queryFn:() => role==="student" ? entities.CourseEnrollment.filter({student_id:user?.email}) : entities.Course.filter({teacher_id:user?.email}) });
  const { data: assignments=[] } = useQuery({ queryKey:["assignments-all"], queryFn:() => entities.Assignment.list() });
  const { data: submissions=[] } = useQuery({ queryKey:["submissions-recent",user?.email], queryFn:() => role==="student" ? entities.Submission.filter({student_id:user?.email}) : entities.Submission.list("-created_date",10) });

  const greeting = () => { const h=new Date().getHours(); if(h<12) return "Selamat Pagi"; if(h<15) return "Selamat Siang"; if(h<18) return "Selamat Sore"; return "Selamat Malam"; };
  const avgScore = () => { const scored=submissions.filter(s=>s.score!=null); if(!scored.length) return "-"; return Math.round(scored.reduce((a,s)=>a+s.score,0)/scored.length); };

  const heroStyle = useFadeIn(0);
  const statsStyle = useFadeIn(0.1);
  const sec1Style = useFadeIn(0.35);
  const sec2Style = useFadeIn(0.4);

  const statCards = role==="student"
    ? [
        { label:"Total Kelas",     value:courses.length,     icon:BookOpen,     color:"#059669", bg:"#d1fae5" },
        { label:"Dikumpulkan",     value:submissions.length, icon:ClipboardList,color:"#2563eb", bg:"#dbeafe" },
        { label:"Nilai Rata-rata", value:avgScore(),         icon:ArrowRight,   color:"#7c3aed", bg:"#ede9fe" },
        { label:"Perlu Dinilai",   value:submissions.filter(s=>s.status==="submitted").length, icon:Clock, color:"#d97706", bg:"#fef3c7" },
      ]
    : [
        { label:"Total Kelas",   value:courses.length,     icon:BookOpen,     color:"#059669", bg:"#d1fae5" },
        { label:"Tugas Dibuat",  value:assignments.length, icon:ClipboardList,color:"#2563eb", bg:"#dbeafe" },
        { label:"Murid Aktif",   value:submissions.length, icon:Users,        color:"#7c3aed", bg:"#ede9fe" },
        { label:"Perlu Dinilai", value:submissions.filter(s=>s.status==="submitted").length, icon:Clock, color:"#d97706", bg:"#fef3c7" },
      ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?14:20 }}>
      <style>{`
        @keyframes shimmerBar { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes orbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes badgePop   { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {/* Hero */}
      <div style={{ ...heroStyle, background:"linear-gradient(135deg,#022c22 0%,#064e3b 55%,#065f46 100%)", borderRadius:isMobile?12:14, padding:isMobile?"20px 20px":"28px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden", boxShadow:"0 4px 24px rgba(2,44,34,0.15)" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(52,211,153,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.14) 0%,transparent 70%)", animation:"orbFloat 5s ease-in-out infinite", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1, minWidth:0 }}>
          <p style={{ fontSize:10, color:"rgba(52,211,153,0.65)", letterSpacing:"2.5px", textTransform:"uppercase", margin:"0 0 6px", fontWeight:600 }}>{greeting()}</p>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?"clamp(18px,5vw,24px)":"clamp(22px,3vw,34px)", color:"#fff", margin:"0 0 4px", fontWeight:"normal", lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:isMobile?160:400 }}>
            {user?.full_name||"Pengguna"}
          </h1>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>{role==="teacher"?"Pengajar · EduSpace":"Peserta Didik · EduSpace"}</p>
          {!isMobile && (
            <div style={{ marginTop:14, height:2, width:56, background:"rgba(52,211,153,0.2)", borderRadius:2, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.8),transparent)", animation:"shimmerBar 2.2s infinite" }} />
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, position:"relative", zIndex:1, flexShrink:0, marginLeft:12 }}>
          {!isMobile && (
            <div style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", fontSize:9, fontWeight:700, letterSpacing:"3px", padding:"5px 12px", borderRadius:6, animation:"badgePop 0.6s 0.3s both" }}>
              {role==="teacher"?"TEACHER":"STUDENT"}
            </div>
          )}
          <div style={{ display:"flex", gap:isMobile?10:16, background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:isMobile?"8px 12px":"10px 18px" }}>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:isMobile?16:20, fontWeight:700, color:"#34d399", margin:0, lineHeight:1 }}>{courses.length}</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:"1px", textTransform:"uppercase", margin:"3px 0 0" }}>Kelas</p>
            </div>
            <div style={{ width:1, background:"rgba(255,255,255,0.1)" }} />
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:isMobile?16:20, fontWeight:700, color:"#60a5fa", margin:0, lineHeight:1 }}>{assignments.length}</p>
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:"1px", textTransform:"uppercase", margin:"3px 0 0" }}>Tugas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ ...statsStyle, display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fit,minmax(175px,1fr))", gap:isMobile?8:12 }}>
        {statCards.map((sc,i) => <StatCard key={sc.label} {...sc} delay={0.12+i*0.07} isMobile={isMobile} />)}
      </div>

      {/* Two columns */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(280px,1fr))", gap:isMobile?14:20 }}>

        {/* Tugas */}
        <div style={sec1Style}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:"1.5px", textTransform:"uppercase", margin:0 }}>Tugas Terbaru</p>
            <Link to={role==="student"?"/my-assignments":"/assignments"} style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#10b981", textDecoration:"none", fontWeight:600 }}>Lihat Semua <ArrowRight size={12} /></Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {assignments.slice(0,isMobile?3:4).map((a,i) => (
              <ListItem key={a.id} delay={0.45+i*0.06}>
                <div style={{ width:32, height:32, borderRadius:8, background:a.type==="quiz"?"rgba(217,119,6,0.1)":"rgba(5,150,105,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {a.type==="quiz"?<ClipboardList size={13} color="#d97706"/>:<CheckCircle size={13} color="#059669"/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#111", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</p>
                  <p style={{ fontSize:11, color:"#9ca3af", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.course_title}</p>
                </div>
                <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20, background:a.type==="quiz"?"rgba(217,119,6,0.1)":"rgba(5,150,105,0.08)", color:a.type==="quiz"?"#d97706":"#059669", flexShrink:0 }}>
                  {a.type==="quiz"?"Kuis":a.type==="material"?"Materi":"Tugas"}
                </span>
              </ListItem>
            ))}
            {assignments.length===0&&<div style={{ padding:"24px", textAlign:"center", fontSize:13, color:"#d1d5db", background:"#fff", borderRadius:10, border:"1.5px dashed rgba(0,0,0,0.07)" }}>Belum ada tugas</div>}
          </div>
        </div>

        {/* Kelas */}
        <div style={sec2Style}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:"1.5px", textTransform:"uppercase", margin:0 }}>Kelas Aktif</p>
            <Link to="/courses" style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#10b981", textDecoration:"none", fontWeight:600 }}>Lihat Semua <ArrowRight size={12} /></Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {courses.slice(0,isMobile?3:4).map((c,i) => {
              const title = c.title||c.course_title;
              return (
                <ListItem key={c.id} delay={0.45+i*0.06} to={"/courses/"+(c.course_id||c.id)}>
                  <div style={{ width:32, height:32, borderRadius:8, background:PALETTE[i%PALETTE.length], display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{title?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"#111", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</p>
                    <p style={{ fontSize:11, color:"#9ca3af", margin:"2px 0 0" }}>{c.teacher_name||"Guru"}</p>
                  </div>
                  <ArrowRight size={13} color="#d1d5db" />
                </ListItem>
              );
            })}
            {courses.length===0&&<div style={{ padding:"24px", textAlign:"center", fontSize:13, color:"#d1d5db", background:"#fff", borderRadius:10, border:"1.5px dashed rgba(0,0,0,0.07)" }}>Belum ada kelas</div>}
          </div>
        </div>
      </div>

      {/* Submissions teacher */}
      {role!=="student" && submissions.length>0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 10px" }}>Pengumpulan Terbaru</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {submissions.slice(0,isMobile?3:5).map((sub,i) => (
              <ListItem key={sub.id} delay={0.5+i*0.06}>
                <div style={{ width:32, height:32, borderRadius:8, background:sub.status==="submitted"?"rgba(217,119,6,0.1)":"rgba(5,150,105,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Clock size={13} color={sub.status==="submitted"?"#d97706":"#059669"} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#111", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub.student_name||sub.student_id}</p>
                  <p style={{ fontSize:11, color:"#9ca3af", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub.assignment_title||"Tugas"}</p>
                </div>
                <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20, background:sub.status==="graded"?"rgba(5,150,105,0.08)":"rgba(217,119,6,0.1)", color:sub.status==="graded"?"#059669":"#d97706", flexShrink:0 }}>
                  {sub.status==="graded"?sub.score:"Menunggu"}
                </span>
              </ListItem>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
