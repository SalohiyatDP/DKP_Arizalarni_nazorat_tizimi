/**
 * @file HolidayRepository.js
 * @module repositories/HolidayRepository
 * @description
 *   Access to the HOLIDAYS sheet (admin-editable non-working dates). Feeds the
 *   BusinessCalendarService. Results are cached (CacheKeys.HOLIDAYS) because
 *   they change rarely but are read on every deadline calculation.
 *
 * @phase 1 (Architecture) — implemented in Phase 5
 */

var HolidayRepository = (function () {
  'use strict';

  function repo() { return BaseRepository.create(Config.Sheets.HOLIDAYS); }

  /**
   * Returns the set of holiday dates (normalized to midnight).
   * @return {!Array<!Date>}
   * @todo Implement in Phase 5 (with cache).
   */
  function findAll() { /* TODO(Phase 5) */ return []; }

  return Object.freeze({ repo: repo, findAll: findAll });
})();
