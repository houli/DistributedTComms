var blockSize = 1000;
var numOfBlocks = 100;
module.exports = {
  createBlock: function(server, startIndex, i, callback) {
    var index = startIndex + i * blockSize;
    var select = "SELECT name FROM names WHERE id >= " + index + " AND id < " + (index + blockSize) + ";";
    var resultSet = {
      names: [],
      start: index,
      size: blockSize
    };
    server.db.all(select, function(err, rows) {
      resultSet.names = rows;
      server.unsentBlocks.push(resultSet);
      callback();
    });
  },
  createMoreBlocks: function(server, callback) {
    if (server.databaseIndex < server.dbSize) {
      var startIndex = server.databaseIndex;
      server.databaseIndex += numOfBlocks * blockSize;
      var callbackCount = 0;
      for (var i = 0; i < numOfBlocks; i++) {
        this.createBlock(server, startIndex, i, function() {
          callbackCount++;
          if (callbackCount === numOfBlocks) {
            callback();
          }
        });
      }
    }
    else {
      callback();
    }
  }
};
