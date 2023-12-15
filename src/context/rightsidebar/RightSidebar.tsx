import React, { useContext, useEffect, useState } from 'react';
import { MapContext } from '../maps/MapContext';
import './RightSidebar.css';
import { Feature } from '../../interfaces/places';

export const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);

    const { listPlaces } = useContext(MapContext);

    useEffect(() => {
        setSelectedFeatures(listPlaces);
        // const newPlaces: Feature[] = [];
        // listPlaces.forEach((item) => {
        //     newPlaces.push(item);
        // });
        console.log(selectedFeatures);
    }, [listPlaces]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                onClick={toggleSidebar}
                className={`toggle-button ${isOpen ? 'open' : ''}`}
            >
                {isOpen ? 'Close Sidebar' : 'Open Sidebar'}
            </button>
            <div className={`right-sidebar ${isOpen ? 'open' : 'closed'}`}>
                <h3>Danh sách các địa điểm</h3>
                <div className="container">
                    <ul>
                        {selectedFeatures.map((feature) => (
                            <li key={feature.id}>{feature.text}</li>
                        ))}
                    </ul>
                </div>
                <button className="floating-button">Floating Button</button>
            </div>
        </>
    );
};

export default RightSidebar;
