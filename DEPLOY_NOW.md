# 🚀 راهنمای سریع Deploy

تمام تغییرات آماده است! فقط یکی از این دو روش را انجام دهید:

## ✅ روش ۱: استفاده از UI (ساده‌ترین!)

1. **چپ sidebar** در Replit → آیکون **Version Control** (🌿)
2. دکمه **"Commit all & push"** را بزنید
3. تمام! 🎉

## ✅ روش ۲: استفاده از Shell (یک خط!)

در Shell پایین صفحه، این دستور را اجرا کنید:

```bash
bash PUSH_TO_GITHUB.sh
```

---

## بعد از Push موفق:

1. ✅ برید Render Dashboard
2. ✅ منتظر بمانید تا Deploy جدید شروع شود (خودکار!)
3. ✅ Build Logs را چک کنید - باید ببینید: `✓ vite build`
4. ✅ وبسایت باید کار کند!

---

## فایل‌هایی که تغییر کرده‌اند:

- ✅ `render.yaml` - Build command درست شد
- ✅ `package.json` - Build script با npx vite
- ✅ `server/index.js` - Auto database setup + dynamic URLs
- ✅ `DEPLOYMENT.md` - مستندات کامل
- ✅ `.env.example` - نمونه environment variables

همه چیز آماده است! 🚀
