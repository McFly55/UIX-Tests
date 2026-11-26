const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const themeBtn = $('#theme-toggle');
const savedTheme = localStorage.getItem('ui-playground-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
function syncThemeIcon() {
  $('#tt-icon').textContent = document.documentElement.dataset.theme === 'light' ? '☀️' : '🌙';
}
syncThemeIcon();
themeBtn.addEventListener('click', () => {
  const el = document.documentElement;
  el.dataset.theme = el.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('ui-playground-theme', el.dataset.theme);
  syncThemeIcon();
});

function bindRange(input, cb) {
  const update = () => {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty('--val', pct);
    if (cb) cb(+input.value);
  };
  input.addEventListener('input', update);
  update();
}

const vol = $('#vol');
const eqBars = $$('.eq span');
let muted = false;
function pulseEq() {
  if (muted || +vol.value === 0) {
    eqBars.forEach(b => { b.style.height = '12%'; });
    return;
  }
  eqBars.forEach(b => { b.style.height = 15 + Math.random() * 85 * (+vol.value / 100) + '%'; });
}
bindRange(vol, v => { $('#vol-val').textContent = v; pulseEq(); });
setInterval(pulseEq, 130);
$('#vol-mute').addEventListener('click', () => {
  muted = !muted;
  const btn = $('#vol-mute');
  btn.textContent = muted ? '🔇' : '🔊';
  btn.classList.toggle('muted', muted);
  vol.disabled = muted;
  pulseEq();
});

const bri = $('#bri');
bindRange(bri, v => {
  $('#bri-val').textContent = v + '%';
  $('#screen').style.filter = `brightness(${0.35 + (v / 100) * 0.95})`;
  $('#screen').style.setProperty('--glow', (v / 130).toFixed(2));
  $('#sun').style.transform = `scale(${(0.6 + v / 130).toFixed(2)}) rotate(${v * 3.6}deg)`;
});

$('#power').addEventListener('change', e => {
  $('#power-label').textContent = e.target.checked ? 'AN' : 'AUS';
});

let rotVal = 35;
function setRot(v) {
  rotVal = clamp(Math.round(v), 0, 100);
  const ang = -135 + rotVal * 2.7;
  $('#rot-knob').style.transform = `rotate(${ang}deg)`;
  $('#rot-knob').setAttribute('aria-valuenow', rotVal);
  $('#rot-val').textContent = rotVal + '%';
  $('#rot-arc').style.background = `conic-gradient(var(--a1) ${rotVal * 3.6}deg, var(--track) 0deg)`;
}
(function buildTicks() {
  const ticks = $('#rot-ticks');
  for (let i = 0; i <= 10; i++) {
    const t = document.createElement('span');
    t.style.transform = `rotate(${-135 + i * 27}deg)`;
    ticks.appendChild(t);
  }
})();
setRot(rotVal);
(function rotDrag() {
  const knob = $('#rot-knob');
  let dragging = false, startY = 0, startV = 0;
  knob.addEventListener('pointerdown', e => {
    dragging = true; startY = e.clientY; startV = rotVal;
    knob.setPointerCapture(e.pointerId);
  });
  knob.addEventListener('pointermove', e => {
    if (!dragging) return;
    setRot(startV + (startY - e.clientY) * 0.5);
  });
  ['pointerup', 'pointercancel'].forEach(ev => knob.addEventListener(ev, () => { dragging = false; }));
  knob.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { setRot(rotVal + 5); e.preventDefault(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { setRot(rotVal - 5); e.preventDefault(); }
  });
})();

const drMin = $('#dr-min'), drMax = $('#dr-max');
function syncDual() {
  let a = +drMin.value, b = +drMax.value;
  if (a > b - 8) {
    if (document.activeElement === drMin) { a = b - 8; drMin.value = a; }
    else { b = a + 8; drMax.value = b; }
  }
  const lo = a + '%', hi = b + '%';
  const fill = $('#dual-fill');
  fill.style.left = lo;
  fill.style.width = (b - a) + '%';
  $('#dr-lo').textContent = '€ ' + a * 5;
  $('#dr-hi').textContent = '€ ' + b * 5;
}
[drMin, drMax].forEach(el => el.addEventListener('input', syncDual));
syncDual();

const pw = $('#pw');
const pwRules = {
  len: v => v.length >= 8,
  num: v => /\d/.test(v),
  upper: v => /[A-ZÄÖÜ]/.test(v),
  sym: v => /[^A-Za-z0-9ÄÖÜäöüß]/.test(v),
};
const pwLabels = ['', 'Schwach', 'Okay', 'Gut', 'Stark!'];
pw.addEventListener('input', () => {
  const v = pw.value;
  let score = 0;
  $$('#pw-rules li').forEach(li => {
    const ok = pwRules[li.dataset.rule](v);
    li.classList.toggle('ok', ok);
    if (ok) score++;
  });
  const meter = $('#pw-meter');
  meter.className = 'pw-meter' + (score ? ' l' + score : '');
  $('#pw-label').textContent = v ? pwLabels[score] : 'Noch nichts eingegeben';
});
$('#pw-eye').addEventListener('click', () => {
  const show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  $('#pw-eye').textContent = show ? '🙈' : '👁️';
});

let num = 42;
function setNum(v) {
  num = clamp(v, 0, 99);
  const el = $('#num-val');
  el.textContent = num;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}
function holdRepeat(btn, delta) {
  let timer = null, delay = null;
  const start = e => {
    e.preventDefault();
    setNum(num + delta);
    delay = setTimeout(() => { timer = setInterval(() => setNum(num + delta), 70); }, 380);
  };
  const stop = () => { clearTimeout(delay); clearInterval(timer); delay = timer = null; };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
}
holdRepeat($('#num-plus'), +1);
holdRepeat($('#num-minus'), -1);

const dateBtn = $('#date-btn'), datePop = $('#date-pop');
let viewDate = new Date(); viewDate.setDate(1);
let selected = new Date();
const MONTHS = date => date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
function fmtDate(d) {
  return '📅 ' + d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function renderCal() {
  $('#cal-title').textContent = MONTHS(viewDate);
  const grid = $('#cal-grid');
  grid.innerHTML = '';
  ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => {
    const s = document.createElement('span');
    s.className = 'dow'; s.textContent = d;
    grid.appendChild(s);
  });
  const firstDow = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  for (let i = 0; i < firstDow; i++) {
    const b = document.createElement('span'); b.className = 'day blank'; grid.appendChild(b);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.textContent = d;
    const isToday = d === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
    const isSel = selected && d === selected.getDate() && viewDate.getMonth() === selected.getMonth() && viewDate.getFullYear() === selected.getFullYear();
    if (isToday) b.classList.add('today');
    if (isSel) b.classList.add('sel');
    b.addEventListener('click', () => {
      selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      dateBtn.textContent = fmtDate(selected);
      renderCal();
    });
    grid.appendChild(b);
  }
}
dateBtn.textContent = fmtDate(selected);
renderCal();
dateBtn.addEventListener('click', e => {
  e.stopPropagation();
  datePop.hidden = !datePop.hidden;
});
$('#cal-prev').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCal(); });
$('#cal-next').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCal(); });
document.addEventListener('click', e => {
  if (!datePop.hidden && !datePop.contains(e.target) && e.target !== dateBtn) datePop.hidden = true;
});

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return '#' + to(f(0)) + to(f(8)) + to(f(4));
}
const hue = $('#hue');
function applyColor() {
  const h = +hue.value;
  const hex = hslToHex(h, 88, 60);
  const prev = $('#color-preview');
  prev.style.background = hex;
  prev.style.color = hex;
  $('#color-hex').textContent = hex;
}
hue.addEventListener('input', applyColor);
$$('#swatches button').forEach(b => b.addEventListener('click', () => {
  hue.value = b.dataset.h;
  hue.style.setProperty('--val', (+b.dataset.h / 360) * 100);
  applyColor();
}));
applyColor();

const stars = $$('#stars button');
const starLabels = ['', 'Furchtbar 😬', 'Meh 😐', 'Okay 🙂', 'Gut 😄', 'Liebe! 🤩'];
let rating = 0;
function paintStars(n) {
  stars.forEach((s, i) => s.classList.toggle('on', i < n));
  $('#stars-label').textContent = n ? starLabels[n] : 'Noch keine Bewertung';
}
stars.forEach((s, i) => {
  s.addEventListener('mouseenter', () => paintStars(i + 1));
  s.addEventListener('click', () => { rating = i + 1; paintStars(rating); });
});
$('#stars').addEventListener('mouseleave', () => paintStars(rating));

const segBtns = $$('#seg button');
segBtns.forEach((b, i) => b.addEventListener('click', () => {
  segBtns.forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  $('#seg-ind').style.transform = `translateX(${i * 100}%)`;
}));

$$('#mood button').forEach(b => b.addEventListener('click', () => {
  $$('#mood button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  $('#mood-label').textContent = b.dataset.label;
}));

let likes = 128;
$('#like-btn').addEventListener('click', () => {
  likes++;
  $('#like-count').textContent = likes;
  const btn = $('#like-btn');
  btn.classList.remove('burst');
  void btn.offsetWidth;
  btn.classList.add('burst');
  const wrap = $('#like-wrap');
  const r = btn.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  const colors = ['#f472b6', '#8b5cf6', '#22d3ee', '#fbbf24'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const ang = Math.random() * Math.PI * 2;
    const dist = 42 + Math.random() * 55;
    p.style.left = r.left - w.left + r.width / 2 + 'px';
    p.style.top = r.top - w.top + r.height / 2 + 'px';
    p.style.background = colors[i % colors.length];
    wrap.appendChild(p);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 },
    ], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.17,.67,.35,1)' }).onfinish = () => p.remove();
  }
});

const ringFg = $('#ring-fg');
const RING_C = 2 * Math.PI * 54;
let ringCur = 0;
ringFg.style.strokeDasharray = RING_C;
function setRing(v) {
  ringFg.style.strokeDashoffset = RING_C * (1 - v / 100);
  $('#ring-pct').textContent = Math.round(v) + '%';
}
setRing(0);
$('#ring-btn').addEventListener('click', () => {
  const from = ringCur;
  const to = 60 + Math.random() * 40;
  const t0 = performance.now();
  const dur = 1400;
  function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    setRing(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
    else ringCur = to;
  }
  requestAnimationFrame(step);
});

$$('.acc-item').forEach(item => {
  const head = $('.acc-head', item);
  const panel = $('.acc-panel', item);
  head.addEventListener('click', () => {
    const open = item.classList.toggle('open');
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
  });
});

const magZone = $('#mag-zone'), magBtn = $('#mag-btn');
if (matchMedia('(pointer:fine)').matches) {
  magZone.addEventListener('pointermove', e => {
    const r = magZone.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    magBtn.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
  });
  magZone.addEventListener('pointerleave', () => { magBtn.style.transform = 'translate(0,0)'; });
}

$('#confetti-btn').addEventListener('click', e => {
  const layer = $('#confetti-layer');
  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const colors = ['#f472b6', '#8b5cf6', '#22d3ee', '#fbbf24', '#34d399', '#fb923c'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    c.style.background = colors[i % colors.length];
    const dx = (Math.random() * 2 - 1) * 320;
    const dy = -60 - Math.random() * 260;
    const rot = Math.random() * 720 - 360;
    const size = 6 + Math.random() * 8;
    c.style.width = size + 'px';
    c.style.height = size * 1.5 + 'px';
    layer.appendChild(c);
    c.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy + 480}px)) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 1000 + Math.random() * 800, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => c.remove();
  }
});

function makeWheel(el, count, pad, initial, onPick) {
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'wheel-item';
    d.textContent = String(i).padStart(pad, '0');
    el.appendChild(d);
  }
  const items = $$('.wheel-item', el);
  const H = 40;
  let deb = null;
  function sync() {
    const idx = clamp(Math.round(el.scrollTop / H), 0, count - 1);
    items.forEach((it, i) => it.classList.toggle('near', i === idx));
    onPick(idx);
  }
  el.addEventListener('scroll', () => {
    clearTimeout(deb);
    deb = setTimeout(sync, 70);
  });
  requestAnimationFrame(() => { el.scrollTop = initial * H; sync(); });
}
let wh = 14, wm = 0;
function syncTime() {
  $('#time-val').textContent = String(wh).padStart(2, '0') + ':' + String(wm).padStart(2, '0');
}
makeWheel($('#wheel-h'), 24, 2, 14, i => { wh = i; syncTime(); });
makeWheel($('#wheel-m'), 60, 2, 0, i => { wm = i; syncTime(); });
syncTime();

if (matchMedia('(pointer:fine)').matches && !reduceMotion) {
  $$('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
