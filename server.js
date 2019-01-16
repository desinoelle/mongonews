// Required packages
var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");
// Mongo database models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
// Set up handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// For connecting mongo database to mongoose
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
//var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
//mongoose.connect(MONGODB_URI);

// Routes
// Index route
app.get("/", function(req, res) {
  res.render("index");
});

// Saved articles route
app.get("/saved", function(req, res) {
  res.render("saved");
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});