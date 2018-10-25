// Create a new server on port 4000
var http = require('http');
var connect = require('connect');
var app = connect();
new Promise((resolve,reject)=>{
    var server = http.createServer(app).listen(4000);
// Maintain a hash of all connected sockets
var sockets = {}, nextSocketId = 0;
server.on('connection', function (socket) {
  // Add a newly connected socket
  var socketId = nextSocketId++;
  sockets[socketId] = socket;
  console.log('socket', socketId, 'opened');

  // Remove the socket when it closes
  socket.on('close', function () {
    console.log('socket', socketId, 'closed');
    delete sockets[socketId];
  });

  // Extend socket lifetime for demo purposes
  socket.setTimeout(4000);
});

server.close(function () { console.log('Server closed!'); });
// Destroy all open sockets
for (var socketId in sockets) {
  console.log('socket', socketId, 'destroyed');
  sockets[socketId].destroy();
}
});

