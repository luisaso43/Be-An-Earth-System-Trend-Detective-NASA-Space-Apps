# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A mixed audience, weighted equally (confirmed by the team):
- Everyday Floridians, often on a phone, checking whether their own town is getting hotter, rainier, muggier, or seeing the sea rise. Some read Spanish or Haitian Creole first.
- NASA Space Apps 2026 judges, usually on a laptop, scoring clarity, scientific soundness and polish.
- Students and classrooms learning how to read a climate trend.

None of them are assumed to know statistics.

## Product Purpose

Earth Data Detective: Florida turns 40+ years of NASA and NOAA measurements into plain-language answers to four questions for any Florida place: Is it getting hotter? Is the rain changing? Is it getting muggier? Is the sea rising? Each answer says how much it changed, how fast, how sure we are (statistical significance), and why it might be happening. Success: a non-expert leaves able to say what is changing where they live and how confident the evidence is.

Built for the NASA Space Apps 2026 challenge "Be an Earth Systems Trend Detective!".

## Positioning

Every answer carries its own honesty: a real trend test (Mann-Kendall, Sen's slope, regression with confidence interval) runs in the visitor's browser on the real records, and the result is stated as "Very sure / Not sure yet / No real evidence" rather than as a scary headline. It also tells you how many more years of data would settle an uncertain trend.

## Operating Context

- Static site (`site/`, vanilla HTML/CSS/JS, Plotly from CDN) hosted on Vercel; a Streamlit version (`app.py`) mirrors it.
- Pages: My area, Beginner's guide, Florida map, Compare places, Plan a trip, How it works (with searchable dictionary).
- Language switcher: English, Español, Kreyòl. Units switcher: US (°F, inches) or Metric (°C, mm).
- Most important pages (team): Beginner's guide and My area.

## Capabilities and Constraints

- Topics: temperature (MERRA-2 T2M), rain (PRECTOTCORR), humidity (dew point T2MDEW) for 13 places and 26 map points; sea level from 14 NOAA tide gauges, coastal places only.
- Verdict tiers: significant p < 0.05, possible 0.05–0.25, none above 0.25.
- No build step and no Node; data ships as `site/data.json` produced by `build_site_data.py`.
- All UI text is translated through `i18n.js` / `i18n-data.js`; new copy needs all three languages.
- Must work at phone width without horizontal scroll.

## Brand Commitments

- Name: "Earth Data Detective: Florida". The team said the current look carries no binding commitments; only features and content must stay.

## Evidence on Hand

- Real data: `data/power/`, `data/tides/`, packed into `site/data.json`.
- No photographs, logos, testimonials or user counts exist. Do not invent any.

## Product Principles

1. Plain words first, statistics on request.
2. Always say how sure we are; never overstate a trend.
3. A phone user in Miami and a judge on a laptop get the same answer in under a minute.
4. Every language is a first-class language.
5. Show the evidence (the chart, the numbers), not just the verdict.

## Accessibility & Inclusion

- Trilingual (English, Spanish, Haitian Creole).
- Readable by non-experts and teens; verdicts must never rely on color alone.
