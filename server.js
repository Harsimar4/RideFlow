// RideFlow - Full Stack Ride Booking Platform
// Backend: Node.js + Express REST API | Auth: token-based, role-based (customer/driver/admin)
// Storage: JSON document store (data/db.json) structured as MongoDB-style collections;
// swap the load/save layer with Mongoose + MongoDB Atlas for production.
const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB = path.join(__dirname, "data", "db.json");
const load = () => {
  if (!fs.existsSync(DB)) { fs.mkdirSync(path.dirname(DB), { recursive: true }); fs.writeFileSync(DB, JSON.stringify({ users: [], rides: [] }, null, 2)); }
  return JSON.parse(fs.readFileSync(DB, "utf8"));
};
const save = (db) => fs.writeFileSync(DB, JSON.stringify(db, null, 2));
const hash = (pw) => crypto.createHash("sha256").update(pw).digest("hex");
const tokens = new Map(); // token -> userId

function auth(role) {
  return (req, res, next) => {
    const uid = tokens.get((req.headers.authorization || "").replace("Bearer ", ""));
    if (!uid) return res.status(401).json({ error: "Login required" });
    const user = load().users.find((u) => u.id === uid);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    if (role && user.role !== role && user.role !== "admin")
      return res.status(403).json({ error: "Not allowed for role: " + user.role });
    req.user = user; next();
  };
}

app.post("/api/register", (req, res) => {
  const { name, email, password, role } = req.body;
  const db = load();
  if (db.users.some((u) => u.email === email)) return res.status(400).json({ error: "Email already registered" });
  const user = { id: "u" + Date.now(), name, email, password: hash(password), role: role || "customer" };
  db.users.push(user); save(db);
  res.json({ message: "Registered", user: { id: user.id, name, email, role: user.role } });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = load().users.find((u) => u.email === email && u.password === hash(password));
  if (!user) return res.status(401).json({ error: "Wrong email or password" });
  const token = crypto.randomBytes(16).toString("hex");
  tokens.set(token, user.id);
  res.json({ token, name: user.name, role: user.role });
});

app.post("/api/rides", auth("customer"), (req, res) => {
  const { pickup, drop } = req.body;
  const db = load();
  const fare = 50 + Math.floor(Math.random() * 200); // demo fare engine
  const ride = { id: "r" + Date.now(), customer: req.user.id, pickup, drop, fare, status: "requested", driver: null };
  db.rides.push(ride); save(db);
  res.json({ message: "Ride booked", ride });
});

app.get("/api/rides", auth(), (req, res) => {
  const db = load();
  const rides = req.user.role === "admin" ? db.rides
    : db.rides.filter((r) => r.customer === req.user.id || r.driver === req.user.id || (req.user.role === "driver" && r.status === "requested"));
  res.json(rides);
});

app.post("/api/rides/:id/accept", auth("driver"), (req, res) => {
  const db = load();
  const ride = db.rides.find((r) => r.id === req.params.id);
  if (!ride || ride.status !== "requested") return res.status(400).json({ error: "Ride not available" });
  ride.status = "accepted"; ride.driver = req.user.id; save(db);
  res.json({ message: "Ride accepted", ride });
});

app.get("/api/admin/stats", auth("admin"), (req, res) => {
  const db = load();
  res.json({ users: db.users.length, rides: db.rides.length, revenue: db.rides.reduce((s, r) => s + r.fare, 0) });
});

app.listen(3000, () => console.log("RideFlow running at http://localhost:3000"));
