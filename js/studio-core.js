/**
 * js/studio-core.js
 * Shared foundation for the COSY studios (magazine, events, lesson, manuals).
 *
 * The same file is vendored into each studio repo. It holds only what every
 * studio needs and must not contain anything specific to one of them:
 *   - roles: who may draft, review and publish
 *   - verified sign-in: a role is trusted only when the server confirmed it
 *   - draft store: crash-safe local drafts (browser storage may be unavailable)
 *   - readiness: one result shape for "can this be published?" checks
 *
 * The real gate for publishing is always the database (row-level security).
 * Everything here only drives what the interface offers.
 */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.CosyStudioCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- Roles -------------------------------------------------------------

  /** Lowest to highest. A role is only ever raised by the server, never by the browser. */
  const ROLE_ORDER = ['student', 'contributor', 'teacher', 'editor', 'founder'];

  /** Roles that count as the founder: they can publish live. */
  const FOUNDER_ROLES = ['founder', 'admin', 'owner'];

  function normalizeRole(role) {
    return typeof role === 'string' ? role.trim().toLowerCase() : '';
  }

  function isFounderRole(role) {
    return FOUNDER_ROLES.indexOf(normalizeRole(role)) !== -1;
  }

  /** True when `role` is at least `minimum` (founder aliases rank as founder). */
  function roleAtLeast(role, minimum) {
    const r = isFounderRole(role) ? 'founder' : normalizeRole(role);
    const min = isFounderRole(minimum) ? 'founder' : normalizeRole(minimum);
    const ri = ROLE_ORDER.indexOf(r);
    const mi = ROLE_ORDER.indexOf(min);
    return ri !== -1 && mi !== -1 && ri >= mi;
  }

  // ---- Verified sign-in --------------------------------------------------

  /**
   * Resolve the signed-in user from the server only.
   * Returns { id, email, role, isFounder } or null. A role kept in the
   * browser (localStorage) is never consulted: anyone can write to it, so it
   * must not decide what the interface offers.
   *
   * @param {object} client A Supabase client (auth.getSession + from().select()).
   */
  async function resolveVerifiedUser(client) {
    if (!client || !client.auth || typeof client.auth.getSession !== 'function') return null;
    try {
      const res = await client.auth.getSession();
      const session = res && res.data && res.data.session;
      if (res && res.error) return null;
      if (!session || !session.user) return null;

      let role = 'student';
      try {
        const profile = await client
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile && profile.data && profile.data.role) {
          role = normalizeRole(profile.data.role) || 'student';
        }
      } catch (e) {
        // Role lookup failed: stay at the lowest role rather than guess upwards.
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        role: role,
        isFounder: isFounderRole(role)
      };
    } catch (e) {
      return null;
    }
  }

  // ---- Draft store -------------------------------------------------------

  /**
   * Local drafts under one prefix. Every storage call is guarded because
   * browser storage can be disabled, full, or absent (private windows, tests).
   *
   * @param {object} options { prefix: string, storage?: Storage-like }
   */
  function createDraftStore(options) {
    const opts = options || {};
    const prefix = opts.prefix || 'cosy-studio:';
    const storage = opts.storage !== undefined
      ? opts.storage
      : (typeof window !== 'undefined' ? window.localStorage : null);

    function key(id) { return prefix + id; }

    function save(id, value) {
      if (!storage || !id) return false;
      try {
        storage.setItem(key(id), JSON.stringify({ savedAt: new Date().toISOString(), value: value }));
        return true;
      } catch (e) {
        return false;
      }
    }

    function load(id) {
      if (!storage || !id) return null;
      try {
        const raw = storage.getItem(key(id));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (e) {
        return null;
      }
    }

    function remove(id) {
      if (!storage || !id) return false;
      try { storage.removeItem(key(id)); return true; } catch (e) { return false; }
    }

    /** All saved drafts as [{ id, savedAt, value }], newest first. */
    function list() {
      if (!storage) return [];
      const out = [];
      try {
        const n = typeof storage.length === 'number' ? storage.length : 0;
        for (let i = 0; i < n; i++) {
          const k = storage.key(i);
          if (k && k.indexOf(prefix) === 0) {
            const id = k.slice(prefix.length);
            const entry = load(id);
            if (entry) out.push({ id: id, savedAt: entry.savedAt || '', value: entry.value });
          }
        }
      } catch (e) { /* ignore */ }
      return out.sort(function (a, b) { return a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : 0; });
    }

    return { save: save, load: load, remove: remove, list: list };
  }

  // ---- Readiness ---------------------------------------------------------

  /**
   * One shape for every studio's pre-publish checks.
   * A check is { id, level: 'ok'|'warn'|'error', label, detail }.
   */
  function makeCheck(id, level, label, detail) {
    return { id: id, level: level, label: label, detail: detail || '' };
  }

  function summarizeChecks(checks) {
    const list = Array.isArray(checks) ? checks : [];
    const errors = list.filter(function (c) { return c.level === 'error'; }).length;
    const warnings = list.filter(function (c) { return c.level === 'warn'; }).length;
    return {
      errors: errors,
      warnings: warnings,
      canPublish: errors === 0 && list.length > 0
    };
  }

  return {
    ROLE_ORDER: ROLE_ORDER,
    FOUNDER_ROLES: FOUNDER_ROLES,
    normalizeRole: normalizeRole,
    isFounderRole: isFounderRole,
    roleAtLeast: roleAtLeast,
    resolveVerifiedUser: resolveVerifiedUser,
    createDraftStore: createDraftStore,
    makeCheck: makeCheck,
    summarizeChecks: summarizeChecks
  };
});
