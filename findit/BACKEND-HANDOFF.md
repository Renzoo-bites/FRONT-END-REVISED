# FindIt: backend handoff

FindIt is a vanilla HTML/CSS/JS frontend with no framework and no build step. Serve the `findit/` folder with any static server (for example, VS Code Live Server). The student site is in `findit/user/` and the SWAFO admin is in `findit/admin/`. The files both use (login, the demo stores, chat, base styles, images) are in `findit/js/`, `findit/css/` and `findit/assets/`.

**Nothing talks to a server yet.** All data is mock data in the browser. This file covers what to replace, the data shapes the UI expects, and what still needs deciding.

## Status

| Area | State |
|---|---|
| Admin dashboard + reports (`admin/`) | Built. All data goes through `AdminAPI` in `admin/js/mock-data.js`, which is Promise-based. To connect it, swap the method bodies for `fetch()`. The Reports panel can edit a report and open the student's conversation about it. |
| Login / logout | Built, but mocked in `js/auth.js`: two test accounts hardcoded, session kept in browser storage. |
| Public forms (report, claim, sign up) | UI and browser validation only. **Nothing is sent.** Report and sign-up just go to the next page (`data-redirect` in `user/js/main.js`). Claim saves to a demo store (`js/claim-store.js`) so the admin Claims page sees it, then shows its confirmation in place (`user/js/claim.js`). |
| Found items: Browse, Item details, Claim summary, and the admin "Add found item" form | Built. All read and write a demo store (`js/item-store.js`), so an item SWAFO adds appears on Browse, but only within one browser. See section 7. |
| My Reports | Built. The student's reports, each with its progress and the found item SWAFO matched it to ("Verify and claim" / "Not mine"), through `UserAPI` and a demo store (`js/report-store.js`). Statuses follow the student's claims live. The report form doesn't save to it yet. See section 11. |
| Messages: student (`user/messages.html`) and SWAFO (`admin/messages.html`) | Built. Both sides share one demo store (`js/message-store.js`) through `UserAPI` and `AdminAPI`, so they already talk to each other, but only within one browser. See section 6. |
| Admin notification bell | Built. Shows unread student messages and claims from the last day live, plus sample notices (matches, new reports) from `admin/js/mock-data.js`. Which types appear is set in Settings. |
| Admin Found Items (`admin/found-items.html`) | Built. The office inventory from `js/item-store.js`, with status actions and the SWAFO-only details. |
| Admin Analytics (`admin/analytics.html`) | Built. Every chart is computed in the browser from `AdminAPI.getReports()`; see section 2. |
| Admin Settings (`admin/settings.html`) | Built. Office details (shown on About and in student Messages), bell preferences, and a demo reset, all in `js/settings-store.js`. See section 8. |
| Admin Claims (`admin/claims.html`) | Built. Reviews the claims from `user/claim.html` (`js/claim-store.js`): the claimant's answers next to the item's SWAFO-only record, with Approve, Reject and Mark as picked up. See section 9. |
| Student Settings (`user/settings.html`) | Built, demo only. Profile, change password, notification switches and Delete account, through `AccountAPI` at the top of `user/js/settings.js`. Each method has a `TODO(backend)` comment with the Supabase call. See section 12. |
| Campus locations | Built in the frontend. The official DLSU-D list is `js/data/locations.js`, and everything stores a location's id. See section 4. |

## 1. Auth (`js/auth.js`)

Current contract:

- `Auth.login(email, password, { role, remember })` resolves to `{ session: { name, email, role } }`, or to `{ error: "credentials" | "role" }`.
  - `role` is `"user"` or `"admin"`, taken from the User/Admin switch on the login page.
  - The account's role must match the selected side, otherwise the result is `{ error: "role" }`.
- `Auth.getSession()` returns the session or `null`. It is **synchronous** because admin pages call it in `<head>` to redirect before anything renders.
- `Auth.logout()` returns a Promise.
- `Auth.requireRole(role, loginPage)` is a client-side redirect only. It hides pages; it doesn't protect anything.
- `Auth.updateSession(changes)` changes the stored session in place. Student Settings uses it after a name change so the navbar shows the new name.

To replace:

- Delete `MOCK_ACCOUNTS` and point `login` at your login endpoint. Keep the return shapes so `user/js/login.js` works unchanged.
- Use an HttpOnly session cookie or a token instead of `sessionStorage`/`localStorage`.
  - If you still want the synchronous `<head>` redirect, cache only `{ name, email, role }` in storage for the UI.
  - Otherwise, make the check async (for example, `GET /api/auth/me`) and adjust the two admin pages.
- **Check the role on every admin endpoint.** The frontend check is cosmetic.

Test accounts until then: `swafo@dlsud.edu.ph` / `admin123` (admin) and `student@example.com` / `student123` (user).

## 2. Admin data (`admin/js/mock-data.js`)

Every `AdminAPI` method returns a Promise. The shapes the UI expects are the ones in `MOCK_DATA` in the same file.

| Method | Suggested endpoint | Returns |
|---|---|---|
| `getCurrentUser()` | `GET /api/auth/me` | `{ name, greetingName, initials, email }` |
| `getNavCounts()` | `GET /api/admin/counts` | `{ reports, claims, messages }` (sidebar badges; `reports` = pending reports) |
| `getCategories()` | `GET /api/categories` | `string[]`, in a fixed order, which also fixes each category's chart color |
| `getDashboard()` | `GET /api/admin/dashboard` | `{ stats, weeklyReports, itemsByCategory, lostToday }` |
| `getReports()` | `GET /api/reports` | `Report[]` |
| `updateReportStatus(id, status)` | `PATCH /api/reports/:id` | the updated `Report` |
| `updateReport(id, fields)` | `PATCH /api/reports/:id` | the updated `Report`. `fields`: `name`, `category`, `locationId`, `locationOther`, `date` (the Reports panel's Edit form) |
| `addFoundItem(fields)` | `POST /api/admin/items` (multipart, for the photo) | the saved item, with its new `id` (see section 7) |
| `getNotifications()` | `GET /api/admin/notifications` | `{ id, type, title, body, time, href, read }[]`, newest first. `type`: `message`, `claim`, `match`, `report` |
| `markNotificationsRead(ids)` | `POST /api/admin/notifications/read` | nothing |
| `getItems()` | `GET /api/admin/items` | every found item, **including** the private fields (Found Items page) |
| `updateItemStatus(id, status)` | `PATCH /api/admin/items/:id` | the updated item |
| `getClaims()` | `GET /api/admin/claims` | `Claim[]`, newest first, each with its `item` (including the private fields) (section 9) |
| `reviewClaim(id, decision)` | `PATCH /api/admin/claims/:id` | the updated `Claim`. `decision`: `approved` / `rejected`; approving also sets the item to `ready` |
| `markClaimPickedUp(id)` | `POST /api/admin/claims/:id/pickup` | the `Claim`; sets its item to `claimed` |
| `getSettings()` / `saveSettings(settings)` | `GET` / `PUT /api/settings` | `{ office: {...}, notifications: {...} }` (section 8) |
| `resetDemoData()` | none (demo only) | Puts back the sample data. Remove it once the backend is connected |

The Analytics page has no endpoint of its own: it counts `getReports()` by month or week, status, location and category in the browser. With many reports, add `GET /api/admin/analytics?period=YYYY-MM` returning those counts instead.

The `Report` shape:

```js
{
  id: "FI-0231",
  name: "iPhone 13",
  type: "lost",               // "lost" | "found"
  category: "Electronics",    // one of getCategories()
  locationId: "magdiwang-gate", // a location id (section 4)
  locationOther: "",          // what was typed for "Other / Not sure" (locationId "other"), else ""
  date: "2026-09-14",         // YYYY-MM-DD
  status: "pending",          // "pending" | "matched" | "ready" | "claimed"
  image: null,                // image URL, or null for a placeholder
  match: { reportId: "FI-0234", score: 92 }, // NLP suggestion (score 0-100), or null
  private: { brand, identifyingDetails, turnedInBy, storage } // SWAFO-only, shown in the detail panel; optional
}
```

Dashboard shapes:

- **`stats[]`:** `{ value, label, icon, trend: { text, direction, sentiment } }`.
  - `value` arrives already formatted, as a string such as `"68%"`.
  - `icon` is a key of `ICON_PATHS` in `admin/js/admin.js`.
  - `direction` is `up` / `down` / `none`.
  - `sentiment` is `positive` / `negative` / `neutral` and sets the pill color.
- **`weeklyReports`:** `{ labels[7], reported[7], recovered[7] }`.
- **`itemsByCategory[]`:** `{ category, count }`.
- **`lostToday[]`:** `{ name, category, locationId, reportedBy, status, time }`.

Notes:

- The reports page currently filters, counts and paginates **in the browser** over the full list, which is fine for a few hundred rows. Beyond that, move it server-side:
  - Accept `status`, `category`, `month` and `q` as query params, plus `page`.
  - Return totals per status for the tab counts.
- The status flow offered in the UI is `pending`/`matched` → `ready` → `claimed`.
- In the demo, edits and status changes to the **sample** reports last only until a reload (they live in `MOCK_DATA`). Items logged with "Add found item" are saved in the item store. The backend should save both.
- The Reports panel's **Message** button opens the newest conversation whose `itemId` is the report's ID, found through `getConversations()`, and is disabled when there's none. With many conversations, add a filter such as `GET /api/admin/conversations?itemId=FI-0230`.
- The admin HTML-escapes every API string before rendering. Validate input on the server anyway.

## 3. Public forms: what they will send

The field names below are the inputs' `name` attributes. Nothing is submitted yet.

| Page | Fields | Notes |
|---|---|---|
| `user/report-form.html` | `type` (lost/found), `itemName`, `category`, `color`, `description`, `photo` (file), `brand` 🔒, `identifyingDetails` 🔒, `locationId`, `locationOther` (sent only when `locationId` is `other`), `date`, `locationDetails`, `itemNow` (found only: `swafo` / `with-me`), `fullName`, `schoolId`, `email`, `phone` | `multipart/form-data`. `user/report-submitted.html` shows a hardcoded reference number; it needs the real ID returned. |
| `user/claim.html` | `fullName`, `schoolId`, `email`, `phone`, `brand`, `identifiers`, `lostLocation` (free text, not a location id), `lostDate`, `proof` (multiple; images or PDF), `certify` | The page is opened as `user/claim.html?id=FI-0236`; send that as `itemId`. SWAFO compares the claim's `brand` and `identifiers` against the item's private fields. |
| `user/signup.html` | `fullName`, `schoolId`, `email`, `password` | 8-character minimum is enforced in the browser only. |
| `user/login.html` | `role`, `email`, `password`, `remember` | See Auth above. |

Hooking these up means replacing the `data-redirect` handling and `user/js/claim.js` with `fetch()` calls to your endpoints. That is frontend work, and it can start as soon as the endpoints exist.

🔒 **Private fields:** `brand` and `identifyingDetails` must never appear in public responses (browse, item details, search). They exist so that only the real owner can name them when claiming. Return them only to SWAFO admins (and to the person who filed the report). The same applies to the reporter's contact details, and to `turnedInBy` and `storage` on found items.

Because these fields are private, **search on public pages must not match on them either**. Otherwise anyone can find out an item's brand by searching for it.

People do still search by brand, though. Browse handles this in `user/js/items.js`:

- `BRAND_KINDS` and `ITEM_KINDS` turn brand and model words into kinds of item, so "iPhone 13" searches all phones and "Aquaflask" all water bottles.
- Every brand of phone returns the same results, so nothing is revealed.
- A note explains why the user is seeing every phone.

If search moves to the server, keep the same behavior: map brands to item kinds, and match only on public fields.

## 4. Shared lists, and what still doesn't agree

**Categories are one list for the whole site**, `ItemStore.categories` in `js/item-store.js`: Electronics, Bags, Clothing, ID & Docs, Accessories, Others. Serve them from the API so SWAFO can change them, and store a stable key alongside each label.

**Locations are the official DLSU-D campus list**: 50 places, plus "Other / Not sure".

- **The list is `js/data/locations.js`.** `LOCATIONS` is the array of `{ id, name, code, campus, aliases }`, and `Locations` holds the helpers the pages use. If the backend keeps its own copy, use the same ids and change both together.
- **Items, reports and conversations store the id** (`locationId`), never the name. Pages show `Locations.label(id)`, e.g. "Gregoria De Jesus Hall (GDH)".
- **Dropdowns:** `campus` is `East`, `West` or `Center` (between the campuses). Every location dropdown (report form, Browse filter, "Add found item", the Reports Edit form, the Found Items filter) is grouped as East Campus, West Campus and Between Campuses, A–Z within each, with "Other / Not sure" last.
- **"Other / Not sure"** is the entry with id `other` and no campus. Picking it shows a free-text box, saved as `locationOther`, which is empty for every other location. In a filter, the box narrows those items by what was typed.
- **Codes:** Mariano Alvarez Hall and Doña Marcela de Agoncillo Hall are both officially "MAH". The UI shows Doña Marcela as "DMAH" and keeps "MAH" as one of its aliases.
- **Aliases** are old names, offices and acronyms ("CBAA", "CEAT building", "SBC", "admin building"). `Locations.extract(text)` reads places out of free text by name, code or alias, as whole words, longest name first (so "old library" is the old AEA building, not the library). Browse and the admin top bar search use it: "CBAA" finds what was found at Gregoria De Jesus Hall. Keep that if search moves to the server.

Reports use one status enum everywhere (`pending`, `matched`, `ready`, `claimed`), My Reports included, and claims keep their own (`under_review`, `approved`, `rejected`).

Still to decide: the "Report submitted" page shows a reference number like `FI-2026-0157`, while everything else uses `FI-0231`. Use one ID format everywhere.

## 5. Not built yet (each will need endpoints)

- **Starting a conversation:** `user/messages.html?item=FI-0224` opens the student's conversation about that item, and `admin/messages.html?c=conv-4` opens one for SWAFO. My Reports' "Message SWAFO" links use it, but nothing can start a new conversation yet: when the student has none about that item, Messages opens their latest one instead. Item details has no "Message SWAFO" button.
- **Admin pages:** Deleting a report or a logged item. Edit in the Reports panel covers the name, category, location and date; the description, photo and SWAFO-only fields can't be changed after an item is logged.
- **Saving reports:** `user/report-form.html` doesn't save anything, so a new report doesn't appear on My Reports yet (section 11).
- **NLP matching:** the `match` field on reports is expected to come from the backend. Its location rule is ready in `js/data/locations.js`; port it if the matcher runs on the server.
  - `Locations.placeOf(record)` is the place a report or item is about: its `locationId`, or, for "Other / Not sure", the first place its own words name by alias ("left it near the CEAT building" is Maria Salome Llanera Hall).
  - `Locations.score(a, b)` scores two places: 1 for the same place, 0.5 for another place on the same campus, and 0 for another campus or no known place. Multiply it by the points location is worth.
- **Telling students about a match:** only My Reports shows it. Add a student notification feed for the navbar bell and an email when a report becomes `matched` (section 11).

## 6. Messages (`js/message-store.js`, `UserAPI`, `AdminAPI`)

Each conversation is between one student and SWAFO, about one item.

- Students use `user/messages.html`, which sees only their own conversations through `UserAPI` in `user/js/mock-data.js`.
- SWAFO uses `admin/messages.html`, which sees every conversation through `AdminAPI` in `admin/js/mock-data.js`.

**How the demo works now:** both APIs read and write `js/message-store.js`, which keeps everything in the browser's localStorage.

- A message sent in one tab appears in another tab within a second, using the browser's `storage` event. Only tabs in the same browser see each other.
- To try it, log in as the student in one tab and as admin in another. Sessions are per tab unless "Remember me" is ticked.
- Opening any page with `?reset-demo` restores the sample conversations.

**To connect the backend:** replace the method bodies below with `fetch()` calls and delete `message-store.js`. The pages don't need to change. For live updates, `onChange` / `onMessagesChange` can poll every few seconds, or listen on WebSockets or Server-Sent Events.

Student side (`UserAPI`):

| Method | Suggested endpoint | Returns |
|---|---|---|
| `getOffice()` | `GET /api/office` | `{ name, fullName, initial, activity, pickupHours }` |
| `getConversations()` | `GET /api/me/conversations` | `Conversation[]`, newest first, with `unread` = the student's unread count |
| `getMessages(conversationId)` | `GET /api/conversations/:id/messages` | `Message[]`, oldest first |
| `markRead(conversationId)` | `POST /api/conversations/:id/read` | nothing |
| `sendMessage(conversationId, { text, image })` | `POST /api/conversations/:id/messages` (multipart, for the photo) | the saved `Message` |
| `reportConversation(conversationId)` | `POST /api/conversations/:id/report` | nothing |
| `onChange(callback)` | polling, WebSocket or SSE | calls back when something changes |

SWAFO side (`AdminAPI`):

| Method | Suggested endpoint | Returns |
|---|---|---|
| `getConversations()` | `GET /api/admin/conversations` | all `Conversation[]`, newest first, with `unread` = SWAFO's unread count |
| `getMessages(conversationId)` | `GET /api/conversations/:id/messages` | `Message[]` |
| `markConversationRead(conversationId)` | `POST /api/admin/conversations/:id/read` | nothing |
| `sendMessage(conversationId, { text, image })` | `POST /api/admin/conversations/:id/messages` | the saved `Message` (sender `"swafo"`) |
| `setConversationStatus(conversationId, status)` | `PATCH /api/admin/conversations/:id` | the system `Message` that tells the student |
| `onMessagesChange(callback)` | polling, WebSocket or SSE | calls back when something changes |
| `getNavCounts()` | `GET /api/admin/counts` | its `messages` field is SWAFO's total unread, used for the sidebar badge |

```js
// Conversation (as stored; each API adds `unread` for its own side)
{
  id: "conv-4",
  student: { name: "Juan Dela Cruz", email: "student@example.com" },
  itemId: "FI-0224",
  itemNumber: 4,               // shown as "Item #4"
  itemName: "School ID",
  icon: "idCard",              // phone | bottle | idCard | key | wallet | backpack | box
  status: "ready",             // same enum as admin reports
  reportType: "lost",          // what the student reported: "lost" shows Start claim, "found" shows View my report
  locationId: "magdiwang-gate", // where the item was found (section 4); locationOther too if it's "other"
  startedBy: "swafo",          // "swafo" | "user"; the student's SWAFO filter tab shows "swafo"
  lastMessage: "Great! I'll come by tomorrow.",
  updatedAt: "2026-10-18T09:46:00Z", // newest message; the "2m" / "Yesterday" labels come from this
  userUnread: 0,
  swafoUnread: 1,
  reported: false              // the student pressed "Report conversation"; SWAFO sees a flag
}

// Message
{
  id: "m-401",
  conversationId: "conv-4",
  sender: "swafo",             // "user" | "swafo" | "system"
  text: "Hi! This is SWAFO…",
  time: "2026-10-18T09:41:00", // ISO timestamp
  image: null                  // URL, or null
}
```

Notes:

- **Students may only read and write their own conversations.** Check this on the server for every conversation endpoint. Admin endpoints need the admin role.
- **Photos:** the browser shrinks a photo to 1024px and sends it as a JPEG data URL. The real endpoint should accept the upload (images only, size-limited), store it, and return a permanent URL in `image`.
- **Unread counts:** a student's message adds 1 to `swafoUnread`. A SWAFO or system message adds 1 to `userUnread`. Each side clears its own count when it opens the conversation.
- **Status:** a status change from the Messages page currently updates only the conversation. On the real backend it should update the item's report too, so the Reports page and the chat agree.

## 7. Found items (`js/item-store.js`)

These are the items SWAFO is holding: what Browse lists, what Item details shows (`user/item-details.html?id=FI-0236`), and what the Claim page summarizes (`user/claim.html?id=FI-0236`).

SWAFO adds them with **+ Add found item** in the admin top bar. A new item:

- appears at the top of admin Reports as a Found report with status Pending;
- is listed on Browse, live in other tabs of the same browser;
- leaves Browse once its status is `claimed`.

**How the demo works now:** everything is kept in localStorage, like messages. `?reset-demo` restores the sample items.

**To connect the backend:**

- Public pages need a public list endpoint and a get-by-id endpoint, for example `GET /api/items` and `GET /api/items/:id`.
- The admin needs `POST /api/admin/items`.
- Replace the reads in `user/js/items.js`, `user/js/item-details.js` and `user/js/claim.js`, and `AdminAPI.addFoundItem`.

```js
// Found item (as stored)
{
  id: "FI-0236",
  name: "Black Leather Wallet",   // public, general ("Phone", not "iPhone 13")
  category: "Bags",               // one of ItemStore.categories
  color: "Black",
  description: "Black bi-fold leather wallet.",
  image: null,                    // photo URL (the demo stores a shrunk JPEG data URL)
  locationId: "aea-main",         // a location id (section 4)
  locationOther: "",              // what was typed for "Other / Not sure", else ""
  locationDetails: "2nd floor reading area",
  dateFound: "2026-10-16",        // YYYY-MM-DD
  status: "pending",              // pending | matched | ready | claimed
  addedByAdmin: false,            // logged through "Add found item"
  loggedAt: "2026-10-16T12:00:00",
  // 🔒 SWAFO-only: never send these to public pages
  brand: "",
  identifyingDetails: "",
  turnedInBy: "Library staff",
  storage: "Cabinet A, shelf 1"
}
```

Notes:

- **The public endpoints must strip the 🔒 fields.** In the demo they're in the browser's storage and the pages simply don't show them, which is fine for a demo but not private.
- **New IDs** are the next number after the highest existing one (`FI-0237`). Generate them on the server.
- **Sample items reuse the IDs** of the reports and chats they belong to (for example the Student ID is `FI-0224`), so "View item" links from Messages work. The sample admin reports are separate data, so Reports only lists the items logged with "Add found item". On the real backend, found items and found reports should be the same records.

## 8. Settings (`js/settings-store.js`)

SWAFO edits these on `admin/settings.html`. In the demo they're kept in localStorage, and `?reset-demo` or the Reset button restores the defaults.

```js
{
  office: {
    name: "SWAFO Office",                    // student Messages header and panel
    fullName: "Student Welfare and Formation Office",
    location: "GMH Building",                // About page
    email: "swafo_helpdesk@dlsud.edu.ph",    // About page
    officeHours: "Monday–Friday, 8:00 AM – 5:00 PM", // About page
    pickupHours: "Mon–Fri, 8AM–5PM"          // student Messages panel
  },
  notifications: { message: true, claim: true, match: true, report: true } // which types the admin bell shows
}
```

On the real backend, `office` is public (`GET /api/office`) but only admins can change it. `notifications` is a per-admin preference.

## 9. Claims (`js/claim-store.js`)

`user/claim.html` saves each claim here, and SWAFO reviews them on `admin/claims.html` through `AdminAPI` (section 2). In the demo they're kept in localStorage, so a claim submitted in one tab appears on the admin page in another tab of the same browser. `?reset-demo` or the Reset button restores the sample claims.

```js
{
  id: "CL-0113",
  itemId: "FI-0229",             // the found item being claimed (user/claim.html?id=)
  claimant: { name: "Ana Cruz", schoolId: "202250789", email: "ana.cruz@example.com", phone: "0936 555 0119" },
  status: "under_review",        // "under_review" | "approved" | "rejected"
  brand: "Aquaflask",            // checked against the item's private brand
  identifiers: "Silver Aquaflask, 32 oz, with a small dent on the lid.",
  lostLocation: "Food Square",   // free text, as the claimant typed it
  lostDate: "2026-09-29",        // YYYY-MM-DD, or ""
  proofFiles: ["receipt.jpg"],   // demo keeps file names only; the backend stores the uploads
  submittedAt: "2026-10-20T09:15:00Z",
  reviewedAt: null,              // set when approved or rejected
  account: "student@example.com" // the logged-in student who sent it (null for guests); links it to their My Reports
}
```

Notes:

- **Claims are private.** Only SWAFO admins and the claimant should be able to read one.
- Only one claim per item can be approved. The page disables Approve when another claim for the item is approved or the item is already `claimed`; enforce the same rule on the server.
- The claim form doesn't check the item yet: it accepts a claim for an ID that doesn't exist, for an item that's already `claimed`, and repeat claims from the same person. Reject those on the server; the form will need to show that error once it calls your API.
- The sidebar badge and the dashboard's "Claims to review" card count the `under_review` claims.
- Approving or rejecting doesn't notify the student yet. Once the backend sends email, send it from `reviewClaim`.

## 10. Frontend tests (`tests/`)

Playwright browser tests cover every page. From the repo root, with Node.js and Google Chrome installed, run `npm install` and then `npm test`.

- Each test opens the pages straight from `findit/` as files and starts from the demo stores' sample data, with the clock fixed at Oct 21, 2026, 10:00 AM and the network blocked.
- Many checks rely on that sample data, for example "8 claims under review". Once `AdminAPI` and `UserAPI` call your endpoints, the tests will need a server (Playwright's `webServer` option) and the same sample data, from a seeded test database or from `page.route()` mocks in `tests/fixtures.js`.

## 11. My Reports (`js/report-store.js`, `UserAPI`)

`user/my-reports.html` lists the logged-in student's lost and found reports. It also lists claims they made without filing a report, for example straight from Browse. Picking one shows its progress. When SWAFO matches a lost report to a found item, the page shows that item (public fields only), its match score, and **Verify and claim** (opens `user/claim.html?id=<found item>`) and **Not mine**.

**How the demo works now:** the student's reports live in `js/report-store.js` (localStorage). `UserAPI.getMyReports()` joins each report to the item store and the student's claims, so the statuses update live: SWAFO approving the student's claim in another tab moves the report to Ready for claim, and marking it picked up moves it to Claimed. `?reset-demo` or the admin Reset button restores the sample reports.

| Method | Suggested endpoint | Returns |
|---|---|---|
| `getMyReports()` | `GET /api/me/reports` | `MyReport[]`, newest `date` first (shape below) |
| `rejectMatch(reportId)` | `POST /api/me/reports/:id/reject-match` | nothing. The report goes back to `pending` without its `match`, and that item should not be suggested to the student again |
| `cancelReport(reportId)` | `DELETE /api/me/reports/:id` | nothing. Allowed only while the report is `pending` |
| `onReportsChange(callback)` | polling, WebSocket or SSE | calls back when a report, its item or the student's claim changes |

```js
// MyReport
{
  id: "FI-0233",               // the report's id, or the claim's id when type is "claim"
  type: "lost",                // "lost" | "found" | "claim" (a claim with no report of the student's behind it)
  name: "Wireless Earbuds",
  category: "Electronics",
  locationId: "aea-main",      // where it was lost or found (section 4). A claim whose item is gone has
  locationOther: "",           // "other", with the claim's lostLocation here
  date: "2026-10-09",          // YYYY-MM-DD: lost, found, or (for a claim) claimed
  status: "matched",           // pending | matched | ready | claimed. "ready" and "claimed" come from the student's approved claim
  submittedAt: "2026-10-09T09:40:00Z",
  reviewedAt: "2026-10-10T01:05:00Z", // SWAFO first checked the report, or null
  matchedAt: "2026-10-20T06:15:00Z",  // SWAFO matched it, or null
  match: { reportId: "FI-0235", score: 92 }, // lost reports only, or null
  item: {                      // the matched found item (or the item claimed). Public fields only
    id: "FI-0235", name: "Wireless Earbuds Case", category: "Electronics",
    locationId: "aea-main", locationOther: "", dateFound: "2026-10-09", image: null, status: "pending"
  },
  claim: { id: "CL-0114", status: "under_review", submittedAt: "…", reviewedAt: null } // the student's latest claim on `item`, or null
}
```

For a found report (the student turned something in), `id` is the found item's id, `status` is that item's status, and `item` and `claim` are `null`.

Notes:

- **Students may only see their own reports.** `item` must never include the private fields (`brand`, `identifyingDetails`, `turnedInBy`, `storage`). The claim form relies on the student naming those details themselves.
- **Who confirms a match:** the page shows whatever is in `match`. If the NLP suggestions should reach students only after SWAFO confirms them, only set `match` and `matchedAt` (and status `matched`) at that point.
- **Not built yet:**
  - `user/report-form.html` should `POST` the report, and it should then appear here as `pending`.
  - SWAFO's admin Reports page doesn't show these student reports in the demo, so SWAFO can't confirm or change their matches there yet.
  - Nothing notifies the student when a report becomes `matched`. Add a student notification feed (for example `GET /api/me/notifications`, linking to `user/my-reports.html?id=<report>`) and an email.
- `user/my-reports.html?id=` opens a report by its own id, by the student's claim id (`user/claim.html` links there after a claim), or by the found item's id (Messages' "View my report").

## 12. Student Settings (`user/js/settings.js`, `AccountAPI`)

Students open `user/settings.html` from Settings in the account menu. It has four sections: Profile (name, read-only email, contact number, photo), Account (change password), Notifications (four switches), and Danger zone (Delete account, with a confirmation dialog). All validation happens in the browser, and nothing is sent yet.

**How the demo works now:** `AccountAPI`, at the top of `user/js/settings.js`, keeps each account's phone, photo and notification choices in localStorage (`findit.account-settings.v1`, keyed by email). The name goes into the session through `Auth.updateSession`, so the navbar shows it. Changing the password checks `MOCK_ACCOUNTS` but can't change it. Delete account only forgets the saved settings and logs out. `?reset-demo` clears the saved settings, but the admin's Reset demo data button doesn't.

Each method has a `TODO(backend)` comment with the Supabase call. If you keep the Promises and the return shapes, the page code doesn't change. If a call fails, reject the Promise: the page then shows an error toast, or an error inside the delete dialog.

| Method | Supabase | Resolves to |
|---|---|---|
| `getAccount()` | The logged-in user's `profiles` row | `{ name, email, phone, photo, notifications: { match, message, status, email } }`. `photo` is a URL or `null`. |
| `saveProfile({ name, phone, photo })` | Upload a new photo to Storage (`avatars`), then update `profiles` (`full_name`, `phone`, `avatar_url`) | Nothing. `photo` is a shrunk JPEG data URL, or `null` to remove the photo. |
| `changePassword(current, next)` | `auth.signInWithPassword` with the current password, then `auth.updateUser({ password })` | `{}`, or `{ error: "current-password" }` |
| `saveNotifications({ match, message, status, email })` | Update the `notify_*` columns on `profiles` | Nothing |
| `deleteAccount()` | A server endpoint or Edge Function that runs `auth.admin.deleteUser` (it needs the service role key, so never call it from the browser), then `auth.signOut()` | Nothing. The page then goes to the home page. |

Not built yet:

- The notification switches only save the student's choices. Nothing sends notifications yet (section 11).
- The navbar avatar still shows initials, not the profile photo.

## Security checklist

- Hash passwords (bcrypt or argon2) and delete `MOCK_ACCOUNTS` from `js/auth.js`.
- Use an HttpOnly, Secure session cookie, with CSRF protection if you go cookie-based.
- Authorize every admin endpoint by role on the server.
- Leave the private fields (`brand`, `identifyingDetails`, reporter contact details) out of every public response and public search.
- Validate uploads (type and size), and store them outside the web root or in object storage.
- Rate-limit login attempts.

## File map

| Path | What it is |
|---|---|
| `user/js/main.js` | Injects the public navbar and footer; placeholder form redirects |
| `js/auth.js` | Mock login and session (replace). The navbar reads the session to show the logged-in state. |
| `js/item-store.js` | **Demo found-items store**, plus the site-wide category list; delete the store once the API exists |
| `js/data/locations.js` | **The campus location list** and its helpers: dropdown options, labels, reading places out of text, and the matcher's location score (section 4) |
| `js/message-store.js` | **Demo message store** shared by both Messages pages (localStorage); delete it once the API exists |
| `js/claim-store.js` | **Demo claim store**: written by `user/claim.html`, read by the admin Claims page and My Reports; delete it once the API exists |
| `js/report-store.js` | **Demo store of the students' own reports**, read by My Reports; delete it once the API exists |
| `js/photos.js` | Shrinks photos before saving (chat, "Add found item") |
| `user/js/items.js`, `user/js/item-details.js`, `user/js/claim.js` | Browse, Item details and Claim, rendered from the item store |
| `js/settings-store.js`, `user/js/about.js` | **Demo settings store**; About reads the office details from it |
| `admin/js/found-items.js`, `admin/js/claims.js`, `admin/js/analytics.js`, `admin/js/settings.js` | Found Items, Claims, Analytics and Settings pages |
| `admin/js/add-item.js` | "+ Add found item" drawer (every admin page) |
| `admin/js/notifications.js` | Notification bell (every admin page) |
| `user/js/mock-data.js` | **Student-side `UserAPI`** (Messages, My Reports); replace the method bodies |
| `js/chat-ui.js`, `css/chat.css` | Chat pieces both Messages pages share: bubbles, composer, photo viewer |
| `user/js/messages.js` | Student Messages page: list, thread, info panel |
| `admin/js/messages.js` | Admin Messages page: inbox, thread, status changes |
| `user/js/login.js` | Login page: User/Admin switch, error messages, redirect by role |
| `admin/js/mock-data.js` | **All admin data plus `AdminAPI`** (replace the method bodies) |
| `admin/js/admin.js` | Admin sidebar and top bar, logout, rendering helpers |
| `admin/js/dashboard.js` | Dashboard page (uses Chart.js 4.4.1 from cdnjs) |
| `admin/js/reports.js` | Reports page: tabs, filters, pagination, detail panel with Edit and Message |
| `user/js/report-form.js` | Report form (Lost/Found switch, photo preview) |
| `user/js/my-reports.js` | My Reports page: filters, report list, progress, match card |
| `user/js/settings.js` | Student Settings page, plus **`AccountAPI`** (demo; each method has a `TODO(backend)` with the Supabase call) |
| `tests/`, `playwright.config.js` (repo root) | Browser tests, section 10 |
