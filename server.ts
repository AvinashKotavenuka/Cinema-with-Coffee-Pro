import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("cinema_brew.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    concept TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { username, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      const result = stmt.run(username, hashedPassword);
      res.json({ id: result.lastInsertRowid, username });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({ id: user.id, username: user.username });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Project Routes
  app.post("/api/projects", (req, res) => {
    const { userId, concept, data } = req.body;
    const stmt = db.prepare("INSERT INTO projects (user_id, concept, data) VALUES (?, ?, ?)");
    const result = stmt.run(userId, concept, JSON.stringify(data));
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/projects/:userId", (req, res) => {
    const { userId } = req.params;
    const projects = db.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(projects.map((p: any) => ({ ...p, data: JSON.parse(p.data) })));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
