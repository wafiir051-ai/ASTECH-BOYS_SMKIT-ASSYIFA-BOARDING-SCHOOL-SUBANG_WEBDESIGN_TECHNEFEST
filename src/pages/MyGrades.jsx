import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { useState, useEffect } from "react";
import { Star, TrendingUp, CheckCircle, ClipboardList, Sparkles } from "lucide-react";

function useFadeIn(delay = 0) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), delay*1000); return () => clearTimeout(t); }, []);
  return { opacity:go?1:0, transform:go?"translateY(0)":"translateY(16px)", transition:`opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(.22,1,.36,1) ${delay}s` };
}

function useCounter(target, delay=0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), delay*1000+300); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!started) return;
    const num = parseInt(target);
    if (isNaN(num)||target==="-") return;
    const start = performance.now();
    const tick = (now) => { const p=Math.min((now-start)/1000,1); setCount(Math.round((1-Math.pow(1-p,3))*num)); if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [started, target]);
  return target==="-"?"-":count;
}

const getGrade = (score, max=100) => {
  const p = (score/max)*100;
  if (p>=90) return { label:"A", color:"#34d399", bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.25)" };
  if (p>=80) return { label:"B", color:"#60a5fa", bg:"rgba(96,165,250,0.1)",  border:"rgba(96,165,250,0.25)" };
  if (p>=70) return { label:"C", color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.25)" };
  if (p>=60) return { label:"D", color:"#fb923c", bg:"rgba(251,146,60,0.1)",  border:"rgba(251,146,60,0.25)" };
  return             { label:"E", color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.25)" };
};

function StatCard({ icon:Icon, value, label, color="#34d399", delay=0, isMobile }) {
  const style = useFadeIn(delay);
  const displayed = useCounter(value==="-"?0:value, delay);
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      ...style,
      background:"#fff",
      border:`1px solid ${hov?color+"40":"rgba(0,0,0,0.06)"}`,
      padding: isMobile?"14px 16px":"22px 24px",
      borderRadius:12,
      display:"flex", alignItems:"center", gap:isMobile?12:18,
      boxShadow:hov?`0 8px 28px ${color}18`:"0 1px 4px rgba(0,0,0,0.05)",
      transition:"border 0.2s, box-shadow 0.25s, transform 0.2s",
      transform:hov?"translateY(-2px)":"translateY(0)",
      cursor:"default",
    }}>
      <div style={{ width:isMobile?36:48, height:isMobile?36:48, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform 0.2s", transform:hov?"scale(1.1) rotate(-4deg)":"scale(1)" }}>
        <Icon size={isMobile?16:20} color={color} />
      </div>
      <div>
        <p style={{ fontSize:isMobile?22:32, fontWeight:800, color:"#111", margin:0, lineHeight:1, letterSpacing:"-1px" }}>{value==="-"?"-":displayed}</p>
        <p style={{ fontSize:isMobile?9:10, color:"rgba(0,0,0,0.38)", letterSpacing:"1px", textTransform:"uppercase", margin:"4px 0 0", fontWeight:600 }}>{label}</p>
      </div>
    </div>
  );
}

function GradeRow({ sub, assignment, index, isMobile }) {
  const [hov, setHov] = useState(false);
  const style = useFadeIn(0.1+index*0.07);
  const max = assignment?.max_score||100;
  const grade = getGrade(sub.score, max);
  const pct = Math.min((sub.score/max)*100, 100);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      ...style,
      background:hov?"#fafffe":"#fff",
      borderTop:`1px solid ${hov?grade.color+"40":"rgba(0,0,0,0.06)"}`,
      borderRight:`1px solid ${hov?grade.color+"40":"rgba(0,0,0,0.06)"}`,
      borderBottom:`1px solid ${hov?grade.color+"40":"rgba(0,0,0,0.06)"}`,
      borderLeft:`4px solid ${grade.color}`,
      borderRadius:12, padding:isMobile?"12px 14px":"16px 20px",
      display:"flex", alignItems:"center", gap:isMobile?12:18,
      boxShadow:hov?`0 8px 28px rgba(0,0,0,0.09)`:"0 1px 4px rgba(0,0,0,0.04)",
      transform:hov?"translateX(4px)":"translateX(0)",
      transition:"border 0.2s, box-shadow 0.2s, transform 0.2s",
      cursor:"default",
    }}>
      {/* Grade badge */}
      <div style={{ width:isMobile?40:52, height:isMobile?40:52, borderRadius:10, background:grade.bg, border:`1px solid ${grade.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform 0.22s", transform:hov?"scale(1.08)":"scale(1)" }}>
        <span style={{ fontSize:isMobile?18:22, fontWeight:800, color:grade.color }}>{grade.label}</span>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:isMobile?13:14, fontWeight:600, color:"#111", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{assignment?.title||"Tugas"}</p>
        <p style={{ fontSize:11, color:"rgba(0,0,0,0.38)", margin:"2px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{assignment?.course_title||""}</p>
        {!isMobile && sub.feedback && (
          <p style={{ fontSize:11, color:"rgba(0,0,0,0.32)", fontStyle:"italic", margin:"4px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{sub.feedback}"</p>
        )}
        <div style={{ marginTop:8, height:4, background:"rgba(0,0,0,0.06)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${grade.color}88,${grade.color})`, borderRadius:3, transition:"width 0.8s cubic-bezier(.22,1,.36,1)" }} />
        </div>
        {!isMobile && <p style={{ fontSize:10, color:"rgba(0,0,0,0.3)", margin:"3px 0 0" }}>{Math.round(pct)}% dari nilai maksimum</p>}
      </div>

      {/* Score */}
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <p style={{ fontSize:isMobile?24:32, fontWeight:800, color:grade.color, margin:0, lineHeight:1, letterSpacing:"-1px" }}>{sub.score}</p>
        <p style={{ fontSize:10, color:"rgba(0,0,0,0.3)", margin:"3px 0 0" }}>/ {max}</p>
      </div>
    </div>
  );
}

export default function MyGrades() {
  const { user, isMobile } = useOutletContext();
  if (!user) return null;

  const { data: submissions=[] } = useQuery({ queryKey:["my-grades",user?.email], queryFn:() => entities.Submission.filter({student_id:user.email}), enabled:!!user?.email });
  const { data: assignments=[] }  = useQuery({ queryKey:["assignments-for-grades"], queryFn:() => entities.Assignment.list() });

  const assignmentMap = Object.fromEntries(assignments.map(a=>[a.id,a]));
  const graded = submissions.filter(s=>s.score!=null);
  const avg = graded.length>0 ? Math.round(graded.reduce((a,s)=>{ const max=assignmentMap[s.assignment_id]?.max_score||100; return a+Math.min((s.score/max)*100,100); },0)/graded.length) : null;
  const avgColor = avg==null?"#34d399":avg>=80?"#34d399":avg>=60?"#f59e0b":"#f87171";

  const heroStyle = useFadeIn(0);
  const listLabel = useFadeIn(0.4);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:isMobile?14:20 }}>
      <style>{`
        @keyframes orbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmerBar { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes badgePop   { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {/* Hero */}
      <div style={{ ...heroStyle, background:"linear-gradient(135deg,#022c22 0%,#064e3b 55%,#065f46 100%)", borderRadius:isMobile?12:14, padding:isMobile?"20px 20px":"28px 36px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden", boxShadow:"0 4px 24px rgba(2,44,34,0.15)" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(52,211,153,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.14) 0%,transparent 70%)", animation:"orbFloat 5s ease-in-out infinite", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <Sparkles size={12} color="rgba(52,211,153,0.7)" />
            <span style={{ fontSize:10, color:"rgba(52,211,153,0.7)", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:600 }}>Rekap Akademik</span>
          </div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:isMobile?24:32, color:"#fff", margin:"0 0 5px", fontWeight:"normal", lineHeight:1.1 }}>Nilai Saya</h1>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:0 }}>Rekap nilai dan feedback dari guru</p>
          {!isMobile && (
            <div style={{ marginTop:14, height:2, width:60, background:"rgba(52,211,153,0.2)", borderRadius:2, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.8),transparent)", animation:"shimmerBar 2.2s infinite" }} />
            </div>
          )}
        </div>

        {/* Avg badge */}
        {avg!=null && (
          <div style={{ background:"rgba(0,0,0,0.25)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:12, padding:isMobile?"12px 16px":"16px 22px", textAlign:"center", position:"relative", zIndex:1, flexShrink:0, marginLeft:12, animation:"badgePop 0.6s 0.3s both" }}>
            <span style={{ display:"block", fontSize:9, color:"rgba(52,211,153,0.6)", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:4 }}>Rata-rata</span>
            <span style={{ fontSize:isMobile?28:38, fontWeight:800, color:avgColor, lineHeight:1, fontFamily:"Inter,sans-serif" }}>{avg}</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginLeft:2 }}>%</span>
          </div>
        )}
      </div>

      {/* Stats — 2 kolom di mobile, 4 di desktop */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:isMobile?8:12 }}>
        <StatCard icon={TrendingUp}    value={avg??"-"}                      label="Rata-rata %"   color={avgColor}  delay={0.1}  isMobile={isMobile} />
        <StatCard icon={Star}          value={graded.length}                  label="Sudah Dinilai" color="#34d399"   delay={0.16} isMobile={isMobile} />
        <StatCard icon={ClipboardList} value={submissions.length}             label="Dikumpulkan"   color="#60a5fa"   delay={0.22} isMobile={isMobile} />
        <StatCard icon={CheckCircle}   value={submissions.length-graded.length} label="Menunggu"  color="#f59e0b"   delay={0.28} isMobile={isMobile} />
      </div>

      {/* Label */}
      <div style={{ ...listLabel, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(0,0,0,0.3)", letterSpacing:"1.5px", textTransform:"uppercase", margin:0 }}>Detail Nilai</p>
        <p style={{ fontSize:11, color:"rgba(0,0,0,0.25)", margin:0 }}>{graded.length} tugas dinilai</p>
      </div>

      {/* List */}
      {graded.length===0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:isMobile?"40px 20px":"64px 24px", background:"#fff", borderRadius:14, border:"1.5px dashed rgba(0,0,0,0.08)", textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:14, background:"rgba(52,211,153,0.07)", border:"1px dashed rgba(52,211,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, animation:"orbFloat 4s ease-in-out infinite" }}>
            <Star size={24} color="rgba(52,211,153,0.35)" />
          </div>
          <p style={{ fontSize:14, color:"rgba(0,0,0,0.35)", margin:0, fontWeight:500 }}>Belum ada nilai yang tersedia</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {graded.sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).map((sub,i) => (
            <GradeRow key={sub.id} sub={sub} assignment={assignmentMap[sub.assignment_id]} index={i} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}
