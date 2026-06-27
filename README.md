# DKP Arizalar Nazorati

Enterprise application-monitoring system built on **Google Apps Script** (V8) with a
**Google Sheets** database and an **HTML5 / Material Design** web-app frontend.

> The administrator uploads a daily report with one click; the system then
> recalculates statistics, finance, deadlines, dashboards, permissions, caches
> and logs automatically — and stays fast and secure at 100k+ rows.

This repository is being delivered **in phases**. The current state is
**Phase 1 — Project Architecture**: the full layered skeleton, conventions and
core primitives are in place; business logic is implemented in later phases.

---

## Architecture at a glance

A strict, one-directional layered (MVC-ish) architecture. Dependencies only ever
point **downward** — an inner layer never imports an outer one.

```
            Browser (HTML5 / Material Design SPA)
                       │  google.script.run -> api()
        ┌──────────────▼───────────────┐
        │  web/        WebApp router    │  doGet · include · dispatch (+ auth/CSRF)
        ├──────────────┬───────────────┤
        │ controllers/ │ validate · authorize · envelope   (no business logic)
        ├──────────────┼───────────────┤
        │ services/    │ business logic, orchestration      (the "brains")
        ├──────────────┼───────────────┤
        │ repositories/│ ALL sheet I/O (single get/setValues, chunking, cache)
        ├──────────────┼───────────────┤
        │ utils/       │ pure helpers (dates, strings, hashing, validation)
        ├──────────────┼───────────────┤
        │ config/      │ Config · Constants · Schema  (single source of truth)
        ├──────────────┴───────────────┤
        │ core/        Namespace · AppError · Result        (primitives)
        └───────────────────────────────┘
                       │
            Google Sheets (existing DB) + CacheService / PropertiesService
```

### Layer responsibilities

| Layer | Folder | Responsibility |
|------|--------|----------------|
| Core | `src/core` | Module convention, typed `AppError`, `Result` envelope. |
| Config | `src/config` | Sheet registry, enums, HISOBOT column schema. No hardcoded names elsewhere. |
| Utils | `src/utils` | Pure, reusable helpers (no sheet access). |
| Repositories | `src/repositories` | The **only** place that touches `SpreadsheetApp` / Cache. |
| Services | `src/services` | Business logic, calculations, orchestration. |
| Controllers | `src/controllers` | API boundary: validate, authorize, delegate, return envelope. |
| Web | `src/web` | `doGet`/`api` routing, HTML serving, central error handling. |
| Views | `src/views` | Material Design SPA (built in Phase 8). |

---

## Module conventions

Google Apps Script loads every file into one shared global scope, so we use the
**frozen IIFE module** pattern:

```js
var SomeModule = (function () {
  'use strict';
  function publicFn() { /* ... */ }
  return Object.freeze({ publicFn: publicFn });
})();
```

Rules that keep this safe and maintainable:

1. **No cross-module calls at load time.** Modules reference each other only
   inside functions, so file load order never matters.
2. **Config is the single source of truth.** No sheet name, column, role or
   status string is hardcoded outside `src/config`.
3. **Repositories own all I/O.** Services/controllers never call `SpreadsheetApp`.
4. **Errors are typed.** Functions return `Result.ok/fail(AppError)`; the web
   layer converts them to client-safe envelopes and never leaks internals.
5. **Security is server-side.** Permissions/sessions are validated on the
   server for every action; frontend hints are never trusted.
6. **Every function has JSDoc** and is annotated with the phase that implements it.

---

## Performance contract (for 100k+ rows)

- One `getValues()` to read, one (chunked) `setValues()` to write — never per-cell.
- Build `Map`/object indexes once; replace `VLOOKUP`/`INDEX-MATCH` with O(1) lookups.
- Aggregations are **single-pass** (`COUNTIFS`/`SUMIFS` → one loop) and
  **pre-computed**, then cached. The dashboard reads snapshots, not raw data.
- Server-side filtering, pagination, debounced search; chunked import processing.
- No business calculations in spreadsheet formulas — all in JavaScript.

---

## Daily import pipeline (Phase 4)

```
Backup → Read → Validate → Transform → Business Logic → Statistics →
Finance → Cache → Dashboard refresh → Logs → Done   (rollback on failure)
```

---

## Existing database (do NOT recreate)

`DASHBOARD, HISOBOT, DATA, STATISTICS, FINANCE, LOGIN, EMPLOYEES, SETTINGS,
HOLIDAYS, SERVICE_RULES, AREA_RULES, EXPORT, BACKUP, IMPORT_LOG, LOGIN_LOG,
ACTION_LOG, MONTHLY_STATS, CACHE` — registered in `src/config/Config.js`.
`HISOBOT` is the primary daily-imported data source (~18k → 100k+ rows, ~73 cols).

---

## Project layout

```
src/
├── appsscript.json            # manifest (V8, Asia/Tashkent, webapp + scopes)
├── core/                      # Namespace · AppError · Result
├── config/                    # Config · Constants · Schema
├── utils/                     # Logger · Date/String/Array/Map · Sanitizer · Validator · Hash
├── repositories/              # Base · Hisobot · Employee · Holiday · Log · Cache
├── services/                  # Calendar · Auth · Permission · Import · BusinessLogic
│                              #   · Statistics · Finance · Dashboard · Export · Log
├── controllers/               # Auth · Dashboard · Import · Export
├── web/                       # WebApp (doGet/api router)
└── views/                     # Index.html (SPA shell)
```

---

## Development roadmap

| Phase | Scope | Status |
|------:|-------|--------|
| 1 | Project Architecture | ✅ this delivery |
| 2 | Configuration (SETTINGS overrides, sheet handles) | ⏳ |
| 3 | Authentication & Permissions | ⏳ |
| 4 | Import Engine | ⏳ |
| 5 | Business Logic & Working-day Calendar | ⏳ |
| 6 | Statistics & Logging | ⏳ |
| 7 | Finance | ⏳ |
| 8 | Dashboard (Material Design UI) | ⏳ |
| 9 | Export (Excel/PDF/CSV/Print, queue) | ⏳ |
| 10 | Optimization (cache, pagination, chunking) | ⏳ |
| 11 | Testing | ⏳ |

Each phase is delivered and reviewed before the next begins.

---

## Local setup (clasp)

The source is structured for [`clasp`](https://github.com/google/clasp).

1. `npm i -g @google/clasp && clasp login`
2. Copy `.clasp.json.example` to `.clasp.json` and paste your script id
   (the project bound to the existing spreadsheet). `rootDir` is `src`.
3. `clasp push` to upload. `.clasp.json` is git-ignored (never committed).
