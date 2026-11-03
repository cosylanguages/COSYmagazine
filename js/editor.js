/**
 * js/editor.js
 * Core Controller & Live Gazette Spread Preview Engine for COSYmagazine Studio.
 * Synchronized with SCHEMA.md, scripts/build-blog.js, and Supabase live updates.
 */

(function () {
  'use strict';

  const Blocks = window.CosyEditorBlocks;
  const Auth = window.CosyCMSAuth;

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
    'Cosy Events'
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

  // Active Post State
  let currentPost = null;
  let currentUser = null;
  let catalogPosts = [];

  /**
   * Initialize Studio App
   */
  async function init() {
    setupAuthListeners();
    setupEventListeners();
    await loadCatalogPosts();

    // Check user auth
    if (Auth) {
      currentUser = await Auth.checkAuth();
      updateAuthUI(currentUser);
    }

    // Load initial post from URL parameter, or preset
    const params = new URLSearchParams(window.location.search);
    const postSlug = params.get('slug');
    if (postSlug) {
      await loadPostBySlug(postSlug);
    } else {
      // Default to Saturday Mistakes Preset
      loadPreset('preset-saturday-mistakes');
    }
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

    sel.innerHTML = '<option value="">-- Load an existing article --</option>' +
      posts.map(p => `<option value="${escapeHtml(p.slug)}">${escapeHtml(p.title)} (${p.slug})</option>`).join('');
  }

  async function loadPostBySlug(slug) {
    setStatus(`Loading article "${slug}"...`, 'info');
    try {
      const res = await fetch(`posts/${slug}.json`);
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
    populateMetadataForm(currentPost);
    renderBlockList();
    renderLivePreview();
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
        const modal = document.getElementById('studio-auth-modal');
        if (modal) modal.style.display = 'flex';
      });
    }

    const logoutBtn = document.getElementById('studio-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await Auth.signOut();
        setStatus('Signed out of Studio.', 'info');
      });
    }

    const modalClose = document.getElementById('studio-modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        const modal = document.getElementById('studio-auth-modal');
        if (modal) modal.style.display = 'none';
      });
    }

    const modalForm = document.getElementById('studio-login-form');
    if (modalForm) {
      modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('studio-auth-email').value;
        const pass = document.getElementById('studio-auth-password').value;
        const errEl = document.getElementById('studio-auth-error');
        errEl.textContent = '';

        try {
          await Auth.signIn(email, pass);
          document.getElementById('studio-auth-modal').style.display = 'none';
          setStatus('Founder identity authenticated!', 'success');
        } catch (err) {
          errEl.textContent = err.message || 'Authentication failed.';
        }
      });
    }
  }

  function updateAuthUI(user) {
    const badge = document.getElementById('studio-founder-badge');
    const loginBtn = document.getElementById('studio-login-btn');
    const logoutBtn = document.getElementById('studio-logout-btn');
    const saveLiveBtn = document.getElementById('studio-save-live-btn');

    const isFounder = user && user.isFounder;

    if (badge) {
      if (isFounder) {
        badge.textContent = `👑 Founder (${user.email || 'Admin'})`;
        badge.className = 'studio-badge badge-founder';
        badge.style.display = 'inline-flex';
      } else if (user) {
        badge.textContent = `👤 Logged in (${user.role || 'Member'})`;
        badge.className = 'studio-badge badge-member';
        badge.style.display = 'inline-flex';
      } else {
        badge.textContent = `Visitor (Sign in to publish)`;
        badge.className = 'studio-badge badge-visitor';
        badge.style.display = 'inline-flex';
      }
    }

    if (loginBtn) loginBtn.style.display = isFounder ? 'none' : 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = user ? 'inline-flex' : 'none';
    if (saveLiveBtn) {
      saveLiveBtn.disabled = !isFounder;
      saveLiveBtn.title = isFounder
        ? 'Upsert live changes to Supabase'
        : 'Sign in as Founder to publish live to Supabase';
    }
  }

  /**
   * Form & Workbench Interactions
   */
  function setupEventListeners() {
    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.getAttribute('data-preset'));
      });
    });

    // Existing post selector
    const postSel = document.getElementById('studio-load-selector');
    if (postSel) {
      postSel.addEventListener('change', () => {
        if (postSel.value) loadPostBySlug(postSel.value);
      });
    }

    // Add Block Palette Drawer Toggle
    const addBlockBtn = document.getElementById('studio-add-block-btn');
    const blockPalette = document.getElementById('studio-block-palette');
    if (addBlockBtn && blockPalette) {
      addBlockBtn.addEventListener('click', () => {
        blockPalette.classList.toggle('is-open');
      });
    }

    // Populate Block Palette Buttons
    const paletteGrid = document.getElementById('studio-palette-grid');
    if (paletteGrid) {
      paletteGrid.innerHTML = Blocks.BLOCK_DEFINITIONS.map(def => `
        <button type="button" class="studio-palette-card" data-block-type="${def.type}">
          <span class="palette-card-icon">${def.icon}</span>
          <span class="palette-card-label">${def.label}</span>
          <span class="palette-card-desc">${def.description}</span>
        </button>
      `).join('');

      paletteGrid.querySelectorAll('[data-block-type]').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-block-type');
          addBlock(type);
          if (blockPalette) blockPalette.classList.remove('is-open');
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

    // Save Live to Supabase Button
    const saveLiveBtn = document.getElementById('studio-save-live-btn');
    if (saveLiveBtn) {
      saveLiveBtn.addEventListener('click', saveToSupabase);
    }

    // Import JSON File
    const importInput = document.getElementById('studio-file-import');
    if (importInput) {
      importInput.addEventListener('change', handleFileImport);
    }

    // Metadata form bindings
    bindMetadataInputs();
  }

  function bindMetadataInputs() {
    const bind = (id, key, transform) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        if (!currentPost) return;
        currentPost[key] = transform ? transform(el.value) : el.value;
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
        currentPost.issue = currentPost.issue || {};
        currentPost.issue.number = issueNumEl.value;
        renderLivePreview();
      });
    }

    const issueTitleEl = document.getElementById('meta-issue-title');
    if (issueTitleEl) {
      issueTitleEl.addEventListener('input', () => {
        currentPost.issue = currentPost.issue || {};
        currentPost.issue.title = issueTitleEl.value;
        renderLivePreview();
      });
    }

    // Podcast episode
    const epNumEl = document.getElementById('meta-podcast-ep');
    if (epNumEl) {
      epNumEl.addEventListener('input', () => {
        currentPost.podcast = currentPost.podcast || {};
        currentPost.podcast.episode = parseInt(epNumEl.value, 10) || 1;
        renderLivePreview();
      });
    }
  }

  function populateMetadataForm(post) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    set('meta-title', post.title || '');
    set('meta-slug', post.slug || '');
    set('meta-kicker', post.kicker || '');
    set('meta-dek', post.dek || '');
    set('meta-desk', post.desk || 'Words');
    set('meta-format', post.format || 'essay');
    set('meta-level', post.level || 'A1–A2');
    set('meta-date', post.date || new Date().toISOString().slice(0, 10));
    set('meta-language', post.language || 'en');
    set('meta-reading-time', post.readingTime || 5);
    set('meta-tags', (post.tags || []).join(', '));
    set('meta-issue-number', (post.issue && post.issue.number) || 'Vol. 2026.12');
    set('meta-issue-title', (post.issue && post.issue.title) || 'December Issue');
    set('meta-podcast-ep', (post.podcast && post.podcast.episode) || 1);
  }

  /**
   * Block Management
   */
  function addBlock(type) {
    if (!currentPost) return;
    const newBlock = Blocks.createBlock(type);
    currentPost.blocks = currentPost.blocks || [];
    currentPost.blocks.push(newBlock);
    renderBlockList();
    renderLivePreview();
    setStatus(`Added new ${type} block.`, 'info');
  }

  function removeBlock(index) {
    if (!currentPost || !currentPost.blocks) return;
    currentPost.blocks.splice(index, 1);
    renderBlockList();
    renderLivePreview();
  }

  function moveBlock(index, delta) {
    if (!currentPost || !currentPost.blocks) return;
    const target = index + delta;
    if (target < 0 || target >= currentPost.blocks.length) return;
    const item = currentPost.blocks.splice(index, 1)[0];
    currentPost.blocks.splice(target, 0, item);
    renderBlockList();
    renderLivePreview();
  }

  function cloneBlock(index) {
    if (!currentPost || !currentPost.blocks) return;
    const item = Blocks.clone(currentPost.blocks[index]);
    currentPost.blocks.splice(index + 1, 0, item);
    renderBlockList();
    renderLivePreview();
  }

  /**
   * Render Block Cards in Workbench
   */
  function renderBlockList() {
    const container = document.getElementById('studio-blocks-container');
    if (!container) return;

    if (!currentPost || !currentPost.blocks || currentPost.blocks.length === 0) {
      container.innerHTML = `
        <div class="studio-empty-blocks">
          <p>No content blocks yet. Pick a building block from the toolbox above!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = currentPost.blocks.map((block, index) => {
      const def = Blocks.BLOCK_DEFINITIONS.find(b => b.type === block.type) || {
        icon: '📦',
        label: block.type
      };

      return `
        <div class="studio-block-card" data-index="${index}">
          <div class="studio-block-header">
            <div class="studio-block-drag-title">
              <span class="block-icon">${def.icon}</span>
              <strong class="block-type-name">${def.label}</strong>
              <span class="block-index">#${index + 1}</span>
            </div>
            <div class="studio-block-actions">
              <button type="button" class="action-btn" data-act="up" ${index === 0 ? 'disabled' : ''} title="Move Up">▲</button>
              <button type="button" class="action-btn" data-act="down" ${index === currentPost.blocks.length - 1 ? 'disabled' : ''} title="Move Down">▼</button>
              <button type="button" class="action-btn" data-act="clone" title="Clone Block">📋</button>
              <button type="button" class="action-btn action-danger" data-act="delete" title="Delete Block">✕</button>
            </div>
          </div>
          <div class="studio-block-fields">
            ${renderBlockFields(block, index)}
            <div class="studio-stage-fields">
              <details>
                <summary>🎙️ Teleprompter / Audio Say Script & Beats</summary>
                <div class="form-group" style="margin-top: 8px;">
                  <label>Spoken Narration Script (say):</label>
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

      card.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const act = btn.getAttribute('data-act');
          if (act === 'up') moveBlock(index, -1);
          if (act === 'down') moveBlock(index, 1);
          if (act === 'clone') cloneBlock(index);
          if (act === 'delete') removeBlock(index);
        });
      });

      // Field inputs
      card.querySelectorAll('[data-field]').forEach(input => {
        input.addEventListener('input', () => {
          const field = input.getAttribute('data-field');
          const block = currentPost.blocks[index];
          updateBlockField(block, field, input.value);
          renderLivePreview();
        });
      });
    });
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
            <div class="form-group" style="width: 100px;">
              <label>Level</label>
              <select class="form-control" data-field="level">
                ${[1, 2, 3, 4, 5, 6].map(lvl => `<option value="${lvl}" ${block.level === lvl ? 'selected' : ''}>H${lvl}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Heading Text</label>
              <input type="text" class="form-control" data-field="text" value="${escapeHtml(block.text || '')}">
            </div>
          </div>
        `;

      case 'paragraph':
        return `
          <div class="form-group">
            <label>Paragraph Text (supports **bold**, *italic*, \`code\`):</label>
            <textarea class="form-control" data-field="text" rows="4">${escapeHtml(block.text || '')}</textarea>
          </div>
        `;

      case 'mistake-card':
        return `
          <div class="form-row">
            <div class="form-group" style="width: 100px;">
              <label>Number</label>
              <input type="text" class="form-control" data-field="number" value="${escapeHtml(block.number || '1')}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Mistake Title</label>
              <input type="text" class="form-control" data-field="title" value="${escapeHtml(block.title || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>✗ Wrong Sentence</label>
              <input type="text" class="form-control" data-field="wrong" value="${escapeHtml(block.wrong || '')}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>✓ Right Sentence</label>
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
            <label>More Examples (one per line):</label>
            <textarea class="form-control" data-field="examples" rows="2">${escapeHtml((block.examples || []).join('\n'))}</textarea>
          </div>
        `;

      case 'example':
        return `
          <div class="form-group">
            <label>Target Language Sentence</label>
            <input type="text" class="form-control" data-field="targetText" value="${escapeHtml(block.targetText || '')}">
          </div>
          <div class="form-group">
            <label>Gloss (Monolingual meaning or structural guide)</label>
            <input type="text" class="form-control" data-field="gloss" value="${escapeHtml(block.gloss || '')}">
          </div>
          <div class="form-group">
            <label>Usage Context (optional)</label>
            <input type="text" class="form-control" data-field="context" value="${escapeHtml(block.context || '')}">
          </div>
        `;

      case 'pronunciation':
        return `
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Word / Phrase</label>
              <input type="text" class="form-control" data-field="word" value="${escapeHtml(block.word || '')}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>IPA Transcription</label>
              <input type="text" class="form-control" data-field="ipa" value="${escapeHtml(block.ipa || '')}">
            </div>
          </div>
        `;

      case 'pullquote':
        return `
          <div class="form-group">
            <label>Quote Text</label>
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
            <label>Quiz Question</label>
            <input type="text" class="form-control" data-field="quiz-question" value="${escapeHtml((block.quiz ? block.quiz.question : block.question) || '')}">
          </div>
          <div class="form-group">
            <label>Options (one per line):</label>
            <textarea class="form-control" data-field="quiz-options" rows="3">${escapeHtml(((block.quiz ? block.quiz.options : block.options) || []).join('\n'))}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group" style="width: 150px;">
              <label>Correct Index (0-based)</label>
              <input type="number" class="form-control" data-field="quiz-correct" min="0" max="5" value="${(block.quiz ? block.quiz.correctIndex : block.correctIndex) || 0}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Pedagogical Explanation</label>
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
            <label>Cultural Context Note</label>
            <textarea class="form-control" data-field="content" rows="3">${escapeHtml(block.content || '')}</textarea>
          </div>
        `;

      case 'list-item':
        return `
          <div class="form-group">
            <label>List Items or Phrase Upgrades (e.g. "Overused → Upgrade", one per line):</label>
            <textarea class="form-control" data-field="items" rows="4">${escapeHtml((block.items || []).join('\n'))}</textarea>
          </div>
        `;

      case 'image':
        return `
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Image URL</label>
              <input type="text" class="form-control" data-field="url" value="${escapeHtml(block.url || '')}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Alt Text</label>
              <input type="text" class="form-control" data-field="alt" value="${escapeHtml(block.alt || '')}">
            </div>
          </div>
          <div class="form-group">
            <label>Caption</label>
            <input type="text" class="form-control" data-field="caption" value="${escapeHtml(block.caption || '')}">
          </div>
        `;

      case 'links':
        return `
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Link Label</label>
              <input type="text" class="form-control" data-field="label" value="${escapeHtml(block.label || '')}">
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Target URL</label>
              <input type="text" class="form-control" data-field="url" value="${escapeHtml(block.url || '')}">
            </div>
          </div>
        `;

      default:
        return `<p style="font-size: 0.85rem; color: #64748b;">Block payload configured via JSON export.</p>`;
    }
  }

  /**
   * Live Gazette Spread Rendering Engine
   */
  function renderLivePreview() {
    const previewRoot = document.getElementById('studio-preview-root');
    if (!previewRoot || !currentPost) return;

    let isFirstPara = true;

    const renderedBlocks = (currentPost.blocks || []).map(b => {
      return renderPreviewBlock(b, {
        isFirst: () => {
          if (isFirstPara) {
            isFirstPara = false;
            return true;
          }
          return false;
        }
      });
    }).join('\n');

    const issueText = `${currentPost.issue?.number || 'Vol. 2026.12'} • ${currentPost.issue?.title || 'Editorial Issue'}`;

    previewRoot.innerHTML = `
      <div class="gazette-wrapper gazette-container format-${escapeHtml(currentPost.format || 'essay')}">
        <header class="gazette-masthead">
          <div class="gazette-masthead-top">
            <div class="gazette-masthead-left">
              <span>COSYMAGAZINE</span>
            </div>
            <div class="gazette-masthead-links">
              <span>Preview Mode</span>
            </div>
          </div>
          <div class="gazette-masthead-meta">
            <span>${escapeHtml(issueText)}</span>
            <span class="stamp-sticker">${escapeHtml(currentPost.desk || 'Words')}</span>
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

  function renderPreviewBlock(block, state) {
    if (!block) return '';
    switch (block.type) {
      case 'heading': {
        const lvl = Math.min(6, Math.max(1, block.level || 2));
        return `<h${lvl} class="editorial-heading">${formatMarkdown(block.text || '')}</h${lvl}>`;
      }
      case 'paragraph': {
        const parsed = formatMarkdown(block.text || '');
        if (state.isFirst()) {
          return `<p class="gazette-drop-cap">${parsed}</p>`;
        }
        return `<p>${parsed}</p>`;
      }
      case 'mistake-card': {
        const num = block.number ? String(block.number).padStart(2, '0') : '';
        const L = block.labels || { wrong: 'Not quite', right: 'Say this', why: 'Why it happens', rule: 'The COSY rule' };
        return `
          <article class="mc">
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
          <div class="gazette-example-box">
            <span class="example-target">${formatMarkdown(block.targetText || '')}</span>
            <p class="example-gloss">${formatMarkdown(block.gloss || '')}</p>
            ${block.context ? `<p class="example-context">Context: ${formatMarkdown(block.context)}</p>` : ''}
          </div>
        `;
      }
      case 'pronunciation': {
        return `
          <div class="gazette-pronunciation-card">
            <span class="pronunciation-word">${formatMarkdown(block.word || '')}</span>
            <span class="pronunciation-ipa">[${escapeHtml(block.ipa || '')}]</span>
          </div>
        `;
      }
      case 'pullquote': {
        return `
          <blockquote class="gazette-pullquote">
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
          <div class="gazette-quiz-card">
            <h4 class="quiz-question">❓ ${formatMarkdown(q.question || '')}</h4>
            <div class="quiz-options-list">${opts}</div>
          </div>
        `;
      }
      case 'culture-bite': {
        return `
          <aside class="gazette-marginalia">
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
        return `<div class="format-quote-wall">${quotes}</div>`;
      }
      case 'list-item': {
        const items = block.items || [];
        const isUpgrade = items.some(i => i.includes('→'));
        if (isUpgrade) {
          return `<div class="phrase-upgrade-grid">${items.map(i => `<div class="phrase-upgrade-card">${formatMarkdown(i)}</div>`).join('')}</div>`;
        }
        return `<ul class="editorial-list">${items.map(i => `<li>${formatMarkdown(i)}</li>`).join('')}</ul>`;
      }
      case 'image': {
        return `
          <figure class="gazette-figure">
            <img src="${escapeHtml(block.url || '')}" alt="${escapeHtml(block.alt || '')}" class="gazette-figure-img">
            ${block.caption ? `<figcaption class="gazette-figure-caption">${formatMarkdown(block.caption)}</figcaption>` : ''}
          </figure>
        `;
      }
      case 'links': {
        return `
          <div class="gazette-link-block">
            <a href="${escapeHtml(block.url || '#')}" target="_blank" rel="noopener" class="read-more-link">${formatMarkdown(block.label || 'Link')} ↗</a>
          </div>
        `;
      }
      case 'table': {
        const th = (block.headers || []).map(h => `<th>${formatMarkdown(h)}</th>`).join('');
        const tr = (block.rows || []).map(r => `<tr>${r.map(c => `<td>${formatMarkdown(c)}</td>`).join('')}</tr>`).join('');
        return `
          <div class="table-responsive-container">
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

  async function saveToSupabase() {
    if (!currentPost) return;
    const client = Auth ? Auth.getClient() : null;

    if (!client) {
      setStatus('Supabase client is not available. Please sign in.', 'error');
      return;
    }

    setStatus('Saving article to Supabase...', 'info');

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

      setStatus(`✅ Successfully saved and published "${currentPost.slug}" to Supabase!`, 'success');
    } catch (err) {
      console.error('[Studio] Supabase save error:', err);
      setStatus(`❌ Error saving to Supabase: ${err.message}`, 'error');
    }
  }

  function handleFileImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const postData = JSON.parse(event.target.result);
        setCurrentPost(postData);
        setStatus(`Successfully imported "${file.name}"`, 'success');
      } catch (err) {
        setStatus(`Invalid JSON file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  function setStatus(msg, type = 'info') {
    const bar = document.getElementById('studio-status-bar');
    if (!bar) return;
    bar.textContent = msg;
    bar.className = `studio-status status-${type}`;
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        if (bar.textContent === msg) bar.textContent = '';
      }, 4000);
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
