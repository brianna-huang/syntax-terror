import { useEffect, useState } from 'react';
import { Container, Divider, Link } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
import SongCard from '../components/SongCard';
const config = require('../config.json');

export default function HomePage() {
  const [guessedMovies, setGuessedMovies] = useState([]);
  const [currentMovie, setCurrentMovie] = useState('');
  const [currentPeople, setCurrentPeople] = useState([]);

  // function handleClick(){
  //   const movieTitle = document.getElementById("movieInput");
  //   fetch(`http://${config.server_host}:${config.server_port}/movie_id/${movieTitle}`)
  //     .then(res => res.json())
  //     .then(resJson => setCurrentMovie(resJson));
  // }

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/movie_people/${currentMovie}`)
      .then(res => res.json())
      .then(resJson => setCurrentPeople(resJson));
  }, [currentMovie]);

  // const songColumns = [
  //   {
  //     field: 'title',
  //     headerName: 'Song Title',
  //     renderCell: (row) => <Link onClick={() => setSelectedSongId(row.song_id)}>{row.title}</Link> // A Link component is used just for formatting purposes
  //   },
  //   {
  //     field: 'album',
  //     headerName: 'Album Title',
  //     renderCell: (row) => <NavLink to={`/albums/${row.album_id}`}>{row.album}</NavLink> // A NavLink component is used to create a link to the album page
  //   },
  //   {
  //     field: 'plays',
  //     headerName: 'Plays'
  //   },
  // ];

  // const albumColumns = [
  //   {
  //     field: 'album',
  //     headerName: 'Album Title',
  //     renderCell: (row) => <NavLink to={`/albums/${row.album_id}`}>{row.title}</NavLink> 
  //   },
  //   {
  //     field: 'plays',
  //     headerName: 'Plays',
  //   },
  // ]

  return (
    <Container>
      {/* {selectedSongId && <SongCard songId={selectedSongId} handleClose={() => setSelectedSongId(null)} />}
      <h2>Check out your song of the day:&nbsp;
        <Link onClick={() => setSelectedSongId(songOfTheDay.song_id)}>{songOfTheDay.title}</Link>
      </h2>
      <Divider />
      <h2>Top Songs</h2>
      <LazyTable route={`http://${config.server_host}:${config.server_port}/top_songs`} columns={songColumns} />
      <Divider />
      <h2>Top Albums</h2>
      <LazyTable route={`http://${config.server_host}:${config.server_port}/top_albums`} columns={albumColumns} defaultPageSize={5} rowsPerPageOptions={[5, 10]}/> */}
      <Divider />
      <h3>Guess a movie to continue the chain...</h3>
      <input type="text" id="movieInput" placeholder="Enter a movie name" />
      <button onClick="handleClick()">Add Movie</button>
      <ul id="moviesList"></ul>
      <div id="score">Score: 0</div>
      <Divider />

      <p>Guessed movies will show up here</p>
      <p>Movie Title: {document.getElementById("movieInput")}</p>
      <p>Movie ID: {currentMovie}</p>
      <p>Actors & directors: {currentPeople}</p>

    </Container>
  );
};