import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 8765);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const allowed = new Set([
  "index.html",
  "en/index.html",
  "404.html",
  "styles.css",
  "main.js",
  "logo.svg",
  "maartenVanEls.jpg",
  "assets/world.js",
  "robots.txt",
  "sitemap.xml",
]);
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/3d-portfolio") {
      response.writeHead(302, { Location: "/3d-portfolio/" });
      response.end();
      return;
    }
    if (pathname.startsWith("/3d-portfolio/"))
      pathname = pathname.slice("/3d-portfolio".length);
    if (pathname === "/en") {
      response.writeHead(302, { Location: url.pathname + "/" });
      response.end();
      return;
    }
    if (pathname.endsWith("/")) pathname += "index.html";
    const relative = pathname.replace(/^\//, "");
    if (!allowed.has(relative)) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("404 — Page not found");
      return;
    }
    const file = path.join(root, relative),
      info = await stat(file);
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("404 — Page not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("Portfolio preview: http://127.0.0.1:" + port + "/3d-portfolio/"),
);
