import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { ClipboardList, Clock, Star, CheckCircle, BookOpen, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function Assignments() {
  const { user } = useOutletContext();
  const role = user?.role || "teacher";
  const [filter, setFilter] = useState("all");

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["all-assignments", user?.email, role],
    queryFn: () =>
      role === "teacher"
        ? entities.Assignment.filter({ teacher_id: user.email })
        : entities.Assignment.list("-created_date"),
  });

  const filtered =
    filter === "all" ? assignments : assignments.filter((a) => a.type === filter);

  const counts = {
    all: assignments.length,
    assignment: assignments.filter((a) => a.type === "assignment").length,
    quiz: assignments.filter((a) => a.type === "quiz").length,
    material: assignments.filter((a) => a.type === "material").length,
  };

  const typeConfig = {
    assignment: {
      label: "Tugas",
      color: "#059669",
      bg: "rgba(5,150,105,0.08)",
      border: "rgba(5,150,105,0.2)",
      icon: <CheckCircle size={15} color="#059669" />,
      dot: "#059669",
    },
    quiz: {
      label: "Kuis",
      color: "#d97706",
      bg: "rgba(217,119,6,0.08)",
      border: "rgba(217,119,6,0.2)",
      icon: <ClipboardList size={15} color="#d97706" />,
      dot: "#d97706",
    },
    material: {
      label: "Materi",
      color: "#2563eb",
      bg: "rgba(37,99,235,0.08)",
      border: "rgba(37,99,235,0.2)",
      icon: <BookOpen size={15} color="#2563eb" />,
      dot: "#2563eb",
    },
  };

  const filters = [
    { key: "all", label: "Semua" },
    { key: "assignment", label: "Tugas" },
    { key: "quiz", label: "Kuis" },
    { key: "material", label: "Materi" },
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.headerLeft}>
          <span style={s.eyebrow}>Manajemen Konten</span>
          <h1 style={s.title}>Tugas & Kuis</h1>
          <p style={s.subtitle}>
            {role === "teacher"
              ? "Semua tugas dan kuis yang kamu buat"
              : "Tugas dan kuis dari kelas yang kamu ikuti"}
          </p>
        </div>
        <div style={s.headerStats}>
          <div style={s.statBox}>
            <span style={s.statNum}>{counts.assignment}</span>
            <span style={s.statLabel}>Tugas</span>
          </div>
          <div style={s.statDivider} />
          <div style={s.statBox}>
            <span style={{ ...s.statNum, color: "#d97706" }}>{counts.quiz}</span>
            <span style={s.statLabel}>Kuis</span>
          </div>
          <div style={s.statDivider} />
          <div style={s.statBox}>
            <span style={{ ...s.statNum, color: "#60a5fa" }}>{counts.material}</span>
            <span style={s.statLabel}>Materi</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.filterRow}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={filter === f.key ? { ...s.filterBtn, ...s.filterBtnActive } : s.filterBtn}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span style={filter === f.key ? { ...s.filterCount, ...s.filterCountActive } : s.filterCount}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={s.list}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={s.skeletonCard} className="skeleton-pulse">
              <div style={s.skeletonIcon} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ ...s.skeletonLine, width: "40%" }} />
                <div style={{ ...s.skeletonLine, width: "25%", opacity: 0.5 }} />
              </div>
              <div style={{ ...s.skeletonLine, width: 60 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyWrap}>
          <div style={s.emptyIcon}>
            <FileText size={28} color="rgba(5,150,105,0.4)" />
          </div>
          <p style={s.emptyTitle}>
            {filter === "all" ? "Belum ada konten" : "Belum ada " + filter}
          </p>
          <p style={s.emptyDesc}>
            {role === "teacher"
              ? "Buka kelas dan tambah tugas, kuis, atau materi baru."
              : "Tugas dari guru akan muncul di sini setelah kamu bergabung ke kelas."}
          </p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map((a) => {
            const cfg = typeConfig[a.type] || typeConfig.assignment;
            return (
              <Link
                key={a.id}
                to={"/courses/" + a.course_id + "/assignments/" + a.id}
                style={{ textDecoration: "none" }}
              >
                <div style={s.card} className="assignment-card">
                  <div style={{ ...s.cardBar, background: cfg.dot }} />
                  <div style={{ ...s.iconBox, background: cfg.bg, border: "1px solid " + cfg.border }}>
                    {cfg.icon}
                  </div>
                  <div style={s.info}>
                    <p style={s.cardTitle}>{a.title}</p>
                    <p style={s.cardSub}>{a.course_title}</p>
                  </div>
                  <div style={s.metaRow}>
                    {a.due_date && (
                      <span style={s.metaChip}>
                        <Clock size={11} />
                        {format(new Date(a.due_date), "dd MMM", { locale: idLocale })}
                      </span>
                    )}
                    {a.max_score != null && (
                      <span style={{ ...s.metaChip, color: "#92400e", background: "#fef3c7" }}>
                        <Star size={11} />
                        {a.max_score} poin
                      </span>
                    )}
                    <span style={{ ...s.typePill, color: cfg.color, background: cfg.bg, border: "1px solid " + cfg.border }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .assignment-card { transition: all 0.15s; }
        .assignment-card:hover {
          background: #f0fdf8 !important;
          border-color: rgba(5,150,105,0.25) !important;
          box-shadow: 0 2px 12px rgba(5,150,105,0.08) !important;
        }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        .skeleton-pulse { animation: shimmer 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", gap: 16, padding: "2px 0 32px", fontFamily: "Inter, sans-serif" },
  header: { background: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #065f46 100%)", borderRadius: 12, padding: "clamp(20px, 4vw, 28px) clamp(20px, 4vw, 32px)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, position: "relative", overflow: "hidden" },
  headerGlow: { position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", pointerEvents: "none" },
  headerLeft: { position: "relative", zIndex: 1, flexShrink: 1, minWidth: 0, flex: "1 1 200px" },
  eyebrow: { display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(52,211,153,0.7)", marginBottom: 8 },
  title: { fontFamily: "Georgia, serif", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: "normal", color: "#fff", margin: "0 0 6px", lineHeight: 1.1 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, fontWeight: 300 },
  headerStats: { display: "flex", flexWrap: "nowrap", alignItems: "center", gap: "clamp(12px, 3vw, 20px)", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "clamp(10px, 2.5vw, 14px) clamp(14px, 3vw, 22px)", position: "relative", zIndex: 1, flexShrink: 1, minWidth: 0 },
  statBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  statNum: { fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 700, color: "#34d399", lineHeight: 1, fontFamily: "Inter, sans-serif" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" },
  statDivider: { width: 1, height: 32, background: "rgba(255,255,255,0.1)" },
  toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  filterRow: { display: "flex", gap: 6, flexWrap: "wrap", overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%" },
  filterBtn: { display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, color: "rgba(0,0,0,0.5)", cursor: "pointer", transition: "all 0.15s" },
  filterBtnActive: { background: "#022c22", border: "1px solid #022c22", color: "#34d399" },
  filterCount: { background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 600 },
  filterCountActive: { background: "rgba(52,211,153,0.15)", color: "#34d399" },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  card: { background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "14px 18px 14px 20px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  cardBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "10px 0 0 10px" },
  iconBox: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: "#111", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardSub: { fontSize: 11, color: "#6b7280", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  metaRow: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  metaChip: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151", background: "#f3f4f6", borderRadius: 6, padding: "3px 8px", fontWeight: 500 },
  typePill: { fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", borderRadius: 6, padding: "3px 10px" },
  skeletonCard: { background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 },
  skeletonIcon: { width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", flexShrink: 0 },
  skeletonLine: { height: 10, background: "#f3f4f6", borderRadius: 4 },
  emptyWrap: { background: "#fff", border: "1.5px dashed rgba(5,150,105,0.2)", borderRadius: 12, padding: "52px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: "50%", background: "rgba(5,150,105,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 },
  emptyDesc: { fontSize: 12, color: "#9ca3af", margin: 0, maxWidth: 320, lineHeight: 1.6 },
};
