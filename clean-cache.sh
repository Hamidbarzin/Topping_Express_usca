#!/bin/bash

# 🧹 اسکریپت پاک‌سازی Cache و فایل‌های موقت
# استفاده: ./clean-cache.sh

echo "🧹 شروع پاک‌سازی cache و فایل‌های موقت..."

# پاک کردن cache directories
echo "📁 پاک کردن cache directories..."
rm -rf .parcel-cache
rm -rf .turbo
rm -rf .vite
rm -rf .cache
rm -rf .eslintcache
rm -rf .stylelintcache

# پاک کردن build outputs
echo "📦 پاک کردن build outputs..."
rm -rf dist
rm -rf build
rm -rf .next
rm -rf out
rm -rf server/public/assets/*.js
rm -rf server/public/assets/*.css

# پاک کردن log files
echo "📝 پاک کردن log files..."
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# پاک کردن temporary files
echo "🗑️  پاک کردن temporary files..."
rm -rf tmp
rm -rf temp
rm -f *.tmp

# پاک کردن OS specific files
echo "💻 پاک کردن OS specific files..."
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
find . -name "Desktop.ini" -type f -delete

echo "✅ پاک‌سازی با موفقیت انجام شد!"
echo ""
echo "📊 فضای آزاد شده:"
du -sh . 2>/dev/null || echo "محاسبه فضا در دسترس نیست"
