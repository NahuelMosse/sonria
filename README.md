# Sonría

Sitio de una página de Sonría, un consultorio odontológico de barrio en Caballito (Buenos Aires): urgencias por WhatsApp, tratamientos con precio orientativo, buscador de obras sociales y prepagas, el equipo y un turno en cuatro pasos que abre WhatsApp con el mensaje armado.

Es HTML, CSS y JavaScript sin build: `index.html`, `styles.css`, `app.js` y las fotos de `assets/`. Se abre directo con doble clic (`file://`) o desde cualquier servidor estático, también bajo un subpath como el de GitHub Pages: todas las rutas son relativas.

## Datos de ejemplo para confirmar con el consultorio

El consultorio es inventado, así que estos datos son de ejemplo y hay que reemplazarlos por los reales antes de usar el sitio:

- nombres y matrículas (M.N.) de las dos odontólogas y el ortodoncista;
- la dirección, Rosario 680, 1.º B, y los colectivos y el subte cercanos;
- el WhatsApp, +54 9 11 5555-0142 (en `app.js`, constante `WHATSAPP`, y en los enlaces de `index.html`);
- el horario de atención y el de la guardia;
- los precios «desde $» de cada tratamiento y el de la consulta particular;
- la lista de obras sociales y prepagas (en `app.js`, constante `INSURERS`).

El turno no guarda ni envía datos: solo arma un mensaje de WhatsApp. El sitio no muestra reseñas, estrellas ni cantidad de pacientes, porque no hay ninguna real que mostrar.

## Fotos

Las del barrio son de Wikimedia Commons, con licencia libre; autor y licencia de cada una están en el pie de la página y en `assets/credits.json`. Las de tratamientos, instrumentos y consultorio (`assets/sonria-*.jpg`) son ilustrativas, generadas con IA para el sitio.

## Tests

Escenarios de Playwright en `apps/e2e/`, uno o más por cada requisito del encargo:

```sh
npm install
npx playwright install chromium
npm test
```

`npm test` corre la página sobre `file://`. Con `APP_URL` apuntando a `node apps/e2e/serve.js` (que la sirve en `/sonria/`), también comprueba que cada foto, estilo y script cargue bajo el subpath.
