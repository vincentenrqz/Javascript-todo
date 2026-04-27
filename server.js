const http = require("http");

let todos = [];
let nextId = 1;

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // GET /todos — list all
  if (method === "GET" && path === "/todos") {
    return sendJSON(res, 200, todos);
  }

  // POST /todos — create
  if (method === "POST" && path === "/todos") {
    try {
      const body = await parseBody(req);
      if (!body.text || !body.text.trim()) {
        return sendJSON(res, 400, { error: "text is required" });
      }
      const todo = { id: nextId++, text: body.text.trim(), done: false };
      todos.push(todo);
      return sendJSON(res, 201, todo);
    } catch {
      return sendJSON(res, 400, { error: "Invalid JSON" });
    }
  }

  // Match /todos/:id
  const match = path.match(/^\/todos\/(\d+)$/);
  if (match) {
    const id = parseInt(match[1]);
    const idx = todos.findIndex((t) => t.id === id);

    // PUT /todos/:id — toggle done
    if (method === "PUT") {
      if (idx === -1) return sendJSON(res, 404, { error: "Not found" });
      todos[idx].done = !todos[idx].done;
      return sendJSON(res, 200, todos[idx]);
    }

    // DELETE /todos/:id — remove
    if (method === "DELETE") {
      if (idx === -1) return sendJSON(res, 404, { error: "Not found" });
      const [removed] = todos.splice(idx, 1);
      return sendJSON(res, 200, removed);
    }
  }

  sendJSON(res, 404, { error: "Not found" });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Todo API running at http://localhost:${PORT}`);
  console.log(`   GET    /todos       — list all todos`);
  console.log(`   POST   /todos       — create todo  { "text": "..." }`);
  console.log(`   PUT    /todos/:id   — toggle done`);
  console.log(`   DELETE /todos/:id   — delete todo`);
});
