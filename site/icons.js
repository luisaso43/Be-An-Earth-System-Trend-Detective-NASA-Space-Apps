/* icons.js - one helper for the SVG icon set defined at the top of index.html */
window.Icon = (name, cls = "ic") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
window.TOPIC_ICON = { temperature: "thermo", rainfall: "rain", humidity: "drops", sea_level: "waves" };
