# 🔧 راهنمای Manual Deploy در Render

**تاریخ**: 1 اکتبر 2025، 20:27  
**مشکل**: Auto-deploy کار نمی‌کند  
**راه‌حل**: Manual Redeploy

---

## 🚨 مشکل فعلی

```
❌ https://topping-express-usca.onrender.com
❌ "index.html not found"
❌ Auto-deploy کار نمی‌کند
❌ Build نمی‌شود یا در مسیر اشتباه
```

---

## ✅ راه‌حل: Manual Redeploy

### مرحله 1: ورود به Render Dashboard

```
1. برو به: https://dashboard.render.com
2. Login کن
3. Services → "topping-express" را پیدا کن
4. کلیک روی service
```

---

### مرحله 2: Manual Redeploy

#### گزینه A: Manual Deploy (توصیه می‌شود)

```
1. در صفحه service، بالای صفحه
2. دکمه "Manual Deploy" را پیدا کن
3. انتخاب "Deploy latest commit"
4. کلیک "Deploy"
```

#### گزینه B: Clear Build Cache + Redeploy

```
1. Settings → Build & Deploy
2. "Clear build cache" را کلیک کن
3. برگرد به Overview
4. "Manual Deploy" → "Deploy latest commit"
```

---

### مرحله 3: بررسی Build Settings

#### در Settings → Build & Deploy:

**Build Command باید باشد:**
```bash
npm install && npm run build
```

**Start Command باید باشد:**
```bash
npm start
```

**Root Directory:**
```
(خالی - همان root پروژه)
```

**اگر اشتباه است:**
```
1. Edit کن
2. درست کن
3. Save
4. Manual Deploy
```

---

### مرحله 4: بررسی Environment Variables

#### در Settings → Environment:

**حداقل این متغیرها باید باشند:**
```
NODE_ENV=production
PORT=10000
```

**اگر نیستند:**
```
1. Add Environment Variable
2. اضافه کن
3. Save Changes
4. Manual Deploy
```

---

### مرحله 5: مشاهده Logs

#### در حین Deploy:

```
1. برو به بخش "Logs"
2. مشاهده کن:
   ✅ "npm install"
   ✅ "npm run build"
   ✅ "vite build"
   ✅ "✓ built in..."
   ✅ "npm start"
   ✅ "Server listening on 0.0.0.0:10000"
```

#### اگر خطا دیدی:

**Build Failed:**
```
❌ "Cannot find module..."
→ Dependencies مشکل دارد
→ package.json را بررسی کن
```

**Start Failed:**
```
❌ "Error: listen EADDRINUSE"
→ Port مشکل دارد
→ Environment variables را بررسی کن
```

**Path Errors:**
```
❌ "ENOENT: no such file or directory"
→ Build output path اشتباه است
→ vite.config.ts را بررسی کن
```

---

## 🔍 Debug: بررسی Build Output

### در Logs باید ببینی:

```bash
# Build شروع می‌شود
==> Running 'npm install && npm run build'

# Dependencies نصب می‌شوند
npm install
added 1234 packages

# Vite build
npm run build
vite v5.4.19 building for production...
✓ 1681 modules transformed.
../server/public/index.html                   0.84 kB
../server/public/assets/index-BwUgnQfJ.css   26.12 kB
../server/public/assets/index-C_8FCHGc.js   393.56 kB
✓ built in 1.65s

# Server شروع می‌شود
==> Running 'npm start'
Server listening on 0.0.0.0:10000
```

**اگر این‌ها را نمی‌بینی = مشکل در Build است**

---

## 🛠️ Fix های احتمالی

### Fix 1: تغییر Build Command

#### اگر build command اشتباه است:

```
Settings → Build & Deploy → Build Command

از:
npm ci

به:
npm install && npm run build

Save → Manual Deploy
```

---

### Fix 2: اضافه کردن Post-Build Script

#### در package.json:

```json
{
  "scripts": {
    "build": "vite build",
    "postbuild": "ls -la server/public/"
  }
}
```

این به شما نشان می‌دهد که build کجا ساخته شده.

---

### Fix 3: تغییر Start Command

#### اگر server شروع نمی‌شود:

```
Settings → Build & Deploy → Start Command

از:
node server/index.js

به:
NODE_ENV=production node server/index.js

یا:
npm start

Save → Manual Deploy
```

---

### Fix 4: بررسی Node Version

#### در Settings → Environment:

```
Node Version: 20.x (توصیه می‌شود)

اگر خیلی قدیمی است (مثلاً 14.x):
1. Change Node Version → 20.x
2. Save
3. Manual Deploy
```

---

## 📊 چک‌لیست Deploy

### قبل از Deploy
- [ ] Build command درست است
- [ ] Start command درست است
- [ ] Environment variables تنظیم شده
- [ ] Node version مناسب است

### در حین Deploy
- [ ] Logs را مشاهده کنید
- [ ] Build موفق است
- [ ] Server شروع می‌شود
- [ ] بدون خطا

### بعد از Deploy
- [ ] Status: "Live"
- [ ] URL باز می‌شود
- [ ] صفحه لود می‌شود
- [ ] فرم کار می‌کند

---

## 🎯 دستورات دقیق

### 1. Manual Deploy
```
Dashboard → topping-express
→ Manual Deploy (بالای صفحه)
→ Deploy latest commit
→ Deploy
```

### 2. Clear Cache + Deploy
```
Dashboard → topping-express
→ Settings → Build & Deploy
→ Clear build cache
→ برگشت به Overview
→ Manual Deploy → Deploy latest commit
```

### 3. بررسی Settings
```
Settings → Build & Deploy:
  Build Command: npm install && npm run build
  Start Command: npm start
  
Settings → Environment:
  NODE_ENV: production
  PORT: 10000
```

---

## 🚨 اگر هنوز کار نکرد

### آخرین راه‌حل: Delete & Recreate

```
1. Settings → Danger Zone
2. "Delete Service"
3. تایید حذف
4. New + → Web Service
5. Connect repository دوباره
6. تنظیمات را از اول وارد کن:
   - Build: npm install && npm run build
   - Start: npm start
   - Env: NODE_ENV=production, PORT=10000
7. Create Web Service
```

**نکته**: این آخرین راه‌حل است. قبلش Manual Deploy را امتحان کن.

---

## 📞 خلاصه سریع

**مشکل:**
```
Auto-deploy کار نمی‌کند
```

**راه‌حل:**
```
1. Dashboard → topping-express
2. Manual Deploy
3. Deploy latest commit
4. منتظر 2-3 دقیقه
5. ✅ کار می‌کند
```

**اگر نشد:**
```
1. Clear build cache
2. بررسی Build/Start commands
3. بررسی Environment variables
4. Manual Deploy دوباره
```

---

**تاریخ**: 1 اکتبر 2025، 20:27  
**وضعیت**: نیاز به Manual Deploy  
**زمان**: 2-3 دقیقه
