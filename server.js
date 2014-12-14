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
var workerStats = [];
var finished = false;

server.databaseIndex = 0;

childprocess.exec('python makedb.py', function(error, stdout, stderr) {
  console.log("db made")
  server.db = new sqlite3.Database('names.db');
  server.db.get("SELECT id FROM names ORDER BY id DESC LIMIT 1;", function(err, row) {
    server.dbSize = row.id;
    blocks.createMoreBlocks(server, function() {
      console.log('Server listening on port ' + port);
    });
  });
});

server.get('/', function(req, res) {
  res.send('Number of connected workers: ' + server.workers.length);
});


var findWorkerStats = function(workerId) {
  for (var i = 0; i < workerStats.length; i++) {
    if (workerStats[i].id == workerId) {
      return workerStats[i];
    }
  }
  return null;
}

server.post('/join', function(req, res) {
  if (finished) {
    res.send("0");
  } else {
    var mips = req.body.mips;
    if (req.body.workerId) {
      var id = req.body.workerId;
    } else {
      var id = crypto.randomBytes(20).toString('hex');
    }
    if (!findWorker(id)) {
      server.workers.push({
        id: id,
        lastHeartbeat: new Date()
      });
    }

    if (!findWorkerStats(id)) {
      workerStats.push({
        id: id,
        linesCompleted: 0,
        resultsFound: 0
      });
    }

    if (server.unsentBlocks.length < 75) {
      blocks.createMoreBlocks(server, function() {
        var block = server.unsentBlocks.pop();
        if (!block) {
          res.send("0")
        } else {
          block.workerId = id;
          block.nameToSearch = process.argv[2];
          server.inProgressBlocks.push(block);
          console.log('Worker \"' + id + '\" has joined.');
          res.send(block);
        }
      });
    } else {
      var block = server.unsentBlocks.pop();
      block.workerId = id;
      block.nameToSearch = process.argv[2];
      server.inProgressBlocks.push(block);
      console.log('Worker \"' + id + '\" has joined.');
      res.send(block);
    }
  }

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
    var stats = findWorkerStats(req.body.workerId);
    stats.linesCompleted += Math.abs(req.body.rangeEnd - req.body.rangeStart);
    worker.lastLineCompleted = req.body.rangeEnd;
    server.db.run("UPDATE names SET completed = 1 WHERE id >= " + req.body.rangeStart + " AND id < " + req.body.rangeEnd + ";");
    res.send("1");
  } else {
    res.send("0");
  }
});

var findBlock = function(workerId) {
  for (var i = 0; i < server.inProgressBlocks.length; i++) {
    if (server.inProgressBlocks[i].workerId == workerId) {
      return i;
    }
  }
  return -1;
}

server.post('/completed', function(req, res) {
  var start = req.body.blockStart;
  var size = req.body.blockSize;
  server.db.run("UPDATE names SET completed = 1 WHERE id >= " + start + " AND id < " + (start + size) + ";", function() {
    server.db.get("SELECT name FROM names WHERE completed = 0 limit 1;", function(err, row) {
      if (typeof(row) === 'undefined') {
        finished = true;
      }
    });
  });
  var blockIndex = findBlock(req.body.workerId);
  if (blockIndex != -1) {
    server.inProgressBlocks.splice(blockIndex, 1);
  }

  for (var i = 0; i < req.body.results.length; i++) {
    results.push(req.body.results[i]);
    console.log('Worker \"' + req.body.workerId + '\" has found a result at line ' + req.body.results[i]);
  }
  var stats = findWorkerStats(req.body.workerId);
  stats.resultsFound += req.body.results.length;

  res.sendStatus(200);
});


var port = 3000;
server.listen(port);

var deleteWorkers = function() {
  var now = new Date();
  for (var i = 0; i < server.workers.length; i++) {
    var beat = server.workers[i].lastHeartbeat;

    if (beat - now > 500) {
      server.workers.splice(i, 1);
    }
  }
}

setInterval(deleteWorkers, 100);
