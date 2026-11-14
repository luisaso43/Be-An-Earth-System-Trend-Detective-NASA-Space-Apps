---
version: 1
slug: "site-index-html"
primary_target: "site/index.html"
related_targets: ["site/style.css","site/app.js"]
---

# Surface brief: site (all pages of the static app)

Scope: every page of `site/` (My area, Beginner's guide, Florida map, Compare places, Plan a trip, How it works). Visitor mode: Operate (My area, map, compare, trip); the guide and How it works read as Read pages inside the same world.

Audience and job: Floridians on phones, Space Apps judges on laptops, students. Pick a place, get four plain answers with how sure we are, then read the evidence. Most important pages: Beginner's guide and My area.

Constraints: static HTML/CSS/JS on Vercel, Plotly from CDN, trilingual text through i18n.js, US/metric units, no horizontal scroll at phone width. User steer: "this is a NASA hackathon project so make it look modern."

## Direction contract

THESIS: Launch Webcast. Every answer is a live readout on a dark broadcast surface: thin big figures, small tracked labels, a certainty meter. It refuses the category default of white stat cards with a blue accent and soft shadows.

OWN-WORLD: Near-black ground #05070C with a faint cyan/orange horizon glow; panels #0D1320 to #111A2B separated by 1px #1E293B seams, no drop shadows. Cyan #22D3EE owns selection and "very sure"; orange #F97316 is the second series and the one primary action; amber #FBBF24 "not sure yet"; slate #94A3B8 "no real evidence". Sora 300 for display and figures, Sora 600 tracked uppercase labels, Atkinson Hyperlegible Next for reading. Lucide-style 1.75 stroke icons, no emoji.

STORY: The visitor sees the four readouts for their place within one screen, understands how sure each one is from a three-segment meter and line style (solid, dashed, dotted), then opens the evidence chart, the causes, and the expert table.

FIRST VIEWPORT: Sticky translucent header: brand + language/units pills on row one, page tabs on row two. Left: light-weight 3.6rem headline, lead, place select. Right: dark night map with the place glowing cyan. Below: the guide banner, then four readout cards (figure, since-year, answer word in verdict colour, per-decade, meter, "See the evidence").

FORM: Picked card "Launch Webcast" (IMPECCABLE'S PICK, my top grounded candidate in re-roll round 2, steered modern). seed:95ee70315af12c1a. Signature interaction: readout figures roll digit by digit to their new value when the place changes (off under reduced motion); one entrance per page visit.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Dark was the user's pick; outdoor phone legibility is held by high-contrast text tokens, not by a light theme.
