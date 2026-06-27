/**
 * @file MapUtils.js
 * @module utils/MapUtils
 * @description
 *   Lookup-index helpers that replace VLOOKUP/INDEX-MATCH with O(1) Map/object
 *   dictionaries. Building an index once and reusing it is the core technique
 *   for keeping joins fast at 100k+ rows.
 *
 * @phase 1 (Architecture) — implemented in Phase 5/6
 */

var MapUtils = (function () {
  'use strict';

  /**
   * Build a single-value lookup index (VLOOKUP-style) keyed by a field.
   * @param {!Array<!Object>} rows
   * @param {function(!Object):string} keyFn
   * @return {!Object<string, !Object>} Last-wins map of key -> row.
   * @todo Implement in Phase 5.
   */
  function indexBy(rows, keyFn) { /* TODO(Phase 5) */ return {}; }

  /**
   * INDEX/MATCH replacement: resolve a value from a prebuilt index.
   * @param {!Object<string, !Object>} index
   * @param {string} key
   * @param {string} field
   * @return {*} The field value or null.
   * @todo Implement in Phase 5.
   */
  function lookup(index, key, field) { /* TODO(Phase 5) */ return null; }

  return Object.freeze({ indexBy: indexBy, lookup: lookup });
})();
