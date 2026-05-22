import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { GraduationCap, BookOpen } from "lucide-react";

export default function ChooseRole() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedRole = sessionStorage.getItem("pending_role");
    if (savedRole === "student" || savedRole === "teacher") {
      setRole(savedRole);
    }

    const checkExisting = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase
          .from("User")
          .select("role")
          .eq("email", session.user.email)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("ChooseRole: DB error:", error);
          return;
        }

        if (data?.role) {
          sessionStorage.removeItem("pending_role");
          sessionStorage.removeItem("pending_name");
          window.location.href = "/";
        }
      } catch (err) {
        console.error("ChooseRole: Unexpected error:", err);
      }
    };

    checkExisting();
  }, []);

  const handleContinue = async () => {
    if (!role) return;
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak valid. Silakan login ulang.");

      const user = session.user;
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email;

      // ✅ FIX: Insert dengan auth_id agar trigger & policy berfungsi
      const { error: insertError } = await supabase
        .from("User")
        .insert({
          email: user.email,
          full_name: fullName,
          role,
          auth_id: user.id,   // ← ini yang hilang sebelumnya
        });

      if (insertError) {
        if (insertError.code === "23505") {
          // User sudah ada — update auth_id kalau masih NULL
          await supabase
            .from("User")
            .update({ auth_id: user.id })
            .eq("email", user.email)
            .is("auth_id", null);
        } else {
          throw insertError;
        }
      }

      sessionStorage.removeItem("pending_role");
      sessionStorage.removeItem("pending_name");
      window.location.href = "/";
    } catch (err) {
      console.error("ChooseRole: Error:", err);
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-vibrant-blue flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-display text-xl font-bold">EduSpace</span>
        </div>

        <p className="text-lavender/60 text-xs font-editorial uppercase tracking-widest mb-3">Satu langkah lagi</p>
        <h2 className="text-white text-3xl font-display font-bold tracking-tight mb-3">Kamu siapa?</h2>
        <p className="text-white/40 text-sm font-editorial mb-10">
          Pilih peran kamu di EduSpace. Ini tidak bisa diubah nanti.
        </p>

        <div className="space-y-4 mb-10">
          <button
            onClick={() => setRole("student")}
            className={`w-full p-5 border text-left transition-all flex items-center gap-4 ${
              role === "student"
                ? "border-vibrant-blue bg-vibrant-blue/10"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
              role === "student" ? "bg-vibrant-blue" : "bg-white/10"
            }`}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Murid</p>
              <p className="text-white/40 text-xs font-editorial mt-0.5">Ikuti kelas, kerjakan tugas, lihat nilai</p>
            </div>
            {role === "student" && (
              <div className="ml-auto w-4 h-4 rounded-full bg-vibrant-blue flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => setRole("teacher")}
            className={`w-full p-5 border text-left transition-all flex items-center gap-4 ${
              role === "teacher"
                ? "border-vibrant-blue bg-vibrant-blue/10"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
              role === "teacher" ? "bg-vibrant-blue" : "bg-white/10"
            }`}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Guru</p>
              <p className="text-white/40 text-xs font-editorial mt-0.5">Buat kelas, beri tugas, nilai murid</p>
            </div>
            {role === "teacher" && (
              <div className="ml-auto w-4 h-4 rounded-full bg-vibrant-blue flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm font-editorial mb-4">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={!role || loading}
          className="w-full h-11 bg-white text-navy text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "Menyimpan..." : "Masuk ke Dashboard"}
        </button>
      </div>
    </div>
  );
}