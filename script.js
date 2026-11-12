function init() {
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = [...document.querySelectorAll('main > section')];
  if (!slides.length) return;

  const fiches = new Map();
  let waiting = false;

  function replay(card) {
    const items = card.querySelectorAll('.reveal');
    items.forEach((el) => el.classList.remove('visible'));
    void card.offsetWidth;
    requestAnimationFrame(() => items.forEach((el) => el.classList.add('visible')));
  }

  function pick(section, i) {
    const f = fiches.get(section);
    if (!f) return;
    f.index = i;
    f.cards.forEach((card, k) => card.classList.toggle('on', k === i));
    f.tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === i));
      tab.tabIndex = k === i ? 0 : -1;
    });
  }

  function shift(section, direction) {
    const f = fiches.get(section);
    if (!f) return;
    const next = f.index + direction;
    if (next < 0 || next >= f.cards.length) return;
    pick(section, next);
    if (!calm) replay(f.cards[next]);
  }

  slides.forEach((section) => {
    const cards = [...section.querySelectorAll(':scope > .experience')];
    if (cards.length < 2) return;
    const bar = document.createElement('div');
    const panel = document.createElement('div');
    bar.className = 'fiches';
    bar.setAttribute('role', 'tablist');
    panel.className = 'panneau';
    const tabs = cards.map((card, i) => {
      const tab = document.createElement('button');
      const num = document.createElement('span');
      const name = document.createElement('span');
      tab.type = 'button';
      tab.className = 'fiche';
      tab.setAttribute('role', 'tab');
      num.className = 'fiche-num';
      num.textContent = String(i + 1).padStart(2, '0');
      name.className = 'fiche-nom';
      name.textContent = card.querySelector('h3')?.textContent ?? `Expérience ${i + 1}`;
      tab.append(num, name);
      tab.addEventListener('click', () => {
        pick(section, i);
        if (!calm) replay(cards[i]);
      });
      bar.append(tab);
      panel.append(card);
      return tab;
    });
    const anchor = section.querySelector(':scope > .section-intro') || section.querySelector(':scope > h2');
    anchor.after(bar, panel);
    section.classList.add('avec-fiches');
    fiches.set(section, { tabs, cards, index: 0 });
    pick(section, 0);

    let x = 0;
    let y = 0;
    panel.addEventListener('touchstart', (e) => {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - x;
      const dy = e.changedTouches[0].clientY - y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) shift(section, dx < 0 ? 1 : -1);
    }, { passive: true });
  });

  const experiences = document.getElementById('experiences');
  document.querySelectorAll('a[href="#experiences"]').forEach((a) => {
    a.addEventListener('click', () => {
      if (experiences && fiches.has(experiences)) pick(experiences, 0);
    });
  });

  if (!calm) {
    root.classList.add('js');

    document
      .querySelectorAll('main section:not(.hero) h2, .section-intro, .timeline li, .experience-head, .experience > p, .experience h4, .apports li, .projet-link, .skill-group, .contact-list, #cv p, #qui-suis-je > p, .note')
      .forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const needed = Math.min(entry.boundingClientRect.height, innerHeight) * 0.45;
        const on = entry.intersectionRect.height >= needed;
        entry.target.querySelectorAll('.reveal').forEach((el) => el.classList.toggle('visible', on));
      });
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });

    slides.filter((s) => !s.classList.contains('hero')).forEach((s) => observer.observe(s));
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'fond';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ribbons(time) {
    const t = time / 1000;
    const n = Math.max(16, Math.round(h / (w < 700 ? 34 : 26)));
    const amp = Math.min(h * 0.07, 54);
    const shift = scrollY * 0.002;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const base = ((i + 0.5) * h) / n;
      ctx.beginPath();
      for (let x = 0; x <= w + 14; x += 14) {
        const u = Math.min(x / w, 1);
        const swing = Math.sin(u * 5.2 + t * 0.28 + i * 0.22 + shift * 3) + 0.55 * Math.sin(u * 11.5 - t * 0.2 + i * 0.4 - shift * 2);
        const y = base + amp * (0.65 + 0.35 * Math.sin(Math.PI * u)) * swing;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      if (i % 6 === 0) {
        ctx.strokeStyle = 'rgba(46,72,214,0.2)';
        ctx.lineWidth = 1.2;
      } else {
        ctx.strokeStyle = 'rgba(46,72,214,0.08)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }
  }

  function loop(time) {
    ribbons(time);
    requestAnimationFrame(loop);
  }

  size();
  addEventListener('resize', () => {
    size();
    if (calm) ribbons(0);
  });
  if (calm) ribbons(0);
  else requestAnimationFrame(loop);

  const onglets = document.createElement('nav');
  onglets.className = 'onglets';
  onglets.setAttribute('aria-label', 'Navigation par sections');
  const tabs = slides.map((slide, i) => {
    const onglet = document.createElement('button');
    const name = i === 0 ? 'Accueil' : (slide.querySelector('h2')?.textContent ?? '');
    onglet.type = 'button';
    onglet.className = 'onglet';
    onglet.dataset.label = name;
    onglet.setAttribute('aria-label', name);
    onglet.addEventListener('click', () => go(slide.offsetTop));
    onglets.append(onglet);
    return onglet;
  });
  document.body.append(onglets);

  const links = [...document.querySelectorAll('.site-header nav a')];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href')));

  function go(top) {
    scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
  }

  function fit() {
    root.classList.toggle('libre', slides.some((s) => s.offsetHeight > innerHeight + 8));
  }

  function currentSlide() {
    const middle = scrollY + innerHeight * 0.5;
    let current = 0;
    slides.forEach((s, i) => {
      if (s.offsetTop <= middle) current = i;
    });
    return current;
  }

  function update() {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--progress', max > 0 ? scrollY / max : 0);
    const line = scrollY + innerHeight * 0.35;
    let active = -1;
    targets.forEach((section, i) => {
      if (section && section.offsetTop <= line) active = i;
    });
    links.forEach((a, i) => a.classList.toggle('active', i === active));
    const slide = currentSlide();
    tabs.forEach((t, i) => t.classList.toggle('active', i === slide));
    waiting = false;
  }

  function step(direction) {
    const max = root.scrollHeight - innerHeight;
    const y = Math.max(scrollY, slides[0].offsetTop);
    let i = 0;
    slides.forEach((s, k) => {
      if (s.offsetTop <= y + 4) i = k;
    });
    const top = slides[i].offsetTop;
    const bottom = top + slides[i].offsetHeight;
    let target;
    if (direction > 0) {
      if (bottom - innerHeight > y + 8) target = Math.min(y + innerHeight * 0.8, bottom - innerHeight);
      else target = slides[i + 1] ? slides[i + 1].offsetTop : max;
    } else if (y > top + 8) {
      target = Math.max(y - innerHeight * 0.8, top);
    } else if (slides[i - 1]) {
      const before = slides[i - 1];
      target = Math.max(before.offsetTop, before.offsetTop + before.offsetHeight - innerHeight);
    } else {
      target = 0;
    }
    target = Math.min(Math.max(target, 0), max);
    if (Math.abs(target - scrollY) >= 2) go(target);
  }

  addEventListener('scroll', () => {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const onControl = e.target.closest?.('a, button');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const section = slides[currentSlide()];
      if (fiches.has(section)) {
        e.preventDefault();
        shift(section, e.key === 'ArrowRight' ? 1 : -1);
      }
      return;
    }
    const down = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !onControl);
    const up = ['ArrowUp', 'PageUp'].includes(e.key);
    if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(root.scrollHeight - innerHeight);
    } else if (down || up) {
      e.preventDefault();
      step(down ? 1 : -1);
    }
  });

  addEventListener('resize', fit);
  addEventListener('load', fit);
  document.fonts?.ready.then(fit);
  fit();
  update();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
