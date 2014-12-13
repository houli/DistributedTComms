var express = require('express');
var server = express();
var childprocess = require('child_process');
var sqlite3 = require('sqlite3');
var crypto = require('crypto');
var db = null;
server.use(require('body-parser').json());

var workers = [];

childprocess.exec('python makedb.py', function(error, stdout, stderr) {
  db = new sqlite3.Database('names.db');
});

server.get('/', function(req, res) {
  res.send('Number of connected workers: ' + workers.length);
});

server.post('/join', function(req, res) {
  var mips = req.body.mips;
  var response = {};

  var id = crypto.randomBytes(20).toString('hex');
  response.id = id;
  workers.push({
    id: id,
    lastHeartbeat: new Date(),
    blockId: null
  });
  res.send(response);
});

var port = 3000;
server.listen(port);
console.log('Server listening on port ' + port);
