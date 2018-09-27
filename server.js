'use strict';

// Application Dependencies
// ExpressJS allows us to use the "app.get" syntax
const express = require('express');

// Superagent makes our proxied API requests
const superagent = require('superagent');

const pg = require('pg');
require('dotenv').config();

// Instantiate ExpressJS so we can utilize its methods
const app = express();

// Making sure the server knows which poty yo listen for requests on
const PORT = process.env.PORT || 3000;

// Application Middleware
// If you have a public folder with some CSS files..
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.log(err));

// Setting the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
app.get('/', getSavedBooks);
// app.get('/', (request, response) => response.render('pages/index'));

app.get('/searches/new', (request, response) => {
  response.render('pages/searches/new');
});

app.get('/book/:id', bookDetails);

// app.post('/add', addBook);

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

function bookDetails(request, response) {
  const SQL = 'SELECT * FROM books WHERE id=$1;';
  const values = [request.params.id];
  client.query(SQL, values)
    .then(result => response.render('pages/books/show', { book:result.rows[0]}))
    .catch(processError);
}

// Getting books from Database
function getSavedBooks(request, response) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => response.render('pages/index', {bookInfo: results.rows}))
    .catch(processError);
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
        return new Book(book.volumeInfo); // volumeInfo comes from the API
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
  this.title = info.title === undefined ? 'No title available' : info.title;
  this.author = info.authors === undefined ? 'No Author available': info.authors;
  // Needed a ternary for ISBN
  this.isbn = isbnLookup(info) || 'No ISBN Available';
  // Need a ternary for image
  this.img_url = info.imageLinks === undefined ? placegholderImage : info.imageLinks.thumbnail;
  this.description = info.description === undefined ? 'No description available' : info.description;
  this.bookshelf = 'Please put in bookshelf';
}

Book.prototype = {
  save: function() {
    const SQL = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);`;
    const values = [this.author, this.title, this.image_url, this.description, this.bookshelf];
    client.query(SQL, values)
      .then(result => response.render('index', { book:result.rows[0]}))
      .catch(processError);
  }
}
