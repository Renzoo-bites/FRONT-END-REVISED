// Found Items: SWAFO's inventory of items turned in to the office (../js/item-store.js, the
// same items Browse shows). Status tabs, category/location filters, the top bar search, and a
// detail panel with the SWAFO-only details and status actions. Items added with
// "+ Add found item" appear here right away.

const ITEM_TABS = [
  { status: "all", label: "All" },
  { status: "pending", label: "Pending" },
  { status: "matched", label: "Matched" },
  { status: "ready", label: "Ready" },
  { status: "claimed", label: "Claimed" },
];

// The panel's main button moves an item to its next status.
const NEXT_ITEM_STATUS = {
  pending: { status: "ready", label: "Mark as Ready for claim" },
  matched: { status: "ready", label: "Mark as Ready for claim" },
  ready: { status: "claimed", label: "Mark as Claimed (returned)" },
};

const PLACEHOLDER = "../assets/images/item-placeholder.svg";

const itemsState = {
  items: [],
  status: "all",
  category: "",
  location: "", // a location id, see ../js/data/locations.js
  locationOther: "", // with "Other / Not sure": the place typed in the box beside it
  query: "",
  selectedId: null,
};

const ui = {
  tabs: document.getElementById("item-tabs"),
  category: document.getElementById("item-category"),
  location: document.getElementById("item-location"),
  locationOther: document.getElementById("item-location-other"),
  searchForm: document.getElementById("topbar-search"),
  search: document.querySelector("#topbar-search input"),
  summary: document.getElementById("found-summary"),
  grid: document.getElementById("found-grid"),
  layout: document.getElementById("items-layout"),
  panel: document.getElementById("detail-panel"),
  panelId: document.getElementById("detail-id"),
  panelBody: document.getElementById("detail-body"),
  panelClose: document.getElementById("detail-close"),
  backdrop: document.getElementById("panel-backdrop"),
};

const e = (value) => AdminUI.escape(value);
const imageSrc = (item) => item.image || PLACEHOLDER;
const selectedItem = () => itemsState.items.find((item) => item.id === itemsState.selectedId);
const where = (item) => Locations.label(item.locationId, item.locationOther);

// SWAFO can search private fields too (brand, unique details, storage), unlike Browse.
function matchesItem(item, { ignoreStatus = false } = {}) {
  const query = itemsState.query.trim().toLowerCase();
  const otherPlace = itemsState.location === Locations.OTHER ? itemsState.locationOther.trim().toLowerCase() : "";
  const haystack = [item.id, item.name, item.category, item.color, item.description, where(item),
    item.brand, item.identifyingDetails, item.turnedInBy, item.storage].join(" ").toLowerCase();
  return (
    (ignoreStatus || itemsState.status === "all" || item.status === itemsState.status) &&
    (!itemsState.category || item.category === itemsState.category) &&
    (!itemsState.location || item.locationId === itemsState.location) &&
    (!otherPlace || item.locationOther.toLowerCase().includes(otherPlace)) &&
    (!query || haystack.includes(query) || AdminUI.findsPlace(query, item.locationId, haystack))
  );
}

/* ---------- Tabs + grid ---------- */

function buildItemTabs() {
  ui.tabs.innerHTML = ITEM_TABS.map(({ status, label }) => `
    <button type="button" class="status-tab" data-status="${status}" aria-pressed="false">
      ${label} <span class="tab-count"></span>
    </button>`).join("");
}

function updateItemTabs() {
  const pool = itemsState.items.filter((item) => matchesItem(item, { ignoreStatus: true }));
  ui.tabs.querySelectorAll(".status-tab").forEach((tab) => {
    const { status } = tab.dataset;
    tab.querySelector(".tab-count").textContent =
      status === "all" ? pool.length : pool.filter((item) => item.status === status).length;
    tab.setAttribute("aria-pressed", String(status === itemsState.status));
  });
}

function cardHTML(item) {
  const selected = item.id === itemsState.selectedId;
  return `
    <li class="found-card${selected ? " is-selected" : ""}">
      <button type="button" class="found-card-btn" data-id="${e(item.id)}" aria-controls="detail-panel" aria-expanded="${selected}">
        <img class="found-card-img" src="${e(imageSrc(item))}" alt="" loading="lazy">
        <span class="found-card-body">
          <span class="found-card-top">${AdminUI.statusBadge(item.status)}<span class="item-id">${e(item.id)}</span></span>
          <span class="found-card-name">${e(item.name)}</span>
          <span class="found-card-meta">${e(where(item))} · ${AdminUI.formatDate(item.dateFound)}</span>
          ${item.storage ? `<span class="found-card-storage">${AdminUI.icon("box", 14)}${e(item.storage)}</span>` : ""}
        </span>
      </button>
    </li>`;
}

function renderItems() {
  const visible = itemsState.items.filter((item) => matchesItem(item));
  ui.grid.innerHTML = visible.length
    ? visible.map(cardHTML).join("")
    : '<li class="table-empty found-empty">No items match these filters.</li>';
  ui.summary.textContent = `Showing ${visible.length} of ${itemsState.items.length} items`;
}

function applyItemFilters() {
  updateItemTabs();
  renderItems();
}

/* ---------- Detail panel ---------- */

function itemPrivateHTML(item) {
  const rows = [
    ["Brand", item.brand],
    ["Unique details", item.identifyingDetails],
    ["Turned in by", item.turnedInBy],
    ["Stored at", item.storage],
  ].filter(([, value]) => value);
  if (!rows.length) return "";
  return `
    <section class="private-box" aria-label="SWAFO-only details">
      <p class="detail-label">${AdminUI.icon("lock", 14)} SWAFO only</p>
      <dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join("")}</dl>
    </section>`;
}

function renderItemPanel() {
  const item = selectedItem();
  if (!item) return;
  const next = NEXT_ITEM_STATUS[item.status];
  const foundAt = [where(item), item.locationDetails].filter(Boolean).join(", ");

  ui.panelId.textContent = item.id;
  ui.panelBody.innerHTML = `
    <img class="detail-image" src="${e(imageSrc(item))}" alt="${item.image ? `Photo of ${e(item.name)}` : ""}">
    <div class="detail-title">
      <h2 id="detail-name">${e(item.name)}</h2>
      ${AdminUI.statusBadge(item.status)}
    </div>
    <dl class="info-grid">
      <div><dt>Category</dt><dd>${e(item.category)}</dd></div>
      <div><dt>Color</dt><dd>${e(item.color || "—")}</dd></div>
      <div><dt>Found at</dt><dd>${e(foundAt)}</dd></div>
      <div><dt>Date found</dt><dd>${AdminUI.formatDate(item.dateFound, { month: "short", day: "numeric", year: "numeric" })}</dd></div>
    </dl>
    <p class="detail-description">${e(item.description)}</p>
    ${itemPrivateHTML(item)}
    <div class="detail-actions">
      <button type="button" class="admin-btn admin-btn-primary" id="item-advance"${next ? "" : " disabled"}>
        ${next ? next.label : "Returned to owner"}
      </button>
    </div>`;
}

function syncSelectedCard() {
  ui.grid.querySelectorAll(".found-card-btn").forEach((button) => {
    const selected = button.dataset.id === itemsState.selectedId;
    button.closest(".found-card").classList.toggle("is-selected", selected);
    button.setAttribute("aria-expanded", String(selected));
  });
}

function setItemPanelOpen(open) {
  ui.layout.classList.toggle("has-panel", open);
  ui.panel.classList.toggle("is-open", open);
  ui.backdrop.classList.toggle("is-open", open);
}

function openItem(id) {
  itemsState.selectedId = id;
  renderItemPanel();
  syncSelectedCard();
  setItemPanelOpen(true);
  ui.panel.focus({ preventScroll: true });
}

function closeItem() {
  const id = itemsState.selectedId;
  itemsState.selectedId = null;
  setItemPanelOpen(false);
  syncSelectedCard();
  ui.grid.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus();
}

/* ---------- Loading ---------- */

function loadItems() {
  return AdminAPI.getItems().then((items) => {
    itemsState.items = items;
    applyItemFilters();
    if (selectedItem()) renderItemPanel();
  });
}

/* ---------- Events ---------- */

ui.tabs.addEventListener("click", (event) => {
  const tab = event.target.closest(".status-tab");
  if (!tab) return;
  itemsState.status = tab.dataset.status;
  applyItemFilters();
});

ui.category.addEventListener("change", () => {
  itemsState.category = ui.category.value;
  applyItemFilters();
});

ui.location.addEventListener("change", () => {
  itemsState.location = ui.location.value;
  applyItemFilters();
});

ui.locationOther.addEventListener("input", () => {
  itemsState.locationOther = ui.locationOther.value;
  applyItemFilters();
});

// On this page the top bar search filters the items.
ui.search.placeholder = "Search items, IDs, brands...";
ui.searchForm.addEventListener("submit", (event) => event.preventDefault());
ui.search.addEventListener("input", () => {
  itemsState.query = ui.search.value;
  applyItemFilters();
});

ui.grid.addEventListener("click", (event) => {
  const button = event.target.closest(".found-card-btn");
  if (button) openItem(button.dataset.id);
});

ui.panelBody.addEventListener("click", (event) => {
  if (!event.target.closest("#item-advance")) return;
  const next = NEXT_ITEM_STATUS[selectedItem().status];
  AdminAPI.updateItemStatus(itemsState.selectedId, next.status).then(() => loadItems()).then(() => {
    refreshNavCounts();
    document.getElementById("item-advance").focus();
  });
});

ui.panelClose.addEventListener("click", closeItem);
ui.backdrop.addEventListener("click", closeItem);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && itemsState.selectedId && !event.defaultPrevented) closeItem();
});

// Another tab changed the items, or one was just added here with "+ Add found item".
ItemStore.subscribe(loadItems);
document.addEventListener("findit:item-added", (event) => {
  Object.assign(itemsState, { status: "all", category: "", location: "", locationOther: "", query: "" });
  ui.category.value = "";
  ui.location.value = "";
  ui.locationOther.value = "";
  syncItemLocationOther();
  ui.search.value = "";
  loadItems().then(() => openItem(event.detail.id));
});

/* ---------- Start ---------- */

// Locations come grouped by campus (../js/data/locations.js); "Other / Not sure" shows its box.
ui.location.insertAdjacentHTML("beforeend", Locations.optionsHTML());
const syncItemLocationOther = Locations.watchOther(ui.location, document.getElementById("item-location-other-field"));

AdminAPI.getCategories().then((categories) => {
  ui.category.insertAdjacentHTML("beforeend", categories.map((v) => `<option value="${e(v)}">${e(v)}</option>`).join(""));
  buildItemTabs();
  loadItems().then(() => {
    // found-items.html?id=FI-0236 opens that item
    const requested = new URLSearchParams(window.location.search).get("id");
    if (requested && itemsState.items.some((item) => item.id === requested)) openItem(requested);
  });
});
