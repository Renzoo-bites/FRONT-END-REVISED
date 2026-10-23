// Lost and found reports students have filed, shown on their My Reports page (user/my-reports.html)
// through UserAPI in user/js/mock-data.js.
//
// Until there's a backend this lives in the browser's localStorage, like the other demo stores.
// Open any page with ?reset-demo to start over with the sample reports.
//
// A lost report's `match` points at the found item (js/item-store.js) SWAFO thinks is theirs.
// A found report shares its id with the item the student turned in.

const ReportStore = (() => {
  // v2: reports store a locationId from js/data/locations.js instead of a place name. v1 reports
  // (from older copies of the demo) are ignored.
  const KEY = "findit.reports.v2";

  const on = (year, month, day, hours, minutes) => new Date(year, month - 1, day, hours, minutes).toISOString();

  const JUAN = "student@example.com";

  // type: "lost" | "found"   status: "pending" | "matched" (an approved claim moves it on; see UserAPI)
  // locationOther: what the student typed for "Other / Not sure", "" otherwise
  // reviewedAt: when SWAFO checked the report, null until then
  // match: { reportId, score } for the found item SWAFO suggested (score 0-100), or null
  // dismissedMatches: found items the student said weren't theirs ("Not mine")
  function seed() {
    const report = (fields) => ({
      reporter: JUAN, status: "pending", locationOther: "", reviewedAt: null, match: null, matchedAt: null, dismissedMatches: [],
      ...fields,
    });
    return [
      report({ id: "FI-0232", type: "lost", name: "Black Umbrella", category: "Others", locationId: "felipe-calderon-hall", date: "2026-10-19", submittedAt: on(2026, 10, 19, 16, 10), reviewedAt: on(2026, 10, 20, 9, 15) }),
      report({ id: "FI-0231", type: "found", name: "Smartphone with Blue Case", category: "Electronics", locationId: "food-square", date: "2026-10-15", submittedAt: on(2026, 10, 15, 16, 5), reviewedAt: on(2026, 10, 16, 9, 10), matchedAt: on(2026, 10, 20, 15, 0) }),
      report({ id: "FI-0223", type: "lost", name: "Student ID", category: "ID & Docs", locationId: "magdiwang-gate", date: "2026-10-14", submittedAt: on(2026, 10, 14, 7, 50), reviewedAt: on(2026, 10, 14, 10, 20), status: "matched", match: { reportId: "FI-0224", score: 97 }, matchedAt: on(2026, 10, 14, 10, 25) }),
      report({ id: "FI-0228", type: "lost", name: "Dorm Keys", category: "Accessories", locationId: "male-dorms", date: "2026-10-12", submittedAt: on(2026, 10, 12, 19, 20), reviewedAt: on(2026, 10, 13, 8, 40), status: "matched", match: { reportId: "FI-0222", score: 95 }, matchedAt: on(2026, 10, 13, 8, 45) }),
      report({ id: "FI-0233", type: "lost", name: "Wireless Earbuds", category: "Electronics", locationId: "aea-main", date: "2026-10-09", submittedAt: on(2026, 10, 9, 17, 40), reviewedAt: on(2026, 10, 10, 9, 5), status: "matched", match: { reportId: "FI-0235", score: 92 }, matchedAt: on(2026, 10, 20, 14, 15) }),
      report({ id: "FI-0225", type: "lost", name: "Water Bottle", category: "Accessories", locationId: "food-square", date: "2026-09-29", submittedAt: on(2026, 9, 29, 13, 5), reviewedAt: on(2026, 9, 30, 9, 0), status: "matched", match: { reportId: "FI-0229", score: 88 }, matchedAt: on(2026, 9, 30, 15, 30) }),
    ];
  }

  let memory = null; // used only if this browser blocks localStorage

  function read() {
    if (memory) return memory;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
      const reports = seed();
      localStorage.setItem(KEY, JSON.stringify(reports));
      return reports;
    } catch {
      memory = seed(); // storage blocked: this tab works on its own, nothing is shared
      return memory;
    }
  }

  function write(reports) {
    if (memory) memory = reports;
    else localStorage.setItem(KEY, JSON.stringify(reports));
  }

  return {
    // One student's reports, by their account email
    forReporter(email) {
      return read().filter((report) => report.reporter === email);
    },

    get(id) {
      return read().find((report) => report.id === id) || null;
    },

    update(id, changes) {
      const reports = read();
      Object.assign(reports.find((report) => report.id === id), changes);
      write(reports);
    },

    remove(id) {
      write(read().filter((report) => report.id !== id));
    },

    // Runs the callback when another tab changes the reports.
    subscribe(callback) {
      window.addEventListener("storage", (event) => {
        if (event.key === KEY || event.key === null) callback();
      });
    },

    reset() {
      memory = null;
      try {
        localStorage.removeItem(KEY);
      } catch {
        // nothing saved
      }
    },
  };
})();

if (new URLSearchParams(window.location.search).has("reset-demo")) ReportStore.reset();
