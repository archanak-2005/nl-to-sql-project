const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());

const fs = require("fs");

app.post("/query", upload.array("files"), (req, res) => {
  const query = req.body.query;
  const tables = JSON.parse(req.body.tables);

  const csv_files = req.files.map(file => ({
    name: file.originalname.split(".")[0],
    path: file.path
  }));

  const inputData = { query, tables, csv_files };

  require("fs").writeFileSync("input.json", JSON.stringify(inputData));

  exec(`python ai_module.py`, (error, stdout, stderr) => {
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