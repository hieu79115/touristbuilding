import React, { useContext, useState } from 'react';
import { MapContext, PlacesContext } from '../context';
import { Feature } from '../interfaces/places';

export const SearchResults = () => {
    const { places, isLoadingPlaces } = useContext(PlacesContext);
    const { map } = useContext(MapContext);

    const [active, setActive] = useState('');

    const onPlaceCLick = (place: Feature) => {
        const [lng, lat] = place.center;
        setActive(place.id);
        map!.flyTo({
            zoom: 14,
            center: [lng, lat],
        });
    };

    if (isLoadingPlaces) return <LoadingPlaces />;
    if (!places.length) return <></>;

    const limitedPlaces = places.slice(0, 5);

    return (
        <ul className="list-group mt-3">
            {limitedPlaces.map((place) => (
                <li
                    key={place.id}
                    onClick={() => onPlaceCLick(place)}
                    className={`list-group-item list-group-item-action pointer ${
                        active === place.id ? 'active' : ''
                    }`}
                >
                    <h6>{place.text_es}</h6>
                    <p style={{ fontSize: 10 }}>{place.place_name}</p>
                </li>
            ))}
        </ul>
    );
};

const LoadingPlaces = () => (
    <div className="alert alert-primary mt-2">
        <h6>Searching...</h6>
        <p>Wait a moment...</p>
    </div>
);
