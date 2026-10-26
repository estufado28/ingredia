/* IngredIA — servidor de IA (Cloudflare Worker, plan gratuito).
   Guarda la clave de Gemini escondida y la app le pide recetas y lectura de fotos.
   Variables (en Cloudflare > Worker > Settings > Variables):
     GEMINI_KEY  (secreta)  clave de Google AI Studio
     ORIGEN                 dirección de la app, ej: https://tu-usuario.github.io
     MODELO      (opcional) por defecto: gemini-3.5-flash-lite */

const MAX_IMAGEN = 1_500_000; // ~1,1 MB en base64

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ORIGEN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin'
    };
    const responder = (cuerpo, estado = 200) =>
      new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return responder({ error: 'Usá POST' }, 405);
    if (env.ORIGEN && req.headers.get('Origin') !== env.ORIGEN) return responder({ error: 'Origen no permitido' }, 403);

    let datos;
    try { datos = await req.json(); } catch { return responder({ error: 'Pedido inválido' }, 400); }

    const ruta = new URL(req.url).pathname;
    try {
      if (ruta === '/receta') return responder(await receta(datos, env));
      if (ruta === '/detectar') return responder(await detectar(datos, env));
      return responder({ error: 'No existe' }, 404);
    } catch (e) {
      return responder({ error: e.message || 'Error' }, e.estado || 500);
    }
  }
};

function texto(v, max = 80) { return String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, max).trim(); }
function lista(v, maxItems = 30) { return (Array.isArray(v) ? v : []).slice(0, maxItems).map(x => texto(x)).filter(Boolean); }

async function receta(d, env) {
  const ingredientes = lista(d.ingredientes);
  if (!ingredientes.length) throw Object.assign(new Error('Faltan ingredientes'), { estado: 400 });
  const kcal = Math.min(1200, Math.max(150, Number(d.kcalObjetivo) || 450));
  const comida = texto(d.comida, 20) || 'Almuerzo';
  const reglas = [];
  if (d.sinTacc) reglas.push('Sin TACC: nada con trigo, avena, cebada ni centeno.');
  if (d.vegano) reglas.push('Vegana: sin carne, pescado, huevo ni lácteos.');
  else if (d.vegetariano) reglas.push('Vegetariana: sin carne ni pescado.');
  const evitar = lista(d.evitar, 15);
  if (evitar.length) reglas.push('No uses nunca: ' + evitar.join(', ') + '.');
  const distinta = texto(d.distintaDe, 100);

  const prompt = `Sos un cocinero argentino que arma platos ricos y livianos para personas que quieren bajar de peso de forma saludable.
Armá UNA receta para ${comida.toLowerCase()} de 1 porción usando principalmente estos ingredientes que la persona tiene: ${ingredientes.join(', ')}.
Podés sumar solo básicos de cualquier cocina: sal, pimienta, especias secas, vinagre, agua y hasta 1 cucharadita de aceite.
No hace falta usar todos los ingredientes. No inventes ingredientes que no estén en la lista ni en los básicos.
La porción tiene que tener aproximadamente ${kcal} kcal (entre ${Math.round(kcal * 0.9)} y ${Math.round(kcal * 1.1)}), calculadas con valores nutricionales reales y cantidades en gramos o unidades.
${reglas.join('\n')}
${distinta ? 'Que sea distinta de: ' + distinta + '.' : ''}
Además, sugerí 1 o 2 ingredientes que NO estén en la lista y que mejorarían el plato sumando pocas calorías, con un motivo corto. No reescribas la receta con ellos.
Escribí en español rioplatense, con pasos claros y cortos (entre 3 y 6). Si hay carne, pollo o pescado, indicá que se cocine bien.
Respondé SOLO con JSON con esta forma exacta:
{"nombre": string, "kcal": number, "minutos": number, "porciones": 1, "ingredientes": [{"nombre": string, "cantidad": string}], "pasos": [string], "sugerencias": [{"ingrediente": string, "motivo": string}]}`;

  const r = await gemini(env, [{ text: prompt }]);
  if (!r || typeof r.nombre !== 'string' || !Array.isArray(r.pasos)) throw new Error('Respuesta incompleta de la IA');
  return r;
}

async function detectar(d, env) {
  const img = String(d.imagen || '');
  if (!img || img.length > MAX_IMAGEN) throw Object.assign(new Error('Foto inválida o muy pesada'), { estado: 400 });
  const prompt = `Mirá esta foto de una heladera, alacena o mesada y listá los alimentos que se ven y sirven para cocinar.
Usá nombres comunes en español rioplatense, en singular o como se dicen normalmente (ej: "huevos", "zapallito", "queso cremoso").
No incluyas bebidas alcohólicas ni cosas que no sean comida. Si no estás seguro de algo, no lo pongas.
Respondé SOLO con JSON: {"ingredientes": [string]}`;
  const r = await gemini(env, [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: img } }]);
  return { ingredientes: lista(r && r.ingredientes, 20) };
}

async function gemini(env, partes) {
  const modelo = env.MODELO || 'gemini-3.5-flash-lite';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
    body: JSON.stringify({
      contents: [{ parts: partes }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
    })
  });
  if (res.status === 429) throw Object.assign(new Error('Se agotó el cupo gratis de hoy'), { estado: 429 });
  if (!res.ok) throw Object.assign(new Error('La IA respondió con error ' + res.status), { estado: 502 });
  const j = await res.json();
  const t = j?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  try { return JSON.parse(t.replace(/^```json\s*|```\s*$/g, '')); }
  catch { throw Object.assign(new Error('La IA no devolvió JSON'), { estado: 502 }); }
}
