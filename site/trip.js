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
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
    "October", "November", "December"];
  const SHORT = MONTHS.map(m => m.slice(0, 3));
  const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const RECENT_YEARS = 15;
  const HEAT_DEW_C = 21.1, HEAT_TEMP_C = 27;           // 70 °F dew point and 80 °F air: heat-danger month
  const THIS_YEAR = new Date().getFullYear();

  // ---- scoring rules: edit the numbers here and the page AND the "how we score" table both update ----
  // v: t = average temperature (°C), d = dew point (°C), r = rain in the month (mm)
  // kind "above": no loss up to `ok`, full loss (`max` points) at `bad`, straight line in between. "below" is the mirror.
  const ACTIVITIES = {
    parks: {
      emoji: "🎢", name: "Theme parks & sightseeing",
      about: "A full day outside: walking, standing in lines, waiting for rides.",
      rules: [
        { v: "t", kind: "above", ok: 25, bad: 31, max: 35, short: "heat", why: "Hot sun and long lines wear you out.",
          tip: "Arrive at opening time and take an indoor break at midday." },
        { v: "t", kind: "below", ok: 15, bad: 5, max: 25, short: "cold", why: "Too chilly for rides and water parks.",
          tip: "Bring layers: mornings and evenings are cool." },
        { v: "d", kind: "above", ok: 18, bad: 23, max: 35, short: "sticky air", why: "In sticky air sweat cannot dry, so you overheat faster.",
          tip: "Drink water often and plan shady or air-conditioned breaks." },
        { v: "r", kind: "above", ok: 120, bad: 260, max: 15, short: "lots of rain", why: "Many storm days mean soggy lines and paused rides.",
          tip: "Pack a poncho. Storms usually hit in the afternoon, so ride outdoors in the morning." },
      ],
    },
    beach: {
      emoji: "🏖️", name: "Beach",
      about: "Swimming, sunbathing and walks on the sand.",
      rules: [
        { v: "t", kind: "below", ok: 25, bad: 17, max: 45, short: "cool weather", why: "Too cool to enjoy swimming.",
          tip: "Water and air are cool: pack a wetsuit top or a towel and a jacket." },
        { v: "t", kind: "above", ok: 29, bad: 33, max: 25, short: "heat", why: "Very hot sand and sun.",
          tip: "Go early or late, wear sunscreen and shade up at midday." },
        { v: "d", kind: "above", ok: 22, bad: 25, max: 15, short: "sticky air", why: "Very sticky air, even with a sea breeze.",
          tip: "Stay near the water and keep drinking." },
        { v: "r", kind: "above", ok: 150, bad: 300, max: 20, short: "lots of rain", why: "Rainy days cut into beach time.",
          tip: "Check the sky before you drive out: storms usually pass in under an hour." },
      ],
    },
    mud: {
      emoji: "🛻", name: "Mudding & off-roading",
      about: "Trails that are fun when the ground is wet, but not flooded.",
      rules: [
        { v: "r", kind: "below", ok: 90, bad: 30, max: 55, short: "not enough rain", why: "Not enough rain: you get dust, not mud.",
          tip: "Trails will be dry. Look for low, wet spots or wait for a rainy month." },
        { v: "r", kind: "above", ok: 220, bad: 350, max: 25, short: "flooded trails", why: "So much rain that trails flood or close.",
          tip: "Check that your trail is open: wet-season rain can flood low ground." },
        { v: "t", kind: "above", ok: 28, bad: 33, max: 20, short: "heat", why: "Heat is hard on riders and engines.",
          tip: "Ride early, carry extra water and watch the engine temperature." },
        { v: "t", kind: "below", ok: 12, bad: 3, max: 10, short: "cold", why: "Cold and miserable once you get wet.",
          tip: "Wear waterproof layers." },
      ],
    },
    hike: {
      emoji: "🥾", name: "Hiking & camping",
      about: "Long days on trails and nights outdoors.",
      rules: [
        { v: "t", kind: "above", ok: 24, bad: 30, max: 40, short: "heat", why: "Long walks in heat are tiring and risky.",
          tip: "Start at sunrise, carry more water than you think you need." },
        { v: "t", kind: "below", ok: 12, bad: 3, max: 25, short: "cold nights", why: "Cold nights outdoors.",
          tip: "Bring a warm sleeping bag." },
        { v: "d", kind: "above", ok: 16, bad: 22, max: 25, short: "muggy air", why: "Muggy air makes every mile harder.",
          tip: "Shorten your route and rest in the shade." },
        { v: "r", kind: "above", ok: 100, bad: 250, max: 10, short: "lots of rain", why: "Wet trails, mosquitoes and flooded paths.",
          tip: "Pack rain gear and bug spray." },
      ],
    },
  };
  const ACTIVITY_KEYS = Object.keys(ACTIVITIES);

  const BANDS = [
    { min: 80, word: "Great", color: "#2F855A" },
    { min: 60, word: "Good", color: "#6B9A2F" },
    { min: 40, word: "Tough", color: "#DD6B20" },
    { min: 0, word: "Rough", color: "#C0392B" },
  ];
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
  const fmtR = (mm, unit = true) => US() ? `${(mm / 25.4).toFixed(1)}${unit ? " in" : ""}` : `${Math.round(mm)}${unit ? " mm" : ""}`;
  const fmtV = (kind, x, unit = true) => (kind === "rainfall" ? fmtR : fmtT)(x, unit);
  const dispAbs = (kind, x) => kind === "rainfall" ? (US() ? x / 25.4 : x) : (US() ? x * 1.8 + 32 : x);
  const dispDelta = (kind, x) => kind === "rainfall" ? (US() ? x / 25.4 : x) : (US() ? x * 1.8 : x);
  const deltaUnit = kind => kind === "rainfall" ? (US() ? "in" : "mm") : (US() ? "°F" : "°C");
  const muggyWord = d => d <= 15.5 ? "Comfortable" : d <= 18.3 ? "A bit humid" : d <= HEAT_DEW_C ? "Sticky" : "Oppressive";

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
    const what = { t: "Average temperature", d: "Dew point", r: "Rain in the month" }[rule.v];
    const fmt = x => rule.v === "r" ? fmtR(x) : fmtT(x);
    return `${what} ${rule.kind === "above" ? "above" : "below"} ${fmt(rule.ok)}: loses points, up to −${rule.max} at ${fmt(rule.bad)}`;
  }

  function reasonSentence(act, m, sc) {
    const pens = act.rules.map(r => ({ r, p: penalty(r, m) })).filter(x => x.p >= 6).sort((a, b) => b.p - a.p);
    if (!pens.length) {
      const names = [...new Set(act.rules.map(r => ({ t: "temperature", d: "humidity", r: "rain" }[r.v])))];
      return `Nothing holds this month back: ${names.slice(0, -1).join(", ")}${names.length > 1 ? " and " : ""}${names[names.length - 1]} are all in the sweet spot for this activity.`;
    }
    const names = pens.slice(0, 2).map(x => x.r.short).join(" and ");
    return `${sc >= 60 ? "Mostly good, but watch for" : "Held back by"} ${names}. <b>Tip:</b> ${pens[0].r.tip}`;
  }

  // ---- page ----
  function wire() {
    wired = true;
    $("trip-place").innerHTML = Object.keys(C.D.places)
      .map(k => `<option value="${k}">${C.D.places[k].name}</option>`).join("");
    $("trip-year").innerHTML = Array.from({ length: 6 }, (_, i) => THIS_YEAR + i)
      .map(y => `<option value="${y}">${y}</option>`).join("");
    $("trip-activity").innerHTML = ACTIVITY_KEYS.map(k =>
      `<button type="button" role="tab" data-k="${k}">${ACTIVITIES[k].emoji} ${ACTIVITIES[k].name}</button>`).join("");
    $("trip-place").addEventListener("change", e => { C.state.place = e.target.value; render(C); });
    $("trip-year").addEventListener("change", e => { ts.year = +e.target.value; render(C); });
    $("trip-activity").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      ts.activity = b.dataset.k;
      render(C);
    }));
  }

  function render(ctx) {
    C = ctx;
    if (!wired) wire();
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

    let html = `<div class="ok"><b>🏆 Best months for ${act.name.toLowerCase()} in ${P.name}: ${top}</b> (scores ${order[0][0]} to ${order[2][0]}).
      Lowest score: <b>${MONTHS[worst[1]]}</b> (${worst[0]}). <span class="muted">Based on what we expect in ${ts.year}.</span></div>`;
    if (ts.activity === "beach" && !P.tide) {
      html += `<div class="warn">🏝️ ${P.name} is inland, so there is no beach here. Pick a coastal place such as Miami, Tampa Bay or Pensacola.</div>`;
    }
    html += `<h2>How good is each month for ${act.name.toLowerCase()}?</h2>
      <p class="muted small">${act.emoji} ${act.about} Click a bar to see that month. Score: 100 means ideal; points are lost for heat, sticky air and too much (or too little) rain.</p>
      <div id="trip-bars" class="chart trip-bars"></div>
      <div id="trip-months" class="seg months" role="tablist" aria-label="Month">${MONTHS.map((_, i) =>
        `<button type="button" role="tab" data-m="${i}" aria-selected="${i === m}">${SHORT[i]} <span class="muted">${scores[i]}</span></button>`).join("")}</div>
      <div id="trip-detail">${detailHTML(placeKey, P, act, snap, sc, band, m)}</div>
      <hr>
      <h2 id="trip-trend-title">Is ${MONTHS[m]} changing in ${P.name}?</h2>
      <p class="lead small">The estimates above rest on the trend of each month over 45 years. Here is that evidence.</p>
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
      marker: { color: scores.map(s => bandOf(s).color), line: { color: "#1A202C", width: scores.map((_, i) => i === m ? 3 : 0) } },
      customdata: snaps.map((s, i) => [bandOf(scores[i]).word, `${fmtT(s.m.t)} · dew point ${fmtT(s.m.d)} · rain ${fmtR(s.m.r)}`]),
      hovertemplate: "<b>%{x}: %{y}</b> (%{customdata[0]})<br>%{customdata[1]}<extra></extra>",
      text: scores.map(String), textposition: "outside", cliponaxis: false,
    }], {
      ...C.chartLayout("Fit score (0–100)", window.innerWidth < 560 ? 300 : 340),
      yaxis: { title: { text: "Fit score (0–100)" }, range: [0, 112], gridcolor: "#E5E9EF", zeroline: false, fixedrange: true },
      xaxis: { showgrid: false, fixedrange: true }, hovermode: "closest", showlegend: false,
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
    let html = `<div class="verdict" style="--c:${band.color}"><div class="h">${MONTHS[m]} in ${P.name}: ${band.word} for ${act.name.toLowerCase()} (${sc}/100)</div>
      <div class="t">${reasonSentence(act, snap.m, sc)}</div></div>
      <div class="metrics">
        <div class="metric"><div class="l">🌡️ Typical temperature</div><div class="v">${fmtT(T.expected)}</div>
          <div class="r">8 in 10 years: ${fmtT(T.lo, false)}–${fmtT(T.hi)}</div></div>
        <div class="metric"><div class="l">💧 The air feels</div><div class="v">${muggyWord(D.expected)}</div>
          <div class="r">dew point ${fmtT(D.expected)} (8 in 10: ${fmtT(D.lo, false)}–${fmtT(D.hi)})</div></div>
        <div class="metric"><div class="l">🌧️ Rain in the month</div><div class="v">${fmtR(R.expected)}</div>
          <div class="r">8 in 10 years: ${fmtR(Math.max(0, R.lo), false)}–${fmtR(R.hi)}</div></div>
      </div>
      <p class="muted small">What we expect for ${MONTHS[m]} ${ts.year}. The range shows how much that month varies from year to year.</p>`;
    if (D.expected >= HEAT_DEW_C && T.expected >= HEAT_TEMP_C) {
      html += `<div class="warn">⚠️ <b>Heat-danger month.</b> Hot, sticky air makes it hard for the body to cool off. Do outdoor things early or late,
        drink water often and take shade breaks. (Outdoor workers face this every day of the month.)</div>`;
    }
    if (ts.activity === "beach" && P.tide && C.hasData("sea_level", placeKey)) {
      const r = C.analysis(C.seriesKey("sea_level", placeKey), "sea_level");
      if (r && r.verdict === "significant" && r.direction === "up") {
        html += `<div class="info">🌊 Sea level at ${C.D.stations[P.tide].name} is rising ${C.signed(r.senPerDecade, C.unitOf("sea_level"))} every 10 years
          (<b>${C.VERDICT.significant.sure}</b>). Higher seas push high tide farther up the beach and flood low roads near the coast.</div>`;
      }
    }
    if (m >= 5 && m <= 10) {
      html += `<div class="info">🌀 June 1 to November 30 is Atlantic hurricane season. This tool does not measure storms, so check the
        <a href="https://www.nhc.noaa.gov" target="_blank" rel="noopener">National Hurricane Center</a> before you book.</div>`;
    }
    return html;
  }

  const wordFor = (r, V) => {
    const w = r.direction === "up" ? V.up_short : V.down_short;
    return r.verdict === "significant" ? w : r.verdict === "possible" ? "Maybe " + w.toLowerCase() : "No clear change";
  };

  function trendHTML(placeKey, snap, m) {
    const cards = [["temperature", snap.T], ["humidity", snap.D], ["rainfall", snap.R]].map(([k, st]) => {
      const V = C.D.variables[k], v = C.VERDICT[st.r.verdict];
      return `<div class="card" style="--c:${v.color}"><div class="q">${V.emoji} ${MONTHS[m]} ${V.name.toLowerCase()}</div>
        <div class="a">${wordFor(st.r, V)}</div>
        <div class="n">${C.signed(dispDelta(k, st.r.senPerDecade), deltaUnit(k))} every 10 years</div>
        <div class="s">How sure: <b>${v.sure}</b></div>
        <button type="button" data-var="${k}">Show on the chart</button></div>`;
    }).join("");
    return `<div class="cards trip-cards">${cards}</div>`;
  }

  function renderTrendDetail(placeKey, snap, m) {
    const k = ts.chartVar, V = C.D.variables[k], st = k === "temperature" ? snap.T : k === "humidity" ? snap.D : snap.R;
    const r = st.r, v = C.VERDICT[r.verdict], P = C.D.places[placeKey];
    const what = k === "rainfall" ? "rain" : k === "humidity" ? "dew point" : "average temperature";
    const absUnit = k === "rainfall" ? (US() ? "in" : "mm") : (US() ? "°F" : "°C");
    const trendY = r.senLine.map(x => dispAbs(k, x + r.climMean));
    const xs = st.vals.map(p => `${p.year}-07-01`);
    $("trip-trend-detail").innerHTML = `
      <div class="chart" id="trip-trend-chart"></div>
      <p class="muted small">Each dot is one year's ${MONTHS[m]} ${what} in ${P.name}. The thick line is the steady trend.
        ⭐ is what we expect in ${ts.year}; the bar is the range 8 in 10 past years fell inside.</p>
      <div class="${r.verdict === "significant" ? "ok" : "info"}">${r.verdict === "significant"
        ? `The ${MONTHS[m]} trend is clear (<b>${v.sure}</b>: ${Stats.formatP(r.mkP)}), so we continued the trend line to ${ts.year}.`
        : `The ${MONTHS[m]} trend is <b>${v.sure.toLowerCase()}</b> (${Stats.formatP(r.mkP)}). We do not guess a trend that could be luck, so the star is the
           average of the most recent ${RECENT_YEARS} years.`}
        Then vs. now: the first ${RECENT_YEARS} years averaged ${fmtV(k, st.early)}, the latest ${RECENT_YEARS} ${fmtV(k, st.recent)}.</div>
      <a class="dl" id="trip-evidence" href="#area">🔎 See the year-round evidence for ${P.name}</a>`;
    $("trip-evidence").addEventListener("click", () => { C.state.topic = k; });

    const layout = C.chartLayout(`${MONTHS[m]} ${what} (${absUnit})`, window.innerWidth < 560 ? 320 : 380);
    Plotly.react("trip-trend-chart", [
      { x: xs, y: st.vals.map(p => dispAbs(k, p.v)), mode: "lines+markers", name: `Each ${MONTHS[m]}`, line: { color: "#A0AEC0", width: 1.5 },
        marker: { size: 6, color: "#4A5568" }, hovertemplate: `%{y:.1f} ${absUnit}<extra></extra>`, xhoverformat: "%Y" },
      { x: xs, y: trendY, mode: "lines", name: "Trend", line: { color: v.color, width: 4 }, hoverinfo: "skip" },
      { x: [`${ts.year}-07-01`], y: [dispAbs(k, st.expected)], mode: "markers", name: `Expected ${ts.year}`,
        marker: { symbol: "star", size: 16, color: "#E76F51", line: { color: "#fff", width: 1 } },
        error_y: { type: "data", symmetric: false, array: [dispAbs(k, st.hi) - dispAbs(k, st.expected)],
          arrayminus: [dispAbs(k, st.expected) - dispAbs(k, st.lo)], color: "#E76F51", thickness: 2, width: 6 },
        hovertemplate: `Expected: %{y:.1f} ${absUnit}<extra></extra>` },
    ], layout, C.PLOT_CONFIG);
  }

  function howHTML() {
    const rows = ACTIVITY_KEYS.map(k => {
      const a = ACTIVITIES[k];
      return `<tr><td><b>${a.emoji} ${a.name}</b></td><td><ul class="tight">${a.rules.map(r =>
        `<li>${ruleText(r)}. <span class="muted">${r.why}</span></li>`).join("")}</ul></td></tr>`;
    }).join("");
    return `<hr><h2>How we make these numbers</h2>
      <details><summary>🔭 How do we estimate a month's weather?</summary><div>
        <ol class="steps">
          <li><b>Collect the same month from every year.</b> For example every July from 1981 to 2025: 45 values.</li>
          <li><b>Test for a trend.</b> The same Mann-Kendall test as the "My area" page asks: is this month steadily getting hotter, muggier or wetter, or is it just luck?</li>
          <li><b>Pick the estimate.</b> If the trend is clear (<i>Very sure</i>), we continue the trend line to your trip year. If it is not, we use the average of the most recent ${RECENT_YEARS} years, because projecting a trend that may be luck would be a guess.</li>
          <li><b>Show the range.</b> We measure how far past years landed above and below that line. The range shown is where 8 out of 10 past years fell, so an unusual year can still happen.</li>
        </ol>
        <p class="muted small">Data: NASA MERRA-2 temperature, dew point and rain via NASA POWER; NOAA tide gauges for sea level.</p></div></details>
      <details><summary>🧮 How is the 0–100 score made?</summary><div>
        <p>Every month starts at 100. Each rule below takes points away when the weather gets worse for that activity. 80 and up is <b>Great</b>, 60 to 79 <b>Good</b>, 40 to 59 <b>Tough</b>, below 40 <b>Rough</b>.</p>
        <div class="table-scroll"><table><thead><tr><th>Activity</th><th>What costs points</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="muted small"><b>Honest note:</b> the weather numbers are NASA data, but these thresholds are our own rules of thumb about comfort, not NASA science. Change the numbers at the top of <code>trip.js</code> to match your own taste.</p></div></details>
      <details><summary>⚠️ What this cannot tell you</summary><div><ul>
        <li>It is not a weather forecast. It cannot say whether it will rain on a certain day, only what a month is usually like.</li>
        <li>Monthly averages hide afternoon peaks: the temperature shown is the average over day and night, so afternoons are hotter.</li>
        <li>It does not measure storms. Check the National Hurricane Center for tropical systems.</li>
        <li>MERRA-2 squares are about 50 km (30 miles) wide, so a place's numbers cover a whole area.</li>
        <li>Continuing a trend line assumes the change keeps going at the same speed. The further the trip year, the less sure that is.</li></ul></div></details>`;
  }

  return { render };
})();
