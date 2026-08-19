(() => {
  'use strict';

  const NOTICE_STORAGE_KEY = 'effectum_cookie_notice';
  const CONSENT_STORAGE_KEY = 'effectum_cookie_consent';
  const NOTICE_VERSION = 1;
  const CONSENT_VERSION = 1;
  const MAX_AGE = 365 * 24 * 60 * 60 * 1000;
  let lastTrigger = null;
  let noticeObserver = null;

  // Activar solo cuando exista una integración real y documentada.
  // TODO ANALYTICS: conectar proveedor de analítica y mapear data-event cuando se decida la herramienta y el modelo de consentimiento.
  const analyticsEnabled = document.documentElement.dataset.analyticsEnabled === 'true';

  const readNotice = () => {
    try {
      const value = JSON.parse(window.localStorage.getItem(NOTICE_STORAGE_KEY));
      if (!value || value.version !== NOTICE_VERSION || !value.savedAt) return null;
      if (Date.now() - value.savedAt > MAX_AGE) return null;
      return value;
    } catch (error) {
      return null;
    }
  };

  const rememberNotice = () => {
    try {
      window.localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify({
        version: NOTICE_VERSION,
        savedAt: Date.now()
      }));
    } catch (error) {
      // El aviso puede cerrarse aunque el navegador bloquee el almacenamiento local.
    }
  };

  const readConsent = () => {
    try {
      const value = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY));
      if (!value || value.version !== CONSENT_VERSION || !value.savedAt) return null;
      if (Date.now() - value.savedAt > MAX_AGE) return null;
      return value;
    } catch (error) {
      return null;
    }
  };

  const rememberConsent = (analytics) => {
    const consent = { version: CONSENT_VERSION, savedAt: Date.now(), analytics: Boolean(analytics) };
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    } catch (error) {
      // La elección sigue aplicándose a la sesión aunque el almacenamiento local esté bloqueado.
    }
    document.dispatchEvent(new CustomEvent('effectum:consent', { detail: consent }));
    if (consent.analytics && typeof window.effectumLoadAnalytics === 'function') {
      window.effectumLoadAnalytics();
    }
  };

  const removeNotice = (restoreFocus = false) => {
    noticeObserver?.disconnect();
    noticeObserver = null;
    document.querySelector('#effectum-cookie-notice')?.remove();
    document.body.classList.remove('cookie-notice-open');
    document.body.style.removeProperty('--cookie-notice-height');
    if (restoreFocus && lastTrigger instanceof HTMLElement) lastTrigger.focus();
    lastTrigger = null;
  };

  const showNotice = (force = false, trigger = null) => {
    const existing = document.querySelector('#effectum-cookie-notice');
    if (existing) {
      existing.querySelector('button')?.focus();
      return;
    }
    const storedChoice = analyticsEnabled ? readConsent() : readNotice();
    if (!force && storedChoice) {
      if (analyticsEnabled && storedChoice.analytics && typeof window.effectumLoadAnalytics === 'function') {
        window.effectumLoadAnalytics();
      }
      return;
    }

    lastTrigger = trigger;
    const content = analyticsEnabled
      ? `<p><strong>Tu elección, sin rodeos.</strong> Usamos almacenamiento técnico para que la web funcione. La analítica solo se activará si la aceptas. Puedes cambiar tu elección desde el pie. <a href="cookies.html">Ver política de cookies</a>.</p>
          <div class="cookie-notice-actions">
            <button class="cookie-notice-button" type="button" data-cookie-choice="reject">Rechazar</button>
            <button class="cookie-notice-button" type="button" data-cookie-choice="accept">Aceptar</button>
          </div>`
      : `<p><strong>Cookies, sin letra pequeña.</strong> Esta versión no usa analítica ni publicidad. Solo usamos almacenamiento local técnico para recordar que cerraste este aviso. <a href="cookies.html">Ver política de cookies</a>.</p>
          <div class="cookie-notice-actions">
            <button class="cookie-notice-button is-primary" type="button" data-cookie-dismiss>Entendido</button>
          </div>`;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="cookie-notice-shell" id="effectum-cookie-notice">
        <section class="cookie-notice" aria-label="Información sobre cookies" aria-live="polite">
          ${content}
        </section>
      </div>
    `);
    document.body.classList.add('cookie-notice-open');
    const notice = document.querySelector('#effectum-cookie-notice');
    const syncNoticeHeight = () => {
      document.body.style.setProperty('--cookie-notice-height', `${notice?.offsetHeight || 0}px`);
    };
    syncNoticeHeight();
    if ('ResizeObserver' in window && notice) {
      noticeObserver = new ResizeObserver(syncNoticeHeight);
      noticeObserver.observe(notice);
    }
    document.querySelector('[data-cookie-dismiss]')?.addEventListener('click', () => {
      rememberNotice();
      removeNotice(Boolean(lastTrigger));
    });
    document.querySelectorAll('[data-cookie-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        rememberConsent(button.dataset.cookieChoice === 'accept');
        removeNotice(Boolean(lastTrigger));
      });
    });
  };

  const init = () => {
    showNotice();
    document.querySelectorAll('[data-cookie-settings]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        showNotice(true, trigger);
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
