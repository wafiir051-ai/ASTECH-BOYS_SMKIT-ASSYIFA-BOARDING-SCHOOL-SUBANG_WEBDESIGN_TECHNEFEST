# Google OAuth Setup & Troubleshooting Guide

## Issues Fixed

### 1. **Login Page Google OAuth Improvements**
- ✅ Added proper error handling and logging
- ✅ Corrected OAuth redirect URL to `/login?oauth_callback=true`
- ✅ Added `access_type: 'offline'` dan `prompt: 'consent'` untuk Google OAuth params
- ✅ Improved error messages in UI

### 2. **Register Page Google OAuth Improvements**
- ✅ Fixed error handling
- ✅ Added error state UI display
- ✅ Improved Google OAuth params consistency
- ✅ Better try-catch wrapper

### 3. **AuthContext Improvements**
- ✅ Added detailed logging untuk debugging OAuth flow
- ✅ Better handling untuk unregistered OAuth users
- ✅ Improved console logs untuk trace execution

## Setup Checklist untuk Supabase Google OAuth

### Di Supabase Dashboard:

1. **Go to Authentication > Providers > Google**

2. **Enable Google Provider** (toggle ON)

3. **Input Google OAuth Credentials:**
   - **Client ID**: (dari Google Cloud Console)
   - **Client Secret**: (dari Google Cloud Console)

4. **Add Redirect URLs** di Supabase (Settings > Auth > URL Configuration):
   ```
   http://localhost:5173/login
   http://localhost:5173/choose-role
   https://yourdomain.com/login
   https://yourdomain.com/choose-role
   ```

### Di Google Cloud Console:

1. **Create OAuth 2.0 Client ID** (Type: Web application)

2. **Add Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost
   https://yourdomain.com
   ```

3. **Add Authorized redirect URIs:**
   ```
   http://localhost:5173/login
   http://localhost:5173/choose-role
   https://yourdomain.com/login
   https://yourdomain.com/choose-role
   https://agqkmxdinuluiizckhbs.supabase.co/auth/v1/callback
   ```

## Flow Explanation

### Login Flow:
1. User klik "Login dengan Google"
2. Redirect ke Google OAuth screen
3. Google redirect kembali ke `http://localhost:5173/login?oauth_callback=true`
4. AuthContext `onAuthStateChange` trigger
5. Check apakah user ada di database `User` table
6. Jika ada → login, redirect ke `/`
7. Jika belum → show error "not_registered", redirect ke `/register`

### Register Flow:
1. User pilih role (student/teacher)
2. Klik "Daftar dengan Google"
3. `sessionStorage.setItem("pending_role", role)` disave
4. Redirect ke Google OAuth screen
5. Google redirect ke `http://localhost:5173/choose-role`
6. AuthContext `onAuthStateChange` trigger
7. Check apakah user ada di database
8. Karena `pending_role` ada di sessionStorage → redirect ke `/choose-role`
9. User pilih role, submit → insert ke `User` table
10. Redirect ke `/`

## Common Issues & Solutions

### Issue 1: "DNS_PROBE_FINISHED_NXDOMAIN"
**Cause**: Supabase URL tidak bisa resolve
**Solution**:
- Check internet connection
- Verify `.env` file has correct `VITE_SUPABASE_URL`
- Make sure Supabase project is active

### Issue 2: "This site can't be reached"
**Cause**: Wrong redirect URI configuration
**Solution**:
- Add `http://localhost:5173/login` to Supabase URL configuration
- Add `http://localhost:5173` to Google Cloud authorized origins
- Add `http://localhost:5173/login` to Google Cloud authorized redirect URIs

### Issue 3: "Invalid Client ID" or "Client ID mismatch"
**Cause**: Google OAuth credentials tidak match
**Solution**:
- Double-check Client ID di Supabase matches Google Cloud Console
- Double-check Client Secret di Supabase matches Google Cloud Console
- Make sure Google OAuth is ENABLED in Supabase

### Issue 4: User auto-logout setelah login Google
**Cause**: User tidak terdaftar di `User` table
**Solution**:
- Normal behavior! User harus register dulu di `/register`
- Login page akan show error "Akun belum terdaftar"
- Arahkan user ke register page untuk setup role

### Issue 5: Stuck di loading screen setelah Google login
**Cause**: AuthContext masih loading atau error di database query
**Solution**:
- Open DevTools Console untuk lihat error logs
- Check Supabase untuk verify `User` table structure
- Make sure `User` table has columns: `id`, `email`, `full_name`, `role`

## Testing Locally

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:5173/login`

3. Click "Lanjutkan dengan Google"

4. Google OAuth screen akan muncul

5. After success, cek console logs:
   - Harus ada log: `loadUserProfile: mencari user`
   - Jika user terdaftar: `loadUserProfile: user ditemukan, login berhasil`
   - Jika user belum terdaftar: `loadUserProfile: user belum terdaftar`

## Environment Variables

File `.env` harus punya:
```env
VITE_SUPABASE_URL=https://agqkmxdinuluiizckhbs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Jangan commit `.env` ke git! Use `.env.local` untuk lokal development.

## Browser Console Debugging

Buka DevTools (F12) dan perhatikan:
1. Network tab → lihat Google OAuth redirect
2. Console tab → lihat error messages
3. Application → lihat sessionStorage untuk `pending_role`

## Need Help?

Check these Supabase docs:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/reference/javascript/auth-signinwithoauth
