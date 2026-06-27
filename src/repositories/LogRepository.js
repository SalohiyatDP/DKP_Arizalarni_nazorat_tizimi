/**
 * @file LogRepository.js
 * @module repositories/LogRepository
 * @description
 *   Append-only writer for the audit/log sheets (LOGIN_LOG, IMPORT_LOG,
 *   ACTION_LOG, ...). Resolves a LogChannel to its physical sheet via
 *   Config.LogSheets and appends in batched writes.
 *
 * @phase 1 (Architecture) — implemented in Phase 6
 */

var LogRepository = (function () {
  'use strict';

  /**
   * Appends one log entry to the channel's sheet.
   * @param {string} channel One of Constants.LogChannel.
   * @param {!Array<*>} row Pre-ordered cell values.
   * @return {void}
   * @todo Implement in Phase 6.
   */
  function append(channel, row) { /* TODO(Phase 6): BaseRepository.create(Config.LogSheets[channel]).appendRows([row]) */ }

  return Object.freeze({ append: append });
})();
