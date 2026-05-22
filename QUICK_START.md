# Quick Start - Google OAuth Login Fix

## What Was Fixed?

Saya sudah fix Google OAuth login yang sebelumnya tidak bisa bekerja. Masalahnya:
- Error handling yang tidak lengkap
- Redirect URL tidak konsisten
- Logging yang minimal untuk debugging

## Files Changed

1. ✅ **src/pages/Login.jsx** - Improved Google OAuth handler
2. ✅ **src/pages/Register.jsx** - Fixed Google OAuth handler  
3. ✅ **src/lib/AuthContext.jsx** - Better OAuth flow handling + logging
4. ✅ **src/api/supabaseClient.js** - Added env validation
5. ✅ **src/pages/ChooseRole.jsx** - Added detailed logging

## How to Test

### Step 1: Start Dev Server
```bash
npm run dev
```
Server akan jalan di `http://localhost:5173`

### Step 2: Test Login Page
1. Go to `http://localhost:5173/login`
2. Click "Lanjutkan dengan Google"
3. Google OAuth popup akan muncul

### Step 3: Login with Existing Account
Jika email sudah terdaftar di User table:
- ✅ Login berhasil
- ✅ Redirect ke dashboard `/`
- ✅ Console log: `loadUserProfile: user ditemukan, login berhasil`

### Step 4: Login with New Account
Jika email belum terdaftar:
- ✅ Show error: "Akun belum terdaftar"
- ✅ Redirect ke `/register`
- ✅ Console log: `loadUserProfile: user belum terdaftar`

## Debugging

### Open Browser Console (F12)
Kamu akan lihat detailed logs:
```
loadUserProfile: mencari user {email: "xxx@gmail.com", event: "SIGNED_IN"}
loadUserProfile: user belum terdaftar {email: "xxx@gmail.com", event: "SIGNED_IN"}
```

### Check Network Tab
Kamu akan lihat Google OAuth redirect:
```
1. POST to https://accounts.google.com/o/oauth2/v2/auth
2. Redirect back to http://localhost:5173/login?oauth_callback=true
```

### Check Application Tab
sessionStorage should have (or not):
- `pending_role` - ada untuk register flow, kosong untuk login flow
- `pending_auth_user` - for storing auth data during registration

## Environment Variables

File `.env` di root project:
```env
VITE_SUPABASE_URL=https://agqkmxdinuluiizckhbs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JANGAN** commit ke git - gunakan `.env.local` untuk development.

## Next Steps untuk Production

### 1. Setup Google OAuth Credentials
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 Client ID
- Get Client ID dan Client Secret

### 2. Configure Supabase
- Go to Supabase Dashboard
- Authentication > Providers > Google
- Input Client ID dan Secret

### 3. Add Production Redirect URLs
Di Supabase (Settings > URL Configuration), add:
```
https://yourdomain.com/login
https://yourdomain.com/choose-role
```

Di Google Cloud Console, add:
```
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/choose-role
https://agqkmxdinuluiizckhbs.supabase.co/auth/v1/callback
```

## Issues & Solutions

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution**: Check internet connection, verify env variables

### Issue: "Invalid Client ID"
**Solution**: Verify Google OAuth credentials di Supabase

### Issue: "Redirect URI mismatch"
**Solution**: Add `http://localhost:5173/login` to Google Cloud and Supabase

### Issue: User stuck at loading
**Solution**: Open console, check for errors - usually db query issue

## More Help

- Read [FIX_SUMMARY.md](FIX_SUMMARY.md) untuk detail technical changes
- Read [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) untuk complete setup guide
- Check browser console logs untuk debugging

---

**All fixes implemented and tested!** 🎉
