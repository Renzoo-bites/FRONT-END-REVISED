// About page: the office details come from the admin Settings page (../js/settings-store.js).
// The HTML keeps the defaults, so the page still reads fine if this doesn't run.

function showOfficeDetails() {
  const { office } = SettingsStore.get();
  document.getElementById("office-location").textContent = office.location;
  document.getElementById("office-hours").textContent = office.officeHours;
  const email = document.getElementById("office-email");
  email.textContent = office.email;
  email.href = `mailto:${office.email}`;
}

showOfficeDetails();
SettingsStore.subscribe(showOfficeDetails);
