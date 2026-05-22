# ✅ COMPREHENSIVE TESTING & VERIFICATION GUIDE

**Date**: 21 May 2026  
**Status**: All code fixes complete - Ready for testing

---

## 🎯 Complete Testing Scenarios

### Scenario 1: Login dengan Google (User Belum Terdaftar)

**Expected Flow:**
```
1. Go to http://localhost:5174/login
2. Click "Lanjutkan dengan Google"
3. Google popup appears → login dengan email baru
4. Should redirect to /login with error
5. Error message: "Akun belum terdaftar"
6. Console logs:
   - loadUserProfile: mencari user
   - loadUserProfile: user belum terdaftar
   - loadUserProfile: flow detection {fromRegister: false, isOAuthEvent: true, fromLoginPage: true}
   - loadUserProfile: user dari login, tolak
   - redirecting to login with not_registered error
```

**Verification Checklist:**
- [ ] Google popup appears
- [ ] Redirect back to login page
- [ ] Error message shows "Akun belum terdaftar"
- [ ] Console shows all logs
- [ ] URL has `error=not_registered`

---

### Scenario 2: Daftar dengan Google (New User)

**Expected Flow:**
```
1. Go to http://localhost:5174/register
2. Choose role (student or teacher)
3. Click "Daftar dengan Google"
4. Google popup appears → login dengan email baru
5. Should redirect to /choose-role
6. sessionStorage should have pending_role="student" or "teacher"
7. Console logs:
   - loadUserProfile: mencari user
   - loadUserProfile: user belum terdaftar
   - loadUserProfile: flow detection {fromRegister: true, isOAuthEvent: true, fromLoginPage: false}
   - loadUserProfile: user dari register, arahkan ke choose-role
   - redirecting to choose-role
```

**After Choosing Role:**
```
8. Click role confirmation button
9. Should create User record in database
10. Redirect to / (dashboard)
11. Console logs:
    - ChooseRole: Creating user record: {email: "xxx@gmail.com", role: "student"}
    - ChooseRole: User created successfully
```

**Verification Checklist:**
- [ ] Google popup appears
- [ ] Redirect to /choose-role page
- [ ] sessionStorage has pending_role
- [ ] Role selection works
- [ ] Submit button works
- [ ] Redirect to dashboard succeeds
- [ ] Console shows all logs

---

### Scenario 3: Login dengan Google (User Sudah Terdaftar)

**Expected Flow:**
```
1. Go to http://localhost:5174/login
2. Click "Lanjutkan dengan Google"
3. Google popup appears → login dengan email yang sudah ada di User table
4. Should redirect to / (dashboard)
5. Console logs:
   - loadUserProfile: mencari user
   - loadUserProfile: user ditemukan, login berhasil
   - [User can see dashboard]
```

**Verification Checklist:**
- [ ] Google popup appears
- [ ] Redirect to dashboard
- [ ] User data loaded correctly
- [ ] Console shows "user ditemukan, login berhasil"
- [ ] Dashboard displays user info

---

### Scenario 4: Login dengan Email/Password (Manual)

**Expected Flow:**
```
1. Go to http://localhost:5174/login
2. Enter email and password
3. Click "Masuk"
4. If user exists and password correct:
   - Redirect to /
   - loadUserProfile runs
   - User logged in
```

**Verification Checklist:**
- [ ] Manual login still works
- [ ] Error message for invalid credentials
- [ ] Successful login redirects to dashboard

---

### Scenario 5: Session Persistence

**Expected Flow:**
```
1. Successful login (any method)
2. Refresh page
3. User should stay logged in
4. User data should load from Supabase session
5. Should NOT show loading indefinitely
```

**Verification Checklist:**
- [ ] Page refreshes without logout
- [ ] User stays authenticated
- [ ] Loading state completes
- [ ] No infinite loops

---

## 🔍 Console Log Checklist

### Startup Logs (Should see immediately):
```
✅ Initializing Supabase client with URL: https://agqkmxdinuluiizckhbs.supabase.co
```

### Login Page Load:
```
✅ getSession call completes
✅ Stats loading (students, teachers, courses counts)
```

### Google OAuth Click:
```
✅ "Google login exception" or "Google OAuth Error" - only if error
✅ Otherwise browser redirects to Google
```

### OAuth Callback (After Google Login):
```
✅ onAuthStateChange event: {event: "SIGNED_IN", hasUser: true}
✅ loadUserProfile: mencari user {email: "xxx@gmail.com", event: "SIGNED_IN"}
```

### If User Exists:
```
✅ loadUserProfile: user ditemukan, login berhasil {email: "xxx@gmail.com"}
✅ User redirected to dashboard
```

### If User Doesn't Exist:
```
✅ loadUserProfile: user belum terdaftar
✅ loadUserProfile: flow detection {fromRegister: ..., isOAuthEvent: true, fromLoginPage: true}
✅ loadUserProfile: user dari login, tolak
✅ Redirected to /login?error=not_registered
```

---

## 🧪 Browser DevTools Testing

### F12 → Console Tab:
- Watch for console.log and console.error messages
- Check for any red errors
- Verify flow trace matches expected scenario

### F12 → Application → Storage → sessionStorage:
- For register flow: `pending_role` should be "student" or "teacher"
- For login flow: `pending_role` should be empty/not present
- `pending_auth_user` should store auth data during registration

### F12 → Application → Storage → Cookies:
- After successful login: should have `sb-*.auth.token` or similar
- Should have session tokens from Supabase

### F12 → Network Tab:
1. Click Google button
2. Should see redirect to `https://accounts.google.com/...`
3. After login, should see redirect back to `/login` or `/choose-role`
4. Requests to Supabase API should have status 200
5. No 401/403 errors

### F12 → Application → Cached Data (if using service workers):
- Clear all if you see stale data
- Hard refresh (Cmd+Shift+R on Mac)

---

## 🔧 Troubleshooting Testing

### If Google popup doesn't appear:
1. ✅ Check console for error: "Google OAuth Error"
2. ✅ Check .env has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
3. ✅ Check Supabase Google provider is ENABLED
4. ✅ Check Supabase Google Client ID is set
5. ✅ Verify localhost:5174 is in redirect URLs

### If page is stuck loading:
1. ✅ Open console - check for errors
2. ✅ Check if `loadUserProfile` is being called
3. ✅ Check if database query is hanging
4. ✅ Try hard refresh: Cmd+Shift+R
5. ✅ Check Supabase project is active

### If redirect to /login?error=not_registered doesn't work:
1. ✅ Check AuthContext is handling error correctly
2. ✅ Check console logs match expected flow
3. ✅ Check that supabase.auth.signOut() completes
4. ✅ Verify pending_role is empty for login flow

### If user can't complete registration:
1. ✅ Check ChooseRole page loads after Google redirect
2. ✅ Check pending_role is set in sessionStorage
3. ✅ Check error message on ChooseRole page
4. ✅ Check Supabase User table exists
5. ✅ Check User table has RLS policies allowing insert

---

## 📋 Database Verification

### Check User Table Structure:
```sql
SELECT * FROM "User" LIMIT 1;
```

Should have columns:
- ✅ `id` (UUID, primary key)
- ✅ `email` (text, unique)
- ✅ `full_name` (text)
- ✅ `role` (text: "student" or "teacher")
- ✅ `created_at` (timestamp)

### Check RLS Policies:
```
Authentication > Policies > User table
```

Should allow:
- ✅ Users to read own record
- ✅ Users to insert own record
- ✅ Anon users to insert during registration

### Test Insert Manually:
Go to Supabase SQL Editor and test:
```sql
INSERT INTO "User" (email, full_name, role)
VALUES ('test@example.com', 'Test User', 'student');
```

Should succeed if RLS allows it.

---

## ✅ Full Test Checklist

### Pre-Test Setup:
- [ ] npm run dev is running
- [ ] Accessible at http://localhost:5174
- [ ] Supabase Google provider is ENABLED
- [ ] Google Client ID is entered in Supabase
- [ ] Redirect URLs are configured
- [ ] User table exists with correct columns
- [ ] User has not done any OAuth before (fresh test)

### Test Execution:
- [ ] Scenario 1: New user Google login → shows error
- [ ] Scenario 2: New user Google register → creates account
- [ ] Scenario 3: Existing user Google login → logs in
- [ ] Scenario 4: Manual email/password login → works
- [ ] Scenario 5: Session persists on refresh

### Result Verification:
- [ ] All console logs appear as expected
- [ ] No red errors in console
- [ ] All redirects work correctly
- [ ] User data displays correctly
- [ ] No infinite loops
- [ ] No stuck loading states

---

## 🎉 Success Indicators

✅ **Google login works** when:
- User clicks Google button
- Google popup appears
- After auth, user redirected correctly
- Console shows proper logs
- No errors in console

✅ **Google register works** when:
- User chooses role
- Clicks Google button
- Redirected to /choose-role
- Can confirm role
- User created in database
- Redirect to dashboard works

✅ **Everything works** when:
- All 5 scenarios pass
- All console logs appear
- No error messages
- No stuck loading
- Data persists on refresh

---

## 📞 Still Having Issues?

### Check These Files:
1. **src/pages/Login.jsx** - handleGoogle function
2. **src/pages/Register.jsx** - handleGoogle function
3. **src/lib/AuthContext.jsx** - loadUserProfile function
4. **src/api/supabaseClient.js** - initialization

### Read These Docs:
1. **SETUP_CHECKLIST.md** - Verify Supabase setup
2. **QUICK_START.md** - Quick testing guide
3. **GOOGLE_OAUTH_SETUP.md** - Complete reference

### Debug Steps:
1. Open console (F12)
2. Reproduce issue
3. Watch console logs
4. Match against expected logs
5. Check Application storage
6. Check Network requests

---

**Test Thoroughly and Report Any Issues!** 🚀

