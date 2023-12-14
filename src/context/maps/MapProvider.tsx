// Lo que guardamos en memoria
//@ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import { AnySourceData, LngLatBounds, Map, Marker, Popup } from 'mapbox-gl';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { PlacesContext } from '..';
import { directionsApi, reverseLookupApi } from '../../apis';
import { DirectionsResponse } from '../../interfaces/directions';
import { MapContext } from './MapContext';
import { mapReducer } from './MapReducer';

export interface MapStateProps {
    isMapReady: boolean;
    map?: Map;
    markers: Marker[];
}

const INITIAL_STATE: MapStateProps = {
    isMapReady: false,
    map: undefined,
    markers: [],
};

interface Props {
    children: JSX.Element | JSX.Element[];
}
let previousMarker: Marker | null = null;

export const MapProvider = ({ children }: Props) => {
    const [state, dispatch] = useReducer(mapReducer, INITIAL_STATE);
    const { places } = useContext(PlacesContext);
    const { markers, map } = state;
    // const [previousMarker, setPreviousMarker] = useState<Marker | null>(null);

    useEffect(() => {
        const newMarkers: Marker[] = [];
        for (const place of places) {
            const [lng, lat] = place.center;

            const popupContent = `
                <h6>${place.text_es}</h6>
                <p class='text-muted' style='font-size: 12px'>${place.place_name}</p>
                <button id="customButton">Click me</button>
            `;

            const popup = new Popup().setHTML(popupContent);

            const newMarker = new Marker()
                .setPopup(popup)
                .setLngLat([lng, lat])
                .addTo(map!);

            newMarkers.push(newMarker);
        }

        const customButton = document.getElementById('customButton');
        if (customButton) {
            customButton.addEventListener('click', () => {
                // Xử lý khi nút được nhấn
                console.log('Button clicked!');
            });
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

        const newMarker = new Marker()
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

        // console.log('nearbyMarker', ma);
        if (nearbyMarker) {
            // Ưu tiên marker gần
            nearbyMarker.togglePopup();
            newMarker.remove();
            previousMarker?.remove();
        } else {
            // Hiển thị popup cho marker mới
            newMarker.togglePopup();

            // Xóa marker trước đó nếu có
            if (previousMarker) {
                previousMarker.remove();
                console.log('remove');
            }

            // Lưu marker mới vào biến previousMarker
            previousMarker = newMarker;
            console.log('set', previousMarker);
        }
    };

    const clearMarkers = () => {
        markers.forEach((m) => m.remove());
    };

    useEffect(() => {
        // ...

        map?.on('click', handleClickOnMap);

        return () => {
            // Hủy đăng ký sự kiện khi component bị unmount
            map?.off('click', handleClickOnMap);
        };
    });

    const setMap = (map: Map) => {
        const myLocationPopup = new Popup({}).setHTML(`<h1>My Location</h1>`);

        new Marker({
            color: 'red',
        })
            .setLngLat(map.getCenter())
            .addTo(map)
            .setPopup(myLocationPopup);

        dispatch({
            type: 'setMap',
            payload: map,
        });
    };

    const getRouteBetweenPoints = async (
        start: [number, number],
        end: [number, number]
    ) => {
        const resp = await directionsApi.get<DirectionsResponse>(
            `/${start.join(',')};${end.join(',')}`
        );

        const { distance, duration, geometry } = resp.data.routes[0];
        const { coordinates } = geometry;

        let kms = distance / 1000;
        kms = Math.round(kms * 100);
        kms /= 100;

        const minutes = Math.floor(duration / 60);

        const bounds = new LngLatBounds(start, start);
        for (let coord of coordinates) {
            const newCoord: [number, number] = [coord[0], coord[1]];
            bounds.extend(newCoord);
        }

        console.log(kms, minutes);

        map?.fitBounds(bounds, { padding: 200 });

        const sourceData: AnySourceData = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates,
                        },
                    },
                ],
            },
        };
        const sourceId = 'route';
        if (map?.getLayer(sourceId)) {
            map.removeLayer(sourceId);
            map.removeSource(sourceId);
        }

        map?.addSource(sourceId, sourceData).addLayer({
            id: sourceId,
            type: 'line',
            source: sourceId,
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
            paint: {
                'line-color': '#3b9ddd',
                'line-width': 4,
            },
        });
    };

    return (
        <MapContext.Provider
            value={{
                ...state,
                setMap,
                getRouteBetweenPoints,
            }}
        >
            {children}
        </MapContext.Provider>
    );
};
