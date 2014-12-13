module.exports = {
  createBlock: function(server, i) {
    var index = server.databaseIndex + i * 50;
    console.log(i);
    var select = "SELECT name FROM names WHERE id >= " + index + " AND id < " + (index + 50) + ";";
    var resultSet = {
      names: [],
      start: index,
      size: 50,
      workerId: null
    };
    server.db.each(select, function(err, row) {
      resultSet.names.push(row.name);
    }, function() {
      server.unsentBlocks.push(resultSet);
      server.databaseIndex += 50;
      console.log(resultSet);
    });
  }
};
