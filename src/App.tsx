import React from 'react';
import { MapProvider, PlacesProvider } from './context';
import { HomeScreen } from './screens';

interface AppProps {}

export const App: React.FC<AppProps> = () => {
    return (
        <PlacesProvider>
            <MapProvider>
                <HomeScreen />
            </MapProvider>
        </PlacesProvider>
    );
};
