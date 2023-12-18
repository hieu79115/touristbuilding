import React, { useContext, useEffect, useState } from 'react';
import { MapContext } from '../maps/MapContext';
import './RightSidebar.css';
import { Feature } from '../../interfaces/places';

export const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
    const { updateListPlaces } = useContext(MapContext);

    const { listPlaces } = useContext(MapContext);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (
        e: React.DragEvent<HTMLUListElement>,
        index: number
    ) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    };

    const handleDragOver = (
        e: React.DragEvent<HTMLUListElement>,
        index: number
    ) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
        if (draggedIndex !== null && draggedIndex !== index) {
            const newListPlaces = Array.from(listPlaces);
            const [draggedItem] = newListPlaces.splice(draggedIndex, 1);
            newListPlaces.splice(index, 0, draggedItem);
            if (draggedIndex !== index) {
                updateListPlaces(newListPlaces);
                setDraggedIndex(index);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLUListElement>) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e: React.DragEvent<HTMLUListElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        setDraggedIndex(null);
    };

    useEffect(() => {
        setSelectedFeatures(listPlaces);
        console.log('List places:');
        console.log(selectedFeatures);
    }, [listPlaces]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        console.log('List seleted Features:');
        console.log(selectedFeatures.length);
    }, [selectedFeatures.length]);

    const handleDeleteButtonClick = (index: number) => {
        const newListPlaces = selectedFeatures.filter((_, i) => i !== index);
        setSelectedFeatures(newListPlaces.slice());
        updateListPlaces(newListPlaces);
        console.log(`Deleting feature with ID: ${index}`);
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
                    {selectedFeatures.map((feature, index) => (
                        <ul
                            className="list-item"
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <li key={feature.id}>{feature.text}</li>
                            <li className="detele">
                                <button
                                    className="delete-button"
                                    onClick={() =>
                                        handleDeleteButtonClick(index)
                                    }
                                >
                                    <img
                                        width="10"
                                        height="10"
                                        src="https://img.icons8.com/ios/50/delete-sign--v1.png"
                                        alt="delete-sign--v1"
                                    />
                                </button>
                            </li>
                        </ul>
                    ))}
                </div>
                <button className="floating-button">Floating Button</button>
            </div>
        </>
    );
};
