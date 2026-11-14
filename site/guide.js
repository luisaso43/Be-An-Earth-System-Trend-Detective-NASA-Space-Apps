/*
 * guide.js - the "Beginner's guide" page: how to read a trend, for people who are not scientists.
 *   1. weather vs. trend        2. read the chart (real Miami data, labeled)
 *   3. how fast?                4. how sure? (coin-flip idea)
 *   5. "Trend or luck?" simulator: build fake weather with a known trend and see if the test finds it
 *   6. five questions to ask any trend   7. practice missions   8. check yourself
 * Text is [English, Spanish, Haitian Creole] in GUIDE_TEXT below (merged into I18N).
 */
window.I18N_EXTRA = Object.assign(window.I18N_EXTRA || {}, {
  "g.h1": ["How to read a climate trend", "Cómo leer una tendencia del clima", "Kijan pou li yon tandans klima"],
  "g.lead": ["No science background needed. In about 2 minutes you will know how to read every chart and answer on this site, and how to tell a real change from luck.",
    "No necesitas saber de ciencia. En unos 2 minutos sabrás leer cada gráfica y respuesta de este sitio, y distinguir un cambio real de la suerte.",
    "Ou pa bezwen konn syans. Nan anviwon 2 minit ou pral konn li chak grafik ak repons sou sit sa a, epi konnen diferans ant yon vrè chanjman ak chans."],
  "g.toc": ["On this page", "En esta página", "Sou paj sa a"],
  "g.s1": ["1. Weather is not a trend", "1. El tiempo no es una tendencia", "1. Tan an se pa yon tandans"],
  "g.s1p": ["<b>Weather</b> is what happens today or this year: a hot week, a rainy summer. It jumps up and down all the time. A <b>trend</b> is a slow, steady change that you can only see over many years, like a child growing taller. One hot summer does not prove a place is warming, just as one tall day does not prove a child grew.",
    "El <b>tiempo</b> es lo que pasa hoy o este año: una semana calurosa, un verano lluvioso. Sube y baja todo el tiempo. Una <b>tendencia</b> es un cambio lento y constante que solo se ve en muchos años, como un niño que va creciendo. Un verano caluroso no prueba que un lugar se esté calentando.",
    "<b>Tan</b> se sa k ap pase jodi a oswa ane sa a: yon semèn cho, yon ete ki gen anpil lapli. Li monte e desann toutan. Yon <b>tandans</b> se yon chanjman dousman e fèm ou ka wè sèlman sou anpil ane, tankou yon timoun k ap grandi. Yon sèl ete cho pa pwouve yon kote ap chofe."],
  "g.s1tip": ["💡 That's why we use <b>40+ years</b> of measurements, and why we compare each July only with other Julys.",
    "💡 Por eso usamos <b>más de 40 años</b> de mediciones, y comparamos cada julio solo con otros julios.",
    "💡 Se pou sa nou sèvi ak <b>plis pase 40 ane</b> mezi, epi nou konpare chak jiyè sèlman ak lòt jiyè."],
  "g.s2": ["2. Read the chart", "2. Lee la gráfica", "2. Li grafik la"],
  "g.s2p": ["This is the real chart for <b>{place}</b> temperature. Every chart on this site works the same way:",
    "Esta es la gráfica real de la temperatura en <b>{place}</b>. Todas las gráficas de este sitio funcionan igual:",
    "Sa a se vrè grafik tanperati <b>{place}</b>. Tout grafik sou sit sa a mache menm jan:"],
  "g.dots": ["<b>Gray dots:</b> one dot = the average of one whole year. They zig-zag: that's weather (noise).",
    "<b>Puntos grises:</b> un punto = el promedio de un año entero. Suben y bajan: eso es el tiempo (ruido).",
    "<b>Pwen gri:</b> yon pwen = mwayèn yon ane antye. Yo fè zigzag: se tan an sa (bri)."],
  "g.line": ["<b>Thick line:</b> the steady trend hiding inside the zig-zag. Tilted up = increasing, down = decreasing, flat = no change.",
    "<b>Línea gruesa:</b> la tendencia constante escondida entre los zigzags. Inclinada hacia arriba = aumenta; hacia abajo = disminuye; plana = sin cambio.",
    "<b>Gwo liy:</b> tandans fèm ki kache nan zigzag la. Li panche monte = ap ogmante, li panche desann = ap diminye, li plat = pa gen chanjman."],
  "g.color": ["<b>Line color:</b> blue = very sure, gold = not sure yet, gray = no real evidence.",
    "<b>Color de la línea:</b> azul = muy seguros, dorado = aún no es seguro, gris = sin evidencia real.",
    "<b>Koulè liy lan:</b> ble = nou sèten anpil, jòn = nou poko sèten, gri = pa gen vrè prèv."],
  "g.annDot": ["One year", "Un año", "Yon ane"],
  "g.annHot": ["Hottest year: weather, not the trend", "El año más caluroso: es el tiempo, no la tendencia", "Ane ki pi cho a: se tan, se pa tandans"],
  "g.annLine": ["The trend", "La tendencia", "Tandans lan"],
  "g.s3": ["3. How fast is it changing?", "3. ¿Qué tan rápido cambia?", "3. Ki vitès li ap chanje?"],
  "g.s3p": ["We give the speed as the <b>change every 10 years</b>. Here: <b>{rate}</b>. Small numbers add up: over {years} years that is <b>{total}</b>.",
    "Damos la velocidad como el <b>cambio cada 10 años</b>. Aquí: <b>{rate}</b>. Los números pequeños se acumulan: en {years} años son <b>{total}</b>.",
    "Nou bay vitès la kòm <b>chanjman chak 10 ane</b>. Isit la: <b>{rate}</b>. Ti chif yo fè gwo total: sou {years} ane sa fè <b>{total}</b>."],
  "g.s3tip": ["💡 To compare two places, compare their \"every 10 years\" numbers. The bigger number (ignoring the sign) is changing faster.",
    "💡 Para comparar dos lugares, compara sus números de \"cada 10 años\". El número más grande (sin contar el signo) cambia más rápido.",
    "💡 Pou konpare de kote, konpare chif \"chak 10 ane\" yo. Pi gwo chif la (san gade siy lan) ap chanje pi vit."],
  "g.s4": ["4. How sure are we? (Could it be luck?)", "4. ¿Qué tan seguros estamos? (¿Podría ser suerte?)", "4. Ki jan nou sèten? (Èske se ka chans?)"],
  "g.s4p": ["Think of flipping a coin. 6 heads out of 10 is normal luck. 10 heads out of 10 almost never happens by luck: something is going on. Our test does the same thing with the years: it asks how often a line this steady would show up <b>by pure chance</b>.",
    "Piensa en lanzar una moneda. 6 caras de 10 es suerte normal. 10 caras de 10 casi nunca pasa por suerte: algo está pasando. Nuestra prueba hace lo mismo con los años: pregunta qué tan seguido aparecería una línea así de constante <b>por pura casualidad</b>.",
    "Panse a jete yon pyès lajan. 6 fwa tèt sou 10 se chans nòmal. 10 fwa tèt sou 10 prèske pa janm rive pa chans: gen yon bagay k ap pase. Tès nou an fè menm bagay la ak ane yo: li mande konbyen fwa yon liy fèm konsa ta parèt <b>pa chans sèlman</b>."],
  "g.s4sig": ["Less than 1 time in 20 by luck. Treat it as real.", "Menos de 1 vez en 20 por suerte. Tómalo como real.", "Mwens pase 1 fwa sou 20 pa chans. Konsidere l kòm vre."],
  "g.s4pos": ["A hint. Luck could still explain it; more years may settle it.", "Un indicio. La suerte aún podría explicarlo; más años podrían aclararlo.", "Yon siy. Chans ka toujou eksplike l; plis ane ka regle sa."],
  "g.s4none": ["Looks like random ups and downs.", "Parecen subidas y bajadas al azar.", "Sanble se monte-desann pa aza."],
  "g.s4warn": ["⚠️ \"Not sure yet\" does <b>not</b> mean \"nothing is happening\". It means we can't tell yet.",
    "⚠️ \"Aún no es seguro\" <b>no</b> significa \"no pasa nada\". Significa que todavía no podemos saberlo.",
    "⚠️ \"Nou poko sèten\" pa vle di \"pa gen anyen k ap pase\". Li vle di nou poko ka di."],
  "g.s5": ["5. Try it: trend or luck?", "5. Pruébalo: ¿tendencia o suerte?", "5. Eseye l: tandans oswa chans?"],
  "g.s5p": ["Here you are the scientist. We make up fake weather and secretly add a trend of the size you choose. Then the same test the site uses tries to find it. Press the button a few times and watch what happens.",
    "Aquí tú eres el científico. Inventamos un tiempo falso y le añadimos en secreto una tendencia del tamaño que elijas. Luego la misma prueba que usa el sitio intenta encontrarla. Presiona el botón varias veces y mira qué pasa.",
    "Isit la se ou ki syantis la. Nou envante fo tan epi nou ajoute an kachèt yon tandans gwosè ou chwazi a. Apre sa, menm tès sit la itilize a eseye jwenn li. Peze bouton an plizyè fwa epi gade sa k ap pase."],
  "g.simChange": ["Real change we hide in the data", "Cambio real que escondemos en los datos", "Vrè chanjman nou kache nan done yo"],
  "g.simYears": ["Years of measurements", "Años de mediciones", "Ane mezi"],
  "g.simNone": ["None (0)", "Ninguno (0)", "Okenn (0)"],
  "g.simSmall": ["Small", "Pequeño", "Piti"],
  "g.simBig": ["Big", "Grande", "Gwo"],
  "g.simPer": ["{x} per 10 yrs", "{x} cada 10 años", "{x} chak 10 an"],
  "g.simYearsOpt": ["{n} years", "{n} años", "{n} ane"],
  "g.simNew": ["🎲 New random weather", "🎲 Nuevo tiempo al azar", "🎲 Nouvo tan pa aza"],
  "g.simResult": ["The test says: <b>{sure}</b> ({p}). It measured {rate} every 10 years.", "La prueba dice: <b>{sure}</b> ({p}). Midió {rate} cada 10 años.",
    "Tès la di: <b>{sure}</b> ({p}). Li mezire {rate} chak 10 ane."],
  "g.simRight0": ["✅ Correct: we hid no change, and the test did not invent one.", "✅ Correcto: no escondimos ningún cambio y la prueba no inventó uno.",
    "✅ Kòrèk: nou pa t kache okenn chanjman, epi tès la pa envante youn."],
  "g.simFooled": ["😮 Fooled by luck! We hid <b>no</b> change, but the random weather happened to line up. This happens about 1 time in 20, which is exactly why scientists double-check with more data and other sources.",
    "😮 ¡Engañado por la suerte! <b>No</b> escondimos ningún cambio, pero el tiempo al azar justo se alineó. Pasa más o menos 1 vez de cada 20, y por eso los científicos verifican con más datos y otras fuentes.",
    "😮 Chans twonpe l! Nou pa t kache <b>okenn</b> chanjman, men tan pa aza a rive aliyen. Sa rive anviwon 1 fwa sou 20, se egzakteman pou sa syantis yo tcheke ankò ak plis done ak lòt sous."],
  "g.simFound": ["✅ Found it: the test spotted the change we hid.", "✅ La encontró: la prueba detectó el cambio que escondimos.",
    "✅ Li jwenn li: tès la wè chanjman nou te kache a."],
  "g.simMissed": ["🔍 There <b>is</b> a real change here (we put it there), but with this much noise and only {n} years the test can't prove it yet. Try more years: real trends get clearer with time.",
    "🔍 Aquí <b>sí</b> hay un cambio real (lo pusimos nosotros), pero con tanto ruido y solo {n} años la prueba aún no puede probarlo. Prueba con más años: las tendencias reales se aclaran con el tiempo.",
    "🔍 Gen yon vrè chanjman isit la (se nou ki mete l), men ak tout bri sa a epi sèlman {n} ane, tès la poko ka pwouve l. Eseye plis ane: vrè tandans vin pi klè avèk tan."],
  "g.simLesson": ["The lesson: short records and small changes often give \"Not sure yet\". That's honest, not a failure.",
    "La lección: los registros cortos y los cambios pequeños a menudo dan \"Aún no es seguro\". Eso es honesto, no un fracaso.",
    "Leson an: done kout ak ti chanjman souvan bay \"Nou poko sèten\". Sa se onètete, se pa yon echèk."],
  "g.simAxis": ["Made-up temperature ({unit})", "Temperatura inventada ({unit})", "Tanperati envante ({unit})"],
  "g.simHidden": ["Trend we hid", "Tendencia escondida", "Tandans nou kache"],
  "g.simFoundLine": ["Trend the test found", "Tendencia que encontró la prueba", "Tandans tès la jwenn"],
  "g.s6": ["6. Five questions to ask about any trend", "6. Cinco preguntas para cualquier tendencia", "6. Senk kesyon pou poze sou nenpòt tandans"],
  "g.q1": ["<b>Which way?</b> Up, down, or flat? (The big word on each card.)", "<b>¿Hacia dónde?</b> ¿Sube, baja o se queda igual? (La palabra grande de cada tarjeta.)",
    "<b>Ki direksyon?</b> Monte, desann oswa plat? (Gwo mo a sou chak kat.)"],
  "g.q2": ["<b>How fast?</b> Look at \"change every 10 years\".", "<b>¿Qué tan rápido?</b> Mira el \"cambio cada 10 años\".", "<b>Ki vitès?</b> Gade \"chanjman chak 10 ane\"."],
  "g.q3": ["<b>How sure?</b> Very sure, not sure yet, or no real evidence?", "<b>¿Qué tan seguros?</b> ¿Muy seguros, aún no es seguro o sin evidencia real?",
    "<b>Ki jan nou sèten?</b> Sèten anpil, poko sèten, oswa pa gen vrè prèv?"],
  "g.q4": ["<b>Over which years?</b> Change the year range: does the answer hold up?", "<b>¿En qué años?</b> Cambia el rango de años: ¿se mantiene la respuesta?",
    "<b>Sou ki ane?</b> Chanje peryòd ane yo: èske repons lan kenbe?"],
  "g.q5": ["<b>What can't it tell me?</b> A trend shows <i>that</i> something changed, not <i>why</i>, and a place's number covers a whole area, not one street.",
    "<b>¿Qué no me puede decir?</b> Una tendencia muestra <i>que</i> algo cambió, no <i>por qué</i>, y el número de un lugar cubre toda una zona, no una sola calle.",
    "<b>Kisa li pa ka di m?</b> Yon tandans montre <i>ke</i> yon bagay chanje, li pa di <i>poukisa</i>, epi chif yon kote kouvri tout yon zòn, se pa yon sèl lari."],
  "g.s7": ["7. Practice missions", "7. Misiones de práctica", "7. Misyon pou pratike"],
  "g.s7p": ["Click a mission. We take you to the right page with everything picked; use the 5 questions to find the answer.",
    "Haz clic en una misión. Te llevamos a la página correcta con todo elegido; usa las 5 preguntas para encontrar la respuesta.",
    "Klike sou yon misyon. N ap mennen w sou bon paj la ak tout bagay deja chwazi; sèvi ak 5 kesyon yo pou jwenn repons lan."],
  "g.m1": ["💧 Is the air in Orlando getting muggier? How sure are we?", "💧 ¿El aire de Orlando está más húmedo? ¿Qué tan seguros estamos?",
    "💧 Èske lè a nan Orlando ap vin pi imid? Ki jan nou sèten?"],
  "g.m2": ["🌊 Where on Florida's coast is the sea rising fastest?", "🌊 ¿En qué parte de la costa de Florida sube más rápido el mar?",
    "🌊 Ki kote sou kòt Florid lanmè a ap monte pi vit?"],
  "g.m3": ["⚖️ Is Miami warming faster than Pensacola?", "⚖️ ¿Miami se calienta más rápido que Pensacola?", "⚖️ Èske Miami ap chofe pi vit pase Pensacola?"],
  "g.m4": ["🌧️ Rain in Tampa Bay: does the answer change if you only look at 2000 onward?",
    "🌧️ La lluvia en Tampa Bay: ¿cambia la respuesta si solo miras desde el 2000?",
    "🌧️ Lapli nan Tampa Bay: èske repons lan chanje si w gade sèlman depi 2000?"],
  "g.s8": ["8. Check yourself", "8. Ponte a prueba", "8. Teste tèt ou"],
  "g.c1q": ["Last summer was the hottest ever in my city. Does that prove my city is warming?", "El verano pasado fue el más caluroso de la historia en mi ciudad. ¿Eso prueba que mi ciudad se está calentando?",
    "Ete pase a te pi cho pase tout lòt nan vil mwen. Èske sa pwouve vil mwen ap chofe?"],
  "g.c1a": ["<b>No.</b> One year is weather. You need many years and a steady trend line to say it is warming.",
    "<b>No.</b> Un año es el tiempo. Necesitas muchos años y una línea de tendencia constante para decir que se está calentando.",
    "<b>Non.</b> Yon ane se tan. Ou bezwen anpil ane ak yon liy tandans fèm pou w di l ap chofe."],
  "g.c2q": ["A card says \"Not sure yet\". Does that mean nothing is changing?", "Una tarjeta dice \"Aún no es seguro\". ¿Significa que nada está cambiando?",
    "Yon kat di \"Nou poko sèten\". Èske sa vle di anyen pa chanje?"],
  "g.c2a": ["<b>No.</b> It means luck could still explain what we see. More years of data may turn it into \"Very sure\", or show it was noise.",
    "<b>No.</b> Significa que la suerte todavía podría explicar lo que vemos. Más años de datos podrían convertirlo en \"Muy seguros\", o mostrar que era ruido.",
    "<b>Non.</b> Li vle di chans ka toujou eksplike sa nou wè. Plis ane done ka fè l tounen \"Nou sèten anpil\", oswa montre se te bri."],
  "g.c3q": ["The sea at a tide gauge is \"Rising, Very sure\". Does the chart tell us why?", "El mar en un mareógrafo está \"Subiendo, Muy seguros\". ¿La gráfica nos dice por qué?",
    "Lanmè nan yon estasyon mare \"Ap monte, Nou sèten anpil\". Èske grafik la di nou poukisa?"],
  "g.c3a": ["<b>No.</b> A trend shows that something changed. The \"Why might this be happening?\" notes list possible causes, such as warming water and melting ice, or sinking land.",
    "<b>No.</b> Una tendencia muestra que algo cambió. Las notas de \"¿Por qué podría estar pasando esto?\" dan posibles causas, como el agua que se calienta, el hielo que se derrite o la tierra que se hunde.",
    "<b>Non.</b> Yon tandans montre yon bagay chanje. Nòt \"Poukisa sa ka ap rive?\" yo bay kòz ki posib, tankou dlo k ap chofe, glas k ap fonn oswa tè k ap fonse."],
  "g.reveal": ["Show the answer", "Ver la respuesta", "Montre repons lan"],
  "g.done": ["🎉 That's it! You can now read every page. Start with <a href=\"#area\">My area</a>.",
    "🎉 ¡Listo! Ya puedes leer todas las páginas. Empieza por <a href=\"#area\">Mi zona</a>.",
    "🎉 Fini! Kounye a ou ka li tout paj yo. Kòmanse ak <a href=\"#area\">Zòn mwen</a>."],
});

window.Guide = (() => {
  const { t, L } = I18N;
  const $ = id => document.getElementById(id);
  let C = null;
  const sim = { change: 1, years: 10 };              // index into CHANGES; years of fake data
  const CHANGES_C = [0, 0.15, 0.5];                  // °C per decade hidden in the fake data
  const YEARS = [5, 10, 20, 45];
  const NOISE_C = 0.8, YEAR_NOISE_C = 0.25;          // typical Florida monthly / year-to-year wobble, °C

  const US = () => C.state.units === "US";
  const toU = c => (US() ? c * 1.8 : c);
  const unitT = () => (US() ? "°F" : "°C");

  function render(ctx) {
    C = ctx;
    const place = "miami", P = C.D.places[place], key = C.seriesKey("temperature", place);
    const r = C.analysis(key, "temperature"), unit = C.unitOf("temperature");
    const years = r.end.year - r.start.year + 1;
    const VS = C.VERDICT;
    const sec = (id, h) => `<h2 id="${id}">${h}</h2>`;

    $("guide-body").innerHTML = `
      <p class="lead">${t("g.lead")}</p>
      ${sec("g1", t("g.s1"))}
      <p>${t("g.s1p")}</p>
      <div class="info">${t("g.s1tip")}</div>

      ${sec("g2", t("g.s2"))}
      <p>${t("g.s2p", { place: P.name })}</p>
      <ul class="legend-list">
        <li>${t("g.dots")}</li><li>${t("g.line")}</li><li>${t("g.color")}</li>
      </ul>
      <div id="guide-chart" class="chart"></div>

      ${sec("g3", t("g.s3"))}
      <p>${t("g.s3p", { rate: C.signed(r.senPerDecade, unit), years, total: C.signed(r.totalChange, unit) })}</p>
      <div class="info">${t("g.s3tip")}</div>

      ${sec("g4", t("g.s4"))}
      <p>${t("g.s4p")}</p>
      <div class="sure-grid">
        <div class="card" style="--c:${VS.significant.color}"><div class="a">${VS.significant.sure}</div><div class="s">${t("g.s4sig")}</div></div>
        <div class="card" style="--c:${VS.possible.color}"><div class="a">${VS.possible.sure}</div><div class="s">${t("g.s4pos")}</div></div>
        <div class="card" style="--c:${VS.none.color}"><div class="a">${VS.none.sure}</div><div class="s">${t("g.s4none")}</div></div>
      </div>
      <div class="warn">${t("g.s4warn")}</div>

      ${sec("g5", t("g.s5"))}
      <p>${t("g.s5p")}</p>
      <div class="sim-controls">
        <div><span class="lbl">${t("g.simChange")}</span><div class="seg" id="sim-change">${CHANGES_C.map((c, i) =>
          `<button type="button" data-i="${i}" aria-pressed="${i === sim.change}">${[t("g.simNone"), t("g.simSmall"), t("g.simBig")][i]}${c
            ? ` <span class="muted">${t("g.simPer", { x: "+" + Stats.nice(toU(c)) + " " + unitT() })}</span>` : ""}</button>`).join("")}</div></div>
        <div><span class="lbl">${t("g.simYears")}</span><div class="seg" id="sim-years">${YEARS.map(n =>
          `<button type="button" data-n="${n}" aria-pressed="${n === sim.years}">${t("g.simYearsOpt", { n })}</button>`).join("")}</div></div>
      </div>
      <button type="button" id="sim-new" class="big-btn">${t("g.simNew")}</button>
      <div id="sim-chart" class="chart"></div>
      <div id="sim-result" aria-live="polite"></div>
      <p class="muted small">${t("g.simLesson")}</p>

      ${sec("g6", t("g.s6"))}
      <ol class="steps"><li>${t("g.q1")}</li><li>${t("g.q2")}</li><li>${t("g.q3")}</li><li>${t("g.q4")}</li><li>${t("g.q5")}</li></ol>

      ${sec("g7", t("g.s7"))}
      <p>${t("g.s7p")}</p>
      <div class="missions">
        <button type="button" data-m="1">${t("g.m1")}</button>
        <button type="button" data-m="2">${t("g.m2")}</button>
        <button type="button" data-m="3">${t("g.m3")}</button>
        <button type="button" data-m="4">${t("g.m4")}</button>
      </div>

      ${sec("g8", t("g.s8"))}
      ${[1, 2, 3].map(i => `<details><summary>❓ ${t(`g.c${i}q`)}</summary><div><p>${t(`g.c${i}a`)}</p></div></details>`).join("")}
      <div class="ok">${t("g.done")}</div>`;

    drawRealChart(r, unit);
    wireSim();
    runSim();

    $("guide-body").querySelectorAll(".missions button").forEach(b => b.addEventListener("click", () => {
      const m = b.dataset.m;
      if (m === "1") C.go("area", { place: "orlando", topic: "humidity" });
      if (m === "2") C.go("map", { mapTopic: "sea_level" });
      if (m === "3") C.go("compare", { cmpTopic: "temperature", cmpA: "miami", cmpB: "pensacola" });
      if (m === "4") { C.state.years["rainfall|tampa"] = undefined; delete C.state.years["rainfall|tampa"]; C.go("area", { place: "tampa", topic: "rainfall" }); }
    }));
  }

  // the real Miami chart, with labels pointing at a dot, the hottest year and the trend line
  function drawRealChart(r, unit) {
    const yr = C.yearly(r), tl = C.trendLine(r), color = C.VERDICT[r.verdict].color;
    const hot = yr.y.indexOf(Math.max(...yr.y)), mid = Math.floor(tl.x.length * 0.35), one = Math.floor(yr.x.length * 0.15);
    const small = window.innerWidth < 560;
    const layout = C.chartLayout(`${C.D.variables.temperature.measure} (${unit})`, small ? 340 : 400);
    layout.showlegend = false;
    layout.annotations = [
      { x: yr.x[hot], y: yr.y[hot], text: t("g.annHot"), showarrow: true, arrowhead: 2, ax: small ? -70 : -140, ay: 35, font: { size: 12 }, bgcolor: "#fff" },
      { x: yr.x[one], y: yr.y[one], text: t("g.annDot"), showarrow: true, arrowhead: 2, ax: 0, ay: 40, font: { size: 12 }, bgcolor: "#fff" },
      { x: tl.x[mid], y: tl.y[mid], text: `<b>${t("g.annLine")}</b>`, showarrow: true, arrowhead: 2, ax: 30, ay: -50, font: { size: 13, color }, bgcolor: "#fff" },
    ];
    Plotly.react("guide-chart", [
      { x: yr.x, y: yr.y, mode: "lines+markers", name: t("chart.yearAvg"), line: { color: "#A0AEC0", width: 1.5 },
        marker: { size: 6, color: "#4A5568" }, hovertemplate: `%{y:.2f} ${unit}<extra></extra>`, xhoverformat: "%Y" },
      { x: tl.x, y: tl.y, mode: "lines", name: t("chart.trend"), line: { color, width: 4 }, hoverinfo: "skip" },
    ], layout, C.PLOT_CONFIG);
  }

  function wireSim() {
    $("sim-change").addEventListener("click", e => {
      const b = e.target.closest("button[data-i]"); if (!b) return;
      sim.change = +b.dataset.i; pressed("sim-change", b); runSim();
    });
    $("sim-years").addEventListener("click", e => {
      const b = e.target.closest("button[data-n]"); if (!b) return;
      sim.years = +b.dataset.n; pressed("sim-years", b); runSim();
    });
    $("sim-new").addEventListener("click", runSim);
  }
  const pressed = (id, on) => $(id).querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === on)));

  function gauss() {                                  // Box-Muller
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function runSim() {
    const n = sim.years, perDecC = CHANGES_C[sim.change], start = 2026 - n, base = 25;   // °C
    const pts = [];
    for (let y = 0; y < n; y++) {
      const yearWobble = gauss() * YEAR_NOISE_C;
      for (let m = 0; m < 12; m++) {
        const i = y * 12 + m;
        const c = base + perDecC * (i / 120) + yearWobble + gauss() * NOISE_C;
        pts.push({ t: i, year: start + y, month: m + 1, v: US() ? c * 1.8 + 32 : c });
      }
    }
    const r = Stats.analyze(pts), v = C.VERDICT[r.verdict], unit = unitT();
    const yr = C.yearly(r), tl = C.trendLine(r);
    const hidden = pts.map(p => (US() ? (base + perDecC * (p.t / 120)) * 1.8 + 32 : base + perDecC * (p.t / 120)));
    const dates = pts.map(p => `${p.year}-${String(p.month).padStart(2, "0")}-01`);
    // shift the hidden line so it sits on the data (only its tilt matters)
    const off = r.climMean - hidden.reduce((s, x) => s + x, 0) / hidden.length;
    Plotly.react("sim-chart", [
      { x: yr.x, y: yr.y, mode: "lines+markers", name: t("chart.yearAvg"), line: { color: "#A0AEC0", width: 1.5 },
        marker: { size: 6, color: "#4A5568" }, hovertemplate: `%{y:.2f} ${unit}<extra></extra>`, xhoverformat: "%Y" },
      { x: dates, y: hidden.map(h => h + off), mode: "lines", name: t("g.simHidden"), line: { color: "#E76F51", width: 2, dash: "dash" }, hoverinfo: "skip" },
      { x: tl.x, y: tl.y, mode: "lines", name: t("g.simFoundLine"), line: { color: v.color, width: 4 }, hoverinfo: "skip" },
    ], C.chartLayout(t("g.simAxis", { unit }), window.innerWidth < 560 ? 300 : 340), C.PLOT_CONFIG);

    const found = r.verdict === "significant";
    const msg = perDecC === 0 ? (found ? t("g.simFooled") : t("g.simRight0")) : (found ? t("g.simFound") : t("g.simMissed", { n }));
    $("sim-result").innerHTML = `<div class="verdict" style="--c:${v.color}"><div class="t">${t("g.simResult", {
      sure: v.sure, p: Stats.formatP(r.mkP), rate: C.signed(r.senPerDecade, unit) })}</div><div class="t">${msg}</div></div>`;
  }

  return { render };
})();
