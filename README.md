# Maarten van Els — portfolio

A bilingual, statically generated portfolio with a custom, on-demand Three.js workshop.

## Develop

Use Node.js 22 or newer.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:8765/3d-portfolio/. Run the build again after changing the content, template or 3D source; reload the browser after changes.

## Edit

- `src/content.mjs`: Dutch and English profile, projects and career history.
- `src/template.mjs`: semantic HTML and small project illustrations.
- `src/world.mjs`: the completely rebuilt 3D workshop and its lifecycle.
- `styles.css`: responsive design.
- `main.js`: navigation, project filters, accessible expanded viewer and lazy loading.
- `scripts/build.mjs`: generates both languages and bundles Three.js locally.

Professional contributions are based on the current profile/CV. Company projects are distinguished from personal open-source work. The workshop is an illustration of disciplines, not a replica or engineering specification of an actual crane.

## 3D performance

The scene loads when its viewport approaches the screen. Static meshes are instanced by geometry and material. Models share primitive geometries and materials; there are no remote assets or post-processing passes. Resolution is capped, with smaller shadow maps on mobile. Shadow maps are only refreshed when needed.

The renderer sleeps when the scene is idle, outside the viewport or in a hidden tab. Machine animation is opt-in. Camera transitions respect reduced motion. One finger scrolls on mobile; two fingers rotate. Every project is also available without WebGL or JavaScript.

The canvas exposes frame, draw-call and triangle counters as data attributes for QA. Resources, listeners and observers are released on teardown.

## GitHub Pages

The existing site serves the repository root from `main`. Commit the generated `index.html`, `en/index.html`, `assets/world.js`, `404.html`, `robots.txt`, `sitemap.xml` and `.nojekyll` with their sources. Updating a development branch does not publish the site; merging into `main` triggers the existing Pages deployment.

The canonical URL is https://maartenvanels.github.io/3d-portfolio/. Change `profile.site` and rebuild if a custom domain is configured.

## Credits

Three.js is MIT licensed; its license notice is preserved in the bundled module. The existing portrait is retained. CanTools.NET is described as an independent port of the cantools community project.
