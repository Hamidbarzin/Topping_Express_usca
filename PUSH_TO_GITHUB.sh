#!/bin/bash

# این اسکریپت تغییرات رو به GitHub push می‌کنه
# فقط یکبار اجرا کنید: bash PUSH_TO_GITHUB.sh

echo "🚀 شروع push به GitHub..."

# اضافه کردن فایل‌های تغییر یافته
git add render.yaml package.json server/index.js DEPLOYMENT.md .env.example

# Commit
git commit -m "Fix production build configuration for Render deployment"

# Push
echo "📤 در حال push به GitHub..."
git push origin main

echo "✅ تموم شد! برید Render Dashboard و منتظر deploy باشید."
