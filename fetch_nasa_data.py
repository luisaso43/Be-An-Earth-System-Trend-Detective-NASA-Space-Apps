"""
fetch_nasa_data.py - download all the data the website uses and save it, so the site is fast
and works without internet:
  * NASA POWER (temperature, rain, humidity) for every Florida place and map point -> data/power/
  * NOAA tide gauge sea level for every station in catalog.SEA_LEVEL_STATIONS       -> data/tides/

Run once (takes a few minutes):   py fetch_nasa_data.py
Already-saved files are skipped. To download everything again:   py fetch_nasa_data.py --refresh
Then commit the data/ folder to GitHub so the public website has the data too.
"""
import sys
import time

import data_sources as ds
from catalog import MAP_POINTS, PLACES, SEA_LEVEL_STATIONS

refresh = "--refresh" in sys.argv

points = [(p["lat"], p["lon"], p["name"]) for p in PLACES.values()] + [(a, b, "map point") for a, b in MAP_POINTS]
ok = 0
for i, (lat, lon, name) in enumerate(points, 1):
    if not refresh and ds._power_file(lat, lon).exists():
        ok += 1
        continue
    try:
        table = ds.fetch_power(lat, lon)
        ok += 1
        print(f"[{i}/{len(points)}] OK   {name} ({lat}, {lon}): {len(table)} months")
    except Exception as e:
        print(f"[{i}/{len(points)}] FAIL {name} ({lat}, {lon}): {e}")
    time.sleep(1)      # be polite to NASA's server
print(f"NASA POWER: {ok} of {len(points)} points saved in data/power/\n")

ok = 0
for i, (sid, info) in enumerate(SEA_LEVEL_STATIONS.items(), 1):
    if not refresh and ds._tides_file(sid).exists():
        ok += 1
        continue
    try:
        s = ds.fetch_tides(sid)
        ok += 1
        print(f"[{i}/{len(SEA_LEVEL_STATIONS)}] OK   {info['name']} ({sid}): {len(s)} months, "
              f"{s.index.min():%Y-%m} to {s.index.max():%Y-%m}")
    except Exception as e:
        print(f"[{i}/{len(SEA_LEVEL_STATIONS)}] FAIL {info['name']} ({sid}): {e}")
    time.sleep(1)
print(f"NOAA tide gauges: {ok} of {len(SEA_LEVEL_STATIONS)} stations saved in data/tides/")
