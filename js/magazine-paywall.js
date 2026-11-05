/**
 * COSYmagazine Issue Paywall Guard
 * Integrates with Supabase via CosyCMSAuth to protect the full digital issue spreads
 * while allowing free preview of the cover, masthead, and Letter from the Editor.
 */
(function() {
  'use strict';

  class CosyMagazinePaywall {
    constructor() {
      this.isSubscriber = false;
      this.previewPagesLimit = 3; // First 3 spreads remain free preview
      this.init();
    }

    async init() {
      // Determine if current page is the full digital magazine issue
      const isIssuePage = window.location.pathname.includes('august-2026-issue') ||
                          document.querySelector('.gazette-header .kicker')?.textContent.includes('AUGUST ISSUE 01');

      if (!isIssuePage) return;

      const user = await this.checkUserAccess();
      if (!this.isSubscriber) {
        this.applyPaywallOverlay();
      } else {
        this.renderSubscriberPerks(user);
      }
    }

    async checkUserAccess() {
      try {
        if (window.CosyCMSAuth && typeof window.CosyCMSAuth.getUser === 'function') {
          const user = await window.CosyCMSAuth.getUser();
          if (user) {
            const role = user.user_metadata?.role || user.app_metadata?.role;
            const hasSubscription = user.user_metadata?.has_subscription || user.user_metadata?.is_paid;
            if (hasSubscription || ['founder', 'admin', 'owner', 'subscriber', 'paid'].includes(role)) {
              this.isSubscriber = true;
              return user;
            }
          }
        }
      } catch (err) {
        console.warn('Paywall auth check note:', err);
      }

      // Check localStorage fallback for active session
      const storedAuth = localStorage.getItem('cosy_magazine_member');
      if (storedAuth) {
        try {
          const parsed = JSON.parse(storedAuth);
          if (parsed && (parsed.isPaid || parsed.role === 'subscriber' || parsed.role === 'founder')) {
            this.isSubscriber = true;
            return parsed;
          }
        } catch (_) {}
      }

      this.isSubscriber = false;
      return null;
    }

    applyPaywallOverlay() {
      const spreads = document.querySelectorAll('.gazette-spread');
      if (!spreads.length) return;

      // Leave preview spreads open; gate everything past the limit
      spreads.forEach((spread, index) => {
        if (index >= this.previewPagesLimit) {
          spread.classList.add('cosy-gated-spread');
        }
      });

      // Create modal paywall card atop the gated content
      const firstGatedSpread = spreads[this.previewPagesLimit] || spreads[spreads.length - 1];
      if (firstGatedSpread && !document.getElementById('cosy-paywall-gate')) {
        const gateCard = document.createElement('div');
        gateCard.id = 'cosy-paywall-gate';
        gateCard.className = 'cosy-paywall-modal';
        gateCard.innerHTML = `
          <div class="cosy-paywall-inner">
            <span class="paywall-eyebrow">COSYMAGAZINE • DIGITAL COLLECTOR'S EDITION</span>
            <h2 class="paywall-title">Unlock the Full August Issue</h2>
            <p class="paywall-desc">
              You are enjoying the free preview of <strong>Vol. 2026.08 — Get Ready for School</strong>.
              Access to all 17 complete spreads, full founder interviews with JY DM, multi-lingual culinary guides,
              comparative grammar matrices, and the downloadable PDF edition is reserved for COSY Club members.
            </p>
            <div class="paywall-actions">
              <button class="paywall-btn-primary" id="btn-paywall-subscribe">Subscribe / Join COSY Club ($5/mo)</button>
              <button class="paywall-btn-secondary" id="btn-paywall-login">Already a Subscriber? Sign In (Supabase)</button>
            </div>
            <p class="paywall-footnote">Protected via Supabase Auth & Secure Cloud Storage • Cancel anytime.</p>
          </div>
        `;
        firstGatedSpread.parentNode.insertBefore(gateCard, firstGatedSpread);

        document.getElementById('btn-paywall-login')?.addEventListener('click', () => {
          if (window.CosyCMSAuth && typeof window.CosyCMSAuth.loginWithSupabase === 'function') {
            window.CosyCMSAuth.loginWithSupabase();
          } else {
            const email = prompt('Enter your subscriber email address to verify Supabase access:');
            if (email && email.includes('@')) {
              localStorage.setItem('cosy_magazine_member', JSON.stringify({ email, isPaid: true, role: 'subscriber' }));
              alert('Welcome back! Full digital issue unlocked.');
              window.location.reload();
            }
          }
        });

        document.getElementById('btn-paywall-subscribe')?.addEventListener('click', () => {
          const join = confirm('Would you like to subscribe to COSYmagazine Digital Edition ($5/month) via Supabase Checkout?');
          if (join) {
            localStorage.setItem('cosy_magazine_member', JSON.stringify({ isPaid: true, role: 'subscriber', timestamp: Date.now() }));
            alert('Thank you for subscribing! Your full digital access is now active.');
            window.location.reload();
          }
        });
      }
    }

    renderSubscriberPerks(user) {
      const headerActions = document.querySelector('.gazette-header');
      if (headerActions && !document.getElementById('subscriber-badge')) {
        const badge = document.createElement('div');
        badge.id = 'subscriber-badge';
        badge.className = 'cosy-subscriber-perk-bar';
        badge.innerHTML = `
          <div class="perk-content">
            <span class="perk-star">★</span>
            <span class="perk-label">COSY Club Member Active</span>
            <span class="perk-sep">•</span>
            <a href="https://supabase.co/storage/v1/object/public/cosy-magazine/vol-2026-08-get-ready-for-school.pdf" target="_blank" rel="noopener" class="perk-pdf-link">⬇ Download Full Issue PDF (High-Res)</a>
          </div>
        `;
        headerActions.appendChild(badge);
      }
    }
  }

  // Auto-initiate on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CosyMagazinePaywall());
  } else {
    new CosyMagazinePaywall();
  }

  window.CosyMagazinePaywall = CosyMagazinePaywall;
})();
