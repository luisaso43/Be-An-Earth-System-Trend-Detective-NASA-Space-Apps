"""
app.py - the Earth Data Detective website (Florida edition).

Run it:   double-click run_app.bat      or      py -m streamlit run app.py

How Streamlit works: it runs this file from top to bottom every time the user
clicks something. Each st.something(...) call draws one piece of the page, and
widgets such as st.selectbox(...) return what the user picked.

Files:
  app.py            the pages (this file)
  stats_engine.py   all the math
  data_sources.py   getting the data (NASA POWER, NOAA tide gauges, or practice data)
  catalog.py        topics, Florida places, tide gauges, dictionary, cause notes
"""
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

import data_sources as ds
import stats_engine as se
from catalog import CAUSES, GLOSSARY, MAP_POINTS, PLACES, SEA_LEVEL_STATIONS, VARIABLES

st.set_page_config(page_title="Earth Data Detective: Florida", page_icon="🔎", layout="wide")

TOPICS = list(VARIABLES)
PAGES = ["🏠 My area", "🗺️ Florida map", "⚖️ Compare places", "📖 How it works"]

# One color per answer. Blue = clear change, amber = maybe, gray = no clear change.
VERDICT = {
    "significant": {"color": "#1F6FB2", "sure": "Very sure",
                    "explain": "A change this steady would happen by luck less than 5% of the time."},
    "possible": {"color": "#C98A00", "sure": "Not sure yet",
                 "explain": "There is a hint of a change, but random ups and downs could still explain it."},
    "none": {"color": "#8A94A3", "sure": "No real evidence",
             "explain": "The ups and downs look random: no steady change."},
}

# How each topic is shown in US and metric units (data is stored in °C, mm/day and meters)
UNITS = {
    "temperature": {"US": ("°F", lambda s: s * 1.8 + 32), "Metric": ("°C", lambda s: s)},
    "humidity": {"US": ("°F", lambda s: s * 1.8 + 32), "Metric": ("°C", lambda s: s)},
    "rainfall": {"US": ("in/yr", lambda s: s * 365.25 / 25.4), "Metric": ("mm/yr", lambda s: s * 365.25)},
    "sea_level": {"US": ("in", lambda s: s * 39.37), "Metric": ("cm", lambda s: s * 100)},
}

st.markdown("""
<style>
.card {border:1px solid #DDE3EA; border-top:6px solid var(--c); border-radius:12px; padding:14px 16px 10px;
       background:#FFFFFF; min-height:150px;}
.card .q {font-size:0.95rem; color:#4A5568; font-weight:600;}
.card .a {font-size:1.6rem; font-weight:800; color:var(--c); margin:4px 0 2px;}
.card .n {font-size:1rem; color:#1A202C;}
.card .s {font-size:0.85rem; color:#718096; margin-top:4px;}
.verdict {border-left:8px solid var(--c); background:color-mix(in srgb, var(--c) 9%, white);
          border-radius:10px; padding:16px 20px; margin:6px 0 14px;}
.verdict .h {font-size:1.5rem; font-weight:800; color:#1A202C;}
.verdict .t {font-size:1.05rem; margin-top:6px; color:#2D3748;}
</style>
""", unsafe_allow_html=True)


# ==========================================================================
# Helpers
# ==========================================================================
@st.cache_data(ttl=3600, show_spinner="Getting the data...")
def load(var_key, place_key=None, lat=None, lon=None, station=None):
    return ds.get_series(var_key, place_key, lat, lon, station=station)


def unit_system():
    return st.session_state.get("units", "US")


def get(var_key, place_key=None, lat=None, lon=None, station=None):
    """Data in the chosen units: (series, unit, source, is_real)."""
    series, source, real = load(var_key, place_key, lat, lon, station)
    unit, convert = UNITS[var_key][unit_system()]
    return convert(series), unit, source, real


def has_data(var_key, place_key):
    return place_key in ds.places_for(var_key)


def topic_label(k):
    return f"{VARIABLES[k]['emoji']} {VARIABLES[k]['name']}"


def value(x, unit):
    return f"{x:.1f} {unit}" if abs(x) >= 10 else f"{se.nice(x)} {unit}"


def signed(x, unit):
    sign = "+" if x > 0 else "−" if x < 0 else ""
    return f"{sign}{se.nice(abs(x))} {unit}"


def short_answer(result, var):
    word = var["up_short"] if result["direction"] == "up" else var["down_short"]
    if result["verdict"] == "significant":
        return word
    if result["verdict"] == "possible":
        return f"Maybe {word.lower()}"
    return "No clear change"


def headline(result, var, place_name):
    phrase = (var["up"] if result["direction"] == "up" else var["down"]).format(place=place_name)
    if result["verdict"] == "significant":
        return phrase[0].upper() + phrase[1:] + "."
    if result["verdict"] == "possible":
        return f"Maybe: there are hints that {phrase}, but it is not proven yet."
    return f"No clear change in {var['name'].lower()} at {place_name}."


def yearly(result):
    """Each year's average, rebuilt from the season-free values (fair even when months are missing)."""
    a = result["analyzed_series"]
    g = a.groupby(a.index.year)
    y = g.mean()[g.count() >= 6] + result["clim_mean"]
    return pd.Series(y.values, index=pd.to_datetime([f"{yr}-07-01" for yr in y.index]))


def trend_ends(result):
    line = result["sen_line"] + result["clim_mean"]
    return float(line.iloc[0]), float(line.iloc[-1])


def practice_warning(is_real):
    if not is_real:
        st.warning("⚠️ **Practice data, not real measurements.** The download did not work (no internet?). "
                   "These numbers are invented: do not present them.")


def place_map(points, height=260, zoom=5.4):
    """Small map of Florida with one marker per (name, lat, lon)."""
    fig = go.Figure(go.Scattermap(lat=[p[1] for p in points], lon=[p[2] for p in points], text=[p[0] for p in points],
                                  mode="markers+text", textposition="top right", hoverinfo="text",
                                  marker=dict(size=15, color="#E76F51")))
    fig.update_layout(map=dict(style="open-street-map", zoom=zoom, center=dict(lat=27.9, lon=-83.2)),
                      height=height, margin=dict(l=0, r=0, t=0, b=0), showlegend=False)
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})


def base_layout(fig, height, y_title):
    fig.update_layout(height=height, plot_bgcolor="white", paper_bgcolor="white", yaxis_title=y_title,
                      margin=dict(l=10, r=10, t=30, b=10), hovermode="x unified",
                      legend=dict(orientation="h", y=1.08, x=0))
    fig.update_yaxes(gridcolor="#E5E9EF")
    fig.update_xaxes(showgrid=False)


# ==========================================================================
# The answer for one topic at one place
# ==========================================================================
def summary_card(var_key, place_key):
    var = VARIABLES[var_key]
    if not has_data(var_key, place_key):
        st.markdown(f"""<div class="card" style="--c:#CBD2DB"><div class="q">{var['emoji']} {var['question']}</div>
            <div class="a" style="font-size:1.2rem">Not measured here</div>
            <div class="s">No tide gauge: this place is inland. Pick a coastal place.</div></div>""",
                    unsafe_allow_html=True)
        return
    series, unit, _, _ = get(var_key, place_key)
    r = se.analyze(series)
    v = VERDICT[r["verdict"]]
    st.markdown(f"""<div class="card" style="--c:{v['color']}"><div class="q">{var['emoji']} {var['question']}</div>
        <div class="a">{short_answer(r, var)}</div>
        <div class="n">{signed(r['total_change'], unit)} since {r['start'].year}</div>
        <div class="s">How sure: <b>{v['sure']}</b></div></div>""", unsafe_allow_html=True)
    st.button("See the evidence", key=f"card_{var_key}", width="stretch",
              on_click=lambda: st.session_state.update(topic=var_key))


def topic_detail(var_key, place_key):
    var, place = VARIABLES[var_key], PLACES[place_key]
    series, unit, source, real = get(var_key, place_key)
    station = ds.station_for(place_key) if var.get("tides") else None
    where = SEA_LEVEL_STATIONS[station]["name"] + " tide gauge" if station else place["name"]

    answer_area = st.container()
    first, last = int(series.index.min().year), int(series.index.max().year)
    with st.expander("📅 Change the years"):
        start, end = st.slider("Years to look at", first, last, (first, last), key=f"yrs_{var_key}_{place_key}")
        st.caption("Short periods often can't prove a trend: try shrinking the range and watch the answer change.")
    window = series[(series.index.year >= start) & (series.index.year <= end)]

    with answer_area:
        if len(window) < 24:
            st.error("Please choose at least 2 years.")
            return
        r = se.analyze(window)
        v = VERDICT[r["verdict"]]
        a, b = trend_ends(r)
        story = (f"From {r['start'].year} to {r['end'].year}, the trend for {var['measure'].lower()} went from "
                 f"about <b>{value(a, unit)}</b> to about <b>{value(b, unit)}</b>.")
        st.markdown(f"""<div class="verdict" style="--c:{v['color']}"><div class="h">{headline(r, var, place['name'])}</div>
            <div class="t">{story}</div></div>""", unsafe_allow_html=True)

        c1, c2, c3 = st.columns(3)
        c1.metric(f"Total change since {r['start'].year}", signed(r["total_change"], unit))
        c2.metric("Change every 10 years", signed(r["sen_per_decade"], unit),
                  help="The speed of change: how much it changes, on average, every 10 years.")
        c3.metric("How sure are we?", v["sure"], help=v["explain"] + f" (Technical: Mann-Kendall {se.format_p(r['mk_p'])}.)")
        practice_warning(real)

        fig = go.Figure()
        yr = yearly(r)
        fig.add_trace(go.Scatter(x=yr.index, y=yr.values, mode="lines+markers", name="Each year's average",
                                 line=dict(color="#A0AEC0", width=1.5), marker=dict(size=6, color="#4A5568"),
                                 hovertemplate="%{y:.2f} " + unit + "<extra></extra>"))
        line = r["sen_line"] + r["clim_mean"]
        fig.add_trace(go.Scatter(x=line.index, y=line.values, mode="lines", name="Trend", hoverinfo="skip",
                                 line=dict(color=v["color"], width=4)))
        base_layout(fig, 380, f"{var['measure']} ({unit})")
        st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
        st.caption(f"Each dot is one year. The thick line is the steady trend. Data: {source}.")

        if r["verdict"] != "significant" and r["years_more"] is not None:
            more = r["years_more"]
            if more > 100:
                st.info("⏳ The change is tiny compared with the random ups and downs, so there may be no real trend here.")
            else:
                st.info(f"⏳ If it keeps changing at this speed, about **{max(1, round(more))} more year(s)** of "
                        f"measurements could prove it. (A rough estimate.)")

    with st.expander(f"❓ What is {var['name'].lower()} and why does it matter?"):
        st.markdown(f"{var['definition']}  \n\n**Why it matters:** {var['why']}  \n\n**Measured at:** {where}  \n"
                    f"**Source:** {var['source']}")

    if r["verdict"] != "none" and r["direction"] != "flat":
        with st.expander("🤔 Why might this be happening?"):
            st.write(CAUSES[var_key][r["direction"]])
            st.caption("These are possible causes, not proof. A trend shows that something changed, not why.")
            st.markdown("**Learn more:** " + " · ".join(f"[{t}]({u})" for t, u in CAUSES[var_key]["sources"]))

    with st.expander("🔬 The science details (for experts)"):
        st.markdown(f"""
| Test | Result | What it tells us |
|---|---|---|
| **Mann-Kendall test** | {se.format_p(r['mk_p'])} (tau = {r['mk_tau']:.2f}) | Are later months higher (or lower) than earlier ones more often than chance? Sets the answer. |
| **Sen's slope** | {r['sen_per_decade']:+.3g} {unit} per decade | The typical rate of change. Outliers barely affect it. |
| **Linear regression (t-test)** | {r['slope_per_decade']:+.3g} {unit} per decade, {se.format_p(r['linear_p'])} | Best-fit straight line and a test of its slope. |
| **95% confidence interval** | {r['ci_low_per_decade']:+.3g} to {r['ci_high_per_decade']:+.3g} {unit} per decade | The true rate is very likely in this range. |
| **Corrected Mann-Kendall** | {se.format_p(r['mk_p_corrected'])} | Stricter version for neighboring months being similar (autocorrelation {r['lag1']:.2f}, about {r['effective_n']:.0f} independent months). |
| **Data used** | {r['n_months']} months, {r['start']:%b %Y} to {r['end']:%b %Y} | Seasons removed: each month is compared with the average for that calendar month. |
""")
        st.caption("Very sure = p < 0.05 · Not sure yet = 0.05 to 0.25 · No real evidence = above 0.25.")
        out = pd.DataFrame({"date": r["analyzed_series"].index.strftime("%Y-%m"), "value": window.values,
                            "difference_from_normal_month": r["analyzed_series"].values,
                            "trend": (r["sen_line"] + r["clim_mean"]).values})
        st.download_button(f"⬇️ Download this data ({unit}, CSV)", out.to_csv(index=False),
                           file_name=f"{var_key}_{place_key}.csv", mime="text/csv")


# ==========================================================================
# PAGE: My area
# ==========================================================================
def page_home():
    st.title("🔎 Is Florida's climate changing?")
    st.markdown("Pick a place. We check **40+ years of NASA and NOAA measurements** and tell you, in plain words, "
                "whether it is getting hotter, rainier, muggier, and whether the sea is rising.")

    left, right = st.columns([1, 1], gap="large")
    with left:
        place_key = st.selectbox("📍 Pick a place in Florida", list(PLACES), format_func=lambda k: PLACES[k]["name"],
                                 key="place")
        p = PLACES[place_key]
        st.caption(p["about"])
    with right:
        place_map([(p["name"], p["lat"], p["lon"])], height=200)

    st.subheader(f"The quick answers for {p['name']}")
    for col, var_key in zip(st.columns(4), TOPICS):
        with col:
            summary_card(var_key, place_key)

    st.divider()
    st.subheader("Look at the evidence")
    options = [t for t in TOPICS if has_data(t, place_key)]
    if st.session_state.get("topic") not in options:
        st.session_state["topic"] = options[0]
    topic = st.segmented_control("Topic", options, format_func=topic_label, key="topic", required=True,
                                 label_visibility="collapsed")
    topic_detail(topic, place_key)


# ==========================================================================
# PAGE: Florida map
# ==========================================================================
def page_map():
    st.title("🗺️ Where in Florida is it changing?")
    st.write("The same check, repeated all over the state. Bigger colored dots show a clear change; gray dots show no "
             "clear change. The number is the change every 10 years.")
    if "map_topic" not in st.session_state:
        st.session_state["map_topic"] = TOPICS[0]
    var_key = st.segmented_control("Topic", TOPICS, format_func=topic_label, key="map_topic", required=True,
                                   label_visibility="collapsed")
    var = VARIABLES[var_key]

    if var.get("tides"):
        spots = [(info["name"], info["lat"], info["lon"], dict(station=sid)) for sid, info in SEA_LEVEL_STATIONS.items()]
        st.caption("Sea level is measured by tide gauges, so the dots are on the coast.")
    else:
        spots = [(f"{lat:.1f}°N, {abs(lon):.1f}°W", lat, lon, dict(lat=lat, lon=lon)) for lat, lon in MAP_POINTS]

    results, all_real = [], True
    bar = st.progress(0.0, "Checking each spot...")
    for i, (name, lat, lon, where) in enumerate(spots):
        s, unit, _, real = get(var_key, **where)
        all_real &= real
        results.append((name, lat, lon, se.analyze(s)))
        bar.progress((i + 1) / len(spots), "Checking each spot...")
    bar.empty()
    practice_warning(all_real)

    sig = [x for x in results if x[3]["verdict"] == "significant"]
    rest = [x for x in results if x[3]["verdict"] != "significant"]
    limit = max(abs(x[3]["sen_per_decade"]) for x in results) or 1
    label = lambda x: f"{x[3]['sen_per_decade']:+.2f}"
    hover = lambda x: (f"<b>{x[0]}</b><br>{signed(x[3]['sen_per_decade'], unit)} every 10 years<br>"
                       f"How sure: {VERDICT[x[3]['verdict']]['sure']}")
    scale = "BrBG" if var_key == "rainfall" else "RdBu_r"      # rain: brown = drier, green = wetter
    fig = go.Figure()
    if rest:
        fig.add_trace(go.Scattermap(lat=[x[1] for x in rest], lon=[x[2] for x in rest], mode="markers+text",
                                    text=[label(x) for x in rest], textposition="middle right", name="No clear change",
                                    textfont=dict(size=11, color="#4A5568"), hovertext=[hover(x) for x in rest],
                                    hoverinfo="text", marker=dict(size=11, color="#B8BEC7")))
    if sig:
        fig.add_trace(go.Scattermap(lat=[x[1] for x in sig], lon=[x[2] for x in sig], mode="markers+text",
                                    text=[label(x) for x in sig], textposition="middle right", name="Clear change",
                                    textfont=dict(size=12, color="#1A202C"), hovertext=[hover(x) for x in sig],
                                    hoverinfo="text",
                                    marker=dict(size=18, color=[x[3]["sen_per_decade"] for x in sig], colorscale=scale,
                                                cmin=-limit, cmax=limit, showscale=True,
                                                colorbar=dict(title=f"{unit}<br>per 10 yrs"))))
    fig.update_layout(map=dict(style="open-street-map", zoom=5.4, center=dict(lat=27.7, lon=-83.6)),
                      height=600, margin=dict(l=0, r=0, t=0, b=0), legend=dict(orientation="h", y=1.02))
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})

    if sig:
        fast = max(sig, key=lambda x: abs(x[3]["sen_per_decade"]))
        ups = sum(x[3]["direction"] == "up" for x in sig)
        word_up, word_down = var["up_short"].lower(), var["down_short"].lower()
        msg = f"**{len(sig)} of {len(results)} spots** show a clear change. "
        if ups == len(sig):
            msg += f"All of them are getting {word_up}." if var_key != "sea_level" else "At all of them the sea is rising."
        elif ups == 0:
            msg += f"All of them are getting {word_down}." if var_key != "sea_level" else "At all of them the sea is falling."
        else:
            msg += f"🔀 {ups} are {word_up} and {len(sig) - ups} are {word_down}: different parts of Florida are moving in opposite directions."
        st.success(msg + f" The fastest change is at {fast[0]}: {signed(fast[3]['sen_per_decade'], unit)} every 10 years.")
    else:
        st.info("No spot shows a clear change for this topic.")


# ==========================================================================
# PAGE: Compare places
# ==========================================================================
def page_compare():
    st.title("⚖️ Compare two places")
    st.write("Is one part of Florida changing faster than another? Put two places side by side.")
    if "cmp_topic" not in st.session_state:
        st.session_state["cmp_topic"] = TOPICS[0]
    var_key = st.segmented_control("Topic", TOPICS, format_func=topic_label, key="cmp_topic", required=True,
                                   label_visibility="collapsed")
    var = VARIABLES[var_key]
    opts = ds.places_for(var_key)
    c1, c2 = st.columns(2)
    default_b = opts.index("pensacola") if "pensacola" in opts else len(opts) - 1
    pa = c1.selectbox("First place", opts, index=0, format_func=lambda k: PLACES[k]["name"])
    pb = c2.selectbox("Second place", opts, index=default_b, format_func=lambda k: PLACES[k]["name"])
    if var.get("tides"):
        st.caption("Sea level is only measured on the coast, so only coastal places are listed.")
    if pa == pb:
        st.warning("Pick two different places.")
        return

    sa, unit, _, real_a = get(var_key, pa)
    sb, _, _, real_b = get(var_key, pb)
    practice_warning(real_a and real_b)
    first = int(max(sa.index.min().year, sb.index.min().year))
    last = int(min(sa.index.max().year, sb.index.max().year))
    cut = lambda s: s[(s.index.year >= first) & (s.index.year <= last)]
    ra, rb = se.analyze(cut(sa)), se.analyze(cut(sb))

    for col, r, k in [(c1, ra, pa), (c2, rb, pb)]:
        v = VERDICT[r["verdict"]]
        col.markdown(f"""<div class="card" style="--c:{v['color']}; min-height:0"><div class="q">{PLACES[k]['name']}</div>
            <div class="a">{short_answer(r, var)}</div>
            <div class="n">{signed(r['sen_per_decade'], unit)} every 10 years</div>
            <div class="s">How sure: <b>{v['sure']}</b></div></div>""", unsafe_allow_html=True)

    fig = go.Figure()
    for r, k, color in [(ra, pa, "#2A6F97"), (rb, pb, "#E76F51")]:
        yr = yearly(r)
        fig.add_trace(go.Scatter(x=yr.index, y=yr.values, mode="lines+markers", name=PLACES[k]["name"],
                                 line=dict(color=color, width=1), marker=dict(size=5, color=color), opacity=0.45,
                                 hovertemplate="%{y:.2f} " + unit))
        line = r["sen_line"] + r["clim_mean"]
        fig.add_trace(go.Scatter(x=line.index, y=line.values, mode="lines", name=PLACES[k]["name"] + " trend",
                                 line=dict(color=color, width=4), hoverinfo="skip"))
    base_layout(fig, 420, f"{var['measure']} ({unit})")
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
    st.caption(f"Both places use the same years ({first} to {last}). Each dot is one year; thick lines are the trends.")

    faster = pa if abs(ra["sen_per_decade"]) > abs(rb["sen_per_decade"]) else pb
    if ra["direction"] != rb["direction"] and "flat" not in (ra["direction"], rb["direction"]):
        st.info("🔀 The two places are moving in **opposite directions**"
                + ("." if ra["verdict"] == rb["verdict"] == "significant" else ", but at least one of them is not proven yet."))
    elif ra["verdict"] == rb["verdict"] == "significant":
        st.info(f"Both places show a clear change. It is faster in **{PLACES[faster]['name']}**.")


# ==========================================================================
# PAGE: How it works
# ==========================================================================
def page_how():
    st.title("📖 How it works")
    st.markdown("""
### What we do, in 4 steps
1. **Get the measurements.** Monthly values since 1981 for each place.
2. **Take out the seasons.** Florida is always hotter in August than in January. That's not a trend, so we compare
   each month only with the same month in other years (this July vs. a normal July).
3. **Look for a steady change.** We draw the trend line and measure how fast it goes up or down: the
   *speed of change*, shown per 10 years.
4. **Ask: could this be luck?** Weather goes up and down randomly. A math test (the Mann-Kendall test) checks how
   likely it is to see a trend this steady if nothing were really changing.

### What "How sure are we?" means
| Answer | Meaning |
|---|---|
| 🔵 **Very sure** | Less than a 5% chance the trend is just luck. Scientists call this *statistically significant*. |
| 🟡 **Not sure yet** | There's a hint of a change, but luck could still explain it. More years of data may settle it. |
| ⚪ **No real evidence** | The ups and downs look random. |

### Where the data comes from
- **Temperature, rain and humidity:** NASA's MERRA-2, a reconstruction of the weather built from satellites, weather
  balloons and ground stations, delivered by [NASA POWER](https://power.larc.nasa.gov). Monthly since 1981, for any point in Florida.
- **Sea level:** [NOAA tide gauges](https://tidesandcurrents.noaa.gov) along Florida's coast. NASA uses tide gauge
  records like these to check its satellite measurements of the ocean. See NASA's [Sea Level Change portal](https://sealevel.nasa.gov/).

### Honest limits
- We look for straight-line trends. Some real changes curve or come in sudden steps.
- A trend shows *that* something changed, not *why*. The "why" notes are possibilities, not proof.
- MERRA-2 squares are about 50 km (30 miles) wide, so a place's value covers a whole area, not one street.
- Tide gauges measure the sea compared with the land, so sinking land also shows up as rising sea.
""")

    st.subheader("📚 Dictionary")
    query = st.text_input("Search for a word", "", placeholder="e.g. trend, dew point, tide gauge").strip().lower()
    found = 0
    for topic, terms in GLOSSARY.items():
        matches = [t for t in terms if not query or query in t[0].lower() or query in t[1].lower()]
        if not matches:
            continue
        st.markdown(f"**{topic}**")
        for term, meaning, example in matches:
            found += 1
            with st.expander(term, expanded=bool(query)):
                st.write(meaning)
                st.caption(f"Example: {example}")
    if not found:
        st.info("No word found. Try a shorter search, like 'trend'.")


# ==========================================================================
# Sidebar
# ==========================================================================
st.sidebar.title("🔎 Earth Data Detective")
st.sidebar.caption("Florida edition · NASA & NOAA data")
if st.session_state.get("page") not in PAGES:          # e.g. a page name from an older version of the site
    st.session_state["page"] = PAGES[0]
page = st.sidebar.radio("Go to", PAGES, key="page", label_visibility="collapsed")
st.sidebar.divider()
st.sidebar.radio("Units", ["US", "Metric"], key="units", horizontal=True,
                 format_func=lambda u: "°F · inches" if u == "US" else "°C · mm")
st.sidebar.divider()
st.sidebar.markdown("**How sure are we?**  \n🔵 Very sure  \n🟡 Not sure yet  \n⚪ No real evidence")
st.sidebar.caption("NASA Space Apps 2026 · Be an Earth Systems Trend Detective!")

{"🏠 My area": page_home, "🗺️ Florida map": page_map, "⚖️ Compare places": page_compare,
 "📖 How it works": page_how}[page]()
