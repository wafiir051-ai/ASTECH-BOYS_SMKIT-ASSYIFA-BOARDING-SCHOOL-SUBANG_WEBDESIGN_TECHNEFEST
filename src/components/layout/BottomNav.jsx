import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, BookOpen, ClipboardList, BarChart2, Gamepad2, Settings } from "lucide-react";

const navItems = {
  teacher: [
    { icon: LayoutGrid,    label: "Dashboard", path: "/" },
    { icon: BookOpen,      label: "Kelas",     path: "/courses" },
    { icon: ClipboardList, label: "Tugas",     path: "/assignments" },
    { icon: BarChart2,     label: "Nilai",     path: "/grades" },
    { icon: Gamepad2,      label: "Arcade",    path: "/arcade" },
    { icon: Settings,      label: "Pengaturan", path: "/settings" },
  ],
  student: [
    { icon: LayoutGrid,    label: "Dashboard", path: "/" },
    { icon: BookOpen,      label: "Kelas",     path: "/courses" },
    { icon: ClipboardList, label: "Tugas",     path: "/my-assignments" },
    { icon: BarChart2,     label: "Nilai",     path: "/my-grades" },
    { icon: Gamepad2,      label: "Arcade",    path: "/arcade" },
    { icon: Settings,      label: "Pengaturan", path: "/settings" },
  ],
  admin: [
    { icon: LayoutGrid, label: "Dashboard", path: "/" },
    { icon: BookOpen,   label: "Kelas",     path: "/courses" },
    { icon: BarChart2,  label: "Laporan",   path: "/reports" },
    { icon: Gamepad2,   label: "Arcade",    path: "/arcade" },
    { icon: Settings,   label: "Pengaturan", path: "/settings" },
  ],
};

export default function BottomNav({ user }) {
  const location = useLocation();
  const role = user?.role || "student";
  const items = navItems[role] || navItems.student;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(4,15,10,0.96)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(52,211,153,0.12)",
      display: "flex", alignItems: "stretch",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
    }}>
      {items.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <Link key={path} to={path} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 4, padding: "10px 4px 8px",
            textDecoration: "none",
            color: isActive ? "#34d399" : "rgba(255,255,255,0.4)",
            position: "relative",
            transition: "color 0.2s",
          }}>
            {isActive && (
              <div style={{
                position: "absolute", top: 0, left: "25%", right: "25%",
                height: 2, background: "#34d399", borderRadius: "0 0 3px 3px",
              }} />
            )}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isActive ? "rgba(52,211,153,0.12)" : "transparent",
              transition: "background 0.2s",
            }}>
              <Icon size={18} />
            </div>
            <span style={{
              fontSize: 9, fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.3px", fontFamily: "Inter, sans-serif",
              lineHeight: 1,
            }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
