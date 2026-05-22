import ChromeDinoGame from "react-chrome-dino";
import { useEffect, useRef } from "react";

export default function RunnerGame({ onClose }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    let beat = 0;
    const MEL = [523,587,659,784,880,784,659,587,523,494,523,587,659,523,494,392];
    const BAS = [131,147,165,196,220,196,165,147,131,123,131,147,165,131,123,98];

    const tone = (freq, type, vol, delay, dur) => {
      if (!freq) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + delay);
      o.stop(ctx.currentTime + delay + dur + 0.01);
    };

    const timer = setInterval(() => {
      const i = beat % MEL.length;
      tone(MEL[i], "square",   0.04, 0,    0.12);
      tone(BAS[i], "triangle", 0.03, 0,    0.12);
      if (beat % 4 === 0) tone(80, "sine", 0.06, 0, 0.08);
      beat++;
    }, 160);

    audioRef.current = { ctx, timer };
    return () => {
      clearInterval(timer);
      ctx.close();
    };
  }, []);

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <button onClick={onClose} style={s.closeBtn}>✕ MENU</button>
        <div style={s.hint}>SPACE / TAP untuk lompat</div>
        <ChromeDinoGame />
      </div>
    </div>
  );
}

const s = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" },
  modal: { width:"min(860px,96vw)", background:"#f7f7f7", border:"1px solid #d0d0d0", position:"relative", padding:"40px 20px 20px", boxShadow:"0 8px 40px rgba(0,0,0,0.2)" },
  closeBtn: { position:"absolute", top:10, right:14, background:"none", border:"none", color:"#535353", fontSize:13, cursor:"pointer", fontFamily:"'Courier New',monospace", fontWeight:"bold", letterSpacing:2 },
  hint: { textAlign:"center", fontSize:11, color:"#9d9d9d", fontFamily:"'Courier New',monospace", letterSpacing:2, marginBottom:8, textTransform:"uppercase" },
};
