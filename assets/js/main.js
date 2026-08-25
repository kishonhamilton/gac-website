/**
 * Gospel Assembly Church — shared site behavior
 * Loaded on every page. No build step required.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Content config ---------- */
  const CONTENT_URL = 'assets/data/content.json';
  let siteContent = null;

  /* ---------- Backend API base ----------
     In production, /api/* is expected to be routed to the backend on the
     same origin (rewrite rule or subdomain — see README.md). For local
     dev, the static site and the Node backend run on different ports, so
     fall back to localhost:3000 when previewing on localhost. */
  const API_BASE =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : '';
  // Exposed for page-specific scripts (e.g. the events calendar) that need
  // the same backend base URL without duplicating the localhost detection.
  window.GAC_API_BASE = API_BASE;

  async function loadContent() {
    try {
      const res = await fetch(CONTENT_URL);
      siteContent = await res.json();
    } catch (err) {
      console.warn('[GAC] Could not load content.json, falling back to static markup.', err);
    }
    document.dispatchEvent(new CustomEvent('gac:content-ready', { detail: siteContent }));
    return siteContent;
  }

  /* ---------- Header: solid-on-scroll ---------- */
  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-solid', window.scrollY > 40 || !document.querySelector('.hero'));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const panel = document.querySelector('.mobile-nav');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    panel.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );
  }

  /* ---------- Mark current nav link ---------- */
  function markCurrentNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.primary-nav a, .mobile-nav a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- Subtle parallax hero (respects reduced motion) ---------- */
  function initParallax() {
    const media = document.querySelector('[data-parallax]');
    if (!media || prefersReducedMotion) return;
    let ticking = false;
    const update = () => {
      const rect = media.parentElement.getBoundingClientRect();
      const offset = Math.max(-rect.top, 0) * 0.28; // slower than scroll = classic parallax
      media.style.transform = `translate3d(0, ${offset}px, 0)`;
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Render service times from content.json ---------- */
  function renderServiceTimes(content) {
    const mount = document.querySelector('[data-service-times]');
    if (!mount || !content) return;
    mount.innerHTML = content.serviceTimes
      .map(
        (day) => `
      <div class="service-card reveal">
        <div class="day">${escapeHtml(day.day)}</div>
        ${day.services
          .map(
            (s) => `
          <div class="service-item">
            <span class="name">${escapeHtml(s.name)}</span>
            <span class="time">${escapeHtml(s.time)}</span>
            <span class="loc">${escapeHtml(s.location)}</span>
          </div>`
          )
          .join('')}
      </div>`
      )
      .join('');
    initReveal();
  }

  /* ---------- Render footer contact bits from content.json ---------- */
  function renderFooterContent(content) {
    if (!content) return;
    document.querySelectorAll('[data-footer-phone]').forEach((el) => (el.textContent = content.contact.phone));
    document.querySelectorAll('[data-footer-phone-alt]').forEach((el) => (el.textContent = content.contact.phoneAlt));
    document.querySelectorAll('[data-footer-email]').forEach((el) => (el.textContent = content.contact.email));
    document.querySelectorAll('[data-footer-address]').forEach((el) => (el.textContent = content.contact.address));
    document.querySelectorAll('[data-footer-office-address]').forEach((el) => (el.textContent = content.contact.officeAddress));

    if (content.social) {
      Object.keys(content.social).forEach((network) => {
        const url = content.social[network];
        document.querySelectorAll(`[data-social="${network}"]`).forEach((el) => {
          if (url) {
            el.href = url;
            el.target = '_blank';
            el.rel = 'noopener';
            el.hidden = false;
          } else {
            el.hidden = true;
          }
        });
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Generic form handling (visitor / contact) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = form.querySelector('.form-status');
        // NOTE: This is a front-end stub. Wire this up to your backend
        // endpoint (e.g. POST /api/contact) which should validate,
        // rate-limit, and forward to CCB or email — see README.md.
        if (status) {
          status.textContent =
            'Thank you — your message has been received. Our team will follow up soon. ' +
            '(Demo form: connect this to a backend endpoint per README.md before launch.)';
          status.classList.remove('err');
          status.classList.add('show', 'ok');
        }
        form.reset();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileNav();
    markCurrentNav();
    initParallax();
    initReveal();
    initForms();
    loadContent().then((content) => {
      renderServiceTimes(content);
      renderFooterContent(content);
    });
  });
})();
