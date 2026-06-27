/**
 * @file Result.js
 * @module core/Result
 * @description
 *   Lightweight Result/Either type for predictable, exception-free control flow
 *   between layers (repositories -> services -> controllers -> web). Services
 *   return Result objects; the web boundary converts them to JSON envelopes.
 *
 *   Usage:
 *     return Result.ok(payload);
 *     return Result.fail(AppError.validation('Bad input'));
 *
 * @phase 1 (Architecture)
 */

var Result = (function () {
  'use strict';

  /**
   * @param {*} value Payload for a successful result.
   * @return {{ok: true, success: true, value: *, error: null}}
   */
  function ok(value) {
    return Object.freeze({ ok: true, success: true, value: value === undefined ? null : value, error: null });
  }

  /**
   * @param {(AppError|Error|string)} error Failure cause.
   * @return {{ok: false, success: false, value: null, error: !Object}}
   */
  function fail(error) {
    var err = error;
    if (typeof error === 'string') {
      err = AppError.internal(error);
    } else if (!(error && error.code)) {
      err = AppError.internal((error && error.message) || 'Unknown error', { cause: String(error) });
    }
    return Object.freeze({ ok: false, success: false, value: null, error: err });
  }

  /**
   * Converts a Result into a client-safe JSON envelope for the web layer.
   * @param {!Object} result A Result produced by ok()/fail().
   * @return {{success: boolean, data: *, error: ?Object}}
   */
  function toEnvelope(result) {
    if (result && result.ok) {
      return { success: true, data: result.value, error: null };
    }
    var e = (result && result.error && result.error.toClient)
      ? result.error.toClient()
      : { code: 'INTERNAL', message: 'Internal error.' };
    return { success: false, data: null, error: e };
  }

  return Object.freeze({ ok: ok, fail: fail, toEnvelope: toEnvelope });
})();
