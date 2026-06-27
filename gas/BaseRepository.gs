/**
 * @file BaseRepository.js
 * @module repositories/BaseRepository
 * @description
 *   The data-access foundation. ALL sheet I/O flows through repositories — no
 *   service/controller may call SpreadsheetApp directly. This is where the
 *   performance contract lives:
 *
 *     - Open the spreadsheet ONCE per execution and cache the handle.
 *     - Resolve each Sheet ONCE per repository instance and cache it.
 *     - Read with a SINGLE getValues() (or chunked ranges for huge sheets).
 *     - Write with batched setValues() chunks.
 *     - Never call getRange/getValue inside a loop.
 *
 *   BaseRepository.create(sheetName) returns a repository instance bound to one
 *   sheet. Domain repositories (HisobotRepository, EmployeeRepository, ...)
 *   compose this and add typed mapping on top.
 *
 * @phase 2 (Configuration) — read/write/chunk implemented
 */

var BaseRepository = (function () {
  'use strict';

  /** Lazily-resolved bound spreadsheet handle (one per execution). */
  var _ss = null;

  /**
   * @return {!Spreadsheet} The active bound spreadsheet (opened once per execution).
   */
  function spreadsheet() {
    if (!_ss) {
      _ss = SpreadsheetApp.getActiveSpreadsheet();
      if (!_ss) {
        throw AppError.internal('No bound spreadsheet is available for this script.');
      }
    }
    return _ss;
  }

  /**
   * Writes a 2D matrix to a sheet starting at startRow, in batched chunks to
   * respect Apps Script limits. All rows are assumed to have equal length.
   * @param {!Sheet} sh
   * @param {!Array<!Array<*>>} matrix
   * @param {number} startRow 1-based row to begin writing at.
   * @return {void}
   */
  function writeMatrix(sh, matrix, startRow) {
    if (!matrix || matrix.length === 0) { return; }
    var cols = matrix[0].length;
    var batch = Config.Performance.WRITE_BATCH_ROWS;
    for (var offset = 0; offset < matrix.length; offset += batch) {
      var chunk = matrix.slice(offset, offset + batch);
      sh.getRange(startRow + offset, 1, chunk.length, cols).setValues(chunk);
    }
  }

  /**
   * Creates a repository bound to a single sheet.
   * @param {string} sheetName One of Config.Sheets.*.
   * @return {!Object} Repository instance.
   */
  function create(sheetName) {
    /** @type {?Sheet} Cached sheet handle (resolved once). */
    var _sheet = null;

    /**
     * @return {!Sheet} The bound sheet (resolved once).
     * @throws {AppError} NOT_FOUND when the sheet does not exist.
     */
    function sheet() {
      if (!_sheet) {
        _sheet = spreadsheet().getSheetByName(sheetName);
        if (!_sheet) {
          throw AppError.notFound('Sheet not found: ' + sheetName, { sheet: sheetName });
        }
      }
      return _sheet;
    }

    /**
     * @return {number} Number of populated columns (0 when sheet is empty).
     */
    function columnCount() {
      return sheet().getLastColumn();
    }

    /**
     * @return {number} Number of populated rows including header (0 when empty).
     */
    function rowCount() {
      return sheet().getLastRow();
    }

    /**
     * Reads the entire populated range in one call (header + data rows).
     * @return {!Array<!Array<*>>} Empty array when the sheet has no data.
     */
    function readAll() {
      var sh = sheet();
      var rows = sh.getLastRow();
      var cols = sh.getLastColumn();
      if (rows < 1 || cols < 1) { return []; }
      return sh.getRange(1, 1, rows, cols).getValues();
    }

    /**
     * Reads only the header (first) row.
     * @return {!Array<*>} Empty array when the sheet is empty.
     */
    function readHeader() {
      var sh = sheet();
      var cols = sh.getLastColumn();
      if (sh.getLastRow() < 1 || cols < 1) { return []; }
      return sh.getRange(1, 1, 1, cols).getValues()[0];
    }

    /**
     * Streams data rows (excluding the header) to a callback in chunks, so very
     * large sheets (100k+ rows) never materialize fully in memory at once.
     * @param {function(!Array<!Array<*>>, number):void} onChunk Receives
     *   (chunkRows, startDataRow) where startDataRow is 1-based among data rows.
     * @param {number=} chunkSize Defaults to Config.Performance.READ_CHUNK_ROWS.
     * @return {void}
     */
    function readChunked(onChunk, chunkSize) {
      var sh = sheet();
      var lastRow = sh.getLastRow();
      var cols = sh.getLastColumn();
      if (lastRow < 2 || cols < 1) { return; }            // header only / empty
      var size = chunkSize && chunkSize > 0 ? chunkSize : Config.Performance.READ_CHUNK_ROWS;
      var dataRows = lastRow - 1;                          // exclude header
      for (var read = 0; read < dataRows; read += size) {
        var count = Math.min(size, dataRows - read);
        var values = sh.getRange(2 + read, 1, count, cols).getValues();
        onChunk(values, read + 1);
      }
    }

    /**
     * Overwrites all sheet content with the given matrix (header + rows) in a
     * single clear + batched writes. Formatting on the sheet is preserved.
     * @param {!Array<!Array<*>>} matrix Including the header row.
     * @return {void}
     */
    function writeAll(matrix) {
      var sh = sheet();
      sh.clearContents();
      writeMatrix(sh, matrix, 1);
    }

    /**
     * Appends rows after the last populated row in batched writes.
     * @param {!Array<!Array<*>>} rows
     * @return {void}
     */
    function appendRows(rows) {
      if (!rows || rows.length === 0) { return; }
      var sh = sheet();
      writeMatrix(sh, rows, sh.getLastRow() + 1);
    }

    /**
     * Clears all data rows while preserving the header row, in one operation.
     * @return {void}
     */
    function clearData() {
      var sh = sheet();
      var lastRow = sh.getLastRow();
      var cols = sh.getLastColumn();
      if (lastRow > 1 && cols > 0) {
        sh.getRange(2, 1, lastRow - 1, cols).clearContent();
      }
    }

    return Object.freeze({
      sheetName: sheetName,
      sheet: sheet,
      columnCount: columnCount,
      rowCount: rowCount,
      readAll: readAll,
      readHeader: readHeader,
      readChunked: readChunked,
      writeAll: writeAll,
      appendRows: appendRows,
      clearData: clearData
    });
  }

  /**
   * Resets the cached spreadsheet handle. Primarily for tests / long-running
   * triggers that must re-resolve the active spreadsheet.
   * @return {void}
   */
  function reset() { _ss = null; }

  return Object.freeze({ create: create, spreadsheet: spreadsheet, reset: reset });
})();
