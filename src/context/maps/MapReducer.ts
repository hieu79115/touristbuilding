//@ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
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
          type: 'setSelectedMarker'; // Thêm dòng này
          payload: Marker | null; // Thêm dòng này
      }
    | {
          type: 'addFeatureToSelection'; // Thêm dòng này
          payload: Feature; // Thêm dòng này
      }
    | {
          type: 'addPlaceToList'; // Thêm dòng này
          payload: Feature[]; // Thêm dòng này
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
        default:
            return state;
    }
};
