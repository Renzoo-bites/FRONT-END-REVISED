# FindIt: DLSU-D Digital Lost and Found

A lost and found system for SWAFO (Student Welfare and Formation Office). It's plain HTML, CSS and JavaScript, with no framework and no build step.

## Run it

Open the `findit` folder with a static server, such as the Live Server extension in VS Code, and go to `user/index.html`. Opening the files directly also works in Chrome or Edge.

## Test accounts

On the login page, pick the matching side of the **User / Admin** switch.

| Side | Email | Password |
|---|---|---|
| User (student) | `student@example.com` | `student123` |
| Admin (SWAFO) | `swafo@dlsud.edu.ph` | `admin123` |

## What's where

- **User (student) site:** `findit/user/` (Home, Browse, Report, Messages, …), with its own `css/` and `js/`
- **SWAFO admin:** `findit/admin/` (log in as admin), with its own `css/` and `js/`
- **Shared by both:** `findit/js/` (login, the demo data stores, chat, and the official campus location list in `js/data/locations.js`), `findit/css/` (base and chat styles) and `findit/assets/`
- **Backend notes:** [`findit/BACKEND-HANDOFF.md`](findit/BACKEND-HANDOFF.md) lists what's sample data, the API each page expects, and what isn't built yet.

## Demo data

There's no backend yet. Everything is sample data stored in the browser and shared between tabs of the same browser, so a student and SWAFO can message each other in two tabs.

Add `?reset-demo` to any page's address to start over, or use **Settings → Reset demo data** in the admin.

## Run the tests

The `tests` folder has browser tests for every page, written with [Playwright](https://playwright.dev). They need [Node.js](https://nodejs.org) and Google Chrome.

```sh
npm install
npm test
```

Each test starts from the sample data, with the clock set to Oct 21, 2026, 10:00 AM and no internet (so the charts show their fallback text). `npx playwright test tests/admin/claims.spec.js` runs one file.
