//@ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import { mapboxgl } from 'mapbox-gl';
import { createContext } from 'react';
import { Feature } from '../../interfaces/places';

interface MapContextProps {
    isMapReady: boolean;
    map?: mapboxgl;
    setMap: (map: mapboxgl) => void;
    getRouteBetweenPoints: (
        start: [number, number],
        end: [number, number]
    ) => Promise<void>;
    listPlaces: Feature[];
    updateListPlaces: (newListPlaces: Feature[]) => void;
}

export const MapContext = createContext({} as MapContextProps);
