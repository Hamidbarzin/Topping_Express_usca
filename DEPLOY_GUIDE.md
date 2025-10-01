# 🚀 راهنمای Deploy - Topping Express

## ✅ Git Setup کامل شد!

```bash
✅ Git initialized
✅ Files committed
✅ Ready to push
```

---

## 📤 Push به GitHub

### 1. ایجاد Repository در GitHub
1. برو به [github.com](https://github.com)
2. کلیک روی "New repository"
3. نام: `topping-express-usca`
4. Description: `Shipping quote system for Canada to USA`
5. **Public** یا **Private** (به انتخاب شما)
6. **بدون** README, .gitignore, license (چون از قبل داریم)
7. کلیک "Create repository"

### 2. اتصال به Repository
```bash
# اضافه کردن remote
git remote add origin https://github.com/YOUR_USERNAME/topping-express-usca.git

# یا با SSH
git remote add origin git@github.com:YOUR_USERNAME/topping-express-usca.git

# بررسی
git remote -v
```

### 3. Push کردن
```bash
# Push اولین بار
git push -u origin main

# یا اگر branch شما master است
git push -u origin master
```

---

## 🌐 Deploy به Render

### مرحله 1: آماده‌سازی

#### 1.1 ایجاد فایل render.yaml
این فایل قبلاً در پروژه وجود ندارد، بیایید بسازیمش:

```yaml
# render.yaml
services:
  # Web Service
  - type: web
    name: topping-express
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: SENDGRID_API_KEY
        sync: false
      - key: SESSION_SECRET
        generateValue: true
```

#### 1.2 بروزرسانی package.json
اطمینان حاصل کنید این scripts موجود است:
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node server/index.js"
  },
  "engines": {
    "node": ">=18.0.0 <21.0.0",
    "npm": ">=9.0.0"
  }
}
```

### مرحله 2: Deploy در Render

#### 2.1 ایجاد حساب
1. برو به [render.com](https://render.com)
2. Sign up با GitHub account
3. Authorize Render

#### 2.2 ایجاد Web Service جدید
1. کلیک "New +" → "Web Service"
2. Connect repository: `topping-express-usca`
3. تنظیمات:
   ```
   Name: topping-express
   Region: Oregon (US West)
   Branch: main
   Root Directory: (خالی بگذارید)
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

#### 2.3 تنظیم Environment Variables
در بخش "Environment":
```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_database_url
SENDGRID_API_KEY=your_sendgrid_key
SESSION_SECRET=your_random_secret
```

#### 2.4 انتخاب Plan
- **Free Plan**: برای تست (محدودیت‌دار)
- **Starter Plan**: $7/month (توصیه می‌شود)

#### 2.5 Deploy
1. کلیک "Create Web Service"
2. Render شروع به build می‌کند
3. منتظر بمانید تا deploy کامل شود (~5-10 دقیقه)

---

## 🗄️ تنظیم Database

### گزینه 1: Render PostgreSQL (توصیه می‌شود)
```bash
1. در Render Dashboard: "New +" → "PostgreSQL"
2. نام: topping-express-db
3. Region: همان region web service
4. Plan: Free یا Starter
5. Create Database
6. کپی کردن "Internal Database URL"
7. اضافه کردن به Environment Variables web service
```

### گزینه 2: Neon (رایگان)
```bash
1. برو به neon.tech
2. Sign up
3. Create new project
4. کپی connection string
5. اضافه کردن به Render Environment Variables
```

### گزینه 3: Supabase (رایگان)
```bash
1. برو به supabase.com
2. Create new project
3. Settings → Database → Connection string
4. اضافه کردن به Render Environment Variables
```

---

## 📧 تنظیم Email Service

### SendGrid Setup
```bash
1. برو به sendgrid.com
2. Sign up (100 emails/day رایگان)
3. Settings → API Keys → Create API Key
4. کپی API key
5. اضافه کردن به Render: SENDGRID_API_KEY
```

---

## ✅ چک‌لیست Deploy

### قبل از Deploy
- [x] Git commit انجام شد
- [x] .gitignore بررسی شد
- [x] Environment variables آماده است
- [ ] Database URL دارید
- [ ] SendGrid API key دارید
- [ ] GitHub repository ایجاد شد

### در Render
- [ ] Web Service ایجاد شد
- [ ] Environment variables تنظیم شدند
- [ ] Database متصل شد
- [ ] Build موفق بود
- [ ] Deploy موفق بود
- [ ] سایت باز می‌شود

### بعد از Deploy
- [ ] تست فرم‌ها
- [ ] تست API endpoints
- [ ] تست ارسال ایمیل
- [ ] تست database
- [ ] بررسی logs

---

## 🔧 دستورات مفید

### Local Testing
```bash
# Build
npm run build

# Test production locally
npm start

# بررسی در مرورگر
http://localhost:5000
```

### Git Commands
```bash
# بررسی وضعیت
git status

# Commit جدید
git add .
git commit -m "Update: ..."
git push

# بررسی history
git log --oneline
```

### Render CLI (اختیاری)
```bash
# نصب
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

---

## 🐛 عیب‌یابی

### مشکل: Build fails
```bash
# بررسی logs در Render
# معمولاً به خاطر:
- Missing dependencies
- TypeScript errors
- Environment variables

راه‌حل:
1. npm run check (local)
2. npm run build (local)
3. بررسی package.json
```

### مشکل: App crashes
```bash
# بررسی logs در Render
# معمولاً به خاطر:
- Database connection
- Missing environment variables
- Port issues

راه‌حل:
1. بررسی Environment Variables
2. بررسی DATABASE_URL
3. بررسی logs
```

### مشکل: 404 errors
```bash
# معمولاً به خاطر:
- Routing issues
- Build path problems

راه‌حل:
1. بررسی vite.config.ts
2. بررسی server/index.js routing
```

---

## 📊 مانیتورینگ

### Render Dashboard
```
- Metrics: CPU, Memory, Requests
- Logs: Real-time logs
- Events: Deploy history
- Settings: Environment variables
```

### External Tools (اختیاری)
```
- Sentry: Error tracking
- LogRocket: Session replay
- Google Analytics: User tracking
```

---

## 🔄 Workflow بعد از Deploy

### تغییرات جدید
```bash
# 1. تغییرات local
# ویرایش کدها...

# 2. Test local
npm run dev
npm run build

# 3. Commit
git add .
git commit -m "feat: ..."

# 4. Push
git push

# 5. Auto-deploy در Render
# Render به صورت خودکار deploy می‌کند
```

### Rollback
```bash
# در Render Dashboard:
1. برو به "Events"
2. انتخاب deploy قبلی
3. کلیک "Rollback to this version"
```

---

## 💰 هزینه‌ها

### Render
```
Free Plan:
- 750 hours/month
- 512 MB RAM
- Shared CPU
- Sleep after 15 min inactivity

Starter Plan ($7/month):
- Always on
- 512 MB RAM
- Shared CPU
- بهتر برای production
```

### Database
```
Render PostgreSQL Free:
- 1 GB storage
- Expires after 90 days

Render PostgreSQL Starter ($7/month):
- 1 GB storage
- No expiration
- Daily backups
```

### جمع کل
```
Free: $0/month (محدودیت‌دار)
Basic: $14/month (Web + DB)
Recommended: $21/month (Web Starter + DB Starter)
```

---

## 🎯 URL نهایی

بعد از deploy موفق:
```
https://topping-express.onrender.com
```

---

## 📚 منابع

### Render
- [Render Docs](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)

### Git
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com)

---

## ✅ خلاصه

**مراحل Deploy:**
1. ✅ Git setup (انجام شد)
2. ⏳ Push به GitHub (در انتظار شما)
3. ⏳ Deploy به Render (در انتظار شما)
4. ⏳ تنظیم Database (در انتظار شما)
5. ⏳ تنظیم Email (در انتظار شما)
6. ⏳ تست نهایی (در انتظار شما)

**وضعیت فعلی:**
- ✅ کد آماده است
- ✅ Git commit شد
- ⏳ نیاز به push
- ⏳ نیاز به deploy

---

**موفق باشید! 🚀**

**تاریخ**: 30 سپتامبر 2025  
**وضعیت**: آماده برای Deploy
