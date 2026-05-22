import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Sparkles, Mail, User, Calendar, Venus } from "lucide-react";

function useFadeIn(delay = 0) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), delay * 1000);
    return () => clearTimeout(t);
  }, []);
  return { opacity: go ? 1 : 0, transform: go ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(.22,1,.36,1) ${delay}s` };
}

export default function Settings() {
  const { user } = useOutletContext();
  const fileRef = useRef();

  const [fullName, setFullName]     = useState(user?.full_name   || "");
  const [birthDay, setBirthDay]     = useState(user?.birth_day   || "");
  const [birthMonth, setBirthMonth] = useState(user?.birth_month || "");
  const [birthYear, setBirthYear]   = useState(user?.birth_year  || "");
  const [gender, setGender]         = useState(user?.gender      || "");
  const [avatarUrl, setAvatarUrl]   = useState(user?.avatar_url  || "");
  const [uploading, setUploading]   = useState(false);
  const [hovSave, setHovSave]       = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.email}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      toast.success("Foto berhasil diupload!");
    } catch { toast.error("Gagal upload foto."); }
    finally { setUploading(false); }
  };

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("User").update({
        full_name: fullName, birth_day: birthDay||null, birth_month: birthMonth||null,
        birth_year: birthYear||null, gender: gender||null, avatar_url: avatarUrl||null,
      }).eq("email", user.email);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profil berhasil diperbarui!"); setTimeout(() => window.location.reload(), 1500); },
    onError: () => toast.error("Gagal menyimpan perubahan."),
  });

  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const days   = Array.from({ length: 31 }, (_, i) => i + 1);
  const years  = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i);

  const heroStyle   = useFadeIn(0);
  const leftStyle   = useFadeIn(0.15);
  const rightStyle  = useFadeIn(0.22);

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: "1px solid rgba(0,0,0,0.09)", borderRadius: 9,
    fontSize: 14, color: "#111", outline: "none",
    background: "#f9fafb", boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    transition: "border 0.2s, box-shadow 0.2s, background 0.2s",
  };
  const labelStyle = {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)",
    marginBottom: 7, letterSpacing: "0.8px", textTransform: "uppercase",
  };
  const onFocus = e => { e.target.style.border = "1px solid rgba(52,211,153,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; e.target.style.background = "#fff"; };
  const onBlur  = e => { e.target.style.border = "1px solid rgba(0,0,0,0.09)"; e.target.style.boxShadow = "none"; e.target.style.background = "#f9fafb"; };

  const completeness = [fullName, gender, birthDay, birthMonth, birthYear, avatarUrl].filter(Boolean).length;
  const pct = Math.round((completeness / 6) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes shimmerBar { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes orbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes badgePop   { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes avatarPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} 50%{box-shadow:0 0 0 8px rgba(52,211,153,0.12)} }
        @keyframes fillBar    { from{width:0} to{width:${pct}%} }
        .settings-input:focus { border:1px solid rgba(52,211,153,0.5)!important; box-shadow:0 0 0 3px rgba(52,211,153,0.08)!important; background:#fff!important; }
      `}</style>

      {/* Hero */}
      <div style={{
        ...heroStyle,
        background: "linear-gradient(135deg,#022c22 0%,#064e3b 55%,#065f46 100%)",
        borderRadius: 14, padding: "28px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 24px rgba(2,44,34,0.15)",
      }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(52,211,153,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,0.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.14) 0%,transparent 70%)", animation:"orbFloat 5s ease-in-out infinite", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <Sparkles size={12} color="rgba(52,211,153,0.7)" />
            <span style={{ fontSize:10, color:"rgba(52,211,153,0.7)", letterSpacing:"2.5px", textTransform:"uppercase", fontWeight:600 }}>Akun</span>
          </div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:30, color:"#fff", margin:"0 0 5px", fontWeight:"normal", lineHeight:1.1 }}>Pengaturan</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", margin:0 }}>Kelola profil dan preferensi akunmu</p>
          <div style={{ marginTop:14, height:2, width:60, background:"rgba(52,211,153,0.2)", borderRadius:2, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.8),transparent)", animation:"shimmerBar 2.2s infinite" }} />
          </div>
        </div>

        {/* Completeness badge */}
        <div style={{ background:"rgba(0,0,0,0.25)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:12, padding:"16px 24px", textAlign:"center", position:"relative", zIndex:1, flexShrink:0, animation:"badgePop 0.6s 0.3s both" }}>
          <span style={{ display:"block", fontSize:10, color:"rgba(52,211,153,0.6)", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:6 }}>Kelengkapan</span>
          <span style={{ fontSize:38, fontWeight:800, color:"#34d399", lineHeight:1 }}>{pct}%</span>
          <div style={{ marginTop:8, height:4, width:80, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:"#34d399", borderRadius:2, animation:"fillBar 1s 0.5s both" }} />
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16, alignItems:"start" }}>

        {/* LEFT — Profile card */}
        <div style={{ ...leftStyle, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#fff", border:"1px solid rgba(0,0,0,0.07)", borderRadius:14, padding:"28px 20px", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            {/* Avatar */}
            <div style={{ position:"relative", display:"inline-block", marginBottom:16 }}>
              <div style={{ width:96, height:96, borderRadius:"50%", background:"linear-gradient(135deg,#022c22,#064e3b)", border:"3px solid rgba(52,211,153,0.3)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", animation:"avatarPulse 3s ease-in-out infinite" }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ color:"#34d399", fontSize:36, fontWeight:700 }}>{user?.full_name?.charAt(0)?.toUpperCase()||"U"}</span>
                }
              </div>
              <button onClick={() => fileRef.current.click()} disabled={uploading}
                style={{ position:"absolute", bottom:2, right:2, width:30, height:30, background:"#059669", border:"2.5px solid #fff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform="scale(1.12)"}
                onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                <Camera size={13} color="#fff" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoChange} />
            </div>

            <p style={{ fontSize:17, fontWeight:700, color:"#111", margin:"0 0 4px", letterSpacing:"-0.3px" }}>{user?.full_name||"Pengguna"}</p>
            <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 12px" }}>{user?.email}</p>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", padding:"5px 14px", borderRadius:20, background:"rgba(5,150,105,0.1)", color:"#059669", border:"1px solid rgba(5,150,105,0.2)" }}>
              {user?.role === "teacher" ? "PENGAJAR" : "MURID"}
            </span>

            {/* Info rows */}
            <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:8, textAlign:"left" }}>
              {[
                { icon: Mail,     label:"Email",      val: user?.email },
                { icon: User,     label:"Role",       val: user?.role },
                { icon: Venus,    label:"Kelamin",    val: gender === "male" ? "Laki-laki" : gender === "female" ? "Perempuan" : "-" },
                { icon: Calendar, label:"Lahir",      val: birthDay && birthMonth && birthYear ? `${birthDay} ${months[birthMonth-1]} ${birthYear}` : "-" },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"#f9fafb", borderRadius:8, border:"1px solid rgba(0,0,0,0.06)" }}>
                  <Icon size={13} color="#059669" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:9, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", margin:0 }}>{label}</p>
                    <p style={{ fontSize:12, color:"#111", fontWeight:500, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val||"-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div style={{ ...rightStyle, display:"flex", flexDirection:"column", gap:14 }}>

          {/* Informasi Pribadi */}
          <div style={{ background:"#fff", border:"1px solid rgba(0,0,0,0.07)", borderRadius:14, padding:"24px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(0,0,0,0.35)", letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 20px" }}>Informasi Pribadi</p>

            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {/* Nama */}
              <div>
                <label style={labelStyle}><User size={11} />Nama Lengkap</label>
                <input className="settings-input" style={inputStyle} value={fullName}
                  onChange={e => setFullName(e.target.value)} placeholder="Nama lengkap"
                  onFocus={onFocus} onBlur={onBlur} />
              </div>

              {/* Gender */}
              <div>
                <label style={labelStyle}><Venus size={11} />Jenis Kelamin</label>
                <div style={{ display:"flex", gap:10 }}>
                  {[["male","Laki-laki"],["female","Perempuan"]].map(([val, lbl]) => {
                    const active = gender === val;
                    return (
                      <button key={val} onClick={() => setGender(val)} style={{
                        flex:1, padding:"11px",
                        border:`1.5px solid ${active ? "#059669" : "rgba(0,0,0,0.09)"}`,
                        borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer",
                        background: active ? "rgba(5,150,105,0.08)" : "#f9fafb",
                        color: active ? "#059669" : "rgba(0,0,0,0.45)",
                        transition:"all 0.18s",
                        boxShadow: active ? "0 2px 10px rgba(5,150,105,0.12)" : "none",
                        fontFamily:"Inter, sans-serif",
                      }}>{lbl}</button>
                    );
                  })}
                </div>
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label style={labelStyle}><Calendar size={11} />Tanggal Lahir</label>
                <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 100px", gap:10 }}>
                  {[
                    { val:birthDay,   set:setBirthDay,   opts:days.map(d=>({v:d,l:d})),         ph:"Tgl"   },
                    { val:birthMonth, set:setBirthMonth, opts:months.map((m,i)=>({v:i+1,l:m})), ph:"Bulan" },
                    { val:birthYear,  set:setBirthYear,  opts:years.map(y=>({v:y,l:y})),         ph:"Tahun" },
                  ].map((s, i) => (
                    <select key={i} value={s.val} onChange={e => s.set(e.target.value)}
                      style={{ ...inputStyle, appearance:"none", cursor:"pointer", color:s.val?"#111":"rgba(0,0,0,0.35)" }}
                      onFocus={onFocus} onBlur={onBlur}>
                      <option value="">{s.ph}</option>
                      {s.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={() => update.mutate()}
            disabled={update.isPending || uploading}
            onMouseEnter={() => setHovSave(true)}
            onMouseLeave={() => setHovSave(false)}
            style={{
              padding:"14px", width:"100%",
              background: update.isPending||uploading ? "rgba(6,78,59,0.5)" : hovSave ? "#043d2e" : "#059669",
              color:"#fff", border:"none", borderRadius:12,
              fontSize:14, fontWeight:700, cursor: update.isPending||uploading ? "not-allowed" : "pointer",
              boxShadow: hovSave && !update.isPending ? "0 6px 22px rgba(5,150,105,0.35)" : "0 2px 10px rgba(5,150,105,0.2)",
              transform: hovSave && !update.isPending ? "translateY(-2px)" : "translateY(0)",
              transition:"all 0.2s", letterSpacing:"0.3px", fontFamily:"Inter, sans-serif",
            }}>
            {update.isPending ? "Menyimpan..." : uploading ? "Mengupload..." : "💾 Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
