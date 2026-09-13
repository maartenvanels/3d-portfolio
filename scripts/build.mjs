import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { content, profile } from "../src/content.mjs";
import { page } from "../src/template.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(root + "en", { recursive: true });
await mkdir(root + "assets", { recursive: true });
await build({
  entryPoints: [root + "src/world.mjs"],
  outfile: root + "assets/world.js",
  bundle: true,
  format: "esm",
  minify: true,
  target: ["es2022"],
  legalComments: "eof",
});
for (const [lang, data] of Object.entries(content)) {
  await writeFile(
    root + (lang === "nl" ? "index.html" : "en/index.html"),
    page(data, lang),
  );
}
await writeFile(
  root + "robots.txt",
  "User-agent: *\nAllow: /\nSitemap: " + profile.site + "sitemap.xml\n",
);
await writeFile(
  root + "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${profile.site}</loc></url>
  <url><loc>${profile.site}en/</loc></url>
</urlset>\n`,
);
await writeFile(root + ".nojekyll", "");
await writeFile(
  root + "404.html",
  `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Pagina niet gevonden — Maarten van Els</title><link rel="stylesheet" href="${profile.site}styles.css"></head><body><main class="container section"><p class="eyebrow">404 / MAARTEN VAN ELS</p><h1>Deze pagina bestaat niet.</h1><p>Je vindt mijn werk op de homepage.</p><a class="button button-dark" href="${profile.site}">Naar de homepage →</a></main></body></html>`,
);
console.log("Built Dutch and English pages, 3D bundle, sitemap and 404 page.");
