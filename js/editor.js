/**
 * js/editor.js
 * Core Controller & Live Gazette Spread Preview Engine for COSYmagazine Studio.
 * Synchronized with SCHEMA.md, scripts/build-blog.js, and Supabase live updates.
 */

(function () {
  'use strict';

  const PrintSpec = typeof window !== 'undefined' && window.CosyPrintSpec
    ? window.CosyPrintSpec
    : (typeof require === 'function' ? (function () { try { return require('./print-spec.js'); } catch (e) { return null; } })() : null);
  const Blocks = typeof window !== 'undefined' && window.CosyEditorBlocks
    ? window.CosyEditorBlocks
    : (typeof require !== 'undefined' ? require('./editor-blocks.js') : {});
  const Auth = typeof window !== 'undefined' && window.CosyCMSAuth
    ? window.CosyCMSAuth
    : (typeof require !== 'undefined' ? require('./cms-auth.js') : {});

  // Supported ISO languages across COSYmagazine
  const LANGUAGES = [
    { code: 'en', name: 'English (en)', flag: '🇬🇧' },
    { code: 'fr', name: 'Français (fr)', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano (it)', flag: '🇮🇹' },
    { code: 'ru', name: 'Русский (ru)', flag: '🇷🇺' },
    { code: 'el', name: 'Ελληνικά (el)', flag: '🇬🇷' },
    { code: 'es', name: 'Español (es)', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch (de)', flag: '🇩🇪' },
    { code: 'pt', name: 'Português (pt)', flag: '🇵🇹' },
    { code: 'hy', name: 'Հայերեն (hy)', flag: '🇦🇲' },
    { code: 'ka', name: 'ქართული (ka)', flag: '🇬🇪' },
    { code: 'tt', name: 'Татарча (tt)', flag: '🌐' },
    { code: 'ba', name: 'Башҡортса (ba)', flag: '🌐' },
    { code: 'br', name: 'Brezhoneg (br)', flag: '🌐' },
    { code: 'cv', name: 'Чӑвашла (cv)', flag: '🌐' }
  ];

  const DESKS = [
    'Saturday Mistakes',
    'Words',
    'Grammar Made Cosy',
    'Grammar',
    'Say It',
    'Front Page',
    'Culture & Quotes',
    'Long Reads',
    'COSYtalks',
    'The Podcast',
    'Cosy Events',
    'Reflections',
    'Back Issues'
  ];

  const LEVELS = [
    'A0–A1',
    'A1',
    'A0–A1 / A2',
    'A1–A2',
    'A2',
    'B1',
    'A2–B1',
    'B1–B2',
    'B2',
    'C1',
    'A0–B2'
  ];

  const FORMATS = [
    'list',
    'essay',
    'ranking',
    'photo-essay',
    'qa',
    'quiz',
    'quote-wall'
  ];

  // Icon id (from the sprite in editor.html) for each block type
  const BLOCK_ICONS = {
    'heading': 'heading',
    'paragraph': 'pilcrow',
    'mistake-card': 'x-circle',
    'example': 'message',
    'pronunciation': 'mic',
    'table': 'table',
    'quiz': 'help',
    'culture-bite': 'bookmark',
    'pullquote': 'quote',
    'quote-wall': 'grid',
    'list-item': 'list',
    'image': 'image',
    'links': 'link'
  };

  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  function icon(name, extraClass) {
    return `<svg class="icon${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  /**
   * What the signed-in user can do. This only drives the interface: the real
   * gate for publishing is the database (row-level security), not this object.
   * Everyone can draft, import and export; founders (founder/admin/owner)
   * can also publish live and upload issue PDFs.
   */
  const STATUSES = ['idea', 'assigned', 'drafting', 'in-review', 'fact-checked', 'approved', 'published'];
  const STATUS_LABELS = {
    idea: 'Idea', assigned: 'Assigned', drafting: 'Drafting', 'in-review': 'In review',
    'fact-checked': 'Fact-checked', approved: 'Approved', published: 'Published'
  };
  const LEDGER_ITEMS = [
    ['quotesVerified', 'Quotes verified against the source'],
    ['claimsAttributed', 'Claims and figures attributed'],
    ['consentOnFile', 'Consent on file (real people named or quoted)'],
    ['imageLicencesRecorded', 'Image licences recorded'],
    ['noProtectedLyrics', 'No protected lyrics or book passages'],
    ['proofread', 'Proofread']
  ];
  const CONTENT_TYPES = [
    ['issue-article', 'Issue article', 'Part of a numbered magazine issue (digital and paper).'],
    ['evergreen', 'Standalone article', 'Not tied to an issue. Lives on the website.'],
    ['podcast-companion', 'Podcast companion', 'Notes and script for a podcast episode.']
  ];

  /** Highest status a user may set. Founders publish; the database still enforces it. */
  function maxStatusFor(user) {
    if (!user) return 'drafting';
    if (user.isFounder) return 'published';
    if (user.role === 'editor') return 'approved';
    if (user.role === 'contributor') return 'in-review';
    return 'drafting';
  }

  function getCapabilities(user) {
    const isFounder = !!(user && user.isFounder);
    return {
      signedIn: !!user,
      isFounder,
      draft: true,
      exportJson: true,
      importJson: true,
      publishLive: isFounder,
      uploadPdf: isFounder,
      maxStatus: maxStatusFor(user),
      editLedger: !!user
    };
  }

  /** Content type of a post, inferred for older posts that do not set one. */
  function contentTypeOf(post) {
    if (post && post.contentType) return post.contentType;
    return post && post.issue ? 'issue-article' : 'evergreen';
  }

  /**
   * Pre-publish review. Mirrors the required fields in
   * scripts/validate-blog-schema.js, plus editorial warnings that the
   * validator does not enforce. Returns [{ id, level: 'ok'|'warn'|'error', label, detail }].
   */
  function getReadiness(post) {
    const checks = [];
    const add = (id, level, label, detail) => checks.push({ id, level, label, detail: detail || '' });
    const filled = (v) => typeof v === 'string' && v.trim() !== '';

    if (!post) {
      add('post', 'error', 'No article is open');
      return checks;
    }

    add('title', filled(post.title) ? 'ok' : 'error', 'Title', filled(post.title) ? '' : 'Add a headline in Details.');
    add('slug',
      filled(post.slug) && SLUG_PATTERN.test(post.slug) ? 'ok' : 'error',
      'Slug',
      filled(post.slug) && SLUG_PATTERN.test(post.slug) ? '' : 'Use lowercase letters, numbers and single hyphens only.');
    add('kicker', filled(post.kicker) ? 'ok' : 'error', 'Kicker', filled(post.kicker) ? '' : 'Required. It appears above the headline.');
    add('dek', filled(post.dek) ? 'ok' : 'error', 'Dek (subheadline)', filled(post.dek) ? '' : 'Required. One or two sentences summarising the article.');

    const dateOk = filled(post.date) && /^\d{4}-\d{2}-\d{2}$/.test(post.date) && !isNaN(Date.parse(post.date));
    add('date', dateOk ? 'ok' : 'error', 'Publication date', dateOk ? '' : 'Pick a valid date.');

    if (contentTypeOf(post) === 'issue-article') {
      const issueOk = !!(post.issue && filled(post.issue.number) && filled(post.issue.title));
      add('issue', issueOk ? 'ok' : 'error', 'Issue number and title', issueOk ? '' : 'Both are required for an issue article. Untick "Part of a magazine" for a standalone piece.');
    }

    const blocks = Array.isArray(post.blocks) ? post.blocks : [];
    add('blocks', blocks.length > 0 ? 'ok' : 'error', 'Content', blocks.length > 0 ? `${blocks.length} block${blocks.length === 1 ? '' : 's'}` : 'Add at least one block.');

    const noAlt = blocks.filter(b => b && b.type === 'image' && !filled(b.alt)).length;
    if (noAlt > 0) {
      add('alt', 'warn', 'Image alt text', `${noAlt} image${noAlt === 1 ? ' is' : 's are'} missing alt text (accessibility).`);
    }

    const badLinks = blocks.filter(b => b && b.type === 'links' && (!filled(b.url) || !filled(b.label))).length;
    if (badLinks > 0) {
      add('links', 'warn', 'Link blocks', `${badLinks} link block${badLinks === 1 ? ' needs' : 's need'} a label and a URL.`);
    }

    if (!Array.isArray(post.tags) || post.tags.length === 0) {
      add('tags', 'warn', 'Tags', 'No tags yet. Tags power the filters on the newsstand.');
    }

    if (blocks.length > 0 && typeof post.readingTime === 'number') {
      const calc = calculateArticleStats(post).minutes;
      if (Math.abs(calc - post.readingTime) >= 3) {
        add('reading', 'warn', 'Reading time', `Set to ${post.readingTime} min, but the text suggests about ${calc} min.`);
      }
    }

    // Editorial desk: fact-check ledger and consent
    const ledger = (post.workflow && post.workflow.ledger) || {};
    if (post.workflow && post.workflow.featuresRealPerson && ledger.consentOnFile !== 'done') {
      add('consent', 'error', 'Consent on file', 'This article names or quotes a real person. Record their consent in Editorial before publishing.');
    }
    const open = LEDGER_ITEMS.filter(([k]) => k !== 'consentOnFile' && (ledger[k] || 'todo') === 'todo');
    if (open.length > 0) {
      add('ledger', 'warn', 'Fact-check ledger', `${open.length} of ${LEDGER_ITEMS.length - 1} checks still open: ${open.map(o => o[1].split(' ')[0].toLowerCase()).join(', ')}.`);
    }

    // Scheduled release
    if (post.publishAt) {
      const today = new Date().toISOString().slice(0, 10);
      if (post.draft !== false) {
        add('schedule', 'warn', 'Publish date', `The publish date ${post.publishAt} only applies once the status is Published.`);
      } else if (post.publishAt > today) {
        add('schedule', 'ok', 'Scheduled release', `Held back until ${post.publishAt}; goes live with the daily release (about 05:15 UTC).`);
      }
    }

    // Paper edition
    if (PrintSpec) {
      const est = PrintSpec.estimateArticlePages(post);
      const raster = est.rasterImages.length;
      if (raster > 0) {
        add('print-images', 'warn', 'Print images', `${raster} raster image${raster === 1 ? '' : 's'} must be at least ${est.rasterImages[0].minPixelsFrameWidth}px wide (300 dpi) to print sharply.`);
      }
    }

    return checks;
  }

  // ---- Editorial desk (status, ledger, content type) ----
  function ensureWorkflow(post) {
    post.workflow = post.workflow || {};
    post.workflow.ledger = post.workflow.ledger || {};
    return post.workflow;
  }

  /** Set the workflow status; `draft` follows it (only "published" is live). */
  function setPostStatus(value, user) {
    if (!currentPost || STATUSES.indexOf(value) === -1) return false;
    const cap = getCapabilities(user === undefined ? currentUser : user).maxStatus;
    if (STATUSES.indexOf(value) > STATUSES.indexOf(cap)) return false;
    currentPost.status = value;
    currentPost.draft = value !== 'published';
    markDirty();
    return true;
  }

  function setLedgerItem(key, value) {
    if (!currentPost || !LEDGER_ITEMS.some(i => i[0] === key) || ['todo', 'done', 'na'].indexOf(value) === -1) return false;
    ensureWorkflow(currentPost).ledger[key] = value;
    markDirty();
    return true;
  }

  function setContentType(value) {
    if (!currentPost || !CONTENT_TYPES.some(t => t[0] === value)) return false;
    currentPost.contentType = value;
    if (value === 'issue-article') {
      if (!currentPost.issue) {
        const src = activeIssue || { number: 'Vol. 2026.08', title: 'Get Ready for School' };
        currentPost.issue = { number: src.number, title: src.title };
      }
    } else if (value === 'evergreen') {
      delete currentPost.issue;
    }
    isMagazinePart = !!currentPost.issue;
    markDirty();
    return true;
  }

  function renderEditorialPanel() {
    if (typeof document === 'undefined' || !currentPost) return;
    const caps = getCapabilities(currentUser);
    const wf = currentPost.workflow || {};
    const ledger = wf.ledger || {};
    const ctSel = $('ed-content-type');
    if (ctSel) {
      ctSel.innerHTML = CONTENT_TYPES.map(([v, l]) => `<option value="${v}">${escapeHtml(l)}</option>`).join('');
      ctSel.value = contentTypeOf(currentPost);
      const hint = $('ed-content-type-hint');
      const found = CONTENT_TYPES.find(t => t[0] === ctSel.value);
      if (hint && found) hint.textContent = found[2];
    }
    const stSel = $('ed-status');
    if (stSel) {
      const maxIdx = STATUSES.indexOf(caps.maxStatus);
      stSel.innerHTML = STATUSES.map((v, i) => `<option value="${v}" ${i > maxIdx ? 'disabled' : ''}>${escapeHtml(STATUS_LABELS[v])}</option>`).join('');
      stSel.value = currentPost.status || (currentPost.draft === false ? 'published' : 'drafting');
      const hint = $('ed-status-hint');
      if (hint) hint.textContent = caps.maxStatus === 'published'
        ? 'Only "Published" makes the article go live. Everything earlier stays a draft.'
        : `With your role you can set a status up to "${STATUS_LABELS[caps.maxStatus]}". A founder publishes.`;
    }
    const owner = $('ed-owner'); if (owner) owner.value = wf.owner || '';
    const notes = $('ed-notes'); if (notes) notes.value = wf.notes || '';
    const real = $('ed-real-person'); if (real) real.checked = !!wf.featuresRealPerson;
    const list = $('ed-ledger');
    if (list) {
      list.innerHTML = LEDGER_ITEMS.map(([k, label]) => `
        <div class="ledger-row">
          <label for="ed-ledger-${k}">${escapeHtml(label)}</label>
          <select class="form-control" id="ed-ledger-${k}" data-ledger="${k}">
            <option value="todo">To do</option><option value="done">Done</option><option value="na">Not applicable</option>
          </select>
        </div>`).join('');
      LEDGER_ITEMS.forEach(([k]) => { const el = $('ed-ledger-' + k); if (el) el.value = ledger[k] || 'todo'; });
      list.querySelectorAll('select[data-ledger]').forEach(el => {
        el.addEventListener('change', () => { setLedgerItem(el.getAttribute('data-ledger'), el.value); });
      });
    }
    const pub = $('ed-publish-at'); if (pub) pub.value = currentPost.publishAt || '';
    const pages = $('ed-print-pages');
    if (pages) pages.value = (currentPost.print && currentPost.print.pages) || '';
    renderPrintSummary();
  }

  function renderPrintSummary() {
    const box = $('ed-print-summary');
    if (!box || !PrintSpec || !currentPost) return;
    const e = PrintSpec.estimateArticlePages(currentPost);
    const rows = [
      ['Words on paper', String(e.words)],
      ['Estimated length', `${e.estimatedPages} page${e.estimatedPages === 1 ? '' : 's'} (${e.exact} exact)`],
      ['Used for planning', `${e.pages} page${e.pages === 1 ? '' : 's'} (${e.source === 'override' ? 'set by hand' : 'estimate'})`],
      ['Paper-only blocks', String(e.printOnlyBlocks)],
      ['Digital-only blocks', String(e.digitalOnlyBlocks)]
    ];
    box.innerHTML = rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('');
  }

  function setupEditorialListeners() {
    if (typeof document === 'undefined') return;
    const on = (id, evt, fn) => { const el = $(id); if (el) el.addEventListener(evt, () => { if (currentPost) fn(el); }); };
    on('ed-content-type', 'change', el => {
      setContentType(el.value);
      populateMetadataForm(currentPost);
      renderEditorialPanel();
      renderLivePreview();
    });
    on('ed-status', 'change', el => {
      if (!setPostStatus(el.value)) { renderEditorialPanel(); return; }
      renderEditorialPanel();
    });
    on('ed-owner', 'input', el => { ensureWorkflow(currentPost).owner = el.value; markDirty(); });
    on('ed-notes', 'input', el => { ensureWorkflow(currentPost).notes = el.value; markDirty(); });
    on('ed-real-person', 'change', el => { ensureWorkflow(currentPost).featuresRealPerson = el.checked; markDirty(); });
    on('ed-publish-at', 'change', el => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(el.value)) currentPost.publishAt = el.value; else delete currentPost.publishAt;
      markDirty();
    });
    on('ed-print-pages', 'input', el => {
      const n = parseInt(el.value, 10);
      if (n > 0) currentPost.print = Object.assign({}, currentPost.print, { pages: n });
      else if (currentPost.print) { delete currentPost.print.pages; if (!Object.keys(currentPost.print).length) delete currentPost.print; }
      markDirty();
      renderPrintSummary();
    });
  }

  // Active Post State
  let currentPost = null;
  let currentUser = null;
  let isDirty = false;
  let constructorMode = 'magazine'; // 'magazine' | 'website'
  let isMagazinePart = true;
  let activeIssue = (Blocks && Blocks.CANONICAL_ISSUES && Blocks.CANONICAL_ISSUES[0])
    ? Blocks.clone(Blocks.CANONICAL_ISSUES[0])
    : null;
  let managedIssues = (Blocks && Blocks.CANONICAL_ISSUES)
    ? Blocks.CANONICAL_ISSUES.map(iss => Blocks.clone(iss))
    : [];
  let catalogPosts = [];
  let deletedBlockBackup = null; // for undo functionality
  let collapsedBlockIndices = new Set();

  /**
   * Initialize Studio App
   */
  async function init() {
    populateStaticSelects();
    initIssuesList();
    initCanonicalSectionsUI();
    setupModals();
    setupMenus();
    setupTabs();
    setupEditorialListeners();
    setupPreviewMedium();
    setupThemeToggle();
    setupViewSwitch();
    setupAuthListeners();
    setupEventListeners();
    setupConstructorModeListeners();
    setupIssueManagerListeners();
    setupPublishFlow();
    setupIssuePlanner();
    setupKeyboardShortcuts();
    setupUnloadWarning();
    updateAuthUI(null);

    const params = new URLSearchParams(window.location.search);
    const postSlug = params.get('slug');
    showTab(postSlug ? 'content' : (readSavedTab() || 'start'));

    await loadCatalogPosts();

    // Check user auth
    if (Auth) {
      currentUser = await Auth.checkAuth();
      updateAuthUI(currentUser);
    }

    // Check mode from URL parameter if provided
    const modeParam = params.get('mode');
    if (modeParam === 'website') {
      setConstructorMode('website');
    } else {
      setConstructorMode('magazine');
    }

    // Load initial post from URL parameter, or preset
    if (postSlug) {
      await loadPostBySlug(postSlug);
    } else {
      // Default to Saturday Mistakes Preset
      loadPreset('preset-saturday-mistakes');
    }
  }

  /**
   * Shared UI plumbing
   */
  function $(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function fillSelect(id, items) {
    const sel = $(id);
    if (!sel) return;
    sel.innerHTML = items.map(item => {
      const value = typeof item === 'string' ? item : item.value;
      const label = typeof item === 'string' ? item : item.label;
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    }).join('');
  }

  // Set a <select> value; if the article uses a value the list does not know,
  // keep it visible as a "custom" option instead of silently blanking the field.
  function setSelectValue(sel, value) {
    if (!sel) return;
    const val = value === undefined || value === null ? '' : String(value);
    const known = Array.from(sel.options).some(o => o.value === val);
    if (!known && val) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = `${val} (custom)`;
      opt.setAttribute('data-custom', 'true');
      sel.appendChild(opt);
    }
    sel.value = val;
  }

  function populateStaticSelects() {
    fillSelect('meta-language', LANGUAGES.map(l => ({ value: l.code, label: `${l.flag} ${l.name}` })));
    fillSelect('meta-desk', DESKS);
    fillSelect('meta-level', LEVELS);
    fillSelect('meta-format', FORMATS);
  }

  /**
   * Modals: one open/close path with Escape, backdrop click and focus return.
   */
  let modalReturnFocus = null;

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modalReturnFocus = document.activeElement;
    modal.hidden = false;
    const target = modal.querySelector('input:not([type="hidden"]):not([type="checkbox"]), textarea, select')
      || modal.querySelector('.btn-primary')
      || modal.querySelector('button');
    if (target) setTimeout(() => target.focus(), 0);
  }

  function closeModal(id) {
    const modal = typeof id === 'string' ? $(id) : id;
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (modal.id === 'studio-confirm-modal' && confirmResolver) {
      const resolve = confirmResolver;
      confirmResolver = null;
      resolve(false);
    }
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function' && document.contains(modalReturnFocus)) {
      modalReturnFocus.focus();
    }
    modalReturnFocus = null;
  }

  function setupModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', () => closeModal(modal));
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = Array.from(document.querySelectorAll('.modal')).filter(m => !m.hidden).pop();
      if (open) {
        e.preventDefault();
        closeModal(open);
        return;
      }
      closeAllMenus();
    });

    // Keep Tab inside the open dialog
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const open = Array.from(document.querySelectorAll('.modal')).filter(m => !m.hidden).pop();
      if (!open) return;
      const focusable = Array.from(open.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && !el.hidden && el.type !== 'hidden' && el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    const okBtn = $('studio-confirm-ok-btn');
    if (okBtn) {
      okBtn.addEventListener('click', () => {
        const resolve = confirmResolver;
        confirmResolver = null;
        const modal = $('studio-confirm-modal');
        if (modal) modal.hidden = true;
        if (resolve) resolve(true);
      });
    }
  }

  let confirmResolver = null;

  function askConfirm({ title, body, confirmLabel, danger = true }) {
    return new Promise(resolve => {
      const titleEl = $('studio-confirm-title');
      const bodyEl = $('studio-confirm-body');
      const okBtn = $('studio-confirm-ok-btn');
      if (!titleEl || !bodyEl || !okBtn) {
        resolve(true);
        return;
      }
      titleEl.textContent = title;
      bodyEl.textContent = body;
      okBtn.textContent = confirmLabel || 'Continue';
      okBtn.classList.toggle('btn-danger', danger);
      okBtn.classList.toggle('btn-primary', !danger);
      confirmResolver = resolve;
      openModal('studio-confirm-modal');
      const cancel = $('studio-confirm-cancel-btn');
      if (cancel) setTimeout(() => cancel.focus(), 0);
    });
  }

  // Run an action that replaces the open article, asking first if there is unsaved work.
  async function withDiscardGuard(action, what) {
    if (isDirty) {
      const ok = await askConfirm({
        title: 'Discard unsaved changes?',
        body: `You have changes that haven't been exported or published. ${what || 'Continuing'} will replace the article you're editing.`,
        confirmLabel: 'Discard and continue'
      });
      if (!ok) return false;
    }
    await action();
    return true;
  }

  /**
   * Dropdown menus (Export, Account)
   */
  function closeAllMenus() {
    document.querySelectorAll('.menu-panel').forEach(panel => {
      if (!panel.hidden) {
        panel.hidden = true;
        const btn = document.querySelector(`[aria-controls="${panel.id}"]`);
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setupMenus() {
    [['studio-export-menu-btn', 'studio-export-menu'], ['studio-account-btn', 'studio-account-menu']].forEach(([btnId, panelId]) => {
      const btn = $(btnId);
      const panel = $(panelId);
      if (!btn || !panel) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = panel.hidden;
        closeAllMenus();
        panel.hidden = !willOpen;
        btn.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) {
          const first = panel.querySelector('.menu-item');
          if (first) first.focus();
        }
      });

      panel.addEventListener('keydown', (e) => {
        const items = Array.from(panel.querySelectorAll('.menu-item'));
        const i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
        if (e.key === 'Escape') { e.stopPropagation(); closeAllMenus(); btn.focus(); }
      });

      panel.addEventListener('click', () => {
        closeAllMenus();
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu')) closeAllMenus();
    });
  }

  /**
   * Workbench tabs (Start / Details / Content)
   */
  const TAB_KEY = 'cosy.studio.tab';

  function readSavedTab() {
    try {
      const t = window.localStorage.getItem(TAB_KEY);
      return t === 'start' || t === 'details' || t === 'content' ? t : null;
    } catch (e) {
      return null;
    }
  }

  function showTab(name) {
    document.querySelectorAll('.wb-tab').forEach(tab => {
      tab.setAttribute('aria-selected', String(tab.getAttribute('data-tab') === name));
      tab.tabIndex = tab.getAttribute('data-tab') === name ? 0 : -1;
    });
    document.querySelectorAll('.wb-panel').forEach(panel => {
      panel.hidden = panel.getAttribute('data-panel') !== name;
    });
    const scroller = document.querySelector('.wb-scroll');
    if (scroller) scroller.scrollTop = 0;
    try { window.localStorage.setItem(TAB_KEY, name); } catch (e) { /* storage unavailable */ }
  }

  function setupTabs() {
    const tabs = Array.from(document.querySelectorAll('.wb-tab'));
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) {
          e.preventDefault();
          showTab(next.getAttribute('data-tab'));
          next.focus();
        }
      });
    });
  }

  /**
   * Theme (shares the site's `cosy.theme` key)
   */
  function applyThemeButton() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const btn = $('studio-theme-btn');
    const use = $('studio-theme-icon');
    if (use) use.setAttribute('href', dark ? '#i-sun' : '#i-moon');
    if (btn) {
      const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
  }

  function setupThemeToggle() {
    const btn = $('studio-theme-btn');
    applyThemeButton();
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { window.localStorage.setItem('cosy.theme', next); } catch (e) { /* storage unavailable */ }
      applyThemeButton();
    });
  }

  /**
   * Edit / Preview switch on narrow screens
   */
  function setView(view) {
    document.body.setAttribute('data-view', view);
    document.querySelectorAll('[data-view-btn]').forEach(btn => {
      const active = btn.getAttribute('data-view-btn') === view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function setupViewSwitch() {
    document.querySelectorAll('[data-view-btn]').forEach(btn => {
      btn.addEventListener('click', () => setView(btn.getAttribute('data-view-btn')));
    });
  }

  /**
   * Unsaved-changes tracking
   */
  function markDirty() {
    if (typeof document === 'undefined') return;
    isDirty = true;
    updateDirtyUI();
  }

  function markClean() {
    isDirty = false;
    updateDirtyUI();
  }

  function updateDirtyUI() {
    const badge = $('studio-dirty-badge');
    if (badge) badge.hidden = !isDirty;
  }

  function setupUnloadWarning() {
    window.addEventListener('beforeunload', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  function updateHeaderContext() {
    if (typeof document === 'undefined' || !currentPost) return;
    const issueEl = $('studio-crumb-issue');
    const titleEl = $('studio-crumb-title');
    const pathEl = $('studio-preview-path');
    const modeEl = $('studio-preview-mode');
    const standalone = !currentPost.issue;
    if (issueEl) {
      issueEl.textContent = standalone ? 'Website' : ((currentPost.issue && currentPost.issue.number) || 'No issue');
    }
    if (titleEl) titleEl.textContent = currentPost.title || 'Untitled article';
    if (pathEl) pathEl.textContent = currentPost.slug ? `/${currentPost.slug}.html` : '';
    if (modeEl) modeEl.textContent = constructorMode === 'magazine' ? 'Magazine spread' : 'Website article';
    const countEl = $('studio-block-count');
    if (countEl) countEl.textContent = String((currentPost.blocks || []).length);
  }

  function initIssuesList() {
    const canonical = (Blocks && Blocks.CANONICAL_ISSUES) ? Blocks.CANONICAL_ISSUES : [];
    // Clone so user edits in session don't corrupt module definition
    managedIssues = canonical.map(item => Blocks.clone(item));
    activeIssue = managedIssues[0] || {
      id: 'vol-2026-08',
      number: 'Vol. 2026.08',
      title: 'Get Ready for School',
      theme: 'Foundations, Beginnings, Pedagogy & The Science of Early Acquisition',
      date: '2026-08-15',
      palette: ['#993c1d', '#faf7f2', '#1c1917', '#0f6e56']
    };
    populateIssueSelector();
    updateActiveIssueDisplay();
  }

  function populateIssueSelector() {
    const sel = document.getElementById('studio-issue-selector');
    if (!sel) return;
    sel.innerHTML = managedIssues.map(iss => `
      <option value="${escapeHtml(iss.id)}" ${activeIssue && activeIssue.id === iss.id ? 'selected' : ''}>
        ${escapeHtml(iss.number)} — ${escapeHtml(iss.title)}
      </option>
    `).join('');
  }

  function updateActiveIssueDisplay() {
    const volBadge = document.getElementById('active-issue-vol-badge');
    const titleHeading = document.getElementById('active-issue-title-heading');
    const themeText = document.getElementById('active-issue-theme-text');
    if (volBadge && activeIssue) volBadge.textContent = activeIssue.number;
    if (titleHeading && activeIssue) titleHeading.textContent = activeIssue.title;
    if (themeText && activeIssue) themeText.textContent = activeIssue.theme || '';
  }

  function initCanonicalSectionsUI() {
    const sel = document.getElementById('studio-section-selector');
    const hint = document.getElementById('studio-section-desc-hint');
    if (!sel) return;

    const sections = (Blocks && Blocks.CANONICAL_SECTIONS) ? Blocks.CANONICAL_SECTIONS : [];
    sel.innerHTML = sections.map(s => `
      <option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} [${escapeHtml(s.desk)}]</option>
    `).join('');

    const updateHint = () => {
      const selected = sections.find(s => s.id === sel.value);
      if (hint && selected) {
        hint.textContent = `${selected.description} (Kicker: ${selected.kicker} • Format: ${selected.format})`;
      }
    };

    sel.addEventListener('change', updateHint);
    updateHint();
  }

  /**
   * Load public posts.json index to populate "Open Existing Post" dropdown
   */
  async function loadCatalogPosts() {
    try {
      const res = await fetch('posts.json');
      if (res.ok) {
        catalogPosts = await res.json();
        populatePostSelector(catalogPosts);
      }
    } catch (e) {
      console.warn('[Studio] Could not load posts.json catalog:', e);
    }
  }

  function populatePostSelector(posts) {
    const sel = document.getElementById('studio-load-selector');
    if (!sel) return;

    const filterEl = $('studio-load-filter');
    const query = filterEl ? filterEl.value.trim().toLowerCase() : '';
    const shown = query
      ? posts.filter(p => `${p.title || ''} ${p.slug || ''}`.toLowerCase().includes(query))
      : posts;

    sel.innerHTML = `<option value="">${shown.length ? 'Choose an article…' : 'No articles match'}</option>` +
      shown.map(p => `<option value="${escapeHtml(p.slug)}">${escapeHtml(p.title)} (${escapeHtml(p.slug)})</option>`).join('');

    const countEl = $('studio-load-count');
    if (countEl) {
      countEl.textContent = query
        ? `${shown.length} of ${posts.length} articles`
        : `${posts.length} published articles`;
    }
  }

  async function loadPostBySlug(slug) {
    setStatus(`Loading article "${slug}"...`, 'info');
    try {
      const res = await fetch(`posts/${encodeURIComponent(slug)}.json`);
      if (!res.ok) throw new Error(`Could not find posts/${slug}.json`);
      const postData = await res.json();
      setCurrentPost(postData);
      setStatus(`Loaded "${postData.title}"`, 'success');
    } catch (err) {
      console.error('[Studio] Error loading post:', err);
      setStatus(`Failed to load article: ${err.message}`, 'error');
    }
  }

  function loadPreset(presetId) {
    const preset = Blocks.ARTICLE_PRESETS.find(p => p.id === presetId) || Blocks.ARTICLE_PRESETS[0];
    const postData = preset.create({
      language: (currentPost && currentPost.language) || 'en',
      date: new Date().toISOString().slice(0, 10)
    });
    setCurrentPost(postData);
    setStatus(`Initialized template: ${preset.name}`, 'info');
  }

  function setCurrentPost(postData) {
    currentPost = Blocks.clone(postData);
    collapsedBlockIndices.clear();
    populateMetadataForm(currentPost);
    renderBlockList();
    renderLivePreview();
    markClean();
  }

  /**
   * Setup Auth UI & Event Listeners
   */
  function setupAuthListeners() {
    if (!Auth) return;
    Auth.onAuthStateChanged(user => {
      currentUser = user;
      updateAuthUI(user);
    });

    const loginBtn = document.getElementById('studio-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        openModal('studio-auth-modal');
      });
    }

    const logoutBtn = document.getElementById('studio-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await Auth.signOut();
        setStatus('Signed out of the Studio.', 'info');
      });
    }

    const modalForm = document.getElementById('studio-login-form');
    if (modalForm) {
      modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('studio-auth-email').value;
        const pass = document.getElementById('studio-auth-password').value;
        const errEl = document.getElementById('studio-auth-error');
        const submit = document.getElementById('studio-login-submit-btn');
        errEl.textContent = '';
        if (submit) submit.disabled = true;

        try {
          const user = await Auth.signIn(email, pass);
          modalForm.reset();
          closeModal('studio-auth-modal');
          setStatus(
            user && user.isFounder
              ? 'Signed in as founder. Publishing is unlocked.'
              : 'Signed in. You can draft, import and export; publishing needs a founder account.',
            'success'
          );
        } catch (err) {
          errEl.textContent = err.message || 'Sign-in failed. Check your email and password.';
        } finally {
          if (submit) submit.disabled = false;
        }
      });
    }
  }

  function updateAuthUI(user) {
    const badge = document.getElementById('studio-founder-badge');
    const loginBtn = document.getElementById('studio-login-btn');
    const account = document.getElementById('studio-account');
    const saveLiveBtn = document.getElementById('studio-save-live-btn');
    const uploadPdfBtn = document.getElementById('studio-upload-pdf-btn');
    const caps = getCapabilities(user);

    if (loginBtn) loginBtn.hidden = caps.signedIn;
    if (account) account.hidden = !caps.signedIn;

    if (caps.signedIn) {
      const email = user.email || '';
      const initial = $('studio-account-initial');
      const emailEl = $('studio-account-email');
      const capsEl = $('studio-account-caps');
      if (initial) initial.textContent = (email || user.role || '?').trim().charAt(0) || '?';
      if (emailEl) emailEl.textContent = email || 'Signed in';
      if (badge) {
        badge.textContent = caps.isFounder ? 'Founder' : (user.role || 'Member');
        badge.className = `role-chip ${caps.isFounder ? 'role-founder' : 'role-member'}`;
      }
      if (capsEl) {
        capsEl.textContent = caps.isFounder
          ? 'You can edit, export, publish live and upload issue PDFs.'
          : 'You can edit, import and export articles. Publishing and PDF upload need a founder account.';
      }
    }

    const lock = (btn, allowed, allowedTitle, lockedTitle) => {
      if (!btn) return;
      btn.setAttribute('aria-disabled', String(!allowed));
      btn.title = allowed ? allowedTitle : lockedTitle;
    };
    lock(saveLiveBtn, caps.publishLive,
      'Review and publish this article',
      caps.signedIn ? 'Publishing needs a founder account' : 'Sign in with a founder account to publish');
    lock(uploadPdfBtn, caps.uploadPdf,
      'Upload the issue PDF to private storage',
      caps.signedIn ? 'Uploading PDFs needs a founder account' : 'Sign in with a founder account to upload PDFs');
  }

  /**
   * Form & Workbench Interactions
   */
  function setupEventListeners() {
    // Preset buttons
    document.querySelectorAll('.preset-card[data-preset]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const done = await withDiscardGuard(() => loadPreset(btn.getAttribute('data-preset')), 'Starting from a template');
        if (done) showTab('content');
      });
    });

    // Existing post selector (+ filter)
    const postSel = document.getElementById('studio-load-selector');
    if (postSel) {
      postSel.addEventListener('change', async () => {
        const slug = postSel.value;
        if (!slug) return;
        const done = await withDiscardGuard(() => loadPostBySlug(slug), 'Opening another article');
        postSel.value = '';
        if (done) showTab('content');
      });
    }
    const loadFilter = $('studio-load-filter');
    if (loadFilter) {
      loadFilter.addEventListener('input', () => populatePostSelector(catalogPosts));
    }

    // Quick-Add Image Block Button
    const quickAddImageBtn = document.getElementById('studio-quick-add-image-btn');
    if (quickAddImageBtn) {
      quickAddImageBtn.addEventListener('click', () => {
        addBlock('image');
      });
    }

    // Quick-Add Link Block Button
    const quickAddLinkBtn = document.getElementById('studio-quick-add-link-btn');
    if (quickAddLinkBtn) {
      quickAddLinkBtn.addEventListener('click', () => {
        addBlock('links');
      });
    }

    // Modular Elements Inserter Buttons
    document.querySelectorAll('.studio-modular-insert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.getAttribute('data-preset');
        insertModularElement(presetId);
      });
    });

    // Collapse All Blocks Button
    const collapseAllBtn = document.getElementById('studio-collapse-all-btn');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        if (!currentPost || !currentPost.blocks) return;
        currentPost.blocks.forEach((_, idx) => collapsedBlockIndices.add(idx));
        renderBlockList();
      });
    }

    // Expand All Blocks Button
    const expandAllBtn = document.getElementById('studio-expand-all-btn');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        collapsedBlockIndices.clear();
        renderBlockList();
      });
    }

    // Undo Banner Action
    const undoBtn = document.getElementById('studio-undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', undoDeleteBlock);
    }

    // Add Block Palette Drawer Toggle
    const addBlockBtn = document.getElementById('studio-add-block-btn');
    const blockPalette = document.getElementById('studio-block-palette');
    const paletteCloseBtn = document.getElementById('studio-palette-close-btn');

    const setPaletteOpen = (open) => {
      if (!blockPalette) return;
      blockPalette.classList.toggle('is-open', open);
      if (addBlockBtn) addBlockBtn.setAttribute('aria-expanded', String(open));
    };

    if (addBlockBtn && blockPalette) {
      addBlockBtn.addEventListener('click', () => {
        setPaletteOpen(!blockPalette.classList.contains('is-open'));
      });
    }

    if (paletteCloseBtn && blockPalette) {
      paletteCloseBtn.addEventListener('click', () => setPaletteOpen(false));
    }

    // Populate Block Palette Buttons
    const paletteGrid = document.getElementById('studio-palette-grid');
    if (paletteGrid) {
      paletteGrid.innerHTML = Blocks.BLOCK_DEFINITIONS.map(def => `
        <button type="button" class="palette-card" data-block-type="${escapeHtml(def.type)}">
          <span class="palette-card-icon">${icon(BLOCK_ICONS[def.type] || 'layers')}</span>
          <span class="palette-card-label">${escapeHtml(def.label)}</span>
          <span class="palette-card-desc">${escapeHtml(def.description)}</span>
        </button>
      `).join('');

      paletteGrid.querySelectorAll('[data-block-type]').forEach(btn => {
        btn.addEventListener('click', () => {
          addBlock(btn.getAttribute('data-block-type'));
          setPaletteOpen(false);
        });
      });
    }

    // Download JSON Button
    const downloadBtn = document.getElementById('studio-download-json-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadCanonicalJson);
    }

    // Copy JSON Button
    const copyBtn = document.getElementById('studio-copy-json-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyCanonicalJson);
    }

    // Publish: open the review dialog (founders only)
    const saveLiveBtn = document.getElementById('studio-save-live-btn');
    if (saveLiveBtn) {
      saveLiveBtn.addEventListener('click', requestPublish);
    }

    // Upload Magazine PDF Modal & Form
    setupPdfUploadModal();

    // Import JSON File
    const importInput = document.getElementById('studio-file-import');
    const importBtn = $('studio-import-btn');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
    }
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const done = await withDiscardGuard(() => handleFileImport(file), 'Importing a file');
        importInput.value = '';
        if (done) showTab('content');
      });
    }

    // Metadata form bindings
    bindMetadataInputs();
  }

  function bindMetadataInputs() {
    const bind = (id, key, transform) => {
      const el = document.getElementById(id);
      if (!el) return;
      // Selects fire "change"; text fields fire "input"
      const evt = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, () => {
        if (!currentPost) return;
        currentPost[key] = transform ? transform(el.value) : el.value;
        markDirty();
        if (key === 'slug') updateSlugHint();
        renderLivePreview();
      });
    };

    bind('meta-title', 'title');
    bind('meta-slug', 'slug');
    bind('meta-kicker', 'kicker');
    bind('meta-dek', 'dek');
    bind('meta-desk', 'desk');
    bind('meta-format', 'format');
    bind('meta-level', 'level');
    bind('meta-date', 'date');
    bind('meta-language', 'language');
    bind('meta-reading-time', 'readingTime', v => parseInt(v, 10) || 5);
    bind('meta-tags', 'tags', v => v.split(',').map(s => s.trim()).filter(Boolean));

    // Nested issue metadata
    const issueNumEl = document.getElementById('meta-issue-number');
    if (issueNumEl) {
      issueNumEl.addEventListener('input', () => {
        if (!currentPost) return;
        currentPost.issue = currentPost.issue || {};
        currentPost.issue.number = issueNumEl.value;
        markDirty();
        renderLivePreview();
      });
    }

    const issueTitleEl = document.getElementById('meta-issue-title');
    if (issueTitleEl) {
      issueTitleEl.addEventListener('input', () => {
        if (!currentPost) return;
        currentPost.issue = currentPost.issue || {};
        currentPost.issue.title = issueTitleEl.value;
        markDirty();
        renderLivePreview();
      });
    }

    // Podcast episode
    const epNumEl = document.getElementById('meta-podcast-ep');
    if (epNumEl) {
      epNumEl.addEventListener('input', () => {
        if (!currentPost) return;
        currentPost.podcast = currentPost.podcast || {};
        currentPost.podcast.episode = parseInt(epNumEl.value, 10) || 1;
        markDirty();
        renderLivePreview();
      });
    }
  }

  function updateSlugHint() {
    const input = $('meta-slug');
    const hint = $('meta-slug-hint');
    if (!input || !hint) return;
    const value = input.value;
    const valid = value === '' || SLUG_PATTERN.test(value);
    input.classList.toggle('is-invalid', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    hint.classList.toggle('is-error', !valid);
    hint.textContent = valid
      ? 'Lowercase letters, numbers and hyphens. Also the JSON file name.'
      : 'Use lowercase letters, numbers and single hyphens only (no spaces or capitals).';
  }

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+S / Cmd+S: founders review & publish, everyone else downloads the JSON
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (getCapabilities(currentUser).publishLive) {
          requestPublish();
        } else {
          downloadCanonicalJson();
        }
      }

      // Ctrl+Z / Cmd+Z: Undo block deletion if applicable
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && deletedBlockBackup) {
        // Only trigger if not typing inside an active input/textarea
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          undoDeleteBlock();
        }
      }
    });
  }

  function populateMetadataForm(post) {
    if (typeof document === 'undefined') return;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    const setSelect = (id, val) => setSelectValue(document.getElementById(id), val);

    set('meta-title', post.title || '');
    set('meta-slug', post.slug || '');
    set('meta-kicker', post.kicker || '');
    set('meta-dek', post.dek || '');
    setSelect('meta-desk', post.desk || 'Words');
    setSelect('meta-format', post.format || 'essay');
    setSelect('meta-level', post.level || 'A1–A2');
    set('meta-date', post.date || new Date().toISOString().slice(0, 10));
    setSelect('meta-language', post.language || 'en');
    set('meta-reading-time', post.readingTime || 5);
    set('meta-tags', (post.tags || []).join(', '));
    set('meta-issue-number', (post.issue && post.issue.number) || '');
    set('meta-issue-title', (post.issue && post.issue.title) || '');
    set('meta-podcast-ep', (post.podcast && post.podcast.episode) || 1);

    // Synchronize magazine part checkbox in Website Mode
    const magCheck = document.getElementById('studio-is-magazine-part-check');
    if (magCheck) {
      const isStandalone = !post.issue || post.contentType === 'evergreen' || [
        'Website / Standalone', 'Podcast Special', 'Standalone'
      ].includes(post.issue.number);
      isMagazinePart = !isStandalone;
      magCheck.checked = isMagazinePart;
      updateMagazinePartUI(isMagazinePart);
    }

    updateSlugHint();
    renderEditorialPanel();
  }

  function setupConstructorModeListeners() {
    const magBtn = document.getElementById('studio-mode-magazine-btn');
    const webBtn = document.getElementById('studio-mode-website-btn');

    if (magBtn) {
      magBtn.addEventListener('click', () => setConstructorMode('magazine'));
    }
    if (webBtn) {
      webBtn.addEventListener('click', () => setConstructorMode('website'));
    }

    // Website Mode Checkbox: Part of a Magazine
    const magCheck = document.getElementById('studio-is-magazine-part-check');
    if (magCheck) {
      magCheck.addEventListener('change', () => {
        setMagazinePart(magCheck.checked);
      });
    }

    // Section Selector Apply button
    const applySecBtn = document.getElementById('studio-apply-section-btn');
    if (applySecBtn) {
      applySecBtn.addEventListener('click', async () => {
        const sel = document.getElementById('studio-section-selector');
        if (!sel || !sel.value) return;
        const done = await withDiscardGuard(() => applyCanonicalSection(sel.value), 'Building a section');
        if (done) showTab('content');
      });
    }
  }

  function setConstructorMode(mode) {
    constructorMode = mode === 'website' ? 'website' : 'magazine';

    if (typeof document !== 'undefined') {
      const magBtn = document.getElementById('studio-mode-magazine-btn');
      const webBtn = document.getElementById('studio-mode-website-btn');
      const magPanel = document.getElementById('workbench-issue-mode-panel');
      const webPanel = document.getElementById('workbench-website-mode-panel');

      if (magBtn) {
        magBtn.classList.toggle('is-active', constructorMode === 'magazine');
        magBtn.setAttribute('aria-pressed', String(constructorMode === 'magazine'));
      }
      if (webBtn) {
        webBtn.classList.toggle('is-active', constructorMode === 'website');
        webBtn.setAttribute('aria-pressed', String(constructorMode === 'website'));
      }

      if (magPanel) magPanel.hidden = constructorMode !== 'magazine';
      if (webPanel) webPanel.hidden = constructorMode !== 'website';

      if (constructorMode === 'website') {
        const magCheck = document.getElementById('studio-is-magazine-part-check');
        if (magCheck) {
          updateMagazinePartUI(magCheck.checked);
        }
      }
    }

    if (constructorMode === 'magazine') {
      // In Magazine mode, ensure post has active issue
      if (activeIssue && currentPost) {
        currentPost.issue = currentPost.issue || {};
        const changed = currentPost.issue.number !== activeIssue.number || currentPost.issue.title !== activeIssue.title;
        currentPost.issue.number = activeIssue.number;
        currentPost.issue.title = activeIssue.title;
        populateMetadataForm(currentPost);
        if (changed) markDirty();
      }
    }

    renderLivePreview();
    setStatus(`Switched to ${constructorMode === 'magazine' ? 'magazine issue' : 'website article'} mode`, 'info');
  }

  function setMagazinePart(checked) {
    isMagazinePart = checked;
    updateMagazinePartUI(checked);

    if (!currentPost) return;

    if (!checked) {
      // A standalone article has no issue at all (no placeholder issue is written).
      delete currentPost.issue;
      currentPost.contentType = 'evergreen';
      setStatus('Article is now standalone: it is not part of any issue.', 'info');
    } else {
      const src = activeIssue || { number: 'Vol. 2026.08', title: 'Get Ready for School' };
      currentPost.issue = { number: src.number, title: src.title };
      currentPost.contentType = 'issue-article';
      setStatus(`Article linked to magazine edition: ${currentPost.issue.number}`, 'success');
    }

    populateMetadataForm(currentPost);
    markDirty();
    renderLivePreview();
  }

  function updateMagazinePartUI(isLinked) {
    if (typeof document === 'undefined') return;
    const statusText = document.getElementById('studio-website-mode-status');
    const issueNumInput = document.getElementById('meta-issue-number');
    const issueTitleInput = document.getElementById('meta-issue-title');

    if (statusText) {
      statusText.textContent = isLinked
        ? 'Linked to a magazine issue: this article will be grouped under that volume.'
        : 'Standalone: this article will not be grouped under a magazine volume.';
      statusText.classList.toggle('is-ok', isLinked);
    }

    if (issueNumInput) issueNumInput.disabled = !isLinked;
    if (issueTitleInput) issueTitleInput.disabled = !isLinked;
  }

  function applyCanonicalSection(sectionId) {
    if (!Blocks.createSectionTemplate) return;

    const opts = {
      language: (currentPost && currentPost.language) || 'en',
      issueNumber: (activeIssue && activeIssue.number) || (currentPost && currentPost.issue && currentPost.issue.number) || 'Vol. 2026.08',
      issueTitle: (activeIssue && activeIssue.title) || (currentPost && currentPost.issue && currentPost.issue.title) || 'Get Ready for School',
      date: (currentPost && currentPost.date) || new Date().toISOString().slice(0, 10),
      palette: (activeIssue && activeIssue.palette) || ['#993c1d', '#faf7f2', '#1c1917', '#0f6e56']
    };

    const sectionPost = Blocks.createSectionTemplate(sectionId, opts);
    setCurrentPost(sectionPost);
    setStatus(`Constructed canonical section: ${sectionPost.title}`, 'success');
  }

  function setupIssueManagerListeners() {
    // Issue selector change
    const issueSel = document.getElementById('studio-issue-selector');
    if (issueSel) {
      issueSel.addEventListener('change', () => {
        const found = managedIssues.find(i => i.id === issueSel.value);
        if (found) {
          activeIssue = found;
          updateActiveIssueDisplay();
          if (currentPost) {
            currentPost.issue = {
              number: activeIssue.number,
              title: activeIssue.title
            };
            if (activeIssue.palette) {
              currentPost.artDirection = currentPost.artDirection || {};
              currentPost.artDirection.palette = Blocks.clone(activeIssue.palette);
            }
            populateMetadataForm(currentPost);
            markDirty();
            renderLivePreview();
          }
          setStatus(`Active edition set to ${activeIssue.number} — ${activeIssue.title}`, 'info');
        }
      });
    }

    // Create New Issue button
    const createBtn = document.getElementById('studio-create-issue-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openIssueModal('create');
      });
    }

    // Edit Current Issue button
    const editBtn = document.getElementById('studio-edit-issue-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (activeIssue) {
          openIssueModal('edit', activeIssue);
        }
      });
    }

    // Issue Modal Form Submit
    const form = document.getElementById('studio-issue-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveIssueFromModal();
      });
    }
  }

  function openIssueModal(mode, issueData = null) {
    const modal = document.getElementById('studio-issue-modal');
    const heading = document.getElementById('studio-issue-modal-heading');
    const modeInput = document.getElementById('issue-modal-mode');
    const idInput = document.getElementById('issue-modal-id');
    const volInput = document.getElementById('issue-modal-volume');
    const titleInput = document.getElementById('issue-modal-title');
    const themeInput = document.getElementById('issue-modal-theme');
    const dateInput = document.getElementById('issue-modal-date');
    const colorInput = document.getElementById('issue-modal-color');

    if (!modal) return;

    modeInput.value = mode;

    if (mode === 'edit' && issueData) {
      heading.textContent = `Edit issue ${issueData.number}`;
      idInput.value = issueData.id;
      volInput.value = issueData.number || '';
      titleInput.value = issueData.title || '';
      themeInput.value = issueData.theme || '';
      dateInput.value = issueData.date || '';
      colorInput.value = (issueData.palette && issueData.palette[0]) || '#993c1d';
    } else {
      heading.textContent = 'Create new issue';
      idInput.value = `vol-${Date.now()}`;
      volInput.value = '';
      titleInput.value = '';
      themeInput.value = '';
      dateInput.value = new Date().toISOString().slice(0, 10);
      colorInput.value = '#416b49';
    }

    openModal('studio-issue-modal');
  }

  function saveIssueFromModal() {
    const mode = document.getElementById('issue-modal-mode').value;
    const id = document.getElementById('issue-modal-id').value;
    const volume = document.getElementById('issue-modal-volume').value.trim();
    const title = document.getElementById('issue-modal-title').value.trim();
    const theme = document.getElementById('issue-modal-theme').value.trim();
    const date = document.getElementById('issue-modal-date').value;
    const color = document.getElementById('issue-modal-color').value;

    if (!volume || !title) return;

    let targetIssue;
    if (mode === 'edit') {
      targetIssue = managedIssues.find(i => i.id === id);
      if (targetIssue) {
        targetIssue.number = volume;
        targetIssue.title = title;
        targetIssue.theme = theme;
        targetIssue.date = date;
        targetIssue.palette = [color, '#faf7f2', '#1c1917', '#0f6e56'];
      }
    } else {
      targetIssue = {
        id: id || `issue-${Date.now()}`,
        number: volume,
        title: title,
        theme: theme,
        date: date,
        palette: [color, '#faf7f2', '#1c1917', '#0f6e56']
      };
      managedIssues.push(targetIssue);
    }

    activeIssue = targetIssue;
    populateIssueSelector();
    updateActiveIssueDisplay();

    // Sync with current post
    if (currentPost) {
      currentPost.issue = {
        number: activeIssue.number,
        title: activeIssue.title
      };
      populateMetadataForm(currentPost);
      markDirty();
      renderLivePreview();
    }

    closeModal('studio-issue-modal');
    setStatus(`Saved magazine issue: ${volume} — ${title}`, 'success');
  }

  /**
   * Block Management
   */
  function addBlock(type) {
    if (!currentPost) return;
    const newBlock = Blocks.createBlock(type);
    currentPost.blocks = currentPost.blocks || [];
    currentPost.blocks.push(newBlock);
    collapsedBlockIndices.clear();
    markDirty();
    renderBlockList();
    renderLivePreview();
    setStatus(`Added a ${type} block.`, 'info');
    // Bring the new block into view and focus its first field
    if (typeof document !== 'undefined') {
      const cards = document.querySelectorAll('#studio-blocks-container .studio-block-card');
      const last = cards[cards.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstField = last.querySelector('[data-field]');
        if (firstField) firstField.focus({ preventScroll: true });
      }
    }
  }

  function insertModularElement(presetId) {
    if (!currentPost) {
      setStatus('Open or create an article first.', 'error');
      return;
    }
    if (!Blocks.createModularElementBlock) return;
    try {
      const newBlock = Blocks.createModularElementBlock(presetId);
      currentPost.blocks = currentPost.blocks || [];
      currentPost.blocks.push(newBlock);
      collapsedBlockIndices.clear();
      markDirty();
      renderBlockList();
      renderLivePreview();
      const preset = (Blocks.MODULAR_ELEMENT_PRESETS || []).find(p => p.id === presetId);
      setStatus(`Inserted "${preset ? preset.label : presetId}".`, 'info');
      const cards = document.querySelectorAll('#studio-blocks-container .studio-block-card');
      const last = cards[cards.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const firstField = last.querySelector('[data-field]');
        if (firstField) firstField.focus({ preventScroll: true });
      }
    } catch (err) {
      setStatus(`Could not insert that element: ${err.message}`, 'error');
    }
  }

  function removeBlock(index) {
    if (!currentPost || !currentPost.blocks) return;
    const removed = currentPost.blocks.splice(index, 1)[0];
    deletedBlockBackup = { block: removed, index };
    collapsedBlockIndices.clear();
    markDirty();
    showUndoBanner(removed);
    renderBlockList();
    renderLivePreview();
  }

  function undoDeleteBlock() {
    if (!deletedBlockBackup || !currentPost) return;
    currentPost.blocks = currentPost.blocks || [];
    const idx = Math.min(deletedBlockBackup.index, currentPost.blocks.length);
    currentPost.blocks.splice(idx, 0, deletedBlockBackup.block);
    deletedBlockBackup = null;
    collapsedBlockIndices.clear();
    markDirty();
    hideUndoBanner();
    renderBlockList();
    renderLivePreview();
    setStatus('Restored deleted block.', 'info');
  }

  function showUndoBanner(block) {
    const banner = document.getElementById('studio-undo-banner');
    const textEl = document.getElementById('studio-undo-text');
    if (!banner) return;
    if (textEl) textEl.textContent = `Deleted the ${block.type} block.`;
    banner.hidden = false;
  }

  function hideUndoBanner() {
    const banner = document.getElementById('studio-undo-banner');
    if (banner) banner.hidden = true;
  }

  function moveBlock(index, delta) {
    if (!currentPost || !currentPost.blocks) return;
    const target = index + delta;
    if (target < 0 || target >= currentPost.blocks.length) return;
    const item = currentPost.blocks.splice(index, 1)[0];
    currentPost.blocks.splice(target, 0, item);
    collapsedBlockIndices.clear();
    markDirty();
    renderBlockList();
    renderLivePreview();
  }

  function cloneBlock(index) {
    if (!currentPost || !currentPost.blocks) return;
    const item = Blocks.clone(currentPost.blocks[index]);
    currentPost.blocks.splice(index + 1, 0, item);
    collapsedBlockIndices.clear();
    markDirty();
    renderBlockList();
    renderLivePreview();
  }

  /**
   * Render Block Cards in Workbench
   */
  function calculateArticleStats(post) {
    if (!post || !post.blocks) return { words: 0, minutes: 1 };
    let text = `${post.title || ''} ${post.dek || ''} `;
    post.blocks.forEach(b => {
      if (b.text) text += `${b.text} `;
      if (b.wrong) text += `${b.wrong} `;
      if (b.right) text += `${b.right} `;
      if (b.why) text += `${b.why} `;
      if (b.rule) text += `${b.rule} `;
      if (b.targetText) text += `${b.targetText} `;
      if (b.gloss) text += `${b.gloss} `;
      if (b.content) text += `${b.content} `;
      if (b.quote) text += `${b.quote} `;
      if (b.items) text += `${b.items.join(' ')} `;
      if (b.caption) text += `${b.caption} `;
    });
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 150));
    return { words, minutes };
  }

  function updateArticleStatsUI() {
    const pill = document.getElementById('studio-stats-pill');
    if (!pill || !currentPost) return;
    const stats = calculateArticleStats(currentPost);
    pill.textContent = `${stats.words} words • ${stats.minutes}m read`;
  }

  function getBlockSnippet(block) {
    if (block.text) return block.text;
    if (block.title) return block.title;
    if (block.targetText) return block.targetText;
    if (block.word) return block.word;
    if (block.quote) return block.quote;
    if (block.caption) return block.caption;
    if (block.label) return block.label;
    if (block.items && block.items[0]) return block.items[0];
    return '';
  }

  /**
   * Render Block Cards in Workbench
   */
  function renderBlockList() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('studio-blocks-container');
    if (!container) return;

    updateArticleStatsUI();

    if (!currentPost || !currentPost.blocks || currentPost.blocks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          ${icon('layers')}
          <strong>No content yet</strong>
          <p>Use <em>Add block</em> above, or start from a template in the Start tab.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = currentPost.blocks.map((block, index) => {
      const def = Blocks.BLOCK_DEFINITIONS.find(b => b.type === block.type) || { label: block.type };
      const isCollapsed = collapsedBlockIndices.has(index);
      const snippet = getBlockSnippet(block);

      return `
        <div class="studio-block-card ${isCollapsed ? 'is-collapsed' : ''}" data-index="${index}">
          <div class="studio-block-header">
            <button type="button" class="studio-block-drag-title" data-act="toggle-collapse" aria-expanded="${!isCollapsed}" title="Expand or collapse">
              ${icon('chevron-down', 'block-toggle-icon')}
              <span class="block-icon">${icon(BLOCK_ICONS[block.type] || 'layers')}</span>
              <span class="block-type-badge">${escapeHtml(def.label)}</span>
              <span class="block-index">#${index + 1}</span>
              ${snippet ? `<span class="block-summary-snippet">${escapeHtml(snippet)}</span>` : ''}
            </button>
            <div class="studio-block-actions">
              <button type="button" class="action-btn" data-act="scroll-to" title="Show in preview" aria-label="Show block ${index + 1} in preview">${icon('eye')}</button>
              <button type="button" class="action-btn" data-act="up" ${index === 0 ? 'disabled' : ''} title="Move up" aria-label="Move block ${index + 1} up">${icon('arrow-up')}</button>
              <button type="button" class="action-btn" data-act="down" ${index === currentPost.blocks.length - 1 ? 'disabled' : ''} title="Move down" aria-label="Move block ${index + 1} down">${icon('arrow-down')}</button>
              <button type="button" class="action-btn" data-act="clone" title="Duplicate" aria-label="Duplicate block ${index + 1}">${icon('copy')}</button>
              <button type="button" class="action-btn action-danger" data-act="delete" title="Delete" aria-label="Delete block ${index + 1}">${icon('trash')}</button>
            </div>
          </div>
          <div class="studio-block-fields">
            ${renderBlockFields(block, index)}
            <div class="form-group fg-medium">
              <label>Appears in</label>
              <select class="form-control" data-field="medium">
                <option value="both" ${!block.medium || block.medium === 'both' ? 'selected' : ''}>Digital and paper</option>
                <option value="digital" ${block.medium === 'digital' ? 'selected' : ''}>Digital only</option>
                <option value="print" ${block.medium === 'print' ? 'selected' : ''}>Paper only</option>
              </select>
            </div>
            <div class="studio-stage-fields">
              <details>
                <summary>${icon('mic-script')}Podcast and read-aloud script</summary>
                <div class="form-group">
                  <label>Spoken narration (say)</label>
                  <textarea class="form-control" data-field="say" rows="2" placeholder="Spoken read-aloud text for podcast audio or presentation...">${escapeHtml(block.say || '')}</textarea>
                </div>
              </details>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach block action events
    container.querySelectorAll('.studio-block-card').forEach(card => {
      const index = parseInt(card.getAttribute('data-index'), 10);

      // Card header collapse toggle
      const headerTitle = card.querySelector('.studio-block-drag-title');
      if (headerTitle) {
        headerTitle.addEventListener('click', () => {
          if (collapsedBlockIndices.has(index)) {
            collapsedBlockIndices.delete(index);
          } else {
            collapsedBlockIndices.add(index);
          }
          renderBlockList();
        });
      }

      // Actions
      card.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const act = btn.getAttribute('data-act');
          if (act === 'up') moveBlock(index, -1);
          if (act === 'down') moveBlock(index, 1);
          if (act === 'clone') cloneBlock(index);
          if (act === 'delete') removeBlock(index);
          if (act === 'scroll-to') scrollToPreviewBlock(index);
          if (act === 'toggle-collapse') return;
        });
      });

      // Formatting toolbar buttons
      card.querySelectorAll('[data-format]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const fmt = btn.getAttribute('data-format');
          const fieldName = btn.getAttribute('data-target-field');
          const textarea = card.querySelector(`textarea[data-field="${fieldName}"]`);
          if (textarea) {
            applyFormatting(textarea, fmt);
            const block = currentPost.blocks[index];
            updateBlockField(block, fieldName, textarea.value);
            markDirty();
            renderLivePreview();
            updateArticleStatsUI();
          }
        });
      });

      // Quick Image Asset Selector dropdown
      const imgSelect = card.querySelector('.studio-image-picker');
      if (imgSelect) {
        imgSelect.addEventListener('change', () => {
          if (imgSelect.value) {
            const urlInput = card.querySelector('input[data-field="url"]');
            if (urlInput) {
              urlInput.value = imgSelect.value;
              const block = currentPost.blocks[index];
              updateBlockField(block, 'url', imgSelect.value);
              markDirty();
              renderLivePreview();
            }
          }
        });
      }

      // Quick Link Destination Presets dropdown
      const linkSelect = card.querySelector('.studio-link-picker');
      if (linkSelect) {
        linkSelect.addEventListener('change', () => {
          const selectedVal = linkSelect.value;
          const found = (Blocks.LINK_PRESETS || []).find(p => p.url === selectedVal);
          if (found) {
            const urlInput = card.querySelector('input[data-field="url"]');
            const labelInput = card.querySelector('input[data-field="label"]');
            const destSelect = card.querySelector('select[data-field="destination"]');
            const block = currentPost.blocks[index];

            if (urlInput) urlInput.value = found.url;
            if (labelInput) labelInput.value = found.label;
            if (destSelect) destSelect.value = found.destination;

            updateBlockField(block, 'url', found.url);
            updateBlockField(block, 'label', found.label);
            updateBlockField(block, 'destination', found.destination);
            markDirty();
            renderLivePreview();
          }
        });
      }

      // Field inputs
      card.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', () => {
          const field = input.getAttribute('data-field');
          const block = currentPost.blocks[index];
          updateBlockField(block, field, input.value);
          markDirty();
          renderLivePreview();
          updateArticleStatsUI();
        });
        if (input.tagName === 'SELECT') {
          input.addEventListener('change', () => {
            updateBlockField(currentPost.blocks[index], input.getAttribute('data-field'), input.value);
            markDirty();
            renderLivePreview();
          });
        }
      });

      // Associate every label with its control (screen readers, click-to-focus)
      card.querySelectorAll('.form-group').forEach((group, g) => {
        const label = group.querySelector('label');
        const control = group.querySelector('input, textarea, select');
        if (label && control && !label.hasAttribute('for')) {
          if (!control.id) control.id = `blk-${index}-${g}`;
          label.setAttribute('for', control.id);
        }
      });
    });

    updateHeaderContext();
  }

  function applyFormatting(textarea, format) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || 'text';

    let replacement = '';
    if (format === 'bold') replacement = `**${selected}**`;
    if (format === 'italic') replacement = `*${selected}*`;
    if (format === 'code') replacement = `\`${selected}\``;
    if (format === 'link') replacement = `[${selected}](https://...)`;
    if (format === 'arrow') replacement = ` → ${selected}`;

    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    textarea.selectionStart = start;
    textarea.selectionEnd = start + replacement.length;
  }

  function scrollToPreviewBlock(index) {
    const previewRoot = document.getElementById('studio-preview-root');
    if (!previewRoot) return;
    const targetEl = previewRoot.querySelector(`[data-preview-index="${index}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('is-preview-highlight');
      setTimeout(() => targetEl.classList.remove('is-preview-highlight'), 1800);
    }
  }

  function updateBlockField(block, field, value) {
    if (field === 'items') {
      block.items = value.split('\n').filter(s => s.trim().length > 0);
    } else if (field === 'examples') {
      block.examples = value.split('\n').filter(s => s.trim().length > 0);
    } else if (field === 'quiz-options') {
      block.quiz = block.quiz || {};
      block.quiz.options = value.split('\n').filter(s => s.trim().length > 0);
    } else if (field === 'quiz-correct') {
      block.quiz = block.quiz || {};
      block.quiz.correctIndex = parseInt(value, 10) || 0;
    } else if (field === 'quiz-question') {
      block.quiz = block.quiz || {};
      block.quiz.question = value;
    } else if (field === 'quiz-explanation') {
      block.quiz = block.quiz || {};
      block.quiz.explanation = value;
    } else if (field === 'medium') {
      if (value === 'digital' || value === 'print') block.medium = value;
      else delete block.medium;
    } else if (field === 'level') {
      block.level = parseInt(value, 10) || 2;
    } else {
      block[field] = value;
    }
  }

  function renderBlockFields(block, index) {
    switch (block.type) {
      case 'heading':
        return `
          <div class="form-row">
            <div class="form-group fg-xs">
              <label>Level</label>
              <select class="form-control" data-field="level">
                ${[1, 2, 3, 4, 5, 6].map(lvl => `<option value="${lvl}" ${block.level === lvl ? 'selected' : ''}>H${lvl}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Heading text</label>
              <input type="text" class="form-control" data-field="text" value="${escapeHtml(block.text || '')}">
            </div>
          </div>
        `;

      case 'paragraph':
        return `
          <div class="form-group">
            <div class="form-group-head">
              <label>Paragraph text</label>
              <div class="studio-format-toolbar">
                <button type="button" class="format-btn" data-format="bold" data-target-field="text" title="Bold" aria-label="Bold">B</button>
                <button type="button" class="format-btn" data-format="italic" data-target-field="text" title="Italic" aria-label="Italic"><em>I</em></button>
                <button type="button" class="format-btn" data-format="code" data-target-field="text" title="Code" aria-label="Code">&lt;/&gt;</button>
                <button type="button" class="format-btn" data-format="link" data-target-field="text" title="Link" aria-label="Link">${icon('link')}</button>
              </div>
            </div>
            <textarea class="form-control" data-field="text" rows="4">${escapeHtml(block.text || '')}</textarea>
          </div>
        `;

      case 'mistake-card':
        return `
          <div class="form-row">
            <div class="form-group fg-xs">
              <label>Number</label>
              <input type="text" class="form-control" data-field="number" value="${escapeHtml(block.number || '1')}">
            </div>
            <div class="form-group">
              <label>Mistake title</label>
              <input type="text" class="form-control" data-field="title" value="${escapeHtml(block.title || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Wrong sentence</label>
              <input type="text" class="form-control" data-field="wrong" value="${escapeHtml(block.wrong || '')}">
            </div>
            <div class="form-group">
              <label>Right sentence</label>
              <input type="text" class="form-control" data-field="right" value="${escapeHtml(block.right || '')}">
            </div>
          </div>
          <div class="form-group">
            <label>Why it happens (linguistic reason)</label>
            <textarea class="form-control" data-field="why" rows="2">${escapeHtml(block.why || '')}</textarea>
          </div>
          <div class="form-group">
            <label>The COSY Rule (memorable guideline)</label>
            <input type="text" class="form-control" data-field="rule" value="${escapeHtml(block.rule || '')}">
          </div>
          <div class="form-group">
            <label>More examples (one per line)</label>
            <textarea class="form-control" data-field="examples" rows="2">${escapeHtml((block.examples || []).join('\n'))}</textarea>
          </div>
        `;

      case 'example':
        return `
          <div class="form-group">
            <label>Target-language sentence</label>
            <input type="text" class="form-control" data-field="targetText" value="${escapeHtml(block.targetText || '')}">
          </div>
          <div class="form-group">
            <label>Gloss (monolingual meaning or structure guide)</label>
            <input type="text" class="form-control" data-field="gloss" value="${escapeHtml(block.gloss || '')}">
          </div>
          <div class="form-group">
            <label>Usage context (optional)</label>
            <input type="text" class="form-control" data-field="context" value="${escapeHtml(block.context || '')}">
          </div>
        `;

      case 'pronunciation':
        return `
          <div class="form-row">
            <div class="form-group">
              <label>Word or phrase</label>
              <input type="text" class="form-control" data-field="word" value="${escapeHtml(block.word || '')}">
            </div>
            <div class="form-group">
              <label>IPA transcription</label>
              <input type="text" class="form-control" data-field="ipa" value="${escapeHtml(block.ipa || '')}">
            </div>
          </div>
        `;

      case 'pullquote':
        return `
          <div class="form-group">
            <label>Quote text</label>
            <textarea class="form-control" data-field="quote" rows="2">${escapeHtml(block.quote || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Attribution (optional)</label>
            <input type="text" class="form-control" data-field="attribution" value="${escapeHtml(block.attribution || '')}">
          </div>
        `;

      case 'quiz':
        return `
          <div class="form-group">
            <label>Quiz question</label>
            <input type="text" class="form-control" data-field="quiz-question" value="${escapeHtml((block.quiz ? block.quiz.question : block.question) || '')}">
          </div>
          <div class="form-group">
            <label>Options (one per line)</label>
            <textarea class="form-control" data-field="quiz-options" rows="3">${escapeHtml(((block.quiz ? block.quiz.options : block.options) || []).join('\n'))}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group fg-sm">
              <label>Correct option (0 = first)</label>
              <input type="number" class="form-control" data-field="quiz-correct" min="0" max="5" value="${(block.quiz ? block.quiz.correctIndex : block.correctIndex) || 0}">
            </div>
            <div class="form-group">
              <label>Explanation</label>
              <input type="text" class="form-control" data-field="quiz-explanation" value="${escapeHtml((block.quiz ? block.quiz.explanation : block.explanation) || '')}">
            </div>
          </div>
        `;

      case 'culture-bite':
        return `
          <div class="form-group">
            <label>Title</label>
            <input type="text" class="form-control" data-field="title" value="${escapeHtml(block.title || '')}">
          </div>
          <div class="form-group">
            <label>Cultural context note</label>
            <textarea class="form-control" data-field="content" rows="3">${escapeHtml(block.content || '')}</textarea>
          </div>
        `;

      case 'list-item':
        return `
          <div class="form-group">
            <label>List items (one per line, e.g. “Overused → Upgrade”)</label>
            <textarea class="form-control" data-field="items" rows="4">${escapeHtml((block.items || []).join('\n'))}</textarea>
          </div>
        `;

      case 'image': {
        const assets = Blocks.AVAILABLE_IMAGE_ASSETS || [];
        const optionsHtml = '<option value="">Choose an illustration…</option>' +
          assets.map(a => `<option value="${escapeHtml(a.url)}" ${block.url === a.url ? 'selected' : ''}>${escapeHtml(a.label)}</option>`).join('');

        return `
          <div class="form-group">
            <label>Pick a known illustration</label>
            <select class="form-control studio-image-picker">${optionsHtml}</select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Image URL</label>
              <input type="text" class="form-control" data-field="url" value="${escapeHtml(block.url || '')}">
            </div>
            <div class="form-group">
              <label>Alt Text</label>
              <input type="text" class="form-control" data-field="alt" value="${escapeHtml(block.alt || '')}">
            </div>
          </div>
          <div class="form-group">
            <label>Caption</label>
            <input type="text" class="form-control" data-field="caption" value="${escapeHtml(block.caption || '')}">
          </div>
        `;
      }

      case 'links': {
        const presets = Blocks.LINK_PRESETS || [];
        const presetOpts = '<option value="">Choose a destination…</option>' +
          presets.map(p => `<option value="${escapeHtml(p.url)}" ${block.url === p.url ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('');

        return `
          <div class="form-group">
            <label>Quick-fill from the COSY ecosystem</label>
            <select class="form-control studio-link-picker">${presetOpts}</select>
          </div>
          <div class="form-row">
            <div class="form-group fg-sm">
              <label>Destination</label>
              <select class="form-control" data-field="destination">
                <option value="cosytools" ${block.destination === 'cosytools' ? 'selected' : ''}>COSYtools</option>
                <option value="practice" ${block.destination === 'practice' ? 'selected' : ''}>COSYpractice</option>
                <option value="ecosystem" ${block.destination === 'ecosystem' ? 'selected' : ''}>COSY Ecosystem</option>
                <option value="external" ${block.destination === 'external' ? 'selected' : ''}>External Website</option>
              </select>
            </div>
            <div class="form-group">
              <label>Link label (e.g. Practice on COSYtools)</label>
              <input type="text" class="form-control" data-field="label" value="${escapeHtml(block.label || '')}">
            </div>
          </div>
          <div class="form-group">
            <label>Target URL (opens in a new tab)</label>
            <input type="text" class="form-control" data-field="url" value="${escapeHtml(block.url || '')}">
          </div>
        `;
      }

      default:
        return `<p class="block-note">This block type has no form yet. Edit it in the exported JSON.</p>`;
    }
  }

  /**
   * Live Gazette Spread Rendering Engine
   */
  let previewMedium = 'screen'; // 'screen' | 'print'

  function setPreviewMedium(m) {
    previewMedium = m === 'print' ? 'print' : 'screen';
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[data-medium-btn]').forEach(btn => {
        const on = btn.getAttribute('data-medium-btn') === previewMedium;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });
    }
    renderLivePreview();
  }

  function setupPreviewMedium() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-medium-btn]').forEach(btn => {
      btn.addEventListener('click', () => setPreviewMedium(btn.getAttribute('data-medium-btn')));
    });
  }

  /** Paper preview: an A4 text frame with bleed, trim and safe-area guides and estimated page breaks. */
  function renderPrintPreview(previewRoot) {
    const spec = PrintSpec ? PrintSpec.PRESS_SPEC : { trimMm: { width: 210, height: 297 }, bleedMm: 3, safeMarginMm: 10, gutterExtraMm: 5 };
    const est = PrintSpec ? PrintSpec.estimateArticlePages(currentPost) : { pages: 1, exact: 1, estimatedPages: 1, rasterImages: [], words: 0 };
    const pxPerMm = 2;
    const pageH = spec.trimMm.height * pxPerMm;
    const pageW = spec.trimMm.width * pxPerMm;
    let isFirstPara = true;
    const body = (currentPost.blocks || []).map((b, index) => {
      if (!b || b.medium === 'digital') return '';
      return renderPreviewBlock(b, index, { isFirst: () => { if (isFirstPara) { isFirstPara = false; return true; } return false; } });
    }).join('\n');
    const pages = Math.max(1, est.pages);
    const rasterNote = est.rasterImages.length
      ? `<p class="print-note">${est.rasterImages.length} raster image${est.rasterImages.length === 1 ? '' : 's'}: each needs at least ${est.rasterImages[0].minPixelsFrameWidth}px width (full bleed ${est.rasterImages[0].minPixelsFullBleed}px) at 300 dpi.</p>`
      : '';
    const kicker = currentPost.kicker || currentPost.desk || '';
    const meta = currentPost.issue ? `${currentPost.issue.number} · ${currentPost.issue.title}` : 'Standalone article';
    previewRoot.innerHTML = `
      <div class="print-preview">
        <div class="print-summary">
          <strong>${est.pages} page${est.pages === 1 ? '' : 's'}</strong>
          <span>${est.source === 'override' ? 'set by hand' : 'estimated, check against a proof'} · ${est.words} words · A4, 3 mm bleed</span>
        </div>
        ${rasterNote}
        <div class="print-legend"><span class="lg lg-trim">Trim</span><span class="lg lg-safe">Safe area</span><span class="lg lg-break">Page break (estimate)</span></div>
        <div class="print-sheet" style="width:${pageW}px; min-height:${pageH * pages}px; --page-h:${pageH}px; --safe:${spec.safeMarginMm * pxPerMm}px; --gutter:${spec.gutterExtraMm * pxPerMm}px;">
          <div class="print-frame">
            <p class="print-kicker">${escapeHtml(kicker)} · ${escapeHtml(meta)}</p>
            <h1 class="print-title">${escapeHtml(currentPost.title || 'Untitled article')}</h1>
            <p class="print-dek">${escapeHtml(currentPost.dek || '')}</p>
            <div class="print-columns post-full-content">${body}</div>
          </div>
        </div>
      </div>`;
  }

  function renderLivePreview() {
    if (typeof document === 'undefined') return;
    const previewRoot = document.getElementById('studio-preview-root');
    if (!previewRoot || !currentPost) return;

    updateHeaderContext();
    renderPrintSummary();
    if (previewMedium === 'print') {
      renderPrintPreview(previewRoot);
      return;
    }
    let isFirstPara = true;

    const renderedBlocks = (currentPost.blocks || []).map((b, index) => {
      if (b && b.medium === 'print') return '';
      return renderPreviewBlock(b, index, {
        isFirst: () => {
          if (isFirstPara) {
            isFirstPara = false;
            return true;
          }
          return false;
        }
      });
    }).join('\n');

    const isWebsiteStandalone = !currentPost.issue;
    const issueText = isWebsiteStandalone
      ? '🌐 COSY Website / Standalone'
      : `${currentPost.issue.number} • ${currentPost.issue.title}`;

    const sectionBadge = currentPost.section
      ? `<span class="stamp-sticker" style="background:#0f6e56; color:#ffffff;">${escapeHtml(currentPost.section.replace(/_/g, ' '))}</span>`
      : '';

    previewRoot.innerHTML = `
      <div class="gazette-wrapper gazette-container format-${escapeHtml(currentPost.format || 'essay')} ${isWebsiteStandalone ? 'is-website-standalone' : 'is-magazine-edition'}">
        <header class="gazette-masthead">
          <div class="gazette-masthead-top">
            <div class="gazette-masthead-left">
              <span>${isWebsiteStandalone ? 'COSYLANGUAGES WEB' : 'COSYMAGAZINE DIGITAL EDITION'}</span>
            </div>
            <div class="gazette-masthead-links">
              <span>${constructorMode === 'magazine' ? '📖 Magazine Spread Preview' : '🌐 Website Preview'}</span>
            </div>
          </div>
          <div class="gazette-masthead-meta">
            <span>${escapeHtml(issueText)}</span>
            <span class="stamp-sticker">${escapeHtml(currentPost.desk || 'Words')}</span>
            ${sectionBadge}
            <span>${escapeHtml(currentPost.date || '')}</span>
          </div>
        </header>

        <div class="gazette-cover-hero">
          <div class="gazette-header-content">
            <span class="editorial-kicker">${escapeHtml(currentPost.kicker || currentPost.desk || '')}</span>
            <h1 class="cover-headline">${escapeHtml(currentPost.title || 'Untitled Article')}</h1>
            <p class="editorial-dek">${escapeHtml(currentPost.dek || '')}</p>

            <div class="post-byline-row">
              <div class="byline-author">
                <span class="post-author-avatar">J</span>
                <span>Written by <strong>JY DM</strong></span>
              </div>
              <div class="byline-meta">
                <span>📅 ${escapeHtml(currentPost.date || '')}</span>
                <span>⏱️ ${currentPost.readingTime || 5} min read</span>
                <span class="stamp-sticker">${escapeHtml(currentPost.level || 'A0–A1')}</span>
              </div>
            </div>
          </div>
        </div>

        <main class="gazette-reading-view">
          <article class="post-full-content gazette-article">
            ${renderedBlocks}
          </article>
        </main>
      </div>
    `;
  }

  function renderPreviewBlock(block, index, state) {
    if (!block) return '';
    const idxAttr = `data-preview-index="${index}"`;
    switch (block.type) {
      case 'heading': {
        const lvl = Math.min(6, Math.max(1, block.level || 2));
        return `<h${lvl} ${idxAttr} class="editorial-heading">${formatMarkdown(block.text || '')}</h${lvl}>`;
      }
      case 'paragraph': {
        const parsed = formatMarkdown(block.text || '');
        if (state.isFirst()) {
          return `<p ${idxAttr} class="gazette-drop-cap">${parsed}</p>`;
        }
        return `<p ${idxAttr}>${parsed}</p>`;
      }
      case 'mistake-card': {
        const num = block.number ? String(block.number).padStart(2, '0') : '';
        const L = block.labels || { wrong: 'Not quite', right: 'Say this', why: 'Why it happens', rule: 'The COSY rule' };
        return `
          <article ${idxAttr} class="mc">
            <header class="mc-head">${num ? `<span class="mc-num">${escapeHtml(num)}</span>` : ''}<h3 class="mc-title">${formatMarkdown(block.title || '')}</h3></header>
            <div class="mc-compare">
              <div class="mc-side mc-wrong"><span class="mc-label">✗ ${escapeHtml(L.wrong)}</span><p class="mc-sentence">${formatMarkdown(block.wrong || '')}</p></div>
              <div class="mc-side mc-right"><span class="mc-label">✓ ${escapeHtml(L.right)}</span><p class="mc-sentence">${formatMarkdown(block.right || '')}</p></div>
            </div>
            ${block.why ? `<p class="mc-why"><strong>${escapeHtml(L.why)}.</strong> ${formatMarkdown(block.why)}</p>` : ''}
            <p class="mc-rule"><strong>${escapeHtml(L.rule)}.</strong> ${formatMarkdown(block.rule || '')}</p>
          </article>
        `;
      }
      case 'example': {
        return `
          <div ${idxAttr} class="gazette-example-box">
            <span class="example-target">${formatMarkdown(block.targetText || '')}</span>
            <p class="example-gloss">${formatMarkdown(block.gloss || '')}</p>
            ${block.context ? `<p class="example-context">Context: ${formatMarkdown(block.context)}</p>` : ''}
          </div>
        `;
      }
      case 'pronunciation': {
        return `
          <div ${idxAttr} class="gazette-pronunciation-card">
            <span class="pronunciation-word">${formatMarkdown(block.word || '')}</span>
            <span class="pronunciation-ipa">[${escapeHtml(block.ipa || '')}]</span>
          </div>
        `;
      }
      case 'pullquote': {
        return `
          <blockquote ${idxAttr} class="gazette-pullquote">
            <p>“${formatMarkdown(block.quote || '')}”</p>
            ${block.attribution ? `<cite>— ${escapeHtml(block.attribution)}</cite>` : ''}
          </blockquote>
        `;
      }
      case 'quiz': {
        const q = block.quiz || block;
        const opts = (q.options || []).map(opt => `
          <button type="button" class="quiz-option-btn"><span class="quiz-mark">⚪</span> <span>${formatMarkdown(opt)}</span></button>
        `).join('');
        return `
          <div ${idxAttr} class="gazette-quiz-card">
            <h4 class="quiz-question">❓ ${formatMarkdown(q.question || '')}</h4>
            <div class="quiz-options-list">${opts}</div>
          </div>
        `;
      }
      case 'culture-bite': {
        return `
          <aside ${idxAttr} class="gazette-marginalia">
            <div class="gazette-marginalia-title">📌 ${formatMarkdown(block.title || '')}</div>
            <p class="marginalia-body">${formatMarkdown(block.content || '')}</p>
          </aside>
        `;
      }
      case 'quote-wall': {
        const quotes = (block.quotes || []).map(q => `
          <div class="quote-tile">
            <p class="quote-tile-text">“${formatMarkdown(q.quote || '')}”</p>
            <div class="quote-tile-author">— ${escapeHtml(q.author || '')}</div>
          </div>
        `).join('');
        return `<div ${idxAttr} class="format-quote-wall">${quotes}</div>`;
      }
      case 'list-item': {
        const items = block.items || [];
        const isUpgrade = items.some(i => i.includes('→'));
        if (isUpgrade) {
          return `<div ${idxAttr} class="phrase-upgrade-grid">${items.map(i => `<div class="phrase-upgrade-card">${formatMarkdown(i)}</div>`).join('')}</div>`;
        }
        return `<ul ${idxAttr} class="editorial-list">${items.map(i => `<li>${formatMarkdown(i)}</li>`).join('')}</ul>`;
      }
      case 'image': {
        return `
          <figure ${idxAttr} class="gazette-figure">
            <img src="${escapeHtml(block.url || '')}" alt="${escapeHtml(block.alt || '')}" class="gazette-figure-img">
            ${block.caption ? `<figcaption class="gazette-figure-caption">${formatMarkdown(block.caption)}</figcaption>` : ''}
          </figure>
        `;
      }
      case 'links': {
        return `
          <div ${idxAttr} class="gazette-link-block">
            <a href="${escapeHtml(block.url || '#')}" target="_blank" rel="noopener" class="read-more-link">${formatMarkdown(block.label || 'Link')} ↗</a>
          </div>
        `;
      }
      case 'table': {
        const th = (block.headers || []).map(h => `<th>${formatMarkdown(h)}</th>`).join('');
        const tr = (block.rows || []).map(r => `<tr>${r.map(c => `<td>${formatMarkdown(c)}</td>`).join('')}</tr>`).join('');
        return `
          <div ${idxAttr} class="table-responsive-container">
            <table class="gazette-editorial-table">
              <thead><tr>${th}</tr></thead>
              <tbody>${tr}</tbody>
            </table>
          </div>
        `;
      }
      default:
        return '';
    }
  }

  /**
   * Export & Persistence Operations
   */
  function downloadCanonicalJson() {
    if (!currentPost) return;
    const jsonStr = JSON.stringify(currentPost, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPost.slug || 'article'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(`Downloaded "${currentPost.slug}.json"`, 'success');
  }

  async function copyCanonicalJson() {
    if (!currentPost) return;
    try {
      const jsonStr = JSON.stringify(currentPost, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setStatus('Article JSON copied to clipboard!', 'success');
    } catch (e) {
      setStatus('Could not copy JSON to clipboard.', 'error');
    }
  }

  function setFormMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = `form-msg${kind ? ' msg-' + kind : ''}`;
  }

  // ---- Issue planner ----
  const plannerCache = {};

  async function fetchFullPost(slug) {
    if (currentPost && currentPost.slug === slug) return currentPost; // unsaved edits count
    if (plannerCache[slug]) return plannerCache[slug];
    const res = await fetch(`posts/${encodeURIComponent(slug)}.json`);
    if (!res.ok) throw new Error(slug);
    plannerCache[slug] = await res.json();
    return plannerCache[slug];
  }

  function plannerIssueOptions() {
    const seen = new Map();
    catalogPosts.forEach(p => { if (p.issue_volume) seen.set(p.issue_volume, p.issue_title || ''); });
    managedIssues.forEach(i => { if (i.number && !seen.has(i.number)) seen.set(i.number, i.title || ''); });
    return Array.from(seen.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }

  async function renderIssuePlan() {
    const body = $('planner-body');
    const sel = $('planner-issue');
    if (!body || !sel || !PrintSpec) return;
    const volume = sel.value;
    const mode = ($('planner-mode') || {}).value || 'fresh';
    body.innerHTML = '<p class="hint">Calculating…</p>';
    const slugs = catalogPosts.filter(p => p.issue_volume === volume).map(p => p.slug);
    if (currentPost && currentPost.issue && currentPost.issue.number === volume && currentPost.slug && slugs.indexOf(currentPost.slug) === -1) {
      slugs.push(currentPost.slug); // an unpublished article of this issue that is open now
    }
    const results = await Promise.all(slugs.map(sl => fetchFullPost(sl).catch(() => null)));
    const posts = results.filter(Boolean);
    const failed = results.length - posts.length;
    if (sel.value !== volume) return; // user switched meanwhile
    if (posts.length === 0) {
      body.innerHTML = '<p class="hint">No articles found for this issue yet.</p>';
      return;
    }
    const { rows, plan } = PrintSpec.summarizeIssue(posts, { mode });
    const fmt = n => (Math.round(n * 10) / 10).toString();
    const tr = rows.map(r => `<tr><td>${escapeHtml(r.title || r.slug)}</td><td class="num">${r.words}</td><td class="num">${mode === 'flow' && r.source !== 'override' ? fmt(r.exact) : r.pages}${r.source === 'override' ? ' <small>set</small>' : ''}</td></tr>`).join('');
    const fillMsg = plan.fillPages === 0
      ? 'The page count is exact. No filler needed.'
      : `${plan.fillPages} page${plan.fillPages === 1 ? '' : 's'} to fill (next-issue preview, puzzle or advert).`;
    const effMsg = plan.efficientInsidePages === plan.insidePages
      ? 'This is already the most economical size.'
      : `The most economical size is ${plan.efficientInsidePages} inside pages (${plan.fillToEfficient} to fill).`;
    body.innerHTML = `
      <div class="planner-totals">
        <div><strong>${plan.insidePages}</strong><span>inside pages</span></div>
        <div><strong>${plan.totalWithCover}</strong><span>with 4 cover pages</span></div>
        <div><strong>${plan.contentPages}</strong><span>pages of content</span></div>
      </div>
      <p class="planner-note">${escapeHtml(fillMsg)} ${escapeHtml(effMsg)}</p>
      <div class="planner-table-wrap"><table class="planner-table">
        <thead><tr><th>Article</th><th class="num">Words</th><th class="num">Pages</th></tr></thead>
        <tbody>${tr}</tbody>
      </table></div>
      ${failed ? `<p class="print-note">${failed} article${failed === 1 ? '' : 's'} could not be loaded and ${failed === 1 ? 'is' : 'are'} not counted.</p>` : ''}`;
  }

  function setupIssuePlanner() {
    if (typeof document === 'undefined') return;
    const btn = $('studio-issue-planner-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const sel = $('planner-issue');
      const options = plannerIssueOptions();
      sel.innerHTML = options.map(([n, t]) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}${t ? ' · ' + escapeHtml(t) : ''}</option>`).join('');
      const current = currentPost && currentPost.issue && currentPost.issue.number;
      if (current && options.some(o => o[0] === current)) sel.value = current;
      openModal('studio-planner-modal');
      renderIssuePlan();
    });
    ['planner-issue', 'planner-mode'].forEach(id => {
      const el = $(id); if (el) el.addEventListener('change', renderIssuePlan);
    });
  }

  function setupPdfUploadModal() {
    const uploadBtn = document.getElementById('studio-upload-pdf-btn');
    const form = document.getElementById('studio-pdf-upload-form');
    const fileInput = document.getElementById('studio-pdf-file-input');
    const volumeInput = document.getElementById('studio-pdf-volume-input');
    const titleInput = document.getElementById('studio-pdf-title-input');
    const publishCheck = document.getElementById('studio-pdf-publish-check');
    const statusMsg = document.getElementById('studio-pdf-status-msg');
    const submitBtn = document.getElementById('studio-pdf-submit-btn');

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        if (!getCapabilities(currentUser).uploadPdf) {
          setStatus(currentUser
            ? 'Uploading issue PDFs needs a founder account.'
            : 'Sign in with a founder account to upload issue PDFs.', 'error');
          if (!currentUser) openModal('studio-auth-modal');
          return;
        }
        setFormMsg(statusMsg, '');
        if (currentPost && currentPost.issue) {
          if (volumeInput && currentPost.issue.number) volumeInput.value = currentPost.issue.number;
          if (titleInput && currentPost.issue.title) titleInput.value = currentPost.issue.title;
        }
        openModal('studio-pdf-modal');
      });
    }

    if (fileInput && volumeInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (file && !volumeInput.value) {
          const match = file.name.match(/(?:vol[-._]?)?(\d{4})[-._](\d{2})/i);
          if (match) {
            volumeInput.value = `Vol. ${match[1]}.${match[2]}`;
          }
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput && fileInput.files && fileInput.files[0];
        const volume = volumeInput ? volumeInput.value.trim() : '';
        const title = titleInput ? titleInput.value.trim() : '';
        const isPublished = publishCheck ? publishCheck.checked : true;

        if (!getCapabilities(currentUser).uploadPdf) {
          setFormMsg(statusMsg, 'Uploading issue PDFs needs a founder account.', 'error');
          return;
        }
        if (!file) {
          setFormMsg(statusMsg, 'Please choose a PDF file.', 'error');
          return;
        }
        if (file.type && file.type !== 'application/pdf') {
          setFormMsg(statusMsg, 'That file is not a PDF.', 'error');
          return;
        }
        if (!volume) {
          setFormMsg(statusMsg, 'Volume number is required (for example Vol. 2026.08).', 'error');
          return;
        }

        const client = Auth ? Auth.getClient() : null;
        if (!client) {
          setFormMsg(statusMsg, 'The content database is not reachable. Reload the page and sign in again.', 'error');
          return;
        }

        const idleLabel = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Uploading…';
        }
        setFormMsg(statusMsg, 'Uploading the PDF to private storage…', 'info');

        try {
          const cleanVolume = volume.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `issues/cosymagazine-${cleanVolume.toLowerCase()}.pdf`;

          const { error: uploadErr } = await client.storage
            .from('magazine-editions')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'application/pdf'
            });
          if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

          setFormMsg(statusMsg, 'PDF uploaded. Registering the issue…', 'info');

          const canonicalId = volume.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          const { error: dbErr } = await client
            .from('magazine_issues')
            .upsert({
              id: canonicalId,
              volume_number: volume,
              title: title || volume,
              pdf_storage_path: storagePath,
              is_published: isPublished
            }, { onConflict: 'id' });

          if (dbErr) {
            // The file is stored but the issue is not registered, so readers will not see it yet.
            console.warn('[Studio] Database sync warning:', dbErr);
            setFormMsg(statusMsg,
              `The PDF was stored at ${storagePath}, but the issue could not be registered (${dbErr.message}). It will not appear on the site until this is fixed.`,
              'warn');
            setStatus('PDF stored, but the issue was not registered.', 'error');
          } else {
            setFormMsg(statusMsg,
              `Uploaded "${file.name}" and ${isPublished ? 'published' : 'saved as a draft'} ${volume}.`,
              'success');
            setStatus(`Uploaded the ${volume} PDF.`, 'success');
          }
        } catch (err) {
          console.error('[Studio] PDF upload error:', err);
          setFormMsg(statusMsg, `Upload failed: ${err.message}`, 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = idleLabel;
          }
        }
      });
    }
  }

  /**
   * Review & publish
   */
  function requestPublish() {
    const caps = getCapabilities(currentUser);
    if (!caps.publishLive) {
      if (!currentUser) {
        setStatus('Sign in with a founder account to publish.', 'info');
        openModal('studio-auth-modal');
      } else {
        setStatus('Publishing needs a founder account. You can still export the JSON.', 'error');
      }
      return;
    }
    if (!currentPost) return;
    renderPublishReview();
    setFormMsg($('studio-publish-msg'), '');
    openModal('studio-publish-modal');
  }

  function renderPublishReview() {
    const checks = getReadiness(currentPost);
    const errors = checks.filter(c => c.level === 'error').length;
    const warns = checks.filter(c => c.level === 'warn').length;
    const standalone = !currentPost.issue;
    const stats = calculateArticleStats(currentPost);

    const rows = [
      ['Title', currentPost.title || '—'],
      ['Page', currentPost.slug ? `/${currentPost.slug}.html` : '—'],
      ['Placement', standalone ? 'Website article' : `${(currentPost.issue && currentPost.issue.number) || '—'} · ${(currentPost.issue && currentPost.issue.title) || '—'}`],
      ['Language', currentPost.language || '—'],
      ['Length', `${stats.words} words · ${stats.minutes} min read`]
    ];
    const summary = $('studio-publish-summary');
    if (summary) {
      summary.innerHTML = rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('');
    }

    const list = $('studio-readiness-list');
    if (list) {
      const iconFor = { ok: 'check-circle', warn: 'alert', error: 'x-circle' };
      list.innerHTML = checks.map(c => `
        <li class="is-${c.level}">
          ${icon(iconFor[c.level])}
          <span><strong>${escapeHtml(c.label)}</strong>${c.detail ? `<small>${escapeHtml(c.detail)}</small>` : ''}</span>
        </li>`).join('');
    }

    const confirmBtn = $('studio-publish-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = errors > 0;
      confirmBtn.title = errors > 0 ? 'Fix the items marked as errors first' : '';
    }
    const msg = $('studio-publish-msg');
    if (msg && errors > 0) {
      setFormMsg(msg, `${errors} item${errors === 1 ? '' : 's'} must be fixed before publishing.`, 'error');
    } else if (msg && warns > 0) {
      setFormMsg(msg, `${warns} suggestion${warns === 1 ? '' : 's'}. You can still publish.`, 'warn');
    }
  }

  function setupPublishFlow() {
    const confirmBtn = $('studio-publish-confirm-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      const idle = confirmBtn.innerHTML;
      confirmBtn.textContent = 'Publishing…';
      const msg = $('studio-publish-msg');
      setFormMsg(msg, 'Saving to the content database…', 'info');
      const ok = await saveToSupabase();
      confirmBtn.innerHTML = idle;
      confirmBtn.disabled = false;
      if (ok) {
        closeModal('studio-publish-modal');
      } else {
        setFormMsg(msg, 'Publishing failed. Your work is still here; check your connection and try again, or download the JSON as a backup.', 'error');
      }
    });
  }

  async function saveToSupabase() {
    if (!currentPost) return false;
    if (!getCapabilities(currentUser).publishLive) {
      setStatus('Publishing needs a founder account.', 'error');
      return false;
    }
    const client = Auth ? Auth.getClient() : null;

    if (!client) {
      setStatus('The content database is not reachable. Reload and sign in again.', 'error');
      return false;
    }

    setStatus('Publishing…', 'info');

    // Publishing makes the article live: stamp status/draft, undo if it fails.
    const before = { status: currentPost.status, draft: currentPost.draft };
    currentPost.status = 'published';
    currentPost.draft = false;
    const revert = () => {
      if (before.status === undefined) delete currentPost.status; else currentPost.status = before.status;
      if (before.draft === undefined) delete currentPost.draft; else currentPost.draft = before.draft;
    };

    try {
      // 1. Try upserting to magazine_article_overrides
      const payload = {
        slug: currentPost.slug,
        post_data: currentPost,
        updated_at: new Date().toISOString()
      };

      const { error } = await client
        .from('magazine_article_overrides')
        .upsert(payload, { onConflict: 'slug' });

      if (error) {
        // Fallback to cms_page_overrides
        const { error: cmsErr } = await client
          .from('cms_page_overrides')
          .upsert({
            page_path: `/${currentPost.slug}.html`,
            overrides: currentPost,
            updated_at: new Date().toISOString()
          }, { onConflict: 'page_path' });

        if (cmsErr) {
          throw cmsErr;
        }
      }

      markClean();
      renderEditorialPanel();
      setStatus(`Published "${currentPost.slug}".`, 'success');
      return true;
    } catch (err) {
      revert();
      console.error('[Studio] Supabase save error:', err);
      setStatus(`Could not publish: ${err.message}`, 'error');
      return false;
    }
  }

  // Reads a File chosen in the import dialog. Resolves once the article is loaded (or rejected).
  function handleFileImport(file) {
    return new Promise((resolve) => {
      if (!file) { resolve(false); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const postData = JSON.parse(event.target.result);
          if (!postData || typeof postData !== 'object' || Array.isArray(postData) || !Array.isArray(postData.blocks)) {
            throw new Error('this does not look like a COSY article (no "blocks" list)');
          }
          setCurrentPost(postData);
          setStatus(`Imported "${file.name}"`, 'success');
          resolve(true);
        } catch (err) {
          setStatus(`Could not import: ${err.message}`, 'error');
          resolve(false);
        }
      };
      reader.onerror = () => {
        setStatus('Could not read that file.', 'error');
        resolve(false);
      };
      reader.readAsText(file);
    });
  }

  function setStatus(msg, type = 'info') {
    if (typeof document === 'undefined') return;
    const bar = document.getElementById('studio-status-bar');
    if (!bar) return;
    bar.textContent = msg;
    bar.className = `studio-status status-${type}`;
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        if (bar.textContent === msg) { bar.textContent = ''; bar.className = 'studio-status'; }
      }, 4500);
    } else if (type === 'error') {
      setTimeout(() => {
        if (bar.textContent === msg) { bar.textContent = ''; bar.className = 'studio-status'; }
      }, 9000);
    }
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    return html;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  // Export module for browser and test environments
  const StudioAPI = {
    init,
    loadPreset,
    loadPostBySlug,
    setCurrentPost,
    addBlock,
    removeBlock,
    moveBlock,
    cloneBlock,
    getCurrentPost: () => currentPost,
    downloadCanonicalJson,
    copyCanonicalJson,
    saveToSupabase,
    getCapabilities,
    getReadiness,
    maxStatusFor,
    setPostStatus,
    setLedgerItem,
    setContentType,
    setPreviewMedium,
    contentTypeOf,
    STATUSES,
    LEDGER_ITEMS,
    calculateArticleStats,
    undoDeleteBlock,
    applyFormatting,
    setConstructorMode,
    getConstructorMode: () => constructorMode,
    setMagazinePart,
    getIsMagazinePart: () => isMagazinePart,
    applyCanonicalSection,
    getManagedIssues: () => managedIssues,
    getActiveIssue: () => activeIssue,
    setActiveIssue: (issue) => { activeIssue = issue; },
    openIssueModal,
    saveIssueFromModal,
    LANGUAGES,
    DESKS,
    LEVELS,
    FORMATS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudioAPI;
  } else {
    window.CosyEditor = StudioAPI;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
