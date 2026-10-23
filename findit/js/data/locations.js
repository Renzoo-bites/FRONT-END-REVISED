// Official DLSU-D campus locations: the one list every location dropdown, filter and search uses,
// on the public pages and in the admin. The backend should use the same ids (BACKEND-HANDOFF.md,
// section 4).
//
// Items, reports and conversations store a location's `id` (locationId), never its name. campus
// is "East", "West" or "Center" (between the two campuses). aliases are the older names, offices
// and acronyms people still use ("CBAA", "admin building"), so free text that names a place can
// be matched to it.

const LOCATIONS = [
  // East Campus
  { id: "mariano-alvarez-hall", name: "Mariano Alvarez Hall", code: "MAH", campus: "East", aliases: ["BFMO"] },
  // Officially "MAH" as well: DMAH tells it apart from Mariano Alvarez Hall on the page.
  { id: "dona-marcela-agoncillo-hall", name: "Doña Marcela de Agoncillo Hall", code: "DMAH", campus: "East", aliases: ["MAH", "SBC", "Small Business Center", "National Bookstore", "LCDC"] },
  { id: "severino-delas-alas-hall", name: "Severino de las Alas Hall", code: "SDH", campus: "East", aliases: ["Alumni Building"] },
  { id: "centennial-hall", name: "Centennial Hall", code: null, campus: "East", aliases: [] },
  { id: "milas-diner", name: "Mila's Diner", code: null, campus: "East", aliases: ["KND Diner"] },
  { id: "aea-main", name: "Aklatang Emilio Aguinaldo – Main Building", code: "AEA", campus: "East", aliases: ["library", "AEA-IRC", "aklatan"] },
  { id: "aea-old", name: "Aklatang Emilio Aguinaldo – Old Building", code: null, campus: "East", aliases: ["old library", "old aklatan"] },
  { id: "chapel", name: "Our Lady of the Most Holy Rosary Chapel", code: null, campus: "East", aliases: ["chapel"] },
  { id: "gus-boquer-complex", name: "Bro. Gus Boquer Cultural Heritage Complex", code: null, campus: "East", aliases: ["museum complex"] },
  { id: "museo-de-la-salle", name: "Museo De La Salle", code: null, campus: "East", aliases: ["museo", "museum"] },
  { id: "museo-cafe", name: "Museo Cafe", code: null, campus: "East", aliases: [] },
  { id: "museo-pavilion", name: "Museo Pavilion", code: null, campus: "East", aliases: [] },
  { id: "conservation-studio", name: "Conservation Studio", code: null, campus: "East", aliases: ["Camarin"] },
  { id: "botanical-garden", name: "Botanical Garden", code: null, campus: "East", aliases: [] },
  { id: "lumina-bridge", name: "Lumina Bridge", code: null, campus: "East", aliases: ["Botanical Bridge"] },
  { id: "university-lake", name: "University Lake", code: null, campus: "East", aliases: ["lake", "Lake Park"] },
  { id: "residencia-san-miguel", name: "Residencia San Miguel", code: null, campus: "East", aliases: [] },

  // West Campus
  { id: "gregoria-montoya-hall", name: "Gregoria Montoya Hall", code: "GMH", campus: "West", aliases: ["Admin Building", "Administration Building", "Registrar"] },
  { id: "vito-belarmino-hall", name: "Vito Belarmino Hall", code: "VBH", campus: "West", aliases: [] },
  { id: "felipe-calderon-hall", name: "Felipe Calderon Hall", code: "FCH", campus: "West", aliases: ["COEd"] },
  { id: "ladislao-diwa-hall", name: "Ladislao Diwa Hall", code: "LDH", campus: "West", aliases: [] },
  { id: "warehouse-building", name: "Warehouse Building", code: null, campus: "West", aliases: ["warehouse", "uniform"] },
  { id: "polca", name: "POLCA Building", code: null, campus: "West", aliases: ["Ikot jeep terminal", "Francisco Barzaga Hall"] },
  { id: "gregoria-de-jesus-hall", name: "Gregoria De Jesus Hall", code: "GDH", campus: "West", aliases: ["CBAA", "CBAA Building", "CBA"] },
  { id: "santiago-alvarez-hall", name: "Santiago Alvarez Hall", code: "SAH", campus: "West", aliases: ["ancillary"] },
  { id: "maria-salome-llanera-hall", name: "Maria Salome Llanera Hall", code: "MLH", campus: "West", aliases: ["CEAT", "CEAT Building"] },
  { id: "candido-tirona-hall", name: "Candido Tirona Hall", code: "CTH", campus: "West", aliases: [] },
  { id: "mariano-trias-hall", name: "Mariano Trias Hall", code: "MTH", campus: "West", aliases: [] },
  { id: "mth-covered-court", name: "MTH Covered Court", code: null, campus: "West", aliases: ["covered court"] },
  { id: "shs-complex", name: "Senior High School Complex", code: null, campus: "West", aliases: ["High School", "HS", "JHS", "SHS"] },
  { id: "nbs-hs", name: "National Bookstore HS", code: null, campus: "West", aliases: ["HS bookstore"] },
  { id: "material-recovery-facility", name: "Material Recovery Facility", code: "MRF", campus: "West", aliases: [] },
  { id: "balinsasayaw", name: "Balinsasayaw / Command Center Building", code: null, campus: "West", aliases: ["old HS cafeteria", "GSO"] },
  { id: "security-office", name: "Campus Security Office", code: null, campus: "West", aliases: ["security"] },
  { id: "knd", name: "Kabalikat ng DLSU-D", code: "KND", campus: "West", aliases: [] },
  { id: "sustainability-office", name: "Campus Sustainability Office", code: "CSO", campus: "West", aliases: [] },
  { id: "sewage-treatment-plant", name: "Sewage Treatment Plant", code: "STP", campus: "West", aliases: [] },
  { id: "grandstand-oval", name: "Grandstand & Track Oval", code: "GDO", campus: "West", aliases: ["oval", "grandstand", "track"] },
  { id: "ugnayang-la-salle", name: "Ugnayang La Salle", code: "ULS", campus: "West", aliases: ["gym", "Palaruang La Salle"] },
  { id: "swimming-pool", name: "Olympic Swimming Pool", code: null, campus: "West", aliases: ["pool"] },
  { id: "shower-dressing-room", name: "Shower and Dressing Room Building", code: null, campus: "West", aliases: [] },
  { id: "rcc", name: "Retreat and Conference Center", code: "RCC", campus: "West", aliases: [] },
  { id: "bahay-pag-asa", name: "Bahay Pag-asa", code: null, campus: "West", aliases: [] },
  { id: "magdiwang-gate", name: "Magdiwang Gate (Gate 3)", code: null, campus: "West", aliases: ["Gate 3"] },
  { id: "hotel-rafael", name: "Hotel Rafael", code: null, campus: "West", aliases: [] },
  { id: "gourmet-hall", name: "Gourmet Hall", code: null, campus: "West", aliases: ["Campus Gourmet", "igloo"] },
  { id: "male-dorms", name: "Male Dormitories", code: null, campus: "West", aliases: ["dorm", "Acacia", "Bagtikan", "Kamagong", "Katmon", "Lawaan", "Narra"] },
  { id: "female-dorms", name: "Female Dormitories", code: null, campus: "West", aliases: ["dorm"] },

  // Between Campuses
  { id: "food-square", name: "University Food Square", code: null, campus: "Center", aliases: ["Square Canteen", "canteen", "food court"] },
  { id: "batibot", name: "Batibot", code: null, campus: "Center", aliases: [] },

  // The last option in every dropdown, with a free-text box beside it (locationOther). It isn't a
  // place, so it has no campus and never matches another location.
  { id: "other", name: "Other / Not sure", code: null, campus: null, aliases: [] },
];

const Locations = (() => {
  const OTHER = "other";
  const byId = new Map(LOCATIONS.map((place) => [place.id, place]));

  // Dropdown groups, in this order, A–Z inside each.
  const GROUPS = [
    { campus: "East", label: "East Campus" },
    { campus: "West", label: "West Campus" },
    { campus: "Center", label: "Between Campuses" },
  ].map((group) => ({
    ...group,
    places: LOCATIONS.filter((place) => place.campus === group.campus).sort((a, b) => a.name.localeCompare(b.name, "en")),
  }));

  const escape = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  // Lowercase, without accents or punctuation, and padded with spaces so a phrase only matches
  // whole words: "Doña" is "dona", "Mila's" is "milas", and "HS" doesn't match inside "dishes".
  const normalize = (text) => ` ${String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/['’]/g, "")
    .replace(/(\p{L})(\p{N})/gu, "$1 $2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;

  // Every way a place is written: its name, each half of "Balinsasayaw / Command Center Building",
  // the name without "(Gate 3)" or a last "Hall" / "Building" ("POLCA"), its code and its aliases.
  // rank puts a place whose name or code it is ahead of one that only has it as an alias.
  function namesOf(place) {
    const names = place.name.split(" / ").flatMap((name) => {
      const short = name.replace(/\s*\(.*\)$/, "");
      return [name, short, short.replace(/\s+(Hall|Building)$/, "")];
    });
    return [
      ...[place.name, ...names].map((name) => ({ name, rank: 0 })),
      { name: place.code, rank: 1 },
      ...place.aliases.map((alias) => ({ name: alias, rank: 2 })),
    ];
  }

  // Longest first, so "old library" is read before "library" and "CEAT building" before "CEAT".
  // A phrase several places share ("dorm", "MAH") names all of them.
  const PHRASES = (() => {
    const owners = new Map(); // phrase → [{ id, rank }]
    LOCATIONS.filter((place) => place.campus).forEach((place) => {
      namesOf(place).forEach(({ name, rank }) => {
        const phrase = normalize(name).trim();
        if (!phrase) return;
        const list = owners.get(phrase) || [];
        if (!list.some((owner) => owner.id === place.id)) list.push({ id: place.id, rank });
        owners.set(phrase, list);
      });
    });
    return [...owners]
      .map(([phrase, list]) => ({
        phrase,
        ids: list.sort((a, b) => a.rank - b.rank).map((owner) => owner.id),
        pattern: new RegExp(`(?<= )${phrase}(?= )`, "g"),
      }))
      .sort((a, b) => b.phrase.length - a.phrase.length);
  })();

  // Words around a place's name ("near the CBAA building"), dropped from the rest once a place is found.
  const PLACE_WORDS = ["at", "in", "inside", "near", "by", "beside", "behind", "around", "the", "building", "bldg", "area", "sa", "malapit"];

  let lastExtract = { text: null, result: null }; // searches ask again for every row

  return {
    OTHER,
    all: LOCATIONS,

    get(id) {
      return byId.get(id) || null;
    },

    // How a location reads on the page: "Gregoria De Jesus Hall (GDH)". For "Other / Not sure",
    // what the person typed in the box beside it, if anything.
    label(id, other = "") {
      if (id === OTHER) return String(other ?? "").trim() || byId.get(OTHER).name;
      const place = byId.get(id);
      if (!place) return String(id ?? "");
      return place.code ? `${place.name} (${place.code})` : place.name;
    },

    // The <optgroup>s for a location <select>, then "Other / Not sure". Each page keeps its own
    // first option ("Select a location", "All locations") in its HTML.
    optionsHTML(selected = "") {
      const option = (place) =>
        `<option value="${place.id}"${place.id === selected ? " selected" : ""}>${escape(this.label(place.id))}</option>`;
      return GROUPS.map(({ label, places }) => `<optgroup label="${label}">${places.map(option).join("")}</optgroup>`).join("")
        + option(byId.get(OTHER));
    },

    // Shows `box`, the free-text field for "Other / Not sure", only while that's picked, and
    // disables its input otherwise so the form leaves it out. Returns the check, for after the
    // select is changed in code.
    watchOther(select, box) {
      const sync = () => {
        box.hidden = select.value !== OTHER;
        box.querySelectorAll("input").forEach((input) => {
          input.disabled = box.hidden;
        });
      };
      select.addEventListener("change", sync);
      // The reset event comes before the fields are actually cleared.
      select.form?.addEventListener("reset", () => setTimeout(sync));
      sync();
      return sync;
    },

    // Reads campus places out of free text by name, code or alias, as whole words: "lost it at the
    // CBAA building" names Gregoria De Jesus Hall. Returns each place named, in the order they
    // appear ({ phrase, ids }; a shared alias like "dorm" has several ids), and the rest of the
    // text without them or the words around them.
    extract(text) {
      if (text === lastExtract.text) return lastExtract.result;
      let rest = normalize(text);
      const found = [];
      PHRASES.forEach(({ phrase, ids, pattern }) => {
        const at = rest.search(pattern);
        if (at === -1) return;
        found.push({ at, phrase, ids });
        rest = rest.replace(pattern, (match) => " ".repeat(match.length)); // so shorter names can't match inside it
      });
      const words = rest.trim().split(/\s+/).filter(Boolean);
      const result = {
        places: found.sort((a, b) => a.at - b.at).map(({ phrase, ids }) => ({ phrase, ids })),
        rest: (found.length ? words.filter((word) => !PLACE_WORDS.includes(word)) : words).join(" "),
      };
      lastExtract = { text, result };
      return result;
    },

    // For searches: whether a record at `id`, whose own words are `text` (lowercase), fits every
    // place the search named. It has to be at that place, or say the word itself, because some
    // aliases are things too ("uniform").
    fits(places, id, text) {
      return places.every(({ phrase, ids }) => ids.includes(id) || text.includes(phrase));
    },

    // The place a report or item is about, for the matcher: its location, or when that's
    // "Other / Not sure", the first place its own words name ("left it near the CEAT building"
    // → Maria Salome Llanera Hall). Words about the location count before the description.
    placeOf(record) {
      if (byId.get(record.locationId)?.campus) return record.locationId;
      const named = [[record.locationOther, record.locationDetails], [record.description]]
        .map((texts) => this.extract(texts.join(" ")).places[0])
        .find(Boolean);
      return named ? named.ids[0] : OTHER;
    },

    // The location rule of the rule-based matcher, as a share of its location points: 1 for the
    // same place, 0.5 for another place on the same campus, 0 for another campus or "Other / Not
    // sure". Takes two location ids, e.g. score(placeOf(lostReport), placeOf(foundItem)).
    score(a, b) {
      const first = byId.get(a);
      const second = byId.get(b);
      if (!first?.campus || !second?.campus) return 0;
      if (first.id === second.id) return 1;
      return first.campus === second.campus ? 0.5 : 0;
    },
  };
})();
