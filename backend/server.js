const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// create uploads folder if not exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");

    // 🔥 Ensure folder exists EVERY TIME
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
 

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());



app.post("/query", upload.array("files"), (req, res) => {
  const query = req.body.query;
  const tables = JSON.parse(req.body.tables);

  const csv_files = req.files.map(file => ({
    name: file.originalname.split(".")[0],
    path: path.resolve(file.path).replace(/\\/g, "/")
  }));

  const inputData = { query, tables, csv_files };

  require("fs").writeFileSync("input.json", JSON.stringify(inputData));

  exec(`python3 ai_module.py`, (error, stdout, stderr) => {
    if (error) {
      console.log(stderr);
      return res.json({ error: "AI error" });
    }

    res.json({ response: stdout });
  });
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});