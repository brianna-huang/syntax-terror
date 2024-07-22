import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography } from '@mui/material';

const config = require('../config.json');

export default function GameHistoryPage() {
  const [curr_userID, setCurrUserID] = useState(null);
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  const [topMovies, setTopMovies] = useState([]);
  const [movieInfo, setMovieInfo] = useState({});
  const [topPeople, setTopPeople] = useState([]);
  const [personInfo, setPersonInfo] = useState({});
  const [knownForTitles, setKnownForTitles] = useState({});

  // console.log(topPeople)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`http://${config.server_host}:${config.server_port}/get_userID?userSub=${user.sub}`)
        .then(res => res.json())
        .then(resJson => {
          const userID = resJson[0]?.userID;
          setCurrUserID(userID);
          
          fetch(`http://${config.server_host}:${config.server_port}/top_movies?userID=${userID}`)
            .then(res => res.json())
            .then(data => {
              setTopMovies(data);
              
              data.forEach(movie => {
                fetch(`http://${config.server_host}:${config.server_port}/movie_info_TMDB?movieID=${movie.movieID}`)
                  .then(res => res.json())
                  .then(info => {
                    const movieInfoData = info.movie_results[0];
                    setMovieInfo(prevInfo => ({
                      ...prevInfo,
                      [movie.movieID]: {
                        overview: movieInfoData.overview,
                        posterPath: movieInfoData.poster_path
                      }
                    }));
                  })
                  .catch(error => console.error('Error fetching movie info:', error));
              });
            })
            .catch(error => console.error('Error fetching top movies:', error));
          
          fetch(`http://${config.server_host}:${config.server_port}/top_people?userID=${userID}`)
            .then(res => res.json())
            .then(data => {
              setTopPeople(data);
  
              data.forEach(person => {
                fetch(`http://${config.server_host}:${config.server_port}/person_info_TMDB?personID=${person.personID}`)
                  .then(res => res.json())
                  .then(info => {
                    const personInfoData = info.person_results[0];
                    setPersonInfo(prevInfo => ({
                      ...prevInfo,
                      [person.personID]: {
                        profilePath: personInfoData.profile_path
                      }
                    }));
                  })
                  .catch(error => console.error('Error fetching person info:', error));
  
                fetch(`http://${config.server_host}:${config.server_port}/known_for_titles?personID=${person.personID}`)
                  .then(res => res.json())
                  .then(titles => {
                    const movieTitles = titles.map(title => title.title).join(', ');
                    setKnownForTitles(prevTitles => ({
                      ...prevTitles,
                      [person.personID]: movieTitles
                    }));
                  })
                  .catch(error => console.error('Error fetching known for titles:', error));
              });
            })
            .catch(error => console.error('Error fetching top people:', error));
        })
        .catch(error => console.error('Error fetching user ID:', error));
    }
  }, [user, isAuthenticated]);
  

  return (
    <div 
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        height: '100vh', 
        paddingTop: '20px',
      }}
    >
      {isAuthenticated ? (
        <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
          <h2>Welcome, {user.name}!</h2>
        </div>
      ) : (
        <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
          <h2>Please <span style={{ color: 'blue', cursor: 'pointer' }} onClick={loginWithRedirect}>log in</span> to view your game history.</h2>
        </div>
      )}
  
      {isAuthenticated && topMovies.length > 0 && (
        <div style={{ width: '80%', marginTop: '20px' }}>
          <h3>Top Guessed Movies</h3>
          <Paper style={{ marginTop: '10px', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Release Year</TableCell>
                  <TableCell>Guess Count</TableCell>
                  <TableCell>Synopsis</TableCell>
                  <TableCell>Poster</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topMovies.map((movie) => {
                  const info = movieInfo[movie.movieID];
                  return (
                    <TableRow key={movie.movieID}>
                      <TableCell>{movie.title}</TableCell>
                      <TableCell>{movie.releaseYear}</TableCell>
                      <TableCell>{movie.guessCount}</TableCell>
                      <TableCell>
                        {info && info.overview}
                      </TableCell>
                      <TableCell>
                        {info && (
                          <img 
                            src={`https://image.tmdb.org/t/p/w500/${info.posterPath}`} 
                            alt={`${movie.title} poster`} 
                            style={{ maxWidth: '100px' }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </div>
      )}
  
        {isAuthenticated && topPeople.length > 0 && (
        <div style={{ width: '80%', marginTop: '40px' }}>
            <h3>Top Guessed People</h3>
            <Paper style={{ marginTop: '10px', overflowX: 'auto' }}>
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Known For</TableCell>
                    <TableCell>Birth Year</TableCell>
                    <TableCell>Death Year</TableCell>
                    <TableCell>Guess Count</TableCell>
                    <TableCell>Profile Picture</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {topPeople.map((person) => {
                    const info = personInfo[person.personID];
                    const knownFor = knownForTitles[person.personID];
                    return (
                    <TableRow key={person.personID}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{knownFor || 'N/A'}</TableCell>
                        <TableCell>{person.birthYear}</TableCell>
                        <TableCell>{person.deathYear || 'N/A'}</TableCell>
                        <TableCell>{person.guessCount}</TableCell>
                        <TableCell>
                        {info && (
                            <img 
                            src={`https://image.tmdb.org/t/p/w500/${info.profilePath}`} 
                            alt={`${person.name} profile`} 
                            style={{ maxWidth: '100px' }}
                            />
                        )}
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            </Paper>
        </div>
        )}
    </div>
  );
}