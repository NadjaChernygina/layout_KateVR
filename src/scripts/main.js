'use strict';

const burger = document.querySelector('.header__burger');
const nav = document.querySelector('.header__nav');
const menuLinks = document.querySelectorAll('.header__nav a');

burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  nav.classList.toggle('active');
});

menuLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (burger.classList.contains('active')) {
      burger.classList.remove('active');
      nav.classList.remove('active');
    }
  });
});

const sections = document.querySelectorAll('.section');

// eslint-disable-next-line no-undef
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.2 },
);

sections.forEach((section) => observer.observe(section));

(function initTestimonials(selector = '.testimonials') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(selector).forEach(initOne);
  });

  function initOne(root) {
    const viewport = root.querySelector('.testimonials__viewport');
    const track = root.querySelector('.testimonials__track');
    const slides = Array.from(root.querySelectorAll('.testimonials__slide'));
    const pager = root.querySelector('.testimonials__pagination');

    if (!viewport || !track || !slides.length || !pager) {
      return;
    }

    // Autogenerate dots if empty
    if (!pager.children.length) {
      slides.forEach((s, i) => {
        if (!s.id) {
          s.id = `ts-slide-${i + 1}`;
        }
      });

      pager.innerHTML = slides
        .map(
          (s, i) =>
            `<button class="testimonials__dot" role="tab"
                 aria-selected="${i === 0 ? 'true' : 'false'}"
                 aria-controls="${s.id}" tabindex="${i === 0 ? 0 : -1}">
           <span class="visually-hidden">Slide ${i + 1}</span>
         </button>`,
        )
        .join('');
    }

    const dots = Array.from(pager.querySelectorAll('.testimonials__dot'));

    let index = 0;

    const clamp = (i) => Math.max(0, Math.min(i, slides.length - 1));
    const vw = () => viewport.clientWidth;

    // Helper: focus without scrolling the page
    function focusCardSafely(i) {
      const card = slides[i].querySelector('.testimonials__card');

      if (!card || typeof card.focus !== 'function') {
        return;
      }

      try {
        card.focus({ preventScroll: true });
      } catch (_) {
        card.focus();
      }
    }

    function setIndex(i, moveFocus = false) {
      index = clamp(i);

      const offset = index * vw();

      track.style.transform = `translateX(-${offset}px)`;

      slides.forEach((slide, s) => {
        const active = s === index;

        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${s + 1} of ${slides.length}`);
      });

      dots.forEach((dot, d) => {
        const active = d === index;

        dot.setAttribute('aria-selected', String(active));
        dot.tabIndex = active ? 0 : -1;
      });

      if (moveFocus) {
        const hasTransition =
          // eslint-disable-next-line no-undef
          getComputedStyle(track).transitionDuration !== '0s';

        if (hasTransition) {
          const onEnd = () => {
            focusCardSafely(index);
            track.removeEventListener('transitionend', onEnd);
          };

          track.addEventListener('transitionend', onEnd, { once: true });
        } else {
          focusCardSafely(index);
        }
      }
    }

    // Bullet interactions
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => setIndex(i, true));

      dot.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setIndex(index + 1, true);
        }

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setIndex(index - 1, true);
        }

        if (e.key === 'Home') {
          e.preventDefault();
          setIndex(0, true);
        }

        if (e.key === 'End') {
          e.preventDefault();
          setIndex(slides.length - 1, true);
        }
      });
    });

    // Optional global keyboard support
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex(index + 1, true);
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(index - 1, true);
      }
    });

    // Keep position on resize/font load
    let rTO;
    const recalc = () => setIndex(index, false);

    window.addEventListener('resize', () => {
      clearTimeout(rTO);
      rTO = setTimeout(recalc, 80);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(recalc);
    }

    // Init
    setIndex(0, false);
  }
})();

/* Features lists slider — mobile/tablet only */
(function initFeaturesSlider(
  rootSel = '.features',
  bpDesktop = '(min-width: 1024px)',
) {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(rootSel).forEach(setup);
  });

  function setup(root) {
    const viewport = root.querySelector('.features__viewport');
    const track = root.querySelector('.features__track');
    const slides = Array.from(root.querySelectorAll('.features__list-slide'));
    const prevBtn = root.querySelector('.features__btn--prev');
    const nextBtn = root.querySelector('.features__btn--next');
    const currentEl = root.querySelector('.features__current');
    const totalEl = root.querySelector('.features__total');

    if (!viewport || !track || slides.length < 2) {
      return;
    }

    // state
    let index = 0;
    let enabled = false;
    const mql = window.matchMedia(bpDesktop);

    // format helpers
    const pad2 = (n) => String(n).padStart(2, '0');
    const vw = () => viewport.clientWidth;

    function renderFraction() {
      if (currentEl) {
        currentEl.textContent = pad2(enabled ? index + 1 : 1);
      }

      if (totalEl) {
        totalEl.textContent = pad2(slides.length);
      }
    }

    function setIndex(i, focusCard = false) {
      index = Math.max(0, Math.min(i, slides.length - 1));
      track.style.transform = `translateX(-${index * vw()}px)`;

      slides.forEach((sl, s) => {
        const active = s === index;

        sl.classList.toggle('is-active', active);
        sl.setAttribute('aria-hidden', String(!active));
        sl.setAttribute('aria-label', `${s + 1} of ${slides.length}`);
      });

      if (prevBtn) {
        prevBtn.disabled = index === 0;
      }

      if (nextBtn) {
        nextBtn.disabled = index === slides.length - 1;
      }

      renderFraction();

      if (focusCard) {
        const card =
          slides[index].querySelector('.features__list-title') || slides[index];

        try {
          card.focus?.({ preventScroll: true });
        } catch {
          card.focus?.();
        }
      }
    }

    function bind() {
      if (enabled) {
        return;
      }
      enabled = true;

      // ensure proper transform baseline
      track.style.transform = 'translateX(0px)';
      track.style.willChange = track.style.willChange || 'transform';

      prevBtn?.addEventListener('click', onPrev);
      nextBtn?.addEventListener('click', onNext);
      window.addEventListener('resize', onResize);

      setIndex(0, false);
    }

    function unbind() {
      if (!enabled) {
        return;
      }
      enabled = false;

      prevBtn?.removeEventListener('click', onPrev);
      nextBtn?.removeEventListener('click', onNext);
      window.removeEventListener('resize', onResize);

      // reset transforms so desktop layout shows three columns
      track.style.transform = 'none';
      // eslint-disable-next-line max-len
      slides.forEach((sl) => sl.classList.add('is-active')); // all visible conceptually
      renderFraction();
    }

    function onPrev() {
      setIndex(index - 1, true);
    }

    function onNext() {
      setIndex(index + 1, true);
    }

    function onResize() {
      setIndex(index, false);
    }

    // responsive enable/disable
    function applyByMQ(e) {
      if (e.matches) {
        // desktop: disable slider
        unbind();
      } else {
        // below desktop: enable slider
        bind();
      }
    }

    // eslint-disable-next-line no-unused-expressions
    mql.addEventListener
      ? mql.addEventListener('change', applyByMQ)
      : mql.addListener(applyByMQ); // legacy

    // initial
    renderFraction();
    applyByMQ(mql);
  }
})();

/* Features lists slider — mobile/tablet only */
(function initFeaturesSlider(
  rootSel = '.features',
  bpDesktop = '(min-width: 1024px)',
) {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(rootSel).forEach(setup);
  });

  function setup(root) {
    const viewport = root.querySelector('.features__viewport');
    const track = root.querySelector('.features__track');
    const slides = Array.from(root.querySelectorAll('.features__list-slide'));
    const prevBtn = root.querySelector('.features__btn--prev');
    const nextBtn = root.querySelector('.features__btn--next');
    const currentEl = root.querySelector('.features__current');
    const totalEl = root.querySelector('.features__total');

    if (!viewport || !track || slides.length < 2) {
      return;
    }

    // state
    let index = 0;
    let enabled = false;
    const mql = window.matchMedia(bpDesktop);

    // format helpers
    const pad2 = (n) => String(n).padStart(2, '0');
    const vw = () => viewport.clientWidth;

    function renderFraction() {
      if (currentEl) {
        currentEl.textContent = pad2(enabled ? index + 1 : 1);
      }

      if (totalEl) {
        totalEl.textContent = pad2(slides.length);
      }
    }

    function setIndex(i, focusCard = false) {
      index = Math.max(0, Math.min(i, slides.length - 1));
      track.style.transform = `translateX(-${index * vw()}px)`;

      slides.forEach((sl, s) => {
        const active = s === index;

        sl.classList.toggle('is-active', active);
        sl.setAttribute('aria-hidden', String(!active));
        sl.setAttribute('aria-label', `${s + 1} of ${slides.length}`);
      });

      if (prevBtn) {
        prevBtn.disabled = index === 0;
      }

      if (nextBtn) {
        nextBtn.disabled = index === slides.length - 1;
      }

      renderFraction();

      if (focusCard) {
        const card =
          slides[index].querySelector('.features__list-title') || slides[index];

        try {
          card.focus?.({ preventScroll: true });
        } catch {
          card.focus?.();
        }
      }
    }

    function bind() {
      if (enabled) {
        return;
      }
      enabled = true;

      // ensure proper transform baseline
      track.style.transform = 'translateX(0px)';
      track.style.willChange = track.style.willChange || 'transform';

      prevBtn?.addEventListener('click', onPrev);
      nextBtn?.addEventListener('click', onNext);
      window.addEventListener('resize', onResize);

      setIndex(0, false);
    }

    function unbind() {
      if (!enabled) {
        return;
      }
      enabled = false;

      prevBtn?.removeEventListener('click', onPrev);
      nextBtn?.removeEventListener('click', onNext);
      window.removeEventListener('resize', onResize);

      // reset transforms so desktop layout shows three columns
      track.style.transform = 'none';
      // eslint-disable-next-line max-len
      slides.forEach((sl) => sl.classList.add('is-active')); // all visible conceptually
      renderFraction();
    }

    function onPrev() {
      setIndex(index - 1, true);
    }

    function onNext() {
      setIndex(index + 1, true);
    }

    function onResize() {
      setIndex(index, false);
    }

    // responsive enable/disable
    function applyByMQ(e) {
      if (e.matches) {
        // desktop: disable slider
        unbind();
      } else {
        // below desktop: enable slider
        bind();
      }
    }

    // eslint-disable-next-line no-unused-expressions
    mql.addEventListener
      ? mql.addEventListener('change', applyByMQ)
      : mql.addListener(applyByMQ); // legacy

    // initial
    renderFraction();
    applyByMQ(mql);
  }
})();
