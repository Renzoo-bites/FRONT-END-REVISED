// Shared admin layout: injects the sidebar and top bar (edit ADMIN_NAV to change the menu),
// plus small helpers (icons, badges, escaping) that dashboard.js and reports.js use.
// Pages include <div id="admin-sidebar"></div> and <div id="admin-topbar"></div>,
// and <body data-page="..."> marks the active nav item.

const ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  claims: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  messages: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  analytics: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.6-4.6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  trendingUp: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  sparkles: '<path d="M12 3 9.9 8.9 4 11l5.9 2.1L12 19l2.1-5.9L20 11l-5.9-2.1z"/><path d="M19 3v4M17 5h4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  bag: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  idCard: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
};

// countKey pulls the badge number from AdminAPI.getNavCounts().
const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
  { id: "reports", label: "Reports", href: "reports.html", icon: "reports", countKey: "reports" },
  { id: "found-items", label: "Found Items", href: "found-items.html", icon: "box" },
  { id: "claims", label: "Claims", href: "claims.html", icon: "claims", countKey: "claims" },
  { id: "messages", label: "Messages", href: "messages.html", icon: "messages", countKey: "messages" },
  { id: "analytics", label: "Analytics", href: "analytics.html", icon: "analytics" },
  { id: "settings", label: "Settings", href: "settings.html", icon: "settings" },
];

const STATUS_LABELS = { pending: "Pending", matched: "Matched", ready: "Ready for claim", claimed: "Claimed" };
const TYPE_LABELS = { lost: "Lost", found: "Found" };
const CATEGORY_ICONS = { Electronics: "phone", Bags: "bag", Clothing: "shirt", "ID & Docs": "idCard", Accessories: "tag", Others: "box" };

const AdminUI = {
  icon(name, size = 20) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
  },

  // Everything from AdminAPI goes through this before it's put into HTML.
  escape(value) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value ?? "").replace(/[&<>"']/g, (ch) => entities[ch]);
  },

  statusBadge(status) {
    const label = STATUS_LABELS[status] || status;
    return `<span class="badge badge-status badge-${this.escape(status)}">${this.escape(label)}</span>`;
  },

  typeBadge(type) {
    return `<span class="badge badge-${this.escape(type)}">${this.escape(TYPE_LABELS[type] || type)}</span>`;
  },

  itemIcon(category) {
    return `<span class="item-icon">${this.icon(CATEGORY_ICONS[category] || "box", 18)}</span>`;
  },

  formatDate(isoDate, options = { month: "short", day: "numeric" }) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", options);
  },

  // "Now", "25m", "3h", "Yesterday", "Sep 12"
  timeAgo(iso) {
    const date = new Date(iso);
    const minutes = Math.floor((Date.now() - date) / 60000);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    if (date.toDateString() === new Date().toDateString()) return `${Math.floor(minutes / 60)}h`;
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },

  // The top bar search also finds a place by its old names and acronyms ("CBAA", "library"):
  // true when `query` names the place at `locationId` and the rest of it is in `haystack`
  // (lowercase). See ../js/data/locations.js.
  findsPlace(query, locationId, haystack) {
    const { places, rest } = Locations.extract(query);
    return places.length > 0 && Locations.fits(places, locationId, haystack) && haystack.includes(rest);
  },

  // Today's date as YYYY-MM-DD in local time (for date inputs)
  today() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  },
};

// Light / dark switch. The inline script in each page's <head> has already set data-theme
// (the saved choice, or the device setting on a first visit); this button flips it and saves
// the choice. user/js/main.js has the same switch for the student navbar. Pages with charts
// redraw them in the new colors on the "findit:theme-change" event.
const THEME_KEY = "findit.theme";

const THEME_ICONS = `
  <svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
  <svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>`;

const currentTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const themeLabel = () => (currentTheme() === "dark" ? "Switch to light mode" : "Switch to dark mode");

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.add("theme-changing"); // fades the colors for a moment (base.css)
  root.dataset.theme = theme;
  document.getElementById("theme-toggle").setAttribute("aria-label", themeLabel());
  setTimeout(() => root.classList.remove("theme-changing"), 300);
  // A chart keeps the colors it was drawn with, so pages with charts redraw them.
  document.dispatchEvent(new CustomEvent("findit:theme-change", { detail: { theme } }));
}

function setupThemeToggle() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage blocked: the choice lasts until the page reloads
    }
  });

  // Until someone picks a theme, keep following the device setting
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      // storage blocked: treat it as no choice
    }
    if (!saved) applyTheme(event.matches ? "dark" : "light");
  });

  // Switched in another tab
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY && (event.newValue === "dark" || event.newValue === "light")) applyTheme(event.newValue);
  });
}

function renderAdminSidebar() {
  const page = document.body.dataset.page;
  const links = ADMIN_NAV.map((item) => {
    const active = item.id === page;
    return `
          <li>
            <a href="${item.href}" class="sidebar-link${active ? " is-active" : ""}" data-nav="${item.id}"${active ? ' aria-current="page"' : ""}>
              ${AdminUI.icon(item.icon)}<span class="sidebar-label">${item.label}</span>
            </a>
          </li>`;
  }).join("");

  // .sidebar-label and .sidebar-logo-rest are what the collapsed sidebar hides (admin.css).
  return `
    <aside class="sidebar" id="sidebar">
      <a href="dashboard.html" class="sidebar-brand" aria-label="FindIt SWAFO Admin, dashboard">
        <span class="sidebar-logo">F<span class="sidebar-logo-rest">indIt</span></span>
        <span class="sidebar-tag">SWAFO ADMIN</span>
      </a>
      <nav class="sidebar-nav" aria-label="Admin">
        <ul>${links}</ul>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user"></div>
        <button type="button" class="sidebar-link logout-btn" id="logout-btn">
          ${AdminUI.icon("logout")}<span class="sidebar-label">Log out</span>
        </button>
      </div>
    </aside>
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>`;
}

// The bell and "Add found item" come alive in notifications.js and add-item.js.
function renderAdminTopbar() {
  return `
    <header class="topbar">
      <button type="button" class="icon-btn sidebar-toggle" id="sidebar-toggle" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">
        ${AdminUI.icon("menu")}
      </button>
      <form class="topbar-search" id="topbar-search" role="search" action="reports.html">
        ${AdminUI.icon("search", 18)}
        <input type="search" name="q" placeholder="Search items, reports..." aria-label="Search items and reports">
      </form>
      <div class="topbar-actions">
        <button type="button" class="icon-btn theme-toggle" id="theme-toggle" aria-label="${themeLabel()}">${THEME_ICONS}</button>
        <div class="notif-menu">
          <button type="button" class="icon-btn" id="notif-btn" aria-label="Notifications" aria-expanded="false" aria-controls="notif-panel">
            ${AdminUI.icon("bell")}<span class="notif-dot" hidden></span>
          </button>
          <div class="notif-panel" id="notif-panel" hidden></div>
        </div>
        <button type="button" class="admin-btn admin-btn-primary add-btn" id="add-item-btn">
          ${AdminUI.icon("plus", 18)}<span class="add-btn-label">Add found item</span>
        </button>
      </div>
    </header>`;
}

function mountAdmin(id, html) {
  const slot = document.getElementById(id);
  if (slot) slot.outerHTML = html;
}

// Collapsed (icon-only) sidebar on wide screens, remembered in this browser. Set before the
// sidebar is added so it doesn't flash open on every page.
const SIDEBAR_COLLAPSED_KEY = "findit.admin.sidebarCollapsed";
try {
  document.body.classList.toggle("sidebar-collapsed", localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
} catch {
  // storage blocked: the sidebar starts open
}

mountAdmin("admin-sidebar", renderAdminSidebar());
mountAdmin("admin-topbar", renderAdminTopbar());
setupThemeToggle();

AdminAPI.getCurrentUser().then((user) => {
  document.getElementById("sidebar-user").innerHTML = `
    <span class="avatar" aria-hidden="true">${AdminUI.escape(user.initials)}</span>
    <div>
      <p class="sidebar-user-name">${AdminUI.escape(user.name)}</p>
      <p class="sidebar-user-email">${AdminUI.escape(user.email)}</p>
    </div>`;
});

// Sidebar badges. Pages call refreshNavCounts() after reading messages; other tabs trigger it too.
function refreshNavCounts() {
  return AdminAPI.getNavCounts().then((counts) => {
    ADMIN_NAV.filter((item) => item.countKey).forEach((item) => {
      const link = document.querySelector(`[data-nav="${item.id}"]`);
      link.querySelector(".sidebar-count")?.remove();
      if (counts[item.countKey]) {
        link.insertAdjacentHTML("beforeend", `<span class="sidebar-count">${AdminUI.escape(counts[item.countKey])}</span>`);
      }
    });
  });
}

refreshNavCounts();
AdminAPI.onMessagesChange(refreshNavCounts);
AdminAPI.onClaimsChange(refreshNavCounts);

// Log out clears the session (auth.js) and returns to the public login page.
document.getElementById("logout-btn").addEventListener("click", () => {
  Auth.logout().then(() => window.location.replace("../user/login.html?role=admin&logged_out=1"));
});

// Menu button. Below 960px it opens the off-canvas sidebar; on wider screens it collapses the
// sidebar to icons and back (see admin.css).
const sidebarToggle = document.getElementById("sidebar-toggle");
const smallScreen = window.matchMedia("(max-width: 959px)");

function syncSidebarToggle() {
  const small = smallScreen.matches;
  const expanded = small
    ? document.body.classList.contains("sidebar-open")
    : !document.body.classList.contains("sidebar-collapsed");
  sidebarToggle.setAttribute("aria-expanded", String(expanded));
  sidebarToggle.setAttribute("aria-label", small
    ? (expanded ? "Close menu" : "Open menu")
    : (expanded ? "Collapse sidebar" : "Expand sidebar"));
}

function setSidebarOpen(open) {
  document.body.classList.toggle("sidebar-open", open);
  syncSidebarToggle();
  if (open) document.querySelector("#sidebar .sidebar-link").focus();
}

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  syncSidebarToggle();
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // storage blocked: remembered until the page reloads
  }
}

sidebarToggle.addEventListener("click", () => {
  if (smallScreen.matches) setSidebarOpen(!document.body.classList.contains("sidebar-open"));
  else setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
});

// Resizing across 960px closes the off-canvas menu and relabels the button for the new layout.
smallScreen.addEventListener("change", () => setSidebarOpen(false));
syncSidebarToggle();

document.getElementById("sidebar-backdrop").addEventListener("click", () => setSidebarOpen(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
    event.preventDefault(); // so the reports detail panel doesn't also close on the same key press
    setSidebarOpen(false);
    sidebarToggle.focus();
  }
});
