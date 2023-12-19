//@ts-ignore
import { Map, Marker } from 'mapbox-gl';
import { MapStateProps } from './MapProvider';
import { Feature } from '../../interfaces/places';

type MapReducerAction =
    | {
          type: 'setMap';
          payload: Map;
      }
    | {
          type: 'setMarkers';
          payload: Marker[];
      }
    | {
          type: 'setSelectedMarker';
          payload: Marker | null;
      }
    | {
          type: 'addFeatureToSelection';
          payload: Feature;
      }
    | {
          type: 'addPlaceToList';
          payload: Feature[];
      }
    | {
          type: 'setListPlaces';
          payload: Feature[];
      };

export const mapReducer = (
    state: MapStateProps,
    action: MapReducerAction
): MapStateProps => {
    switch (action.type) {
        case 'setMap':
            return { ...state, isMapReady: true, map: action.payload };
        case 'setMarkers':
            return { ...state, markers: action.payload };
        case 'addPlaceToList':
            return {
                ...state,
                listPlaces: [...state.listPlaces, ...action.payload],
            };
        case 'setListPlaces':
            return { ...state, listPlaces: action.payload };
        default:
            return state;
    }
};
