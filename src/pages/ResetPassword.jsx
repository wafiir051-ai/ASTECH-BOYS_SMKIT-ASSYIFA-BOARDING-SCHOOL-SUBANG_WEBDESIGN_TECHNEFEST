import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { GraduationCap } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase otomatis handle token dari URL hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User sudah terautentikasi, siap reset password
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Password tidak cocok."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch {
      setError("Link reset tidak valid atau kadaluarsa.");
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

        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-display font-bold mb-3">Password Diperbarui!</h2>
            <p className="text-white/50 text-sm font-editorial">Mengalihkan ke halaman masuk...</p>
          </div>
        ) : (
          <>
            <p className="text-lavender/60 text-xs font-editorial uppercase tracking-widest mb-3">Buat password baru</p>
            <h2 className="text-white text-3xl font-display font-bold tracking-tight mb-10">Reset Password</h2>
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block text-xs font-editorial text-lavender/60 mb-2">Password Baru</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 focus:border-b-2 focus:border-vibrant-blue outline-none text-white text-base font-editorial pb-3 h-12 placeholder:text-white/20 transition-all"
                  placeholder="Min. 6 karakter"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-editorial text-lavender/60 mb-2">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 focus:border-b-2 focus:border-vibrant-blue outline-none text-white text-base font-editorial pb-3 h-12 placeholder:text-white/20 transition-all"
                  placeholder="Ulangi password baru"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm font-editorial">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-white text-navy text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
