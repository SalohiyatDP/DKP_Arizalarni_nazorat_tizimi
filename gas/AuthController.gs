/**
 * @file AuthController.js
 * @module controllers/AuthController
 * @description
 *   API boundary for authentication. Validates/sanitizes input, delegates to
 *   AuthService, and returns client-safe envelopes (Result.toEnvelope). Holds
 *   no business logic itself.
 *
 * @phase 1 (Architecture) — implemented in Phase 3
 */

var AuthController = (function () {
  'use strict';

  /**
   * @param {!Object} req { username, password }.
   * @return {!Object} Envelope { success, data, error }.
   * @todo Implement in Phase 3.
   */
  function login(req) { /* TODO(Phase 3): validate -> AuthService.login -> toEnvelope */ return Result.toEnvelope(Result.fail(AppError.internal('Not implemented'))); }

  /**
   * @param {!Object} req { token }.
   * @return {!Object} Envelope.
   * @todo Implement in Phase 3.
   */
  function logout(req) { /* TODO(Phase 3) */ return Result.toEnvelope(Result.ok(true)); }

  return Object.freeze({ login: login, logout: logout });
})();
