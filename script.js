// TODO ANALYTICS: conectar proveedor de analítica y mapear data-event cuando se decida la herramienta y el modelo de consentimiento.
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

document.querySelector('#lead-form')?.addEventListener('submit', () => {
  document.dispatchEvent(new CustomEvent('effectum:lead', {
    detail: { event: 'form_submit' }
  }));
});
