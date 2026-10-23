// Claims students send from user/claim.html, reviewed by SWAFO on admin/claims.html.
//
// Until there's a backend this lives in the browser's localStorage, like the other demo stores,
// so a claim submitted in one tab shows up on the admin Claims page in another tab of the same
// browser. Open any page with ?reset-demo to start over with the sample claims.
//
// A claim holds the claimant's contact details and proof of ownership: only SWAFO (and the
// claimant) should ever see it.

const ClaimStore = (() => {
  // v2: claimant details moved into `claimant`. v1 claims (from older copies of the demo) are
  // ignored instead of breaking the admin Claims page.
  const KEY = "findit.claims.v2";

  const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const on = (year, month, day, hours, minutes) => new Date(year, month - 1, day, hours, minutes).toISOString();
  const DAY = 24 * 60;

  const JUAN = { name: "Juan Dela Cruz", schoolId: "202312345", email: "student@example.com", phone: "0917 123 4567" };

  // status: "under_review" | "approved" | "rejected"
  // brand / identifiers: the claimant's proof, checked against the item's SWAFO-only fields
  // proofFiles: names of the supporting files (the demo doesn't keep the files themselves)
  function seed() {
    const claim = (fields) => ({
      status: "under_review", brand: "", lostLocation: "", lostDate: "", proofFiles: [], reviewedAt: null,
      ...fields,
    });
    return [
      claim({ id: "CL-0101", itemId: "FI-0221", claimant: JUAN, status: "approved", identifiers: "Brown leather wallet with my school ID and a beep card inside.", lostLocation: "ULS gym", lostDate: "2026-09-11", submittedAt: on(2026, 9, 11, 9, 5), reviewedAt: on(2026, 9, 11, 13, 20) }),
      claim({ id: "CL-0102", itemId: "FI-0219", claimant: JUAN, status: "approved", brand: "JanSport", identifiers: "Gray backpack. My calculus notebook and a blue umbrella are inside.", lostLocation: "AEA library", lostDate: "2026-09-10", submittedAt: on(2026, 9, 12, 8, 30), reviewedAt: on(2026, 9, 12, 11, 0) }),
      claim({ id: "CL-0103", itemId: "FI-0231", claimant: { name: "Mark Tan", schoolId: "202198765", email: "mark.tan@example.com", phone: "0918 555 0142" }, status: "rejected", brand: "Samsung", identifiers: "Black Samsung Galaxy A54 with a blue case. The wallpaper is a beach photo.", lostLocation: "Food Square", lostDate: "2026-10-15", submittedAt: minutesAgo(3 * DAY + 300), reviewedAt: minutesAgo(3 * DAY) }),
      claim({ id: "CL-0104", itemId: "FI-0218", claimant: { name: "Lea Ramos", schoolId: "202305511", email: "lea.ramos@example.com", phone: "0927 555 0190" }, identifiers: "Navy blue foldable umbrella with a wooden hook handle. One of the spokes is bent.", lostLocation: "Chapel", lostDate: "2026-10-11", submittedAt: minutesAgo(3 * DAY + 200) }),
      claim({ id: "CL-0105", itemId: "FI-0235", claimant: { name: "Carlo Mendoza", schoolId: "202240318", email: "carlo.mendoza@example.com", phone: "0915 555 0127" }, brand: "Samsung", identifiers: "White Galaxy Buds case, no stickers.", lostLocation: "AEA library", lostDate: "2026-10-09", submittedAt: minutesAgo(2 * DAY + 300) }),
      claim({ id: "CL-0106", itemId: "FI-0236", claimant: { name: "Bea Garcia", schoolId: "202411072", email: "bea.garcia@example.com", phone: "0956 555 0163" }, brand: "Fossil", identifiers: "Black bi-fold wallet. My BDO ATM card, a photo of my family and around ₱500 cash.", lostLocation: "AEA library, 2nd floor", lostDate: "2026-10-16", proofFiles: ["wallet-receipt.jpg"], submittedAt: minutesAgo(2 * DAY + 60) }),
      claim({ id: "CL-0107", itemId: "FI-0224", claimant: JUAN, status: "approved", identifiers: "School ID on a green lanyard. Juan Dela Cruz, BS Computer Science.", lostLocation: "Magdiwang Gate", lostDate: "2026-10-14", submittedAt: minutesAgo(DAY + 120), reviewedAt: minutesAgo(DAY) }),
      claim({ id: "CL-0108", itemId: "FI-0222", claimant: JUAN, identifiers: "Two keys on a blue lanyard, one for my room and one for my locker. The room tag says Narra, 214.", lostLocation: "Narra dorm", lostDate: "2026-10-12", submittedAt: minutesAgo(DAY + 30) }),
      claim({ id: "CL-0109", itemId: "FI-0216", claimant: { name: "Jo Villanueva", schoolId: "202210987", email: "jo.villanueva@example.com", phone: "0917 555 0155" }, brand: "Casio", identifiers: "Gray Casio fx-991ES Plus. There's a sticker with my name on the back.", lostLocation: "Food Square", lostDate: "2026-10-05", submittedAt: minutesAgo(1300) }),
      claim({ id: "CL-0110", itemId: "FI-0229", claimant: JUAN, status: "approved", brand: "Aquaflask", identifiers: "Silver 1L bottle with a cat sticker near the bottom.", lostLocation: "Food Square", lostDate: "2026-09-30", submittedAt: minutesAgo(150), reviewedAt: minutesAgo(60) }),
      claim({ id: "CL-0111", itemId: "FI-0230", claimant: { name: "Paolo Reyes", schoolId: "202320456", email: "paolo.reyes@example.com", phone: "0919 555 0138" }, brand: "Uniqlo", identifiers: "Black hoodie, size M. My initials P.R. are written inside the collar, and the left sleeve has a small tear.", lostLocation: "AEA library", lostDate: "2026-10-07", submittedAt: minutesAgo(130) }),
      claim({ id: "CL-0112", itemId: "FI-0231", claimant: { name: "Maria Santos", schoolId: "202301234", email: "maria.santos@example.com", phone: "0905 555 0171" }, brand: "Apple", identifiers: "iPhone 13 in a blue silicone case with a cracked corner. The lock screen is a photo of my dog.", lostLocation: "Food Square", lostDate: "2026-10-15", proofFiles: ["iphone-box-serial.jpg"], submittedAt: minutesAgo(90) }),
      claim({ id: "CL-0113", itemId: "FI-0229", claimant: { name: "Ana Cruz", schoolId: "202250789", email: "ana.cruz@example.com", phone: "0936 555 0119" }, brand: "Aquaflask", identifiers: "Silver Aquaflask, 32 oz, with a small dent on the lid. No stickers.", lostLocation: "Food Square", lostDate: "2026-09-29", submittedAt: minutesAgo(25) }),
    ];
  }

  let memory = null; // used only if this browser blocks localStorage

  function read() {
    if (memory) return memory;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
      const claims = seed();
      localStorage.setItem(KEY, JSON.stringify(claims));
      return claims;
    } catch {
      memory = seed(); // storage blocked: this tab works on its own, nothing is shared
      return memory;
    }
  }

  function write(claims) {
    if (memory) memory = claims;
    else localStorage.setItem(KEY, JSON.stringify(claims));
  }

  return {
    // Newest first
    all() {
      return read().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    },

    get(id) {
      return read().find((claim) => claim.id === id) || null;
    },

    // fields: itemId, account (the logged-in student's email, so it shows on their My Reports;
    // null for guests), claimant { name, schoolId, email, phone }, brand, identifiers,
    // lostLocation, lostDate, proofFiles. Returns the saved claim with its new id.
    add(fields) {
      const claims = read();
      const numbers = claims.map((claim) => Number(claim.id.replace(/\D/g, "")));
      const claim = {
        ...fields,
        id: `CL-${String(Math.max(100, ...numbers) + 1).padStart(4, "0")}`,
        status: "under_review",
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      };
      claims.push(claim);
      write(claims);
      return claim;
    },

    update(id, changes) {
      const claims = read();
      Object.assign(claims.find((claim) => claim.id === id), changes);
      write(claims);
    },

    // Runs the callback when another tab changes the claims.
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

if (new URLSearchParams(window.location.search).has("reset-demo")) ClaimStore.reset();
