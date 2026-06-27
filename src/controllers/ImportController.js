/**
 * @file ImportController.js
 * @module controllers/ImportController
 * @description
 *   API boundary for the one-click import. Authenticates, asserts the caller
 *   may IMPORT (admin), validates the upload, then delegates to ImportService.
 *   Returns progress/result envelopes.
 *
 * @phase 1 (Architecture) — implemented in Phase 4
 */

var ImportController = (function () {
  'use strict';

  /**
   * @param {!Object} req { token, file | values, meta }.
   * @return {!Object} Envelope with import result/summary.
   * @todo Implement in Phase 4.
   */
  function runImport(req) { /* TODO(Phase 4): authenticate -> assertCan(IMPORT) -> ImportService.runImport */ return Result.toEnvelope(Result.fail(AppError.internal('Not implemented'))); }

  return Object.freeze({ runImport: runImport });
})();
