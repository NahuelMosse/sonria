const WHATSAPP = '5491155550142';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const TREATMENTS = [
  { id: 'limpieza', name: 'Limpieza y control', note: '1 sesión' },
  { id: 'caries', name: 'Arreglo de caries', note: '1 sesión por diente' },
  { id: 'endodoncia', name: 'Endodoncia', note: '2 sesiones' },
  { id: 'ortodoncia', name: 'Ortodoncia', note: 'Control mensual' },
  { id: 'implantes', name: 'Implantes', note: '3 sesiones en 4 meses' },
  { id: 'blanqueamiento', name: 'Blanqueamiento', note: '2 sesiones' },
  { id: 'odontopediatria', name: 'Odontopediatría', note: 'Para chicos' },
  { id: 'consulta', name: 'Consulta, no sé qué necesito', note: 'Miramos y te explicamos' },
];

const PROS = {
  ferraro: { name: 'Dra. Lucía Ferraro', note: 'Odontóloga y odontopediatra' },
  sosa: { name: 'Dra. Valeria Sosa', note: 'Odontóloga, implantes y estética' },
  iturralde: { name: 'Dr. Martín Iturralde', note: 'Ortodoncista' },
  any: { name: 'La primera que esté libre', note: 'Te damos el turno más cercano' },
};

const BANDS = {
  manana: { name: 'Mañana', note: 'de 8 a 13 h' },
  tarde: { name: 'Tarde', note: 'de 14 a 20 h' },
};

const INSURERS = [
  { name: 'OSDE', plans: '210, 310, 410, 450 y 510', group: 'prepaga' },
  { name: 'Swiss Medical', group: 'prepaga' },
  { name: 'Galeno', group: 'prepaga' },
  { name: 'Medifé', group: 'prepaga' },
  { name: 'Omint', group: 'prepaga' },
  { name: 'Sancor Salud', group: 'prepaga' },
  { name: 'Prevención Salud', group: 'prepaga' },
  { name: 'Hominis', group: 'prepaga' },
  { name: 'OSECAC', plans: 'Empleados de comercio', group: 'obra' },
  { name: 'Unión Personal', group: 'obra' },
  { name: 'OSDEPYM', group: 'obra' },
  { name: 'Luis Pasteur', group: 'obra' },
  { name: 'OSPE', plans: 'Petroleros', group: 'obra' },
  { name: 'ObSBA', plans: 'Ciudad de Buenos Aires', group: 'obra' },
];

const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
};

/* Load sequence and reveals */
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('is-loaded')));

const revealables = [...document.querySelectorAll('[data-reveal], .mark')];
const groups = new Map();
for (const node of revealables) {
  const parent = node.parentElement;
  const index = groups.get(parent) ?? 0;
  node.style.setProperty('--i', String(Math.min(index, 6)));
  groups.set(parent, index + 1);
}
document.querySelectorAll('.mark span').forEach((span, i) => span.style.setProperty('--i', String(i)));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { threshold: 0 });
  revealables.forEach((node) => io.observe(node));
} else {
  revealables.forEach((node) => node.classList.add('is-in'));
}

/* Hero crossfade, paused when the tab is hidden; reduced motion keeps the first picture */
const frames = [...document.querySelectorAll('[data-fade] img')];
let frame = 0;
let fadeTimer = 0;
const nextFrame = () => {
  frames[frame].classList.remove('is-on');
  frame = (frame + 1) % frames.length;
  frames[frame].classList.add('is-on');
};
const startFade = () => {
  clearInterval(fadeTimer);
  if (reducedMotion.matches || document.hidden || frames.length < 2) return;
  fadeTimer = setInterval(nextFrame, 6400);
};
document.addEventListener('visibilitychange', startFade);
reducedMotion.addEventListener('change', startFade);
startFade();

/* Ripple on press, from the press point or from the centre for the keyboard */
const ripple = (target, x, y) => {
  if (reducedMotion.matches) return;
  const box = target.getBoundingClientRect();
  const size = Math.max(box.width, box.height);
  const dot = el('span', { className: 'ripple' });
  dot.style.setProperty('--r', `${size}px`);
  dot.style.setProperty('--x', `${x ?? box.width / 2}px`);
  dot.style.setProperty('--y', `${y ?? box.height / 2}px`);
  const live = target.querySelectorAll('.ripple');
  if (live.length >= 3) live[0].remove();
  target.append(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
};
document.addEventListener('pointerdown', (event) => {
  const target = event.target.closest('.btn');
  if (!target) return;
  const box = target.getBoundingClientRect();
  ripple(target, event.clientX - box.left, event.clientY - box.top);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target.closest?.('.btn');
  if (target) ripple(target);
});

/* Emergency WhatsApp */
document.querySelectorAll('[data-wa="urgent"]').forEach((link) => {
  link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, es una urgencia: me duele / se me rompió un diente. ¿Me pueden atender hoy?')}`;
});
document.querySelectorAll('[data-wa="plain"]').forEach((link) => {
  link.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, quería hacer una consulta.')}`;
});

/* Insurer finder */
const finder = document.getElementById('ins-q');
const verdict = document.getElementById('ins-verdict');
const rows = INSURERS.map((insurer) => {
  const li = el('li', {}, el('span', {}, insurer.name, insurer.plans ? el('small', { textContent: insurer.plans }) : null));
  document.querySelector(`[data-group="${insurer.group}"]`).append(li);
  return { insurer, li, key: fold(`${insurer.name} ${insurer.plans ?? ''}`) };
});
const groupCounts = [...document.querySelectorAll('[data-group-count]')];
const setVerdict = (...parts) => {
  verdict.replaceChildren(...parts);
  verdict.classList.remove('is-fresh');
  void verdict.offsetWidth;
  verdict.classList.add('is-fresh');
};
let lastVerdict = '';
const search = () => {
  const raw = finder.value.trim();
  const query = fold(raw);
  const hits = query ? rows.filter((row) => row.key.includes(query)) : rows;
  const showAll = !query || hits.length === 0;
  for (const row of rows) row.li.hidden = !showAll && !hits.includes(row);
  for (const count of groupCounts) {
    const group = count.dataset.groupCount;
    count.textContent = String(rows.filter((row) => row.insurer.group === group && !row.li.hidden).length);
  }
  let state;
  if (!query) state = 'empty';
  else if (hits.length) state = `hit:${hits.map((h) => h.insurer.name).join('|')}`;
  else state = `miss:${query}`;
  if (state === lastVerdict) return;
  lastVerdict = state;
  if (!query) {
    setVerdict('Escribí el nombre y te decimos al toque si la tomamos.');
  } else if (hits.length === 1) {
    setVerdict('Sí, tomamos ', el('b', { textContent: hits[0].insurer.name }), '. Traé la credencial y el DNI.');
  } else if (hits.length > 1) {
    setVerdict('Sí, la tomamos: ', el('b', { textContent: hits.map((h) => h.insurer.name).join(', ') }), '. Traé la credencial y el DNI.');
  } else {
    setVerdict('No trabajamos con «', el('b', { textContent: raw }), '»: te atendemos como particular. La consulta sale $ 25.000 y te damos factura para pedir el reintegro.');
  }
};
finder.addEventListener('input', search);
finder.addEventListener('keydown', (event) => { if (event.key === 'Enter') event.preventDefault(); });
search();

/* Booking */
const form = document.getElementById('booking');
const steps = [...form.querySelectorAll('[data-step]')];
const track = [...form.querySelectorAll('[data-track]')];
const back = form.querySelector('[data-back]');
const next = form.querySelector('[data-next]');
const sendLink = form.querySelector('[data-wa="booking"]');
const state = { step: 0, treatment: '', pro: '', day: '', band: '' };

const radio = (name, value, label, note, extra) => {
  const input = el('input', { type: 'radio', name, value, className: 'radio' });
  const text = el('span', {}, extra ?? label, note ? el('small', { textContent: note }) : null);
  return el('label', { className: 'choice' }, input, text);
};

const choices = (key) => form.querySelector(`[data-choices="${key}"]`);
choices('treatment').setAttribute('role', 'radiogroup');
choices('treatment').setAttribute('aria-label', 'Tratamiento');
choices('treatment').append(...TREATMENTS.map((t) => radio('treatment', t.id, t.name, t.note)));
choices('pro').setAttribute('role', 'radiogroup');
choices('pro').setAttribute('aria-label', 'Profesional');

const proOptions = (treatment) => (treatment === 'ortodoncia' ? ['iturralde'] : ['ferraro', 'sosa', 'any']);
const renderPros = () => {
  const ids = proOptions(state.treatment);
  if (!ids.includes(state.pro)) state.pro = '';
  choices('pro').replaceChildren(...ids.map((id) => radio('pro', id, PROS[id].name, PROS[id].note)));
  const current = choices('pro').querySelector(`input[value="${state.pro}"]`);
  if (current) current.checked = true;
};

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const LONG_DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const workingDays = (() => {
  const days = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (days.length < 10) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
  }
  return days;
})();
const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dayLong = (date) => `${LONG_DAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
const dayByKey = new Map(workingDays.map((d) => [dayKey(d), d]));
choices('day').append(...workingDays.map((d) => {
  const face = document.createDocumentFragment();
  face.append(el('small', { textContent: WEEKDAYS[d.getDay()] }), el('b', { textContent: String(d.getDate()) }));
  const label = radio('day', dayKey(d), '', null, face);
  label.querySelector('input').setAttribute('aria-label', dayLong(d));
  return label;
}));

const renderBands = () => {
  const date = dayByKey.get(state.day);
  const ids = date && date.getDay() === 6 ? ['manana'] : ['manana', 'tarde'];
  if (!ids.includes(state.band)) state.band = '';
  choices('band').replaceChildren(...ids.map((id) => radio('band', id, BANDS[id].name, BANDS[id].note)));
  const current = choices('band').querySelector(`input[value="${state.band}"]`);
  if (current) current.checked = true;
};
renderPros();
renderBands();

const stub = (key, text) => {
  const node = document.querySelector(`[data-stub="${key}"]`);
  const value = text || 'Sin elegir';
  if (node.textContent === value) return;
  node.textContent = value;
  node.classList.remove('is-set');
  if (text) { void node.offsetWidth; node.classList.add('is-set'); }
};
const treatmentName = () => TREATMENTS.find((t) => t.id === state.treatment)?.name ?? '';
const whenText = () => {
  const date = dayByKey.get(state.day);
  if (!date) return '';
  return state.band ? `${dayLong(date)}, ${BANDS[state.band].name.toLowerCase()} (${BANDS[state.band].note})` : dayLong(date);
};
const refreshStub = () => {
  stub('treatment', treatmentName());
  stub('pro', state.pro ? PROS[state.pro].name : '');
  stub('when', whenText());
};

const showError = (key, message) => {
  const box = form.querySelector(`[data-error="${key}"]`);
  box.textContent = message;
  const control = form.querySelector(`[name="${key}"]`);
  if (control && control.type !== 'radio') control.setAttribute('aria-invalid', message ? 'true' : 'false');
  const group = choices(key);
  if (group) group.setAttribute('aria-invalid', message ? 'true' : 'false');
};

form.addEventListener('change', (event) => {
  const { name, value } = event.target;
  if (!['treatment', 'pro', 'day', 'band'].includes(name)) return;
  state[name] = value;
  showError(name, '');
  if (name === 'treatment') renderPros();
  if (name === 'day') renderBands();
  refreshStub();
});

const digits = (text) => text.replace(/[\s-]/g, '');
const fields = {
  name: form.querySelector('#f-name'),
  phone: form.querySelector('#f-phone'),
  plan: form.querySelector('#f-plan'),
  note: form.querySelector('#f-note'),
};
const noteCount = form.querySelector('[data-note-count]');
fields.note.addEventListener('input', () => { noteCount.textContent = String(fields.note.value.length); });

const checkName = () => {
  const value = fields.name.value.trim();
  if (!value) return 'Escribí tu nombre para saber a quién esperamos.';
  if (value.length < 2) return 'El nombre tiene que tener al menos 2 letras.';
  if (value.length > 60) return 'El nombre puede tener hasta 60 caracteres.';
  return '';
};
const checkPhone = () => {
  const value = digits(fields.phone.value.trim());
  if (!value) return 'Necesitamos un celular para confirmarte el turno.';
  if (!/^\d+$/.test(value)) return 'Usá solo números, espacios o guiones.';
  if (value.length < 8 || value.length > 13) return 'Revisá el número: tiene que tener entre 8 y 13 dígitos.';
  return '';
};
const checkNote = () => (fields.note.value.length > 300 ? 'La nota puede tener hasta 300 caracteres.' : '');

for (const [key, check] of [['name', checkName], ['phone', checkPhone], ['note', checkNote]]) {
  fields[key].addEventListener('blur', () => { if (fields[key].value) showError(key, check()); });
  fields[key].addEventListener('input', () => { if (fields[key].getAttribute('aria-invalid') === 'true') showError(key, check()); });
}

const validate = (index) => {
  const problems = [];
  if (index === 0 && !state.treatment) problems.push(['treatment', 'Elegí un tratamiento. Si no sabés, elegí «Consulta».']);
  if (index === 1 && !state.pro) problems.push(['pro', 'Elegí con quién querés atenderte.']);
  if (index === 2) {
    if (!state.day) problems.push(['day', 'Elegí un día.']);
    if (!state.band) problems.push(['band', 'Elegí si preferís a la mañana o a la tarde.']);
  }
  if (index === 3) {
    for (const [key, check] of [['name', checkName], ['phone', checkPhone], ['note', checkNote]]) {
      const message = check();
      if (message) problems.push([key, message]);
      else showError(key, '');
    }
  }
  for (const [key, message] of problems) showError(key, message);
  if (problems.length) {
    const [key] = problems[0];
    const target = form.querySelector(`[name="${key}"]:checked, [name="${key}"]`);
    target?.focus();
  }
  return problems.length === 0;
};

const message = () => {
  const lines = [
    'Hola, quiero pedir un turno en Sonría.',
    `Tratamiento: ${treatmentName()}`,
    `Profesional: ${PROS[state.pro].name}`,
    `Día: ${whenText()}`,
    `Nombre: ${fields.name.value.trim()}`,
    `Celular: ${fields.phone.value.trim()}`,
  ];
  if (fields.plan.value.trim()) lines.push(`Obra social o prepaga: ${fields.plan.value.trim()}`);
  if (fields.note.value.trim()) lines.push(`Nota: ${fields.note.value.trim()}`);
  return lines.join('\n');
};

const renderSummary = () => {
  const items = [
    ['Tratamiento', treatmentName()],
    ['Profesional', PROS[state.pro].name],
    ['Día y franja', whenText()],
    ['Nombre', fields.name.value.trim()],
    ['Celular', fields.phone.value.trim()],
    ['Obra social', fields.plan.value.trim() || 'Particular'],
  ];
  if (fields.note.value.trim()) items.push(['Nota', fields.note.value.trim()]);
  form.querySelector('[data-summary]').replaceChildren(
    ...items.map(([term, value]) => el('div', {}, el('dt', { textContent: term }), el('dd', { textContent: value }))),
  );
  sendLink.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message())}`;
};

const go = (index, { focus = true } = {}) => {
  const forward = index > state.step;
  steps[state.step].hidden = true;
  steps[state.step].classList.remove('is-current', 'is-in', 'is-in-back');
  state.step = index;
  const current = steps[index];
  current.hidden = false;
  current.classList.add('is-current');
  if (!reducedMotion.matches) current.classList.add(forward ? 'is-in' : 'is-in-back');
  track.forEach((item, i) => {
    if (i === Math.min(index, 3) && index < 4) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    item.classList.toggle('is-done', i < index);
  });
  back.hidden = index === 0;
  next.hidden = index === 4;
  next.textContent = index === 3 ? 'Ver resumen' : 'Seguir';
  if (index === 4) {
    renderSummary();
    back.textContent = 'Cambiar algo';
  } else {
    back.textContent = 'Volver';
  }
  if (focus) current.querySelector('.step__title').focus({ preventScroll: false });
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (state.step >= 4) return;
  if (!validate(state.step)) return;
  go(state.step + 1);
});
back.addEventListener('click', () => { if (state.step > 0) go(state.step - 1); });

/* The insurer found above travels to the booking */
finder.addEventListener('change', () => {
  const hit = rows.filter((row) => row.key.includes(fold(finder.value)));
  if (finder.value.trim() && hit.length === 1 && !fields.plan.value) fields.plan.value = hit[0].insurer.name;
});

/* Any «Pedir turno» link lands on the coupon heading */
document.querySelectorAll('[data-book]').forEach((link) => {
  link.addEventListener('click', () => {
    setTimeout(() => document.getElementById('book-title').focus({ preventScroll: true }), reducedMotion.matches ? 0 : 500);
  });
});
