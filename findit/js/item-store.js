// Found items SWAFO is holding. Shared by the public Browse, Item details and Claim pages and
// the admin "Add found item" form and Reports page.
//
// Until there's a backend this lives in the browser's localStorage, so an item SWAFO adds
// shows up on Browse in another tab of the same browser. Open any page with ?reset-demo to
// start over with the sample items.
//
// brand, identifyingDetails, turnedInBy and storage are SWAFO-only: public pages never show
// them, and the real API must never send them to the public.

const ItemStore = (() => {
  // v2: items store a locationId from ./data/locations.js instead of a place name. v1 items (from
  // older copies of the demo) are ignored instead of showing blank locations.
  const KEY = "findit.items.v2";

  // One list of categories for the whole site (public filters, report form, admin form and
  // reports). The locations have their own file, ./data/locations.js.
  const CATEGORIES = ["Electronics", "Bags", "Clothing", "ID & Docs", "Accessories", "Others"];

  // status: "pending" | "matched" | "ready" | "claimed" (claimed items leave Browse)
  // addedByAdmin: logged through "Add found item" (these also appear in admin Reports)
  // locationOther: what was typed for "Other / Not sure", "" for every other location
  function seed() {
    const item = (fields) => ({
      color: "", description: "", locationOther: "", locationDetails: "", image: null, turnedInBy: "", storage: "",
      brand: "", identifyingDetails: "", addedByAdmin: false, loggedAt: `${fields.dateFound}T12:00:00`,
      ...fields,
    });
    return [
      item({ id: "FI-0236", name: "Black Leather Wallet", category: "Bags", color: "Black", description: "Black bi-fold leather wallet.", locationId: "aea-main", locationDetails: "2nd floor reading area", dateFound: "2026-10-16", status: "pending", turnedInBy: "Library staff", storage: "Cabinet A, shelf 1" }),
      item({ id: "FI-0231", name: "Smartphone with Blue Case", category: "Electronics", color: "Blue", description: "Smartphone in a blue silicone case.", locationId: "food-square", dateFound: "2026-10-15", status: "matched", turnedInBy: "Juan Dela Cruz (student)", storage: "Electronics locker", brand: "Apple", identifyingDetails: "Lock screen photo of a dog. Cracked corner on the case." }),
      item({ id: "FI-0224", name: "Student ID Card", category: "ID & Docs", description: "School ID on a green lanyard.", locationId: "magdiwang-gate", dateFound: "2026-10-14", status: "ready", turnedInBy: "Security guard, Magdiwang Gate", storage: "ID box", identifyingDetails: "Name: Juan Dela Cruz, BS Computer Science." }),
      item({ id: "FI-0222", name: "Keys with Blue Lanyard", category: "Accessories", color: "Blue", description: "Two keys on a blue lanyard.", locationId: "male-dorms", dateFound: "2026-10-12", status: "matched", turnedInBy: "Narra dorm front desk", storage: "Key hooks", identifyingDetails: "Room tag for Narra, room 214." }),
      item({ id: "FI-0218", name: "Navy Blue Umbrella", category: "Others", color: "Navy blue", description: "Navy blue foldable umbrella.", locationId: "chapel", dateFound: "2026-10-11", status: "pending", storage: "Umbrella stand" }),
      item({ id: "FI-0235", name: "Wireless Earbuds Case", category: "Electronics", color: "White", description: "White wireless earbuds charging case.", locationId: "aea-main", dateFound: "2026-10-09", status: "pending", storage: "Electronics locker", brand: "Apple AirPods", identifyingDetails: "Small scratch on the lid." }),
      item({ id: "FI-0230", name: "Black Hoodie", category: "Clothing", color: "Black", description: "Black pullover hoodie, size M.", locationId: "aea-main", dateFound: "2026-10-07", status: "matched", storage: "Clothing bin", identifyingDetails: "Small tear on the left sleeve, initials inside the collar." }),
      item({ id: "FI-0216", name: "Scientific Calculator", category: "Others", color: "Gray", description: "Gray scientific calculator.", locationId: "food-square", dateFound: "2026-10-05", status: "pending", storage: "Cabinet A, shelf 2", brand: "Casio", identifyingDetails: "Name sticker on the back." }),
      item({ id: "FI-0229", name: "Stainless Water Bottle", category: "Accessories", color: "Silver", description: "Stainless steel water bottle, about 1 liter.", locationId: "food-square", dateFound: "2026-09-30", status: "ready", storage: "Cabinet B", brand: "Aquaflask", identifyingDetails: "Cat sticker near the bottom." }),
      item({ id: "FI-0219", name: "Gray Backpack", category: "Bags", color: "Gray", description: "Gray backpack with two zip pockets.", locationId: "aea-main", dateFound: "2026-09-10", status: "ready", storage: "Bag rack", brand: "JanSport" }),
      item({ id: "FI-0221", name: "Brown Wallet", category: "Bags", color: "Brown", description: "Brown leather wallet.", locationId: "ugnayang-la-salle", dateFound: "2026-09-11", status: "claimed", storage: "Released" }),
    ];
  }

  let memory = null; // used only if this browser blocks localStorage

  function read() {
    if (memory) return memory;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
      const items = seed();
      localStorage.setItem(KEY, JSON.stringify(items));
      return items;
    } catch {
      memory = seed(); // storage blocked: this tab works on its own, nothing is shared
      return memory;
    }
  }

  // Throws if storage is full (big photos); callers turn that into an error message.
  function write(items) {
    if (memory) memory = items;
    else localStorage.setItem(KEY, JSON.stringify(items));
  }

  // Newest find first; items logged the same day keep the order they were added.
  const newestFirst = (a, b) => b.dateFound.localeCompare(a.dateFound) || b.loggedAt.localeCompare(a.loggedAt);

  return {
    categories: CATEGORIES,

    all() {
      return read().sort(newestFirst);
    },

    // What the public can browse and claim
    available() {
      return this.all().filter((item) => item.status !== "claimed");
    },

    get(id) {
      return read().find((item) => item.id === id) || null;
    },

    add(item) {
      const items = read();
      items.push(item);
      write(items);
      return item;
    },

    update(id, changes) {
      const items = read();
      Object.assign(items.find((item) => item.id === id), changes);
      write(items);
    },

    // Runs the callback when another tab changes the items.
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

if (new URLSearchParams(window.location.search).has("reset-demo")) ItemStore.reset();
