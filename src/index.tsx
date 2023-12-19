/* eslint import/no-webpack-loader-syntax: off */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// @ts-ignore
import mapboxgl from '!mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
mapboxgl.accessToken =
    'pk.eyJ1IjoiamhhbmRmIiwiYSI6ImNscTE2dWRsNjA2M2kycnBrYTkyaDNoNmUifQ.eC5QMbTMcjfgYprEUfIU7w';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    throw new Error('Geolocation is not supported by your browser');
}
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
