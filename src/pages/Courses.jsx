import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseClient";
import { Plus, Users, BookOpen, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";

const COVER_COLORS = [
  "#064e3b","#065f46","#047857","#0a2240","#1e1b4b",
  "#1a1a4e","#0f3444","#2a1a0e","#3b0764","#0a2a1a"
];

function CourseCard({ course, role, delay=0 }) {
  const [copied, setCopied] = useState(false);
  const color = course.cover_color || "#064e3b";

  const copyCode = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(course.class_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link to={`/courses/${course.id}`} style={{ textDecoration:"none" }}>
      <div className="hover-lift anim-fade-up" style={{
        background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
        borderRadius:12, overflow:"hidden",
        boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
        animationDelay:`${delay}s`,
      }}>
        {/* Cover */}
        <div style={{ height:120, background:color, position:"relative", display:"flex", alignItems:"flex-end", padding:"14px 18px", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.5))" }} />
          <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <p style={{ fontSize:10, color:"rgba(0,0,0,0.55)", margin:"0 0 3px", letterSpacing:"0.5px" }}>{course.subject||"Kelas"}</p>
            <h3 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, lineHeight:1.2 }}>{course.title}</h3>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:"14px 18px" }}>
          <p style={{ fontSize:12, color:"rgba(0,0,0,0.38)", margin:"0 0 6px" }}>oleh {course.teacher_name}</p>
          {course.description && (
            <p style={{ fontSize:12, color:"rgba(0,0,0,0.5)", margin:"0 0 12px", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{course.description}</p>
          )}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"rgba(0,0,0,0.35)" }}>
              <Users size={12} color="rgba(0,0,0,0.3)" />
              <span>{course.students?.length||0} murid</span>
            </div>
            {(role==="teacher"||role==="admin") && course.class_code && (
              <button onClick={copyCode} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#10b981", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6, background:"rgba(16,185,129,0.06)" }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied?"Disalin!":course.class_code}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="anim-scale-in" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:16, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", width:"100%", maxWidth:520, borderRadius:14, boxShadow:"0 24px 64px rgba(0,0,0,0.18)", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", borderBottom:"1px solid rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:"#111", margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.05)", border:"none", cursor:"pointer", borderRadius:6, color:"rgba(0,0,0,0.4)" }}><X size={15} /></button>
        </div>
        <div style={{ padding:"22px" }}>{children}</div>
        {footer && <div style={{ display:"flex", gap:10, padding:"14px 22px", borderTop:"1px solid rgba(0,0,0,0.07)" }}>{footer}</div>}
      </div>
    </div>
  );
}

const fieldStyle = { width:"100%", padding:"10px 12px", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontSize:13, color:"#111", outline:"none", background:"#fafafa", boxSizing:"border-box", transition:"border 0.2s", fontFamily:"Inter, sans-serif" };
const labelStyle = { display:"block", fontSize:11, fontWeight:600, color:"rgba(0,0,0,0.45)", marginBottom:6, letterSpacing:"0.5px", textTransform:"uppercase" };

function CreateCourseModal({ onClose, user }) {
  const [form, setForm] = useState({ title:"", subject:"", description:"", cover_color:COVER_COLORS[0] });
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (data) => {
      const code = Math.random().toString(36).substring(2,8).toUpperCase();
      return entities.Course.create({ ...data, teacher_id:user.email, teacher_name:user.full_name, class_code:code, students:[], status:"active" });
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["courses"]}); toast.success("Kelas berhasil dibuat!"); onClose(); },
    onError: (e) => toast.error("Gagal: "+e.message),
  });

  return (
    <Modal title="Buat Kelas Baru" onClose={onClose}
      footer={<>
        <button style={{ flex:1, padding:"10px", background:"#f5f5f5", border:"1px solid rgba(0,0,0,0.1)", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }} onClick={onClose}>Batal</button>
        <button style={{ flex:2, padding:"10px", background:"#064e3b", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", opacity:!form.title||create.isPending?0.5:1 }}
          onClick={() => create.mutate(form)} disabled={!form.title||create.isPending}>
          {create.isPending?"Membuat...":"Buat Kelas"}
        </button>
      </>}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div><label style={labelStyle}>Judul Kelas *</label><input style={fieldStyle} placeholder="cth: Matematika Kelas 10" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
        <div><label style={labelStyle}>Mata Pelajaran</label><input style={fieldStyle} placeholder="cth: Matematika" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} /></div>
        <div><label style={labelStyle}>Deskripsi</label><textarea style={{...fieldStyle,minHeight:72,resize:"none"}} placeholder="Deskripsi singkat..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
        <div>
          <label style={labelStyle}>Warna Cover</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {COVER_COLORS.map(c => (
              <button key={c} onClick={()=>setForm({...form,cover_color:c})}
                style={{ width:28, height:28, background:c, borderRadius:6, border:form.cover_color===c?"2px solid #10b981":"2px solid transparent", outline:form.cover_color===c?"2px solid #10b981":"none", outlineOffset:2, cursor:"pointer", transform:form.cover_color===c?"scale(1.2)":"scale(1)", transition:"all 0.15s" }} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function JoinCourseModal({ onClose, user }) {
  const [code, setCode] = useState("");
  const qc = useQueryClient();

  const join = useMutation({
    mutationFn: async () => {
      const course = await entities.Course.findByClassCode(code);
      if (!course) throw new Error("Kode kelas tidak ditemukan");
      const existing = await entities.CourseEnrollment.filter({ course_id:course.id, student_id:user.email });
      if (existing.length) throw new Error("Kamu sudah terdaftar di kelas ini");
      await entities.CourseEnrollment.create({ course_id:course.id, course_title:course.title, student_id:user.email, student_name:user.full_name, student_email:user.email, teacher_name:course.teacher_name, joined_at:new Date().toISOString() });
      await entities.Course.update(course.id, { students:[...(course.students||[]),user.email] });
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["courses"]}); toast.success("Berhasil bergabung!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal title="Bergabung ke Kelas" onClose={onClose}
      footer={<>
        <button style={{ flex:1, padding:"10px", background:"#f5f5f5", border:"1px solid rgba(0,0,0,0.1)", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }} onClick={onClose}>Batal</button>
        <button style={{ flex:2, padding:"10px", background:"#064e3b", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", opacity:code.length<4||join.isPending?0.5:1 }}
          onClick={() => join.mutate()} disabled={code.length<4||join.isPending}>
          {join.isPending?"Bergabung...":"Bergabung"}
        </button>
      </>}>
      <p style={{ fontSize:13, color:"rgba(0,0,0,0.45)", margin:"0 0 16px" }}>Masukkan kode kelas dari gurumu.</p>
      <input style={{...fieldStyle, textAlign:"center", fontSize:24, fontWeight:700, letterSpacing:8, borderRadius:10}} placeholder="ABC123" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6} />
    </Modal>
  );
}

export default function Courses() {
  const { user } = useOutletContext();
  const role = user?.role || "student";
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses", role, user?.email],
    queryFn: async () => {
      if (role==="student") {
        const enrollments = await entities.CourseEnrollment.filter({student_id:user.email});
        const ids = enrollments.map(e=>e.course_id);
        if (!ids.length) return [];
        const all = await entities.Course.list();
        return all.filter(c=>ids.includes(c.id));
      } else if (role==="teacher") {
        return entities.Course.filter({teacher_id:user.email});
      } else {
        return entities.Course.list();
      }
    },
  });

  return (
    <div>
      {/* Page header */}
      <div className="anim-fade-up" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#111", margin:"0 0 4px", letterSpacing:"-0.4px" }}>
            {role==="student"?"Kelas Saya":role==="teacher"?"Kelas yang Diajar":"Semua Kelas"}
          </h2>
          <p style={{ fontSize:13, color:"rgba(0,0,0,0.38)", margin:0 }}>{courses.length} kelas aktif</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {(role==="teacher"||role==="admin") && (
            <button className="hover-lift" onClick={()=>setShowCreate(true)} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#064e3b", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              <Plus size={14} /> Buat Kelas
            </button>
          )}
          {role==="student" && (
            <button className="hover-lift" onClick={()=>setShowJoin(true)} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"#064e3b", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              <Plus size={14} /> Bergabung
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(0,0,0,0.06)" }}>
              <div className="shimmer" style={{ height:120 }} />
              <div style={{ padding:18 }}>
                <div className="shimmer" style={{ height:14, borderRadius:4, width:"70%", marginBottom:8 }} />
                <div className="shimmer" style={{ height:11, borderRadius:4, width:"40%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length===0 ? (
        <div className="anim-fade-up" style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 20px", textAlign:"center" }}>
          <div className="anim-float" style={{ width:72, height:72, borderRadius:16, background:"rgba(16,185,129,0.06)", border:"1px dashed rgba(16,185,129,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <BookOpen size={32} color="rgba(16,185,129,0.3)" />
          </div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#111", margin:"0 0 8px" }}>Belum Ada Kelas</h3>
          <p style={{ fontSize:13, color:"rgba(0,0,0,0.38)", margin:0 }}>
            {role==="student"?"Bergabung ke kelas dengan kode dari gurumu.":"Buat kelas pertamamu sekarang."}
          </p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18 }}>
          {courses.map((c,i) => <CourseCard key={c.id} course={c} role={role} delay={i*0.06} />)}
        </div>
      )}

      {showCreate && <CreateCourseModal onClose={()=>setShowCreate(false)} user={user} />}
      {showJoin   && <JoinCourseModal   onClose={()=>setShowJoin(false)}   user={user} />}
    </div>
  );
}
