// ============================================================
// حساب الإحصائيات وعرض لوحة التحكم (Dashboard)
// ============================================================

function computeBPStats() {
  if (!bpReadings.length) return null;
  const systolics = bpReadings.map(r => r.systolic);
  const diastolics = bpReadings.map(r => r.diastolic);
  const pulses = bpReadings.filter(r => r.pulse).map(r => r.pulse);
  const last = bpReadings[0];
  return {
    count: bpReadings.length,
    avgSystolic: round1(avg(systolics)),
    avgDiastolic: round1(avg(diastolics)),
    maxSystolic: Math.max(...systolics),
    minSystolic: Math.min(...systolics),
    maxDiastolic: Math.max(...diastolics),
    minDiastolic: Math.min(...diastolics),
    avgPulse: pulses.length ? round1(avg(pulses)) : null,
    last
  };
}

function computeSugarStats() {
  if (!sugarReadings.length) return null;
  const values = sugarReadings.map(r => r.value);
  const last = sugarReadings[0];
  return {
    count: sugarReadings.length,
    avgValue: round1(avg(values)),
    maxValue: Math.max(...values),
    minValue: Math.min(...values),
    last
  };
}

function renderDashboardStats() {
  const bpStats = computeBPStats();
  const sugarStats = computeSugarStats();
  const grid = document.getElementById("dashboardStatsGrid");

  const cards = [];

  cards.push(statCard({
    icon: ICON_HEART_PULSE, color: "primary",
    value: bpStats ? `${bpStats.avgSystolic}/${bpStats.avgDiastolic}` : "—",
    label: "متوسط ضغط الدم (الانقباضي/الانبساطي)"
  }));
  cards.push(statCard({
    icon: ICON_DROP, color: "warning",
    value: sugarStats ? `${sugarStats.avgValue}` : "—",
    label: "متوسط سكر الدم (mg/dL)"
  }));
  cards.push(statCard({
    icon: ICON_LIST, color: "info",
    value: (bpStats?.count || 0) + (sugarStats?.count || 0),
    label: "إجمالي عدد القياسات المسجّلة"
  }));

  const lastStatus = bpStats ? bpStats.last.status : (sugarStats ? sugarStats.last.status : null);
  cards.push(statCard({
    icon: ICON_CHART, color: statusToColor(lastStatus),
    value: lastStatus ? STATUS_LABELS[lastStatus] : "—",
    label: "حالة آخر قراءة مسجّلة"
  }));

  grid.innerHTML = cards.join("");

  renderDashboardDetailStats(bpStats, sugarStats);
  renderDashboardAdvice(bpStats, sugarStats);
  renderDashboardRecent();
}

function statusToColor(status) {
  return { low: "info", normal: "success", high: "warning", very_high: "danger" }[status] || "primary";
}

function statCard({ icon, color, value, label }) {
  const bgVar = `var(--${color}-light, var(--primary-light))`;
  const colorVar = `var(--${color}, var(--primary))`;
  return `
    <div class="card stat-card">
      <div class="stat-icon" style="background:${bgVar}; color:${colorVar}">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

function renderDashboardDetailStats(bpStats, sugarStats) {
  const el = document.getElementById("dashboardDetailStats");
  if (!bpStats && !sugarStats) {
    el.innerHTML = `<p style="text-align:center; color:var(--text-faint); padding:30px 0;">لا توجد بيانات كافية بعد. ابدأ بتسجيل أول قراءة لك.</p>`;
    return;
  }
  let html = `<div class="grid grid-2">`;
  if (bpStats) {
    html += `
      <div class="card">
        <div class="card-title"><h3>تفاصيل ضغط الدم</h3></div>
        <ul style="display:flex; flex-direction:column; gap:10px; font-size:14px;">
          <li>عدد القياسات: <strong>${bpStats.count}</strong></li>
          <li>أعلى قراءة انقباضية: <strong>${bpStats.maxSystolic}</strong></li>
          <li>أقل قراءة انقباضية: <strong>${bpStats.minSystolic}</strong></li>
          <li>أعلى قراءة انبساطية: <strong>${bpStats.maxDiastolic}</strong></li>
          <li>أقل قراءة انبساطية: <strong>${bpStats.minDiastolic}</strong></li>
          ${bpStats.avgPulse ? `<li>متوسط النبض: <strong>${bpStats.avgPulse} bpm</strong></li>` : ""}
        </ul>
      </div>`;
  }
  if (sugarStats) {
    html += `
      <div class="card">
        <div class="card-title"><h3>تفاصيل سكر الدم</h3></div>
        <ul style="display:flex; flex-direction:column; gap:10px; font-size:14px;">
          <li>عدد القياسات: <strong>${sugarStats.count}</strong></li>
          <li>متوسط القراءة: <strong>${sugarStats.avgValue} mg/dL</strong></li>
          <li>أعلى قراءة: <strong>${sugarStats.maxValue} mg/dL</strong></li>
          <li>أقل قراءة: <strong>${sugarStats.minValue} mg/dL</strong></li>
        </ul>
      </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
}

function renderDashboardAdvice(bpStats, sugarStats) {
  const el = document.getElementById("dashboardAdvice");
  const items = [];
  if (bpStats) {
    const ev = evaluateBP(bpStats.last.systolic, bpStats.last.diastolic);
    items.push(`<div class="advice-banner status-${ev.status}">${ICON_HEART_PULSE}<div><strong>آخر قراءة ضغط: ${bpStats.last.systolic}/${bpStats.last.diastolic}</strong><br>${ev.message}</div></div>`);
  }
  if (sugarStats) {
    const ev = evaluateSugar(sugarStats.last.value, sugarStats.last.reading_type);
    items.push(`<div class="advice-banner status-${ev.status}">${ICON_DROP}<div><strong>آخر قراءة سكر: ${sugarStats.last.value} mg/dL (${READING_TYPE_LABELS[sugarStats.last.reading_type]})</strong><br>${ev.message}</div></div>`);
  }
  if (!items.length) { el.innerHTML = ""; return; }
  el.innerHTML = `<div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">${items.join("")}</div>`;
}

function renderDashboardRecent() {
  const el = document.getElementById("dashboardRecentList");
  const merged = [
    ...bpReadings.slice(0, 5).map(r => ({ ...r, kind: "bp" })),
    ...sugarReadings.slice(0, 5).map(r => ({ ...r, kind: "sugar" }))
  ].sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at)).slice(0, 6);

  if (!merged.length) {
    el.innerHTML = `<div class="empty-state">${ICON_EMPTY}<p>لم تُسجَّل أي قياسات بعد</p></div>`;
    return;
  }

  el.innerHTML = merged.map(r => {
    if (r.kind === "bp") {
      return `<div class="tip-item">${ICON_HEART_PULSE}<div><h5>ضغط: ${r.systolic}/${r.diastolic} mmHg</h5><p>${formatDateTime(r.measured_at)} · <span class="badge status-${r.status}">${STATUS_LABELS[r.status]}</span></p></div></div>`;
    }
    return `<div class="tip-item">${ICON_DROP}<div><h5>سكر: ${r.value} mg/dL (${READING_TYPE_LABELS[r.reading_type]})</h5><p>${formatDateTime(r.measured_at)} · <span class="badge status-${r.status}">${STATUS_LABELS[r.status]}</span></p></div></div>`;
  }).join("");
}
