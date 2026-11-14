# 🔎 Earth Data Detective: Florida

**NASA Space Apps 2026 · Challenge: Be an Earth Systems Trend Detective!**

A website that turns anyone into a data detective. Pick a place in Florida and get plain-English answers to four questions: **Is it getting hotter? Is the rain changing? Is it getting muggier? Is the sea rising?** For each one the site shows how much it changed, how fast, how sure we are (statistical significance), and why it might be happening.

## Run it (Windows)

1. Install Python from python.org (check **"Add python.exe to PATH"**).
2. Double-click **`run_app.bat`**. The first run installs the packages, then the site opens in your browser.

Or in the VS Code terminal:

```
py -m pip install -r requirements.txt
py -m streamlit run app.py
```

## Get the real NASA data (do this first!)

```
py fetch_nasa_data.py
```

This downloads monthly data since 1981 into `data/`:
- **NASA POWER** (MERRA-2) temperature, rain and dew point for 13 Florida places and 26 map points → `data/power/`
- **NOAA tide gauge** monthly mean sea level for 14 Florida stations → `data/tides/`

Files already saved are skipped (`--refresh` downloads everything again). **Commit `data/` to GitHub** so the public site has it.

If you skip this, the site downloads each place the first time you open it. With no internet it shows **practice data** (invented numbers) under a yellow warning. Never present practice data.

## Topics

| Topic | Data | Where |
|---|---|---|
| 🌡️ Temperature | NASA MERRA-2 air temperature (T2M) | All places + map points |
| 🌧️ Rain | NASA MERRA-2 corrected precipitation (PRECTOTCORR), shown as rain per year | All places + map points |
| 💧 Humidity | NASA MERRA-2 dew point (T2MDEW) | All places + map points |
| 🌊 Sea level | NOAA tide gauges, monthly mean sea level | Coastal places only (inland places say "not measured here") |

The sidebar switches between US units (°F, inches) and metric (°C, mm).

## Pages

| Page | What it does |
|---|---|
| 🏠 My area | Pick a place: four answer cards (one per topic), then the evidence for one topic: headline answer, total change, change every 10 years, "how sure are we?", yearly chart with trend line, possible causes, expert details |
| 🗺️ Florida map | **Where** is it changing: the same test at 26 points (or 14 tide gauges for sea level) |
| ⚖️ Compare places | Two places side by side over the same years; flags opposite trends |
| 🧳 Plan a trip | Pick a place, a year and an activity (theme parks, beach, mudding, hiking). Shows which months suit it best and what to expect in your trip year, using the same trend test as the other pages. **Static site only** (`site/trip.js`) |
| 📖 How it works | The method in 4 plain steps, what "how sure" means, data sources, limits, searchable dictionary |

## Files

| File | Job |
|---|---|
| `app.py` | The pages |
| `stats_engine.py` | All the math: removing seasons, Mann-Kendall, Sen's slope, regression + t-test + 95% CI, corrected Mann-Kendall, years-to-significance |
| `data_sources.py` | Gets data: saved files → live NASA POWER / NOAA tide gauges → practice data |
| `catalog.py` | Topics, places, tide gauges, map points, dictionary, cause notes (the science writer's file) |
| `fetch_nasa_data.py` | Downloads all NASA POWER and tide gauge data in one go |

## The science in short

- **Removing the seasons:** each value minus the long-term average for that calendar month.
- **Mann-Kendall test:** are later months higher (or lower) than earlier ones more often than chance? Gives the p-value. **p < 0.05 = significant.**
- **Sen's slope:** median slope between all pairs of months; shown per decade. Slopes use real dates, so gaps in tide gauge records are handled correctly.
- **Linear regression:** best-fit line, t-test on the slope, 95% confidence interval.
- **Corrected Mann-Kendall (Yue & Wang 2004):** robustness check for autocorrelation.
- **How many more years?** Solves slope × √(n³/12) ÷ noise = 1.96 for the number of months n. A rough estimate.
- "How sure are we?": 🔵 Very sure = p < 0.05 · 🟡 Not sure yet = 0.05 to 0.25 · ⚪ No real evidence = above 0.25.

Our Mann-Kendall, corrected Mann-Kendall and Sen's slope match the `pymannkendall` library.

**Limits:** straight-line trends only; a trend shows that something changed, not why; MERRA-2 squares are about 50 km wide; tide gauges measure sea level relative to the land, so land sinking also counts as sea rise.

## Put it online

### Vercel (static version in `site/`)

The `site/` folder is a copy of the website that runs entirely in the browser (HTML + JavaScript), so Vercel can host it for free. The math in `site/stats.js` is the same as `stats_engine.py` (checked to match within 0.000002%).

1. In Vercel: **Add New → Project → import this GitHub repo**.
2. Set **Root Directory** to `site` (click *Edit* next to it). Framework Preset: **Other**. Leave build settings empty.
3. **Deploy.** Every push to `main` redeploys automatically.

After changing `catalog.py` or downloading new data, rebuild the site's data file and push:

```
py build_site_data.py
```

### Streamlit Community Cloud (the Python version, `app.py`)

1. Push this folder to a **public GitHub repo** (include `data/` and `.streamlit/`).
2. Go to https://share.streamlit.io → sign in with GitHub → Create app → pick the repo → main file `app.py` → Deploy.

## Data and references

- NASA POWER (MERRA-2): https://power.larc.nasa.gov
- NOAA CO-OPS tide gauges (monthly mean sea level): https://tidesandcurrents.noaa.gov
- NASA Sea Level Change portal: https://sealevel.nasa.gov
- Yue, S. & Wang, C. (2004), Water Resources Management 18, 201–218.

## Use of AI

Code and text were drafted with Claude (Anthropic) during the event, then tested, reviewed and edited by the team. Describe your own changes honestly in the submission.
