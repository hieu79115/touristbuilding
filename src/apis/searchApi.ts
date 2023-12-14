import axios from 'axios';

const access_token =
    'pk.eyJ1IjoiamhhbmRmIiwiYSI6ImNscTE2dWRsNjA2M2kycnBrYTkyaDNoNmUifQ.eC5QMbTMcjfgYprEUfIU7w';

const searchApi = axios.create({
    baseURL: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    params: {
        country: 'vn',
        limit: 10,
        language: 'es',
        access_token: access_token,
    },
});

export default searchApi;
