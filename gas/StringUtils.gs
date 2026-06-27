/**
 * @file StringUtils.js
 * @module utils/StringUtils
 * @description
 *   String helpers that replace spreadsheet text functions (LEFT/RIGHT/MID/
 *   TEXT/TRIM) with explicit, testable JS. Used heavily by the import
 *   transform step (e.g. deriving codes from cadastre numbers).
 *
 * @phase 1 (Architecture) — implemented in Phase 4/5
 */

var StringUtils = (function () {
  'use strict';

  /** LEFT(text, n). @param {*} v @param {number} n @return {string} */
  function left(v, n) { return String(v == null ? '' : v).substring(0, Math.max(0, n)); }

  /** RIGHT(text, n). @param {*} v @param {number} n @return {string} */
  function right(v, n) { var s = String(v == null ? '' : v); return s.substring(Math.max(0, s.length - n)); }

  /** MID(text, start1Based, len). @param {*} v @param {number} start @param {number} len @return {string} */
  function mid(v, start, len) { var s = String(v == null ? '' : v); return s.substring(start - 1, start - 1 + len); }

  /** Trim + collapse internal whitespace. @param {*} v @return {string} */
  function normalize(v) { return String(v == null ? '' : v).trim().replace(/\s+/g, ' '); }

  /** Null/blank check. @param {*} v @return {boolean} */
  function isBlank(v) { return v == null || String(v).trim() === ''; }

  return Object.freeze({ left: left, right: right, mid: mid, normalize: normalize, isBlank: isBlank });
})();
