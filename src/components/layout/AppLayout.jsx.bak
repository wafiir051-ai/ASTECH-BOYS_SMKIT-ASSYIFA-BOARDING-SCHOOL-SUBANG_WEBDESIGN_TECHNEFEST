import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import AnimatedBackground3D from "./AnimatedBackground3D";

const pageTitles = {
  "/": "Dashboard",
  "/courses": "Kelas",
  "/assignments": "Tugas & Kuis",
  "/grades": "Penilaian",
  "/users": "Manajemen Pengguna",
  "/reports": "Laporan",
  "/my-assignments": "Tugas Saya",
  "/my-grades": "Nilai Saya",
  "/settings": "Pengaturan",
  "/arcade": "Arcade",
};

export default function AppLayout({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "EduSpace";
  console.log("isMobile:", isMobile, "width:", window.innerWidth);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", background: "#edf2ef", display: "flex", position: "relative" }}>
      <AnimatedBackground3D />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "rgba(237,242,239,0.72)" }} />

      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .app-main-wrap { margin-left: 256px; }
        .app-bottom-nav { display: none !important; }
        @media (max-width: 1023px) {
          .app-main-wrap { margin-left: 0 !important; }
          .app-bottom-nav { display: block !important; }
        }
      `}</style>

      <Sidebar user={user} isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />

      <div className="app-main-wrap" style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        transition: "margin-left 0.3s ease",
        position: "relative",
        zIndex: 1,
        minWidth: 0,
      }}>
        <TopBar
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          isMobile={isMobile}
        />

        <main
          key={location.pathname}
          style={{
            flex: 1,
            padding: isMobile ? "16px 12px" : "28px 32px",
            paddingBottom: isMobile ? "100px" : "28px",
            width: "100%",
            maxWidth: isMobile ? "100%" : 1200,
            margin: "0 auto",
            boxSizing: "border-box",
            animation: "pageEnter 0.4s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          <Outlet context={{ user, isMobile }} />
        </main>
      </div>

      <div className="app-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <BottomNav user={user} />
      </div>
    </div>
  );
}
