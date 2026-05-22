import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  const isHandlingAuth = useRef(false);

  const loadUserProfile = async (authUser, event = null) => {
    if (!authUser?.email) {
      console.warn("loadUserProfile: authUser atau email kosong", authUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    // Cegah eksekusi ganda saat event auth beruntun
    if (isHandlingAuth.current) {
      console.log("loadUserProfile: sedang diproses, skip duplikat");
      return;
    }
    isHandlingAuth.current = true;

    try {
      console.log("loadUserProfile: mencari user", { email: authUser.email, event });

      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // User ditemukan di DB → login berhasil
        console.log("loadUserProfile: user ditemukan, login berhasil");
        setUser(data);
        setIsAuthenticated(true);
        setAuthError(null);

        // Redirect ke dashboard dari halaman auth manapun
        const authPaths = ['/login', '/register'];
        if (authPaths.includes(window.location.pathname)) {
          console.log("loadUserProfile: redirect ke dashboard");
          window.location.href = '/';
        }
      } else {
        // User belum ada di tabel User
        console.log("loadUserProfile: user belum terdaftar di DB", { email: authUser.email, event });

        // Deteksi: apakah ini dari alur Register (OAuth) atau Login?
        // pending_role di-set oleh Register.jsx sebelum OAuth redirect
        // dan TIDAK dihapus oleh ChooseRole.jsx sampai insert berhasil
        const pendingRole = sessionStorage.getItem("pending_role");
        const isFromRegister = !!pendingRole;
        const currentPath = window.location.pathname;

        console.log("loadUserProfile: flow detection", {
          isFromRegister,
          pendingRole,
          currentPath,
          event,
        });

        const isPendingInsert = !!sessionStorage.getItem("pending_insert");
        if (isPendingInsert) {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        } else if (isFromRegister) {
          setIsLoadingAuth(false);
          setAuthChecked(true);

          // Insert user ke DB pakai pending_role
          const pendingName = sessionStorage.getItem("pending_name") || authUser.user_metadata?.full_name || authUser.email;
          const { error: insertErr } = await supabase
            .from("User")
            .insert({ email: authUser.email, full_name: pendingName, role: pendingRole, auth_id: authUser.id });
          sessionStorage.removeItem("pending_role");
          sessionStorage.removeItem("pending_name");
          window.location.href = "/";
        } else {
          // Alur login tapi email belum terdaftar → tolak & suruh daftar
          console.log("loadUserProfile: alur login, email belum terdaftar → tolak");
          setIsAuthenticated(false);
          setUser(null);
          setAuthError(null);
          await supabase.auth.signOut();

          if (currentPath !== "/login") {
            window.location.href = "/login?error=not_registered";
          }
        }
        return;
      }
    } catch (err) {
      console.error("Auth Profile Error:", err);
      setAuthError({ type: 'load_error', message: err.message || "Gagal memuat profil pengguna" });
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
      // Beri jeda kecil sebelum izinkan pemrosesan berikutnya
      setTimeout(() => { isHandlingAuth.current = false; }, 1000);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Cek session yang sudah ada saat pertama load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadUserProfile(session.user, 'INITIAL_SESSION');
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    });

    // Dengarkan perubahan status auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log("AuthContext: onAuthStateChange", { event, hasUser: !!session?.user });

      if (event === 'SIGNED_IN' && session?.user) {
        // Hanya proses SIGNED_IN, bukan INITIAL_SESSION (sudah ditangani getSession di atas)
        loadUserProfile(session.user, event);
      } else if (event === 'SIGNED_OUT') {
        console.log("AuthContext: User signed out");
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        isHandlingAuth.current = false;
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refresh: tidak perlu load ulang profil, hanya konfirmasi auth
        setAuthChecked(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setIsLoadingAuth(true);
      sessionStorage.removeItem("pending_role");
      sessionStorage.removeItem("pending_name");
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const checkUserAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const checkAppState = async () => {
    await checkUserAuth();
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings, authChecked, logout,
      navigateToLogin, checkUserAuth, checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};