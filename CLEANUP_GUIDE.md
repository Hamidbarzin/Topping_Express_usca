# 🧹 راهنمای پاک‌سازی و مرتب‌سازی پروژه

## ✅ کارهای انجام شده

### 1. فایل .gitignore ایجاد شد
- ✅ `node_modules/` نادیده گرفته می‌شود
- ✅ `dist/` و `build/` نادیده گرفته می‌شوند
- ✅ فایل‌های `.env` محافظت می‌شوند
- ✅ فایل‌های cache نادیده گرفته می‌شوند
- ✅ فایل‌های OS (`.DS_Store`, `Thumbs.db`) نادیده گرفته می‌شوند

### 2. اسکریپت پاک‌سازی ایجاد شد
- ✅ `clean-cache.sh` - پاک‌سازی خودکار
- ✅ اسکریپت‌های npm در `package.json`

### 3. ساختار پروژه بهینه شد
```
Topping_Express_usca/
├── client/          ← Frontend (React)
├── server/          ← Backend (Express)
├── shared/          ← کدهای مشترک
└── ...
```

---

## 🚀 دستورات پاک‌سازی

### پاک‌سازی Cache
```bash
# روش 1: استفاده از اسکریپت bash
./clean-cache.sh

# روش 2: استفاده از npm
npm run clean:cache
```

### پاک‌سازی کامل
```bash
# پاک کردن همه چیز و نصب مجدد
npm run clean:all
```

### پاک‌سازی Build
```bash
# فقط فایل‌های build
npm run clean:build
```

### پاک‌سازی دستی
```bash
# Cache directories
rm -rf .parcel-cache .turbo .vite .cache .eslintcache

# Build outputs
rm -rf dist build .next out

# Node modules (اختیاری)
rm -rf node_modules
npm install
```

---

## 📁 فایل‌هایی که نادیده گرفته می‌شوند

### Dependencies
```
node_modules/
```

### Build Outputs
```
dist/
build/
.next/
out/
server/public/assets/*.js
server/public/assets/*.css
```

### Environment Variables
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Cache Directories
```
.parcel-cache/
.turbo/
.vite/
.cache/
.eslintcache
.stylelintcache
```

### IDE & OS Files
```
.vscode/
.idea/
.DS_Store
Thumbs.db
Desktop.ini
```

### Logs
```
*.log
npm-debug.log*
yarn-debug.log*
```

---

## 🔧 تنظیم Git

### اولین بار
```bash
# مقداردهی اولیه git
git init

# اضافه کردن فایل‌ها
git add .

# اولین commit
git commit -m "Initial commit: Complete Topping Express implementation"

# اتصال به repository
git remote add origin <your-repo-url>

# Push
git push -u origin main
```

### بررسی وضعیت
```bash
# بررسی فایل‌های نادیده گرفته شده
git status

# بررسی .gitignore
git check-ignore -v <filename>
```

---

## 📊 اندازه پروژه

### قبل از پاک‌سازی
```
node_modules/    ~500 MB
dist/            ~10 MB
cache/           ~50 MB
logs/            ~5 MB
─────────────────────────
Total:           ~565 MB
```

### بعد از پاک‌سازی (فقط کدهای منبع)
```
client/          ~2 MB
server/          ~1 MB
shared/          ~10 KB
docs/            ~500 KB
config files     ~50 KB
─────────────────────────
Total:           ~3.5 MB
```

**کاهش حجم: ~99%** 🎉

---

## 🗂️ ساختار بهینه شده

```
Topping_Express_usca/
│
├── 📁 client/                    # Frontend
│   ├── index.html
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── lib/
│
├── 📁 server/                    # Backend
│   ├── index.js
│   └── public/
│
├── 📁 shared/                    # مشترک
│   └── schema.ts
│
├── 📁 node_modules/              # ❌ نادیده گرفته شده
├── 📁 dist/                      # ❌ نادیده گرفته شده
├── 📁 .vite/                     # ❌ نادیده گرفته شده
│
├── 📄 .gitignore                 # ✅ فایل‌های نادیده گرفته شده
├── 📄 clean-cache.sh             # ✅ اسکریپت پاک‌سازی
├── 📄 package.json
└── 📄 ...
```

---

## ⚙️ اسکریپت‌های npm جدید

```json
{
  "scripts": {
    "clean": "bash clean-cache.sh",
    "clean:all": "npm run clean && rm -rf node_modules && npm install",
    "clean:cache": "rm -rf .parcel-cache .turbo .vite .cache .eslintcache",
    "clean:build": "rm -rf dist build .next out"
  }
}
```

### استفاده:
```bash
# پاک‌سازی cache
npm run clean:cache

# پاک‌سازی build
npm run clean:build

# پاک‌سازی کامل
npm run clean:all
```

---

## 🔍 بررسی فایل‌های بزرگ

```bash
# پیدا کردن فایل‌های بزرگ
find . -type f -size +10M -not -path "./node_modules/*"

# بررسی اندازه پوشه‌ها
du -sh */ | sort -hr

# بررسی کل پروژه
du -sh .
```

---

## 📝 چک‌لیست پاک‌سازی

### قبل از Commit
- [ ] `npm run clean:cache` اجرا شد
- [ ] `npm run clean:build` اجرا شد
- [ ] فایل‌های `.env` بررسی شدند
- [ ] `git status` بررسی شد
- [ ] فایل‌های غیرضروری حذف شدند

### قبل از Deploy
- [ ] `npm run build` اجرا شد
- [ ] `npm run check` بدون خطا
- [ ] Environment variables تنظیم شدند
- [ ] `.gitignore` بررسی شد

---

## 🚨 هشدارها

### ⚠️ فایل‌هایی که نباید حذف شوند
```
❌ client/src/          # کدهای منبع
❌ server/index.js      # کد backend
❌ shared/schema.ts     # Types مشترک
❌ package.json         # وابستگی‌ها
❌ .env                 # متغیرهای محیطی (اما نباید commit شود)
```

### ✅ فایل‌هایی که می‌توانند حذف شوند
```
✅ node_modules/        # قابل نصب مجدد
✅ dist/                # قابل build مجدد
✅ .vite/               # cache
✅ .cache/              # cache
✅ *.log                # log files
```

---

## 🔄 Workflow پیشنهادی

### روزانه
```bash
# شروع کار
git pull
npm install
npm run dev

# پایان کار
npm run clean:cache
git add .
git commit -m "..."
git push
```

### هفتگی
```bash
# پاک‌سازی کامل
npm run clean:all

# بررسی وابستگی‌ها
npm outdated
npm audit
```

### قبل از Deploy
```bash
# پاک‌سازی و build
npm run clean:all
npm run build
npm run check

# تست
npm start
```

---

## 📚 منابع مفید

### Git
- [Git Documentation](https://git-scm.com/doc)
- [.gitignore Templates](https://github.com/github/gitignore)

### npm
- [npm Scripts](https://docs.npmjs.com/cli/v9/using-npm/scripts)
- [npm Clean](https://docs.npmjs.com/cli/v9/commands/npm-cache)

---

## ✅ خلاصه

**آنچه انجام شد:**
- ✅ `.gitignore` کامل ایجاد شد
- ✅ اسکریپت پاک‌سازی نوشته شد
- ✅ اسکریپت‌های npm اضافه شدند
- ✅ ساختار پروژه بهینه شد

**نتیجه:**
- ✅ حجم repository کاهش یافت (~99%)
- ✅ فایل‌های حساس محافظت می‌شوند
- ✅ پاک‌سازی خودکار
- ✅ Git workflow بهینه

---

**آخرین بروزرسانی**: 30 سپتامبر 2025  
**وضعیت**: ✅ کامل و آماده
