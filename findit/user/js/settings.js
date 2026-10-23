// Settings page: profile, password, notification switches, and deleting the account.
// Logged-in students only (settings.html sends everyone else to the login page).
// There's no backend yet: AccountAPI keeps each account's settings in this browser's
// localStorage, and every TODO(backend) says which Supabase call replaces it.
// Desktop shows one section at a time from the sidebar; below 900px they're stacked (settings.css).

/* ---------- Demo data (replace with the backend) ---------- */

const ACCOUNT_KEY = "findit.account-settings.v1";
const DEFAULT_NOTIFICATIONS = { match: true, message: true, status: true, email: false };

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) || {};
  } catch {
    return {};
  }
}

// Throws if storage is blocked or full (a big photo); the callers turn that into an error toast.
function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
}

if (new URLSearchParams(window.location.search).has("reset-demo")) {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    // nothing saved
  }
}

// Promise-based like UserAPI (js/mock-data.js), so the page code below stays the same when the
// method bodies become Supabase calls. `user` in the TODOs is supabase.auth.getUser()'s user.
const AccountAPI = {
  // TODO(backend): load the student's profile, e.g.
  //   supabase.from("profiles")
  //     .select("full_name, phone, avatar_url, notify_match, notify_message, notify_status, notify_email")
  //     .eq("id", user.id).single()
  // Resolves to { name, email, phone, photo (URL or null), notifications: { match, message, status, email } }.
  getAccount() {
    const session = Auth.getSession();
    const saved = readAccounts()[session.email] || {};
    return Promise.resolve({
      name: session.name,
      email: session.email,
      phone: saved.phone || "",
      photo: saved.photo || null,
      notifications: { ...DEFAULT_NOTIFICATIONS, ...saved.notifications },
    });
  },

  // photo: a shrunk JPEG data URL from ../js/photos.js, or null to remove it.
  // TODO(backend): upload a new photo to Storage, e.g.
  //   supabase.storage.from("avatars").upload(`${user.id}.jpg`, blob, { upsert: true })
  // then save the row:
  //   supabase.from("profiles").update({ full_name: name, phone, avatar_url }).eq("id", user.id)
  // The navbar shows the name from the session, so refresh the session afterwards.
  saveProfile({ name, phone, photo }) {
    return new Promise((resolve) => {
      const { email } = Auth.getSession();
      const accounts = readAccounts();
      accounts[email] = { ...accounts[email], phone, photo };
      writeAccounts(accounts);
      Auth.updateSession({ name });
      resolve();
    });
  },

  // TODO(backend): check the current password, then change it, e.g.
  //   supabase.auth.signInWithPassword({ email, password: currentPassword })  // error = wrong password
  //   supabase.auth.updateUser({ password: newPassword })
  // Resolves to {} on success, or { error: "current-password" } when the current one is wrong.
  changePassword(currentPassword, newPassword) {
    // Demo: checks the mock accounts in ../js/auth.js but can't change them, so the old password
    // still logs in. newPassword is only used by the real call.
    const { email } = Auth.getSession();
    const account = MOCK_ACCOUNTS.find((a) => a.email === email);
    return Promise.resolve(account && account.password === currentPassword ? {} : { error: "current-password" });
  },

  // TODO(backend):
  //   supabase.from("profiles").update({ notify_match, notify_message, notify_status, notify_email }).eq("id", user.id)
  saveNotifications(notifications) {
    return new Promise((resolve) => {
      const { email } = Auth.getSession();
      const accounts = readAccounts();
      accounts[email] = { ...accounts[email], notifications };
      writeAccounts(accounts);
      resolve();
    });
  },

  // TODO(backend): deleting a login needs the service role key, which must never be in the
  // browser. Call a server endpoint or Supabase Edge Function that checks the caller and runs
  // supabase.auth.admin.deleteUser(user.id) (plus their profile, photo, reports and messages),
  // then supabase.auth.signOut() here.
  deleteAccount() {
    // Demo: forgets this browser's saved settings and logs out; the mock account stays.
    return new Promise((resolve) => {
      const accounts = readAccounts();
      delete accounts[Auth.getSession().email];
      writeAccounts(accounts);
      resolve();
    }).then(() => Auth.logout());
  },
};

/* ---------- Toasts and inline errors ---------- */

const CHECK_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>';
const STORAGE_ERROR = "Couldn't save. Browser storage may be full or blocked.";

const toastRegion = document.getElementById("toast-region");

function showToast(message, { error = false } = {}) {
  const toast = document.createElement("p");
  toast.className = error ? "toast toast-error" : "toast";
  toast.innerHTML = `${error ? "" : CHECK_ICON}<span>${escapeText(message)}</span>`;
  toastRegion.append(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Shows a message under a field (or clears it with ""), and marks the field invalid.
function setError(field, message) {
  const error = document.getElementById(`${field.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (message) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}

// checks: Map of field -> (value) => error message, or "" when it's fine. Shows every error and
// focuses the first bad field. Returns true when everything passes.
function validate(checks) {
  let firstInvalid = null;
  checks.forEach((check, field) => {
    const message = check(field.value);
    setError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });
  firstInvalid?.focus();
  return !firstInvalid;
}

// Errors appear on submit; while typing they only clear once the field is fixed.
function clearErrorsWhileTyping(form, checks) {
  form.addEventListener("input", () => {
    checks.forEach((check, field) => {
      if (field.getAttribute("aria-invalid") === "true") setError(field, check(field.value));
    });
  });
}

function submitButtonOf(form) {
  return form.querySelector('[type="submit"]');
}

/* ---------- Sidebar sections ---------- */

const navLinks = document.querySelectorAll(".settings-nav a");
const sections = document.querySelectorAll(".settings-section");

function showSection(id, { focus = false } = {}) {
  const section = [...sections].find((s) => s.id === id) || sections[0];
  sections.forEach((s) => s.classList.toggle("is-active", s === section));
  navLinks.forEach((link) => {
    if (link.hash === `#${section.id}`) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
  if (focus) section.querySelector("h2").focus();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    history.replaceState(null, "", link.hash);
    showSection(link.hash.slice(1), { focus: true });
  });
});

// settings.html#account (or #notifications, ...) opens that section
window.addEventListener("hashchange", () => showSection(window.location.hash.slice(1)));
showSection(window.location.hash.slice(1));

/* ---------- Profile ---------- */

const profileForm = document.getElementById("profile-form");
const nameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photo-preview");
const photoPick = document.getElementById("photo-pick");
const photoRemove = document.getElementById("photo-remove");
const photoError = document.getElementById("photo-error");

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
let photo = null; // what the preview shows; saved with "Save changes"

// 7 to 15 digits, with optional +, spaces, dashes and brackets: 0917 123 4567, +63 917 123 4567, (046) 481-1900
const isPhoneNumber = (value) => /^\+?[\d\s()-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, ""));

const profileChecks = new Map([
  [nameInput, (value) => (value.trim().length < 2 ? "Enter your full name." : "")],
  [phoneInput, (value) => (value.trim() && !isPhoneNumber(value.trim()) ? "Enter a valid contact number, like 0917 123 4567." : "")],
]);

function renderPhoto() {
  if (photo) {
    const img = document.createElement("img");
    img.src = photo;
    img.alt = "Your profile photo";
    photoPreview.replaceChildren(img);
  } else {
    const name = nameInput.value.trim();
    photoPreview.innerHTML = `<span aria-hidden="true">${name ? escapeText(Auth.initials(name)) : ""}</span>`;
  }
  photoPick.textContent = photo ? "Change photo" : "Upload photo";
  photoRemove.hidden = !photo;
}

function showPhotoError(message) {
  photoError.textContent = message;
  photoError.hidden = !message;
}

photoPick.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  photoInput.value = ""; // so choosing the same file again still counts as a change
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showPhotoError("Choose an image file (JPG, PNG, or WebP).");
    return;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    showPhotoError("That photo is over 5 MB. Choose a smaller one.");
    return;
  }
  Photos.shrink(file, 320)
    .then((src) => {
      photo = src;
      showPhotoError("");
      renderPhoto();
    })
    .catch(() => showPhotoError("Couldn't read that image. Try another one."));
});

photoRemove.addEventListener("click", () => {
  photo = null;
  renderPhoto();
  photoPick.focus(); // the Remove button just disappeared
});

// Without a photo the preview shows the initials, so keep them in step with the name.
nameInput.addEventListener("input", () => {
  if (!photo) renderPhoto();
});

// The navbar was drawn from the session when the page loaded (js/main.js); show the new name now.
function refreshNavbarName(name) {
  const avatar = document.getElementById("account-btn");
  const accountName = document.querySelector(".account-head strong");
  if (avatar) avatar.textContent = Auth.initials(name);
  if (accountName) accountName.textContent = name;
}

clearErrorsWhileTyping(profileForm, profileChecks);

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate(profileChecks)) return;

  const name = nameInput.value.trim();
  const button = submitButtonOf(profileForm);
  button.disabled = true;
  AccountAPI.saveProfile({ name, phone: phoneInput.value.trim(), photo })
    .then(() => {
      refreshNavbarName(name);
      showToast("Profile saved.");
    })
    .catch(() => showToast(STORAGE_ERROR, { error: true }))
    .finally(() => {
      button.disabled = false;
    });
});

/* ---------- Account: change password ---------- */

const passwordForm = document.getElementById("password-form");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");

const passwordChecks = new Map([
  [currentPasswordInput, (value) => (value ? "" : "Enter your current password.")],
  [newPasswordInput, (value) => {
    if (!value) return "Enter a new password.";
    if (value.length < 8) return "Use at least 8 characters.";
    if (value === currentPasswordInput.value) return "Choose a password that's different from your current one.";
    return "";
  }],
  [confirmPasswordInput, (value) => {
    if (!value) return "Type your new password again.";
    return value === newPasswordInput.value ? "" : "Passwords don't match.";
  }],
]);

clearErrorsWhileTyping(passwordForm, passwordChecks);

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate(passwordChecks)) return;

  const button = submitButtonOf(passwordForm);
  button.disabled = true;
  AccountAPI.changePassword(currentPasswordInput.value, newPasswordInput.value)
    .then(({ error }) => {
      if (error) {
        setError(currentPasswordInput, "That's not your current password.");
        currentPasswordInput.focus();
        return;
      }
      passwordForm.reset();
      showToast("Password updated.");
    })
    .catch(() => showToast("Couldn't update your password. Try again.", { error: true }))
    .finally(() => {
      button.disabled = false;
    });
});

/* ---------- Notifications ---------- */

const notificationSwitches = document.getElementById("notification-switches");
const switches = notificationSwitches.querySelectorAll(".switch");

// Saves as soon as a switch changes (like the admin Settings page); puts it back if that fails.
notificationSwitches.addEventListener("change", (event) => {
  const changed = event.target;
  const notifications = Object.fromEntries([...switches].map((s) => [s.name, s.checked]));
  AccountAPI.saveNotifications(notifications)
    .then(() => showToast("Notification settings saved."))
    .catch(() => {
      changed.checked = !changed.checked;
      showToast(STORAGE_ERROR, { error: true });
    });
});

/* ---------- Danger zone: delete account ---------- */

const deleteDialog = document.getElementById("delete-dialog");
const deleteOpen = document.getElementById("delete-open");
const deleteConfirm = document.getElementById("delete-confirm");
const deleteError = document.getElementById("delete-error");

// showModal() keeps focus inside the dialog, and Escape closes it.
deleteOpen.addEventListener("click", () => {
  deleteError.hidden = true;
  deleteDialog.showModal();
});

document.getElementById("delete-cancel").addEventListener("click", () => deleteDialog.close());

// A click on the dark backdrop (outside .modal-body) closes it too.
deleteDialog.addEventListener("click", (event) => {
  if (event.target === deleteDialog) deleteDialog.close();
});

deleteDialog.addEventListener("close", () => deleteOpen.focus());

deleteConfirm.addEventListener("click", () => {
  deleteConfirm.disabled = true;
  AccountAPI.deleteAccount()
    .then(() => window.location.replace("index.html"))
    .catch(() => {
      deleteError.textContent = "Couldn't delete your account. Try again.";
      deleteError.hidden = false;
      deleteConfirm.disabled = false;
    });
});

/* ---------- Load ---------- */

// No session means settings.html is already on its way to the login page.
if (Auth.getSession()) {
  AccountAPI.getAccount().then((account) => {
    nameInput.value = account.name;
    emailInput.value = account.email;
    phoneInput.value = account.phone;
    document.getElementById("password-username").setAttribute("value", account.email); // survives form.reset()
    photo = account.photo;
    renderPhoto();
    switches.forEach((s) => {
      s.checked = Boolean(account.notifications[s.name]);
    });
  });
}
