"""
catalog.py - the words and lists the website uses: the four topics, Florida places,
tide gauges, map points, the dictionary of terms, and "why might this happen?" notes.

Science writer: this is your file. Check every sentence and every link.
"""

# --------------------------------------------------------------------------
# THE FOUR TOPICS
#   power: the code NASA POWER uses for this variable (None = not from NASA POWER)
#   tides: True = comes from NOAA tide gauges (sea level)
#   Values are stored in metric (°C, mm/day, meters). app.py converts them for display.
#   up / down: the sentence used when the trend is clear. {place} is filled in.
# --------------------------------------------------------------------------
VARIABLES = {
    "temperature": {
        "name": "Temperature", "emoji": "🌡️", "power": "T2M", "scale": 1,
        "question": "Is it getting hotter?",
        "up_short": "Hotter", "down_short": "Cooler",
        "up": "{place} is getting hotter", "down": "{place} is getting cooler",
        "measure": "Average temperature",
        "definition": "The air temperature about 6 feet above the ground, averaged over day and night: "
                      "what you feel when you step outside.",
        "why": "Hotter air raises the risk of heat illness, pushes up electricity bills and stresses crops.",
        "source": "NASA MERRA-2, via NASA POWER",
    },
    "rainfall": {
        "name": "Rain", "emoji": "🌧️", "power": "PRECTOTCORR", "scale": 1,
        "question": "Is the rain changing?",
        "up_short": "Rainier", "down_short": "Drier",
        "up": "{place} is getting rainier", "down": "{place} is getting drier",
        "measure": "Rain per year",
        "definition": "How much rain falls in a year.",
        "why": "More rain can mean more flooding. Less rain can mean drought, wildfires and limits on water use.",
        "source": "NASA MERRA-2 (corrected with rain gauges), via NASA POWER",
    },
    "humidity": {
        "name": "Humidity", "emoji": "💧", "power": "T2MDEW", "scale": 1,
        "question": "Is it getting muggier?",
        "up_short": "Muggier", "down_short": "Less muggy",
        "up": "the air in {place} is getting muggier", "down": "the air in {place} is getting less muggy",
        "measure": "Average dew point",
        "definition": "How much moisture is in the air, measured by the dew point. The higher the dew point, the "
                      "stickier it feels: above 65 °F (18 °C) feels sticky, above 70 °F (21 °C) feels oppressive.",
        "why": "Humid air stops sweat from drying, so the body overheats faster. Heat plus humidity is Florida's real danger.",
        "source": "NASA MERRA-2, via NASA POWER",
    },
    "sea_level": {
        "name": "Sea level", "emoji": "🌊", "power": None, "tides": True, "scale": 1,
        "question": "Is the sea rising?",
        "up_short": "Rising", "down_short": "Falling",
        "up": "the sea is rising at {place}", "down": "the sea is falling at {place}",
        "measure": "Sea level compared with its 1983–2001 average",
        "definition": "The average height of the ocean at the coast, measured by a tide gauge. Averaging over a "
                      "whole month removes the daily tides and waves.",
        "why": "Higher seas mean more flooding at high tide ('sunny-day flooding'), stronger storm surges and salt "
               "water creeping into drinking water wells.",
        "source": "NOAA tide gauges (NASA uses tide gauge records to check its satellite sea level data)",
    },
}

# --------------------------------------------------------------------------
# NOAA TIDE GAUGES in Florida with a long monthly record
#   id: NOAA station number (https://tidesandcurrents.noaa.gov)
# --------------------------------------------------------------------------
SEA_LEVEL_STATIONS = {
    "8720030": {"name": "Fernandina Beach", "lat": 30.671, "lon": -81.466},
    "8721604": {"name": "Port Canaveral", "lat": 28.416, "lon": -80.593},
    "8722670": {"name": "Lake Worth Pier", "lat": 26.613, "lon": -80.034},
    "8723214": {"name": "Virginia Key (Miami)", "lat": 25.731, "lon": -80.162},
    "8723970": {"name": "Vaca Key", "lat": 24.711, "lon": -81.107},
    "8724580": {"name": "Key West", "lat": 24.551, "lon": -81.808},
    "8725110": {"name": "Naples", "lat": 26.132, "lon": -81.808},
    "8725520": {"name": "Fort Myers", "lat": 26.648, "lon": -81.871},
    "8726520": {"name": "St. Petersburg", "lat": 27.761, "lon": -82.627},
    "8726724": {"name": "Clearwater Beach", "lat": 27.978, "lon": -82.832},
    "8727520": {"name": "Cedar Key", "lat": 29.134, "lon": -83.032},
    "8728690": {"name": "Apalachicola", "lat": 29.724, "lon": -84.981},
    "8729108": {"name": "Panama City", "lat": 30.152, "lon": -85.667},
    "8729840": {"name": "Pensacola", "lat": 30.404, "lon": -87.211},
}

# --------------------------------------------------------------------------
# FLORIDA PLACES (name, latitude, longitude, short description)
#   tide: the nearest NOAA tide gauge (coastal places only)
# --------------------------------------------------------------------------
PLACES = {
    "miami":         {"name": "Miami", "lat": 25.77, "lon": -80.19, "tide": "8723214", "about": "Florida's largest metro area: dense city, right on the coast."},
    "homestead":     {"name": "Homestead farmland", "lat": 25.47, "lon": -80.48, "about": "Farms and plant nurseries south of Miami, where thousands of people work outdoors."},
    "florida_keys":  {"name": "Florida Keys", "lat": 24.66, "lon": -81.40, "tide": "8724580", "about": "Low-lying island chain: most land is only a few feet above the sea."},
    "everglades":    {"name": "Everglades", "lat": 25.75, "lon": -80.90, "about": "A huge slow-moving wetland: Florida's 'river of grass'."},
    "fort_myers":    {"name": "Fort Myers", "lat": 26.64, "lon": -81.87, "tide": "8725520", "about": "Fast-growing city on the southwest Gulf coast."},
    "west_palm":     {"name": "West Palm Beach", "lat": 26.71, "lon": -80.05, "tide": "8722670", "about": "Atlantic coast city north of Miami."},
    "okeechobee":    {"name": "Lake Okeechobee farms", "lat": 26.75, "lon": -80.70, "about": "Sugarcane and vegetable farms south of Florida's biggest lake."},
    "tampa":         {"name": "Tampa Bay", "lat": 27.95, "lon": -82.46, "tide": "8726520", "about": "Large Gulf coast metro area around Tampa Bay."},
    "orlando":       {"name": "Orlando", "lat": 28.54, "lon": -81.38, "about": "Inland central Florida, far from the cooling ocean breeze."},
    "gainesville":   {"name": "Gainesville", "lat": 29.65, "lon": -82.32, "about": "Inland north Florida, with real winters by Florida standards."},
    "jacksonville":  {"name": "Jacksonville", "lat": 30.33, "lon": -81.66, "tide": "8720030", "about": "Largest city in north Florida, near the Atlantic coast."},
    "tallahassee":   {"name": "Tallahassee", "lat": 30.44, "lon": -84.28, "about": "The state capital, in the hilly, forested north."},
    "pensacola":     {"name": "Pensacola", "lat": 30.42, "lon": -87.22, "tide": "8729840", "about": "Western tip of the Panhandle, one of the rainiest cities in Florida."},
}

# Points across Florida for the trend map (latitude, longitude), north to south
MAP_POINTS = [
    (30.6, -87.2), (30.7, -86.2), (30.5, -85.2), (30.5, -84.3), (30.4, -83.3),
    (30.3, -82.4), (30.3, -81.7), (29.6, -83.2), (29.6, -82.4), (29.6, -81.5),
    (28.8, -82.3), (28.8, -81.4), (28.3, -80.8), (28.0, -82.4), (28.0, -81.6),
    (27.3, -82.2), (27.3, -81.4), (27.3, -80.5),
    (26.6, -81.8), (26.6, -81.0), (26.6, -80.2),
    (26.0, -81.4), (25.9, -80.4), (25.5, -80.6), (25.3, -80.9), (24.7, -81.3),
]

# --------------------------------------------------------------------------
# "WHY MIGHT THIS BE HAPPENING?"  Possible causes, not proof.
# --------------------------------------------------------------------------
CAUSES = {
    "temperature": {
        "up": "Greenhouse gases from burning fossil fuels trap extra heat: the main long-term cause of warming "
              "worldwide. Cities add their own heat (the 'urban heat island'): pavement and buildings soak up "
              "sunlight and release it slowly. Natural cycles such as El Niño make some years hotter than others.",
        "down": "Natural cycles such as La Niña, or a large volcanic eruption, can cool a region for a few years. "
                "A long cooling trend is unusual today, so double-check the years you picked.",
        "sources": [("NASA: evidence for climate change", "https://science.nasa.gov/climate-change/evidence/"),
                    ("EPA: heat islands", "https://www.epa.gov/heatislands")]},
    "humidity": {
        "up": "Warmer air can hold more water vapor (about 7% more for each 1 °C, or 4% per °F), and warmer "
              "oceans around Florida evaporate more water into the air.",
        "down": "Drier air masses, less evaporation from land, or changes in wind patterns can lower humidity.",
        "sources": [("NASA: water vapor and climate", "https://science.nasa.gov/earth/climate-change/steamy-relationships-how-atmospheric-water-vapor-amplifies-earths-greenhouse-effect/")]},
    "rainfall": {
        "up": "Warmer air holds more water vapor, so heavy rain can get heavier. Changes in tropical storms and "
              "sea breezes also change how much rain an area gets.",
        "down": "Shifting weather patterns can steer storms away from a region. Cycles such as La Niña usually bring "
                "drier winters to Florida.",
        "sources": [("NASA Global Precipitation Measurement mission", "https://gpm.nasa.gov/")]},
    "sea_level": {
        "up": "Two main causes: ocean water expands as it warms, and melting glaciers and ice sheets add water "
              "to the ocean. In some places the land is also slowly sinking, which makes the sea rise faster "
              "there. Changes in ocean currents such as the Gulf Stream can speed up or slow down the rise along "
              "Florida's coasts for years at a time.",
        "down": "A falling sea level is very unusual today. It can happen where the land is rising, or for a few "
                "years when ocean currents shift. Double-check the years you picked.",
        "sources": [("NASA Sea Level Change portal", "https://sealevel.nasa.gov/"),
                    ("NOAA: sea level trends", "https://tidesandcurrents.noaa.gov/sltrends/")]},
}

# --------------------------------------------------------------------------
# THE DICTIONARY: (term, simple definition, example)
# --------------------------------------------------------------------------
GLOSSARY = {
    "The basics": [
        ("Trend", "A steady change in one direction over a long time: up or down.", "Temperature rising about 0.4 °F every 10 years."),
        ("Time series", "The same measurement repeated over time and put in order.", "Miami's average temperature for every month since 1981."),
        ("Decade", "Ten years. We report change 'every 10 years' so the numbers are easy to compare.", "+0.4 °F every 10 years = +4 °F in a century."),
        ("Seasons (seasonal cycle)", "The pattern that repeats every year, like hot summers and mild winters. We remove it before looking for a trend, so a hot August is only compared with other Augusts.", "Is this July warmer than a normal July?"),
        ("Noise", "Random ups and downs that are not part of any trend.", "One very rainy year does not mean Florida is getting wetter."),
        ("Trend line", "The straight line that best follows the data. Its tilt shows the direction and speed of change.", "A line tilting up means a rising trend."),
    ],
    "How sure are we?": [
        ("Statistically significant", "Very unlikely to be caused by luck alone. Scientists usually require less than a 5% chance of luck.", "'Very sure' on this site."),
        ("p-value", "The chance of seeing a trend this strong if nothing were really changing. Smaller means stronger evidence.", "p = 0.03 means a 3% chance it is just luck."),
        ("Mann-Kendall test", "Compares every month with every later month. If later months are higher (or lower) far more often than chance allows, there is a trend.", "Our main test."),
        ("Sen's slope", "The typical rate of change between all pairs of months. One strange value barely affects it.", "The 'every 10 years' number."),
        ("Confidence interval", "A range that very likely contains the true rate of change.", "Between 0.3 and 0.5 °F every 10 years."),
    ],
    "Florida and the data": [
        ("Dew point", "The temperature at which air becomes full of water. A higher dew point means muggier air.", "A dew point of 75 °F (24 °C) feels oppressive."),
        ("Heat index", "What the temperature feels like when humidity is included.", "90 °F with high humidity can feel like 105 °F."),
        ("Urban heat island", "Cities are warmer than the countryside because pavement and buildings store heat.", "Downtown Miami vs. the Everglades at night."),
        ("Tide gauge", "An instrument at the coast that measures the height of the sea every few minutes. Monthly averages remove the tides.", "Key West's gauge has measured the sea since 1913."),
        ("Relative sea level", "Sea level compared with the land next to it. It rises if the ocean rises, or if the land sinks.", "What a tide gauge measures, and what matters for flooding."),
        ("Sunny-day flooding", "Flooding at very high tides, even with no rain or storm.", "Streets in Miami Beach flooding during autumn 'king tides'."),
        ("El Niño / La Niña", "Natural swings in Pacific Ocean temperature that change weather worldwide for a year or two.", "El Niño winters are usually wetter in Florida."),
        ("MERRA-2", "NASA's computer reconstruction of the weather since 1980, built from satellites, weather balloons and ground stations.", "Our temperature, rain and humidity data."),
        ("NASA POWER", "A free NASA service that delivers MERRA-2 data for any point on Earth.", "This site downloads Florida data from it."),
        ("Resolution", "The size of the smallest area the data can show.", "MERRA-2 squares are about 50 km (30 miles) wide."),
    ],
}
