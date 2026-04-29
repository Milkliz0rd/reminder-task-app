const express = require("express");
const app = express();

// Middleware are settings here for test & server using
app.use(express.json());

module.exports = app;
