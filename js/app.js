const root = document.documentElement;
const body = document.body;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function setCurrentYear() {
  $$('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

function initMobileNavigation() {
  const select = $('[data-mobile-menu]');
  if (!select) return;

  select.addEventListener('change', () => {
    const target = $(select.value);
    if (!target) return;
    target.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    });
    history.replaceState(null, '', select.value);
  });
}

function initSectionNavigation() {
  const links = $$('.primary-nav a[href^="#"]');
  const select = $('[data-mobile-menu]');
  const sections = links
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

  const activate = (id) => {
    links.forEach((link) => {
      link.classList.toggle('is-current', link.getAttribute('href') === `#${id}`);
    });
    if (select && [...select.options].some((option) => option.value === `#${id}`)) {
      select.value = `#${id}`;
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(visible.target.id);
    },
    {
      rootMargin: '-18% 0px -68% 0px',
      threshold: [0, 0.08, 0.25, 0.5],
    },
  );

  sections.forEach((section) => observer.observe(section));
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

  const updatePauseControl = () => {
    if (!pause) return;
    pause.setAttribute('aria-pressed', String(manuallyPaused));
    pause.textContent = manuallyPaused ? '▶' : 'II';
    pause.setAttribute(
      'aria-label',
      manuallyPaused ? 'Продължи автоматичния слайдер' : 'Пауза на автоматичния слайдер',
    );
  };

  const preloadFollowingImage = () => {
    const following = slides[(index + 1) % slides.length];
    const image = $('img', following);
    if (image) image.loading = 'eager';
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
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });

    preloadFollowingImage();
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    if (manuallyPaused || reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => show(index + 1), 5400);
  };

  const restart = () => {
    stop();
    start();
  };

  previous?.addEventListener('click', () => {
    show(index - 1);
    restart();
  });

  next?.addEventListener('click', () => {
    show(index + 1);
    restart();
  });

  gotoButtons.forEach((button) => {
    button.addEventListener('click', () => {
      show(Number.parseInt(button.dataset.goto || '0', 10));
      restart();
    });
  });

  pause?.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    updatePauseControl();
    manuallyPaused ? stop() : start();
  });

  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
      restart();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
      restart();
    }
    if (event.key === ' ') {
      event.preventDefault();
      pause?.click();
    }
  });

  stage.addEventListener('pointerdown', (event) => {
    pointerStart = event.clientX;
  });

  stage.addEventListener('pointerup', (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) < 50) return;
    show(distance > 0 ? index - 1 : index + 1);
    restart();
  });

  stage.addEventListener('pointercancel', () => {
    pointerStart = null;
  });

  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', start);
  stage.addEventListener('focusin', stop);
  stage.addEventListener('focusout', start);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  reducedMotion.addEventListener?.('change', start);

  updatePauseControl();
  show(0);
  start();
}

function initTextSizing() {
  const controls = $$('[data-font-size]');
  const content = $('[data-readable-content]');
  if (!controls.length || !content) return;

  const scales = {
    small: 0.9,
    normal: 1,
    large: 1.12,
  };

  let saved = 'normal';
  try {
    saved = localStorage.getItem('ganz-font-size') || 'normal';
  } catch {
    // Persistence is optional.
  }

  const apply = (size) => {
    const safeSize = Object.hasOwn(scales, size) ? size : 'normal';
    content.style.setProperty('--readable-scale', String(scales[safeSize]));
    controls.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.fontSize === safeSize);
      button.setAttribute('aria-pressed', String(button.dataset.fontSize === safeSize));
    });
    try {
      localStorage.setItem('ganz-font-size', safeSize);
    } catch {
      // The setting still applies for this visit.
    }
  };

  controls.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.fontSize || 'normal'));
  });

  apply(saved);
}

function initAccentSwitcher() {
  const controls = $$('.color-switcher button[data-accent]');
  if (!controls.length) return;

  const allowed = new Set(controls.map((button) => button.dataset.accent));
  let saved = root.dataset.accent || '1';

  try {
    saved = localStorage.getItem('ganz-accent') || saved;
  } catch {
    // Persistence is optional.
  }

  const apply = (accent) => {
    const safeAccent = allowed.has(accent) ? accent : '1';
    root.dataset.accent = safeAccent;
    controls.forEach((button) => {
      const active = button.dataset.accent === safeAccent;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try {
      localStorage.setItem('ganz-accent', safeAccent);
    } catch {
      // The setting still applies for this visit.
    }
  };

  controls.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.accent || '1'));
  });

  apply(saved);
}

function initLightbox() {
  const dialog = $('[data-lightbox]');
  const image = $('[data-lightbox-image]', dialog || document);
  const caption = $('[data-lightbox-caption]', dialog || document);
  const closeButton = $('[data-lightbox-close]', dialog || document);
  const triggers = $$('[data-lightbox-src]');

  if (!dialog || !image || !caption || !closeButton || !triggers.length) return;

  let activeTrigger = null;

  const close = () => {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      activeTrigger = trigger;
      const title = trigger.dataset.lightboxTitle || '';
      image.src = trigger.dataset.lightboxSrc || '';
      image.alt = title;
      caption.textContent = title;
      body.classList.add('lightbox-open');

      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });

  closeButton.addEventListener('click', close);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener('close', () => {
    body.classList.remove('lightbox-open');
    image.removeAttribute('src');
    activeTrigger?.focus();
    activeTrigger = null;
  });
}

function initContactForm() {
  const form = $('#contact-form');
  const status = $('#form-status');
  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const subject = String(data.get('subject') || 'Запитване от ganz-md.com').trim();
    const message = String(data.get('message') || '').trim();

    const bodyText = [
      `Име: ${name}`,
      `Е-mail за отговор: ${email}`,
      '',
      message,
    ].join('\n');

    const mailto = new URL('mailto:ganzmd@gmail.com');
    mailto.searchParams.set('subject', subject);
    mailto.searchParams.set('body', bodyText);

    status.textContent = 'Отваря се Вашият e-mail клиент с попълнено съобщение.';
    window.location.href = mailto.toString();
  });
}

setCurrentYear();
initMobileNavigation();
initSectionNavigation();
initCarousel();
initTextSizing();
initAccentSwitcher();
initLightbox();
initContactForm();
