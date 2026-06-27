/**
 * @file Logger.js
 * @module utils/Logger
 * @description
 *   Structured logging facade. Wraps console/Stackdriver for runtime tracing
 *   and exposes a channel-based API that the LogService (Phase 6) persists to
 *   the appropriate log sheets (LOGIN_LOG, IMPORT_LOG, ACTION_LOG, ...).
 *
 *   Two concerns are intentionally separated:
 *     - Logger (this file)  : in-memory/console diagnostics, level filtering.
 *     - LogService (later)  : durable, queryable audit trail in Sheets.
 *
 * @phase 1 (Architecture) — sheet persistence wired in Phase 6
 */

var Logger = (function () {
  'use strict';

  /** @enum {number} */
  var Level = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };

  function emit(level, msg, ctx) {
    // TODO(Phase 6): honor configured minimum level + forward ERROR to LogService.
    var payload = { ts: new Date().toISOString(), level: level, msg: msg, ctx: ctx || null };
    if (typeof console !== 'undefined' && console.log) {
      console.log(JSON.stringify(payload));
    }
  }

  return Object.freeze({
    Level: Level,
    debug: function (m, c) { emit('DEBUG', m, c); },
    info: function (m, c) { emit('INFO', m, c); },
    warn: function (m, c) { emit('WARN', m, c); },
    error: function (m, c) { emit('ERROR', m, c); }
  });
})();
