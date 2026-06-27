/**
 * @file Constants.js
 * @module config/Constants
 * @description
 *   System-wide immutable enumerations: roles, application/payment statuses,
 *   object types, log channels, cache namespaces, etc. These are the canonical
 *   values used by business logic, permissions and the UI. Never hardcode these
 *   strings elsewhere — always reference Constants.*.
 *
 *   NOTE (Phase 1): Status/label values below are an architectural baseline.
 *   They will be reconciled with the real HISOBOT data dictionary in Phase 2
 *   (Configuration) once the actual report columns/labels are confirmed.
 *
 * @phase 1 (Architecture) — values finalized in Phase 2
 */

var Constants = (function () {
  'use strict';

  /**
   * User roles. Permission scope widens from ENGINEER -> ADMIN.
   * @enum {string}
   */
  var Roles = {
    ADMIN: 'ADMIN',        // Full access to all regions/districts/engineers.
    REGION: 'REGION',      // Own region only; drill down to districts/engineers.
    DISTRICT: 'DISTRICT',  // Own district only; drill down to engineers.
    ENGINEER: 'ENGINEER'   // Own applications only.
  };

  /** Account status. @enum {string} */
  var AccountStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    LOCKED: 'LOCKED'
  };

  /** Application processing status (derived in Phase 5 business logic). @enum {string} */
  var ApplicationStatus = {
    IN_PROGRESS: 'IN_PROGRESS',
    DUE_TODAY: 'DUE_TODAY',
    EXPIRED: 'EXPIRED',
    COMPLETED: 'COMPLETED'
  };

  /** Object/property classification. @enum {string} */
  var ObjectType = {
    RESIDENTIAL: 'RESIDENTIAL',
    NON_RESIDENTIAL: 'NON_RESIDENTIAL'
  };

  /** Payment status (derived in Phase 7 finance logic). @enum {string} */
  var PaymentStatus = {
    PAID: 'PAID',
    WAITING_PAYMENT: 'WAITING_PAYMENT'
  };

  /** Logging channels -> mapped to dedicated sheets in Config. @enum {string} */
  var LogChannel = {
    LOGIN: 'LOGIN',
    IMPORT: 'IMPORT',
    ACTION: 'ACTION',
    EXPORT: 'EXPORT',
    ERROR: 'ERROR',
    PERFORMANCE: 'PERFORMANCE'
  };

  /** Export formats supported by the export engine (Phase 9). @enum {string} */
  var ExportFormat = {
    EXCEL: 'EXCEL',
    PDF: 'PDF',
    CSV: 'CSV',
    PRINT: 'PRINT'
  };

  /** UI theme modes. @enum {string} */
  var Theme = {
    LIGHT: 'LIGHT',
    DARK: 'DARK'
  };

  return App.deepFreeze({
    Roles: Roles,
    AccountStatus: AccountStatus,
    ApplicationStatus: ApplicationStatus,
    ObjectType: ObjectType,
    PaymentStatus: PaymentStatus,
    LogChannel: LogChannel,
    ExportFormat: ExportFormat,
    Theme: Theme
  });
})();
