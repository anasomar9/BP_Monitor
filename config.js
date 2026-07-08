// ============================================================
// إعدادات الاتصال بـ Supabase
// ضع بيانات مشروعك هنا (Settings > API في لوحة تحكم Supabase)
// ============================================================
const SUPABASE_URL = "https://wjvvnxjlcabzjqflidof.supabase.co"; // مثال: https://xxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_OZJ3F3qyi6dbUWKK2pH7qQ_beL19XiR";

// إنشاء عميل Supabase (المكتبة محمّلة عبر CDN في index.html باسم supabase)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
