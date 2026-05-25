import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameAPI } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import confetti from "canvas-confetti";

export default function GameResult() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameAPI.getPlayers(roomCode).then(ps => { setPlayers(ps); setLoading(false); });
    setTimeout(() => {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ["#fbbf24","#a78bfa","#34d399","#f87171","#60a5fa"] });
      setTimeout(() => confetti({ particleCount: 100, spread: 140, origin: { y: 0.6, x: 0.2 } }), 400);
      setTimeout(() => confetti({ particleCount: 100, spread: 140, origin: { y: 0.6, x: 0.8 } }), 700);
    }, 500);
  }, []);

  const me = players.find(p => p.player_email === user?.email);
  const myRank = players.findIndex(p => p.player_email === user?.email) + 1;
  const medals = ["🥇","🥈","🥉"];

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 50% 20%, #1a0a2e 0%, #0a0a0f 70%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
      <div style={{ width:"100%", maxWidth:480, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:8 }}>{myRank <= 3 ? medals[myRank-1] : "🎮"}</div>
        <h1 style={{ color:"#fff", fontSize:28, fontWeight:900, marginBottom:4 }}>Game Selesai!</h1>
        {me && <p style={{ color:"#a78bfa", fontSize:16, marginBottom:4 }}>Kamu di posisi #{myRank}</p>}
        {me && <p style={{ fontSize:48, fontWeight:900, background:"linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"8px 0 24px" }}>{me.score.toLocaleString()}</p>}

        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:20, marginBottom:24 }}>
          <p style={{ color:"#9ca3af", fontSize:13, marginBottom:16 }}>🏆 Final Leaderboard</p>
          {players.map((p, i) => (
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background: p.player_email===user?.email?"rgba(167,139,250,0.1)":"rgba(255,255,255,0.02)", borderRadius:10, marginBottom:8, border: p.player_email===user?.email?"1px solid rgba(167,139,250,0.3)":"1px solid transparent" }}>
              <span style={{ fontSize:22, width:32 }}>{i < 3 ? medals[i] : `${i+1}.`}</span>
              <span style={{ color:"#fff", fontWeight:700, flex:1, textAlign:"left" }}>{p.player_name}</span>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:"#fbbf24", fontWeight:800, fontSize:16 }}>{p.score.toLocaleString()}</div>
                <div style={{ color:"#6b7280", fontSize:11 }}>poin</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/")}
          style={{ padding:"14px 40px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#a78bfa,#60a5fa)", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 32px rgba(167,139,250,0.4)" }}>
          🏠 Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
