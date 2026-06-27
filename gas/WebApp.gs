/**
 * @file WebApp.js
 * @module web/WebApp
 * @description
 *   The HTTP boundary of the web app and the SINGLE server-side dispatcher for
 *   client calls (google.script.run -> api()). Responsibilities:
 *     - doGet(): serve the SPA shell (HtmlService) with XFrame + viewport.
 *     - include(): server-side HTML partial inclusion for views.
 *     - api(): one typed entrypoint that routes {controller, action, req} to
 *       the matching controller, wrapping everything in a try/catch that emits
 *       client-safe error envelopes (never leaks stack/internal detail).
 *
 *   SECURITY: every routed action (except login) requires a valid session
 *   token + CSRF token in `req`; controllers re-validate permissions server-side.
 *
 * @phase 1 (Architecture) — routing table populated as controllers land
 */

/**
 * Serves the single-page app shell.
 * @param {!Object} e Apps Script event parameter.
 * @return {!HtmlOutput}
 */
function doGet(e) {
  return WebApp.serve(e);
}

/**
 * Server-side include for HTML partials: <?!= include('views/partial') ?>.
 * @param {string} path File name (without extension) of an HTML partial.
 * @return {string} Evaluated HTML content.
 */
function include(path) {
  return WebApp.include(path);
}

/**
 * Unified client API entrypoint, called from the browser via google.script.run.
 * @param {!Object} request { controller, action, req, token, csrf }.
 * @return {!Object} Client-safe envelope { success, data, error }.
 */
function api(request) {
  return WebApp.dispatch(request);
}

var WebApp = (function () {
  'use strict';

  /**
   * Routing table: controller -> action -> handler. Extended each phase as the
   * corresponding controllers are implemented.
   * @return {!Object<string, !Object<string, function(!Object):!Object>>}
   */
  function routes() {
    return {
      auth: {
        login: function (req) { return AuthController.login(req); },
        logout: function (req) { return AuthController.logout(req); }
      },
      dashboard: {
        get: function (req) { return DashboardController.getDashboard(req); },
        query: function (req) { return DashboardController.queryRecords(req); }
      },
      import: {
        run: function (req) { return ImportController.runImport(req); }
      },
      export: {
        run: function (req) { return ExportController.exportData(req); }
      }
    };
  }

  /** Actions reachable without an authenticated session. */
  var PUBLIC_ACTIONS = { 'auth.login': true };

  /**
   * @param {!Object} e
   * @return {!HtmlOutput}
   * @todo Finalize meta/title/theme bootstrap in Phase 8.
   */
  function serve(e) {
    var t = HtmlService.createTemplateFromFile('Index');
    return t.evaluate()
      .setTitle(App.META.NAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  /**
   * @param {string} path
   * @return {string}
   */
  function include(path) {
    return HtmlService.createHtmlOutputFromFile(path).getContent();
  }

  /**
   * Routes a client request to its controller action with centralized error
   * handling and (later) auth/CSRF enforcement.
   * @param {!Object} request { controller, action, req }.
   * @return {!Object} Envelope.
   */
  function dispatch(request) {
    try {
      var req = (request && request.req) || {};
      var ctrl = request && request.controller;
      var act = request && request.action;
      var table = routes();
      if (!ctrl || !act || !table[ctrl] || !table[ctrl][act]) {
        return Result.toEnvelope(Result.fail(AppError.notFound('Unknown API action.')));
      }
      // TODO(Phase 3): if (!PUBLIC_ACTIONS[ctrl + '.' + act]) enforce session token + CSRF here.
      return table[ctrl][act](req);
    } catch (err) {
      // Never leak internals to the client.
      if (typeof Logger !== 'undefined') { Logger.error('api dispatch failed', { error: String(err) }); }
      var e = (err && err.code) ? err : AppError.internal('Unexpected server error.');
      return Result.toEnvelope(Result.fail(e));
    }
  }

  return Object.freeze({ serve: serve, include: include, dispatch: dispatch });
})();
