import React from 'react';
import { MapProvider, PlacesProvider } from './context';
import { HomeScreen } from './screens';

export const App = () => {
    return (
        <PlacesProvider>
            <MapProvider>
                <HomeScreen />
            </MapProvider>
        </PlacesProvider>
    );
};

export default App;
