/**
 * @file Schema.js
 * @module config/Schema
 * @description
 *   Column schema / header map for the HISOBOT sheet (~73 columns) and other
 *   structured sheets. The import engine and business logic address columns by
 *   LOGICAL NAME (e.g. Schema.HISOBOT.CADASTRE_NUMBER) rather than by index,
 *   so a shifted/renamed report column is a one-line fix here.
 *
 *   Design:
 *     - Each entry maps a logical field -> { header, index, type }.
 *     - `index` is 0-based within a row array returned by getValues().
 *     - At import time, Schema.resolve() reconciles the live header row against
 *       this map so the system tolerates harmless column reordering.
 *
 *   STATUS (Phase 1): This is the structural placeholder. The full 73-column
 *   definition is populated in Phase 4 (Import Engine) once a sample HISOBOT
 *   header row is provided. Fields below are illustrative anchors.
 *
 * @phase 1 (Architecture) — fully populated in Phase 4
 */

var Schema = (function () {
  'use strict';

  /** Logical field value types used for parsing/validation. @enum {string} */
  var FieldType = {
    STRING: 'string',
    NUMBER: 'number',
    INTEGER: 'integer',
    DATE: 'date',
    BOOLEAN: 'boolean',
    MONEY: 'money'
  };

  /**
   * HISOBOT logical fields. (Anchors only in Phase 1 — extend to all ~73 cols
   * in Phase 4. Header strings must match the real report exactly.)
   * @type {!Object<string, {header: string, index: number, type: string}>}
   */
  var HISOBOT = {
    ROW_ID:            { header: '__row',           index: -1, type: FieldType.INTEGER },
    REGION:            { header: 'Region',          index: -1, type: FieldType.STRING },
    DISTRICT:          { header: 'District',        index: -1, type: FieldType.STRING },
    ENGINEER:          { header: 'Engineer',        index: -1, type: FieldType.STRING },
    APPLICATION_NO:    { header: 'ApplicationNo',   index: -1, type: FieldType.STRING },
    CADASTRE_NUMBER:   { header: 'CadastreNumber',  index: -1, type: FieldType.STRING },
    TRANSACTION_NO:    { header: 'TransactionNo',   index: -1, type: FieldType.STRING },
    OBJECT_TYPE:       { header: 'ObjectType',      index: -1, type: FieldType.STRING },
    APPLICATION_TYPE:  { header: 'ApplicationType', index: -1, type: FieldType.STRING },
    SUBMITTED_DATE:    { header: 'SubmittedDate',   index: -1, type: FieldType.DATE },
    AMOUNT:            { header: 'Amount',          index: -1, type: FieldType.MONEY },
    PAID:              { header: 'Paid',            index: -1, type: FieldType.BOOLEAN }
    // TODO(Phase 4): add the remaining HISOBOT columns up to ~73 fields.
  };

  /**
   * Reconcile this schema's `index` values against a live header row so that
   * column reordering in the daily report does not break the import.
   * @param {!Array<string>} headerRow First row of the sheet (header labels).
   * @param {!Object} fieldMap A *.HISOBOT-style logical field map.
   * @return {!Object} New field map with resolved 0-based indexes.
   * @todo Implement in Phase 4 (Import Engine).
   */
  function resolve(headerRow, fieldMap) {
    // TODO(Phase 4): build header->index lookup and clone fieldMap with indexes.
    return fieldMap;
  }

  return App.deepFreeze({
    FieldType: FieldType,
    HISOBOT: HISOBOT,
    resolve: resolve
  });
})();
