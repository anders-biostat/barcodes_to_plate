const pdf = require("pdf-creator-node");
const fs = require("fs");
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const open = require("open");

var storedContent = [];
var fileName = "";

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
  	.map(el => el.trim().split("\t").map(e => e.trim()))
  	.filter(el => el.length > 1)
  	.filter(el => /[A-Za-z]\d+/.test(el[0]));

  if(content.length == 0) {
  	res.sendStatus(406);
  	return;
  }

  res.send(content.length.toString());

  storedContent = content;
  fileName = req.files.barcodes.name.split(".").slice(0, -1).join(".");
});

app.get("/download", (req, res) => {
	if(req.query.type == "pdf") {
		generatePdf();
	} else {
		generateCsv(req.query.waves);
	}
});

app.listen(8080, () =>
  console.log('Express server is running on localhost:8080')
);

open("http://localhost:8080/")

function generatePdf() {
	let options = {
	  format: "A4",
	  orientation: "landscape",
	  border: "10mm"
	},
	  rows = "_ABCDEFGH". split(""),
	  cols = new Array(13).fill().map((el, i) => i),
	  layout = {};

  var d = new Date();
  var year = d.getFullYear().toString().substr(-2);
  var month = (d.getMonth() + 1).toString();
  if(month.length == 1) month = "0" + month;
  var day = d.getDate().toString();
  if(day.length == 1) day = "0" + day;
	
	storedContent.forEach(el => {layout[el[0]] = el[1]});

	var doc = {
	  html: fs.readFileSync('./public/layout_template.html', 'utf8'),
	  data: {
	    plateName: fileName,
	    date: day + "." + month + "." + year,
	    layout: rows.map(row => {
          return {wells: cols.map(col => {
            let labId = "";
            if(col == 0) 
              labId = row
            else if(row == "_")
              labId = col
            else if(layout[row + col]) 
              labId = layout[row + col];
        
            return ({
            	label: labId, 
            	class: (((col == 0 ? "row" : "") + 
                       (row == "_" ? "col " : "") + 
                       (col == "test" ? "test " : "")) || "well").trim()
            })
          })}
        })
	  }
	};
	console.log(doc.data.layout[1]);

	doc.path = path.join(__dirname, "/output/output.pdf");
	
	pdf.create(doc, options);
};

function generateCsv(waves) {

	var colours = [
    "$00FF8000",
    "clRed",
    "$0030D700",
    "clFuchsia",
    "clGray",
    "$0012D7FA",
    "$00000097",
    "$00FFFF0F",
    "$00404000",
    "$004080FF",
    "$00FD0299",
    "$0026C4B8"
  ];

	fs.readFile("data/ctrls.csv", function(err, buf) {
    if (err)
      return console.log('Unable to read file with control labels: ' + err);

    var data = buf.toString().split("\n"),
    	ctrls = [];
    for(var i = 1; i < data.length; i++) {
      let ctrl = data[i].split(",").map(el => el.trim());
      ctrls.push({
      	name: ctrl[0],
       	type: ctrl[1],
       	conc: ctrl[2]
       });
    }

    var output = [];
    waves = waves.split(",").map(el => el.trim());

    storedContent.forEach((el, i) => {
    	var ct = ctrls.filter(e => e.name == el[1])[0] || {};
    	waves.forEach(w => {
    		output.push([
    			el[0],
    			el[1],
    			"\"\"",
    			w,
    			colours[i % colours.length],
       		ct.type || "Unknown",
          ct.conc || ""    			
    		].map(el => el.indexOf(" ") > -1 ? "\"" + el + "\"" : el))
    	});
    });

    output.sort(function(a, b) {
      if(a[0][0] < b[0][0]) return -1;
      if(a[0][0] > b[0][0]) return 1;
      return a[0].substring(1) - b[0].substring(1); 
    });
    output.unshift([
      "General:Pos",
      "\"General:Sample Name\"",
      "\"General:Repl. Of\"",
      "\"General:Filt. Comb.\"",
      "\"Sample Preferences:Color\"",
      "\"Abs Quant:Sample Type\"",
      "\"Abs Quant:Concentration\""
    ]);

    fs.writeFile(path.join(__dirname, "/output/output.csv"), 
      output.map(el => el.join("\t")).join("\n"),
      err => {if(err) throw err});
  });
};
	
/* var tests = [];

    


 db.all(sql, [req.query.plateId], (err, result) => {
    if(err) throw err;

    if(result.length == 0) {
      res.sendStatus(404);
      return;
    }

    result.forEach((sample, i) => {
      if(tests.indexOf(sample.shortName) == -1) tests.push(sample.shortName);

    tests = tests.filter(el => el != "ctrl");

    let d = new Date();
    let year = d.getFullYear().toString().substr(-2);
    let month = (d.getMonth() + 1).toString();
    if(month.length == 1) month = "0" + month;
    let day = d.getDate().toString();
    if(day.length == 1) day = "0" + day;
    
    let fileName = year + month + day + "_" + tests.join(",");



  */
 