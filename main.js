const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
document.documentElement.classList.add("js-ready");
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  menu.firstChild.textContent = menu.dataset.open;
  navigation.classList.remove("is-open");
}
menu.hidden = false;
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.firstChild.textContent = open ? menu.dataset.close : menu.dataset.open;
  navigation.classList.toggle("is-open", open);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menu.focus();
  }
});
const cards = [...document.querySelectorAll(".project")];
const filters = [...document.querySelectorAll("[data-filter]")];
function filterProjects(category) {
  for (const card of cards)
    card.hidden = category !== "all" && card.dataset.category !== category;
  for (const button of filters)
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === category),
    );
  const count = document.querySelector(".project-count");
  count.textContent =
    cards.filter((card) => !card.hidden).length + " " + count.dataset.label;
}
document.querySelector(".filter-bar").hidden = false;
for (const button of filters)
  button.addEventListener("click", () => filterProjects(button.dataset.filter));
function revealLinkedProject() {
  const card = cards.find((item) => "#" + item.id === location.hash);
  if (!card) return;
  filterProjects("all");
  card.querySelector("details").open = true;
  card.scrollIntoView({ behavior: "instant", block: "start" });
}
window.addEventListener("hashchange", revealLinkedProject);
revealLinkedProject();
const workshop = document.querySelector("#workshop");
const stage = document.querySelector("#world-stage");
const canvas = document.querySelector("#world-canvas");
const fallback = document.querySelector(".world-fallback");
const status = document.querySelector("#world-status");
const retry = document.querySelector(".world-retry");
const translate = (nl, en) => (workshop.dataset.language === "en" ? en : nl);
const zones = {
  overview: [
    translate("De werkplaats", "The workshop"),
    "projects",
    translate("Ontdek de projecten", "Explore the projects"),
  ],
  crane: [
    "City-boy & eLift",
    "project-cityboy",
    translate("Bekijk City-boy v2", "Explore City-boy v2"),
  ],
  production: [
    translate("Industriële automatisering", "Industrial automation"),
    "project-automation",
    translate("Bekijk de productielijnen", "Explore production lines"),
  ],
  energy: [
    translate("Elektrificatie & energie", "Electrification & energy"),
    "project-elift",
    translate("Bekijk eLift", "Explore eLift"),
  ],
  connected: [
    "Connected machinery",
    "project-connected",
    translate("Bekijk connected machinery", "Explore connected machinery"),
  ],
};
let world,
  loading = false,
  lastFocus;
function showZone(zone) {
  const [label, id, title] = zones[zone] || zones.overview;
  document.querySelector("#zone-label").textContent = label;
  const link = document.querySelector("#world-project-link");
  link.href = "#" + id;
  link.firstChild.textContent = title + " ";
  for (const button of document.querySelectorAll("[data-view]"))
    button.setAttribute("aria-pressed", String(button.dataset.view === zone));
}
function expandWorld(expanded) {
  if (expanded) lastFocus = document.activeElement;
  workshop.classList.toggle("is-expanded", expanded);
  document.body.classList.toggle("world-expanded", expanded);
  const button = document.querySelector('[data-world-action="expand"]');
  button.setAttribute("aria-pressed", String(expanded));
  button.setAttribute(
    "aria-label",
    translate(
      expanded ? "Werkplaats verkleinen" : "Werkplaats vergroten",
      expanded ? "Close expanded workshop" : "Expand workshop",
    ),
  );
  const rest = document.querySelectorAll(
    ".site-header,main > :not(.hero),.hero-copy,.footer",
  );
  for (const section of rest) section.inert = expanded;
  if (expanded) {
    workshop.setAttribute("role", "dialog");
    workshop.setAttribute("aria-modal", "true");
    workshop.setAttribute(
      "aria-label",
      translate("3D-werkplaats", "3D workshop"),
    );
    button.focus();
  } else {
    workshop.removeAttribute("role");
    workshop.removeAttribute("aria-modal");
    workshop.removeAttribute("aria-label");
    lastFocus?.focus();
  }
}
document.addEventListener("keydown", (event) => {
  if (!workshop.classList.contains("is-expanded")) return;
  if (event.key === "Escape") expandWorld(false);
  if (event.key === "Tab") {
    const items = [
      ...workshop.querySelectorAll("button:not([hidden]),a[href]"),
    ].filter((el) => el.checkVisibility());
    const first = items[0],
      last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
document.querySelector("#world-project-link").addEventListener("click", () => {
  if (workshop.classList.contains("is-expanded")) expandWorld(false);
  filterProjects("all");
});
function worldError(message) {
  world?.dispose();
  world = undefined;
  canvas.hidden = true;
  fallback.hidden = false;
  status.textContent = message;
  retry.hidden = false;
  delete workshop.dataset.ready;
  for (const group of document.querySelectorAll(
    ".world-tools,.world-views,.world-caption",
  ))
    group.hidden = true;
}
async function loadWorld() {
  if (loading || world) return;
  loading = true;
  retry.hidden = true;
  status.textContent = translate(
    "De werkplaats wordt opgebouwd…",
    "Building the workshop…",
  );
  try {
    const { mountWorld } = await import("./assets/world.js");
    world = await mountWorld({
      canvas,
      stage,
      onZone: showZone,
      onError: () =>
        worldError(
          translate(
            "De 3D-weergave is onderbroken. Je kunt opnieuw laden.",
            "The 3D view was interrupted. You can reload it.",
          ),
        ),
    });
    canvas.hidden = false;
    fallback.hidden = true;
    for (const group of document.querySelectorAll(
      ".world-tools,.world-views,.world-caption",
    ))
      group.hidden = false;
    workshop.dataset.ready = "true";
    if (matchMedia("(pointer: coarse)").matches) {
      document.querySelector(".world-hint").textContent = translate(
        "Draai met twee vingers · tik op een onderdeel om te ontdekken",
        "Rotate with two fingers · tap a part to explore",
      );
    }
  } catch (error) {
    worldError(
      translate(
        "3D is hier niet beschikbaar. Ontdek mijn werk via de projecten hieronder.",
        "3D is unavailable here. Explore my work in the projects below.",
      ),
    );
    console.warn("Workshop could not start:", error.message);
  } finally {
    loading = false;
  }
}
retry.addEventListener("click", loadWorld);
for (const button of document.querySelectorAll("[data-view]"))
  button.addEventListener("click", () => world?.setView(button.dataset.view));
for (const button of document.querySelectorAll("[data-world-action]"))
  button.addEventListener("click", () => {
    const action = button.dataset.worldAction;
    if (action === "expand") {
      expandWorld(!workshop.classList.contains("is-expanded"));
      return;
    }
    if (!world) return;
    if (action === "zoom-in") world.zoom(0.83);
    if (action === "zoom-out") world.zoom(1.2);
    if (action === "reset") world.setView("overview");
    if (action === "animate" || action === "night") {
      const enabled = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(enabled));
      if (action === "animate") {
        world.setMotion(enabled);
        button.textContent = enabled ? "Ⅱ" : "▷";
      } else {
        world.setNight(enabled);
        workshop.classList.toggle("is-night", enabled);
      }
    }
  });
const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      loadWorld();
    }
  },
  { rootMargin: "100px" },
);
observer.observe(stage);
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) world?.dispose();
});
