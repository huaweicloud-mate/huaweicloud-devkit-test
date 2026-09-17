const fs = require('fs');
fs.writeFileSync(__dirname + '/ecs-marker.log', 'started ' + Date.now() + '\n');
setTimeout(() => {
  fs.appendFileSync(__dirname + '/ecs-marker.log', 'finished ' + Date.now() + '\n');
  console.log('NovaListServers fake done');
}, 15000);
