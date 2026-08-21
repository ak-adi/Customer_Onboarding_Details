require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sql = require("mssql");
const net = require("net");
const { execSync } = require("child_process");
const jwt = require("jsonwebtoken");
const xlsx = require("xlsx");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ─── SSMS LocalDB Bridge & Pool Setup ──────────────────────────────────
let mssqlPool = null;

async function getLocalDbPipe() {
  try { execSync("sqllocaldb start mssqllocaldb", { stdio: "ignore" }); } catch (e) {}
  for (let i = 0; i < 15; i++) {
    try {
      const output = execSync("sqllocaldb info mssqllocaldb").toString();
      const match = output.match(/Instance pipe name:\s*(.*)/i);
      if (match && match[1].trim()) {
        let p = match[1].trim();
        if (p.startsWith("np:")) p = p.slice(3);
        return p;
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

async function startLocalDbProxy() {
  const pipeName = await getLocalDbPipe();
  if (!pipeName) throw new Error("Could not find pipe for SSMS LocalDB instance");

  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.pause();
      const pipe = net.connect(pipeName, () => {
        socket.pipe(pipe);
        pipe.pipe(socket);
        socket.resume();
      });
      socket.on("error", () => {});
      pipe.on("error", () => {});
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ host: "127.0.0.1", port });
    });
    server.on("error", reject);
  });
}

async function initDb() {
  try {
    console.log("Connecting to SSMS LocalDB ((localdb)\\mssqllocaldb)...");
    const bridge = await startLocalDbProxy();

    const dbConfig = {
      server: bridge.host,
      port: bridge.port,
      user: process.env.DB_USER || "app_user",
      password: process.env.DB_PASSWORD || "LocalDb@2026!",
      database: process.env.DB_DATABASE || "Processing_Dashboard",
      options: {
        port: bridge.port,
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      connectionTimeout: 15000,
      requestTimeout: 30000,
    };

    mssqlPool = await sql.connect(dbConfig);
    await mssqlPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='POSubmissions' AND xtype='U')
      CREATE TABLE POSubmissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sr_no NVARCHAR(50),
        po_no NVARCHAR(100),
        product_description NVARCHAR(500),
        po_date NVARCHAR(50),
        card_quantity NVARCHAR(100),
        antenna_type NVARCHAR(100),
        perso_type NVARCHAR(100),
        module_make NVARCHAR(200),
        module_part_code NVARCHAR(200),
        chip_atr NVARCHAR(200),
        chip_ats NVARCHAR(200),
        module_qty_sent NVARCHAR(100),
        module_sent_date NVARCHAR(50),
        module_received_date NVARCHAR(50),
        cdd NVARCHAR(50),
        order_status NVARCHAR(100),
        submitted_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log("Connected to SSMS LocalDB successfully!");
  } catch (err) {
    console.error("SSMS LocalDB connection error:", err.message);
  }
}

initDb();

// ─── Database Operations ───────────────────────────────────────────────
async function insertSubmission(d) {
  if (!mssqlPool) throw new Error("Database not connected");
  await mssqlPool.request()
    .input("sr_no", sql.NVarChar, d.sr_no || "")
    .input("po_no", sql.NVarChar, d.po_no || "")
    .input("product_description", sql.NVarChar, d.product_description || "")
    .input("po_date", sql.NVarChar, d.po_date || "")
    .input("card_quantity", sql.NVarChar, String(d.card_quantity || ""))
    .input("antenna_type", sql.NVarChar, d.antenna_type || "")
    .input("perso_type", sql.NVarChar, d.perso_type || "")
    .input("module_make", sql.NVarChar, d.module_make || "")
    .input("module_part_code", sql.NVarChar, d.module_part_code || "")
    .input("chip_atr", sql.NVarChar, d.chip_atr || "")
    .input("chip_ats", sql.NVarChar, d.chip_ats || "")
    .input("module_qty_sent", sql.NVarChar, String(d.module_qty_sent || ""))
    .input("module_sent_date", sql.NVarChar, d.module_sent_date || "")
    .input("module_received_date", sql.NVarChar, d.module_received_date || "")
    .input("cdd", sql.NVarChar, d.cdd || "")
    .input("order_status", sql.NVarChar, d.order_status || "")
    .query(`
      INSERT INTO POSubmissions
        (sr_no,po_no,product_description,po_date,card_quantity,antenna_type,perso_type,
         module_make,module_part_code,chip_atr,chip_ats,module_qty_sent,module_sent_date,
         module_received_date,cdd,order_status)
      VALUES
        (@sr_no,@po_no,@product_description,@po_date,@card_quantity,@antenna_type,@perso_type,
         @module_make,@module_part_code,@chip_atr,@chip_ats,@module_qty_sent,@module_sent_date,
         @module_received_date,@cdd,@order_status)
    `);
}

async function getAllSubmissions() {
  if (!mssqlPool) throw new Error("Database not connected");
  const result = await mssqlPool.request().query("SELECT * FROM POSubmissions ORDER BY submitted_at DESC");
  return result.recordset;
}

async function deleteSubmission(id) {
  if (!mssqlPool) throw new Error("Database not connected");
  await mssqlPool.request()
    .input("id", sql.Int, id)
    .query("DELETE FROM POSubmissions WHERE id = @id");
}

// ─── Auth Middleware ─────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "ProcDashSecret2026!");
    if (payload.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// ─── API Routes ─────────────────────────────────────────────────────

// GET /api/db-status
app.get("/api/db-status", (req, res) => {
  res.json({
    dbMode: "mssql",
    server: "(localdb)\\mssqllocaldb",
    database: process.env.DB_DATABASE || "Processing_Dashboard",
    status: mssqlPool ? "online" : "connecting"
  });
});

// Module Make → ATR/ATS lookup table
const MODULE_ATR_ATS = [
  { make: "NXP JCOP4 B75B", atr: "3B6A00FF0031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP4 B86A", atr: "3B6A00FF0031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP5 BA5C", atr: "3BFA1300FF10000031C173C84000009000", ats: "0F788071020031C173C84000009000" },
  { make: "NXP JCOP5 BACD", atr: "3BFA1300FF10000031C173C84000009000", ats: "0F788071020031C173C84000009000" },
];

// GET /api/module-atr-ats
app.get("/api/module-atr-ats", (req, res) => {
  res.json(MODULE_ATR_ATS);
});

// GET /api/schema
app.get("/api/schema", (req, res) => {
  res.json([
    { key: "sr_no", label: "Sr. No.", type: "text", required: false },
    { key: "po_no", label: "PO No.", type: "text", required: true },
    { key: "product_description", label: "Product Description", type: "text", required: true },
    { key: "po_date", label: "PO Date", type: "date", required: true },
    { key: "card_quantity", label: "Card Quantity", type: "number", required: true },
    { key: "antenna_type", label: "Antenna Type Required", type: "select", required: true, options: ["Any", "Half", "Full"] },
    { key: "perso_type", label: "Perso Type", type: "select", required: true, options: ["Flat (Indent/ DG/ Thermal/ DOD)", "Embossing"] },
    { key: "module_make", label: "Module Make", type: "select", required: false, options: MODULE_ATR_ATS.map(m => m.make) },
    { key: "module_part_code", label: "Module Part Code", type: "text", required: false },
    { key: "chip_atr", label: "Chip ATR", type: "text", required: false },
    { key: "chip_ats", label: "Chip ATS", type: "text", required: false },
    { key: "module_qty_sent", label: "Module Qty Sent", type: "number", required: false },
    { key: "module_sent_date", label: "Module Sent Date", type: "date", required: false },
    { key: "module_received_date", label: "Module Received Date", type: "date", required: false },
    { key: "cdd", label: "CDD", type: "date", required: false },
    { key: "order_status", label: "Order Status", type: "select", required: true, options: ["In Process", "Hold", "Dispatched"] },
  ]);
});

// POST /api/submit
app.post("/api/submit", async (req, res) => {
  try {
    await insertSubmission(req.body);
    res.json({ success: true, message: "Customer Onboarding entry saved successfully!" });
  } catch (err) {
    console.error("Insert error:", err.message);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || "admin";
  const adminPass = process.env.ADMIN_PASS || "admin@123";
  const jwtSecret = process.env.JWT_SECRET || "ProcDashSecret2026!";

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ role: "admin", username }, jwtSecret, { expiresIn: "8h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// GET /api/admin/records
app.get("/api/admin/records", adminAuth, async (req, res) => {
  try {
    const records = await getAllSubmissions();
    res.json(records);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// DELETE /api/admin/records/:id
app.delete("/api/admin/records/:id", adminAuth, async (req, res) => {
  try {
    await deleteSubmission(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

// GET /api/admin/export - Export to Excel
app.get("/api/admin/export", adminAuth, async (req, res) => {
  try {
    const records = await getAllSubmissions();
    const worksheetData = records.map(r => ({
      "Sr. No.": r.sr_no || "",
      "PO No.": r.po_no || "",
      "Product Description": r.product_description || "",
      "PO Date": r.po_date || "",
      "Card Quantity": r.card_quantity || "",
      "Antenna Type Required": r.antenna_type || "",
      "Perso Type": r.perso_type || "",
      "Module Make": r.module_make || "",
      "Module Part Code": r.module_part_code || "",
      "Chip ATR": r.chip_atr || "",
      "Chip ATS": r.chip_ats || "",
      "Module Qty Sent": r.module_qty_sent || "",
      "Module Sent Date": r.module_sent_date || "",
      "Module Received Date": r.module_received_date || "",
      "CDD": r.cdd || "",
      "Order Status": r.order_status || "",
      "Submitted At": r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ""
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(worksheetData);

    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...worksheetData.map(row => String(row[key] || "").length)) + 2
    }));
    ws['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(wb, ws, "Customer Submissions");

    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `Customer_Onboarding_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Length", buf.length);
    res.setHeader("Cache-Control", "no-cache");
    res.end(buf);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Export error: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running successfully on http://localhost:${PORT}`);
});
