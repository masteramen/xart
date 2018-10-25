var Hexo = require('hexo');
var userHome = require('user-home');



function startHexo(hexo){
  hexo.on('server',(server)=>{
    console.log('server***************');
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

    hexo.on('exit',()=>{
      // Count down from 10 seconds
    // Close the server
    server.close(function () { console.log('Server closed!'); });
    // Destroy all open sockets
    for (var socketId in sockets) {
      console.log('socket', socketId, 'destroyed');
      sockets[socketId].destroy();
    }
    });
});
//hexo.env.init=true;
hexo.init().then(function(){
hexo.call('server',{port:40000}).then(function(){

}).catch(function(err){
  return hexo.exit(err);
});
});
}

function stopHexo(hexo){
  hexo.unwatch();
  return hexo.exit();
}
console.log(userHome);
var repos = userHome+'/git/hexo';
console.log(repos);
var hexo = new Hexo(repos, {});
startHexo(hexo);

module.exports={startHexo,stopHexo}