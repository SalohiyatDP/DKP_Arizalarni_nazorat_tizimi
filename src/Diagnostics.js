/**
 * @file Diagnostics.js
 * @module Diagnostics
 * @description
 *   Post-install verification entrypoints. After uploading the project to the
 *   bound Apps Script (clasp push or manual), open the script editor, select
 *   `healthCheck` in the function dropdown and press Run. Then inspect the
 *   Execution log: it reports the bound spreadsheet name, which configured
 *   sheets exist/are missing, and the effective Settings.
 *
 *   This is the single "is it installed correctly?" check for Phases 1–2.
 *
 * @phase 2 (Configuration)
 */

/**
 * Global entrypoint runnable from the Apps Script editor.
 * @return {!Object} Health report (also written to the Execution log).
 */
function healthCheck() {
  return Diagnostics.run();
}

/**
 * Global entrypoint returning build/app metadata.
 * @return {!Object} App.META.
 */
function getAppInfo() {
  return App.META;
}

var Diagnostics = (function () {
  'use strict';

  /**
   * Verifies the runtime against the bound spreadsheet.
   * @return {!Object} { ok, app, spreadsheet, sheets, missing, settings }.
   */
  function run() {
    var report = {
      ok: true,
      app: App.META,
      spreadsheet: null,
      sheets: {},
      missing: [],
      settings: null
    };

    var ss;
    try {
      ss = BaseRepository.spreadsheet();
      report.spreadsheet = ss.getName();
    } catch (e) {
      report.ok = false;
      report.error = String(e);
      Logger.error('healthCheck: bound spreadsheet unavailable', { error: String(e) });
      return report;
    }

    Object.keys(Config.Sheets).forEach(function (key) {
      var name = Config.Sheets[key];
      var exists = false;
      try { exists = !!ss.getSheetByName(name); } catch (e2) { exists = false; }
      report.sheets[name] = exists;
      if (!exists) { report.missing.push(name); }
    });
    if (report.missing.length > 0) { report.ok = false; }

    try {
      report.settings = Settings.all();
    } catch (e3) {
      report.settingsError = String(e3);
    }

    Logger.info('healthCheck report', report);
    return report;
  }

  return Object.freeze({ run: run });
})();
