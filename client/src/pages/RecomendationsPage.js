import { useEffect, useState } from 'react';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const config = require('../config.json');

export default function Recommendations() {
  const [curr_userID, setCurrUserID] = useState(null);
  const [movieRecs, setMovieRecs] = useState([]);
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  console.log(movieRecs)

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
      fetch(`http://${config.server_host}:${config.server_port}/movie_recs?userID=${curr_userID}`)
        .then(res => res.json())
        .then(resJson => {
          setMovieRecs(resJson);
          resJson.forEach(movie => {
            fetch(`http://${config.server_host}:${config.server_port}/movie_info_TMDB?movieID=${movie.movieID}`)
              .then(res => res.json())
              .then(info => {
                if (info.movie_results && info.movie_results.length > 0) {
                  const movieInfo = info.movie_results[0];
                  setMovieRecs(prevRecs => prevRecs.map(m => m.movieID === movie.movieID ? { ...m, posterPath: movieInfo.poster_path, description: movieInfo.overview } : m));
                }
              })
              .catch(error => console.error('Error fetching movie info:', error));
          });
        })
        .catch(error => console.error('Error fetching movie recommendations:', error));
    }
  }, [curr_userID]);

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
            <h2>Welcome, {user.name}! Recommendations</h2>
          </div>
        ) : (
          <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
            <h2>Please <span style={{ color: 'blue', cursor: 'pointer' }} onClick={loginWithRedirect}>log in</span> to see your recommendations.</h2>
          </div>
        )}
      </div>

      {isAuthenticated && movieRecs.length > 0 && (
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
      )}

      {isAuthenticated && movieRecs.length === 0 && (
        <p>No recommendations available.</p>
      )}
    </Container>
  );
}