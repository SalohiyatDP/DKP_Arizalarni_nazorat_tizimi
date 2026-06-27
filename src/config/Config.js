/**
 * @file Config.js
 * @module config/Config
 * @description
 *   Single source of truth for environment configuration: the registry of
 *   EXISTING spreadsheet sheets, cache/properties namespaces, performance
 *   tuning knobs and feature flags. No module may hardcode a sheet name —
 *   everything resolves through Config.Sheets.*.
 *
 *   IMPORTANT: The sheets listed already exist in the bound spreadsheet and
 *   MUST NOT be recreated by the system.
 *
 *   Tunable runtime values (batch sizes, cache TTLs, lockout thresholds) will
 *   be loaded/overridable from the SETTINGS sheet in Phase 2 via
 *   Config.loadOverrides(). The constants here are safe defaults.
 *
 * @phase 1 (Architecture) — overrides wired in Phase 2
 */

var Config = (function () {
  'use strict';

  /** Names of the pre-existing sheets in the bound spreadsheet. @enum {string} */
  var Sheets = {
    DASHBOARD: 'DASHBOARD',
    HISOBOT: 'HISOBOT',           // Primary daily-imported data source (~18k -> 100k+ rows).
    DATA: 'DATA',
    STATISTICS: 'STATISTICS',
    FINANCE: 'FINANCE',
    LOGIN: 'LOGIN',
    EMPLOYEES: 'EMPLOYEES',
    SETTINGS: 'SETTINGS',
    HOLIDAYS: 'HOLIDAYS',
    SERVICE_RULES: 'SERVICE_RULES',
    AREA_RULES: 'AREA_RULES',
    EXPORT: 'EXPORT',
    BACKUP: 'BACKUP',
    IMPORT_LOG: 'IMPORT_LOG',
    LOGIN_LOG: 'LOGIN_LOG',
    ACTION_LOG: 'ACTION_LOG',
    MONTHLY_STATS: 'MONTHLY_STATS',
    CACHE: 'CACHE'
  };

  /** Maps logical log channels to their physical sheets. */
  var LogSheets = {
    LOGIN: Sheets.LOGIN_LOG,
    IMPORT: Sheets.IMPORT_LOG,
    ACTION: Sheets.ACTION_LOG,
    EXPORT: Sheets.ACTION_LOG,     // dedicated EXPORT_LOG can be added later
    ERROR: Sheets.ACTION_LOG,
    PERFORMANCE: Sheets.ACTION_LOG
  };

  /** Cache / PropertiesService key namespaces (avoid collisions). */
  var CacheKeys = {
    PREFIX: 'dkp:',
    DASHBOARD: 'dkp:dashboard:',
    STATS: 'dkp:stats:',
    FINANCE: 'dkp:finance:',
    HOLIDAYS: 'dkp:holidays',
    SESSION: 'dkp:session:'
  };

  /** Performance / processing defaults (tunable via SETTINGS in Phase 2). */
  var Performance = {
    READ_CHUNK_ROWS: 5000,        // chunked getValues window
    WRITE_BATCH_ROWS: 2000,       // chunked setValues window
    CACHE_TTL_SECONDS: 21600,     // 6h CacheService max
    PAGE_SIZE: 50,                // server-side pagination default
    SEARCH_DEBOUNCE_MS: 300
  };

  /** Security defaults (tunable via SETTINGS in Phase 2). */
  var Security = {
    SESSION_TTL_MINUTES: 60,
    MAX_FAILED_LOGINS: 5,
    LOCKOUT_MINUTES: 15,
    PASSWORD_MIN_LENGTH: 8
  };

  /** Feature flags. */
  var Features = {
    DARK_MODE: true,
    BACKGROUND_EXPORT: true,
    ROLLBACK_ON_IMPORT_FAILURE: true
  };

  /**
   * Phase 2 hook: merge tunables from the SETTINGS sheet over the defaults.
   * @return {void}
   * @todo Implement in Phase 2 (Configuration).
   */
  function loadOverrides() {
    // TODO(Phase 2): read SETTINGS sheet and override Performance/Security/Features.
  }

  return App.deepFreeze({
    Sheets: Sheets,
    LogSheets: LogSheets,
    CacheKeys: CacheKeys,
    Performance: Performance,
    Security: Security,
    Features: Features,
    loadOverrides: loadOverrides
  });
})();
