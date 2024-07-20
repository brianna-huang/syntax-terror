const mysql = require('mysql')
const config = require('./config.json')
//need to use npm install node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

const authorizationKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MTQ0NjAzMzhhNzc5Y2MyYTFjN2ZiZmY2YmFjYjYxYSIsIm5iZiI6MTcxOTk3MDMxOC4zOTEwODEsInN1YiI6IjY2Njc1ZTg0ZjlkNjI5MGE0YmRkYjM3NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9qM0vHqXCj8eOXw5evxNitTQR8NTqj9c4hGsx4IPFVQ'

/************************
 * USER Routes *
 ************************/
// Route: SET /new_user
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
  const titleWithWildcards = `%${title}%`;

  const query = `
    SELECT movieID, title, releaseYear 
    FROM Movie 
    WHERE LOWER(title) LIKE ? 
    LIMIT 10
  `;

  connection.query(query, [titleWithWildcards], (err, data) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.length === 0) {
      return res.json([]);
    } else {
      return res.json(data);
    }
  });
};

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

// Route: GET /movie_id_two
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

// Route: SET /user_movie_history?userID=?&movieID=?
const user_movie_history = async function(req, res) {
  const userID = req.query.userID;
  const movieID = req.query.movieID;

  const query = `
  INSERT INTO UserMovieHistory (userID, movieID, guessCount) 
  VALUES (?, ?, 1) 
  ON DUPLICATE KEY UPDATE guessCount = guessCount + 1;
  `;

  connection.query(query, [userID, movieID], (err, data) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.length === 0) {
      return res.json([]);
    } else {
      return res.json(data);
    }
  });
};

// Route: SET /user_person_history?userID=?&personID=?
const user_person_history = async function(req, res) {
  const userID = req.query.userID;
  const personID = req.query.personID;

  const query = `
  INSERT INTO UserPersonHistory (userID, personID, guessCount) 
  VALUES (?, ?, 1) 
  ON DUPLICATE KEY UPDATE guessCount = guessCount + 1;
  `;

  connection.query(query, [userID, personID], (err, data) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.length === 0) {
      return res.json([]);
    } else {
      return res.json(data);
    }
  });
};

//ROUTE: GET /movie_poster?movieID=?
const movie_poster = async function(req, res) {
  const movieID = req.query.movieID;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${authorizationKey}`
    }
  };

  try {
    const response = await fetch(`https://api.themoviedb.org/3/find/${movieID}?external_source=imdb_id`, options);
    const data = await response.json();
    res.json(data['movie_results'][0].poster_path);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
};



module.exports = {
  movie_people,
  movie_id,
  movie_id_two,
  new_user,
  user_movie_history,
  user_person_history,
  movie_poster
}
