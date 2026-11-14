"""
stats_engine.py - the "brain" of Earth Data Detective.

Every number the website shows is calculated here, so this is the file to
understand before talking to the judges.

Main function:  analyze(series)  ->  a dictionary with everything the verdict needs.

The tests, in plain English:
  * Removing the seasons: subtract each calendar month's long-term average.
    What is left (the "anomaly") shows the slow change without summer/winter swings.
  * Mann-Kendall test: compare every earlier month with every later month. If later
    months are higher (or lower) far more often than chance, there is a trend.
    It gives the p-value. It does not need bell-curve shaped data.
  * Sen's slope: the median of the slopes between every pair of months.
    This is our "rate of change". Outliers barely affect it.
  * Linear regression: best-fit straight line, a t-test on its slope, and a 95%
    confidence interval for the slope.
  * Corrected Mann-Kendall: the same test, adjusted because neighboring months
    are similar (autocorrelation). Our robustness check.

Rule from the NASA challenge: p < 0.05 means "statistically significant".
"""
from __future__ import annotations

import io
import math

import numpy as np
import pandas as pd

# NOTE: we do not use the scipy library. Some school and work Windows computers
# block it, so the few probability formulas we need are written out below.


def _normal_cdf(z: float) -> float:
    """Chance that a standard bell-curve value is below z."""
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def _betainc(a: float, b: float, x: float) -> float:
    """Regularized incomplete beta function (standard continued-fraction method)."""
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    front = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log(1 - x))
    if x > (a + 1) / (a + b + 2):
        return 1 - _betainc(b, a, 1 - x)
    tiny = 1e-300
    c, d = 1.0, 1 - (a + b) * x / (a + 1)
    d = 1 / (d if abs(d) > tiny else tiny)
    h = d
    for m in range(1, 300):
        for num in (m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m)),
                    -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))):
            d = 1 + num * d
            d = 1 / (d if abs(d) > tiny else tiny)
            c = 1 + num / c
            c = c if abs(c) > tiny else tiny
            h *= d * c
        if abs(d * c - 1) < 1e-12:
            break
    return front * h / a


def _t_two_sided_p(t: float, df: float) -> float:
    """Two-sided p-value for a t-test."""
    return _betainc(df / 2, 0.5, df / (df + t * t))


def _t_critical(df: float, p: float = 0.05) -> float:
    """The t value that leaves p (5%) in the two tails: found by bisection."""
    lo, hi = 0.0, 50.0
    for _ in range(80):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if _t_two_sided_p(mid, df) > p else (lo, mid)
    return (lo + hi) / 2

SIGNIFICANT = 0.05      # p below this: the trend is significant
POSSIBLE = 0.25         # p between 0.05 and this: "a hint, not proven yet"


# --------------------------------------------------------------------------
# 1. Reading data files
# --------------------------------------------------------------------------
def load_time_series_csv(path_or_file) -> pd.Series:
    """Read a time series from a CSV file and return monthly values.

    Works with:
      * NASA Giovanni "area-averaged time series" files (info lines on top, then date,value)
      * any simple file with a date in the first column and a number in the second
        (for example data exported from CUAHSI HydroShare or NOAA)
    Daily data is averaged into months.
    """
    if hasattr(path_or_file, "read"):
        raw = path_or_file.read()
        text = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else raw
    else:
        with open(path_or_file, encoding="utf-8", errors="replace") as f:
            text = f.read()

    rows = []
    for line in text.splitlines():
        parts = [p.strip().strip('"') for p in line.replace(";", ",").replace("\t", ",").split(",")]
        if len(parts) < 2:
            continue
        # find the first cell that looks like a date (NOAA files put the station name first)
        date, where = pd.NaT, -1
        for k, cell in enumerate(parts[:3]):
            if len(cell) >= 6 and ("-" in cell or "/" in cell):
                date = pd.to_datetime(cell, errors="coerce")
                if not pd.isna(date):
                    where = k
                    break
        if where < 0:
            continue                      # an info/header line, skip it
        if getattr(date, "tzinfo", None) is not None:
            date = date.tz_localize(None)
        for cell in parts[where + 1:]:    # first cell after the date that is a number
            try:
                rows.append((date, float(cell)))
                break
            except ValueError:
                continue
    if len(rows) < 2:
        raise ValueError("Could not find rows that look like  date,value  in this file.")

    s = pd.Series([v for _, v in rows], index=pd.DatetimeIndex([d for d, _ in rows])).sort_index()
    s = s.where(s > -900)                 # NASA marks missing data with -999 or -9999
    s = s.groupby(s.index.to_period("M")).mean()          # one value per month
    s.index = s.index.to_timestamp()
    return s.dropna()


# --------------------------------------------------------------------------
# 2. Removing the seasons
# --------------------------------------------------------------------------
def deseasonalize(series: pd.Series) -> pd.Series:
    """Value minus the long-term average for that calendar month (the anomaly)."""
    return series - series.groupby(series.index.month).transform("mean")


# --------------------------------------------------------------------------
# 3. Mann-Kendall test and Sen's slope (written out so we can explain them)
# --------------------------------------------------------------------------
def _mk_s_and_variance(x: np.ndarray):
    n = len(x)
    diffs = x[np.newaxis, :] - x[:, np.newaxis]            # every later value minus every earlier value
    s = np.sign(diffs[np.triu_indices(n, k=1)]).sum()      # +1 for "went up", -1 for "went down"
    _, counts = np.unique(x, return_counts=True)           # tied (equal) values need a correction
    ties = counts[counts > 1]
    var = (n * (n - 1) * (2 * n + 5) - np.sum(ties * (ties - 1) * (2 * ties + 5))) / 18
    return float(s), float(var)


def _p_from_s(s: float, var: float):
    z = 0.0 if s == 0 or var <= 0 else (s - np.sign(s)) / math.sqrt(var)
    return float(z), float(2 * (1 - _normal_cdf(abs(z))))


def mann_kendall(values) -> dict:
    x = np.asarray(values, dtype=float)
    s, var = _mk_s_and_variance(x)
    z, p = _p_from_s(s, var)
    n = len(x)
    return {"S": s, "z": z, "p": p, "tau": s / (0.5 * n * (n - 1))}


def _times(values, t):
    """Time of each value in months. Default 0, 1, 2...; pass real month numbers when some months are missing."""
    return np.arange(len(values), dtype=float) if t is None else np.asarray(t, dtype=float)


def sens_slope(values, t=None) -> float:
    """Median slope between every pair of points (change per month)."""
    x = np.asarray(values, dtype=float)
    t = _times(x, t)
    i, j = np.triu_indices(len(x), k=1)
    return float(np.median((x[j] - x[i]) / (t[j] - t[i])))


def lag1_autocorrelation(values, t=None) -> float:
    """How similar each month is to the month before (after removing the trend). 0 = not at all."""
    x = np.asarray(values, dtype=float)
    d = x - sens_slope(x, t) * _times(x, t)
    d = d - d.mean()
    denom = np.sum(d ** 2)
    return float(np.sum(d[1:] * d[:-1]) / denom) if denom > 0 else 0.0


def mann_kendall_corrected(values, t=None) -> dict:
    """Mann-Kendall corrected for autocorrelation (Yue & Wang 2004, lag-1).

    Neighboring months are similar, so 500 months are not 500 independent clues.
    We count fewer "effective" months and recompute the p-value.
    """
    x = np.asarray(values, dtype=float)
    n = len(x)
    s, var = _mk_s_and_variance(x)
    r1 = lag1_autocorrelation(x, t)
    factor = max(1 + 2 * (1 - 1 / n) * r1, 1e-6)
    z, p = _p_from_s(s, var * factor)
    return {"p": p, "z": z, "lag1": r1, "effective_n": n / factor}


# --------------------------------------------------------------------------
# 4. Straight-line fit with t-test and 95% confidence interval
# --------------------------------------------------------------------------
def linear_trend(values, t=None) -> dict:
    v = np.asarray(values, dtype=float)
    t = _times(v, t)
    n = len(v)
    tm, vm = t.mean(), v.mean()
    sxx = np.sum((t - tm) ** 2)
    slope = float(np.sum((t - tm) * (v - vm)) / sxx)          # least-squares slope
    intercept = float(vm - slope * tm)
    resid = v - (intercept + slope * t)
    sse, sst = float(np.sum(resid ** 2)), float(np.sum((v - vm) ** 2))
    stderr = math.sqrt(sse / (n - 2) / sxx)                   # uncertainty of the slope
    p = _t_two_sided_p(slope / stderr, n - 2) if stderr > 0 else 0.0   # t-test: is the slope different from 0?
    t_crit = _t_critical(n - 2)
    return {"slope": slope, "intercept": intercept, "p": float(p), "r2": 1 - sse / sst if sst > 0 else 0.0,
            "ci_low": slope - t_crit * stderr, "ci_high": slope + t_crit * stderr}


# --------------------------------------------------------------------------
# 5. "How many more years?"
# --------------------------------------------------------------------------
def years_to_significance(values, current_years: float, t=None):
    """Rough estimate of the extra years of data needed to reach p < 0.05.

    Assumes the rate of change and the month-to-month noise stay the same.
    A straight-line trend gets easier to detect roughly like
        slope * sqrt(n^3 / 12) / noise        (n = number of months)
    We solve for the n where that reaches 1.96 (the p = 0.05 line).
    """
    x = np.asarray(values, dtype=float)
    b = sens_slope(x, t)
    if b == 0:
        return None
    t = _times(x, t)
    resid = x - (b * t + np.median(x - b * t))
    sigma = resid.std(ddof=1)
    r1 = min(max(lag1_autocorrelation(x, t), 0.0), 0.95)
    inflate = (1 + r1) / (1 - r1)                         # similar neighbors = effectively more noise
    n_needed = (12 * inflate * (1.96 * sigma / abs(b)) ** 2) ** (1 / 3)
    return max(0.0, float(n_needed / 12 - current_years))


# --------------------------------------------------------------------------
# 6. The full analysis used by every page
# --------------------------------------------------------------------------
def analyze(series: pd.Series, remove_season: bool = True) -> dict:
    series = series.dropna()
    if len(series) < 24:
        raise ValueError("Need at least 2 years of monthly data.")
    anomalies = deseasonalize(series)
    shown = anomalies if remove_season else series
    v = shown.to_numpy()
    # months since the first month (handles records with missing months, e.g. tide gauges)
    t = ((series.index.year - series.index[0].year) * 12 + series.index.month - series.index[0].month).to_numpy(float)

    lin = linear_trend(v, t)
    mk = mann_kendall(v)
    mkc = mann_kendall_corrected(v, t)
    sen = sens_slope(v, t)
    sen_intercept = float(np.median(v - sen * t))
    years = len(series) / 12
    verdict = "significant" if mk["p"] < SIGNIFICANT else "possible" if mk["p"] < POSSIBLE else "none"

    return {
        "start": series.index[0], "end": series.index[-1], "years": years, "n_months": len(series),
        "remove_season": remove_season,
        "analyzed_series": shown,
        "trend_line": pd.Series(lin["intercept"] + lin["slope"] * t, index=shown.index),
        "sen_line": pd.Series(sen_intercept + sen * t, index=shown.index),     # the trend line we draw
        "mean": float(series.mean()),
        "clim_mean": float(series.groupby(series.index.month).mean().mean()),  # a typical month, all seasons equal
        "sen_per_decade": sen * 120, "total_change": sen * t[-1],
        "slope_per_decade": lin["slope"] * 120, "ci_low_per_decade": lin["ci_low"] * 120,
        "ci_high_per_decade": lin["ci_high"] * 120, "linear_p": lin["p"], "r2": lin["r2"],
        "mk_p": mk["p"], "mk_z": mk["z"], "mk_tau": mk["tau"],
        "mk_p_corrected": mkc["p"], "lag1": mkc["lag1"], "effective_n": mkc["effective_n"],
        "robust": mkc["p"] < SIGNIFICANT,
        "direction": "up" if sen > 0 else "down" if sen < 0 else "flat",
        "verdict": verdict,
        "years_more": None if verdict == "significant" else years_to_significance(anomalies.to_numpy(), years, t),
    }


# --------------------------------------------------------------------------
# 7. Turning numbers into words
# --------------------------------------------------------------------------
def nice(x: float) -> str:
    """Round to 2 meaningful digits without scientific notation: 0.2634 -> '0.26', 12.7 -> '13'."""
    if x == 0 or not math.isfinite(x):
        return "0"
    digits = max(0, 1 - int(math.floor(math.log10(abs(x)))))
    return f"{x:.{digits}f}"


def format_p(p: float) -> str:
    return "p < 0.001" if p < 0.001 else f"p = {p:.3f}"


def plain_english(result: dict, variable_name: str, place_name: str, unit: str,
                  up_word: str = "rose", down_word: str = "fell") -> str:
    a, b = result["start"].year, result["end"].year
    verb = up_word if result["direction"] == "up" else down_word
    change = (f"Between {a} and {b}, {variable_name.lower()} in {place_name} {verb} by about "
              f"{nice(abs(result['sen_per_decade']))} {unit} per decade "
              f"(about {nice(abs(result['total_change']))} {unit} in total).")
    if result["verdict"] == "significant":
        why = (f"This trend is statistically significant ({format_p(result['mk_p'])}): if nothing were really "
               f"changing, a trend this strong would show up by luck less than 5% of the time.")
    elif result["verdict"] == "possible":
        why = (f"There is a hint of a trend, but it is not proven yet ({format_p(result['mk_p'])}). "
               f"A longer record might confirm it.")
    else:
        why = f"The ups and downs look random ({format_p(result['mk_p'])}), so we cannot call this a trend."
    return change + " " + why
