# Supabase Google OAuth Configuration Checklist

## ✅ Before Testing - Verify Your Setup

### Part 1: Supabase Project Setup

#### 1.1 Google OAuth Provider
- [ ] Go to Supabase Dashboard > Authentication > Providers
- [ ] Find "Google" in the provider list
- [ ] Click on it to open settings
- [ ] **Toggle ON** to enable Google OAuth
- [ ] You should see: "Enabled" status

#### 1.2 Google Credentials
- [ ] You have **Client ID** from Google Cloud Console
- [ ] You have **Client Secret** from Google Cloud Console
- [ ] Input both in Supabase Google provider settings
- [ ] Click "Save"

#### 1.3 Supabase Redirect URLs
- [ ] Go to Settings > URL Configuration
- [ ] Under "Site URL", verify it's set correctly:
  - For local: `http://localhost:5173`
  - For production: `https://yourdomain.com`
- [ ] Add these to "Additional Redirect URLs":
  ```
  http://localhost:5173/login
  http://localhost:5173/choose-role
  http://localhost:5173
  ```
- [ ] For production, also add:
  ```
  https://yourdomain.com/login
  https://yourdomain.com/choose-role
  https://yourdomain.com
  ```

### Part 2: Google Cloud Console Setup

#### 2.1 OAuth Application
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create new project or select existing
- [ ] Go to Credentials > Create Credentials > OAuth 2.0 Client ID
- [ ] Choose "Web application"
- [ ] Name it something like "EduSpace Web"

#### 2.2 Authorized JavaScript Origins
In OAuth application settings, add:
- [ ] `http://localhost:5173`
- [ ] `http://localhost`
- [ ] `https://yourdomain.com`

#### 2.3 Authorized Redirect URIs
In OAuth application settings, add:
- [ ] `http://localhost:5173/login`
- [ ] `http://localhost:5173/choose-role`
- [ ] `https://yourdomain.com/login`
- [ ] `https://yourdomain.com/choose-role`
- [ ] **IMPORTANT**: `https://agqkmxdinuluiizckhbs.supabase.co/auth/v1/callback`
  (This is the Supabase callback endpoint - required!)

#### 2.4 Copy Credentials
- [ ] Copy **Client ID**
- [ ] Copy **Client Secret**
- [ ] Input both in Supabase > Providers > Google

### Part 3: Application Setup

#### 3.1 Environment Variables
- [ ] Check `.env` file exists in project root
- [ ] Has `VITE_SUPABASE_URL=https://agqkmxdinuluiizckhbs.supabase.co`
- [ ] Has `VITE_SUPABASE_ANON_KEY=eyJ...` (the anon key)
- [ ] Restart dev server if you changed `.env`

#### 3.2 Database Tables
- [ ] `User` table exists in Supabase
- [ ] Has columns: `id`, `email`, `full_name`, `role`, `created_at`
- [ ] Columns have correct types:
  - `id`: UUID (primary key)
  - `email`: text (unique)
  - `full_name`: text
  - `role`: text (student, teacher)
  - `created_at`: timestamp

#### 3.3 Row Level Security (RLS)
- [ ] Check if RLS is enabled on `User` table
- [ ] If enabled, verify policies allow:
  - Users to read their own record
  - Users to insert their own record
  - Example policy:
    ```sql
    CREATE POLICY "Users can view their own data"
    ON public."User"
    FOR SELECT
    USING (auth.uid()::text = id);
    ```

### Part 4: Browser Testing Setup

#### 4.1 Clear Browser Data
- [ ] Open DevTools (F12)
- [ ] Application > Clear All > Clear site data
- [ ] Close all browser tabs with localhost:5173
- [ ] Restart browser to clear OAuth state

#### 4.2 Start Dev Server
- [ ] Terminal: `npm run dev`
- [ ] Browser: `http://localhost:5173`
- [ ] You should see the EduSpace login page

### Part 5: Test Login Flow

#### Test 5.1: New User Registration
- [ ] Go to `/register`
- [ ] Choose role (student or teacher)
- [ ] Click "Daftar dengan Google"
- [ ] Google OAuth popup appears
- [ ] Select or login with Google account
- [ ] Redirected to Choose Role page
- [ ] Select role again, click "Masuk ke Dashboard"
- [ ] Redirected to dashboard `/`
- [ ] Check browser console for success logs

#### Test 5.2: Existing User Login
- [ ] Go to `/login`
- [ ] Click "Lanjutkan dengan Google"
- [ ] Google OAuth popup appears
- [ ] Login with same Google account as before
- [ ] Redirected to dashboard `/`
- [ ] Check browser console for success logs

#### Test 5.3: Unregistered User Login
- [ ] Go to `/login`
- [ ] Click "Lanjutkan dengan Google"
- [ ] Login with new/different Google account
- [ ] Should see error: "Akun belum terdaftar"
- [ ] Should redirect to `/register`
- [ ] Check browser console for error logs

### Part 6: Browser Console Logging

When testing, you should see in DevTools Console:

**Success case (registered user):**
```
Initializing Supabase client with URL: https://agqkmxdinuluiizckhbs.supabase.co
loadUserProfile: mencari user {email: "xxx@gmail.com", event: "SIGNED_IN"}
loadUserProfile: user ditemukan, login berhasil {email: "xxx@gmail.com"}
```

**Unregistered case:**
```
Initializing Supabase client with URL: https://agqkmxdinuluiizckhbs.supabase.co
loadUserProfile: mencari user {email: "xxx@gmail.com", event: "SIGNED_IN"}
loadUserProfile: user belum terdaftar {email: "xxx@gmail.com", event: "SIGNED_IN"}
loadUserProfile: user dari login, tolak - redirect ke login with error
```

**Error case:**
```
Google OAuth Error: { message: "..." }
Gagal login dengan Google. Coba lagi.
```

### Part 7: Network Debugging

In DevTools Network tab, you should see:
- [ ] Request to `https://accounts.google.com/o/oauth2/v2/auth` (OAuth screen)
- [ ] Redirect back to `http://localhost:5173/login?oauth_callback=true&code=...`
- [ ] POST request to Supabase auth endpoint
- [ ] Response with session token

### Part 8: Application Data Debugging

In DevTools Application tab:
- [ ] Cookies: Should have `sb-...` cookies from Supabase
- [ ] localStorage: Should have `sb-...` keys
- [ ] sessionStorage: Check `pending_role` status:
  - For login: Should be empty/not present
  - For register: Should have student/teacher

## ✅ All Checked? You're Ready!

If all items are checked:
- ✅ Google OAuth should work for login
- ✅ Google OAuth should work for registration
- ✅ Error handling is in place
- ✅ Logging will help with debugging

## Common Issues During Checklist

### ❌ Issue: Can't find Google provider in Supabase
**Solution**: Make sure you're in the right project. Go to Project Settings > General to verify project name.

### ❌ Issue: "Provider is not enabled" error
**Solution**: Toggle the Google provider ON in Supabase > Providers > Google

### ❌ Issue: OAuth popup doesn't appear
**Solution**: Check browser console for errors. Usually:
- Wrong Client ID
- Wrong redirect URL
- Missing RLS policies

### ❌ Issue: Redirect back fails with "callback_url_mismatch"
**Solution**: Add the redirect URL to both Supabase AND Google Cloud:
- Supabase: Settings > URL Configuration > Additional Redirect URLs
- Google Cloud: OAuth App > Authorized redirect URIs

### ❌ Issue: "Error with PKCE code verifier" or similar
**Solution**: 
- Clear all cookies/storage (DevTools Application > Clear All)
- Restart browser
- Try again

## Next: Start Testing!

Once all items are checked:
1. Go to [QUICK_START.md](QUICK_START.md) for testing steps
2. Open browser console and watch the logs
3. Test all three flows: login registered, login unregistered, register

---

**Setup checklist complete!** 🎉 Ready for Google OAuth testing.
