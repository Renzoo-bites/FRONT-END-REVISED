// Admin notification bell (top bar, every admin page): unread student messages and new claims,
// live from ../js/message-store.js and ../js/claim-store.js, plus sample notices about matches
// and new reports (admin/js/mock-data.js). Clicking one marks it read and opens it.

const NOTIF_ICONS = { message: "messages", claim: "claims", match: "sparkles", report: "reports" };

const notifButton = document.getElementById("notif-btn");
const notifMenu = notifButton.closest(".notif-menu");
const notifPanel = document.getElementById("notif-panel");
const notifDot = notifButton.querySelector(".notif-dot");
let notifications = [];

function notificationHTML(n) {
  const esc = (value) => AdminUI.escape(value);
  return `
    <li>
      <a class="notif-item${n.read ? "" : " is-unread"}" href="${esc(n.href)}" data-id="${esc(n.id)}">
        <span class="notif-icon notif-${esc(n.type)}">${AdminUI.icon(NOTIF_ICONS[n.type] || "bell", 18)}</span>
        <span class="notif-text">
          <span class="notif-title">${esc(n.title)}</span>
          <span class="notif-body">${esc(n.body)}</span>
          <span class="notif-time">${AdminUI.timeAgo(n.time)}</span>
        </span>
        ${n.read ? "" : '<span class="notif-unread"><span class="visually-hidden">Unread</span></span>'}
      </a>
    </li>`;
}

function renderNotifications() {
  const unread = notifications.filter((n) => !n.read).length;
  notifDot.hidden = !unread;
  notifButton.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");

  // Keep keyboard focus on the same row if the list refreshes while it's open.
  const focusedId = notifPanel.contains(document.activeElement) ? document.activeElement.dataset.id || document.activeElement.id : null;

  notifPanel.innerHTML = `
    <div class="notif-head">
      <h2>Notifications</h2>
      <button type="button" class="notif-mark-all" id="notif-mark-all"${unread ? "" : " disabled"}>Mark all as read</button>
    </div>
    ${notifications.length
      ? `<ul class="notif-list">${notifications.map(notificationHTML).join("")}</ul>`
      : '<p class="notif-empty">You\'re all caught up.</p>'}`;

  if (focusedId) (notifPanel.querySelector(`[data-id="${CSS.escape(focusedId)}"]`) || document.getElementById(focusedId))?.focus();
}

// Pages call this after something changes the list (e.g. Messages after reading a conversation).
function loadNotifications() {
  return AdminAPI.getNotifications().then((list) => {
    notifications = list;
    renderNotifications();
  });
}

function setNotificationsOpen(open) {
  notifPanel.hidden = !open;
  notifButton.setAttribute("aria-expanded", String(open));
  if (open) loadNotifications(); // refresh the "25m" labels
}

notifButton.addEventListener("click", () => setNotificationsOpen(notifPanel.hidden));

// composedPath() rather than target.closest(): "Mark all as read" re-renders the panel, so by
// the time this runs the clicked button is no longer in the page.
document.addEventListener("click", (event) => {
  if (!event.composedPath().includes(notifMenu)) setNotificationsOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !notifPanel.hidden) {
    event.preventDefault(); // so page-level Escape handlers skip this press
    setNotificationsOpen(false);
    notifButton.focus();
  }
});

notifPanel.addEventListener("click", (event) => {
  if (event.target.closest("#notif-mark-all")) {
    AdminAPI.markNotificationsRead(notifications.map((n) => n.id)).then(loadNotifications);
    return;
  }
  // Marked read right away (saved before the link opens).
  const link = event.target.closest(".notif-item");
  if (link) AdminAPI.markNotificationsRead([link.dataset.id]);
});

AdminAPI.onMessagesChange(loadNotifications);
AdminAPI.onClaimsChange(loadNotifications);
loadNotifications();
