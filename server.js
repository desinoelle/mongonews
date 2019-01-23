// Require these
var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");

// Models
var db = require("./models");

// Scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 3000

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

// Connect to db
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

// Routes
// Home page (unsaved articles)
app.get("/", function (req, res) {
    db.Article.find({ "saved": false }, function (error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("index", hbsObject);
    });
});
// Saved articles page
app.get("/saved", function (req, res) {
    db.Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});

// Scrape articles
app.get("/scrape", function (req, res) {
    // Use axios to get nyt articles
    axios.get("https://www.nytimes.com/section/us").then(function (response) {
        // Load cheerio to shorthand seletor
        var $ = cheerio.load(response.data);
        $("div.article").each(function (i, element) {

            var result = {};
            // Grab title, link, and summary and save to results object
            result.title = $(element)
                .children("h5.headline")
                .text();
            result.link = $(element)
                .find("a")
                .attr("href");
            result.summary = $(element)
                .find("p.summary")
                .text();

            // Create new article from scraped info
            db.Article.create(result) 
            .then(function(data) {
                console.log(data);
            })
            .catch(function(err) {
                return res.json(err)
            });
        });
        res.send("Scrape Complete");
    });
});

// Clear unsaved articles
app.get('/clear', function(req, res) {
    db.Article.remove({ saved: false}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('removed');
        }
    });
    res.redirect('/');
});

// Get scraped articles
app.get("/articles", function (req, res) {
    // Grab every doc in the Articles array
    db.Article.find({}, function (error, data) {
        if (error) {
            console.log(error);
        }
        else {
            res.json(data);
        }
    });
});

// Specific article for populating its note
app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ "_id": req.params.id })
    .populate("note")
    .then(function (error, data) {
        if (error) {
            console.log(error);
        }
        else {
            res.json(data);
        }
    });
});

// Save article by its id
app.post("/articles/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
    .then(function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            res.send(data);
        }
    });
});

// Creating a new note
app.post("/notes/save/:id", function (req, res) {
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body)
    // Save the new note the db
    newNote.save(function (error, note) {
        if (error) {
            console.log(error);
        }
        else {
            db.Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "notes": note } })
            .then(function (err) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    res.send(note);
                }
            });
        }
    });
});

// Delete note
app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
    db.Note.findOneAndRemove({ "_id": req.params.note_id }, function (err) {
        // Log any errors
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            db.Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } })
            .exec(function (err) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    res.send("Note Deleted");
                }
            });
        }
    });
});

// Listen on port
app.listen(PORT, function () {
    console.log("App running on port " + PORT);
});
