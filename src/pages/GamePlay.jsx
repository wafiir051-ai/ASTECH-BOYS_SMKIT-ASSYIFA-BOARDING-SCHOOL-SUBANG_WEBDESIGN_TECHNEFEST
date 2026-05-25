import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameAPI, supabase, entities } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import confetti from "canvas-confetti";

const OPTION_COLORS = [
  { bg:"linear-gradient(160deg,#8b9e00,#b5c400)", shadow:"rgba(181,196,0,0.4)" },
  { bg:"linear-gradient(160deg,#7c3aed,#a855f7)", shadow:"rgba(168,85,247,0.4)" },
  { bg:"linear-gradient(160deg,#ea580c,#f97316)", shadow:"rgba(249,115,22,0.4)" },
  { bg:"linear-gradient(160deg,#0d9488,#14b8a6)", shadow:"rgba(20,184,166,0.4)" },
  { bg:"linear-gradient(160deg,#2563eb,#60a5fa)", shadow:"rgba(96,165,250,0.4)" },
];
const LABELS = ["A","B","C","D","E"];

export default function GamePlay() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const timerRef = useRef(null);
  const channelRef = useRef(null);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      const r = await gameAPI.getRoom(roomCode);
      setRoom(r);
      const ps = await gameAPI.getPlayers(roomCode);
      setPlayers(ps);
      const myPlayer = ps.find(p => p.player_email === user?.email);
      if (myPlayer) { setScore(myPlayer.score); setStreak(myPlayer.streak); }
      const a = await entities.Assignment.filter({ id: r.assignment_id }).then(res => res[0]);
      setAssignment(a);
    };
    init();

    // Subscribe
    channelRef.current = gameAPI.subscribeRoom(
      roomCode,
      (newRoom) => {
        setRoom(prev => {
          if (prev?.current_question !== newRoom.current_question) {
            setAnswered(false); setSelected(null); setFeedback(null);
            setShowLeaderboard(false); setTimeLeft(20);
          }
          return newRoom;
        });
        if (newRoom.status === "ended") navigate(`/game/${roomCode}/result`);
      },
      (newPlayers) => {
        setPlayers(newPlayers);
        const me = newPlayers.find(p => p.player_email === user?.email);
        if (me) { setScore(me.score); setStreak(me.streak); }
      }
    );
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomCode]);

  // Timer
  useEffect(() => {
    if (!room || !assignment || answered) return;
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleAnswer(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [room?.current_question, assignment]);

  const handleAnswer = useCallback(async (optIdx) => {
    if (answered || !room || !assignment) return;
    clearInterval(timerRef.current);
    setAnswered(true);
    setSelected(optIdx);

    const q = assignment.quiz_questions[room.current_question];
    const isCorrect = optIdx !== null && q.correct_answer === optIdx;
    const newStreak = isCorrect ? streak + 1 : 0;
    const bonus = newStreak >= 3 ? 1.5 : 1;
    const earned = isCorrect ? Math.round((q.points || 10) * bonus * (timeLeft / 20)) : 0;
    const newScore = score + earned;

    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setStreak(newStreak);
      setScore(newScore);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 }, colors: ["#fbbf24","#a78bfa","#34d399","#ec4899"] });
    } else {
      setStreak(0);
    }

    // Update player score
    const myAnswers = players.find(p => p.player_email === user?.email)?.answers || [];
    await gameAPI.updatePlayer(roomCode, user.email, {
      score: newScore,
      streak: newStreak,
      answers: [...myAnswers, { qi: room.current_question, ans: optIdx, correct: isCorrect, earned }]
    });

    // Show leaderboard after 2s, then host advances question
    setTimeout(() => setShowLeaderboard(true), 2000);

    // Host advances after 4s
    if (room.host_email === user?.email) {
      setTimeout(async () => {
        const nextQ = room.current_question + 1;
        if (nextQ >= assignment.quiz_questions.length) {
          await gameAPI.updateRoom(roomCode, { status: "ended" });
        } else {
          await gameAPI.updateRoom(roomCode, { current_question: nextQ, question_start_at: new Date().toISOString() });
        }
      }, 5000);
    }
  }, [answered, room, assignment, streak, score, timeLeft, players, user, roomCode]);

  if (!room || !assignment) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const questions = assignment.quiz_questions;
  const q = questions[room.current_question];
  if (!q) return null;

  const timerPct = (timeLeft / 20) * 100;
  const timerColor = timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  const isHost = room.host_email === user?.email;

  return (
    <div style={{ position:"fixed", inset:0, background:"#0a0a0f", display:"flex", flexDirection:"column", overflow:"hidden", zIndex:9999 }}>
      {/* Header */}
      <div style={{ padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:"#6b7280", fontSize:12 }}>Soal {room.current_question + 1}/{questions.length}</span>
          {streak >= 3 && <span style={{ fontSize:12, background:"rgba(251,191,36,0.15)", color:"#fbbf24", padding:"2px 10px", borderRadius:20, fontWeight:700 }}>🔥 {streak}x</span>}
        </div>
        {/* Timer circle */}
        <div style={{ position:"relative", width:44, height:44 }}>
          <svg width="44" height="44" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke={timerColor} strokeWidth="4"
              strokeDasharray={`${2*Math.PI*18}`} strokeDashoffset={`${2*Math.PI*18*(1-timerPct/100)}`}
              style={{ transition:"stroke-dashoffset 1s linear, stroke 0.3s" }}/>
          </svg>
          <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:timerColor, fontSize:13, fontWeight:800 }}>{timeLeft}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ color:"#fbbf24", fontWeight:800, fontSize:15 }}>{score.toLocaleString()}</span>
          <span style={{ color:"#6b7280", fontSize:11 }}>poin</span>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 24px", minHeight:0 }}>
        <p style={{ color:"#fff", fontSize:"clamp(16px,3vw,26px)", fontWeight:700, textAlign:"center", lineHeight:1.5, maxWidth:700, margin:0 }}>
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display:"grid", gridTemplateColumns: q.options?.length === 3 ? "1fr 1fr 1fr" : q.options?.length === 5 ? "1fr 1fr 1fr" : "1fr 1fr", flexShrink:0 }}>
        {(q.options || []).map((opt, oi) => {
          const col = OPTION_COLORS[oi % OPTION_COLORS.length];
          const isSelected = selected === oi;
          const isCorrect = q.correct_answer === oi;
          let borderStyle = "none";
          if (answered && isCorrect) borderStyle = "4px solid #fff";
          if (answered && isSelected && !isCorrect) borderStyle = "4px solid #ef4444";
          return (
            <button key={oi} onClick={() => handleAnswer(oi)} disabled={answered}
              style={{
                background: answered && isCorrect ? "linear-gradient(160deg,#059669,#10b981)"
                  : answered && isSelected && !isCorrect ? "linear-gradient(160deg,#991b1b,#ef4444)"
                  : col.bg,
                border: borderStyle,
                cursor: answered ? "default" : "pointer",
                padding:"clamp(16px,3vh,28px) 20px",
                display:"flex", alignItems:"center", gap:14,
                transition:"transform 0.15s, filter 0.15s",
                filter: answered && !isCorrect && !isSelected ? "brightness(0.5)" : "brightness(1)",
                transform: isSelected && !answered ? "scale(0.97)" : "scale(1)",
                boxShadow: answered && isCorrect ? `0 0 40px rgba(16,185,129,0.5)` : `inset 0 -4px 0 rgba(0,0,0,0.2)`,
              }}>
              <span style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#fff", flexShrink:0 }}>
                {LABELS[oi]}
              </span>
              <span style={{ color:"#fff", fontWeight:700, fontSize:"clamp(13px,2vw,17px)", textAlign:"left", lineHeight:1.3 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none", zIndex:1000, textAlign:"center" }}>
          <div style={{ fontSize:"clamp(40px,8vw,80px)", fontWeight:900, color: feedback==="correct"?"#34d399":"#f87171", textShadow:`0 0 40px ${feedback==="correct"?"rgba(52,211,153,0.8)":"rgba(248,113,113,0.8)"}`, animation:"feedbackPop 0.4s cubic-bezier(.22,1,.36,1)" }}>
            {feedback === "correct" ? "✓ BENAR!" : "✗ SALAH"}
          </div>
        </div>
      )}

      {/* Leaderboard overlay */}
      {showLeaderboard && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
          <div style={{ background:"#111827", borderRadius:20, padding:28, width:"100%", maxWidth:400, textAlign:"center" }}>
            <p style={{ color:"#9ca3af", fontSize:13, marginBottom:16 }}>🏆 Leaderboard</p>
            {players.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background: p.player_email===user?.email?"rgba(167,139,250,0.1)":"transparent", borderRadius:10, marginBottom:6 }}>
                <span style={{ fontSize:20, width:28 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`}</span>
                <span style={{ color:"#fff", fontWeight:700, flex:1, textAlign:"left" }}>{p.player_name}</span>
                <span style={{ color:"#fbbf24", fontWeight:800 }}>{p.score.toLocaleString()}</span>
              </div>
            ))}
            {isHost && <p style={{ color:"#6b7280", fontSize:12, marginTop:12 }}>⏳ Soal berikutnya dalam beberapa detik...</p>}
            {!isHost && <p style={{ color:"#6b7280", fontSize:12, marginTop:12 }}>⏳ Menunggu host lanjut ke soal berikutnya...</p>}
          </div>
        </div>
      )}

      <style>{`
        @keyframes feedbackPop { 0%{transform:translate(-50%,-50%) scale(0.3);opacity:0} 60%{transform:translate(-50%,-50%) scale(1.15);opacity:1} 100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
