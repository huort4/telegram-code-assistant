# 🤖 دستیار کدنویسی تلگرام

ربات دستیار کدنویسی با پنل ادمین - اجرا روی Cloudflare Workers

## قابلیت‌ها

- 💬 چت هوشمند با Claude AI
- 🐛 دیباگ کد با شماره خط
- 📷 تحلیل اسکرین‌شات خطا
- 🗜️ تحلیل پروژه ZIP
- 🐙 یکپارچه‌سازی GitHub (پوش، برنچ، PR)
- 🖥️ پنل ادمین وب
- 🧠 اتصال مدل هوش مصنوعی شخصی هر کاربر (پولی یا رایگان) با دکمه‌های شیشه‌ای

## اتصال مدل شخصی (Bring Your Own Key)

کاربرانی که به مدل پولی دسترسی ندارند می‌توانند مدل خودشان را وصل کنند:

1. دستور `/ai` را بفرستند (یا دکمه «🔌 اتصال مدل شخصی» را بزنند)
2. **Base URL** سرویس را بفرستند — باید به `/v1` ختم شود (مثلاً `https://api.openai.com/v1`)
3. **API Key** را بفرستند — پیام حاوی کلید بلافاصله از چت پاک می‌شود
4. **نام مدل** را بفرستند — ربات اتصال را تست می‌کند و در صورت موفقیت وصل می‌شود

- هر سرویس سازگار با OpenAI API پشتیبانی می‌شود (OpenAI، Groq، OpenRouter و...)
- مشخصات هر کاربر جداگانه در KV ذخیره می‌شود (`ai_conn:<userId>`)
- پس از اتصال، همه قابلیت‌ها (چت، دیباگ، عکس، فایل، ZIP، ایجنت گیت‌هاب) با مدل خود کاربر کار می‌کنند
- حذف اتصال: `/ai off` یا دکمه «🗑 حذف اتصال»
- تست محلی: `node test.mjs`

## تنظیمات لازم

### Secrets (از طریق Cloudflare Dashboard یا Wrangler CLI)

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put OPENAI_API_KEY        # اختیاری
npx wrangler secret put ADMIN_SECRET           # اختیاری - برای پنل ادمین
npx wrangler secret put WEBHOOK_SECRET         # اختیاری
```

⚠️ نکته مهم: ورکر زنده در کلودفلر `silent-pine-e5cd` نام دارد (نه `telegram-code-assistant`) و توکن ربات در آن به‌صورت متغیر plain text در داشبورد تنظیم شده است. در اولین فرصت بهتر است به secret تبدیل شود. اگر توکن را از داشبورد حذف و با `wrangler secret put` دوباره تنظیم کنید، این مشکل برطرف می‌شود.

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
