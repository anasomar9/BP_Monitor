// ============================================================
// الأدوات الصحية: حاسبة BMI، حاسبة الماء اليومي، نصائح عامة
// ============================================================

function initHealthTools() {
  document.getElementById("bmiForm").addEventListener("submit", handleBMICalc);
  document.getElementById("waterForm").addEventListener("submit", handleWaterCalc);
  renderHealthTips();
}

function handleBMICalc(e) {
  e.preventDefault();
  const weight = parseFloat(document.getElementById("bmiWeight").value);
  const heightCm = parseFloat(document.getElementById("bmiHeight").value);
  if (!weight || !heightCm) return;

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const bmiRounded = round1(bmi);

  let category, color, advice;
  if (bmi < 18.5) {
    category = "نقص في الوزن"; color = "info";
    advice = "يُفضّل زيادة السعرات الغذائية الصحية واستشارة أخصائي تغذية.";
  } else if (bmi < 25) {
    category = "وزن طبيعي"; color = "success";
    advice = "استمر في نمط حياتك الصحي الحالي من غذاء متوازن ونشاط بدني منتظم.";
  } else if (bmi < 30) {
    category = "زيادة في الوزن"; color = "warning";
    advice = "يُنصح بزيادة النشاط البدني وتقليل السعرات الحرارية تدريجيًا.";
  } else {
    category = "سمنة"; color = "danger";
    advice = "يُستحسن استشارة الطبيب أو أخصائي تغذية لوضع خطة مناسبة وآمنة.";
  }

  const result = document.getElementById("bmiResult");
  result.classList.add("show");
  result.innerHTML = `
    <div class="big">${bmiRounded}</div>
    <div class="badge status-${color === "danger" ? "very_high" : color === "warning" ? "high" : color === "info" ? "low" : "normal"}" style="margin:8px 0;">
      <span class="badge-dot"></span>${category}
    </div>
    <p style="margin:8px 0 0;">${advice}</p>
    <p style="font-size:12px; margin-top:10px;">هذا المؤشر تقريبي ولا يُغني عن تقييم طبي متكامل.</p>
  `;
}

function handleWaterCalc(e) {
  e.preventDefault();
  const weight = parseFloat(document.getElementById("waterWeight").value);
  const activity = document.getElementById("waterActivity").value;
  if (!weight) return;

  let ml = weight * 35;
  if (activity === "moderate") ml += 350;
  if (activity === "high") ml += 700;

  const liters = round1(ml / 1000);
  const cups = Math.round(ml / 250);

  const result = document.getElementById("waterResult");
  result.classList.add("show");
  result.innerHTML = `
    <div class="big">${liters} لتر</div>
    <p style="margin:6px 0 0;">أي ما يعادل تقريبًا <strong>${cups} أكواب</strong> (250 مل) يوميًا.</p>
    <p style="font-size:12px; margin-top:10px;">قد تختلف الاحتياجات الفعلية حسب الحالة الصحية والمناخ ونشاطك اليومي، خصوصًا لمرضى القلب أو الكلى الذين قد يحتاجون قيودًا خاصة على السوائل — استشر طبيبك.</p>
  `;
}

const HEALTH_TIPS = [
  { icon: ICON_DROP, title: "قلّل الملح والصوديوم", text: "تقليل الملح في الطعام يساعد على ضبط ضغط الدم بشكل ملحوظ مع الوقت." },
  { icon: ICON_HEART_PULSE, title: "مارس الرياضة بانتظام", text: "30 دقيقة مشي يوميًا تساهم في تحسين ضغط الدم ومستوى السكر." },
  { icon: ICON_SCALE, title: "حافظ على وزن صحي", text: "الوزن الزائد يزيد العبء على القلب ويرفع من مقاومة الإنسولين." },
  { icon: ICON_LIST, title: "راقب قراءاتك بانتظام", text: "التسجيل المستمر يساعدك وطبيبك على فهم نمط حالتك بدقة أكبر." },
  { icon: ICON_INFO, title: "التزم بالأدوية الموصوفة", text: "لا توقف أو تغيّر جرعة الدواء دون استشارة الطبيب المختص." },
  { icon: ICON_DROP, title: "اشرب كمية كافية من الماء", text: "الترطيب الجيد يدعم وظائف الجسم ويساعد في تنظيم مستوى السكر." },
  { icon: ICON_HEART_PULSE, title: "قلّل التوتر والقلق", text: "تقنيات الاسترخاء والتنفس العميق تقلل من ارتفاع ضغط الدم المرتبط بالتوتر." },
  { icon: ICON_SCALE, title: "نوّع غذاءك بذكاء", text: "أكثر من الخضروات والألياف وقلل من السكريات والدهون المشبعة." }
];

function renderHealthTips() {
  const el = document.getElementById("tipsGrid");
  el.innerHTML = HEALTH_TIPS.map(t => `
    <div class="tip-item">
      ${t.icon}
      <div><h5>${t.title}</h5><p>${t.text}</p></div>
    </div>
  `).join("");
}
