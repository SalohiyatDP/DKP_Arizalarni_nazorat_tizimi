/**
 * @file Sanitizer.js
 * @module utils/Sanitizer
 * @description
 *   Input sanitization and output escaping. Security boundary helper: ALL
 *   client-supplied values pass through here before use, and all dynamic text
 *   rendered to HTML is escaped to prevent injection/XSS.
 *
 * @phase 1 (Architecture) — escapeHtml implemented now (security anchor)
 */

var Sanitizer = (function () {
  'use strict';

  var HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };

  /**
   * Escapes a string for safe insertion into HTML text/attribute context.
   * @param {*} value
   * @return {string}
   */
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"'/]/g, function (c) { return HTML_MAP[c]; });
  }

  /**
   * Coerces/limits a free-text field (trim + max length) for safe storage.
   * @param {*} value
   * @param {number=} maxLen Default 500.
   * @return {string}
   */
  function text(value, maxLen) {
    var s = String(value == null ? '' : value).trim();
    var max = maxLen || 500;
    return s.length > max ? s.substring(0, max) : s;
  }

  /**
   * Whitelist a value against an allowed set (e.g. enum membership).
   * @param {*} value
   * @param {!Array<*>} allowed
   * @param {*=} fallback
   * @return {*} value if allowed, else fallback (default null).
   */
  function oneOf(value, allowed, fallback) {
    return allowed.indexOf(value) !== -1 ? value : (fallback === undefined ? null : fallback);
  }

  return Object.freeze({ escapeHtml: escapeHtml, text: text, oneOf: oneOf });
})();
