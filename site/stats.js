/*
 * stats.js - the same math as stats_engine.py, in JavaScript, so the website can run
 * entirely in the browser (no server needed).
 *
 * analyze(points) takes [{t, year, month, v}] (t = months since the first month) and returns
 * everything the answer needs. See stats_engine.py for the plain-English explanation of each test.
 */
const Stats = (() => {
  const SIGNIFICANT = 0.05, POSSIBLE = 0.25;

  // ---- probability helpers (no libraries) ----
  function erf(x) {                      // series / continued fraction, accurate to ~1e-14
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    if (x < 3) {
      let sum = x, term = x, n = 0;
      while (Math.abs(term) > 1e-17 * Math.abs(sum)) {
        n++;
        term *= -x * x / n;
        sum += term / (2 * n + 1);
        if (n > 200) break;
      }
      return sign * 2 / Math.sqrt(Math.PI) * sum;
    }
    // erfc continued fraction for large x
    let f = 0;
    for (let k = 60; k >= 1; k--) f = k / 2 / (x + f);
    const erfc = Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
    return sign * (1 - erfc);
  }
  const normalCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));

  function lgamma(x) {                   // Lanczos approximation
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    let a = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  function betainc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const front = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x > (a + 1) / (a + b + 2)) return 1 - betainc(b, a, 1 - x);
    const tiny = 1e-300;
    let c = 1, d = 1 - (a + b) * x / (a + 1);
    d = 1 / (Math.abs(d) > tiny ? d : tiny);
    let h = d;
    for (let m = 1; m < 300; m++) {
      for (const num of [m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m)),
                         -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))]) {
        d = 1 + num * d; d = 1 / (Math.abs(d) > tiny ? d : tiny);
        c = 1 + num / c; c = Math.abs(c) > tiny ? c : tiny;
        h *= d * c;
      }
      if (Math.abs(d * c - 1) < 1e-12) break;
    }
    return front * h / a;
  }
  const tTwoSidedP = (t, df) => betainc(df / 2, 0.5, df / (df + t * t));
  function tCritical(df, p = 0.05) {
    let lo = 0, hi = 50;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (tTwoSidedP(mid, df) > p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  function median(a) {
    const s = Float64Array.from(a).sort(), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }

  // ---- the tests ----
  function mkSVar(x) {
    const n = x.length;
    let s = 0;
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) s += Math.sign(x[j] - x[i]);
    const counts = new Map();
    for (const v of x) counts.set(v, (counts.get(v) || 0) + 1);
    let tie = 0;
    for (const c of counts.values()) if (c > 1) tie += c * (c - 1) * (2 * c + 5);
    return { s, v: (n * (n - 1) * (2 * n + 5) - tie) / 18 };
  }
  function pFromS(s, v) {
    const z = s === 0 || v <= 0 ? 0 : (s - Math.sign(s)) / Math.sqrt(v);
    return { z, p: 2 * (1 - normalCdf(Math.abs(z))) };
  }
  function senSlope(x, t) {
    const n = x.length, slopes = new Float64Array(n * (n - 1) / 2);
    let k = 0;
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) slopes[k++] = (x[j] - x[i]) / (t[j] - t[i]);
    return median(slopes);
  }
  function lag1(x, t) {
    const b = senSlope(x, t);
    const d0 = x.map((v, i) => v - b * t[i]), m = mean(d0), d = d0.map(v => v - m);
    let num = 0, den = 0;
    for (let i = 0; i < d.length; i++) { den += d[i] * d[i]; if (i) num += d[i] * d[i - 1]; }
    return den > 0 ? num / den : 0;
  }
  function linearTrend(v, t) {
    const n = v.length, tm = mean(t), vm = mean(v);
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sxx += (t[i] - tm) ** 2; sxy += (t[i] - tm) * (v[i] - vm); }
    const slope = sxy / sxx, intercept = vm - slope * tm;
    let sse = 0, sst = 0;
    for (let i = 0; i < n; i++) { sse += (v[i] - intercept - slope * t[i]) ** 2; sst += (v[i] - vm) ** 2; }
    const stderr = Math.sqrt(sse / (n - 2) / sxx);
    const p = stderr > 0 ? tTwoSidedP(slope / stderr, n - 2) : 0;
    const tc = tCritical(n - 2);
    return { slope, intercept, p, ciLow: slope - tc * stderr, ciHigh: slope + tc * stderr };
  }
  function yearsToSignificance(x, t, currentYears) {
    const b = senSlope(x, t);
    if (b === 0) return null;
    const off = median(x.map((v, i) => v - b * t[i]));
    const resid = x.map((v, i) => v - (b * t[i] + off)), rm = mean(resid);
    const sigma = Math.sqrt(resid.reduce((s, r) => s + (r - rm) ** 2, 0) / (resid.length - 1));
    const r1 = Math.min(Math.max(lag1(x, t), 0), 0.95);
    const inflate = (1 + r1) / (1 - r1);
    const nNeeded = Math.cbrt(12 * inflate * (1.96 * sigma / Math.abs(b)) ** 2);
    return Math.max(0, nNeeded / 12 - currentYears);
  }

  // ---- the full analysis ----
  function analyze(points) {
    if (points.length < 24) throw new Error("Need at least 2 years of monthly data.");
    const byMonth = {};
    for (const p of points) (byMonth[p.month] = byMonth[p.month] || []).push(p.v);
    const monthMean = {};
    for (const m in byMonth) monthMean[m] = mean(byMonth[m]);
    const climMean = mean(Object.values(monthMean));
    const t0 = points[0].t;
    const t = points.map(p => p.t - t0);
    // seasons removed (anomalies); rounding makes exact ties count as ties (same as stats_engine.py)
    const v = points.map(p => Math.round((p.v - monthMean[p.month]) * 1e9) / 1e9);
    const n = v.length;

    const { s, v: varS } = mkSVar(v);
    const mk = pFromS(s, varS);
    const r1 = lag1(v, t);
    const factor = Math.max(1 + 2 * (1 - 1 / n) * r1, 1e-6);
    const mkc = pFromS(s, varS * factor);
    const lin = linearTrend(v, t);
    const sen = senSlope(v, t);
    const senIntercept = median(v.map((x, i) => x - sen * t[i]));
    const years = n / 12;
    const verdict = mk.p < SIGNIFICANT ? "significant" : mk.p < POSSIBLE ? "possible" : "none";

    return {
      points, t, anomalies: v, climMean, years, nMonths: n,
      start: points[0], end: points[n - 1],
      senLine: t.map(x => senIntercept + sen * x),
      senPerDecade: sen * 120, totalChange: sen * t[n - 1],
      slopePerDecade: lin.slope * 120, ciLowPerDecade: lin.ciLow * 120, ciHighPerDecade: lin.ciHigh * 120,
      linearP: lin.p, mkP: mk.p, mkZ: mk.z, tau: s / (0.5 * n * (n - 1)),
      mkPCorrected: mkc.p, lag1: r1, effectiveN: n / factor, robust: mkc.p < SIGNIFICANT,
      direction: sen > 0 ? "up" : sen < 0 ? "down" : "flat",
      verdict,
      yearsMore: verdict === "significant" ? null : yearsToSignificance(v, t, years),
    };
  }

  function nice(x) {                     // 2 meaningful digits: 0.2634 -> "0.26", 12.7 -> "13"
    if (x === 0 || !isFinite(x)) return "0";
    const digits = Math.max(0, 1 - Math.floor(Math.log10(Math.abs(x))));
    return x.toFixed(digits);
  }
  const formatP = p => p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`;

  return { analyze, nice, formatP };
})();
