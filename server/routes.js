const mysql = require('mysql')
const config = require('./config.json')

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db
});
connection.connect((err) => err && console.log(err));


/************************
 * MOVIE GAME ROUTES *
 ************************/

// Route: GET /movie_id/:title
const movie_id = async function(req, res) {
  const title = req.params.title.toLowerCase();
  connection.query(`
    SELECT movieID
    FROM Movie
    WHERE LOWER(title) = '${title}'
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data[0]);
    }
  });
}

// Route: GET /movie_people/:movie_id
const movie_people = async function(req, res) {
  const movie_id = req.params.movie_id;
  connection.query(`
    (SELECT personID
    FROM DirectingRole
    WHERE movieID = '${movie_id}')
    UNION
    (SELECT personID
    FROM ActingRole
    WHERE movieID = '${movie_id}')
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data);
    }
  });
}

module.exports = {
  movie_people,
  movie_id
}
