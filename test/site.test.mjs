import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { content, profile } from "../src/content.mjs";
import { page, escape } from "../src/template.mjs";

test("Dutch and English retain the same portfolio and project destinations", () => {
  assert.deepEqual(
    content.nl.projects.map((p) => p.id),
    content.en.projects.map((p) => p.id),
  );
  assert.deepEqual(
    content.nl.projects.map((p) => [p.category, p.url, p.live]),
    content.en.projects.map((p) => [p.category, p.url, p.live]),
  );
  for (const locale of Object.values(content))
    for (const project of locale.projects) {
      assert.ok(project.challenge && project.contribution && project.result);
      for (const url of [project.url, project.live].filter(Boolean))
        assert.equal(new URL(url).protocol, "https:");
    }
});
for (const lang of ["nl", "en"])
  test(
    lang +
      ": generated HTML is current, complete without JavaScript, and has valid anchors",
    async () => {
      const html = page(content[lang], lang);
      const file = new URL(
        lang === "nl" ? "../index.html" : "../en/index.html",
        import.meta.url,
      );
      assert.equal(
        await readFile(file, "utf8"),
        html,
        "Run npm run build after editing content",
      );
      assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
      assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
      for (const match of html.matchAll(/href="#([^"]+)"/g))
        assert.ok(ids.includes(match[1]), "Missing anchor: " + match[1]);
      for (const project of content[lang].projects)
        assert.ok(
          html.includes(escape(project.contribution)),
          "Project content must exist before JS",
        );
      assert.ok(
        html.includes('hreflang="nl"') && html.includes('hreflang="en"'),
      );
      assert.ok(html.includes(profile.linkedin));
      assert.ok(
        !html.includes("maartenvanels.com"),
        "Canonical URL must match the verified deployment",
      );
      const schema = JSON.parse(
        html.match(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
        )[1],
      );
      assert.equal(schema.name, profile.name);
      assert.deepEqual(schema.sameAs, [profile.github, profile.linkedin]);
      for (const match of html.matchAll(/(?:src|href)="((?:\.\.?\/)[^"]+)"/g)) {
        const target = new URL(match[1], file);
        const info = await stat(target);
        assert.ok(info.isFile() || info.isDirectory(), match[1]);
      }
    },
  );
test("Content is escaped before it enters HTML", () => {
  assert.equal(
    escape('<script a="x">&\'</script>'),
    "&lt;script a=&quot;x&quot;&gt;&amp;&#39;&lt;/script&gt;",
  );
});
