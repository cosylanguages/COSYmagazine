/**
 * COSYlanguages: Flipbook magazine reader.
 *
 * Every page of the book is the SAME size (3:4, like a real magazine). Content is not counted in blocks:
 * it is poured into a hidden page of the exact reference size and measured, so a page ends where the
 * paper ends. Lists, tables and long paragraphs are split across pages; a heading never ends a page.
 * Spreads are two equal pages; if the page count is odd a colophon page closes the book.
 * The whole book is scaled with CSS (transform) to fit the window, so text size on paper never changes
 * with the screen, only the size of the book does.
 */

(function () {
    'use strict';

    const SVG_NS_FREE = /<(div|table|ul|ol|figure|aside|section|img|audio|button|svg|iframe|blockquote|h[1-6])\b/i;

    const COSYFlipbook = {
        currentPage: 1,
        totalPages: 1,
        pages: [],
        sourceNodes: null,
        kind: null,            // 'spread' | 'single': what the pages are currently paginated for
        mode: 'flipbook',      // 'flipbook' | 'scroll'
        scale: 1,
        turning: null,
        container: null,
        controlsEl: null,
        indicatorEl: null,
        prevBtn: null,
        nextBtn: null,
        selectEl: null,
        progressBarEl: null,
        contentsPopoverEl: null,
        modeToggleBtn: null,
        liveAnnouncerEl: null,
        globalEventsBound: false,

        // Reference page sizes in CSS px (3:4). Text is laid out at this size, then the book is scaled.
        REF: {
            spread: { w: 580, h: 773 },
            single: { w: 440, h: 587 }
        },

        // A two-page spread needs about 520px of text per page (~1200px window).
        SPREAD_MIN_WIDTH: 1200,

        isSingleView: function () {
            return window.innerWidth < this.SPREAD_MIN_WIDTH;
        },

        reducedMotion: function () {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },

        init: function () {
            // Founder card deck listeners (present on both index.html and post pages)
            this.initFounderCards();

            this.container = document.querySelector('.post-full-content');
            if (!this.container) return;

            this.initLiveAnnouncer();
            this.captureSource();
            if (!this.sourceNodes || this.sourceNodes.length < 2) return;

            if (window.COSYDoodles) window.COSYDoodles.ensureFilter();

            const savedMode = (function () {
                try { return localStorage.getItem('cosy_blog_view_mode'); } catch (e) { return null; }
            })();
            if (savedMode === 'scroll' || savedMode === 'flipbook') this.mode = savedMode;

            let requested = 1;
            const hashMatch = window.location.hash.match(/^#page-(\d+)$/);
            if (hashMatch) requested = parseInt(hashMatch[1], 10) || 1;

            this.rebuild(requested);
            if (this.pages.length <= 1) return;

            this.bindGlobalEvents();
            this.initZoomControls();
        },

        initLiveAnnouncer: function () {
            let live = document.getElementById('flipbook-live-announcer');
            if (!live) {
                live = document.createElement('div');
                live.id = 'flipbook-live-announcer';
                live.setAttribute('aria-live', 'polite');
                live.setAttribute('aria-atomic', 'true');
                live.className = 'sr-only';
                live.style.position = 'absolute';
                live.style.width = '1px';
                live.style.height = '1px';
                live.style.overflow = 'hidden';
                live.style.clip = 'rect(0,0,0,0)';
                document.body.appendChild(live);
            }
            this.liveAnnouncerEl = live;
        },

        // ---------------------------------------------------------------------------------------------
        // Source: the article as a flat list of top-level nodes (authors' own <section> wrappers removed)
        // ---------------------------------------------------------------------------------------------
        captureSource: function () {
            const out = [];
            const breakHint = () => {
                const d = document.createElement('div');
                d.className = 'page-break-hint';
                return d;
            };
            // Some articles were authored as hand-made pages: <section class="flipbook-page"> nested in an
            // <article class="post-full-content">. Those wrappers are dissolved; their children flow into the new pages.
            const unwrap = (node) => {
                if (node.nodeType !== 1) {
                    if (node.textContent && node.textContent.trim()) {
                        const p = document.createElement('p');
                        p.textContent = node.textContent.trim();
                        out.push(p);
                    }
                    return;
                }
                const tag = node.tagName.toLowerCase();
                const cl = node.classList;
                if (cl.contains('page-audio-guide')) return; // per-page "audio in production" box of the old pages
                if (tag === 'section' && cl.contains('flipbook-page')) {
                    Array.from(node.childNodes).forEach(unwrap);
                    out.push(breakHint());
                    return;
                }
                if ((tag === 'section' && cl.contains('gazette-page-spread')) || (tag === 'article' && cl.contains('post-full-content'))) {
                    Array.from(node.childNodes).forEach(unwrap);
                    return;
                }
                if (tag === 'p' && !node.children.length && !node.textContent.trim()) return; // empty paragraph left by the parser
                out.push(node);
            };
            Array.from(this.container.childNodes).forEach(unwrap);
            // a page break at the very start or two in a row do nothing
            const nodes = out.filter((n, i) => !(n.classList && n.classList.contains('page-break-hint') &&
                (i === 0 || (out[i - 1].classList && out[i - 1].classList.contains('page-break-hint')))));
            this.sourceNodes = nodes;
            // Pagination consumes nodes, so every layout pass starts from a fresh copy of the article
            this.pristine = nodes.map(n => n.cloneNode(true));
        },

        freshSource: function () {
            return this.pristine.map(n => n.cloneNode(true));
        },

        isHeadingElement: function (el) {
            if (!el || !el.tagName) return false;
            const tag = el.tagName.toLowerCase();
            return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ||
                el.classList.contains('editorial-heading') ||
                el.classList.contains('qa-question') ||
                el.classList.contains('podcast-box-title') ||
                el.classList.contains('quiz-question') ||
                el.classList.contains('fulllist-bar') ||
                el.classList.contains('gazette-marginalia-title');
        },

        // ---------------------------------------------------------------------------------------------
        // Pagination by measurement
        // ---------------------------------------------------------------------------------------------
        createPage: function (n) {
            const sec = document.createElement('section');
            sec.className = 'flipbook-page';
            sec.id = 'page-' + n;
            sec.setAttribute('data-page', n);
            sec.setAttribute('tabindex', '-1');
            const body = document.createElement('div');
            body.className = 'page-body';
            sec.appendChild(body);
            const folio = document.createElement('div');
            folio.className = 'magazine-page-folio';
            folio.innerHTML =
                '<span class="folio-desk-stamp">COSYMAGAZINE</span>' +
                '<span class="folio-num">— ' + n + ' —</span>' +
                '<span class="folio-total"></span>';
            sec.appendChild(folio);
            ['prev', 'next'].forEach(action => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'magazine-dog-ear dog-ear-' + action;
                b.setAttribute('data-action', action);
                sec.appendChild(b);
            });
            return { root: sec, body: body };
        },

        paginate: function (kind) {
            const ref = this.REF[kind];
            const c = this.container;
            c.classList.remove('flipbook-mode', 'scroll-mode', 'mobile-single-view', 'desktop-spread-view');
            c.classList.add('flipbook-3d-stage', 'is-measuring');
            c.style.setProperty('--pg-w', ref.w + 'px');
            c.style.setProperty('--pg-h', ref.h + 'px');
            c.style.transform = 'none';
            c.style.width = ref.w + 'px';
            c.style.height = ref.h + 'px';
            c.style.margin = '0';
            c.innerHTML = '';

            const pages = [];
            let number = 0;
            const newPage = () => {
                number += 1;
                const p = this.createPage(number);
                c.appendChild(p.root);
                pages.push(p);
                return p;
            };
            let cur = newPage();
            const fits = () => cur.body.scrollHeight <= cur.body.clientHeight + 1;
            const nodes = this.freshSource();
            let guard = 0;

            const carryHeadings = () => {
                const carry = [];
                while (cur.body.children.length > 1 && this.isHeadingElement(cur.body.lastElementChild)) {
                    carry.unshift(cur.body.removeChild(cur.body.lastElementChild));
                }
                return carry;
            };

            while (nodes.length && guard++ < 5000) {
                const node = nodes.shift();
                const tag = node.tagName ? node.tagName.toLowerCase() : '';

                if (node.nodeType !== 1) { // stray text nodes: ignore whitespace, keep text
                    if (node.textContent && node.textContent.trim()) {
                        const p = document.createElement('p');
                        p.textContent = node.textContent.trim();
                        nodes.unshift(p);
                    }
                    continue;
                }
                if (tag === 'hr' || node.classList.contains('page-break-hint')) {
                    if (cur.body.children.length) cur = newPage();
                    continue;
                }

                cur.body.appendChild(node);
                if (fits()) continue;
                cur.body.removeChild(node);

                // 1. Split a list / table / grid / long paragraph so the page is filled to the bottom
                const rest = this.fillSplit(node, cur.body, fits);
                if (rest === 'all') continue;
                if (rest) {
                    cur = newPage();
                    nodes.unshift(rest);
                    continue;
                }

                // 2. Nothing fitted: go to a fresh page (taking trailing headings along)
                if (cur.body.children.length > 0) {
                    const carry = carryHeadings();
                    if (cur.body.children.length === 0) {
                        // the page was only headings: keep them here rather than loop
                        carry.forEach(h => cur.body.appendChild(h));
                        cur.body.appendChild(node);
                        this.fitToPage(cur.body, node);
                        cur = newPage();
                        continue;
                    }
                    cur = newPage();
                    nodes.unshift(...carry, node);
                    continue;
                }

                // 3. A single block taller than a page on an empty page: scale it down to fit
                cur.body.appendChild(node);
                this.fitToPage(cur.body, node);
                cur = newPage();
            }

            // drop a trailing empty page
            if (pages.length > 1 && pages[pages.length - 1].body.children.length === 0) {
                const last = pages.pop();
                c.removeChild(last.root);
            }
            this.pages = pages.map(p => p.root);
            this.pageBodies = pages.map(p => p.body);
        },

        // Shrinks a block that is taller than one page so it still sits inside the paper.
        fitToPage: function (body, node) {
            const avail = body.clientHeight;
            const need = node.getBoundingClientRect().height;
            if (need > avail && avail > 0) {
                const z = Math.max(0.55, (avail - 4) / need);
                node.style.zoom = z.toFixed(3);
            }
        },

        // Returns 'all' (everything fitted), a remainder element (some part fitted) or null (nothing fitted)
        fillSplit: function (node, body, fits) {
            const tag = node.tagName.toLowerCase();
            let spec = null;

            if (tag === 'ul' || tag === 'ol') {
                spec = {
                    items: Array.from(node.children),
                    origHost: node,
                    shell: () => {
                        const s = node.cloneNode(false);
                        return { root: s, host: s };
                    },
                    after: (shell, placed) => {
                        if (tag === 'ol') {
                            const start = parseInt(node.getAttribute('start') || '1', 10) || 1;
                            shell.root.setAttribute('start', String(start + placed));
                        }
                    }
                };
            } else if (node.classList.contains('table-responsive-container') || tag === 'table') {
                const table = tag === 'table' ? node : node.querySelector('table');
                if (table) {
                    const tbody = table.tBodies[0] || table;
                    const rows = Array.from(tbody.children).filter(r => r.tagName.toLowerCase() === 'tr');
                    if (rows.length > 1) {
                        spec = {
                            items: rows,
                            origHost: tbody,
                            shell: () => {
                                const t = table.cloneNode(false);
                                if (table.caption) t.appendChild(table.caption.cloneNode(true));
                                if (table.tHead) t.appendChild(table.tHead.cloneNode(true));
                                const tb = document.createElement('tbody');
                                t.appendChild(tb);
                                if (tag === 'table') return { root: t, host: tb };
                                const w = node.cloneNode(false);
                                w.appendChild(t);
                                return { root: w, host: tb };
                            }
                        };
                    }
                }
            } else if (node.classList.contains('phrase-upgrade-grid')) {
                spec = {
                    items: Array.from(node.children),
                    origHost: node,
                    shell: () => { const s = node.cloneNode(false); return { root: s, host: s }; }
                };
            } else if (node.classList.contains('instead-try-spread')) {
                const headers = node.querySelector('.instead-try-headers');
                const bodyEl = node.querySelector('.instead-try-body');
                const rows = bodyEl ? Array.from(bodyEl.querySelectorAll('.instead-try-row')) : [];
                if (rows.length > 1) {
                    spec = {
                        items: rows,
                        origHost: bodyEl,
                        shell: () => {
                            const s = node.cloneNode(false);
                            if (headers) s.appendChild(headers.cloneNode(true));
                            const b = bodyEl.cloneNode(false);
                            s.appendChild(b);
                            return { root: s, host: b };
                        }
                    };
                }
            } else if (tag === 'p') {
                return this.splitParagraph(node, body, fits);
            } else if (['div', 'section', 'aside', 'article', 'blockquote', 'details', 'figure'].includes(tag) &&
                       !node.classList.contains('gazette-quiz-card') && !node.classList.contains('mc-sides')) {
                // A wrapper (card, section, callout): flow its children over the pages
                const kids = Array.from(node.children).filter(k => k.tagName.toLowerCase() !== 'script' && k.tagName.toLowerCase() !== 'style');
                const INLINE = ['span', 'a', 'strong', 'em', 'b', 'i', 'mark', 'code', 'small', 'sup', 'sub', 'br', 'img', 'svg', 'label', 'button', 'input', 'audio', 'select', 'u', 's', 'abbr', 'cite', 'time'];
                const onlyElements = Array.from(node.childNodes).every(n => n.nodeType === 1 || !n.textContent.trim());
                const hasBlockKid = kids.some(k => !INLINE.includes(k.tagName.toLowerCase()));
                if (kids.length >= 1 && kids.length === node.children.length && onlyElements && hasBlockKid) {
                    spec = {
                        items: kids,
                        origHost: node,
                        container: true,
                        shell: () => { const s = node.cloneNode(false); s.removeAttribute('id'); return { root: s, host: s }; }
                    };
                }
            }

            if (!spec || (!spec.container && spec.items.length < 2)) return null;

            const shell = spec.shell();
            body.appendChild(shell.root);
            let placed = 0;
            let partial = null;
            for (let i = 0; i < spec.items.length; i++) {
                const item = spec.items[i];
                shell.host.appendChild(item);
                if (fits()) { placed += 1; continue; }
                shell.host.removeChild(item);
                // wrappers: try to split the child itself (e.g. a long list inside a card)
                if (spec.container) {
                    const r = this.fillSplit(item, shell.host, fits);
                    if (r === 'all') { placed += 1; continue; }
                    if (r) { partial = r; placed += 1; break; }
                }
                break;
            }
            if (placed === 0) {
                body.removeChild(shell.root);
                // put the items back, in order, so the caller can retry on a fresh page
                spec.items.forEach(it => spec.origHost.appendChild(it));
                return null;
            }
            if (placed === spec.items.length && !partial) return 'all';

            const remainder = spec.shell();
            if (partial) remainder.host.appendChild(partial);
            spec.items.slice(placed).forEach(it => remainder.host.appendChild(it));
            if (spec.after) spec.after(remainder, placed);
            remainder.root.classList.add('is-continued');
            return remainder.root;
        },

        // Splits a long paragraph at a word boundary (inline markup is closed and re-opened across the break).
        splitParagraph: function (p, body, fits) {
            if (SVG_NS_FREE.test(p.innerHTML)) return null;
            const tokens = p.innerHTML.match(/<[^>]+>|[^<\s]+\s*|\s+/g) || [];
            const wordPos = [];
            tokens.forEach((t, i) => { if (t[0] !== '<' && t.trim()) wordPos.push(i); });
            if (wordPos.length < 40) return null;

            const build = (n) => {
                const cut = n >= wordPos.length ? tokens.length : wordPos[n];
                const stack = [];
                for (let i = 0; i < cut; i++) {
                    const t = tokens[i];
                    if (t[0] !== '<') continue;
                    if (/^<\//.test(t)) stack.pop();
                    else if (!/\/>$/.test(t) && !/^<(br|hr|img|wbr)\b/i.test(t)) stack.push(t);
                }
                const closeTags = stack.slice().reverse().map(t => '</' + t.match(/^<([a-z0-9]+)/i)[1] + '>').join('');
                return {
                    head: tokens.slice(0, cut).join('') + closeTags,
                    tail: stack.join('') + tokens.slice(cut).join('')
                };
            };

            const probe = p.cloneNode(false);
            probe.classList.remove('gazette-drop-cap');
            body.appendChild(probe);
            let lo = 0, hi = wordPos.length - 8, best = 0;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                probe.innerHTML = build(mid).head;
                if (fits()) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
            }
            body.removeChild(probe);
            if (best < 12) return null;

            const parts = build(best);
            const first = p.cloneNode(false);
            first.innerHTML = parts.head;
            body.appendChild(first);
            const tail = p.cloneNode(false);
            tail.classList.remove('gazette-drop-cap');
            tail.classList.add('p-cont');
            tail.innerHTML = parts.tail;
            return tail;
        },

        // ---------------------------------------------------------------------------------------------
        // Building the book
        // ---------------------------------------------------------------------------------------------
        theme: function () {
            return (document.body.dataset && document.body.dataset.issue) || 'other';
        },

        // Adds the closing colophon page when a spread would otherwise end on a single page
        addColophon: function () {
            const n = this.pages.length + 1;
            const page = this.createPage(n);
            page.root.classList.add('page-end');
            const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
            const bye = { en: 'Until the next issue', fr: 'À bientôt, dans le prochain numéro', it: 'Alla prossima uscita', ru: 'До встречи в следующем номере', el: 'Τα λέμε στο επόμενο τεύχος' }[lang] || 'Until the next issue';
            const issue = document.body.dataset.issueLabel || '';
            page.body.innerHTML =
                '<div class="colophon">' +
                '<p class="colophon-kicker">COSYMAGAZINE</p>' +
                '<p class="colophon-title">' + bye + '</p>' +
                (issue ? '<p class="colophon-issue">' + issue + '</p>' : '') +
                '<p class="colophon-note">cosylanguages.github.io/COSYmagazine</p>' +
                '</div>';
            this.container.appendChild(page.root);
            this.pages.push(page.root);
            this.pageBodies.push(page.body);
        },

        // Fills the empty bottom of short pages with a doodle (and a handwritten note) so no page looks unfinished
        addFillers: function (kind) {
            if (!window.COSYDoodles) return;
            const theme = this.theme();
            const lang = document.documentElement.lang || 'en';
            const minGap = kind === 'spread' ? 150 : 120;
            this.pageBodies.forEach((body, i) => {
                const page = this.pages[i];
                if (page.classList.contains('page-end')) return;
                const last = body.lastElementChild;
                if (!last) return;
                const gap = body.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom;
                if (gap >= minGap) {
                    const holder = document.createElement('div');
                    holder.innerHTML = window.COSYDoodles.filler(theme, (document.body.dataset.slug || 'cosy') + ':' + (i + 1), lang);
                    const filler = holder.firstChild;
                    filler.style.maxHeight = Math.max(60, gap - 18) + 'px';
                    body.appendChild(filler);
                }
            });
        },

        finalizeFurniture: function () {
            const total = this.pages.length;
            this.totalPages = total;
            const issue = document.body.dataset.issueLabel || 'COSYMAGAZINE';
            this.pages.forEach((page, idx) => {
                const n = idx + 1;
                page.setAttribute('aria-label', 'Page ' + n + ' of ' + total);
                const t = page.querySelector('.folio-total');
                if (t) t.textContent = 'OF ' + total;
                const d = page.querySelector('.folio-desk-stamp');
                if (d) d.textContent = issue;
                page.classList.toggle('is-last-page', n === total);
                const prev = page.querySelector('.dog-ear-prev');
                const next = page.querySelector('.dog-ear-next');
                if (prev) {
                    prev.setAttribute('aria-label', 'Previous page');
                    prev.innerHTML = '<span class="dog-ear-fold"></span><span class="dog-ear-label">← ' + n + '</span>';
                }
                if (next) {
                    next.setAttribute('aria-label', 'Turn the page');
                    next.innerHTML = '<span class="dog-ear-fold"></span><span class="dog-ear-label">' + n + ' →</span>';
                }
            });
        },

        // (Re)paginates for the current window and renders controls. `requestedPage` keeps the reader's place.
        rebuild: function (requestedPage) {
            const kind = this.isSingleView() ? 'single' : 'spread';
            const oldTotal = this.totalPages || 1;
            const oldPage = this.currentPage || 1;

            this.paginate(kind);
            if (this.pages.length <= 1) {
                // Too short to be a book: put the article back as it was
                this.container.classList.remove('is-measuring', 'flipbook-3d-stage');
                ['transform', 'width', 'height', 'margin'].forEach(k => { this.container.style[k] = ''; });
                this.container.innerHTML = '';
                this.freshSource().forEach(n => this.container.appendChild(n));
                return;
            }
            if (kind === 'spread' && this.pages.length % 2 === 1) this.addColophon();
            this.addFillers(kind);
            this.finalizeFurniture();
            this.kind = kind;

            if (!requestedPage) {
                requestedPage = Math.max(1, Math.round((oldPage / oldTotal) * this.totalPages));
            }
            this.currentPage = Math.min(Math.max(1, requestedPage), this.totalPages);

            if (this.controlsEl && this.controlsEl.parentNode) this.controlsEl.parentNode.removeChild(this.controlsEl);
            this.renderControls();
            this.bindControlEvents();

            document.body.classList.add('has-book');
            this.container.classList.remove('is-measuring');
            this.container.classList.add('flipbook-3d-stage', kind === 'single' ? 'mobile-single-view' : 'desktop-spread-view');
            this.applyMode();
            this.showPage(this.currentPage, false);
        },

        // Fit the (fixed-size) book to the window
        fitBook: function () {
            const c = this.container;
            if (!c || this.mode !== 'flipbook' || !this.kind) return;
            const ref = this.REF[this.kind];
            const pagesAcross = this.kind === 'spread' ? 2 : 1;
            const bookW = ref.w * pagesAcross;
            const parent = c.parentElement;
            const parentW = parent ? parent.clientWidth : window.innerWidth;
            // The book may be wider than the text column: use the window, not the column
            const availW = Math.max(280, Math.min(window.innerWidth - 32, 1500));
            const toolbarH = this.controlsEl ? this.controlsEl.offsetHeight : 80;
            const availH = Math.max(480, window.innerHeight - toolbarH - 28);
            let s = Math.min(availW / bookW, availH / ref.h, this.kind === 'spread' ? 1.15 : 1.3);
            s = Math.max(0.3, s);
            this.scale = s;
            c.style.setProperty('--pg-w', ref.w + 'px');
            c.style.setProperty('--pg-h', ref.h + 'px');
            c.style.width = bookW + 'px';
            c.style.height = ref.h + 'px';
            c.style.transformOrigin = 'top left';
            c.style.transform = 'scale(' + s.toFixed(4) + ')';
            c.style.marginLeft = ((parentW - bookW * s) / 2) + 'px';
            c.style.marginRight = '0';
            c.style.marginTop = '0';
            c.style.marginBottom = (ref.h * (s - 1)) + 'px';
        },

        getI18n: function () {
            const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
            const dict = {
                en: { prev: 'PREV', next: 'NEXT', contents: 'CONTENTS', flatScroll: 'FLAT SCROLL', magazineSpread: 'MAGAZINE SPREAD', pageXofY: 'PAGE {current} OF {total}', turn: 'Turn ↗', back: '← Back', prevPage: 'Previous page', nextPage: 'Turn the page', tableOfContents: 'Table of Contents' },
                fr: { prev: 'PRÉC', next: 'SUIV', contents: 'SOMMAIRE', flatScroll: 'PAGE UNIQUE', magazineSpread: 'MODE MAGAZINE', pageXofY: 'PAGE {current} SUR {total}', turn: 'Tourner ↗', back: '← Retour', prevPage: 'Page précédente', nextPage: 'Tourner la page', tableOfContents: 'Sommaire' },
                it: { prev: 'PREC', next: 'SUCC', contents: 'INDICE', flatScroll: 'PAGINA SINGOLA', magazineSpread: 'MODALITÀ RIVISTA', pageXofY: 'PAGINA {current} DI {total}', turn: 'Sfoglia ↗', back: '← Indietro', prevPage: 'Pagina precedente', nextPage: 'Sfoglia pagina', tableOfContents: 'Indice' },
                ru: { prev: 'НАЗАД', next: 'ДАЛЕЕ', contents: 'СОДЕРЖАНИЕ', flatScroll: 'ОДНА СТРАНИЦА', magazineSpread: 'ЖУРНАЛ', pageXofY: 'СТРАНИЦА {current} ИЗ {total}', turn: 'Листать ↗', back: '← Назад', prevPage: 'Предыдущая страница', nextPage: 'Следующая страница', tableOfContents: 'Содержание' },
                el: { prev: 'ΠΡΟΗΓ', next: 'ΕΠΟΜ', contents: 'ΠΕΡΙΕΧΟΜΕΝΑ', flatScroll: 'ΜΟΝΗ ΣΕΛΙΔΑ', magazineSpread: 'ΠΕΡΙΟΔΙΚΟ', pageXofY: 'ΣΕΛΙΔΑ {current} ΑΠΟ {total}', turn: 'Επόμενο ↗', back: '← Πίσω', prevPage: 'Προηγούμενη σελίδα', nextPage: 'Επόμενη σελίδα', tableOfContents: 'Περιεχόμενα' },
                es: { prev: 'ANT', next: 'SIG', contents: 'ÍNDICE', flatScroll: 'PÁGINA ÚNICA', magazineSpread: 'MODO REVISTA', pageXofY: 'PÁGINA {current} DE {total}', turn: 'Pasar ↗', back: '← Volver', prevPage: 'Página anterior', nextPage: 'Pasar página', tableOfContents: 'Índice de contenidos' },
                de: { prev: 'ZURÜCK', next: 'WEITER', contents: 'INHALT', flatScroll: 'EINZELSEITE', magazineSpread: 'MAGAZIN', pageXofY: 'SEITE {current} VON {total}', turn: 'Umblättern ↗', back: '← Zurück', prevPage: 'Vorherige Seite', nextPage: 'Nächste Seite', tableOfContents: 'Inhaltsverzeichnis' },
                pt: { prev: 'ANT', next: 'PRÓX', contents: 'ÍNDICE', flatScroll: 'PÁGINA ÚNICA', magazineSpread: 'MODO REVISTA', pageXofY: 'PÁGINA {current} DE {total}', turn: 'Virar ↗', back: '← Voltar', prevPage: 'Página anterior', nextPage: 'Próxima página', tableOfContents: 'Índice de conteúdos' },
                hy: { prev: 'ՆԱԽ', next: 'ՀԱՋ', contents: 'ԲՈՎԱՆԴԱԿՈՒԹՅՈՒՆ', flatScroll: 'ՄԵԿ ԷՋ', magazineSpread: 'ԱՄՍԱԳԻՐ', pageXofY: 'ԷՋ {current} / {total}', turn: 'Թերթել ↗', back: '← Ետ', prevPage: 'Նախորդ էջ', nextPage: 'Հաջորդ էջ', tableOfContents: 'Բովանդակություն' },
                ka: { prev: 'წინა', next: 'შემდეგ', contents: 'შინაარსი', flatScroll: 'ერთ გვერდზე', magazineSpread: 'ჟურნალი', pageXofY: 'გვერდი {current} / {total}', turn: 'გადაფურცვლა ↗', back: '← უკან', prevPage: 'წინა გვერდი', nextPage: 'შემდეგი გვერდი', tableOfContents: 'სარჩევი' },
                tt: { prev: 'АЛДЫНГЫ', next: 'КИЛӘСӘК', contents: 'ЭЧТӘЛЕК', flatScroll: 'БЕР БИТ', magazineSpread: 'ЖУРНАЛ', pageXofY: 'БИТ {current} / {total}', turn: 'Актару ↗', back: '← Иртәгә', prevPage: 'Алдагы бит', nextPage: 'Киләсе бит', tableOfContents: 'Эчтәлек' },
                ba: { prev: 'АЛДАН', next: 'КИЛӘҺЕ', contents: 'ХӘБӘРҘӘР', flatScroll: 'БЕР БИТ', magazineSpread: 'ЖУРНАЛ', pageXofY: 'БИТ {current} / {total}', turn: 'Аҡтарыу ↗', back: '← Ҡайтыу', prevPage: 'Алдағы бит', nextPage: 'Киләһе бит', tableOfContents: 'Эстәлек' },
                br: { prev: 'KENT', next: 'GOUDE', contents: 'TAOLENN', flatScroll: 'PAJENN UNAN', magazineSpread: 'KAZETENN', pageXofY: 'PAJENN {current} EUS {total}', turn: 'Treiñ ↗', back: '← En-dro', prevPage: 'Pajenn gent', nextPage: 'Pajenn goude', tableOfContents: 'Taolenn' },
                cv: { prev: 'АННӐ', next: 'ТЕПРЕ', contents: 'ФОНД', flatScroll: 'ПӖР ПАЖА', magazineSpread: 'ЖУРНАЛ', pageXofY: 'ПАЖА {current} / {total}', turn: 'Ҫавӑр ↗', back: '← Каялла', prevPage: 'Аннӑ пажа', nextPage: 'Тепре пажа', tableOfContents: 'Фонд' }
            };
            return dict[lang] || dict.en;
        },

        renderControls: function () {
            const i18n = this.getI18n();
            const wrapper = document.createElement('div');
            wrapper.className = 'flipbook-toolbar magazine-furniture-bar';
            wrapper.setAttribute('aria-label', 'Magazine Reading Furniture');

            const pageIndicatorText = i18n.pageXofY.replace('{current}', '1').replace('{total}', this.totalPages);

            wrapper.innerHTML = `
                <div class="magazine-furniture-container">
                    <div class="magazine-progress-rule" role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="${this.totalPages}">
                        <div class="progress-rule-fill" style="width: ${(1 / this.totalPages) * 100}%;"></div>
                    </div>

                    <div class="magazine-furniture-row">
                        <div class="magazine-furniture-left">
                            <button type="button" class="magazine-nav-btn flipbook-prev-btn" aria-label="${i18n.prevPage}">
                                <span class="nav-arrow">←</span>
                                <span class="nav-text">${i18n.prev}</span>
                            </button>
                            <span class="magazine-folio-counter">
                                <span class="flipbook-indicator">${pageIndicatorText}</span>
                            </span>
                            <button type="button" class="magazine-nav-btn flipbook-next-btn" aria-label="${i18n.nextPage}">
                                <span class="nav-text">${i18n.next}</span>
                                <span class="nav-arrow">→</span>
                            </button>
                        </div>

                        <div class="magazine-furniture-right">
                            <div class="contents-popover-wrapper">
                                <button type="button" class="magazine-contents-trigger" aria-expanded="false" aria-controls="magazine-contents-menu" aria-label="${i18n.tableOfContents}">
                                    <span class="contents-icon">📖</span>
                                    <span class="contents-label">${i18n.contents}</span>
                                </button>
                                <div id="magazine-contents-menu" class="magazine-contents-popover" hidden>
                                    <div class="contents-popover-header">
                                        <span>${i18n.contents}</span>
                                        <button type="button" class="contents-close-btn" aria-label="Close Table of Contents">✕</button>
                                    </div>
                                    <ul class="contents-list">
                                        ${this.pages.map((p, i) => {
                                            const heading = p.querySelector('h2, h3, h4, .editorial-heading')?.textContent || `Page ${i + 1}`;
                                            const shortTitle = heading.length > 35 ? heading.substring(0, 35) + '…' : heading;
                                            return `
                                                <li>
                                                    <button type="button" class="contents-item-btn" data-page="${i + 1}">
                                                        <span class="item-page-num">${i + 1}.</span>
                                                        <span class="item-title">${shortTitle}</span>
                                                    </button>
                                                </li>
                                            `;
                                        }).join('')}
                                    </ul>
                                </div>
                            </div>

                            <select class="flipbook-select sr-only" aria-label="${i18n.tableOfContents}">
                                ${this.pages.map((p, i) => {
                                    const heading = p.querySelector('h2, h3, h4, .editorial-heading')?.textContent || `Page ${i + 1}`;
                                    const shortTitle = heading.length > 30 ? heading.substring(0, 30) + '…' : heading;
                                    return `<option value="${i + 1}">Page ${i + 1}: ${shortTitle}</option>`;
                                }).join('')}
                            </select>

                            <button type="button" class="magazine-mode-toggle flipbook-mode-toggle" aria-label="Toggle Read as One Page or Flipbook View">
                                <span class="mode-icon">📜</span>
                                <span class="mode-label">${i18n.flatScroll}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            this.container.parentNode.insertBefore(wrapper, this.container);

            this.controlsEl = wrapper;
            this.prevBtn = wrapper.querySelector('.flipbook-prev-btn');
            this.nextBtn = wrapper.querySelector('.flipbook-next-btn');
            this.indicatorEl = wrapper.querySelector('.flipbook-indicator');
            this.selectEl = wrapper.querySelector('.flipbook-select');
            this.progressBarEl = wrapper.querySelector('.progress-rule-fill');
            this.contentsPopoverEl = wrapper.querySelector('#magazine-contents-menu');
            this.modeToggleBtn = wrapper.querySelector('.flipbook-mode-toggle');
        },

        initFounderCards: function () {
            const cards = document.querySelectorAll('.founder-presentation-card');
            cards.forEach(card => {
                const header = card.querySelector('.founder-card-header');
                const expandBtn = card.querySelector('.founder-expand-btn');
                const podcastBtn = card.querySelector('.podcast-mode-btn');

                const toggleExpand = () => {
                    const isExpanded = card.classList.toggle('expanded');
                    if (expandBtn) {
                        expandBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                        expandBtn.innerHTML = isExpanded
                            ? '<span>🎙️ Collapse Founder Deck</span>'
                            : '<span>🎙️ Expand Founder Deck</span>';
                    }
                };

                if (header) {
                    header.addEventListener('click', (e) => {
                        if (e.target.closest('.podcast-mode-btn')) return;
                        toggleExpand();
                    });
                }

                if (podcastBtn) {
                    podcastBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.togglePodcastMode();
                    });
                }
            });
        },

        togglePodcastMode: function () {
            const isPodcast = document.body.classList.toggle('podcast-presentation-mode');
            const podcastBtn = document.querySelector('.podcast-mode-btn');
            if (podcastBtn) {
                podcastBtn.innerHTML = isPodcast
                    ? '<span>📺 Exit Podcast View</span>'
                    : '<span>🎙️ Podcast View Mode</span>';
            }
        },

        initZoomControls: function () {
            let overlay = document.querySelector('.zoom-focus-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'zoom-focus-overlay';
                document.body.appendChild(overlay);
            }

            let currentZoomedSection = null;

            const closeZoom = () => {
                if (currentZoomedSection) {
                    currentZoomedSection.classList.remove('zoomed-in', 'focal-zoomed');
                    currentZoomedSection.style.transform = '';
                    const parentContainer = currentZoomedSection.closest('.post-full-content') || document.querySelector('.post-full-content');
                    if (parentContainer) parentContainer.classList.remove('section-is-zoomed');
                    const toolbar = currentZoomedSection.querySelector('.zoom-controls-toolbar');
                    if (toolbar) toolbar.remove();
                    currentZoomedSection = null;
                }
                overlay.classList.remove('active');
            };

            const zoomSection = (sec) => {
                if (currentZoomedSection === sec) return;
                if (currentZoomedSection) closeZoom();

                currentZoomedSection = sec;
                sec.classList.add('focal-zoomed');
                const parentContainer = sec.closest('.post-full-content') || document.querySelector('.post-full-content');
                if (parentContainer) parentContainer.classList.add('section-is-zoomed');
            };

            overlay.addEventListener('click', closeZoom);
        },

        // ---------------------------------------------------------------------------------------------
        // Events
        // ---------------------------------------------------------------------------------------------
        bindControlEvents: function () {
            if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevPage());
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextPage());
            if (this.selectEl) {
                this.selectEl.addEventListener('change', (e) => {
                    const p = parseInt(e.target.value, 10);
                    if (!isNaN(p)) this.showPage(p);
                });
            }
            if (this.modeToggleBtn) this.modeToggleBtn.addEventListener('click', () => this.toggleMode());

            const triggerBtn = this.controlsEl && this.controlsEl.querySelector('.magazine-contents-trigger');
            const closeBtn = this.controlsEl && this.controlsEl.querySelector('.contents-close-btn');
            if (triggerBtn && this.contentsPopoverEl) {
                const popover = this.contentsPopoverEl;
                const closePop = () => {
                    popover.setAttribute('hidden', '');
                    triggerBtn.setAttribute('aria-expanded', 'false');
                };
                triggerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (popover.hasAttribute('hidden')) {
                        popover.removeAttribute('hidden');
                        triggerBtn.setAttribute('aria-expanded', 'true');
                    } else {
                        closePop();
                    }
                });
                if (closeBtn) closeBtn.addEventListener('click', closePop);
                document.addEventListener('click', (e) => {
                    if (!popover.isConnected) return;
                    if (!popover.contains(e.target) && !triggerBtn.contains(e.target)) closePop();
                });
                popover.querySelectorAll('.contents-item-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const pageNum = parseInt(btn.getAttribute('data-page'), 10);
                        if (!isNaN(pageNum)) {
                            this.showPage(pageNum);
                            closePop();
                        }
                    });
                });
            }
        },

        bindGlobalEvents: function () {
            if (this.globalEventsBound) return;
            this.globalEventsBound = true;

            // Corner dog-ears and clicks near the outer edges turn the page
            this.container.addEventListener('click', (e) => {
                const ear = e.target.closest('.magazine-dog-ear');
                if (ear) {
                    e.stopPropagation();
                    if (ear.getAttribute('data-action') === 'prev') this.prevPage(); else this.nextPage();
                    return;
                }
                if (this.mode !== 'flipbook') return;
                if (e.target.closest('a, button, audio, select, input, details, summary, label, .gazette-quiz-card')) return;
                const rect = this.container.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                if (clickX < rect.width * 0.12) this.prevPage();
                else if (clickX > rect.width * 0.88) this.nextPage();
            });

            window.addEventListener('hashchange', () => {
                const match = window.location.hash.match(/^#page-(\d+)$/);
                if (match) {
                    const p = parseInt(match[1], 10);
                    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) this.showPage(p, false, false);
                } else if (!window.location.hash || window.location.hash === '#') {
                    if (this.currentPage !== 1) this.showPage(1, false, false);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
                if (this.mode !== 'flipbook') return;
                if (e.key === 'ArrowLeft' || e.key === 'PageUp') this.prevPage();
                else if (e.key === 'ArrowRight' || e.key === 'PageDown') this.nextPage();
                else if (e.key === 'Escape' && this.contentsPopoverEl && !this.contentsPopoverEl.hasAttribute('hidden')) {
                    this.contentsPopoverEl.setAttribute('hidden', '');
                }
            });

            let startX = 0, startY = 0;
            this.container.addEventListener('touchstart', (e) => {
                if (this.mode !== 'flipbook') return;
                if (e.touches.length === 1) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
            }, { passive: true });
            this.container.addEventListener('touchend', (e) => {
                if (this.mode !== 'flipbook' || !startX) return;
                const diffX = startX - e.changedTouches[0].clientX;
                const diffY = startY - e.changedTouches[0].clientY;
                if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0) this.nextPage(); else this.prevPage();
                }
                startX = 0; startY = 0;
            }, { passive: true });

            // Resizing only rescales the book; crossing the spread breakpoint repaginates
            let resizeTimer = null;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    const want = this.isSingleView() ? 'single' : 'spread';
                    if (want !== this.kind) {
                        this.finishTurn();
                        this.rebuild(0);
                    } else {
                        this.fitBook();
                    }
                }, 120);
            });
            window.addEventListener('load', () => this.fitBook());
            if (document.fonts && document.fonts.ready) {
                // web fonts change line breaks: measure again once they have loaded
                document.fonts.ready.then(() => {
                    if (this.fontsRepaginated) return;
                    this.fontsRepaginated = true;
                    this.finishTurn();
                    this.rebuild(this.currentPage);
                });
            }
        },

        // ---------------------------------------------------------------------------------------------
        // Showing pages
        // ---------------------------------------------------------------------------------------------
        leftOfSpread: function (pageIndex) {
            return pageIndex % 2 === 0 ? pageIndex - 1 : pageIndex;
        },

        applyVisible: function (visible) {
            // visible: [{n, side}] where side is 'left' | 'right' | 'only'
            this.pages.forEach((p, idx) => {
                const n = idx + 1;
                const v = visible.find(x => x.n === n);
                p.classList.remove('active', 'spread-left', 'spread-right');
                if (v) {
                    p.classList.add('active');
                    if (v.side === 'left') p.classList.add('spread-left');
                    if (v.side === 'right') p.classList.add('spread-right');
                    p.style.display = '';
                } else {
                    p.style.display = 'none';
                }
            });
        },

        showPage: function (pageIndex, updateHistory, animate) {
            if (updateHistory === undefined) updateHistory = true;
            if (animate === undefined) animate = true;
            if (pageIndex < 1) pageIndex = 1;
            if (pageIndex > this.totalPages) pageIndex = this.totalPages;

            const spread = this.kind === 'spread';
            if (this.mode === 'flipbook' && spread) pageIndex = this.leftOfSpread(pageIndex);

            const previous = this.currentPage;
            this.finishTurn();
            this.currentPage = pageIndex;

            if (this.mode === 'flipbook') {
                this.fitBook();
                if (spread) {
                    const canTurn = animate && !this.reducedMotion() && Math.abs(pageIndex - previous) === 2 &&
                        this.pages[previous - 1] && this.pages[pageIndex - 1] && this.container.classList.contains('flipbook-mode');
                    if (canTurn) this.turnLeaf(previous, pageIndex);
                    else this.applyVisible([{ n: pageIndex, side: 'left' }, { n: pageIndex + 1, side: 'right' }]);
                } else {
                    this.applyVisible([{ n: pageIndex, side: 'only' }]);
                }
            }

            const i18n = this.getI18n();
            const shown = spread && this.mode === 'flipbook' && pageIndex + 1 <= this.totalPages
                ? pageIndex + '–' + (pageIndex + 1) : String(pageIndex);
            if (this.indicatorEl) {
                this.indicatorEl.textContent = i18n.pageXofY.replace('{current}', shown).replace('{total}', this.totalPages);
            }
            if (this.selectEl) this.selectEl.value = pageIndex;
            const step = (spread && this.mode === 'flipbook') ? 2 : 1;
            if (this.prevBtn) this.prevBtn.disabled = pageIndex === 1;
            if (this.nextBtn) this.nextBtn.disabled = (pageIndex + step - 1) >= this.totalPages;
            if (this.progressBarEl) {
                this.progressBarEl.style.width = ((Math.min(this.totalPages, pageIndex + step - 1) / this.totalPages) * 100) + '%';
                const rule = this.progressBarEl.closest('.magazine-progress-rule');
                if (rule) rule.setAttribute('aria-valuenow', String(pageIndex));
            }
            if (this.liveAnnouncerEl) this.liveAnnouncerEl.textContent = 'Page ' + shown + ' of ' + this.totalPages;
            if (updateHistory && window.location.hash !== '#page-' + pageIndex) {
                history.replaceState(null, '', '#page-' + pageIndex);
            }
        },

        // ---------------------------------------------------------------------------------------------
        // A real page turn: one leaf, rotating around the spine, with both faces
        // ---------------------------------------------------------------------------------------------
        cloneFace: function (page) {
            const face = page.cloneNode(true);
            face.removeAttribute('id');
            face.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
            face.classList.remove('active', 'spread-left', 'spread-right');
            face.classList.add('in-leaf');
            face.style.display = '';
            face.setAttribute('aria-hidden', 'true');
            face.querySelectorAll('button, a, input, select').forEach(n => n.setAttribute('tabindex', '-1'));
            return face;
        },

        turnLeaf: function (from, to) {
            const forward = to > from;
            const pages = this.pages;
            const leaf = document.createElement('div');
            leaf.className = 'page-leaf ' + (forward ? 'leaf-forward' : 'leaf-backward');
            const front = document.createElement('div');
            front.className = 'leaf-face leaf-front';
            const back = document.createElement('div');
            back.className = 'leaf-face leaf-back';

            if (forward) {
                // front: the current right page; back: the left page of the next spread
                front.appendChild(this.cloneFace(pages[from]));
                back.appendChild(this.cloneFace(pages[to - 1]));
                // underneath: current left stays, the next right page is revealed
                this.applyVisible([{ n: from, side: 'left' }, { n: to + 1, side: 'right' }]);
            } else {
                // front: the current left page; back: the right page of the previous spread
                front.appendChild(this.cloneFace(pages[from - 1]));
                back.appendChild(this.cloneFace(pages[to]));
                // underneath: previous left page is revealed, current right stays
                this.applyVisible([{ n: to, side: 'left' }, { n: from + 1, side: 'right' }]);
            }
            leaf.appendChild(front);
            leaf.appendChild(back);
            this.container.appendChild(leaf);
            this.container.classList.add('is-turning');
            // force layout, then start the rotation
            void leaf.offsetWidth;
            leaf.classList.add('is-flipping');

            const done = () => {
                if (this.turning && this.turning.leaf === leaf) this.finishTurn();
            };
            const timer = setTimeout(done, 900);
            this.turning = { leaf: leaf, timer: timer, to: to };
        },

        finishTurn: function () {
            if (!this.turning) return;
            const t = this.turning;
            this.turning = null;
            clearTimeout(t.timer);
            if (t.leaf.parentNode) t.leaf.parentNode.removeChild(t.leaf);
            this.container.classList.remove('is-turning');
            this.applyVisible([{ n: t.to, side: 'left' }, { n: t.to + 1, side: 'right' }]);
        },

        nextPage: function () {
            const step = (this.kind === 'spread' && this.mode === 'flipbook') ? 2 : 1;
            if (this.currentPage + step <= this.totalPages) this.showPage(this.currentPage + step);
            else if (this.currentPage < this.totalPages) this.showPage(this.totalPages);
        },

        prevPage: function () {
            const step = (this.kind === 'spread' && this.mode === 'flipbook') ? 2 : 1;
            if (this.currentPage - step >= 1) this.showPage(this.currentPage - step);
            else if (this.currentPage > 1) this.showPage(1);
        },

        toggleMode: function () {
            this.mode = this.mode === 'flipbook' ? 'scroll' : 'flipbook';
            try { localStorage.setItem('cosy_blog_view_mode', this.mode); } catch (e) { /* storage unavailable */ }
            this.applyMode();
            this.showPage(this.currentPage, true, false);
        },

        applyMode: function () {
            const i18n = this.getI18n();
            const c = this.container;
            if (this.mode === 'scroll') {
                this.finishTurn();
                c.classList.remove('flipbook-mode');
                c.classList.add('scroll-mode');
                ['transform', 'width', 'height', 'margin', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'transformOrigin']
                    .forEach(k => { c.style[k] = ''; });
                this.pages.forEach(p => {
                    p.style.display = '';
                    p.classList.add('active');
                    p.classList.remove('spread-left', 'spread-right');
                });
                if (this.modeToggleBtn) {
                    const labelSpan = this.modeToggleBtn.querySelector('.mode-label');
                    if (labelSpan) labelSpan.textContent = i18n.magazineSpread;
                    this.modeToggleBtn.classList.add('active-scroll');
                }
                if (this.prevBtn) this.prevBtn.style.display = 'none';
                if (this.nextBtn) this.nextBtn.style.display = 'none';
                if (this.indicatorEl) this.indicatorEl.style.display = 'none';
            } else {
                c.classList.remove('scroll-mode');
                c.classList.add('flipbook-mode');
                if (this.modeToggleBtn) {
                    const labelSpan = this.modeToggleBtn.querySelector('.mode-label');
                    if (labelSpan) labelSpan.textContent = i18n.flatScroll;
                    this.modeToggleBtn.classList.remove('active-scroll');
                }
                if (this.prevBtn) this.prevBtn.style.display = 'inline-flex';
                if (this.nextBtn) this.nextBtn.style.display = 'inline-flex';
                if (this.indicatorEl) this.indicatorEl.style.display = 'inline';
                this.fitBook();
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => COSYFlipbook.init());
    } else {
        COSYFlipbook.init();
    }

    window.COSYFlipbook = COSYFlipbook;
})();
