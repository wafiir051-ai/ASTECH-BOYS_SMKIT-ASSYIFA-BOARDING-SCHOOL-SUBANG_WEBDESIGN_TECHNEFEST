import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { entities, gameAPI, supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

export default function GameLobby() {
  const { assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const joinCode = searchParams.get("join");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState(joinCode ? "join" : null); // null | "host" | "join"
  const [roomCode, setRoomCode] = useState(joinCode || "");
  const [inputCode, setInputCode] = useState(joinCode || "");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);

  const { data: assignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => entities.Assignment.filter({ id: assignmentId }).then(r => r[0]),
    enabled: !!assignmentId,
  });

  // Auto-join if joinCode in URL
  useEffect(() => {
    if (joinCode && user) handleJoin(joinCode);
  }, [joinCode, user]);

  // Subscribe realtime
  useEffect(() => {
    if (!roomCode) return;
    channelRef.current = gameAPI.subscribeRoom(
      roomCode,
      (newRoom) => {
        setRoom(newRoom);
        if (newRoom.status === "playing") {
          navigate(`/game/${roomCode}/play`);
        }
        if (newRoom.status === "ended") {
          navigate(`/game/${roomCode}/result`);
        }
      },
      (newPlayers) => setPlayers(newPlayers)
    );
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomCode]);

  const handleHost = async () => {
    if (!assignment || !user) return;
    setLoading(true); setError("");
    try {
      const newRoom = await gameAPI.createRoom(assignment.id, user.email, user.full_name || user.email);
      await gameAPI.joinRoom(newRoom.code, user.email, user.full_name || user.email, true);
      const ps = await gameAPI.getPlayers(newRoom.code);
      setRoom(newRoom); setPlayers(ps); setRoomCode(newRoom.code); setMode("host");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleJoin = async (code) => {
    const c = (code || inputCode).toUpperCase().trim();
    if (!c || c.length < 4) { setError("Masukkan kode room yang valid"); return; }
    setLoading(true); setError("");
    try {
      const foundRoom = await gameAPI.getRoom(c);
      if (foundRoom.status !== "waiting") { setError("Game sudah dimulai atau berakhir"); setLoading(false); return; }
      await gameAPI.joinRoom(c, user.email, user.full_name || user.email, false);
      const ps = await gameAPI.getPlayers(c);
      setRoom(foundRoom); setPlayers(ps); setRoomCode(c); setMode("join");
    } catch (e) { setError("Room tidak ditemukan. Cek kode dan coba lagi."); }
    setLoading(false);
  };

  const handleStart = async () => {
    if (players.length < 1) { setError("Minimal 1 pemain untuk mulai"); return; }
    setLoading(true);
    try {
      await gameAPI.updateRoom(roomCode, { status: "playing", current_question: 0, question_start_at: new Date().toISOString() });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const colors = ["#34d399","#60a5fa","#f87171","#fbbf24","#a78bfa","#ec4899","#f97316","#14b8a6"];

  // ── INITIAL SCREEN ──
  if (!room) return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 50% 20%, #0f172a 0%, #020617 70%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:440, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🎮</div>
        <h1 style={{ color:"#fff", fontSize:28, fontWeight:900, marginBottom:4 }}>EduSpace Arcade</h1>
        <p style={{ color:"#6b7280", marginBottom:32 }}>{assignment?.title || "Quiz Multiplayer"}</p>

        {!mode ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <button onClick={handleHost} disabled={loading}
              style={{ padding:"16px 32px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#a78bfa,#6d28d9)", color:"#fff", fontSize:17, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 32px rgba(167,139,250,0.4)" }}>
              {loading ? "Membuat Room..." : "🏠 Buat Room (Host)"}
            </button>
            <button onClick={() => setMode("join-input")}
              style={{ padding:"16px 32px", borderRadius:14, border:"2px solid rgba(255,255,255,0.15)", background:"transparent", color:"#fff", fontSize:17, fontWeight:700, cursor:"pointer" }}>
              🚪 Join Room
            </button>
          </div>
        ) : mode === "join-input" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input
              value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode room (6 digit)"
              maxLength={6}
              style={{ padding:"16px 20px", borderRadius:12, border:"2px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.05)", color:"#fff", fontSize:20, fontWeight:800, textAlign:"center", letterSpacing:6, outline:"none" }}
            />
            <button onClick={() => handleJoin()} disabled={loading}
              style={{ padding:"16px 32px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#34d399,#059669)", color:"#fff", fontSize:17, fontWeight:800, cursor:"pointer" }}>
              {loading ? "Mencari Room..." : "Masuk →"}
            </button>
            <button onClick={() => setMode(null)} style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:14 }}>← Kembali</button>
          </div>
        ) : null}

        {error && <p style={{ color:"#f87171", marginTop:16, fontSize:14 }}>{error}</p>}
      </div>
    </div>
  );

  // ── WAITING ROOM ──
  const isHost = room.host_email === user?.email;
  return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 50% 20%, #0f172a 0%, #020617 70%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:520 }}>
        {/* Room Code */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <p style={{ color:"#6b7280", fontSize:13, letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>Kode Room</p>
          <div style={{ fontSize:"clamp(48px,10vw,80px)", fontWeight:900, letterSpacing:12, color:"#fff", fontFamily:"Georgia,serif", textShadow:"0 0 40px rgba(167,139,250,0.6)" }}>
            {roomCode}
          </div>
          <p style={{ color:"#6b7280", fontSize:13, marginTop:8 }}>Bagikan kode ini ke teman-temanmu</p>
        </div>

        {/* Players */}
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:20, marginBottom:20 }}>
          <p style={{ color:"#9ca3af", fontSize:13, marginBottom:16 }}>👥 Pemain ({players.length})</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {players.map((p, i) => (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:colors[i % colors.length], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#000" }}>
                  {p.player_name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color:"#fff", fontWeight:600, flex:1 }}>{p.player_name}</span>
                {p.is_host && <span style={{ fontSize:11, background:"rgba(167,139,250,0.2)", color:"#a78bfa", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>HOST</span>}
              </div>
            ))}
            {players.length === 0 && <p style={{ color:"#4b5563", textAlign:"center", fontSize:13 }}>Belum ada pemain...</p>}
          </div>
        </div>

        {/* Host controls */}
        {isHost ? (
          <button onClick={handleStart} disabled={loading}
            style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#34d399,#059669)", color:"#fff", fontSize:18, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 32px rgba(52,211,153,0.4)" }}>
            {loading ? "Memulai..." : "🚀 Mulai Game!"}
          </button>
        ) : (
          <div style={{ textAlign:"center", color:"#6b7280", fontSize:14 }}>
            ⏳ Menunggu host memulai game...
          </div>
        )}
        {error && <p style={{ color:"#f87171", marginTop:12, textAlign:"center", fontSize:13 }}>{error}</p>}
      </div>
    </div>
  );
}
