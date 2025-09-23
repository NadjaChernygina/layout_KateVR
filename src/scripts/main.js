'use strict';

/* ==============================
   BURGER MENU
============================== */
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

/* ==============================
   SECTION OBSERVER (fade-in on scroll)
============================== */
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

/* ==============================
   TESTIMONIALS SLIDER
============================== */
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
                 aria-selected="${i === 0}"
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
      } catch {
        card.focus();
      }
    }

    function setIndex(i, moveFocus = false) {
      index = clamp(i);
      track.style.transform = `translateX(-${index * vw()}px)`;

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

    // --- Swipe support (touch devices)
    let startX = 0;
    let deltaX = 0;
    const threshold = 50;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        deltaX = 0;
      }
    });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        deltaX = e.touches[0].clientX - startX;
      }
    });

    viewport.addEventListener('touchend', () => {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          setIndex(index - 1, true);
        } else {
          setIndex(index + 1, true);
        }
      }
      startX = 0;
      deltaX = 0;
    });

    // Bullet interactions
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => setIndex(i, true));

      dot.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          return setIndex(index + 1, true);
        }

        if (e.key === 'ArrowLeft') {
          return setIndex(index - 1, true);
        }

        if (e.key === 'Home') {
          return setIndex(0, true);
        }

        if (e.key === 'End') {
          return setIndex(slides.length - 1, true);
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
    setIndex(0);
  }
})();

/* ==============================
   FEATURES SLIDER (mobile/tablet only)
============================== */
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

      // eslint-disable-next-line no-unused-expressions
      prevBtn && (prevBtn.disabled = index === 0);
      // eslint-disable-next-line no-unused-expressions
      nextBtn && (nextBtn.disabled = index === slides.length - 1);

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
      track.style.willChange = 'transform';
      prevBtn?.addEventListener('click', onPrev);
      nextBtn?.addEventListener('click', onNext);
      window.addEventListener('resize', onResize);

      // --- swipe support ---
      let startX = 0;
      let deltaX = 0;

      function onTouchStart(e) {
        startX = e.touches[0].clientX;
      }

      function onTouchMove(e) {
        deltaX = e.touches[0].clientX - startX;
      }

      function onTouchEnd() {
        if (Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            onPrev();
          } else {
            onNext();
          }
        }
        deltaX = 0;
      }

      viewport.addEventListener('touchstart', onTouchStart, { passive: true });
      viewport.addEventListener('touchmove', onTouchMove, { passive: true });
      viewport.addEventListener('touchend', onTouchEnd);

      setIndex(0);
    }

    function unbind() {
      if (!enabled) {
        return;
      }
      enabled = false;

      prevBtn?.removeEventListener('click', onPrev);
      nextBtn?.removeEventListener('click', onNext);
      window.removeEventListener('resize', onResize);

      // знімаємо свайп
      // eslint-disable-next-line no-undef
      viewport.removeEventListener('touchstart', onTouchStart);
      // eslint-disable-next-line no-undef
      viewport.removeEventListener('touchmove', onTouchMove);
      // eslint-disable-next-line no-undef
      viewport.removeEventListener('touchend', onTouchEnd);

      // reset transforms so desktop layout shows three columns
      track.style.transform = 'none';
      slides.forEach((sl) => sl.classList.add('is-active'));
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
      // eslint-disable-next-line no-unused-expressions
      e.matches ? unbind() : bind();
    }

    // eslint-disable-next-line no-unused-expressions
    mql.addEventListener?.('change', applyByMQ) || mql.addListener(applyByMQ);
    renderFraction();
    applyByMQ(mql);
  }
})();

/* ==============================
   CONTACT FORM VALIDATION
============================== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');

  if (!form) {
    return;
  }

  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const messageInput = form.querySelector('#message');
  const errorName = document.getElementById('error-name');
  const errorEmail = document.getElementById('error-email');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', (e) => {
    let valid = true;

    [nameInput, emailInput, messageInput].forEach((el) => {
      if (!el) {
        return;
      }
      el.classList.remove('is-invalid');
    });

    [errorName, errorEmail, errorMessage].forEach(
      (el) => (el.textContent = ''),
    );

    if (!nameInput.value.trim()) {
      valid = false;
      nameInput.classList.add('is-invalid');
      errorName.textContent = 'Please enter your name.';
    }

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    if (!emailPattern.test(emailInput.value.trim())) {
      valid = false;
      emailInput.classList.add('is-invalid');
      errorEmail.textContent = 'Please enter a valid email.';
    }

    if (messageInput.value.trim().length < 5) {
      valid = false;
      messageInput.classList.add('is-invalid');
      errorMessage.textContent = 'Message should be at least 5 characters.';
    }

    if (!valid) {
      e.preventDefault();
    }
  });
});
