(() => {
  'use strict';

  const CONSENT_STORAGE_KEY = 'effectum_cookie_consent';
  const CONSENT_VERSION = 2;
  const MAX_AGE = 365 * 24 * 60 * 60 * 1000;
  let lastTrigger = null;
  let noticeObserver = null;
  const analyticsEnabled = document.documentElement.dataset.analyticsEnabled === 'true';
  const analyticsId = document.documentElement.dataset.analyticsId || '';

  const readConsent = () => {
    try {
      const value = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY));
      if (!value || value.version !== CONSENT_VERSION || !value.savedAt) return null;
      return Date.now() - value.savedAt <= MAX_AGE ? value : null;
    } catch (_) { return null; }
  };

  const loadAnalytics = () => {
    if (!analyticsEnabled || !analyticsId || window.__effectumAnalyticsLoaded) return;
    window.__effectumAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analyticsId, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    document.head.appendChild(script);
  };

  const rememberConsent = (analytics) => {
    const consent = { version: CONSENT_VERSION, savedAt: Date.now(), analytics: Boolean(analytics) };
    try { window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent)); } catch (_) {}
    document.dispatchEvent(new CustomEvent('effectum:consent', { detail: consent }));
    if (consent.analytics) loadAnalytics();
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

  const panelContent = (choice) => `
    <p><strong>Configura tus cookies.</strong> Las técnicas son necesarias para recordar esta elección. La analítica es opcional y no se carga sin tu autorización.</p>
    <label class="cookie-setting"><span><strong>Técnicas</strong><small>Necesarias para guardar tu preferencia.</small></span><input type="checkbox" checked disabled aria-label="Cookies técnicas, siempre activas"></label>
    <label class="cookie-setting"><span><strong>Analíticas</strong><small>Google Analytics mide de forma agregada cómo se utiliza la web.</small></span><input type="checkbox" data-analytics-toggle ${choice?.analytics ? 'checked' : ''}></label>
    <div class="cookie-notice-actions">
      <button class="cookie-notice-button" type="button" data-cookie-choice="reject">Rechazar</button>
      <button class="cookie-notice-button" type="button" data-cookie-save>Guardar selección</button>
      <button class="cookie-notice-button" type="button" data-cookie-choice="accept">Aceptar</button>
    </div>`;

  const bannerContent = () => `
    <p><strong>Tu privacidad importa.</strong> Usamos almacenamiento técnico para recordar tu elección. Solo utilizaremos analítica si la aceptas. <a href="cookies.html">Ver política de cookies</a>.</p>
    <div class="cookie-notice-actions">
      <button class="cookie-notice-button" type="button" data-cookie-choice="reject">Rechazar</button>
      <button class="cookie-notice-button" type="button" data-cookie-settings-open>Configurar</button>
      <button class="cookie-notice-button" type="button" data-cookie-choice="accept">Aceptar</button>
    </div>`;

  const bindChoices = (notice) => {
    notice.querySelectorAll('[data-cookie-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        rememberConsent(button.dataset.cookieChoice === 'accept');
        removeNotice(Boolean(lastTrigger));
      });
    });
  };

  const showPanel = (notice, choice) => {
    notice.querySelector('.cookie-notice').innerHTML = panelContent(choice);
    notice.querySelector('[data-cookie-save]')?.addEventListener('click', () => {
      rememberConsent(Boolean(notice.querySelector('[data-analytics-toggle]')?.checked));
      removeNotice(Boolean(lastTrigger));
    });
    bindChoices(notice);
  };

  const showNotice = (force = false, trigger = null) => {
    const existing = document.querySelector('#effectum-cookie-notice');
    if (existing) { existing.querySelector('button')?.focus(); return; }
    const storedChoice = readConsent();
    if (!force && storedChoice) { if (storedChoice.analytics) loadAnalytics(); return; }
    lastTrigger = trigger;
    document.body.insertAdjacentHTML('beforeend', `<div class="cookie-notice-shell" id="effectum-cookie-notice"><section class="cookie-notice" aria-label="Configuración de cookies" aria-live="polite">${bannerContent()}</section></div>`);
    document.body.classList.add('cookie-notice-open');
    const notice = document.querySelector('#effectum-cookie-notice');
    const syncNoticeHeight = () => document.body.style.setProperty('--cookie-notice-height', `${notice?.offsetHeight || 0}px`);
    syncNoticeHeight();
    if ('ResizeObserver' in window && notice) { noticeObserver = new ResizeObserver(syncNoticeHeight); noticeObserver.observe(notice); }
    notice.querySelector('[data-cookie-settings-open]')?.addEventListener('click', () => showPanel(notice, storedChoice));
    if (force) showPanel(notice, storedChoice); else bindChoices(notice);
  };

  const init = () => {
    showNotice();
    document.querySelectorAll('[data-cookie-settings]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => { event.preventDefault(); showNotice(true, trigger); });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
