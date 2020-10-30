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
  	.filter(el => el.length > 1)
  	.filter(el => /[A-Za-z]\d+/.test(el[0]));

  if(content.length == 0) {
  	res.sendStatus(406);
  	return;
  }
 	
  generatePdf(content);
  generateCsv(content);

  res.send(content.length.toString())
});

app.get("/download", (req, res) => {

});

app.listen(8080, () =>
  console.log('Express server is running on localhost:8080')
);

open("http://localhost:8080/")

function generatePdf(content) {

};

function generateCsv(content) {
	
	var output = [];
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
  var tests = [];

        sample.waves.split(",").forEach(w => {
        output.push([
          sample.well, 
          sample.orderId || sample.labId, 
          "\"\"", 
          w.trim(),
          colours[i % colours.length],
          sample.type || "Unknown",
          sample.conc || ""
        ].map(el => el.indexOf(" ") > -1 ? "\"" + el + "\"" : el));
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

 db.all(sql, [req.query.plateId], (err, result) => {
    if(err) throw err;

    if(result.length == 0) {
      res.sendStatus(404);
      return;
    }

    result.forEach((sample, i) => {
      if(tests.indexOf(sample.shortName) == -1) tests.push(sample.shortName);

      sample.waves.split(",").forEach(w => {
        output.push([
          sample.well, 
          sample.orderId || sample.labId, 
          "\"\"", 
          w.trim(),
          colours[i % colours.length],
          sample.type || "Unknown",
          sample.conc || ""
        ].map(el => el.indexOf(" ") > -1 ? "\"" + el + "\"" : el));
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

    tests = tests.filter(el => el != "ctrl");

    let d = new Date();
    let year = d.getFullYear().toString().substr(-2);
    let month = (d.getMonth() + 1).toString();
    if(month.length == 1) month = "0" + month;
    let day = d.getDate().toString();
    if(day.length == 1) day = "0" + day;
    
    let fileName = year + month + day + "_" + tests.join(",");

    paths.outputTxt.forEach(out => {
      fs.writeFile(path.join(out, fileName + ".txt"), 
        output.map(el => el.join("\t")).join("\n"),
        err => {if(err) throw err});
    })

    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm"
    },
      rows = "_ABCDEFGH". split(""),
      cols = new Array(13).fill().map((el, i) => i).concat(["test"]),
      layout = {};
    result.forEach(el => layout[el.well] = el);
      
    var doc = {
      html: fs.readFileSync('./layout_template.html', 'utf8'),
      data: {
        plateName: result[0].plateName,
        tests: tests.join(", "),
        date: day + "." + month + "." + year,
        layout: rows.map(row => {
          return {wells: cols.map(col => {
            let labId = "";
            if(col == 0) 
              labId = row
            else if(row == "_")
              labId = col
            else if(col == "test") {
              labId = cols.map(el => layout[row + el] ? layout[row + el].shortName : undefined)
                .filter((el, i, self) => el && el != "ctrl" && self.indexOf(el) == i)
                .join(", ");
            } else if(layout[row + col]) 
              labId = layout[row + col].labId;
        

            return ({
              labId: labId,
              orderId: layout[row + col] && layout[row + col].orderId ? "(" + layout[row + col].orderId + ")": undefined,
              testName: layout[row + col] ? layout[row + col].shortName : undefined,
              cl: (((col == 0 ? "row" : "") + 
                              (row == "_" ? "col " : "") + 
                              (col == "test" ? "test " : "")) || "well").trim()
            });
          })}
        })
      }
    };

    paths.outputPdf.forEach((out, i) => {
      doc.path = path.join(out, fileName + ".pdf");
      pdf.create(doc, options)
        .then(r => {
          if(i == 0) res.download(r.filename);
        })
        .catch(err => {console.log(err);});

    });
  });    
};




 