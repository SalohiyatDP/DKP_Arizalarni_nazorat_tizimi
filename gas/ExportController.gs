/**
 * @file ExportController.js
 * @module controllers/ExportController
 * @description
 *   API boundary for exports. Authenticates, applies permission scope to the
 *   requested filters (so exports can never exceed the caller's data scope),
 *   then delegates to ExportService (sync or background queue).
 *
 * @phase 1 (Architecture) — implemented in Phase 9
 */

var ExportController = (function () {
  'use strict';

  /**
   * @param {!Object} req { token, filters, format }.
   * @return {!Object} Envelope with file url/blob or job id.
   * @todo Implement in Phase 9.
   */
  function exportData(req) { /* TODO(Phase 9) */ return Result.toEnvelope(Result.fail(AppError.internal('Not implemented'))); }

  return Object.freeze({ exportData: exportData });
})();
