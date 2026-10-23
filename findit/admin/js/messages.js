// Admin Messages: SWAFO's inbox of student conversations. They're the same conversations the
// students see on ../user/messages.html (../js/message-store.js through AdminAPI), so a student's
// message shows up here and SWAFO's replies and status changes show up for the student.
// Bubbles, the composer and the photo viewer are shared (../js/chat-ui.js).
// The top bar search filters the conversation list.

// The next status SWAFO can set from the info panel; the student gets a note in the chat.
const NEXT_STATUS = {
  pending: { status: "ready", label: "Mark as Ready for claim" },
  matched: { status: "ready", label: "Mark as Ready for claim" },
  ready: { status: "claimed", label: "Mark as Claimed" },
};

const state = {
  conversations: [],
  messages: [], // the open conversation's messages
  activeId: null,
  filter: "all", // "all" | "unread"
  query: "",
};

const els = {
  card: document.getElementById("chat-card"),
  filters: document.getElementById("chat-filters"),
  unreadTotal: document.getElementById("chat-unread-total"),
  list: document.getElementById("chat-list"),
  head: document.getElementById("chat-thread-head"),
  messages: document.getElementById("thread-messages"),
  info: document.getElementById("chat-info"),
  infoBackdrop: document.getElementById("chat-info-backdrop"),
  searchForm: document.getElementById("topbar-search"),
  search: document.querySelector("#topbar-search input"),
};

const esc = (value) => ChatUI.escape(value);
// Stored image paths are relative to the site folder; this page is one folder down.
const resolveSrc = (src) => (/^(data:|blob:|https?:|\/)/.test(src) ? src : `../${src}`);
const activeConversation = () => state.conversations.find((c) => c.id === state.activeId);
const isPhoneLayout = () => window.matchMedia("(max-width: 720px)").matches;
const avatar = (name) => `<span class="chat-avatar" aria-hidden="true">${esc(Auth.initials(name))}</span>`;
const itemLine = (c) => `Item #${esc(c.itemNumber)} · ${esc(c.itemName)}`;

// SWAFO is actually looking at the open conversation (not the list on a phone, not another tab).
const threadInView = () =>
  document.visibilityState === "visible" && (!isPhoneLayout() || els.card.classList.contains("show-thread"));

/* ---------- Conversation list ---------- */

function conversationHTML(c) {
  return `
    <li>
      <button type="button" class="chat-convo${c.unread ? " is-unread" : ""}" data-id="${esc(c.id)}" aria-current="${c.id === state.activeId}">
        ${avatar(c.student.name)}
        <span class="chat-convo-text">
          <span class="chat-convo-name">${esc(c.student.name)}</span>
          <span class="chat-convo-item">${itemLine(c)}</span>
          <span class="chat-convo-preview">${esc(c.lastMessage)}</span>
        </span>
        <span class="chat-convo-meta">
          <span class="chat-convo-time">${ChatUI.listTime(c.updatedAt)}</span>
          ${c.unread ? `<span class="chat-unread">${esc(c.unread)}<span class="visually-hidden"> unread</span></span>` : ""}
        </span>
      </button>
    </li>`;
}

function renderList() {
  const query = state.query.trim().toLowerCase();
  const visible = state.conversations.filter((c) =>
    (state.filter !== "unread" || c.unread > 0) &&
    (!query || `${c.student.name} ${c.student.email} item #${c.itemNumber} ${c.itemName} ${c.itemId} ${c.lastMessage}`
      .toLowerCase().includes(query)));

  const listHadFocus = els.list.contains(document.activeElement);
  els.list.innerHTML = visible.length
    ? visible.map(conversationHTML).join("")
    : '<li class="chat-empty">No conversations found.</li>';
  if (listHadFocus) els.list.querySelector('[aria-current="true"]')?.focus();

  els.unreadTotal.textContent = state.conversations.reduce((total, c) => total + c.unread, 0);
}

/* ---------- Thread ---------- */

function renderThreadHead(c) {
  els.head.innerHTML = `
    <button type="button" class="icon-btn chat-back" id="chat-back" aria-label="Back to conversations">${AdminUI.icon("chevronLeft")}</button>
    ${avatar(c.student.name)}
    <div class="chat-thread-title">
      <h2 id="chat-thread-title" tabindex="-1">${esc(c.student.name)}</h2>
      <p>${itemLine(c)} · ${esc(c.itemId)}</p>
    </div>
    <span class="chat-thread-status">${AdminUI.statusBadge(c.status)}</span>
    <a class="admin-btn" href="reports.html?q=${encodeURIComponent(c.itemId)}">View report</a>
    <button type="button" class="icon-btn chat-info-toggle" id="chat-info-toggle" aria-label="Show conversation details"
      aria-controls="chat-info" aria-expanded="${els.card.classList.contains("show-info")}">${AdminUI.icon("info")}</button>`;
}

const bubbleOptions = () => {
  const { student } = activeConversation();
  return { mine: "swafo", otherInitial: Auth.initials(student.name), otherName: student.name, resolveSrc };
};

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

function renderInfo(c) {
  const next = NEXT_STATUS[c.status];
  const photos = state.messages.filter((m) => m.image);
  const focusedId = els.info.contains(document.activeElement) ? document.activeElement.id : null;

  els.info.innerHTML = `
    <button type="button" class="icon-btn chat-info-close" id="chat-info-close" aria-label="Close details">${AdminUI.icon("close")}</button>
    <div class="chat-student">
      ${avatar(c.student.name)}
      <h2>${esc(c.student.name)}</h2>
      <p>${esc(c.student.email)}</p>
    </div>
    ${c.reported ? `<p class="chat-flag">${AdminUI.icon("flag", 16)}The student reported this conversation.</p>` : ""}
    <section aria-labelledby="chat-item-heading">
      <h3 id="chat-item-heading">Item</h3>
      <dl class="info-grid">
        <div><dt>Ref</dt><dd><a href="reports.html?q=${encodeURIComponent(c.itemId)}">${esc(c.itemId)}</a></dd></div>
        <div><dt>Item</dt><dd>${esc(c.itemName)}</dd></div>
        <div><dt>Reported as</dt><dd>${AdminUI.typeBadge(c.reportType)}</dd></div>
        <div><dt>Found at</dt><dd>${esc(Locations.label(c.locationId, c.locationOther))}</dd></div>
      </dl>
    </section>
    <section aria-labelledby="chat-status-heading">
      <h3 id="chat-status-heading">Status</h3>
      <div class="chat-status">${AdminUI.statusBadge(c.status)}</div>
      <button type="button" class="admin-btn admin-btn-primary chat-advance" id="chat-advance"${next ? "" : " disabled"}>
        ${next ? next.label : "Item claimed"}
      </button>
    </section>
    <section aria-labelledby="chat-photos-heading">
      <h3 id="chat-photos-heading">Shared photos</h3>
      ${photos.length
        ? `<ul class="photo-grid">${photos.map((m) => `
            <li><button type="button" class="photo-thumb" data-src="${esc(resolveSrc(m.image))}" aria-label="Open shared photo"><img src="${esc(resolveSrc(m.image))}" alt=""></button></li>`).join("")}
          </ul>`
        : '<p class="chat-muted">No photos shared yet.</p>'}
    </section>`;

  if (focusedId) document.getElementById(focusedId)?.focus();
}

function setInfoOpen(open) {
  els.card.classList.toggle("show-info", open);
  const toggle = document.getElementById("chat-info-toggle");
  toggle?.setAttribute("aria-expanded", String(open));
  if (open) document.getElementById("chat-info-close").focus();
  else if (els.info.contains(document.activeElement)) toggle?.focus();
}

/* ---------- Opening conversations ---------- */

function markActiveRead() {
  const conversation = activeConversation();
  if (!conversation || !conversation.unread) return;
  conversation.unread = 0;
  AdminAPI.markConversationRead(conversation.id).then(() => {
    refreshNavCounts();
    loadNotifications(); // its "sent a message" notification goes away
  });
  renderList();
}

function openConversation(id, { showThread = false } = {}) {
  state.activeId = id;
  composer.reset();
  if (showThread) els.card.classList.add("show-thread");
  markActiveRead();
  renderList();

  return AdminAPI.getMessages(id).then((messages) => {
    if (state.activeId !== id) return; // another conversation was opened in the meantime
    const conversation = activeConversation();
    state.messages = messages;
    renderThreadHead(conversation);
    renderMessages();
    renderInfo(conversation);
    if (showThread) document.getElementById("chat-thread-title").focus();
  });
}

// Phone layout: back from the chat to the list.
function showList() {
  setInfoOpen(false);
  els.card.classList.remove("show-thread");
  els.list.querySelector('[aria-current="true"]')?.focus();
}

// Moves a conversation to the top after SWAFO sends something in it.
function bumpConversation(conversation, message) {
  conversation.lastMessage = message.text || "Sent a photo";
  conversation.updatedAt = message.time;
  state.conversations = [conversation, ...state.conversations.filter((c) => c !== conversation)];
  renderList();
}

/* ---------- Live updates from students (other tabs) ---------- */

function refresh() {
  const before = activeConversation();
  AdminAPI.getConversations().then((conversations) => {
    state.conversations = conversations;
    const conversation = activeConversation();
    if (!conversation) return renderList();

    return AdminAPI.getMessages(conversation.id).then((messages) => {
      const known = new Set(state.messages.map((m) => m.id));
      const fresh = messages.filter((m) => !known.has(m.id));
      appendMessages(fresh);
      if (threadInView()) markActiveRead();
      renderList();
      if (!before || before.status !== conversation.status) renderThreadHead(conversation);
      if (!before || before.status !== conversation.status || before.reported !== conversation.reported
        || fresh.some((m) => m.image)) renderInfo(conversation);
    });
  });
}

AdminAPI.onMessagesChange(refresh);
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
    return AdminAPI.sendMessage(conversationId, { text, image }).then((message) => {
      bumpConversation(state.conversations.find((c) => c.id === conversationId), message);
      if (state.activeId !== conversationId) return;
      appendMessages([message]);
      if (message.image) renderInfo(activeConversation()); // add it to Shared photos
    });
  },
});

const openLightbox = ChatUI.setupLightbox({
  dialog: document.getElementById("lightbox"),
  image: document.getElementById("lightbox-img"),
  close: document.getElementById("lightbox-close"),
});

/* ---------- Events ---------- */

// On this page the top bar search filters conversations instead of going to Reports.
els.search.placeholder = "Search students or items...";
els.searchForm.addEventListener("submit", (event) => event.preventDefault());
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
  const button = event.target.closest(".chat-convo");
  if (button) openConversation(button.dataset.id, { showThread: isPhoneLayout() });
});

els.head.addEventListener("click", (event) => {
  if (event.target.closest("#chat-back")) showList();
  if (event.target.closest("#chat-info-toggle")) setInfoOpen(!els.card.classList.contains("show-info"));
});

els.info.addEventListener("click", (event) => {
  if (event.target.closest("#chat-info-close")) setInfoOpen(false);

  const thumb = event.target.closest(".photo-thumb");
  if (thumb) openLightbox(thumb.dataset.src);

  if (event.target.closest("#chat-advance")) {
    const conversation = activeConversation();
    const next = NEXT_STATUS[conversation.status];
    if (!next) return;
    AdminAPI.setConversationStatus(conversation.id, next.status).then((message) => {
      conversation.status = next.status;
      appendMessages([message]);
      bumpConversation(conversation, message);
      renderThreadHead(conversation);
      renderInfo(conversation);
      document.getElementById("chat-advance").focus();
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
  if (els.card.classList.contains("show-info")) setInfoOpen(false);
});

/* ---------- Start ---------- */

AdminAPI.getConversations().then((conversations) => {
  state.conversations = conversations;

  // admin/messages.html?c=conv-4 opens that conversation. Otherwise open the latest one that's
  // already read, so unread conversations keep their badge until SWAFO opens them.
  const requested = new URLSearchParams(window.location.search).get("c");
  const initial = conversations.find((c) => c.id === requested)
    || conversations.find((c) => !c.unread)
    || conversations[0];

  if (initial) openConversation(initial.id, { showThread: Boolean(requested) && isPhoneLayout() });
  else renderList();
});
