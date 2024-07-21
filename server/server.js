const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
//npm i express-openid-connect dotenv
const { auth } = require('express-openid-connect');
require('dotenv').config();
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASEURL,
  clientID: process.env.CLIENTID,
  issuerBaseURL: process.env.ISSUER
};

const app = express();
app.use(cors({
  origin: '*',
}));

app.use(auth(authConfig));

app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
});
// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js

app.get('/movie_people/:movie_id', routes.movie_people);
app.get('/movie_id/:title', routes.movie_id);
app.get('/new_user', routes.new_user);
app.get('/movie_id_two', routes.movie_id_two);
app.get('/user_movie_history', routes.user_movie_history);
app.get('/user_person_history', routes.user_person_history);
app.get('/movie_poster', routes.movie_poster);
app.get('/get_auth', routes.get_auth);
app.get('/get_userID', routes.get_userID);

app.get('/track-user', routes.track_user);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
