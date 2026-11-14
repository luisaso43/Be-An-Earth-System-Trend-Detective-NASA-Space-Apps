/*
 * app.js - the pages of the static Earth Data Detective site (the version hosted on Vercel).
 * Data comes from data.json (built by build_site_data.py); the math is in stats.js.
 */
(() => {
  const UNITS = {
    temperature: { US: ["°F", v => v * 1.8 + 32], Metric: ["°C", v => v] },
    humidity: { US: ["°F", v => v * 1.8 + 32], Metric: ["°C", v => v] },
    rainfall: { US: ["in/yr", v => v * 365.25 / 25.4], Metric: ["mm/yr", v => v * 365.25] },
    sea_level: { US: ["in", v => v * 39.37], Metric: ["cm", v => v * 100] },
  };
  const VERDICT = {
    significant: { color: "#1F6FB2", sure: "Very sure", explain: "A change this steady would happen by luck less than 5% of the time." },
    possible: { color: "#C98A00", sure: "Not sure yet", explain: "There is a hint of a change, but random ups and downs could still explain it." },
    none: { color: "#8A94A3", sure: "No real evidence", explain: "The ups and downs look random: no steady change." },
  };
  const RED_BLUE = [[0, "#2166ac"], [0.25, "#67a9cf"], [0.5, "#f7f7f7"], [0.75, "#ef8a62"], [1, "#b2182b"]];
  const BROWN_GREEN = [[0, "#8c510a"], [0.25, "#d8b365"], [0.5, "#f5f5f5"], [0.75, "#5ab4ac"], [1, "#01665e"]];
  const PLOT_CONFIG = { displayModeBar: false, responsive: true };

  let D, TOPICS;
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
  const unitOf = varKey => UNITS[varKey][state.units][0];

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
  const topicLabel = k => `${D.variables[k].emoji} ${D.variables[k].name}`;

  function shortAnswer(r, V) {
    const word = r.direction === "up" ? V.up_short : V.down_short;
    if (r.verdict === "significant") return word;
    if (r.verdict === "possible") return "Maybe " + word.toLowerCase();
    return "No clear change";
  }
  function headline(r, V, placeName) {
    const phrase = (r.direction === "up" ? V.up : V.down).replace("{place}", placeName);
    if (r.verdict === "significant") return phrase[0].toUpperCase() + phrase.slice(1) + ".";
    if (r.verdict === "possible") return `Maybe: there are hints that ${phrase}, but it is not proven yet.`;
    return `No clear change in ${V.name.toLowerCase()} at ${placeName}.`;
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
    return {
      height, margin: { l: 60, r: 16, t: 36, b: 40 }, plot_bgcolor: "#fff", paper_bgcolor: "#fff",
      font: { family: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", size: 13, color: "#2D3748" },
      yaxis: { title: { text: yTitle }, gridcolor: "#E5E9EF", zeroline: false },
      xaxis: { showgrid: false }, hovermode: "x unified",
      legend: { orientation: "h", y: 1.12, x: 0 },
    };
  }
  const chartHeight = () => (window.innerWidth < 560 ? 320 : 380);

  function smallMap(div, pts, height) {
    Plotly.react(div, [{
      type: "scattermap", lat: pts.map(p => p[1]), lon: pts.map(p => p[2]), text: pts.map(p => p[0]),
      mode: "markers+text", textposition: "top right", hoverinfo: "text", marker: { size: 15, color: "#E76F51" },
    }], {
      map: { style: "open-street-map", zoom: window.innerWidth < 560 ? 5.2 : 5.8, center: { lat: pts[0][1], lon: pts[0][2] } },
      height, margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false,
    }, PLOT_CONFIG);
  }

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
    smallMap($("place-map"), [[P.name, P.lat, P.lon]], 200);
    $("cards-title").textContent = `The quick answers for ${P.name}`;
    $("cards").innerHTML = TOPICS.map(k => cardHTML(k, state.place)).join("");
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
      return `<div class="card" style="--c:#CBD2DB"><div class="q">${V.emoji} ${V.question}</div>
        <div class="a sm">Not measured here</div>
        <div class="s">No tide gauge: this place is inland. Pick a coastal place.</div></div>`;
    }
    const r = analysis(seriesKey(varKey, placeKey), varKey), v = VERDICT[r.verdict];
    return `<div class="card" style="--c:${v.color}"><div class="q">${V.emoji} ${V.question}</div>
      <div class="a">${shortAnswer(r, V)}</div>
      <div class="n">${signed(r.totalChange, unitOf(varKey))} since ${r.start.year}</div>
      <div class="s">How sure: <b>${v.sure}</b></div>
      <button type="button" data-topic="${varKey}">See the evidence</button></div>`;
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
    const where = V.tides ? `${D.stations[P.tide].name} tide gauge` : P.name;
    const source = V.tides ? `NOAA tide gauge at ${D.stations[P.tide].name} (station ${P.tide})` : V.source;
    const opts = sel => Array.from({ length: last - first + 1 }, (_, i) => first + i)
      .map(y => `<option${y === sel ? " selected" : ""}>${y}</option>`).join("");

    let html = `<div class="years"><span>📅 Years:</span><select id="y0" aria-label="First year">${opts(y0)}</select>
      <span>to</span><select id="y1" aria-label="Last year">${opts(y1)}</select>
      ${y0 !== first || y1 !== last ? '<button type="button" id="yall">All years</button>' : ""}</div>
      <p class="muted small">Short periods often can't prove a trend: try shrinking the range and watch the answer change.</p>`;

    if (!r) {
      $("detail").innerHTML = html + `<div class="err">Please choose at least 2 years.</div>`;
      bindYears(yk, first, last);
      return;
    }
    const v = VERDICT[r.verdict], ends = trendLine(r).y;
    html += `
      <div class="verdict" style="--c:${v.color}"><div class="h">${headline(r, V, P.name)}</div>
        <div class="t">From ${r.start.year} to ${r.end.year}, the trend for ${V.measure.toLowerCase()} went from about
        <b>${value(ends[0], unit)}</b> to about <b>${value(ends[ends.length - 1], unit)}</b>.</div></div>
      <div class="metrics">
        <div class="metric"><div class="l">Total change since ${r.start.year}</div><div class="v">${signed(r.totalChange, unit)}</div></div>
        <div class="metric"><div class="l">Change every 10 years</div><div class="v">${signed(r.senPerDecade, unit)}</div></div>
        <div class="metric" title="${v.explain}"><div class="l">How sure are we?</div><div class="v" style="color:${v.color}">${v.sure}</div></div>
      </div>
      <p class="muted small">${v.explain}</p>
      <div id="detail-chart" class="chart"></div>
      <p class="muted small">Each dot is one year. The thick line is the steady trend. Data: ${source}.</p>`;

    if (r.verdict !== "significant" && r.yearsMore !== null) {
      html += r.yearsMore > 100
        ? `<div class="info">⏳ The change is tiny compared with the random ups and downs, so there may be no real trend here.</div>`
        : `<div class="info">⏳ If it keeps changing at this speed, about <b>${Math.max(1, Math.round(r.yearsMore))} more year(s)</b> of measurements could prove it. (A rough estimate.)</div>`;
    }
    html += `<details><summary>❓ What is ${V.name.toLowerCase()} and why does it matter?</summary><div>
      <p>${V.definition}</p><p><b>Why it matters:</b> ${V.why}</p>
      <p><b>Measured at:</b> ${where}<br><b>Source:</b> ${V.source}</p></div></details>`;
    if (r.verdict !== "none" && r.direction !== "flat") {
      const C = D.causes[varKey];
      html += `<details><summary>🤔 Why might this be happening?</summary><div><p>${C[r.direction]}</p>
        <p class="muted small">These are possible causes, not proof. A trend shows that something changed, not why.</p>
        <p><b>Learn more:</b> ${C.sources.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(" · ")}</p>
        </div></details>`;
    }
    const f = Stats.formatP, g = x => (x >= 0 ? "+" : "") + Number(x.toPrecision(3));
    html += `<details><summary>🔬 The science details (for experts)</summary><div><div class="table-scroll"><table>
      <thead><tr><th>Test</th><th>Result</th><th>What it tells us</th></tr></thead><tbody>
      <tr><td><b>Mann-Kendall test</b></td><td>${f(r.mkP)} (tau = ${r.tau.toFixed(2)})</td><td>Are later months higher (or lower) than earlier ones more often than chance? Sets the answer.</td></tr>
      <tr><td><b>Sen's slope</b></td><td>${g(r.senPerDecade)} ${unit} per decade</td><td>The typical rate of change. Outliers barely affect it.</td></tr>
      <tr><td><b>Linear regression (t-test)</b></td><td>${g(r.slopePerDecade)} ${unit} per decade, ${f(r.linearP)}</td><td>Best-fit straight line and a test of its slope.</td></tr>
      <tr><td><b>95% confidence interval</b></td><td>${g(r.ciLowPerDecade)} to ${g(r.ciHighPerDecade)} ${unit} per decade</td><td>The true rate is very likely in this range.</td></tr>
      <tr><td><b>Corrected Mann-Kendall</b></td><td>${f(r.mkPCorrected)}</td><td>Stricter version for neighboring months being similar (autocorrelation ${r.lag1.toFixed(2)}, about ${Math.round(r.effectiveN)} independent months).</td></tr>
      <tr><td><b>Data used</b></td><td>${r.nMonths} months, ${r.start.year} to ${r.end.year}</td><td>Seasons removed: each month is compared with the average for that calendar month.</td></tr>
      </tbody></table></div>
      <p class="muted small">Very sure = p &lt; 0.05 · Not sure yet = 0.05 to 0.25 · No real evidence = above 0.25.</p>
      <a class="dl" id="csv" href="#" download="${varKey}_${placeKey}.csv">⬇️ Download this data (${unit}, CSV)</a></div></details>`;

    $("detail").innerHTML = html;
    bindYears(yk, first, last);

    const yr = yearly(r), tl = trendLine(r);
    Plotly.react("detail-chart", [
      { x: yr.x, y: yr.y, mode: "lines+markers", name: "Each year's average", line: { color: "#A0AEC0", width: 1.5 },
        marker: { size: 6, color: "#4A5568" }, hovertemplate: `%{y:.2f} ${unit}<extra></extra>`, xhoverformat: "%Y" },
      { x: tl.x, y: tl.y, mode: "lines", name: "Trend", line: { color: v.color, width: 4 }, hoverinfo: "skip" },
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
      $("map-note").textContent = "Sea level is measured by tide gauges, so the dots are on the coast.";
    } else {
      spots = D.mapPoints.filter(p => D.series[p.power] && D.series[p.power][varKey])
        .map(p => [`${p.lat.toFixed(1)}°N, ${Math.abs(p.lon).toFixed(1)}°W`, p.lat, p.lon, p.power]);
      $("map-note").textContent = "";
    }
    const results = spots.map(([name, lat, lon, key]) => ({ name, lat, lon, r: analysis(key, varKey) }));
    const sig = results.filter(x => x.r.verdict === "significant"), rest = results.filter(x => x.r.verdict !== "significant");
    const limit = Math.max(...results.map(x => Math.abs(x.r.senPerDecade))) || 1;
    const label = x => (x.r.senPerDecade >= 0 ? "+" : "") + x.r.senPerDecade.toFixed(2);
    const hover = x => `<b>${x.name}</b><br>${signed(x.r.senPerDecade, unit)} every 10 years<br>How sure: ${VERDICT[x.r.verdict].sure}`;
    const traces = [];
    if (rest.length) traces.push({
      type: "scattermap", name: "No clear change", lat: rest.map(x => x.lat), lon: rest.map(x => x.lon),
      mode: "markers+text", text: rest.map(label), textposition: "middle right", textfont: { size: 11, color: "#4A5568" },
      hovertext: rest.map(hover), hoverinfo: "text", marker: { size: 11, color: "#B8BEC7" },
    });
    if (sig.length) traces.push({
      type: "scattermap", name: "Clear change", lat: sig.map(x => x.lat), lon: sig.map(x => x.lon),
      mode: "markers+text", text: sig.map(label), textposition: "middle right", textfont: { size: 12, color: "#1A202C" },
      hovertext: sig.map(hover), hoverinfo: "text",
      marker: { size: 18, color: sig.map(x => x.r.senPerDecade), colorscale: varKey === "rainfall" ? BROWN_GREEN : RED_BLUE,
        cmin: -limit, cmax: limit, showscale: true, colorbar: { title: { text: `${unit}<br>per 10 yrs` }, thickness: 14 } },
    });
    const small = window.innerWidth < 560;
    Plotly.react("big-map", traces, {
      map: { style: "open-street-map", zoom: small ? 4.8 : 5.4, center: { lat: 27.7, lon: -83.6 } },
      height: small ? 480 : 600, margin: { l: 0, r: 0, t: 0, b: 0 }, legend: { orientation: "h", y: 1.02, x: 0 },
    }, PLOT_CONFIG);

    let msg;
    if (sig.length) {
      const fast = sig.reduce((a, b) => (Math.abs(b.r.senPerDecade) > Math.abs(a.r.senPerDecade) ? b : a));
      const ups = sig.filter(x => x.r.direction === "up").length;
      const up = V.up_short.toLowerCase(), down = V.down_short.toLowerCase(), sea = !!V.tides;
      msg = `<b>${sig.length} of ${results.length} spots</b> show a clear change. `;
      if (ups === sig.length) msg += sea ? "At all of them the sea is rising." : `All of them are getting ${up}.`;
      else if (ups === 0) msg += sea ? "At all of them the sea is falling." : `All of them are getting ${down}.`;
      else msg += `🔀 ${ups} are ${up} and ${sig.length - ups} are ${down}: different parts of Florida are moving in opposite directions.`;
      msg += ` The fastest change is at ${fast.name}: ${signed(fast.r.senPerDecade, unit)} every 10 years.`;
      $("map-summary").innerHTML = `<div class="ok">${msg}</div>`;
    } else {
      $("map-summary").innerHTML = `<div class="info">No spot shows a clear change for this topic.</div>`;
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
    $("cmp-note").textContent = V.tides ? "Sea level is only measured on the coast, so only coastal places are listed." : "";
    const pa = state.cmpA, pb = state.cmpB;
    if (pa === pb) {
      $("cmp-cards").innerHTML = `<div class="err">Pick two different places.</div>`;
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

    $("cmp-cards").innerHTML = [[ra, pa], [rb, pb]].map(([r, k]) => {
      const v = VERDICT[r.verdict];
      return `<div class="card" style="--c:${v.color}"><div class="q">${D.places[k].name}</div>
        <div class="a">${shortAnswer(r, V)}</div><div class="n">${signed(r.senPerDecade, unit)} every 10 years</div>
        <div class="s">How sure: <b>${v.sure}</b></div></div>`;
    }).join("");

    const traces = [];
    [[ra, pa, "#2A6F97"], [rb, pb, "#E76F51"]].forEach(([r, k, color]) => {
      const yr = yearly(r), tl = trendLine(r);
      traces.push({ x: yr.x, y: yr.y, mode: "lines+markers", name: D.places[k].name, opacity: 0.45,
        line: { color, width: 1 }, marker: { size: 5, color }, hovertemplate: `%{y:.2f} ${unit}`, xhoverformat: "%Y" });
      traces.push({ x: tl.x, y: tl.y, mode: "lines", name: D.places[k].name + " trend", line: { color, width: 4 }, hoverinfo: "skip" });
    });
    Plotly.react("cmp-chart", traces, chartLayout(`${V.measure} (${unit})`, window.innerWidth < 560 ? 340 : 420), PLOT_CONFIG);
    $("cmp-caption").textContent = `Both places use the same years (${first} to ${last}). Each dot is one year; thick lines are the trends.`;

    const faster = Math.abs(ra.senPerDecade) > Math.abs(rb.senPerDecade) ? pa : pb;
    let note = "";
    if (ra.direction !== rb.direction && ra.direction !== "flat" && rb.direction !== "flat") {
      note = "🔀 The two places are moving in <b>opposite directions</b>" +
        (ra.verdict === "significant" && rb.verdict === "significant" ? "." : ", but at least one of them is not proven yet.");
    } else if (ra.verdict === "significant" && rb.verdict === "significant") {
      note = `Both places show a clear change. It is faster in <b>${D.places[faster].name}</b>.`;
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
          <p class="muted small">Example: ${example}</p></div></details>`;
      }
    }
    $("glossary").innerHTML = found ? html : `<div class="info">No word found. Try a shorter search, like "trend".</div>`;
  }

  // ======================================================================
  // Navigation and start-up
  // ======================================================================
  // "Plan a trip" lives in trip.js; it gets the helpers it needs through this object
  const renderTrip = () => window.TripPlanner && window.TripPlanner.render({
    D, state, seriesKey, hasData, analysis, unitOf, signed, VERDICT, PLOT_CONFIG, chartLayout,
  });
  const PAGES = { area: renderArea, map: renderMap, compare: renderCompare, trip: renderTrip, how: renderGlossary };
  function currentPage() {
    const p = location.hash.replace("#", "");
    return PAGES[p] ? p : "area";
  }
  function show() {
    const page = currentPage();
    for (const p of Object.keys(PAGES)) $("page-" + p).hidden = p !== page;
    document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + page));
    PAGES[page]();
  }
  function setUnits(u) {
    state.units = u;
    store.set("units", u);
    document.querySelectorAll(".units button").forEach(b => b.classList.toggle("on", b.dataset.units === u));
  }

  async function start() {
    try {
      D = await (await fetch("data.json")).json();
    } catch (e) {
      $("loading").textContent = "Sorry, the data could not be loaded. Please refresh the page.";
      return;
    }
    TOPICS = Object.keys(D.variables);
    if (!D.places[state.place]) state.place = "miami";
    $("loading").remove();

    fillSelect($("place"), Object.keys(D.places), state.place);
    $("place").addEventListener("change", e => { state.place = e.target.value; store.set("place", state.place); renderArea(); });
    $("cmp-a").addEventListener("change", e => { state.cmpA = e.target.value; renderCompare(); });
    $("cmp-b").addEventListener("change", e => { state.cmpB = e.target.value; renderCompare(); });
    $("glossary-search").addEventListener("input", renderGlossary);
    document.querySelectorAll(".units button").forEach(b => b.addEventListener("click", () => { setUnits(b.dataset.units); show(); }));
    window.addEventListener("hashchange", () => { show(); window.scrollTo(0, 0); });

    setUnits(state.units === "Metric" ? "Metric" : "US");
    show();
  }
  start();
})();
