# 📁 راهنمای ساختار پروژه Topping Express

## 🎯 ساختار فعلی (بهینه شده و استاندارد)

```
Topping_Express_usca/
│
├── 📁 client/                          # Frontend Application (React + TypeScript)
│   ├── index.html                      # HTML ورودی
│   ├── SENDER_FORM_IMPLEMENTATION.md   # مستندات فرم فرستنده
│   │
│   └── 📁 src/                         # کدهای منبع Frontend
│       ├── main.tsx                    # نقطه ورود React
│       ├── App.tsx                     # Shell اصلی برنامه + Routing
│       ├── index.css                   # استایل‌های Global + Tailwind
│       │
│       ├── 📁 components/              # کامپوننت‌های قابل استفاده مجدد
│       │   ├── multi-step-form.tsx     # فرم چندمرحله‌ای اصلی
│       │   │
│       │   ├── 📁 steps/               # مراحل فرم (4 مرحله)
│       │   │   ├── step-sender.tsx     # مرحله 1: اطلاعات فرستنده
│       │   │   ├── step-recipient.tsx  # مرحله 2: اطلاعات گیرنده
│       │   │   ├── step-package.tsx    # مرحله 3: جزئیات بسته
│       │   │   └── step-quote.tsx      # مرحله 4: نتایج قیمت
│       │   │
│       │   └── 📁 ui/                  # کامپوننت‌های UI (shadcn/ui)
│       │       ├── button.tsx
│       │       ├── input.tsx
│       │       ├── card.tsx
│       │       ├── alert.tsx
│       │       ├── badge.tsx
│       │       ├── progress.tsx
│       │       ├── toast.tsx
│       │       └── ... (سایر کامپوننت‌ها)
│       │
│       ├── 📁 pages/                   # صفحات اصلی
│       │   ├── shipping-quote.tsx      # صفحه اصلی (دریافت قیمت)
│       │   ├── success.tsx             # صفحه تایید سفارش
│       │   └── not-found.tsx           # صفحه 404
│       │
│       ├── 📁 hooks/                   # هوک‌های سفارشی React
│       │   └── use-toast.ts            # هوک نمایش Toast
│       │
│       └── 📁 lib/                     # توابع کمکی و یوتیلیتی
│           └── queryClient.ts          # تنظیمات React Query
│
├── 📁 server/                          # Backend Application (Express + Node.js)
│   ├── index.js                        # سرور Express اصلی
│   │
│   └── 📁 public/                      # فایل‌های استاتیک (خروجی Build)
│       ├── index.html                  # HTML نهایی
│       ├── clear-cache.html            # صفحه پاک‌سازی Cache
│       └── 📁 assets/                  # تصاویر، JS، CSS بیلد شده
│           ├── index-[hash].js
│           ├── index-[hash].css
│           └── logo.png
│
├── 📁 shared/                          # کدهای مشترک بین Frontend و Backend
│   └── schema.ts                       # Zod Schemas + TypeScript Types
│
├── 📁 node_modules/                    # وابستگی‌های نصب شده
│
├── 📁 dist/                            # خروجی Build برای Production
│
├── 📄 package.json                     # وابستگی‌ها و اسکریپت‌ها
├── 📄 package-lock.json                # قفل نسخه وابستگی‌ها
│
├── 📄 vite.config.ts                   # تنظیمات Vite (Build Tool)
├── 📄 tailwind.config.ts               # تنظیمات Tailwind CSS
├── 📄 tsconfig.json                    # تنظیمات TypeScript
├── 📄 tsconfig.node.json               # تنظیمات TypeScript برای Node
├── 📄 postcss.config.js                # تنظیمات PostCSS
│
├── 📄 .env                             # متغیرهای محیطی (نباید commit شود)
├── 📄 .gitignore                       # فایل‌های نادیده گرفته شده توسط Git
├── 📄 Dockerfile                       # تنظیمات Docker
├── 📄 .dockerignore                    # فایل‌های نادیده گرفته شده توسط Docker
│
└── 📄 Documentation/                   # مستندات
    ├── README.md                       # راهنمای اصلی پروژه
    ├── QUICK_START.md                  # راهنمای شروع سریع
    ├── IMPLEMENTATION_COMPLETE.md      # جزئیات فنی پیاده‌سازی
    └── IMPLEMENTATION_SUMMARY.md       # خلاصه پیاده‌سازی
```

---

## 📂 توضیح هر پوشه

### 1️⃣ `client/` - Frontend Application

**هدف**: تمام کدهای مربوط به رابط کاربری (UI) و تجربه کاربری (UX)

#### `client/src/`
ریشه کدهای منبع React

#### `client/src/components/`
کامپوننت‌های قابل استفاده مجدد

**زیرپوشه‌ها:**
- **`steps/`**: مراحل فرم چندمرحله‌ای
  - `step-sender.tsx` - فرم اطلاعات فرستنده (نام، آدرس، استان، کدپستی)
  - `step-recipient.tsx` - فرم اطلاعات گیرنده
  - `step-package.tsx` - فرم جزئیات بسته (ابعاد، وزن، ارزش)
  - `step-quote.tsx` - نمایش نتایج قیمت و انتخاب سرویس

- **`ui/`**: کامپوننت‌های پایه UI (از shadcn/ui)
  - کامپوننت‌های استاندارد مانند Button, Input, Card, Alert
  - تمام کامپوننت‌ها با Tailwind CSS استایل شده‌اند
  - قابل استفاده مجدد در تمام پروژه

#### `client/src/pages/`
صفحات اصلی برنامه

- **`shipping-quote.tsx`**: صفحه اصلی - فرم دریافت قیمت حمل
- **`success.tsx`**: صفحه تایید سفارش - نمایش جزئیات سفارش ثبت شده
- **`not-found.tsx`**: صفحه 404 - برای URLهای نامعتبر

#### `client/src/hooks/`
هوک‌های سفارشی React

- **`use-toast.ts`**: مدیریت نمایش پیام‌های Toast (اعلان‌ها)

#### `client/src/lib/`
توابع کمکی و یوتیلیتی

- **`queryClient.ts`**: تنظیمات React Query برای مدیریت state سرور

---

### 2️⃣ `server/` - Backend Application

**هدف**: API، منطق کسب‌وکار، اتصال به دیتابیس

#### `server/index.js`
سرور Express اصلی که شامل:
- تعریف APIها
- مدیریت درخواست‌ها
- اتصال به دیتابیس
- ارسال ایمیل
- تولید فاکتور PDF

#### `server/public/`
فایل‌های استاتیک که توسط Vite build می‌شوند
- خروجی نهایی Frontend
- تصاویر و آیکون‌ها
- فایل‌های JS و CSS بهینه شده

---

### 3️⃣ `shared/` - کدهای مشترک

**هدف**: کدهایی که هم در Frontend و هم در Backend استفاده می‌شوند

#### `shared/schema.ts`
- **Zod Schemas**: اعتبارسنجی داده‌ها
- **TypeScript Types**: تایپ‌های مشترک
- **Interfaces**: رابط‌های داده‌ای

**مثال:**
```typescript
// Schema برای آدرس
export const addressSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  province: z.string().min(2),
  // ...
});

// Type برای استفاده در Frontend و Backend
export type Address = z.infer<typeof addressSchema>;
```

---

## 🔄 جریان داده در پروژه

```
┌─────────────────────────────────────────────────────────────┐
│                         کاربر                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    client/src/pages/                         │
│                  shipping-quote.tsx                          │
│                  (صفحه اصلی)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              client/src/components/                          │
│              multi-step-form.tsx                             │
│              (مدیریت فرم چندمرحله‌ای)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ step-sender  │ │step-recipient│ │ step-package │
│   (مرحله 1) │ │   (مرحله 2) │ │   (مرحله 3) │
└──────────────┘ └──────────────┘ └──────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Validation (shared/schema.ts)               │
│                  اعتبارسنجی با Zod                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Call: POST /api/quote                   │
│                  (ارسال به Backend)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    server/index.js                           │
│                    (پردازش در Backend)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              client/src/components/steps/                    │
│              step-quote.tsx                                  │
│              (نمایش نتایج - مرحله 4)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Call: POST /api/orders                  │
│                  (ثبت سفارش)                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  client/src/pages/                           │
│                  success.tsx                                 │
│                  (صفحه تایید)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 نام‌گذاری فایل‌ها (Naming Conventions)

### کامپوننت‌ها
- **PascalCase** برای کامپوننت‌های React
- مثال: `MultiStepForm.tsx`, `StepSender.tsx`

### هوک‌ها
- **camelCase** با پیشوند `use`
- مثال: `useToast.ts`, `useForm.ts`

### یوتیلیتی‌ها
- **kebab-case** یا **camelCase**
- مثال: `queryClient.ts`, `api-client.ts`

### صفحات
- **kebab-case**
- مثال: `shipping-quote.tsx`, `not-found.tsx`

---

## 📦 Import Paths (مسیرهای Import)

### Path Aliases تنظیم شده:

```typescript
// در tsconfig.json و vite.config.ts
{
  "@/*": ["./client/src/*"],
  "@shared/*": ["./shared/*"]
}
```

### نحوه استفاده:

```typescript
// ❌ بد - مسیر نسبی طولانی
import { Button } from '../../../components/ui/button';

// ✅ خوب - استفاده از alias
import { Button } from '@/components/ui/button';

// ✅ Import از shared
import { addressSchema } from '@shared/schema';
```

---

## 🔧 فایل‌های تنظیمات

### `vite.config.ts`
تنظیمات Vite (Build Tool):
- Path aliases
- Proxy برای API
- Build output directory
- Plugins

### `tailwind.config.ts`
تنظیمات Tailwind CSS:
- رنگ‌های سفارشی
- فونت‌ها
- Breakpoints
- Plugins

### `tsconfig.json`
تنظیمات TypeScript:
- Strict mode
- Path aliases
- Target ES version
- Module resolution

### `package.json`
- لیست dependencies
- Scripts (dev, build, start)
- Metadata پروژه

---

## 🚀 Scripts مهم

```json
{
  "scripts": {
    "dev": "vite",                    // شروع dev server
    "build": "vite build",            // build برای production
    "start": "node server/index.js",  // اجرای production server
    "check": "tsc",                   // بررسی type errors
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  }
}
```

---

## 📋 بهترین روش‌ها (Best Practices)

### 1. جداسازی Concerns
- ✅ UI components در `components/ui/`
- ✅ Business logic در `lib/` یا `hooks/`
- ✅ Pages فقط composition و routing
- ✅ Backend logic در `server/`

### 2. استفاده از TypeScript
- ✅ همه فایل‌ها `.ts` یا `.tsx`
- ✅ تعریف types در `shared/schema.ts`
- ✅ استفاده از Zod برای runtime validation

### 3. Component Structure
```typescript
// ✅ ساختار استاندارد کامپوننت
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Props } from '@shared/schema';

export default function MyComponent({ prop1, prop2 }: Props) {
  const [state, setState] = useState();
  
  const handleAction = () => {
    // logic
  };
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 4. Error Handling
```typescript
// ✅ همیشه safe defaults
const safeData = {
  items: Array.isArray(data?.items) ? data.items : []
};

// ✅ try-catch برای API calls
try {
  const response = await fetch('/api/quote');
  // ...
} catch (error) {
  console.error(error);
  setData(defaultValue);
}
```

---

## 🗂️ فایل‌هایی که نباید Commit شوند

در `.gitignore`:

```
# Dependencies
node_modules/

# Build outputs
dist/
server/public/assets/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## 📊 اندازه و پیچیدگی

| بخش | تعداد فایل | خطوط کد (تقریبی) |
|-----|-----------|------------------|
| `client/src/components/` | 8+ | 1,500+ |
| `client/src/pages/` | 3 | 500+ |
| `client/src/hooks/` | 1 | 200+ |
| `client/src/lib/` | 1 | 50+ |
| `server/` | 1 | 1,000+ |
| `shared/` | 1 | 200+ |
| **جمع کل** | **15+** | **~3,500+** |

---

## 🎯 نتیجه‌گیری

این ساختار:
- ✅ **Scalable**: قابل گسترش برای features جدید
- ✅ **Maintainable**: قابل نگهداری و debug
- ✅ **Standard**: مطابق با best practices
- ✅ **Type-Safe**: با TypeScript و Zod
- ✅ **Organized**: هر چیز جای خودش دارد

---

**آخرین بروزرسانی**: 30 سپتامبر 2025  
**وضعیت**: ✅ بهینه شده و آماده برای توسعه
