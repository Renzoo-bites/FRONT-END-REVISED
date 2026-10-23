// Student Messages: conversation list, chat thread, and info panel. Data comes from UserAPI
// (js/mock-data.js); bubbles, the composer and the photo viewer are shared with the admin
// (../js/chat-ui.js). SWAFO's replies from the admin page show up live (see ../js/message-store.js).
// Three columns on desktop; below 1100px the info panel slides over (info button in the chat
// header); below 720px the list and the chat take turns.

const STATUS = {
  pending: { label: "Pending", badge: "badge-warning" },
  matched: { label: "Matched", badge: "badge-info" },
  ready: { label: "Ready for claim", badge: "badge-success" },
  claimed: { label: "Claimed", badge: "badge-neutral" },
};

const ICON_TONES = { phone: "green", bottle: "blue", idCard: "blue", key: "amber", wallet: "amber", backpack: "gray" };

const ICONS = {
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  bottle: '<path d="M10 2h4"/><path d="M10.5 2v3L9 8v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8l-1.5-3V2"/><path d="M9 12h6"/>',
  idCard: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  backpack: '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};

const state = {
  office: null,
  conversations: [],
  messages: [], // the open conversation's messages
  activeId: null,
  filter: "all", // "all" | "unread" | "swafo"
  query: "",
};

const els = {
  app: document.getElementById("messages-app"),
  search: document.getElementById("convo-search"),
  filters: document.getElementById("convo-filters"),
  unreadTotal: document.getElementById("unread-total"),
  list: document.getElementById("convo-list"),
  head: document.getElementById("thread-head"),
  messages: document.getElementById("thread-messages"),
  info: document.getElementById("info-panel"),
  infoBackdrop: document.getElementById("info-backdrop"),
};

const esc = (value) => ChatUI.escape(value);
// Stored image paths are relative to the site folder; this page is one folder down.
const resolveSrc = (src) => (/^(data:|blob:|https?:|\/)/.test(src) ? src : `../${src}`);
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.box}</svg>`;

const activeConversation = () => state.conversations.find((c) => c.id === state.activeId);
const itemTile = (c) => `<span class="item-tile tone-${ICON_TONES[c.icon] || "gray"}">${icon(c.icon)}</span>`;
const isPhoneLayout = () => window.matchMedia("(max-width: 720px)").matches;

// The student is actually looking at the open conversation (not the list on a phone, not another tab).
const threadInView = () =>
  document.visibilityState === "visible" && (!isPhoneLayout() || els.app.classList.contains("show-thread"));

/* ---------- Conversation list ---------- */

function conversationHTML(c) {
  return `
    <li>
      <button type="button" class="convo${c.unread ? " is-unread" : ""}" data-id="${esc(c.id)}" aria-current="${c.id === state.activeId}">
        ${itemTile(c)}
        <span class="convo-text">
          <span class="convo-name">Item #${esc(c.itemNumber)} (${esc(c.itemName)})</span>
          <span class="convo-preview">${esc(c.lastMessage)}</span>
        </span>
        <span class="convo-meta">
          <span class="convo-time">${ChatUI.listTime(c.updatedAt)}</span>
          ${c.unread ? `<span class="unread-badge">${esc(c.unread)}<span class="visually-hidden"> unread</span></span>` : ""}
        </span>
      </button>
    </li>`;
}

function renderList() {
  const query = state.query.trim().toLowerCase();
  const visible = state.conversations.filter((c) =>
    (state.filter !== "unread" || c.unread > 0) &&
    (state.filter !== "swafo" || c.startedBy === "swafo") &&
    (!query || `item #${c.itemNumber} ${c.itemName} ${c.lastMessage}`.toLowerCase().includes(query)));

  const listHadFocus = els.list.contains(document.activeElement);
  els.list.innerHTML = visible.length
    ? visible.map(conversationHTML).join("")
    : '<li class="convo-empty">No conversations found.</li>';
  if (listHadFocus) els.list.querySelector('[aria-current="true"]')?.focus();

  const unread = state.conversations.reduce((total, c) => total + c.unread, 0);
  els.unreadTotal.textContent = unread ? ` · ${unread}` : "";
}

/* ---------- Thread ---------- */

function renderThreadHead(c) {
  const status = STATUS[c.status] || { label: c.status, badge: "badge-neutral" };
  els.head.innerHTML = `
    <button type="button" class="icon-btn thread-back" id="thread-back" aria-label="Back to conversations">${icon("back")}</button>
    ${itemTile(c)}
    <div class="thread-title">
      <h2 id="thread-title" tabindex="-1">Item #${esc(c.itemNumber)} · ${esc(c.itemName)}</h2>
      <p>${esc(state.office.name)} · ${esc(state.office.activity)}</p>
    </div>
    <span class="thread-status"><span class="badge ${status.badge}">${esc(status.label)}</span></span>
    <a class="btn btn-outline btn-sm" href="item-details.html?id=${encodeURIComponent(c.itemId)}">View item</a>
    <button type="button" class="icon-btn info-toggle" id="info-toggle" aria-label="Show conversation details"
      aria-controls="info-panel" aria-expanded="${els.app.classList.contains("show-info")}">${icon("info")}</button>`;
}

const bubbleOptions = () => ({ mine: "user", otherInitial: state.office.initial, otherName: state.office.name, resolveSrc });

const scrollToBottom = () => {
  els.messages.scrollTop = els.messages.scrollHeight;
};

function renderMessages() {
  els.messages.innerHTML = ChatUI.messagesHTML(state.messages, bubbleOptions());
  scrollToBottom();
}

function appendMessages(messages) {
  if (!messages.length) return;
  const previous = state.messages[state.messages.length - 1];
  state.messages.push(...messages);
  els.messages.insertAdjacentHTML("beforeend", ChatUI.messagesHTML(messages, { ...bubbleOptions(), previous }));
  scrollToBottom();
}

/* ---------- Info panel ---------- */

function primaryActionHTML(c) {
  if (c.reportType === "found") return `<a class="btn btn-primary" href="my-reports.html?id=${encodeURIComponent(c.itemId)}">View my report</a>`;
  if (c.status === "claimed") return '<button type="button" class="btn btn-primary" disabled>Already claimed</button>';
  return `<a class="btn btn-primary" href="claim.html?id=${encodeURIComponent(c.itemId)}">Start claim</a>`;
}

function renderInfo(c) {
  const { office } = state;
  const photos = state.messages.filter((m) => m.image);
  const focusedId = els.info.contains(document.activeElement) ? document.activeElement.id : null;

  els.info.innerHTML = `
    <button type="button" class="icon-btn info-close" id="info-close" aria-label="Close details">${icon("close")}</button>
    <div class="office">
      <span class="office-avatar" aria-hidden="true">${esc(office.initial)}</span>
      <h2>${esc(office.name)}</h2>
      <p>${esc(office.fullName)}</p>
    </div>
    <div class="info-actions">
      ${primaryActionHTML(c)}
      <!-- TODO: more options (e.g. mute, mark as unread) -->
      <button type="button" class="icon-btn" aria-label="More options">${icon("more")}</button>
    </div>
    <section class="info-box" aria-labelledby="info-item-heading">
      <h3 id="info-item-heading">Item details</h3>
      <dl>
        <div><dt>Ref:</dt><dd>${esc(c.itemId)}</dd></div>
        <div><dt>Found at:</dt><dd>${esc(Locations.label(c.locationId, c.locationOther))}</dd></div>
        <div><dt>Pick-up:</dt><dd>${esc(office.pickupHours)}</dd></div>
      </dl>
    </section>
    <section aria-labelledby="info-photos-heading">
      <h3 id="info-photos-heading">Shared photos</h3>
      ${photos.length
        ? `<ul class="photo-grid">${photos.map((m) => `
            <li><button type="button" class="photo-thumb" data-src="${esc(resolveSrc(m.image))}" aria-label="Open shared photo"><img src="${esc(resolveSrc(m.image))}" alt=""></button></li>`).join("")}
          </ul>`
        : '<p class="info-empty">No photos shared yet.</p>'}
    </section>
    <button type="button" class="report-link" id="report-btn"${c.reported ? " disabled" : ""}>
      ${c.reported ? "Reported. SWAFO will review this conversation." : "Report conversation"}
    </button>`;

  if (focusedId) document.getElementById(focusedId)?.focus();
}

function setInfoOpen(open) {
  els.app.classList.toggle("show-info", open);
  const toggle = document.getElementById("info-toggle");
  toggle?.setAttribute("aria-expanded", String(open));
  if (open) document.getElementById("info-close").focus();
  else if (els.info.contains(document.activeElement)) toggle?.focus();
}

/* ---------- Opening conversations ---------- */

function markActiveRead() {
  const conversation = activeConversation();
  if (!conversation || !conversation.unread) return;
  conversation.unread = 0;
  UserAPI.markRead(conversation.id);
  renderList();
}

function openConversation(id, { showThread = false } = {}) {
  state.activeId = id;
  composer.reset();
  if (showThread) els.app.classList.add("show-thread");
  markActiveRead();
  renderList();

  return UserAPI.getMessages(id).then((messages) => {
    if (state.activeId !== id) return; // another conversation was opened in the meantime
    const conversation = activeConversation();
    state.messages = messages;
    renderThreadHead(conversation);
    renderMessages();
    renderInfo(conversation);
    if (showThread) document.getElementById("thread-title").focus();
  });
}

// Phone layout: back from the chat to the list.
function showList() {
  setInfoOpen(false);
  els.app.classList.remove("show-thread");
  els.list.querySelector('[aria-current="true"]')?.focus();
}

/* ---------- Live updates from other tabs (SWAFO replies, status changes) ---------- */

function refresh() {
  const before = activeConversation();
  UserAPI.getConversations().then((conversations) => {
    state.conversations = conversations;
    const conversation = activeConversation();
    if (!conversation) return renderList();

    return UserAPI.getMessages(conversation.id).then((messages) => {
      const known = new Set(state.messages.map((m) => m.id));
      const fresh = messages.filter((m) => !known.has(m.id));
      appendMessages(fresh);
      if (threadInView()) markActiveRead();
      renderList();
      if (!before || before.status !== conversation.status) renderThreadHead(conversation);
      if (!before || before.status !== conversation.status || fresh.some((m) => m.image)) renderInfo(conversation);
    });
  });
}

UserAPI.onChange(refresh);
document.addEventListener("visibilitychange", () => {
  if (threadInView()) markActiveRead();
});
setInterval(renderList, 60 * 1000); // keep "2m" / "1h" labels current

/* ---------- Composer + photo viewer ---------- */

const composer = ChatUI.setupComposer({
  form: document.getElementById("composer"),
  input: document.getElementById("composer-input"),
  send: document.getElementById("send-btn"),
  attachBtn: document.getElementById("attach-btn"),
  attachInput: document.getElementById("attach-input"),
  preview: document.getElementById("attach-preview"),
  error: document.getElementById("composer-error"),
  onSend: ({ text, image }) => {
    const conversationId = state.activeId;
    return UserAPI.sendMessage(conversationId, { text, image }).then((message) => {
      const conversation = state.conversations.find((c) => c.id === conversationId);
      conversation.lastMessage = message.text || "Sent a photo";
      conversation.updatedAt = message.time;
      // Most recent conversation moves to the top of the list.
      state.conversations = [conversation, ...state.conversations.filter((c) => c !== conversation)];
      renderList();

      if (state.activeId !== conversationId) return;
      appendMessages([message]);
      if (message.image) renderInfo(conversation); // add it to Shared photos
    });
  },
});

const openLightbox = ChatUI.setupLightbox({
  dialog: document.getElementById("lightbox"),
  image: document.getElementById("lightbox-img"),
  close: document.getElementById("lightbox-close"),
});

/* ---------- Events ---------- */

els.search.addEventListener("input", () => {
  state.query = els.search.value;
  renderList();
});

els.filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  els.filters.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  renderList();
});

els.list.addEventListener("click", (event) => {
  const button = event.target.closest(".convo");
  if (button) openConversation(button.dataset.id, { showThread: isPhoneLayout() });
});

els.head.addEventListener("click", (event) => {
  if (event.target.closest("#thread-back")) showList();
  if (event.target.closest("#info-toggle")) setInfoOpen(!els.app.classList.contains("show-info"));
});

els.info.addEventListener("click", (event) => {
  if (event.target.closest("#info-close")) setInfoOpen(false);

  const thumb = event.target.closest(".photo-thumb");
  if (thumb) openLightbox(thumb.dataset.src);

  if (event.target.closest("#report-btn")) {
    if (!window.confirm("Report this conversation? SWAFO will review it.")) return;
    const conversation = activeConversation();
    UserAPI.reportConversation(conversation.id).then(() => {
      conversation.reported = true;
      renderInfo(conversation);
    });
  }
});

els.infoBackdrop.addEventListener("click", () => setInfoOpen(false));

els.messages.addEventListener("click", (event) => {
  const image = event.target.closest(".bubble-image");
  if (image) openLightbox(image.dataset.src);
});

// Photos change the thread's height as they load, so stay pinned to the newest message.
els.messages.addEventListener("load", scrollToBottom, true);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || event.defaultPrevented || document.getElementById("lightbox").open) return;
  if (els.app.classList.contains("show-info")) setInfoOpen(false);
});

/* ---------- Start ---------- */

Promise.all([UserAPI.getOffice(), UserAPI.getConversations()]).then(([office, conversations]) => {
  state.office = office;
  state.conversations = conversations;

  // messages.html?item=FI-0224 opens that item's conversation. Otherwise open the latest one
  // that's already read, so unread conversations keep their badge until the student opens them.
  const itemId = new URLSearchParams(window.location.search).get("item");
  const initial = conversations.find((c) => c.itemId === itemId)
    || conversations.find((c) => !c.unread)
    || conversations[0];

  if (initial) openConversation(initial.id, { showThread: Boolean(itemId) && isPhoneLayout() });
  else renderList();
});
