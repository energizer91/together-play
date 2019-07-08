const express = require('express');
const config = require('config');

const app = express();
const port = process.env.PORT || config.get('http.port');

app.set('port', port);

module.exports = app;


