'use strict';

//Application Dependencies
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const app = express();
const methodOverride = require('method-override');

const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

app.use(methodOverride(request => {
  if( request.body && typeof request.body ==='object' && '_method' in request.body) {
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}))

const client = new pg.Client('postgres://localhost:5432/book_app');
client.connect();
client.on('error', err => console.log(err));

// Setting the view engine for server-side templating
app.set('view engine', 'ejs');

app.get('/', getBooks);
app.get('/new', showForm); //need to do this for the form page
app.post('/searches', createSearch);
app.get('/books/:book_id', getOneBook);
app.put('/books/:id', updateBook);
app.post('/books', createBook);
app.delete('/books/:id', deleteBook);


// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// Helper Functions
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

//show the form fields
function showForm (request, response) {
  response.render('pages/searches/new')
}

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
  this.isbn = isbnLookup(info) || 'No ISBN Available';
  this.img_url = info.imageLinks === undefined ? placegholderImage : info.imageLinks.thumbnail;
  this.description = info.description === undefined ? 'No description available' : info.description;
}

function getBooks (request, response) {
  let SQL = 'SELECT * FROM books;';

  return client.query(SQL)
    .then(results => {
      if (results.rows.rowCount === 0) {
        response.render('pages/searches/new');
      } else {
        response.render('pages/index', {results: results.rows});
      }
    })
    .catch(processError);
}

function getOneBook( request, response){
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [request.params.book_id];

  return client.query(SQL, values)
    .then(result => response.render('pages/books/show', {book: result.rows[0]}))
    .catch(processError);
}

function createBook(request, response) {
  let bookshelf = request.body.bookshelf.toLowerCase();

  let {title, author, isbn, img_url, description} = request.body;
  let SQL = 'INSERT INTO books (title, author, isbn, img_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;';
  let values = [title, author, isbn, img_url, description, bookshelf];

  return client.query(SQL, values)
    .then(result => response.redirect(`/books/${result.rows[0].id}`))
    .catch(processError);
}

function updateBook(request, response) {
  let {title, author, isbn, img_url, description, bookshelf} = request.body;
  let SQL = `UPDATE books SET title=$1, author=$2, isbn=$3, img_url=$4, description=$5, bookshelf=$6 WHERE id=$7;`;
  let values = [title, author, isbn, img_url, description, bookshelf, request.params.id];

  client.query(SQL, values)
    .then(response.redirect(`/books/${request.params.id}`))
    .catch(err => processError(err, response));
}

function deleteBook(req, resp) {
  let SQL = 'DELETE from books WHERE id=$1;';
  let values = [req.params.id];

  client.query(SQL, values)
    .then(resp.redirect('/'))
    .catch(err => processError(err, resp));
}
