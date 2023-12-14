import axios from 'axios';

const access_token =
    'pk.eyJ1IjoiamhhbmRmIiwiYSI6ImNscTE2dWRsNjA2M2kycnBrYTkyaDNoNmUifQ.eC5QMbTMcjfgYprEUfIU7w';

const directionsApi = axios.create({
    baseURL: 'https://api.mapbox.com/directions/v5/mapbox/driving',
    params: {
        alternatives: false,
        geometries: 'geojson',
        overview: 'simplified',
        steps: false,
        access_token: access_token,
    },
});

export default directionsApi;
