// ============================================================
// نقطة انطلاق التطبيق: التوجيه بين الصفحات، الوضع الداكن، ربط الأحداث
// ============================================================

const VIEWS = ["dashboard", "bp", "sugar", "tools", "reports", "about"];

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("pst_theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("pst_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
      renderAllCharts(); // إعادة رسم الرسوم بألوان تناسب الوضع الجديد
    });
  });
}

function switchView(viewName) {
  VIEWS.forEach(v => {
    document.getElementById(`view-${v}`)?.classList.toggle("active", v === viewName);
  });
  document.querySelectorAll(".nav-item[data-view]").forEach(el => {
    el.classList.toggle("active", el.dataset.view === viewName);
  });
  const titles = {
    dashboard: "لوحة التحكم", bp: "قراءات ضغط الدم", sugar: "قراءات سكر الدم",
    tools: "الأدوات الصحية", reports: "التقارير", about: "عن المشروع"
  };
  document.getElementById("topbarTitle").textContent = titles[viewName] || "";
  const mobileTitle = document.getElementById("mobileTopbarTitle");
  if (mobileTitle) mobileTitle.textContent = titles[viewName] || "";
  window.scrollTo({ top: 0, behavior: "instant" });
  closeMobileSidebar();

  if (viewName === "bp") renderBPTable();
  if (viewName === "sugar") renderSugarTable();
  if (viewName === "dashboard") { renderDashboardStats(); renderAllCharts(); }
}

function initNav() {
  document.querySelectorAll(".nav-item[data-view]").forEach(el => {
    el.addEventListener("click", () => switchView(el.dataset.view));
  });
}

function initMobileSidebar() {
  const openBtn = document.getElementById("mobileMenuBtn");
  const closeBtn = document.getElementById("sidebarCloseBtn");
  const overlay = document.getElementById("sidebarOverlay");
  openBtn?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open-mobile");
    overlay.classList.add("show");
  });
  const close = () => closeMobileSidebar();
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
}
function closeMobileSidebar() {
  document.getElementById("sidebar")?.classList.remove("open-mobile");
  document.getElementById("sidebarOverlay")?.classList.remove("show");
}

function renderAuthDependentUI() {
  const authScreen = document.getElementById("authScreen");
  const appShell = document.getElementById("appShell");
  const loadingScreen = document.getElementById("appLoading");
  loadingScreen.style.display = "none";

  if (currentUser) {
    authScreen.style.display = "none";
    appShell.style.display = "flex";
    const name = currentUser.user_metadata?.full_name || currentUser.email;
    document.querySelectorAll(".userNameDisplay").forEach(el => el.textContent = name);
    document.querySelectorAll(".userEmailDisplay").forEach(el => el.textContent = currentUser.email);
    loadUserData();
  } else {
    authScreen.style.display = "grid";
    appShell.style.display = "none";
  }
}

async function loadUserData() {
  await fetchAllReadings();
  renderDashboardStats();
  renderAllCharts();
  renderBPTable();
  renderSugarTable();
}

function initGlobalEvents() {
  document.querySelectorAll(".logoutBtn").forEach(btn => btn.addEventListener("click", handleLogout));

  document.getElementById("addBPBtn")?.addEventListener("click", () => openBPModal());
  document.getElementById("addBPBtn2")?.addEventListener("click", () => openBPModal());
  document.getElementById("addSugarBtn")?.addEventListener("click", () => openSugarModal());
  document.getElementById("addSugarBtn2")?.addEventListener("click", () => openSugarModal());

  document.getElementById("bpForm").addEventListener("submit", handleBPFormSubmit);
  document.getElementById("sugarForm").addEventListener("submit", handleSugarFormSubmit);
  document.querySelectorAll(".closeBPModal").forEach(b => b.addEventListener("click", closeBPModal));
  document.querySelectorAll(".closeSugarModal").forEach(b => b.addEventListener("click", closeSugarModal));

  document.getElementById("bpSearch")?.addEventListener("input", debounce(renderBPTable, 200));
  document.getElementById("bpStatusFilter")?.addEventListener("change", renderBPTable);
  document.getElementById("sugarSearch")?.addEventListener("input", debounce(renderSugarTable, 200));
  document.getElementById("sugarStatusFilter")?.addEventListener("change", renderSugarTable);
  document.getElementById("sugarTypeFilter")?.addEventListener("change", renderSugarTable);

  document.getElementById("generateReportBtn")?.addEventListener("click", generatePDFReport);

  // إغلاق النوافذ المنبثقة عند الضغط على الخلفية
  document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", e => { if (e.target === ov) ov.classList.remove("show"); });
  });
}

function showInitError(message) {
  const loadingScreen = document.getElementById("appLoading");
  loadingScreen.innerHTML = `
    <svg class="wave-loader" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:.4;">
      <path d="M0 15 Q 8 2 16 15 T 32 15 T 48 15 T 64 15 T 80 15 T 96 15" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
    <div style="max-width:420px; text-align:center; padding:0 20px;">
      <p style="color:var(--danger); font-weight:800; margin-bottom:8px;">تعذّر الاتصال بـ Supabase</p>
      <p style="color:var(--text-faint); font-size:13.5px; line-height:1.9;">${message}</p>
      <p style="color:var(--text-faint); font-size:12.5px; margin-top:10px;">تأكد من وضع رابط ومفتاح مشروعك الصحيحين في ملف <code>js/config.js</code>، ومن تنفيذ ملف <code>sql/schema.sql</code> داخل مشروع Supabase.</p>
    </div>`;
  loadingScreen.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    initTheme();
    initNav();
    initMobileSidebar();
    initAuthUI();
    initGlobalEvents();
    initHealthTools();

    if (typeof SUPABASE_URL !== "string" || SUPABASE_URL.includes("YOUR_SUPABASE_URL") ||
        typeof SUPABASE_ANON_KEY !== "string" || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")) {
      showInitError("لم يتم إعداد بيانات مشروع Supabase بعد. ضع رابط مشروعك (Project URL) ومفتاحه العام (anon public key) في ملف js/config.js بدلاً من القيم الافتراضية.");
      return;
    }

    watchAuthState();
    getInitialSession().catch(err => {
      console.error(err);
      showInitError("حدث خطأ أثناء التحقق من جلسة الدخول. تأكد من صحة رابط ومفتاح Supabase في js/config.js.");
    });
  } catch (err) {
    console.error(err);
    showInitError("حدث خطأ غير متوقع أثناء تشغيل الموقع. افتح أدوات المطور (Console) في المتصفح لمزيد من التفاصيل.");
  }
});
