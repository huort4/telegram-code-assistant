# 🤖 دستیار کدنویسی تلگرام

ربات دستیار کدنویسی با پنل ادمین - اجرا روی Cloudflare Workers

## قابلیت‌ها

- 💬 چت هوشمند با Claude AI
- 🐛 دیباگ کد با شماره خط
- 📷 تحلیل اسکرین‌شات خطا
- 🗜️ تحلیل پروژه ZIP
- 🐙 یکپارچه‌سازی GitHub (پوش، برنچ، PR)
- 🖥️ پنل ادمین وب

## تنظیمات لازم

### Secrets (از طریق Cloudflare Dashboard یا Wrangler CLI)

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put OPENAI_API_KEY        # اختیاری
npx wrangler secret put ADMIN_SECRET           # اختیاری - برای پنل ادمین
npx wrangler secret put WEBHOOK_SECRET         # اختیاری
```

### Bindings

- **D1 Database**: برای حافظه گفتگو و کاربران
- **KV Namespaces**: 
  - `STATS`: آمار، تنظیمات، توکن گیت‌هاب، فضای کار
  - `FILES`: متادیتای فایل‌ها

## استقرار

```bash
# نصب Wrangler
npm install -g wrangler

# احراز هویت
wrangler login

# استقرار
wrangler deploy

# یا از طریق Git Integration در Cloudflare Dashboard
```

## فایل‌ها

- `worker.js`: کد اصلی ورکر
- `wrangler.toml`: تنظیمات Cloudflare
- `.gitignore`: فایل‌های نادیده گرفته شده

## امنیت

- توکن‌های GitHub هر کاربر جداگانه در KV ذخیره می‌شود
- فایل‌های `.env` و رمزها در ZIP نادیده گرفته می‌شوند
- پیام حاوی توکن بلافاصله از چت پاک می‌شود

---
پروژه شخصی
