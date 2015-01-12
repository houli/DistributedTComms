/*
** Eoin Houlihan 13323304
** Conor Brennan 13327472
** Emmet Broaders 13321123
*/

var childprocess = require('child_process');
var fs = require('fs');
var HashMap = require('hashmap').HashMap;
var crypto = require('crypto');

// Configure server and middleware
var express = require('express');
var server = express();
var compression = require('compression');
server.set('views', __dirname + '/views');
server.set('view engine', 'ejs');
server.use(require('body-parser').json());
server.use(compression());
server.use('/files', express.static('files'));

// Initalise server
server.workers = new HashMap();

var results = [];
var workerStats = new HashMap();
var finished = false;

childprocess.exec('python file_maker.py', function(error, stdout, stderr) {
  console.log("Files made");
  fs.readFile('files/numfile.txt', 'utf8', function(err, data) {
    server.numFiles = parseInt(data, 10);

    var port = 3000;
    server.listen(port);
    console.log("Server listening on port " + port);

    server.unsentFiles = new Array(server.numFiles);
    server.inProgressFiles = [];
    for (var i = 0; i < server.unsentFiles.length; i++) {
      server.unsentFiles[i] = { fileNumber: i, completed: 0 };
    }
  });
});

server.get('/', function(req, res) {
  res.render('stats', {
    connectedWorkers: server.workers.count(),
    results: results,
    workerStats: workerStats
  });
});


var findWorkerStats = function(workerId) {
  return workerStats.get(workerId) || null;
}

server.post('/join', function(req, res) {
  if (finished) {
    res.send("0");
  } else {
    if (req.body.workerId) {
      var id = req.body.workerId;
    } else {
      var id = crypto.randomBytes(20).toString('hex');
    }
    if (!findWorker(id)) {
      server.workers.set(id, { lastHeartbeat: new Date() });
    }

    if (!findWorkerStats(id)) {
      workerStats.set(id, { linesCompleted: 0, resultsFound: 0});
    }
    var fileInfo = server.unsentFiles.pop();
    if (fileInfo) {
      server.inProgressFiles.push(fileInfo);
      res.send({
        workerId: id,
        nameToSearch: process.argv[2],
        fileNumber: fileInfo.fileNumber,
        linesCompleted: fileInfo.completed
      });
      console.log('Worker \"' + id + '\" has joined.');
    } else {
      res.send("0");
    }
  }

});


var findWorker = function(workerId) {
  return server.workers.get(workerId) || null;
}

server.post('/heartbeat', function(req, res) {
  var now = new Date();
  var worker = findWorker(req.body.workerId);
  if (worker) {
    worker.lastHeartbeat = now;
    var stats = findWorkerStats(req.body.workerId);
    stats.linesCompleted += Math.abs(req.body.rangeEnd - req.body.rangeStart);
    worker.lastLineCompleted = req.body.rangeEnd;
    res.send("1");
  } else {
    res.send("0");
  }
});

var findFile = function(fileNumber) {
  for (var i = 0; i < server.inProgressFiles.length; i++) {
    if (server.inProgressFiles[i].fileNumber === fileNumber) {
      return i;
    }
  }
  return -1;
}

server.post('/completed', function(req, res) {
  var start = req.body.blockStart;
  var size = req.body.blockSize;
  if (server.unsentFiles.length === 0) {
    finished = true;
  }
  var fileIndex = parseInt(findFile(req.body.fileNumber), 10);
  if (fileIndex != -1) {
    server.inProgressFiles.splice(fileIndex, 1);
  }

  for (var i = 0; i < req.body.results.length; i++) {
    results.push(req.body.results[i]);
    console.log('Worker \"' + req.body.workerId + '\" has found a result at line ' + req.body.results[i]);
  }
  var stats = findWorkerStats(req.body.workerId);
  stats.resultsFound += req.body.results.length;

  res.sendStatus(200);
});

server.post('/result', function(req, res) {
  res.sendStatus(200);
});

var deleteWorkers = function() {
  var now = new Date();
  var toDelete = [];
  server.workers.forEach(function(value, key) {
    if (now - value.lastHeartbeat > 7500) {
      toDelete.push(key);
    }
  });
  for (var i = 0; i < toDelete.length; i++) {
    server.workers.remove(toDelete[i]);
  }
};

setInterval(deleteWorkers, 15000);
