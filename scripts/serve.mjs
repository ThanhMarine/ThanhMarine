// Minimal static server for local preview. No dependencies.
// Usage: node scripts/serve.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.argv[2] || process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = normalize(decoded).replace(/^([/\\])+/, "");
  const target = resolve(join(root, relative));
  if (target !== root && !target.startsWith(root + sep)) return null;
  return target;
}

const server = createServer(async (req, res) => {
  try {
    let target = safePath(req.url || "/");
    if (!target) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    let info = await stat(target).catch(() => null);
    if (info?.isDirectory()) {
      target = join(target, "index.html");
      info = await stat(target).catch(() => null);
    }

    if (!info?.isFile()) {
      const notFound = join(root, "404.html");
      const body = await readFile(notFound);
      res.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : body);
      return;
    }

    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": types[extname(target).toLowerCase()] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
    console.error(error);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview: http://localhost:${port}/`);
  console.log(`Serving: ${root}`);
});
