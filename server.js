const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "CHANGE_THIS_PASSWORD";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";

const publicDir = path.join(__dirname, "public");
const indexFile = path.join(publicDir, "index.html");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");
const dataFile = path.join(dataDir, "portfolio.json");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, "{}");
}

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  }
});


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);


// ===============================
// ADMIN LOGIN PAGE
// ===============================

app.get("/admin", (req, res) => {

  if (req.session.isAdmin) {
    return res.redirect("/editor");
  }

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login</title>

<style>
body{
  margin:0;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#07111f;
  color:white;
  font-family:Arial,sans-serif;
}

.box{
  width:min(90%,380px);
  padding:30px;
  border-radius:18px;
  background:#0d1b2a;
  box-shadow:0 0 30px rgba(0,140,255,.2);
}

h2{
  margin-top:0;
}

input{
  width:100%;
  box-sizing:border-box;
  padding:14px;
  margin:15px 0;
  border-radius:10px;
  border:1px solid #28445f;
  background:#07111f;
  color:white;
}

button{
  width:100%;
  padding:14px;
  border:0;
  border-radius:10px;
  background:#1683ff;
  color:white;
  font-weight:bold;
  cursor:pointer;
}

.error{
  color:#ff6b6b;
  margin-top:12px;
}
</style>
</head>

<body>

<div class="box">

<h2>🔐 Portfolio Admin</h2>

<form method="POST" action="/admin/login">

<input
  type="password"
  name="password"
  placeholder="Admin password"
  required
>

<button type="submit">
Login
</button>

</form>

${req.query.error ? '<div class="error">Invalid password</div>' : ''}

</div>

</body>
</html>
`);
});


// ===============================
// ADMIN LOGIN
// ===============================

app.get("/admin/login", (req, res) => {
  res.redirect("/admin");
});

app.post("/admin/login", (req, res) => {

  const password = req.body.password;

  if (password === ADMIN_PASSWORD) {

    req.session.isAdmin = true;

    return res.redirect("/editor");

  }

  res.redirect("/admin?error=1");
});


// ===============================
// AUTH MIDDLEWARE
// ===============================

function requireAdmin(req, res, next) {

  if (req.session && req.session.isAdmin) {
    return next();
  }

  // API requests get a proper JSON response
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      error: "Admin authentication required"
    });
  }

  return res.redirect("/admin");
}


// ===============================
// PORTFOLIO DATA API
// ===============================

// Public portfolio reads from Supabase
app.get("/api/portfolio", async (req, res) => {

  try {

    const { data: rows, error } = await supabase
      .from("portfolio")
      .select("data")
      .order("id", { ascending: true })
      .limit(1);

    if (error) {
      throw error;
    }

    const data =
      rows && rows.length > 0
        ? rows[0].data
        : {};

    res.json(data);

  } catch (error) {

    console.error("Supabase read error:", error);

    res.status(500).json({
      error: "Could not read portfolio data"
    });

  }

});


app.post("/api/portfolio", requireAdmin, async (req, res) => {

  try {

    const { data: rows, error: readError } = await supabase
      .from("portfolio")
      .select("id")
      .order("id", { ascending: true })
      .limit(1);

    if (readError) {
      throw readError;
    }

    if (!rows || rows.length === 0) {

      const { error: insertError } = await supabase
        .from("portfolio")
        .insert({
          data: req.body
        });

      if (insertError) {
        throw insertError;
      }

    } else {

      const rowId = rows[0].id;

      const { error: updateError } = await supabase
        .from("portfolio")
        .update({
          data: req.body,
          updated_at: new Date().toISOString()
        })
        .eq("id", rowId);

      if (updateError) {
        throw updateError;
      }

    }

    res.json({
      success: true
    });

  } catch (error) {

    console.error("Supabase save error:", error);

    res.status(500).json({
      success: false,
      error: "Could not save portfolio"
    });

  }

});


// ===============================
// IMAGE UPLOAD API
// ===============================

app.post(
  "/api/images",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image uploaded"
        });
      }

      const ext =
        path.extname(req.file.originalname).toLowerCase() ||
        ".jpg";

      const filePath =
        "portfolio/" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 10) +
        ext;

      const { error } = await supabase
        .storage
        .from("portfolio-images")
        .upload(
          filePath,
          req.file.buffer,
          {
            contentType: req.file.mimetype,
            upsert: false
          }
        );

      if (error) {
        console.error("Supabase Storage upload error:", error);

        return res.status(500).json({
          success: false,
          error: "Image upload failed"
        });
      }

      const { data: publicData } =
        supabase
          .storage
          .from("portfolio-images")
          .getPublicUrl(filePath);

      res.json({
        success: true,
        filename: publicData.publicUrl
      });

    } catch (error) {

      console.error("Image upload error:", error);

      res.status(500).json({
        success: false,
        error: "Image upload failed"
      });

    }

  }
);


// ===============================
// OLD LOCAL IMAGE SERVING
// ===============================

// Kept temporarily for old local images.
// New images are stored in Supabase Storage.


// ===============================
// PROTECTED EDITOR
// ===============================

app.get("/editor", requireAdmin, (req, res) => {

  res.sendFile(indexFile);

});


// ===============================
// LOGOUT
// ===============================

app.post("/admin/logout", (req, res) => {

  req.session.destroy(() => {
    res.redirect("/admin");
  });

});


// ===============================
// PUBLIC PORTFOLIO
// ===============================

app.get("/", (req, res) => {

  try {

    let html = fs.readFileSync(indexFile, "utf8");

    // The editor starts here and ends immediately before the main script.
    const editorStart = html.indexOf("<!-- EDITOR -->");
    const scriptStart = html.indexOf("<script>", editorStart);

    if (editorStart !== -1 && scriptStart !== -1) {
      html =
        html.slice(0, editorStart) +
        html.slice(scriptStart);
    }

    // Remove only the public Edit button.
    html = html.replace(
      /<button[^>]*id=["']openEditor["'][^>]*>[\s\S]*?<\/button>/gi,
      ""
    );

    res.type("html").send(html);

  } catch (error) {

    console.error(error);

    res.status(500).send("Portfolio could not be loaded.");

  }

});

// ===============================
// STATIC FILES
// ===============================

app.use(express.static(publicDir));


// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {

  console.log("");
  console.log("================================");
  console.log("Portfolio server started");
  console.log("================================");
  console.log("");
  console.log(`Public: http://localhost:${PORT}`);
  console.log(`Admin:  http://localhost:${PORT}/admin`);
  console.log(`Editor: http://localhost:${PORT}/editor`);
  console.log("");

});
