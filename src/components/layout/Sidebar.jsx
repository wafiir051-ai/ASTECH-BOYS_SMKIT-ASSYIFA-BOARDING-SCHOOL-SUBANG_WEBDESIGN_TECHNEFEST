import logo from "../../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, BookOpen, ClipboardList, Users, BarChart2, Settings, LogOut, X, Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navItems = {
  admin: [
    { icon: LayoutGrid, label: "Dashboard", path: "/" },
    { icon: BookOpen,   label: "Semua Kelas", path: "/courses" },
    { icon: Users,      label: "Pengguna", path: "/users" },
    { icon: BarChart2,  label: "Laporan", path: "/reports" },
    { icon: Gamepad2,   label: "Arcade", path: "/arcade" },
  ],
  teacher: [
    { icon: LayoutGrid,    label: "Dashboard", path: "/" },
    { icon: BookOpen,      label: "Kelas Saya", path: "/courses" },
    { icon: ClipboardList, label: "Tugas & Kuis", path: "/assignments" },
    { icon: BarChart2,     label: "Nilai", path: "/grades" },
    { icon: Gamepad2,      label: "Arcade", path: "/arcade" },
  ],
  student: [
    { icon: LayoutGrid,    label: "Dashboard", path: "/" },
    { icon: BookOpen,      label: "Kelas Saya", path: "/courses" },
    { icon: ClipboardList, label: "Tugas Saya", path: "/my-assignments" },
    { icon: BarChart2,     label: "Nilai Saya", path: "/my-grades" },
    { icon: Gamepad2,      label: "Arcade", path: "/arcade" },
  ],
};

export default function Sidebar({ user, isOpen, isMobile, onClose }) {
  const location = useLocation();
  const { logout } = useAuth();
  const role = user?.role || "student";
  const items = navItems[role] || navItems.student;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // Di mobile: hanya tampil kalau isOpen. Di desktop: selalu tampil.
  const translateX = (!isMobile || isOpen) ? "translateX(0)" : "translateX(-100%)";

  return (
    <>
      {/* Backdrop mobile */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside style={{
        position: "fixed", top: 0, left: 0,
        height: "100%", width: 256, zIndex: 40,
        display: "flex", flexDirection: "column",
        background: "linear-gradient(180deg, #040f0a 0%, #061510 60%, #040f0a 100%)",
        borderRight: "1px solid rgba(52,211,153,0.1)",
        transition: "transform 0.3s cubic-bezier(.22,1,.36,1)",
        transform: translateX,
      }}>
        {/* Decorative orb */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(52,211,153,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} onClick={onClose}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(52,211,153,0.4)", flexShrink: 0, background: "#fff" }}>
              <img src={logo} alt="EduSpace" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ color: "#fff", fontSize: 17, fontWeight: 700, letterSpacing: "-0.4px" }}>EduSpace</span>
          </Link>
          {isMobile && (
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "rgba(255,255,255,0.4)", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* User card */}
        <div style={{ padding: "16px 20px", margin: "12px 16px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.1)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.08))", border: "1.5px solid rgba(52,211,153,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : <span style={{ color: "#34d399", fontSize: 15, fontWeight: 700 }}>{user?.full_name?.charAt(0)?.toUpperCase() || "U"}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name || "User"}</p>
              <p style={{ color: "rgba(52,211,153,0.6)", fontSize: 10, margin: "2px 0 0", textTransform: "capitalize", letterSpacing: "0.8px" }}>{role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto" }}>
          <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 10 }}>Menu</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13, fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#34d399" : "rgba(255,255,255,0.72)",
                      background: isActive ? "rgba(52,211,153,0.1)" : "transparent",
                      borderLeft: isActive ? "2px solid #34d399" : "2px solid transparent",
                      transition: "all 0.18s",
                    }}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                    {isActive && <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(52,211,153,0.08)" }}>
          <Link to="/settings" onClick={onClose}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, color: "rgba(255,255,255,0.6)", transition: "all 0.15s" }}>
            <Settings size={15} /><span>Pengaturan</span>
          </Link>
          <button onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.6)", borderRadius: 8, transition: "all 0.15s", fontFamily: "Inter, sans-serif" }}>
            <LogOut size={15} /><span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
