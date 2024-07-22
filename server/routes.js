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
  const { username, password, email, authToken } = req.body;

  if (!username || !password || !email || !authToken) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `
      INSERT INTO User (username, email, password, authToken)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE authToken = VALUES(authToken);
    `;
  connection.query(sql, [username, email, hashedPassword, authToken], (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data[0]);
    }
  });
}

// Route: SET /get_auth
const get_auth = async function(req, res) {
  const isAuthenticated = req.oidc.isAuthenticated();
  res.json({ isAuthenticated });
}

// Route: GET /track_user
const track_user = async function(req, res) {
  const userSub = req.query.userSub;
  const username = req.query.username;
  const email = req.query.email;

  if (!userSub || !username || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const checkUserSql = 'SELECT * FROM User WHERE authToken = ?';
    connection.query(checkUserSql, [userSub], async (err, results) => {
      if (err) {
        console.error('Database search error:', err);
        return res.status(500).json({ error: 'Database search error' });
      }

      if (results.length === 0) {
        // User does not exist, insert new user
        const insertSql = `
          INSERT INTO User (username, email, authToken)
          VALUES (?, ?, ?)
        `;
        connection.query(insertSql, [username, email, userSub], (err, result) => {
          if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ error: 'Database insert error' });
          }
          res.status(200).json({ message: 'New user added successfully' });
        });
      } else {
        // User exists, update token if necessary
        const updateSql = 'UPDATE User SET authToken = ? WHERE username = ?';
        connection.query(updateSql, [userSub, username], (err, result) => {
          if (err) {
            console.error('Database update error:', err);
            return res.status(500).json({ error: 'Database update error' });
          }
          res.status(200).json({ message: 'User updated successfully' });
        });
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
}

const get_userID = async function(req, res) {
  const authToken = req.query.userSub

  const query = `
    SELECT userID
    FROM User
    WHERE authToken = ?
  `;

  connection.query(query, [authToken], (err, data) => {
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

/************************
 * MOVIE GAME ROUTES *
 ************************/

// Route: GET /movie_id/:title/
const movie_id = async function(req, res) {
  const title = req.params.title.toLowerCase();
  const titleWithWildcards = `${title}%`;

  const query = `
    SELECT movieID, title, releaseYear 
    FROM Movie 
    WHERE LOWER(title) LIKE ? 
    ORDER BY releaseYear DESC 
    LIMIT 10;
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
  SELECT a1.personID, p1.name
  FROM ActingRole a1 JOIN ActingRole a2 ON a1.personID = a2.personID JOIN Person p1 ON p1.personID = a1.personID
  WHERE a1.movieID = '${movie_id1}' AND a2.movieID = '${movie_id2}'
  UNION
  SELECT d1.personID, p2.name
  FROM DirectingRole d1 JOIN DirectingRole d2 ON d1.personID = d2.personID JOIN Person p2 ON p2.personID = d1.personID 
  WHERE d1.movieID = '${movie_id1}' AND d2.movieID = '${movie_id2}'

  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json([]);
    } else {
      // console.log('Common People:', data)
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

/************************
 * MOVIE GAME ROUTES *
 ************************/

// Route: GET /top_movies?userID=?
const top_movies = async function(req, res) {
  const userID = req.query.userID;

  const query = `
  SELECT m.movieID, m.title, m.releaseYear, uh.guessCount
  FROM UserMovieHistory uh JOIN Movie m on uh.movieID = m.movieID
  WHERE uh.userID = ?
  ORDER BY uh.guessCount DESC
  LIMIT 5
  `;
  connection.query(query, [userID], (err, data) => {
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

// Route: GET /top_people?userID=?
const top_people = async function(req, res) {
  const userID = req.query.userID;

  const query = `
  SELECT p.personID, p.name, p.birthYear, p.deathYear, uh.guessCount
  FROM UserPersonHistory uh
  JOIN Person p ON uh.personID = p.personID
  WHERE uh.userID = 31
  ORDER BY uh.guessCount DESC
  LIMIT 5
  `;
  connection.query(query, [userID], (err, data) => {
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

//ROUTE: GET /movie_info_TMDB?movieID=?
const movie_info_TMDB = async function(req, res) {
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

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
};

//ROUTE: GET /person_info_TMDB?personID=?
const person_info_TMDB = async function(req, res) {
  const personID = req.query.personID;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${authorizationKey}`
    }
  };

  try {
    const response = await fetch(`https://api.themoviedb.org/3/find/${personID}?external_source=imdb_id`, options);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
};

// Route: GET /known_for_titles?personID=?
const known_for_titles = async function(req, res) {
  const personID = req.query.personID;

  const query = `
  SELECT k.movieID, m.title, m.releaseYear, m.runtimeMinutes, m.rating, GROUP_CONCAT(g.genre SEPARATOR ', ') AS genres
  FROM KnownForTitles k JOIN Movie m ON k.movieID = m.movieID
  JOIN MovieGenres mg ON m.movieID = mg.movieID
  JOIN Genre g ON mg.genreID = g.genreID
  WHERE k.personID = ?
  GROUP BY k.movieID, m.title, m.releaseYear, m.runtimeMinutes, m.rating;
  `;
  connection.query(query, [personID], (err, data) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.length === 0) {
      return res.json([]);
    } else {
      // console.log(data)
      return res.json(data);
    }
  });
};

module.exports = {
  movie_people,
  movie_id,
  movie_id_two,
  new_user,
  user_movie_history,
  user_person_history,
  movie_poster,
  get_auth,
  track_user,
  get_userID,
  top_movies,
  movie_info_TMDB,
  top_people,
  person_info_TMDB,
  known_for_titles
}
