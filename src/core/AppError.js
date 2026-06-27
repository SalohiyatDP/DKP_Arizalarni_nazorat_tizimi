/**
 * @file AppError.js
 * @module core/AppError
 * @description
 *   Typed, structured application error. Every layer throws/returns AppError
 *   instances instead of raw strings so that:
 *     - errors carry a stable machine-readable `code`,
 *     - sensitive details can be separated from user-facing messages,
 *     - the web layer can map errors to HTTP-like responses safely.
 *
 *   User-facing `message` MUST be safe to display. Put internal diagnostics in
 *   `details` (never leaked to non-admin clients).
 *
 * @phase 1 (Architecture)
 */

var AppError = (function () {
  'use strict';

  /**
   * Canonical error codes used across the system.
   * @enum {string}
   */
  var Codes = Object.freeze({
    VALIDATION: 'VALIDATION',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    IMPORT_FAILED: 'IMPORT_FAILED',
    DATA_INTEGRITY: 'DATA_INTEGRITY',
    RATE_LIMITED: 'RATE_LIMITED',
    INTERNAL: 'INTERNAL'
  });

  /**
   * @param {string} code One of AppError.Codes.
   * @param {string} message User-safe message.
   * @param {Object=} details Internal diagnostic context (not for end users).
   * @constructor
   * @extends {Error}
   */
  function AppErrorCtor(code, message, details) {
    this.name = 'AppError';
    this.code = code || Codes.INTERNAL;
    this.message = message || 'Unexpected error.';
    this.details = details || null;
    this.timestamp = new Date();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppErrorCtor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
  AppErrorCtor.prototype = Object.create(Error.prototype);
  AppErrorCtor.prototype.constructor = AppErrorCtor;

  /**
   * @return {{code: string, message: string}} Client-safe representation.
   */
  AppErrorCtor.prototype.toClient = function () {
    return { code: this.code, message: this.message };
  };

  // Convenience factories.
  AppErrorCtor.validation = function (m, d) { return new AppErrorCtor(Codes.VALIDATION, m, d); };
  AppErrorCtor.unauthorized = function (m, d) { return new AppErrorCtor(Codes.UNAUTHORIZED, m || 'Authentication required.', d); };
  AppErrorCtor.forbidden = function (m, d) { return new AppErrorCtor(Codes.FORBIDDEN, m || 'Access denied.', d); };
  AppErrorCtor.notFound = function (m, d) { return new AppErrorCtor(Codes.NOT_FOUND, m || 'Not found.', d); };
  AppErrorCtor.internal = function (m, d) { return new AppErrorCtor(Codes.INTERNAL, m || 'Internal error.', d); };
  AppErrorCtor.Codes = Codes;

  return AppErrorCtor;
})();
