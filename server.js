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

app.get('/hello', (request, response) => response.render('pages/index'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
