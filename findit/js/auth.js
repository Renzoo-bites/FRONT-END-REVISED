// Mock login until there's a backend. The accounts below exist only for testing: real
// passwords must never ship in frontend code, and the server has to do the actual check.
// To connect the backend, make Auth.login call your login API and resolve to the same
// { session } / { error } shapes described on the method.

const MOCK_ACCOUNTS = [
  { email: "swafo@dlsud.edu.ph", password: "admin123", name: "SWAFO Staff", role: "admin" },
  { email: "student@example.com", password: "student123", name: "Juan Dela Cruz", role: "user" },
];

const SESSION_KEY = "findit.session";

// Words that start a surname, so "Juan Dela Cruz" -> "JD" and "Ana De los Santos" -> "AD".
const SURNAME_PREFIXES = ["de", "del", "dela", "delos", "los", "la", "las", "san", "santa", "sta", "da", "di", "van", "von"];

const Auth = {
  // Resolves to { session: { name, email, role } } on success, or { error } where error is
  // "credentials" (wrong email/password) or "role" (the account isn't the role asked for).
  login(email, password, { role, remember = false } = {}) {
    const account = MOCK_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password,
    );
    if (!account) return Promise.resolve({ error: "credentials" });
    if (role && account.role !== role) return Promise.resolve({ error: "role" });

    const session = { name: account.name, email: account.email, role: account.role };
    try {
      // "Remember me" keeps the session after the browser closes; otherwise it ends with the tab.
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Storage blocked (e.g. private mode): the login still works for this page load.
    }
    return Promise.resolve({ session });
  },

  getSession() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing stored, nothing to clear.
    }
    return Promise.resolve();
  },

  // Changes the saved session in place (a new name from the student Settings page), so the
  // navbar shows it on every page. With a backend, refresh the session from the profile instead.
  updateSession(changes) {
    const session = this.getSession();
    if (!session) return;
    const updated = JSON.stringify({ ...session, ...changes });
    try {
      if (sessionStorage.getItem(SESSION_KEY)) sessionStorage.setItem(SESSION_KEY, updated);
      if (localStorage.getItem(SESSION_KEY)) localStorage.setItem(SESSION_KEY, updated);
    } catch {
      // Storage blocked: the old name shows until the next login.
    }
  },

  // Avatar initials for a person's name (the navbar, and students in the admin Messages page).
  initials(name) {
    const parts = String(name).trim().split(/\s+/);
    let surname = parts.length - 1;
    while (surname > 1 && SURNAME_PREFIXES.includes(parts[surname - 1].toLowerCase())) surname -= 1;
    return (parts[0][0] + (parts.length > 1 ? parts[surname][0] : "")).toUpperCase();
  },

  // Sends visitors without the right role to the login page. This only hides the pages in
  // the mock; the server must also refuse admin data to anyone who isn't an admin.
  requireRole(role, loginPage) {
    if (this.getSession()?.role !== role) window.location.replace(loginPage);
  },
};
