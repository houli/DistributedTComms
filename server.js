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
server.inProgressBlocks = [];

server.databaseIndex = 0;

childprocess.exec('python makedb.py', function(error, stdout, stderr) {
  server.db = new sqlite3.Database('names.db');
  blocks.createMoreBlocks(server);
});

server.get('/', function(req, res) {
  res.send('Number of connected workers: ' + server.workers.length);
});

server.post('/join', function(req, res) {
  var mips = req.body.mips;

  var id = crypto.randomBytes(20).toString('hex');
  server.workers.push({
    id: id,
    lastHeartbeat: new Date()
  });
  if (server.unsentBlocks.length < 5) {
    blocks.createMoreBlocks(server);
  }
  var block = server.unsentBlocks.pop();
  block.workerId = id;
  server.inProgressBlocks.push(block);
  console.log(block);
  res.send(block);
});

var port = 3000;
server.listen(port);
console.log('Server listening on port ' + port);
