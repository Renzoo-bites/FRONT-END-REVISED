// Claims: what students send from ../user/claim.html (../js/claim-store.js). Status tabs, the top bar
// search, and a detail panel that puts the claimant's answers next to the item's SWAFO-only
// record. Approving makes the item Ready for claim; "Mark as picked up" makes it Claimed.

const CLAIM_TABS = [
  { status: "under_review", label: "Under review" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
  { status: "all", label: "All" },
];

// Claim statuses borrow the report badge colors.
const CLAIM_STATUS = {
  under_review: { label: "Under review", badge: "pending" },
  approved: { label: "Approved", badge: "ready" },
  rejected: { label: "Rejected", badge: "lost" },
};

const claimsState = {
  claims: [],
  status: "under_review", // the review queue first
  query: "",
  selectedId: null,
};

const view = {
  tabs: document.getElementById("claim-tabs"),
  searchForm: document.getElementById("topbar-search"),
  search: document.querySelector("#topbar-search input"),
  body: document.getElementById("claims-body"),
  summary: document.getElementById("claims-summary"),
  layout: document.getElementById("claims-layout"),
  panel: document.getElementById("detail-panel"),
  panelId: document.getElementById("detail-id"),
  panelBody: document.getElementById("detail-body"),
  panelClose: document.getElementById("detail-close"),
  backdrop: document.getElementById("panel-backdrop"),
};

const esc = (value) => AdminUI.escape(value);
const selectedClaim = () => claimsState.claims.find((claim) => claim.id === claimsState.selectedId);
const dateTime = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const longDate = (isoDate) => AdminUI.formatDate(isoDate, { month: "short", day: "numeric", year: "numeric" });

function claimBadge(status) {
  const { label, badge } = CLAIM_STATUS[status];
  return `<span class="badge badge-status badge-${badge}">${label}</span>`;
}

// The other claims for the same item, e.g. a second person claiming the same bottle.
const otherClaims = (claim) => claimsState.claims.filter((c) => c.itemId === claim.itemId && c.id !== claim.id);

// Only one claim per item can be approved, and never for an item that's already been returned.
function canApprove(claim) {
  return Boolean(claim.item) && claim.item.status !== "claimed" &&
    !otherClaims(claim).some((c) => c.status === "approved");
}

function matchesClaim(claim, { ignoreStatus = false } = {}) {
  const query = claimsState.query.trim().toLowerCase();
  const { claimant, item } = claim;
  const haystack = [claim.id, claim.itemId, item?.name, claimant.name, claimant.schoolId, claimant.email].join(" ").toLowerCase();
  return (
    (ignoreStatus || claimsState.status === "all" || claim.status === claimsState.status) &&
    (!query || haystack.includes(query))
  );
}

/* ---------- Tabs + table ---------- */

function buildClaimTabs() {
  view.tabs.innerHTML = CLAIM_TABS.map(({ status, label }) => `
    <button type="button" class="status-tab" data-status="${status}" aria-pressed="false">
      ${label} <span class="tab-count"></span>
    </button>`).join("");
}

function updateClaimTabs() {
  const pool = claimsState.claims.filter((claim) => matchesClaim(claim, { ignoreStatus: true }));
  view.tabs.querySelectorAll(".status-tab").forEach((tab) => {
    const { status } = tab.dataset;
    tab.querySelector(".tab-count").textContent =
      status === "all" ? pool.length : pool.filter((claim) => claim.status === status).length;
    tab.setAttribute("aria-pressed", String(status === claimsState.status));
  });
}

function claimRowHTML(claim) {
  const selected = claim.id === claimsState.selectedId;
  return `
    <tr data-id="${esc(claim.id)}"${selected ? ' class="is-selected"' : ""}>
      <td>
        <button type="button" class="row-link" aria-controls="detail-panel" aria-expanded="${selected}">${esc(claim.claimant.name)}</button>
        <span class="item-id">${esc(claim.id)}</span>
      </td>
      <td>
        <span class="item-cell">
          ${AdminUI.itemIcon(claim.item?.category)}
          <span>${esc(claim.item ? claim.item.name : "Item not found")}<span class="item-id">${esc(claim.itemId)}</span></span>
        </span>
      </td>
      <td class="num"><time datetime="${esc(claim.submittedAt)}">${AdminUI.timeAgo(claim.submittedAt)}</time></td>
      <td>${claimBadge(claim.status)}</td>
    </tr>`;
}

function renderClaimsTable() {
  const visible = claimsState.claims.filter((claim) => matchesClaim(claim));
  const empty = claimsState.status === "under_review" && !claimsState.query
    ? "No claims waiting for review."
    : "No claims match these filters.";
  view.body.innerHTML = visible.length
    ? visible.map(claimRowHTML).join("")
    : `<tr><td colspan="4" class="table-empty">${empty}</td></tr>`;
  view.summary.textContent = `Showing ${visible.length} of ${claimsState.claims.length} claims`;
}

function applyClaimFilters() {
  updateClaimTabs();
  renderClaimsTable();
}

/* ---------- Detail panel ---------- */

// The brand is hidden from the public, so naming it is a good sign (but not proof on its own).
function brandCheck(claim) {
  const said = claim.brand.trim().toLowerCase();
  const record = (claim.item?.brand || "").trim().toLowerCase();
  if (!record) return "";
  if (!said) return '<span class="badge badge-pending">Not given</span>';
  return said.includes(record) || record.includes(said)
    ? '<span class="badge badge-ready">Matches record</span>'
    : '<span class="badge badge-lost">Doesn\'t match</span>';
}

function claimAlertHTML(claim) {
  if (claim.status === "rejected") return "";
  const others = otherClaims(claim);
  const approved = others.find((c) => c.status === "approved");
  const reviewing = others.filter((c) => c.status === "under_review").length;
  let message = "";
  if (!claim.item) message = "This item is no longer in Found Items.";
  else if (approved && claim.status === "under_review") message = `${esc(approved.claimant.name)}'s claim for this item was already approved (${esc(approved.id)}).`;
  else if (claim.item.status === "claimed" && claim.status === "under_review") message = "This item was already returned to its owner.";
  else if (reviewing) message = `${reviewing} other ${reviewing === 1 ? "claim" : "claims"} for this item ${reviewing === 1 ? "is" : "are"} under review.`;
  if (!message) return "";
  return `<div class="claim-alert" role="note">${AdminUI.icon("info", 18)}<p>${message}</p></div>`;
}

function detailsBoxHTML(label, rows) {
  const shown = rows.filter(([, value]) => value);
  return `
    <section class="private-box" aria-label="${esc(label.replace(/<[^>]+>/g, "").trim())}">
      <p class="detail-label">${label}</p>
      ${shown.length
        ? `<dl>${shown.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("")}</dl>`
        : '<p class="stat-note">Nothing on record.</p>'}
    </section>`;
}

// What the claimant told us, next to what only SWAFO (and the real owner) should know.
function proofHTML(claim) {
  return detailsBoxHTML("Claimant says", [
    ["Brand", (claim.brand || brandCheck(claim)) && `${esc(claim.brand || "—")} ${brandCheck(claim)}`],
    ["Description", esc(claim.identifiers)],
    ["Lost at", esc(claim.lostLocation)],
    ["Lost on", claim.lostDate && longDate(claim.lostDate)],
    ["Supporting files", esc(claim.proofFiles.join(", "))],
  ]);
}

function recordHTML({ item }) {
  if (!item) return "";
  return detailsBoxHTML(`${AdminUI.icon("lock", 14)} SWAFO record`, [
    ["Brand", esc(item.brand)],
    ["Unique details", esc(item.identifyingDetails)],
    ["Found at", esc([Locations.label(item.locationId, item.locationOther), item.locationDetails].filter(Boolean).join(", "))],
    ["Date found", longDate(item.dateFound)],
    ["Stored at", esc(item.storage)],
  ]);
}

function claimActionsHTML(claim) {
  if (claim.status === "under_review") {
    return `
      <button type="button" class="admin-btn admin-btn-primary" data-action="approve"${canApprove(claim) ? "" : " disabled"}>
        ${AdminUI.icon("checkCircle", 16)}Approve claim
      </button>
      <button type="button" class="admin-btn admin-btn-danger" data-action="reject">${AdminUI.icon("close", 16)}Reject</button>`;
  }
  if (claim.status === "approved" && claim.item?.status === "ready") {
    return '<button type="button" class="admin-btn admin-btn-primary" data-action="picked-up">Mark as picked up</button>';
  }
  const done = claim.status === "rejected" ? "Rejected"
    : claim.item?.status === "claimed" ? "Picked up" : "Approved";
  return `<button type="button" class="admin-btn admin-btn-primary" disabled>${done}</button>`;
}

function renderClaimPanel() {
  const claim = selectedClaim();
  if (!claim) return;
  const { claimant, item } = claim;
  const reviewed = claim.reviewedAt
    ? `<div><dt>${claim.status === "rejected" ? "Rejected" : "Approved"}</dt><dd>${dateTime(claim.reviewedAt)}</dd></div>`
    : "";
  const itemRow = item
    ? `<a href="found-items.html?id=${encodeURIComponent(item.id)}">${esc(item.name)}</a>
       <span class="item-id">${esc(item.id)} · ${esc(STATUS_LABELS[item.status] || item.status)}</span>`
    : `${esc(claim.itemId || "—")} <span class="item-id">Not in Found Items</span>`;

  view.panelId.textContent = claim.id;
  view.panelBody.innerHTML = `
    <div class="detail-title">
      <h2 id="detail-name">${esc(claimant.name)}</h2>
      ${claimBadge(claim.status)}
    </div>
    <dl class="info-grid claim-info">
      <div class="info-wide"><dt>Item</dt><dd>${itemRow}</dd></div>
      <div><dt>School ID</dt><dd>${esc(claimant.schoolId)}</dd></div>
      <div><dt>Phone</dt><dd><a href="tel:${esc(claimant.phone.replace(/[^\d+]/g, ""))}">${esc(claimant.phone)}</a></dd></div>
      <div class="info-wide"><dt>Email</dt><dd><a href="mailto:${esc(claimant.email)}">${esc(claimant.email)}</a></dd></div>
      <div><dt>Submitted</dt><dd>${dateTime(claim.submittedAt)}</dd></div>
      ${reviewed}
    </dl>
    ${claimAlertHTML(claim)}
    ${proofHTML(claim)}
    ${recordHTML(claim)}
    <div class="detail-actions claim-actions">${claimActionsHTML(claim)}</div>`;
}

function syncSelectedRow() {
  view.body.querySelectorAll("tr[data-id]").forEach((row) => {
    const selected = row.dataset.id === claimsState.selectedId;
    row.classList.toggle("is-selected", selected);
    row.querySelector(".row-link").setAttribute("aria-expanded", String(selected));
  });
}

function setClaimPanelOpen(open) {
  view.layout.classList.toggle("has-panel", open);
  view.panel.classList.toggle("is-open", open);
  view.backdrop.classList.toggle("is-open", open);
}

function openClaim(id) {
  claimsState.selectedId = id;
  renderClaimPanel();
  syncSelectedRow();
  setClaimPanelOpen(true);
  view.panel.focus({ preventScroll: true });
}

function closeClaim() {
  const id = claimsState.selectedId;
  claimsState.selectedId = null;
  setClaimPanelOpen(false);
  syncSelectedRow();
  view.body.querySelector(`tr[data-id="${CSS.escape(id)}"] .row-link`)?.focus();
}

/* ---------- Loading ---------- */

function loadClaims() {
  return AdminAPI.getClaims().then((claims) => {
    claimsState.claims = claims;
    applyClaimFilters();
    if (selectedClaim()) renderClaimPanel();
  });
}

/* ---------- Events ---------- */

view.tabs.addEventListener("click", (event) => {
  const tab = event.target.closest(".status-tab");
  if (!tab) return;
  claimsState.status = tab.dataset.status;
  applyClaimFilters();
});

// On this page the top bar search filters the claims.
view.search.placeholder = "Search claims, names, IDs...";
view.searchForm.addEventListener("submit", (event) => event.preventDefault());
view.search.addEventListener("input", () => {
  claimsState.query = view.search.value;
  applyClaimFilters();
});

view.body.addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-id]");
  if (row) openClaim(row.dataset.id);
});

const CLAIM_ACTIONS = {
  approve: (claim) => AdminAPI.reviewClaim(claim.id, "approved"),
  reject: (claim) => {
    const what = claim.item ? `the ${claim.item.name}` : claim.itemId;
    return window.confirm(`Reject ${claim.claimant.name}'s claim for ${what}?`) && AdminAPI.reviewClaim(claim.id, "rejected");
  },
  "picked-up": (claim) => AdminAPI.markClaimPickedUp(claim.id),
};

view.panelBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const request = CLAIM_ACTIONS[button.dataset.action](selectedClaim());
  if (!request) return; // reject was cancelled
  request.then(loadClaims).then(() => {
    refreshNavCounts();
    loadNotifications();
    const primary = view.panelBody.querySelector(".admin-btn-primary");
    (primary.disabled ? view.panel : primary).focus({ preventScroll: true });
  });
});

view.panelClose.addEventListener("click", closeClaim);
view.backdrop.addEventListener("click", closeClaim);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && claimsState.selectedId && !event.defaultPrevented) closeClaim();
});

// A student sent a claim in another tab, or an item's status changed there.
AdminAPI.onClaimsChange(loadClaims);
ItemStore.subscribe(loadClaims);

/* ---------- Start ---------- */

buildClaimTabs();
loadClaims().then(() => {
  // claims.html?id=CL-0113 (from the bell) opens that claim, on the All tab if it's been reviewed
  const requested = claimsState.claims.find((claim) => claim.id === new URLSearchParams(window.location.search).get("id"));
  if (!requested) return;
  if (!matchesClaim(requested)) {
    claimsState.status = "all";
    applyClaimFilters();
  }
  openClaim(requested.id);
});
