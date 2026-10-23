// Report form: Lost/Found toggle, the location list, and photo preview.
// Submitting is handled by main.js (data-redirect) until there's a backend.

const reportForm = document.querySelector("#report-form");
const photoInput = reportForm.querySelector("#photo");
const photoPreview = reportForm.querySelector("#photo-preview");

function setReportType(type) {
  // Swap wording that differs between lost and found reports.
  reportForm.querySelectorAll("[data-lost]").forEach((el) => {
    el.textContent = el.dataset[type];
  });

  // Show fields that only apply to one type. Disabled fields are left out of the submission.
  reportForm.querySelectorAll("[data-show-for]").forEach((group) => {
    const hidden = group.dataset.showFor !== type;
    group.hidden = hidden;
    group.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = hidden;
    });
  });
}

// Category and location lists are shared with Browse and the admin (../js/item-store.js and
// ../js/data/locations.js). "Other / Not sure" shows a box to describe the place.
reportForm.querySelector("#category").insertAdjacentHTML("beforeend",
  ItemStore.categories.map((value) => `<option value="${escapeText(value)}">${escapeText(value)}</option>`).join(""));
reportForm.querySelector("#location").insertAdjacentHTML("beforeend", Locations.optionsHTML());
Locations.watchOther(reportForm.querySelector("#location"), reportForm.querySelector("#location-other-group"));

reportForm.querySelectorAll("input[name='type']").forEach((input) => {
  input.addEventListener("change", () => setReportType(input.value));
});

// report.html links here with ?type=lost or ?type=found.
const initialType = new URLSearchParams(window.location.search).get("type") === "found" ? "found" : "lost";
reportForm.querySelector(`input[name='type'][value='${initialType}']`).checked = true;
setReportType(initialType);

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files;
  photoPreview.replaceChildren();
  photoPreview.hidden = !file;
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.alt = "Preview of the selected photo";
  img.onload = () => URL.revokeObjectURL(img.src);
  photoPreview.append(img);
});
