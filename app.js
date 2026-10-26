/* IngredIA — la app: pantallas, guardado en el teléfono y pedidos a la IA. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const LIMITE = CONFIG.RECETAS_POR_DIA || 10;
  const CLAVE_GUARDADO = 'ingredia';
  const HAY_IA = Boolean(CONFIG.SERVIDOR_IA);

  // ---------- Guardado ----------
  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) || {}; } catch (e) { return {}; }
  }
  const guardado = leer();
  const Est = {
    acepto: Boolean(guardado.acepto),
    usuario: guardado.usuario || null,
    perfil: guardado.perfil || null,
    tengo: Array.isArray(guardado.tengo) ? guardado.tengo : [],
    favoritas: Array.isArray(guardado.favoritas) ? guardado.favoritas : [],
    historial: Array.isArray(guardado.historial) ? guardado.historial : [],
    uso: guardado.uso || { dia: '', n: 0 },
    comida: Motor.comidaPorHora(new Date().getHours()),
    receta: null,
    vieneDe: 'p-cocinar',
    tab: 'favoritas'
  };
  function guardar() {
    try {
      localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({
        acepto: Est.acepto, usuario: Est.usuario, perfil: Est.perfil, tengo: Est.tengo,
        favoritas: Est.favoritas, historial: Est.historial, uso: Est.uso
      }));
    } catch (e) { /* sin guardado: la app sigue funcionando en esta sesión */ }
  }

  function hoy() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function usadasHoy() { return Est.uso.dia === hoy() ? Est.uso.n : 0; }
  function sumarUso() { Est.uso = { dia: hoy(), n: usadasHoy() + 1 }; guardar(); }

  // ---------- Utilidades de pantalla ----------
  function el(tag, props, hijos) {
    const n = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    (hijos || []).forEach(h => h && n.append(h));
    return n;
  }
  function svgCruz() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2.6'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M6 6l12 12M18 6L6 18');
    s.append(p); return s;
  }
  function svgMas() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', '#7A1424');
    s.setAttribute('stroke-width', '2.4'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', 'M12 5v14M5 12h14');
    s.append(p); return s;
  }

  function mostrar(id) {
    document.querySelectorAll('.pantalla').forEach(p => { p.hidden = p.id !== id; });
    window.scrollTo(0, 0);
  }

  let toastTimer;
  function aviso(texto) {
    const t = $('toast');
    t.textContent = texto; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
  }

  function capitalizar(t) { t = String(t || '').trim(); return t.charAt(0).toUpperCase() + t.slice(1); }

  function restricciones() {
    const p = Est.perfil || {};
    const r = p.restricciones || {};
    return {
      sinTacc: Boolean(r.sinTacc), vegetariano: Boolean(r.vegetariano), vegano: Boolean(r.vegano),
      evitar: (p.evitar || []).map(x => x.clave).filter(Boolean),
      evitarTexto: (p.evitar || []).map(x => x.nombre)
    };
  }

  // ---------- Entrada ----------
  $('txt-entrar').textContent = CONFIG.FIREBASE ? 'Continuar con Google' : 'Entrar (versión de prueba)';
  $('chk-edad').addEventListener('change', (e) => { $('btn-entrar').disabled = !e.target.checked; });
  $('btn-entrar').addEventListener('click', async () => {
    if (!$('chk-edad').checked) return;
    if (CONFIG.FIREBASE) {
      try {
        $('btn-entrar').disabled = true;
        Est.usuario = await entrarConGoogle();
      } catch (e) {
        $('btn-entrar').disabled = false;
        aviso('No se pudo entrar con Google. Probá de nuevo.');
        return;
      }
    }
    Est.acepto = true;
    guardar();
    abrirPerfil(false);
  });

  let fb = null;
  async function cargarFirebase() {
    if (fb) return fb;
    const v = '10.12.2';
    const app = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`);
    const auth = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`);
    const a = app.initializeApp(CONFIG.FIREBASE);
    fb = { auth: auth.getAuth(a), mod: auth };
    return fb;
  }
  async function entrarConGoogle() {
    const f = await cargarFirebase();
    const res = await f.mod.signInWithPopup(f.auth, new f.mod.GoogleAuthProvider());
    return { uid: res.user.uid, nombre: res.user.displayName || '' };
  }
  async function token() {
    if (!CONFIG.FIREBASE) return null;
    try {
      const f = await cargarFirebase();
      return f.auth.currentUser ? await f.auth.currentUser.getIdToken() : null;
    } catch (e) { return null; }
  }

  // ---------- Perfil ----------
  let pf = null; // perfil que se está editando

  function abrirPerfil(editando) {
    pf = JSON.parse(JSON.stringify(Est.perfil || { sexo: '', actividad: 'algo', deficit: 'leve', restricciones: {}, evitar: [] }));
    $('perfil-cerrar').hidden = !editando;
    $('perfil-saludo').textContent = editando ? 'Tu perfil' : 'Un paso y arrancamos';
    $('in-edad').value = pf.edad || '';
    $('in-peso').value = pf.peso || '';
    $('in-altura').value = pf.altura || '';
    $('perfil-error').hidden = true;
    pintarPerfil();
    mostrar('p-perfil');
  }

  function pintarPerfil() {
    document.querySelectorAll('#p-perfil [data-campo]').forEach(g => {
      g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(pf[g.dataset.campo] === b.dataset.valor)));
    });
    document.querySelectorAll('#toggles-dieta button').forEach(b => b.setAttribute('aria-pressed', String(Boolean(pf.restricciones[b.dataset.r]))));
    const lista = $('lista-evitar');
    lista.replaceChildren(...pf.evitar.map((x, i) => el('span', { class: 'sticker' }, [
      document.createTextNode('Sin ' + x.nombre.toLowerCase()),
      el('button', { type: 'button', 'aria-label': 'Quitar ' + x.nombre, onclick: () => { pf.evitar.splice(i, 1); pintarPerfil(); } }, [svgCruz()])
    ])));
    leerNumeros();
    const o = Motor.objetivoDiario(pf);
    $('perfil-objetivo').textContent = o && pf.sexo ? '~' + o.objetivo.toLocaleString('es-AR') + ' kcal' : 'Completá tus datos';
  }

  function leerNumeros() {
    pf.edad = Number($('in-edad').value) || 0;
    pf.peso = Number(String($('in-peso').value).replace(',', '.')) || 0;
    pf.altura = Number($('in-altura').value) || 0;
  }

  document.querySelectorAll('#p-perfil [data-campo] button').forEach(b => b.addEventListener('click', () => {
    pf[b.closest('[data-campo]').dataset.campo] = b.dataset.valor; pintarPerfil();
  }));
  document.querySelectorAll('#toggles-dieta button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.r;
    pf.restricciones[k] = !pf.restricciones[k];
    if (k === 'vegano' && pf.restricciones.vegano) pf.restricciones.vegetariano = true;
    pintarPerfil();
  }));
  ['in-edad', 'in-peso', 'in-altura'].forEach(id => $(id).addEventListener('input', pintarPerfil));

  function agregarEvitar() {
    const partes = Motor.separar($('in-evitar').value);
    for (const t of partes) {
      const clave = Motor.reconocer(t);
      const nombre = clave ? INGREDIENTES[clave][0] : capitalizar(t);
      if (!pf.evitar.some(x => x.nombre === nombre)) pf.evitar.push({ clave, nombre });
    }
    $('in-evitar').value = '';
    pintarPerfil();
  }
  $('btn-evitar').addEventListener('click', agregarEvitar);
  $('in-evitar').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); agregarEvitar(); } });

  $('form-perfil').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('in-evitar').value.trim()) agregarEvitar();
    leerNumeros();
    let error = '';
    if (!pf.sexo) error = 'Elegí el sexo para poder calcular tus calorías.';
    else if (pf.edad && pf.edad < 18) error = 'IngredIA es solo para mayores de 18 años.';
    else if (!Motor.objetivoDiario(pf)) error = 'Revisá edad, peso y altura: algún dato parece fuera de rango.';
    if (error) { $('perfil-error').textContent = error; $('perfil-error').hidden = false; return; }
    Est.perfil = pf;
    guardar();
    abrirCocinar();
  });
  $('perfil-cerrar').addEventListener('click', abrirCocinar);

  // ---------- Cocinar ----------
  function pintarComidas() {
    const cont = $('selector-comida');
    cont.replaceChildren(...Object.entries(Motor.COMIDAS).map(([k, c]) => el('button', {
      type: 'button', 'aria-pressed': String(Est.comida === k), text: c.nombre,
      onclick: () => { Est.comida = k; pintarComidas(); pintarObjetivo(); }
    })));
  }
  function pintarObjetivo() {
    const o = Motor.objetivoComida(Est.perfil, Est.comida);
    $('objetivo-comida').textContent = o ? o + ' kcal' : '— kcal';
  }
  function pintarCupo() {
    $('cupo').textContent = (LIMITE - usadasHoy()) + '/' + LIMITE + ' hoy';
  }
  function pintarTengo() {
    $('tengo-vacio').hidden = Est.tengo.length > 0;
    $('lista-tengo').replaceChildren(...Est.tengo.map((x, i) => el('span', { class: 'sticker' }, [
      document.createTextNode(x.nombre),
      el('button', { type: 'button', 'aria-label': 'Quitar ' + x.nombre, onclick: () => { Est.tengo.splice(i, 1); guardar(); pintarTengo(); } }, [svgCruz()])
    ])));
  }
  function agregarTengo(texto) {
    const clave = Motor.reconocer(texto);
    if (clave && !Motor.permitido(clave, restricciones())) {
      aviso(INGREDIENTES[clave][0] + ' está en lo que evitás. Lo cambiás desde tu perfil.');
      return;
    }
    const nombre = clave ? INGREDIENTES[clave][0] : capitalizar(texto);
    if (!nombre || Est.tengo.some(x => (clave && x.clave === clave) || x.nombre.toLowerCase() === nombre.toLowerCase())) return;
    Est.tengo.push({ clave, nombre });
  }

  function abrirCocinar() {
    const nombre = Est.usuario && Est.usuario.nombre ? Est.usuario.nombre.split(' ')[0] : '';
    $('saludo').textContent = nombre ? `Hola, ${nombre}, ¿qué cocinamos?` : 'Hola, ¿qué cocinamos?';
    pintarComidas(); pintarObjetivo(); pintarCupo(); pintarTengo();
    mostrar('p-cocinar');
  }

  $('form-ingrediente').addEventListener('submit', (e) => {
    e.preventDefault();
    Motor.separar($('in-ingrediente').value).forEach(agregarTengo);
    $('in-ingrediente').value = '';
    guardar(); pintarTengo();
  });
  $('in-ingrediente').addEventListener('blur', () => { if ($('in-ingrediente').value.trim()) $('form-ingrediente').requestSubmit(); });

  $('ir-perfil').addEventListener('click', () => abrirPerfil(true));
  $('ir-recetas').addEventListener('click', () => abrirRecetas());

  // Categorías
  $('mosaico').replaceChildren(...CATEGORIAS.map(cat => el('button', { type: 'button', onclick: () => abrirCategoria(cat) }, [svgMas(), el('span', { text: cat })])));
  let categoriaAbierta = null;
  function abrirCategoria(cat) {
    categoriaAbierta = cat;
    $('hoja-titulo').textContent = cat;
    const r = restricciones();
    const claves = Object.keys(INGREDIENTES).filter(k => INGREDIENTES[k][1] === cat && k !== 'aceite' && Motor.permitido(k, r));
    $('hoja-lista').replaceChildren(...claves.map(k => {
      const id = 'cat-' + k;
      return el('label', { for: id }, [
        el('input', Object.assign({ type: 'checkbox', id, 'data-clave': k }, Est.tengo.some(x => x.clave === k) ? { checked: '' } : {})),
        document.createTextNode(INGREDIENTES[k][0])
      ]);
    }));
    $('hoja-categoria').showModal();
  }
  $('hoja-categoria').addEventListener('close', () => {
    if ($('hoja-categoria').returnValue !== 'listo' || !categoriaAbierta) return;
    $('hoja-lista').querySelectorAll('input').forEach(i => {
      const k = i.dataset.clave;
      const esta = Est.tengo.findIndex(x => x.clave === k);
      if (i.checked && esta < 0) Est.tengo.push({ clave: k, nombre: INGREDIENTES[k][0] });
      if (!i.checked && esta >= 0) Est.tengo.splice(esta, 1);
    });
    guardar(); pintarTengo();
  });

  // ---------- Generar ----------
  $('btn-generar').addEventListener('click', () => generar());

  async function generar(distintaDe) {
    if (!Est.tengo.length) { aviso('Agregá al menos un ingrediente.'); return; }
    const objetivo = Motor.objetivoComida(Est.perfil, Est.comida);
    if (!HAY_IA) return abrirRecetario('sin-ia');
    if (usadasHoy() >= LIMITE) return abrirRecetario('cupo-propio');

    const btn = $('btn-generar');
    const textoBtn = btn.textContent;
    btn.disabled = true; btn.textContent = 'Pensando tu receta…';
    try {
      const r = restricciones();
      const datos = {
        ingredientes: Est.tengo.map(x => x.nombre),
        comida: Motor.COMIDAS[Est.comida].nombre,
        kcalObjetivo: objetivo,
        sinTacc: r.sinTacc, vegetariano: r.vegetariano, vegano: r.vegano,
        evitar: r.evitarTexto,
        distintaDe: distintaDe || ''
      };
      const ficha = await pedirIA('/receta', datos);
      sumarUso();
      mostrarReceta(normalizarFicha(ficha), 'p-cocinar');
    } catch (e) {
      abrirRecetario(e.status === 429 ? 'cupo-app' : 'error');
    } finally {
      btn.disabled = false; btn.textContent = textoBtn;
    }
  }

  async function pedirIA(ruta, datos) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const tk = await token();
      if (tk) headers.Authorization = 'Bearer ' + tk;
      const res = await fetch(CONFIG.SERVIDOR_IA + ruta, { method: 'POST', headers, body: JSON.stringify(datos), signal: ctrl.signal });
      if (!res.ok) { const err = new Error('servidor ' + res.status); err.status = res.status; throw err; }
      return await res.json();
    } finally { clearTimeout(t); }
  }

  function normalizarFicha(f) {
    if (!f || typeof f.nombre !== 'string' || !Array.isArray(f.pasos) || !Array.isArray(f.ingredientes)) throw new Error('respuesta rara');
    return {
      id: 'ia-' + Date.now(),
      nombre: f.nombre,
      comida: Est.comida,
      kcal: Math.round(Number(f.kcal) / 10) * 10 || null,
      minutos: Number(f.minutos) || null,
      porciones: Number(f.porciones) || 1,
      ingredientes: f.ingredientes.map(i => ({ nombre: String(i.nombre || ''), cantidad: String(i.cantidad || ''), falta: false })),
      pasos: f.pasos.map(String),
      sugerencias: (f.sugerencias || []).slice(0, 2).map(s => ({ ingrediente: String(s.ingrediente || ''), motivo: String(s.motivo || '') })),
      origen: 'ia'
    };
  }

  // ---------- Recetario ----------
  const MOTIVOS = {
    'sin-ia': 'Las recetas con IA todavía no están conectadas en esta versión de prueba. Mientras, te muestro recetas probadas.',
    'cupo-propio': `Ya usaste tus ${LIMITE} recetas con IA de hoy. Mañana se renuevan; mientras, te muestro estas.`,
    'cupo-app': 'Hoy se usaron todas las recetas con IA de la app. Mañana vuelven; mientras, te muestro estas.',
    'error': 'No pude conectarme con la IA. Mientras, te muestro recetas del recetario.'
  };
  function abrirRecetario(motivo) {
    const objetivo = Motor.objetivoComida(Est.perfil, Est.comida);
    const comidaNombre = Motor.COMIDAS[Est.comida].nombre.toLowerCase();
    $('recetario-motivo').textContent = MOTIVOS[motivo];
    $('recetario-bajada').textContent = `Recetas con lo que tenés para el ${comidaNombre}, cerca de tus ${objetivo} kcal.`;
    const res = Motor.buscar({ tengo: Est.tengo.map(x => x.clave).filter(Boolean), comida: Est.comida, objetivo, restricciones: restricciones() });
    $('recetario-titulo').textContent = res.length
      ? (res.length === 1 ? '1 coincide con tu cocina' : res.length + ' coinciden con tu cocina')
      : 'No encontré coincidencias';
    const lista = $('recetario-lista');
    if (!res.length) {
      lista.replaceChildren(el('p', { class: 'vacio', text: `No hay recetas del recetario para el ${comidaNombre} con esos ingredientes. Probá sumar algo más o cambiar de comida.` }));
    } else {
      lista.replaceChildren(...res.map(item => {
        const usa = item.faltan.length
          ? 'Te falta: ' + item.faltan.map(c => INGREDIENTES[c][0].toLowerCase()).join(', ')
          : 'Tenés todo';
        return el('button', { type: 'button', class: 'tarjeta', onclick: () => mostrarReceta(Motor.aFicha(item, Est.comida), 'p-recetario') }, [
          el('span', { class: 'inicial', 'aria-hidden': 'true', text: item.receta.nombre.charAt(0) }),
          el('span', { class: 'info' }, [el('b', { text: item.receta.nombre }), el('span', { text: usa + ' · ' + item.receta.minutos + ' min' })]),
          el('span', { class: 'kcal', text: item.kcal + ' kcal' })
        ]);
      }));
    }
    mostrar('p-recetario');
  }
  $('recetario-volver').addEventListener('click', abrirCocinar);

  // ---------- Receta ----------
  function esFavorita(r) { return Est.favoritas.some(f => f.id === r.id); }

  function mostrarReceta(r, vieneDe) {
    Est.receta = r;
    Est.vieneDe = vieneDe || 'p-cocinar';
    $('receta-nombre').textContent = r.nombre;
    const pills = [];
    if (r.kcal) pills.push(el('span', { class: 'pill fuerte', text: '~' + r.kcal + ' kcal' }));
    if (r.minutos) pills.push(el('span', { class: 'pill', text: r.minutos + ' min' }));
    pills.push(el('span', { class: 'pill', text: r.porciones > 1 ? r.porciones + ' porciones' : '1 porción' }));
    $('receta-pills').replaceChildren(...pills);

    const sug = r.sugerencias || [];
    $('receta-tip').hidden = !sug.length;
    $('receta-sugerencias').replaceChildren(
      el('b', { text: 'Si tenés, sumale' }),
      ...sug.map(s => el('span', {}, [el('strong', { text: s.ingrediente + ': ' }), document.createTextNode(s.motivo)]))
    );

    $('receta-ingredientes').replaceChildren(...r.ingredientes.map(i => el('li', {}, [
      el('span', {}, [document.createTextNode(i.nombre), i.falta ? el('span', { class: 'falta', text: 'te falta' }) : null]),
      el('span', { text: i.cantidad })
    ])));
    $('receta-pasos').replaceChildren(...r.pasos.map(p => el('li', {}, [el('span', { text: p })])));
    $('receta-origen').textContent = r.origen === 'ia'
      ? 'Receta creada con IA. Las calorías son aproximadas; revisá que los pasos tengan sentido antes de cocinar.'
      : 'Del recetario de la casa. Las calorías son aproximadas.';
    pintarFav();
    $('receta-otra').textContent = Est.vieneDe === 'p-recetas' ? 'Volver' : 'Otra idea';
    mostrar('p-receta');
  }

  function pintarFav() {
    const on = esFavorita(Est.receta);
    const b = $('receta-fav');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Quitar de favoritas' : 'Guardar en favoritas');
    b.querySelector('svg').setAttribute('fill', on ? '#C8102E' : 'none');
  }
  $('receta-fav').addEventListener('click', () => {
    const r = Est.receta;
    if (esFavorita(r)) { Est.favoritas = Est.favoritas.filter(f => f.id !== r.id); aviso('La sacaste de favoritas.'); }
    else { Est.favoritas.unshift(r); aviso('Guardada en favoritas.'); }
    guardar(); pintarFav();
  });
  $('receta-volver').addEventListener('click', volverDeReceta);
  function volverDeReceta() {
    if (Est.vieneDe === 'p-recetario') mostrar('p-recetario');
    else if (Est.vieneDe === 'p-recetas') abrirRecetas();
    else abrirCocinar();
  }
  $('receta-otra').addEventListener('click', () => {
    const r = Est.receta;
    if (Est.vieneDe === 'p-recetas') return abrirRecetas();
    if (r.origen === 'ia') { abrirCocinar(); generar(r.nombre); }
    else mostrar('p-recetario');
  });
  $('receta-cocinar').addEventListener('click', () => {
    const r = Est.receta;
    Est.historial = [Object.assign({}, r, { fecha: hoy() }), ...Est.historial.filter(h => h.id !== r.id)].slice(0, 40);
    guardar();
    aviso('Quedó en tu historial. ¡Buen provecho!');
  });

  // ---------- Mis recetas ----------
  function abrirRecetas() {
    document.querySelectorAll('#tabs-recetas button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === Est.tab)));
    const lista = Est.tab === 'favoritas' ? Est.favoritas : Est.historial;
    $('recetas-vacio').hidden = lista.length > 0;
    $('recetas-vacio').textContent = Est.tab === 'favoritas'
      ? 'Todavía no guardaste favoritas. Tocá el corazón en una receta para tenerla acá.'
      : 'Acá van a aparecer las recetas que cocines.';
    $('recetas-lista').replaceChildren(...lista.map(r => el('button', { type: 'button', class: 'tarjeta', onclick: () => mostrarReceta(r, 'p-recetas') }, [
      el('span', { class: 'inicial', 'aria-hidden': 'true', text: r.nombre.charAt(0) }),
      el('span', { class: 'info' }, [
        el('b', { text: r.nombre }),
        el('span', { text: [Motor.COMIDAS[r.comida] ? Motor.COMIDAS[r.comida].nombre : '', r.minutos ? r.minutos + ' min' : ''].filter(Boolean).join(' · ') })
      ]),
      r.kcal ? el('span', { class: 'kcal', text: r.kcal + ' kcal' }) : null
    ])));
    mostrar('p-recetas');
  }
  document.querySelectorAll('#tabs-recetas button').forEach(b => b.addEventListener('click', () => { Est.tab = b.dataset.tab; abrirRecetas(); }));
  $('recetas-volver').addEventListener('click', abrirCocinar);

  // ---------- Foto ----------
  $('in-foto').addEventListener('change', async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    let imagen;
    try { imagen = await achicarFoto(archivo); } catch (err) { aviso('No pude abrir esa foto.'); return; }
    $('foto-img').src = imagen;
    $('foto-lista').replaceChildren();
    $('foto-resultado').hidden = true;
    $('foto-error').hidden = true;
    $('foto-usar').disabled = true;
    $('foto-usar').textContent = 'Usar estos';
    mostrar('p-foto');

    if (!HAY_IA) {
      $('foto-cargando').hidden = true;
      mostrarErrorFoto('Leer la foto necesita la IA, que todavía no está conectada en esta versión de prueba. Escribí los ingredientes o elegilos por categoría.');
      return;
    }
    $('foto-cargando').hidden = false;
    try {
      const r = await pedirIA('/detectar', { imagen: imagen.split(',')[1], tipo: 'image/jpeg' });
      const nombres = (r.ingredientes || []).map(String).filter(Boolean).slice(0, 20);
      $('foto-cargando').hidden = true;
      if (!nombres.length) return mostrarErrorFoto('No reconocí ingredientes en la foto. Probá con más luz o más cerca.');
      $('foto-titulo').textContent = nombres.length === 1 ? 'Encontré 1 cosa' : `Encontré ${nombres.length} cosas`;
      $('foto-resultado').hidden = false;
      $('foto-lista').replaceChildren(...nombres.map((n, i) => el('label', { for: 'foto-' + i }, [
        el('input', { type: 'checkbox', id: 'foto-' + i, checked: '', 'data-nombre': n }),
        document.createTextNode(capitalizar(n))
      ])));
      $('foto-usar').disabled = false;
    } catch (err) {
      $('foto-cargando').hidden = true;
      mostrarErrorFoto(err.status === 429 ? 'Hoy se agotó el uso de IA de la app. Escribí los ingredientes o elegilos por categoría.' : 'No pude leer la foto. Probá de nuevo o escribí los ingredientes.');
    }
  });
  function mostrarErrorFoto(texto) {
    $('foto-error').textContent = texto; $('foto-error').hidden = false;
    $('foto-usar').disabled = false; $('foto-usar').textContent = 'Volver';
  }
  $('foto-usar').addEventListener('click', () => {
    $('foto-lista').querySelectorAll('input:checked').forEach(i => agregarTengo(i.dataset.nombre));
    guardar(); abrirCocinar();
  });
  $('foto-cerrar').addEventListener('click', abrirCocinar);

  function achicarFoto(archivo) {
    return new Promise((ok, mal) => {
      const lector = new FileReader();
      lector.onerror = mal;
      lector.onload = () => {
        const img = new Image();
        img.onerror = mal;
        img.onload = () => {
          const max = 1024;
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL('image/jpeg', 0.8));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  // ---------- Inicio ----------
  if (!Est.acepto) mostrar('p-entrada');
  else if (!Est.perfil) abrirPerfil(false);
  else abrirCocinar();

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|anthropic/.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
