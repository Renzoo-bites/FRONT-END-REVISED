// My Reports: the student's lost and found reports and their claims, from UserAPI
// (js/mock-data.js). Picking one in the list shows its progress and, once SWAFO matches a lost
// report to a found item, that item with "Verify and claim" and "Not mine".
// my-reports.html?id=FI-0233 opens that report (a claim's CL- number or the found item's id work
// too); otherwise the first match waiting on the student opens. SWAFO's changes in another tab,
// like approving a claim, show up live. Below 900px the details sit above the list.

const STATUS = {
  pending: { label: "Pending", badge: "badge-warning" },
  matched: { label: "Match found", badge: "badge-info" },
  review: { label: "Under review", badge: "badge-info" },
  rejected: { label: "Not approved", badge: "badge-danger" },
  ready: { label: "Ready for claim", badge: "badge-success" },
  claimed: { label: "Claimed", badge: "badge-neutral" },
  // Found reports (the student turned something in)
  ownerFound: { label: "Owner found", badge: "badge-info" },
  returned: { label: "Returned", badge: "badge-neutral" },
};

const TYPE_LABELS = { lost: "Lost", found: "Found", claim: "Claim" };

const ICONS = {
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  bottle: '<path d="M10 2h4"/><path d="M10.5 2v3L9 8v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8l-1.5-3V2"/><path d="M9 12h6"/>',
  idCard: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  umbrella: '<path d="M22 12a10 10 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/>',
  shirt: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.2a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.4-2.2z"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

// First match wins, so "earphone" is earbuds before it can be a phone.
const ICON_WORDS = [
  ["headphones", /earbud|earphone|headphone|headset/i],
  ["idCard", /\bid\b|license|card/i],
  ["key", /key/i],
  ["wallet", /wallet|purse/i],
  ["bottle", /bottle|tumbler|flask/i],
  ["phone", /phone/i],
  ["umbrella", /umbrella/i],
  ["backpack", /backpack|bag/i],
  ["shirt", /hoodie|jacket|shirt|uniform/i],
];
const CATEGORY_ICONS = { Electronics: "phone", Bags: "backpack", Clothing: "shirt", "ID & Docs": "idCard" };

// Tile color: blue while a match waits on the student, green once it's ready to pick up.
const STAGE_TONES = { matched: "blue", ready: "green" };

const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "lost", label: "Lost", test: (entry) => entry.type === "lost" },
  { key: "found", label: "Found", test: (entry) => entry.type === "found" },
  { key: "matches", label: "Matches", test: (entry) => stageOf(entry) === "matched" },
  { key: "claims", label: "Claims", test: (entry) => Boolean(entry.claim) },
];

const state = {
  entries: [],
  office: null,
  filter: "all",
  selectedId: null,
};

const els = {
  filters: document.getElementById("report-filters"),
  notice: document.getElementById("reports-notice"),
  layout: document.getElementById("reports-layout"),
  list: document.getElementById("report-list"),
  detail: document.getElementById("report-detail"),
  empty: document.getElementById("reports-empty"),
};

const icon = (name, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const shortDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
// Where a report or found item is, by name (../js/data/locations.js)
const where = (thing) => Locations.label(thing.locationId, thing.locationOther);
const stepTime = (iso) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const isNarrow = () => window.matchMedia("(max-width: 900px)").matches;
const selectedEntry = () => state.entries.find((entry) => entry.id === state.selectedId);

// Where the report is from the student's side. A claim decision outranks the report's own status.
function stageOf(entry) {
  if (entry.type === "found") {
    return { matched: "ownerFound", ready: "ownerFound", claimed: "returned" }[entry.status] || "pending";
  }
  if (entry.status === "ready" || entry.status === "claimed") return entry.status;
  if (entry.claim?.status === "under_review") return "review";
  if (entry.claim?.status === "rejected") return "rejected";
  return entry.status; // pending | matched
}

function iconFor({ name, category }) {
  const found = ICON_WORDS.find(([, words]) => words.test(name));
  return found ? found[0] : CATEGORY_ICONS[category] || "box";
}

// `thing` is the report, or the found item in the match card; the color always follows the report.
const tile = (thing, entry, size) =>
  `<span class="item-tile tone-${STAGE_TONES[stageOf(entry)] || "gray"}">${icon(iconFor(thing), size)}</span>`;

const badgeHTML = (stage) => `<span class="badge ${STATUS[stage].badge}">${STATUS[stage].label}</span>`;

/* ---------- Progress ---------- */

// Steps up to `reached` are done; the last of those is the current one unless it's the final
// step. The step right after gets `next`, what it's waiting on.
function timeline(steps, reached, next) {
  const finished = reached === steps.length - 1;
  return steps.map(([label, time], index) => ({
    label,
    time: index <= reached ? time : null,
    state: index < reached || (index === reached && finished) ? "done" : index === reached ? "current" : "todo",
    note: index === reached + 1 ? next : "",
  }));
}

const CLAIM_NOTES = {
  review: "SWAFO is checking your claim",
  rejected: "Your claim wasn't approved",
  ready: "Pick it up at the SWAFO office",
};

function stepsFor(entry, stage) {
  if (entry.type === "found") {
    const reached = { ownerFound: 2, returned: 3 }[stage] ?? (entry.reviewedAt ? 1 : 0);
    return timeline([
      ["Report submitted", entry.submittedAt],
      ["SWAFO reviewing", entry.reviewedAt],
      ["Possible owner found", entry.matchedAt],
      ["Returned to owner", null],
    ], reached, ["Waiting", "Looking for the owner", "SWAFO is verifying the owner"][reached]);
  }

  if (entry.type === "claim") {
    return timeline([
      ["Claim submitted", entry.claim.submittedAt],
      ["Approved by SWAFO", entry.claim.reviewedAt],
      ["Picked up", null],
    ], { ready: 1, claimed: 2 }[stage] ?? 0, CLAIM_NOTES[stage]);
  }

  const reached = { matched: 2, review: 2, rejected: 2, ready: 3, claimed: 4 }[stage] ?? (entry.reviewedAt ? 1 : 0);
  const next = { matched: "Waiting for you to verify it's yours", ...CLAIM_NOTES }[stage]
    || (reached === 1 ? "Searching the found items" : "Waiting");
  return timeline([
    ["Report submitted", entry.submittedAt],
    ["SWAFO reviewing", entry.reviewedAt],
    ["Possible match found", entry.matchedAt],
    ["Ready for claim", entry.claim?.reviewedAt],
    ["Claimed", null],
  ], reached, next);
}

const STEP_STATES = { done: "Done", current: "Current step", todo: "Not yet" };

function timelineHTML(steps) {
  return `
    <ol class="timeline">
      ${steps.map((step) => `
        <li class="is-${step.state}"${step.state === "current" ? ' aria-current="step"' : ""}>
          <span class="step-dot" aria-hidden="true">${step.state === "done" ? icon("check", 13) : ""}</span>
          <div>
            <span class="step-label"><span class="visually-hidden">${STEP_STATES[step.state]}: </span>${escapeText(step.label)}</span>
            ${step.time ? `<span class="step-sub"><time datetime="${escapeText(step.time)}">${stepTime(step.time)}</time></span>` : ""}
            ${step.note ? `<span class="step-sub">${escapeText(step.note)}</span>` : ""}
          </div>
        </li>`).join("")}
    </ol>`;
}

/* ---------- The found item and what to do next ---------- */

function matchCardHTML(entry) {
  const { item, match } = entry;
  const score = match ? Number(match.score) : null;
  return `
    <div class="match-card">
      <div class="match-row">
        ${tile(item, entry, 20)}
        <div>
          <a class="match-name" href="item-details.html?id=${encodeURIComponent(item.id)}">${escapeText(item.name)}</a>
          <span class="match-sub">Found at ${escapeText(where(item))} &middot; ${shortDate(item.dateFound)}</span>
        </div>
        ${score === null ? "" : `<span class="match-score"><span class="visually-hidden">Match score: </span>${score}%</span>`}
      </div>
      ${score === null ? "" : `<span class="match-bar" aria-hidden="true"><span style="width: ${score}%"></span></span>`}
    </div>`;
}

const messageLink = (itemId) =>
  `<a class="btn btn-outline btn-block" href="messages.html?item=${encodeURIComponent(itemId)}">Message SWAFO</a>`;

function nextStepHTML(entry, stage) {
  const { item, claim } = entry;

  if (stage === "matched") {
    // Someone else's claim was approved first, so this student can't claim it from here.
    const claimable = item.status === "pending" || item.status === "matched";
    return `
      <div class="detail-actions">
        ${claimable
          ? `<a class="btn btn-primary btn-block" href="claim.html?id=${encodeURIComponent(item.id)}">Verify and claim</a>`
          : '<button type="button" class="btn btn-primary btn-block" disabled>Verify and claim</button>'}
        <button type="button" class="btn btn-outline btn-block" data-action="not-mine">Not mine</button>
      </div>
      ${claimable ? "" : `<p class="detail-note">SWAFO has already approved a claim for this item. If it's yours, <a href="messages.html?item=${encodeURIComponent(item.id)}">message SWAFO</a>.</p>`}`;
  }

  const { office } = state;
  const text = {
    review: `You sent a claim on ${stepTime(claim.submittedAt)}. SWAFO is checking your answers and will message you once it's decided.`,
    rejected: "SWAFO couldn't verify that this item is yours. If you have more proof, send them a message.",
    ready: `Your claim was approved. Pick it up at the ${escapeText(office.name)}, ${escapeText(office.location)} (${escapeText(office.pickupHours)}). Bring your school ID and claim no. ${escapeText(claim.id)}.`,
    claimed: "You picked this item up. Glad it found its way back to you!",
  }[stage];
  return `
    <p class="detail-box${stage === "ready" ? " is-success" : ""}">${text}</p>
    ${stage === "claimed" ? "" : `<div class="detail-actions">${messageLink(item.id)}</div>`}`;
}

function foundSideHTML(entry, stage) {
  const text = {
    pending: "Thanks for turning it in. SWAFO is looking for the owner, and you don't need to do anything else.",
    ownerFound: "Someone reported losing an item like this. SWAFO will check that they're the owner before handing it over.",
    returned: "SWAFO returned this item to its owner. Thank you for turning it in!",
  }[stage];
  return `
    <h3 class="detail-label">What happens next</h3>
    <p class="detail-box">${text}</p>
    ${stage === "returned" ? "" : `<div class="detail-actions">${messageLink(entry.id)}</div>`}`;
}

const NO_MATCH_HTML = `
  <h3 class="detail-label">Possible match</h3>
  <div class="match-card match-empty">
    <p><strong>No match yet</strong></p>
    <p>SWAFO compares new found items with your report. A match will show up here.</p>
  </div>
  <div class="detail-actions">
    <a class="btn btn-outline btn-block" href="items.html">Browse found items</a>
    <button type="button" class="btn-link btn-cancel" data-action="cancel">Cancel this report</button>
  </div>`;

function sideHTML(entry, stage) {
  if (entry.type === "found") return foundSideHTML(entry, stage);
  if (!entry.item) return entry.type === "lost" ? NO_MATCH_HTML : "";

  const heading = entry.type === "claim"
    ? "Item you claimed"
    : stage === "ready" || stage === "claimed" ? "Your item" : "Possible match";
  return `
    <h3 class="detail-label">${heading}</h3>
    ${matchCardHTML(entry)}
    ${nextStepHTML(entry, stage)}
    ${entry.type === "lost" ? '<p class="detail-note">You can cancel a report only while it is still pending.</p>' : ""}`;
}

function detailMeta(entry) {
  const what = entry.type === "claim" ? `Claimed ${shortDate(entry.date)}` : `${TYPE_LABELS[entry.type]} at ${where(entry)}`;
  return `${escapeText(entry.id)} &middot; ${escapeText(what)}`;
}

/* ---------- Rendering ---------- */

function renderFilters() {
  els.filters.innerHTML = FILTERS.map(({ key, label, test }) => `
    <button type="button" class="report-filter" data-filter="${key}" aria-pressed="${key === state.filter}">
      ${label} &middot; ${state.entries.filter(test).length}
    </button>`).join("");
}

function renderList(entries) {
  if (!entries.length) {
    els.list.innerHTML = '<li class="report-list-empty">Nothing here right now.</li>';
    return;
  }
  els.list.innerHTML = entries.map((entry) => {
    const meta = [TYPE_LABELS[entry.type], where(entry), shortDate(entry.date), entry.id].map(escapeText).join(" &middot; ");
    return `
      <li>
        <button type="button" class="report-card" data-id="${escapeText(entry.id)}"${entry.id === state.selectedId ? ' aria-current="true"' : ""}>
          ${tile(entry, entry)}
          <span>
            <span class="report-card-title">${escapeText(entry.name)}</span>
            <span class="report-card-meta">${meta}</span>
          </span>
          ${badgeHTML(stageOf(entry))}
        </button>
      </li>`;
  }).join("");
}

function renderDetail() {
  const entry = selectedEntry();
  els.detail.hidden = !entry;
  if (!entry) return;
  const stage = stageOf(entry);
  els.detail.innerHTML = `
    <header class="detail-head">
      ${tile(entry, entry, 28)}
      <div>
        <h2 id="detail-title" tabindex="-1">${escapeText(entry.name)}</h2>
        <p class="detail-meta">${detailMeta(entry)}</p>
      </div>
      ${badgeHTML(stage)}
    </header>
    <div class="detail-body">
      <div>
        <h3 class="detail-label">Progress</h3>
        ${timelineHTML(stepsFor(entry, stage))}
      </div>
      <div class="detail-side">${sideHTML(entry, stage)}</div>
    </div>`;
}

// The list and details for the current filter. Keeps the selection if it's still listed.
function renderView() {
  const { test } = FILTERS.find((filter) => filter.key === state.filter);
  const visible = state.entries.filter(test);
  if (!visible.some((entry) => entry.id === state.selectedId)) state.selectedId = visible[0]?.id ?? null;
  renderList(visible);
  renderDetail();
}

function render() {
  const hasEntries = state.entries.length > 0;
  els.empty.hidden = hasEntries;
  els.filters.hidden = !hasEntries;
  els.layout.hidden = !hasEntries;
  if (!hasEntries) return;
  renderFilters();
  renderView();
}

const focusDetail = () => document.getElementById("detail-title")?.focus({ preventScroll: true });

// Fetches again after a change. Re-rendering replaces the buttons, so focus goes back to the
// same filter or report if it was on one.
function load() {
  return UserAPI.getMyReports().then((entries) => {
    const focused = document.activeElement?.closest("[data-id], [data-filter]");
    const selector = focused && (focused.dataset.id
      ? `[data-id="${CSS.escape(focused.dataset.id)}"]`
      : `[data-filter="${focused.dataset.filter}"]`);
    state.entries = entries;
    render();
    if (selector) document.querySelector(selector)?.focus();
  });
}

/* ---------- Events ---------- */

els.filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  els.filters.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  renderView();
});

els.list.addEventListener("click", (event) => {
  const card = event.target.closest(".report-card");
  if (!card) return;
  state.selectedId = card.dataset.id;
  els.list.querySelectorAll(".report-card").forEach((c) => {
    if (c === card) c.setAttribute("aria-current", "true");
    else c.removeAttribute("aria-current");
  });
  els.notice.textContent = "";
  renderDetail();
  // On a phone the details are above the list, so take the student back up to them.
  if (isNarrow()) {
    els.detail.scrollIntoView({ behavior: "smooth", block: "start" });
    focusDetail();
  }
});

els.detail.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const entry = selectedEntry();
  if (!action || !entry) return;
  const name = entry.name.toLowerCase();

  if (action === "not-mine") {
    if (!window.confirm(`Is the ${entry.item.name} not yours? SWAFO will keep looking for your ${name}.`)) return;
    UserAPI.rejectMatch(entry.id).then(load).then(() => {
      els.notice.textContent = `Thanks for letting us know. Your ${name} report is back to Pending, and SWAFO will keep looking.`;
      focusDetail();
    });
  }

  if (action === "cancel") {
    if (!window.confirm(`Cancel your report for the ${name}? SWAFO will stop looking for it.`)) return;
    UserAPI.cancelReport(entry.id).then(load).then(() => {
      els.notice.textContent = `Your ${name} report was cancelled.`;
      focusDetail();
    });
  }
});

/* ---------- Start ---------- */

// my-reports.html?id= can name the report, the student's claim, or the found item.
function initialSelection() {
  const id = new URLSearchParams(window.location.search).get("id");
  const linked = id && state.entries.find((entry) => entry.id === id || entry.claim?.id === id || entry.item?.id === id);
  return (linked || state.entries.find((entry) => stageOf(entry) === "matched") || state.entries[0])?.id ?? null;
}

Promise.all([UserAPI.getOffice(), UserAPI.getMyReports()]).then(([office, entries]) => {
  state.office = office;
  state.entries = entries;
  state.selectedId = initialSelection();
  render();
});

UserAPI.onReportsChange(load);
