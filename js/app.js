const body = document.body;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function setCurrentYear() {
  $$('[data-current-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
}

function initMobileNavigation() {
  const select = $('[data-mobile-menu]');
  if (!select) return;
  select.addEventListener('change', () => {
    if (select.value) window.location.assign(select.value);
  });
}

function initSectionNavigation() {
  if (body.dataset.page !== 'home' || !('IntersectionObserver' in window)) return;
  const links = $$('.primary-nav a');
  const select = $('[data-mobile-menu]');
  const entries = links.map((link) => {
    const url = new URL(link.href, window.location.href);
    return { link, hash: url.hash, section: url.hash ? $(url.hash) : null };
  }).filter((item) => item.section);
  if (!entries.length) return;

  const activate = (hash) => {
    entries.forEach(({ link, hash: linkHash }) => link.classList.toggle('is-current', linkHash === hash));
    if (select) {
      const option = [...select.options].find((item) => new URL(item.value || window.location.href, window.location.href).hash === hash);
      if (option) select.value = option.value;
    }
  };

  const observer = new IntersectionObserver((observed) => {
    const visible = observed.filter((item) => item.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(`#${visible.target.id}`);
  }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.08, 0.25, 0.5] });

  entries.forEach(({ section }) => observer.observe(section));
}

function initSideMenu() {
  const panel = $('[data-side-menu]');
  const backdrop = $('[data-side-menu-backdrop]');
  const openButtons = $$('[data-side-menu-open]');
  const closeButton = $('[data-side-menu-close]');
  if (!panel || !backdrop || !openButtons.length || !closeButton) return;

  let returnFocus = null;
  panel.inert = true;

  const focusableSelector = 'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const close = () => {
    body.classList.remove('side-menu-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    openButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    window.setTimeout(() => returnFocus?.focus(), reducedMotion.matches ? 0 : 250);
  };
  const open = (button) => {
    returnFocus = button;
    body.classList.add('side-menu-open');
    panel.removeAttribute('inert');
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    openButtons.forEach((item) => item.setAttribute('aria-expanded', 'true'));
    window.requestAnimationFrame(() => closeButton.focus());
  };

  openButtons.forEach((button) => button.addEventListener('click', () => open(button)));
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (event) => {
    if (!body.classList.contains('side-menu-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = $$(focusableSelector, panel).filter((node) => node.tagName === 'SUMMARY' || !node.closest('details:not([open])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

function initCarousel() {
  const carousel = $('[data-carousel]');
  if (!carousel) return;
  const stage = $('[data-carousel-stage]', carousel);
  const slides = $$('[data-slide]', carousel);
  const previous = $('[data-prev]', carousel);
  const next = $('[data-next]', carousel);
  const gotoButtons = $$('[data-goto]', carousel);
  const pause = $('[data-pause]', carousel);
  if (!stage || slides.length < 2 || gotoButtons.length !== slides.length) return;

  let index = 0;
  let timer = null;
  let manuallyPaused = false;
  let pointerStart = null;

  const updatePause = () => {
    if (!pause) return;
    pause.setAttribute('aria-pressed', String(manuallyPaused));
    pause.textContent = manuallyPaused ? '▶' : 'II';
    pause.setAttribute('aria-label', manuallyPaused ? 'Продължи автоматичния слайдер' : 'Пауза на автоматичния слайдер');
  };
  const show = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    gotoButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle('is-active', active);
      active ? button.setAttribute('aria-current', 'true') : button.removeAttribute('aria-current');
    });
    const nextImage = $('img', slides[(index + 1) % slides.length]);
    if (nextImage) nextImage.loading = 'eager';
  };
  const stop = () => { window.clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (manuallyPaused || reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => show(index + 1), 5400);
  };
  const restart = () => { stop(); start(); };

  previous?.addEventListener('click', () => { show(index - 1); restart(); });
  next?.addEventListener('click', () => { show(index + 1); restart(); });
  gotoButtons.forEach((button) => button.addEventListener('click', () => { show(Number.parseInt(button.dataset.goto || '0', 10)); restart(); }));
  pause?.addEventListener('click', () => { manuallyPaused = !manuallyPaused; updatePause(); manuallyPaused ? stop() : start(); });
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); restart(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); restart(); }
    if (event.key === ' ') { event.preventDefault(); pause?.click(); }
  });
  stage.addEventListener('pointerdown', (event) => { pointerStart = event.clientX; });
  stage.addEventListener('pointerup', (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) < 50) return;
    show(distance > 0 ? index - 1 : index + 1); restart();
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });
  stage.addEventListener('mouseenter', stop); stage.addEventListener('mouseleave', start);
  stage.addEventListener('focusin', stop); stage.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reducedMotion.addEventListener?.('change', start);
  updatePause(); show(0); start();
}

function initTextSizing() {
  const controls = $$('[data-font-size]');
  const content = $('[data-readable-content]');
  if (!controls.length || !content) return;
  const scales = { small: 0.9, normal: 1, large: 1.12 };
  let saved = 'normal';
  try { saved = localStorage.getItem('ganz-font-size') || 'normal'; } catch {}
  const apply = (size) => {
    const safe = Object.hasOwn(scales, size) ? size : 'normal';
    content.style.setProperty('--readable-scale', String(scales[safe]));
    controls.forEach((button) => {
      const active = button.dataset.fontSize === safe;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('ganz-font-size', safe); } catch {}
  };
  controls.forEach((button) => button.addEventListener('click', () => apply(button.dataset.fontSize || 'normal')));
  apply(saved);
}

function initLightbox() {
  const dialog = $('[data-lightbox]');
  const image = $('[data-lightbox-image]', dialog || document);
  const caption = $('[data-lightbox-caption]', dialog || document);
  const closeButton = $('[data-lightbox-close]', dialog || document);
  const previous = $('[data-lightbox-prev]', dialog || document);
  const next = $('[data-lightbox-next]', dialog || document);
  const triggers = $$('[data-lightbox-src]');
  if (!dialog || !image || !caption || !closeButton || !triggers.length) return;

  let index = 0;
  let activeTrigger = null;
  const load = (nextIndex) => {
    index = (nextIndex + triggers.length) % triggers.length;
    const trigger = triggers[index];
    const title = trigger.dataset.lightboxTitle || '';
    image.src = trigger.dataset.lightboxSrc || '';
    image.alt = title;
    caption.textContent = `${title} — ${index + 1} / ${triggers.length}`;
  };
  const close = () => {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };
  const open = (trigger, triggerIndex) => {
    activeTrigger = trigger; load(triggerIndex); body.classList.add('lightbox-open');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  };
  triggers.forEach((trigger, triggerIndex) => trigger.addEventListener('click', () => open(trigger, triggerIndex)));
  closeButton.addEventListener('click', close);
  previous?.addEventListener('click', () => load(index - 1));
  next?.addEventListener('click', () => load(index + 1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); load(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); load(index + 1); }
  });
  dialog.addEventListener('close', () => {
    body.classList.remove('lightbox-open'); image.removeAttribute('src'); activeTrigger?.focus(); activeTrigger = null;
  });
}

function initContactForm() {
  const form = $('#contact-form'); const status = $('#form-status');
  if (!form || !status) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const subject = String(data.get('subject') || 'Запитване от ganz-md.com').trim();
    const message = String(data.get('message') || '').trim();
    const mailto = new URL('mailto:ganzmd@gmail.com');
    mailto.searchParams.set('subject', subject);
    mailto.searchParams.set('body', [`Име: ${name}`, `Е-mail за отговор: ${email}`, '', message].join('\n'));
    status.textContent = 'Отваря се Вашият e-mail клиент с попълнено съобщение.';
    window.location.href = mailto.toString();
  });
}

setCurrentYear();
initMobileNavigation();
initSectionNavigation();
initSideMenu();
initCarousel();
initTextSizing();
initLightbox();
initContactForm();
