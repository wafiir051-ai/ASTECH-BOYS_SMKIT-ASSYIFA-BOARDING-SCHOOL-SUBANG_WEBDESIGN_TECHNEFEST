import { useState, useRef } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities, supabase } from "@/api/supabaseClient";
import { ArrowLeft, Plus, ClipboardList, BookOpen, FileText, Clock, Users, X, Megaphone, Copy, Check, Zap, Trash2 , Paperclip, Upload, Download } from "lucide-react";
import { NoomoCard, NoomoBadge, NoomoButton } from "@/components/ui/NoomoCard";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

function AssignmentItem({ item, role: _role, courseId }) {
  const typeConfig = {
    assignment: { label: "Tugas", color: "default" },
    quiz: { label: "Kuis", color: "warning" },
    material: { label: "Materi", color: "ghost" },
  };
  const cfg = typeConfig[item.type] || typeConfig.assignment;

  return (
    <Link to={`/courses/${courseId}/assignments/${item.id}`} className="block">
      <NoomoCard className="p-4 flex items-center gap-4 hover:border-vibrant-blue/40 transition-all">
        <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center ${
          item.type === "quiz" ? "bg-amber-100 text-amber-700" 
          : item.type === "material" ? "bg-emerald-100 text-emerald-700"
          : "bg-vibrant-blue/10 text-vibrant-blue"
        }`}>
          {item.type === "material" ? <FileText className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          {item.due_date && (
            <p className="text-xs text-medium-gray font-editorial mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(item.due_date), "dd MMM yyyy, HH:mm", { locale: idLocale })}
            </p>
          )}
        </div>
        <NoomoBadge variant={cfg.color} className="">{cfg.label}</NoomoBadge>
      </NoomoCard>
    </Link>
  );
}

const ALLOWED_EXT_ASSIGN = ["zip","rar","7z","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","md","jpg","jpeg","png","gif","webp","svg","mp4","mov","avi","mkv","webm","mp3","wav","m4a","ogg"];
const MAX_FILE_SIZE_ASSIGN = 50 * 1024 * 1024;

function formatBytesAssign(b) {
  if (b < 1024) return b + " B";
  if (b < 1024*1024) return (b/1024).toFixed(1) + " KB";
  return (b/(1024*1024)).toFixed(1) + " MB";
}

function sanitizeFilenameAssign(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80);
}

function CreateAssignmentModal({ courseId, courseTitle, user, onClose }) {
  const [form, setForm] = useState({
    title: "", description: "", type: "assignment", due_date: "", max_score: 100
  });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXT_ASSIGN.includes(ext)) {
        toast.error(`Format .${ext} tidak diizinkan: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_ASSIGN) {
        toast.error(`File terlalu besar (max 50 MB): ${file.name}`);
        continue;
      }
      valid.push(file);
    }
    setPendingFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadAllFiles = async () => {
    const uploaded = [];
    for (const file of pendingFiles) {
      const timestamp = Date.now();
      const safeName = sanitizeFilenameAssign(file.name);
      const path = `assignment-attachments/${courseId}/${timestamp}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("submissions")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);
      uploaded.push({
        url: urlData.publicUrl,
        path,
        name: file.name,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      });
    }
    return uploaded;
  };

  const create = useMutation({
    mutationFn: async (data) => {
      let attachments = [];
      if (pendingFiles.length > 0) {
        setUploading(true);
        try {
          attachments = await uploadAllFiles();
        } finally {
          setUploading(false);
        }
      }
      // @ts-ignore
      return entities.Assignment.create({
        ...data,
        attachments,
        course_id: courseId,
        course_title: courseTitle,
        teacher_id: user.email,
        published: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments", courseId] });
      toast.success("Berhasil ditambahkan!");
      onClose();
    },
    onError: (err) => {
      console.error("CREATE ERROR:", err);
      toast.error("Gagal menyimpan: " + (err?.message || JSON.stringify(err)));
    },
  });

  const handleSubmit = () => {
    if (form.type === "quiz") {
      navigate(`/courses/${courseId}/quiz/new`);
      onClose();
      return;
    }
    const payload = { ...form };
    if (!payload.due_date || payload.due_date === "" || payload.due_date === null) delete payload.due_date;
    if (payload.type === "material") delete payload.max_score;
    // @ts-ignore
    create.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold">Tambah Konten</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-editorial mb-2">Jenis Konten</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "assignment", label: "Tugas", desc: "Upload atau ketik jawaban", icon: ClipboardList },
                { key: "quiz", label: "Kuis", desc: "Soal pilihan ganda", icon: Zap },
                { key: "material", label: "Materi", desc: "Bahan bacaan / link", icon: FileText },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setForm({...form, type: t.key})}
                  className={`p-3 text-left border transition-all ${
                    form.type === t.key ? "border-vibrant-blue bg-vibrant-blue/5" : "border-border hover:border-navy/30"
                  }`}
                >
                  <t.icon className={`w-4 h-4 mb-1.5 ${form.type === t.key ? "text-vibrant-blue" : "text-medium-gray"}`} />
                  <p className="text-xs font-semibold text-foreground">{t.label}</p>
                  <p className="text-xs text-medium-gray font-editorial mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {form.type === "quiz" ? (
            <div className="bg-vibrant-blue/5 border border-vibrant-blue/20 p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-vibrant-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Buka Quiz Builder</p>
                <p className="text-xs text-medium-gray font-editorial mt-1">Kamu akan diarahkan ke halaman pembuat kuis dengan editor soal lengkap, mirip Quizizz.</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-editorial mb-2">Judul *</label>
                <input className="noomo-input w-full" placeholder="Judul konten" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-editorial mb-2">Deskripsi / Instruksi</label>
                <textarea className="noomo-input w-full min-h-[80px] resize-none h-auto pb-2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              {form.type !== "material" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-editorial mb-2">Batas Waktu</label>
                    <input type="datetime-local" className="noomo-input w-full" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-editorial mb-2">Nilai Maks</label>
                    <input type="number" className="noomo-input w-full" value={form.max_score} onChange={e => setForm({...form, max_score: Number(e.target.value)})} />
                  </div>
                </div>
              )}

              {/* File attachment section */}
              <div>
                <label className="block text-xs font-editorial mb-2">Lampiran (opsional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFilePick}
                  className="hidden"
                  id="assignment-file-input"
                  accept={ALLOWED_EXT_ASSIGN.map(e => "." + e).join(",")}
                />
                <label
                  htmlFor="assignment-file-input"
                  className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-border hover:border-vibrant-blue hover:bg-vibrant-blue/5 cursor-pointer transition-colors rounded"
                >
                  <Paperclip className="w-4 h-4 text-medium-gray" />
                  <span className="text-sm text-medium-gray font-editorial">
                    Pilih file (PDF, ZIP, gambar, dll · max 50 MB per file)
                  </span>
                </label>

                {pendingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm text-emerald-800 truncate">{f.name}</span>
                          <span className="text-xs text-emerald-600 flex-shrink-0">({formatBytesAssign(f.size)})</span>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="ml-2 p-1 hover:bg-emerald-100 rounded text-emerald-700"
                          title="Hapus"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-border">
          <NoomoButton variant="secondary" onClick={onClose} className="flex-1">Batal</NoomoButton>
          <NoomoButton
            onClick={handleSubmit}
            disabled={(form.type !== "quiz" && !form.title) || create.isPending || uploading}
            className="flex-1"
          >
            {form.type === "quiz" ? "Buka Quiz Builder →" : uploading ? "Mengupload..." : create.isPending ? "Menyimpan..." : "Simpan"}
          </NoomoButton>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { courseId } = useParams();
  // @ts-ignore
  const { user } = useOutletContext();
  const role = user?.role || "student";
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Kode kelas disalin!");
  };
  const [showCreate, setShowCreate] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const qc = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => entities.Course.filter({ id: courseId }).then(r => r[0]),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => entities.Assignment.filter({ course_id: courseId }),
  });

  const postAnnouncement = useMutation({
    mutationFn: () => entities.Course.update(courseId, { announcement }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", courseId] });
      setAnnouncement("");
      toast.success("Pengumuman diposting!");
    },
  });

  const deleteCourse = useMutation({
    mutationFn: () => entities.Course.delete(courseId),
    onSuccess: () => {
      toast.success("Kelas berhasil dihapus");
      navigate("/courses");
    },
    onError: (err) => {
      toast.error("Gagal menghapus kelas: " + (err?.message || "unknown error"));
    },
  });

  const handleDeleteCourse = () => {
    if (window.confirm(`Yakin mau hapus kelas "${course?.title}"? Semua tugas, materi, dan nilai di kelas ini akan ikut terhapus dan TIDAK BISA dikembalikan.`)) {
      deleteCourse.mutate();
    }
  };

  if (!course) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const coverColor = course.cover_color || "#181520";

  return (
    <div className="animate-fade-in">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-medium-gray hover:text-vibrant-blue mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
      </Link>

      {/* Course Header */}
      <div className="relative h-40 lg:h-52 mb-6 flex items-end p-6 lg:p-8" style={{ background: coverColor }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        <div className="relative z-10">
          {course.subject && <NoomoBadge variant="ghost" className="mb-2">{course.subject}</NoomoBadge>}
          <h2 className="text-white text-2xl lg:text-3xl font-display font-bold leading-tight">{course.title}</h2>
          <p className="text-white/70 text-sm font-editorial mt-1">{course.teacher_name}</p>
        </div>
        {/* Action buttons - responsive stack di mobile */}
        <div className="absolute top-3 right-3 left-3 z-10 flex items-center justify-between gap-2 sm:left-auto sm:top-4 sm:right-4">
          {(role === "teacher" || role === "admin") ? (
            <button
              onClick={handleDeleteCourse}
              disabled={deleteCourse.isPending}
              className="bg-red-500/80 backdrop-blur-sm border border-red-300/30 px-2.5 py-1.5 sm:px-3 sm:py-2 text-white text-xs font-editorial flex items-center gap-1.5 sm:gap-2 hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex-shrink-0"
              title="Hapus kelas"
            >
              <Trash2 className="w-3 h-3 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">{deleteCourse.isPending ? "Menghapus..." : "Hapus"}</span>
            </button>
          ) : <div />}
          {course.class_code && (
            <button
              onClick={() => copyCode(course.class_code)}
              className="bg-black/50 backdrop-blur-sm border border-white/20 px-2.5 py-1.5 sm:px-3 sm:py-2 text-white text-xs font-editorial flex items-center gap-1.5 sm:gap-2 hover:bg-black/70 transition-all rounded flex-shrink-0"
            >
              <Users className="w-3 h-3 flex-shrink-0" />
              <span className="font-bold tracking-widest">{course.class_code}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <Copy className="w-3 h-3 text-white/60 flex-shrink-0" />}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Announcement */}
          {course.announcement && (
            <NoomoCard className="p-5 bg-navy text-white">
              <div className="flex gap-3">
                <Megaphone className="w-5 h-5 text-lavender flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-lavender/60 font-editorial mb-1">Pengumuman dari {course.teacher_name}</p>
                  <p className="text-sm text-white/90">{course.announcement}</p>
                </div>
              </div>
            </NoomoCard>
          )}

          {/* Post announcement (teacher) */}
          {(role === "teacher" || role === "admin") && (
            <NoomoCard className="p-4">
              <textarea
                className="w-full text-sm text-foreground bg-transparent outline-none resize-none min-h-[60px] placeholder:text-medium-gray font-editorial"
                placeholder="Tulis pengumuman untuk muridmu..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
              />
              {announcement && (
                <div className="flex justify-end mt-2">
                  <NoomoButton onClick={() => postAnnouncement.mutate()} disabled={postAnnouncement.isPending} className="">
                    Posting
                  </NoomoButton>
                </div>
              )}
            </NoomoCard>
          )}

          {/* Assignments */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Konten Kelas</h3>
            {(role === "teacher" || role === "admin") && (
              <NoomoButton onClick={() => setShowCreate(true)} className="">
                <Plus className="w-4 h-4" /> Tambah
              </NoomoButton>
            )}
          </div>

          {assignments.length === 0 ? (
            <NoomoCard className="p-12 text-center">
              <BookOpen className="w-10 h-10 text-lavender mx-auto mb-3" />
              <p className="text-medium-gray text-sm font-editorial">Belum ada konten di kelas ini</p>
            </NoomoCard>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => (
                <AssignmentItem key={a.id} item={a} role={role} courseId={courseId} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Class Code Card - prominent for teacher */}
          {(role === "teacher" || role === "admin") && course.class_code && (
            <NoomoCard className="p-5 bg-navy text-white">
              <p className="text-xs text-white/50 font-editorial uppercase tracking-widest mb-3">Kode Kelas</p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-display font-bold tracking-[0.2em] text-white">{course.class_code}</span>
                <button
                  onClick={() => copyCode(course.class_code)}
                  className="flex items-center gap-1.5 text-xs text-lavender/70 hover:text-white transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
              <p className="text-xs text-white/40 font-editorial mt-3">Bagikan kode ini ke murid agar mereka bisa bergabung</p>
            </NoomoCard>
          )}

          <NoomoCard className="p-5 space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Info Kelas</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-medium-gray font-editorial">Guru</span>
                <span className="font-semibold text-foreground">{course.teacher_name}</span>
              </div>
              {course.subject && (
                <div className="flex justify-between">
                  <span className="text-medium-gray font-editorial">Mata Pelajaran</span>
                  <span className="font-semibold">{course.subject}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-medium-gray font-editorial">Murid</span>
                <span className="font-semibold">{course.students?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-medium-gray font-editorial">Konten</span>
                <span className="font-semibold">{assignments.length}</span>
              </div>
            </div>
          </NoomoCard>
          {course.description && (
            <NoomoCard className="p-5">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Deskripsi</h4>
              <p className="text-sm text-medium-gray font-editorial leading-relaxed">{course.description}</p>
            </NoomoCard>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateAssignmentModal
          courseId={courseId}
          courseTitle={course.title}
          user={user}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}