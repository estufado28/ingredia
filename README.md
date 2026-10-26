# IngredIA

Web app que arma recetas livianas con lo que tenés en la cocina, calculando las calorías de cada comida según tu perfil. Se instala en iPhone y Android desde el navegador (Safari → Compartir → Agregar a inicio).

## Archivos

- `index.html`, `styles.css`, `app.js`: pantallas y funcionamiento.
- `motor.js`: cálculo de calorías (Mifflin-St Jeor, con déficit leve o moderado y piso de 1.200/1.500 kcal) y búsqueda en el recetario.
- `datos.js`: tabla de calorías por ingrediente y recetario de respaldo.
- `config.js`: dirección del servidor de IA y datos de Firebase. Vacíos = versión de prueba.
- `servidor/worker.js`: servidor de IA para Cloudflare Workers (plan gratis) que usa Gemini.
- `sw.js`, `manifest.webmanifest`, `iconos/`: para que se instale como app.

## Estado

- Versión de prueba: todo se guarda en el teléfono y las recetas salen del recetario.
- Falta: conectar Firebase (entrada con Google y guardado en la nube), publicar el servidor de IA y controlar el límite diario también desde el servidor.
