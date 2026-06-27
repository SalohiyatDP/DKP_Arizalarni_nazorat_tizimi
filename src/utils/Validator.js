/**
 * @file Validator.js
 * @module utils/Validator
 * @description
 *   Declarative request/payload validation used at the controller boundary.
 *   Produces AppError(VALIDATION) on failure so the web layer returns a clean,
 *   client-safe error envelope. Never trust client input — validate here.
 *
 * @phase 1 (Architecture) — rule set expanded in Phases 3/4
 */

var Validator = (function () {
  'use strict';

  /** @param {*} v @return {boolean} */
  function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

  /** @param {*} v @return {boolean} */
  function isFiniteNumber(v) { return typeof v === 'number' && isFinite(v); }

  /**
   * Asserts a condition or throws a VALIDATION AppError.
   * @param {boolean} condition
   * @param {string} message Client-safe message.
   * @param {Object=} details
   * @return {void}
   */
  function require(condition, message, details) {
    if (!condition) { throw AppError.validation(message, details); }
  }

  /**
   * Validates a payload against a field->rule spec.
   * @param {!Object} payload
   * @param {!Object<string, function(*):boolean>} spec
   * @return {{valid: boolean, errors: !Array<string>}}
   * @todo Expand in Phases 3/4 (auth + import payloads).
   */
  function validate(payload, spec) {
    /* TODO(Phase 3/4): iterate spec, collect failing fields. */
    return { valid: true, errors: [] };
  }

  return Object.freeze({
    isNonEmptyString: isNonEmptyString,
    isFiniteNumber: isFiniteNumber,
    require: require,
    validate: validate
  });
})();
