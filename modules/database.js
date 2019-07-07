const mongoose = require('mongoose');

const User = new mongoose.Schema({
  login: String,
  password: String
});
