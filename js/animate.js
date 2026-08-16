/* ============================================================
   HEALTHAI — JS ANIMATION ENGINE
   Number counters, ripples, page transitions, spring helpers
   ============================================================ */

const Animate = {

  /* ---- Number counter (smooth count-up) ---- */
  countUp(element, target, duration = 900, suffix = '', decimals = 0) {
    if (!element) return;
    const start     = parseFloat(element.dataset.current || 0);
    const startTime = performance.now();
    const range     = target - start;

    if (range === 0) { element.textContent = target.toFixed(decimals) + suffix; return; }

    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutExpo(progress);
      const current  = start + range * eased;

      element.textContent = current.toFixed(decimals) + suffix;
      element.dataset.current = current;

      if (progress < 1) requestAnimationFrame(tick);
      else {
        element.textContent    = target.toFixed(decimals) + suffix;
        element.dataset.current = target;
      }
    };
    requestAnimationFrame(tick);
  },

  /* ---- Ripple effect on any element ---- */
  ripple(element, color = 'rgba(77,158,255,0.25)') {
    const existing = element.querySelector('.ripple-el');
    if (existing) existing.remove();

    const rect   = element.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2.5;
    const ripple = document.createElement('span');

    ripple.className = 'ripple-el';
    Object.assign(ripple.style, {
      position:    'absolute',
      width:       size + 'px',
      height:      size + 'px',
      borderRadius:'50%',
      background:  color,
      transform:   'scale(0) translate(-50%, -50%)',
      left:        '50%',
      top:         '50%',
      pointerEvents:'none',
      transition:  'transform 0.55s cubic-bezier(0.25,1.25,0.5,1), opacity 0.4s ease',
      opacity:     '1',
    });

    const prev = element.style.position;
    if (!prev || prev === 'static') element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1) translate(-50%, -50%)';
      setTimeout(() => {
        ripple.style.opacity = '0';
        setTimeout(() => ripple.remove(), 400);
      }, 300);
    });
  },

  /* ---- Page transition ---- */
  switchPage(fromId, toId) {
    const from = fromId ? document.getElementById(`page-${fromId}`) : null;
    const to   = document.getElementById(`page-${toId}`);
    if (!to) return;

    if (from && from !== to) {
      from.classList.add('exit');
      setTimeout(() => {
        from.classList.remove('active', 'exit');
      }, 180);
    }

    setTimeout(() => {
      to.classList.add('active');
    }, from ? 80 : 0);
  },

  /* ---- Stagger animate a list ---- */
  staggerIn(selector, delayStep = 50, startDelay = 0) {
    const els = document.querySelectorAll(selector);
    els.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = `opacity 300ms ease, transform 350ms cubic-bezier(0.34,1.56,0.64,1)`;

      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }, startDelay + i * delayStep);
    });
  },

  /* ---- Flash a number (on update) ---- */
  flash(element) {
    if (!element) return;
    element.style.transition = 'color 150ms ease';
    element.style.color = 'var(--primary)';
    setTimeout(() => {
      element.style.color = '';
    }, 600);
  },

  /* ---- Bounce an element ---- */
  bounce(element) {
    if (!element) return;
    element.style.transition = 'none';
    element.style.transform  = 'scale(0.9)';
    requestAnimationFrame(() => {
      element.style.transition = 'transform 500ms cubic-bezier(0.34,1.56,0.64,1)';
      element.style.transform  = 'scale(1)';
    });
  },

  /* ---- Shake (for validation errors) ---- */
  shake(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // reflow
    element.style.animation = 'shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97)';
  },

  /* ---- Water ripple (on big bottle) ---- */
  waterRipple() {
    const bottle = document.querySelector('.big-bottle, .water-bottle');
    if (!bottle) return;
    bottle.style.animation = 'none';
    bottle.offsetHeight;
    bottle.classList.add('water-added');
    setTimeout(() => bottle.classList.remove('water-added'), 700);
  },

  /* ---- Score animate ---- */
  scoreIn(element, value) {
    if (!element) return;
    element.classList.remove('animate');
    element.offsetHeight;
    element.classList.add('animate');
    this.countUp(element, value, 1000);
  },
};

/* Shake keyframes injected via JS */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
  10%, 90%  { transform: translateX(-2px); }
  20%, 80%  { transform: translateX(4px);  }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60%  { transform: translateX(5px);  }
}`;
document.head.appendChild(shakeStyle);
