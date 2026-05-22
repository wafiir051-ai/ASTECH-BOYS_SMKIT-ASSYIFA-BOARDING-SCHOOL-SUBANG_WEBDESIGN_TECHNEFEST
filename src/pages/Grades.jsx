import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { useState } from "react";
import { BarChart2, Star, Users, TrendingUp, Award } from "lucide-react";

export default function Grades() {
  const { user } = useOutletContext();
  const role = user?.role || "teacher";
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { data: courses = [] } = useQuery({
    queryKey: ["teacher-courses", user?.email],
    queryFn: () =>
      role === "teacher"
        ? entities.Course.filter({ teacher_id: user.email })
        : entities.Course.list(),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["all-submissions", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return await entities.Submission.list("-created_date", 100);
      const result = await entities.Submission.filter({ course_id: selectedCourse });
      return result ?? [];
    },
    enabled: true,
  });

  const { data: _assignments = [] } = useQuery({
    queryKey: ["course-assignments-grades", selectedCourse],
    queryFn: () =>
      selectedCourse
        ? entities.Assignment.filter({ course_id: selectedCourse })
        : entities.Assignment.list(),
  });

  const studentGrades = {};
  submissions
    .filter((s) => s.score != null)
    .forEach((s) => {
      if (!studentGrades[s.student_email]) {
        studentGrades[s.student_email] = { name: s.student_name, email: s.student_email, scores: [], total: 0, count: 0 };
      }
      studentGrades[s.student_email].scores.push(s.score);
      studentGrades[s.student_email].total += s.score;
      studentGrades[s.student_email].count++;
    });

  const studentList = Object.values(studentGrades)
    .map((s) => ({ ...s, avg: Math.round(s.total / s.count) }))
    .sort((a, b) => b.avg - a.avg);

  const avgScore =
    studentList.length > 0
      ? Math.round(studentList.reduce((a, s) => a + s.avg, 0) / studentList.length)
      : null;

  const getScoreColor = (avg) => {
    if (avg >= 90) return { color: "#059669", bg: "#d1fae5", text: "Sangat Baik" };
    if (avg >= 80) return { color: "#2563eb", bg: "#dbeafe", text: "Baik" };
    if (avg >= 70) return { color: "#d97706", bg: "#fef3c7", text: "Cukup" };
    if (avg >= 60) return { color: "#ea580c", bg: "#ffedd5", text: "Kurang" };
    return { color: "#dc2626", bg: "#fee2e2", text: "Perlu Perhatian" };
  };

  const medalColors = [
    { medal: "🥇", color: "#f59e0b", bg: "#fef3c7", border: "#fde68a" },
    { medal: "🥈", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
    { medal: "🥉", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  ];

  const stats = [
    { label: "Total Murid", value: studentList.length, icon: Users, color: "#059669", bg: "rgba(5,150,105,0.08)" },
    { label: "Nilai Rata-rata", value: avgScore ?? "-", icon: TrendingUp, color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
    { label: "Pengumpulan", value: submissions.length, icon: Star, color: "#d97706", bg: "rgba(217,119,6,0.08)" },
    { label: "Belum Dinilai", value: submissions.filter((s) => s.status === "submitted").length, icon: BarChart2, color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  ];

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerGlow} />
        <div style={s.headerLeft}>
          <span style={s.eyebrow}>Manajemen Kelas</span>
          <h1 style={s.title}>Penilaian</h1>
          <p style={s.subtitle}>Pantau nilai dan progres murid secara real-time</p>
        </div>
        {avgScore != null && (
          <div style={s.avgBadge}>
            <span style={s.avgLabel}>Rata-rata Kelas</span>
            <span style={s.avgNum}>{avgScore}</span>
            <span style={s.avgSub}>/ 100</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={s.statCard}>
            <div style={{ ...s.statIconBox, background: bg }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ ...s.statVal, color }}>{value}</p>
              <p style={s.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={s.filterRow}>
        <button
          onClick={() => setSelectedCourse(null)}
          style={!selectedCourse ? { ...s.filterBtn, ...s.filterBtnActive } : s.filterBtn}
        >
          Semua Kelas
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c.id)}
            style={{
              ...s.filterBtn,
              ...(selectedCourse === c.id ? s.filterBtnActive : {}),
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {studentList.length === 0 ? (
        <div style={s.emptyWrap}>
          <div style={s.emptyIcon}>
            <Award size={28} color="rgba(5,150,105,0.4)" />
          </div>
          <p style={s.emptyTitle}>Belum ada data nilai</p>
          <p style={s.emptyDesc}>
            Nilai murid akan muncul di sini setelah tugas atau kuis dinilai.
          </p>
        </div>
      ) : (
        <div style={s.tableCard}>
          {/* Table header */}
          <div style={s.tableHead}>
            <div style={{ ...s.thCell, width: 48, textAlign: "center" }}>Rank</div>
            <div style={{ ...s.thCell, flex: 1 }}>Nama Murid</div>
            <div style={{ ...s.thCell, width: 100, textAlign: "center" }}>Pengumpulan</div>
            <div style={{ ...s.thCell, width: 160 }}>Progres</div>
            <div style={{ ...s.thCell, width: 110, textAlign: "center" }}>Nilai</div>
            <div style={{ ...s.thCell, width: 100, textAlign: "center" }}>Status</div>
          </div>

          {/* Rows */}
          {studentList.map((student, idx) => {
            const sc = getScoreColor(student.avg);
            const medal = medalColors[idx];
            return (
              <div key={student.email} style={s.tableRow} className="grade-row">
                {/* Rank */}
                <div style={{ width: 48, textAlign: "center", flexShrink: 0 }}>
                  {idx < 3 ? (
                    <span style={{ fontSize: 20 }}>{medal.medal}</span>
                  ) : (
                    <span style={s.rankNum}>{idx + 1}</span>
                  )}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={s.studentName}>{student.name || student.email}</p>
                  <p style={s.studentEmail}>{student.email}</p>
                </div>

                {/* Count */}
                <div style={{ width: 100, textAlign: "center", flexShrink: 0 }}>
                  <span style={s.countBadge}>{student.count}x</span>
                </div>

                {/* Progress bar */}
                <div style={{ width: 160, flexShrink: 0 }}>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: Math.min(student.avg, 100) + "%", background: sc.color }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, display: "block" }}>
                    {student.avg}%
                  </span>
                </div>

                {/* Score */}
                <div style={{ width: 110, textAlign: "center", flexShrink: 0 }}>
                  <span style={{ ...s.scoreNum, color: sc.color }}>{student.avg}</span>
                </div>

                {/* Status pill */}
                <div style={{ width: 100, textAlign: "center", flexShrink: 0 }}>
                  <span style={{ ...s.statusPill, color: sc.color, background: sc.bg }}>
                    {sc.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .grade-row { transition: background 0.12s; }
        .grade-row:hover { background: #f0fdf8 !important; }
      `}</style>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", gap: 16, padding: "2px 0 32px", fontFamily: "Inter, sans-serif" },

  header: { background: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #065f46 100%)", borderRadius: 12, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, position: "relative", overflow: "hidden" },
  headerGlow: { position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", pointerEvents: "none" },
  headerLeft: { position: "relative", zIndex: 1 },
  eyebrow: { display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(52,211,153,0.7)", marginBottom: 8 },
  title: { fontFamily: "Georgia, serif", fontSize: 30, fontWeight: "normal", color: "#fff", margin: "0 0 6px", lineHeight: 1.1 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, fontWeight: 300 },
  avgBadge: { background: "rgba(0,0,0,0.25)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 12, padding: "16px 24px", textAlign: "center", position: "relative", zIndex: 1, flexShrink: 0 },
  avgLabel: { display: "block", fontSize: 10, color: "rgba(52,211,153,0.6)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 },
  avgNum: { fontSize: 40, fontWeight: 700, color: "#34d399", lineHeight: 1, fontFamily: "Inter, sans-serif" },
  avgSub: { fontSize: 14, color: "rgba(255,255,255,0.3)", marginLeft: 4 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 },
  statCard: { background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  statIconBox: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statVal: { fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1, fontFamily: "Inter, sans-serif" },
  statLabel: { fontSize: 10, color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", margin: "4px 0 0" },

  filterRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  filterBtn: { padding: "7px 16px", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif", background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, color: "rgba(0,0,0,0.5)", cursor: "pointer", transition: "all 0.15s" },
  filterBtnActive: { background: "#022c22", border: "1px solid #022c22", color: "#34d399" },

  tableCard: { background: "#fff", overflowX: "auto", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  tableHead: { display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#f9fafb", borderBottom: "1px solid rgba(0,0,0,0.07)" },
  thCell: { fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase" },
  tableRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", cursor: "default" },

  rankNum: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6", color: "#6b7280", fontSize: 12, fontWeight: 700 },
  studentName: { fontSize: 13, fontWeight: 600, color: "#111", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  studentEmail: { fontSize: 11, color: "#9ca3af", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  countBadge: { background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 },
  barTrack: { height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3, transition: "width 0.5s ease" },
  scoreNum: { fontSize: 22, fontWeight: 700, fontFamily: "Inter, sans-serif" },
  statusPill: { fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", borderRadius: 20, padding: "4px 10px", whiteSpace: "nowrap" },

  emptyWrap: { background: "#fff", border: "1.5px dashed rgba(5,150,105,0.2)", borderRadius: 12, padding: "52px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: "50%", background: "rgba(5,150,105,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 },
  emptyDesc: { fontSize: 12, color: "#9ca3af", margin: 0, maxWidth: 320, lineHeight: 1.6 },
};
