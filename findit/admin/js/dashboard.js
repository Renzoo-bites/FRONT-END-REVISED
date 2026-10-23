// Dashboard: greeting, stat cards, weekly bar chart, category donut, and today's lost items.
// Chart colors live in css/base.css (--chart-*, light and dark) so the theme stays in one place.

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const esc = (value) => AdminUI.escape(value);
const sum = (values) => values.reduce((total, n) => total + n, 0);

const TREND_ICONS = { up: "arrowUp", down: "arrowDown" };

// Tooltips list the value first, then the series, keyed with a short line in the series color.
const TOOLTIP = {
  backgroundColor: cssVar("--card"),
  titleColor: cssVar("--text"),
  bodyColor: cssVar("--text-muted"),
  borderColor: cssVar("--border"),
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  boxPadding: 4,
  usePointStyle: true,
  callbacks: {
    label: (ctx) => ` ${ctx.formattedValue} ${ctx.dataset.label || ctx.label}`,
    labelPointStyle: () => ({ pointStyle: "line", rotation: 0 }),
    labelColor: (ctx) => ({
      borderColor: ctx.element.options.backgroundColor,
      backgroundColor: ctx.element.options.backgroundColor,
      borderWidth: 3,
    }),
  },
};

if (window.Chart) {
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = cssVar("--chart-text");
}

function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Chart.js loads from a CDN; without it, say so instead of leaving an empty box.
function showChartFallback(canvas) {
  const message = document.createElement("p");
  message.className = "chart-fallback";
  message.textContent = "Chart couldn't load. Check your internet connection.";
  canvas.replaceWith(message);
}

function renderStats(stats) {
  document.getElementById("stat-grid").innerHTML = stats.map((stat) => {
    const trendIcon = TREND_ICONS[stat.trend.direction];
    return `
      <article class="admin-card stat-card">
        <div class="stat-top">
          <span class="stat-icon">${AdminUI.icon(stat.icon, 22)}</span>
          <span class="trend trend-${esc(stat.trend.sentiment)}">
            ${trendIcon ? AdminUI.icon(trendIcon, 13) : ""}${esc(stat.trend.text)}
          </span>
        </div>
        <p class="stat-value">${esc(stat.value)}</p>
        <p class="stat-label">${esc(stat.label)}</p>
      </article>`;
  }).join("");
}

function renderWeeklyChart({ labels, reported, recovered }) {
  const series = [
    { label: "Reported", data: reported, color: cssVar("--chart-reported") },
    { label: "Recovered", data: recovered, color: cssVar("--chart-recovered") },
  ];

  document.getElementById("weekly-legend").innerHTML = series
    .map((s) => `<li><span class="swatch" style="background:${s.color}"></span>${s.label}</li>`)
    .join("");

  document.getElementById("weekly-table").innerHTML = `
    <table class="admin-table">
      <thead>
        <tr><th scope="col">Day</th>${series.map((s) => `<th scope="col">${s.label}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${labels.map((day, i) => `
          <tr><th scope="row">${esc(day)}</th>${series.map((s) => `<td class="num">${esc(s.data[i])}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>`;

  const canvas = document.getElementById("weekly-chart");
  canvas.setAttribute("aria-label", `Bar chart of reports this week: ${sum(reported)} reported, ${sum(recovered)} recovered.`);
  if (!window.Chart) return showChartFallback(canvas);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: series.map((s) => ({
        label: s.label,
        data: s.data,
        backgroundColor: s.color,
        borderRadius: 4,
        maxBarThickness: 16,
        categoryPercentage: 0.6,
        barPercentage: 0.85,
      })),
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: TOOLTIP },
      scales: {
        x: { grid: { display: false }, border: { color: cssVar("--chart-axis") } },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: cssVar("--chart-grid") },
          ticks: { precision: 0, maxTicksLimit: 5 },
        },
      },
    },
  });
}

function renderCategoryChart(items, categories) {
  // Color follows the category (its slot in the categories list), never its position in this chart.
  const colorFor = (category) => cssVar(`--chart-cat-${categories.indexOf(category) + 1}`);
  const total = sum(items.map((item) => item.count));
  const totalEl = document.getElementById("category-total");

  totalEl.innerHTML = `<strong>${total}</strong><span>total</span>`;
  document.getElementById("category-legend").innerHTML = items.map((item) => `
    <li>
      <span class="swatch" style="background:${colorFor(item.category)}"></span>
      ${esc(item.category)}
      <span class="count">${esc(item.count)}</span>
    </li>`).join("");

  const canvas = document.getElementById("category-chart");
  const summary = items.map((item) => `${item.category} ${item.count}`).join(", ");
  canvas.setAttribute("aria-label", `Donut chart of ${total} items by category: ${summary}.`);
  if (!window.Chart) {
    totalEl.hidden = true;
    return showChartFallback(canvas);
  }

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: items.map((item) => item.category),
      datasets: [{
        data: items.map((item) => item.count),
        backgroundColor: items.map((item) => colorFor(item.category)),
        borderColor: cssVar("--card"),
        borderWidth: 2,
        hoverOffset: 4,
      }],
    },
    options: {
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: { legend: { display: false }, tooltip: TOOLTIP },
    },
  });
}

function renderLostToday(rows) {
  document.getElementById("today-body").innerHTML = rows.map((row) => `
    <tr>
      <td><span class="item-cell">${AdminUI.itemIcon(row.category)}${esc(row.name)}</span></td>
      <td>${esc(row.category)}</td>
      <td>${esc(Locations.label(row.locationId, row.locationOther))}</td>
      <td>${esc(row.reportedBy)}</td>
      <td>${AdminUI.statusBadge(row.status)}</td>
      <td class="cell-muted num">${esc(row.time)}</td>
    </tr>`).join("");
}

AdminAPI.getCurrentUser().then((user) => {
  document.getElementById("greeting").textContent = `${timeOfDayGreeting()}, ${user.greetingName}`;
});

Promise.all([AdminAPI.getDashboard(), AdminAPI.getCategories()]).then(([dashboard, categories]) => {
  renderStats(dashboard.stats);
  renderWeeklyChart(dashboard.weeklyReports);
  renderCategoryChart(dashboard.itemsByCategory, categories);
  renderLostToday(dashboard.lostToday);
});
