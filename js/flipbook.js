/**
 * COSYlanguages — Flipbook Magazine Reader & Furniture for Blog Posts
 * Transforms long blog articles into structured 3D two-page spreads with authentic magazine furniture:
 * page folios in margins, thin progress rule, corner page turn affordance, and accessible popover contents.
 */

(function () {
    'use strict';

    const COSYFlipbook = {
        currentPage: 1,
        totalPages: 1,
        spreads: [],
        mode: 'flipbook', // 'flipbook' or 'scroll'
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

        init: function () {
            // Initialize founder card deck listeners unconditionally (present on both index.html and post pages)
            this.initFounderCards();

            this.container = document.querySelector('.post-full-content');
            if (!this.container) return;

            // Setup ARIA Live region for screen readers
            this.initLiveAnnouncer();

            // Intelligent chunker to split content without cutting headings/tables in half
            this.chunkContentIntoPages();

            const pageEls = Array.from(this.container.querySelectorAll('.flipbook-page'));
            if (pageEls.length <= 1) return;

            this.pages = pageEls;
            this.totalPages = this.pages.length;

            // Build 3D two-page spreads
            this.buildSpreads();

            // Attach magazine folios and corner turn affordance to each page spread
            this.attachMagazineFurnitureToPages();

            // Restore view mode preference if saved
            const savedMode = localStorage.getItem('cosy_blog_view_mode');
            if (savedMode === 'scroll' || savedMode === 'flipbook') {
                this.mode = savedMode;
            }

            this.renderControls();
            this.bindEvents();
            this.initZoomControls();

            // Handle URL hash on load (e.g. #page-3)
            const hashMatch = window.location.hash.match(/^#page-(\d+)$/);
            if (hashMatch) {
                const requestedPage = parseInt(hashMatch[1], 10);
                if (requestedPage >= 1 && requestedPage <= this.totalPages) {
                    this.currentPage = requestedPage;
                }
            }

            this.applyMode();
            this.showPage(this.currentPage);
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

        chunkContentIntoPages: function () {
            let existingPages = Array.from(this.container.querySelectorAll('.flipbook-page'));
            let rawChildren = [];

            if (existingPages.length > 0) {
                existingPages.forEach(p => {
                    rawChildren.push(...Array.from(p.children));
                });
            } else {
                Array.from(this.container.children).forEach(child => {
                    if (child.classList && child.classList.contains('gazette-page-spread') && child.tagName.toLowerCase() === 'section') {
                        rawChildren.push(...Array.from(child.children));
                    } else {
                        rawChildren.push(child);
                    }
                });
            }

            if (rawChildren.length === 0) return;

            // Helper to test if an element is a heading
            const isHeadingElement = (el) => {
                if (!el) return false;
                const tag = el.tagName ? el.tagName.toLowerCase() : '';
                return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ||
                    el.classList?.contains('editorial-heading') ||
                    el.classList?.contains('qa-question') ||
                    el.classList?.contains('podcast-box-title') ||
                    el.classList?.contains('quiz-question') ||
                    el.classList?.contains('gazette-marginalia-title');
            };

            // Explode large vocabulary comparison tables (.instead-try-spread) into sub-spreads of ~6 rows
            const children = [];
            rawChildren.forEach(child => {
                if (child.classList && child.classList.contains('instead-try-spread')) {
                    const headersEl = child.querySelector('.instead-try-headers');
                    const rows = Array.from(child.querySelectorAll('.instead-try-row'));
                    if (rows.length > 6 && headersEl) {
                        const chunkSize = 6;
                        for (let r = 0; r < rows.length; r += chunkSize) {
                            const subSpread = document.createElement('section');
                            subSpread.className = 'instead-try-spread';
                            subSpread.setAttribute('aria-label', child.getAttribute('aria-label') || 'Vocabulary Comparisons Spread');
                            subSpread.appendChild(headersEl.cloneNode(true));

                            const subBody = document.createElement('div');
                            subBody.className = 'instead-try-body';
                            rows.slice(r, r + chunkSize).forEach(row => subBody.appendChild(row.cloneNode(true)));
                            subSpread.appendChild(subBody);

                            children.push(subSpread);
                        }
                        return;
                    }
                }
                children.push(child);
            });

            const pagesData = [[]];
            let currentPageIndex = 0;
            let currentItemCount = 0;

            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const tag = child.tagName ? child.tagName.toLowerCase() : '';

                const isHeading = isHeadingElement(child);
                const isHr = tag === 'hr';
                const isSpreadBlock = child.classList?.contains('instead-try-spread') || child.classList?.contains('phrase-upgrade-grid');
                // Authors can force a page turn with <div class="page-break-hint"></div>
                const isPageBreak = child.classList?.contains('page-break-hint');
                // Never leave a heading alone on a page: a spread block that follows only headings stays with them
                const pageHasOnlyHeadings = pagesData[currentPageIndex].length > 0 && pagesData[currentPageIndex].every(isHeadingElement);

                // Adjusted page limit for magazine spreads: allow 8-12 paragraph/block items per page
                // break page only on explicit hr, major section heading with enough preceding items, or when reaching item limit
                const pageLimit = isHeading ? 6 : 10;
                if ((isHr || isPageBreak || (isHeading && currentItemCount >= 4) || (isSpreadBlock && !pageHasOnlyHeadings) || currentItemCount >= pageLimit) && pagesData[currentPageIndex].length > 0) {
                    currentPageIndex++;
                    pagesData[currentPageIndex] = [];
                    currentItemCount = 0;
                }

                if (!isHr && !isPageBreak) {
                    pagesData[currentPageIndex].push(child);
                    currentItemCount++;
                }
            }

            // Post-pass: Prevent Heading Orphans by moving any heading at the END of a page to the START of the next page
            for (let p = 0; p < pagesData.length; p++) {
                const pageGroup = pagesData[p];
                if (pageGroup.length > 1) {
                    const lastEl = pageGroup[pageGroup.length - 1];
                    if (isHeadingElement(lastEl)) {
                        pageGroup.pop();
                        if (!pagesData[p + 1]) {
                            pagesData[p + 1] = [];
                        }
                        pagesData[p + 1].unshift(lastEl);
                    }
                }
            }

            // Clean up any empty pages
            const filteredPagesData = pagesData.filter(g => g && g.length > 0);
            if (filteredPagesData.length <= 1) return;

            this.container.innerHTML = '';
            filteredPagesData.forEach((group, idx) => {
                const pageSection = document.createElement('section');
                const pageNum = idx + 1;
                pageSection.className = 'flipbook-page gazette-page-spread';
                pageSection.id = `page-${pageNum}`;
                pageSection.setAttribute('data-page', pageNum);
                pageSection.setAttribute('aria-labelledby', `page-${pageNum}-heading`);
                pageSection.setAttribute('aria-label', `Page ${pageNum} of ${filteredPagesData.length}`);
                pageSection.setAttribute('tabindex', '-1');
                group.forEach(el => pageSection.appendChild(el));
                this.container.appendChild(pageSection);
            });
        },

        buildSpreads: function () {
            const isMobile = window.innerWidth <= 860;
            this.container.classList.add('flipbook-3d-stage');
            if (isMobile) {
                this.container.classList.add('mobile-single-view');
                this.container.classList.remove('desktop-spread-view');
            } else {
                this.container.classList.remove('mobile-single-view');
                this.container.classList.add('desktop-spread-view');
            }
        },

        attachMagazineFurnitureToPages: function () {
            this.pages.forEach((pageEl, idx) => {
                const pageNum = idx + 1;
                const isEvenPage = pageNum % 2 === 0;
                const isLastPage = pageNum === this.totalPages;
                const isBack = (isEvenPage && pageNum > 1) || isLastPage;

                // Add corner turn affordance
                let dogEar = pageEl.querySelector('.magazine-dog-ear');
                if (!dogEar) {
                    dogEar = document.createElement('button');
                    dogEar.type = 'button';
                    dogEar.className = 'magazine-dog-ear';
                    dogEar.setAttribute('data-action', isBack ? 'prev' : 'next');
                    dogEar.setAttribute('aria-label', isBack ? 'Previous page' : 'Turn the page');
                    dogEar.innerHTML = `
                        <span class="dog-ear-fold"></span>
                        <span class="dog-ear-label">${isBack ? '← Back' : 'Turn ↗'}</span>
                    `;
                    pageEl.appendChild(dogEar);
                }

                // Add page folio in footer margin
                let folio = pageEl.querySelector('.magazine-page-folio');
                if (!folio) {
                    folio = document.createElement('div');
                    folio.className = 'magazine-page-folio';
                    folio.innerHTML = `
                        <span class="folio-desk-stamp">COSYMAGAZINE</span>
                        <span class="folio-num">— ${pageNum} —</span>
                        <span class="folio-total">OF ${this.totalPages}</span>
                    `;
                    pageEl.appendChild(folio);
                }
            });
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

        bindEvents: function () {
            if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevPage());
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextPage());
            if (this.selectEl) {
                this.selectEl.addEventListener('change', (e) => {
                    const p = parseInt(e.target.value, 10);
                    if (!isNaN(p)) this.showPage(p);
                });
            }
            if (this.modeToggleBtn) this.modeToggleBtn.addEventListener('click', () => this.toggleMode());

            // Contents Popover Toggle
            const triggerBtn = this.controlsEl?.querySelector('.magazine-contents-trigger');
            const closeBtn = this.controlsEl?.querySelector('.contents-close-btn');

            if (triggerBtn && this.contentsPopoverEl) {
                triggerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isHidden = this.contentsPopoverEl.hasAttribute('hidden');
                    if (isHidden) {
                        this.contentsPopoverEl.removeAttribute('hidden');
                        triggerBtn.setAttribute('aria-expanded', 'true');
                    } else {
                        this.contentsPopoverEl.setAttribute('hidden', '');
                        triggerBtn.setAttribute('aria-expanded', 'false');
                    }
                });

                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.contentsPopoverEl.setAttribute('hidden', '');
                        triggerBtn.setAttribute('aria-expanded', 'false');
                    });
                }

                document.addEventListener('click', (e) => {
                    if (this.contentsPopoverEl && !this.contentsPopoverEl.contains(e.target) && !triggerBtn.contains(e.target)) {
                        this.contentsPopoverEl.setAttribute('hidden', '');
                        triggerBtn.setAttribute('aria-expanded', 'false');
                    }
                });

                const itemBtns = this.contentsPopoverEl.querySelectorAll('.contents-item-btn');
                itemBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const pageNum = parseInt(btn.getAttribute('data-page'), 10);
                        if (!isNaN(pageNum)) {
                            this.showPage(pageNum);
                            this.contentsPopoverEl.setAttribute('hidden', '');
                            triggerBtn.setAttribute('aria-expanded', 'false');
                        }
                    });
                });
            }

            // Page Dog-Ear Turn Affordance Clicks
            this.container.querySelectorAll('.magazine-dog-ear').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.getAttribute('data-action');
                    if (action === 'prev') {
                        this.prevPage();
                    } else {
                        if (this.currentPage < this.totalPages) {
                            this.nextPage();
                        } else {
                            this.prevPage();
                        }
                    }
                });
            });

            // Edge clicks on page boundaries
            this.container.addEventListener('click', (e) => {
                if (this.mode !== 'flipbook') return;
                if (e.target.closest('a, button, audio, select, input, details')) return;

                const rect = this.container.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                if (clickX < rect.width * 0.2) {
                    this.prevPage();
                } else if (clickX > rect.width * 0.8) {
                    this.nextPage();
                }
            });

            // Hashchange navigation support for browser back/forward buttons & deep links
            window.addEventListener('hashchange', () => {
                const match = window.location.hash.match(/^#page-(\d+)$/);
                if (match) {
                    const p = parseInt(match[1], 10);
                    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
                        this.showPage(p, false);
                    }
                } else if (!window.location.hash || window.location.hash === '#') {
                    if (this.currentPage !== 1) {
                        this.showPage(1, false);
                    }
                }
            });

            // Keyboard navigation & PgUp/PgDn
            document.addEventListener('keydown', (e) => {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
                if (this.mode !== 'flipbook') return;

                if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                    this.prevPage();
                } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                    this.nextPage();
                } else if (e.key === 'Escape' && this.contentsPopoverEl && !this.contentsPopoverEl.hasAttribute('hidden')) {
                    this.contentsPopoverEl.setAttribute('hidden', '');
                    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Touch Swipe Gesture
            let startX = 0;
            let startY = 0;

            this.container.addEventListener('touchstart', (e) => {
                if (this.mode !== 'flipbook') return;
                if (e.touches.length === 1) {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                }
            }, { passive: true });

            this.container.addEventListener('touchend', (e) => {
                if (this.mode !== 'flipbook' || !startX) return;
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;

                if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0) this.nextPage();
                    else this.prevPage();
                }
                startX = 0;
                startY = 0;
            }, { passive: true });

            window.addEventListener('resize', () => this.buildSpreads());
        },

        showPage: function (pageIndex, updateHistory = true) {
            if (pageIndex < 1) pageIndex = 1;
            if (pageIndex > this.totalPages) pageIndex = this.totalPages;

            const isMobile = window.innerWidth <= 860;

            // In 2-page desktop mode, normalize current page to odd page (left side of spread)
            if (this.mode === 'flipbook' && !isMobile) {
                pageIndex = pageIndex % 2 === 0 ? pageIndex - 1 : pageIndex;
            }

            this.currentPage = pageIndex;

            if (this.mode === 'flipbook') {
                if (!isMobile) {
                    const leftPageNum = pageIndex;
                    const rightPageNum = leftPageNum + 1;

                    this.pages.forEach((p, idx) => {
                        const pNum = idx + 1;
                        if (pNum === leftPageNum || pNum === rightPageNum) {
                            p.classList.add('active');
                            p.style.display = 'flex';
                            p.style.flexDirection = 'column';
                            p.style.justifyContent = 'space-between';
                            p.style.height = '100%';
                            p.style.opacity = '1';
                            p.classList.toggle('spread-left', pNum === leftPageNum);
                            p.classList.toggle('spread-right', pNum === rightPageNum);
                        } else {
                            p.classList.remove('active', 'spread-left', 'spread-right');
                            p.style.display = 'none';
                        }
                    });
                } else {
                    this.pages.forEach((p, idx) => {
                        if (idx + 1 === pageIndex) {
                            p.classList.add('active');
                            p.style.display = 'block';
                            p.style.opacity = '1';
                        } else {
                            p.classList.remove('active', 'spread-left', 'spread-right');
                            p.style.display = 'none';
                        }
                    });
                }
            }

            // Update UI controls
            const i18n = this.getI18n();
            if (this.indicatorEl) {
                this.indicatorEl.textContent = i18n.pageXofY.replace('{current}', pageIndex).replace('{total}', this.totalPages);
            }
            if (this.selectEl) this.selectEl.value = pageIndex;
            if (this.prevBtn) this.prevBtn.disabled = pageIndex === 1;
            if (this.nextBtn) {
                const step = (!isMobile && this.mode === 'flipbook') ? 2 : 1;
                // In a two-page spread the right-hand page is pageIndex + 1, so the last spread is the one that reaches the final page
                this.nextBtn.disabled = (pageIndex + step - 1) >= this.totalPages;
            }
            if (this.progressBarEl) {
                this.progressBarEl.style.width = `${(pageIndex / this.totalPages) * 100}%`;
                const rule = this.progressBarEl.closest('.magazine-progress-rule');
                if (rule) rule.setAttribute('aria-valuenow', String(pageIndex));
            }

            if (this.liveAnnouncerEl) {
                this.liveAnnouncerEl.textContent = `Page ${pageIndex} of ${this.totalPages}`;
            }

            if (updateHistory) {
                if (window.location.hash !== `#page-${pageIndex}`) {
                    history.replaceState(null, '', `#page-${pageIndex}`);
                }
            }
        },

        nextPage: function () {
            const isMobile = window.innerWidth <= 860;
            const step = (!isMobile && this.mode === 'flipbook') ? 2 : 1;
            if (this.currentPage + step <= this.totalPages) {
                this.showPage(this.currentPage + step);
            } else if (this.currentPage < this.totalPages) {
                this.showPage(this.totalPages);
            }
        },

        prevPage: function () {
            const isMobile = window.innerWidth <= 860;
            const step = (!isMobile && this.mode === 'flipbook') ? 2 : 1;
            if (this.currentPage - step >= 1) {
                this.showPage(this.currentPage - step);
            } else if (this.currentPage > 1) {
                this.showPage(1);
            }
        },

        toggleMode: function () {
            this.mode = this.mode === 'flipbook' ? 'scroll' : 'flipbook';
            localStorage.setItem('cosy_blog_view_mode', this.mode);
            this.applyMode();
            this.showPage(this.currentPage);
        },

        applyMode: function () {
            const i18n = this.getI18n();
            if (this.mode === 'scroll') {
                this.container.classList.remove('flipbook-mode');
                this.container.classList.add('scroll-mode');
                this.pages.forEach(p => {
                    p.style.display = 'block';
                    p.classList.add('active');
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
                this.container.classList.remove('scroll-mode');
                this.container.classList.add('flipbook-mode');
                if (this.modeToggleBtn) {
                    const labelSpan = this.modeToggleBtn.querySelector('.mode-label');
                    if (labelSpan) labelSpan.textContent = i18n.flatScroll;
                    this.modeToggleBtn.classList.remove('active-scroll');
                }
                if (this.prevBtn) this.prevBtn.style.display = 'inline-flex';
                if (this.nextBtn) this.nextBtn.style.display = 'inline-flex';
                if (this.indicatorEl) this.indicatorEl.style.display = 'inline';
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
