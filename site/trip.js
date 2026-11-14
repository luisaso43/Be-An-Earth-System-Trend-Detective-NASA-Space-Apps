/*
 * trip.js - the "Plan a trip" page of the static Earth Data Detective site (the version hosted on Vercel).
 *
 * It uses the SAME data (data.json) and the SAME math (stats.js) as the other pages. For one place and one
 * calendar month (say every July since 1981) it:
 *   1. tests whether that month has a steady trend (Mann-Kendall, same as the "My area" page),
 *   2. estimates what to expect in the trip year: continue the trend line if the trend is clear (p < 0.05),
 *      otherwise use the average of the most recent 15 years (we do not extrapolate a trend that may be luck),
 *   3. gives the range that 8 out of 10 past years fell inside,
 *   4. scores the month for an activity with simple, visible rules of thumb (see ACTIVITIES below).
 *
 * app.js calls TripPlanner.render(ctx) when the #trip page is shown. ctx hands over app.js's helpers.
 * Raw data units: temperature and dew point in °C, rain in mm/day (turned into mm per month here).
 */
window.TripPlanner = (() => {
  const { t, L, cap } = I18N;
  let MONTHS = I18N.months(), SHORT = I18N.monthsShort();   // refreshed on every render (language can change)
  const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const RECENT_YEARS = 15;
  const HEAT_DEW_C = 21.1, HEAT_TEMP_C = 27;           // 70 °F dew point and 80 °F air: heat-danger month
  const THIS_YEAR = new Date().getFullYear();

  // ---- scoring rules: edit the numbers here and the page AND the "how we score" table both update ----
  // v: t = average temperature (°C), d = dew point (°C), r = rain in the month (mm)
  // kind "above": no loss up to `ok`, full loss (`max` points) at `bad`, straight line in between. "below" is the mirror.
  // Text is [English, Spanish, Haitian Creole]; I18N.L picks the current language.
  const ACTIVITIES = {
    parks: {
      emoji: "🎢", name: ["Theme parks & sightseeing", "Parques temáticos y paseos", "Pak atraksyon ak vizit"],
      about: ["A full day outside: walking, standing in lines, waiting for rides.", "Un día entero afuera: caminando, haciendo filas, esperando las atracciones.",
        "Yon jounen antye deyò: mache, kanpe nan liy, tann manèj yo."],
      rules: [
        { v: "t", kind: "above", ok: 25, bad: 31, max: 35, short: ["heat", "el calor", "chalè"],
          why: ["Hot sun and long lines wear you out.", "El sol fuerte y las filas largas te agotan.", "Solèy cho ak liy long fatige w."],
          tip: ["Arrive at opening time and take an indoor break at midday.", "Llega a la hora de apertura y descansa bajo techo al mediodía.", "Rive lè l ouvri epi pran yon poz anndan a midi."] },
        { v: "t", kind: "below", ok: 15, bad: 5, max: 25, short: ["cold", "el frío", "frèt"],
          why: ["Too chilly for rides and water parks.", "Demasiado frío para atracciones y parques acuáticos.", "Twò frèt pou manèj ak pak dlo."],
          tip: ["Bring layers: mornings and evenings are cool.", "Lleva ropa en capas: las mañanas y las noches son frescas.", "Pote plizyè rad: maten ak aswè fre."] },
        { v: "d", kind: "above", ok: 18, bad: 23, max: 35, short: ["sticky air", "el aire pegajoso", "lè ki kole"],
          why: ["In sticky air sweat cannot dry, so you overheat faster.", "Con el aire pegajoso el sudor no se seca, así que te sobrecalientas más rápido.", "Nan lè ki kole swe pa ka seche, kidonk ou chofe pi vit."],
          tip: ["Drink water often and plan shady or air-conditioned breaks.", "Toma agua seguido y planea descansos a la sombra o con aire acondicionado.", "Bwè dlo souvan epi planifye poz nan lonbraj oswa nan èkondisyone."] },
        { v: "r", kind: "above", ok: 120, bad: 260, max: 15, short: ["lots of rain", "mucha lluvia", "anpil lapli"],
          why: ["Many storm days mean soggy lines and paused rides.", "Muchos días de tormenta significan filas mojadas y atracciones detenidas.", "Anpil jou tanpèt vle di liy mouye ak manèj ki kanpe."],
          tip: ["Pack a poncho. Storms usually hit in the afternoon, so ride outdoors in the morning.", "Lleva un poncho. Las tormentas suelen llegar en la tarde, así que sube a las atracciones al aire libre en la mañana.", "Pote yon poncho. Tanpèt konn frape apremidi, kidonk monte manèj deyò yo nan maten."] },
      ],
    },
    beach: {
      emoji: "🏖️", name: ["Beach", "Playa", "Plaj"],
      about: ["Swimming, sunbathing and walks on the sand.", "Nadar, tomar el sol y caminar por la arena.", "Naje, pran solèy ak mache sou sab la."],
      rules: [
        { v: "t", kind: "below", ok: 25, bad: 17, max: 45, short: ["cool weather", "el tiempo fresco", "tan fre"],
          why: ["Too cool to enjoy swimming.", "Demasiado fresco para disfrutar nadando.", "Twò fre pou w jwi naje."],
          tip: ["Water and air are cool: pack a wetsuit top or a towel and a jacket.", "El agua y el aire están frescos: lleva un traje de neopreno o una toalla y una chaqueta.", "Dlo a ak lè a fre: pote yon rad neyopwèn oswa yon sèvyèt ak yon jakèt."] },
        { v: "t", kind: "above", ok: 29, bad: 33, max: 25, short: ["heat", "el calor", "chalè"],
          why: ["Very hot sand and sun.", "Arena y sol muy calientes.", "Sab ak solèy cho anpil."],
          tip: ["Go early or late, wear sunscreen and shade up at midday.", "Ve temprano o tarde, usa protector solar y busca sombra al mediodía.", "Ale bonè oswa ta, mete krèm solèy epi chita nan lonbraj a midi."] },
        { v: "d", kind: "above", ok: 22, bad: 25, max: 15, short: ["sticky air", "el aire pegajoso", "lè ki kole"],
          why: ["Very sticky air, even with a sea breeze.", "Aire muy pegajoso, incluso con brisa marina.", "Lè a kole anpil, menm ak ti van lanmè a."],
          tip: ["Stay near the water and keep drinking.", "Quédate cerca del agua y sigue tomando líquidos.", "Rete toupre dlo a epi kontinye bwè."] },
        { v: "r", kind: "above", ok: 150, bad: 300, max: 20, short: ["lots of rain", "mucha lluvia", "anpil lapli"],
          why: ["Rainy days cut into beach time.", "Los días de lluvia quitan tiempo de playa.", "Jou lapli yo diminye tan plaj ou."],
          tip: ["Check the sky before you drive out: storms usually pass in under an hour.", "Mira el cielo antes de salir: las tormentas suelen pasar en menos de una hora.", "Gade syèl la anvan w soti: tanpèt konn pase nan mwens pase inèdtan."] },
      ],
    },
    mud: {
      emoji: "🛻", name: ["Mudding & off-roading", "Lodo y todoterreno", "Labou ak machin tout tèren"],
      about: ["Trails that are fun when the ground is wet, but not flooded.", "Senderos divertidos cuando el suelo está mojado, pero no inundado.", "Chemen ki amizan lè tè a mouye, men pa inonde."],
      rules: [
        { v: "r", kind: "below", ok: 90, bad: 30, max: 55, short: ["not enough rain", "poca lluvia", "pa ase lapli"],
          why: ["Not enough rain: you get dust, not mud.", "No llueve lo suficiente: hay polvo, no lodo.", "Pa ase lapli: ou jwenn pousyè, pa labou."],
          tip: ["Trails will be dry. Look for low, wet spots or wait for a rainy month.", "Los senderos estarán secos. Busca zonas bajas y mojadas o espera un mes lluvioso.", "Chemen yo ap sèk. Chèche kote ki ba e ki mouye oswa tann yon mwa lapli."] },
        { v: "r", kind: "above", ok: 220, bad: 350, max: 25, short: ["flooded trails", "senderos inundados", "chemen inonde"],
          why: ["So much rain that trails flood or close.", "Tanta lluvia que los senderos se inundan o cierran.", "Tèlman lapli chemen yo inonde oswa fèmen."],
          tip: ["Check that your trail is open: wet-season rain can flood low ground.", "Confirma que tu sendero esté abierto: la lluvia de la temporada húmeda puede inundar las zonas bajas.", "Tcheke si chemen w lan louvri: lapli sezon mouye a ka inonde tè ki ba."] },
        { v: "t", kind: "above", ok: 28, bad: 33, max: 20, short: ["heat", "el calor", "chalè"],
          why: ["Heat is hard on riders and engines.", "El calor es duro para conductores y motores.", "Chalè a di pou chofè ak motè."],
          tip: ["Ride early, carry extra water and watch the engine temperature.", "Sal temprano, lleva agua de más y vigila la temperatura del motor.", "Soti bonè, pote plis dlo epi veye tanperati motè a."] },
        { v: "t", kind: "below", ok: 12, bad: 3, max: 10, short: ["cold", "el frío", "frèt"],
          why: ["Cold and miserable once you get wet.", "Frío e incómodo cuando te mojas.", "Frèt e mizerab lè w mouye."],
          tip: ["Wear waterproof layers.", "Usa capas impermeables.", "Mete rad ki pa kite dlo pase."] },
      ],
    },
    hike: {
      emoji: "🥾", name: ["Hiking & camping", "Senderismo y campamento", "Randone ak kan"],
      about: ["Long days on trails and nights outdoors.", "Días largos en senderos y noches al aire libre.", "Jounen long sou chemen ak nwit deyò."],
      rules: [
        { v: "t", kind: "above", ok: 24, bad: 30, max: 40, short: ["heat", "el calor", "chalè"],
          why: ["Long walks in heat are tiring and risky.", "Las caminatas largas con calor cansan y son riesgosas.", "Mache lontan nan chalè fatige w e li danjere."],
          tip: ["Start at sunrise, carry more water than you think you need.", "Empieza al amanecer y lleva más agua de la que crees necesitar.", "Kòmanse lè solèy leve, pote plis dlo pase sa w panse w bezwen."] },
        { v: "t", kind: "below", ok: 12, bad: 3, max: 25, short: ["cold nights", "las noches frías", "nwit frèt"],
          why: ["Cold nights outdoors.", "Noches frías al aire libre.", "Nwit frèt deyò."],
          tip: ["Bring a warm sleeping bag.", "Lleva un saco de dormir abrigado.", "Pote yon sak dòmi ki cho."] },
        { v: "d", kind: "above", ok: 16, bad: 22, max: 25, short: ["muggy air", "el aire húmedo", "lè imid"],
          why: ["Muggy air makes every mile harder.", "El aire húmedo hace más difícil cada kilómetro.", "Lè imid fè chak kilomèt pi difisil."],
          tip: ["Shorten your route and rest in the shade.", "Acorta tu ruta y descansa a la sombra.", "Rakousi wout ou epi repoze nan lonbraj."] },
        { v: "r", kind: "above", ok: 100, bad: 250, max: 10, short: ["lots of rain", "mucha lluvia", "anpil lapli"],
          why: ["Wet trails, mosquitoes and flooded paths.", "Senderos mojados, mosquitos y caminos inundados.", "Chemen mouye, moustik ak wout inonde."],
          tip: ["Pack rain gear and bug spray.", "Lleva ropa para la lluvia y repelente de insectos.", "Pote rad lapli ak pwodui kont moustik."] },
      ],
    },
  };
  const ACTIVITY_KEYS = Object.keys(ACTIVITIES);

  const band = (min, k, color) => ({ min, color, get word() { return t("band." + k); } });
  const BANDS = [band(80, "great", "#34D399"), band(60, "good", "#A3E635"), band(40, "tough", "#FB923C"), band(0, "rough", "#F87171")];
  const ACT_ICON = { parks: "ticket", beach: "sun", mud: "truck", hike: "tent" };
  const actIcon = k => window.Icon ? Icon(ACT_ICON[k] || "target") : "";
  const bandOf = s => BANDS.find(b => s >= b.min);

  // ---- small helpers ----
  let C = null;                                   // ctx from app.js (D, state, helpers)
  let wired = false;
  const ts = { activity: "parks", month: 0, picked: false, year: THIS_YEAR + 1, chartVar: "temperature" };
  const cache = new Map();
  const $ = id => document.getElementById(id);
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  function quantile(a, q) {
    const s = Float64Array.from(a).sort(), pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }
  const US = () => C.state.units === "US";
  const fmtT = (c, unit = true) => US() ? `${Math.round(c * 1.8 + 32)}${unit ? " °F" : ""}` : `${c.toFixed(1)}${unit ? " °C" : ""}`;
  const fmtR = (mm, unit = true) => US() ? `${(mm / 25.4).toFixed(1)}${unit ? " " + t("unit.in") : ""}` : `${Math.round(mm)}${unit ? " mm" : ""}`;
  const fmtV = (kind, x, unit = true) => (kind === "rainfall" ? fmtR : fmtT)(x, unit);
  const dispAbs = (kind, x) => kind === "rainfall" ? (US() ? x / 25.4 : x) : (US() ? x * 1.8 + 32 : x);
  const dispDelta = (kind, x) => kind === "rainfall" ? (US() ? x / 25.4 : x) : (US() ? x * 1.8 : x);
  const deltaUnit = kind => kind === "rainfall" ? (US() ? t("unit.in") : "mm") : (US() ? "°F" : "°C");
  const muggyWord = d => t(d <= 15.5 ? "mug.1" : d <= 18.3 ? "mug.2" : d <= HEAT_DEW_C ? "mug.3" : "mug.4");
  const actName = a => L(a.name);
  const actLow = a => { const n = actName(a); return I18N.lang === "en" || I18N.lang === "es" ? n.toLowerCase() : n; };

  // ---- the numbers for one place + month ----
  // Cached part: the month's values over the years and its trend test (does not depend on the trip year).
  function monthBase(placeKey, varKey, month) {
    const key = C.seriesKey(varKey, placeKey), ck = `${key}|${varKey}|${month}`;
    if (!cache.has(ck)) {
      const e = C.D.series[key][varKey], [y0, m0] = e.start.split("-").map(Number), vals = [];
      e.v.forEach((x, i) => {
        if (x === null) return;
        const mm = m0 - 1 + i;
        if (mm % 12 !== month) return;
        vals.push({ year: y0 + Math.floor(mm / 12), v: varKey === "rainfall" ? x * DAYS[month] : x });  // rain: mm per month
      });
      const pts = vals.map(p => ({ t: (p.year - vals[0].year) * 12, year: p.year, month: month + 1, v: p.v }));
      cache.set(ck, { vals, r: Stats.analyze(pts) });
    }
    return cache.get(ck);
  }

  // What to expect in `year`, and the range 8 in 10 past years fell inside.
  function monthStat(placeKey, varKey, month, year) {
    const { vals, r } = monthBase(placeKey, varKey, month), n = vals.length;
    const trendNow = r.senLine[n - 1] + r.climMean, slopeYr = r.senPerDecade / 10;
    const useTrend = r.verdict === "significant";
    const recent = mean(vals.slice(-RECENT_YEARS).map(p => p.v));
    const expected = useTrend ? trendNow + slopeYr * (year - vals[n - 1].year) : recent;
    const resid = vals.map((p, i) => p.v - (r.senLine[i] + r.climMean));
    return {
      vals, r, useTrend, slopeYr, expected, recent, early: mean(vals.slice(0, RECENT_YEARS).map(p => p.v)),
      lo: expected + quantile(resid, 0.1), hi: expected + quantile(resid, 0.9), trendNow,
    };
  }

  function snapshot(placeKey, month, year) {
    const T = monthStat(placeKey, "temperature", month, year), D = monthStat(placeKey, "humidity", month, year),
      R = monthStat(placeKey, "rainfall", month, year);
    return { T, D, R, m: { t: T.expected, d: D.expected, r: R.expected } };
  }

  // ---- scoring ----
  function penalty(rule, m) {
    const x = m[rule.v];
    return rule.kind === "above" ? clamp01((x - rule.ok) / (rule.bad - rule.ok)) * rule.max
      : clamp01((rule.ok - x) / (rule.ok - rule.bad)) * rule.max;
  }
  const score = (act, m) => Math.round(Math.max(0, 100 - act.rules.reduce((s, r) => s + penalty(r, m), 0)));

  function ruleText(rule) {
    const fmt = x => rule.v === "r" ? fmtR(x) : fmtT(x);
    return t(rule.kind === "above" ? "rule.above" : "rule.below", { what: t("rule." + rule.v), ok: fmt(rule.ok), max: rule.max, bad: fmt(rule.bad) });
  }

  function reasonSentence(act, m, sc) {
    const pens = act.rules.map(r => ({ r, p: penalty(r, m) })).filter(x => x.p >= 6).sort((a, b) => b.p - a.p);
    if (!pens.length) return t("trip.nothing");
    const names = pens.slice(0, 2).map(x => L(x.r.short)).join(` ${t("trip.and")} `);
    return `${t(sc >= 60 ? "trip.mostly" : "trip.held", { names })} <b>${t("trip.tip")}</b> ${L(pens[0].r.tip)}`;
  }

  // ---- page ----
  function wire() {
    wired = true;
    $("trip-year").innerHTML = Array.from({ length: 6 }, (_, i) => THIS_YEAR + i)
      .map(y => `<option value="${y}">${y}</option>`).join("");
    $("trip-place").addEventListener("change", e => { C.state.place = e.target.value; render(C); });
    $("trip-year").addEventListener("change", e => { ts.year = +e.target.value; render(C); });
    $("trip-activity").addEventListener("click", e => {
      const b = e.target.closest("button[data-k]");
      if (!b) return;
      ts.activity = b.dataset.k;
      render(C);
    });
  }
  // labels that depend on the language: rebuilt on every render
  function relabel() {
    MONTHS = I18N.months(); SHORT = I18N.monthsShort();
    $("trip-place").innerHTML = Object.keys(C.D.places)
      .map(k => `<option value="${k}">${C.D.places[k].name}</option>`).join("");
    $("trip-activity").innerHTML = ACTIVITY_KEYS.map(k =>
      `<button type="button" role="tab" data-k="${k}">${actIcon(k)}<span>${actName(ACTIVITIES[k])}</span></button>`).join("");
  }

  function render(ctx) {
    C = ctx;
    if (!wired) wire();
    relabel();
    $("trip-place").value = C.state.place;
    $("trip-year").value = String(ts.year);
    $("trip-activity").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.k === ts.activity)));
    renderResults();
  }

  function renderResults() {
    const placeKey = C.state.place, P = C.D.places[placeKey], act = ACTIVITIES[ts.activity];
    const snaps = MONTHS.map((_, i) => snapshot(placeKey, i, ts.year));
    const scores = snaps.map(s => score(act, s.m));
    const best = scores.indexOf(Math.max(...scores));
    if (!ts.picked) ts.month = best;
    const m = ts.month, snap = snaps[m], sc = scores[m], band = bandOf(sc);
    const order = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    const top = order.slice(0, 3).map(([, i]) => SHORT[i]).join(", ");
    const worst = order[order.length - 1];

    let html = `<div class="ok"><b>${t("trip.best", { act: actLow(act), place: P.name, top })}</b> ${t("trip.scores", { a: order[0][0], b: order[2][0] })}
      ${t("trip.lowest", { month: cap(MONTHS[worst[1]]), s: worst[0] })} <span class="muted">${t("trip.basedOn", { year: ts.year })}</span></div>`;
    if (ts.activity === "beach" && !P.tide) {
      html += `<div class="warn">${t("trip.inland", { place: P.name })}</div>`;
    }
    html += `<h2>${t("trip.howGood", { act: actLow(act) })}</h2>
      <p class="muted small">${L(act.about)} ${t("trip.barHelp")}</p>
      <div id="trip-bars" class="chart trip-bars"></div>
      <div id="trip-months" class="seg months" role="tablist" aria-label="${t("trip.month")}">${MONTHS.map((_, i) =>
        `<button type="button" role="tab" data-m="${i}" aria-selected="${i === m}">${SHORT[i]} <span class="muted">${scores[i]}</span></button>`).join("")}</div>
      <div id="trip-detail">${detailHTML(placeKey, P, act, snap, sc, band, m)}</div>
      <hr>
      <h2 id="trip-trend-title">${cap(t("trip.isChanging", { month: MONTHS[m], place: P.name }))}</h2>
      <p class="lead small">${t("trip.restOn")}</p>
      ${trendHTML(placeKey, snap, m)}
      <div id="trip-trend-detail"></div>
      ${howHTML()}`;
    $("trip-results").innerHTML = html;

    // events
    $("trip-months").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      ts.month = +b.dataset.m; ts.picked = true;
      renderResults();
      const sel = $("trip-months").querySelector("[aria-selected=true]");
      if (sel) sel.focus({ preventScroll: true });
    }));
    $("trip-results").querySelectorAll("button[data-var]").forEach(b => b.addEventListener("click", () => {
      ts.chartVar = b.dataset.var;
      renderTrendDetail(placeKey, snap, m);
      $("trip-trend-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }));

    // bar chart of the 12 scores
    const el = $("trip-bars");
    Plotly.react(el, [{
      type: "bar", x: SHORT, y: scores,
      marker: { color: scores.map((s, i) => i === m ? bandOf(s).color : bandOf(s).color + "B3"),
        line: { color: "#F1F5F9", width: scores.map((_, i) => i === m ? 2 : 0) } },
      textfont: { color: "#CBD5E1" },
      customdata: snaps.map((s, i) => [bandOf(scores[i]).word, t("trip.hover", { t: fmtT(s.m.t), d: fmtT(s.m.d), r: fmtR(s.m.r) })]),
      hovertemplate: "<b>%{x}: %{y}</b> (%{customdata[0]})<br>%{customdata[1]}<extra></extra>",
      text: scores.map(String), textposition: "outside", cliponaxis: false,
    }], {
      ...C.chartLayout(t("trip.score"), window.innerWidth < 560 ? 300 : 340),
      yaxis: { title: { text: t("trip.score"), font: { color: C.THEME.muted } }, range: [0, 112], gridcolor: C.THEME.grid, zeroline: false, fixedrange: true, tickfont: { color: C.THEME.muted } },
      xaxis: { showgrid: false, fixedrange: true, linecolor: C.THEME.grid, tickfont: { color: C.THEME.muted } }, hovermode: "closest", showlegend: false,
    }, C.PLOT_CONFIG);
    if (el.removeAllListeners) el.removeAllListeners("plotly_click");
    el.on("plotly_click", ev => {
      ts.month = ev.points[0].pointIndex; ts.picked = true;
      renderResults();
    });

    renderTrendDetail(placeKey, snap, m);
  }

  function detailHTML(placeKey, P, act, snap, sc, band, m) {
    const { T, D, R } = snap;
    let html = `<div class="verdict" style="--c:${band.color}"><div class="h">${t("trip.verdictH", { month: cap(MONTHS[m]), place: P.name, band: band.word, act: actLow(act), s: sc })}</div>
      <div class="t">${reasonSentence(act, snap.m, sc)}</div></div>
      <div class="metrics">
        <div class="metric"><div class="l">${t("trip.typTemp")}</div><div class="v">${fmtT(T.expected)}</div>
          <div class="r">${t("trip.8in10", { lo: fmtT(T.lo, false), hi: fmtT(T.hi) })}</div></div>
        <div class="metric"><div class="l">${t("trip.feels")}</div><div class="v">${muggyWord(D.expected)}</div>
          <div class="r">${t("trip.dewRange", { d: fmtT(D.expected), lo: fmtT(D.lo, false), hi: fmtT(D.hi) })}</div></div>
        <div class="metric"><div class="l">${t("trip.rainMonth")}</div><div class="v">${fmtR(R.expected)}</div>
          <div class="r">${t("trip.8in10", { lo: fmtR(Math.max(0, R.lo), false), hi: fmtR(R.hi) })}</div></div>
      </div>
      <p class="muted small">${t("trip.expectNote", { month: MONTHS[m], year: ts.year })}</p>`;
    if (D.expected >= HEAT_DEW_C && T.expected >= HEAT_TEMP_C) {
      html += `<div class="warn">${t("trip.heat")}</div>`;
    }
    if (ts.activity === "beach" && P.tide && C.hasData("sea_level", placeKey)) {
      const r = C.analysis(C.seriesKey("sea_level", placeKey), "sea_level");
      if (r && r.verdict === "significant" && r.direction === "up") {
        html += `<div class="info">${t("trip.sea", { name: C.D.stations[P.tide].name, x: C.signed(r.senPerDecade, C.unitOf("sea_level")), sure: C.VERDICT.significant.sure })}</div>`;
      }
    }
    if (m >= 5 && m <= 10) {
      html += `<div class="info">${t("trip.hurricane")}</div>`;
    }
    return html;
  }

  const wordFor = (r, V) => {
    const w = r.direction === "up" ? V.up_short : V.down_short;
    return r.verdict === "significant" ? w : r.verdict === "possible" ? t("maybe", { word: w.toLowerCase() }) : t("noClear");
  };

  function trendHTML(placeKey, snap, m) {
    const cards = [["temperature", snap.T], ["humidity", snap.D], ["rainfall", snap.R]].map(([k, st]) => {
      const V = C.D.variables[k], v = C.VERDICT[st.r.verdict];
      return `<div class="card" style="--c:${v.color}"><div class="q">${window.Icon ? Icon(TOPIC_ICON[k]) : ""}${cap(t("trip.every", { month: MONTHS[m], name: V.name.toLowerCase() }))}</div>
        <div class="a">${wordFor(st.r, V)}</div>
        <div class="n">${t("every10", { x: C.signed(dispDelta(k, st.r.senPerDecade), deltaUnit(k)) })}</div>
        <div class="s sure">${C.meter(v)}<span>${t("card.howSure")} <b>${v.sure}</b></span></div>
        <button type="button" data-var="${k}"><span>${t("trip.showChart")}</span>${Icon("arrow")}</button></div>`;
    }).join("");
    return `<div class="cards trip-cards">${cards}</div>`;
  }

  function renderTrendDetail(placeKey, snap, m) {
    const k = ts.chartVar, V = C.D.variables[k], st = k === "temperature" ? snap.T : k === "humidity" ? snap.D : snap.R;
    const r = st.r, v = C.VERDICT[r.verdict], P = C.D.places[placeKey];
    const what = t(k === "rainfall" ? "trip.what.rain" : k === "humidity" ? "trip.what.dew" : "trip.what.temp");
    const absUnit = k === "rainfall" ? (US() ? t("unit.in") : "mm") : (US() ? "°F" : "°C");
    const trendY = r.senLine.map(x => dispAbs(k, x + r.climMean));
    const xs = st.vals.map(p => `${p.year}-07-01`);
    $("trip-trend-detail").innerHTML = `
      <div class="chart" id="trip-trend-chart"></div>
      <p class="muted small">${t("trip.chartCap", { month: MONTHS[m], what, place: P.name, year: ts.year })}</p>
      <div class="${r.verdict === "significant" ? "ok" : "info"}">${r.verdict === "significant"
        ? t("trip.clear", { month: MONTHS[m], sure: v.sure, p: Stats.formatP(r.mkP), year: ts.year })
        : t("trip.unclear", { month: MONTHS[m], sure: v.sure.toLowerCase(), p: Stats.formatP(r.mkP), n: RECENT_YEARS })}
        ${t("trip.thenNow", { n: RECENT_YEARS, a: fmtV(k, st.early), b: fmtV(k, st.recent) })}</div>
      <a class="dl" id="trip-evidence" href="#area">${t("trip.yearRound", { place: P.name })}</a>`;
    $("trip-evidence").addEventListener("click", () => { C.state.topic = k; });

    const layout = C.chartLayout(`${cap(t("trip.every", { month: MONTHS[m], name: what }))} (${absUnit})`, window.innerWidth < 560 ? 320 : 380);
    Plotly.react("trip-trend-chart", [
      { x: xs, y: st.vals.map(p => dispAbs(k, p.v)), mode: "lines+markers", name: t("trip.eachMonth", { month: MONTHS[m] }), line: { color: C.THEME.yearLine, width: 1.5 },
        marker: { size: 6, color: C.THEME.yearDot }, hovertemplate: `%{y:.1f} ${absUnit}<extra></extra>`, xhoverformat: "%Y" },
      { x: xs, y: trendY, mode: "lines", name: t("chart.trend"), line: { color: v.color, width: 3.5, dash: v.dash }, hoverinfo: "skip" },
      { x: [`${ts.year}-07-01`], y: [dispAbs(k, st.expected)], mode: "markers", name: t("trip.expected", { year: ts.year }),
        marker: { symbol: "star", size: 16, color: C.THEME.b, line: { color: C.THEME.bg, width: 1 } },
        error_y: { type: "data", symmetric: false, array: [dispAbs(k, st.hi) - dispAbs(k, st.expected)],
          arrayminus: [dispAbs(k, st.expected) - dispAbs(k, st.lo)], color: C.THEME.b, thickness: 2, width: 6 },
        hovertemplate: `${t("trip.expectedHover")}: %{y:.1f} ${absUnit}<extra></extra>` },
    ], layout, C.PLOT_CONFIG);
  }

  function howHTML() {
    const rows = ACTIVITY_KEYS.map(k => {
      const a = ACTIVITIES[k];
      return `<tr><td><b>${actName(a)}</b></td><td><ul class="tight">${a.rules.map(r =>
        `<li>${ruleText(r)}. <span class="muted">${L(r.why)}</span></li>`).join("")}</ul></td></tr>`;
    }).join("");
    return `<hr><h2>${t("trip.howH")}</h2>
      <details><summary>${t("trip.howEst")}</summary><div>
        <ol class="steps">
          <li>${t("trip.e1")}</li><li>${t("trip.e2")}</li><li>${t("trip.e3", { n: RECENT_YEARS })}</li><li>${t("trip.e4")}</li>
        </ol>
        <p class="muted small">${t("trip.dataNote")}</p></div></details>
      <details><summary>${t("trip.howScore")}</summary><div>
        <p>${t("trip.scoreText")}</p>
        <div class="table-scroll"><table><thead><tr><th>${t("trip.activity")}</th><th>${t("trip.costs")}</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="muted small">${t("trip.honest")}</p></div></details>
      <details><summary>${t("trip.cannot")}</summary><div><ul>
        <li>${t("trip.c1")}</li><li>${t("trip.c2")}</li><li>${t("trip.c3")}</li><li>${t("trip.c4")}</li><li>${t("trip.c5")}</li></ul></div></details>`;
  }

  return { render };
})();
