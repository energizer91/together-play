const config = require('config');
const WebSocket = require('ws');

const wss = new WebSocket.Server(config.get('websocket'));

module.exports = wss;
