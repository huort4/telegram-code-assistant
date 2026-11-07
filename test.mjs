// تست محلی جریان اتصال مدل شخصی — بدون وابستگی خارجی
import worker from './worker.js';

// ---------- محیط شبیه‌سازی‌شده ----------
const kv = new Map();
const STATS = {
  get: async (k) => kv.get(k) ?? null,
  put: async (k, v, o) => kv.set(k, v),
  delete: async (k) => kv.delete(k)
};
const FILES = { get: async () => null, put: async () => {}, delete: async () => {}, list: async () => ({ keys: [] }) };
const DB = {
  prepare: () => ({
    bind: () => ({ run: async () => ({ meta: { changes: 1 } }), all: async () => ({ results: [] }) }),
    run: async () => ({ meta: { changes: 1 } }),
    all: async () => ({ results: [] })
  }),
  batch: async () => ({})
};
const env = { TELEGRAM_BOT_TOKEN: 'TEST', STATS, FILES, DB };

// ثبت پیام‌های تلگرام و درخواست‌های AI
const sent = [];
let aiCalls = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.includes('api.telegram.org')) {
    const body = JSON.parse(opts.body);
    sent.push({ endpoint: u.split('/').pop(), body });
    if (u.includes('answerCallbackQuery')) return new Response('{}');
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (u.includes('/chat/completions')) {
    aiCalls.push({ url: u, auth: opts.headers?.Authorization, body: JSON.parse(opts.body) });
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'OK', role: 'assistant' } }]
    }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response('{}');
};

let updateId = 1000;
const msg = (text, userId = 42) => ({ update_id: updateId++, message: { chat: { id: userId }, from: { id: userId, username: 'tester' }, message_id: Math.floor(Math.random() * 100000), text } });
const cb = (data, userId = 42) => ({ update_id: updateId++, callback_query: { id: 'cb1', from: { id: userId }, data, message: { chat: { id: userId }, message_id: 1 } } });
const fire = async (update) => {
  const req = new Request('http://x/webhook', { method: 'POST', body: JSON.stringify(update), headers: { 'Content-Type': 'application/json' } });
  await worker.fetch(req, env, { waitUntil: () => {} });
  await new Promise(r => setTimeout(r, 20));
};
const lastBotMsg = () => [...sent].reverse().find(s => s.endpoint === 'sendMessage');

// ---------- تست ----------
let failures = 0;
const check = (name, cond, extra) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + name + (cond ? '' : ' | ' + JSON.stringify(extra)));
  if (!cond) failures++;
};

// ۱) /start باید دکمه‌های شیشه‌ای داشته باشد
await fire(msg('/start'));
check('start با کیبورد شیشه‌ای', !!lastBotMsg().body.reply_markup?.inline_keyboard);

// ۲) /ai منو را نشان می‌دهد
await fire(msg('/ai'));
const menu = lastBotMsg();
check('منوی /ai', menu.body.text.includes('هوش مصنوعی شخصی'), menu.body.text);
check('دکمه اتصال', JSON.stringify(menu.body.reply_markup).includes('ai:connect'));

// ۳) کلیک روی دکمه اتصال → قدم ۱
await fire(cb('ai:connect'));
check('قدم ۱ Base URL', lastBotMsg().body.text.includes('قدم ۱'), lastBotMsg().body.text);

// ۴) URL نامعتبر رد می‌شود
await fire(msg('https://api.example.com'));
check('رد URL بدون /v1', lastBotMsg().body.text.includes('باید با /v1'), lastBotMsg().body.text);

// ۵) URL معتبر → قدم ۲
await fire(msg('https://api.example.com/v1/'));
check('قدم ۲ API Key', lastBotMsg().body.text.includes('قدم ۲'), lastBotMsg().body.text);

// ۶) کلید نامعتبر رد می‌شود
await fire(msg('short'));
check('رد کلید کوتاه', lastBotMsg().body.text.includes('معتبر'), lastBotMsg().body.text);

// ۷) کلید معتبر → پیام پاک می‌شود + قدم ۳
await fire(msg('sk-test-1234567890abcdef'));
const deleted = sent.some(s => s.endpoint === 'deleteMessage');
check('قدم ۳ نام مدل', lastBotMsg().body.text.includes('قدم ۳'), lastBotMsg().body.text);
check('پیام کلید پاک شد', deleted);

// ۸) نام مدل → تست اتصال به URL کاربر + ذخیره
aiCalls = [];
await fire(msg('gpt-4o-mini'));
check('تست به URL کاربر', aiCalls[0]?.url === 'https://api.example.com/v1/chat/completions', aiCalls[0]?.url);
check('مدل کاربر', aiCalls[0]?.body.model === 'gpt-4o-mini', aiCalls[0]?.body.model);
check('کلید کاربر', aiCalls[0]?.auth === 'Bearer sk-test-1234567890abcdef', aiCalls[0]?.auth);
check('پیام موفقیت', lastBotMsg().body.text.includes('متصل شدی'), lastBotMsg().body.text);
const conn = JSON.parse(kv.get('ai_conn:42'));
check('ذخیره در KV', conn.model === 'gpt-4o-mini' && conn.base_url === 'https://api.example.com/v1');

// ۹) جریان پس از اتصال غیرفعال است (پیام عادی به چت می‌رود)
aiCalls = [];
await fire(msg('سلام ربات'));
check('چت با مدل کاربر', aiCalls.some(c => c.url.includes('api.example.com') && c.body.model === 'gpt-4o-mini'), aiCalls.map(c => c.url));

// ۱۰) وضعیت منو بعد از اتصال
await fire(cb('ai:status'));
check('وضعیت: مدل کاربر', lastBotMsg().body.text.includes('gpt-4o-mini'), lastBotMsg().body.text);
check('کلید ماسک شده', lastBotMsg().body.text.includes('••••') && !lastBotMsg().body.text.includes('sk-test-1234567890abcdef'));

// ۱۱) حذف اتصال با دکمه
await fire(cb('ai:remove'));
check('حذف اتصال', !kv.has('ai_conn:42') && lastBotMsg().body.text.includes('حذف شد'));

// ۱۲) کاربر دوم مستقل است (تفکیک per-user)
await fire(cb('ai:connect', 77));
await fire(msg('https://api.user2.com/v1', 77));
await fire(msg('key-user2-abcdefgh', 77));
await fire(msg('llama-3.3-70b', 77));
aiCalls = [];
await fire(msg('hi', 77));
check('تفکیک کاربر دوم', aiCalls.some(c => c.url.includes('api.user2.com') && c.body.model === 'llama-3.3-70b'), aiCalls.map(c => c.url));
check('کاربر اول جدا', !kv.has('ai_conn:42'));

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TESTS FAILED`);
process.exit(failures === 0 ? 0 : 1);
