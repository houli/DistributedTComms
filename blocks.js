module.exports = {
  createBlock: function(server, startIndex, i) {
    var index = startIndex + i * 50;
    var select = "SELECT name FROM names WHERE id >= " + index + " AND id < " + (index + 50) + ";";
    var resultSet = {
      names: [],
      start: index,
      size: 50
    };
    server.db.each(select, function(err, row) {
      resultSet.names.push(row.name);
    }, function() {
      server.unsentBlocks.push(resultSet);
    });
  },
  createMoreBlocks: function(server) {
    var startIndex = server.databaseIndex;
    server.databaseIndex += 500;
    for (var i = 0; i < 10; i++) {
      this.createBlock(server, startIndex, i);
    }
  }
};
