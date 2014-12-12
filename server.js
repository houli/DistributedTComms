var express = require('express');
var server = express();
var childprocess = require('child_process');
var sqlite3 = require('sqlite3');
var db = null;

childprocess.exec('python makedb.py', function(error, stdout, stderr) {
  db = new sqlite3.Database('names.db');
});

server.get('/', function(req, res) {
  res.send('Hi');
});

var port = 3000;
server.listen(port);
console.log("Server listening on port " + port);
