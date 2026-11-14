"""
data_sources.py - where the numbers come from.

Temperature, rain and humidity (NASA POWER), for any place or point:
  1. data/nasa/<variable>__<place>.csv   a file your team downloaded (e.g. NASA Giovanni)
  2. data/power/<lat>_<lon>.csv          NASA POWER data saved earlier
  3. NASA POWER, live over the internet  (then saved to data/power/ for next time)
  4. Practice data                       invented numbers, clearly labeled, NEVER for the presentation

Sea level (NOAA tide gauges), for coastal places and the stations in catalog.SEA_LEVEL_STATIONS:
  1. data/tides/<station>.csv            saved earlier
  2. NOAA CO-OPS API, live               (then saved to data/tides/)
  3. Practice data

NASA POWER (https://power.larc.nasa.gov) delivers MERRA-2 model data for any point on Earth.
NOAA CO-OPS (https://tidesandcurrents.noaa.gov) publishes monthly mean sea level for each tide gauge.
Neither needs a login.

All values are returned in metric: °C, mm/day, meters.
"""
from __future__ import annotations

import datetime as dt
import time
import zlib
from pathlib import Path

import numpy as np
import pandas as pd
import requests

import stats_engine as se
from catalog import PLACES, SEA_LEVEL_STATIONS, VARIABLES

DATA_DIR = Path(__file__).parent / "data"
NASA_DIR = DATA_DIR / "nasa"
POWER_DIR = DATA_DIR / "power"
TIDES_DIR = DATA_DIR / "tides"
POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
TIDES_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"
POWER_CODES = [v["power"] for v in VARIABLES.values() if v["power"]]
FIRST_YEAR = 1981

_last_failure = {"power": 0.0, "tides": 0.0}   # when a live download last failed (so we do not retry on every click)


# --------------------------------------------------------------------------
# NASA POWER
# --------------------------------------------------------------------------
def _power_file(lat: float, lon: float) -> Path:
    return POWER_DIR / f"{lat:.2f}_{lon:.2f}.csv"


def fetch_power(lat: float, lon: float, timeout: int = 60) -> pd.DataFrame:
    """Download monthly data for one point from NASA POWER and save it. Returns a table (one column per code)."""
    last_error = None
    for end_year in (dt.date.today().year - 1, dt.date.today().year - 2):   # newest full year first
        try:
            r = requests.get(POWER_URL, timeout=timeout, params={
                "parameters": ",".join(POWER_CODES), "community": "AG", "latitude": lat, "longitude": lon,
                "start": FIRST_YEAR, "end": end_year, "format": "JSON"})
            r.raise_for_status()
            params = r.json()["properties"]["parameter"]
            break
        except Exception as e:          # no internet, NASA busy, year not ready yet...
            last_error = e
    else:
        raise RuntimeError(f"NASA POWER download failed: {last_error}")

    columns = {}
    for code, values in params.items():
        rows = {}
        for key, val in values.items():          # keys look like "198101"; month "13" is the yearly average
            if len(key) == 6 and key[:4].isdigit() and 1 <= int(key[4:]) <= 12 and val is not None and val > -900:
                rows[pd.Timestamp(int(key[:4]), int(key[4:]), 1)] = float(val)
        columns[code] = pd.Series(rows)
    table = pd.DataFrame(columns).sort_index()
    table.index.name = "date"
    POWER_DIR.mkdir(parents=True, exist_ok=True)
    table.to_csv(_power_file(lat, lon))
    return table


def _power_table(lat: float, lon: float, allow_download: bool = True):
    """Saved POWER data if we have it, otherwise try a live download. Returns None if neither works."""
    f = _power_file(lat, lon)
    if f.exists():
        return pd.read_csv(f, index_col="date", parse_dates=True)
    if not allow_download or time.time() - _last_failure["power"] < 300:
        return None
    try:
        return fetch_power(lat, lon)
    except Exception:
        _last_failure["power"] = time.time()
        return None


# --------------------------------------------------------------------------
# NOAA tide gauges (sea level)
# --------------------------------------------------------------------------
def _tides_file(station: str) -> Path:
    return TIDES_DIR / f"{station}.csv"


def fetch_tides(station: str, timeout: int = 60) -> pd.Series:
    """Download monthly mean sea level (meters, relative to the 1983-2001 average) for one tide gauge."""
    r = requests.get(TIDES_URL, timeout=timeout, params={
        "product": "monthly_mean", "station": station, "datum": "MSL", "units": "metric", "time_zone": "gmt",
        "format": "json", "begin_date": f"{FIRST_YEAR}0101", "end_date": dt.date.today().strftime("%Y%m%d")})
    r.raise_for_status()
    body = r.json()
    if "data" not in body:
        raise RuntimeError(f"NOAA tide gauge download failed: {body.get('error', body)}")
    rows = {pd.Timestamp(int(d["year"]), int(d["month"]), 1): float(d["MSL"]) for d in body["data"] if d.get("MSL")}
    s = pd.Series(rows, name="sea_level_m").sort_index()
    s.index.name = "date"
    TIDES_DIR.mkdir(parents=True, exist_ok=True)
    s.to_csv(_tides_file(station))
    return s


def _tides_series(station: str, allow_download: bool = True):
    f = _tides_file(station)
    if f.exists():
        return pd.read_csv(f, index_col="date", parse_dates=True).iloc[:, 0]
    if not allow_download or time.time() - _last_failure["tides"] < 300:
        return None
    try:
        return fetch_tides(station)
    except Exception:
        _last_failure["tides"] = time.time()
        return None


# --------------------------------------------------------------------------
# Practice data (invented!) so the site works with no internet and no files
# --------------------------------------------------------------------------
def practice_series(var_key: str, lat: float, lon: float) -> pd.Series:
    seed = zlib.crc32(f"{var_key}{lat:.2f}{lon:.2f}".encode())
    rng = np.random.default_rng(seed)
    north = (lat - 24.5) / 6.5                       # 0 = Keys, 1 = Georgia border
    settings = {                                     # mean, seasonal swing, change per decade, noise, peak month
        "temperature": (25.5 - 5.5 * north, 3.5 + 5 * north, 0.24, 0.7, 7),
        "humidity": (20.5 - 5 * north, 4 + 4 * north, 0.20, 0.9, 8),
        "rainfall": (4.0, 2.6 - 1.2 * north, 0.20 - 0.45 * north, 1.5, 8),
        "sea_level": (0.0, 0.08, 0.035, 0.05, 10),
    }[var_key]
    mean, swing, per_decade, noise, peak = settings
    idx = pd.date_range(f"{FIRST_YEAR}-01-01", "2025-12-01", freq="MS")
    m = np.arange(len(idx))
    vals = mean + swing * np.cos(2 * np.pi * (idx.month - peak) / 12) + per_decade * m / 120 + rng.normal(0, noise, len(idx))
    if var_key == "rainfall":
        vals = np.maximum(vals, 0.05)
    return pd.Series(vals, index=idx)


# --------------------------------------------------------------------------
# The one function the website calls
# --------------------------------------------------------------------------
def _fix_units(var_key: str, s: pd.Series) -> pd.Series:
    """Giovanni files come in NASA's raw units. Convert to the units we store."""
    if var_key in ("temperature", "humidity") and s.mean() > 200:    # Kelvin -> Celsius
        s = s - 273.15
    if var_key == "rainfall" and s.mean() < 0.35:                    # mm/hour -> mm/day
        s = s * 24
    return s


def station_for(place_key: str | None):
    return PLACES[place_key].get("tide") if place_key else None


def get_series(var_key: str, place_key: str | None = None, lat: float | None = None, lon: float | None = None,
               station: str | None = None, allow_download: bool = True):
    """Return (monthly series, source label, is_real_data)."""
    var = VARIABLES[var_key]

    if var.get("tides"):
        station = station or station_for(place_key)
        if station is None:
            raise ValueError("Sea level is only available at coastal places with a tide gauge.")
        info = SEA_LEVEL_STATIONS[station]
        s = _tides_series(station, allow_download)
        if s is not None and len(s.dropna()) >= 24:
            return s.dropna(), f"NOAA tide gauge at {info['name']} (station {station})", True
        return practice_series(var_key, info["lat"], info["lon"]), "Practice data (invented, not real)", False

    if place_key:
        lat, lon = PLACES[place_key]["lat"], PLACES[place_key]["lon"]
        f = NASA_DIR / f"{var_key}__{place_key}.csv"
        if f.exists():
            return _fix_units(var_key, se.load_time_series_csv(f)), var["source"] + " (downloaded file)", True
    table = _power_table(lat, lon, allow_download)
    if table is not None and var["power"] in table:
        s = table[var["power"]].dropna() * var["scale"]
        if len(s) >= 24:
            return s, var["source"], True
    return practice_series(var_key, lat, lon), "Practice data (invented, not real)", False


def places_for(var_key: str) -> list[str]:
    """Which places have data for this topic (sea level: coastal places only)."""
    if VARIABLES[var_key].get("tides"):
        return [p for p in PLACES if PLACES[p].get("tide")]
    return list(PLACES)
