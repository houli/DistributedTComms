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

// Initialise server
server.workers = new HashMap();
var namesToSearch = [];

var results = [];
var workerStats = new HashMap();
var finished = false;

childprocess.exec('python file_maker.py', function(error, stdout, stderr) {
  for (var i = 2; i < process.argv.length; i++) {
    namesToSearch.push(process.argv[i]);
  }
  console.log("Files made");
  fs.readFile('files/numfile.txt', 'utf8', function(err, data) {
    server.config = JSON.parse(data);

    var port = 3000;
    server.listen(port);
    console.log("Server listening on port " + port);

    server.unsentFiles = new Array(server.config.numFiles);
    server.inProgressFiles = new HashMap();
    for (var i = 0; i < server.unsentFiles.length; i++) {
      server.unsentFiles[i] = {
        fileNumber: i,
        completed: 0
      };
    }
  });
});

server.get('/', function(req, res) {
  var count = 0;
  workerStats.forEach(function(value, key) {
    count += value.linesCompleted;
  });

  res.render('stats', {
    connectedWorkers: server.workers.count(),
    results: results,
    workerStats: workerStats,
    linesCompleted: count,
    totalLines: server.config.totalLines,
    results: results
  });
});


var findWorkerStats = function(workerId) {
  return workerStats.get(workerId) || null;
};

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
      server.workers.set(id, { lastHeartbeat: new Date(), joinTime: new Date() });
    }

    if (!findWorkerStats(id)) {
      workerStats.set(id, {
        linesCompleted: 0,
        resultsFound: 0,
        lastHeartbeat: new Date(),
        joinTime: new Date()
      });
    }
    var fileInfo = server.unsentFiles.pop();
    if (fileInfo) {
      server.inProgressFiles.set(id, fileInfo);
      res.send({
        workerId: id,
        namesToSearch: namesToSearch,
        fileNumber: fileInfo.fileNumber,
        linesCompleted: fileInfo.completed
      });
      console.log('Sent file ' + fileInfo.fileNumber + ' to worker \"' + id + '\"');
    } else {
      res.send("0");
    }
  }

});


var findWorker = function(workerId) {
  return server.workers.get(workerId) || null;
};

server.post('/heartbeat', function(req, res) {
  var now = new Date();
  var worker = findWorker(req.body.workerId);
  if (worker) {
    worker.lastHeartbeat = now;
    workerStats.get(req.body.workerId).lastHeartbeat = now;
    var stats = findWorkerStats(req.body.workerId);
    var newLines = Math.abs(req.body.rangeEnd - req.body.rangeStart);
    stats.linesCompleted = req.body.linesCompleted;
    worker.lastLineCompleted = req.body.rangeEnd;
    res.send("1");
  } else {
    res.send("0");
  }
});

server.post('/completed', function(req, res) {
  var start = req.body.blockStart;
  var size = req.body.blockSize;
  if (server.unsentFiles.length === 0) {
    finished = true;
  }
  server.inProgressFiles.remove(req.body.workerId);

  for (var i = 0; i < req.body.results.length; i++) {
    var curResult = (req.body.fileNumber * server.config.linesPerFile) + req.body.results[i].index;
    var name = req.body.results[i].name;
    results.push({
      lineNumber: curResult,
      name: name
    });
    console.log('Worker \"' + req.body.workerId + '\" has found ' + name + ' at line ' + curResult);
  }
  var stats = findWorkerStats(req.body.workerId);
  stats.resultsFound += req.body.results.length;

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
    var file = server.inProgressFiles.get(toDelete[i]);
    server.inProgressFiles.remove(toDelete[i]);
    server.unsentFiles.push(file);
  }
};

setInterval(deleteWorkers, 15000);
