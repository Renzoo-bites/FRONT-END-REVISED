// Browse page: the found items in ../js/item-store.js, with live search and sidebar filters.
// Items SWAFO adds with "Add found item" show up here (in other tabs of the same browser too).

/* Brands and models are kept off the public list so only the real owner can name them when
   claiming. People still search for them, so a brand or model in the search is swapped for the
   kinds of item it could be: "iPhone 13" searches all phones. Every brand of phone gives the
   same results, so the search never reveals which brand an item is. */

// terms match the start of a word in the card text ("bag" matches "Bags", not "handbag").
const ITEM_KINDS = {
  phone: { label: "phones", terms: ["phone", "smartphone", "cellphone", "mobile"] },
  earbuds: { label: "earbuds", terms: ["earbud", "earphone", "headphone", "headset"] },
  bottle: { label: "water bottles", terms: ["bottle", "tumbler", "flask"] },
  bag: { label: "bags", terms: ["bag", "backpack", "pouch"] },
  wallet: { label: "wallets", terms: ["wallet", "purse", "card holder"] },
  laptop: { label: "laptops", terms: ["laptop", "charger"] },
  tablet: { label: "tablets", terms: ["tablet"] },
  watch: { label: "watches", terms: ["watch", "smartwatch"] },
  calculator: { label: "calculators", terms: ["calculator"] },
  glasses: { label: "glasses", terms: ["glasses", "eyeglasses", "sunglasses"] },
  powerbank: { label: "power banks", terms: ["power bank", "powerbank", "charger", "cable"] },
  keys: { label: "keys", terms: ["key"] },
  clothing: { label: "clothes", terms: ["clothing", "hoodie", "jacket", "shirt", "cap", "shoe"] },
};

// Brand or model name → the kinds of item it could be. Add more as they come up.
const BRAND_KINDS = {
  apple: ["phone", "tablet", "laptop", "earbuds", "watch"],
  iphone: ["phone"],
  samsung: ["phone", "tablet", "earbuds", "watch"],
  galaxy: ["phone"],
  "galaxy buds": ["earbuds"],
  "galaxy tab": ["tablet"],
  oppo: ["phone"],
  vivo: ["phone"],
  realme: ["phone"],
  xiaomi: ["phone"],
  redmi: ["phone"],
  poco: ["phone"],
  huawei: ["phone", "tablet", "watch"],
  infinix: ["phone"],
  tecno: ["phone"],
  pixel: ["phone"],
  nokia: ["phone"],
  airpods: ["earbuds"],
  jbl: ["earbuds"],
  sony: ["earbuds", "phone"],
  beats: ["earbuds"],
  soundcore: ["earbuds"],
  aquaflask: ["bottle"],
  hydroflask: ["bottle"],
  "hydro flask": ["bottle"],
  tupperware: ["bottle"],
  jansport: ["bag"],
  herschel: ["bag"],
  "north face": ["bag", "clothing"],
  samsonite: ["bag"],
  coach: ["wallet", "bag"],
  "kate spade": ["wallet", "bag"],
  "michael kors": ["wallet", "bag"],
  macbook: ["laptop"],
  ipad: ["tablet"],
  lenovo: ["laptop", "tablet"],
  thinkpad: ["laptop"],
  asus: ["laptop"],
  acer: ["laptop"],
  dell: ["laptop"],
  hp: ["laptop"],
  msi: ["laptop"],
  "apple watch": ["watch"],
  casio: ["watch", "calculator"],
  "g-shock": ["watch"],
  fitbit: ["watch"],
  garmin: ["watch"],
  seiko: ["watch"],
  "ray-ban": ["glasses"],
  rayban: ["glasses"],
  oakley: ["glasses"],
  anker: ["powerbank"],
  romoss: ["powerbank"],
  baseus: ["powerbank"],
  toyota: ["keys"],
  honda: ["keys"],
  mitsubishi: ["keys"],
  nissan: ["keys"],
  yamaha: ["keys"],
  suzuki: ["keys"],
  nike: ["clothing", "bag"],
  adidas: ["clothing", "bag"],
  uniqlo: ["clothing"],
  penshoppe: ["clothing"],
};

// Words that are only part of a model name ("13 Pro Max"), dropped once a brand is found.
const MODEL_WORDS = ["pro", "max", "mini", "plus", "ultra", "lite", "air", "se", "series", "gen", "edition"];

// Longest names first, so "galaxy buds" is caught before "galaxy".
const BRAND_NAMES = Object.keys(BRAND_KINDS).sort((a, b) => b.length - a.length);

const itemSearch = document.querySelector("#item-search");
const searchInput = itemSearch.querySelector("input[name='q']");
const filters = document.querySelector("#filters");
const filtersToggle = document.querySelector("#filters-toggle");
const itemGrid = document.querySelector("#item-grid");
const categoryOptions = document.querySelector("#category-options");
const locationSelect = document.querySelector("#filter-location");
const locationOtherGroup = document.querySelector("#filter-location-other-group");
const locationOtherInput = document.querySelector("#filter-location-other");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const searchNotice = document.querySelector("#search-notice");
const searchNoticeText = document.querySelector("#search-notice-text");

const DAY_MS = 24 * 60 * 60 * 1000;
const listFormat = new Intl.ListFormat("en", { type: "conjunction" });
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseSearch(raw) {
  // Lowercase, split "iphone13" into "iphone 13", strip punctuation, and pad with spaces
  // so brand names only match whole words.
  let text = ` ${raw.toLowerCase().replace(/(\p{L})(\p{N})/gu, "$1 $2").replace(/[^\p{L}\p{N}&-]+/gu, " ")} `;

  const found = [];
  BRAND_NAMES.forEach((name) => {
    if (!text.includes(` ${name} `)) return;
    text = text.replace(` ${name} `, " ");
    found.push(BRAND_KINDS[name]);
  });

  // "Samsung Galaxy": Samsung could be several things, Galaxy narrows it to phones.
  // If the names have nothing in common, search everything they could be.
  const shared = found.length ? found.reduce((acc, kinds) => acc.filter((kind) => kinds.includes(kind))) : [];
  const kinds = shared.length ? shared : [...new Set(found.flat())];

  // Campus places by any of their names, old ones and acronyms too ("CBAA", "admin building",
  // "library"), before model numbers are dropped so "Gate 3" survives. See ../js/data/locations.js.
  const { places, rest } = Locations.extract(text);
  if (places.length) text = ` ${rest} `;

  let words = text.trim().split(/\s+/).filter(Boolean);
  if (kinds.length) words = words.filter((word) => !/\d/.test(word) && !MODEL_WORDS.includes(word));

  const kindPatterns = kinds
    .flatMap((kind) => ITEM_KINDS[kind].terms)
    .map((term) => new RegExp(`\\b${escapeRegExp(term)}`));

  return { kinds, kindPatterns, places, words };
}

const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// An item matches when its name is one of the brand's kinds of item (if a brand was typed), it
// was found at the place named (if one was), and its public details contain every other word
// typed, in any order. Private fields (brand, identifying details) are never searched.
function matchesSearch(item, search) {
  const name = item.name.toLowerCase();
  const place = Locations.label(item.locationId, item.locationOther);
  const text = [item.name, item.category, item.color, item.description, place, formatDate(item.dateFound)]
    .join(" ").toLowerCase();
  return (
    (!search.kindPatterns.length || search.kindPatterns.some((pattern) => pattern.test(name))) &&
    Locations.fits(search.places, item.locationId, text) &&
    search.words.every((word) => text.includes(word))
  );
}

function cardHTML(item) {
  const image = item.image || "../assets/images/item-placeholder.svg";
  return `
    <article class="card item-card">
      <img class="item-card-img" src="${escapeText(image)}" alt="" loading="lazy">
      <span class="item-tag"><span class="visually-hidden">Item no. </span>${escapeText(item.id)}</span>
      <div class="card-body">
        <span class="badge">${escapeText(item.category)}</span>
        <h3 class="card-title"><a href="item-details.html?id=${encodeURIComponent(item.id)}">${escapeText(item.name)}</a></h3>
        <ul class="item-meta">
          <li><img src="../assets/icons/location.svg" alt="" width="16" height="16">${escapeText(Locations.label(item.locationId, item.locationOther))}</li>
          <li><img src="../assets/icons/calendar.svg" alt="" width="16" height="16"><time datetime="${escapeText(item.dateFound)}">${formatDate(item.dateFound)}</time></li>
        </ul>
      </div>
    </article>`;
}

function renderFilterOptions() {
  categoryOptions.innerHTML = ItemStore.categories.map((category) => `
    <label class="check"><input type="checkbox" name="category" value="${escapeText(category)}"> ${escapeText(category)}</label>`).join("");
  locationSelect.insertAdjacentHTML("beforeend", Locations.optionsHTML());
  Locations.watchOther(locationSelect, locationOtherGroup);
}

function updateSearchNotice(kinds) {
  searchNotice.hidden = !kinds.length;
  if (!kinds.length) return;
  const kindList = listFormat.format(kinds.map((kind) => ITEM_KINDS[kind].label));
  searchNoticeText.textContent =
    `To prevent false claims, brands and models aren't shown on this list, so we're showing all ${kindList} instead. ` +
    "If one looks like yours, open it to start a claim.";
}

function applyFilters() {
  const search = parseSearch(searchInput.value);
  const categories = [...filters.querySelectorAll("input[name='category']:checked")].map((box) => box.value);
  const place = filters.querySelector("[name='location']").value;
  // With "Other / Not sure" picked, its box narrows those items by the place they were found.
  const otherPlace = place === Locations.OTHER ? locationOtherInput.value.trim().toLowerCase() : "";
  const withinDays = Number(filters.querySelector("[name='date']").value);

  const visible = ItemStore.available().filter((item) => {
    const daysAgo = (Date.now() - new Date(`${item.dateFound}T00:00:00`)) / DAY_MS;
    return (
      matchesSearch(item, search) &&
      (!categories.length || categories.includes(item.category)) &&
      (!place || item.locationId === place) &&
      (!otherPlace || item.locationOther.toLowerCase().includes(otherPlace)) &&
      (!withinDays || daysAgo <= withinDays)
    );
  });

  itemGrid.innerHTML = visible.map(cardHTML).join("");
  updateSearchNotice(search.kinds);
  resultCount.textContent = `Showing ${visible.length} item${visible.length === 1 ? "" : "s"}`;
  emptyState.hidden = visible.length > 0;
}

// The home page search bar submits here as items.html?q=...
searchInput.value = new URLSearchParams(window.location.search).get("q") || "";

itemSearch.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});
searchInput.addEventListener("input", applyFilters);
locationOtherInput.addEventListener("input", applyFilters);
filters.addEventListener("change", applyFilters);
filters.addEventListener("reset", () => {
  searchInput.value = "";
  // The reset event fires before the fields are actually cleared.
  setTimeout(applyFilters);
});

// Filters collapse behind this button on small screens (see items.css).
filtersToggle.addEventListener("click", () => {
  const open = filtersToggle.getAttribute("aria-expanded") !== "true";
  filtersToggle.setAttribute("aria-expanded", String(open));
  filters.classList.toggle("is-open", open);
});

// Another tab changed the items (e.g. SWAFO added one): show the new list.
ItemStore.subscribe(applyFilters);

renderFilterOptions();
applyFilters();
