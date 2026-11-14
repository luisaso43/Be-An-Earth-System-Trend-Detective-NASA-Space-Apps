---
name: Earth Data Detective: Florida
description: Four plain climate answers per Florida place, read out like a launch webcast, each with how sure we are.
colors:
  night-ground: "#05070C"
  night-ground-raised: "#0A0F1A"
  console-panel: "#0D1320"
  console-panel-lit: "#111A2B"
  seam: "#1E293B"
  seam-strong: "#2B3A52"
  seam-hover: "#3B4D6A"
  readout-white: "#F1F5F9"
  readout-soft: "#CBD5E1"
  telemetry-slate: "#94A3B8"
  placeholder-slate: "#7C8BA1"
  signal-cyan: "#22D3EE"
  signal-cyan-ink: "#04212A"
  ignition-orange: "#F97316"
  ignition-orange-hover: "#FB8A3C"
  ignition-orange-ink: "#1B0B00"
  hold-amber: "#FBBF24"
  nominal-green: "#34D399"
  abort-red: "#F87171"
  chart-year-line: "#475569"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 5.2vw, 3.6rem)"
    fontWeight: 300
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  figure:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 3.6vw, 3.1rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 2.2vw, 1.45rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  verdict:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 2.6vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.06rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  lead:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.02rem, 1.6vw, 1.15rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.12em"
  brand:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  meter: "2px"
  xs: "6px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  pill: "999px"
spacing:
  gutter: "16px"
  card-gap: "14px"
  card-gap-phone: "10px"
  card-pad: "20px"
  section: "44px"
  section-break: "64px"
components:
  readout-card:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.lg}"
    padding: "20px 20px 18px"
  readout-card-action:
    backgroundColor: "transparent"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.ignition-orange}"
    textColor: "{colors.ignition-orange-ink}"
    rounded: "{rounded.md}"
    padding: "12px 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ignition-orange-hover}"
  segment-tab:
    backgroundColor: "{colors.night-ground-raised}"
    textColor: "{colors.readout-soft}"
    rounded: "{rounded.pill}"
    padding: "9px 16px"
    height: "42px"
  segment-tab-selected:
    textColor: "{colors.readout-white}"
    rounded: "{rounded.pill}"
  header-pill:
    backgroundColor: "transparent"
    textColor: "{colors.telemetry-slate}"
    rounded: "{rounded.pill}"
    padding: "5px 11px"
  header-pill-on:
    backgroundColor: "{colors.readout-white}"
    textColor: "{colors.night-ground}"
  nav-tab:
    textColor: "{colors.telemetry-slate}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  nav-tab-active:
    backgroundColor: "{colors.console-panel-lit}"
    textColor: "{colors.readout-white}"
  select-field:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.readout-white}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "11px 44px 11px 16px"
    height: "48px"
  metric-strip:
    backgroundColor: "{colors.console-panel}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  note:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.readout-soft}"
    rounded: "{rounded.md}"
    padding: "14px 18px"
  disclosure:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.md}"
    padding: "14px 48px 14px 18px"
    height: "48px"
---

# Design System: Earth Data Detective: Florida

## Overview

**Creative North Star: "Launch Webcast"**

Every answer is a live readout on a dark broadcast surface. A near-black ground carries a faint horizon glow (cyan high on the right, orange low on the left) fixed behind the top of every page; on it sit flat console panels separated by 1px seams. The figures are big and thin, the labels small, tracked and uppercase, and a three-segment certainty meter sits under every answer. The feel is mission control reading out telemetry, calm and exact, rather than a dashboard of white stat cards.

The system is dense but legible: a 1200px column, four readouts across on desktop, two by two on a phone, reading text set in a hyperlegible face at 16px with long line-height. Colour is mostly withheld. Cyan marks selection and "very sure", orange is the second data series and the single primary action, amber says "not sure yet", slate says "no real evidence". Depth comes from tone steps and seams, never from drop shadows. Dark is the only theme; outdoor phone legibility is carried by high-contrast text tokens.

Motion is one authored moment per page visit (a short rise of the headline, map and cards) plus the readout figures rolling to their new value when the place changes. Everything else is a quick colour change or a small press scale.

**Key Characteristics:**
- Near-black ground with a fixed cyan/orange horizon glow, flat panels on 1px seams, no drop shadows.
- Sora 300 for big thin figures and headlines; Sora 600 tracked uppercase for labels; Atkinson Hyperlegible Next for everything you read.
- Certainty is always shown three ways: verdict colour, segments lit on a meter, and the trend line's dash style.
- Cyan is the signal colour; orange appears only as the comparison series and the one primary action.
- Lucide-style outline icons at 1.75 stroke, inline SVG, no emoji.
- One entrance per page visit, figure roll on place change, everything off under reduced motion.

## Colors

A cold, near-black instrument palette with one signal cyan, one ignition orange, and a three-step certainty code.

### Primary
- **Signal Cyan** (signal-cyan): selection everywhere (active tab icon, selected segment border and 12% fill, guide-rail marker, focus ring, links, caret, text selection at 35%), the first chart series, the place glow on maps, and the "very sure" verdict. Text on a cyan fill uses **Signal Cyan Ink** (signal-cyan-ink).

### Secondary
- **Ignition Orange** (ignition-orange): the second series in Compare places and charts, the low-left half of the horizon glow, and the single primary action button (the guide's run-simulation button) with **Ignition Orange Ink** (ignition-orange-ink) text and a lighter **Ignition Orange Hover** (ignition-orange-hover).

### Tertiary (verdict and status)
- **Hold Amber** (hold-amber): the "not sure yet" verdict (two meter segments, dashed trend line) and warning notes.
- **Telemetry Slate** (telemetry-slate): doubles as the "no real evidence" verdict (one meter segment, dotted trend line) and the muted text colour.
- **Nominal Green** (nominal-green) and **Abort Red** (abort-red): note tones only (ok, error). They never mark a verdict.

### Neutral
- **Night Ground** (night-ground): page background, map paper, chart paper behind maps, header at 82% with blur.
- **Night Ground Raised** (night-ground-raised): pill track, unselected segment fill, table header row, map placeholder, disabled ("off") readout card.
- **Console Panel** (console-panel) and **Console Panel Lit** (console-panel-lit): every panel; readout cards run a vertical gradient from lit to panel; lit is also the active nav tab and hovered disclosure.
- **Seam** (seam): every 1px panel border, divider, table rule, chart gridline and axis.
- **Seam Strong** (seam-strong): control borders (buttons, segments, selects), unlit meter segments, the scrollbar thumb, the chart hover-label border.
- **Seam Hover** (seam-hover): hovered control border on selects and segments.
- **Readout White** (readout-white): headings, figures, strong text, selected labels.
- **Readout Soft** (readout-soft): body and prose text, notes, chart text.
- **Placeholder Slate** (placeholder-slate): input placeholders only.
- **Chart Year Line** (chart-year-line): the yearly-average line and unremarkable map dots.

### Named Rules
**The Three Ways Rule.** A verdict is never colour alone. Very sure = cyan, three segments lit, solid trend line. Not sure yet = amber, two segments, dashed line. No real evidence = slate, one segment, dotted line. Any new surface that states a verdict carries the meter or the line style alongside the colour.

**The One Ignition Rule.** Orange is the second data series and the one primary action on a page. It is never a decoration, a heading colour, or a second accent for selection.

**The Tinted Note Rule.** Notes and the verdict panel take their tone by mixing it into the panel (8% fill, 28-38% border), never by a solid colour block.

## Typography

**Display Font:** Sora (with ui-sans-serif, system-ui)
**Body Font:** Atkinson Hyperlegible Next (with ui-sans-serif, system-ui, Segoe UI)

**Character:** Sora at weight 300 gives the broadcast readout its thin, wide figures and headlines; at 600, small and tracked, it becomes the telemetry label. Atkinson Hyperlegible Next does all the reading, chosen for non-experts and outdoor phone screens.

### Hierarchy
- **Display** (Sora 300, clamp(2.1rem, 5.2vw, 3.6rem), 1.06, -0.035em, max 18ch): one page headline (h1); 2rem on phones in My area.
- **Figure** (Sora 300, clamp(2.2rem, 3.6vw, 3.1rem), 1, -0.04em, tabular figures, no wrap): readout card numbers; the unit sits at 0.42em, weight 400, slate. Metric-strip values use the same voice at 1.75rem (1.35rem on phones).
- **Verdict** (Sora 400, clamp(1.3rem, 2.6vw, 1.75rem), 1.25): the verdict panel headline.
- **Headline** (Sora 600, clamp(1.2rem, 2.2vw, 1.45rem), 1.25, -0.02em): section headings (h2).
- **Title** (Sora 600, 1.06rem, 1.3): the answer word on a readout card, in its verdict colour; also the place select text (1.05rem).
- **Body** (Atkinson 400, 16px, 1.6): all reading text, in readout-soft; prose capped at 820px (guide column 760px), lead at 62ch.
- **Label** (Sora 600, 0.7-0.72rem, 0.12-0.14em, uppercase, slate): readout questions, field labels, metric labels, table headers, glossary groups.
- **Brand** (Sora 700, 0.82rem, 0.12em, uppercase): the wordmark only.

### Named Rules
**The Thin Figure Rule.** Numbers that answer a question are Sora 300 with tabular figures and negative tracking; weight never goes up to make a figure louder, size does.

**The Reading Face Rule.** Anything a visitor reads as a sentence (body, notes, table cells, chart text, hover labels) is Atkinson Hyperlegible Next. Sora is for figures, headings, labels and controls.

## Layout

A single 1200px centred column with a 16px gutter (safe-area aware). Section headings sit 44px apart (36px on phones); major breaks use 64px with a top seam (48px on phones). The My area hero is a two-column grid (1.15fr text, 1fr map, 40px gap, bottom-aligned) above four readout cards in a 14px-gap grid. Grid children are allowed to shrink below content width so charts and selects stay inside the screen.

Breakpoints: 1100px and up shows the guide's sticky running-order rail (760px reading column plus 240px rail, 64px apart). At 900px cards go two across and the hero stacks. At 760px the phone layout takes over: the header stops being sticky and scrolls away, language and unit pills compact (units read °F / °C), and My area reorders to headline and place picker, then the cards title, then the four readouts in a 2x2 grid (10px gap), then a 160px map, the guide banner, and the evidence. Phone readout cards hide the per-decade line, shrink the "See the evidence" button to a corner arrow, and make the whole card the tap target. At 640px metric strips stack vertically. At 560px other card grids, compare pairs, and guide grids go to one column.

**The Answers First Rule.** On a phone the four readouts appear before the map and before any explanation; nothing is placed between the place picker and the cards.

## Elevation & Depth

Flat. Depth is tonal: night ground, then raised ground, then panel, then lit panel, with 1px seams doing the separation. The only light in the system is atmospheric: the fixed horizon glow (two radial gradients, cyan at 20% and orange at 10%) and the verdict panel's tinted corner glow. Rings, not shadows, carry the remaining emphasis.

### Shadow Vocabulary
- **Beacon ring** (`box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.14)`): the brand's cyan dot.
- **Active tab seam** (`box-shadow: inset 0 0 0 1px #2B3A52`): the active page tab, a border drawn inside.
- **Field focus ring** (`box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.22)`): selects and inputs on keyboard focus, with a cyan border.

### Named Rules
**The No Drop Shadow Rule.** No offset or blurred drop shadows anywhere. A panel separates from the ground by tone and a seam; a state shows by border colour.

## Shapes

Gently rounded instruments. Large panels (readout cards, verdict panel, metric strip, charts, maps) use 14px; notes, details, tables, selects and the primary button 12px; small buttons and nav tabs 10px; code 6px; meter segments 2px. Pills and segmented tabs are fully round. Disclosure and select chevrons are two-sided CSS strokes rotated 45 degrees, not glyphs. A disabled readout card switches to a dashed border on the raised ground.

## Components

### Header
Sticky translucent bar (night ground at 82%, saturate 140% and 14px blur, bottom seam). Row one: beacon dot plus uppercase wordmark (the "Florida" half in slate after a seam-coloured middle dot), and on the right two pill groups (language, units). Row two: the page tabs as a horizontally scrolling lower bar. Not sticky below 760px.
- **Pills:** raised-ground track with a seam border, buttons in Sora 600 0.78rem slate; the chosen one inverts to readout white on night ground.
- **Nav tabs:** icon plus label, slate, 10px radius; hover lifts to raised ground; active is lit panel with an inset seam and a cyan icon.

### Readout Card (signature)
Lit-to-panel vertical gradient, seam border, 14px radius. Top to bottom: uppercase label question with its topic icon, the thin figure with a small unit, "since YEAR" in slate, the answer word in verdict colour (title type), the per-decade rate, the certainty meter with "How sure: ...", and a full-width outline "See the evidence" button with a cyan arrow. The whole card is the link (stretched button); hover strengthens the card seam, turns the button border cyan with a 6% fill and nudges the arrow 3px; press scales the card to 0.985.

### Certainty Meter (signature)
Three 14x6px segments (10px wide on phone cards), 3px apart, 2px radius, unlit in seam-strong. Level 3 fills all three cyan, level 2 the first two amber, level 1 the first one slate. Always hidden from assistive tech; the "How sure" words carry the meaning.

### Verdict Panel
Panel with a radial corner glow of the verdict colour at 12% and a border mixed 38% verdict colour into the seam; verdict-type headline in white, explanation lines in readout soft. 22px 24px padding (18px on phones).

### Metric Strip
One panel split into equal columns by 1px seams; each cell has an uppercase label, a thin Sora 300 value with tabular figures, and a slate remark. Stacks into rows at 640px.

### Segmented Tabs
Horizontally scrolling row of fully round buttons (42px tall, raised-ground fill, seam-strong border, readout-soft text). Selected or pressed: 12% cyan fill, cyan border, white text, cyan icon. Month pickers use a 40px variant.

### Buttons
- **Primary (one per page):** solid ignition orange, dark orange ink, Sora 600 1rem, 12px radius, 48px tall.
- **Outline:** transparent with a seam-strong border, 10px radius, 44px tall (download links, year controls, card actions); hover turns the border cyan.
- **Mission button:** panel tile, 64px tall, label left and cyan arrow right; hover cyan border, lit panel, arrow nudge.
- **Press:** every button and nav tab scales to 0.97 on press.

### Inputs / Fields
Panel fill, seam-strong border, 12px radius, 48px tall, chevron drawn in CSS. The place select sets its value in Sora 600 1.05rem. Hover border goes to seam hover; focus goes cyan with a 3px cyan ring. Search adds a slate leading icon. Labels above fields are the uppercase label style with a cyan icon.

### Notes
Info, ok, warn and error share one shape (12px radius, 14px 18px padding, readout-soft text) and differ only by tone mixed into the panel: cyan, green, amber, red.

### Disclosure and Tables
Details are panels with a 48px summary and a rotating CSS chevron; hover fills lit panel. Tables sit in a seam-bordered 12px scroll box; header cells use the uppercase label style on raised ground, body cells readout soft with tabular figures, rows split by seams.

### Guide Rail
On wide screens a sticky running order beside the guide: a left seam with two-digit counters (Sora 600, seam-strong); the current section turns white with a 2px cyan left edge and a cyan counter.

### Charts and Maps
Plotly on a transparent panel: Atkinson text in readout soft, slate axis titles and ticks, seam gridlines on y only, no zero line, unified x hover with a panel label and seam-strong border, horizontal legend above the plot, no mode bar. Yearly averages are a 1.5px chart-year-line with readout-soft dots. Trend lines are 3.5px in the verdict colour (or cyan / orange per place in Compare) with the verdict's dash style. Maps use the CARTO dark-matter basemap on night-ground paper (no basemap labels on the small map, labels kept on the Florida map); the chosen place is a cyan dot. Map change scales diverge through a neutral #E2E8F0 midpoint (blue to red for heat, brown to teal for rain). Map attribution is kept, restyled in slate on night ground.

### Motion
- **Entrance:** once per page visit, the headline, lead, field and map rise 10px over 520ms (ease-out cubic-bezier(0.23, 1, 0.32, 1)), cards staggered 55ms apart from 140ms.
- **Figure roll:** readout figures count from their last value to the new one over 650ms with an exponential ease-out when the place changes.
- **State:** colour transitions 160ms; press scale 140ms; arrows and chevrons 200ms.
- **Reduced motion:** all animation and transition durations collapse to 1ms, the figure roll paints the final value directly, and the loading spinner stops.

## Do's and Don'ts

### Do:
- **Do** state every verdict three ways: verdict colour, a three-segment meter, and solid / dashed / dotted trend line.
- **Do** set answer figures in Sora 300 with tabular figures and a small slate unit at 0.42em.
- **Do** separate panels with 1px seams (#1E293B) and tone steps, and show states with border colour.
- **Do** keep cyan for selection, focus, links and "very sure"; keep orange for the second series and the one primary action.
- **Do** use the uppercase tracked Sora 600 label for functional labels: card questions, field labels, metric labels, table headers.
- **Do** put the four readouts directly after the place picker on phones, two by two, with the whole card as the tap target.
- **Do** keep one entrance per page visit and turn the figure roll off under reduced motion.
- **Do** use inline outline icons at 1.75 stroke, 16-18px.

### Don't:
- **Don't** use drop shadows; the only box-shadows are the beacon ring, the inset active-tab seam, and the focus ring.
- **Don't** show a verdict by colour alone, and don't use green or red for verdicts; they belong to notes.
- **Don't** add a light theme or white stat cards with a blue accent and soft shadows; this world is dark.
- **Don't** use orange as a heading, decoration or second selection colour.
- **Don't** use emoji or glyph characters as icons.
- **Don't** set sentences in Sora or figures in Atkinson.
