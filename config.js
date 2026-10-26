/* IngredIA — configuración.
   Mientras SERVIDOR_IA esté vacío, la app funciona solo con el recetario de la casa.
   Mientras FIREBASE sea null, se entra sin cuenta (versión de prueba) y todo se guarda en el teléfono. */
const CONFIG = {
  // Dirección del servidor de IA (Cloudflare Worker), sin barra al final. Ej: 'https://ingredia.tu-usuario.workers.dev'
  SERVIDOR_IA: 'https://ingredia.estufado28.workers.dev',

  // Datos del proyecto de Firebase (se copian de la consola de Firebase). Ej: { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' }
  FIREBASE: null,

  // Recetas con IA por persona y por día.
  RECETAS_POR_DIA: 10
};
