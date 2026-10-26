/* IngredIA — motor: cálculo de calorías, búsqueda en el recetario y ajuste de porciones.
   Funciones puras: no tocan la pantalla, así se pueden probar solas. */

(function (global) {
  // En el navegador, datos.js ya definió estas constantes como globales del script.
  const D = (typeof module !== 'undefined')
    ? require('./datos.js')
    : { ING: INGREDIENTES, BAS: BASICOS, REC: RECETARIO };
  const INGS = D.INGREDIENTES || D.ING;
  const BASS = D.BASICOS || D.BAS;
  const RECS = D.RECETARIO || D.REC;

  const COMIDAS = {
    d: { nombre: 'Desayuno', parte: 0.25 },
    a: { nombre: 'Almuerzo', parte: 0.35 },
    m: { nombre: 'Merienda', parte: 0.12 },
    c: { nombre: 'Cena', parte: 0.28 }
  };

  const ACTIVIDAD = { poco: 1.2, algo: 1.45, mucho: 1.7 };
  const DEFICIT = { leve: 300, moderado: 500 };
  // Piso diario que la app nunca baja, aunque la cuenta dé menos.
  const PISO = { hombre: 1500, mujer: 1200 };

  function sinAcentos(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  // Índice de alias -> clave del ingrediente
  const ALIAS = {};
  for (const [clave, d] of Object.entries(INGS)) {
    ALIAS[sinAcentos(clave)] = clave;
    ALIAS[sinAcentos(d[0])] = clave;
    for (const a of d[5]) ALIAS[sinAcentos(a)] = clave;
  }

  /** Convierte lo que escribe la persona ("2 huevos", "Zapallitos") en una clave conocida, o null. */
  function reconocer(texto) {
    let t = sinAcentos(texto)
      .replace(/^[\d.,/½¼]+\s*(x|kg|g|gr|grs|gramos|unidades|u)?\s*(de\s+)?/, '')
      .replace(/\s*(x\s*)?\d+\s*$/, '')
      .trim();
    if (!t) return null;
    if (ALIAS[t]) return ALIAS[t];
    if (t.endsWith('es') && ALIAS[t.slice(0, -2)]) return ALIAS[t.slice(0, -2)];
    if (t.endsWith('s') && ALIAS[t.slice(0, -1)]) return ALIAS[t.slice(0, -1)];
    return null;
  }

  /** Separa un texto con comas o "y" en varios ingredientes. */
  function separar(texto) {
    return String(texto || '')
      .split(/,|;|\n|\s+y\s+/i)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function edadValida(p) {
    return p && p.edad >= 18 && p.edad <= 100 && p.peso >= 35 && p.peso <= 250 && p.altura >= 120 && p.altura <= 230;
  }

  /** Calorías diarias objetivo (Mifflin-St Jeor), con déficit y piso saludable. */
  function objetivoDiario(p) {
    if (!edadValida(p)) return null;
    const base = 10 * p.peso + 6.25 * p.altura - 5 * p.edad + (p.sexo === 'mujer' ? -161 : 5);
    const gasto = base * (ACTIVIDAD[p.actividad] || ACTIVIDAD.algo);
    const deficit = DEFICIT[p.deficit] || DEFICIT.leve;
    const piso = PISO[p.sexo === 'mujer' ? 'mujer' : 'hombre'];
    // Nunca más de un 25 % por debajo de lo que gasta, nunca debajo del piso.
    const objetivo = Math.max(gasto - deficit, gasto * 0.75, piso);
    return { gasto: Math.round(gasto), objetivo: Math.round(objetivo / 10) * 10 };
  }

  function objetivoComida(p, comida) {
    const o = objetivoDiario(p);
    if (!o) return null;
    return Math.round((o.objetivo * COMIDAS[comida].parte) / 10) * 10;
  }

  function comidaPorHora(hora) {
    if (hora < 11) return 'd';
    if (hora < 15) return 'a';
    if (hora < 19) return 'm';
    return 'c';
  }

  function kcalDe(ing) {
    let total = 0;
    for (const [clave, g] of Object.entries(ing)) {
      const d = INGS[clave];
      if (d) total += (d[2] * g) / 100;
    }
    return total;
  }

  /** Respeta dieta, sin TACC, alergias y cosas que no le gustan. */
  function permitido(clave, r) {
    const d = INGS[clave];
    if (!d || !r) return true;
    const et = d[4];
    if ((r.vegetariano || r.vegano) && (et.includes('carne') || et.includes('pescado'))) return false;
    if (r.vegano && (et.includes('huevo') || et.includes('lacteo'))) return false;
    if (r.sinTacc && et.includes('tacc')) return false;
    if ((r.evitar || []).includes(clave)) return false;
    return true;
  }

  function redondear(g, clave) {
    const d = INGS[clave];
    if (clave === 'huevo') return Math.max(1, Math.round(g / d[3])) * d[3];
    if (g < 20) return Math.max(1, Math.round(g));
    return Math.round(g / 5) * 5;
  }

  /** Ajusta las cantidades de una receta para acercarse al objetivo, sin pasarse de un rango razonable. */
  function ajustar(receta, objetivo) {
    const base = kcalDe(receta.ing);
    const factor = Math.min(1.6, Math.max(0.7, objetivo / base));
    const ing = {};
    for (const [clave, g] of Object.entries(receta.ing)) {
      ing[clave] = clave === 'aceite' ? g : redondear(g * factor, clave);
    }
    return { ing, kcal: Math.round(kcalDe(ing) / 10) * 10 };
  }

  function cantidadTexto(clave, g) {
    const d = INGS[clave];
    if (!d) return g + ' g';
    if (clave === 'aceite') return Math.round(g / 5) <= 1 ? '1 cucharadita' : Math.round(g / 5) + ' cucharaditas';
    if (d[3] > 0) {
      const u = Math.round((g / d[3]) * 2) / 2;
      const txt = u === 0.5 ? '½' : (u % 1 ? Math.floor(u) + ' ½' : String(u));
      return `${txt} (${g} g)`;
    }
    return g + ' g';
  }

  /** Busca en el recetario: recetas posibles con lo que hay, ordenadas por cuánto falta y cercanía al objetivo. */
  function buscar({ tengo, comida, objetivo, restricciones, max = 3 }) {
    const hay = new Set([...(tengo || []), ...BASS]);
    const res = [];
    for (const r of RECS) {
      if (!r.comidas.includes(comida)) continue;
      const claves = Object.keys(r.ing);
      if (!claves.every(c => permitido(c, restricciones))) continue;
      const necesarias = claves.filter(c => !BASS.includes(c));
      const faltan = necesarias.filter(c => !hay.has(c));
      if (faltan.length > 1 || faltan.length / necesarias.length > 0.34) continue;
      const aj = ajustar(r, objetivo);
      res.push({ receta: r, ...aj, faltan, dif: Math.abs(aj.kcal - objetivo) });
    }
    res.sort((x, y) => x.faltan.length - y.faltan.length || x.dif - y.dif);
    return res.slice(0, max);
  }

  /** Convierte un resultado del recetario al mismo formato que devuelve la IA. */
  function aFicha(item, comida) {
    const r = item.receta;
    const sugerencias = r.extras
      .filter(([c]) => !item.ing[c])
      .slice(0, 2)
      .map(([c, motivo]) => ({ ingrediente: INGS[c] ? INGS[c][0] : c, motivo }));
    return {
      id: r.id + '-' + item.kcal,
      nombre: r.nombre,
      comida,
      kcal: item.kcal,
      minutos: r.minutos,
      porciones: 1,
      ingredientes: Object.entries(item.ing).map(([c, g]) => ({
        nombre: INGS[c][0],
        cantidad: cantidadTexto(c, g),
        falta: item.faltan.includes(c)
      })),
      pasos: r.pasos.slice(),
      sugerencias,
      origen: 'recetario'
    };
  }

  const API = {
    COMIDAS, reconocer, separar, objetivoDiario, objetivoComida, comidaPorHora,
    kcalDe, permitido, ajustar, buscar, aFicha, cantidadTexto, sinAcentos
  };
  if (typeof module !== 'undefined') module.exports = API;
  else global.Motor = API;
})(typeof window !== 'undefined' ? window : globalThis);
