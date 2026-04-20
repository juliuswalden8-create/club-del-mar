require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");

const { ensureBookingsStore, handleBookingsApi, createRequestUrl } = require("./lib/bookings-api");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function sendFile(filePath, response) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    response.writeHead(200, { "Content-Type": type });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = createRequestUrl(request, `http://${HOST}:${PORT}`);

    if (requestUrl.pathname === "/api/bookings") {
      await handleBookingsApi(request, response, requestUrl);
      return;
    }

    const urlPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (!error && stats.isDirectory()) {
        sendFile(path.join(filePath, "index.html"), response);
        return;
      }

      if (!error) {
        sendFile(filePath, response);
        return;
      }

      sendFile(path.join(ROOT, "index.html"), response);
    });
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Server error");
  }
});

ensureBookingsStore()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Club Del Mar is running at http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not start booking store", error);
    process.exitCode = 1;
  });
