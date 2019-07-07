const express = require('express');
const config = require('config');

const app = express();
const port = process.env.PORT || config.get('http.port');

app.listen(port, () => console.log('App is listening on port', port));

module.exports = app;


