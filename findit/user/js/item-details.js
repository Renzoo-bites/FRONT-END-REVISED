// Item details: the found item in ?id=, from ../js/item-store.js. Only public fields are shown;
// the brand and identifying details stay hidden so the real owner can prove it's theirs.

const PLACEHOLDER_IMAGE = "../assets/images/item-placeholder.svg";

const STATUS_BADGES = {
  pending: { label: "Available to claim", badge: "badge-success" },
  matched: { label: "Available to claim", badge: "badge-success" },
  ready: { label: "Claim in progress", badge: "badge-info" },
  claimed: { label: "Claimed", badge: "badge-neutral" },
};

const detailsEl = document.getElementById("item-details");
const crumbEl = document.getElementById("crumb-current");
const similarSection = document.getElementById("similar-items");
const similarGrid = document.getElementById("similar-grid");

const formatDate = (isoDate, month = "long") =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });

function claimHTML(item) {
  if (item.status === "pending" || item.status === "matched") {
    return `
      <a href="claim.html?id=${encodeURIComponent(item.id)}" class="btn btn-primary btn-lg btn-block">Claim this item</a>
      <p class="form-hint">You'll be asked for proof of ownership. Bring a valid ID when you pick it up at the SWAFO office.</p>`;
  }
  const note = item.status === "ready"
    ? "SWAFO has approved a claim for this item and it's waiting to be picked up."
    : "This item has already been returned to its owner.";
  return `
    <button type="button" class="btn btn-primary btn-lg btn-block" disabled>Claim this item</button>
    <p class="form-hint">${note} If you think it's yours, <a href="messages.html">message SWAFO</a>.</p>`;
}

function renderItem(item) {
  const status = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
  const foundAt = [Locations.label(item.locationId, item.locationOther), item.locationDetails].filter(Boolean).join(", ");

  document.title = `FindIt | ${item.name}`;
  crumbEl.textContent = item.name;
  detailsEl.innerHTML = `
    <img class="item-photo" src="${escapeText(item.image || PLACEHOLDER_IMAGE)}" alt="Photo of the ${escapeText(item.name.toLowerCase())}">

    <div class="item-info">
      <span class="badge ${status.badge}">${status.label}</span>
      <h1>${escapeText(item.name)}</h1>
      <p class="item-ref">Reference no. ${escapeText(item.id)}</p>

      <dl class="detail-list">
        <div><dt>Category</dt><dd>${escapeText(item.category)}</dd></div>
        <div><dt>Found at</dt><dd>${escapeText(foundAt)}</dd></div>
        <div><dt>Date found</dt><dd><time datetime="${escapeText(item.dateFound)}">${formatDate(item.dateFound)}</time></dd></div>
        <div><dt>Turned in to</dt><dd>SWAFO Office</dd></div>
      </dl>

      <h2>Description</h2>
      <p>
        ${escapeText(item.description)} The brand and identifying details are hidden so the
        real owner can prove it's theirs when claiming.
      </p>

      <div class="claim-cta">${claimHTML(item)}</div>
    </div>`;
}

// Same category first, then anything else still on Browse.
function renderSimilar(item) {
  const others = ItemStore.available().filter((other) => other.id !== item.id);
  const similar = [
    ...others.filter((other) => other.category === item.category),
    ...others.filter((other) => other.category !== item.category),
  ].slice(0, 4);

  similarSection.hidden = !similar.length;
  similarGrid.innerHTML = similar.map((other) => `
    <article class="card item-card">
      <img class="item-card-img" src="${escapeText(other.image || PLACEHOLDER_IMAGE)}" alt="" loading="lazy">
      <div class="card-body">
        <span class="badge">${escapeText(other.category)}</span>
        <h3 class="card-title"><a href="item-details.html?id=${encodeURIComponent(other.id)}">${escapeText(other.name)}</a></h3>
        <ul class="item-meta">
          <li><img src="../assets/icons/location.svg" alt="" width="16" height="16">${escapeText(Locations.label(other.locationId, other.locationOther))}</li>
          <li><img src="../assets/icons/calendar.svg" alt="" width="16" height="16"><time datetime="${escapeText(other.dateFound)}">${formatDate(other.dateFound, "short")}</time></li>
        </ul>
      </div>
    </article>`).join("");
}

function renderMissing() {
  crumbEl.textContent = "Item not found";
  detailsEl.innerHTML = `
    <div class="empty-state item-missing">
      <h1>This item isn't listed anymore</h1>
      <p>It may have been returned to its owner. <a href="items.html">Browse the other found items</a>.</p>
    </div>`;
  similarSection.hidden = true;
}

// Old links without ?id= (placeholder pages) show the newest item.
const requestedId = new URLSearchParams(window.location.search).get("id");
const item = requestedId ? ItemStore.get(requestedId) : ItemStore.available()[0];

if (item) {
  renderItem(item);
  renderSimilar(item);
} else {
  renderMissing();
}
