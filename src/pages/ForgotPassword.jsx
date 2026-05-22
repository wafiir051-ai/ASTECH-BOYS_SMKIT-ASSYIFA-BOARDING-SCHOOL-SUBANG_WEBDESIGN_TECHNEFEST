import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password"
      });
    } catch { /* intentional */ }
    setSent(true);
    setLoading(false);
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

        {!sent ? (
          <>
            <p className="text-lavender/60 text-xs font-editorial uppercase tracking-widest mb-3">Pemulihan akun</p>
            <h2 className="text-white text-3xl font-display font-bold tracking-tight mb-4">Lupa Password?</h2>
            <p className="text-white/50 text-sm font-editorial mb-10">
              Masukkan email kamu dan kami akan mengirimkan link untuk reset password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block text-xs font-editorial text-lavender/60 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 focus:border-b-2 focus:border-vibrant-blue outline-none text-white text-base font-editorial pb-3 h-12 placeholder:text-white/20 transition-all"
                  placeholder="email@kamu.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-white text-navy text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-display font-bold mb-3">Email Terkirim!</h2>
            <p className="text-white/50 text-sm font-editorial">Periksa inbox email kamu dan ikuti instruksi untuk reset password.</p>
          </div>
        )}

        <Link to="/login" className="flex items-center gap-2 text-white/40 text-sm font-editorial mt-8 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  );
}
