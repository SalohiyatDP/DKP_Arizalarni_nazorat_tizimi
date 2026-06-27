/**
 * @file Namespace.js
 * @module core/Namespace
 * @description
 *   Root namespace and module conventions for the DKP Arizalar Nazorati system.
 *
 *   Google Apps Script loads every `.js`/`.gs` file into a SINGLE shared global
 *   scope. To keep the codebase modular and collision-free we adopt the
 *   "frozen IIFE module" pattern:
 *
 *     var SomeModule = (function () {
 *       'use strict';
 *       // private state ...
 *       function publicFn() {}
 *       return Object.freeze({ publicFn: publicFn });
 *     })();
 *
 *   Rules that make load order irrelevant (critical in GAS):
 *     1. A module MUST NOT call another module at definition (top-level) time.
 *        Cross-module references happen only INSIDE functions, which run after
 *        every file has been evaluated.
 *     2. Every public module surface is frozen (immutable) via Object.freeze.
 *     3. Configuration is the single source of truth; modules never hardcode
 *        sheet names, columns, roles or statuses.
 *
 * @phase 1 (Architecture)
 */

/** Global application metadata. Guarded so any load order is safe. */
var App = (typeof App !== 'undefined' && App) ? App : {};

App.META = Object.freeze({
  NAME: 'DKP Arizalar Nazorati',
  VERSION: '0.2.0',
  PHASE: 2,
  DESCRIPTION: 'Enterprise application monitoring system on Google Apps Script.'
});

/**
 * Recursively freezes an object graph so configuration/constants are immutable.
 * @param {!Object} obj Object to deep-freeze.
 * @return {!Object} The same object, deeply frozen.
 */
App.deepFreeze = function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.keys(obj).forEach(function (key) {
      App.deepFreeze(obj[key]);
    });
    Object.freeze(obj);
  }
  return obj;
};
