/**
 * @file EmployeeRepository.js
 * @module repositories/EmployeeRepository
 * @description
 *   Access to EMPLOYEES and LOGIN sheets (user accounts + credentials).
 *   Exposes credential lookup for AuthService and the employee directory used
 *   to resolve engineer/district/region relationships for permissions.
 *
 *   SECURITY: password hashes/salts never leave this layer in raw form for
 *   non-auth callers.
 *
 * @phase 1 (Architecture) — implemented in Phase 3
 */

var EmployeeRepository = (function () {
  'use strict';

  function loginRepo() { return BaseRepository.create(Config.Sheets.LOGIN); }
  function employeesRepo() { return BaseRepository.create(Config.Sheets.EMPLOYEES); }

  /**
   * Finds a login record by username.
   * @param {string} username
   * @return {?Object} Login record (incl. hash/salt/role/region/district) or null.
   * @todo Implement in Phase 3.
   */
  function findLoginByUsername(username) { /* TODO(Phase 3) */ return null; }

  /**
   * Persists last-login / failed-attempt bookkeeping for an account.
   * @param {string} username
   * @param {!Object} patch
   * @return {void}
   * @todo Implement in Phase 3.
   */
  function updateLoginMeta(username, patch) { /* TODO(Phase 3) */ }

  return Object.freeze({
    loginRepo: loginRepo,
    employeesRepo: employeesRepo,
    findLoginByUsername: findLoginByUsername,
    updateLoginMeta: updateLoginMeta
  });
})();
