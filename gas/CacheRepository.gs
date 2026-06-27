/**
 * @file CacheRepository.js
 * @module repositories/CacheRepository
 * @description
 *   Thin wrapper over CacheService (script cache) with JSON (de)serialization
 *   and the dkp: key namespace. Values larger than a single cache entry's limit
 *   are transparently split across chunk keys and reassembled on read.
 *
 *   Why CacheService: it is the right tool for short-lived, read-heavy data
 *   (settings, pre-computed dashboard/statistics snapshots). TTL is bounded by
 *   the platform maximum (6h). Use PropertiesService (a later concern) only for
 *   durable, rarely-changing state.
 *
 * @phase 2 (Configuration) — implemented
 */

var CacheRepository = (function () {
  'use strict';

  /** CacheService per-entry value cap is ~100KB; stay safely under it. */
  var CHUNK_LIMIT = 90000;
  /** Hard cap on TTL accepted by CacheService (6 hours). */
  var MAX_TTL = 21600;

  /**
   * @return {!Cache} Script-scoped cache.
   */
  function store() { return CacheService.getScriptCache(); }

  /**
   * @param {string} key
   * @return {?*} Parsed value, or null on miss / parse failure.
   */
  function get(key) {
    var cache = store();
    var head = cache.get(key);
    if (head === null || head === undefined) { return null; }
    try {
      var parsed = JSON.parse(head);
      if (parsed && parsed.__chunked === true) {
        var keys = [];
        for (var i = 0; i < parsed.count; i++) { keys.push(key + '::' + i); }
        var parts = cache.getAll(keys);
        var joined = '';
        for (var j = 0; j < parsed.count; j++) {
          var part = parts[key + '::' + j];
          if (part === null || part === undefined) { return null; }   // partial expiry -> miss
          joined += part;
        }
        return JSON.parse(joined);
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {string} key
   * @param {*} value JSON-serializable value.
   * @param {number=} ttlSeconds Defaults to Config.Performance.CACHE_TTL_SECONDS.
   * @return {void}
   */
  function put(key, value, ttlSeconds) {
    var cache = store();
    var ttl = Math.min(MAX_TTL, ttlSeconds && ttlSeconds > 0 ? ttlSeconds : Config.Performance.CACHE_TTL_SECONDS);
    var serialized = JSON.stringify(value === undefined ? null : value);

    if (serialized.length <= CHUNK_LIMIT) {
      cache.put(key, serialized, ttl);
      return;
    }

    // Split oversized payloads into chunk entries + a small head descriptor.
    var entries = {};
    var count = 0;
    for (var pos = 0; pos < serialized.length; pos += CHUNK_LIMIT) {
      entries[key + '::' + count] = serialized.substring(pos, pos + CHUNK_LIMIT);
      count++;
    }
    cache.putAll(entries, ttl);
    cache.put(key, JSON.stringify({ __chunked: true, count: count }), ttl);
  }

  /**
   * Removes a key and any associated chunk entries.
   * @param {string} key
   * @return {void}
   */
  function remove(key) {
    var cache = store();
    var head = cache.get(key);
    if (head) {
      try {
        var parsed = JSON.parse(head);
        if (parsed && parsed.__chunked === true) {
          for (var i = 0; i < parsed.count; i++) { cache.remove(key + '::' + i); }
        }
      } catch (e) { /* ignore: fall through to remove head */ }
    }
    cache.remove(key);
  }

  return Object.freeze({ get: get, put: put, remove: remove });
})();
