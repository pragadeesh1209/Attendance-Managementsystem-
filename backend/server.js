// server.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "simple_secret_for_demo"; // change in production

// ---------- MongoDB ----------
mongoose.connect("mongodb://127.0.0.1:27017/attendanceDB")
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error(err));

// ---------- Schemas ----------
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["Admin","Manager","User"], default: "User" }
});

const attendanceSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  date: { type: Date, default: Date.now },
  status: { type: String, default: "Present" }
});

const auditSchema = new mongoose.Schema({
  action: String,
  changedUserName: String,   // 👈 add this field
  changedByName: String,
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendance"
  },
  oldValue: String,
  newValue: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);
const Audit = mongoose.model("Audit", auditSchema);

// ---------- Auth middleware ----------
function auth(req, res, next){
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: "No token" });
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

// ---------- Routes ----------

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.json({ msg: "Fill all fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ name, email, password: hashed, role: role || "User" });
    await u.save();
    res.json({ msg: "Registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ msg: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Profile
app.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user || {});
});

// All users
app.get("/allUsers", auth, async (req, res) => {
  if (req.user.role === "Admin") {
    const all = await User.find().select("-password");
    return res.json(all);
  }
  if (req.user.role === "Manager") {
    const employees = await User.find({ role: "User" }).select("-password");
    return res.json(employees);
  }
  return res.status(403).json({ msg: "Access denied" });
});

// Mark attendance
app.post("/attendance", auth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const tomorrow = new Date(todayStart); tomorrow.setDate(todayStart.getDate()+1);

    const already = await Attendance.findOne({
      userId: req.user.id,
      date: { $gte: todayStart, $lt: tomorrow }
    });
    if (already) return res.json({ msg: "Already marked today" });

    const u = await User.findById(req.user.id);
    const a = new Attendance({ userId: u._id, userName: u.name });
    await a.save();
    res.json({ msg: "Marked" });
  } catch(err){
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get attendance
app.get("/attendanceAll", auth, async (req, res) => {
  try {
    if (req.user.role === "Admin") {
      const all = await Attendance.find().sort({ date: -1 });
      return res.json(all);
    }
    if (req.user.role === "Manager") {
      const employees = await User.find({ role: "User" });
      const ids = employees.map(e => e._id.toString());
      const records = await Attendance.find({ userId: { $in: ids } }).sort({ date: -1 });
      return res.json(records);
    }
    const mine = await Attendance.find({ userId: req.user.id }).sort({ date: -1 });
    return res.json(mine);
  } catch(err){
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Edit attendance (Present/Absent)
app.put("/attendance/:id", auth, async (req, res) => {
  try {
    const attId = req.params.id;
    const record = await Attendance.findById(attId);
    if (!record) return res.status(404).json({ msg: "Record not found" });

    // Permissions
    if (req.user.role === "Manager") {
      const targetUser = await User.findById(record.userId);
      if (!targetUser || targetUser.role !== "User") {
        return res.status(403).json({ msg: "Not allowed" });
      }
    }
    if (req.user.role === "User") return res.status(403).json({ msg: "Not allowed" });

    const oldValue = record.status;
    const { status } = req.body;

    if (status && ["Present", "Absent"].includes(status)) {
      record.status = status;
    }

    await record.save();

    // 👇 Fetch both who made the change & whose record was changed
    const changer = await User.findById(req.user.id);       // Admin or Manager
    const changedUser = await User.findById(record.userId); // Employee whose attendance changed

    // 🧾 Create Audit Log
    const audit = new Audit({
      action: "EDIT",
      changedUserName: changedUser ? changedUser.name : "Unknown",  // employee name
      changedByName: changer ? changer.name : "Unknown",            // admin/manager name
      attendanceId: attId,
      oldValue: oldValue,
      newValue: record.status
    });

    await audit.save();

    res.json({ msg: "Updated successfully", record });
  } catch (err) {
    console.error("Error updating attendance:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// Delete attendance
app.delete("/attendance/:id", auth, async (req, res) => {
  try {
    const attId = req.params.id;
    const record = await Attendance.findById(attId);
    if (!record) return res.json({ msg: "Record not found" });

    if (req.user.role === "Manager") {
      const targetUser = await User.findById(record.userId);
      if (!targetUser || targetUser.role !== "User") return res.status(403).json({ msg: "Not allowed" });
    }
    if (req.user.role === "User") return res.status(403).json({ msg: "Not allowed" });

    const who = await User.findById(req.user.id);
    const audit = new Audit({
      action: "DELETE",
      changedById: req.user.id,
      changedByName: who ? who.name : "",
      attendanceId: attId,
      oldValue: record.status,
      newValue: "Deleted"
    });
    await audit.save();

    await Attendance.findByIdAndDelete(attId);
    res.json({ msg: "Deleted" });
  } catch(err){
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Audit logs
app.get("/audit", auth, async (req, res) => {
  if (req.user.role !== "Admin") return res.status(403).json({ msg: "Not allowed" });
  const logs = await Audit.find().sort({ timestamp: -1 });
  res.json(logs);
});

// Start server
const PORT = 4000;
app.listen(PORT, () => console.log("Server running on port", PORT));
