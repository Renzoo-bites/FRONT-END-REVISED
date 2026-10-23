// Sample data for the student side. Conversations and messages live in ../js/message-store.js,
// which the admin Messages page shares; the office details come from ../js/settings-store.js
// (edited on the admin Settings page); My Reports reads ../js/report-store.js, ../js/item-store.js
// and ../js/claim-store.js. This file wraps them in UserAPI. To connect the backend, replace each
// UserAPI method body with a fetch() that resolves to the same shape.

const USER_DATA = {
  officeExtras: { initial: "S", activity: "Active 20m ago" },
};

const currentStudentEmail = () => Auth.getSession()?.email;

// The student sees their own unread count as `unread`.
const asStudentConversation = (c) => ({ ...c, unread: c.userUnread });

// The parts of a found item anyone may see: never its brand or identifying details.
const publicItem = (item) => item && {
  id: item.id, name: item.name, category: item.category, locationId: item.locationId,
  locationOther: item.locationOther, dateFound: item.dateFound, image: item.image, status: item.status,
};

const claimSummary = (claim) => claim && {
  id: claim.id, status: claim.status, submittedAt: claim.submittedAt, reviewedAt: claim.reviewedAt,
};

// An approved claim moves a report on: Ready for claim, then Claimed once it's picked up.
const statusAfterClaim = (status, item, claim) =>
  claim?.status !== "approved" ? status : item?.status === "claimed" ? "claimed" : "ready";

const localDate = (iso) => new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD

// Claims sent while logged in carry the account; the sample claims only have the form's email.
const myClaims = (email) => ClaimStore.all().filter((claim) => (claim.account || claim.claimant.email) === email);

function myReportEntries() {
  const email = currentStudentEmail();
  const claims = myClaims(email); // newest first, so find() gets the latest claim for an item

  const reports = ReportStore.forReporter(email).map((report) => {
    if (report.type === "found") {
      const item = ItemStore.get(report.id); // the item they turned in
      return { ...report, status: item ? item.status : report.status, item: null, claim: null };
    }
    const item = report.match ? ItemStore.get(report.match.reportId) : null;
    const claim = item ? claims.find((c) => c.itemId === item.id) || null : null;
    return { ...report, status: statusAfterClaim(report.status, item, claim), item: publicItem(item), claim: claimSummary(claim) };
  });

  // Claims for items none of the reports point at, e.g. claimed straight from Browse. Without the
  // item, the place is whatever the student typed as where they lost it.
  const linked = new Set(reports.map((report) => report.item?.id));
  const claimOnly = claims.filter((claim) => !linked.has(claim.itemId)).map((claim) => {
    const item = ItemStore.get(claim.itemId);
    return {
      id: claim.id, type: "claim", name: item ? item.name : claim.itemId, category: item?.category || "",
      locationId: item ? item.locationId : Locations.OTHER, locationOther: item ? item.locationOther : claim.lostLocation,
      date: localDate(claim.submittedAt),
      submittedAt: claim.submittedAt, reviewedAt: claim.reviewedAt, match: null, matchedAt: null,
      status: statusAfterClaim("pending", item, claim), item: publicItem(item), claim: claimSummary(claim),
    };
  });

  return [...reports, ...claimOnly].sort((a, b) => b.date.localeCompare(a.date));
}

const UserAPI = {
  getOffice: () => Promise.resolve({ ...SettingsStore.get().office, ...USER_DATA.officeExtras }),

  getConversations: () =>
    Promise.resolve(MessageStore.conversations({ studentEmail: currentStudentEmail() }).map(asStudentConversation)),

  getMessages: (conversationId) => Promise.resolve(MessageStore.messages(conversationId)),

  markRead: (conversationId) => Promise.resolve(MessageStore.markRead(conversationId, "user")),

  // Rejects if the message couldn't be saved (e.g. browser storage full of photos).
  sendMessage: (conversationId, { text = "", image = null }) =>
    Promise.resolve().then(() => MessageStore.addMessage(conversationId, { sender: "user", text, image })),

  reportConversation: (conversationId) =>
    Promise.resolve().then(() => MessageStore.update(conversationId, { reported: true })),

  // Calls back when the conversations change in another tab (e.g. SWAFO replied).
  onChange: (callback) => MessageStore.subscribe(callback),

  // My Reports: the student's lost and found reports (../js/report-store.js) plus claims made
  // without a report, newest first. `item` is the found item a lost report was matched to (or
  // the item a claim is for), with public fields only; `claim` is the student's latest claim on it.
  getMyReports: () => Promise.resolve(myReportEntries()),

  // "Not mine": the report goes back to Pending and SWAFO keeps looking.
  rejectMatch: (reportId) =>
    Promise.resolve().then(() => {
      const report = ReportStore.get(reportId);
      ReportStore.update(reportId, {
        status: "pending",
        match: null,
        matchedAt: null,
        dismissedMatches: [...report.dismissedMatches, report.match.reportId],
      });
    }),

  // Only pending reports can be cancelled.
  cancelReport: (reportId) => Promise.resolve().then(() => ReportStore.remove(reportId)),

  // Calls back when another tab changes a report, an item or a claim (e.g. SWAFO approved one).
  onReportsChange(callback) {
    ReportStore.subscribe(callback);
    ItemStore.subscribe(callback);
    ClaimStore.subscribe(callback);
  },
};
