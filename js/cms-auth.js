/**
 * js/cms-auth.js
 * Supabase Founder Authentication Module for COSYmagazine Studio.
 * Synchronized with COSYlanguages login standard and COSYplatform role guards.
 */

(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else {
    root.CosyCMSAuth = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_SUPABASE_URL = 'https://iajkejcmoykubthlwfra.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamtlamNtb3lrdWJ0aGx3ZnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjYwOTUsImV4cCI6MjA5NjQwMjA5NX0.mGY94U3Ei9eLoFbWPIcUfdGRCfjQ2OBYixQ1eyZai-U';

  const LOGIN_URL = 'https://cosylanguages.github.io/COSYlanguages/login.html';

  let client = null;
  const stateListeners = [];

  function getCredentials() {
    if (typeof window === 'undefined') {
      return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
    }
    const url =
      window.COSY_SUPABASE_URL ||
      window.ENV_SUPABASE_URL ||
      (window.COSY_CONFIG && window.COSY_CONFIG.SUPABASE_URL) ||
      DEFAULT_SUPABASE_URL;

    const key =
      window.COSY_SUPABASE_ANON_KEY ||
      window.ENV_SUPABASE_ANON_KEY ||
      (window.COSY_CONFIG && window.COSY_CONFIG.SUPABASE_ANON_KEY) ||
      DEFAULT_SUPABASE_ANON_KEY;

    return { url, key };
  }

  function getClient() {
    if (client) return client;
    const { url, key } = getCredentials();

    const supabaseLib =
      typeof window !== 'undefined'
        ? window.supabase
        : typeof global !== 'undefined'
        ? global.supabase
        : null;

    if (supabaseLib && typeof supabaseLib.createClient === 'function') {
      try {
        client = supabaseLib.createClient(url, key, {
          auth: {
            storageKey: 'cosy-auth',
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (e) {
        console.error('[CosyCMSAuth] Error initializing Supabase client:', e);
      }
    }
    return client;
  }

  function isFounderRole(role) {
    if (!role || typeof role !== 'string') return false;
    const r = role.trim().toLowerCase();
    return r === 'founder' || r === 'admin' || r === 'owner';
  }

  function getLocalUser() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const rawUser = window.localStorage.getItem('cosy_user');
      const role = window.localStorage.getItem('cosy_user_role');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (role && !parsed.role) parsed.role = role;
        return parsed;
      }
      if (role) {
        return { role: role };
      }
    } catch (e) {
      // Storage access error or parse error
    }
    return null;
  }

  async function checkAuth() {
    // 1. Try active Supabase session
    const sb = getClient();
    if (sb && sb.auth) {
      try {
        const { data: { session }, error } = await sb.auth.getSession();
        if (!error && session && session.user) {
          // Fetch role from profiles
          let role = 'student';
          try {
            const { data: profile } = await sb
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile && profile.role) {
              role = profile.role;
            }
          } catch (profileErr) {
            console.warn('[CosyCMSAuth] Could not fetch role from profiles:', profileErr);
          }

          const userObj = {
            id: session.user.id,
            email: session.user.email,
            role: role,
            isFounder: isFounderRole(role)
          };

          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('cosy_user', JSON.stringify(userObj));
            window.localStorage.setItem('cosy_user_role', role);
          }

          notifyListeners(userObj);
          return userObj;
        }
      } catch (err) {
        console.warn('[CosyCMSAuth] Supabase session check error:', err);
      }
    }

    // No browser-stored fallback: a role kept in localStorage can be written by anyone,
    // so only a verified Supabase session may identify a user.
    notifyListeners(null);
    return null;
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb || !sb.auth) {
      throw new Error('Supabase client is not loaded or initialized.');
    }

    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      throw error;
    }

    let role = 'student';
    if (data && data.user) {
      try {
        const { data: profile } = await sb
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile && profile.role) {
          role = profile.role;
        }
      } catch (e) {
        console.warn('[CosyCMSAuth] Error retrieving profile role:', e);
      }
    }

    const userObj = {
      id: data.user.id,
      email: data.user.email,
      role: role,
      isFounder: isFounderRole(role)
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('cosy_user', JSON.stringify(userObj));
      window.localStorage.setItem('cosy_user_role', role);
    }

    notifyListeners(userObj);
    return userObj;
  }

  async function signOut() {
    const sb = getClient();
    if (sb && sb.auth) {
      try {
        await sb.auth.signOut();
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('cosy_user');
        window.localStorage.removeItem('cosy_user_role');
        window.localStorage.removeItem('cosy-auth');
      } catch (e) {}
    }

    notifyListeners(null);
  }

  function onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      stateListeners.push(callback);
    }
    return () => {
      const idx = stateListeners.indexOf(callback);
      if (idx !== -1) stateListeners.splice(idx, 1);
    };
  }

  function notifyListeners(user) {
    stateListeners.forEach((fn) => {
      try {
        fn(user);
      } catch (e) {
        console.error('[CosyCMSAuth] Listener error:', e);
      }
    });
  }

  function getRedirectLoginUrl() {
    if (typeof window === 'undefined') return LOGIN_URL;
    return `${LOGIN_URL}?redirect=${encodeURIComponent(window.location.href)}`;
  }

  async function getUserSubscriptionStatus() {
    const user = await checkAuth();
    if (!user) return { isSubscribed: false, tier: 'free', issues: [] };
    if (user.isFounder) return { isSubscribed: true, tier: 'founder', issues: ['all'] };

    const sb = getClient();
    if (!sb) return { isSubscribed: false, tier: 'free', issues: [] };

    try {
      const { data: sub } = await sb
        .from('subscriptions')
        .select('tier, status, valid_until')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const { data: purchases } = await sb
        .from('issue_purchases')
        .select('issue_id')
        .eq('user_id', user.id);

      const purchasedIssues = (purchases || []).map(p => p.issue_id);

      const isActive = !!(sub && (!sub.valid_until || new Date(sub.valid_until) > new Date()));

      return {
        isSubscribed: isActive,
        tier: isActive ? sub.tier : 'free',
        issues: purchasedIssues
      };
    } catch (err) {
      console.warn('[CosyCMSAuth] Error checking subscription status:', err);
      return { isSubscribed: false, tier: 'free', issues: [] };
    }
  }

  async function hasPaidAccess(issueId) {
    const user = await checkAuth();
    if (!user) return false;
    if (user.isFounder) return true;

    const sub = await getUserSubscriptionStatus();
    if (sub.isSubscribed) return true;
    if (issueId && sub.issues.includes(issueId)) return true;
    return false;
  }

  return {
    getClient,
    isFounderRole,
    getLocalUser,
    checkAuth,
    signIn,
    signOut,
    onAuthStateChanged,
    getRedirectLoginUrl,
    getUserSubscriptionStatus,
    hasPaidAccess
  };
});
