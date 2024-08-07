import { useEffect, useState } from 'react';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const config = require('../config.json');

export default function Recommendations() {
  const [curr_userID, setCurrUserID] = useState(null);
  const [movieRecs, setMovieRecs] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [inTheatres, setInTheatres] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

 const fetchRecommendations = async (userID, page) => {
  try {
    const res = await fetch(`http://${config.server_host}:${config.server_port}/movie_recs?userID=${userID}&page=${page}&limit=5`);
    const resJson = await res.json();
    if (resJson.length < 5) {
      setHasMorePages(false); // No more pages if fewer than 5 movies are returned
    } else {
      setHasMorePages(true);
    }
    setMovieRecs(resJson);
    resJson.forEach(async (movie) => {
      try {
        const infoRes = await fetch(`http://${config.server_host}:${config.server_port}/movie_info_TMDB?movieID=${movie.movieID}`);
        const info = await infoRes.json();
        if (info.movie_results && info.movie_results.length > 0) {
          const movieInfo = info.movie_results[0];
          setMovieRecs(prevRecs => prevRecs.map(m => m.movieID === movie.movieID ? { ...m, posterPath: movieInfo.poster_path, description: movieInfo.overview } : m));
        }
      } catch (error) {
        console.error('Error fetching movie info:', error);
      }
    });
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
  }
};

  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`http://${config.server_host}:${config.server_port}/get_userID?userSub=${user.sub}`)
        .then(res => res.json())
        .then(resJson => setCurrUserID(resJson[0]?.userID)) // Ensure resJson[0] exists
        .catch(error => console.error('Error fetching user ID:', error));
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (curr_userID) {
      // Fetch top genres
      fetch(`http://${config.server_host}:${config.server_port}/top_genre_ids?userID=${curr_userID}`)
        .then(res => res.json())
        .then(resJson => setTopGenres(resJson.map(genre => genre.genreID)))
        .catch(error => console.error('Error fetching top genres:', error));

      // Fetch movie recommendations
      fetchRecommendations(curr_userID, currentPage);
    }
  }, [curr_userID, currentPage]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/in_theatres`)
      .then(res => res.json())
      .then(resJson => setInTheatres(resJson.results))
      .catch(error => console.error('Error fetching in theatres movies:', error));
  }, []);

  // Filter in-theatres movies by top genres
  const filteredInTheatres = inTheatres.filter(movie =>
    movie.genre_ids.some(genreID => topGenres.includes(genreID))
  );

  if (isLoading) {
    return <div>Loading...</div>; // Add a loading state
  }

  return (
    <Container>
      <div 
        style={{
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          paddingTop: '20px',
        }}
      >
        {isAuthenticated ? (
          <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
          </div>
        ) : (
          <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
            <h2>Please <span style={{ color: 'blue', cursor: 'pointer' }} onClick={loginWithRedirect}>log in</span> to see your recommendations.</h2>
          </div>
        )}
      </div>

      {isAuthenticated && movieRecs.length > 0 && (
        <>
          <h3>Recommended Movies based on Your Guess History</h3> {/* Title for Recommended Movies Table */}
          <TableContainer component={Paper} style={{ marginTop: '20px', width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Poster</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Release Year</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movieRecs.map((movie) => (
                  <TableRow key={movie.movieID}>
                    <TableCell>
                      {movie.posterPath && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w500/${movie.posterPath}`} 
                          alt={`${movie.title} poster`} 
                          style={{ maxWidth: '100px' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{movie.title}</TableCell>
                    <TableCell>{movie.releaseYear}</TableCell>
                    <TableCell>{movie.rating}</TableCell>
                    <TableCell>{movie.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
            <Button 
              variant="contained" 
              color="primary" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span style={{ margin: '0 10px' }}>Page {currentPage}</span>
            <Button 
              variant="contained" 
              color="primary" 
              disabled={!hasMorePages} 
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {isAuthenticated && movieRecs.length === 0 && (
        <p>No recommendations available.</p>
      )}

      {filteredInTheatres.length > 0 && (
        <>
          <h3>Your Recommended Movies Currently In Theatres</h3> {/* Title for In Theatres Table */}
          <TableContainer component={Paper} style={{ marginTop: '20px', width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Poster</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Release Date</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInTheatres.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      {movie.poster_path && (
                        <img 
                          src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} 
                          alt={`${movie.title} poster`} 
                          style={{ maxWidth: '100px' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{movie.title}</TableCell>
                    <TableCell>{movie.release_date}</TableCell>
                    <TableCell>{movie.overview}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
}