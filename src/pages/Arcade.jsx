import { useState } from "react";
import ChromeDinoGame from "react-chrome-dino";
import { X, ChevronLeft, ChevronRight, Gamepad2, Zap, Brain, Star } from "lucide-react";

const games = [
  { id:"dino",        title:"Dino Runner",  emoji:"🦕", tag:"Aksi",   desc:"Game dino klasik dari Chrome! Lompati kaktus dan hindari pterodaktil sejauh mungkin.", howTo:"Space / ↑ untuk lompat. Double jump tersedia!", tip:"Waspada pterodaktil di level tinggi.", difficulty:"Mudah",  type:"component", accent:"#059669", accentLight:"#d1fae5" },
  { id:"2048",        title:"2048",         emoji:"🔢", tag:"Puzzle", desc:"Gabungkan angka-angka yang sama untuk mencapai ubin 2048. Simpel tapi bikin nagih!", howTo:"Geser papan dengan tombol panah.", tip:"Pertahankan angka terbesar di pojok.", difficulty:"Sedang", type:"iframe", url:"/games/2048/index.html",           accent:"#2563eb", accentLight:"#dbeafe" },
  { id:"tetris",      title:"Tetris",       emoji:"🟦", tag:"Puzzle", desc:"Susun blok jatuh dan bersihkan baris! Game puzzle legendaris yang tak lekang oleh waktu.", howTo:"← → geser, ↑ rotasi, Space drop.", tip:"Jangan biarkan tumpukan terlalu tinggi.", difficulty:"Sedang", type:"iframe", url:"/games/tetris/index.html",         accent:"#7c3aed", accentLight:"#ede9fe" },
  { id:"snake",       title:"Snake",        emoji:"🐍", tag:"Klasik", desc:"Makan makanan, tumbuh panjang, jangan gigit ekormu sendiri!", howTo:"Tombol panah untuk mengarahkan ular.", tip:"Rencanakan rute — ular panjang butuh ruang.", difficulty:"Mudah",  type:"iframe", url:"/games/snake/src/index.html",        accent:"#059669", accentLight:"#d1fae5" },
  { id:"hextris",     title:"Hextris",      emoji:"🔷", tag:"Puzzle", desc:"Puzzle hexagonal yang memadukan kecepatan dan strategi. Cocokkan warna, raih combo!", howTo:"A/D atau ←/→ untuk putar hexagon.", tip:"Chain combo untuk skor tinggi.", difficulty:"Sulit",  type:"iframe", url:"/games/hextris/index.html",        accent:"#7c3aed", accentLight:"#ede9fe" },
  { id:"minesweeper", title:"Minesweeper",  emoji:"💣", tag:"Puzzle", desc:"Temukan semua kotak aman tanpa kena ranjau. Pikir sebelum klik!", howTo:"Klik kiri buka kotak, klik kanan tandai ranjau.", tip:"Angka = jumlah ranjau di sekitar.", difficulty:"Sedang", type:"iframe", url:"/games/minesweeper/index.html",    accent:"#d97706", accentLight:"#fef3c7" },
  { id:"flappy",      title:"Flappy Bird",  emoji:"🐦", tag:"Aksi",   desc:"Terbangkan burung melewati pipa tanpa nabrak. Mudah dimainkan, susah dikuasai!", howTo:"Klik atau Space untuk flap.", tip:"Jaga ritme klik, jangan terlalu cepat.", difficulty:"Sulit",  type:"iframe", url:"/games/flappy/index.html",         accent:"#d97706", accentLight:"#fef3c7" },
  { id:"sudoku",      title:"Sudoku",       emoji:"🧩", tag:"Puzzle", desc:"Isi grid 9×9 dengan angka 1–9 tanpa pengulangan di baris, kolom, dan kotak.", howTo:"Klik kotak, lalu tekan 1–9 untuk isi.", tip:"Mulai dari baris/kolom yang hampir penuh.", difficulty:"Sedang", type:"iframe", url:"/games/sudoku/index.html",        accent:"#059669", accentLight:"#d1fae5" },
  { id:"breakout",    title:"Breakout",     emoji:"🧱", tag:"Klasik", desc:"Hancurkan semua bata dengan bola pantul! Jangan sampai bola jatuh ke bawah.", howTo:"← → untuk gerakkan paddle.", tip:"Targetkan pojok atas untuk efek berantai.", difficulty:"Mudah",  type:"iframe", url:"/games/breakout/index.html",       accent:"#2563eb", accentLight:"#dbeafe" },
  { id:"memory",      title:"Memory Card",  emoji:"🃏", tag:"Puzzle", desc:"Temukan semua pasangan kartu tersembunyi dalam waktu tercepat. Latih daya ingat!", howTo:"Klik kartu untuk membaliknya.", tip:"Ingat posisi kartu yang sudah terbuka.", difficulty:"Mudah",  type:"iframe", url:"/games/memory/index.html",         accent:"#059669", accentLight:"#d1fae5" },
  { id:"wordle",      title:"Wordle ID",    emoji:"📝", tag:"Kata",   desc:"Tebak kata bahasa Indonesia dalam 6 percobaan! Asah kosakata dan logika bahasamu.", howTo:"Ketik 5 huruf lalu Enter.", tip:"Mulai dengan kata yang banyak vokalnya.", difficulty:"Sedang", type:"iframe", url:"/games/wordle/index.html",         accent:"#7c3aed", accentLight:"#ede9fe" },
];

const tagMeta = {
  Aksi:   { color:"#dc2626", bg:"#fee2e2", icon:Zap },
  Puzzle: { color:"#059669", bg:"#d1fae5", icon:Brain },
  Klasik: { color:"#d97706", bg:"#fef3c7", icon:Star },
  Kata:   { color:"#7c3aed", bg:"#ede9fe", icon:Star },
};
const diffMeta = {
  Mudah:  { color:"#059669", bg:"#d1fae5" },
  Sedang: { color:"#d97706", bg:"#fef3c7" },
  Sulit:  { color:"#dc2626", bg:"#fee2e2" },
};

export default function Arcade() {
  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState("right");
  const [animating, setAnimating] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [tagFilter, setTagFilter] = useState("Semua");

  const g = games[cur];
  const active = games.find(x => x.id === activeGame);
  const tags = ["Semua", ...Array.from(new Set(games.map(g => g.tag)))];
  const filtered = tagFilter === "Semua" ? games : games.filter(g => g.tag === tagFilter);

  const goTo = (idx, direction) => {
    if (animating || idx === cur) return;
    setDir(direction);
    setAnimating(true);
    setShowTip(false);
    setTimeout(() => { setCur(idx); setAnimating(false); }, 320);
  };

  const tm = tagMeta[g.tag] || tagMeta.Puzzle;
  const dm = diffMeta[g.difficulty] || diffMeta.Sedang;

  return (
    <div style={{ fontFamily:"Inter, sans-serif", display:"flex", flexDirection:"column", gap:20 }}>
      <style>{`
        @keyframes slideR { from{opacity:0;transform:translateX(50px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideL { from{opacity:0;transform:translateX(-50px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .hero-r { animation: slideR 0.32s cubic-bezier(.22,1,.36,1) forwards; }
        .hero-l { animation: slideL 0.32s cubic-bezier(.22,1,.36,1) forwards; }
        .tip-in { animation: fadeUp 0.22s ease forwards; }
        .mini-card:hover { transform:translateY(-3px) !important; box-shadow:0 8px 24px rgba(0,0,0,0.1) !important; }
        .play-btn:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.15); }
        .nav-btn:hover { background:rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"rgba(5,150,105,0.1)", border:"1px solid rgba(5,150,105,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Gamepad2 size={17} color="#059669" />
        </div>
        <div>
          <p style={{ margin:0, fontSize:17, fontWeight:700, color:"#111" }}>Arcade</p>
          <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{games.length} game · gratis &amp; langsung main</p>
        </div>
      </div>

      {/* Hero carousel */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid rgba(0,0,0,0.07)", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", position:"relative" }}>
        <div
          key={cur}
          className={!animating ? (dir==="right" ? "hero-r" : "hero-l") : ""}
          style={{ padding:"clamp(16px,4vw,32px) clamp(16px,4vw,36px)", display:"flex", gap:"clamp(12px,3vw,28px)", alignItems:"flex-start", position:"relative", overflow:"hidden", background:`linear-gradient(135deg, ${g.accentLight} 0%, #fff 60%)` }}
        >
          {/* Emoji box */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:110, height:110, borderRadius:22, background:"#fff", border:`2px solid ${g.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:60, boxShadow:`0 4px 20px ${g.accent}20` }}>
              {g.emoji}
            </div>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", padding:"3px 10px", background:tm.bg, color:tm.color, borderRadius:20 }}>{g.tag}</span>
            <span style={{ fontSize:10, fontWeight:600, padding:"3px 10px", background:dm.bg, color:dm.color, borderRadius:20 }}>{g.difficulty}</span>
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ margin:"0 0 8px", fontSize:28, fontWeight:800, color:"#111", letterSpacing:"-0.5px" }}>{g.title}</h2>
            <p style={{ margin:"0 0 16px", fontSize:13, color:"#6b7280", lineHeight:1.65, maxWidth:480 }}>{g.desc}</p>

            {!showTip ? (
              <button onClick={() => setShowTip(true)}
                style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.08)", color:"#6b7280", padding:"6px 13px", borderRadius:8, fontSize:12, cursor:"pointer", marginBottom:16, fontFamily:"inherit" }}>
                ℹ️ Cara main &amp; tips
              </button>
            ) : (
              <div className="tip-in" style={{ marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={{ background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.07)", borderRadius:10, padding:"11px 13px" }}>
                  <p style={{ margin:"0 0 4px", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"#9ca3af" }}>🎮 Cara Main</p>
                  <p style={{ margin:0, fontSize:12, color:"#374151", lineHeight:1.6 }}>{g.howTo}</p>
                </div>
                <div style={{ background:g.accentLight, border:`1px solid ${g.accent}30`, borderRadius:10, padding:"11px 13px" }}>
                  <p style={{ margin:"0 0 4px", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:g.accent }}>⚡ Pro Tip</p>
                  <p style={{ margin:0, fontSize:12, color:"#374151", lineHeight:1.6 }}>{g.tip}</p>
                </div>
              </div>
            )}

            <button className="play-btn" onClick={() => setActiveGame(g.id)}
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 24px", background:g.accent, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" }}>
              ▶ Main Sekarang
            </button>
          </div>

          {/* Nav buttons */}
          <button className="nav-btn" onClick={() => goTo((cur-1+games.length)%games.length,"left")}
            style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.08)", color:"#374151", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"background 0.15s" }}>
            <ChevronLeft size={16} />
          </button>
          <button className="nav-btn" onClick={() => goTo((cur+1)%games.length,"right")}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.08)", color:"#374151", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"background 0.15s" }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:5, padding:"12px 0", borderTop:"1px solid rgba(0,0,0,0.05)", background:"#fafafa" }}>
          {games.map((gm, i) => (
            <div key={i} onClick={() => goTo(i, i>cur?"right":"left")}
              style={{ width:i===cur?20:6, height:6, borderRadius:3, background:i===cur?g.accent:"rgba(0,0,0,0.12)", cursor:"pointer", transition:"all 0.25s ease" }} />
          ))}
        </div>
      </div>

      {/* Filter tags */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {tags.map(t => (
          <button key={t} onClick={() => setTagFilter(t)}
            style={{ padding:"6px 14px", fontSize:12, fontWeight:500, borderRadius:20, border:`1px solid ${tagFilter===t?"transparent":"rgba(0,0,0,0.1)"}`, background:tagFilter===t?"#022c22":"#fff", color:tagFilter===t?"#34d399":"rgba(0,0,0,0.5)", cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div>
        <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:"#9ca3af" }}>
          {tagFilter === "Semua" ? "Semua Game" : tagFilter} · {filtered.length} game
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
          {filtered.map((game) => {
            const isActive = game.id === g.id;
            const gidx = games.findIndex(x => x.id === game.id);
            const gtm = tagMeta[game.tag] || tagMeta.Puzzle;
            return (
              <div key={game.id} className="mini-card"
                onClick={() => { goTo(gidx, gidx>cur?"right":"left"); window.scrollTo({top:0,behavior:"smooth"}); }}
                style={{ background:isActive?game.accentLight:"#fff", border:isActive?`2px solid ${game.accent}50`:"1px solid rgba(0,0,0,0.07)", borderRadius:12, padding:"18px 16px", cursor:"pointer", transition:"all 0.2s", boxShadow:isActive?`0 4px 16px ${game.accent}20`:"0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div style={{ fontSize:38, marginBottom:10 }}>{game.emoji}</div>
                <p style={{ margin:"0 0 5px", fontSize:13, fontWeight:700, color:isActive?game.accent:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{game.title}</p>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", color:gtm.color, background:gtm.bg, padding:"2px 8px", borderRadius:10 }}>{game.tag}</span>
                {isActive && <div style={{ marginTop:8, width:20, height:3, borderRadius:2, background:game.accent }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {activeGame && active && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:1000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"min(960px,96vw)", background:"#111", border:"1px solid rgba(255,255,255,0.1)", padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:"12px 12px 0 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>{active.emoji}</span>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#fff" }}>{active.title}</p>
                <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.4)" }}>{active.howTo}</p>
              </div>
            </div>
            <button onClick={() => setActiveGame(null)}
              style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"6px 14px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5, borderRadius:8, fontFamily:"inherit", fontWeight:600 }}>
              <X size={12} /> Tutup
            </button>
          </div>
          <div style={{ width:"min(960px,96vw)", height:"min(640px,82vh)", background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.08)", borderTop:"none", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"0 0 12px 12px" }}>
            {active.type === "component"
              ? <div style={{ width:"100%", padding:"0 16px 16px", filter:"invert(1)" }}><ChromeDinoGame /></div>
              : <iframe src={active.url} title={active.title} style={{ width:"100%", height:"100%", border:"none" }} allow="autoplay" />
            }
          </div>
        </div>
      )}
    </div>
  );
}
