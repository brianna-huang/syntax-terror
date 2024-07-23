import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Divider, Link } from '@mui/material';

const config = require('../config.json');

export default function Recommendations() {
  const [curr_userID, setCurrUserID] = useState(null);
  const [movieRecs, setMovieRecs] = useState([]);
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  
  useEffect(() => {
    if (isAuthenticated && user) {
      fetch(`http://${config.server_host}:${config.server_port}/get_userID?userSub=${user.sub}`)
        .then(res => res.json())
        .then(resJson => setCurrUserID(resJson[0]?.userID)) // Ensure resJson[0] exists
        .catch(error => console.error('Error fetching user ID:', error));
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/movie_recs`)
      .then(res => res.json())
      .then(resJson => setMovieRecs(resJson))
  }, []);

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
      height: '100vh', 
      paddingTop: '20px',
    }}>
      {isAuthenticated ? (
        <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
          <h2>Welcome, {user.name}! Recommendations</h2>
        </div>
      ) : (
        <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
          <h2>Please <span style={{ color: 'blue', cursor: 'pointer' }} onClick={loginWithRedirect}>log in</span> to play the game.</h2>
        </div>
      )}
    </div>

    <h3>Movie recommendations:</h3>
    <p>We can add a LazyTable here</p>
    <p>{movieRecs}</p>
    
    </Container>
  );
}