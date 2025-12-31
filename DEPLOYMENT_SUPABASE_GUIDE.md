# 🔐 Maintaining Supabase Connection After Deployment

## ✅ Good News: You Won't Lose Your Supabase Connection!

Your Supabase database will work perfectly after deployment. Here's exactly what you need to do:

---

## 📊 Your Current Supabase Setup:

### **Project Details:**
- **Project ID**: `sxtdsxaibifgvtyeatzl`
- **Supabase URL**: `https://sxtdsxaibifgvtyeatzl.supabase.co`
- **Database**: Key-Value Store (table: `kv_store_bf07b5b1`)
- **Server**: Edge Function with Hono

### **What You Have:**
✅ Hardcoded credentials in `/utils/supabase/info.tsx`  
✅ Server-side Edge Functions  
✅ KV Store for data persistence  
✅ Anonymous + Authenticated user support  

---

## 🚀 Deployment Options & Supabase Setup:

### **Option 1: Deploy to Vercel** ⭐ (Recommended)

#### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

#### **Step 2: Set Environment Variables**

When you run `vercel`, you'll be prompted to set environment variables. Add these:

```bash
# Required for backend (Edge Functions)
SUPABASE_URL=https://sxtdsxaibifgvtyeatzl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGRzeGFpYmlmZ3Z0eWVhdHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzM1MjYsImV4cCI6MjA4MjYwOTUyNn0.31i1JKdXazyCRODjm5ZPiDP3ao5MiZhIwCcgDJ57wqE
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase
```

**Or set them in Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add each variable above
3. Make sure to select "Production", "Preview", and "Development"

#### **Step 3: Deploy**
```bash
vercel
```

**That's it!** Your Supabase connection will work automatically.

---

### **Option 2: Deploy to Netlify**

#### **Step 1: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

#### **Step 2: Create `netlify.toml` in your project root**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "supabase/functions"
```

#### **Step 3: Set Environment Variables**

**Option A: Using Netlify CLI:**
```bash
netlify env:set SUPABASE_URL "https://sxtdsxaibifgvtyeatzl.supabase.co"
netlify env:set SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-role-key"
```

**Option B: Using Netlify Dashboard:**
1. Go to Site Settings → Environment Variables
2. Add the same variables as above

#### **Step 4: Deploy**
```bash
netlify deploy --prod
```

---

### **Option 3: Deploy to Cloudflare Pages**

#### **Step 1: Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

#### **Step 2: Connect in Cloudflare Dashboard**
1. Go to Workers & Pages → Create Application
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`

#### **Step 3: Add Environment Variables**
In Cloudflare Dashboard → Settings → Environment Variables:
```
SUPABASE_URL=https://sxtdsxaibifgvtyeatzl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔑 Where to Find Your Service Role Key:

### **IMPORTANT**: You need your Supabase Service Role Key for full functionality!

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `sxtdsxaibifgvtyeatzl`
3. **Settings** → **API**
4. **Copy "service_role" key** (under "Project API keys")

⚠️ **SECURITY WARNING**: 
- **NEVER expose this key in frontend code**
- **ONLY use it in backend/server environment variables**
- **The key you have in `/utils/supabase/info.tsx` is the ANON key** (safe for frontend)

---

## 🔍 How Your App Connects to Supabase:

### **Frontend** (Browser):
```typescript
// Uses hardcoded values from /utils/supabase/info.tsx
const projectId = "sxtdsxaibifgvtyeatzl"
const publicAnonKey = "eyJhbGci..." // ANON key (safe)
```

### **Backend** (Edge Functions):
```typescript
// Server reads from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
```

---

## ✅ Verification Checklist After Deployment:

### **Test 1: Frontend Connection**
Open browser console and check:
```javascript
console.log('Project ID:', projectId) // Should show: sxtdsxaibifgvtyeatzl
```

### **Test 2: Backend Connection**
Check if your Edge Functions are working:
```bash
curl https://your-deployed-url.vercel.app/make-server-bf07b5b1/health
```
Should return: `{"status":"ok"}`

### **Test 3: Database Connection**
Try saving progress in your app. Check Supabase Dashboard → Table Editor → `kv_store_bf07b5b1` to see if data is being saved.

### **Test 4: Auth Flow (if using authentication)**
Try signing up/logging in. Should work without errors.

---

## 🛠️ Troubleshooting:

### **Problem: "Failed to connect to Supabase"**
**Solution:**
- Verify environment variables are set correctly in your hosting platform
- Check that `SUPABASE_URL` doesn't have trailing slash
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is the correct key from Supabase Dashboard

### **Problem: "Unauthorized" errors**
**Solution:**
- Frontend should use ANON key (already in `/utils/supabase/info.tsx`)
- Backend should use SERVICE_ROLE key (from environment variables)
- Check that JWT tokens are being passed correctly

### **Problem: "No data in database"**
**Solution:**
- Check Supabase Dashboard → Table Editor → `kv_store_bf07b5b1`
- Verify Edge Functions are deployed correctly
- Check browser console for API errors

### **Problem: "CORS errors"**
**Solution:**
- Your Edge Function already has CORS configured (line 11-18 in `/supabase/functions/server/index.tsx`)
- Make sure you're calling the correct endpoint URL
- Check that the deployed URL matches your API calls

---

## 📝 Quick Deployment Checklist:

```bash
# 1. Make sure your code builds
npm run build

# 2. Choose a hosting platform (Vercel recommended)
npm install -g vercel

# 3. Get your Supabase Service Role Key
# Go to: https://supabase.com/dashboard → Your Project → Settings → API

# 4. Deploy with environment variables
vercel

# When prompted, add:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 5. Test your deployed app
# - Try reading/writing data
# - Check if groups work
# - Test offline mode (PWA)

# ✅ Done!
```

---

## 🎯 Important Notes:

### **Your Database Stays the Same:**
- ✅ Same Supabase project
- ✅ Same database tables
- ✅ Same data (nothing is lost)
- ✅ Same API endpoints

### **What Changes:**
- ❌ Figma Make hosting → ✅ Vercel/Netlify/Cloudflare hosting
- ❌ Preview URL → ✅ Production URL
- ❌ Development mode → ✅ Production build

### **Data Persistence:**
- All your existing data in `kv_store_bf07b5b1` table **remains intact**
- Users can continue where they left off
- Group memberships are preserved
- Progress tracking continues working

---

## 🚨 CRITICAL: Don't Forget!

### **Before Deploying:**
1. ✅ Get your Supabase Service Role Key from dashboard
2. ✅ Add it to environment variables in your hosting platform
3. ✅ Test the build locally: `npm run build && npx serve dist`

### **After Deploying:**
1. ✅ Test all features (reading, groups, progress)
2. ✅ Check browser console for errors
3. ✅ Verify data is being saved in Supabase Dashboard

---

## 🎉 Summary:

**Your Supabase connection will NOT be lost!**

- ✅ Frontend uses hardcoded credentials (already in your code)
- ✅ Backend uses environment variables (you'll set during deployment)
- ✅ Database stays exactly the same
- ✅ All data is preserved
- ✅ Just need to set env vars in your hosting platform

**It's that simple!** Your app will connect to the exact same Supabase database whether it's in Figma Make or deployed to Vercel/Netlify/Cloudflare. 🚀
