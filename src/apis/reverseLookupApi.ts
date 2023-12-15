import axios from 'axios';

const access_token =
    'pk.eyJ1IjoiamhhbmRmIiwiYSI6ImNscTE2dWRsNjA2M2kycnBrYTkyaDNoNmUifQ.eC5QMbTMcjfgYprEUfIU7w';

const reverseLookupApi = axios.create({
    baseURL: 'https://api.mapbox.com/geocoding/v5/mapbox.places/',
    params: {
        access_token: access_token,
        limit: 1,
    },
});

export default reverseLookupApi;
