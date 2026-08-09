import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const port = parseInt(process.env.PORT || "8080", 10);
const distDir = resolve(import.meta.dirname, "..", "dist");

const server = createServer((req, res) => {
  let url = req.url === "/" ? "/index.html" : req.url || "/index.html";

  // /json endpoint: serve combined status+history JSON
  if (url === "/json" || url === "/json/") {
    const jsonEndpoint = resolve(distDir, "json/index.html");
    if (existsSync(jsonEndpoint)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(readFileSync(jsonEndpoint));
      return;
    }
  }

  const filePath = resolve(distDir, url.slice(1));

  // Prevent directory traversal
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    // SPA fallback: serve index.html for unmatched routes
    const indexPath = resolve(distDir, "index.html");
    if (existsSync(indexPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(readFileSync(indexPath));
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  res.end(readFileSync(filePath));
});

server.listen(port, () => {
  console.log(`Serving dist/ at http://localhost:${port}`);
});
