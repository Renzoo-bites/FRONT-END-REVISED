// Browser tests for the FindIt frontend: `npm test` (see "Run the tests" in README.md).
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    // Pages are opened straight from the findit folder, like opening the files in Chrome.
    baseURL: `${pathToFileURL(path.join(__dirname, "findit")).href}/`,
    // The Chrome already installed on this computer, so no browser download is needed.
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
  },
});
