var http = require('http');
var childprocess = require('child_process');
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('names.db');

db.serialize(function() {
  childprocess.exec('python makedb.py', function(error, stdout, stderr) {
  });
});

var server = http.createServer(function(req, res) {
  res.end('Hi');
}); 

var port = 3000;
server.listen(port);
console.log("Server listening on port " + port);
