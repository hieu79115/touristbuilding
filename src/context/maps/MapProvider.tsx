//@ts-ignore
import { Map, Marker, Popup } from 'mapbox-gl';
import React, { useContext, useEffect, useReducer } from 'react';
import { PlacesContext } from '..';
import { reverseLookupApi } from '../../apis';
import { MapContext } from './MapContext';
import { mapReducer } from './MapReducer';
import { Feature } from '../../interfaces/places';

export interface MapStateProps {
    isMapReady: boolean;
    map?: Map;
    markers: Marker[];
    listPlaces: Feature[];
}

const INITIAL_STATE: MapStateProps = {
    isMapReady: false,
    map: undefined,
    markers: [],
    listPlaces: [],
};

interface Props {
    children: JSX.Element | JSX.Element[];
}
let previousMarker: Marker | null = null;
let listPlaces: Feature[] = [];

export const MapProvider = ({ children }: Props) => {
    const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);
    const { places } = useContext(PlacesContext);
    const { markers, map } = state;

    const reverseLookup = async (latitude: number, longitude: number) => {
        console.log(latitude, longitude);
        try {
            const response = await reverseLookupApi.get(
                `/${longitude},${latitude}.json`
            );

            const newPlaces: Feature[] = response.data.features;
            console.log('List places:');
            console.log(listPlaces);
            const isDuplicate =
                listPlaces.length > 0 &&
                listPlaces[listPlaces.length - 1].center[0] ===
                    newPlaces[0].center[0] &&
                listPlaces[listPlaces.length - 1].center[1] ===
                    newPlaces[0].center[1];

            if (!isDuplicate) {
                dispatch({ type: 'addPlaceToList', payload: newPlaces });
                listPlaces = [...listPlaces, ...newPlaces];
            }

            return newPlaces;
        } catch (error) {
            console.error('Error in reverse lookup:', error);
            throw error;
        }
    };

    const updateListPlaces = (newListPlaces: Feature[]) => {
        console.log('Updating list places in MapProvider:', newListPlaces);
        listPlaces.forEach((place) => {
            markers.forEach((marker) => {
                marker.remove();
            });
        });
        listPlaces = newListPlaces;
        newListPlaces.forEach((place) => {
            const [lng, lat] = place.center;

            const newMarker = new Marker({ color: 'gray' })
                .setLngLat([lng, lat])
                .addTo(map!);

            markers.push(newMarker);
        });
        dispatch({ type: 'setListPlaces', payload: newListPlaces });
    };

    useEffect(() => {
        if (listPlaces.length > 0) {
            listPlaces.forEach((element) => {
                const [lng, lat] = element.center;

                const newMarker = new Marker({ color: 'gray' })
                    .setLngLat([lng, lat])
                    .addTo(map!);

                markers.push(newMarker);
            });
        }
    });

    useEffect(() => {
        const newMarkers: Marker[] = [];
        for (const place of places) {
            const [lng, lat] = place.center;

            const popupContent = `
                <h6>${place.text_es}</h6>
                <p class='text-muted' style='font-size: 12px'>${place.place_name}</p>
                <button id="customButton">Add</button>
            `;

            const popup = new Popup().setHTML(popupContent);

            const newMarker = new Marker()
                .setPopup(popup)
                .setLngLat([lng, lat])
                .addTo(map!);

            newMarkers.push(newMarker);
        }

        clearMarkers();

        dispatch({ type: 'setMarkers', payload: newMarkers });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [places]);

    const handleClickOnMap = (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;

        const popupContent = `
                <h6>Custom Marker</h6>
                <p>Lat: ${lat}, Lng: ${lng}</p>
                <button id="customButton">Click me</button>
            `;

        const popup = new Popup().setHTML(popupContent);

        let newMarker = new Marker()
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map!);

        // Kiểm tra xem có marker nào ở gần không
        const nearbyMarker = markers.find((m) => {
            const newMarkerLngLat = newMarker.getLngLat();
            const mLngLat = m.getLngLat();

            // Đặt ngưỡng sai số chấp nhận được (đơn vị độ)
            const threshold = 0.005;

            const isCloseEnough =
                Math.abs(newMarkerLngLat.lng - mLngLat.lng) < threshold &&
                Math.abs(newMarkerLngLat.lat - mLngLat.lat) < threshold;

            return isCloseEnough;
        });

        if (nearbyMarker) {
            // Ưu tiên marker gần
            nearbyMarker.togglePopup();
            newMarker.remove();
            previousMarker?.remove();
            newMarker = nearbyMarker;
        } else {
            newMarker.togglePopup();

            if (previousMarker) {
                previousMarker.remove();
            }

            previousMarker = newMarker;
            console.log('Marker added!');
            console.log(newMarker.getLngLat());
        }

        const customButton = document.getElementById('customButton');
        if (customButton) {
            customButton.addEventListener('click', () => {
                const lng = newMarker.getLngLat().lng;
                const lat = newMarker.getLngLat().lat;
                reverseLookup(lat, lng);
            });
        }
    };

    const clearMarkers = () => {
        markers.forEach((m) => m.remove());
    };

    useEffect(() => {
        map?.on('click', handleClickOnMap);

        return () => {
            map?.off('click', handleClickOnMap);
        };
    });

    const setMap = (map: Map) => {
        // const myLocationPopup = new Popup({}).setHTML(`<h1>My Location</h1>`);

        new Marker({
            color: 'red',
        })
            .setLngLat(map.getCenter())
            .addTo(map);
        // .setPopup(myLocationPopup);

        dispatch({
            type: 'setMap',
            payload: map,
        });
    };

    return (
        <MapContext.Provider
            value={{
                ...state,
                setMap,
                updateListPlaces,
            }}
        >
            {children}
        </MapContext.Provider>
    );
};
