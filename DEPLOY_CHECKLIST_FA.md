# ✅ چک‌لیست Deploy به Render - گام به گام

**تاریخ**: 1 اکتبر 2025  
**زمان**: حدود 5 دقیقه

---

## 📝 قبل از شروع

### بررسی آمادگی:
- ✅ GitHub repository: `https://github.com/Hamidbarzin/Topping_Express_usca`
- ✅ Code آخرین نسخه push شده
- ✅ Build موفق (تست شده)
- ✅ render.yaml موجود است

**همه چیز آماده است! ✅**

---

## 🚀 مراحل Deploy (دقیقاً چه کار کنید)

### گام 1: ورود به Render

#### 1.1 باز کردن سایت
```
🌐 Render باز شده: https://render.com
```

#### 1.2 ثبت‌نام یا ورود
```
اگر حساب ندارید:
  1. کلیک "Get Started" یا "Sign Up"
  2. انتخاب "Sign up with GitHub" ⭐ مهم
  3. وارد GitHub شوید
  4. کلیک "Authorize Render"
  5. تایید email (اگر لازم باشد)

اگر حساب دارید:
  1. کلیک "Log In"
  2. وارد شوید
```

**نکته مهم**: حتماً با GitHub sign up کنید تا راحت‌تر repository را connect کنید.

---

### گام 2: ایجاد Web Service

#### 2.1 رفتن به Dashboard
```
بعد از ورود، به Dashboard می‌روید
```

#### 2.2 ایجاد Service جدید
```
1. در بالای صفحه، کلیک "New +" (دکمه آبی)
2. از منوی باز شده، انتخاب "Web Service"
```

---

### گام 3: Connect کردن Repository

#### 3.1 پیدا کردن Repository
```
در صفحه "Create a new Web Service":

1. بخش "Connect a repository" را ببینید
2. لیست repositories GitHub شما نمایش داده می‌شود
3. جستجو کنید: "Topping_Express_usca"
```

#### 3.2 Connect کردن
```
کنار repository خود، کلیک "Connect"
```

**اگر repository را نمی‌بینید:**
```
1. کلیک "Configure account" (پایین صفحه)
2. در صفحه GitHub که باز می‌شود:
   - Repository access → "All repositories"
   یا
   - "Only select repositories" → انتخاب "Topping_Express_usca"
3. کلیک "Save"
4. برگردید به Render
5. صفحه را refresh کنید
6. حالا repository را می‌بینید
```

---

### گام 4: تنظیمات Service

بعد از Connect، صفحه تنظیمات باز می‌شود:

#### 4.1 اطلاعات پایه
```
Name: topping-express
(یا هر اسم دیگری که دوست دارید)

Region: Oregon (US West)
(یا هر region دیگری)

Branch: main
(باید main باشد)

Root Directory: (خالی بگذارید)
```

#### 4.2 Runtime
```
Runtime: Node
(اتوماتیک تشخیص داده می‌شود)
```

#### 4.3 Build Command
```
Build Command: npm install && npm run build
(باید دقیقاً همین باشد)
```

#### 4.4 Start Command
```
Start Command: npm start
(باید دقیقاً همین باشد)
```

#### 4.5 انتخاب Plan
```
Plan: Free
(برای شروع و تست)

یا

Plan: Starter ($7/month)
(اگر می‌خواهید همیشه روشن باشد)
```

**تفاوت Plans:**
```
Free:
  ✅ رایگان
  ⚠️ بعد از 15 دقیقه بی‌فعالیت خاموش می‌شود
  ⚠️ اولین بار باز کردن: 30-60 ثانیه طول می‌کشد

Starter ($7/month):
  ✅ همیشه روشن
  ✅ سریع
  ✅ بهتر برای production
```

---

### گام 5: Environment Variables (اختیاری)

#### 5.1 باز کردن بخش Environment
```
در همان صفحه، scroll کنید پایین
بخش "Environment Variables" را پیدا کنید
```

#### 5.2 اضافه کردن متغیرها (اختیاری)
```
فعلاً نیازی نیست چیزی اضافه کنید!
Render اتوماتیک این‌ها را تنظیم می‌کند:
  - NODE_ENV=production
  - PORT=10000
  - SESSION_SECRET (اتوماتیک)
```

**بعداً می‌توانید اضافه کنید:**
```
- DATABASE_URL (اگر database دارید)
- SENDGRID_API_KEY (اگر email می‌خواهید)
- SHIPPING_API_KEY (اگر API دارید)
```

---

### گام 6: Deploy!

#### 6.1 شروع Deploy
```
1. همه تنظیمات را بررسی کنید
2. پایین صفحه، کلیک "Create Web Service" (دکمه آبی بزرگ)
```

#### 6.2 مشاهده Progress
```
Render شروع به کار می‌کند:

1. Cloning repository...
2. Installing dependencies...
3. Building...
4. Starting server...
5. Health check...
```

**زمان تقریبی**: 3-5 دقیقه

#### 6.3 مشاهده Logs
```
در صفحه service:
- بخش "Logs" را ببینید
- پیام‌های build و deploy را مشاهده کنید
```

---

### گام 7: تایید موفقیت

#### 7.1 بررسی Status
```
در بالای صفحه، status را ببینید:

❌ Building... (در حال build)
❌ Deploying... (در حال deploy)
✅ Live (موفق! 🎉)
```

#### 7.2 پیدا کردن URL
```
در بالای صفحه، URL شما نمایش داده می‌شود:

https://topping-express-xxxx.onrender.com

(xxxx یک کد تصادفی است)
```

#### 7.3 تست کردن
```
1. کلیک روی URL
2. صفحه باز می‌شود
3. فرم را ببینید
4. تست کنید!
```

---

## 🎉 موفقیت!

### اگر همه چیز درست باشد:

```
✅ Status: "Live" (سبز)
✅ URL باز می‌شود
✅ صفحه فرم نمایش داده می‌شود
✅ بدون خطا
```

### URL شما:
```
https://topping-express-xxxx.onrender.com
```

---

## 🐛 اگر مشکل داشتید

### مشکل 1: Build Failed

#### علائم:
```
❌ Status: "Build failed"
❌ در Logs: خطاهای قرمز
```

#### راه‌حل:
```
1. در صفحه service، کلیک "Logs"
2. خطاها را بخوانید
3. معمولاً یکی از این‌هاست:
   - Build command اشتباه
   - Dependencies نصب نشدند
   - Node version سازگار نیست

4. اگر نیاز به کمک دارید، Logs را کپی کنید
```

### مشکل 2: Deploy Failed

#### علائم:
```
❌ Status: "Deploy failed"
❌ Server شروع نمی‌شود
```

#### راه‌حل:
```
1. بررسی Logs
2. معمولاً یکی از این‌هاست:
   - Start command اشتباه
   - Port binding error
   - Environment variables ناقص

3. بررسی کنید:
   - Start Command: npm start
   - PORT در code از environment خوانده می‌شود
```

### مشکل 3: Repository پیدا نمی‌شود

#### راه‌حل:
```
1. کلیک "Configure account"
2. در GitHub:
   - Repository access → "All repositories"
   یا
   - Select repositories → انتخاب repository
3. Save
4. برگشت به Render و refresh
```

---

## 🔄 Update کردن (بعداً)

### وقتی تغییرات جدید دارید:

```bash
# 1. در local:
git add .
git commit -m "تغییرات جدید"
git push

# 2. Render اتوماتیک:
✅ تغییرات را تشخیص می‌دهد
✅ اتوماتیک redeploy می‌کند
✅ بعد از 3-5 دقیقه، سایت update می‌شود
```

**نیازی به کار دستی نیست!**

---

## 📊 مانیتورینگ

### در Dashboard Render:

```
✅ Metrics: CPU, Memory, Requests
✅ Logs: Real-time logs
✅ Events: Deploy history
✅ Settings: تنظیمات
```

---

## 💡 نکات مهم

### 1. Free Plan
```
⚠️ بعد از 15 دقیقه بی‌فعالیت خاموش می‌شود
⚠️ اولین request بعد از خاموشی: 30-60 ثانیه
💡 برای production: Starter Plan ($7/month)
```

### 2. Auto-Deploy
```
✅ با هر git push، اتوماتیک redeploy می‌شود
✅ نیازی به کار دستی نیست
```

### 3. SSL
```
✅ SSL رایگان و اتوماتیک
✅ HTTPS فعال است
```

### 4. Custom Domain (اختیاری)
```
می‌توانید domain خودتان را connect کنید:
1. Settings → Custom Domain
2. اضافه کردن domain
3. تنظیم DNS
```

---

## ✅ خلاصه مراحل

```
1. render.com → Sign up with GitHub
2. New + → Web Service
3. Connect repository: Topping_Express_usca
4. تنظیمات:
   - Name: topping-express
   - Build: npm install && npm run build
   - Start: npm start
   - Plan: Free یا Starter
5. Create Web Service
6. منتظر 3-5 دقیقه
7. ✅ Live!
```

---

## 🎯 چک‌لیست نهایی

### قبل از Deploy
- [x] GitHub repository آماده
- [x] Code push شده
- [x] render.yaml موجود
- [ ] Render account ساخته شد

### در حین Deploy
- [ ] Repository connected
- [ ] تنظیمات درست
- [ ] Deploy شروع شد
- [ ] Build موفق

### بعد از Deploy
- [ ] Status: "Live"
- [ ] URL کار می‌کند
- [ ] صفحه لود می‌شود
- [ ] فرم کار می‌کند

---

## 📞 نیاز به کمک؟

### اگر گیر کردید:

1. **Logs را بررسی کنید** (معمولاً مشکل مشخص است)
2. **Screenshot بگیرید** از خطا
3. **بپرسید** - من کمک می‌کنم!

---

## 🎉 موفق باشید!

**همه چیز آماده است!**
**فقط این مراحل را دنبال کنید**
**5 دقیقه بیشتر طول نمی‌کشد**

**شروع کنید:** https://render.com

---

**تاریخ**: 1 اکتبر 2025  
**آماده برای**: Deploy  
**زمان**: 5 دقیقه
