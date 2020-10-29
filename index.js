const pdf = require("pdf-creator-node");
const fs = require("fs");
const express = require("express");

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"))
});

readFile = function(path) {

};

storeOutput = function() {

};