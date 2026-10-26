/* IngredIA — datos: ingredientes con calorías aproximadas y recetario de respaldo.
   Calorías por 100 g (valores de referencia aproximados). */

const INGREDIENTES = {
  // clave: [nombre, categoría, kcal/100g, gramos por unidad (0 = se pesa), etiquetas, alias]
  // Verduras
  zapallito:   ['Zapallito', 'Verduras', 17, 200, [], ['zapallitos', 'zucchini', 'zuchini']],
  tomate:      ['Tomate', 'Verduras', 18, 120, [], ['tomates']],
  cebolla:     ['Cebolla', 'Verduras', 40, 120, [], ['cebollas']],
  zanahoria:   ['Zanahoria', 'Verduras', 41, 80, [], ['zanahorias']],
  espinaca:    ['Espinaca', 'Verduras', 23, 0, [], ['espinacas']],
  morron:      ['Morrón', 'Verduras', 31, 150, [], ['morrones', 'pimiento', 'pimientos', 'aji morron']],
  lechuga:     ['Lechuga', 'Verduras', 15, 0, [], []],
  brocoli:     ['Brócoli', 'Verduras', 34, 0, [], ['brocolis']],
  zapallo:     ['Zapallo', 'Verduras', 26, 0, [], ['calabaza', 'anco', 'zapallo anco', 'cabutia']],
  papa:        ['Papa', 'Verduras', 77, 170, [], ['papas', 'patata', 'patatas']],
  batata:      ['Batata', 'Verduras', 86, 200, [], ['batatas', 'boniato']],
  berenjena:   ['Berenjena', 'Verduras', 25, 250, [], ['berenjenas']],
  champinones: ['Champiñones', 'Verduras', 22, 0, [], ['champinon', 'hongos']],
  acelga:      ['Acelga', 'Verduras', 19, 0, [], []],
  pepino:      ['Pepino', 'Verduras', 15, 200, [], ['pepinos']],
  choclo:      ['Choclo', 'Verduras', 86, 0, [], ['maiz', 'choclos']],
  ajo:         ['Ajo', 'Verduras', 149, 5, [], ['ajos', 'diente de ajo']],

  // Carnes y pescados
  pollo:       ['Pechuga de pollo', 'Carnes', 120, 0, ['carne'], ['pechuga', 'pollo', 'suprema', 'supremas', 'pechugas']],
  carne:       ['Carne magra', 'Carnes', 145, 0, ['carne'], ['carne vacuna', 'nalga', 'peceto', 'cuadril', 'bife', 'carne roja']],
  picada:      ['Carne picada magra', 'Carnes', 170, 0, ['carne'], ['picada', 'carne picada']],
  merluza:     ['Merluza', 'Carnes', 80, 0, ['pescado'], ['pescado', 'filet de merluza', 'filete']],
  atun:        ['Atún al natural', 'Carnes', 110, 170, ['pescado'], ['atun', 'lata de atun']],
  cerdo:       ['Lomo de cerdo', 'Carnes', 140, 0, ['carne'], ['cerdo', 'bondiola', 'carre']],
  jamon:       ['Jamón cocido', 'Carnes', 120, 0, ['carne'], ['jamon']],

  // Lácteos y huevos
  huevo:       ['Huevos', 'Lácteos', 143, 50, ['huevo'], ['huevo', 'huevos']],
  leche:       ['Leche descremada', 'Lácteos', 35, 0, ['lacteo'], ['leche']],
  yogur:       ['Yogur descremado', 'Lácteos', 40, 0, ['lacteo'], ['yogurt', 'yoghurt', 'yogur']],
  queso:       ['Queso cremoso', 'Lácteos', 300, 0, ['lacteo'], ['queso', 'queso fresco', 'cremoso', 'port salut']],
  ricota:      ['Ricota descremada', 'Lácteos', 100, 0, ['lacteo'], ['ricota', 'ricotta']],
  rallado:     ['Queso rallado', 'Lácteos', 400, 0, ['lacteo'], ['queso rallado', 'parmesano', 'reggianito']],

  // Legumbres
  lentejas:    ['Lentejas', 'Legumbres', 116, 0, [], ['lenteja']],
  garbanzos:   ['Garbanzos', 'Legumbres', 164, 0, [], ['garbanzo']],
  porotos:     ['Porotos', 'Legumbres', 127, 0, [], ['poroto', 'frijoles']],
  arvejas:     ['Arvejas', 'Legumbres', 80, 0, [], ['arveja', 'guisantes']],

  // Frutas
  manzana:     ['Manzana', 'Frutas', 52, 150, [], ['manzanas']],
  banana:      ['Banana', 'Frutas', 89, 120, [], ['bananas', 'platano']],
  naranja:     ['Naranja', 'Frutas', 47, 180, [], ['naranjas']],
  frutilla:    ['Frutillas', 'Frutas', 32, 0, [], ['frutilla', 'fresas', 'fresa']],
  pera:        ['Pera', 'Frutas', 57, 170, [], ['peras']],
  limon:       ['Limón', 'Frutas', 29, 100, [], ['limones']],

  // Despensa (pesos ya cocidos para arroz, fideos y legumbres)
  arroz:       ['Arroz', 'Despensa', 130, 0, [], ['arroz blanco', 'arroz integral']],
  fideos:      ['Fideos', 'Despensa', 158, 0, ['tacc'], ['fideo', 'pasta', 'pastas', 'tallarines', 'spaghetti']],
  avena:       ['Avena', 'Despensa', 380, 0, ['tacc'], ['copos de avena', 'avena instantanea']],
  pan:         ['Pan integral', 'Despensa', 250, 30, ['tacc'], ['pan', 'pan lactal', 'tostadas']],
  aceite:      ['Aceite', 'Despensa', 884, 0, [], ['aceite de oliva', 'aceite de girasol']]
};

// Cosas que se asume que hay en cualquier cocina (no hace falta cargarlas).
const BASICOS = ['aceite', 'sal', 'pimienta', 'agua'];

const CATEGORIAS = ['Verduras', 'Carnes', 'Lácteos', 'Legumbres', 'Frutas', 'Despensa'];

/* Recetario de respaldo. Cantidades en gramos para 1 porción.
   comidas: d = desayuno, a = almuerzo, m = merienda, c = cena */
const RECETARIO = [
  {
    id: 'tortilla-zapallito', nombre: 'Tortilla de zapallito con arroz al horno', comidas: 'ac', minutos: 25,
    ing: { huevo: 100, zapallito: 200, arroz: 100, tomate: 100, queso: 30, aceite: 3 },
    pasos: ['Prendé el horno fuerte. Rallá el zapallito y escurrilo bien con las manos.',
      'Mezclalo con los huevos batidos, el arroz cocido y el tomate en cubos.',
      'Sumá el queso en dados, sal y pimienta.',
      'Pasá todo a una fuente pincelada con el aceite y horneá 20 minutos, hasta que esté firme y dorado.'],
    extras: [['limon', 'Ralladura de limón: frescura sin sumar calorías.'], ['espinaca', 'Un puñado de espinaca: más volumen por muy poco.']]
  },
  {
    id: 'revuelto-zapallito', nombre: 'Revuelto de zapallito y tomate', comidas: 'acd', minutos: 15,
    ing: { huevo: 100, zapallito: 200, tomate: 120, cebolla: 50, aceite: 5 },
    pasos: ['Picá la cebolla y rehogala con el aceite a fuego medio.',
      'Agregá el zapallito en cubos chicos y cociná 5 minutos.',
      'Sumá el tomate picado y, cuando se ablande, los huevos batidos.',
      'Revolvé hasta que cuajen. Salpimentá y serví.'],
    extras: [['ajo', 'Un diente de ajo con la cebolla: mucho sabor por casi nada.'], ['espinaca', 'Espinaca al final: suma hierro y volumen.']]
  },
  {
    id: 'arroz-salteado', nombre: 'Arroz salteado con huevo y vegetales', comidas: 'ac', minutos: 20,
    ing: { arroz: 150, huevo: 50, zapallito: 100, zanahoria: 60, cebolla: 50, aceite: 5 },
    pasos: ['Cortá la cebolla, la zanahoria y el zapallito en tiras finas.',
      'Saltealos en una sartén bien caliente con el aceite, 5 minutos.',
      'Hacé un hueco en el centro, poné el huevo y revolvelo hasta que cuaje.',
      'Agregá el arroz cocido, mezclá todo y ajustá de sal.'],
    extras: [['morron', 'Morrón en tiras: color y dulzor.'], ['limon', 'Unas gotas de limón al servir.']]
  },
  {
    id: 'tomates-rellenos', nombre: 'Tomates rellenos gratinados', comidas: 'ac', minutos: 30,
    ing: { tomate: 300, arroz: 80, queso: 30, cebolla: 40, aceite: 3 },
    pasos: ['Cortá la tapa de los tomates y vaciálos con una cuchara. Guardá la pulpa.',
      'Rehogá la cebolla con el aceite, sumá la pulpa picada y el arroz cocido.',
      'Rellená los tomates y poné el queso arriba.',
      'Horno fuerte 15 minutos, hasta que gratine.'],
    extras: [['espinaca', 'Espinaca picada en el relleno.'], ['ajo', 'Ajo en el sofrito.']]
  },
  {
    id: 'bowl-pollo', nombre: 'Bowl de pollo y verduras salteadas', comidas: 'ac', minutos: 20,
    ing: { pollo: 150, arroz: 100, brocoli: 100, zanahoria: 60, morron: 60, aceite: 5 },
    pasos: ['Cortá el pollo en cubos y salpimentalo.',
      'Dóralo en sartén con el aceite, 6 a 8 minutos. Retiralo.',
      'En la misma sartén salteá el brócoli, la zanahoria y el morrón.',
      'Armá el bowl con el arroz cocido de base, las verduras y el pollo arriba.'],
    extras: [['limon', 'Jugo de limón por encima.'], ['ajo', 'Ajo picado con las verduras.']]
  },
  {
    id: 'pollo-zapallo', nombre: 'Pollo al horno con zapallo', comidas: 'ac', minutos: 40,
    ing: { pollo: 180, zapallo: 250, cebolla: 60, aceite: 5 },
    pasos: ['Prendé el horno fuerte. Cortá el zapallo en cubos y la cebolla en gajos.',
      'Poné todo en una fuente con el pollo, el aceite, sal, pimienta y pimentón si tenés.',
      'Horneá 30 a 35 minutos, dando vuelta una vez.',
      'Verificá que el pollo esté bien cocido por dentro antes de servir.'],
    extras: [['limon', 'Limón en gajos en la fuente.'], ['ajo', 'Dientes de ajo enteros asados.']]
  },
  {
    id: 'merluza-limon', nombre: 'Merluza al limón con puré de zapallo', comidas: 'ac', minutos: 25,
    ing: { merluza: 200, zapallo: 250, limon: 30, aceite: 5 },
    pasos: ['Hervé el zapallo en cubos 15 minutos y pisalo con sal y pimienta.',
      'Condimentá la merluza con sal, pimienta y ralladura de limón.',
      'Cocinala en sartén con el aceite, 3 a 4 minutos por lado.',
      'Serví con el puré y el jugo de limón por encima.'],
    extras: [['espinaca', 'Espinaca salteada al costado.'], ['ajo', 'Ajo en el puré.']]
  },
  {
    id: 'ensalada-lentejas', nombre: 'Ensalada tibia de lentejas', comidas: 'ac', minutos: 15,
    ing: { lentejas: 180, tomate: 100, cebolla: 40, morron: 60, huevo: 50, aceite: 5 },
    pasos: ['Si son secas, usá lentejas ya cocidas y escurridas.',
      'Picá el tomate, la cebolla y el morrón bien chiquitos.',
      'Hervé el huevo 10 minutos y cortalo en cuartos.',
      'Mezclá todo, aliñá con el aceite, sal y un chorrito de vinagre o limón.'],
    extras: [['limon', 'Jugo de limón en vez de vinagre.'], ['espinaca', 'Hojas de espinaca cruda.']]
  },
  {
    id: 'fideos-atun', nombre: 'Fideos con atún y tomate', comidas: 'ac', minutos: 20,
    ing: { fideos: 150, atun: 80, tomate: 150, cebolla: 40, aceite: 5 },
    pasos: ['Hervé los fideos en agua con sal.',
      'Rehogá la cebolla con el aceite y sumá el tomate picado. Cociná 8 minutos.',
      'Agregá el atún escurrido y calentá 2 minutos.',
      'Mezclá con los fideos colados.'],
    extras: [['ajo', 'Ajo en la salsa.'], ['limon', 'Ralladura de limón al final.']]
  },
  {
    id: 'wok-carne', nombre: 'Wok de carne y vegetales', comidas: 'ac', minutos: 20,
    ing: { carne: 130, arroz: 100, morron: 80, cebolla: 60, zanahoria: 60, aceite: 5 },
    pasos: ['Cortá la carne en tiras finas y las verduras en bastones.',
      'Sellá la carne en sartén muy caliente con el aceite. Retirala.',
      'Salteá las verduras 4 minutos, que queden crocantes.',
      'Volvé a sumar la carne, mezclá y serví sobre el arroz.'],
    extras: [['ajo', 'Ajo y jengibre si tenés.'], ['brocoli', 'Brócoli para sumar volumen.']]
  },
  {
    id: 'hamburguesas-lentejas', nombre: 'Hamburguesas de lentejas con ensalada', comidas: 'ac', minutos: 30,
    ing: { lentejas: 180, avena: 20, zanahoria: 60, huevo: 50, cebolla: 40, lechuga: 50, tomate: 80 },
    pasos: ['Pisá las lentejas cocidas con un tenedor.',
      'Sumá la zanahoria rallada, la cebolla picada, el huevo y la avena. Salpimentá.',
      'Formá 2 hamburguesas y cocinalas en sartén antiadherente 4 minutos por lado.',
      'Serví con la lechuga y el tomate.'],
    extras: [['ajo', 'Ajo en la mezcla.'], ['limon', 'Limón en la ensalada.']]
  },
  {
    id: 'ensalada-atun', nombre: 'Ensalada completa con atún y huevo', comidas: 'ac', minutos: 15,
    ing: { lechuga: 80, tomate: 150, atun: 80, huevo: 50, choclo: 50, aceite: 5 },
    pasos: ['Hervé el huevo 10 minutos.',
      'Lavá y cortá la lechuga y el tomate.',
      'Sumá el atún escurrido, el choclo y el huevo en rodajas.',
      'Aliñá con el aceite, sal y limón o vinagre.'],
    extras: [['pepino', 'Pepino: frescura y crocancia.'], ['limon', 'Limón para aliñar.']]
  },
  {
    id: 'omelette-espinaca', nombre: 'Omelette de espinaca y queso', comidas: 'dc', minutos: 10,
    ing: { huevo: 100, espinaca: 80, queso: 25, aceite: 3 },
    pasos: ['Saltá la espinaca 1 minuto en la sartén con el aceite.',
      'Agregá los huevos batidos con sal y pimienta.',
      'Cuando se cuaje abajo, poné el queso en una mitad.',
      'Doblá y cociná 1 minuto más.'],
    extras: [['tomate', 'Tomate en rodajas al costado.'], ['champinones', 'Champiñones salteados.']]
  },
  {
    id: 'garbanzos-salteados', nombre: 'Garbanzos salteados con verduras', comidas: 'ac', minutos: 15,
    ing: { garbanzos: 150, zapallito: 100, morron: 60, cebolla: 50, aceite: 5 },
    pasos: ['Cortá las verduras en cubos.',
      'Salteá la cebolla y el morrón con el aceite, 3 minutos.',
      'Sumá el zapallito y, 3 minutos después, los garbanzos cocidos.',
      'Condimentá con comino o pimentón y serví.'],
    extras: [['espinaca', 'Espinaca al final.'], ['limon', 'Limón por encima.']]
  },
  {
    id: 'papas-huevo', nombre: 'Papas y huevo al horno', comidas: 'ac', minutos: 40,
    ing: { papa: 200, huevo: 100, cebolla: 50, aceite: 5 },
    pasos: ['Cortá las papas en rodajas finas y la cebolla en pluma.',
      'Horneá con el aceite, sal y pimienta 25 minutos.',
      'Hacé dos huecos y rompé los huevos ahí.',
      'Volvé al horno 6 a 8 minutos, hasta que cuajen.'],
    extras: [['espinaca', 'Espinaca debajo de los huevos.'], ['morron', 'Morrón con las papas.']]
  },
  {
    id: 'crema-zapallo', nombre: 'Sopa crema de zapallo', comidas: 'c', minutos: 30,
    ing: { zapallo: 300, cebolla: 50, zanahoria: 60, leche: 100, rallado: 10 },
    pasos: ['Hervé el zapallo, la cebolla y la zanahoria en agua justa, 20 minutos.',
      'Procesá o pisá todo con la leche.',
      'Ajustá de sal, pimienta y nuez moscada.',
      'Serví con el queso rallado arriba.'],
    extras: [['ajo', 'Ajo en la cocción.'], ['espinaca', 'Espinaca procesada con el resto.']]
  },
  {
    id: 'yogur-avena', nombre: 'Yogur con avena y manzana', comidas: 'dm', minutos: 5,
    ing: { yogur: 200, avena: 30, manzana: 120 },
    pasos: ['Cortá la manzana en cubos chicos.',
      'Poné el yogur en un bowl y sumá la avena.',
      'Agregá la manzana y canela si tenés.'],
    extras: [['banana', 'Media banana en rodajas.'], ['frutilla', 'Frutillas en lugar de manzana.']]
  },
  {
    id: 'panqueques-banana', nombre: 'Panqueques de banana y avena', comidas: 'dm', minutos: 15,
    ing: { banana: 100, huevo: 50, avena: 30 },
    pasos: ['Pisá la banana y mezclala con el huevo y la avena.',
      'Calentá una sartén antiadherente a fuego medio.',
      'Cociná cucharadas de mezcla 2 minutos por lado.'],
    extras: [['frutilla', 'Frutillas arriba.'], ['yogur', 'Una cucharada de yogur.']]
  },
  {
    id: 'tostadas-ricota', nombre: 'Tostadas integrales con ricota y tomate', comidas: 'dm', minutos: 5,
    ing: { pan: 60, ricota: 60, tomate: 80 },
    pasos: ['Tostá el pan.',
      'Untalo con la ricota.',
      'Poné el tomate en rodajas, sal y orégano.'],
    extras: [['espinaca', 'Hojas de espinaca.'], ['huevo', 'Un huevo duro en rodajas.']]
  },
  {
    id: 'licuado-frutilla', nombre: 'Licuado de frutilla con avena', comidas: 'dm', minutos: 5,
    ing: { leche: 250, frutilla: 150, avena: 15 },
    pasos: ['Lavá las frutillas y sacales el cabito.',
      'Licuá todo con hielo.'],
    extras: [['banana', 'Media banana para más cremosidad.'], ['yogur', 'Yogur en lugar de parte de la leche.']]
  }
];

// Para usar desde app.js y desde las pruebas en Node.
if (typeof module !== 'undefined') module.exports = { INGREDIENTES, BASICOS, CATEGORIAS, RECETARIO };
