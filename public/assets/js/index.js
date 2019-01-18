$(document).ready(function() {
  // References to page elements
  var pageArticles = $(".page-articles");
  $(document).on("click", ".btn.save", saveArticle);
  $(document).on("click", ".scrape-new", scrapeArticles);
  $(".clear").on("click", clearArticles);

  function initPage() {
    // Empty div for articles on the page (unsaved articles)
    // If there are scraped articles, display them.
    // If not, display a message saying no articles
    $.get("/api/headlines?saved=false").then(function(data) {
      pageArticles.empty();
      if (data && data.length) {
        displayArticles(data);
      } else {
        renderEmpty();
      }
    });
  }

  function displayArticles(articles) {
    // Save JSON objects of articles to an array
    var theArticles = [];
    // Create a card for each article
    for (var i = 0; i < articles.length; i++) {
      theArticles.push(makeCard(articles[i]));
    }
    // Display cards in pageArticles div
    pageArticles.append(theArticles);
  }

  function makeCard(article) {
    // Create cards adding article title, link, headline, and button for saving article
    var card = $("<div class='card' style='width: 18rem'>");
    // Header image
    var cardImg = $("<img class='card-img-top' src=" + "" + "alt='Card image cap'>");
    // Card body and body elements
    var cardBody = $("<div class='card-body'>");
    var cardTitle = $("<h5 class='card-title'");
    var cardText = $("<p class='card-text'");
    var cardButton = $("<a class='btn btn-primary'>");

    // Append link and headline to title
    cardTitle.append(
      $("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
        .attr("href", article.url)
        .text(article.headline)
    );
    // Append article summary to text
    cardText.append(article.summary);
    // Append title, text, and button to card body
    cardBody.append(cardTitle, cardText, cardButton);
  
    // Append img and body to card
    card.append(cardImg, cardBody);
    // Acts as a reference to the specific article when the user wants to save it
    card.data("_id", article._id);
    // Return new card
    return card;
  }

  function renderEmpty() {
    // This function renders some HTML to the page explaining we don't have any articles to view
    // Using a joined array of HTML string data because it's easier to read/change than a concatenated string
    var emptyAlert = $(
      [
        "<div class='alert alert-warning text-center'>",
        "<h4>Uh Oh. Looks like we don't have any new articles.</h4>",
        "</div>",
        "<div class='card'>",
        "<div class='card-header text-center'>",
        "<h3>What Would You Like To Do?</h3>",
        "</div>",
        "<div class='card-body text-center'>",
        "<h4><a class='scrape-new'>Try Scraping New Articles</a></h4>",
        "<h4><a href='/saved'>Go to Saved Articles</a></h4>",
        "</div>",
        "</div>"
      ].join("")
    );
    // Appending this data to the page
    articleContainer.append(emptyAlert);
  }

  function saveArticle() {
    // This function is triggered when the user wants to save an article
    // When we rendered the article initially, we attached a javascript object containing the headline id
    // to the element using the .data method. Here we retrieve that.
    var articleToSave = $(this)
      .parents(".card")
      .data();

    // Remove card from page
    $(this)
      .parents(".card")
      .remove();

    articleToSave.saved = true;
    // Using a patch method to be semantic since this is an update to an existing record in our collection
    $.ajax({
      method: "PUT",
      url: "/api/headlines/" + articleToSave._id,
      data: articleToSave
    }).then(function(data) {
      // If the data was saved successfully
      if (data.saved) {
        // Run the initPage function again. This will reload the entire list of articles
        initPage();
      }
    });
  }

  function scrapeArticles() {
    // This function handles the user clicking any "scrape new article" buttons
    $.get("/api/fetch").then(function(data) {
      // If we are able to successfully scrape the NYTIMES and compare the articles to those
      // already in our collection, re render the articles on the page
      // and let the user know how many unique articles we were able to save
      initPage();
      bootbox.alert($("<h3 class='text-center m-top-80'>").text(data.message));
    });
  }

  function clearArticles() {
    $.get("api/clear").then(function() {
      articleContainer.empty();
      initPage();
    });
  }
});
