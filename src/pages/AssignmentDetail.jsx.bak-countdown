import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities, supabase } from "@/api/supabaseClient";
import { ArrowLeft, Clock, CheckCircle, Star, Users, X, Pencil, Zap, AlertTriangle, ShieldAlert, Upload, Download, Paperclip, FileText, Trash2 } from "lucide-react";
import { NoomoCard, NoomoBadge, NoomoButton } from "@/components/ui/NoomoCard";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";


// ─── QUIZ TAKER — Full Screen + Anti-Cheat ───────────────────────────────────
export function QuizTaker({ assignment, user, existingSubmission }) {
  const navigate = useNavigate();
  const questions = assignment.quiz_questions || [];
  const [phase, setPhase] = useState("intro"); // intro | playing | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);
  const [cheatWarning, setCheatWarning] = useState(false);
  const [cheatLog, setCheatLog] = useState([]);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const qc = useQueryClient();

  // ── ANTI-CHEAT: log violation ──
  const logCheat = useCallback((reason) => {
    const entry = {
      time: new Date().toISOString(),
      reason,
      question: current + 1,
    };
    setCheatLog(prev => {
      const updated = [...prev, entry];
      // Persist to Supabase immediately
      entities.Submission.filter({ assignment_id: assignment.id, student_id: user.email })
        .then(rows => {
          // If draft submission exists, update cheat_log
          if (rows.length > 0) {
            entities.Submission.update(rows[0].id, {
              cheat_log: updated,
              cheat_count: updated.length,
              flagged: true,
            }).catch(() => {});
          }
        });
      return updated;
    });
    setCheatCount(c => c + 1);
    setCheatWarning(true);
    setTimeout(() => setCheatWarning(false), 4000);
  }, [current, assignment.id, user.email]);

  // ── FULLSCREEN helpers ──
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  };

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => {
      const inFS = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setIsFullscreen(inFS);
      if (phase === "playing" && !inFS) {
        logCheat("Keluar dari fullscreen");
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [phase, logCheat]);

  // ── ANTI-CHEAT: visibility / tab switch ──
  useEffect(() => {
    if (phase !== "playing") return;
    const onVisibility = () => {
      if (document.hidden) logCheat("Pindah tab / minimize browser");
    };
    const onBlur = () => logCheat("Window kehilangan fokus");
    const onContextMenu = (e) => { e.preventDefault(); logCheat("Klik kanan (context menu)"); };
    const onKeyDown = (e) => {
      // Block common shortcuts
      const blocked = [
        e.key === "F12",
        e.ctrlKey && ["c","v","u","s","a","p","f","r"].includes(e.key.toLowerCase()),
        e.ctrlKey && e.shiftKey && ["i","j","c"].includes(e.key.toLowerCase()),
        e.altKey && e.key === "Tab",
        e.key === "PrintScreen",
        e.metaKey && ["c","v","tab"].includes(e.key.toLowerCase()),
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        logCheat(`Shortcut terlarang: ${e.ctrlKey ? "Ctrl+" : e.metaKey ? "Cmd+" : ""}${e.key}`);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, logCheat]);

  // ── TIMER ──
  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleAnswer(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, phase]);

  const submitMutation = useMutation({
    mutationFn: async (finalAnswers) => {
      let totalScore = 0;
      Object.entries(finalAnswers).forEach(([qi, sa]) => {
        const q = questions[parseInt(qi)];
        if (q && q.correct_answer === sa) totalScore += (q.points || 10);
      });
      return entities.Submission.create({
        assignment_id: assignment.id,
        course_id: assignment.course_id,
        student_id: user.email,
        student_name: user.full_name,
        student_email: user.email,
        quiz_answers: Object.entries(finalAnswers).map(([qi, sa]) => ({
          question_index: parseInt(qi), selected_answer: sa
        })),
        score: Math.round(totalScore),
        status: "graded",
        submitted_at: new Date().toISOString(),
        cheat_count: cheatLog.length,
        cheat_log: cheatLog,
        flagged: cheatLog.length > 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submission", assignment.id, user.email] });
      exitFullscreen();
    },
  });

  const handleAnswer = (optIdx) => {
    if (feedback !== null) return;
    clearInterval(timerRef.current);
    const q = questions[current];
    const isCorrect = optIdx !== null && q.correct_answer === optIdx;
    const earned = isCorrect
      ? Math.round((q.points || 10) * (timeLeft / 20) * (streak >= 3 ? 1.5 : 1))
      : 0;
    setSelected(optIdx);
    setFeedback(optIdx === null ? "timeout" : isCorrect ? "correct" : "wrong");
    setAnswers(prev => ({ ...prev, [current]: optIdx }));
    if (isCorrect) { setScore(s => s + earned); setStreak(s => s + 1); setPoints(p => [...p, earned]); }
    else { setStreak(0); setPoints(p => [...p, 0]); }
    setTimeout(() => {
      setSelected(null); setFeedback(null);
      if (current + 1 >= questions.length) {
        setPhase("result");
        submitMutation.mutate({ ...answers, [current]: optIdx });
      } else {
        setCurrent(c => c + 1);
      }
    }, 1800);
  };

  // ── ALREADY SUBMITTED ──
  if (existingSubmission) {
    const correct = existingSubmission.quiz_answers?.filter(a => {
      const q = questions[a.question_index];
      return q && q.correct_answer === a.selected_answer;
    }).length || 0;
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <div style={{ minHeight: "60vh", background: "#0a0a0f", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🏆</div>
          <p style={{ color: "#6b6b8a", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>Kuis Sudah Dikerjakan</p>
          <p style={{ fontSize: 72, fontWeight: 900, margin: "8px 0", background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{existingSubmission.score}</p>
          <p style={{ color: "#6b6b8a", fontSize: 16, marginBottom: 16 }}>poin · {correct}/{questions.length} benar · {pct}%</p>
          {existingSubmission.flagged && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "10px 20px", color: "#f87171", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={16} /> Terdeteksi {existingSubmission.cheat_count} pelanggaran saat mengerjakan
            </div>
          )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) return (
    <NoomoCard className="p-8 text-center"><p className="text-medium-gray font-editorial">Soal kuis belum tersedia.</p></NoomoCard>
  );

  // ── INTRO ──
  if (phase === "intro") return (
    <div style={{ minHeight: "70vh", background: "#0a0a0f", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎮</div>
      <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, color: "#fff", letterSpacing: -1 }}>{assignment.title}</h2>
      <p style={{ color: "#6b6b8a", fontSize: 15, marginBottom: 16 }}>{questions.length} soal · maks {assignment.max_score} poin</p>

      {/* Anti-cheat notice */}
      <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 10, maxWidth: 420 }}>
        <ShieldAlert size={18} color="#f87171" style={{ flexShrink: 0 }} />
        <p style={{ color: "#fca5a5", fontSize: 12, textAlign: "left", margin: 0, lineHeight: 1.5 }}>
          <b>Mode Anti-Kecurangan aktif.</b> Kuis akan berjalan fullscreen. Berpindah tab, minimize, atau keluar fullscreen akan dicatat dan dilaporkan ke guru.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap", justifyContent: "center" }}>
        {[{ icon: "⏱", text: "20 detik/soal" }, { icon: "🔥", text: "Bonus streak ×1.5" }, { icon: "⚡", text: "Cepat = lebih banyak poin" }, { icon: "🛡️", text: "Anti-kecurangan aktif" }].map((item, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px", borderRadius: 30, color: "#c4c4d4", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            {item.icon} {item.text}
          </div>
        ))}
      </div>
      <button
        onClick={() => { setPhase("playing"); enterFullscreen(); }}
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", border: "none", padding: "18px 56px", fontSize: 20, fontWeight: 900, borderRadius: 14, cursor: "pointer", boxShadow: "0 8px 32px rgba(124,58,237,0.5)", letterSpacing: 1 }}
      >
        MULAI KUIS!
      </button>
    </div>
  );

  // ── RESULT ──
  if (phase === "result") {
    const correct = points.filter(p => p > 0).length;
    const pct = Math.round((correct / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : pct >= 40 ? "👍" : "💪";
    return (
      <div style={{ position: "fixed", inset: 0, background: "#0a0a0f", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, overflowY: "auto" }}>
        <div style={{ textAlign: "center", width: "100%", maxWidth: 520 }}>
          <div style={{ fontSize: 88, marginBottom: 12 }}>{emoji}</div>
          <p style={{ color: "#6b6b8a", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", marginBottom: 4 }}>Selesai!</p>
          <p style={{ fontSize: 80, fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{score}</p>
          <p style={{ color: "#6b6b8a", fontSize: 16, marginBottom: 24 }}>{correct}/{questions.length} benar · {pct}%</p>
          {cheatLog.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color="#f87171" />
                <span style={{ color: "#f87171", fontWeight: 700, fontSize: 13 }}>{cheatLog.length} pelanggaran terdeteksi & dilaporkan ke guru</span>
              </div>
              {cheatLog.map((c, i) => (
                <p key={i} style={{ color: "#fca5a5", fontSize: 11, margin: "3px 0" }}>• Soal {c.question}: {c.reason}</p>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {questions.map((q, i) => (
              <div key={i} style={{ background: points[i] > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${points[i] > 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{points[i] > 0 ? "✅" : "❌"}</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: points[i] > 0 ? "#34d399" : "#f87171", margin: 0 }}>Soal {i + 1}</p>
                  <p style={{ fontSize: 12, color: points[i] > 0 ? "#6ee7b7" : "#fca5a5", margin: 0 }}>{points[i] > 0 ? `+${points[i]} poin` : "Salah"}</p>
                </div>
              </div>
            ))}
          </div>
          {submitMutation.isPending && <p style={{ color: "#6b6b8a", fontSize: 13 }}>Menyimpan hasil...</p>}
          <button
            onClick={() => navigate(`/courses/${assignment.course_id}`)}
            disabled={submitMutation.isPending}
            style={{
              marginTop: 8,
              padding: "14px 32px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitMutation.isPending ? "not-allowed" : "pointer",
              opacity: submitMutation.isPending ? 0.5 : 1,
              boxShadow: "0 8px 24px rgba(167,139,250,0.35)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Kembali ke Kelas
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING (Full Screen Overlay) ──
  const q = questions[current];
  const timerPct = (timeLeft / 20) * 100;
  const timerColor = timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  const OPTION_COLORS = [
    { bg: "linear-gradient(160deg, #8b9e00, #b5c400)", shadow: "rgba(181,196,0,0.35)" },
    { bg: "linear-gradient(160deg, #7c3aed, #a855f7)", shadow: "rgba(168,85,247,0.35)" },
    { bg: "linear-gradient(160deg, #ea580c, #f97316)", shadow: "rgba(249,115,22,0.35)" },
    { bg: "linear-gradient(160deg, #0d9488, #14b8a6)", shadow: "rgba(20,184,166,0.35)" },
  ];

  const getFeedbackStyle = (oi) => {
    if (feedback === null) return {};
    if (oi === q.correct_answer) return { filter: "brightness(1.2)", transform: "scale(1.02)", boxShadow: "0 0 48px rgba(16,185,129,0.7)" };
    if (oi === selected) return { filter: "brightness(0.35) saturate(0.2)", transform: "scale(0.97)" };
    return { filter: "brightness(0.25) saturate(0.1)", transform: "scale(0.95)" };
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#080810",
      display: "flex", flexDirection: "column",
      userSelect: "none",
    }}>
      {/* ── CHEAT WARNING BANNER ── */}
      {cheatWarning && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10001,
          background: "linear-gradient(90deg, #dc2626, #b91c1c)",
          padding: "14px 24px",
          display: "flex", alignItems: "center", gap: 12,
          animation: "slideDown 0.3s ease",
        }}>
          <AlertTriangle size={22} color="#fff" />
          <div>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0 }}>⚠️ Pelanggaran terdeteksi! ({cheatCount}×)</p>
            <p style={{ color: "#fecaca", fontSize: 12, margin: 0 }}>Aktivitasmu dicatat dan dilaporkan ke guru secara otomatis.</p>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{
        padding: "16px 28px",
        paddingTop: cheatWarning ? 76 : 16,
        display: "flex", alignItems: "center", gap: 16,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0, transition: "padding-top 0.3s",
      }}>
        {/* Timer circle */}
        <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
          <svg width="58" height="58" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="29" cy="29" r="25" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle cx="29" cy="29" r="25" fill="none" stroke={timerColor} strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 25}`}
              strokeDashoffset={`${2 * Math.PI * 25 * (1 - timerPct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: timerColor }}>{timeLeft}</span>
        </div>

        {/* Question progress pills */}
        <div style={{ flex: 1, display: "flex", gap: 3, alignItems: "center" }}>
          {questions.map((_, i) => (
            <div key={i} style={{ flex: i === current ? 3 : 1, height: 6, borderRadius: 3, background: i < current ? "#7c3aed" : i === current ? "#a78bfa" : "rgba(255,255,255,0.08)", transition: "all 0.4s" }} />
          ))}
        </div>

        {/* Score / streak / cheat indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isFullscreen && phase === "playing" && (
            <button onClick={enterFullscreen} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              ↗ Kembali Fullscreen
            </button>
          )}
          {cheatCount > 0 && (
            <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, color: "#f87171", display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldAlert size={12} /> {cheatCount}
            </div>
          )}
          {streak >= 2 && (
            <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", padding: "5px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800, color: "#f87171" }}>🔥 {streak}×</div>
          )}
          <div style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", padding: "6px 16px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={13} color="#a78bfa" />
            <span style={{ fontSize: 14, fontWeight: 900, color: "#a78bfa" }}>{score}</span>
          </div>
          <span style={{ color: "#4b4b6a", fontSize: 12 }}>{current + 1}/{questions.length}</span>
        </div>
      </div>

      {/* ── QUESTION ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 48px 16px", minHeight: 0 }}>
        <p style={{ fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 800, color: "#fff", textAlign: "center", maxWidth: 800, lineHeight: 1.5, margin: 0 }}>{q.question}</p>
        <p style={{ color: "#4b4b6a", fontSize: 12, marginTop: 10 }}>{q.points || 10} poin maks</p>
      </div>

      {/* ── FEEDBACK BANNER ── */}
      {feedback && (
        <div style={{ textAlign: "center", padding: "12px 24px", fontSize: 18, fontWeight: 900, color: feedback === "correct" ? "#34d399" : "#f87171", background: feedback === "correct" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderTop: `1px solid ${feedback === "correct" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, flexShrink: 0 }}>
          {feedback === "correct" ? `✅ Benar! +${points[points.length - 1]} poin${streak >= 3 ? " 🔥 Streak bonus!" : ""}` : feedback === "timeout" ? "⏰ Waktu habis!" : "❌ Salah!"}
        </div>
      )}

      {/* ── 4 OPTION TILES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flexShrink: 0 }}>
        {(q.options || []).map((opt, oi) => {
          const c = OPTION_COLORS[oi % OPTION_COLORS.length];
          return (
            <button key={oi} onClick={() => handleAnswer(oi)} disabled={feedback !== null}
              style={{
                background: c.bg, border: "none",
                padding: "clamp(24px, 4vh, 48px) 32px",
                cursor: feedback !== null ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "clamp(16px, 2.5vw, 26px)", fontWeight: 800, color: "#fff",
                textAlign: "center", position: "relative",
                transition: "filter 0.3s, transform 0.3s, box-shadow 0.3s",
                boxShadow: feedback === null ? `inset 0 -5px 0 rgba(0,0,0,0.3)` : "none",
                ...getFeedbackStyle(oi),
              }}
              onMouseEnter={e => { if (!feedback) e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => { if (!feedback) e.currentTarget.style.filter = ""; }}
            >
              <span style={{ position: "absolute", top: 10, left: 14, width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.85)" }}>
                {String.fromCharCode(65 + oi)}
              </span>
              <span style={{ lineHeight: 1.3, maxWidth: "80%" }}>{opt}</span>
              {feedback !== null && oi === q.correct_answer && <CheckCircle size={22} color="#fff" style={{ position: "absolute", top: 10, right: 14 }} />}
            </button>
          );
        })}
      </div>

      {/* ── PLAYER TAG (bottom left) ── */}
      <div style={{ position: "absolute", bottom: 18, left: 22, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", borderRadius: 30, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.08)", zIndex: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>
          {(user?.full_name || user?.email || "?").charAt(0).toUpperCase()}
        </div>
        <span style={{ color: "#c4c4d4", fontSize: 13, fontWeight: 600 }}>{user?.full_name || user?.email}</span>
      </div>

      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
      `}</style>
    </div>
  );
}


// ─── ASSIGNMENT SUBMIT ────────────────────────────────────────────────────────
const ALLOWED_EXTENSIONS = ["zip","rar","7z","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","md","jpg","jpeg","png","gif","webp","svg","mp4","mov","avi","mkv","webm","mp3","wav","m4a","ogg"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function formatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024*1024) return (b/1024).toFixed(1) + " KB";
  return (b/(1024*1024)).toFixed(1) + " MB";
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80);
}

function AssignmentSubmit({ assignment, user, existingSubmission }) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();

  const attachments = existingSubmission?.attachments || [];

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ekstensi
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Format .${ext} tidak diizinkan. Pakai ZIP, RAR, PDF, dokumen, gambar, video, atau audio.`);
      e.target.value = "";
      return;
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Ukuran file maksimal 50 MB. File kamu ${formatBytes(file.size)}.`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async (file) => {
    const timestamp = Date.now();
    const safeName = sanitizeFilename(file.name);
    const path = `${assignment.id}/${user.email}/${timestamp}_${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from("submissions")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);
    return {
      url: urlData.publicUrl,
      path,
      name: file.name,
      size: file.size,
      uploaded_at: new Date().toISOString(),
      version: attachments.length + 1,
    };
  };

  const submit = useMutation({
    mutationFn: async () => {
      let newAttachments = [...attachments];

      if (selectedFile) {
        setUploading(true);
        try {
          const fileInfo = await uploadFile(selectedFile);
          newAttachments.push(fileInfo);
        } finally {
          setUploading(false);
        }
      }

      if (existingSubmission) {
        // Update submission yang sudah ada (history mode)
        return entities.Submission.update(existingSubmission.id, {
          content: content || existingSubmission.content,
          attachments: newAttachments,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        });
      } else {
        return entities.Submission.create({
          assignment_id: assignment.id,
          course_id: assignment.course_id,
          student_id: user.email,
          student_name: user.full_name,
          student_email: user.email,
          content,
          attachments: newAttachments,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submission", assignment.id, user.email] });
      toast.success("Tugas berhasil dikumpulkan!");
      setContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => {
      toast.error("Gagal mengumpulkan: " + (err?.message || "unknown error"));
    },
  });

  const isGraded = existingSubmission?.status === "graded";

  return (
    <NoomoCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          {existingSubmission ? "Pengumpulan Tugas" : "Kumpulkan Tugas"}
        </h3>
        {existingSubmission && (
          <NoomoBadge variant={isGraded ? "success" : "default"} className="">
            {isGraded ? `Sudah Dinilai: ${existingSubmission.score}` : "Menunggu Penilaian"}
          </NoomoBadge>
        )}
      </div>

      {/* Tampilkan history file yang sudah pernah di-upload */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider">Riwayat Pengumpulan ({attachments.length})</p>
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted border border-border rounded">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-vibrant-blue flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-medium-gray">
                    v{a.version} · {formatBytes(a.size)} · {new Date(a.uploaded_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
              <a href={a.url} target="_blank" rel="noopener noreferrer" download className="ml-3 p-2 hover:bg-vibrant-blue/10 rounded text-vibrant-blue" title="Download">
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Tampilkan content lama kalau ada */}
      {existingSubmission?.content && (
        <div className="bg-muted p-4 text-sm text-foreground font-editorial">
          <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider mb-2">Jawaban Sebelumnya</p>
          {existingSubmission.content}
        </div>
      )}

      {/* Nilai */}
      {isGraded && (
        <div className="p-4 border border-vibrant-blue/30 bg-vibrant-blue/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-editorial text-medium-gray">Nilai</span>
            <span className="text-2xl font-display font-bold text-vibrant-blue">{existingSubmission.score}</span>
          </div>
          {existingSubmission.feedback && (
            <p className="text-sm text-medium-gray mt-2 font-editorial italic">&ldquo;{existingSubmission.feedback}&rdquo;</p>
          )}
        </div>
      )}

      {/* Form untuk submit baru / re-submit */}
      <div className="pt-2 border-t border-border space-y-3">
        <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider">
          {existingSubmission ? "Upload Versi Baru" : "Jawaban Kamu"}
        </p>

        <textarea
          className="w-full noomo-input min-h-[100px] resize-none h-auto pb-2"
          placeholder={existingSubmission ? "Catatan tambahan (opsional)..." : "Tulis jawabanmu di sini..."}
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        {/* File input */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFilePick}
            className="hidden"
            id="file-upload-input"
            accept={ALLOWED_EXTENSIONS.map(e => "." + e).join(",")}
          />
          <label
            htmlFor="file-upload-input"
            className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-border hover:border-vibrant-blue hover:bg-vibrant-blue/5 cursor-pointer transition-colors rounded"
          >
            <Paperclip className="w-4 h-4 text-medium-gray" />
            <span className="text-sm text-medium-gray font-editorial">
              {selectedFile ? selectedFile.name : "Pilih file (ZIP, PDF, gambar, video, dll · max 50 MB)"}
            </span>
          </label>

          {selectedFile && (
            <div className="flex items-center justify-between mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-800 truncate">{selectedFile.name}</span>
                <span className="text-xs text-emerald-600 flex-shrink-0">({formatBytes(selectedFile.size)})</span>
              </div>
              <button
                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="ml-2 p-1 hover:bg-emerald-100 rounded text-emerald-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <NoomoButton
          onClick={() => submit.mutate()}
          disabled={(!content.trim() && !selectedFile) || submit.isPending || uploading}
          className="w-full"
        >
          {uploading ? "Mengupload file..." : submit.isPending ? "Mengirim..." : existingSubmission ? "Kumpulkan Versi Baru" : "Kumpulkan Tugas"}
        </NoomoButton>
      </div>
    </NoomoCard>
  );
}

// ─── GRADE MODAL ──────────────────────────────────────────────────────────────
function GradeSubmissionsModal({ assignment, onClose }) {
  const qc = useQueryClient();
  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions-all", assignment.id],
    queryFn: () => entities.Submission.filter({ assignment_id: assignment.id }),
  });
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const grade = useMutation({
    mutationFn: async ({ id, score, feedback }) => entities.Submission.update(id, { score: Number(score), feedback, status: "graded" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["submissions-all", assignment.id] }); toast.success("Nilai disimpan!"); },
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold">Nilai Pengumpulan ({submissions.length})</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {submissions.length === 0
            ? <p className="text-center text-medium-gray font-editorial py-8">Belum ada yang mengumpulkan</p>
            : submissions.map(sub => (
              <NoomoCard key={sub.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{sub.student_name || sub.student_email}</p>
                    <p className="text-xs text-medium-gray font-editorial">{sub.student_email}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {sub.flagged && (
                      <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                        <ShieldAlert size={12} color="#ef4444" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>{sub.cheat_count}× curang</span>
                      </div>
                    )}
                    <NoomoBadge variant={sub.status === "graded" ? "success" : "default"} className="">
                      {sub.status === "graded" ? `Nilai: ${sub.score}` : "Belum dinilai"}
                    </NoomoBadge>
                  </div>
                </div>

                {/* Cheat log detail for teacher */}
                {sub.flagged && sub.cheat_log && sub.cheat_log.length > 0 && (
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>🚨 Log Pelanggaran:</p>
                    {sub.cheat_log.map((c, i) => (
                      <p key={i} style={{ fontSize: 11, color: "#b91c1c", margin: "2px 0" }}>• Soal {c.question}: {c.reason} <span style={{ color: "#9ca3af" }}>({new Date(c.time).toLocaleTimeString("id-ID")})</span></p>
                    ))}
                  </div>
                )}

                {sub.content && <p className="text-sm text-medium-gray font-editorial mb-3 bg-muted p-3">{sub.content}</p>}

                {/* File attachments dari murid */}
                {sub.attachments && sub.attachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider">File Terkirim ({sub.attachments.length})</p>
                    {sub.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center justify-between p-3 bg-vibrant-blue/5 border border-vibrant-blue/20 hover:bg-vibrant-blue/10 transition-colors rounded"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-vibrant-blue flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                            <p className="text-xs text-medium-gray">
                              v{a.version} · {formatBytes(a.size)} · {new Date(a.uploaded_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-vibrant-blue flex-shrink-0 ml-3" />
                      </a>
                    ))}
                  </div>
                )}
                {assignment.type === "quiz" && sub.quiz_answers && (
                  <div className="mb-3 p-3 bg-indigo-50 rounded text-sm text-indigo-800">Auto-scored: <b>{sub.score}</b> poin dari {assignment.max_score}</div>
                )}
                <div className="flex gap-3">
                  <input type="number" placeholder="Nilai" min="0" max={assignment.max_score} defaultValue={sub.score || ""} onChange={e => setGrades({ ...grades, [sub.id]: e.target.value })} className="noomo-input w-20 text-center" />
                  <input placeholder="Komentar (opsional)" defaultValue={sub.feedback || ""} onChange={e => setFeedbacks({ ...feedbacks, [sub.id]: e.target.value })} className="noomo-input flex-1" />
                  <NoomoButton onClick={() => grade.mutate({ id: sub.id, score: grades[sub.id] ?? sub.score ?? 0, feedback: feedbacks[sub.id] ?? sub.feedback ?? "" })} className="">Simpan</NoomoButton>
                </div>
              </NoomoCard>
            ))}
        </div>
      </div>
    </div>
  );
}


// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const { user } = useOutletContext();
  const role = user?.role || "student";
  const [showGrade, setShowGrade] = useState(false);
  const navigate = useNavigate();



  const { data: assignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => entities.Assignment.filter({ id: assignmentId }).then(r => r[0]),
  });
  const { data: mySubmission, isLoading: loadingSubmission } = useQuery({
    queryKey: ["submission", assignmentId, user?.email],
    queryFn: () => entities.Submission.filter({ assignment_id: assignmentId, student_id: user.email }).then(r => r[0] ?? null),
    enabled: role === "student",
  });

  // Auto-redirect ke halaman quiz fullscreen untuk student
  useEffect(() => {
    if (assignment?.type === "quiz" && role === "student") {
      navigate(`/quiz/${assignmentId}/play`, { replace: true });
    }
  }, [assignment, role]);

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ["submissions-count", assignmentId],
    queryFn: () => entities.Submission.filter({ assignment_id: assignmentId }),
    enabled: role !== "student",
  });

  if (!assignment) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const typeConfig = {
    assignment: { label: "Tugas", color: "default" },
    quiz: { label: "Kuis", color: "warning" },
    material: { label: "Materi", color: "ghost" },
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-medium-gray hover:text-vibrant-blue mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <NoomoBadge variant={typeConfig[assignment.type]?.color} className="">{typeConfig[assignment.type]?.label}</NoomoBadge>
          {assignment.max_score && <span className="text-xs text-medium-gray font-editorial flex items-center gap-1"><Star className="w-3 h-3" /> {assignment.max_score} poin</span>}
        </div>
        <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">{assignment.title}</h2>
        {assignment.due_date && (
          <p className="text-sm text-medium-gray font-editorial mt-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Batas waktu: {format(new Date(assignment.due_date), "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: idLocale })}
          </p>
        )}
      </div>
      {assignment.description && assignment.type !== "quiz" && (
        <NoomoCard className="p-6 mb-6">
          <p className="text-sm text-foreground font-editorial leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
        </NoomoCard>
      )}

      {/* Lampiran dari guru */}
      {assignment.attachments && assignment.attachments.length > 0 && (
        <NoomoCard className="p-6 mb-6">
          <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider mb-3">
            Lampiran dari Guru ({assignment.attachments.length})
          </p>
          <div className="space-y-2">
            {assignment.attachments.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center justify-between p-3 bg-vibrant-blue/5 border border-vibrant-blue/20 hover:bg-vibrant-blue/10 transition-colors rounded"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-vibrant-blue flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-medium-gray">
                      {(a.size/1024/1024 < 1 ? (a.size/1024).toFixed(1)+" KB" : (a.size/1024/1024).toFixed(1)+" MB")}
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-vibrant-blue flex-shrink-0 ml-3" />
              </a>
            ))}
          </div>
        </NoomoCard>
      )}
      {(role === "teacher" || role === "admin") && assignment.type !== "material" && (
        <div className="mb-6 space-y-3">
          {assignment.type === "quiz" && (
            <NoomoCard className="p-4 flex items-center justify-between bg-amber-50 border-amber-200">
              <p className="text-sm font-semibold text-amber-800">{assignment.quiz_questions?.length || 0} soal · {assignment.max_score} poin total</p>
              <NoomoButton variant="secondary" onClick={() => navigate(`/courses/${courseId}/quiz/${assignmentId}/edit`)} className="text-amber-700 border-amber-400 hover:bg-amber-100">
                <Pencil className="w-3 h-3" /> Edit Kuis
              </NoomoButton>
            </NoomoCard>
          )}
          <NoomoCard className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-vibrant-blue" />
              <div>
                <p className="text-sm font-semibold">{allSubmissions.length} Pengumpulan</p>
                <p className="text-xs text-medium-gray font-editorial">{allSubmissions.filter(s => s.status === "graded").length} sudah dinilai · {allSubmissions.filter(s => s.flagged).length > 0 ? <span style={{ color: "#ef4444" }}>{allSubmissions.filter(s => s.flagged).length} terindikasi curang</span> : "semua bersih"}</p>
              </div>
            </div>
            <NoomoButton onClick={() => setShowGrade(true)} className="">Lihat Jawaban</NoomoButton>
          </NoomoCard>
        </div>
      )}
      {role === "student" && assignment.type !== "material" && (
        assignment.type === "quiz"
          ? null
          : <AssignmentSubmit assignment={assignment} user={user} existingSubmission={mySubmission} />
      )}
      {showGrade && <GradeSubmissionsModal assignment={assignment} onClose={() => setShowGrade(false)} />}
    </div>
  );
}