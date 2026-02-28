//node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const ROOT = path.join(__dirname, "..");

let gameState = {
  ships: [],
  showAllBands: false,
  showWepBands: false
};


const server = http.createServer((req, res) => {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(ROOT, filePath);

  const ext = path.extname(filePath);

  const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg"
  };

  const contentType = contentTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
  console.log("Connected")
  ws.send(JSON.stringify({
    type: "init",
    state: gameState
  }));

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if (data.type === "stateUpdate") {
      gameState = data.state;

      // Broadcast
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "stateUpdate",
            state: gameState
          }));
        }
      });
    }
  });
});

server.listen(8080, () => {
  console.log("Server running at http://localhost:8080");
});