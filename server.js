var blocks = require('./blocks.js');
var express = require('express');
var server = express();
var childprocess = require('child_process');
var sqlite3 = require('sqlite3');
var crypto = require('crypto');
server.db = null;
server.use(require('body-parser').json());

server.workers = [];
server.unsentBlocks = [];

server.databaseIndex = 0;

childprocess.exec('python makedb.py', function(error, stdout, stderr) {
  server.db = new sqlite3.Database('names.db');
  for (var i = 0; i < 10; i++) {
    blocks.createBlock(server, i);
  }
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
    lastHeartbeat: new Date()
  });
  res.send(response);
});

var port = 3000;
server.listen(port);
console.log('Server listening on port ' + port);
