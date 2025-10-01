# 🚀 راهنمای گام‌به‌گام Deploy به Render

**تاریخ**: 1 اکتبر 2025  
**وضعیت**: ✅ آماده برای Deploy

---

## 📋 پیش‌نیازها (آماده است ✅)

- ✅ GitHub repository: `Hamidbarzin/Topping_Express_usca`
- ✅ Code pushed to GitHub
- ✅ `render.yaml` موجود است
- ✅ Build موفق (tested locally)
- ✅ Server کار می‌کند (tested locally)

---

## 🎯 مراحل Deploy (5 دقیقه)

### مرحله 1: ایجاد حساب Render

#### 1.1 باز کردن Render
```
🌐 برو به: https://render.com
```

#### 1.2 Sign Up
```
1. کلیک روی "Get Started" یا "Sign Up"
2. انتخاب "Sign up with GitHub"
3. Authorize Render to access GitHub
4. تایید email (اگر لازم باشد)
```

**نکته**: با GitHub sign up کنید تا راحت‌تر repository را connect کنید.

---

### مرحله 2: Connect Repository

#### 2.1 ایجاد Web Service جدید
```
1. در Dashboard، کلیک "New +"
2. انتخاب "Web Service"
```

#### 2.2 Connect GitHub Repository
```
1. در لیست repositories، جستجو کنید: "Topping_Express_usca"
2. کلیک "Connect" کنار repository
```

**اگر repository را نمی‌بینید:**
```
1. کلیک "Configure account"
2. در GitHub، دسترسی به repository را بدهید
3. برگردید به Render و refresh کنید
```

---

### مرحله 3: تنظیمات Service

#### 3.1 اطلاعات پایه
```
Name: topping-express
Region: Oregon (US West)
Branch: main
Root Directory: (خالی بگذارید)
```

#### 3.2 Runtime
```
Runtime: Node
```

#### 3.3 Build & Start Commands
```
Build Command: npm install && npm run build
Start Command: npm start
```

**نکته**: این دستورات از `render.yaml` خوانده می‌شوند.

#### 3.4 Plan
```
انتخاب کنید:
- Free Plan (برای تست)
  ✅ رایگان
  ⚠️ Sleep بعد از 15 دقیقه بی‌فعالیت
  ⚠️ 750 ساعت در ماه
  
- Starter Plan ($7/month) - توصیه می‌شود
  ✅ Always on
  ✅ بدون محدودیت
  ✅ بهتر برای production
```

---

### مرحله 4: Environment Variables

#### 4.1 متغیرهای ضروری
در بخش "Environment":

```bash
# 1. Node Environment
NODE_ENV=production

# 2. Port (اتوماتیک توسط Render تنظیم می‌شود)
PORT=10000

# 3. Session Secret (اتوماتیک generate می‌شود)
SESSION_SECRET=auto-generated
```

#### 4.2 متغیرهای اختیاری (بعداً)
```bash
# Database (اگر دارید)
DATABASE_URL=your_database_connection_string

# Email Service (اگر دارید)
SENDGRID_API_KEY=your_sendgrid_key
# یا
POSTMARK_API_KEY=your_postmark_key

# Shipping API (اگر دارید)
SHIPPING_API_KEY=your_shipping_api_key
```

**نکته**: می‌توانید بعداً این متغیرها را اضافه کنید.

---

### مرحله 5: Deploy!

#### 5.1 شروع Deploy
```
1. بررسی تنظیمات
2. کلیک "Create Web Service"
3. Render شروع به build می‌کند
```

#### 5.2 مشاهده Progress
```
در صفحه service:
- Logs را مشاهده کنید
- Build progress را ببینید
- منتظر "Live" شدن باشید
```

**زمان تقریبی**: 3-5 دقیقه

---

## 📊 مراحل Build (چه اتفاقی می‌افتد)

### 1. Clone Repository
```bash
Cloning into '/opt/render/project/src'...
```

### 2. Install Dependencies
```bash
npm install
# نصب ~100 packages
```

### 3. Build Frontend
```bash
npm run build
# Vite build
# Output: server/public/
```

### 4. Start Server
```bash
npm start
# Server listening on port 10000
```

### 5. Health Check
```bash
GET /
# Status: 200 OK
```

---

## ✅ تایید Deploy موفق

### علائم موفقیت:
```
✅ Status: "Live" (سبز)
✅ در Logs: "Server listening on port 10000"
✅ URL فعال است
✅ Health check موفق
```

### URL شما:
```
https://topping-express.onrender.com
```

**نکته**: URL دقیق در Dashboard نمایش داده می‌شود.

---

## 🧪 تست Deploy

### 1. باز کردن URL
```bash
# در مرورگر:
https://topping-express.onrender.com

# یا با curl:
curl https://topping-express.onrender.com
```

### 2. بررسی صفحه اصلی
```
✅ صفحه لود می‌شود
✅ فرم نمایش داده می‌شود
✅ بدون خطا
```

### 3. تست فرم
```
1. پر کردن اطلاعات فرستنده
2. پر کردن اطلاعات گیرنده
3. پر کردن اطلاعات بسته
4. دریافت quote
```

---

## 🗄️ تنظیم Database (اختیاری)

### گزینه 1: Render PostgreSQL

#### ایجاد Database
```
1. در Dashboard: "New +" → "PostgreSQL"
2. نام: topping-express-db
3. Region: Oregon (همان region web service)
4. Plan: Free یا Starter
5. Create Database
```

#### اتصال به Web Service
```
1. کپی "Internal Database URL"
2. در Web Service → Environment
3. اضافه کردن:
   DATABASE_URL=postgresql://...
4. Save Changes
5. Render اتوماتیک redeploy می‌کند
```

### گزینه 2: Neon (رایگان)

```
1. برو به: https://neon.tech
2. Sign up
3. Create new project
4. کپی connection string
5. اضافه کردن به Render Environment Variables
```

### گزینه 3: Supabase (رایگان)

```
1. برو به: https://supabase.com
2. Create new project
3. Settings → Database → Connection string
4. اضافه کردن به Render Environment Variables
```

---

## 📧 تنظیم Email Service (اختیاری)

### SendGrid (توصیه می‌شود)

#### ایجاد Account
```
1. برو به: https://sendgrid.com
2. Sign up (100 emails/day رایگان)
3. Settings → API Keys
4. Create API Key
5. کپی API key
```

#### اضافه کردن به Render
```
1. Web Service → Environment
2. اضافه کردن:
   SENDGRID_API_KEY=SG.xxxxx
3. Save Changes
```

### Postmark (جایگزین)

```
1. برو به: https://postmarkapp.com
2. Sign up
3. Create Server
4. API Tokens → Copy
5. اضافه کردن به Render:
   POSTMARK_API_KEY=xxxxx
```

---

## 🔄 Update کردن Deploy

### وقتی تغییرات جدید دارید:

```bash
# 1. Local changes
git add .
git commit -m "Update: ..."

# 2. Push to GitHub
git push

# 3. Render اتوماتیک redeploy می‌کند!
```

**نکته**: Render به صورت خودکار با هر push به GitHub، redeploy می‌کند.

---

## 🐛 عیب‌یابی

### مشکل: Build Failed

#### بررسی Logs
```
1. در Render Dashboard
2. کلیک روی service
3. مشاهده "Logs"
4. جستجو برای خطاها
```

#### علل معمول:
```
❌ Dependencies نصب نشدند
   → بررسی package.json
   
❌ Build command اشتباه
   → بررسی render.yaml
   
❌ Environment variables ناقص
   → اضافه کردن متغیرهای لازم
```

### مشکل: App Crashes

#### بررسی Runtime Logs
```
1. Logs → Runtime
2. جستجو برای error messages
```

#### علل معمول:
```
❌ Database connection failed
   → بررسی DATABASE_URL
   
❌ Port binding error
   → اطمینان از استفاده PORT از environment
   
❌ Missing environment variables
   → اضافه کردن متغیرهای لازم
```

### مشکل: Slow Response

#### Free Plan
```
⚠️ Sleep بعد از 15 دقیقه
   → اولین request بعد از sleep: 30-60 ثانیه
   → راه‌حل: Upgrade به Starter Plan
```

---

## 💰 هزینه‌ها

### Free Plan
```
✅ رایگان
✅ 750 ساعت در ماه
⚠️ Sleep بعد از 15 دقیقه بی‌فعالیت
⚠️ 512 MB RAM
⚠️ Shared CPU
```

### Starter Plan ($7/month)
```
✅ Always on
✅ بدون sleep
✅ 512 MB RAM
✅ Shared CPU
✅ بهتر برای production
```

### Professional Plan ($25/month)
```
✅ 2 GB RAM
✅ Dedicated CPU
✅ Auto-scaling
✅ برای traffic بالا
```

---

## 📈 Monitoring

### Render Dashboard
```
✅ Metrics: CPU, Memory, Requests
✅ Logs: Real-time
✅ Events: Deploy history
✅ Health checks
```

### Custom Domain (اختیاری)
```
1. Settings → Custom Domain
2. اضافه کردن domain خود
3. تنظیم DNS records
4. SSL اتوماتیک فعال می‌شود
```

---

## ✅ چک‌لیست Deploy

### قبل از Deploy
- [x] Code pushed to GitHub
- [x] render.yaml موجود است
- [x] Build موفق (local)
- [x] Server کار می‌کند (local)
- [ ] Render account ایجاد شد

### در حین Deploy
- [ ] Repository connected
- [ ] Service settings تنظیم شد
- [ ] Environment variables اضافه شد
- [ ] Deploy شروع شد
- [ ] Build موفق بود

### بعد از Deploy
- [ ] Status: "Live"
- [ ] URL باز می‌شود
- [ ] صفحه لود می‌شود
- [ ] فرم کار می‌کند
- [ ] API endpoints کار می‌کنند

---

## 🎯 خلاصه دستورات

### Render Setup
```
1. render.com → Sign up with GitHub
2. New + → Web Service
3. Connect: Topping_Express_usca
4. Settings:
   - Name: topping-express
   - Region: Oregon
   - Build: npm install && npm run build
   - Start: npm start
5. Create Web Service
6. منتظر "Live" شدن
```

### تست
```
https://topping-express.onrender.com
```

### Update
```bash
git push
# Render اتوماتیک redeploy می‌کند
```

---

## 📚 منابع

### Render Docs
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

### Support
- [Render Community](https://community.render.com)
- [Status Page](https://status.render.com)

---

## 🎉 موفقیت!

**بعد از Deploy موفق:**

✅ URL زنده: `https://topping-express.onrender.com`  
✅ Auto-deploy با هر push  
✅ SSL رایگان  
✅ Monitoring داخلی  
✅ آماده برای production  

**موفق باشید! 🚀**

---

**تاریخ**: 1 اکتبر 2025  
**وضعیت**: ✅ آماده برای Deploy  
**زمان تقریبی**: 5-10 دقیقه
