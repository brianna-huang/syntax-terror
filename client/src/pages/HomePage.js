import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const config = require('../config.json');

export default function HomePage() {
  const [curr_userID, setCurrUserID] = useState(null);
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  const [score, setScore] = useState(0);
  const [movieTitle, setMovieTitle] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [previousGuess, setPreviousGuess] = useState(null);
  const [tempGuess, setTempGuess] = useState(null);
  const [commonPeople, setCommonPeople] = useState([]);
  const [invalidGuesses, setInvalidGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [validGuesses, setValidGuesses] = useState([]);
  const [posterUrl, setPosterUrl] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [previousPosterUrl, setPreviousPosterUrl] = useState('');
  const [commonPeopleCounts, setCommonPeopleCounts] = useState({});
  const [invalidGuessReason, setInvalidGuessReason] = useState('');
  const [invalidPersonName, setInvalidPersonName] = useState('');
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hint, setHint] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isHintVisible, setIsHintVisible ] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null); 


  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`http://${config.server_host}:${config.server_port}/get_userID?userSub=${user.sub}`)
        .then(res => res.json())
        .then(resJson => setCurrUserID(resJson[0]?.userID))
        .catch(error => console.error('Error fetching user ID:', error));
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (invalidGuesses >= 3) {
      setGameOver(true);
    }
  }, [invalidGuesses]);

  useEffect(() => {
    let timerInterval;
    if (isTimerRunning) {
      timerInterval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(timerInterval);
            setGameOver(true);
            setIsTimerRunning(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (currentGuess && curr_userID) {
      // Update movie history
      const updateMovieHistory = async () => {
        try {
          const response = await fetch(`http://${config.server_host}:${config.server_port}/user_movie_history?userID=${curr_userID}&movieID=${currentGuess.movieID}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
        } catch (error) {
          console.error('Error updating user movie history:', error);
        }
      };
  
      // Update person history
      const updatePersonHistory = async () => {
        if (previousGuess) {
          try {
            const response = await fetch(`http://${config.server_host}:${config.server_port}/movie_id_two?movie_id1=${previousGuess.movieID}&movie_id2=${currentGuess.movieID}`);
            const commonPeople = await response.json();
            
            // Update person history for each common person
            for (const person of commonPeople) {
              await fetch(`http://${config.server_host}:${config.server_port}/user_person_history?userID=${curr_userID}&personID=${person.personID}`);
            }
          } catch (error) {
            console.error('Error updating user person history:', error);
          }
        }
      };
  
      updateMovieHistory();
      updatePersonHistory();
      
      // Get and set poster URL
      const fetchPosterUrl = async () => {
        try {
          const response = await fetch(`http://${config.server_host}:${config.server_port}/movie_poster?movieID=${currentGuess.movieID}`);
          const posterData = await response.json();
          // console.log(posterData)
          setPosterUrl(`https://image.tmdb.org/t/p/w500/${posterData}`);
        } catch (error) {
          console.error('Error fetching movie poster:', error);
        }
      };
  
      fetchPosterUrl();
  
      // Get and set previous guess poster URL
      if (previousGuess) {
        const fetchPreviousPosterUrl = async () => {
          try {
            const response = await fetch(`http://${config.server_host}:${config.server_port}/movie_poster?movieID=${previousGuess.movieID}`);
            const posterData = await response.json();
            setPreviousPosterUrl(`https://image.tmdb.org/t/p/w500/${posterData}`);
          } catch (error) {
            console.error('Error fetching previous movie poster:', error);
          }
        };
  
        fetchPreviousPosterUrl();
      }
    }
  }, [currentGuess, curr_userID, previousGuess]);

  useEffect(() => {
    const allGuesses = new Set(validGuesses.map((movie)=>movie.movieID))
    setScore([...allGuesses].length);
  }, [validGuesses])

  useEffect(() => {
    const updateHint = async () => {
      if (currentGuess){
        try {
          // const response = await 
          fetch(`http://${config.server_host}:${config.server_port}/hint?movieID=${currentGuess.movieID}`)
            .then(res => res.json())
            .then(resJson => setHint(resJson));
          // if (!response.ok) {
          //   throw new Error('Network response was not ok');
          // }
        } catch (error) {
          console.error('Error getting hint:', error);
        }
      }
    }
    setIsHintVisible(false);
    updateHint();
  }, [currentGuess])

  useEffect(() => { // Function to clear timeout for debouncing
    return () => {
      if (debounceTimeout) { clearTimeout(debounceTimeout); }
    };
  }, [debounceTimeout]);

  if (isLoading) {
    return <div>Loading...</div>; // Add a loading state
  }

  const handleInputChange = async (event) => {
    const title = event.target.value;
    setMovieTitle(title);

    if (debounceTimeout) { clearTimeout(debounceTimeout) }
    const timeoutId = setTimeout(async () => {
      if (title.length >= 2) {
        try {
          const response = await fetch(`http://${config.server_host}:${config.server_port}/movie_id/${title}`);
          const data = await response.json();
          setSuggestions(data);
        } catch (error) {
          console.error('Error fetching movie suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    }, 400); // Controls number of milliseconds without typing before execution
    setDebounceTimeout(timeoutId);
  };

  const handleMovieSelect = async (movie) => {
    if (gameOver || validGuesses.some(guess => guess.movieID === movie.movieID)) return; // Prevent actions if the game is over or movie has been guessed
  
    if (!currentGuess) {
      // First selection
      setCurrentGuess(movie);
      setValidGuesses([...validGuesses, movie]); // Add movie to valid guesses
      setIsTimerRunning(true); // Start the timer
    } else if (!tempGuess) {
      // Second selection
      setTempGuess(movie);
  
      try {
        const response = await fetch(`http://${config.server_host}:${config.server_port}/movie_id_two?movie_id1=${currentGuess.movieID}&movie_id2=${movie.movieID}`);
        const data = await response.json();
  
        const restrictedPerson = data.find(person => commonPeopleCounts[person.personID] >= 3);
  
        if (data.length > 0 && !restrictedPerson) {
          // Valid guess
          setValidGuesses([...validGuesses, currentGuess, movie]); // Add both currentGuess and new movie to valid guesses
          setPreviousGuess(currentGuess);
          setCurrentGuess(movie);
          setTempGuess(null);
          setCommonPeople(data);
          setInvalidGuessReason(''); // Clear invalid guess reason
          setInvalidPersonName(''); // Clear invalid person name
          setTimer(30); // Reset the timer
  
          // Update common people counts
          setCommonPeopleCounts(prevCounts => {
            const newCounts = { ...prevCounts };
            data.forEach(person => {
              if (newCounts[person.personID]) {
                newCounts[person.personID]++;
              } else {
                newCounts[person.personID] = 1;
              }
            });
            return newCounts;
          });
  
          // Update poster URL
          const posterResponse = await fetch(`http://${config.server_host}:${config.server_port}/movie_poster?movieID=${movie.movieID}`);
          const posterData = await posterResponse.json();
          setPosterUrl(`https://image.tmdb.org/t/p/w500/${posterData}`);
        } else {
          // Invalid guess
          setInvalidGuesses(prev => prev + 1);
          setTempGuess(null);
          setCommonPeople([]);
          setInvalidGuessReason(restrictedPerson ? 'A person has been used three times already.' : 'No common people.');
          setInvalidPersonName(restrictedPerson ? restrictedPerson.name : '');
        }
      } catch (error) {
        console.error('Error fetching common people:', error);
      }
    } else {
      // Subsequent selections
      setTempGuess(movie);
  
      try {
        const response = await fetch(`http://${config.server_host}:${config.server_port}/movie_id_two?movie_id1=${currentGuess.movieID}&movie_id2=${movie.movieID}`);
        const data = await response.json();
  
        const restrictedPerson = data.find(person => commonPeopleCounts[person.personID] >= 3);
  
        if (data.length > 0 && !restrictedPerson) {
          // Valid guess
          setValidGuesses([...validGuesses, movie]); // Add new movie to valid guesses
          setPreviousGuess(currentGuess);
          setCurrentGuess(movie);
          setTempGuess(null);
          setCommonPeople(data);
          setInvalidGuessReason(''); // Clear invalid guess reason
          setInvalidPersonName(''); // Clear invalid person name
          setTimer(30); // Reset the timer
  
          // Update common people counts
          setCommonPeopleCounts(prevCounts => {
            const newCounts = { ...prevCounts };
            data.forEach(person => {
              if (newCounts[person.personID]) {
                newCounts[person.personID]++;
              } else {
                newCounts[person.personID] = 1;
              }
            });
            return newCounts;
          });
  
          // Update poster URL
          const posterResponse = await fetch(`http://${config.server_host}:${config.server_port}/movie_poster?movieID=${movie.movieID}`);
          const posterData = await posterResponse.json();
          setPosterUrl(`https://image.tmdb.org/t/p/w500/${posterData}`);
        } else {
          // Invalid guess
          setInvalidGuesses(prev => prev + 1);
          setCommonPeople([]);
          setInvalidGuessReason(restrictedPerson ? 'A person has been used three times already.' : 'No common people.');
          setInvalidPersonName(restrictedPerson ? restrictedPerson.name : '');
        }
      } catch (error) {
        console.error('Error fetching common people:', error);
      }
    }
  
    setSuggestions([]);
    setMovieTitle('');
  };

  const handleRestart = () => {
    // Reset all state variables
    setGameStarted(false); // Reset game started state
    setMovieTitle('');
    setSuggestions([]);
    setCurrentGuess(null);
    setPreviousGuess(null);
    setTempGuess(null);
    setCommonPeopleCounts([])
    setCommonPeople([]);
    setInvalidGuesses(0);
    setGameOver(false);
    setValidGuesses([]); // Reset valid guesses
    setPosterUrl(''); // Reset poster URL
    setTimer(30);
  };

  const handleHint = () =>{
    if(hint.length > 0){
      setIsHintVisible(true);
      setHintsUsed(hintsUsed + 1);
    }
  };

  return (
    <div 
    style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'flex-start', 
      height: '100vh', 
      paddingTop: '20px',
      backgroundImage: 'url("/DALLE2024-07-2212.23.37.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {isAuthenticated ? (
        gameStarted ? (
          gameOver ? (
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '20px', borderRadius: '10px' }}>
              <h2>Game Over</h2>
              <h3>Final Score: {score-invalidGuesses}</h3>
              {/* <h3>Hints used: {hintsUsed}</h3> */}
              <Button variant="contained" color="primary" onClick={handleRestart}>Restart</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', width: '50%', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={handleInputChange}
                  placeholder="Type a movie title..."
                  style={{ width: '80%', padding: '10px', fontSize: '16px' }}
                />
                <div style={{ marginLeft: '10px', fontSize: '14px', lineHeight: '30px' }}>
                  <strong>Invalid Guesses:</strong> {invalidGuesses}
                </div>
                <div style={{ marginLeft: '10px', fontSize: '14px', lineHeight: '30px' }}>
                  <strong>Score:</strong> {score}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'left' }}>
                <Button variant="contained" color="primary" onClick={handleHint}>Hint</Button>
                {isHintVisible && <div style={{ marginTop: '10px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                {hint.map((person)=>person.name).join(', ')}
                </div>}
              </div>
              {suggestions.length > 0 && (
                <div style={{ marginTop: '10px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                  <ul>
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.movieID}
                        onClick={() => handleMovieSelect(suggestion)}
                        style={{
                          cursor: 'pointer',
                          color: validGuesses.some(guess => guess.movieID === suggestion.movieID) ? 'red' : 'black'
                        }}
                      >
                        {suggestion.title} ({suggestion.releaseYear})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(currentGuess || previousGuess) && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  {previousGuess && (
                    <div style={{ flex: '1', textAlign: 'left' }}>
                      <p><strong>Previous Guess:</strong> {previousGuess.title} ({previousGuess.releaseYear})</p>
                      {previousPosterUrl && (
                        <img src={previousPosterUrl} alt={previousGuess.title} style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '300px' }} />
                      )}
                    </div>
                  )}
                  
                  {commonPeople.length > 0 && (
                    <div style={{ flex: '1', textAlign: 'center' }}>
                      <h4>Common People:</h4>
                      <ul>
                        {commonPeople.map((person) => (
                          <li key={person.personID}>
                            {person.name} (Appeared {commonPeopleCounts[person.personID] || 0} times)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentGuess && (
                    <div style={{ flex: '1', textAlign: 'right' }}>
                      <p><strong>Current Guess:</strong> {currentGuess.title} ({currentGuess.releaseYear})</p>
                      {posterUrl && (
                        <img src={posterUrl} alt={currentGuess.title} style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '300px' }} />
                      )}
                    </div>
                  )}
                </div>
              )}
              {invalidGuesses > 0 && invalidGuessReason && (
                <div style={{ marginTop: '20px', color: 'red' }}>
                  <p>Invalid Guess: {invalidGuessReason}</p>
                  {invalidPersonName && <p>{invalidPersonName} has been used too many times.</p>}
                </div>
              )}
              {isTimerRunning && (
                <div style={{ position: 'fixed', top: '100px', left: '10px', fontSize: '24px', backgroundColor: 'white', padding: '5px', borderRadius: '5px' }}>
                  <p>Time Remaining: {timer} seconds</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontSize: '14px' }}>
            <h2> Rules: 
              <p>First, Enter a movie you like.</p>
              <p>For every movie entered after, there has to be at least one common cast member or director.</p>
              <p>You can only connect a movie by a specific person 3 times</p>
              <p>Use a hint if you get stuck.</p>
              <p>Try to beat your high score!</p>
              <p>Good Luck</p>
            </h2>
            <Button variant="contained" color="primary" onClick={() => setGameStarted(true)}>Click to Start Game</Button>
          </div>
        )
      ) : (
        <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
          <h2>Please <span style={{ color: 'blue', cursor: 'pointer' }} onClick={loginWithRedirect}>log in</span> to play the game.</h2>
        </div>
      )}
    </div>
  );
}