/**
 * @file SettingsRepository.js
 * @module repositories/SettingsRepository
 * @description
 *   Reads the SETTINGS sheet into a raw key/value map. Layout convention:
 *     - Column A: setting key   (e.g. PAGE_SIZE or Performance.PAGE_SIZE)
 *     - Column B: setting value (string/number/boolean as typed in the cell)
 *   A header row (key/value labels) is auto-detected and skipped. Extra columns
 *   (type, description, ...) are ignored. Raw values are returned untouched —
 *   type coercion happens in the Settings layer against the known defaults.
 *
 * @phase 2 (Configuration) — implemented
 */

var SettingsRepository = (function () {
  'use strict';

  /** Header-row first-cell labels to skip (case-insensitive). */
  var HEADER_LABELS = {
    KEY: true, KALIT: true, PARAMETR: true, PARAMETER: true,
    NAME: true, NOM: true, SETTING: true, SOZLAMA: true, SOZLAMALAR: true
  };

  function repo() { return BaseRepository.create(Config.Sheets.SETTINGS); }

  /**
   * @param {*} cell First-column cell value.
   * @return {boolean} True when the row looks like a header row.
   */
  function isHeaderKey(cell) {
    return HEADER_LABELS[String(cell == null ? '' : cell).trim().toUpperCase()] === true;
  }

  /**
   * Reads SETTINGS into a plain { key: rawValue } object. Blank keys and an
   * optional header row are skipped. Later rows win on duplicate keys.
   * @return {!Object<string, *>}
   */
  function readMap() {
    var rows = repo().readAll();
    var map = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row || row.length === 0) { continue; }
      var key = String(row[0] == null ? '' : row[0]).trim();
      if (key === '') { continue; }
      if (i === 0 && isHeaderKey(key)) { continue; }   // skip header row
      map[key] = row.length > 1 ? row[1] : '';
    }
    return map;
  }

  return Object.freeze({ repo: repo, readMap: readMap });
})();
