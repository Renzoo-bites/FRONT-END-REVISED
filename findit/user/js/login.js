// Login: User / Admin switch plus the email/password check in auth.js.
// Admins land on the admin dashboard, users on My Reports. The account has to match the
// side that's selected, so a student can't get in through the Admin side.

const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const loginNotice = document.querySelector("#login-notice");

const HOME_FOR_ROLE = {
  user: "my-reports.html",
  admin: "../admin/dashboard.html",
};

const ROLE_MISMATCH = {
  admin: "This account doesn't have admin access.",
  user: "This is an admin account. Switch to Admin to log in.",
};

function setRole(role) {
  // Swap the wording that differs between the two sides, and show/hide side-specific bits.
  document.querySelectorAll("[data-user]").forEach((el) => {
    el.textContent = el.dataset[role];
  });
  document.querySelectorAll("[data-show-for]").forEach((el) => {
    el.hidden = el.dataset.showFor !== role;
  });
  loginError.hidden = true;
}

function showError(message) {
  loginNotice.hidden = true;
  loginError.textContent = message;
  loginError.hidden = false;
}

loginForm.querySelectorAll("input[name='role']").forEach((input) => {
  input.addEventListener("change", () => setRole(input.value));
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const { email, password, remember } = loginForm.elements;
  const role = loginForm.querySelector("input[name='role']:checked").value;

  Auth.login(email.value, password.value, { role, remember: remember.checked }).then(({ session, error }) => {
    if (error === "role") return showError(ROLE_MISMATCH[role]);
    if (error) {
      showError("Incorrect email or password.");
      password.value = "";
      password.focus();
      return;
    }
    window.location.href = HOME_FOR_ROLE[session.role];
  });
});

// login.html?role=admin opens on the Admin side (the admin pages send you here that way),
// and the admin "Log out" button adds &logged_out=1.
const loginParams = new URLSearchParams(window.location.search);
const initialRole = loginParams.get("role") === "admin" ? "admin" : "user";
loginForm.querySelector(`input[name='role'][value='${initialRole}']`).checked = true;
setRole(initialRole);
loginNotice.hidden = !loginParams.has("logged_out");
