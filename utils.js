// ============================================================
// دوال مساعدة عامة + منطق التقييم التوعوي للقراءات
// تنبيه: كل التقييمات هنا عامة لأغراض التوعية فقط وليست تشخيصًا طبيًا
// ============================================================

const STATUS_LABELS = {
  low: "منخفض",
  normal: "طبيعي",
  high: "مرتفع",
  very_high: "مرتفع جدًا"
};

const READING_TYPE_LABELS = {
  fasting: "صائم",
  before_meal: "قبل الأكل",
  after_meal: "بعد الأكل",
  random: "عشوائي"
};

/* ---------------- تقييم ضغط الدم ---------------- */
function evaluateBP(systolic, diastolic) {
  systolic = Number(systolic);
  diastolic = Number(diastolic);

  if (systolic >= 180 || diastolic >= 120) {
    return {
      status: "very_high",
      message: "قراءة مرتفعة جدًا قد تشير لحالة طارئة. يُنصح بالتواصل مع الطبيب أو الطوارئ فورًا."
    };
  }
  if (systolic < 90 || diastolic < 60) {
    return {
      status: "low",
      message: "ضغط الدم منخفض. إن صاحبته أعراض كدوخة أو إغماء يُستحسن استشارة الطبيب."
    };
  }
  if (systolic < 120 && diastolic < 80) {
    return {
      status: "normal",
      message: "ضغط الدم ضمن المعدل الطبيعي. حافظ على نمط حياتك الصحي."
    };
  }
  if ((systolic >= 120 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      status: "high",
      message: "ضغط الدم مرتفع قليلًا. راقب قراءاتك وقلل الملح والتوتر، وشاور الطبيب إن تكرر الارتفاع."
    };
  }
  return {
    status: "very_high",
    message: "ضغط الدم مرتفع بشكل ملحوظ. يُنصح بمراجعة الطبيب لتقييم الحالة."
  };
}

/* ---------------- تقييم سكر الدم ---------------- */
// النطاقات تقريبية وعامة بوحدة mg/dL لأغراض التوعية فقط
const SUGAR_RANGES = {
  fasting:     { low: 70, normalMax: 99,  highMax: 125 },
  before_meal: { low: 70, normalMax: 130, highMax: 180 },
  after_meal:  { low: 70, normalMax: 139, highMax: 199 },
  random:      { low: 70, normalMax: 139, highMax: 199 }
};

function evaluateSugar(value, type) {
  value = Number(value);
  const r = SUGAR_RANGES[type] || SUGAR_RANGES.random;

  if (value < r.low) {
    return {
      status: "low",
      message: "سكر الدم منخفض. تناول مصدر سكر سريع إن شعرت بأعراض الهبوط، وراجع الطبيب إذا تكرر ذلك."
    };
  }
  if (value <= r.normalMax) {
    return {
      status: "normal",
      message: "قراءة سكر الدم ضمن المعدل الطبيعي. استمر في متابعتك الجيدة."
    };
  }
  if (value <= r.highMax) {
    return {
      status: "high",
      message: "سكر الدم مرتفع قليلًا. انتبه للنظام الغذائي والنشاط البدني، وتابع مع طبيبك."
    };
  }
  return {
    status: "very_high",
    message: "سكر الدم مرتفع جدًا. يُنصح بمراجعة الطبيب في أقرب وقت لتقييم الحالة."
  };
}

/* ---------------- تنسيق التاريخ والوقت ---------------- */
function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}
function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}
function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ---------------- توست إشعارات ---------------- */
function showToast(message, type = "default") {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------------- نافذة تأكيد عامة ---------------- */
function confirmDialog({ title, message, confirmText = "تأكيد", danger = true }) {
  return new Promise(resolve => {
    const overlay = document.getElementById("confirmOverlay");
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;
    const btn = document.getElementById("confirmActionBtn");
    btn.textContent = confirmText;
    btn.className = "btn " + (danger ? "btn-danger-outline" : "btn-primary");
    overlay.classList.add("show");

    function cleanup(result) {
      overlay.classList.remove("show");
      btn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    }
    function onConfirm() { cleanup(true); }
    function onCancel() { cleanup(false); }
    const cancelBtn = document.getElementById("confirmCancelBtn");
    btn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}

/* ---------------- أدوات مساعدة عامة ---------------- */
function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function avg(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n) { return Math.round(n * 10) / 10; }

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
