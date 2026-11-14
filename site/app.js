/*
 * app.js - the pages of the static Earth Data Detective site (the version hosted on Vercel).
 * Data comes from data.json (built by build_site_data.py); the math is in stats.js.
 */
(() => {
  const UNITS = {
    temperature: { US: ["°F", v => v * 1.8 + 32], Metric: ["°C", v => v] },
    humidity: { US: ["°F", v => v * 1.8 + 32], Metric: ["°C", v => v] },
    rainfall: { US: [() => t("unit.inyr"), v => v * 365.25 / 25.4], Metric: [() => t("unit.mmyr"), v => v * 365.25] },
    sea_level: { US: [() => t("unit.in"), v => v * 39.37], Metric: ["cm", v => v * 100] },
  };
  const { t, L, cap } = I18N;
  // sure/explain are getters so they always follow the current language
  // level = segments lit on the certainty meter; dash = how the trend line is drawn (never colour alone)
  const verdict = (color, k, level, dash) => ({ color, level, dash,
    get sure() { return t(`v.${k}.sure`); }, get explain() { return t(`v.${k}.explain`); } });
  const VERDICT = { significant: verdict("#22D3EE", "sig", 3, "solid"), possible: verdict("#FBBF24", "pos", 2, "dash"),
    none: verdict("#94A3B8", "none", 1, "dot") };
  const RED_BLUE = [[0, "#3B82F6"], [0.25, "#7DB4FF"], [0.5, "#E2E8F0"], [0.75, "#FB923C"], [1, "#EF4444"]];
  const BROWN_GREEN = [[0, "#B45309"], [0.25, "#F5B142"], [0.5, "#E2E8F0"], [0.75, "#2DD4BF"], [1, "#0D9488"]];
  const PLOT_CONFIG = { displayModeBar: false, responsive: true };
  // chart colours for the dark theme (shared with guide.js and trip.js through ctx)
  const THEME = { text: "#CBD5E1", muted: "#94A3B8", grid: "#1E293B", yearLine: "#475569", yearDot: "#CBD5E1",
    a: "#22D3EE", b: "#F97316", panel: "#0D1320", bg: "#05070C" };
  const meter = v => `<span class="meter" data-level="${v.level}" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let D0, D, TOPICS;
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked: fine */ } },
  };
  const state = {
    units: store.get("units", "US"), place: store.get("place", "miami"), topic: "temperature",
    mapTopic: "temperature", cmpTopic: "temperature", cmpA: "miami", cmpB: "pensacola", years: {},
  };
  const $ = id => document.getElementById(id);
  const cache = new Map();

  // ======================================================================
  // Data helpers
  // ======================================================================
  function seriesKey(varKey, placeKey) {
    const P = D.places[placeKey];
    if (D.variables[varKey].tides) return P.tide && D.series["t_" + P.tide] ? "t_" + P.tide : null;
    return D.series[P.power] && D.series[P.power][varKey] ? P.power : null;
  }
  const hasData = (varKey, placeKey) => seriesKey(varKey, placeKey) !== null;
  const placesFor = varKey => Object.keys(D.places).filter(p => hasData(varKey, p));
  const unitOf = varKey => { const u = UNITS[varKey][state.units][0]; return typeof u === "function" ? u() : u; };

  function points(key, varKey) {
    const e = D.series[key][varKey], [y0, m0] = e.start.split("-").map(Number), f = UNITS[varKey][state.units][1];
    const out = [];
    e.v.forEach((x, i) => {
      if (x === null) return;
      const mm = m0 - 1 + i;
      out.push({ t: i, year: y0 + Math.floor(mm / 12), month: (mm % 12) + 1, v: f(x) });
    });
    return out;
  }
  function yearRange(key, varKey) {
    const p = points(key, varKey);
    return [p[0].year, p[p.length - 1].year];
  }
  function analysis(key, varKey, y0 = -Infinity, y1 = Infinity) {
    const ck = [key, varKey, state.units, y0, y1].join("|");
    if (!cache.has(ck)) {
      const p = points(key, varKey).filter(x => x.year >= y0 && x.year <= y1);
      cache.set(ck, p.length >= 24 ? Stats.analyze(p) : null);
    }
    return cache.get(ck);
  }

  // ======================================================================
  // Words and numbers
  // ======================================================================
  const nice = Stats.nice;
  const signed = (x, unit) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${nice(Math.abs(x))} ${unit}`;
  const value = (x, unit) => `${Math.abs(x) >= 10 ? x.toFixed(1) : nice(x)} ${unit}`;
  const topicIcon = k => Icon(TOPIC_ICON[k] || "target");
  const topicLabel = k => `${topicIcon(k)}<span>${D.variables[k].name}</span>`;
  const theName = V => V.the || V.name.toLowerCase();

  // Swap in the Spanish / Haitian Creole text for data.json's words (i18n-data.js). Series data is shared, not copied.
  function localizeData(src) {
    if (I18N.lang === "en" || !window.I18N_DATA) return src;
    const X = window.I18N_DATA, out = { ...src, variables: {}, places: {}, causes: {} };
    for (const [k, v] of Object.entries(src.variables)) {
      const tr = X.variables[k] || {};
      out.variables[k] = { ...v };
      for (const f of Object.keys(tr)) out.variables[k][f] = L(tr[f]) || v[f];
    }
    for (const [k, p] of Object.entries(src.places)) {
      const tr = X.places[k];
      out.places[k] = tr ? { ...p, name: L(tr.name), about: L(tr.about) } : p;
    }
    for (const [k, c] of Object.entries(src.causes)) {
      const tr = X.causes[k];
      out.causes[k] = tr ? { ...c, up: L(tr.up) || c.up, down: L(tr.down) || c.down } : c;
    }
    out.glossary = {};
    X.glossary.forEach(([topic, terms]) => {
      out.glossary[L(topic)] = terms.map(([a, b, c]) => [L(a), L(b), L(c)]);
    });
    return out;
  }

  function shortAnswer(r, V) {
    const word = r.direction === "up" ? V.up_short : V.down_short;
    if (r.verdict === "significant") return word;
    if (r.verdict === "possible") return t("maybe", { word: word.toLowerCase() });
    return t("noClear");
  }
  function headline(r, V, placeName) {
    const phrase = (r.direction === "up" ? V.up : V.down).replace("{place}", placeName);
    if (r.verdict === "significant") return cap(phrase) + ".";
    if (r.verdict === "possible") return t("headline.maybe", { phrase });
    return t("headline.none", { name: theName(V), place: placeName });
  }
  function yearly(r) {
    const groups = {};
    r.points.forEach((p, i) => (groups[p.year] = groups[p.year] || []).push(r.anomalies[i]));
    const x = [], y = [];
    for (const yr of Object.keys(groups).sort()) {
      const g = groups[yr];
      if (g.length < 6) continue;
      x.push(`${yr}-07-01`);
      y.push(g.reduce((s, v) => s + v, 0) / g.length + r.climMean);
    }
    return { x, y };
  }
  const dateOf = p => `${p.year}-${String(p.month).padStart(2, "0")}-01`;
  const trendLine = r => ({ x: r.points.map(dateOf), y: r.senLine.map(v => v + r.climMean) });

  function chartLayout(yTitle, height) {
    const small = window.innerWidth < 560;
    return {
      height, margin: { l: small ? 52 : 64, r: 16, t: 44, b: 40 }, plot_bgcolor: "rgba(0,0,0,0)", paper_bgcolor: "rgba(0,0,0,0)",
      font: { family: "'Atkinson Hyperlegible Next', system-ui, sans-serif", size: small ? 12 : 13, color: THEME.text },
      yaxis: { title: { text: yTitle, font: { color: THEME.muted } }, gridcolor: THEME.grid, zeroline: false, linecolor: THEME.grid, tickfont: { color: THEME.muted } },
      xaxis: { showgrid: false, linecolor: THEME.grid, tickfont: { color: THEME.muted } }, hovermode: "x unified",
      hoverlabel: { bgcolor: THEME.panel, bordercolor: "#2B3A52", font: { color: "#F1F5F9", family: "'Atkinson Hyperlegible Next', system-ui, sans-serif" } },
      legend: { orientation: "h", y: 1.14, x: 0, font: { color: THEME.text } },
    };
  }
  const chartHeight = () => (window.innerWidth < 560 ? 320 : 380);
  // the yearly-average dots, the same everywhere
  const yearTrace = (yr, name, unit) => ({ x: yr.x, y: yr.y, mode: "lines+markers", name, line: { color: THEME.yearLine, width: 1.5 },
    marker: { size: 6, color: THEME.yearDot }, hovertemplate: `%{y:.2f} ${unit}<extra></extra>`, xhoverformat: "%Y" });

  const MAP_STYLE = "carto-darkmatter-nolabels";   // our own labels carry the names; basemap labels collided with the dots
  function smallMap(div, pts, height) {
    Plotly.react(div, [
      { type: "scattermap", lat: pts.map(p => p[1]), lon: pts.map(p => p[2]), mode: "markers", hoverinfo: "skip",
        marker: { size: 34, color: "rgba(34,211,238,0.18)" } },
      { type: "scattermap", lat: pts.map(p => p[1]), lon: pts.map(p => p[2]), text: pts.map(p => p[0]),
        mode: "markers+text", textposition: "top right", hoverinfo: "text", textfont: { color: "#F1F5F9", size: 13 },
        marker: { size: 13, color: THEME.a } },
    ], {
      map: { style: MAP_STYLE, zoom: window.innerWidth < 560 ? 5.2 : 5.8, center: { lat: pts[0][1], lon: pts[0][2] } },
      height, margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false, paper_bgcolor: THEME.bg,
    }, PLOT_CONFIG);
  }

  // figures roll from their last value to the new one when the place changes (a launch-readout touch)
  const lastFig = new Map();
  function rollFigures(root) {
    root.querySelectorAll("[data-roll]").forEach(el => {
      const to = +el.dataset.roll, key = el.dataset.key, unit = el.dataset.unit, from = lastFig.has(key) ? lastFig.get(key) : 0;
      lastFig.set(key, to);
      const paint = x => { el.innerHTML = figHTML(x, unit); };
      if (REDUCED || from === to) return paint(to);
      const t0 = performance.now(), dur = 650;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(2, -10 * k);
        paint(k >= 1 ? to : from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  const figHTML = (x, unit) => {
    const s = signed(x, unit), i = s.lastIndexOf(" " + unit);
    return i > 0 ? `${s.slice(0, i)}<span class="u">${unit}</span>` : s;
  };

  function segmented(el, options, selected, onPick) {
    el.innerHTML = options.map(k =>
      `<button type="button" role="tab" data-k="${k}" aria-selected="${k === selected}">${topicLabel(k)}</button>`).join("");
    el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => onPick(b.dataset.k)));
  }
  const fillSelect = (el, keys, selected) => {
    el.innerHTML = keys.map(k => `<option value="${k}"${k === selected ? " selected" : ""}>${D.places[k].name}</option>`).join("");
  };

  // ======================================================================
  // PAGE: My area
  // ======================================================================
  function renderArea() {
    const P = D.places[state.place];
    $("place").value = state.place;
    $("place-about").textContent = P.about;
    smallMap($("place-map"), [[P.name, P.lat, P.lon]], window.innerWidth <= 760 ? 160 : window.innerWidth < 900 ? 200 : 230);
    $("cards-title").textContent = t("area.cardsTitle", { place: P.name });
    $("cards").innerHTML = TOPICS.map(k => cardHTML(k, state.place)).join("");
    $("cards").querySelectorAll(".card").forEach((c, i) => c.style.setProperty("--i", i));
    rollFigures($("cards"));
    $("cards").querySelectorAll("button[data-topic]").forEach(b => b.addEventListener("click", () => {
      state.topic = b.dataset.topic;
      renderEvidence();
      $("evidence").scrollIntoView({ behavior: "smooth" });
    }));
    renderEvidence();
  }

  function cardHTML(varKey, placeKey) {
    const V = D.variables[varKey];
    if (!hasData(varKey, placeKey)) {
      return `<div class="card off"><div class="q">${topicIcon(varKey)}<span>${V.question}</span></div>
        <div class="fig">${t("card.notMeasured")}</div>
        <div class="s">${t("card.inland")}</div></div>`;
    }
    const r = analysis(seriesKey(varKey, placeKey), varKey), v = VERDICT[r.verdict], unit = unitOf(varKey);
    return `<div class="card" style="--c:${v.color}"><div class="q">${topicIcon(varKey)}<span>${V.question}</span></div>
      <div class="fig" data-roll="${r.totalChange}" data-unit="${unit}" data-key="${varKey}">${figHTML(r.totalChange, unit)}</div>
      <div class="since">${t("card.since", { change: "", year: r.start.year }).trim()}</div>
      <div class="a">${shortAnswer(r, V)}</div>
      <div class="n">${t("every10", { x: signed(r.senPerDecade, unit) })}</div>
      <div class="s sure">${meter(v)}<span><span class="hs">${t("card.howSure")}</span> <b>${v.sure}</b></span></div>
      <button type="button" class="stretch" data-topic="${varKey}"><span>${t("card.see")}</span>${Icon("arrow")}</button></div>`;
  }

  function renderEvidence() {
    const options = TOPICS.filter(k => hasData(k, state.place));
    if (!options.includes(state.topic)) state.topic = options[0];
    segmented($("topic-tabs"), options, state.topic, k => { state.topic = k; renderEvidence(); });
    renderDetail();
  }

  function renderDetail() {
    const varKey = state.topic, placeKey = state.place, V = D.variables[varKey], P = D.places[placeKey];
    const key = seriesKey(varKey, placeKey), unit = unitOf(varKey);
    const [first, last] = yearRange(key, varKey);
    const yk = varKey + "|" + placeKey;
    let [y0, y1] = state.years[yk] || [first, last];
    const r = analysis(key, varKey, y0, y1);
    const where = V.tides ? t("detail.gauge", { name: D.stations[P.tide].name }) : P.name;
    const source = V.tides ? t("detail.gaugeSource", { name: D.stations[P.tide].name, id: P.tide }) : V.source;
    const opts = sel => Array.from({ length: last - first + 1 }, (_, i) => first + i)
      .map(y => `<option${y === sel ? " selected" : ""}>${y}</option>`).join("");

    let html = `<div class="years">${Icon("cal")}<span>${t("years.label")}</span><div class="select"><select id="y0" aria-label="${t("years.first")}">${opts(y0)}</select></div>
      <span>${t("years.to")}</span><div class="select"><select id="y1" aria-label="${t("years.last")}">${opts(y1)}</select></div>
      ${y0 !== first || y1 !== last ? `<button type="button" id="yall">${t("years.all")}</button>` : ""}</div>
      <p class="muted small">${t("years.hint")}</p>`;

    if (!r) {
      $("detail").innerHTML = html + `<div class="err">${t("years.tooFew")}</div>`;
      bindYears(yk, first, last);
      return;
    }
    const v = VERDICT[r.verdict], ends = trendLine(r).y;
    html += `
      <div class="verdict" style="--c:${v.color}"><div class="h">${headline(r, V, P.name)}</div>
        <div class="t">${t("detail.went", { y0: r.start.year, y1: r.end.year, measure: V.measure.toLowerCase(),
          a: value(ends[0], unit), b: value(ends[ends.length - 1], unit) })}</div></div>
      <div class="metrics">
        <div class="metric"><div class="l">${t("sci.used")}</div><div class="v sm">${t("sci.usedVal", { n: r.nMonths, y0: r.start.year, y1: r.end.year })}</div></div>
        ${y0 !== first || y1 !== last ? `<div class="metric"><div class="l">${t("detail.total", { year: r.start.year })}</div>
          <div class="v">${signed(r.totalChange, unit)}</div><div class="r">${t("every10", { x: signed(r.senPerDecade, unit) })}</div></div>` : ""}
        <div class="metric"><div class="l">${t("detail.howSure")}</div><div class="v" style="color:${v.color}">${meter(v)}${v.sure}</div>
          <div class="r">${v.explain}</div></div>
      </div>
      <div id="detail-chart" class="chart"></div>
      <p class="muted small">${t("detail.caption", { source })}</p>
      <p class="small">${t("detail.readHelp")}</p>`;

    if (r.verdict !== "significant" && r.yearsMore !== null) {
      html += r.yearsMore > 100
        ? `<div class="info">${t("detail.tiny")}</div>`
        : `<div class="info">${t("detail.more", { n: Math.max(1, Math.round(r.yearsMore)) })}</div>`;
    }
    html += `<details><summary>${t("detail.what", { name: theName(V) })}</summary><div>
      <p>${V.definition}</p><p><b>${t("detail.why")}</b> ${V.why}</p>
      <p><b>${t("detail.where")}</b> ${where}<br><b>${t("detail.source")}</b> ${V.source}</p></div></details>`;
    if (r.verdict !== "none" && r.direction !== "flat") {
      const C = D.causes[varKey];
      html += `<details><summary>${t("detail.cause")}</summary><div><p>${C[r.direction]}</p>
        <p class="muted small">${t("detail.causeNote")}</p>
        <p><b>${t("detail.learn")}</b> ${C.sources.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(" · ")}</p>
        </div></details>`;
    }
    const f = Stats.formatP, g = x => (x >= 0 ? "+" : "") + Number(x.toPrecision(3));
    const pd = t("sci.perDecade");
    html += `<details><summary>${t("sci.summary")}</summary><div><div class="table-scroll"><table>
      <thead><tr><th>${t("sci.test")}</th><th>${t("sci.result")}</th><th>${t("sci.tells")}</th></tr></thead><tbody>
      <tr><td><b>${L(I18N_DATA.glossary[1][1][2][0])}</b></td><td>${f(r.mkP)} (tau = ${r.tau.toFixed(2)})</td><td>${t("sci.mk")}</td></tr>
      <tr><td><b>${L(I18N_DATA.glossary[1][1][3][0])}</b></td><td>${g(r.senPerDecade)} ${unit} ${pd}</td><td>${t("sci.sen")}</td></tr>
      <tr><td><b>${t("sci.lin")}</b></td><td>${g(r.slopePerDecade)} ${unit} ${pd}, ${f(r.linearP)}</td><td>${t("sci.linTells")}</td></tr>
      <tr><td><b>${t("sci.ci")}</b></td><td>${g(r.ciLowPerDecade)} ${t("sci.to")} ${g(r.ciHighPerDecade)} ${unit} ${pd}</td><td>${t("sci.ciTells")}</td></tr>
      <tr><td><b>${t("sci.mkc")}</b></td><td>${f(r.mkPCorrected)}</td><td>${t("sci.mkcTells", { lag: r.lag1.toFixed(2), n: Math.round(r.effectiveN) })}</td></tr>
      <tr><td><b>${t("sci.used")}</b></td><td>${t("sci.usedVal", { n: r.nMonths, y0: r.start.year, y1: r.end.year })}</td><td>${t("sci.usedTells")}</td></tr>
      </tbody></table></div>
      <p class="muted small">${t("sci.legend")}</p>
      <a class="dl" id="csv" href="#" download="${varKey}_${placeKey}.csv">${Icon("download")}${t("sci.download", { unit })}</a></div></details>`;

    $("detail").innerHTML = html;
    bindYears(yk, first, last);

    const yr = yearly(r), tl = trendLine(r);
    Plotly.react("detail-chart", [
      yearTrace(yr, t("chart.yearAvg"), unit),
      { x: tl.x, y: tl.y, mode: "lines", name: t("chart.trend"), line: { color: v.color, width: 3.5, dash: v.dash }, hoverinfo: "skip" },
    ], chartLayout(`${V.measure} (${unit})`, chartHeight()), PLOT_CONFIG);

    $("csv").addEventListener("click", e => {
      const rows = ["date,value,difference_from_normal_month,trend"].concat(r.points.map((p, i) =>
        `${p.year}-${String(p.month).padStart(2, "0")},${p.v},${r.anomalies[i]},${tl.y[i]}`));
      e.currentTarget.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    });
  }

  function bindYears(yk, first, last) {
    const update = () => {
      let a = +$("y0").value, b = +$("y1").value;
      if (a > b) [a, b] = [b, a];
      state.years[yk] = [a, b];
      renderDetail();
    };
    $("y0").addEventListener("change", update);
    $("y1").addEventListener("change", update);
    if ($("yall")) $("yall").addEventListener("click", () => { delete state.years[yk]; renderDetail(); });
  }

  // ======================================================================
  // PAGE: Florida map
  // ======================================================================
  function renderMap() {
    segmented($("map-topics"), TOPICS, state.mapTopic, k => { state.mapTopic = k; renderMap(); });
    const varKey = state.mapTopic, V = D.variables[varKey], unit = unitOf(varKey);
    let spots;
    if (V.tides) {
      spots = Object.entries(D.stations).map(([sid, s]) => [s.name, s.lat, s.lon, "t_" + sid]);
      $("map-note").textContent = t("map.seaNote");
    } else {
      spots = D.mapPoints.filter(p => D.series[p.power] && D.series[p.power][varKey])
        .map(p => [`${p.lat.toFixed(1)}°N, ${Math.abs(p.lon).toFixed(1)}°W`, p.lat, p.lon, p.power]);
      $("map-note").textContent = "";
    }
    const results = spots.map(([name, lat, lon, key]) => ({ name, lat, lon, r: analysis(key, varKey) }));
    const sig = results.filter(x => x.r.verdict === "significant"), rest = results.filter(x => x.r.verdict !== "significant");
    const limit = Math.max(...results.map(x => Math.abs(x.r.senPerDecade))) || 1;
    const label = x => (x.r.senPerDecade >= 0 ? "+" : "") + x.r.senPerDecade.toFixed(2);
    const hover = x => `<b>${x.name}</b><br>${t("every10", { x: signed(x.r.senPerDecade, unit) })}<br>${t("card.howSure")} ${VERDICT[x.r.verdict].sure}`;
    const traces = [];
    if (rest.length) traces.push({
      type: "scattermap", name: t("map.noClear"), lat: rest.map(x => x.lat), lon: rest.map(x => x.lon),
      mode: "markers+text", text: rest.map(label), textposition: "middle right", textfont: { size: 11, color: THEME.muted },
      hovertext: rest.map(hover), hoverinfo: "text", marker: { size: 10, color: "#475569" },
    });
    // dots in neighbouring columns put their numbers above / below, so labels in a row never run into each other
    const col = x => Math.round(x.lon * 1.6) % 2 === 0;
    [[sig.filter(col), "top center", true], [sig.filter(x => !col(x)), "bottom center", false]]
      .forEach(([set, pos, first]) => set.length && traces.push({
        type: "scattermap", name: t("map.clear"), showlegend: first, legendgroup: "clear",
        lat: set.map(x => x.lat), lon: set.map(x => x.lon),
        mode: "markers+text", text: set.map(label), textposition: pos, textfont: { size: 12, color: "#F1F5F9" },
        hovertext: set.map(hover), hoverinfo: "text",
        marker: { size: 18, color: set.map(x => x.r.senPerDecade), colorscale: varKey === "rainfall" ? BROWN_GREEN : RED_BLUE,
          cmin: -limit, cmax: limit, showscale: first,
          colorbar: { title: { text: t("map.colorbar", { unit }), font: { color: THEME.text } }, thickness: 12, tickfont: { color: THEME.muted },
            outlinewidth: 0, bgcolor: "rgba(5,7,12,0.7)", x: 0.99, xanchor: "right" } },
      }));
    const small = window.innerWidth < 560;
    Plotly.react("big-map", traces, {
      map: { style: "carto-darkmatter",          // keeps city names so people can find their dot zoom: small ? 4.8 : 5.4, center: { lat: 27.7, lon: -83.6 } },
      height: small ? 440 : window.innerWidth < 900 ? 500 : 620, margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: THEME.bg,
      font: { family: "'Atkinson Hyperlegible Next', system-ui, sans-serif", color: THEME.text },
      legend: { orientation: "h", y: 0.99, x: 0.01, bgcolor: "rgba(5,7,12,0.75)", font: { color: THEME.text } },
      hoverlabel: { bgcolor: THEME.panel, bordercolor: "#2B3A52", font: { color: "#F1F5F9" } },
    }, PLOT_CONFIG);

    let msg;
    if (sig.length) {
      const fast = sig.reduce((a, b) => (Math.abs(b.r.senPerDecade) > Math.abs(a.r.senPerDecade) ? b : a));
      const ups = sig.filter(x => x.r.direction === "up").length;
      const up = V.up_short.toLowerCase(), down = V.down_short.toLowerCase(), sea = !!V.tides;
      msg = t("map.count", { n: sig.length, total: results.length });
      if (ups === sig.length) msg += sea ? t("map.allSeaUp") : t("map.allSame", { word: up });
      else if (ups === 0) msg += sea ? t("map.allSeaDown") : t("map.allSame", { word: down });
      else msg += t("map.mixed", { ups, up, downs: sig.length - ups, down });
      msg += t("map.fastest", { name: fast.name, x: signed(fast.r.senPerDecade, unit) });
      $("map-summary").innerHTML = `<div class="ok">${msg}</div>`;
    } else {
      $("map-summary").innerHTML = `<div class="info">${t("map.none")}</div>`;
    }
  }

  // ======================================================================
  // PAGE: Compare places
  // ======================================================================
  function renderCompare() {
    segmented($("cmp-topics"), TOPICS, state.cmpTopic, k => { state.cmpTopic = k; renderCompare(); });
    const varKey = state.cmpTopic, V = D.variables[varKey], unit = unitOf(varKey), opts = placesFor(varKey);
    if (!opts.includes(state.cmpA)) state.cmpA = opts[0];
    if (!opts.includes(state.cmpB)) state.cmpB = opts.includes("pensacola") ? "pensacola" : opts[opts.length - 1];
    fillSelect($("cmp-a"), opts, state.cmpA);
    fillSelect($("cmp-b"), opts, state.cmpB);
    $("cmp-note").textContent = V.tides ? t("cmp.coast") : "";
    const pa = state.cmpA, pb = state.cmpB;
    if (pa === pb) {
      $("cmp-cards").innerHTML = `<div class="err">${t("cmp.same")}</div>`;
      $("cmp-summary").innerHTML = $("cmp-caption").textContent = "";
      Plotly.purge("cmp-chart");
      $("cmp-chart").hidden = true;
      return;
    }
    $("cmp-chart").hidden = false;
    const ka = seriesKey(varKey, pa), kb = seriesKey(varKey, pb);
    const [a0, a1] = yearRange(ka, varKey), [b0, b1] = yearRange(kb, varKey);
    const first = Math.max(a0, b0), last = Math.min(a1, b1);
    const ra = analysis(ka, varKey, first, last), rb = analysis(kb, varKey, first, last);

    $("cmp-cards").innerHTML = [[ra, pa, "a"], [rb, pb, "b"]].map(([r, k, side]) => {
      const v = VERDICT[r.verdict];
      return `<div class="card" style="--c:${v.color}"><div class="q"><i class="swatch ${side}" aria-hidden="true"></i><span>${D.places[k].name}</span></div>
        <div class="fig">${figHTML(r.senPerDecade, unit)}</div>
        <div class="a">${shortAnswer(r, V)}</div><div class="n">${t("every10", { x: signed(r.senPerDecade, unit) })}</div>
        <div class="s sure">${meter(v)}<span>${t("card.howSure")} <b>${v.sure}</b></span></div></div>`;
    }).join("");

    const traces = [];
    [[ra, pa, THEME.a], [rb, pb, THEME.b]].forEach(([r, k, color]) => {
      const yr = yearly(r), tl = trendLine(r), v = VERDICT[r.verdict];
      traces.push({ x: yr.x, y: yr.y, mode: "lines+markers", name: D.places[k].name, opacity: 0.5,
        line: { color, width: 1 }, marker: { size: 5, color }, hovertemplate: `%{y:.2f} ${unit}`, xhoverformat: "%Y" });
      traces.push({ x: tl.x, y: tl.y, mode: "lines", name: t("cmp.trend", { name: D.places[k].name }), line: { color, width: 3.5, dash: v.dash }, hoverinfo: "skip" });
    });
    Plotly.react("cmp-chart", traces, chartLayout(`${V.measure} (${unit})`, window.innerWidth < 560 ? 340 : 420), PLOT_CONFIG);
    $("cmp-caption").textContent = t("cmp.caption", { y0: first, y1: last });

    const faster = Math.abs(ra.senPerDecade) > Math.abs(rb.senPerDecade) ? pa : pb;
    let note = "";
    if (ra.direction !== rb.direction && ra.direction !== "flat" && rb.direction !== "flat") {
      note = ra.verdict === "significant" && rb.verdict === "significant" ? t("cmp.opposite") : t("cmp.oppositeMaybe");
    } else if (ra.verdict === "significant" && rb.verdict === "significant") {
      note = t("cmp.faster", { name: D.places[faster].name });
    }
    $("cmp-summary").innerHTML = note ? `<div class="info">${note}</div>` : "";
  }

  // ======================================================================
  // PAGE: How it works (dictionary)
  // ======================================================================
  function renderGlossary() {
    const q = $("glossary-search").value.trim().toLowerCase();
    let html = "", found = 0;
    for (const [topic, terms] of Object.entries(D.glossary)) {
      const m = terms.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
      if (!m.length) continue;
      html += `<div class="gl-topic">${topic}</div>`;
      for (const [term, meaning, example] of m) {
        found++;
        html += `<details${q ? " open" : ""}><summary>${term}</summary><div><p>${meaning}</p>
          <p class="muted small">${t("gl.example")} ${example}</p></div></details>`;
      }
    }
    $("glossary").innerHTML = found ? html : `<div class="info">${t("gl.none")}</div>`;
  }

  // ======================================================================
  // Navigation and start-up
  // ======================================================================
  // "Plan a trip" lives in trip.js; it gets the helpers it needs through this object
  const ctx = () => ({ D, state, seriesKey, hasData, analysis, unitOf, signed, VERDICT, PLOT_CONFIG, chartLayout, yearly, trendLine, go,
    THEME, meter, yearTrace });
  const renderTrip = () => window.TripPlanner && window.TripPlanner.render(ctx());
  const renderGuide = () => window.Guide && window.Guide.render(ctx());
  const PAGES = { area: renderArea, guide: renderGuide, map: renderMap, compare: renderCompare, trip: renderTrip, how: renderGlossary };
  // jump to a page with some choices already made (used by the guide's practice missions)
  function go(page, changes) {
    Object.assign(state, changes || {});
    if (changes && changes.place) store.set("place", changes.place);
    if (location.hash === "#" + page) show(); else location.hash = page;
    window.scrollTo(0, 0);
  }
  function currentPage() {
    const p = location.hash.replace("#", "");
    return PAGES[p] ? p : "area";
  }
  let shownPage = null;
  function show() {
    const page = currentPage();
    for (const p of Object.keys(PAGES)) $("page-" + p).hidden = p !== page;
    if (page !== shownPage && !REDUCED) {       // the entrance plays once per page visit, not on every re-render
      const el = $("page-" + page);
      el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter");
      clearTimeout(show.timer); show.timer = setTimeout(() => el.classList.remove("enter"), 1100);
    }
    shownPage = page;
    document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + page));
    PAGES[page]();
  }
  function setUnits(u) {
    state.units = u;
    store.set("units", u);
    document.querySelectorAll("button[data-units]").forEach(b => b.classList.toggle("on", b.dataset.units === u));
  }

  async function start() {
    I18N.setLang(I18N.initial(), true);
    try {
      D0 = await (await fetch("data.json")).json();
    } catch (e) {
      $("loading").textContent = t("loadError");
      return;
    }
    D = localizeData(D0);
    TOPICS = Object.keys(D.variables);
    if (!D.places[state.place]) state.place = "miami";
    $("loading").remove();

    fillSelect($("place"), Object.keys(D.places), state.place);
    $("place").addEventListener("change", e => { state.place = e.target.value; store.set("place", state.place); renderArea(); });
    $("cmp-a").addEventListener("change", e => { state.cmpA = e.target.value; renderCompare(); });
    $("cmp-b").addEventListener("change", e => { state.cmpB = e.target.value; renderCompare(); });
    $("glossary-search").addEventListener("input", renderGlossary);
    document.querySelectorAll("button[data-units]").forEach(b => b.addEventListener("click", () => { setUnits(b.dataset.units); show(); }));
    document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => I18N.setLang(b.dataset.lang)));
    I18N.onChange(() => {
      D = localizeData(D0);
      const keep = state.place;
      fillSelect($("place"), Object.keys(D.places), keep);
      show();
    });
    window.addEventListener("hashchange", () => { show(); window.scrollTo(0, 0); });

    setUnits(state.units === "Metric" ? "Metric" : "US");
    show();
  }
  start();
})();
