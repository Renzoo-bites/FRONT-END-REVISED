// All sample data for the admin pages, in one place.
// To connect the backend, replace each AdminAPI method body with a fetch() that resolves
// to the same shape, e.g.  getReports: () => fetch("/api/reports").then((res) => res.json())

const MOCK_DATA = {
  currentUser: {
    name: "SWAFO Staff",
    greetingName: "SWAFO",
    initials: "SW",
    email: "swafo@dlsud.edu.ph",
  },

  // The site-wide category list lives in ../js/item-store.js (shared with the public pages).
  // Locations are ../js/data/locations.js, which the pages read directly.
  categories: ItemStore.categories,

  // Bell notifications. Unread student messages (../js/message-store.js) and new claims
  // (../js/claim-store.js) are added live. type: "message" | "claim" | "match" | "report"
  notifications: [
    { id: "n-match-0230", type: "match", title: "Possible match found", body: "Black Hoodie (FI-0230) matches lost report FI-0234 (92%).", minutesAgo: 90, href: "reports.html?q=FI-0230" },
    { id: "n-report-0231", type: "report", title: "New lost report", body: "Maria Santos reported an iPhone 13 lost at Magdiwang Gate.", minutesAgo: 190, href: "reports.html?q=FI-0231" },
    { id: "n-report-0224", type: "report", title: "New found report", body: "A student ID was turned in at Magdiwang Gate (FI-0224).", minutesAgo: 1500, href: "reports.html?q=FI-0224" },
  ],

  dashboard: {
    // trend.sentiment: "positive" | "negative" | "neutral" (colors the pill; more pending reports is bad news)
    stats: [
      { value: "5", label: "Items recovered today", icon: "checkCircle", trend: { text: "+3 vs yesterday", direction: "up", sentiment: "positive" } },
      { value: "25", label: "Pending reports to find", icon: "search", trend: { text: "+20% this month", direction: "up", sentiment: "negative" } },
      // value and trend text are counted live from the claims in AdminAPI.getDashboard()
      { id: "claims", value: "8", label: "Claims to review", icon: "claims", trend: { text: "3 new today", direction: "none", sentiment: "neutral" } },
      { value: "68%", label: "Recovery rate this semester", icon: "trendingUp", trend: { text: "+6% vs last month", direction: "up", sentiment: "positive" } },
    ],

    weeklyReports: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      reported: [8, 12, 9, 14, 11, 5, 3],
      recovered: [5, 7, 6, 9, 8, 3, 2],
    },

    itemsByCategory: [
      { category: "Electronics", count: 12 },
      { category: "Bags", count: 10 },
      { category: "Clothing", count: 10 },
      { category: "ID & Docs", count: 6 },
      { category: "Accessories", count: 7 },
      { category: "Others", count: 3 },
    ],

    lostToday: [
      { name: "iPhone 13", category: "Electronics", locationId: "magdiwang-gate", reportedBy: "Maria Santos", status: "pending", time: "9:12 AM" },
      { name: "Black Hoodie", category: "Clothing", locationId: "aea-main", reportedBy: "Paolo Reyes", status: "matched", time: "8:40 AM" },
      { name: "Aquaflask", category: "Accessories", locationId: "food-square", reportedBy: "Ana Cruz", status: "ready", time: "8:05 AM" },
      { name: "Student ID", category: "ID & Docs", locationId: "ugnayang-la-salle", reportedBy: "Jo Villanueva", status: "pending", time: "7:50 AM" },
    ],
  },

  // status: "pending" | "matched" | "ready" | "claimed"   type: "lost" | "found"
  // locationId: from ../js/data/locations.js; locationOther: what was typed for "Other / Not sure"
  // match: the NLP suggestion for the opposite report type, or null
  reports: [
    { id: "FI-0231", name: "iPhone 13", type: "lost", category: "Electronics", locationId: "magdiwang-gate", date: "2026-09-14", status: "pending", image: null, match: null },
    { id: "FI-0230", name: "Black Hoodie", type: "found", category: "Clothing", locationId: "aea-main", date: "2026-09-14", status: "matched", image: null, match: { reportId: "FI-0234", score: 92 } },
    { id: "FI-0229", name: "Aquaflask", type: "lost", category: "Accessories", locationId: "food-square", date: "2026-09-13", status: "ready", image: null, match: { reportId: "FI-0226", score: 88 } },
    { id: "FI-0224", name: "Student ID", type: "found", category: "ID & Docs", locationId: "magdiwang-gate", date: "2026-09-13", status: "matched", image: null, match: { reportId: "FI-0227", score: 97 } },
    { id: "FI-0222", name: "Dorm keys", type: "lost", category: "Accessories", locationId: "male-dorms", date: "2026-09-12", status: "pending", image: null, match: null },
    { id: "FI-0221", name: "Brown wallet", type: "lost", category: "Bags", locationId: "ugnayang-la-salle", date: "2026-09-12", status: "pending", image: null, match: null },
    { id: "FI-0198", name: "Earbuds", type: "found", category: "Electronics", locationId: "ugnayang-la-salle", date: "2026-08-30", status: "claimed", image: null, match: { reportId: "FI-0195", score: 85 } },
    { id: "FI-0219", name: "Backpack", type: "lost", category: "Bags", locationId: "aea-main", date: "2026-09-12", status: "ready", image: null, match: { reportId: "FI-0217", score: 90 } },
    { id: "FI-0218", name: "Navy umbrella", type: "found", category: "Others", locationId: "chapel", date: "2026-09-11", status: "pending", image: null, match: null },
    { id: "FI-0217", name: "Gray backpack", type: "found", category: "Bags", locationId: "aea-main", date: "2026-09-11", status: "ready", image: null, match: { reportId: "FI-0219", score: 90 } },
    { id: "FI-0216", name: "Scientific calculator", type: "found", category: "Others", locationId: "food-square", date: "2026-09-11", status: "pending", image: null, match: null },
    { id: "FI-0215", name: "Laptop charger", type: "lost", category: "Electronics", locationId: "aea-main", date: "2026-09-10", status: "pending", image: null, match: null },
    { id: "FI-0214", name: "Water tumbler", type: "found", category: "Accessories", locationId: "ugnayang-la-salle", date: "2026-09-10", status: "pending", image: null, match: null },
    { id: "FI-0213", name: "Denim jacket", type: "lost", category: "Clothing", locationId: "felipe-calderon-hall", date: "2026-09-10", status: "pending", image: null, match: null },
    { id: "FI-0212", name: "Car keys", type: "found", category: "Accessories", locationId: "other", locationOther: "Parking area near ULS", date: "2026-09-09", status: "matched", image: null, match: { reportId: "FI-0207", score: 89 } },
    { id: "FI-0211", name: "Wireless mouse", type: "lost", category: "Electronics", locationId: "aea-main", date: "2026-09-09", status: "pending", image: null, match: null },
    { id: "FI-0210", name: "Lanyard with ID", type: "found", category: "ID & Docs", locationId: "magdiwang-gate", date: "2026-09-09", status: "pending", image: null, match: null },
    { id: "FI-0209", name: "Eyeglasses", type: "lost", category: "Accessories", locationId: "chapel", date: "2026-09-08", status: "pending", image: null, match: null },
    { id: "FI-0208", name: "Tote bag", type: "found", category: "Bags", locationId: "food-square", date: "2026-09-08", status: "pending", image: null, match: null },
    { id: "FI-0207", name: "Car keys with fob", type: "lost", category: "Accessories", locationId: "other", locationOther: "ULS parking lot", date: "2026-09-08", status: "matched", image: null, match: { reportId: "FI-0212", score: 89 } },
    { id: "FI-0206", name: "Power bank", type: "lost", category: "Electronics", locationId: "female-dorms", date: "2026-09-07", status: "pending", image: null, match: null },
    { id: "FI-0205", name: "PE uniform", type: "found", category: "Clothing", locationId: "ugnayang-la-salle", date: "2026-09-07", status: "pending", image: null, match: null },
    { id: "FI-0204", name: "Notebook", type: "found", category: "Others", locationId: "aea-main", date: "2026-09-06", status: "pending", image: null, match: null },
    { id: "FI-0203", name: "Coin purse", type: "lost", category: "Bags", locationId: "magdiwang-gate", date: "2026-09-06", status: "pending", image: null, match: null },
    { id: "FI-0202", name: "Smartwatch", type: "lost", category: "Electronics", locationId: "ugnayang-la-salle", date: "2026-09-05", status: "matched", image: null, match: { reportId: "FI-0200", score: 94 } },
    { id: "FI-0201", name: "Driver's license", type: "lost", category: "ID & Docs", locationId: "food-square", date: "2026-09-05", status: "pending", image: null, match: null },
    { id: "FI-0200", name: "Black smartwatch", type: "found", category: "Electronics", locationId: "ugnayang-la-salle", date: "2026-09-05", status: "matched", image: null, match: { reportId: "FI-0202", score: 94 } },
    { id: "FI-0199", name: "Calculus textbook", type: "lost", category: "Others", locationId: "aea-main", date: "2026-09-04", status: "pending", image: null, match: null },
    { id: "FI-0197", name: "Baseball cap", type: "found", category: "Clothing", locationId: "magdiwang-gate", date: "2026-09-03", status: "pending", image: null, match: null },
    { id: "FI-0196", name: "Tablet", type: "lost", category: "Electronics", locationId: "male-dorms", date: "2026-09-03", status: "ready", image: null, match: { reportId: "FI-0193", score: 91 } },
    { id: "FI-0195", name: "Earbuds", type: "lost", category: "Electronics", locationId: "ugnayang-la-salle", date: "2026-08-29", status: "claimed", image: null, match: { reportId: "FI-0198", score: 85 } },
    { id: "FI-0194", name: "Rosary", type: "found", category: "Accessories", locationId: "chapel", date: "2026-09-02", status: "pending", image: null, match: null },
    { id: "FI-0193", name: "Tablet in gray case", type: "found", category: "Electronics", locationId: "aea-main", date: "2026-09-02", status: "ready", image: null, match: { reportId: "FI-0196", score: 91 } },
    { id: "FI-0192", name: "Card holder", type: "lost", category: "Bags", locationId: "food-square", date: "2026-09-01", status: "ready", image: null, match: { reportId: "FI-0220", score: 87 } },
    { id: "FI-0191", name: "Phone case", type: "found", category: "Accessories", locationId: "felipe-calderon-hall", date: "2026-08-31", status: "pending", image: null, match: null },
    { id: "FI-0190", name: "Reading glasses", type: "found", category: "Accessories", locationId: "aea-main", date: "2026-08-30", status: "claimed", image: null, match: { reportId: "FI-0186", score: 93 } },
    { id: "FI-0189", name: "Varsity jacket", type: "lost", category: "Clothing", locationId: "magdiwang-gate", date: "2026-08-28", status: "pending", image: null, match: null },
    { id: "FI-0188", name: "USB flash drive", type: "lost", category: "Electronics", locationId: "aea-main", date: "2026-08-28", status: "claimed", image: null, match: { reportId: "FI-0185", score: 90 } },
    { id: "FI-0187", name: "School ID", type: "lost", category: "ID & Docs", locationId: "magdiwang-gate", date: "2026-08-27", status: "claimed", image: null, match: { reportId: "FI-0184", score: 98 } },
    { id: "FI-0186", name: "Reading glasses", type: "lost", category: "Accessories", locationId: "aea-main", date: "2026-08-27", status: "claimed", image: null, match: { reportId: "FI-0190", score: 93 } },
    { id: "FI-0185", name: "USB flash drive", type: "found", category: "Electronics", locationId: "aea-main", date: "2026-08-26", status: "claimed", image: null, match: { reportId: "FI-0188", score: 90 } },
    { id: "FI-0184", name: "School ID", type: "found", category: "ID & Docs", locationId: "magdiwang-gate", date: "2026-08-26", status: "claimed", image: null, match: { reportId: "FI-0187", score: 98 } },
    { id: "FI-0183", name: "Lunch box", type: "found", category: "Others", locationId: "food-square", date: "2026-08-25", status: "pending", image: null, match: null },
    { id: "FI-0182", name: "Sling bag", type: "lost", category: "Bags", locationId: "female-dorms", date: "2026-08-24", status: "claimed", image: null, match: { reportId: "FI-0180", score: 86 } },
    { id: "FI-0181", name: "Ballpen set", type: "found", category: "Others", locationId: "aea-main", date: "2026-08-24", status: "pending", image: null, match: null },
    { id: "FI-0179", name: "Gray hoodie", type: "lost", category: "Clothing", locationId: "ugnayang-la-salle", date: "2026-08-22", status: "pending", image: null, match: null },
  ],
};

// An item from the shared store, shaped like the reports above. `private` holds the SWAFO-only
// fields the Reports detail panel shows (the sample reports don't have them).
const itemAsReport = (item) => ({
  id: item.id,
  name: item.name,
  type: "found",
  category: item.category,
  locationId: item.locationId,
  locationOther: item.locationOther,
  date: item.dateFound,
  status: item.status,
  image: item.image,
  match: null,
  private: {
    brand: item.brand,
    identifyingDetails: item.identifyingDetails,
    turnedInBy: item.turnedInBy,
    storage: item.storage,
  },
});

// A claim from the shared store, with the item it's for (including the item's SWAFO-only
// fields, so the Claims page can check the claimant's answers against them).
const claimWithItem = (claim) => ({ ...claim, item: ItemStore.get(claim.itemId) });
const claimsToReview = () => ClaimStore.all().filter((claim) => claim.status === "under_review");

// Which bell notifications SWAFO has read, kept in this browser for the demo.
const NOTIFICATIONS_READ_KEY = "findit.notifications.read.v1";

function readNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_READ_KEY)) || [];
  } catch {
    return [];
  }
}

function writeNotificationIds(ids) {
  try {
    localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify(ids));
  } catch {
    // storage blocked: read state lasts until the page reloads
  }
}

if (new URLSearchParams(window.location.search).has("reset-demo")) writeNotificationIds([]);

const AdminAPI = {
  getCurrentUser: () => Promise.resolve(MOCK_DATA.currentUser),
  // Reports = pending reports (including logged items), Claims = claims under review,
  // Messages = SWAFO's unread messages.
  getNavCounts() {
    return AdminAPI.getReports().then((reports) => ({
      reports: reports.filter((r) => r.status === "pending").length,
      claims: claimsToReview().length,
      messages: MessageStore.unreadFor("swafo"),
    }));
  },
  getCategories: () => Promise.resolve(MOCK_DATA.categories),

  // The "Claims to review" card is counted from the claims; the other numbers are samples.
  getDashboard() {
    const toReview = claimsToReview();
    const today = new Date().toDateString();
    const newToday = toReview.filter((claim) => new Date(claim.submittedAt).toDateString() === today).length;
    const stats = MOCK_DATA.dashboard.stats.map((stat) => (stat.id === "claims"
      ? { ...stat, value: String(toReview.length), trend: { ...stat.trend, text: `${newToday} new today` } }
      : stat));
    return Promise.resolve({ ...MOCK_DATA.dashboard, stats });
  },

  // Sample reports, plus the items SWAFO logged with "Add found item" (newest first, on top).
  getReports: () => Promise.resolve([
    ...ItemStore.all().filter((item) => item.addedByAdmin).map(itemAsReport),
    ...MOCK_DATA.reports.map((report) => ({ ...report })),
  ]),

  updateReportStatus(id, status) {
    const item = ItemStore.get(id);
    if (item && item.addedByAdmin) {
      ItemStore.update(id, { status });
      return Promise.resolve(itemAsReport(ItemStore.get(id)));
    }
    const report = MOCK_DATA.reports.find((r) => r.id === id);
    report.status = status;
    return Promise.resolve({ ...report });
  },

  // Edit in the Reports panel. fields: name, category, locationId, locationOther, date
  updateReport(id, fields) {
    const item = ItemStore.get(id);
    if (item && item.addedByAdmin) {
      const { date, ...rest } = fields;
      ItemStore.update(id, { ...rest, dateFound: date });
      return Promise.resolve(itemAsReport(ItemStore.get(id)));
    }
    const report = MOCK_DATA.reports.find((r) => r.id === id);
    Object.assign(report, fields);
    return Promise.resolve({ ...report });
  },

  // "Add found item": saves to the shared item store, so it's also on the public Browse page.
  // fields: name, category, color, description, image, locationId, locationOther, locationDetails,
  // dateFound, turnedInBy, storage, brand, identifyingDetails. Rejects if browser storage is full.
  addFoundItem(fields) {
    return Promise.resolve().then(() => {
      const numbers = [...MOCK_DATA.reports, ...ItemStore.all()].map((r) => Number(r.id.replace(/\D/g, "")));
      const id = `FI-${String(Math.max(...numbers) + 1).padStart(4, "0")}`;
      return ItemStore.add({
        ...fields,
        id,
        status: "pending",
        addedByAdmin: true,
        loggedAt: new Date().toISOString(),
      });
    });
  },

  // Newest first. read: whether SWAFO has seen it (kept in this browser for the demo).
  getNotifications() {
    const read = readNotificationIds();
    const messageNotes = MessageStore.conversations()
      .filter((c) => c.swafoUnread)
      .map((c) => ({
        // A new message changes updatedAt, so it shows up as unread again.
        id: `msg-${c.id}-${c.updatedAt}`,
        type: "message",
        title: `${c.student.name} sent a message`,
        body: `Item #${c.itemNumber} · ${c.itemName}: ${c.lastMessage}`,
        time: c.updatedAt,
        href: `messages.html?c=${c.id}`,
      }));
    // Claims from the last day that still need a decision
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const claimNotes = claimsToReview()
      .filter((claim) => claim.submittedAt > dayAgo)
      .map(claimWithItem)
      .map((claim) => ({
        id: `claim-${claim.id}`,
        type: "claim",
        title: "New claim to review",
        body: `${claim.claimant.name} claimed the ${claim.item ? claim.item.name : "item"} (${claim.itemId}).`,
        time: claim.submittedAt,
        href: `claims.html?id=${claim.id}`,
      }));
    const samples = MOCK_DATA.notifications.map(({ minutesAgo, ...note }) => ({
      ...note,
      time: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    }));
    const wanted = SettingsStore.get().notifications; // turned on/off in Settings
    return Promise.resolve([...messageNotes, ...claimNotes, ...samples]
      .filter((note) => wanted[note.type] !== false)
      .sort((a, b) => (a.time < b.time ? 1 : -1))
      .map((note) => ({ ...note, read: read.includes(note.id) })));
  },

  markNotificationsRead(ids) {
    writeNotificationIds([...new Set([...readNotificationIds(), ...ids])]);
    return Promise.resolve();
  },

  // Found Items page: every item SWAFO holds, including private fields (admin only).
  getItems: () => Promise.resolve(ItemStore.all()),

  updateItemStatus(id, status) {
    return Promise.resolve().then(() => {
      ItemStore.update(id, { status });
      return ItemStore.get(id);
    });
  },

  // Settings page (../js/settings-store.js). saveSettings rejects if storage is blocked.
  getSettings: () => Promise.resolve(SettingsStore.get()),
  saveSettings: (settings) => Promise.resolve().then(() => SettingsStore.save(settings)),

  // Claims page (../js/claim-store.js): every claim with its item, newest first.
  getClaims: () => Promise.resolve(ClaimStore.all().map(claimWithItem)),

  // decision: "approved" | "rejected". Approving also makes the item Ready for claim.
  reviewClaim(id, decision) {
    return Promise.resolve().then(() => {
      ClaimStore.update(id, { status: decision, reviewedAt: new Date().toISOString() });
      const claim = claimWithItem(ClaimStore.get(id));
      if (decision === "approved" && claim.item && ["pending", "matched"].includes(claim.item.status)) {
        ItemStore.update(claim.itemId, { status: "ready" });
      }
      return claimWithItem(ClaimStore.get(id)); // fetched again for the item's new status
    });
  },

  // The approved claimant collected the item at the office: the item becomes Claimed.
  markClaimPickedUp(id) {
    return Promise.resolve().then(() => {
      ItemStore.update(ClaimStore.get(id).itemId, { status: "claimed" });
      return claimWithItem(ClaimStore.get(id));
    });
  },

  // Calls back when a student submits a claim in another tab.
  onClaimsChange: (callback) => ClaimStore.subscribe(callback),

  // Settings > Reset demo data: sample messages, items, claims, student reports, settings and
  // notifications again. Only the Settings page calls it, and it loads ../js/report-store.js.
  resetDemoData() {
    MessageStore.reset();
    ItemStore.reset();
    ClaimStore.reset();
    ReportStore.reset();
    SettingsStore.reset();
    writeNotificationIds([]);
    return Promise.resolve();
  },

  // Messages: the same conversations the students see, from ../js/message-store.js.
  // SWAFO's own unread count is `unread`. Writes reject if browser storage is full.
  getConversations: () =>
    Promise.resolve(MessageStore.conversations().map((c) => ({ ...c, unread: c.swafoUnread }))),

  getMessages: (conversationId) => Promise.resolve(MessageStore.messages(conversationId)),

  markConversationRead: (conversationId) => Promise.resolve(MessageStore.markRead(conversationId, "swafo")),

  sendMessage: (conversationId, { text = "", image = null }) =>
    Promise.resolve().then(() => MessageStore.addMessage(conversationId, { sender: "swafo", text, image })),

  // Changes the item's status and tells the student with a system message in the chat.
  setConversationStatus(conversationId, status) {
    const notes = {
      ready: "SWAFO marked this item as Ready for claim",
      claimed: "SWAFO marked this item as Claimed",
    };
    return Promise.resolve().then(() => {
      MessageStore.update(conversationId, { status });
      return MessageStore.addMessage(conversationId, { sender: "system", text: notes[status] || `Status changed to ${status}` });
    });
  },

  // Calls back when a student sends or reads something in another tab.
  onMessagesChange: (callback) => MessageStore.subscribe(callback),
};
