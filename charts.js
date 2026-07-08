// ============================================================
// الرسوم البيانية (Chart.js) لعرض تطور القراءات
// ============================================================

let bpChartInstance = null;
let sugarChartInstance = null;
let statusChartInstance = null;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartBaseColors() {
  return {
    text: cssVar("--text-dim"),
    grid: cssVar("--border"),
    primary: cssVar("--primary"),
    accent: cssVar("--accent"),
    success: cssVar("--success"),
    danger: cssVar("--danger"),
    info: cssVar("--info")
  };
}

function renderAllCharts() {
  renderBPChart();
  renderSugarChart();
  renderStatusChart();
}

function renderBPChart() {
  const canvas = document.getElementById("bpChart");
  if (!canvas) return;
  const c = chartBaseColors();
  const rows = [...bpReadings].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at)).slice(-30);

  const labels = rows.map(r => formatDateShort(r.measured_at));
  const systolic = rows.map(r => r.systolic);
  const diastolic = rows.map(r => r.diastolic);

  if (bpChartInstance) bpChartInstance.destroy();

  if (!rows.length) return;

  bpChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "الانقباضي", data: systolic, borderColor: c.primary, backgroundColor: c.primary + "22", tension: .35, fill: true, pointRadius: 3 },
        { label: "الانبساطي", data: diastolic, borderColor: c.accent, backgroundColor: c.accent + "22", tension: .35, fill: true, pointRadius: 3 }
      ]
    },
    options: chartOptions(c)
  });
}

function renderSugarChart() {
  const canvas = document.getElementById("sugarChart");
  if (!canvas) return;
  const c = chartBaseColors();
  const rows = [...sugarReadings].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at)).slice(-30);

  const labels = rows.map(r => formatDateShort(r.measured_at));
  const values = rows.map(r => r.value);

  if (sugarChartInstance) sugarChartInstance.destroy();
  if (!rows.length) return;

  sugarChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "سكر الدم (mg/dL)", data: values, borderColor: c.info, backgroundColor: c.info + "22", tension: .35, fill: true, pointRadius: 3 }
      ]
    },
    options: chartOptions(c)
  });
}

function renderStatusChart() {
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;
  const c = chartBaseColors();
  const all = [...bpReadings, ...sugarReadings];
  const counts = { normal: 0, low: 0, high: 0, very_high: 0 };
  all.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });

  if (statusChartInstance) statusChartInstance.destroy();
  if (!all.length) return;

  statusChartInstance = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["طبيعي", "منخفض", "مرتفع", "مرتفع جدًا"],
      datasets: [{
        data: [counts.normal, counts.low, counts.high, counts.very_high],
        backgroundColor: [c.success, c.info, c.accent, c.danger],
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom", rtl: true, labels: { color: c.text, font: { family: "Tajawal" }, padding: 16 } }
      },
      cutout: "62%"
    }
  });
}

function chartOptions(c) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { rtl: true, labels: { color: c.text, font: { family: "Tajawal" }, usePointStyle: true } },
      tooltip: { rtl: true, titleFont: { family: "Tajawal" }, bodyFont: { family: "Tajawal" } }
    },
    scales: {
      x: { ticks: { color: c.text }, grid: { color: c.grid } },
      y: { ticks: { color: c.text }, grid: { color: c.grid } }
    }
  };
}
