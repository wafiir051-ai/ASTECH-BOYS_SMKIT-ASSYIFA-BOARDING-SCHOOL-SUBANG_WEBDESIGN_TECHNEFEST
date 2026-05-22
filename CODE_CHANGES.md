# Code Changes Summary - Google OAuth Fix

## File 1: src/pages/Login.jsx

### Change 1: Improved handleGoogle() function

**Location**: Around line 165-180

**Before:**
```javascript
const handleGoogle = async () => {
  setError("");
  sessionStorage.setItem("pending_role", "");
  sessionStorage.removeItem("pending_role");
  const { error: err } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/" },
  });
  if (err) setError(err.message);
};
```

**After:**
```javascript
const handleGoogle = async () => {
  try {
    setError("");
    // Pastikan pending_role kosong - user login, bukan register
    sessionStorage.removeItem("pending_role");
    
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: `${window.location.origin}/login?oauth_callback=true`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });
    if (err) {
      console.error("Google OAuth Error:", err);
      setError(err.message || "Gagal login dengan Google. Coba lagi.");
    }
  } catch (e) {
    console.error("Google login exception:", e);
    setError("Terjadi kesalahan. Coba refresh halaman dan ulangi.");
  }
};
```

**Why Changed:**
- ✅ Added try-catch for proper error handling
- ✅ Removed redundant setItem + removeItem
- ✅ Changed redirect to `/login?oauth_callback=true` for proper callback handling
- ✅ Added Google OAuth params (access_type, prompt)
- ✅ Better error messages for user
- ✅ Console logging untuk debugging

---

## File 2: src/pages/Register.jsx

### Change 1: Improved handleGoogle() function

**Location**: Around line 55-70

**Before:**
```javascript
const handleGoogle = async () => {
  if (!role) return;
  sessionStorage.setItem("pending_role", role);
  localStorage.removeItem("oauth_source");
  sessionStorage.setItem("pending_name", "");
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/choose-role",
    }
  });
};
```

**After:**
```javascript
const handleGoogle = async () => {
  if (!role) return;
  try {
    setError("");
    setLoading(true);
    sessionStorage.setItem("pending_role", role);
    localStorage.removeItem("oauth_source");
    
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/choose-role`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (err) {
      console.error("Google OAuth Error:", err);
      setError(err.message || "Gagal daftar dengan Google. Coba lagi.");
      setLoading(false);
    }
  } catch (e) {
    console.error("Google register exception:", e);
    setError("Terjadi kesalahan. Coba lagi.");
    setLoading(false);
  }
};
```

**Why Changed:**
- ✅ Added try-catch wrapper
- ✅ Added loading state management
- ✅ Removed bug: `sessionStorage.setItem("pending_name", "")`
- ✅ Added Google OAuth params consistency
- ✅ Better error handling dan display
- ✅ Console logging untuk debugging

---

## File 3: src/lib/AuthContext.jsx

### Change 1: Enhanced loadUserProfile() logging

**Location**: Around line 20-70

**Before:**
```javascript
const loadUserProfile = async (authUser, event = null) => {
  if (!authUser?.email) return;
  
  try {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      // User sudah ada, langsung masuk
      setUser(data);
      setIsAuthenticated(true);
      setAuthError(null);
      if (window.location.pathname === '/login' || 
          window.location.pathname === '/register' ||
          window.location.pathname === '/choose-role') {
        window.location.href = '/';
      }
```

**After:**
```javascript
const loadUserProfile = async (authUser, event = null) => {
  if (!authUser?.email) {
    console.warn("loadUserProfile: authUser atau email kosong", authUser);
    return;
  }
  
  try {
    console.log("loadUserProfile: mencari user", { email: authUser.email, event });
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      console.log("loadUserProfile: user ditemukan, login berhasil", { email: authUser.email });
      // User sudah ada, langsung masuk
      setUser(data);
      setIsAuthenticated(true);
      setAuthError(null);
      if (window.location.pathname === '/login' || 
          window.location.pathname === '/register' ||
          window.location.pathname === '/choose-role') {
        window.location.href = '/';
      }
```

### Change 2: Enhanced unregistered user handling

**Location**: Around line 45-75

**Before:**
```javascript
} else {
  // User belum terdaftar di tabel User
  const fromRegister = !!sessionStorage.getItem("pending_role");
  // Kalau tidak ada pending_role dan event SIGNED_IN = dari Login page (bukan Register)
  const isOAuthEvent = event === "SIGNED_IN";
  const fromLoginPage = isOAuthEvent && !fromRegister;
  const onAuthPage = ["/login", "/register", "/choose-role"].includes(window.location.pathname);

  if (isHandlingUnregistered.current) return;
  isHandlingUnregistered.current = true;
  setTimeout(() => { isHandlingUnregistered.current = false; }, 3000);
  if ((fromRegister && !fromLoginPage) || window.location.pathname === "/choose-role") {
    // Dari Register → boleh pilih role
    sessionStorage.setItem("pending_auth_user", JSON.stringify({
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.email,
    }));
    setIsLoadingAuth(false);
    setAuthChecked(true);
    if (window.location.pathname !== "/choose-role") {
      window.location.href = "/choose-role";
    }
  } else {
    // Dari Login atau akses langsung → tolak, suruh daftar dulu
    setIsLoadingAuth(false);
    setAuthChecked(true);
    setIsAuthenticated(false);
    setUser(null);
    await supabase.auth.signOut();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login?error=not_registered";
    }
  }
  return;
}
```

**After:**
```javascript
} else {
  // User belum terdaftar di tabel User
  console.log("loadUserProfile: user belum terdaftar", { email: authUser.email, event });
  const fromRegister = !!sessionStorage.getItem("pending_role");
  const isOAuthEvent = event === "SIGNED_IN";
  const fromLoginPage = isOAuthEvent && !fromRegister;

  if (isHandlingUnregistered.current) {
    console.log("loadUserProfile: sedang handle unregistered, skip");
    return;
  }
  isHandlingUnregistered.current = true;
  setTimeout(() => { isHandlingUnregistered.current = false; }, 3000);
  
  if ((fromRegister && !fromLoginPage) || window.location.pathname === "/choose-role") {
    console.log("loadUserProfile: user dari register, arahkan ke choose-role");
    // Dari Register → boleh pilih role
    sessionStorage.setItem("pending_auth_user", JSON.stringify({
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.email,
    }));
    setIsLoadingAuth(false);
    setAuthChecked(true);
    if (window.location.pathname !== "/choose-role") {
      window.location.href = "/choose-role";
    }
  } else {
    console.log("loadUserProfile: user dari login, tolak - redirect ke login with error");
    // Dari Login atau akses langsung → tolak, suruh daftar dulu
    setIsLoadingAuth(false);
    setAuthChecked(true);
    setIsAuthenticated(false);
    setUser(null);
    await supabase.auth.signOut();
    
    // Redirect dengan error parameter
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      window.location.href = "/login?error=not_registered";
    }
  }
  return;
}
```

**Why Changed:**
- ✅ Added detailed logging untuk trace flow
- ✅ Removed unused `onAuthPage` variable
- ✅ Added debug logs untuk each branch
- ✅ Better readability dengan comments
- ✅ Proper variable scoping

---

## File 4: src/api/supabaseClient.js

### Change 1: Added environment validation

**Location**: At the top of file

**Before:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**After:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that required environment variables are set
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('VITE_SUPABASE_URL is not configured. Check your .env file.');
}

if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('VITE_SUPABASE_ANON_KEY is not configured. Check your .env file.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Why Changed:**
- ✅ Validate env variables presence
- ✅ Throw helpful errors if missing
- ✅ Console log untuk verification
- ✅ Catch configuration issues early

---

## File 5: src/pages/ChooseRole.jsx

### Change 1: Enhanced logging in useEffect

**Location**: Around line 8-30

**Before:**
```javascript
useEffect(() => {
  sessionStorage.removeItem("pending_role");
  sessionStorage.removeItem("pending_name");

  const checkExisting = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("User")
      .select("role")
      .eq("email", session.user.email)
      .single();
    if (data?.role) {
      window.location.href = "/";
    }
  };
  checkExisting();
}, []);
```

**After:**
```javascript
useEffect(() => {
  sessionStorage.removeItem("pending_role");
  sessionStorage.removeItem("pending_name");

  const checkExisting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("ChooseRole: No session found, user might not be authenticated");
        return;
      }
      
      console.log("ChooseRole: Checking if user already has role:", { email: session.user.email });
      const { data, error } = await supabase
        .from("User")
        .select("role")
        .eq("email", session.user.email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("ChooseRole: Error checking existing role:", error);
        return;
      }
      
      if (data?.role) {
        console.log("ChooseRole: User already has role, redirecting to dashboard:", { role: data.role });
        window.location.href = "/";
      }
    } catch (err) {
      console.error("ChooseRole: Unexpected error:", err);
    }
  };
  checkExisting();
}, []);
```

### Change 2: Enhanced logging in handleContinue

**Location**: Around line 32-60

**Before:**
```javascript
const handleContinue = async () => {
  if (!role) return;
  setLoading(true);
  setError("");
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sesi tidak valid. Silakan login ulang.");

    const user = session.user;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";

    const { error: insertError } = await supabase
      .from("User")
      .insert({
        email: user.email,
        full_name: fullName,
        role,
      });
    if (insertError) throw insertError;

    sessionStorage.removeItem("pending_role");
    sessionStorage.removeItem("pending_name");
    window.location.href = "/";
  } catch (err) {
    setError(err.message || "Terjadi kesalahan. Coba lagi.");
  } finally {
    setLoading(false);
  }
};
```

**After:**
```javascript
const handleContinue = async () => {
  if (!role) return;
  setLoading(true);
  setError("");
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("ChooseRole: No session found");
      throw new Error("Sesi tidak valid. Silakan login ulang.");
    }

    const user = session.user;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";

    console.log("ChooseRole: Creating user record:", { email: user.email, role, fullName });

    const { error: insertError } = await supabase
      .from("User")
      .insert({
        email: user.email,
        full_name: fullName,
        role,
      });
    
    if (insertError) {
      console.error("ChooseRole: Insert error:", insertError);
      throw insertError;
    }

    console.log("ChooseRole: User created successfully, redirecting to dashboard");
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
```

**Why Changed:**
- ✅ Added try-catch wrapper
- ✅ Added detailed logging untuk each step
- ✅ Better error messages
- ✅ Proper error code handling

---

## Summary of Changes

| File | Type | Changes |
|------|------|---------|
| Login.jsx | Function | 1 major: handleGoogle() |
| Register.jsx | Function | 1 major: handleGoogle() |
| AuthContext.jsx | Functions | 2 major: loadUserProfile() with logging |
| supabaseClient.js | Initialization | 1 major: env validation |
| ChooseRole.jsx | Functions | 2 major: enhanced logging |

**Total Changes: 7 improvements across 5 files**

All changes maintain backward compatibility and follow existing code style.
