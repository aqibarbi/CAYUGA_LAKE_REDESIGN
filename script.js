/* Cayuga Lake Wine Trail: small, dependency-free enhancements.
   The page works without this file. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('.site-header');
  const hero = $('.hero');
  const seal = $('.seal');
  const bar = $('.progress');

  /* 1. Scroll-linked values: header state, progress bar, hero parallax, seal spin */
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (!calm && hero) {
      const limit = hero.offsetHeight * 0.09;
      hero.style.setProperty('--py', Math.min(y * 0.25, limit).toFixed(1) + 'px');
      if (seal) seal.style.setProperty('--spin', (y * 0.04).toFixed(2) + 'deg');
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* 2. Photo reveal, once per image. The parent is observed because a clipped
     image can report no visible area. */
  const shots = $$('[data-reveal]');
  if (calm || !('IntersectionObserver' in window)) {
    shots.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        $('[data-reveal]', target).classList.add('is-in');
        io.unobserve(target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    shots.forEach((el) => io.observe(el.parentElement));
  }

  /* 3. Mark the current section in the nav */
  const links = $$('.nav a[href^="#"]').filter((a) => a.hash.length > 1);
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* 4. Mobile menu: close after a link click or Escape */
  const toggle = $('#nav-toggle');
  if (toggle) {
    $$('.nav a').forEach((a) => a.addEventListener('click', () => { toggle.checked = false; }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.checked) { toggle.checked = false; $('.nav-btn')?.focus(); }
    });
  }

  /* 5. Store: sort products in place by reordering the list */
  const list = $('#products');
  const sort = $('#sort');
  const status = $('#store-status');
  if (list && sort && status) {
    const items = $$('.product', list);
    const orders = {
      newest: (a, b) => b.dataset.added - a.dataset.added,
      az: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
      za: (a, b) => b.dataset.name.localeCompare(a.dataset.name),
    };
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    sort.addEventListener('change', () => {
      const next = sort.value === 'random' ? shuffle([...items]) : [...items].sort(orders[sort.value]);
      next.forEach((li) => list.append(li));
      status.textContent = `${items.length} products, sorted by ${sort.selectedOptions[0].text}`;
    });
  }

  /* 6. Newsletter form: validate and confirm in place */
  const form = $('.signup');
  const input = $('#email');
  const note = $('#form-note');
  if (form && input && note) {
    const idle = note.textContent;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = input.value.trim() !== '' && input.checkValidity();
      input.setAttribute('aria-invalid', String(!ok));
      note.className = 'note ' + (ok ? 'is-ok' : 'is-error');
      if (ok) {
        note.textContent = 'You are signed up. Watch your inbox for the latest info.';
        form.reset();
      } else {
        note.textContent = 'Enter a valid email address, like name@example.com.';
        input.focus();
      }
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        input.removeAttribute('aria-invalid');
        note.className = 'note';
        note.textContent = idle;
      }
    });
  }
})();
