/**
 * scripts/build/lib/i18n.js
 * Interface-string lookup for the build.
 *
 * `tStrict` deliberately has no fallback: a missing key is a build error, not a
 * silent English leak onto a translated page.
 */

const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', '..', '..', 'js', 'i18n');

const translationsCache = {};

function getTranslationsForLang(lang) {
  if (!translationsCache[lang]) {
    const i18nPath = path.join(I18N_DIR, `${lang}.json`);
    if (fs.existsSync(i18nPath)) {
      translationsCache[lang] = JSON.parse(fs.readFileSync(i18nPath, 'utf-8'));
    } else {
      translationsCache[lang] = JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'en.json'), 'utf-8'));
    }
  }
  return translationsCache[lang];
}

function tStrict(dict, key, lang) {
  if (!key) throw new Error('[i18n] Key is required.');
  const parts = key.split('.');
  let val = dict;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      throw new Error(`[i18n] Missing translation key "${key}" for language "${lang}". Core principle: No translation fallback.`);
    }
  }
  if (typeof val !== 'string' || !val) {
    throw new Error(`[i18n] Missing or empty translation string for key "${key}" in language "${lang}".`);
  }
  return val;
}

module.exports = { getTranslationsForLang, tStrict };
