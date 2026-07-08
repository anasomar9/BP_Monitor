// ============================================================
// المصادقة: إنشاء حساب، تسجيل دخول، تسجيل خروج، متابعة الجلسة
// ============================================================

let currentUser = null;

function initAuthUI() {
  const loginTabBtn = document.getElementById("tabLoginBtn");
  const signupTabBtn = document.getElementById("tabSignupBtn");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  loginTabBtn.addEventListener("click", () => switchAuthTab("login"));
  signupTabBtn.addEventListener("click", () => switchAuthTab("signup"));
  document.getElementById("goSignup").addEventListener("click", () => switchAuthTab("signup"));
  document.getElementById("goLogin").addEventListener("click", () => switchAuthTab("login"));

  loginForm.addEventListener("submit", handleLogin);
  signupForm.addEventListener("submit", handleSignup);

  function switchAuthTab(which) {
    const isLogin = which === "login";
    loginTabBtn.classList.toggle("active", isLogin);
    signupTabBtn.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("active", isLogin);
    signupForm.classList.toggle("active", !isLogin);
    hideFormMsg("loginMsg"); hideFormMsg("signupMsg");
  }
}

function showFormMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `form-msg show ${type}`;
}
function hideFormMsg(id) {
  const el = document.getElementById(id);
  el.className = "form-msg";
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const btn = document.getElementById("signupSubmitBtn");

  if (password.length < 6) {
    showFormMsg("signupMsg", "كلمة المرور يجب ألا تقل عن 6 أحرف.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "جارٍ إنشاء الحساب...";
  hideFormMsg("signupMsg");

  const { data, error } = await supabaseClient.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });

  btn.disabled = false;
  btn.textContent = "إنشاء حساب";

  if (error) {
    showFormMsg("signupMsg", translateAuthError(error.message), "error");
    return;
  }

  if (data.user && !data.session) {
    showFormMsg("signupMsg", "تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.", "success");
    return;
  }

  showToast("مرحبًا بك! تم إنشاء حسابك بنجاح.", "success");
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const btn = document.getElementById("loginSubmitBtn");

  btn.disabled = true;
  btn.textContent = "جارٍ تسجيل الدخول...";
  hideFormMsg("loginMsg");

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = "تسجيل الدخول";

  if (error) {
    showFormMsg("loginMsg", translateAuthError(error.message), "error");
    return;
  }
  showToast("تم تسجيل الدخول بنجاح", "success");
}

async function handleLogout() {
  const ok = await confirmDialog({
    title: "تسجيل الخروج",
    message: "هل تريد تسجيل الخروج من حسابك؟",
    confirmText: "تسجيل الخروج",
    danger: true
  });
  if (!ok) return;
  await supabaseClient.auth.signOut();
  showToast("تم تسجيل الخروج", "default");
}

function translateAuthError(msg) {
  const map = {
    "Invalid login credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "User already registered": "هذا البريد الإلكتروني مسجّل بالفعل.",
    "Email not confirmed": "لم يتم تأكيد البريد الإلكتروني بعد.",
    "Password should be at least 6 characters": "كلمة المرور يجب ألا تقل عن 6 أحرف.",
    "Failed to fetch": "تعذّر الاتصال بالخادم. تأكد من صحة رابط ومفتاح Supabase في js/config.js ومن اتصالك بالإنترنت.",
    "Invalid API key": "مفتاح Supabase (anon key) الموجود في js/config.js غير صحيح.",
    "signups not allowed for this instance": "التسجيل عبر البريد الإلكتروني غير مفعّل في مشروع Supabase. فعّله من Authentication > Providers."
  };
  // نعرض الرسالة المترجمة إن وُجدت، وإلا نعرض رسالة Supabase الأصلية كما هي حتى يمكن تشخيص السبب الحقيقي
  return map[msg] || `تعذّر إتمام العملية: ${msg}`;
}

// متابعة حالة الجلسة (دخول / خروج) وتحديث الواجهة تلقائيًا
function watchAuthState() {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    currentUser = session ? session.user : null;
    renderAuthDependentUI();
  });
}

async function getInitialSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  currentUser = data.session ? data.session.user : null;
  renderAuthDependentUI();
}
