(function () {
  'use strict';

  const LOGIN_URL = 'https://cosylanguages.github.io/COSYlanguages/login.html';
  const SUBSCRIPTION_URL = 'https://cosylanguages.github.io/COSYlanguages/courses/index.html';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cosy-issue-download-styles')) return;
    const style = document.createElement('style');
    style.id = 'cosy-issue-download-styles';
    style.textContent = `
      .issue-download-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(18, 17, 15, 0.78) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        z-index: 99999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 1.5rem !important;
        box-sizing: border-box !important;
      }
      .issue-download-card {
        background: #FAF7F2 !important;
        border: 1px solid rgba(0,0,0,0.12) !important;
        border-top: 5px solid #993C1D !important;
        border-radius: 18px !important;
        max-width: 500px !important;
        width: 100% !important;
        padding: 2.2rem 1.8rem !important;
        box-shadow: 0 24px 60px rgba(0,0,0,0.35) !important;
        text-align: center !important;
        color: #1A1A1A !important;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
      }
      .issue-download-card.is-error {
        border-top-color: #b91c1c !important;
      }
      .issue-download-kicker {
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        letter-spacing: 0.14em !important;
        text-transform: uppercase !important;
        color: #993C1D !important;
        display: block !important;
        margin-bottom: 0.5rem !important;
      }
      .issue-download-card.is-error .issue-download-kicker {
        color: #b91c1c !important;
      }
      .issue-download-title {
        font-family: "Fraunces", Georgia, serif !important;
        font-size: 1.65rem !important;
        line-height: 1.25 !important;
        color: #1A1A1A !important;
        margin: 0 0 0.8rem 0 !important;
        font-weight: 700 !important;
      }
      .issue-download-message {
        font-size: 0.95rem !important;
        line-height: 1.55 !important;
        color: #555 !important;
        margin: 0 0 1.6rem 0 !important;
      }
      .issue-download-actions {
        display: flex !important;
        gap: 0.75rem !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
      }
      .issue-download-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0.65rem 1.4rem !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 0.92rem !important;
        text-decoration: none !important;
        cursor: pointer !important;
        border: none !important;
        transition: transform 0.15s ease, opacity 0.15s ease !important;
      }
      .issue-download-btn:hover {
        opacity: 0.9 !important;
      }
      .issue-download-btn-primary {
        background: #0f6e56 !important;
        color: #ffffff !important;
      }
      .issue-download-btn-outline {
        background: transparent !important;
        border: 1px solid rgba(0,0,0,0.2) !important;
        color: #333 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function showFeedbackModal(title, message, actionText, actionUrl, isError) {
    if (typeof document === 'undefined') return;
    ensureStyles();

    let modal = document.getElementById('issue-download-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'issue-download-modal';
      modal.className = 'issue-download-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'issue-feedback-title');
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="issue-download-card ${isError ? 'is-error' : ''}">
        <span class="issue-download-kicker">${isError ? '⚠️ DOWNLOAD NOTICE' : 'COSYMAGAZINE • DIGITAL ARCHIVE'}</span>
        <h3 class="issue-download-title" id="issue-feedback-title">${escapeHtml(title)}</h3>
        <p class="issue-download-message">${escapeHtml(message)}</p>
        <div class="issue-download-actions">
          ${actionText && actionUrl ? `<a href="${escapeHtml(actionUrl)}" class="issue-download-btn issue-download-btn-primary">${escapeHtml(actionText)}</a>` : ''}
          <button type="button" class="issue-download-btn issue-download-btn-outline" id="issue-feedback-close">Close</button>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector('#issue-feedback-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    modal.style.display = 'flex';
  }

  function triggerSignedDownload(signedUrl, filename) {
    if (typeof document === 'undefined') return;
    const a = document.createElement('a');
    a.href = signedUrl;
    if (filename) {
      a.setAttribute('download', filename);
    } else {
      a.setAttribute('download', '');
    }
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    }, 100);
  }

  async function downloadIssue(issue, buttonElement, options) {
    const opts = options || {};
    const issueId = (issue && (issue.id || issue.number || issue.issue_id)) || '';
    const issueTitle = (issue && (issue.title || issue.issue_title || issueId)) || 'COSYmagazine Edition';

    if (!issueId) {
      showFeedbackModal(
        'Missing Issue Identifier',
        'Could not determine the identifier for this magazine issue.',
        null,
        null,
        true
      );
      return { success: false, error: 'missing_issue_id' };
    }

    // Check Supabase client availability
    let supabase = opts.client;
    if (!supabase && typeof window !== 'undefined' && window.CosyCMSAuth && typeof window.CosyCMSAuth.getClient === 'function') {
      supabase = window.CosyCMSAuth.getClient();
    }

    if (!supabase) {
      showFeedbackModal(
        'Configuration Error',
        'Magazine services could not be reached. Please refresh and try again.',
        null,
        null,
        true
      );
      return { success: false, error: 'client_unavailable' };
    }

    // Check user authentication
    let user = null;
    try {
      const authRes = await supabase.auth.getUser();
      user = authRes && authRes.data ? authRes.data.user : null;
    } catch (e) {
      // ignore
    }

    if (!user) {
      showFeedbackModal(
        'Sign in Required',
        'Please sign in to your COSYlanguages account to download full PDF magazine editions.',
        'Sign In',
        LOGIN_URL,
        false
      );
      return { success: false, error: 'unauthenticated' };
    }

    // Provide loading feedback
    let originalHtml = '';
    if (buttonElement) {
      originalHtml = buttonElement.innerHTML;
      buttonElement.disabled = true;
      buttonElement.setAttribute('aria-busy', 'true');
      buttonElement.innerHTML = `
        <svg class="issue-download-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>Generating PDF link...</span>
      `;
    }

    try {
      const response = await supabase.functions.invoke('get-issue-download-url', {
        body: { volume_number: issueId }
      });

      const { data, error } = response || {};

      if (error) {
        let status = error.status;
        let errorMessage = error.message || '';

        // If Edge Function returned a JSON error payload
        if (error.context && typeof error.context.json === 'function') {
          try {
            const errJson = await error.context.json();
            if (errJson && errJson.error) {
              errorMessage = errJson.error;
            }
          } catch (_) {
            // ignore
          }
        }

        const msgLower = (errorMessage || '').toLowerCase();

        if (status === 401 || msgLower.includes('unauthenticated') || msgLower.includes('login') || msgLower.includes('auth')) {
          showFeedbackModal(
            'Sign in Required',
            'Your session may have expired. Please sign in to download this issue.',
            'Sign In',
            LOGIN_URL,
            false
          );
          return { success: false, error: 'unauthenticated' };
        }

        if (status === 403 || msgLower.includes('entitlement') || msgLower.includes('not entitled') || msgLower.includes('subscription') || msgLower.includes('purchase')) {
          showFeedbackModal(
            'Subscription Required',
            `Downloading full PDF archives requires an active COSYmagazine digital subscription or purchase of "${issueTitle}".`,
            'View Plans',
            SUBSCRIPTION_URL,
            false
          );
          return { success: false, error: 'not_entitled' };
        }

        if (status === 404 || msgLower.includes('not found') || msgLower.includes('unpublished') || msgLower.includes('unconfigured')) {
          showFeedbackModal(
            'Issue Not Ready Yet',
            `The PDF edition for "${issueTitle}" is not currently available for download. Please check back soon or read online!`,
            null,
            null,
            false
          );
          return { success: false, error: 'issue_not_configured' };
        }

        showFeedbackModal(
          'Download Error',
          errorMessage || 'Unable to generate download URL at this time. Please try again later.',
          null,
          null,
          true
        );
        return { success: false, error: errorMessage || 'invocation_failed' };
      }

      if (!data || !data.signed_url) {
        showFeedbackModal(
          'Download Unavailable',
          `The download link for "${issueTitle}" could not be generated. Please try again later.`,
          null,
          null,
          true
        );
        return { success: false, error: 'no_signed_url' };
      }

      const filename = data.filename || `${issueId.replace(/[^a-zA-Z0-9.-]/g, '_')}.pdf`;
      triggerSignedDownload(data.signed_url, filename);
      return { success: true, signed_url: data.signed_url };

    } catch (err) {
      showFeedbackModal(
        'Network Error',
        'Could not connect to the magazine service. Please check your network connection and try again.',
        null,
        null,
        true
      );
      return { success: false, error: err.message || 'network_error' };
    } finally {
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.removeAttribute('aria-busy');
        buttonElement.innerHTML = originalHtml;
      }
    }
  }

  function initDownloadButtons() {
    if (typeof document === 'undefined') return;

    const buttons = document.querySelectorAll('[data-action="download-issue-pdf"]');
    buttons.forEach((btn) => {
      if (btn.dataset.downloadAttached) return;
      btn.dataset.downloadAttached = 'true';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const issueId = btn.dataset.issueId || btn.dataset.issueNumber || '';
        const issueTitle = btn.dataset.issueTitle || '';
        await downloadIssue({ id: issueId, title: issueTitle }, btn);
      });
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDownloadButtons);
    } else {
      initDownloadButtons();
    }
  }

  const CosyIssueDownload = {
    downloadIssue,
    triggerSignedDownload,
    showFeedbackModal,
    initDownloadButtons,
    LOGIN_URL,
    SUBSCRIPTION_URL
  };

  if (typeof window !== 'undefined') {
    window.CosyIssueDownload = CosyIssueDownload;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CosyIssueDownload;
  }
})();
