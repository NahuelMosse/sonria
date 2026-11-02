const { test, expect } = require('./pw');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..', '..');
const FILE_URL = pathToFileURL(path.join(ROOT, 'index.html')).href;
const PAGE = process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, '')}/sonria/` : FILE_URL;
const WA = '5491155550142';

const PHONE = { width: 390, height: 844 };
const DESK = { width: 1440, height: 900 };

const open = async (page, size = DESK) => {
  await page.setViewportSize(size);
  await page.goto(PAGE);
};

const pick = (page, key, text) => page.locator(`[data-choices="${key}"] label`, { hasText: text }).first().click();
const next = (page) => page.locator('[data-next]').click();
const waText = (href) => decodeURIComponent(new URL(href).searchParams.get('text') ?? '');

const weekdayIndex = async (page, wanted) => {
  const labels = await page.locator('[data-choices="day"] input').evaluateAll((inputs) => inputs.map((i) => i.getAttribute('aria-label')));
  return labels.findIndex((l) => wanted(l));
};

const walkToContact = async (page, { treatment = 'Limpieza y control', pro = 'Dra. Lucía Ferraro' } = {}) => {
  await page.locator('#turno').scrollIntoViewIfNeeded();
  await pick(page, 'treatment', treatment);
  await next(page);
  await pick(page, 'pro', pro);
  await next(page);
  const weekday = await weekdayIndex(page, (l) => !l.startsWith('sábado'));
  await page.locator('[data-choices="day"] label').nth(weekday).click();
  await pick(page, 'band', 'Tarde');
  await next(page);
};

const pngSize = (buffer) => ({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });

/* T1 · the page, its sections and its data */

test('one page of Sonría in Caballito with its booking button in the hero @SON-1-S1 @SON-1-S10', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle(/Sonría/);
  await expect(page.locator('h1')).toContainText('Caballito');
  await expect(page.locator('.hero .lead')).toContainText('dos odontólogas y un ortodoncista');
  await expect(page.locator('.hero a[href="#turno"]', { hasText: 'Pedir turno' })).toBeVisible();
  const pages = await page.locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href')).filter((h) => /\.html?($|[?#])/.test(h)));
  expect(pages).toEqual([]);
});

test('two dentists and an orthodontist, each with a licence @SON-1-S2 @SON-1-S18', async ({ page }) => {
  await open(page);
  const team = page.locator('#equipo');
  await expect(team.locator('h3')).toHaveText(['Dra. Lucía Ferraro', 'Dra. Valeria Sosa', 'Dr. Martín Iturralde']);
  const roles = await team.locator('.person__role').allTextContents();
  expect(roles).toHaveLength(3);
  expect(roles.filter((r) => r.startsWith('Odontóloga'))).toHaveLength(2);
  expect(roles.filter((r) => r.startsWith('Ortodoncista'))).toHaveLength(1);
  for (const role of roles) expect(role).toMatch(/M\.N\. \d{2}\.\d{3}/);
});

test('every appointment link goes to the clinic\'s WhatsApp @SON-1-S3', async ({ page }) => {
  await open(page);
  const hrefs = await page.locator('a[href*="wa.me"]').evaluateAll((links) => links.map((a) => a.href));
  expect(hrefs.length).toBeGreaterThanOrEqual(3);
  for (const href of hrefs) expect(new URL(href).pathname).toBe(`/${WA}`);
});

test('the first phone screen already offers the booking @SON-1-S4', async ({ page }) => {
  await open(page, PHONE);
  const cta = page.locator('.hero a.btn--cta');
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(PHONE.height);
  await expect(page.locator('.bar a[data-book]')).toBeInViewport();
});

test('families and their children are spoken to @SON-1-S5', async ({ page }) => {
  await open(page);
  await expect(page.locator('.hero .lead')).toContainText('grandes y chicos');
  await expect(page.locator('#tratamientos')).toContainText('Odontopediatría');
  await expect(page.locator('.calm')).toContainText('Los chicos se llevan su cepillo');
});

test('the emergency band speaks to whoever comes with a pain @SON-1-S6', async ({ page }) => {
  await open(page, PHONE);
  await expect(page.locator('.urgent')).toContainText('¿Te duele');
});

test('the emergency band speaks to whoever comes with a broken tooth @SON-1-S6', async ({ page }) => {
  await open(page, PHONE);
  await expect(page.locator('.urgent')).toContainText('se te rompió un diente');
});

test('the text speaks rioplatense voseo @SON-1-S7', async ({ page }) => {
  await open(page);
  const text = await page.locator('body').innerText();
  for (const form of ['Pedí tu turno', 'Escribinos', 'levantás', 'tenés', 'Venís', 'necesitás']) expect(text).toContain(form);
  expect(text).not.toMatch(/\b(tienes|puedes|quieres|necesitas|escríbenos|pide tu)\b/i);
});

test('the calm statement speaks to whoever fears the dentist @SON-1-S8', async ({ page }) => {
  await open(page);
  await expect(page.locator('.statement')).toContainText('paramos cuando levantás la mano');
  await expect(page.locator('.calm__aside')).toContainText('miedo al dentista');
});

test('no stock smiles and no invented proof @SON-1-S9 @SON-1-ASM-10', async ({ page }) => {
  await open(page);
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/★|☆|reseñas?|testimonios?|opiniones|\d[\d.]*\s*pacientes|estrellas/i);
  await expect(page.locator('[class*="review"], [class*="testimonial"], [class*="rating"], [class*="stars"]')).toHaveCount(0);
  const images = await page.locator('img').evaluateAll((imgs) => imgs.map((i) => `${i.getAttribute('src')} ${i.alt}`));
  for (const image of images) expect(image).not.toMatch(/smile|sonrisa|unsplash|pexels|shutterstock|istock|stock/i);
});

test('emergencies are seen without scrolling at 390x844, on call from 8 to 22 @SON-1-S11 @SON-1-ASM-02', async ({ page }) => {
  await open(page, PHONE);
  const band = page.locator('.urgent');
  await expect(band).toContainText('de 8 a 22');
  const button = band.locator('a[data-wa="urgent"]');
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(PHONE.height);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('the emergency button opens WhatsApp saying it is an emergency @SON-1-ASM-03', async ({ page }) => {
  await open(page, PHONE);
  const href = await page.locator('a[data-wa="urgent"]').getAttribute('href');
  expect(new URL(href).pathname).toBe(`/${WA}`);
  expect(waText(href)).toMatch(/urgencia/i);
});

test('how to get there: address, hours, subway and buses @SON-1-S23', async ({ page }) => {
  await open(page);
  const visit = page.locator('#como-llegar');
  await expect(visit).toContainText('Rosario 680');
  await expect(visit).toContainText('Lun a vie 8 a 20');
  await expect(visit).toContainText('Sáb 8 a 13');
  await expect(visit).toContainText('Subte A');
  await expect(visit).toContainText('Colectivos');
});

test('frequent questions and the footer @SON-1-S24', async ({ page }) => {
  await open(page);
  const faq = page.locator('#preguntas details');
  expect(await faq.count()).toBeGreaterThanOrEqual(5);
  await faq.first().locator('summary').click();
  await expect(faq.first()).toHaveAttribute('open', '');
  const foot = page.locator('footer');
  await expect(foot).toContainText('Rosario 680');
  await expect(foot).toContainText('11 5555-0142');
  await expect(foot).toContainText('© 2026 Sonría');
});

test('one index.html with its own CSS and JS beside it @SON-1-S25 @SON-1-ASM-16', async ({ page }) => {
  const failed = [];
  page.on('response', (res) => { if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`); });
  await open(page);
  const sheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((l) => l.getAttribute('href')));
  const scripts = await page.locator('script[src]').evaluateAll((s) => s.map((x) => x.getAttribute('src')));
  expect(sheets.filter((h) => !/^https:\/\//.test(h))).toEqual(['styles.css']);
  expect(scripts.filter((h) => !/^https:\/\//.test(h))).toEqual(['app.js']);
  for (const file of ['index.html', 'styles.css', 'app.js']) expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
  const local = await page.evaluate(() => [...document.querySelectorAll('img[src], link[href], script[src]')]
    .map((n) => n.getAttribute('src') ?? n.getAttribute('href'))
    .filter((u) => !/^(https?:)?\/\//.test(u)));
  for (const ref of local) {
    expect(ref, `${ref} is relative`).not.toMatch(/^(\/|[a-z]:|file:)/i);
    expect(fs.existsSync(path.join(ROOT, ref)), `${ref} exists`).toBe(true);
  }
  if (process.env.APP_URL) {
    const statuses = await page.evaluate(async (refs) => Promise.all(refs.map(async (r) => (await fetch(r)).status)), local);
    expect(statuses.every((s) => s === 200)).toBe(true);
    expect(failed).toEqual([]);
  }
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(font).toContain('Bricolage Grotesque');
});

test('the page runs over file:// with no server @SON-1-S29', async ({ page }) => {
  await page.goto(FILE_URL);
  await expect(page.locator('#ins-verdict')).toContainText('Escribí el nombre');
  await expect(page.locator('[data-choices="treatment"] input')).toHaveCount(8);
});

test('the sample data is listed for the client to confirm, WhatsApp +54 9 11 5555-0142 everywhere @SON-1-ASM-01', async ({ page }) => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  expect(readme).toMatch(/datos de ejemplo/i);
  for (const item of ['M.N.', 'Rosario 680', '+54 9 11 5555-0142', 'precios', 'obras sociales', 'horario']) expect(readme).toContain(item);
  await open(page);
  const numbers = await page.locator('a[href*="wa.me"]').evaluateAll((links) => [...new Set(links.map((a) => new URL(a.href).pathname))]);
  expect(numbers).toEqual([`/${WA}`]);
  await expect(page.locator('footer')).toContainText('11 5555-0142');
});

/* T2 · treatments and insurers */

test('seven treatments with the six asked for @SON-1-S12 @SON-1-ASM-04', async ({ page }) => {
  await open(page);
  const names = await page.locator('#tratamientos .item strong').allTextContents();
  expect(names).toHaveLength(7);
  for (const wanted of [/Limpieza/, /caries/, /Ortodoncia/, /Implantes/, /Blanqueamiento/, /Odontopediatría/, /Endodoncia/]) {
    expect(names.some((n) => wanted.test(n)), String(wanted)).toBe(true);
  }
});

test('each treatment says what it is in one line @SON-1-S13', async ({ page }) => {
  await open(page);
  const lines = await page.locator('#tratamientos .item__text').evaluateAll((items) => items.map((i) => [...i.querySelectorAll(':scope > p:not(.item__row):not(.item__note)')].map((p) => p.textContent.trim())));
  expect(lines).toHaveLength(7);
  for (const line of lines) {
    expect(line).toHaveLength(1);
    expect(line[0].split(/[.!?](\s|$)/).filter((s) => s && s.trim()).length).toBe(1);
  }
});

test('each treatment says how many sessions it takes @SON-1-S14', async ({ page }) => {
  await open(page);
  const notes = await page.locator('#tratamientos .item__note').allTextContents();
  expect(notes).toHaveLength(7);
  for (const note of notes) expect(note).toMatch(/\d+ sesi(ó|o)n|sesiones|control por mes/);
});

test('each treatment shows a price from, in pesos @SON-1-S15', async ({ page }) => {
  await open(page);
  const prices = await page.locator('#tratamientos .price').allTextContents();
  expect(prices).toHaveLength(7);
  for (const price of prices) expect(price.replace(/ /g, ' ')).toMatch(/^desde \$ \d{1,3}(\.\d{3})+/);
});

test('the insurers accepted, with a search box @SON-1-S16', async ({ page }) => {
  await open(page);
  const section = page.locator('#obras-sociales');
  await expect(section.getByLabel('¿Cuál tenés?')).toBeVisible();
  await expect(section.locator('.plans__list li')).toHaveCount(14);
});

test('the search says the insurer is accepted @SON-1-S17', async ({ page }) => {
  await open(page);
  await page.locator('#ins-q').fill('Galeno');
  await expect(page.locator('#ins-verdict')).toContainText('Sí, tomamos Galeno');
});

test('the search says the visit is private @SON-1-S17', async ({ page }) => {
  await open(page);
  await page.locator('#ins-q').fill('PAMI');
  await expect(page.locator('#ins-verdict')).toContainText('te atendemos como particular');
});

test('an empty search shows the whole list @SON-1-S17', async ({ page }) => {
  await open(page);
  await page.locator('#ins-q').fill('galeno');
  await page.locator('#ins-q').fill('');
  await expect(page.locator('.plans__list li:visible')).toHaveCount(14);
  await expect(page.locator('#ins-verdict')).toContainText('Escribí el nombre');
});

test('the search ignores case and accents and matches plans: la tomamos or particular @SON-1-ASM-05', async ({ page }) => {
  await open(page);
  const q = page.locator('#ins-q');
  const verdict = page.locator('#ins-verdict');
  await q.fill('MEDIFE');
  await expect(verdict).toContainText('Sí, tomamos Medifé');
  await q.fill('swiss');
  await expect(verdict).toContainText('Sí, tomamos Swiss Medical');
  await q.fill('comercio');
  await expect(verdict).toContainText('Sí, tomamos OSECAC');
  await q.fill('osde');
  await expect(verdict).toContainText('Sí, la tomamos: OSDE, OSDEPYM');
  await q.fill('Obra social inventada');
  await expect(verdict).toContainText('particular');
  await expect(page.locator('.plans__private')).toContainText('particular');
});

test('typed markup is echoed as text @SON-1-ASM-13', async ({ page }) => {
  await open(page);
  await page.locator('#ins-q').fill('<b>x</b>');
  await expect(page.locator('#ins-verdict b')).toHaveText('<b>x</b>');
  await expect(page.locator('#ins-verdict b b')).toHaveCount(0);
  await walkToContact(page);
  await page.locator('#f-name').fill('<i>Ana</i>');
  await page.locator('#f-phone').fill('11 5555 0142');
  await page.locator('#f-note').fill('<img src=x onerror=alert(1)>');
  await next(page);
  const summary = page.locator('[data-summary]');
  await expect(summary).toContainText('<i>Ana</i>');
  await expect(summary).toContainText('<img src=x onerror=alert(1)>');
  await expect(summary.locator('i, img')).toHaveCount(0);
});

/* T3 · the booking */

test('the booking is a form of several steps @SON-1-S19', async ({ page }) => {
  await open(page);
  await expect(page.locator('#booking [data-step]')).toHaveCount(5);
  await expect(page.locator('#booking [data-step]:visible')).toHaveCount(1);
});

test('the steps are treatment, professional, day and band, contact @SON-1-S20', async ({ page }) => {
  await open(page);
  await expect(page.locator('#booking [data-track]')).toHaveText(['Tratamiento', 'Profesional', 'Día y franja', 'Tus datos']);
  const legend = page.locator('#booking [data-step]:visible .step__title');
  await expect(legend).toHaveText('¿Qué necesitás?');
  await page.locator('#turno').scrollIntoViewIfNeeded();
  await pick(page, 'treatment', 'Implantes');
  await next(page);
  await expect(legend).toHaveText('¿Con quién?');
  await pick(page, 'pro', 'Dra. Valeria Sosa');
  await next(page);
  await expect(legend).toHaveText('¿Qué día y en qué franja?');
  await page.locator('[data-choices="day"] label').first().click();
  await pick(page, 'band', 'Mañana');
  await next(page);
  await expect(legend).toHaveText('Tus datos');
});

test('the summary and a button that opens WhatsApp with the message @SON-1-S21 @SON-1-ASM-09', async ({ page }) => {
  const writes = [];
  page.on('request', (req) => { if (req.method() !== 'GET') writes.push(`${req.method()} ${req.url()}`); });
  await open(page);
  await walkToContact(page);
  await page.locator('#f-name').fill('Ana Pérez');
  await page.locator('#f-phone').fill('11 5555 0142');
  await page.locator('#f-plan').fill('OSDE 310');
  await next(page);
  const summary = page.locator('[data-summary]');
  await expect(summary.locator('dt')).toHaveText(['Tratamiento', 'Profesional', 'Día y franja', 'Nombre', 'Celular', 'Obra social']);
  await expect(summary).toContainText('Ana Pérez');
  const send = page.locator('a[data-wa="booking"]');
  await expect(send).toBeVisible();
  const href = await send.getAttribute('href');
  expect(new URL(href).pathname).toBe(`/${WA}`);
  const text = waText(href);
  for (const line of ['Hola, quiero pedir un turno en Sonría.', 'Tratamiento: Limpieza y control', 'Profesional: Dra. Lucía Ferraro', 'Nombre: Ana Pérez', 'Celular: 11 5555 0142', 'Obra social o prepaga: OSDE 310']) {
    expect(text).toContain(line);
  }
  expect(text).toMatch(/Día: \S+ \d+ de \S+, tarde \(de 14 a 20 h\)/);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length + document.cookie.length)).toBe(0);
});

test('fields are validated with the errors inline @SON-1-S22', async ({ page }) => {
  await open(page);
  await page.locator('#turno').scrollIntoViewIfNeeded();
  await next(page);
  const treatmentError = page.locator('#err-treatment');
  await expect(treatmentError).toHaveText(/Elegí un tratamiento/);
  await expect(page.locator('[data-step="0"]')).toHaveAttribute('aria-describedby', /err-treatment/);
  await walkToContact(page);
  await next(page);
  for (const [field, error, text] of [['#f-name', '#err-name', /Escribí tu nombre/], ['#f-phone', '#err-phone', /Necesitamos un celular/]]) {
    await expect(page.locator(error)).toHaveText(text);
    await expect(page.locator(field)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(field)).toHaveAttribute('aria-describedby', new RegExp(error.slice(1)));
  }
  await expect(page.locator('#booking [data-step="3"]')).toBeVisible();
});

test('the profesional step: orthodontics offers only the orthodontist, the rest la primera que esté libre @SON-1-ASM-06', async ({ page }) => {
  await open(page);
  await page.locator('#turno').scrollIntoViewIfNeeded();
  await pick(page, 'treatment', 'Ortodoncia');
  await next(page);
  await expect(page.locator('[data-choices="pro"] label')).toHaveCount(1);
  await expect(page.locator('[data-choices="pro"]')).toContainText('Dr. Martín Iturralde');
  await page.locator('[data-back]').click();
  await pick(page, 'treatment', 'Blanqueamiento');
  await next(page);
  const pros = page.locator('[data-choices="pro"] label');
  await expect(pros).toHaveCount(3);
  await expect(pros.nth(0)).toContainText('Dra. Lucía Ferraro');
  await expect(pros.nth(1)).toContainText('Dra. Valeria Sosa');
  await expect(pros.nth(2)).toContainText('La primera que esté libre');
});

test('the día y franja step: 10 working days, mañana 8 to 13 and tarde 14 to 20, Saturday only mañana @SON-1-ASM-07', async ({ page }) => {
  await open(page);
  await page.locator('#turno').scrollIntoViewIfNeeded();
  await pick(page, 'treatment', 'Limpieza y control');
  await next(page);
  await pick(page, 'pro', 'La primera que esté libre');
  await next(page);
  const days = await page.locator('[data-choices="day"] input').evaluateAll((inputs) => inputs.map((i) => i.getAttribute('aria-label')));
  expect(days).toHaveLength(10);
  expect(days.filter((d) => d.startsWith('domingo'))).toEqual([]);
  const weekday = days.findIndex((d) => !d.startsWith('sábado'));
  await page.locator('[data-choices="day"] label').nth(weekday).click();
  const bands = page.locator('[data-choices="band"] label');
  await expect(bands).toHaveCount(2);
  await expect(bands.nth(0)).toContainText('Mañana');
  await expect(bands.nth(0)).toContainText('de 8 a 13 h');
  await expect(bands.nth(1)).toContainText('Tarde');
  await expect(bands.nth(1)).toContainText('de 14 a 20 h');
  const saturday = days.findIndex((d) => d.startsWith('sábado'));
  await page.locator('[data-choices="day"] label').nth(saturday).click();
  await expect(bands).toHaveCount(1);
  await expect(bands.first()).toContainText('Mañana');
});

test('contact limits: name 2 to 60, mobile 8 to 13 digits, note up to 300 @SON-1-ASM-08', async ({ page }) => {
  await open(page);
  await walkToContact(page);
  const name = page.locator('#f-name');
  const phone = page.locator('#f-phone');
  await name.fill('A');
  await phone.fill('1234567');
  await next(page);
  await expect(page.locator('#err-name')).toHaveText(/al menos 2/);
  await expect(page.locator('#err-phone')).toHaveText(/entre 8 y 13 dígitos/);
  await phone.fill('11-abc-0142');
  await next(page);
  await expect(page.locator('#err-phone')).toHaveText(/solo números/);
  await phone.fill('12345678901234');
  await next(page);
  await expect(page.locator('#err-phone')).toHaveText(/entre 8 y 13 dígitos/);
  await expect(name).toHaveAttribute('maxlength', '60');
  await expect(page.locator('#f-note')).toHaveAttribute('maxlength', '300');
  await name.fill('x'.repeat(70));
  expect((await name.inputValue()).length).toBe(60);
  await page.locator('#f-note').fill('y'.repeat(320));
  await expect(page.locator('[data-note-count]')).toHaveText('300');
  await expect(page.locator('#f-plan')).not.toHaveAttribute('required', /.*/);
  await name.fill('Al');
  await phone.fill('11 5555-01');
  await next(page);
  await expect(page.locator('#booking [data-step="4"]')).toBeVisible();
});

test('Enter advances and focus goes to the error or the next step @SON-1-ASM-12', async ({ page }) => {
  await open(page);
  await page.locator('#turno').scrollIntoViewIfNeeded();
  await next(page);
  expect(await page.evaluate(() => document.activeElement.getAttribute('name'))).toBe('treatment');
  await pick(page, 'treatment', 'Limpieza y control');
  await next(page);
  await expect(page.locator('[data-step="1"] .step__title')).toBeFocused();
  await pick(page, 'pro', 'Dra. Valeria Sosa');
  await next(page);
  const weekday = await weekdayIndex(page, (l) => !l.startsWith('sábado'));
  await page.locator('[data-choices="day"] label').nth(weekday).click();
  await pick(page, 'band', 'Mañana');
  await next(page);
  await page.locator('#f-phone').fill('11 5555 0142');
  await page.locator('#f-phone').press('Enter');
  await expect(page.locator('#f-name')).toBeFocused();
  await expect(page.locator('#err-name')).not.toBeEmpty();
  await page.locator('#f-name').fill('Ana Pérez');
  await page.locator('#f-plan').press('Enter');
  await expect(page.locator('#sum-title')).toBeFocused();
});

test('the tratamiento step offers Consulta, no sé qué necesito @SON-1-ASM-14', async ({ page }) => {
  await open(page);
  const options = page.locator('[data-choices="treatment"] label');
  await expect(options).toHaveCount(8);
  await expect(options.last()).toContainText('Consulta, no sé qué necesito');
});

/* T4 · widths, accessibility, captures and the statement pictures */

test('no sideways scroll at 390 and 1440 and the statement within 42ch @SON-1-S26', async ({ page }) => {
  for (const size of [PHONE, DESK]) {
    await open(page, size);
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll, `width ${size.width}`).toBeLessThanOrEqual(client);
  }
  const { width, ch } = await page.evaluate(() => {
    const statement = document.querySelector('.statement');
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(42);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    statement.append(probe);
    const result = { width: statement.getBoundingClientRect().width, ch: probe.getBoundingClientRect().width };
    probe.remove();
    return result;
  });
  expect(Math.abs(width - ch), `statement ${width} px against 42ch ${ch} px`).toBeLessThanOrEqual(2);
});

test('reduced motion, visible focus, AA contrast and a clean console @SON-1-S27', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  const moving = await page.locator('[data-reveal]').evaluateAll((nodes) => nodes.filter((n) => {
    const s = getComputedStyle(n);
    return s.opacity !== '1' || (s.transform !== 'none' && s.transform !== 'matrix(1, 0, 0, 1, 0, 0)');
  }).length);
  expect(moving).toBe(0);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { tag: document.activeElement.tagName, outline: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(ring.tag).toBe('A');
  expect(ring.outline).not.toBe('none');
  expect(ring.width).toBeGreaterThan(0);
  const axePath = require.resolve('axe-core/axe.min.js', { paths: [ROOT, process.env.KIT_PLAYWRIGHT_ROOT ?? ROOT, path.dirname(require.resolve('./pw'))] });
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap((v) => v.nodes.map((n) => n.target.join(' '))));
  expect(violations).toEqual([]);
  await walkToContact(page);
  await page.locator('#f-name').fill('Ana Pérez');
  await page.locator('#f-phone').fill('11 5555 0142');
  await next(page);
  expect(errors).toEqual([]);
});

test('viewport captures at 390x844 and 1440x900 @SON-1-S28', async ({ page }, info) => {
  for (const size of [PHONE, DESK]) {
    await open(page, size);
    const shot = await page.screenshot({ path: info.outputPath(`viewport-${size.width}.png`) });
    expect(pngSize(shot)).toEqual(size);
  }
});

test('the instruments picture frames the tips, between 85 and 97 % high and 30 and 80 % wide @SON-1-ASM-15', async ({ page }) => {
  // The part of the photo the slot shows, in percent of the photo: object-fit cover, object-position, then the scale
  // around transform-origin. The four tips sit between 30 and 80 % of its width and 85 and 95 % of its height;
  // above 75 % are the cables and the tray, below 97 % the floor.
  for (const size of [PHONE, DESK]) {
    await open(page, size);
    const img = page.locator('.statement .slot img[src*="instrument"]');
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty('complete', true);
    const view = await img.evaluate((node) => {
      const s = getComputedStyle(node);
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const cover = Math.max(w / node.naturalWidth, h / node.naturalHeight);
      const iw = node.naturalWidth * cover;
      const ih = node.naturalHeight * cover;
      const [px, py] = s.objectPosition.split(' ').map((v) => parseFloat(v) / 100);
      const left = (w - iw) * px;
      const top = (h - ih) * py;
      const z = s.transform === 'none' ? 1 : new DOMMatrix(s.transform).a;
      const [ox, oy] = s.transformOrigin.split(' ').map(parseFloat);
      const seen = (a, o) => o + (a - o) / z;
      const pct = (v, start, len) => ((v - start) / len) * 100;
      return {
        x0: pct(seen(0, ox), left, iw), x1: pct(seen(w, ox), left, iw),
        y0: pct(seen(0, oy), top, ih), y1: pct(seen(h, oy), top, ih),
      };
    });
    expect(view.x0, `left edge at ${size.width}`).toBeLessThanOrEqual(30);
    expect(view.x1, `right edge at ${size.width}`).toBeGreaterThanOrEqual(80);
    expect(view.y0, `top edge at ${size.width}`).toBeGreaterThanOrEqual(75);
    expect(view.y0, `top edge at ${size.width}`).toBeLessThanOrEqual(85);
    expect(view.y1, `bottom edge at ${size.width}`).toBeLessThanOrEqual(97);
  }
});
