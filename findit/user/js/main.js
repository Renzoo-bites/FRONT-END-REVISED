// Shared layout for every page: edit the navbar and footer here, not in the HTML files.
// Pages include <div id="navbar"></div> and <div id="footer"></div> placeholders,
// and <body data-page="..."> sets which nav link is highlighted.
// Load ../js/auth.js before this file so the navbar can show who's logged in.

const navSession = typeof Auth !== "undefined" ? Auth.getSession() : null;

const NAV_LINKS = [
  { page: "home", label: "Home", href: "index.html" },
  { page: "browse", label: "Browse", href: "items.html" },
  { page: "report", label: "Report", href: "report.html" },
  navSession
    ? { page: "my-reports", label: "My Reports", href: "my-reports.html" }
    : { page: "about", label: "About", href: "about.html" },
];

const FOOTER_LINKS = [
  { label: "Browse items", href: "items.html" },
  { label: "Report an item", href: "report.html" },
  { label: "My Reports", href: "my-reports.html" },
  { label: "About", href: "about.html" },
];

// The FindIt mark: a claim tag with its punched hole, like the ones SWAFO ties to found items.
const LOGO_MARK = `
  <svg class="logo-mark" viewBox="0 0 30 22" aria-hidden="true">
    <path fill="currentColor" fill-rule="evenodd" d="M8 1h19a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8l-7-7V8zm1.5 10a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0z" />
  </svg>`;

const currentFile = window.location.pathname.split("/").pop() || "index.html";
const currentPage = document.body.dataset.page;

const BELL_ICON = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>`;

const EYE_ICON = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>`;

const EYE_OFF_ICON = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </svg>`;

// Light / dark switch. The inline script in each page's <head> has already set data-theme
// (the saved choice, or the device setting on a first visit); this button flips it and saves
// the choice. admin/js/admin.js has the same switch for the admin top bar.
const THEME_KEY = "findit.theme";

const THEME_ICONS = `
  <svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
  <svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>`;

const currentTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const themeLabel = () => (currentTheme() === "dark" ? "Switch to light mode" : "Switch to dark mode");

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.add("theme-changing"); // fades the colors for a moment (base.css)
  root.dataset.theme = theme;
  document.getElementById("theme-toggle").setAttribute("aria-label", themeLabel());
  setTimeout(() => root.classList.remove("theme-changing"), 300);
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

// Also used by the page scripts (items.js, item-details.js, claim.js) for data they render.
function escapeText(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (ch) => entities[ch]);
}

// "active" also highlights sub-pages (item-details → Browse); aria-current is only for the exact page.
function ariaCurrent(href) {
  return href === currentFile ? ' aria-current="page"' : "";
}

function renderNavActions() {
  const themeButton = `<button type="button" class="nav-icon-btn theme-toggle" id="theme-toggle" aria-label="${themeLabel()}">${THEME_ICONS}</button>`;
  if (!navSession) {
    return `
        <div class="nav-actions">
          ${themeButton}
          <a href="login.html" class="btn btn-quiet"${ariaCurrent("login.html")}>Log in</a>
          <a href="signup.html" class="btn btn-secondary"${ariaCurrent("signup.html")}>Sign up</a>
        </div>`;
  }

  const adminLink = navSession.role === "admin" ? '<a href="../admin/dashboard.html">Admin dashboard</a>' : "";
  // The bell opens Messages; on Messages it stays highlighted and takes you back home, like a toggle.
  const bellLink = currentFile === "messages.html"
    ? `<a href="index.html" class="nav-icon-btn is-open" aria-label="Close Messages" title="Back to home">${BELL_ICON}</a>`
    : `<a href="messages.html" class="nav-icon-btn" aria-label="Messages">${BELL_ICON}</a>`;
  return `
        <div class="nav-actions">
          ${themeButton}
          ${bellLink}
          <div class="account-menu">
            <button type="button" class="avatar-btn" id="account-btn" aria-label="Account menu" aria-expanded="false" aria-controls="account-dropdown">
              ${escapeText(Auth.initials(navSession.name))}
            </button>
            <div class="account-dropdown" id="account-dropdown" hidden>
              <p class="account-head"><strong>${escapeText(navSession.name)}</strong><span>${escapeText(navSession.email)}</span></p>
              <a href="my-reports.html">My Reports</a>
              <a href="messages.html">Messages</a>
              <a href="settings.html">Settings</a>
              ${adminLink}
              <hr class="account-divider">
              <button type="button" id="nav-logout">Log out</button>
            </div>
          </div>
        </div>`;
}

function renderNavbar() {
  const links = NAV_LINKS.map(({ page, label, href }) => {
    const active = page === currentPage ? ' class="active"' : "";
    return `<li><a href="${href}"${active}${ariaCurrent(href)}>${label}</a></li>`;
  }).join("");

  return `
    <header class="navbar">
      <div class="container">
        <a href="index.html" class="logo">${LOGO_MARK}<span class="logo-text">FindIt <span class="logo-sub">SWAFO Lost and Found</span></span></a>

        <nav aria-label="Main">
          <ul class="nav-links">${links}</ul>
        </nav>
        ${renderNavActions()}
      </div>
    </header>`;
}

function renderFooter() {
  const links = FOOTER_LINKS.map(({ label, href }) => `<li><a href="${href}">${label}</a></li>`).join("");

  return `
    <footer class="footer">
      <div class="container">
        <div>
          <p class="footer-brand">${LOGO_MARK}FindIt</p>
          <p class="footer-office">Run by the Student Welfare and Formation Office (SWAFO), De La Salle University&ndash;Dasmari&ntilde;as. Found items are kept and released at the SWAFO office.</p>
        </div>
        <nav aria-label="Footer">
          <ul class="footer-links">${links}</ul>
        </nav>
        <small>&copy; ${new Date().getFullYear()} SWAFO Lost and Found</small>
      </div>
    </footer>`;
}

function mount(id, html) {
  const slot = document.getElementById(id);
  if (slot) slot.outerHTML = html;
}

function setupAccountMenu() {
  const button = document.getElementById("account-btn");
  if (!button) return;
  const menu = document.getElementById("account-dropdown");

  const setOpen = (open) => {
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", () => setOpen(menu.hidden));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".account-menu")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault(); // so page-level Escape handlers (e.g. Messages panels) skip this press
      setOpen(false);
      button.focus();
    }
  });

  document.getElementById("nav-logout").addEventListener("click", () => {
    Auth.logout().then(() => window.location.replace("index.html"));
  });
}

// Every password box (Login, Sign up) gets an eye button that shows or hides what's typed.
function setupPasswordToggles() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const field = document.createElement("div");
    field.className = "password-field";
    input.before(field);
    field.append(input);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "password-toggle";
    field.append(button);

    // Named after the field ("Show password", "Show new password"), so several on a page differ.
    const fieldName = (input.labels[0]?.textContent || "password").replace("*", "").trim().toLowerCase();
    const setShown = (shown) => {
      input.type = shown ? "text" : "password";
      button.setAttribute("aria-label", `${shown ? "Hide" : "Show"} ${fieldName}`);
      button.innerHTML = shown ? EYE_OFF_ICON : EYE_ICON;
    };
    setShown(false);
    button.addEventListener("click", () => setShown(input.type === "password"));
  });
}

mount("navbar", renderNavbar());
mount("footer", renderFooter());
setupThemeToggle();
setupAccountMenu();
setupPasswordToggles();

// Until there's a backend, forms with data-redirect skip the real submit and go
// straight to the next page. Native validation (required, type="email", ...) still runs first.
document.querySelectorAll("form[data-redirect]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = form.dataset.redirect;
  });
});
