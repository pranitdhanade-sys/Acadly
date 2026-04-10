"use strict";

const path = require("path");

// Mongoose is installed under Backend/node_modules; this repo loads DB helpers from DataBase/.
try {
  module.exports = require("mongoose");
} catch {
  module.exports = require(path.join(__dirname, "../Backend/node_modules/mongoose"));
}
