const pdf = require("pdf-creator-node");
const fs = require("fs");
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const open = require("open");

const app = express();
app.use(fileUpload());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"))
});

app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let content = req.files.barcodes.data
  	.toString()
  	.split("\n")
  	.map(el => el.trim().split("\t"))
  	.filter(el => el.length > 1);
 
  res.send("uploaded")
});

app.listen(8080, () =>
  console.log('Express server is running on localhost:8080')
);

open("http://localhost:8080/")