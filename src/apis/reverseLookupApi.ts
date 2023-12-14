import axios from 'axios';

const access_token =
    'pk.eyJ1IjoiamhhbmRmIiwiYSI6ImNscTE2dWRsNjA2M2kycnBrYTkyaDNoNmUifQ.eC5QMbTMcjfgYprEUfIU7w';

const reverseLookupApi = axios.create({
    baseURL: 'https://api.mapbox.com/search/searchbox/v1/reverse',
    params: {
        access_token: access_token,
    },
});

export default reverseLookupApi;
