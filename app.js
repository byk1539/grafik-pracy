const STORAGE_KEY = "grafik-prosty-data-v1";
const API_URL_KEY = "grafik-prosty-api-url";

const initialState = {
  employees: [
    { id: crypto.randomUUID(), name: "Anna Kowalska", position: "Biuro", rate: 32, norm: 168 },
    { id: crypto.randomUUID(), name: "Marek Nowak", position: "Magazyn", rate: 35, norm: 168 },
    { id: crypto.randomUUID(), name: "Julia Zielinska", position: "Produkcja", rate: 30, norm: 168 }
  ],
  shifts: []
};

let state = loadState();
const params = new URLSearchParams(location.search);
let role = params.get("role") || "manager";
if (role === "boss") role = "owner";
if (!["input", "owner", "manager"].includes(role)) role = "manager";
if (params.get("api")) localStorage.setItem(API_URL_KEY, params.get("api"));

const roleNames = {
  input: "Tryb wpisywania godzin",
  owner: "Tryb wlasciciela",
  manager: "Tryb managera"
};

const viewTitles = {
  entry: "Wpisy godzin",
  dashboard: "Kalendarz",
  rates: "Stawki",
  analysis: "Analiza",
  sharing: "Linki dostepu",
  settings: "Ustawienia"
};

const els = {
  roleLabel: document.querySelector("#roleLabel"),
  periodMonth: document.querySelector("#periodMonth"),
  viewTitle: document.querySelector("#viewTitle"),
  navItems: [...document.querySelectorAll(".nav-item")],
  views: [...document.querySelectorAll(".view")],
  shiftForm: document.querySelector("#shiftForm"),
  shiftEmployee: document.querySelector("#shiftEmployee"),
  shiftDate: document.querySelector("#shiftDate"),
  shiftStart: document.querySelector("#shiftStart"),
  shiftEnd: document.querySelector("#shiftEnd"),
  shiftNote: document.querySelector("#shiftNote"),
  shiftList: document.querySelector("#shiftList"),
  dashboardSearch: document.querySelector("#dashboardSearch"),
  dailySummary: document.querySelector("#dailySummary"),
  totalHours: document.querySelector("#totalHours"),
  activeEmployees: document.querySelector("#activeEmployees"),
  totalPayroll: document.querySelector("#totalPayroll"),
  peakDayCost: document.querySelector("#peakDayCost"),
  avgHours: document.querySelector("#avgHours"),
  employeeForm: document.querySelector("#employeeForm"),
  employeeId: document.querySelector("#employeeId"),
  employeeName: document.querySelector("#employeeName"),
  employeePosition: document.querySelector("#employeePosition"),
  employeeRate: document.querySelector("#employeeRate"),
  employeeNorm: document.querySelector("#employeeNorm"),
  resetEmployeeForm: document.querySelector("#resetEmployeeForm"),
  employeeList: document.querySelector("#employeeList"),
  analysisSort: document.querySelector("#analysisSort"),
  analysisList: document.querySelector("#analysisList"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  reportCsvBtn: document.querySelector("#reportCsvBtn"),
  reportRange: document.querySelector("#reportRange"),
  reportDate: document.querySelector("#reportDate"),
  syncBtn: document.querySelector("#syncBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  settingsForm: document.querySelector("#settingsForm"),
  apiUrl: document.querySelector("#apiUrl"),
  loadRemoteBtn: document.querySelector("#loadRemoteBtn"),
  saveRemoteBtn: document.querySelector("#saveRemoteBtn"),
  toast: document.querySelector("#toast")
};

boot();

function boot() {
  els.roleLabel.textContent = roleNames[role];
  els.periodMonth.value = currentMonth();
  els.shiftDate.value = today();
  els.reportDate.value = today();
  els.apiUrl.value = localStorage.getItem(API_URL_KEY) || "";
  applyRole();
  bindEvents();
  seedDemoShifts();
  renderAll();
}

function bindEvents() {
  els.navItems.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  els.periodMonth.addEventListener("change", renderAll);
  els.dashboardSearch.addEventListener("input", renderDashboard);
  els.analysisSort.addEventListener("change", renderAnalysis);

  els.shiftForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const shift = {
      id: crypto.randomUUID(),
      employeeId: els.shiftEmployee.value,
      date: els.shiftDate.value,
      start: els.shiftStart.value,
      end: els.shiftEnd.value,
      breakMinutes: 0,
      type: "regular",
      multiplier: 1,
      note: els.shiftNote.value.trim()
    };
    state.shifts.push(shift);
    saveState();
    els.shiftNote.value = "";
    renderAll();
    showToast("Zmiana zapisana");
    autoSaveRemote();
  });

  els.employeeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = {
      id: els.employeeId.value || crypto.randomUUID(),
      name: els.employeeName.value.trim(),
      position: els.employeePosition.value.trim(),
      rate: Number(els.employeeRate.value || 0),
      norm: Number(els.employeeNorm.value || 0)
    };
    const index = state.employees.findIndex((employee) => employee.id === payload.id);
    if (index >= 0) state.employees[index] = payload;
    else state.employees.push(payload);
    saveState();
    resetEmployeeForm();
    renderAll();
    showToast("Pracownik zapisany");
    autoSaveRemote();
  });

  els.resetEmployeeForm.addEventListener("click", resetEmployeeForm);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.reportCsvBtn.addEventListener("click", exportAccountingReport);
  els.syncBtn.addEventListener("click", syncRemote);
  els.importJsonInput.addEventListener("change", importJson);
  els.settingsForm.addEventListener("submit", saveSettings);
  els.loadRemoteBtn.addEventListener("click", loadRemote);
  els.saveRemoteBtn.addEventListener("click", saveRemote);

  document.querySelectorAll(".copy-link").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = document.querySelector(`#${button.dataset.link}`).textContent;
      await navigator.clipboard.writeText(text);
      showToast("Link skopiowany");
    });
  });
}

function applyRole() {
  document.querySelectorAll(".manager-only").forEach((el) => {
    el.classList.toggle("is-hidden", role !== "manager");
  });
  document.querySelectorAll(".finance-visible").forEach((el) => {
    el.classList.toggle("is-hidden", !canViewFinancials());
  });
  document.querySelectorAll(".finance-visible-option").forEach((el) => {
    el.hidden = !canViewFinancials();
  });

  els.navItems.forEach((item) => {
    const allowed = item.dataset.roles.split(",");
    item.classList.toggle("is-hidden", !allowed.includes(role));
  });

  const firstAllowed = els.navItems.find((item) => !item.classList.contains("is-hidden"));
  showView(firstAllowed?.dataset.view || "dashboard");
}

function canViewFinancials() {
  return role === "manager" || role === "owner";
}

function showView(viewId) {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  els.viewTitle.textContent = viewTitles[viewId] || "Grafik";
}

function renderAll() {
  renderEmployeeOptions();
  renderShiftList();
  renderEmployees();
  renderDashboard();
  renderAnalysis();
  renderLinks();
}

function renderEmployeeOptions() {
  els.shiftEmployee.innerHTML = state.employees
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((employee) => `<option value="${employee.id}">${escapeHtml(employee.name)}</option>`)
    .join("");
}

function renderShiftList() {
  const shifts = getPeriodShifts().sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`));
  if (!shifts.length) {
    els.shiftList.innerHTML = `<p class="meta">Brak wpisow w tym miesiacu.</p>`;
    return;
  }

  els.shiftList.innerHTML = shifts
    .map((shift) => {
      const employee = findEmployee(shift.employeeId);
      const hours = calculateHours(shift);
      return `
        <article class="row-card">
          <div class="row-card-head">
            <div>
              <strong>${escapeHtml(employee?.name || "Usuniety pracownik")}</strong>
              <div class="meta">${formatDate(shift.date)} · ${shift.start}-${shift.end} · ${hours.toFixed(2)} h</div>
            </div>
            <div class="row-actions">
              <button class="small-button danger" type="button" title="Usun" onclick="deleteShift('${shift.id}')">x</button>
            </div>
          </div>
          ${shift.note ? `<div class="meta">${escapeHtml(shift.note)}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderEmployees() {
  if (!state.employees.length) {
    els.employeeList.innerHTML = `<p class="meta">Dodaj pierwszego pracownika.</p>`;
    return;
  }

  els.employeeList.innerHTML = state.employees
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((employee) => `
      <article class="row-card">
        <div class="row-card-head">
          <div>
            <strong>${escapeHtml(employee.name)}</strong>
            <div class="meta">${escapeHtml(employee.position || "Bez dzialu")} · ${money(employee.rate)}/h · norma ${employee.norm || 0} h</div>
          </div>
          <div class="row-actions">
            <button class="small-button" type="button" title="Edytuj" onclick="editEmployee('${employee.id}')">e</button>
            <button class="small-button danger" type="button" title="Usun" onclick="deleteEmployee('${employee.id}')">x</button>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function renderDashboard() {
  const search = els.dashboardSearch.value.toLowerCase().trim();
  const summaries = getSummaries();
  const days = getDailySummaries().filter((day) => {
    if (!search) return true;
    return day.date.includes(search) || day.items.some((item) => item.employee.name.toLowerCase().includes(search));
  });
  const totalHours = summaries.reduce((sum, item) => sum + item.hours, 0);
  const activeCount = summaries.filter((item) => item.hours > 0).length;
  const totalPayroll = summaries.reduce((sum, item) => sum + item.cost, 0);
  const peakDay = days.reduce((max, day) => (day.cost > (max?.cost || 0) ? day : max), null);

  els.totalHours.textContent = totalHours.toFixed(2);
  els.activeEmployees.textContent = String(activeCount);
  els.totalPayroll.textContent = money(totalPayroll);
  els.avgHours.textContent = activeCount ? (totalHours / activeCount).toFixed(2) : "0";
  els.peakDayCost.textContent = peakDay ? `${money(peakDay.cost)} / ${formatDate(peakDay.date)}` : "0 zl";

  els.dailySummary.innerHTML = days.length
    ? days.map(renderDayCard).join("")
    : `<p class="meta">Brak wpisow dla wybranego zakresu.</p>`;
}

function renderDayCard(day) {
  return `
    <article class="row-card">
      <div class="row-card-head">
        <div>
          <strong>${formatDate(day.date)}</strong>
          <div class="meta">
            ${day.hours.toFixed(2)} h · ${day.employeesCount} prac. ${canViewFinancials() ? `· ${money(day.cost)}` : ""}
          </div>
        </div>
        <button class="small-button" type="button" title="Pokaz szczegoly" onclick="toggleDayDetails('${day.date}')">+</button>
      </div>
      <div id="day-${day.date}" class="detail-table is-hidden">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pracownik</th>
                <th>Stanowisko</th>
                <th>Start</th>
                <th>Koniec</th>
                <th>Godziny</th>
                <th class="finance-visible ${!canViewFinancials() ? "is-hidden" : ""}">Stawka</th>
                <th class="finance-visible ${!canViewFinancials() ? "is-hidden" : ""}">Koszt</th>
                <th>Notatka</th>
              </tr>
            </thead>
            <tbody>
              ${day.items
                .map((item) => `
                  <tr>
                    <td>${escapeHtml(item.employee.name)}</td>
                    <td>${escapeHtml(item.employee.position || "-")}</td>
                    <td>${item.shift.start}</td>
                    <td>${item.shift.end}</td>
                    <td>${item.hours.toFixed(2)}</td>
                    <td class="finance-visible ${!canViewFinancials() ? "is-hidden" : ""}">${money(item.employee.rate)}/h</td>
                    <td class="finance-visible ${!canViewFinancials() ? "is-hidden" : ""}">${money(item.cost)}</td>
                    <td>${escapeHtml(item.shift.note || "")}</td>
                  </tr>
                `)
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

function toggleDayDetails(date) {
  document.querySelector(`#day-${date}`)?.classList.toggle("is-hidden");
}

function renderAnalysis() {
  const summaries = getSummaries();
  const sort = els.analysisSort.value;
  summaries.sort((a, b) => {
    if (sort === "nameAsc") return a.employee.name.localeCompare(b.employee.name, "pl");
    if (sort === "costDesc") return b.cost - a.cost;
    if (sort === "overtimeDesc") return b.overtime - a.overtime;
    return b.hours - a.hours;
  });

  els.analysisList.innerHTML = summaries
    .map((item) => {
      const norm = item.employee.norm || 0;
      const percent = norm ? Math.min((item.hours / norm) * 100, 140) : 0;
      return `
        <article class="row-card">
          <div class="row-card-head">
            <div>
              <strong>${escapeHtml(item.employee.name)}</strong>
              <div class="meta">
                ${escapeHtml(item.employee.position || "-")} · ${item.hours.toFixed(2)} h / ${norm} h normy · nadgodziny ${item.overtime.toFixed(2)} h
                ${canViewFinancials() ? ` · ${money(item.employee.rate)}/h · koszt ${money(item.cost)}` : ""}
              </div>
            </div>
            <strong>${norm ? Math.round((item.hours / norm) * 100) : 0}%</strong>
          </div>
          <div class="progress"><span style="width:${percent}%"></span></div>
        </article>
      `;
    })
    .join("");
}

function renderLinks() {
  const base = `${location.origin}${location.pathname}`;
  const api = getApiUrl();
  const apiPart = api ? `&api=${encodeURIComponent(api)}` : "";
  document.querySelector("#inputLink").textContent = `${base}?role=input${apiPart}`;
  document.querySelector("#bossLink").textContent = `${base}?role=owner${apiPart}`;
  document.querySelector("#managerLink").textContent = `${base}?role=manager${apiPart}`;
}

function getSummaries() {
  const shifts = getPeriodShifts();
  return state.employees.map((employee) => {
    const employeeShifts = shifts.filter((shift) => shift.employeeId === employee.id);
    const hours = employeeShifts.reduce((sum, shift) => sum + calculatePaidHours(shift), 0);
    const days = new Set(employeeShifts.map((shift) => shift.date)).size;
    const overtime = Math.max(0, hours - Number(employee.norm || 0));
    return {
      employee,
      hours,
      days,
      overtime,
      cost: hours * Number(employee.rate || 0)
    };
  });
}

function getDailySummaries(shifts = getPeriodShifts()) {
  const grouped = new Map();
  shifts.forEach((shift) => {
    const employee = findEmployee(shift.employeeId) || { name: "Usuniety pracownik", rate: 0, position: "" };
    const hours = calculatePaidHours(shift);
    const item = {
      shift,
      employee,
      hours,
      cost: hours * Number(employee.rate || 0)
    };
    if (!grouped.has(shift.date)) grouped.set(shift.date, []);
    grouped.get(shift.date).push(item);
  });

  return [...grouped.entries()]
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => a.employee.name.localeCompare(b.employee.name, "pl")),
      hours: items.reduce((sum, item) => sum + item.hours, 0),
      cost: items.reduce((sum, item) => sum + item.cost, 0),
      employeesCount: new Set(items.map((item) => item.shift.employeeId)).size
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getReportShifts() {
  const range = els.reportRange.value;
  const date = els.reportDate.value || today();
  if (range === "day") return state.shifts.filter((shift) => shift.date === date);
  if (range === "week") {
    const [start, end] = getWeekBounds(date);
    return state.shifts.filter((shift) => shift.date >= start && shift.date <= end);
  }
  const month = date.slice(0, 7);
  return state.shifts.filter((shift) => shift.date.startsWith(month));
}

function getWeekBounds(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [toDateInputValue(start), toDateInputValue(end)];
}

function getPeriodShifts() {
  const period = els.periodMonth.value;
  return state.shifts.filter((shift) => shift.date.startsWith(period));
}

function calculateHours(shift) {
  const [startH, startM] = shift.start.split(":").map(Number);
  const [endH, endM] = shift.end.split(":").map(Number);
  let start = startH * 60 + startM;
  let end = endH * 60 + endM;
  if (end <= start) end += 24 * 60;
  return Math.max(0, (end - start - Number(shift.breakMinutes || 0)) / 60);
}

function calculatePaidHours(shift) {
  return calculateHours(shift) * Number(shift.multiplier || 1);
}

function editEmployee(id) {
  const employee = findEmployee(id);
  if (!employee) return;
  els.employeeId.value = employee.id;
  els.employeeName.value = employee.name;
  els.employeePosition.value = employee.position || "";
  els.employeeRate.value = employee.rate || 0;
  els.employeeNorm.value = employee.norm || 0;
  showView("rates");
}

function deleteEmployee(id) {
  if (!confirm("Usunac pracownika? Wpisy godzin zostana w historii, ale bez aktywnego przypisania.")) return;
  state.employees = state.employees.filter((employee) => employee.id !== id);
  saveState();
  renderAll();
  autoSaveRemote();
}

function deleteShift(id) {
  state.shifts = state.shifts.filter((shift) => shift.id !== id);
  saveState();
  renderAll();
  showToast("Zmiana usunieta");
  autoSaveRemote();
}

function resetEmployeeForm() {
  els.employeeForm.reset();
  els.employeeId.value = "";
  els.employeeRate.value = 0;
  els.employeeNorm.value = 168;
}

function exportJson() {
  download(`grafik-${els.periodMonth.value}.json`, JSON.stringify(state, null, 2), "application/json");
}

function exportCsv() {
  const rows = [["Pracownik", "Data", "Start", "Koniec", "Godziny", "Notatka"]];
  getPeriodShifts().forEach((shift) => {
    const employee = findEmployee(shift.employeeId);
    rows.push([
      employee?.name || "",
      shift.date,
      shift.start,
      shift.end,
      calculatePaidHours(shift).toFixed(2),
      shift.note || ""
    ]);
  });
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  download(`grafik-${els.periodMonth.value}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function exportAccountingReport() {
  const shifts = getReportShifts();
  const range = els.reportRange.value;
  const date = els.reportDate.value || today();
  const rows = [
    ["Raport", rangeLabel(range), date],
    [],
    ["Podsumowanie pracownikow"],
    ["Pracownik", "Stanowisko", "Godziny", "Stawka", "Zarobki"]
  ];

  const employeeRows = state.employees
    .map((employee) => {
      const employeeShifts = shifts.filter((shift) => shift.employeeId === employee.id);
      const hours = employeeShifts.reduce((sum, shift) => sum + calculatePaidHours(shift), 0);
      return {
        employee,
        hours,
        cost: hours * Number(employee.rate || 0)
      };
    })
    .filter((item) => item.hours > 0)
    .sort((a, b) => a.employee.name.localeCompare(b.employee.name, "pl"));

  employeeRows.forEach((item) => {
    rows.push([
      item.employee.name,
      item.employee.position || "",
      item.hours.toFixed(2),
      Number(item.employee.rate || 0).toFixed(2),
      item.cost.toFixed(2)
    ]);
  });

  rows.push([]);
  rows.push(["Suma", "", employeeRows.reduce((sum, item) => sum + item.hours, 0).toFixed(2), "", employeeRows.reduce((sum, item) => sum + item.cost, 0).toFixed(2)]);
  rows.push([]);
  rows.push(["Szczegoly dzienne"]);
  rows.push(["Data", "Pracownik", "Stanowisko", "Start", "Koniec", "Godziny", "Stawka", "Zarobki", "Notatka"]);

  getDailySummaries(shifts)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((day) => {
      day.items.forEach((item) => {
        rows.push([
          item.shift.date,
          item.employee.name,
          item.employee.position || "",
          item.shift.start,
          item.shift.end,
          item.hours.toFixed(2),
          Number(item.employee.rate || 0).toFixed(2),
          item.cost.toFixed(2),
          item.shift.note || ""
        ]);
      });
    });

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  download(`raport-ksiegowosc-${range}-${date}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.employees) || !Array.isArray(data.shifts)) throw new Error("Nieprawidlowy format");
      state = data;
      saveState();
      renderAll();
      showToast("Dane zaimportowane");
      autoSaveRemote();
    } catch {
      showToast("Nie udalo sie zaimportowac pliku");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function saveSettings(event) {
  event.preventDefault();
  localStorage.setItem(API_URL_KEY, els.apiUrl.value.trim());
  renderLinks();
  showToast("Ustawienia zapisane");
}

async function syncRemote() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    showToast("Najpierw wklej link API w Ustawieniach");
    showView("settings");
    return;
  }
  await loadRemote();
  await saveRemote();
}

async function loadRemote() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    showToast("Brak linku API");
    return;
  }
  try {
    const data = await jsonp(apiUrl);
    if (!Array.isArray(data.employees) || !Array.isArray(data.shifts)) throw new Error("Nieprawidlowe dane");
    state = data;
    saveState();
    renderAll();
    showToast("Pobrano dane z arkusza");
  } catch {
    showToast("Nie udalo sie pobrac danych");
  }
}

async function saveRemote() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    showToast("Brak linku API");
    return;
  }
  try {
    await fetch(apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(state)
    });
    showToast("Wyslano do arkusza");
  } catch {
    showToast("Nie udalo sie zapisac w arkuszu");
  }
}

function autoSaveRemote() {
  if (!getApiUrl()) return;
  saveRemote();
}

function getApiUrl() {
  return (els.apiUrl.value || localStorage.getItem(API_URL_KEY) || "").trim();
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callback = `grafikCallback${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}callback=${callback}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP error"));
    };
    window[callback] = (data) => {
      cleanup();
      resolve(data);
    };
    function cleanup() {
      delete window[callback];
      script.remove();
    }
    document.body.appendChild(script);
  });
}

function seedDemoShifts() {
  if (state.shifts.length || !state.employees.length) return;
  const [year, month] = currentMonth().split("-");
  state.shifts = state.employees.flatMap((employee, index) => [
    {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      date: `${year}-${month}-0${index + 1}`,
      start: "08:00",
      end: "16:00",
      breakMinutes: 0,
      type: "regular",
      multiplier: 1,
      note: ""
    },
    {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      date: `${year}-${month}-1${index + 1}`,
      start: "10:00",
      end: "18:00",
      breakMinutes: 0,
      type: "regular",
      multiplier: 1,
      note: ""
    }
  ]);
  saveState();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(initialState);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findEmployee(id) {
  return state.employees.find((employee) => employee.id === id);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function rangeLabel(range) {
  if (range === "day") return "Dzien";
  if (range === "week") return "Tydzien";
  return "Miesiac";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function money(value) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN"
  }).format(Number(value || 0));
}

function csvCell(value) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.deleteShift = deleteShift;
window.toggleDayDetails = toggleDayDetails;
