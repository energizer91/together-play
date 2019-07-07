const wss = require('./modules/websocket');
const app = require('./modules/web');

const connections = new Map();

function random(length = 7) {
  return Math.random().toString(36).substring(length);
}

wss.on('connection', (ws, req) => {
  const session = (req.url || '').slice(1);
  console.log('connection', session);

  if (!connections.has(session)) {
    console.error('Session invalid');
    ws.close(1004, 'Session invalid');
  }

  const connection = connections.get(session);

  connection.users.push(ws);

  ws.on('message', message => {
    console.log('message', message);

    const connection = connections.get(session);

    for (let i = 0; i < connection.users.length; i++) {
      if (connection.users[i] !== ws) {
        connection.users[i].send(message);
      }
    }
  });
});

app.post('/connection', (req, res, next) => {
  const hash = random();

  const connection = {
    id: hash,
    users: []
  };

  connections.set(hash, connection);

  res.send(hash);
});
