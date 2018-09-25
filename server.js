'use strict';

// Application Dependencies
// ExpressJS allows us to use the "app.get" syntax
const express = require('express');

// Superagent makes our proxied API requests
const superagent = require('superagent');

// Instantiate ExpressJS so we can utilize its methods
const app = express();

// Making sure the server knows which poty yo listen for requests on
const PORT = process.env.PORT || 3000;

// Application Middleware
// If you have a public folder with some CSS files..
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// Setting the view engine for server-side templating
app.set('view engine', 'ejs');

app.get('/', (request, response) => response.render('pages/index'));


// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// Helper Functions

// For looking up the ISBN
function isbnLookup(info) {
  info.industryIdentifiers.forEach(element => {
    if (element.type === 'ISBN_13') {
      return element.identifier;
    }
  })
}

// Error handling
function processError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// No API key required
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  console.log(request.body);
  if (request.body.search[1] === 'title') {
    url += `+intitle:${request.body.search[0]}`;
  }
  if (request.body.search[1] === 'author') {
    url += `+inauthor:${request.body.search[0]}`;
  }
  superagent.get(url)
    .then(apiResponse => {
      const bookResult = apiResponse.body.items.map(book => {
        new Book(book.volumeInfo); // volumeInfo comes from the API
      });
      return bookResult;
    })
    // .then( for rendering the books in an EJS file)
    .then(results => response.render('pages/searches/show', {bookInfo: results}))
    // .catch ( the the error handling)
    .catch(error => processError(error, response));
}

function Book(info) {
  const placegholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';
  this.title = info.title;
  this.author = info.authors;
  // Needed a ternary for ISBN
  this.isbn = isbnLookup(info) || 'No ISBN Available';
  // Need a ternary for image
  this.img_url = info.imageLinks === undefined ? placegholderImage : info.imageLinks.thumbnail;
  this.description = info.description;

}
