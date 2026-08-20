// Analytics se carga desde cookie-consent.js únicamente después del consentimiento.
// Estos eventos dejan una nomenclatura estable para el futuro enrutamiento de conversiones.
const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileMenu = window.matchMedia('(max-width: 860px)');

const setMenu = (open, restoreFocus = true) => {
  const shouldOpen = Boolean(open && mobileMenu.matches);
  document.body.classList.toggle('menu-open', shouldOpen);
  menuButton?.setAttribute('aria-expanded', String(shouldOpen));
  menuButton?.setAttribute('aria-label', shouldOpen ? 'Cerrar menú' : 'Abrir menú');

  if (nav) {
    nav.inert = mobileMenu.matches && !shouldOpen;
    if (mobileMenu.matches) nav.setAttribute('aria-hidden', String(!shouldOpen));
    else nav.removeAttribute('aria-hidden');
  }

  if (shouldOpen) {
    requestAnimationFrame(() => nav?.querySelector('a')?.focus());
  } else if (restoreFocus && nav?.contains(document.activeElement)) {
    menuButton?.focus();
  }
};

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false, false);
});

document.querySelector('.brand')?.addEventListener('click', () => setMenu(false, false));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    event.preventDefault();
    setMenu(false);
  }

  if (event.key === 'Tab' && document.body.classList.contains('menu-open')) {
    const focusable = [menuButton, ...nav.querySelectorAll('a')].filter(Boolean);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

mobileMenu.addEventListener('change', () => setMenu(false, false));
setMenu(false, false);

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = [...document.querySelectorAll('[data-reveal]')];
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
  revealItems.forEach((item) => observer.observe(item));
}

document.addEventListener('click', (event) => {
  const element = event.target.closest('[data-event]');
  if (!element) return;
  document.dispatchEvent(new CustomEvent('effectum:lead', {
    detail: { event: element.dataset.event }
  }));
});

const leadForm = document.querySelector('#lead-form');

leadForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = leadForm.querySelector('button[type="submit"]');
  const status = leadForm.querySelector('[data-form-status]');
  const initialLabel = submitButton?.innerHTML;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';
  }
  if (status) status.textContent = 'Enviando tu consulta…';

  try {
    const response = await fetch(leadForm.action, {
      method: 'POST',
      body: new FormData(leadForm),
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error('form_submission_failed');

    leadForm.reset();
    if (status) status.textContent = 'Gracias. Hemos recibido tu consulta y te responderemos lo antes posible.';
    document.dispatchEvent(new CustomEvent('effectum:lead', {
      detail: { event: 'form_submit' }
    }));
  } catch {
    if (status) status.textContent = 'No hemos podido enviar la consulta. Puedes escribirnos a effectum.asesores@gmail.com.';
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = initialLabel;
    }
  }
});
