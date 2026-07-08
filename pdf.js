// ============================================================
// توليد تقرير PDF احترافي يحتوي القراءات والإحصائيات والرسوم البيانية
// يعتمد على: jsPDF + html2canvas (يُحمَّلان عبر CDN)
// الفكرة: نبني تقرير HTML عربي كامل ثم نحوّله لصورة عالية الدقة
// ثم نقسّمه على صفحات PDF بحجم A4
// ============================================================

async function generatePDFReport() {
  const btn = document.getElementById("generateReportBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "جارٍ تجهيز التقرير...";

  try {
    const container = buildReportHTML();
    document.body.appendChild(container);

    // إعطاء المتصفح فرصة لرسم العناصر والخطوط قبل الالتقاط
    await new Promise(r => setTimeout(r, 250));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    document.body.removeChild(container);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`تقرير-متابع-الضغط-والسكر-${dateStr}.pdf`);
    showToast("تم تنزيل التقرير بنجاح", "success");
  } catch (err) {
    console.error(err);
    showToast("تعذّر إنشاء التقرير، حاول مرة أخرى", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function buildReportHTML() {
  const bpStats = computeBPStats();
  const sugarStats = computeSugarStats();
  const now = new Date().toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" });

  const wrap = document.createElement("div");
  wrap.className = "pdf-render-area";
  wrap.style.fontFamily = "Tajawal, sans-serif";
  wrap.dir = "rtl";

  let html = `
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #0E6E64; padding-bottom:16px; margin-bottom:20px;">
      <div>
        <h1 style="margin:0; font-size:24px; color:#0E6E64;">تقرير متابع الضغط والسكر</h1>
        <p style="margin:4px 0 0; font-size:12px; color:#666;">تاريخ الإصدار: ${now}</p>
      </div>
    </div>

    <div style="background:#FBEEDD; border:1px solid #E9C795; border-radius:8px; padding:12px 16px; font-size:12px; color:#7a5322; margin-bottom:22px;">
      تنبيه: هذا التقرير مخصص للتوعية ومتابعة القراءات الصحية فقط، ولا يُعد تشخيصًا طبيًا أو بديلًا عن استشارة الطبيب المختص.
    </div>

    <h2 style="font-size:17px; color:#12302C; border-inline-start:4px solid #0E6E64; padding-inline-start:10px;">ملخص الإحصائيات</h2>
    <table style="width:100%; border-collapse:collapse; margin:14px 0 26px; font-size:13px;">
      <tbody>`;

  if (bpStats) {
    html += reportStatRow("متوسط ضغط الدم", `${bpStats.avgSystolic} / ${bpStats.avgDiastolic} mmHg`);
    html += reportStatRow("أعلى قراءة انقباضية / انبساطية", `${bpStats.maxSystolic} / ${bpStats.maxDiastolic}`);
    html += reportStatRow("أقل قراءة انقباضية / انبساطية", `${bpStats.minSystolic} / ${bpStats.minDiastolic}`);
    html += reportStatRow("عدد قياسات الضغط", bpStats.count);
  }
  if (sugarStats) {
    html += reportStatRow("متوسط سكر الدم", `${sugarStats.avgValue} mg/dL`);
    html += reportStatRow("أعلى / أقل قراءة سكر", `${sugarStats.maxValue} / ${sugarStats.minValue} mg/dL`);
    html += reportStatRow("عدد قياسات السكر", sugarStats.count);
  }
  html += `</tbody></table>`;

  // الرسوم البيانية (نأخذها كصور من الرسوم الحالية المعروضة في التطبيق)
  html += `<h2 style="font-size:17px; color:#12302C; border-inline-start:4px solid #0E6E64; padding-inline-start:10px;">الرسوم البيانية</h2>`;
  html += `<div style="display:flex; flex-wrap:wrap; gap:16px; margin:14px 0 26px;">`;
  if (bpChartInstance) {
    html += `<div style="flex:1; min-width:340px;"><p style="font-size:12px; color:#666; margin:0 0 6px;">تطوّر ضغط الدم</p><img src="${bpChartInstance.toBase64Image()}" style="width:100%; border:1px solid #eee; border-radius:6px;" /></div>`;
  }
  if (sugarChartInstance) {
    html += `<div style="flex:1; min-width:340px;"><p style="font-size:12px; color:#666; margin:0 0 6px;">تطوّر سكر الدم</p><img src="${sugarChartInstance.toBase64Image()}" style="width:100%; border:1px solid #eee; border-radius:6px;" /></div>`;
  }
  html += `</div>`;

  // جدول قراءات الضغط
  html += `<h2 style="font-size:17px; color:#12302C; border-inline-start:4px solid #0E6E64; padding-inline-start:10px;">سجل قراءات ضغط الدم</h2>`;
  html += reportTable(
    ["التاريخ والوقت", "الانقباضي/الانبساطي", "النبض", "الحالة", "ملاحظة"],
    bpReadings.map(r => [
      formatDateTime(r.measured_at),
      `${r.systolic}/${r.diastolic}`,
      r.pulse || "—",
      STATUS_LABELS[r.status],
      r.note || "—"
    ])
  );

  // جدول قراءات السكر
  html += `<h2 style="font-size:17px; color:#12302C; border-inline-start:4px solid #0E6E64; padding-inline-start:10px; margin-top:24px;">سجل قراءات سكر الدم</h2>`;
  html += reportTable(
    ["التاريخ والوقت", "القيمة (mg/dL)", "النوع", "الحالة", "ملاحظة"],
    sugarReadings.map(r => [
      formatDateTime(r.measured_at),
      r.value,
      READING_TYPE_LABELS[r.reading_type],
      STATUS_LABELS[r.status],
      r.note || "—"
    ])
  );

  html += `
    <div style="margin-top:30px; padding-top:14px; border-top:1px dashed #ccc; font-size:11px; color:#888; text-align:center; line-height:1.9;">
      تم تطوير هذا المشروع صدقة جارية لوجه الله تعالى بواسطة أنس عمر 🤍
    </div>`;

  wrap.innerHTML = html;
  return wrap;
}

function reportStatRow(label, value) {
  return `<tr style="border-bottom:1px solid #eee;">
    <td style="padding:8px 4px; color:#666;">${label}</td>
    <td style="padding:8px 4px; font-weight:700; color:#12302C;">${value}</td>
  </tr>`;
}

function reportTable(headers, rows) {
  if (!rows.length) {
    return `<p style="font-size:12px; color:#999; margin:8px 0 20px;">لا توجد قراءات مسجّلة.</p>`;
  }
  let html = `<table style="width:100%; border-collapse:collapse; font-size:11.5px; margin:12px 0 22px;">
    <thead><tr style="background:#EAF1EF;">`;
  headers.forEach(h => html += `<th style="padding:7px 6px; text-align:start; color:#0E6E64; border-bottom:2px solid #cfe3df;">${h}</th>`);
  html += `</tr></thead><tbody>`;
  rows.forEach(row => {
    html += `<tr>`;
    row.forEach(cell => html += `<td style="padding:6px; border-bottom:1px solid #eee; color:#333;">${escapeHtml(cell)}</td>`);
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}
