const pdf = require("pdf-creator-node");
const fs = require("fs");
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const open = require("open");
const bodyParser = require('body-parser');

var appData = {
	storedContent: [],
	fileName: "",
	comments: "Operator: "
};

const app = express();
app.use(fileUpload());
app.use(bodyParser.text());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get('/style.css', (req, res) => {
	res.sendFile(path.join(__dirname + "/public/style.css"));
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
    .map(el => {
      if(/[A-Za-z]\d+/.test(el[0])) {
        return el;
      } else if(/[A-Za-z]\d+/.test(el[1])) {
        el.shift();
        return el;
      } else 
        return [];
    })
    .filter(el => el.length == 2);

  if(content.length == 0) {
  	res.sendStatus(406);
  	return;
  }

  res.send(content.length.toString());

  appData.storedContent = content;
  appData.fileName = req.files.barcodes.name.split(".").slice(0, -1).join(".");
});

app.post("/comment", (req, res) => {
	appData.comments = req.body;
	res.sendStatus(200);
});

app.get("/download", (req, res) => {
	if(req.query.type == "pdf") {
		generatePdf(req.query.waves, function() {
			res.download(path.join(__dirname, "output/output.pdf"));
		});
	} else {
		generateCsv(req.query.waves, function() {
			res.download(path.join(__dirname, "output/output.csv"));
		});
	}
});

app.get("/store", (req, res) => {
	var f = function() {
		fs.copyFile(path.join(__dirname, "/output/output." + req.query.type),
			path.resolve(req.query.path, req.query.name), err => {
				if(err) {
					res.sendStatus(500);
					console.log(err)
				} else
					res.sendStatus(200);
			});		
	}
	if(req.query.type == "pdf")
		generatePdf(req.query.waves, f)
	else
		generateCsv(req.query.waves, f);

});

app.listen(8080, () =>
  console.log('Express server is running on localhost:8080')
);

open("http://localhost:8080/")

function generatePdf(waves, onGenerated) {
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
	
	appData.storedContent.forEach(el => {layout[el[0]] = el[1]});
	console.log(appData.comments);

	var doc = {
	  html: fs.readFileSync('./public/layout_template.html', 'utf8'),
	  data: {
	    plateName: appData.fileName,
	    waves: waves,
	    comments: appData.comments,
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

	doc.path = path.join(__dirname, "/output/output.pdf");
	
	pdf.create(doc, options)
		.then(r => {onGenerated()});
};

function generateCsv(waves, onGenerated) {

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

    appData.storedContent.forEach((el, i) => {
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
      err => {
      	if(err) throw err;
      	onGenerated();
      });
  });
};
