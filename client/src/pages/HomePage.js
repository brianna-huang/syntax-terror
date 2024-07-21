import { useEffect, useState } from 'react';
import { Container, Divider } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const config = require('../config.json');

export default function HomePage() {
  const [guessedMovies, setGuessedMovies] = useState([]);
  const [currentMovie, setCurrentMovie] = useState('');
  const [currentPeople, setCurrentPeople] = useState([]);
  const [curr_userID, setCurrUserID] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`http://${config.server_host}:${config.server_port}/get_userID?userSub=${user.sub}`)
        .then(res => res.json())
        .then(resJson => setCurrUserID(resJson[0].userID))
        .catch(error => console.error('Error fetching user ID:', error));
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (currentMovie) {
      fetch(`http://${config.server_host}:${config.server_port}/movie_people/${currentMovie}`)
        .then(res => res.json())
        .then(resJson => setCurrentPeople(resJson))
        .catch(error => console.error('Error fetching movie people:', error));
    }
  }, [currentMovie]);

  const handleClick = () => {
    fetch(`http://${config.server_host}:${config.server_port}/movie_people/${inputValue}`)
      .then(res => res.json())
      .then(resJson => {
        setCurrentMovie(inputValue);
        setCurrentPeople(resJson);
        setGuessedMovies([...guessedMovies, inputValue]);
        setInputValue(''); // Clear input after submission
      })
      .catch(error => console.error('Error fetching movie:', error));
  };

  ///console.log('Is Authenticated:', isAuthenticated); // Debugging log
  ///console.log('User:', user); // Debugging log
  ///console.log('curr_userID:', curr_userID); // Debugging log
  
  if (isLoading) {
    return <div>Loading...</div>; // Add a loading state
  }

  return (
    <Container>
      {isAuthenticated ? (
        <>
          <Divider />
          <h3>Guess a movie to continue the chain...</h3>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter a movie name" 
          />
          <button onClick={handleClick}>Add Movie</button>
          <ul>
            {guessedMovies.map((movie, index) => (
              <li key={index}>{movie}</li>
            ))}
          </ul>
          <div id="score">Score: {guessedMovies.length}</div>
          <Divider />

          <p>Guessed movies will show up here</p>
          <p>Movie Title: {currentMovie}</p>
          <p>Actors & directors: {currentPeople.map(person => (
            <span key={person.id}>{person.name} </span>
          ))}</p>
          <p>TEST: Current User: {curr_userID}</p>
        </>
      ) : (
        <div>Please log in to see the content.</div>
      )}
    </Container>
  );
}