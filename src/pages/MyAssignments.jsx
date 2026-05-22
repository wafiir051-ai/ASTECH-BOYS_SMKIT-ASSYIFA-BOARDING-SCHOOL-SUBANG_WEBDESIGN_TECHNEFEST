import { useOutletContext, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { useState, useEffect } from "react";
import { ClipboardList, Clock, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { format, isPast } from "date-fns";
import { id as idLocale } from "date-fns/locale";

function useFadeIn(delay = 0) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), delay * 1000);
    return () => clearTimeout(t);
  }, []);
  return {
    opacity: go ? 1 : 0,
    transform: go ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.5s ease, transform 0.5s cubic-bezier(.22,1,.36,1)`,
  };
}

function MiniStat({ label, value, color, bg, delay }) {
  const [hov, setHov] = useState(false);
  const style = useFadeIn(delay);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...style,
        background: hov ? bg : "#fff",
        border: `1px solid ${hov ? color + "50" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 14, padding: "18px 22px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: hov ? `0 8px 24px ${color}22` : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.22s cubic-bezier(.22,1,.36,1)",
        cursor: "default",
        transform: hov ? `${style.transform} translateY(-2px)` : style.transform,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        transform: hov ? "scale(1.12) rotate(-5deg)" : "scale(1) rotate(0deg)",
        transition: "transform 0.22s",
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", margin: 0, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{label}</p>
    </div>
  );
}

function AssignmentRow({ a, index }) {
  const [hov, setHov] = useState(false);
  const style = useFadeIn(0.05 + index * 0.07);

  const sc = a.submitted
    ? { bg: "rgba(52,211,153,0.1)",  color: "#059669", label: "Dikumpulkan", Icon: CheckCircle,  accent: "#34d399" }
    : a.overdue
    ? { bg: "rgba(248,113,113,0.1)", color: "#dc2626", label: "Terlambat",   Icon: AlertCircle,  accent: "#f87171" }
    : a.type === "quiz"
    ? { bg: "rgba(245,158,11,0.1)",  color: "#d97706", label: "Kuis",        Icon: ClipboardList, accent: "#f59e0b" }
    : { bg: "rgba(96,165,250,0.1)",  color: "#2563eb", label: "Tugas",       Icon: ClipboardList, accent: "#60a5fa" };

  const { Icon } = sc;

  return (
    <Link to={`/courses/${a.course_id}/assignments/${a.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          ...style,
          background: hov ? "#f9fffc" : "#fff",
          border: `1px solid ${hov ? sc.accent + "50" : "rgba(0,0,0,0.06)"}`,
          borderLeft: `4px solid ${sc.accent}`,
          borderRadius: 12,
          padding: "16px 22px",
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: hov
            ? `0 8px 28px rgba(0,0,0,0.09), 0 2px 8px ${sc.accent}18`
            : "0 1px 4px rgba(0,0,0,0.04)",
          cursor: "pointer",
          transform: hov ? "translateX(6px)" : style.transform,
          transition: "background 0.2s, border 0.2s, box-shadow 0.22s, transform 0.22s cubic-bezier(.22,1,.36,1), opacity 0.5s ease",
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: sc.bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transform: hov ? "scale(1.15) rotate(-6deg)" : "scale(1) rotate(0deg)",
          transition: "transform 0.22s",
        }}>
          <Icon size={17} color={sc.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 500, margin: "3px 0 0" }}>{a.course_title}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {a.due_date && !a.submitted && (
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: a.overdue ? "#ef4444" : "rgba(0,0,0,0.38)", fontWeight: 500 }}>
              <Clock size={12} />
              {format(new Date(a.due_date), "dd MMM", { locale: idLocale })}
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
            padding: "5px 13px", borderRadius: 20,
            background: sc.bg, color: sc.color,
            textTransform: "uppercase",
            transform: hov ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.18s",
          }}>
            {sc.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MyAssignments() {
  const { user } = useOutletContext();
  const [filter, setFilter] = useState("all");

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.email],
    queryFn: () => entities.CourseEnrollment.filter({ student_id: user.email }),
  });
  const courseIds = enrollments.map(e => e.course_id);

  const { data: allAssignments = [] } = useQuery({
    queryKey: ["student-assignments", courseIds],
    queryFn: async () => {
      if (!courseIds.length) return [];
      const all = await entities.Assignment.list("-created_date");
      return all.filter(a => courseIds.includes(a.course_id));
    },
    enabled: courseIds.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["my-submissions", user?.email],
    queryFn: () => entities.Submission.filter({ student_id: user.email }),
  });

  const submittedIds = new Set(submissions.map(s => s.assignment_id));
  const withStatus = allAssignments
    .filter(a => a.type !== "material")
    .map(a => ({
      ...a,
      submitted: submittedIds.has(a.id),
      overdue: a.due_date && isPast(new Date(a.due_date)) && !submittedIds.has(a.id),
    }));

  const filtered = filter === "all" ? withStatus
    : filter === "pending" ? withStatus.filter(a => !a.submitted)
    : withStatus.filter(a => a.submitted);

  const pending = withStatus.filter(a => !a.submitted).length;
  const done    = withStatus.filter(a =>  a.submitted).length;

  const heroStyle   = useFadeIn(0);
  const filterStyle = useFadeIn(0.3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      <style>{`
        @keyframes orbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes gridPulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes shimmerBar { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes badgePop   { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes ptcl0 { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-15px);opacity:.9} }
        @keyframes ptcl1 { 0%,100%{transform:translateY(0);opacity:.3} 50%{transform:translateY(-22px);opacity:.7} }
        @keyframes ptcl2 { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-10px);opacity:1} }
        @keyframes pulseRing  { 0%{box-shadow:0 0 0 0 rgba(52,211,153,0.4)} 70%{box-shadow:0 0 0 8px rgba(52,211,153,0)} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        ...heroStyle,
        background: "linear-gradient(135deg,#040f0a 0%,#061510 50%,#0a2218 100%)",
        borderRadius: 18, padding: "36px 40px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 40px rgba(6,21,16,0.3)",
      }}>
        {/* Animated grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(52,211,153,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,0.05) 1px,transparent 1px)", backgroundSize:"36px 36px", animation:"gridPulse 4s ease-in-out infinite", pointerEvents:"none" }} />
        {/* Orbs */}
        <div style={{ position:"absolute", top:-70, right:-70, width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.15) 0%,transparent 70%)", animation:"orbFloat 5s ease-in-out infinite", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-50, left:60, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.07) 0%,transparent 70%)", animation:"orbFloat 7s ease-in-out infinite reverse", pointerEvents:"none" }} />
        {/* Particles */}
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ position:"absolute", width: i%2===0?3:2, height: i%2===0?3:2, borderRadius:"50%", background:"rgba(52,211,153,0.6)", left:`${10+i*15}%`, top:`${20+(i%3)*25}%`, animation:`ptcl${i%3} ${2.5+i*0.4}s ease-in-out infinite`, animationDelay:`${i*0.3}s`, pointerEvents:"none" }} />
        ))}

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <Sparkles size={13} color="rgba(52,211,153,0.7)" />
            <p style={{ fontSize:11, color:"rgba(52,211,153,0.7)", letterSpacing:"2.5px", textTransform:"uppercase", margin:0, fontWeight:600 }}>Akademik</p>
          </div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(24px,4vw,36px)", color:"#fff", margin:"0 0 8px", fontWeight:"normal", lineHeight:1.1 }}>Tugas Saya</h1>
          <p style={{ fontSize:13, color:"rgba(0,0,0,0.42)", margin:0 }}>{pending} tugas belum dikumpulkan</p>
          <div style={{ marginTop:20, height:2, width:80, background:"rgba(52,211,153,0.2)", borderRadius:2, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.85),transparent)", animation:"shimmerBar 2s infinite" }} />
          </div>
        </div>

        <div style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", fontSize:9, fontWeight:700, letterSpacing:"3px", padding:"7px 16px", borderRadius:6, flexShrink:0, position:"relative", animation:"badgePop 0.6s 0.3s both" }}>
          TUGAS
        </div>
      </div>

      {/* ── Mini stats ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        <MiniStat label="Total"   value={withStatus.length} color="#60a5fa" bg="rgba(96,165,250,0.1)"  delay={0.15} />
        <MiniStat label="Belum"   value={pending}           color="#f59e0b" bg="rgba(245,158,11,0.1)"  delay={0.22} />
        <MiniStat label="Selesai" value={done}              color="#34d399" bg="rgba(52,211,153,0.1)"  delay={0.29} />
      </div>

      {/* ── Filter pills ── */}
      <div style={{ ...filterStyle, display:"flex", gap:8, flexWrap:"wrap" }}>
        {[{key:"all",label:"Semua"},{key:"pending",label:"Belum"},{key:"done",label:"Selesai"}].map(f => {
          const active = filter === f.key;
          return (
            <FilterPill key={f.key} active={active} label={f.label} onClick={() => setFilter(f.key)} />
          );
        })}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((a, i) => <AssignmentRow key={a.id} a={a} index={i} />)}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "9px 22px", fontSize: 12, fontWeight: 700, borderRadius: 22,
        border: active ? "none" : "1px solid rgba(0,0,0,0.09)",
        background: active ? "#064e3b" : hov ? "rgba(6,78,59,0.06)" : "#fff",
        color: active ? "#fff" : hov ? "#064e3b" : "rgba(0,0,0,0.45)",
        cursor: "pointer", transition: "all 0.18s",
        boxShadow: active ? "0 4px 14px rgba(6,78,59,0.3)" : "none",
        transform: active ? "scale(1.04)" : "scale(1)",
        animation: active ? "pulseRing 1.5s ease-out" : "none",
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ filter }) {
  const style = useFadeIn(0.1);
  return (
    <div style={{
      ...style,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "64px 24px", background: "#fff", borderRadius: 14,
      border: "1px dashed rgba(0,0,0,0.08)", textAlign: "center",
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, background: "rgba(52,211,153,0.07)", border: "1px dashed rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, animation: "orbFloat 4s ease-in-out infinite" }}>
        <CheckCircle size={28} color="rgba(52,211,153,0.4)" />
      </div>
      <p style={{ fontSize: 14, color: "rgba(0,0,0,0.35)", margin: 0, fontWeight: 500 }}>
        {filter === "pending" ? "Semua tugas sudah dikumpulkan! " : "Belum ada tugas."}
      </p>
    </div>
  );
}
