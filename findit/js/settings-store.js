// Site settings SWAFO edits on admin/settings.html: the office details (shown on the public
// About page and in the student Messages panel) and which notifications the admin bell shows.
//
// Until there's a backend this lives in the browser's localStorage, like the other demo stores.
// Open any page with ?reset-demo to go back to the defaults.

const SettingsStore = (() => {
  const KEY = "findit.settings.v1";

  const DEFAULTS = {
    office: {
      name: "SWAFO Office",
      fullName: "Student Welfare and Formation Office",
      location: "GMH Building",
      email: "swafo_helpdesk@dlsud.edu.ph",
      officeHours: "Monday–Friday, 8:00 AM – 5:00 PM",
      pickupHours: "Mon–Fri, 8AM–5PM",
    },
    // Which notification types the admin bell shows
    notifications: { message: true, claim: true, match: true, report: true },
  };

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }

  return {
    defaults: DEFAULTS,

    // Saved values on top of the defaults, so new settings get a sensible value.
    get() {
      const saved = read();
      return {
        office: { ...DEFAULTS.office, ...saved.office },
        notifications: { ...DEFAULTS.notifications, ...saved.notifications },
      };
    },

    // Throws if storage is blocked or full; the Settings page shows an error.
    save(settings) {
      localStorage.setItem(KEY, JSON.stringify(settings));
    },

    subscribe(callback) {
      window.addEventListener("storage", (event) => {
        if (event.key === KEY || event.key === null) callback();
      });
    },

    reset() {
      try {
        localStorage.removeItem(KEY);
      } catch {
        // nothing saved
      }
    },
  };
})();

if (new URLSearchParams(window.location.search).has("reset-demo")) SettingsStore.reset();
