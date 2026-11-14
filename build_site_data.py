"""
build_site_data.py - pack the saved data and the catalog text into site/data.json
for the static website in site/ (the version hosted on Vercel).

Run it after changing catalog.py or downloading new data:
    py fetch_nasa_data.py      (only if you want fresh data)
    py build_site_data.py
Then commit and push: Vercel redeploys the site automatically.

The static site does all the math in the browser (site/stats.js), using the same
methods as stats_engine.py.
"""
import json
from pathlib import Path

import pandas as pd

import data_sources as ds
from catalog import CAUSES, GLOSSARY, MAP_POINTS, PLACES, SEA_LEVEL_STATIONS, VARIABLES

OUT = Path(__file__).parent / "site" / "data.json"
DIGITS = {"temperature": 2, "humidity": 2, "rainfall": 3, "sea_level": 4}
POWER_VARS = [k for k, v in VARIABLES.items() if v["power"]]


def pack(s: pd.Series, digits: int) -> dict:
    """Monthly series -> {"start": "YYYY-MM", "v": [values, null for missing months]}."""
    s = s.dropna().sort_index()
    idx = pd.date_range(s.index[0], s.index[-1], freq="MS")
    s = s.reindex(idx)
    return {"start": f"{idx[0]:%Y-%m}", "v": [None if pd.isna(x) else round(float(x), digits) for x in s.values]}


def power_key(lat, lon):
    return f"p_{lat:.2f}_{lon:.2f}"


series, missing = {}, []


def add_power(lat, lon):
    key = power_key(lat, lon)
    if key in series:
        return key
    entry = {}
    for v in POWER_VARS:
        s, _, real = ds.get_series(v, lat=lat, lon=lon, allow_download=False)
        if not real:
            missing.append(f"{v} at {lat}, {lon}")
            continue
        entry[v] = pack(s, DIGITS[v])
    series[key] = entry
    return key


places = {}
for k, p in PLACES.items():
    places[k] = {**p, "power": add_power(p["lat"], p["lon"])}

map_points = [{"lat": lat, "lon": lon, "power": add_power(lat, lon)} for lat, lon in MAP_POINTS]

stations = {}
for sid, info in SEA_LEVEL_STATIONS.items():
    s, _, real = ds.get_series("sea_level", station=sid, allow_download=False)
    if not real:
        missing.append(f"sea level at {info['name']}")
        continue
    series[f"t_{sid}"] = {"sea_level": pack(s, DIGITS["sea_level"])}
    stations[sid] = info

data = {
    "variables": VARIABLES,
    "places": places,
    "stations": stations,
    "mapPoints": map_points,
    "causes": CAUSES,
    "glossary": GLOSSARY,
    "series": series,
}
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Wrote {OUT} ({OUT.stat().st_size / 1e6:.2f} MB, {len(series)} series)")
if missing:
    print("WARNING: no saved data for (run py fetch_nasa_data.py):\n  " + "\n  ".join(missing))
