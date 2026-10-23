// "+ Add found item" (top bar, every admin page): logs an item turned in to the SWAFO office,
// in a side drawer. Saved items go to the shared item store (../js/item-store.js), so they show
// on the public Browse page and at the top of Reports. Brand, unique details, who turned it in
// and where it's stored stay SWAFO-only.
// Pages can listen for the "findit:item-added" event (Reports does, to show the new item).

const addItemButton = document.getElementById("add-item-btn");

document.body.insertAdjacentHTML("beforeend", `
  <dialog class="drawer" id="add-item-drawer" aria-labelledby="add-item-title">
    <form class="drawer-form" id="add-item-form">
      <header class="drawer-head">
        <div>
          <h2 id="add-item-title">Add found item</h2>
          <p>Log an item turned in to the SWAFO office. It will appear on Browse.</p>
        </div>
        <button type="button" class="icon-btn" id="add-item-close" aria-label="Close">${AdminUI.icon("close")}</button>
      </header>

      <div class="drawer-body">
        <fieldset class="field-group">
          <legend>Public details</legend>
          <p class="field-note">Shown on the public Browse page, so keep them general.</p>

          <div class="field">
            <label for="new-item-name">Item name <span class="required" aria-hidden="true">*</span></label>
            <input type="text" id="new-item-name" placeholder="e.g. Phone, water bottle, umbrella" aria-describedby="new-item-name-hint" required>
            <p class="field-hint" id="new-item-name-hint">Say "Phone", not "iPhone 13". The brand goes in SWAFO only below.</p>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="new-item-category">Category <span class="required" aria-hidden="true">*</span></label>
              <select id="new-item-category" required><option value="">Select a category</option></select>
            </div>
            <div class="field">
              <label for="new-item-color">Color</label>
              <input type="text" id="new-item-color" placeholder="e.g. Black">
            </div>
          </div>

          <div class="field">
            <label for="new-item-description">Description <span class="required" aria-hidden="true">*</span></label>
            <textarea id="new-item-description" rows="3" placeholder="General look, e.g. black, bi-fold, leather" required></textarea>
          </div>

          <div class="field">
            <label for="new-item-photo">Photo</label>
            <input type="file" id="new-item-photo" accept="image/*" aria-describedby="new-item-photo-hint">
            <p class="field-hint" id="new-item-photo-hint">Avoid close-ups of logos, names, or what's inside.</p>
            <div class="photo-preview-row" id="new-item-photo-preview" hidden></div>
          </div>
        </fieldset>

        <fieldset class="field-group">
          <legend>Where and when</legend>
          <div class="field-row">
            <div class="field">
              <label for="new-item-location">Found at <span class="required" aria-hidden="true">*</span></label>
              <select id="new-item-location" required><option value="">Select a location</option></select>
            </div>
            <div class="field">
              <label for="new-item-date">Date found <span class="required" aria-hidden="true">*</span></label>
              <input type="date" id="new-item-date" required>
            </div>
          </div>
          <div class="field" id="new-item-location-other-field" hidden>
            <label for="new-item-location-other">Describe the place</label>
            <input type="text" id="new-item-location-other" placeholder="e.g. Parking area near Magdiwang Gate">
          </div>
          <div class="field">
            <label for="new-item-location-details">More location details</label>
            <input type="text" id="new-item-location-details" placeholder="e.g. 2nd floor, near the printers">
          </div>
        </fieldset>

        <fieldset class="field-group field-private">
          <legend>${AdminUI.icon("lock", 16)} SWAFO only</legend>
          <p class="field-note">Never shown publicly. Use these to check claims.</p>

          <div class="field-row">
            <div class="field">
              <label for="new-item-brand">Brand</label>
              <input type="text" id="new-item-brand" placeholder="e.g. Apple, Aquaflask">
            </div>
            <div class="field">
              <label for="new-item-turned-in-by">Turned in by</label>
              <input type="text" id="new-item-turned-in-by" placeholder="e.g. Library staff">
            </div>
          </div>
          <div class="field">
            <label for="new-item-storage">Stored at</label>
            <input type="text" id="new-item-storage" placeholder="e.g. Cabinet A, shelf 2">
          </div>
          <div class="field">
            <label for="new-item-unique">Unique details</label>
            <textarea id="new-item-unique" rows="3" placeholder="Stickers, scratches, engravings, what's inside, serial number..."></textarea>
          </div>
        </fieldset>

        <p class="form-error" id="add-item-error" role="alert" hidden></p>
      </div>

      <footer class="drawer-foot">
        <button type="button" class="admin-btn" id="add-item-cancel">Cancel</button>
        <button type="submit" class="admin-btn admin-btn-primary">Save item</button>
      </footer>
    </form>
  </dialog>`);

const addItemDrawer = document.getElementById("add-item-drawer");
const addItemForm = document.getElementById("add-item-form");
const addItemError = document.getElementById("add-item-error");
const newItemPhotoInput = document.getElementById("new-item-photo");
const newItemPhotoPreview = document.getElementById("new-item-photo-preview");
let newItemPhoto = null; // shrunk photo (data URL), see ../js/photos.js

const fieldValue = (id) => document.getElementById(`new-item-${id}`).value.trim();

AdminAPI.getCategories().then((categories) => {
  document.getElementById("new-item-category").insertAdjacentHTML("beforeend",
    categories.map((v) => `<option value="${AdminUI.escape(v)}">${AdminUI.escape(v)}</option>`).join(""));
});

// Campus locations (../js/data/locations.js), grouped by campus; "Other / Not sure" shows a box
// to describe the place.
const newItemLocation = document.getElementById("new-item-location");
newItemLocation.insertAdjacentHTML("beforeend", Locations.optionsHTML());
const syncNewItemLocationOther = Locations.watchOther(newItemLocation, document.getElementById("new-item-location-other-field"));

function setPhoto(src) {
  newItemPhoto = src;
  newItemPhotoPreview.hidden = !src;
  newItemPhotoPreview.innerHTML = src
    ? `<img src="${src}" alt="Preview of the photo"><button type="button" class="admin-btn" id="new-item-photo-remove">Remove photo</button>`
    : "";
}

function showAddItemError(message) {
  addItemError.textContent = message;
  addItemError.hidden = !message;
}

function openAddItem() {
  addItemForm.reset();
  syncNewItemLocationOther(); // hide the "Other" box now, not a moment after the drawer opens
  setPhoto(null);
  showAddItemError("");
  const date = document.getElementById("new-item-date");
  date.value = AdminUI.today();
  date.max = AdminUI.today(); // can't be found in the future
  addItemDrawer.showModal();
  document.getElementById("new-item-name").focus();
}

function showAddedToast(item) {
  document.querySelector(".toast")?.remove();
  document.body.insertAdjacentHTML("beforeend", `
    <div class="toast" role="status">
      ${AdminUI.icon("checkCircle", 20)}
      <p><strong>${AdminUI.escape(item.name)}</strong> was added as ${AdminUI.escape(item.id)} and is now on Browse.</p>
      <a href="../user/item-details.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener">View on Browse</a>
    </div>`);
  const toast = document.querySelector(".toast");
  setTimeout(() => toast.remove(), 8000);
}

addItemButton.addEventListener("click", openAddItem);
document.getElementById("add-item-close").addEventListener("click", () => addItemDrawer.close());
document.getElementById("add-item-cancel").addEventListener("click", () => addItemDrawer.close());

newItemPhotoInput.addEventListener("change", () => {
  const [file] = newItemPhotoInput.files;
  if (!file) return setPhoto(null);
  if (!file.type.startsWith("image/")) {
    newItemPhotoInput.value = "";
    return showAddItemError("Only photos can be attached.");
  }
  Photos.shrink(file)
    .then((src) => {
      showAddItemError("");
      setPhoto(src);
    })
    .catch(() => showAddItemError("Couldn't read that photo. Try another one."));
});

newItemPhotoPreview.addEventListener("click", (event) => {
  if (!event.target.closest("#new-item-photo-remove")) return;
  newItemPhotoInput.value = "";
  setPhoto(null);
  newItemPhotoInput.focus();
});

// The browser checks the required fields before this runs.
addItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const locationId = fieldValue("location");
  AdminAPI.addFoundItem({
    name: fieldValue("name"),
    category: fieldValue("category"),
    color: fieldValue("color"),
    description: fieldValue("description"),
    image: newItemPhoto,
    locationId,
    locationOther: locationId === Locations.OTHER ? fieldValue("location-other") : "",
    locationDetails: fieldValue("location-details"),
    dateFound: fieldValue("date"),
    brand: fieldValue("brand"),
    turnedInBy: fieldValue("turned-in-by"),
    storage: fieldValue("storage"),
    identifyingDetails: fieldValue("unique"),
  })
    .then((item) => {
      addItemDrawer.close();
      showAddedToast(item);
      refreshNavCounts(); // one more pending report
      document.dispatchEvent(new CustomEvent("findit:item-added", { detail: item }));
    })
    .catch(() => showAddItemError("Couldn't save the item. Try again, or use a smaller photo."));
});
