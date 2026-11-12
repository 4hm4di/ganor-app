/* Ganor site behaviour. No dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  /* Ganor fee on paid tickets. Change these two numbers if the fee changes. */
  const FEE_RATE = 0.05;
  const FEE_FLAT = 100;
  const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');
  const fee = price => (price > 0 ? price * FEE_RATE + FEE_FLAT : 0);

  /* ---------- Waitlist destination ----------
     Set data-endpoint on the join form (e.g. a Formspree or Google Apps Script URL)
     to collect sign-ups in a sheet. Until then, sign-ups open WhatsApp with the
     details filled in, sent to the Ganor number. */
  const WHATSAPP = '2348103301999';

  /* ---------- Intro (first visit per session) ---------- */
  function runIntro(done) {
    const intro = $('[data-intro]');
    if (!intro || root.classList.contains('no-intro')) { done(); return; }
    const pct = $('[data-intro-pct]', intro);
    const bar = $('[data-intro-bar]', intro);
    const start = performance.now();
    const DURATION = 2200; // long enough to read the screen
    const HOLD = 550;       // pause at 100% before the slats lift
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    let fontsReady = false;
    fonts.then(() => { fontsReady = true; });
    const ease = t => -(Math.cos(Math.PI * t) - 1) / 2; // steady climb, easy to read

    function tick(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const v = Math.round(ease(t) * 100);
      pct.textContent = String(v).padStart(2, '0');
      bar.style.setProperty('--p', ease(t));
      if (t < 1 || (!fontsReady && now - start < 3500)) { requestAnimationFrame(tick); return; }
      setTimeout(() => intro.classList.add('is-out'), HOLD);
      try { localStorage.setItem('ganor-intro', '1'); } catch (e) {}
      setTimeout(done, HOLD + 260);
      setTimeout(() => intro.classList.add('is-gone'), HOLD + 1100);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Hero entrance ---------- */
  function startHero() {
    const hero = $('.hero');
    if (!hero) return;
    $$('[data-rise]', hero).forEach((el, i) => el.style.setProperty('--d', i));
    $$('[data-tag]', hero).forEach((el, i) => el.style.setProperty('--d', i));
    const title = $('[data-lines]', hero);
    requestAnimationFrame(() => {
      hero.classList.add('is-ready');
      if (title) title.classList.add('is-in');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function setupReveal() {
    $$('[data-lines]').forEach(el => $$('.line > span', el).forEach((s, i) => s.style.setProperty('--i', i)));
    const groups = new Map();
    $$('[data-reveal]').forEach(el => {
      const p = el.parentElement;
      const n = groups.get(p) || 0;
      el.style.setProperty('--i', Math.min(n, 6));
      groups.set(p, n + 1);
    });
    const targets = [...$$('[data-reveal]'), ...$$('[data-lines]').filter(el => !el.closest('.hero'))];
    if (!('IntersectionObserver' in window)) { targets.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        e.target.dispatchEvent(new CustomEvent('reveal'));
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    targets.forEach(el => io.observe(el));
  }

  /* ---------- Nav: solid after the hero, theme colour follows ---------- */
  function setupNav() {
    const nav = $('[data-nav]');
    const hero = $('.hero, .page-hero');
    const meta = $('meta[name="theme-color"]');
    if (!nav) return;
    if (!hero) { nav.classList.add('is-solid'); if (meta) meta.content = '#F6F1E7'; return; }
    let solid = null;
    const update = () => {
      const s = hero.getBoundingClientRect().bottom <= nav.offsetHeight;
      if (s === solid) return;
      solid = s;
      nav.classList.toggle('is-solid', s);
      if (meta) meta.content = s ? '#F6F1E7' : (hero.classList.contains('has-photo') ? '#15132A' : '#3730B8');
    };
    let lastY = scrollY;
    const away = () => {
      const y = scrollY;
      const down = y > lastY + 4, up = y < lastY - 4;
      if (down && y > innerHeight * 0.9) nav.classList.add('is-away');
      else if (up || y < 80) nav.classList.remove('is-away');
      if (down || up) lastY = y;
    };
    addEventListener('scroll', () => requestAnimationFrame(away), { passive: true });
    update();
    addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', update);
  }

  /* ---------- Mobile menu ---------- */
  function setupMenu() {
    const sheet = $('[data-menu]');
    const open = $('[data-menu-open]');
    if (!sheet || !open || typeof sheet.showModal !== 'function') return;
    let closing = false;
    const shut = (then) => {
      if (!sheet.open || closing) return;
      if (reduced.matches) { sheet.close(); then && then(); return; }
      closing = true;
      sheet.classList.add('is-closing');
      setTimeout(() => {
        sheet.classList.remove('is-closing'); sheet.close(); closing = false;
        then && then();
      }, 250);
    };
    open.addEventListener('click', () => { sheet.showModal(); sheet.focus({ preventScroll: true }); open.setAttribute('aria-expanded', 'true'); });
    sheet.addEventListener('close', () => { open.setAttribute('aria-expanded', 'false'); open.focus({ preventScroll: true }); });
    sheet.addEventListener('cancel', e => { e.preventDefault(); shut(); });
    $('[data-menu-close]', sheet).addEventListener('click', () => shut());
    $$('a', sheet).forEach(a => a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
      const target = hash && document.querySelector(hash);
      const samePage = target && (href.startsWith('#') || href.startsWith('./#'));
      if (samePage) {
        e.preventDefault();
        shut(() => { target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' }); history.replaceState(null, '', hash); });
      }
    }));
    addEventListener('resize', () => { if (innerWidth >= 1000) shut(); });
  }

  /* ---------- Hero search (pre-launch) ---------- */
  function setupSearch() {
    const form = $('[data-search]');
    const msg = $('[data-search-msg]');
    const halalChip = $('[data-halal]');
    if (!form || !msg) return;
    const say = () => {
      const type = form.type.value;
      const area = form.area.value;
      const halal = halalChip && halalChip.getAttribute('aria-pressed') === 'true';
      const what = (halal ? 'halal-friendly ' : '') + (type ? type.toLowerCase() : 'events');
      const where = area ? ` in ${area}` : ' near you';
      msg.innerHTML = '';
      msg.append('Ganor opens soon. ');
      const a = document.createElement('a');
      a.href = '#join';
      a.textContent = 'Join the list';
      a.addEventListener('click', () => prefill({ role: 'guest', interest: halal ? 'Halal-friendly events' : type }));
      msg.append(a, ` and we’ll tell you when ${what}${where} go live.`);
      msg.hidden = false;
    };
    form.addEventListener('submit', e => { e.preventDefault(); say(); });
    $$('[data-chip]').forEach(chip => chip.addEventListener('click', () => {
      form.type.value = chip.dataset.chip;
      say();
    }));
    if (halalChip) halalChip.addEventListener('click', () => {
      halalChip.setAttribute('aria-pressed', String(halalChip.getAttribute('aria-pressed') !== 'true'));
      say();
    });
  }

  /* ---------- Prefill the join form from anywhere ---------- */
  function prefill({ role, interest }) {
    const form = $('[data-join]');
    if (!form) return;
    if (role) { const r = form.querySelector(`input[name="role"][value="${role}"]`); if (r) r.checked = true; }
    if (interest !== undefined && interest !== null) {
      const opt = [...form.interest.options].find(o => o.text === interest);
      if (opt) form.interest.value = opt.value || opt.text;
    }
  }
  function setupPrefill() {
    $$('[data-interest]').forEach(a => a.addEventListener('click', () => prefill({ role: 'guest', interest: a.dataset.interest })));
    $$('[data-interest-role]').forEach(a => a.addEventListener('click', () => prefill({ role: a.dataset.interestRole })));
  }

  /* ---------- Scroll timeline (how it works) ---------- */
  function setupSteps() {
    const list = $('[data-steps]');
    if (!list) return;
    const fill = $('[data-steps-fill]', list);
    const steps = $$('[data-step]', list);
    const update = () => {
      const vh = innerHeight;
      const r = list.getBoundingClientRect();
      const line = vh * 0.62;
      const p = Math.max(0, Math.min(1, (line - r.top) / r.height));
      fill.style.setProperty('--p', p.toFixed(4));
      steps.forEach(step => {
        const active = step.getBoundingClientRect().top + 40 < line;
        if (active !== step.classList.contains('is-active')) {
          step.classList.toggle('is-active', active);
          if (active) { const img = $('[data-replay]', step); if (img) replay(img); }
        }
      });
    };
    let raf = 0;
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
    addEventListener('resize', update);
    update();
  }
  function replay(img) {
    const src = img.getAttribute('src').split('?')[0];
    img.setAttribute('src', `${src}?r=${Date.now()}`);
  }

  /* ---------- Rolling digits ---------- */
  function digitEl() {
    const d = document.createElement('span');
    d.className = 'digit';
    const col = document.createElement('span');
    col.className = 'digit__col';
    for (let n = 0; n < 10; n++) { const s = document.createElement('span'); s.textContent = n; col.append(s); }
    d.append(col);
    return d;
  }
  function setDigits(el, value, minLen = 2) {
    const str = String(value).padStart(minLen, '0');
    while (el.children.length < str.length) el.prepend(digitEl());
    while (el.children.length > str.length) el.firstElementChild.remove();
    [...el.children].forEach((d, i) => d.firstElementChild.style.setProperty('--n', str[i]));
    el.setAttribute('aria-label', str);
  }

  /* Rolling numbers for any text like "₦1,050,000" or "200 tickets": digits roll, other characters stay */
  function rollText(el, str) {
    let sr = el.querySelector(':scope > .sr-only');
    let roll = el.querySelector(':scope > .roll');
    if (!roll) {
      el.textContent = '';
      sr = document.createElement('span'); sr.className = 'sr-only';
      roll = document.createElement('span'); roll.className = 'roll'; roll.setAttribute('aria-hidden', 'true');
      el.append(sr, roll);
    }
    sr.textContent = str;
    const shape = [...str].map(c => (/\d/.test(c) ? 'd' : c)).join('');
    if (roll.dataset.shape !== shape) {
      const old = [...roll.querySelectorAll('.digit__col')].map(c => c.style.getPropertyValue('--n') || '0');
      roll.textContent = '';
      const cols = [];
      [...str].forEach(c => {
        if (/\d/.test(c)) { const d = digitEl(); roll.append(d); cols.push(d.firstElementChild); }
        else { const t = document.createElement('span'); t.className = 'roll__ch'; t.textContent = c; roll.append(t); }
      });
      // keep the old digits lined up from the right so a new column doesn't make everything jump
      cols.reverse().forEach((c, i) => c.style.setProperty('--n', old[old.length - 1 - i] || '0'));
      roll.dataset.shape = shape;
      void roll.offsetWidth;
    }
    const digits = [...str].filter(c => /\d/.test(c));
    [...roll.querySelectorAll('.digit__col')].forEach((c, i) => c.style.setProperty('--n', digits[i]));
  }

  /* ---------- Countdown to launch ---------- */
  function setupCountdown() {
    const box = $('[data-countdown]');
    if (!box) return;
    const target = new Date(box.dataset.countdown).getTime();
    const units = { d: $('[data-unit="d"]', box), h: $('[data-unit="h"]', box), m: $('[data-unit="m"]', box), s: $('[data-unit="s"]', box) };
    Object.values(units).forEach(u => u.setAttribute('role', 'text'));
    const render = () => {
      let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      setDigits(units.d, d); setDigits(units.h, h); setDigits(units.m, m); setDigits(units.s, s);
      box.setAttribute('aria-label', `${d} days, ${h} hours and ${m} minutes until Ganor opens`);
      if (target - Date.now() <= 0) { box.closest('.join__copy').querySelector('.label').textContent = 'Ganor is open'; }
    };
    // start from zero so the digits roll in when the section appears
    Object.values(units).forEach(u => setDigits(u, 0));
    const go = () => { render(); setInterval(render, 1000); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setTimeout(go, 150); } }, { threshold: 0.4 });
      io.observe(box);
    } else go();
  }

  /* ---------- Counters in the bento ---------- */
  function setupCounters() {
    $$('[data-count]').forEach(el => {
      const value = +el.dataset.count;
      el.textContent = '';
      setDigits(el, 0, String(value).length);
      const card = el.closest('[data-reveal]') || el;
      const run = () => setTimeout(() => setDigits(el, value, String(value).length), 200);
      if (card.classList.contains('is-in')) run(); else card.addEventListener('reveal', run, { once: true });
    });
  }

  function setupPayout() {
    $$('[data-roll]').forEach(el => {
      const value = el.dataset.roll;
      rollText(el, value.replace(/\d/g, '0'));
      const card = el.closest('[data-reveal]') || el;
      const run = () => setTimeout(() => rollText(el, value), 250);
      if (card.classList.contains('is-in')) run(); else card.addEventListener('reveal', run, { once: true });
    });
  }

  /* ---------- Tickets sold chart: the dot walks the line Mon → Fri, counting as it goes ---------- */
  function setupChart() {
    const chart = $('[data-chart]');
    if (!chart) return;
    const card = chart.closest('.card');
    const line = $('.chart__line', chart), area = $('.chart__area', chart);
    const tip = $('.chart__tip', chart);
    const total = $('[data-chart-total]', card);
    const TOTAL = +total.dataset.chartTotal;
    const pts = [[0,170],[60,160],[120,150],[180,140],[240,118],[300,112],[360,88],[420,70],[480,52],[540,40],[600,22]];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const sold = [14, 19, 24, 27, 31];            // sample daily sales, Mon–Fri
    const yAt = x => {
      for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
      }
      return pts[pts.length - 1][1];
    };
    const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const FRI = 480, W = 600, H = 180;
    const place = (x) => {
      chart.style.setProperty('--x', x / W);
      chart.style.setProperty('--y', yAt(x) / H);
      const half = (tip.offsetWidth / 2 + 4) / chart.clientWidth;   // keep the tooltip inside the card
      chart.style.setProperty('--tx', Math.min(1 - half, Math.max(half, x / W)));
    };
    const setLine = (x) => {
      const cut = Math.max(-2, 100 - (x / W) * 100);
      line.style.clipPath = `inset(-10% ${cut}% -10% 0)`;
      area.style.clipPath = `inset(0 ${Math.max(0, cut)}% 0 0)`;
    };
    const label = (x) => {
      const pos = x / 120, i = Math.min(4, Math.floor(pos + 0.0001));
      const f = Math.min(1, pos - i);
      const n = i < 4 ? Math.round(sold[i] + (sold[i + 1] - sold[i]) * f) : sold[4];
      tip.textContent = `${days[Math.min(4, Math.round(pos))]} · ${n} sold`;
    };
    // resting state (no animation)
    const finish = () => { place(FRI); setLine(W); label(FRI); total.textContent = TOTAL; };
    chart.classList.add('is-live');
    if (reduced.matches) { chart.classList.add('is-run'); finish(); return; }
    place(0); setLine(0); label(0); total.textContent = '0';
    const run = () => {
      chart.classList.add('is-run');
      const D1 = 2400, D2 = 450, start = performance.now() + 250;
      const frame = (now) => {
        const t = Math.max(0, Math.min(1, (now - start) / D1));
        const x = FRI * ease(t);
        place(x); setLine(x); label(x);
        total.textContent = Math.round(TOTAL * ease(t));
        if (t < 1) return requestAnimationFrame(frame);
        // after Friday the line carries on to Saturday
        const s2 = performance.now();
        const tail = (n) => {
          const u = Math.min(1, (n - s2) / D2);
          setLine(FRI + (W - FRI) * ease(u));
          if (u < 1) requestAnimationFrame(tail); else total.textContent = TOTAL;
        };
        requestAnimationFrame(tail);
      };
      requestAnimationFrame(frame);
    };
    if (card.classList.contains('is-in')) run(); else card.addEventListener('reveal', run, { once: true });
  }

  /* ---------- Check-in meter: the bar and the number move together ---------- */
  function setupMeter() {
    $$('[data-meter]').forEach(meter => {
      const card = meter.closest('.card');
      const target = +meter.dataset.meter, of = +meter.dataset.of;
      const text = $('[data-meter-text]', card);
      const bar = meter.firstElementChild;
      meter.classList.add('is-live');
      if (reduced.matches) { bar.style.transform = `scaleX(${target / of})`; return; }
      bar.style.transform = 'scaleX(0)'; text.textContent = '0';
      const run = () => {
        const D = 1700, start = performance.now() + 300;
        const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const frame = (now) => {
          const t = Math.max(0, Math.min(1, (now - start) / D));
          const v = Math.round(target * ease(t));
          bar.style.transform = `scaleX(${v / of})`;
          text.textContent = v;
          if (t < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      };
      if (card.classList.contains('is-in')) run(); else card.addEventListener('reveal', run, { once: true });
    });
  }

  /* ---------- Switches ---------- */
  function setupSwitches() {
    $$('.switch').forEach(sw => sw.addEventListener('click', () => {
      sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    }));
  }

  /* ---------- Gate check-in demo ---------- */
  function setupGate() {
    const gate = $('[data-gate]');
    if (!gate) return;
    const img = $('[data-gate-icon]', gate);
    const title = $('[data-gate-title]', gate);
    const sub = $('[data-gate-sub]', gate);
    const STATES = {
      ok: { icon: 'admitted', title: 'Admitted', sub: 'Abdallah Nasir · Regular · Admit one' },
      warn: { icon: 'already-checked-in', title: 'Already checked in', sub: 'First scanned 10:12 · Gate 1' },
      bad: { icon: 'not-valid', title: 'Not a valid ticket', sub: 'Send the guest to the help desk' }
    };
    let timer = 0;
    $$('[data-scan]').forEach(btn => btn.addEventListener('click', () => {
      clearTimeout(timer);
      const k = btn.dataset.scan;
      const s = STATES[k];
      gate.classList.remove('is-shown');
      const show = () => {
        img.src = `assets/gate/ganor-status-${s.icon}.svg?r=${Date.now()}`;
        title.textContent = s.title;
        sub.textContent = s.sub;
        gate.dataset.state = k;
        requestAnimationFrame(() => gate.classList.add('is-shown'));
        timer = setTimeout(() => { gate.dataset.state = 'ready'; gate.classList.remove('is-shown'); }, 4200);
      };
      if (reduced.matches) { show(); return; }
      gate.dataset.state = 'checking';
      timer = setTimeout(show, 900);
    }));
  }

  /* ---------- FAQ accordion ---------- */
  function setupAccordion() {
    $$('[data-acc] .acc__btn').forEach(btn => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      panel.hidden = false;
      panel.classList.toggle('is-open', btn.getAttribute('aria-expanded') === 'true');
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        panel.classList.toggle('is-open', open);
      });
    });
  }

  /* ---------- Join form ---------- */
  function setupJoin() {
    const form = $('[data-join]');
    if (!form) return;
    const done = $('[data-join-done]', form);
    const label = $('[data-join-label]', form);
    const inbox = form.dataset.email || 'support@ganor.ng';
    const normalise = v => v.replace(/[^\d+]/g, '').replace(/^\+/, '');
    const validPhone = v => /^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(normalise(v));
    const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    const fieldOf = name => form.elements[name].closest('.field');
    const reach = () => form.reach.value;

    const check = name => {
      const el = form.elements[name];
      const ok = name === 'phone' ? validPhone(el.value) : name === 'email' ? validEmail(el.value) : el.value.trim().length > 1;
      fieldOf(name).classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    ['name', 'phone', 'email'].forEach(n => {
      const el = form.elements[n];
      const err = form.querySelector(`[data-err="${n}"]`);
      err.id = `err-${n}`;
      el.setAttribute('aria-describedby', err.id);
      el.addEventListener('blur', () => { if (el.value) check(n); });
      el.addEventListener('input', () => { if (fieldOf(n).classList.contains('is-invalid')) check(n); });
    });

    // WhatsApp or email: only the chosen one is shown and required
    const syncReach = () => {
      const r = reach();
      $$('[data-reach-field]', form).forEach(f => {
        const on = f.dataset.reachField === r;
        const input = $('input', f);
        f.hidden = !on; input.disabled = !on; input.required = on;
        if (!on) { f.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); }
      });
    };
    $$('input[name="reach"]', form).forEach(r => r.addEventListener('change', () => {
      syncReach();
      const input = $(`[data-reach-field="${reach()}"] input`, form);
      if (matchMedia('(pointer: fine)').matches) input.focus();
    }));
    syncReach();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const r = reach();
      const contactField = r === 'email' ? 'email' : 'phone';
      const okName = check('name');
      const okContact = check(contactField);
      if (!okName || !okContact) { form.querySelector('.is-invalid input').focus(); return; }
      const role = form.role.value;
      const roleText = { host: 'Hosting an event', guest: 'Looking for events', business: 'A local business' }[role];
      const data = {
        name: form.elements.name.value.trim(),
        reach: r === 'email' ? 'Email' : 'WhatsApp',
        whatsapp: r === 'whatsapp' ? form.elements.phone.value.trim() : '',
        email: r === 'email' ? form.elements.email.value.trim() : '',
        role: roleText,
        interest: form.interest.value || '',
        source: location.hostname || 'ganor.ng',
        _subject: `New Ganor sign-up: ${roleText}`,
        _template: 'table',
        _captcha: 'false'
      };
      if (data.email) data._replyto = data.email;
      // Email sign-ups also go to the Brevo list, which sends the designed welcome email
      const brevo = form.dataset.brevo;
      if (data.email && brevo) {
        const b = new URLSearchParams({ EMAIL: data.email, FIRSTNAME: data.name.split(/\s+/)[0], ROLE: role, INTEREST: data.interest, email_address_check: '', locale: 'en' });
        fetch(brevo, { method: 'POST', mode: 'no-cors', body: b }).catch(() => {});
      }
      const endpoint = form.dataset.endpoint;
      const btn = $('button[type="submit"]', form);
      label.textContent = 'Sending…'; btn.disabled = true;
      let sent = false;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          const json = await res.json().catch(() => ({}));
          sent = res.ok && String(json.success) === 'true';
        } catch (err) { sent = false; }
      }
      if (!sent) {
        // Inbox not reachable: hand the details over in the visitor's own app so the sign-up isn't lost
        const lines = [`Hi Ganor, please add me to the list.`, `Name: ${data.name}`, `I'm: ${roleText}`]
          .concat(data.interest ? [`Interested in: ${data.interest}`] : [])
          .concat(data.whatsapp ? [`WhatsApp: ${data.whatsapp}`] : [`Email: ${data.email}`]);
        const text = lines.join('\n');
        if (r === 'email') location.href = `mailto:${inbox}?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(text)}`;
        else window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
      btn.disabled = false;
      label.textContent = 'Join the list';
      done.hidden = false;
      form.reset();
      syncReach();
    });
  }

  /* ---------- Typed line (name section) ---------- */
  function setupTypeline() {
    const box = $('[data-typeline]');
    if (!box) return;
    const out = $('[data-typed]', box);
    const caret = $('.name__caret', box);
    const text = $('.name__ghost', box).textContent;
    let timer;
    const type = () => {
      clearTimeout(timer);
      if (reduced.matches) { out.textContent = text; return; }
      out.textContent = '';
      caret.classList.add('is-on');
      let i = 0;
      const step = () => {
        out.textContent = text.slice(0, ++i);
        if (i < text.length) timer = setTimeout(step, text[i - 1] === ',' ? 260 : 34 + Math.random() * 40);
      };
      timer = setTimeout(step, 350);
    };
    const reset = () => { clearTimeout(timer); if (!reduced.matches) out.textContent = ''; };
    if ('IntersectionObserver' in window) {
      let shown = false;
      new IntersectionObserver(([e]) => {
        if (e.intersectionRatio >= 0.6 && !shown) { shown = true; type(); }
        else if (e.intersectionRatio === 0 && shown) { shown = false; reset(); }
      }, { threshold: [0, 0.6] }).observe(box);
    } else type();
  }

  /* ---------- Hero photo: set data-photo="assets/img/hero.jpg" on the hero to use a real photo ---------- */
  function setupHeroPhoto() {
    const hero = $('.hero');
    const src = hero && hero.dataset.photo;
    if (!src) return;
    const img = new Image();
    img.onload = () => { hero.style.setProperty('--hero-photo', `url(${src})`); hero.classList.add('has-photo'); };
    img.src = src;
  }

  /* ---------- Live phone: find → pay → get in ---------- */
  function setupLive() {
    const live = $('[data-live]');
    if (!live) return;
    const scrs = $$('.scr', live);
    const steps = $$('.live__step', live);
    const fill = $('[data-live-fill]', live);
    const pauseBtn = $('[data-live-pause]', live);
    const pauseLabel = $('[data-live-pause-l]', live);
    const typed = $('[data-type]', live);
    const pick = $('.ev--pick', live);
    const qty = $('[data-qty]', live), sub = $('[data-co-sub]', live), feeEl = $('[data-co-fee]', live), total = $('[data-co-total]', live);
    const payBtn = $('[data-co-btn]', live), payLabel = $('[data-co-label]', live);
    const tk = $('.scr--tk', live);
    const PRICE = 5000;
    let at = 0, timers = [], paused = false, visible = true;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const setCheckout = (n) => {
      qty.textContent = n;
      sub.textContent = naira(PRICE * n); feeEl.textContent = naira(fee(PRICE) * n); total.textContent = naira((PRICE + fee(PRICE)) * n);
      payLabel.textContent = 'Pay ' + naira((PRICE + fee(PRICE)) * n);
    };
    const resetScreens = () => {
      typed.textContent = ''; pick.classList.remove('is-picked');
      setCheckout(1); payBtn.classList.remove('is-paying', 'is-paid');
      tk.classList.remove('is-scanning', 'is-admitted');
    };
    const show = (i) => {
      const prev = at;
      at = i;
      live.dataset.at = i;
      scrs.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-out', k === prev && k !== i); });
      setTimeout(() => scrs[prev] && prev !== i && scrs[prev].classList.remove('is-out'), 700);
      steps.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.classList.toggle('is-done', k < i); b.setAttribute('aria-selected', String(k === i)); });
      fill.style.setProperty('--p', i / (steps.length - 1));
    };
    const scenes = [
      () => { // find
        resetScreens();
        const text = typed.dataset.type;
        if (reduced.matches) { typed.textContent = text; return 3200; }
        [...text].forEach((ch, k) => later(() => { typed.textContent += ch; }, 300 + k * 38));
        const t = 300 + text.length * 38;
        later(() => pick.classList.add('is-picked'), t + 900);
        return t + 2100;
      },
      () => { // pay
        if (reduced.matches) { setCheckout(2); payBtn.classList.add('is-paid'); return 3200; }
        later(() => setCheckout(2), 700);
        later(() => payBtn.classList.add('is-paying'), 1500);
        later(() => payBtn.classList.add('is-paid'), 2450);
        return 3600;
      },
      () => { // ticket + gate
        if (reduced.matches) { tk.classList.add('is-admitted'); return 3600; }
        later(() => tk.classList.add('is-scanning'), 900);
        later(() => tk.classList.add('is-admitted'), 2000);
        return 4200;
      }
    ];
    const run = (i) => {
      clear();
      show(i);
      const dur = scenes[i]();
      if (!paused && visible) later(() => run((i + 1) % scenes.length), dur);
    };
    steps.forEach((b, k) => b.addEventListener('click', () => run(k)));
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseLabel.textContent = paused ? 'Play' : 'Pause';
      if (paused) clear(); else run((at + 1) % scenes.length);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const was = visible; visible = e.isIntersecting;
        if (!visible) clear(); else if (!was && !paused) run(at);
      }).observe(live);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); else if (!paused && visible) run(at); });
    run(0);
  }

  /* ---------- Earnings calculator ---------- */
  function setupCalc() {
    const calc = $('[data-calc]');
    if (!calc) return;
    const seg = $('.seg', calc);
    const price = $('[data-in="price"]', calc), qty = $('[data-in="qty"]', calc);
    const out = k => $(`[data-out="${k}"]`, calc), res = k => $(`[data-res="${k}"]`, calc);
    let who = 'buyer';
    const paint = (input) => {
      const f = (input.value - input.min) / (input.max - input.min);
      input.closest('.rng').style.setProperty('--f', f);
      input.style.setProperty('--v', (f * 100) + '%');
    };
    const render = () => {
      const p = +price.value, q = +qty.value, f = fee(p);
      paint(price); paint(qty);
      rollText(out('price'), naira(p));
      rollText(out('qty'), q.toLocaleString('en-NG') + ' tickets');
      const gross = p * q, total = f * q;
      rollText(res('net'), naira(who === 'buyer' ? gross : gross - total));
      rollText(res('gross'), naira(gross));
      rollText(res('per'), naira(f));
      rollText(res('buyer'), naira(who === 'buyer' ? p + f : p));
      res('note').textContent = who === 'buyer'
        ? 'Your full ticket price goes to your bank. Buyers pay the Ganor fee at checkout.'
        : 'Buyers pay your ticket price only. The Ganor fee comes out of each sale.';
    };
    $$('.seg__opt', calc).forEach(b => b.addEventListener('click', () => {
      who = b.dataset.who;
      seg.dataset.who = who;
      $$('.seg__opt', calc).forEach(o => { const on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-checked', String(on)); });
      render();
    }));
    seg.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const next = $(`.seg__opt[data-who="${who === 'buyer' ? 'host' : 'buyer'}"]`, calc);
      next.click(); next.focus(); e.preventDefault();
    });

    // Glass knob: grows into a lens while dragging and stretches with speed
    [price, qty].forEach(input => {
      const rng = input.closest('.rng');
      let last = +input.value, settle;
      const start = () => rng.classList.add('is-drag');
      const end = () => { rng.classList.remove('is-drag'); rng.style.setProperty('--s', 0); };
      input.addEventListener('pointerdown', start);
      input.addEventListener('pointerup', end);
      input.addEventListener('pointercancel', end);
      input.addEventListener('blur', end);
      input.addEventListener('input', () => {
        const v = +input.value;
        const speed = Math.min(1, Math.abs(v - last) / ((input.max - input.min) * 0.04));
        last = v;
        rng.style.setProperty('--s', speed.toFixed(2));
        clearTimeout(settle);
        settle = setTimeout(() => rng.style.setProperty('--s', 0), 120);
        render();
      });
    });

    const ft = $('[data-fee-text]');
    if (ft) ft.textContent = `${FEE_RATE * 100}% + ${naira(FEE_FLAT)}`;
    render();
  }

  /* ---------- Places category filter ---------- */
  function setupPlaces() {
    const btns = $$('[data-pf]');
    const cards = $$('.pcat');
    if (!btns.length) return;
    btns.forEach(b => b.addEventListener('click', () => {
      const g = b.dataset.pf;
      btns.forEach(o => { const on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', String(on)); });
      cards.forEach(c => {
        const show = g === 'all' || c.dataset.g === g;
        if (show && c.classList.contains('is-hidden')) {
          c.classList.remove('is-hidden'); c.classList.add('is-entering');
          requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove('is-entering')));
        } else if (!show) c.classList.add('is-hidden');
      });
    }));
  }

  /* ---------- Docs side nav: highlight the section in view ---------- */
  function setupDocNav() {
    const links = $$('.doc__nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('is-on'));
        const a = map.get(e.target.id);
        if (a) { a.classList.add('is-on'); const ul = a.closest('ul'); if (ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' }); }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    map.forEach((a, id) => { const t = document.getElementById(id); if (t) io.observe(t); });
  }

  /* ---------- Boot ---------- */
  setupNav();
  setupMenu();
  setupSearch();
  setupPrefill();
  setupSteps();
  setupSwitches();
  setupGate();
  setupAccordion();
  setupJoin();
  setupReveal();
  setupCounters();
  setupCountdown();
  setupHeroPhoto();
  setupLive();
  setupCalc();
  setupPlaces();
  setupDocNav();
  setupTypeline();
  setupPayout();
  setupChart();
  setupMeter();
  runIntro(startHero);
})();
