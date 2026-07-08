// ============================================================
// إدارة قراءات ضغط الدم وسكر الدم: جلب، إضافة، تعديل، حذف، بحث
// ============================================================

let bpReadings = [];
let sugarReadings = [];
let editingContext = null; // {type: 'bp'|'sugar', id: string} أو null عند الإضافة

/* ---------------- جلب البيانات ---------------- */
async function fetchAllReadings() {
  await Promise.all([fetchBPReadings(), fetchSugarReadings()]);
}

async function fetchBPReadings() {
  const { data, error } = await supabaseClient
    .from("bp_readings")
    .select("*")
    .order("measured_at", { ascending: false });
  if (error) { showToast("تعذّر تحميل قراءات الضغط", "error"); return; }
  bpReadings = data || [];
}

async function fetchSugarReadings() {
  const { data, error } = await supabaseClient
    .from("sugar_readings")
    .select("*")
    .order("measured_at", { ascending: false });
  if (error) { showToast("تعذّر تحميل قراءات السكر", "error"); return; }
  sugarReadings = data || [];
}

/* ---------------- إضافة قراءة ضغط ---------------- */
async function addBPReading({ systolic, diastolic, pulse, note, measured_at }) {
  const evalRes = evaluateBP(systolic, diastolic);
  const payload = {
    user_id: currentUser.id,
    systolic: Number(systolic),
    diastolic: Number(diastolic),
    pulse: pulse ? Number(pulse) : null,
    note: note || null,
    status: evalRes.status,
    measured_at: measured_at ? new Date(measured_at).toISOString() : new Date().toISOString()
  };
  const { data, error } = await supabaseClient.from("bp_readings").insert(payload).select().single();
  if (error) { showToast("تعذّرت إضافة القراءة", "error"); return null; }
  bpReadings.unshift(data);
  sortBP();
  return data;
}

async function updateBPReading(id, { systolic, diastolic, pulse, note, measured_at }) {
  const evalRes = evaluateBP(systolic, diastolic);
  const payload = {
    systolic: Number(systolic),
    diastolic: Number(diastolic),
    pulse: pulse ? Number(pulse) : null,
    note: note || null,
    status: evalRes.status,
    measured_at: measured_at ? new Date(measured_at).toISOString() : undefined
  };
  const { data, error } = await supabaseClient.from("bp_readings").update(payload).eq("id", id).select().single();
  if (error) { showToast("تعذّر تعديل القراءة", "error"); return null; }
  const idx = bpReadings.findIndex(r => r.id === id);
  if (idx > -1) bpReadings[idx] = data;
  sortBP();
  return data;
}

async function deleteBPReading(id) {
  const { error } = await supabaseClient.from("bp_readings").delete().eq("id", id);
  if (error) { showToast("تعذّر حذف القراءة", "error"); return false; }
  bpReadings = bpReadings.filter(r => r.id !== id);
  return true;
}

/* ---------------- إضافة قراءة سكر ---------------- */
async function addSugarReading({ value, reading_type, note, measured_at }) {
  const evalRes = evaluateSugar(value, reading_type);
  const payload = {
    user_id: currentUser.id,
    value: Number(value),
    reading_type,
    note: note || null,
    status: evalRes.status,
    measured_at: measured_at ? new Date(measured_at).toISOString() : new Date().toISOString()
  };
  const { data, error } = await supabaseClient.from("sugar_readings").insert(payload).select().single();
  if (error) { showToast("تعذّرت إضافة القراءة", "error"); return null; }
  sugarReadings.unshift(data);
  sortSugar();
  return data;
}

async function updateSugarReading(id, { value, reading_type, note, measured_at }) {
  const evalRes = evaluateSugar(value, reading_type);
  const payload = {
    value: Number(value),
    reading_type,
    note: note || null,
    status: evalRes.status,
    measured_at: measured_at ? new Date(measured_at).toISOString() : undefined
  };
  const { data, error } = await supabaseClient.from("sugar_readings").update(payload).eq("id", id).select().single();
  if (error) { showToast("تعذّر تعديل القراءة", "error"); return null; }
  const idx = sugarReadings.findIndex(r => r.id === id);
  if (idx > -1) sugarReadings[idx] = data;
  sortSugar();
  return data;
}

async function deleteSugarReading(id) {
  const { error } = await supabaseClient.from("sugar_readings").delete().eq("id", id);
  if (error) { showToast("تعذّر حذف القراءة", "error"); return false; }
  sugarReadings = sugarReadings.filter(r => r.id !== id);
  return true;
}

function sortBP() { bpReadings.sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at)); }
function sortSugar() { sugarReadings.sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at)); }

/* ============================================================
   عرض جدول قراءات الضغط
============================================================ */
function renderBPTable() {
  const search = (document.getElementById("bpSearch")?.value || "").trim();
  const statusFilter = document.getElementById("bpStatusFilter")?.value || "all";
  const tbody = document.getElementById("bpTableBody");
  const emptyEl = document.getElementById("bpEmptyState");

  let rows = bpReadings;
  if (statusFilter !== "all") rows = rows.filter(r => r.status === statusFilter);
  if (search) {
    rows = rows.filter(r =>
      String(r.systolic).includes(search) ||
      String(r.diastolic).includes(search) ||
      (r.note || "").includes(search) ||
      formatDateTime(r.measured_at).includes(search)
    );
  }

  if (!rows.length) {
    tbody.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${formatDateTime(r.measured_at)}</td>
      <td><strong>${r.systolic}/${r.diastolic}</strong> <span style="color:var(--text-faint)">mmHg</span></td>
      <td>${r.pulse ? r.pulse + " bpm" : "—"}</td>
      <td><span class="badge status-${r.status}"><span class="badge-dot"></span>${STATUS_LABELS[r.status]}</span></td>
      <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.note) || "—"}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" title="تعديل" onclick="openBPModal('${r.id}')">${ICON_EDIT}</button>
          <button class="btn-icon" title="حذف" onclick="handleDeleteBP('${r.id}')">${ICON_TRASH}</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* ============================================================
   عرض جدول قراءات السكر
============================================================ */
function renderSugarTable() {
  const search = (document.getElementById("sugarSearch")?.value || "").trim();
  const statusFilter = document.getElementById("sugarStatusFilter")?.value || "all";
  const typeFilter = document.getElementById("sugarTypeFilter")?.value || "all";
  const tbody = document.getElementById("sugarTableBody");
  const emptyEl = document.getElementById("sugarEmptyState");

  let rows = sugarReadings;
  if (statusFilter !== "all") rows = rows.filter(r => r.status === statusFilter);
  if (typeFilter !== "all") rows = rows.filter(r => r.reading_type === typeFilter);
  if (search) {
    rows = rows.filter(r =>
      String(r.value).includes(search) ||
      (r.note || "").includes(search) ||
      formatDateTime(r.measured_at).includes(search)
    );
  }

  if (!rows.length) {
    tbody.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${formatDateTime(r.measured_at)}</td>
      <td><strong>${r.value}</strong> <span style="color:var(--text-faint)">mg/dL</span></td>
      <td>${READING_TYPE_LABELS[r.reading_type]}</td>
      <td><span class="badge status-${r.status}"><span class="badge-dot"></span>${STATUS_LABELS[r.status]}</span></td>
      <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.note) || "—"}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" title="تعديل" onclick="openSugarModal('${r.id}')">${ICON_EDIT}</button>
          <button class="btn-icon" title="حذف" onclick="handleDeleteSugar('${r.id}')">${ICON_TRASH}</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* ---------------- حذف مع تأكيد ---------------- */
async function handleDeleteBP(id) {
  const ok = await confirmDialog({ title: "حذف القراءة", message: "هل أنت متأكد من حذف قراءة الضغط هذه؟ لا يمكن التراجع." });
  if (!ok) return;
  const success = await deleteBPReading(id);
  if (success) {
    showToast("تم حذف القراءة", "success");
    renderBPTable();
    refreshDashboardAndCharts();
  }
}

async function handleDeleteSugar(id) {
  const ok = await confirmDialog({ title: "حذف القراءة", message: "هل أنت متأكد من حذف قراءة السكر هذه؟ لا يمكن التراجع." });
  if (!ok) return;
  const success = await deleteSugarReading(id);
  if (success) {
    showToast("تم حذف القراءة", "success");
    renderSugarTable();
    refreshDashboardAndCharts();
  }
}

/* ============================================================
   نوافذ الإضافة / التعديل
============================================================ */
function openBPModal(id = null) {
  editingContext = id ? { type: "bp", id } : null;
  const overlay = document.getElementById("bpModalOverlay");
  const form = document.getElementById("bpForm");
  form.reset();
  document.getElementById("bpModalTitle").textContent = id ? "تعديل قراءة الضغط" : "إضافة قراءة ضغط";

  if (id) {
    const r = bpReadings.find(x => x.id === id);
    document.getElementById("bpSystolic").value = r.systolic;
    document.getElementById("bpDiastolic").value = r.diastolic;
    document.getElementById("bpPulse").value = r.pulse || "";
    document.getElementById("bpNote").value = r.note || "";
    document.getElementById("bpMeasuredAt").value = toDatetimeLocalValue(r.measured_at);
  } else {
    document.getElementById("bpMeasuredAt").value = toDatetimeLocalValue(new Date().toISOString());
  }
  overlay.classList.add("show");
}
function closeBPModal() { document.getElementById("bpModalOverlay").classList.remove("show"); }

function openSugarModal(id = null) {
  editingContext = id ? { type: "sugar", id } : null;
  const overlay = document.getElementById("sugarModalOverlay");
  const form = document.getElementById("sugarForm");
  form.reset();
  document.getElementById("sugarModalTitle").textContent = id ? "تعديل قراءة السكر" : "إضافة قراءة سكر";

  if (id) {
    const r = sugarReadings.find(x => x.id === id);
    document.getElementById("sugarValue").value = r.value;
    document.getElementById("sugarType").value = r.reading_type;
    document.getElementById("sugarNote").value = r.note || "";
    document.getElementById("sugarMeasuredAt").value = toDatetimeLocalValue(r.measured_at);
  } else {
    document.getElementById("sugarMeasuredAt").value = toDatetimeLocalValue(new Date().toISOString());
  }
  overlay.classList.add("show");
}
function closeSugarModal() { document.getElementById("sugarModalOverlay").classList.remove("show"); }

async function handleBPFormSubmit(e) {
  e.preventDefault();
  const payload = {
    systolic: document.getElementById("bpSystolic").value,
    diastolic: document.getElementById("bpDiastolic").value,
    pulse: document.getElementById("bpPulse").value,
    note: document.getElementById("bpNote").value.trim(),
    measured_at: document.getElementById("bpMeasuredAt").value
  };
  let result;
  if (editingContext && editingContext.type === "bp") {
    result = await updateBPReading(editingContext.id, payload);
  } else {
    result = await addBPReading(payload);
  }
  if (result) {
    showToast(editingContext ? "تم تحديث القراءة" : "تمت إضافة القراءة بنجاح", "success");
    closeBPModal();
    renderBPTable();
    refreshDashboardAndCharts();
    editingContext = null;
  }
}

async function handleSugarFormSubmit(e) {
  e.preventDefault();
  const payload = {
    value: document.getElementById("sugarValue").value,
    reading_type: document.getElementById("sugarType").value,
    note: document.getElementById("sugarNote").value.trim(),
    measured_at: document.getElementById("sugarMeasuredAt").value
  };
  let result;
  if (editingContext && editingContext.type === "sugar") {
    result = await updateSugarReading(editingContext.id, payload);
  } else {
    result = await addSugarReading(payload);
  }
  if (result) {
    showToast(editingContext ? "تم تحديث القراءة" : "تمت إضافة القراءة بنجاح", "success");
    closeSugarModal();
    renderSugarTable();
    refreshDashboardAndCharts();
    editingContext = null;
  }
}

function refreshDashboardAndCharts() {
  renderDashboardStats();
  renderAllCharts();
}
