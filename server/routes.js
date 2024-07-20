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
 * USER Routes *
 ************************/
// Route: GET /new_user
const new_user = async function(req, res) {
  const username = req.query.username;
  const password = req.query.password;
  const email = req.query.email;
  const authToken = req.query.authToken;

  if (!username || !password || !email || !authToken) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  connection.query(`
    INSERT INTO User (username, email, password, authToken)
    VALUES ('${username}', '${email}', '${password}', '${authToken}')
    ON DUPLICATE KEY UPDATE authToken = '${authToken}';
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data[0]);
    }
  });
}


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
      res.json({ message: 'User created/updated successfully', results });
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

// Route: GET /movie_id2
const movie_id_two = async function(req, res) {
  const movie_id1 = req.query.movie_id1;
  const movie_id2 = req.query.movie_id2;
  connection.query(`
  SELECT a1.personID
  FROM ActingRole a1 JOIN ActingRole a2 ON a1.personID = a2.personID
  WHERE a1.movieID = '${movie_id1}' AND a2.movieID = '${movie_id2}'
  UNION
  SELECT d1.personID
  FROM DirectingRole d1 JOIN DirectingRole d2 ON d1.personID = d2.personID
  WHERE d1.movieID = '${movie_id1}' AND d2.movieID = '${movie_id2}'

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
  movie_id,
  movie_id_two,
  new_user
}
