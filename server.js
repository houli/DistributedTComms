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
var results = [];

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
    lastHeartbeat: new Date(),
    linesCompleted: 0
  });

  if (server.unsentBlocks.length < 5) {
    blocks.createMoreBlocks(server);
  }
  var block = server.unsentBlocks.pop();
  block.workerId = id;
  block.nameToSearch = process.argv[2];
  server.inProgressBlocks.push(block);
  console.log('Worker \"' + id + '\" has joined.');

  res.send(block);
});


var findWorker = function(workerId) {
  for (var i = 0; i < server.workers.length; i++) {
    if (server.workers[i].id == workerId) {
      return server.workers[i];
    }
  }
  return null;
}

server.post('/heartbeat', function(req, res) {
  var now = new Date();
  var worker = findWorker(req.body.workerId);
  if (worker) {
    worker.lastHeartbeat = now;
    worker.linesCompleted += Math.abs(req.body.rangeEnd - req.body.rangeStart);
    worker.lastLineCompleted = req.body.rangeEnd;
    server.db.run("UPDATE names SET completed = 1 WHERE id >= " + req.body.rangeStart + " AND id < " + req.body.rangeEnd + ";");
    res.send("1");
  } else {
    res.send("0");
  }
});

server.post('/completed', function(req, res) {
  // DO QUERY
  for (var i = 0; i < req.body.results.length; i++) {
    results.push(req.body.results[i]);
    // Print about worker
  }
  // Update global stats
  res.sendStatus(200);
});


var port = 3000;
server.listen(port);
console.log('Server listening on port ' + port);
