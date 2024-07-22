import { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Modal } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { NavLink } from 'react-router-dom';
import React from 'react';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';

import { formatDuration } from '../helpers/formatter';
const config = require('../config.json');

// SongCard is a modal (a common example of a modal is a dialog window).
// Typically, modals will conditionally appear (specified by the Modal's open property)
// but in our implementation whether the Modal is open is handled by the parent component
// (see HomePage.js for example), since it depends on the state (selectedSongId) of the parent
export default function MovieCard({ movie, onClose }) {
  return (
    <Card style={{ maxWidth: 345, margin: '20px auto' }}>
      {movie.posterPath && (
        <CardMedia
          component="img"
          height="500"
          image={`https://image.tmdb.org/t/p/w500/${movie.posterPath}`}
          alt={`${movie.title} poster`}
        />
      )}
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {movie.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {movie.releaseYear}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {movie.runtimeMinutes} minutes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rating: {movie.rating}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {movie.overview}
        </Typography>
        <Button onClick={onClose} variant="contained" color="primary" style={{ marginTop: '10px' }}>
          Close
        </Button>
      </CardContent>
    </Card>
  );
}
