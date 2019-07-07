const config = require('config');
const WebSocket = require('ws');

const wss = new WebSocket.Server(config.get('websocket'));

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log('message', message);
  });
});
