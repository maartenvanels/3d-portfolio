import { profile } from "./content.mjs";

export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const arrow =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const external = '<span aria-hidden="true">↗</span>';
const tags = (items) =>
  '<ul class="tags">' +
  items.map((t) => "<li>" + escape(t) + "</li>").join("") +
  "</ul>";
const icons = {
  wave: '<path d="M3 12h3l3-8 6 16 3-8h3"/>',
  system:
    '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/><path d="M6 9v9h9M9 6h9v9"/>',
  people:
    '<circle cx="8" cy="8" r="3"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5v2"/>',
};

function illustration(type) {
  const art = {
    power:
      '<rect x="90" y="67" width="105" height="92" rx="6"/><path d="M195 101h83m-8-6 8 6-8 6M278 125h-83m8-6-8 6 8 6"/><rect x="278" y="67" width="112" height="92" rx="6"/><path d="m144 85-20 31h22l-9 24 28-34h-23z"/><circle cx="334" cy="113" r="26"/><path d="M315 113q10-23 20 0t19 0"/><path class="accent-stroke" d="M105 178h269"/><text x="140" y="47">ENERGY</text><text x="306" y="47">MOTION</text>',
    cloud:
      '<rect x="72" y="117" width="102" height="66" rx="4"/><path d="M87 131h72m-72 12h72m-72 12h45M176 150h126v-38"/><path d="M279 110h72a23 23 0 0 0 0-46 31 31 0 0 0-60-2 24 24 0 0 0-12 48z"/><circle class="accent-stroke" cx="236" cy="150" r="10"/><path class="accent-stroke" d="M118 86V52h103m-7-6 7 6-7 6"/>',
    process:
      '<rect x="69" y="138" width="338" height="28" rx="12"/><path d="M92 166v22m292-22v22M127 135v-25h34v25M198 135v-25h34v25M269 135v-25h34v25M150 82V48h137v47m-19-11 19 14 19-14"/><path class="accent-stroke" d="M95 152h270m-8-6 8 6-8 6"/><circle cx="83" cy="152" r="6"/><circle cx="393" cy="152" r="6"/>',
    code: '<rect x="74" y="44" width="331" height="142" rx="6"/><path d="M74 72h331"/><circle cx="89" cy="59" r="2"/><circle cx="101" cy="59" r="2"/><circle cx="113" cy="59" r="2"/><text x="95" y="103">var db = DbcReader.LoadFile(…);</text><text x="95" y="129">var signal = db.DecodeMessage(</text><text class="accent-fill" x="115" y="154">"Powertrain", frame);</text>',
    states:
      '<rect x="63" y="87" width="88" height="49" rx="24"/><rect x="196" y="87" width="88" height="49" rx="24"/><rect x="329" y="87" width="88" height="49" rx="24"/><path d="M151 111h45m-6-6 6 6-6 6M284 111h45m-6-6 6 6-6 6M373 137v31H107v-30m-6 6 6-6 6 6"/><text x="93" y="116">IDLE</text><text class="accent-fill" x="225" y="116">RUN</text><text x="353" y="116">DONE</text><circle class="accent-stroke" cx="240" cy="62" r="5"/>',
  };
  return (
    '<svg viewBox="0 0 480 226" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
    art[type] +
    "</svg>"
  );
}

function cityboyImage(root, en) {
  return `<img src="${root}assets/cityboy-studio.jpg" width="1400" height="820" loading="lazy" decoding="async" alt="${en ? "Original 3D study of the three-axle Spierings City-boy with its jib folded for transport" : "Eigen 3D-model van de drieassige Spierings City-boy met de giek opgevouwen voor transport"}">`;
}

function projectCard(p, c, root, en) {
  return `<article class="project" id="project-${p.id}" data-category="${p.category}">
    <div class="project-art art-${p.visual}">${p.visual === "crane" ? cityboyImage(root, en) : illustration(p.visual)}<span class="art-index">${escape(p.tags[0])}</span></div>
    <div class="project-body"><p class="eyebrow">${escape(p.label)}</p><h3>${escape(p.title)}</h3><p class="project-subtitle">${escape(p.subtitle)}</p><p>${escape(p.description)}</p>${tags(p.tags)}
    <details><summary>${escape(c.contribution)}<span aria-hidden="true">+</span></summary><div class="project-detail"><h4>${escape(c.context)}</h4><p>${escape(p.challenge)}</p><h4>${escape(c.contribution)}</h4><p>${escape(p.contribution)}</p><h4>${escape(c.result)}</h4><p>${escape(p.result)}</p></div></details>
    ${p.url ? `<div class="project-links"><a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">${escape(c.repo)} ${external}</a>${p.live ? `<a href="${escape(p.live)}" target="_blank" rel="noopener noreferrer">${escape(c.visit)} ${external}</a>` : ""}</div>` : ""}
    </div></article>`;
}

export function page(c, lang) {
  const en = lang === "en";
  const root = en ? "../" : "./";
  const url = profile.site + (en ? "en/" : "");
  const t = (nl, eng) => escape(en ? eng : nl);
  const ids = ["expertise", "projects", "about", "contact"];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: "Software & Innovation Engineer",
    url,
    image: profile.site + "maartenVanEls.jpg",
    knowsAbout: [
      "Control Systems Engineering",
      "Industrial Automation",
      "Technical Leadership",
      "Electric and Hybrid Powertrains",
    ],
    sameAs: [profile.github, profile.linkedin],
  };
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(c.title)}</title><meta name="description" content="${escape(c.description)}">
  <meta name="theme-color" content="#f5f5ef">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="nl" href="${profile.site}"><link rel="alternate" hreflang="en" href="${profile.site}en/"><link rel="alternate" hreflang="x-default" href="${profile.site}">
  <meta property="og:type" content="website"><meta property="og:title" content="${escape(c.title)}"><meta property="og:description" content="${escape(c.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${profile.site}maartenVanEls.jpg"><meta property="og:image:alt" content="Maarten van Els"><meta property="og:locale" content="${en ? "en_GB" : "nl_NL"}">
  <meta name="twitter:card" content="summary"><link rel="icon" href="${root}logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${root}styles.css">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
  <script type="module" src="${root}main.js"></script>
</head>
<body id="top">
<a class="skip-link" href="#main">${escape(c.skip)}</a>
<header class="site-header"><div class="container header-inner">
  <a class="brand" href="${root}${en ? "en/" : ""}" aria-label="Maarten van Els — ${escape(c.home)}"><img class="brand-mark" src="${root}logo.svg" width="46" height="46" alt=""><span>Maarten van Els<span class="brand-degree">MSc</span></span></a>
  <button class="menu-toggle" aria-expanded="false" aria-controls="navigation" data-open="${escape(c.menu)}" data-close="${escape(c.closeMenu)}" hidden>${escape(c.menu)}<span aria-hidden="true">☰</span></button>
  <nav id="navigation" aria-label="${t("Hoofdnavigatie", "Main navigation")}">${c.nav.map((label, i) => `<a href="#${ids[i]}">${escape(label)}</a>`).join("")}</nav>
  <div class="language-switch" aria-label="${escape(c.language)}"><a href="${root}" lang="nl" hreflang="nl" ${!en ? 'aria-current="page"' : ""}>NL</a><span aria-hidden="true">/</span><a href="${root}en/" lang="en" hreflang="en" ${en ? 'aria-current="page"' : ""}>EN</a></div>
</div></header>
<main id="main">
  <section class="hero container" aria-labelledby="hero-heading">
    <div class="hero-copy"><p class="eyebrow"><span class="status-dot" aria-hidden="true"></span>${escape(c.eyebrow)}</p>
      <h1 id="hero-heading">${escape(c.hero[0])}<br>${escape(c.hero[1])}<br><em>${escape(c.hero[2])}</em></h1>
      <p class="hero-intro">${escape(c.intro)}</p>
      <div class="hero-actions"><a class="button button-dark" href="#projects">${escape(c.workCta)} ${arrow}</a><a class="text-link" href="#about">${escape(c.aboutCta)} <span aria-hidden="true">↗</span></a></div>
      <div class="hero-signature"><img src="${root}maartenVanEls.jpg" alt="Maarten van Els" width="48" height="48"><div><strong>Maarten van Els</strong><span>${escape(c.credentials[0])}</span></div></div>
    </div>
    <div class="workshop" id="workshop" data-language="${lang}">
      <div class="workshop-heading"><div><p class="eyebrow">MAARTEN’S WORKSHOP</p><h2>${t("Mijn wereld, in beweging.", "My world, in motion.")}</h2></div><span class="dimension-label">3D</span></div>
      <div class="world-stage" id="world-stage">
        <div class="world-fallback">${cityboyImage(root, en)}<p id="world-status" role="status">${t("Een kijkje in de techniek achter mijn werk.", "A look at the engineering behind my work.")}</p></div>
        <canvas id="world-canvas" aria-label="${t("Interactieve 3D-werkplaats. Gebruik de knoppen hieronder om de omgeving te verkennen.", "Interactive 3D workshop. Use the controls below to explore the scene.")}" hidden></canvas>
        <div class="world-caption" hidden><span class="status-dot" aria-hidden="true"></span><span id="zone-label">${t("De werkplaats", "The workshop")}</span></div>
        <div class="world-tools" hidden>
          <button data-world-action="zoom-in" aria-label="${t("Inzoomen", "Zoom in")}">+</button><button data-world-action="zoom-out" aria-label="${t("Uitzoomen", "Zoom out")}">−</button>
          <button data-world-action="reset" aria-label="${t("Camera herstellen", "Reset camera")}" title="${t("Camera herstellen", "Reset camera")}">↺</button>
          <button data-world-action="animate" aria-pressed="false" aria-label="${t("Machinebeweging aan of uit", "Toggle machine motion")}" title="${t("Machinebeweging aan of uit", "Toggle machine motion")}">▷</button>
          <button data-world-action="night" aria-pressed="false" aria-label="${t("Avondlicht", "Evening light")}" title="${t("Avondlicht", "Evening light")}">☾</button>
          <button data-world-action="expand" aria-pressed="false" aria-label="${t("Werkplaats vergroten", "Expand workshop")}" title="${t("Werkplaats vergroten", "Expand workshop")}">⤢</button>
        </div>
      </div>
      <div class="world-bottom"><div class="world-views" role="group" aria-label="${t("Camera kiezen", "Choose a camera")}" hidden>
        ${["overview", "crane", "cabin", "production", "energy"].map((id, i) => `<button data-view="${id}" aria-pressed="${i === 0}">${[t("Overzicht", "Overview"), t("Kranen", "Cranes"), t("Cabine", "Cabin"), t("Productielijn", "Production"), t("Energie", "Energy")][i]}</button>`).join("")}
      </div><p class="world-hint">${t("Sleep om te draaien · kies een onderdeel om te ontdekken", "Drag to rotate · select a part to explore")}</p><a class="world-project-link" href="#projects" id="world-project-link">${t("Ontdek de projecten", "Explore the projects")} ${external}</a></div>
      <button class="world-retry button" hidden>${t("3D opnieuw laden", "Retry loading 3D")}</button>
      <span class="workshop-note">${t("Een illustratie van mijn vakgebieden; geen productmodel.", "An illustration of my fields of work; not a product model.")}</span>
    </div>
  </section>
  <div class="specialisms container"><span>${t("TECHNIEK DIE VERBINDT", "CONNECTING THROUGH ENGINEERING")}</span><p>Industrial automation <i>/</i> Electric & hybrid powertrains <i>/</i> Technical leadership</p></div>
  <section class="section container" id="expertise" aria-labelledby="expertise-heading">
    <div class="section-heading"><div><p class="eyebrow">${escape(c.expertiseLabel)}</p><h2 id="expertise-heading">${escape(c.expertiseTitle)}</h2></div><p>${escape(c.expertiseIntro)}</p></div>
    <div class="expertise-grid">${c.expertise.map((item, i) => `<article class="expertise-card"><div class="expertise-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${icons[item.icon]}</svg><span>0${i + 1}</span></div><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p>${tags(item.tags)}</article>`).join("")}</div>
  </section>
  <section class="work-section" id="projects" aria-labelledby="projects-heading"><div class="container section">
    <div class="section-heading"><div><p class="eyebrow">${escape(c.workLabel)}</p><h2 id="projects-heading">${escape(c.workTitle)}</h2></div><p>${escape(c.workIntro)}</p></div>
    <div class="filter-bar" hidden><div class="filters" role="group" aria-label="${escape(c.filterLabel)}">${["all", "professional", "personal"].map((id, i) => `<button data-filter="${id}" aria-pressed="${i === 0}" aria-controls="project-grid">${escape(c.filters[i])}</button>`).join("")}</div><p class="project-count" role="status" data-label="${escape(c.count)}">6 ${escape(c.count)}</p></div>
    <div class="project-grid" id="project-grid">${c.projects.map((p) => projectCard(p, c, root, en)).join("")}</div>
  </div></section>
  <section class="section container about-section" id="about" aria-labelledby="about-heading">
    <div class="about-copy"><p class="eyebrow">${escape(c.aboutLabel)}</p><h2 id="about-heading">${escape(c.aboutTitle)}</h2>${c.about.map((p) => `<p>${escape(p)}</p>`).join("")}<a class="text-link" href="${profile.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ${external}</a></div>
    <div class="experience"><p class="eyebrow">${escape(c.experienceLabel)}</p><ol>${c.experience.map((item, i) => `<li${i === 0 ? ' class="current-role"' : ""}><span class="timeline-date">${escape(item.date)}</span><h3>${escape(item.role)}</h3><p class="timeline-company">${escape(item.company)}</p><p>${escape(item.text)}</p></li>`).join("")}</ol><div class="education"><span>MSc Control Systems Engineering</span><span>HAN · 2018–2021</span></div></div>
  </section>
  <section class="contact-section" id="contact" aria-labelledby="contact-heading"><div class="container contact-inner"><div><p class="eyebrow">${escape(c.contactLabel)}</p><h2 id="contact-heading">${escape(c.contactTitle)}</h2><p>${escape(c.contactText)}</p><a class="button button-light" href="mailto:${profile.email}">${escape(c.emailCta)} ${arrow}</a></div><div class="contact-links"><a href="mailto:${profile.email}">${profile.email} ${external}</a><a href="${profile.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ${external}</a><a href="${profile.github}" target="_blank" rel="noopener noreferrer">GitHub ${external}</a><span>${escape(c.credentials[1])}</span></div></div></section>
</main>
<footer class="container footer"><span>© ${new Date().getUTCFullYear()} Maarten van Els</span><span>${escape(c.footer)}</span><a href="#top">${escape(c.backTop)} ↑</a></footer>
</body></html>`.replace(/[ \t]+$/gm, "");
}
