import React from 'react';
import { AppBar, Container, Toolbar, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
const config = require('../config.json');

// Helper component to format navigation links
function NavText({ href, text, isMain, onClick }) {
  return (
    <Typography
      variant={isMain ? 'h5' : 'h7'}
      noWrap
      sx={{
        marginRight: '30px',
        fontFamily: 'copperplate',
        fontWeight: 700,
        letterSpacing: '.3rem',
      }}
    >
      <NavLink
        to={href}
        style={{
          color: 'inherit',
          textDecoration: 'none',
        }}
        onClick={onClick}
      >
        {text}
      </NavLink>
    </Typography>
  );
}

export default function NavBar() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  //console.log('Is Authenticated:', isAuthenticated); // Debugging log
  //console.log('User:', user); // Debugging log
  //console.log('Loading:', isLoading); // Debugging log

  useEffect(() => {
    if (isAuthenticated && user) {
      // Call the /track-user endpoint
      fetch(`http://${config.server_host}:${config.server_port}/track-user?userSub=${user.sub}&username=${user.name}&email=${user.email}`)
      .then(res => res.json())
      .then(data => {
        console.log('User tracking response:', data);
      })
      .catch(error => {
        console.error('Error tracking user:', error);
      });
    }
  }, [isAuthenticated, user]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <NavText href="/" text="MOVIE CHAIN GAME" isMain />
          <NavText href="/albums" text="Game history" />
          <NavText href="/songs" text="Recommendations" />
          {!isAuthenticated && <button onClick={() => loginWithRedirect()}>Log in</button>}
          {isAuthenticated && (
            <div>
            <p>Hello, {user.name}</p>
            <button onClick={() => logout({ returnTo: window.location.origin })}>Log out</button>
            </div>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
