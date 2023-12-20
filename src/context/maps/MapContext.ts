//@ts-ignore
import { mapboxgl } from 'mapbox-gl';
import { createContext } from 'react';
import { Feature } from '../../interfaces/places';

interface MapContextProps {
    isMapReady: boolean;
    map?: mapboxgl;
    setMap: (map: mapboxgl) => void;
    listPlaces: Feature[];
    updateListPlaces: (newListPlaces: Feature[]) => void;
    updateAllowClick: (allowClick: boolean) => void;
}

export const MapContext = createContext({} as MapContextProps);
