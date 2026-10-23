// Analytics: charts computed from every report (AdminAPI.getReports(), which includes items
// logged with "+ Add found item"). The Period filter scopes every number on the page.
// Chart colors are --chart-* in css/base.css (light and dark), checked for contrast and color-blind separation.

const chartVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const total = (values) => values.reduce((sum, n) => sum + n, 0);

const STATUS_ROWS = [
  { status: "pending", label: "Pending" },
  { status: "matched", label: "Matched" },
  { status: "ready", label: "Ready for claim" },
  { status: "claimed", label: "Claimed" },
];

const analytics = {
  reports: [],
  categories: [],
  period: "", // "YYYY-MM", or "" for all time
  charts: {},
};

if (window.Chart) {
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = chartVar("--chart-text");
}

// Tooltips list the value first, then the series, keyed with a short line in its color.
const ANALYTICS_TOOLTIP = {
  backgroundColor: chartVar("--card"),
  titleColor: chartVar("--text"),
  bodyColor: chartVar("--text-muted"),
  borderColor: chartVar("--border"),
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  boxPadding: 4,
  usePointStyle: true,
  callbacks: {
    label: (ctx) => ` ${ctx.formattedValue} ${ctx.dataset.label || "reports"}`,
    labelPointStyle: () => ({ pointStyle: "line", rotation: 0 }),
    labelColor: (ctx) => ({
      borderColor: ctx.element.options.backgroundColor,
      backgroundColor: ctx.element.options.backgroundColor,
      borderWidth: 3,
    }),
  },
};

// Writes each bar's value just past its tip (horizontal bar charts).
const barValueLabels = {
  id: "barValueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = `600 12px ${Chart.defaults.font.family}`;
    ctx.fillStyle = chartVar("--text");
    ctx.textBaseline = "middle";
    chart.getDatasetMeta(0).data.forEach((bar, i) => {
      ctx.fillText(chart.data.datasets[0].data[i], bar.x + 6, bar.y);
    });
    ctx.restore();
  },
};

function tableHTML(headers, rows) {
  return `
    <table class="admin-table">
      <thead><tr>${headers.map((h) => `<th scope="col">${AdminUI.escape(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(([first, ...rest]) => `
        <tr><th scope="row">${AdminUI.escape(first)}</th>${rest.map((v) => `<td class="num">${AdminUI.escape(v)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>`;
}

function showChartFallback(canvas) {
  const message = document.createElement("p");
  message.className = "chart-fallback";
  message.textContent = "Chart couldn't load. Check your internet connection.";
  canvas.replaceWith(message);
}

// Creates the chart the first time, then just swaps its data.
function drawChart(key, canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!window.Chart) {
    if (canvas) showChartFallback(canvas);
    return;
  }
  const existing = analytics.charts[key];
  if (existing) {
    existing.data = config.data;
    existing.update();
  } else {
    analytics.charts[key] = new Chart(canvas, config);
  }
}

// Long place names ("Aklatang Emilio Aguinaldo – Main Building (AEA)") go on two lines, or
// Chart.js cuts the start off to keep the axis narrow.
const wrapLabel = (text, width = 28) => text.split(" ").reduce((lines, word) => {
  const last = lines[lines.length - 1];
  if (last && `${last} ${word}`.length <= width) lines[lines.length - 1] = `${last} ${word}`;
  else lines.push(word);
  return lines;
}, []);

function horizontalBarConfig(labels, values) {
  return {
    type: "bar",
    data: {
      labels: labels.map((label) => wrapLabel(label)),
      datasets: [{ data: values, backgroundColor: chartVar("--chart-cat-1"), borderRadius: 4, maxBarThickness: 18 }],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      layout: { padding: { right: 32 } },
      plugins: { legend: { display: false }, tooltip: ANALYTICS_TOOLTIP },
      scales: {
        x: { beginAtZero: true, border: { display: false }, grid: { color: chartVar("--chart-grid") }, ticks: { precision: 0, maxTicksLimit: 5 } },
        y: { grid: { display: false }, border: { color: chartVar("--chart-axis") } },
      },
    },
    plugins: [barValueLabels],
  };
}

// Horizontal bar charts get taller with more rows, so labels never squeeze.
function sizeForRows(canvasId, rows) {
  const box = document.getElementById(canvasId)?.parentElement;
  if (box) box.style.height = `${Math.max(160, rows * 36 + 40)}px`;
}

/* ---------- Sections ---------- */

function renderStats(reports) {
  const lost = reports.filter((r) => r.type === "lost").length;
  const found = reports.length - lost;
  const claimed = reports.filter((r) => r.status === "claimed").length;
  const share = (n) => (reports.length ? `${Math.round((n / reports.length) * 100)}% of reports` : "No reports");
  const stats = [
    { value: reports.length, label: "Total reports", note: analytics.period ? "In this period" : "All time", icon: "reports" },
    { value: lost, label: "Lost reports", note: share(lost), icon: "search" },
    { value: found, label: "Found reports", note: share(found), icon: "box" },
    { value: claimed, label: "Returned to owners", note: share(claimed), icon: "checkCircle" },
  ];
  document.getElementById("analytics-stats").innerHTML = stats.map((s) => `
    <article class="admin-card stat-card">
      <div class="stat-top"><span class="stat-icon">${AdminUI.icon(s.icon, 22)}</span></div>
      <p class="stat-value">${s.value}</p>
      <p class="stat-label">${s.label}</p>
      <p class="stat-note">${s.note}</p>
    </article>`).join("");
}

// All time: by month. One month picked: by week of that month.
function renderTrend(reports) {
  const byWeek = Boolean(analytics.period);
  const keyOf = (r) => (byWeek ? `Week ${Math.ceil(Number(r.date.slice(8, 10)) / 7)}` : r.date.slice(0, 7));
  const keys = byWeek
    ? ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"].filter((week, i) => i < 4 || reports.some((r) => keyOf(r) === week))
    : [...new Set(reports.map(keyOf))].sort();
  const labels = byWeek ? keys : keys.map((month) => AdminUI.formatDate(`${month}-01`, { month: "short", year: "numeric" }));
  const series = [
    { label: "Lost", color: chartVar("--chart-lost"), data: keys.map((k) => reports.filter((r) => keyOf(r) === k && r.type === "lost").length) },
    { label: "Found", color: chartVar("--chart-found"), data: keys.map((k) => reports.filter((r) => keyOf(r) === k && r.type === "found").length) },
  ];

  document.getElementById("trend-heading").textContent = byWeek ? "Reports by week" : "Reports by month";
  document.getElementById("trend-legend").innerHTML = series
    .map((s) => `<li><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`).join("");
  document.getElementById("trend-table").innerHTML = tableHTML(
    [byWeek ? "Week" : "Month", ...series.map((s) => s.label)],
    labels.map((label, i) => [label, ...series.map((s) => s.data[i])]),
  );
  document.getElementById("trend-chart")?.setAttribute("aria-label",
    `Bar chart of lost and found reports ${byWeek ? "by week" : "by month"}: ${total(series[0].data)} lost, ${total(series[1].data)} found.`);

  drawChart("trend", "trend-chart", {
    type: "bar",
    data: {
      labels,
      datasets: series.map((s) => ({
        label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 4, maxBarThickness: 22, categoryPercentage: 0.6, barPercentage: 0.85,
      })),
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: ANALYTICS_TOOLTIP },
      scales: {
        x: { grid: { display: false }, border: { color: chartVar("--chart-axis") } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: chartVar("--chart-grid") }, ticks: { precision: 0, maxTicksLimit: 5 } },
      },
    },
  });
}

function renderCounts(key, rows, headers, describe) {
  const labels = rows.map(([label]) => label);
  const values = rows.map(([, value]) => value);
  document.getElementById(`${key}-table`).innerHTML = tableHTML(headers, rows);
  document.getElementById(`${key}-chart`)?.setAttribute("aria-label",
    `${describe}: ${rows.map(([label, value]) => `${label} ${value}`).join(", ")}.`);
  sizeForRows(`${key}-chart`, rows.length);
  drawChart(key, `${key}-chart`, horizontalBarConfig(labels, values));
}

function renderAll() {
  const reports = analytics.reports.filter((r) => !analytics.period || r.date.startsWith(analytics.period));
  const countWhere = (test) => reports.filter(test).length;

  renderStats(reports);
  renderTrend(reports);

  renderCounts("status",
    STATUS_ROWS.map(({ status, label }) => [label, countWhere((r) => r.status === status)]),
    ["Status", "Reports"], "Bar chart of reports by status");

  // Counted by location id, so all "Other / Not sure" reports are one row, whatever was typed.
  const byLocation = {};
  reports.forEach((r) => { byLocation[r.locationId] = (byLocation[r.locationId] || 0) + 1; });
  renderCounts("location",
    Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, count]) => [Locations.label(id), count]),
    ["Location", "Reports"], "Bar chart of the top locations");

  renderCounts("category",
    analytics.categories.map((category) => [category, countWhere((r) => r.category === category)]),
    ["Category", "Reports"], "Bar chart of reports by category");
}

/* ---------- Start ---------- */

const periodFilter = document.getElementById("period-filter");

periodFilter.addEventListener("change", () => {
  analytics.period = periodFilter.value;
  renderAll();
});

function loadAnalytics() {
  return Promise.all([AdminAPI.getReports(), AdminAPI.getCategories()]).then(([reports, categories]) => {
    analytics.reports = reports;
    analytics.categories = categories;
    const months = [...new Set(reports.map((r) => r.date.slice(0, 7)))].sort().reverse();
    periodFilter.innerHTML = '<option value="">All time</option>' + months
      .map((month) => `<option value="${month}">${AdminUI.formatDate(`${month}-01`, { month: "long", year: "numeric" })}</option>`).join("");
    periodFilter.value = months.includes(analytics.period) ? analytics.period : "";
    analytics.period = periodFilter.value;
    renderAll();
  });
}

// New items (here, or in another tab) change the numbers.
document.addEventListener("findit:item-added", loadAnalytics);
ItemStore.subscribe(loadAnalytics);

// Wait for the web font, or Chart.js measures the axis labels too narrow and clips them.
(document.fonts ? document.fonts.ready : Promise.resolve()).then(loadAnalytics);
