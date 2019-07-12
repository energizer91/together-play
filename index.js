const app = require('./modules/web');
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

server.listen(app.get('port'), () => console.log('App is listening on port', app.get('port')));

const connections = new Map();

function random(length = 7) {
  return Math.random().toString(36).substring(length);
}

class NotFoundError extends Error {
  constructor(message) {
    super(message || 'Not Found');

    this.status = 404;
  }
}

wss.on('connection', (ws, req) => {
  const session = (req.url || '').slice(1);
  console.log('connection', session);

  if (!connections.has(session)) {
    console.error('Session invalid');
    ws.close(4000, 'Session invalid');

    return;
  }

  const connection = connections.get(session);

  connection.users.add(ws);

  ws.on('close', (code, reason) => {
    console.log('websocket close', session, code, reason);

    const connection = connections.get(session);

    if (connection.users.has(ws)) {
      connection.users.delete(ws);
    }

    if (connection.users.size === 0) {
      connections.delete(session);
      console.log('session', session, 'has been removed');
    }
  });

  ws.on('error', (code, reason) => {
    console.log('websocket error', session, code, reason);

    const connection = connections.get(session);

    if (connection.users.has(ws)) {
      connection.users.delete(ws);
    }
  });

  ws.on('message', message => {
    console.log('message', message);

    const connection = connections.get(session);

    for (let user of connection.users) {
      if (user !== ws) {
        user.send(message);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('oh hi there');
});

app.get('/connection/:connectionId', (req, res, next) => {
  const id = req.params.connectionId;

  if (!id) {
    return next(new Error('No connection id specified'));
  }

  if (!connections.has(id)) {
    return next(new NotFoundError('Connection not found'));
  }

  return res.send('ok');
});

app.post('/connection', (req, res) => {
  const hash = random();

  const connection = {
    id: hash,
    users: new Set()
  };

  connections.set(hash, connection);

  res.send(hash);
});

app.use((req, res, next) => {
  return next(new NotFoundError());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  return res.send('error ' + err.message);
});
