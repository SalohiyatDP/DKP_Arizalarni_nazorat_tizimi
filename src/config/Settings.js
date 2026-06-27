/**
 * @file Settings.js
 * @module config/Settings
 * @description
 *   The RUNTIME configuration accessor. Config holds immutable defaults +
 *   static registries; Settings produces the EFFECTIVE tunable values by
 *   merging admin-editable overrides from the SETTINGS sheet over those
 *   defaults.
 *
 *   Access rule for the whole codebase:
 *     - Static / registry values (sheet names, cache keys, enums) -> Config / Constants.
 *     - Tunable runtime values (page size, TTLs, lockout, feature flags) -> Settings.
 *
 *   Performance: raw overrides are cached (CacheRepository) so the SETTINGS
 *   sheet is read at most once per cache window; the merged result is memoized
 *   per execution. Defaults are always merged fresh, so changing a default in
 *   code never requires a cache bust. Call Settings.refresh() after an admin
 *   edits the SETTINGS sheet.
 *
 * @phase 2 (Configuration) — implemented
 */

var Settings = (function () {
  'use strict';

  /** Namespaces (in Config) that expose overridable tunables. */
  var NAMESPACES = ['Performance', 'Security', 'Features'];

  /** @type {?Object<string, *>} Per-execution memo of raw overrides. */
  var _overrides = null;
  /** @type {?Object} Per-execution memo of the merged effective settings. */
  var _effective = null;

  /**
   * @param {*} raw
   * @return {boolean}
   */
  function toBool(raw) {
    if (typeof raw === 'boolean') { return raw; }
    return /^(true|1|yes|ha|on|ha'a)$/i.test(String(raw == null ? '' : raw).trim());
  }

  /**
   * Coerces a raw override value to match the type of the default it overrides.
   * @param {*} raw
   * @param {*} defaultValue
   * @return {*} Coerced value, or the default when the raw value is unusable.
   */
  function coerceTo(raw, defaultValue) {
    if (typeof defaultValue === 'number') {
      var n = Number(raw);
      return isFinite(n) ? n : defaultValue;
    }
    if (typeof defaultValue === 'boolean') { return toBool(raw); }
    return String(raw == null ? '' : raw);
  }

  /**
   * Auto-coerces a value with no known default (custom setting).
   * @param {*} raw
   * @return {*}
   */
  function coerceAuto(raw) {
    if (typeof raw !== 'string') { return raw; }
    var s = raw.trim();
    if (/^(true|false)$/i.test(s)) { return /^true$/i.test(s); }
    if (s !== '' && isFinite(Number(s))) { return Number(s); }
    return s;
  }

  /**
   * Finds which Config namespace owns a given key. Supports both bare keys
   * ("PAGE_SIZE") and namespaced keys ("Performance.PAGE_SIZE").
   * @param {string} key
   * @return {?{ns: string, name: string}}
   */
  function resolveKey(key) {
    var dot = key.indexOf('.');
    if (dot !== -1) {
      var ns = key.substring(0, dot);
      var name = key.substring(dot + 1);
      if (Config[ns] && Object.prototype.hasOwnProperty.call(Config[ns], name)) {
        return { ns: ns, name: name };
      }
      return null;
    }
    for (var i = 0; i < NAMESPACES.length; i++) {
      var space = NAMESPACES[i];
      if (Config[space] && Object.prototype.hasOwnProperty.call(Config[space], key)) {
        return { ns: space, name: key };
      }
    }
    return null;
  }

  /**
   * Loads raw overrides (memoized per execution; cached across executions).
   * Failures to read SETTINGS degrade gracefully to "no overrides".
   * @return {!Object<string, *>}
   */
  function loadOverrides() {
    if (_overrides) { return _overrides; }
    var cached = null;
    try { cached = CacheRepository.get(Config.CacheKeys.SETTINGS); } catch (e) { cached = null; }
    if (cached && typeof cached === 'object') {
      _overrides = cached;
      return _overrides;
    }
    try {
      _overrides = SettingsRepository.readMap();
    } catch (e) {
      Logger.error('Failed to read SETTINGS sheet; using defaults.', { error: String(e) });
      _overrides = {};
    }
    try { CacheRepository.put(Config.CacheKeys.SETTINGS, _overrides); } catch (e) { /* non-fatal */ }
    return _overrides;
  }

  /**
   * Builds the effective settings: a fresh copy of the Config defaults with
   * recognized overrides applied; unknown keys land under `custom`.
   * @return {!Object} { Performance, Security, Features, custom }.
   */
  function effective() {
    if (_effective) { return _effective; }

    var result = { custom: {} };
    NAMESPACES.forEach(function (ns) {
      result[ns] = {};
      var src = Config[ns] || {};
      Object.keys(src).forEach(function (k) { result[ns][k] = src[k]; });
    });

    var overrides = loadOverrides();
    Object.keys(overrides).forEach(function (key) {
      var loc = resolveKey(key);
      if (loc) {
        result[loc.ns][loc.name] = coerceTo(overrides[key], Config[loc.ns][loc.name]);
      } else {
        result.custom[key] = coerceAuto(overrides[key]);
      }
    });

    _effective = result;
    return _effective;
  }

  /** @return {!Object} Effective performance tunables. */
  function performance() { return effective().Performance; }
  /** @return {!Object} Effective security tunables. */
  function security() { return effective().Security; }
  /** @return {!Object} Effective feature flags. */
  function features() { return effective().Features; }

  /**
   * Reads a single effective value by path, e.g. "Performance.PAGE_SIZE" or
   * "custom.MY_KEY".
   * @param {string} path
   * @param {*=} fallback Returned when the path is absent.
   * @return {*}
   */
  function get(path, fallback) {
    var parts = String(path).split('.');
    var node = effective();
    for (var i = 0; i < parts.length; i++) {
      if (node && Object.prototype.hasOwnProperty.call(node, parts[i])) {
        node = node[parts[i]];
      } else {
        return fallback === undefined ? null : fallback;
      }
    }
    return node;
  }

  /** @return {!Object} The full effective settings tree. */
  function all() { return effective(); }

  /**
   * Discards memoized + cached overrides so the next read reloads from SETTINGS.
   * Call after an administrator edits the SETTINGS sheet.
   * @return {void}
   */
  function refresh() {
    _overrides = null;
    _effective = null;
    try { CacheRepository.remove(Config.CacheKeys.SETTINGS); } catch (e) { /* non-fatal */ }
  }

  return Object.freeze({
    performance: performance,
    security: security,
    features: features,
    get: get,
    all: all,
    refresh: refresh
  });
})();
