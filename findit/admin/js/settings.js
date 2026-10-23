// Settings: office details (shown on the public About page and in student Messages), which
// notifications the bell shows, the logged-in account, and a demo-data reset.
// Saved through AdminAPI in ../js/settings-store.js.

const officeForm = document.getElementById("office-form");
const officeStatus = document.getElementById("office-status");
const notifSwitches = document.getElementById("notif-switches");
const notifStatus = document.getElementById("notif-status");

let currentSettings = null;

function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function fillSettings(settings) {
  currentSettings = settings;
  Object.entries(settings.office).forEach(([key, value]) => {
    const field = officeForm.elements[key];
    if (field) field.value = value;
  });
  notifSwitches.querySelectorAll(".switch").forEach((box) => {
    box.checked = settings.notifications[box.dataset.type] !== false;
  });
}

officeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const office = { ...currentSettings.office };
  Object.keys(office).forEach((key) => {
    if (officeForm.elements[key]) office[key] = officeForm.elements[key].value.trim();
  });
  const settings = { ...currentSettings, office };
  AdminAPI.saveSettings(settings)
    .then(() => {
      currentSettings = settings;
      showStatus(officeStatus, "Saved. Students see the new details right away.");
    })
    .catch(() => showStatus(officeStatus, "Couldn't save. Browser storage may be blocked.", true));
});

// Typing again clears the "Saved" message so it doesn't describe old values.
officeForm.addEventListener("input", () => showStatus(officeStatus, ""));

notifSwitches.addEventListener("change", (event) => {
  const box = event.target.closest(".switch");
  if (!box) return;
  const settings = {
    ...currentSettings,
    notifications: { ...currentSettings.notifications, [box.dataset.type]: box.checked },
  };
  AdminAPI.saveSettings(settings)
    .then(() => {
      currentSettings = settings;
      showStatus(notifStatus, "Saved.");
      loadNotifications(); // the bell updates right away
    })
    .catch(() => {
      box.checked = !box.checked;
      showStatus(notifStatus, "Couldn't save. Browser storage may be blocked.", true);
    });
});

document.getElementById("reset-demo").addEventListener("click", () => {
  const ok = window.confirm(
    "Reset the demo data? Messages, added items, claims, settings and notifications in this browser go back to the samples.",
  );
  if (!ok) return;
  AdminAPI.resetDemoData().then(() => window.location.reload());
});

// The account card shows the logged-in admin, same as the sidebar card.
AdminAPI.getCurrentUser().then((user) => {
  document.getElementById("account-initials").textContent = user.initials;
  document.getElementById("account-name").textContent = user.name;
  document.getElementById("account-email").textContent = user.email;
});

AdminAPI.getSettings().then(fillSettings);
